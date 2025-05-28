import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tooltip
} from '@mui/material';
import {
  NoteAlt as NoteIcon,
  NoteAdd as AddNoteIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const NotesIcon = ({ eventId, userEmail, existingNote }) => {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingNote) {
      setNote(existingNote.content);
      setVersions(existingNote.versions || []);
    }
  }, [existingNote]);

  const handleOpen = async () => {
    setOpen(true);
    if (existingNote) {
      try {
        const response = await fetch(`/api/notes/${eventId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setNote(data.note.content);
          setVersions(data.note.versions || []);
        }
      } catch (error) {
        console.error('Error fetching note details:', error);
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const endpoint = existingNote ? `/api/notes/${eventId}` : '/api/notes';
      const method = existingNote ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          eventId,
          content: note,
          userEmail
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (data.note.versions) {
          setVersions(data.note.versions);
        }
        handleClose();
      }
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderVersionHistory = () => {
    if (!versions.length) return null;

    return (
      <Paper variant="outlined" sx={{ mt: 2, maxHeight: 200, overflow: 'auto' }}>
        <List dense>
          <ListItem>
            <ListItemText 
              primary={<Typography variant="subtitle2">Version History</Typography>}
            />
          </ListItem>
          {versions.map((version, index) => (
            <ListItem key={index} divider>
              <ListItemText
                primary={version.content}
                secondary={`${version.timestamp ? format(new Date(version.timestamp), 'MMM d, yyyy h:mm a') : 'No date'} by ${version.editor}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  };

  return (
    <>
      <Tooltip title={existingNote ? "View/Edit Notes" : "Add Notes"}>
        <IconButton onClick={handleOpen} size="small">
          {existingNote ? <NoteIcon color="primary" /> : <AddNoteIcon />}
        </IconButton>
      </Tooltip>

      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {existingNote ? "Edit Meeting Notes" : "Add Meeting Notes"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Notes"
            fullWidth
            multiline
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            variant="outlined"
          />
          {renderVersionHistory()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="primary"
            disabled={loading || !note.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotesIcon;
