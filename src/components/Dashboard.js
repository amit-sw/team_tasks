import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  IconButton,
} from '@mui/material';
import { NotificationsOutlined } from '@mui/icons-material';
import { fetchNotes } from '../redux/slices/notesSlice';
import { fetchUpcomingMeetings } from '../redux/slices/calendarSlice';
import NotesIcon from './notes/NotesIcon';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notes } = useSelector((state) => state.notes);
  const { meetings } = useSelector((state) => state.calendar);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);

  useEffect(() => {
    dispatch(fetchNotes());
    // Initial fetch for current month
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    dispatch(fetchUpcomingMeetings({ start, end }));
  }, [dispatch]);

  useEffect(() => {
    // Update recent notes when notes change
    const sortedNotes = [...notes].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    ).slice(0, 5);
    setRecentNotes(sortedNotes);
  }, [notes]);

  const handleEventClick = (info) => {
    const meeting = meetings.find(m => m.id === info.event.id);
    const note = notes.find(n => n.eventId === info.event.id);
    setSelectedEvent({ ...meeting, note });
  };

  const handleEditNote = (eventId) => {
    navigate(`/notes/${eventId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCalendarEvents = () => {
    return meetings.map(meeting => ({
      id: meeting.id,
      title: meeting.summary,
      start: meeting.start.dateTime,
      end: meeting.end.dateTime,
      extendedProps: {
        hasNotes: notes.some(note => note.eventId === meeting.id)
      }
    }));
  };

  const renderEventContent = (eventInfo) => {
    return (
      <>
        <div>{eventInfo.event.title}</div>
        {eventInfo.event.extendedProps.hasNotes && <NotesIcon />}
      </>
    );
  };

  return (
    <>
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box sx={{ position: 'relative', mb: 4 }}>
          <IconButton
            color="primary"
            onClick={(e) => setNotificationsAnchor(e.currentTarget)}
            sx={{ position: 'absolute', right: 0, top: 0 }}
          >
            <NotificationsOutlined />
          </IconButton>

          <Menu
            anchorEl={notificationsAnchor}
            open={Boolean(notificationsAnchor)}
            onClose={() => setNotificationsAnchor(null)}
            PaperProps={{
              sx: { width: 350 }
            }}
          >
            <MenuItem disabled>
              <Typography variant="subtitle1">Recent Notes</Typography>
            </MenuItem>
            {recentNotes.map((note) => (
              <MenuItem 
                key={note.id}
                onClick={() => {
                  const meeting = meetings.find(m => m.eventId === note.eventId);
                  setSelectedEvent({ ...meeting, note });
                  setNotificationsAnchor(null);
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box>
                    <Typography variant="subtitle2" noWrap>
                      {note.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatNotificationDate(note.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Menu>
        </Box>

        <Box sx={{ height: 'calc(100vh - 200px)' }}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={getCalendarEvents()}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            height="100%"
          />
        </Box>
      </Container>

      <Dialog
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedEvent && (
          <>
            <DialogTitle>
              <Typography variant="h6" gutterBottom>
                {selectedEvent.summary}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {formatDate(selectedEvent.start.dateTime)} - {formatDate(selectedEvent.end.dateTime)}
              </Typography>
            </DialogTitle>
            <DialogContent>
              {selectedEvent.note ? (
                <>
                  <Typography variant="body1" gutterBottom>
                    {selectedEvent.note.content}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                    Created by {selectedEvent.note.createdBy} on {formatDate(selectedEvent.note.createdAt)}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => handleEditNote(selectedEvent.id)}
                    sx={{ mt: 2 }}
                  >
                    Edit Note
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => navigate(`/notes/new?eventId=${selectedEvent.id}`)}
                >
                  Add Note
                </Button>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
};

export default Dashboard;
