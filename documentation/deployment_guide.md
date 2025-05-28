# Deployment Guide

## User Task Management System (with Soft-Delete)

### Prerequisites
- Node.js and npm installed
- .env file in `server/` with required secrets (see example)

### Setup
1. Install dependencies:
   - `npm install` in both root and `server/`
2. Start the server:
   - `cd server && npm start`
3. Start the client:
   - `npm start` in project root

### Environment Variables
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: For Google OAuth
- `JWT_SECRET`: For signing tokens
- `PORT`: Server port (default 3001)
- `FIREBASE_PROJECT_ID`: Firestore project ID
- `FIREBASE_CLIENT_EMAIL`: Firestore client email
- `FIREBASE_PRIVATE_KEY`: Firestore private key (be sure to escape newlines properly)

### Authentication Note
- JWT-based authentication is used. All frontend API requests to protected endpoints must include the JWT in the `Authorization` header as a Bearer token.

### Firestore Setup
Ensure a `tasks` collection exists in Firestore. Each task document must have the following fields:
- `completionDate`: timestamp (set automatically when a task is completed; null otherwise)
- `deletionDate`: timestamp (set automatically when a task is deleted; null otherwise)
The backend API sets these fields as appropriate, and the frontend expects them for display in Completed/Deleted Tasks views.

### Notes
- Each task now includes 'notes' (free-form text) and 'updates' (array of update entries, auto-appended on edit), persisted in Firestore.
- Tasks can have status 'active', 'completed', or 'deleted'.
- The API supports:
  - GET /api/tasks (active tasks)
  - GET /api/tasks/completed (completed tasks)
  - GET /api/tasks/deleted (deleted/soft-deleted tasks)
  - PATCH /api/tasks/:id/complete (mark as completed)
  - PATCH /api/tasks/:id/restore (restore soft-deleted)
- For production, set environment variables securely
