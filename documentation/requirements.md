# Requirements Document

## User Task Management System (with Soft-Delete)

### Objective
Replace the calendar-attached notes system with a standalone user task management system, where each user can manage their own tasks. Each task includes a Title, Description, DueDate, and can be soft-deleted.

### Functional Requirements
- Users can create, view, edit, and soft-delete tasks (Title, Description, DueDate, Status).
- Soft-deleted tasks are hidden from the main view but accessible in a separate "Deleted Tasks" view.
- Tasks are private to each user.
- All actions require authentication.

### Non-Functional Requirements
- Responsive and accessible UI.
- Clear error handling and logging.
- Documentation kept in sync with code changes.
