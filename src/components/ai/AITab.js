import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';

const AITab = () => {
  const [inputText, setInputText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);
    setAiResponse('');
    try {
      const response = await fetch('/api/ai-chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ inputText })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit');
      }
      const data = await response.json();
      setInputText('');
      setSuccess(true);
      setAiResponse(data.response || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 500, margin: '2rem auto' }}>
      <Typography variant="h6" gutterBottom>AI Chat</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Enter your message"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          disabled={submitting}
        />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={!inputText.trim() || submitting}
          >
            Submit
          </Button>
        </Box>
        {success && <Typography color="success.main" sx={{ mt: 2 }}>Submitted!</Typography>}
        {error && <Typography color="error.main" sx={{ mt: 2 }}>{error}</Typography>}
      </form>
      {aiResponse && (
        <Box sx={{ mt: 3, p: 2, border: '1px solid #1976d2', borderRadius: 2, background: '#f7faff' }}>
          <Typography variant="subtitle2" color="primary">AI Response:</Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{aiResponse}</Typography>
        </Box>
      )}
    </Paper>
  );
};

export default AITab;
