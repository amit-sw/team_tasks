import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { AccountCircle, Logout as LogoutIcon } from '@mui/icons-material';

const Navigation = () => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER';
  const isOwner = user?.role === 'OWNER';

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar position="static">
      <Toolbar>
        
        
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
  <Button
    component={Link}
    to="/tasks"
    color="inherit"
    sx={{
      backgroundColor: isActive('/tasks') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
    }}
  >
    Active Tasks
  </Button>
  <Button
    component={Link}
    to="/tasks/completed"
    color="inherit"
    sx={{
      backgroundColor: isActive('/tasks/completed') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
    }}
  >
    Completed Tasks
  </Button>
  <Button
    component={Link}
    to="/tasks/deleted"
    color="inherit"
    sx={{
      backgroundColor: isActive('/tasks/deleted') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
    }}
  >
    Archived Tasks
  </Button>
</Box>

        <Box>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem disabled>
              <Typography variant="body2">{user?.email}</Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
