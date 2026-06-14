/**
 * Application Constants
 * Centralized configuration values
 */

// Lead status workflow
const STATUS_OPTIONS = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'converted',
  'lost'
];

// Lead priority levels
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];

// Lead source channels
const SOURCE_OPTIONS = [
  'website',
  'callback',
  'referral',
  'walk-in',
  'social-media',
  'advertisement',
  'other'
];

// Valid user roles
const VALID_ROLES = ['super_admin', 'manager', 'viewer'];

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// File upload limits
const UPLOAD_LIMITS = {
  fileSize: 20 * 1024 * 1024, // 20MB
  files: 1
};

// Pagination defaults
const PAGINATION = {
  defaultLimit: 25,
  maxLimit: 100
};

// Session configuration
const SESSION = {
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
};

module.exports = {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  SOURCE_OPTIONS,
  VALID_ROLES,
  CACHE_DURATION,
  UPLOAD_LIMITS,
  PAGINATION,
  SESSION
};
