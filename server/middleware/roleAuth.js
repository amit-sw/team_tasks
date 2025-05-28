const { USER_ROLES } = require('../models/userRoles');

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
    }
    
    next();
  };
};

// Middleware for admin-only routes
const requireAdmin = checkRole([USER_ROLES.ADMIN, USER_ROLES.OWNER]);

// Middleware for owner-only routes
const requireOwner = checkRole([USER_ROLES.OWNER]);

module.exports = {
  checkRole,
  requireAdmin,
  requireOwner
};
