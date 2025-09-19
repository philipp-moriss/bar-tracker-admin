const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// CORS middleware
const cors = require('cors')({origin: true});

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
