import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import TaskForm from './TaskForm';

function formatDate(dateValue) {
  if (!dateValue) return '';
  // Firestore Timestamp object from REST/serialized
  if (typeof dateValue === 'object') {
    if (typeof dateValue._seconds === 'number') {
      return new Date(dateValue._seconds * 1000).toLocaleDateString();
    }
    if (typeof dateValue.seconds === 'number') {
      return new Date(dateValue.seconds * 1000).toLocaleDateString();
    }
  }
  // ISO string or number
  const d = new Date(dateValue);
  return isNaN(d) ? '' : d.toLocaleDateString();
}

const TaskList = ({ showDeleted = false, showCompleted = false }) => {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [updatesDialogOpen, setUpdatesDialogOpen] = useState(false);
  const [updatesToShow, setUpdatesToShow] = useState([]);

  useEffect(() => {
    let url = '/api/tasks';
    if (showDeleted) url = '/api/tasks/deleted';
    else if (showCompleted) url = '/api/tasks/completed';
    console.log('Fetching tasks:', url);
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        console.log('Fetch tasks response status:', res.status);
        return res.json();
      })
      .then(setTasks)
      .catch(err => console.error('Error fetching tasks:', err));
  }, [showDeleted]);

  const handleDelete = (id) => {
    const url = `/api/tasks/${id}`;
console.log('Deleting task:', url);
fetch(url, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
  .then(res => {
    console.log('Delete task response status:', res.status);
    setTasks(tasks => tasks.filter(t => t.id !== id));
  })
  .catch(err => console.error('Error deleting task:', err));
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleFormClose = (updated) => {
    setShowForm(false);
    setEditingTask(null);
    if (updated) {
      const url = `/api/tasks${showDeleted ? '/deleted' : ''}`;
console.log('Refreshing tasks after form close:', url);
fetch(url, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
  .then(res => {
    console.log('Refresh tasks response status:', res.status);
    return res.json();
  })
  .then(setTasks)
  .catch(err => console.error('Error refreshing tasks:', err));
    }
  };

  // Show updates dialog
  const handleShowUpdates = (updates) => {
    setUpdatesToShow(updates);
    setUpdatesDialogOpen(true);
  };

  // Mark task as completed
  const handleComplete = async (id) => {
    const url = `/api/tasks/${id}/complete`;
    console.log('Completing task:', url);
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Complete task response status:', response.status);
      // Refresh tasks
      setTasks(tasks => tasks.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error marking task as completed:', err);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">
          {showDeleted ? 'Archived Tasks' : showCompleted ? 'Completed Tasks' : 'Active Tasks'}
        </Typography>
        {!showDeleted && !showCompleted && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
            Add Task
          </Button>
        )}
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Due Date</TableCell>
              {showCompleted && <TableCell>Completion Date</TableCell>}
              {showDeleted && <TableCell>Deletion Date</TableCell>}
              <TableCell>Notes</TableCell>
              <TableCell>Updates</TableCell>
              {!showDeleted && !showCompleted && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(tasks) ? (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>{task.description}</TableCell>
                  <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}</TableCell>
                  {showCompleted && (
                    <TableCell>{(() => { console.log('completionDate for task', task.id, task.completionDate, typeof task.completionDate); return formatDate(task.completionDate); })()}</TableCell>
                  )}
                  {showDeleted && (
                    <TableCell>{formatDate(task.deletionDate)}</TableCell>
                  )}
                  <TableCell>{task.notes || ''}</TableCell>
                  <TableCell>
                    {Array.isArray(task.updates) && task.updates.length > 0 ? (
                      <Button size="small" onClick={() => handleShowUpdates(task.updates)}>View</Button>
                    ) : '—'}
                  </TableCell>
                  {!showDeleted && !showCompleted && (
                    <TableCell>
                      <IconButton onClick={() => handleEdit(task)}><EditIcon /></IconButton>
                      <IconButton onClick={() => handleDelete(task.id)}><DeleteIcon /></IconButton>
                      <Button size="small" onClick={() => handleComplete(task.id)} style={{marginLeft: 4}}>Complete</Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={showDeleted ? 3 : 4}>
                  {tasks && tasks.error ? `Error: ${tasks.error}` : 'No tasks found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {showForm && (
        <TaskForm task={editingTask} onClose={handleFormClose} />
      )}
      {/* Updates Dialog */}
      {updatesDialogOpen && (
        <Box
          sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', bgcolor: 'rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setUpdatesDialogOpen(false)}
        >
          <Paper sx={{ minWidth: 350, maxWidth: 500, p: 2 }} onClick={e => e.stopPropagation()}>
            <Typography variant="h6" gutterBottom>Task Updates</Typography>
            {updatesToShow.length === 0 ? (
              <Typography>No updates found.</Typography>
            ) : (
              <Box>
                {updatesToShow.map((u, idx) => (
                  <Box key={idx} sx={{ mb: 2, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                    <Typography variant="body2" color="textSecondary">{u.timestamp} — {u.user}</Typography>
                    <Typography variant="body1">{u.updateText}</Typography>
                  </Box>
                ))}
              </Box>
            )}
            <Button onClick={() => setUpdatesDialogOpen(false)} variant="contained" sx={{ mt: 2 }}>Close</Button>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default TaskList;
