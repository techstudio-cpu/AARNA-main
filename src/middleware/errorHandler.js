/**
 * Global Error Handling Middleware
 * Centralized error processing and logging
 */

const { addAuditEntry } = require('../../config/audit-simple');

/**
 * Custom API Error class with status code
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Not Found handler for undefined routes
 */
function notFoundHandler(req, res, next) {
  const error = new ApiError(`Route ${req.originalUrl} not found`, 404);
  next(error);
}

/**
 * Global error handler
 */
function errorHandler(err, req, res, next) {
  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.currentUser?.id
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Audit log for server errors
  if (statusCode >= 500 && req.currentUser) {
    addAuditEntry('SERVER_ERROR', req.currentUser.id, {
      error: err.message,
      path: req.path,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress
    });
  }

  // API errors - return JSON
  if (req.path.startsWith('/api/')) {
    return res.status(statusCode).json({
      error: statusCode === 500 ? 'Internal server error' : err.message,
      ...(statusCode !== 500 && err.details && { details: err.details })
    });
  }

  // HTML errors - render error page
  res.status(statusCode).render('error', {
    title: `Error ${statusCode}`,
    message: statusCode === 500 ? 'Something went wrong' : err.message,
    statusCode
  });
}

/**
 * Async handler wrapper - catches errors in async route handlers
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler,
  asyncHandler
};
