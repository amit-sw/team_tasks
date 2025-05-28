import jwt from 'jsonwebtoken';
import { oauth2Client } from '../config/google.js';

const refreshAccessToken = async (refreshToken) => {
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials.access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
};

// Helper to check if a JWT token is expired or about to expire
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;
    
    // Check if token expires in less than 5 minutes
    const expiryTime = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    return currentTime + fiveMinutes >= expiryTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

// Create a new JWT with refreshed access token
const createNewToken = (oldToken, newAccessToken) => {
  try {
    const decoded = jwt.decode(oldToken);
    return jwt.sign(
      {
        ...decoded,
        accessToken: newAccessToken
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  } catch (error) {
    console.error('Error creating new token:', error);
    throw error;
  }
};

export {
  refreshAccessToken,
  isTokenExpired,
  createNewToken
};
