const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { oauth2Client } = require('../config/google');
const { verifyToken } = require('./auth');

// Get upcoming meetings
router.get('/upcoming', verifyToken, async (req, res) => {
  try {
    const { accessToken } = req.user;
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const { start, end } = req.query;

    console.log('Fetching calendar events:', { start, end });

    if (!start || !end) {
      console.error('Missing date range:', req.query);
      return res.status(400).json({ error: 'Missing start or end date' });
    }

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: start,
      timeMax: end,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500  // Increased to handle more events
    });

    console.log(`Found ${response.data.items.length} events`);
    res.json(response.data.items);
  } catch (error) {
    console.error('Calendar API error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get meeting details
router.get('/event/:eventId', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { accessToken } = req.user;
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.events.get({
      calendarId: 'primary',
      eventId: eventId
    });

    res.json(response.data);
  } catch (error) {
    console.error('Get meeting details error:', error);
    res.status(500).json({ error: 'Failed to get meeting details' });
  }
});

// Watch for meeting end events
router.post('/watch', verifyToken, async (req, res) => {
  try {
    const { accessToken } = req.user;
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.events.watch({
      calendarId: 'primary',
      requestBody: {
        id: `watch-${Date.now()}`,
        type: 'web_hook',
        address: `${process.env.SERVER_URL}/api/calendar/notification`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Watch calendar error:', error);
    res.status(500).json({ error: 'Failed to watch calendar' });
  }
});

// Handle calendar notifications
router.post('/notification', async (req, res) => {
  try {
    const { headers, body } = req;
    console.log('Calendar notification received:', {
      channelId: headers['x-goog-channel-id'],
      resourceId: headers['x-goog-resource-id'],
      messageNumber: headers['x-goog-message-number'],
      state: headers['x-goog-resource-state']
    });

    // Handle the notification based on the resource state
    if (headers['x-goog-resource-state'] === 'exists') {
      // Meeting ended, notify client through WebSocket
      // Implementation will be added when we set up WebSocket
    }

    res.status(200).end();
  } catch (error) {
    console.error('Calendar notification error:', error);
    res.status(500).end();
  }
});

module.exports = router;
