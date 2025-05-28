const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { oauth2Client, getAuthUrl } = require('../config/google');
const { admin, db, getUserCollectionPath } = require('../config/firebase');
const jwt = require('jsonwebtoken');
const { USER_ROLES, getUserRole, initializeOwner } = require('../models/userRoles');

const { refreshAccessToken, isTokenExpired, createNewToken } = require('../utils/tokenRefresh');

// Verify JWT middleware with token refresh
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // First verify the token is valid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Check if token is about to expire
    if (isTokenExpired(token) && decoded.refreshToken) {
      try {
        console.log('Refreshing access token...');
        const newAccessToken = await refreshAccessToken(decoded.refreshToken);
        const newToken = createNewToken(token, newAccessToken);
        
        // Update the request with new token data
        req.user = jwt.decode(newToken);
        
        // Send the new token in the response headers
        res.set('X-New-Token', newToken);
        console.log('Access token refreshed successfully');
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        // Continue with the old token if refresh fails
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get Google OAuth URL
router.get('/google/url', (req, res) => {
  console.log('Generating OAuth URL...');
  const url = getAuthUrl();
  console.log('Generated OAuth URL:', url);
  res.json({ url });
});

// Google OAuth callback
router.get('/google/callback', async (req, res) => {
  if (!req.query.code) {
    return res.status(400).json({ 
      error: 'Authentication failed',
      details: 'No authorization code provided',
      type: 'missing_code'
    });
  }
  console.log('Received callback with code:', req.query.code);
  const { code } = req.query;
  
  try {
    // Get tokens from Google
    console.log('Attempting to exchange code for tokens with config:', {
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      code: code.substring(0, 10) + '...' // Only log first 10 chars for security
    });
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Received tokens from Google');
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    // Skip Firebase Auth which is having issues and use JWT directly
    // This still gives us authentication while we debug Firebase Auth issues
    console.log('Using JWT-only authentication for user:', data.email);
    const useFirebase = false;
    
    // Skip any Firestore operations since we've detected the Firestore database hasn't been created
    console.log('Skipping Firestore operations - database not initialized');
    console.log('→ To enable Firestore, create a database instance in the Firebase console');
    console.log('→ App will continue with JWT authentication only');
    
    // Store user data in memory as a temporary fallback
    // This will be lost when the server restarts, but allows basic functionality
    if (!global.userStore) {
      global.userStore = new Map();
    }
    
    // Store or update user data in memory
    global.userStore.set(data.email, {
      email: data.email,
      name: data.name,
      picture: data.picture,
      lastLogin: new Date().toISOString()
    });
    
    console.log(`Stored user data in memory for: ${data.email}`);
    console.log(`Active users in memory store: ${global.userStore.size}`);
    
    // Log a hint about how many users are stored
    const userEmails = Array.from(global.userStore.keys()).join(', ');
    console.log(`User emails in memory: ${userEmails}`);
    
    // Since we're using memory storage as a fallback, we should let the user know
    console.log('WARNING: Using in-memory user storage - data will be lost on server restart');
    console.log('Create a Firestore database in the Firebase console for persistent storage');

    // Get or create user role
    console.log('Getting user role for:', data.email);
    const userRole = await getUserRole(data.email);
    console.log('User role retrieved:', userRole);

    // Create JWT
    console.log('Creating JWT token for user with role:', userRole);
    const tokenData = { 
      email: data.email,
      name: data.name,
      picture: data.picture,
      role: userRole,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token
    };
    console.log('Token data (excluding tokens):', { ...tokenData, accessToken: '[REDACTED]', refreshToken: '[REDACTED]' });
    
    const token = jwt.sign(
      tokenData,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Initialize owner if this is the owner's first login
    if (data.email === 'amitamit@gmail.com') {
      console.log('Initializing owner role for amitamit@gmail.com');
      await initializeOwner();
      console.log('Owner role initialization completed');
    }

    // Instead of returning JSON directly, redirect to the React app with the token
    // This ensures the client-side router handles the authentication properly
    const userParam = encodeURIComponent(JSON.stringify({
      email: data.email,
      name: data.name,
      picture: data.picture
    }));
    
    const redirectUrl = `http://localhost:3000/auth/google/callback?token=${encodeURIComponent(token)}&user=${userParam}`;
    console.log('Redirecting to React app dashboard');
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Auth error:', error);
    const errorMessage = error.response?.data?.error_description || error.message || 'Authentication failed';
    res.status(500).json({ 
      error: 'Authentication failed',
      details: errorMessage,
      type: error.response?.data?.error || 'unknown'
    });
  }
});

// Verify token endpoint
router.get('/verify', verifyToken, (req, res) => {
  res.json({
    success: true,
    user: {
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture
    }
  });
});



module.exports = { router, verifyToken };
