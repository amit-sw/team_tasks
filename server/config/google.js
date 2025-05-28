import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

// Debug log OAuth configuration
console.log('OAuth Configuration:', {
  clientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
  redirectUri: process.env.GOOGLE_REDIRECT_URI
});

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

const getAuthUrl = () => {
  console.log('Generating auth URL with scopes:', scopes);
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
};

export {
  oauth2Client,
  getAuthUrl
};
