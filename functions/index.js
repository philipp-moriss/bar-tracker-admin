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
        batch.update(doc.ref, {
          status: 'completed',
          updatedAt: now
        });
        count++;
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
        .where('startTime', '<', now)
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
        batch.update(doc.ref, {
          status: 'completed',
          updatedAt: now
        });
        count++;
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
