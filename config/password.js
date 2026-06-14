/**
 * Password Hashing Module
 * Uses bcrypt for secure password storage
 */

const bcrypt = require('bcrypt');

// Cost factor for bcrypt (higher = more secure but slower)
const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password
 * @param {string} plaintextPassword
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(plaintextPassword) {
  if (!plaintextPassword || typeof plaintextPassword !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  if (plaintextPassword.length < 6 || plaintextPassword.length > 128) {
    throw new Error('Password must be 6-128 characters');
  }

  return bcrypt.hash(plaintextPassword, SALT_ROUNDS);
}

/**
 * Compare a plaintext password with a hash
 * @param {string} plaintextPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>} True if match
 */
async function comparePassword(plaintextPassword, hashedPassword) {
  if (!plaintextPassword || !hashedPassword) {
    return false;
  }

  return bcrypt.compare(plaintextPassword, hashedPassword);
}

/**
 * Check if a password appears to be hashed (bcrypt format)
 * @param {string} password
 * @returns {boolean}
 */
function isPasswordHashed(password) {
  if (!password || typeof password !== 'string') {
    return false;
  }
  // bcrypt hashes start with $2a$, $2b$, or $2y$ followed by cost factor
  return /^\$2[aby]\$\d+\$/.test(password);
}

module.exports = {
  hashPassword,
  comparePassword,
  isPasswordHashed,
  SALT_ROUNDS
};
