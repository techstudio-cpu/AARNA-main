/**
 * Auth Controller
 * Handles authentication (login/logout)
 */

const { authenticateUser } = require('../../config/auth-simple');
const { addSession, invalidateSession, updateSessionActivity } = require('../../config/sessions');
const { addAuditEntry } = require('../../config/audit-simple');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Render login page
 * GET /admin/login
 */
function renderLogin(req, res) {
  if (req.session?.isAuthenticated) {
    return res.redirect('/admin/leads');
  }
  res.render('admin-login', { error: null });
}

/**
 * Handle login
 * POST /admin/login
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';

    const user = await authenticateUser(username, password);

    if (!user) {
      addAuditEntry('LOGIN_FAILED', null, { username, ip, userAgent, reason: 'Invalid credentials' });
      throw new ApiError('Invalid username or password', 401);
    }

    if (!user.active) {
      addAuditEntry('LOGIN_FAILED_INACTIVE', user.id, { username, ip, userAgent, reason: 'Account inactive' });
      throw new ApiError('Account is inactive. Contact administrator.', 403);
    }

    // Set session
    req.session.isAuthenticated = true;
    req.session.userId = user.id;
    req.session.userName = user.displayName;
    req.session.userRole = user.role;

    // Track session
    addSession(req.sessionID, user.id, ip, userAgent);
    addAuditEntry('LOGIN_SUCCESS', user.id, { username, ip, userAgent });

    res.redirect('/admin/leads');
  } catch (error) {
    next(error);
  }
}

/**
 * Handle logout
 * POST /admin/logout or GET /admin/logout
 */
function logout(req, res) {
  const userId = req.session?.userId;
  const sessionId = req.sessionID;

  if (userId && sessionId) {
    addAuditEntry('LOGOUT', userId, { ip: req.ip || req.connection.remoteAddress });
    invalidateSession(sessionId);
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
    }
    res.redirect('/admin/login');
  });
}

/**
 * Redirect /admin to appropriate page
 * GET /admin
 */
function adminRedirect(req, res) {
  if (req.session?.isAuthenticated) {
    return res.redirect('/admin/leads');
  }
  res.redirect('/admin/login');
}

/**
 * Middleware to track session activity
 */
function trackSessionActivity(req, res, next) {
  if (req.session && req.session.isAuthenticated && req.session.userId) {
    updateSessionActivity(req.sessionID);
  }
  next();
}

module.exports = {
  renderLogin,
  login,
  logout,
  adminRedirect,
  trackSessionActivity
};
