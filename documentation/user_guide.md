# User Guide

## User Task Management System (with Soft-Delete)

## Using the Task Management System
- Log in with your Google account to access your tasks.
- All actions on tasks (create, view, edit, delete, restore) require authentication.
- All your tasks are now securely and persistently stored in Google Firestore, and accessible from any device after login.
- The system uses JWT-based authentication. Your token is securely stored in your browser and is automatically sent in the `Authorization` header for all requests.
- Cookies are not used for authentication and `credentials: 'include'` is not required.

### Creating Tasks
- Use the "Add Task" button or menu to create a new task.
- Fill in Title (required), Description, DueDate, and Notes (optional).

### Viewing Tasks
- The main view shows all your active tasks at the '/tasks' route (previously '/dashboard', now deprecated).
- The main view shows only your active tasks.
- To see completed tasks, use the "Completed Tasks" menu option.
- To see archived tasks, use the "Archived Tasks" menu option.

### Editing Tasks
- Click on a task in the list to edit Title, Description, DueDate, or Notes.
- Every time you edit a task, you can add an "Update" note. All updates are tracked in the task's Updates history.

### Viewing Completed Tasks
Navigate to the "Completed Tasks" tab to see all tasks you have marked as completed. The table shows a "Completion Date" column for each completed task. Completed tasks are hidden from the main view but can be accessed in the "Completed Tasks" menu.

### Viewing Archived Tasks
Navigate to the "Archived Tasks" tab to see all tasks you have soft-deleted. The table shows a "Deletion Date" column for each deleted task.

### Completing & Deleting Tasks
- Click the complete icon/button to mark a task as completed. 
- Click the delete icon/button to soft-delete a task (it will disappear from the main list but is not permanently deleted).
- To view or restore archived tasks, go to the "Archived Tasks" menu.

### Power User API Endpoints
- GET /api/tasks: List active tasks
- GET /api/tasks/completed: List completed tasks
- GET /api/tasks/deleted: List archived tasks
- PATCH /api/tasks/:id/complete: Mark a task as completed
- PATCH /api/tasks/:id/restore: Restore a deleted task

### Security
- Only you can see and manage your tasks after signing in.
