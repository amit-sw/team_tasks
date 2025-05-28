import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import notesReducer from './slices/notesSlice';
import calendarReducer from './slices/calendarSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notes: notesReducer,
    calendar: calendarReducer,
  },
});
