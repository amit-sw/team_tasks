import { db, admin } from '../config/firebase.js';

/**
 * Lists all tasks for a given user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of task objects.
 */
async function listTasks(userId) {
  if (!userId) {
    throw new Error('User ID is required to list tasks.');
  }
  try {
    const tasksSnapshot = await db.collection('tasks').where('userId', '==', userId).get();
    if (tasksSnapshot.empty) {
      return [];
    }
    const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return tasks;
  } catch (error) {
    console.error('Error listing tasks:', error);
    throw new Error('Failed to list tasks. Details: ' + error.message);
  }
}

/**
 * Adds a new task for a given user.
 * @param {string} userId - The ID of the user.
 * @param {string} taskDataString - A JSON string representing the task data.
 * @returns {Promise<Object>} A promise that resolves to the newly created task object.
 */
async function addTask(userId, taskDataString) {
  if (!userId || !taskDataString) {
    throw new Error('User ID and task data are required to add a task.');
  }
  let taskData;
  try {
    taskData = JSON.parse(taskDataString);
  } catch (error) {
    console.error('Error parsing taskData JSON:', error);
    throw new Error('Invalid task data format. Expected a JSON string. Details: ' + error.message);
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const newTask = {
    ...taskData,
    userId,
    status: taskData.status || 'active', // Default status to 'active'
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await db.collection('tasks').add(newTask);
    return { id: docRef.id, ...newTask }; // Note: createdAt/updatedAt will be server timestamps
  } catch (error) {
    console.error('Error adding task to Firestore:', error);
    throw new Error('Failed to add task. Details: ' + error.message);
  }
}

/**
 * Updates an existing task for a given user.
 * @param {string} userId - The ID of the user.
 * @param {string} taskId - The ID of the task to update.
 * @param {string} updateDataString - A JSON string representing the data to update.
 * @returns {Promise<Object|String>} A promise that resolves to the updated task data or a success message.
 */
async function updateTask(userId, taskId, updateDataString) {
  if (!userId || !taskId || !updateDataString) {
    throw new Error('User ID, Task ID, and update data are required to update a task.');
  }

  let updateData;
  try {
    updateData = JSON.parse(updateDataString);
  } catch (error) {
    console.error('Error parsing updateData JSON:', error);
    throw new Error('Invalid update data format. Expected a JSON string. Details: ' + error.message);
  }

  // Cannot update userId, createdAt, or id with this function
  if (updateData.userId || updateData.createdAt || updateData.id) {
    throw new Error('Cannot update userId, createdAt, or id fields.');
  }

  const taskRef = db.collection('tasks').doc(taskId);

  try {
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists) {
      throw new Error('Task not found.');
    }

    const task = taskDoc.data();
    if (task.userId !== userId) {
      throw new Error('User is not authorized to update this task.');
    }

    const dataToUpdate = {
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await taskRef.update(dataToUpdate);
    // Return the updated document data
    const updatedDoc = await taskRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  } catch (error) {
    console.error('Error updating task in Firestore:', error);
    // Re-throw specific errors or a generic one
    if (error.message === 'Task not found.' || error.message === 'User is not authorized to update this task.' || error.message === 'Cannot update userId, createdAt, or id fields.') {
      throw error;
    }
    throw new Error('Failed to update task. Details: ' + error.message);
  }
}

export { listTasks, addTask, updateTask };