import React from 'react';
import { Button, Container, Typography, Box } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

const Login = () => {
  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/google/url', {
        headers: {
          'Accept': 'application/json'
        }
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
