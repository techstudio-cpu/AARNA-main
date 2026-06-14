/**
 * Auth Routes
 * Login/logout endpoints
 */

const express = require('express');
const router = express.Router();
const { loginLimiter, validators, handleValidationErrors } = require('../../config/security');
const {
  renderLogin,
  login,
  logout,
  adminRedirect
} = require('../controllers/authController');

// Login page
router.get('/login', renderLogin);

// Login submission (rate limited)
router.post('/login', loginLimiter, validators.login, handleValidationErrors, login);

// Logout (both POST and GET for compatibility)
router.post('/logout', logout);
router.get('/logout', logout);

// Admin root redirect
router.get('/', adminRedirect);

module.exports = router;
