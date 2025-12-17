const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// CORS middleware
const cors = require('cors')({origin: true});

// Auto-complete past events - runs daily at midnight
exports.autoCompleteEvents = functions.pubsub.schedule('0 0 * * *')
  .timeZone('Europe/London')
  .onRun(async (context) => {
    try {
      const db = admin.firestore();
      const now = admin.firestore.Timestamp.now();
      
      // Find all active events
      const eventsRef = db.collection('events');
      const snapshot = await eventsRef
        .where('status', '==', 'active')
        .get();
      
      if (snapshot.empty) {
        console.log('No past active events to complete');
        return null;
      }
      
      const batch = db.batch();
      let count = 0;
      
      snapshot.forEach((doc) => {
        const eventData = doc.data();
        const eventStartTime = eventData.startTime.toDate();
        
        // Умная логика определения времени окончания по времени начала
        const hour = eventStartTime.getHours();
        let defaultDuration = 3; // по умолчанию 3 часа
        
        if (hour >= 18 && hour <= 22) defaultDuration = 4; // вечерние события (18:00-22:00) = 4 часа
        if (hour >= 10 && hour <= 17) defaultDuration = 3; // дневные события (10:00-17:00) = 3 часа  
        if (hour >= 23 || hour <= 6) defaultDuration = 6;  // ночные события = 6 часов
        
        let eventEndTime;
        if (eventData.route?.totalDuration) {
          eventEndTime = new Date(eventStartTime.getTime() + eventData.route.totalDuration * 60 * 1000);
        } else {
          eventEndTime = new Date(eventStartTime.getTime() + defaultDuration * 60 * 60 * 1000);
        }
        
        // Событие завершено, если время окончания прошло
        if (eventEndTime < now.toDate()) {
          batch.update(doc.ref, {
            status: 'completed',
            updatedAt: now
          });
          count++;
        }
      });
      
      await batch.commit();
      console.log(`Auto-completed ${count} past events`);
      
      return null;
    } catch (error) {
      console.error('Error auto-completing events:', error);
      return null;
    }
  });

// Manual trigger to complete past events (can be called from admin panel)
exports.completeExpiredEvents = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
      }

      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const db = admin.firestore();
      const now = admin.firestore.Timestamp.now();
      
      const eventsRef = db.collection('events');
      const snapshot = await eventsRef
        .where('status', '==', 'active')
        .get();
      
      if (snapshot.empty) {
        res.status(200).json({ 
          data: { 
            success: true, 
            count: 0,
            message: 'No past active events to complete' 
          }
        });
        return;
      }
      
      const batch = db.batch();
      let count = 0;
      
      snapshot.forEach((doc) => {
        const eventData = doc.data();
        const eventStartTime = eventData.startTime.toDate();
        
        // Умная логика определения времени окончания по времени начала
        const hour = eventStartTime.getHours();
        let defaultDuration = 3; // по умолчанию 3 часа
        
        if (hour >= 18 && hour <= 22) defaultDuration = 4; // вечерние события (18:00-22:00) = 4 часа
        if (hour >= 10 && hour <= 17) defaultDuration = 3; // дневные события (10:00-17:00) = 3 часа  
        if (hour >= 23 || hour <= 6) defaultDuration = 6;  // ночные события = 6 часов
        
        let eventEndTime;
        if (eventData.route?.totalDuration) {
          eventEndTime = new Date(eventStartTime.getTime() + eventData.route.totalDuration * 60 * 1000);
        } else {
          eventEndTime = new Date(eventStartTime.getTime() + defaultDuration * 60 * 60 * 1000);
        }
        
        // Событие завершено, если время окончания прошло
        if (eventEndTime < now.toDate()) {
          batch.update(doc.ref, {
            status: 'completed',
            updatedAt: now
          });
          count++;
        }
      });
      
      await batch.commit();
      
      res.status(200).json({ 
        data: { 
          success: true, 
          count: count,
          message: `Auto-completed ${count} past events` 
        }
      });
      
    } catch (error) {
      console.error('Error completing expired events:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

exports.sendTestPush = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // Handle preflight request
      if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
      }

      // Only allow POST requests
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      // Firebase Functions callable format
      const { data } = req.body;
      const { title, body, audienceUserIds, mapUrl } = data || {};

      if (!title || !body || !audienceUserIds || !Array.isArray(audienceUserIds)) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Here you would implement your push notification logic
      // For now, just return a success response
      const sent = audienceUserIds.length;
      
      res.status(200).json({ 
        data: {
          success: true, 
          sent: sent,
          message: `Test push sent to ${sent} users`
        }
      });

    } catch (error) {
      console.error('Error in sendTestPush:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Geocode address to coordinates using Google Geocoding API
exports.geocodeAddress = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // Handle preflight request
      if (req.method === 'OPTIONS') {
        res.status(200).send('');
        return;
      }

      // Only allow POST requests
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const { data } = req.body;
      const { address, city, country, name } = data || {};

      if (!address || !city || !country) {
        res.status(400).json({ 
          error: 'Missing required fields: address, city, country' 
        });
        return;
      }

      // Получаем API ключ из переменных окружения
      // В Firebase Functions можно установить через: firebase functions:config:set geocoding.api_key="YOUR_KEY"
      const apiKey = functions.config().geocoding?.api_key || process.env.GOOGLE_GEOCODING_API_KEY;
      
      if (!apiKey) {
        console.error('Google Geocoding API key is not configured');
        res.status(500).json({ 
          error: 'Geocoding service is not configured. Please set GOOGLE_GEOCODING_API_KEY environment variable.' 
        });
        return;
      }

      // Формируем полный адрес для геокодирования
      const fullAddress = `${address}, ${city}, ${country}`;
      const encodedAddress = encodeURIComponent(fullAddress);
      
      // Сначала пробуем Places API (если есть название заведения)
      let placesResults = [];
      if (name && name.trim()) {
        try {
          const placesQuery = encodeURIComponent(`${name} ${fullAddress}`);
          const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${placesQuery}&key=${apiKey}`;
          const placesResponse = await fetch(placesUrl);
          const placesResult = await placesResponse.json();
          
          if (placesResult.status === 'OK' && placesResult.results && placesResult.results.length > 0) {
            placesResults = placesResult.results.slice(0, 5).map(place => ({
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
              formattedAddress: place.formatted_address,
              placeId: place.place_id,
              name: place.name,
              source: 'places'
            }));
          }
        } catch (placesError) {
          console.log('Places API error (falling back to Geocoding):', placesError);
        }
      }
      
      // Вызываем Google Geocoding API для получения нескольких вариантов
      const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
      
      // Используем встроенный fetch (Node 18+)
      const response = await fetch(geocodingUrl);
      const result = await response.json();

      // Детальное логирование для отладки
      console.log('Geocoding request:', {
        address: fullAddress,
        url: geocodingUrl.replace(apiKey, '***HIDDEN***'),
        status: result.status,
        error_message: result.error_message,
        error_message_details: result.error_message || 'No error message'
      });

      // Формируем список вариантов из Geocoding API
      let geocodingResults = [];
      if (result.status === 'OK' && result.results && result.results.length > 0) {
        geocodingResults = result.results.slice(0, 5).map(geoResult => ({
          latitude: geoResult.geometry.location.lat,
          longitude: geoResult.geometry.location.lng,
          formattedAddress: geoResult.formatted_address,
          placeId: geoResult.place_id,
          name: null,
          source: 'geocoding'
        }));
      }
      
      // Объединяем результаты: сначала Places API, потом Geocoding
      const allResults = [...placesResults, ...geocodingResults];
      
      // Убираем дубликаты (по координатам)
      const uniqueResults = [];
      const seen = new Set();
      for (const item of allResults) {
        const key = `${item.latitude.toFixed(6)},${item.longitude.toFixed(6)}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueResults.push(item);
        }
      }
      
      if (uniqueResults.length > 0) {
        // Если только один вариант - возвращаем его сразу
        if (uniqueResults.length === 1) {
          res.status(200).json({
            data: {
              success: true,
              latitude: uniqueResults[0].latitude,
              longitude: uniqueResults[0].longitude,
              formattedAddress: uniqueResults[0].formattedAddress,
              placeId: uniqueResults[0].placeId,
              multipleResults: false
            }
          });
        } else {
          // Если несколько вариантов - возвращаем список
          res.status(200).json({
            data: {
              success: true,
              multipleResults: true,
              results: uniqueResults,
              // Для обратной совместимости возвращаем первый вариант
              latitude: uniqueResults[0].latitude,
              longitude: uniqueResults[0].longitude,
              formattedAddress: uniqueResults[0].formattedAddress,
              placeId: uniqueResults[0].placeId
            }
          });
        }
      } else if (result.status === 'ZERO_RESULTS') {
        res.status(404).json({
          error: 'Address not found',
          message: 'Could not find coordinates for the provided address'
        });
      } else if (result.status === 'REQUEST_DENIED') {
        // Детальная ошибка для случая, когда API ключ не авторизован
        const errorDetails = result.error_message || 'API key is not authorized';
        console.error('Geocoding API REQUEST_DENIED:', {
          error_message: errorDetails,
          possible_causes: [
            'Geocoding API is not enabled for this project',
            'API key does not have Geocoding API in its restrictions',
            'API key has application restrictions that block this request'
          ]
        });
        res.status(403).json({
          error: 'API key authorization failed',
          message: errorDetails,
          hint: 'Please check: 1) Geocoding API is enabled in Google Cloud Console, 2) API key has Geocoding API in its restrictions, 3) API key application restrictions allow server-side usage'
        });
      } else {
        console.error('Geocoding API error:', result.status, result.error_message);
        res.status(500).json({
          error: 'Geocoding failed',
          message: result.error_message || 'Unknown error occurred',
          status: result.status
        });
      }

    } catch (error) {
      console.error('Error in geocodeAddress:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});
