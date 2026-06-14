/**
 * Authentication & Authorization Middleware
 * RBAC implementation with session-based auth
 */

const { getUserById } = require('../../config/auth-simple');

// Role hierarchy for permission checking
const ROLE_HIERARCHY = { super_admin: 3, manager: 2, viewer: 1 };
const VALID_ROLES = Object.keys(ROLE_HIERARCHY);

/**
 * Check if user role meets minimum required role
 * @param {string} userRole - Current user's role
 * @param {string} requiredRole - Minimum required role
 * @returns {boolean}
 */
function hasRole(userRole, requiredRole) {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[requiredRole] || 0);
}

/**
 * Authentication middleware - verifies session
 * Attaches req.currentUser if authenticated
 */
async function requireAuth(req, res, next) {
  if (req.session && req.session.isAuthenticated && req.session.userId) {
    try {
      const user = await getUserById(req.session.userId);
      if (user && user.active) {
        req.currentUser = user;
        return next();
      }
    } catch (e) {
      console.error('Auth middleware error:', e.message);
    }
  }

  // For API routes, return 401 instead of redirect
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  res.redirect('/admin/login');
}

/**
 * Role-based authorization middleware factory
 * @param {string} minRole - Minimum role required
 * @returns {Function} Express middleware
 */
function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.currentUser) {
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      return res.redirect('/admin/login');
    }

    if (!hasRole(req.currentUser.role, minRole)) {
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({ error: `Insufficient permissions. Requires ${minRole} role or higher.` });
      }
      return res.status(403).send('Access denied. Insufficient permissions.');
    }

    next();
  };
}

/**
 * Make auth status available to all views
 */
function authLocalsMiddleware(req, res, next) {
  res.locals.isAuthenticated = req.session?.isAuthenticated || false;
  res.locals.userRole = req.session?.userRole || null;
  res.locals.userName = req.session?.userName || null;
  res.locals.userId = req.session?.userId || null;
  next();
}

module.exports = {
  ROLE_HIERARCHY,
  VALID_ROLES,
  hasRole,
  requireAuth,
  requireRole,
  authLocalsMiddleware
};
