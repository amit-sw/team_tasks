const express = require('express');
const router = express.Router();
const { db, admin } = require('../config/firebase');
const { verifyToken } = require('./auth');

// Convert Firestore timestamp to milliseconds
const convertTimestamp = (timestamp) => {
  if (!timestamp) return null;
  return timestamp._seconds * 1000 + Math.floor(timestamp._nanoseconds / 1000000);
};

// Convert timestamps in note object
const convertNoteTimestamps = (note) => {
  if (!note) return note;
  
  const converted = {
    ...note,
    createdAt: convertTimestamp(note.createdAt),
    updatedAt: convertTimestamp(note.updatedAt)
  };

  if (note.versions) {
    converted.versions = note.versions.map(version => ({
      ...version,
      timestamp: convertTimestamp(version.timestamp)
    }));
  }

  return converted;
};

// Create a new note
router.post('/', verifyToken, async (req, res) => {
  try {
    const { eventId, content } = req.body;
    const { email } = req.user;
    
    if (!eventId || !content || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const now = admin.firestore.Timestamp.now();
    const noteRef = db.collection('notes').doc(eventId);
    
    const newNote = {
      eventId,
      content,
      userEmail: email,  // Store user email directly
      createdBy: email,
      lastEditor: email,
      createdAt: now,
      updatedAt: now,
      versions: []
    };
    
    await noteRef.set(newNote);
    
    res.json({
      success: true,
      note: convertNoteTimestamps(newNote)
    });
  } catch (error) {
    console.error('Create/Update note error:', error);
    res.status(500).json({ success: false, error: 'Failed to create/update note' });
  }
});

// Update a note
router.put('/:eventId', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { content } = req.body;
    const { email } = req.user;

    if (!eventId || !content || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }
    
    const noteRef = db.collection('notes').doc(eventId);
    const noteDoc = await noteRef.get();
    
    if (!noteDoc.exists) {
      // If note doesn't exist, create it
      const now = admin.firestore.Timestamp.now();
      const newNote = {
        eventId,
        content,
        createdBy: email,
        lastEditor: email,
        createdAt: now,
        updatedAt: now,
        versions: []
      };
      
      await noteRef.set(newNote);
      
      res.json({
        success: true,
        note: convertNoteTimestamps(newNote)
      });
      return;
    }
    
    const existingNote = noteDoc.data();
    const now = admin.firestore.Timestamp.now();
    
    // Add current version to history
    const updatedVersions = [...(existingNote.versions || []), {
      content: existingNote.content,
      timestamp: existingNote.updatedAt,
      editor: existingNote.lastEditor
    }];
    
    const updatedNote = {
      content,
      lastEditor: email,
      updatedAt: now,
      versions: updatedVersions
    };
    
    await noteRef.update(updatedNote);
    
    const responseNote = {
      ...existingNote,
      ...updatedNote,
      eventId
    };

    res.json({
      success: true,
      note: convertNoteTimestamps(responseNote)
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ success: false, error: 'Failed to update note' });
  }
});

// Get note by event ID
router.get('/:eventId', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const noteRef = db.collection('notes').doc(eventId);
    const noteDoc = await noteRef.get();
    
    if (!noteDoc.exists) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    
    const note = noteDoc.data();
    const responseNote = {
      ...note,
      eventId
    };

    res.json({
      success: true,
      note: convertNoteTimestamps(responseNote)
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ success: false, error: 'Failed to get note' });
  }
});

// Get all notes for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const { email } = req.user;
    const notesSnapshot = await db.collection('notes')
      .where('createdBy', '==', email)
      .orderBy('updatedAt', 'desc')
      .get();
    
    const notes = [];
    notesSnapshot.forEach(doc => {
      const note = {
        ...doc.data(),
        eventId: doc.id
      };
      notes.push(convertNoteTimestamps(note));
    });
    
    res.json({
      success: true,
      notes
    });
  } catch (error) {
    console.error('Get all notes error:', error);
    res.status(500).json({ success: false, error: 'Failed to get notes' });
  }
});

module.exports = router;
