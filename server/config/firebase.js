import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file in the server directory
dotenv.config({ path: join(dirname(__dirname), '.env') });

// Debug log environment variables
console.log('Firebase Environment Variables:', {
  projectId: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Not set',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Not set',
  privateKey: process.env.FIREBASE_PRIVATE_KEY ? 'Set (length: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : 'Not set'
});

// Initialize Firebase Admin SDK with Service Account
const initializeFirebase = () => {
  try {
    // Format private key properly
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      privateKey = privateKey.replace(/\n/g, '\n');
    }

    const serviceAccount = {
      "type": "service_account",
      "project_id": process.env.FIREBASE_PROJECT_ID?.replace(/"/g, ''),  // Remove any quotes
      "private_key": privateKey,
      "client_email": process.env.FIREBASE_CLIENT_EMAIL
    };

    // Log initialization details (without sensitive data)
    console.log('Initializing Firebase with Service Account:', {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKeyProvided: !!serviceAccount.private_key
    });

    // Validate credentials
    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error('Missing required Firebase credentials');
    }

    // Initialize Firebase if not already initialized
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
        projectId: serviceAccount.project_id,
      });
      console.log('Firebase initialized successfully with Service Account');
    }

    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
    throw error;
  }
};

// Initialize Firestore
let db;

try {
  initializeFirebase();
  db = admin.firestore();
  
  // Set the database name
  const settings = {
    projectId: process.env.FIREBASE_PROJECT_ID?.replace(/"/g, ''),
    databaseId: 'meeting-notes-db'
  };
  db.settings(settings);

  // Test Firestore connection
  db.collection('notes').limit(1).get()
    .then(() => {
      console.log('Firestore connection test successful');
    })
    .catch(error => {
      console.error('Failed to connect to Firestore:', error.message);
      throw error;
    });
} catch (error) {
  console.error('Failed to initialize Firestore:', error.message);
  throw error;
}

// Database helper functions
const dbHelpers = {
  // Create a new note
  async createNote(userEmail, noteData) {
    const note = {
      ...noteData,
      userEmail,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    };
    return await db.collection('notes').add(note);
  },

  // Get notes for a user
  async getUserNotes(userEmail) {
    return await db.collection('notes')
      .where('userEmail', '==', userEmail)
      .where('status', '==', 'active')
      .orderBy('updatedAt', 'desc')
      .get();
  },

  // Update a note
  async updateNote(noteId, userEmail, updateData) {
    const noteRef = db.collection('notes').doc(noteId);
    const note = await noteRef.get();

    if (!note.exists) {
      throw new Error('Note not found');
    }

    if (note.data().userEmail !== userEmail) {
      throw new Error('Unauthorized: Note belongs to another user');
    }

    return await noteRef.update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  },

  // Delete a note (soft delete)
  async deleteNote(noteId, userEmail) {
    return await this.updateNote(noteId, userEmail, { status: 'deleted' });
  },

  // Update user settings
  async updateUserSettings(userEmail, settings) {
    const data = {
      ...settings,
      userEmail,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    return await db.collection('user_settings').doc(userEmail).set(data, { merge: true });
  },

  // Get user settings
  async getUserSettings(userEmail) {
    const doc = await db.collection('user_settings').doc(userEmail).get();
    return doc.exists ? doc.data() : null;
  }
};

export {
  admin,
  db,
  initializeFirebase
};
