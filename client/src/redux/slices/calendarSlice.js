import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchUpcomingMeetings = createAsyncThunk(
  'calendar/fetchUpcomingMeetings',
  async ({ start, end }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString()
      });
      const response = await fetch(`/api/calendar/upcoming?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch meetings');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const watchCalendar = createAsyncThunk(
  'calendar/watchCalendar',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/calendar/watch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to watch calendar');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  meetings: [],
  loading: false,
  error: null,
  currentMeeting: null,
  watchStatus: null,
};

export const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setCurrentMeeting: (state, action) => {
      state.currentMeeting = action.payload;
    },
    clearCurrentMeeting: (state) => {
      state.currentMeeting = null;
    },
    updateWatchStatus: (state, action) => {
      state.watchStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUpcomingMeetings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUpcomingMeetings.fulfilled, (state, action) => {
        state.loading = false;
        state.meetings = action.payload;
        state.error = null;
      })
      .addCase(fetchUpcomingMeetings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(watchCalendar.fulfilled, (state, action) => {
        state.watchStatus = action.payload;
      });
  },
});

export const { setCurrentMeeting, clearCurrentMeeting, updateWatchStatus } =
  calendarSlice.actions;

export default calendarSlice.reducer;
