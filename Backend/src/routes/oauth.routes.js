import { Router } from 'express';
import { getAuthUrl, getToken } from '../services/calendar.service.js';

const router = Router();

// In a real application, you'd protect this route and store the token securely (e.g. in DB)
// For demonstration, we might just log it or store it in memory/env.
let clinicRefreshToken = null; 

router.get('/google/connect', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('No code provided');
  }

  try {
    const tokens = await getToken(code);
    console.log('Received tokens:', tokens);
    
    // Store refresh token
    if (tokens.refresh_token) {
      clinicRefreshToken = tokens.refresh_token;
      // TODO: Save this securely to the database linked to the clinic/admin account
      console.log('Refresh token saved:', clinicRefreshToken);
    }
    
    res.send('Google Calendar connected successfully! You can close this window.');
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.status(500).send('Error connecting to Google Calendar');
  }
});

export default router;
