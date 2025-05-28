import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  Typography,
  Alert,
} from '@mui/material';
import { api } from '../../utils/api';
import { useSelector } from 'react-redux';

const USER_ROLES = {
  REGULAR: 'REGULAR',
  ADMIN: 'ADMIN',
  OWNER: 'OWNER'
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const currentUser = useSelector(state => state.auth.user);
  const isOwner = currentUser?.role === USER_ROLES.OWNER;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    }
  };

  const handleRoleChange = async (email, newRole) => {
    try {
      await api.put(`/admin/users/${email}/role`, { role: newRole });
      fetchUsers(); // Refresh the list
      setError(null);
    } catch (err) {
      setError('Failed to update user role');
      console.error('Error updating user role:', err);
    }
  };

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Current Role</TableCell>
              {isOwner && <TableCell>Change Role</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.email}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                {isOwner && (
                  <TableCell>
                    <Select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.email, e.target.value)}
                      disabled={user.email === 'amitamit@gmail.com'}
                    >
                      {Object.values(USER_ROLES).map((role) => (
                        <MenuItem key={role} value={role}>
                          {role}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UserManagement;
