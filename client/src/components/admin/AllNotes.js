import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { api } from '../../utils/api';

const AllNotes = () => {
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await api.get('/admin/notes');
      setNotes(response);
      setError(null);
    } catch (err) {
      setError('Failed to fetch notes');
      console.error('Error fetching notes:', err);
    }
  };

  const handleEditClick = (note) => {
    setSelectedNote(note);
    setEditContent(note.content);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      await api.put(`/admin/notes/${selectedNote.id}`, {
        content: editContent,
        path: selectedNote.path
      });
      setEditDialogOpen(false);
      fetchNotes(); // Refresh the list
      setError(null);
    } catch (err) {
      setError('Failed to update note');
      console.error('Error updating note:', err);
    }
  };

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        All Notes
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Event ID</TableCell>
              <TableCell>Content</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notes.map((note) => {
              const updatedAt = note.updatedAt ? new Date(note.updatedAt) : null;
              const formattedDate = updatedAt && !isNaN(updatedAt)
                ? updatedAt.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Unknown';

              return (
                <TableRow key={note.id}>
                  <TableCell>{note.userEmail || 'Unknown User'}</TableCell>
                  <TableCell>{note.eventId || 'No Event'}</TableCell>
                  <TableCell>
                    {note.content
                      ? note.content.length > 50
                        ? `${note.content.substring(0, 50)}...`
                        : note.content
                      : 'No content'}
                  </TableCell>
                  <TableCell>{formattedDate}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEditClick(note)}>
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Note</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={10}
            fullWidth
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AllNotes;
