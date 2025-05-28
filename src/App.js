import React, { useState, useEffect } from 'react';
import aiclubLogo from './aiclub_logo.png';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from './redux/slices/authSlice';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';

// Components
import Login from './components/auth/Login';
import AuthCallback from './components/auth/AuthCallback';
import TaskList from './components/tasks/TaskList';
import DeletedTasks from './components/tasks/DeletedTasks';
import CompletedTasks from './components/tasks/CompletedTasks';
import UserManagement from './components/admin/UserManagement';
import Navigation from './components/common/Navigation';

// Services
import WebSocketService from './services/websocket';

// Theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const isOwner = user?.role === 'OWNER';

  useEffect(() => {
    const checkExistingToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('/api/auth/verify', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();
          if (data.success) {
            dispatch(setUser(data.user));
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          localStorage.removeItem('token');
        }
      }
      setInitialCheckDone(true);
    };

    checkExistingToken();
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      WebSocketService.connect();
    }
    return () => WebSocketService.disconnect();
  }, [isAuthenticated]);

  if (loading || !initialCheckDone) {
    return null; // or a loading spinner
  }

  return (
    <>
      {/* AIClub Logo Header */}
      <div style={{ background: 'white', padding: '8px 0 8px 16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee' }}>
        <img src={aiclubLogo} alt="AIClub Logo" style={{ height: 40, marginRight: 16 }} />
      </div>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route
              path="/login"
              element={!isAuthenticated ? <Login /> : <Navigate to="/tasks" />}
            />
            <Route path="/auth/google/callback" element={<AuthCallback />} />
            <Route
              path="/tasks"
              element={
                isAuthenticated ? (
                  <Box>
                    <Navigation />
                    <Box sx={{ p: 3 }}>
                      <TaskList />
                    </Box>
                  </Box>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/tasks/completed"
              element={
                isAuthenticated ? (
                  <Box>
                    <Navigation />
                    <Box sx={{ p: 3 }}>
                      <CompletedTasks />
                    </Box>
                  </Box>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/tasks/deleted"
              element={
                isAuthenticated ? (
                  <Box>
                    <Navigation />
                    <Box sx={{ p: 3 }}>
                      <DeletedTasks />
                    </Box>
                  </Box>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            {isOwner && (
              <Route
                path="/admin/users"
                element={
                  isAuthenticated ? (
                    <Box>
                      <Navigation />
                      <Box sx={{ p: 3 }}>
                        <UserManagement />
                      </Box>
                    </Box>
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
            )}
            <Route path="/" element={<Navigate to="/tasks" />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </>
  );
}

export default App;
