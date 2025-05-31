import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';

const TaskForm = ({ task, onClose }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.substring(0, 10) : '');
  const [notes, setNotes] = useState(task?.notes || '');
  const [updateText, setUpdateText] = useState('');
  const isEdit = !!task;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { title, description, dueDate, notes };
    if (isEdit && updateText) payload.updateText = updateText;
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `/api/tasks/${task.id}` : '/api/tasks';
    console.log(`${isEdit ? 'Updating' : 'Creating'} task`, url, payload);
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload),
      });
      console.log(`${isEdit ? 'Update' : 'Create'} task response status:`, response.status);
    } catch (err) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} task:`, err);
    }
    onClose(true);
  };

  return (
    <Dialog open onClose={() => onClose(false)}>
      <DialogTitle>{isEdit ? 'Edit Task' : 'Add Task'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            margin="dense"
            label="Title"
            type="text"
            fullWidth
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Due Date"
            type="date"
            fullWidth
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="dense"
            label="Notes"
            type="text"
            fullWidth
            value={notes}
            onChange={e => setNotes(e.target.value)}
            multiline
            minRows={2}
          />
          {isEdit && (
            <TextField
              margin="dense"
              label="Update (changelog/comment)"
              type="text"
              fullWidth
              value={updateText}
              onChange={e => setUpdateText(e.target.value)}
              multiline
              minRows={2}
              helperText="Describe what changed in this update (optional, will be tracked in Updates history)"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose(false)}>Cancel</Button>
          <Button type="submit" variant="contained">{isEdit ? 'Save' : 'Add'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TaskForm;
