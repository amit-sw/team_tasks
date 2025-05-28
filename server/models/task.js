// models/task.js
const { v4: uuidv4 } = require('uuid');

class Task {
  constructor({ id, userId, title, description = '', dueDate = null, status = 'active', createdAt = null, updatedAt = null }) {
    this.id = id || uuidv4();
    this.userId = userId;
    this.title = title;
    this.description = description;
    this.dueDate = dueDate;
    this.status = status;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }
}

module.exports = Task;
