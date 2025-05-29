import React from 'react';
import { Button, Container, Typography, Box } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

const Login = () => {
  const handleGoogleLogin = async () => {
    try {
      // Determine the API base URL based on the environment
      let API_BASE;
      if (process.env.NODE_ENV === 'production') {
        API_BASE = 'https://team-tasks-server.onrender.com';
      } else {
        API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
      }
      console.log(`Using API base URL: ${API_BASE}`);
      
      // For production environment, redirect directly to Google OAuth
      if (process.env.NODE_ENV === 'production') {
        // Redirect directly to Google OAuth on the server
        window.location.href = `${API_BASE}/api/auth/google/login-redirect`;
        return;
      }
      
      // For development, use the standard approach
      const response = await fetch(`${API_BASE}/api/auth/google/url`, {
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors',
        credentials: 'include'
      });
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <Typography component="h1" variant="h4">
          Meeting Notes App
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Sign in to start managing your meeting notes
        </Typography>
        <Button
          variant="contained"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          size="large"
        >
          Sign in with Google
        </Button>
      </Box>
    </Container>
  );
};

export default Login;
