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

### Memory Management
- The server is configured to use up to 4GB of memory (--max-old-space-size=4096)
- If you encounter "JavaScript heap out of memory" errors, you may need to:
  - Increase the memory limit further in package.json scripts
  - Optimize memory-intensive operations in your code
  - Consider adding memory monitoring and garbage collection calls

### Authentication Note
- JWT-based authentication is used. All frontend API requests to protected endpoints must include the JWT in the `Authorization` header as a Bearer token.

### Firestore Setup

### AI Tab (AI_chats Collection)
- Ensure Firestore has a collection named `AI_chats`.
- Each document will include: `user_id`, `inputText`, `createdAt`, `updated_at`.

### Backend API
- The backend must expose a POST endpoint at `/api/ai-chats`.
- Endpoint requires JWT authentication and writes to `AI_chats`.
- After saving the user input, the backend fetches the latest `AI_prompts` record (where `prompt_name` = "AI_Tasks" and `status` = "Active"), calls OpenAI via Langchain, and saves/returns the response in the same `AI_chats` record and to the user.

### Frontend
- The `/ai` route is available and shows the AI tab with a text input and submit button.
- Button is disabled until text is entered.
- On submit, the input is sent to the backend with the user's JWT.
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

### CORS Configuration
- The server is configured to allow cross-origin requests from specific origins:
  - `http://localhost:3000` (for local development)
  - `https://team-tasks-client.onrender.com` (for production)
- If you deploy the client to a different domain, update the CORS configuration in `server/index.js`
- CORS is configured with credentials support enabled and specific headers allowed
