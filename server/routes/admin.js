import express from 'express';
const router = express.Router();
import { verifyToken } from './auth.js';
import { requireAdmin, requireOwner } from '../middleware/roleAuth.js';
import { USER_ROLES, getUserRole, setUserRole, getAllUsers } from '../models/userRoles.js';
import { db } from '../config/firebase.js';

// Get all users (Admin & Owner only)
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Update user role (Owner only)
router.put('/users/:email/role', verifyToken, requireOwner, async (req, res) => {
  try {
    const { email } = req.params;
    const { role } = req.body;

    if (email === 'amitamit@gmail.com') {
      return res.status(403).json({ error: 'Cannot modify owner role' });
    }

    await setUserRole(email, role);
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Get all notes (Admin & Owner only)
router.get('/notes', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('Fetching all notes...');
    const notesSnapshot = await db.collectionGroup('notes').get();
    const notes = [];
    
    notesSnapshot.forEach(doc => {
      const data = doc.data();
      const path = doc.ref.path;
      console.log('Note path:', path);
      console.log('Note data:', {
        ...data,
        content: data.content ? data.content.substring(0, 50) + '...' : 'No content'
      });
      
      // Get user email from various possible fields
      const userEmail = data.userEmail || data.createdBy || data.user?.email || 'Unknown User';
      
      // Convert Firestore timestamps if present
      const convertTimestamp = (timestamp) => {
        if (!timestamp) return null;
        if (timestamp._seconds) {
          return new Date(timestamp._seconds * 1000 + Math.floor(timestamp._nanoseconds / 1000000)).toISOString();
        }
        return timestamp;
      };

      const updatedAt = convertTimestamp(data.updatedAt) || convertTimestamp(data.createdAt) || new Date().toISOString();
      const createdAt = convertTimestamp(data.createdAt) || new Date().toISOString();
      
      notes.push({
        id: doc.id,
        ...data,
        userEmail,
        path,
        updatedAt,
        createdAt
      });
    });
    
    // Sort notes by updatedAt
    notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    console.log('Processed notes:', notes.map(note => ({
      id: note.id,
      userEmail: note.userEmail,
      updatedAt: note.updatedAt,
      path: note.path
    })));
    
    res.json(notes);
  } catch (error) {
    console.error('Error getting all notes:', error);
    res.status(500).json({ error: 'Failed to get notes' });
  }
});

// Update any note (Admin & Owner only)
router.put('/notes/:noteId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { noteId } = req.params;
    const { content, path } = req.body;

    if (!path) {
      return res.status(400).json({ error: 'Note path is required' });
    }

    const noteRef = db.doc(path);
    await noteRef.update({
      content,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.email
    });

    res.json({ message: 'Note updated successfully' });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

export default router;
