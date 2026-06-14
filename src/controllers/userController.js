/**
 * User Controller
 * Handles user management (super_admin only)
 */

const {
  loadUsers,
  getUserById,
  createUser: authCreateUser,
  updateUser: authUpdateUser,
  deleteUser: authDeleteUser
} = require('../../config/auth-simple');

const { invalidateUserSessions } = require('../../config/sessions');
const { addAuditEntry } = require('../../config/audit-simple');
const { VALID_ROLES } = require('../constants');
const { ApiError } = require('../middleware/errorHandler');

/**
 * List all users
 * GET /api/users
 */
async function listUsers(req, res, next) {
  try {
    const users = await loadUsers();
    const sanitized = users.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      role: u.role,
      active: u.active,
      createdAt: u.createdAt
    }));

    res.json(sanitized);
  } catch (error) {
    next(error);
  }
}

/**
 * Create new user
 * POST /api/users
 */
async function createUser(req, res, next) {
  try {
    const { username, password, displayName, role } = req.body;

    if (!username || !password || !displayName) {
      throw new ApiError('Username, password, and display name are required', 400);
    }

    if (!VALID_ROLES.includes(role)) {
      throw new ApiError(`Invalid role. Must be: ${VALID_ROLES.join(', ')}`, 400);
    }

    const newUser = await authCreateUser({
      username,
      password,
      displayName,
      role,
      active: true
    });

    addAuditEntry('USER_CREATED', req.currentUser.id, {
      targetUserId: newUser.id,
      username: newUser.username,
      role: newUser.role,
      ip: req.ip || req.connection.remoteAddress
    });

    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        displayName: newUser.displayName,
        role: newUser.role,
        active: newUser.active
      }
    });
  } catch (error) {
    if (error.message && error.message.includes('duplicate key')) {
      return next(new ApiError('Username already exists', 409));
    }
    next(error);
  }
}

/**
 * Update user
 * PATCH /api/users/:id
 */
async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { displayName, role, active, password } = req.body;

    const existingUser = await getUserById(id);
    if (!existingUser) {
      throw new ApiError('User not found', 404);
    }

    const updates = {};
    const changes = {};

    if (displayName) {
      changes.displayName = { from: existingUser.displayName, to: displayName };
      updates.displayName = displayName;
    }

    if (role && VALID_ROLES.includes(role)) {
      changes.role = { from: existingUser.role, to: role };
      updates.role = role;
    }

    if (typeof active === 'boolean') {
      changes.active = { from: existingUser.active, to: active };
      updates.active = active;
    }

    if (password) {
      changes.password = 'updated';
      updates.password = password;
    }

    const updatedUser = await authUpdateUser(id, updates);

    addAuditEntry('USER_UPDATED', req.currentUser.id, {
      targetUserId: id,
      username: existingUser.username,
      changes,
      ip: req.ip || req.connection.remoteAddress
    });

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        role: updatedUser.role,
        active: updatedUser.active
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete user
 * DELETE /api/users/:id
 */
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (id === req.currentUser.id) {
      throw new ApiError('Cannot delete your own account', 400);
    }

    const userToDelete = await getUserById(id);
    if (!userToDelete) {
      throw new ApiError('User not found', 404);
    }

    await authDeleteUser(id);

    // Invalidate all sessions for deleted user
    invalidateUserSessions(id);

    addAuditEntry('USER_DELETED', req.currentUser.id, {
      targetUserId: id,
      username: userToDelete.username,
      role: userToDelete.role,
      ip: req.ip || req.connection.remoteAddress
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser
};
