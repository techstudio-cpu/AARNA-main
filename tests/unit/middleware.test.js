/**
 * Middleware Unit Tests
 */

const { hasRole, ROLE_HIERARCHY } = require('../../src/middleware/auth');
const { ApiError } = require('../../src/middleware/errorHandler');

describe('Auth Middleware', () => {
  describe('hasRole', () => {
    it('should return true for matching roles', () => {
      expect(hasRole('super_admin', 'super_admin')).toBe(true);
      expect(hasRole('manager', 'manager')).toBe(true);
      expect(hasRole('viewer', 'viewer')).toBe(true);
    });

    it('should return true for higher roles', () => {
      expect(hasRole('super_admin', 'manager')).toBe(true);
      expect(hasRole('super_admin', 'viewer')).toBe(true);
      expect(hasRole('manager', 'viewer')).toBe(true);
    });

    it('should return false for lower roles', () => {
      expect(hasRole('viewer', 'manager')).toBe(false);
      expect(hasRole('manager', 'super_admin')).toBe(false);
      expect(hasRole('viewer', 'super_admin')).toBe(false);
    });

    it('should return false for unknown roles', () => {
      expect(hasRole('unknown', 'viewer')).toBe(false);
      expect(hasRole('viewer', 'unknown')).toBe(false);
    });
  });

  describe('ROLE_HIERARCHY', () => {
    it('should have correct role values', () => {
      expect(ROLE_HIERARCHY.super_admin).toBe(3);
      expect(ROLE_HIERARCHY.manager).toBe(2);
      expect(ROLE_HIERARCHY.viewer).toBe(1);
    });
  });
});

describe('Error Middleware', () => {
  describe('ApiError', () => {
    it('should create error with status code', () => {
      const error = new ApiError('Test error', 404, { details: 'test' });
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(404);
      expect(error.details).toEqual({ details: 'test' });
    });

    it('should default to 500 status code', () => {
      const error = new ApiError('Test error');
      expect(error.statusCode).toBe(500);
    });
  });
});
