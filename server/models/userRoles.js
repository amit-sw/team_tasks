const { db } = require('../config/firebase');

const USER_ROLES = {
  REGULAR: 'REGULAR',
  ADMIN: 'ADMIN',
  OWNER: 'OWNER'
};

// Collection name for user roles
const ROLES_COLLECTION = 'user_roles';

const getUserRole = async (email) => {
  try {
    console.log(`Getting role for user: ${email}`);
    const userRoleDoc = await db.collection(ROLES_COLLECTION).doc(email).get();

    if (!userRoleDoc.exists) {
      console.log(`No role found for ${email}, creating with REGULAR role`);
      // Create new user with REGULAR role
      await db.collection(ROLES_COLLECTION).doc(email).set({
        email,
        role: USER_ROLES.REGULAR,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return USER_ROLES.REGULAR;
    }

    console.log(`Found role for ${email}:`, userRoleDoc.data().role);
    return userRoleDoc.data().role;
  } catch (error) {
    console.error('Error getting user role:', error);
    console.log('Defaulting to REGULAR role due to error');
    return USER_ROLES.REGULAR; // Default to REGULAR on error
  }
};

const setUserRole = async (email, role) => {
  try {
    console.log(`Setting role for user ${email} to ${role}`);
    
    if (!Object.values(USER_ROLES).includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    // Check if trying to modify owner
    if (email === 'amitamit@gmail.com' && role !== USER_ROLES.OWNER) {
      throw new Error('Cannot modify owner role');
    }

    await db.collection(ROLES_COLLECTION).doc(email).set({
      email,
      role,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`Successfully updated role for ${email} to ${role}`);
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
};

// Get all users and their roles
const getAllUsers = async () => {
  try {
    console.log('Fetching all users and their roles');
    const snapshot = await db.collection(ROLES_COLLECTION).get();
    const users = [];
    
    snapshot.forEach(doc => {
      users.push(doc.data());
    });

    console.log(`Found ${users.length} users`);
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Initialize owner
const initializeOwner = async () => {
  try {
    console.log('Initializing owner role');
    const ownerEmail = 'amitamit@gmail.com';
    const ownerDoc = await db.collection(ROLES_COLLECTION).doc(ownerEmail).get();

    if (!ownerDoc.exists) {
      console.log('Owner document does not exist, creating it');
      await setUserRole(ownerEmail, USER_ROLES.OWNER);
      console.log('Owner initialized successfully');
    } else {
      console.log('Owner document already exists');
      // Ensure owner always has OWNER role
      if (ownerDoc.data().role !== USER_ROLES.OWNER) {
        await setUserRole(ownerEmail, USER_ROLES.OWNER);
        console.log('Owner role reinforced');
      }
    }
  } catch (error) {
    console.error('Error initializing owner:', error);
    throw error;
  }
};

module.exports = {
  USER_ROLES,
  getUserRole,
  setUserRole,
  getAllUsers,
  initializeOwner
};
