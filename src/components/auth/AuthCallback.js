import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { CircularProgress, Container } from '@mui/material';
import { setUser } from '../../redux/slices/authSlice';

const AuthCallback = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    let isHandlingCallback = false;
    const handleCallback = async () => {
      if (isHandlingCallback) return;
      isHandlingCallback = true;
      
      try {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check for direct token in URL (new method)
        const token = urlParams.get('token');
        const userString = urlParams.get('user');
        
        if (token && userString) {
          // Process direct token from redirected authentication
          console.log('Received direct token from authentication redirect');
          
          try {
            console.log('Processing authentication callback');
            const user = JSON.parse(decodeURIComponent(userString));
            console.log('Decoded user string:', user);
            
            // Store the token in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('authMethod', 'jwt-only');
            
            // Decode the JWT to get the role
            console.log('Decoding JWT token');
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            console.log('Decoded token data:', { ...tokenData, accessToken: '[REDACTED]', refreshToken: '[REDACTED]' });
            
            // Update Redux store with user data including role
            const userData = {
              ...user,
              role: tokenData.role
            };
            console.log('Dispatching user data to Redux:', userData);
            dispatch(setUser(userData));
            
            console.log('Authentication successful, redirecting to dashboard');
            navigate('/tasks');
            return;
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
          }
        }
        
        // Fallback to original method
        const code = urlParams.get('code');
        
        if (code) {
          console.log('Received code, exchanging for token');
          try {
            const response = await fetch(`http://localhost:3001/api/auth/google/callback?code=${code}`, {
              credentials: 'include',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });
            
            // This should no longer happen as we now redirect from the server
            // but keeping as fallback
            const data = await response.json();
            console.log('Received auth response:', JSON.stringify(data, null, 2));

            if (data.success && data.token && data.user) {
              // Store auth method for debugging purposes
              if (data.authMethod) {
                localStorage.setItem('authMethod', data.authMethod);
                console.log(`Authenticated using ${data.authMethod} method`);
              }
              
              localStorage.setItem('token', data.token);
              dispatch(setUser(data.user));
              navigate('/tasks');
            } else {
              // More detailed error handling
              if (data.error) {
                console.error('Auth Error:', {
                  error: data.error,
                  details: data.details,
                  type: data.type
                });
              } else {
                console.error('Unexpected response format:', data);
              }
              
              alert('Authentication failed. Please try again.');
              console.error('Auth failed, redirecting to login');
              setTimeout(() => navigate('/login'), 1000);
            }
          } catch (error) {
            console.error('Auth code exchange error:', error);
            navigate('/login');
          }
        } else {
          console.log('No code or token found, redirecting to login');
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth callback main error:', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [dispatch, navigate]);

  return (
    <Container
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
      }}
    >
      <CircularProgress />
      <p style={{ marginTop: '20px', fontFamily: 'Arial, sans-serif' }}>Authenticating, please wait...</p>
    </Container>
  );
};

export default AuthCallback;
