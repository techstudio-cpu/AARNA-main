/**
 * Jest Setup
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret-key';

// Mock console methods during tests
global.console = {
  ...console,
  // Suppress console.log during tests (keep errors)
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error
};

// Global test timeout
jest.setTimeout(10000);
