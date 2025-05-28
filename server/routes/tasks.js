// routes/tasks.js
const express = require('express');
const router = express.Router();
const Task = require('../models/task');

// Firestore setup
const { db, admin } = require('../config/firebase');

// Middleware to require authentication (placeholder)
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log('[requireAuth] Authorization header:', authHeader);
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    console.log('[requireAuth] Extracted token:', token);
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      console.log('[requireAuth] Decoded user:', decoded);
    } catch (err) {
      console.error('[requireAuth] JWT verification failed:', err.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
  if (!req.user || (!req.user.id && !req.user.email)) {
    console.error('[requireAuth] No valid user id or email in token');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Get all active tasks for the user
router.get('/', requireAuth, async (req, res) => {
  try {
    console.log('[tasks.js][GET /api/tasks] Authenticated user:', req.user);
    const userKey = req.user.email || req.user.id;
    const snapshot = await db.collection('tasks')
      .where('userId', '==', userKey)
      .where('status', '==', 'active')
      .orderBy('updatedAt', 'desc')
      .get();
    const userTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(userTasks);
  } catch (err) {
    console.error('[tasks.js][GET /api/tasks] Error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Get all deleted (soft-deleted) tasks for the user
router.get('/deleted', requireAuth, async (req, res) => {
  try {
    console.log('[tasks.js][GET /api/tasks/deleted] Authenticated user:', req.user);
    const userKey = req.user.email || req.user.id;
    const snapshot = await db.collection('tasks')
      .where('userId', '==', userKey)
      .where('status', '==', 'deleted')
      .orderBy('updatedAt', 'desc')
      .get();
    const deletedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(deletedTasks);
  } catch (err) {
    console.error('[tasks.js][GET /api/tasks/deleted] Error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Get all completed tasks for the user
router.get('/completed', requireAuth, async (req, res) => {
  try {
    console.log('[tasks.js][GET /api/tasks/completed] Authenticated user:', req.user);
    const userKey = req.user.email || req.user.id;
    const snapshot = await db.collection('tasks')
      .where('userId', '==', userKey)
      .where('status', '==', 'completed')
      .orderBy('updatedAt', 'desc')
      .get();
    const completedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(completedTasks);
  } catch (err) {
    console.error('[tasks.js][GET /api/tasks/completed] Error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Create a new task
router.post('/', requireAuth, async (req, res) => {
  try {
    console.log('[tasks.js][POST /api/tasks] Authenticated user:', req.user, 'Payload:', req.body);
    const { title, description, dueDate, notes } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const now = admin.firestore.FieldValue.serverTimestamp();
    const userKey = req.user.email || req.user.id;
    const taskData = {
      userId: userKey,
      title,
      description: description || '',
      dueDate: dueDate || null,
      status: 'active',
      notes: notes || '',
      updates: [],
      createdAt: now,
      updatedAt: now,
      completionDate: null,
      deletionDate: null
    }
    const docRef = await db.collection('tasks').add(taskData);
    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('[tasks.js][POST /api/tasks] Error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Update a task (add update entry and support notes)
router.put('/:taskId', requireAuth, async (req, res) => {
  try {
    console.log(`[tasks.js][PUT /api/tasks/${req.params.taskId}] Authenticated user:`, req.user, 'Payload:', req.body);
    const { taskId } = req.params;
    const docRef = db.collection('tasks').doc(taskId);
    const doc = await docRef.get();
    const userKey = req.user.email || req.user.id;
    if (!doc.exists || doc.data().userId !== userKey) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const { title, description, dueDate, notes, updateText } = req.body;
    const updatesToApply = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    if (title !== undefined) updatesToApply.title = title;
    if (description !== undefined) updatesToApply.description = description;
    if (dueDate !== undefined) updatesToApply.dueDate = dueDate;
    if (notes !== undefined) updatesToApply.notes = notes;

    // Append to updates array if updateText is provided
    if (updateText) {
      const updateEntry = {
        timestamp: new Date().toISOString(),
        user: req.user.email || req.user.id,
        updateText
      };
      const prevUpdates = doc.data().updates || [];
      updatesToApply.updates = [...prevUpdates, updateEntry];
    }
    await docRef.update(updatesToApply);
    const updatedDoc = await docRef.get();
    res.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (err) {
    console.error(`[tasks.js][PUT /api/tasks/${req.params.taskId}] Error:`, err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Soft-delete a task
router.delete('/:taskId', requireAuth, async (req, res) => {
  try {
    console.log(`[tasks.js][DELETE /api/tasks/${req.params.taskId}] Authenticated user:`, req.user);
    const { taskId } = req.params;
    const docRef = db.collection('tasks').doc(taskId);
    const doc = await docRef.get();
    const userKey = req.user.email || req.user.id;
    if (!doc.exists || doc.data().userId !== userKey) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const serverTime = admin.firestore.FieldValue.serverTimestamp();
    await docRef.update({ status: 'deleted', updatedAt: serverTime, deletionDate: serverTime });
    // Wait for Firestore to materialize serverTimestamp
    await new Promise(resolve => setTimeout(resolve, 300));
    const updatedDoc = await docRef.get();
    res.json({ message: 'Task soft-deleted', task: { id: updatedDoc.id, ...updatedDoc.data() } });
  } catch (err) {
    console.error(`[tasks.js][DELETE /api/tasks/${req.params.taskId}] Error:`, err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Mark a task as completed
router.patch('/:id/complete', requireAuth, async (req, res) => {
  try {
    console.log(`[tasks.js][PATCH /api/tasks/${req.params.id}/complete] Authenticated user:`, req.user);
    const { id } = req.params;
    const docRef = db.collection('tasks').doc(id);
    const doc = await docRef.get();
    const userKey = req.user.email || req.user.id;
    if (!doc.exists || doc.data().userId !== userKey || doc.data().status !== 'active') {
      return res.status(404).json({ error: 'Task not found or not active' });
    }
    const serverTime = admin.firestore.FieldValue.serverTimestamp();
    await docRef.update({ status: 'completed', updatedAt: serverTime, completionDate: serverTime });
    // Wait for Firestore to materialize serverTimestamp
    await new Promise(resolve => setTimeout(resolve, 300));
    const updatedDoc = await docRef.get();
    res.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (err) {
    console.error(`[tasks.js][PATCH /api/tasks/${req.params.id}/complete] Error:`, err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Restore a soft-deleted task
router.patch('/:id/restore', requireAuth, async (req, res) => {
  try {
    console.log(`[tasks.js][PATCH /api/tasks/${req.params.id}/restore] Authenticated user:`, req.user);
    const { id } = req.params;
    const docRef = db.collection('tasks').doc(id);
    const doc = await docRef.get();
    const userKey = req.user.email || req.user.id;
    if (!doc.exists || doc.data().userId !== userKey || doc.data().status !== 'deleted') {
      return res.status(404).json({ error: 'Task not found' });
    }
    await docRef.update({ status: 'active', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    const updatedDoc = await docRef.get();
    res.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (err) {
    console.error(`[tasks.js][PATCH /api/tasks/${req.params.id}/restore] Error:`, err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;
