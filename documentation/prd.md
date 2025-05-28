# Product Requirements Document (PRD)

## User Task Management System (with Soft-Delete)

### Objective
Transition from notes attached to calendar events to a user-centric task management system. Each task is standalone and includes Title, Description, DueDate, and Status (active/deleted).

### Requirements

### AI Tab Feature
- Add a new tab labeled "AI" on the right side of the main navigation.
- The AI tab contains:
  - A single text input field.
  - A Submit button, which is disabled until the field has text.
  - When Submit is pressed, the input is sent to the backend.
- Backend stores each submission in a new Firestore collection called `AI_chats` with the following fields:
  - `user_id`: The ID or email of the user submitting the input.
  - `inputText`: The text entered by the user.
  - `createdAt`: Timestamp when the record is created.
  - `updated_at`: Timestamp when the record is last updated (initially same as createdAt).
- Users can view, add, edit, complete, and soft-delete tasks.
- Soft-deleted tasks are accessible in a separate "Deleted Tasks" tab.
- Completed tasks are accessible in a separate "Completed Tasks" tab.
- Completed tasks display a "Completion Date" field in the UI.
- Deleted tasks display a "Deletion Date" field in the UI.
- All UI changes must be reflected in the documentation.
- The system must allow users to create, view, update, soft-delete (status = 'deleted'), complete (status = 'completed'), and restore tasks.
- Each task must belong to an authenticated user, and users must only be able to access their own tasks.
- Tasks must be stored in Firestore for persistence.
- All CRUD operations must be performed via secure backend APIs.
- The backend must enforce that only the authenticated user's tasks are accessible.
- Tasks must have the following fields: `userId`, `title`, `description`, `dueDate`, `status`, `createdAt`, `updatedAt`, `notes`, `updates`, `completionDate`, `deletionDate`.
  - `notes`: Free-form text field for user notes about the task.
  - `updates`: Array of update entries (e.g., `{ timestamp, user, updateText }`) automatically appended when a task is edited.
- Tasks must support soft-delete (status = 'deleted'), completion (status = 'completed'), and restoration.
- The default view must show only tasks with status 'active'.
- There must be separate views for 'completed' and 'deleted' tasks.
- Users must be able to mark a task as 'completed' (not just delete).
- Logging and error handling must be robust and configurable.
- Documentation must be kept in sync with code changes.

### Security and Authentication
- All API endpoints require user authentication.
- Tokens are stored in local storage and must be sent in the `Authorization` header as a Bearer token for all authenticated API requests (e.g., `Authorization: Bearer <JWT>`).
- The frontend must include this header in all fetch calls to protected endpoints (such as `/api/tasks`).
- The use of `credentials: 'include'` is not required, and cookies are not used for authentication in this system.

7. Update all documentation to reflect these changes.
