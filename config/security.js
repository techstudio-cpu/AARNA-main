/**
 * Security Configuration Module
 * Centralizes all security middleware and settings
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// ─── Helmet Configuration ────────────────────────────────────────────

const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net",
        "https://cdn.tailwindcss.com"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "blob:",
        "https://cdn.jsdelivr.net",
        "https://cdn.tailwindcss.com",
        "https://cdnjs.cloudflare.com"
      ],
      scriptSrcAttr: ["'unsafe-inline'"],
      fontSrc: [
        "'self'",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net",
        "data:"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:",
        "https://images.unsplash.com",
        "https://*.unsplash.com"
      ],
      connectSrc: [
        "'self'",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://api.resend.com",
        "https://cdn.tailwindcss.com",
        "https://images.unsplash.com"
      ],
      frameSrc: ["'self'", "https://www.google.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
};

// ─── Rate Limiting Configurations ──────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  skipSuccessfulRequests: true
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    error: 'Too many requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute for public pages
  message: {
    error: 'Too many requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ─── Input Validation Sanitizers ────────────────────────────────────

const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  // Remove null bytes and trim
  return value.replace(/\x00/g, '').trim();
};

const validators = {
  // Lead validation
  createLead: [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be 2-100 characters')
      .matches(/^[a-zA-Z\s\-'.]+$/)
      .withMessage('Name contains invalid characters')
      .customSanitizer(sanitizeInput),
    body('phone')
      .trim()
      .isLength({ min: 10, max: 15 })
      .withMessage('Phone must be 10-15 digits')
      .matches(/^[\d\+\-\s\(\)]+$/)
      .withMessage('Phone contains invalid characters')
      .customSanitizer(sanitizeInput),
    body('email')
      .optional({ nullable: true, checkFalsy: true })
      .isEmail()
      .withMessage('Invalid email address')
      .normalizeEmail()
      .isLength({ max: 255 })
      .withMessage('Email too long'),
    body('location')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 255 })
      .withMessage('Location too long')
      .customSanitizer(sanitizeInput),
    body('message')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Message too long (max 2000 chars)')
      .customSanitizer(sanitizeInput)
  ],

  // Login validation
  login: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be 3-50 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username contains invalid characters')
      .customSanitizer(sanitizeInput),
    body('password')
      .isLength({ min: 6, max: 128 })
      .withMessage('Password must be 6-128 characters')
  ],

  // User management validation
  createUser: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be 3-50 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username contains invalid characters'),
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be 8-128 characters'),
    body('displayName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Display name must be 2-100 characters'),
    body('role')
      .isIn(['super_admin', 'manager', 'viewer'])
      .withMessage('Invalid role')
  ],

  // Lead update validation
  updateLead: [
    body('status')
      .optional()
      .isIn(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'])
      .withMessage('Invalid status'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    body('source')
      .optional()
      .isIn(['website', 'callback', 'referral', 'walk-in', 'social-media', 'advertisement', 'other'])
      .withMessage('Invalid source'),
    body('assignedTo')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 100 })
      .withMessage('Assigned to name too long')
  ],

  // Note validation
  addNote: [
    body('content')
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage('Note must be 1-2000 characters')
      .customSanitizer(sanitizeInput)
  ]
};

// ─── Validation Error Handler ───────────────────────────────────────

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({
        field: e.path,
        message: e.msg
      }))
    });
  }
  next();
};

// ─── Export ────────────────────────────────────────────────────────

module.exports = {
  helmetConfig,
  loginLimiter,
  apiLimiter,
  publicLimiter,
  validators,
  handleValidationErrors,
  helmetMiddleware: helmet(helmetConfig)
};
