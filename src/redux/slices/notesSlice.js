import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchNotes = createAsyncThunk(
  'notes/fetchNotes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/notes', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch notes');
      const data = await response.json();
      return data.notes || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchNoteByEventId = createAsyncThunk(
  'notes/fetchNoteByEventId',
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/notes/${eventId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch note');
      const data = await response.json();
      return data.note;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createOrUpdateNote = createAsyncThunk(
  'notes/createOrUpdateNote',
  async ({ eventId, content }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/notes/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create/update note');
      }
      const data = await response.json();
      return { ...data.note, eventId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateNote = createAsyncThunk(
  'notes/updateNote',
  async ({ eventId, content }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/notes/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update note');
      }
      const data = await response.json();
      return { ...data.note, eventId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  notes: [],
  loading: false,
  error: null,
  currentNote: null,
};

export const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    setCurrentNote: (state, action) => {
      state.currentNote = action.payload;
    },
    clearCurrentNote: (state) => {
      state.currentNote = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.notes = action.payload;
        state.error = null;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createOrUpdateNote.fulfilled, (state, action) => {
        const index = state.notes.findIndex((note) => note.eventId === action.payload.eventId);
        if (index !== -1) {
          state.notes[index] = action.payload;
        } else {
          state.notes.unshift(action.payload);
        }
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        const index = state.notes.findIndex((note) => note.eventId === action.payload.eventId);
        if (index !== -1) {
          state.notes[index] = action.payload;
        }
      })
      .addCase(fetchNoteByEventId.fulfilled, (state, action) => {
        const index = state.notes.findIndex((note) => note.eventId === action.payload.eventId);
        if (index !== -1) {
          state.notes[index] = action.payload;
        } else {
          state.notes.push(action.payload);
        }
        state.currentNote = action.payload;
      });
  },
});

export const { setCurrentNote, clearCurrentNote } = notesSlice.actions;

export default notesSlice.reducer;
