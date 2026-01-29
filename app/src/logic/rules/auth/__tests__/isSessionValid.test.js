/**
 * Tests for isSessionValid
 *
 * Check if a session is valid.
 * Session is valid if auth state is set to true.
 */
import { describe, it, expect } from 'vitest';
import { isSessionValid } from '../isSessionValid.js';

describe('isSessionValid', () => {
  // ============================================================================
  // Happy Path - Valid Session
  // ============================================================================
  describe('valid session', () => {
    it('should return true when authState is true', () => {
      expect(isSessionValid({ authState: true })).toBe(true);
    });
  });

  // ============================================================================
  // Invalid Session
  // ============================================================================
  describe('invalid session', () => {
    it('should return false when authState is false', () => {
      expect(isSessionValid({ authState: false })).toBe(false);
    });
  });

  // ============================================================================
  // Error Handling - Non-Boolean Input
  // ============================================================================
  describe('error handling - non-boolean input', () => {
    it('should throw error for null authState', () => {
      expect(() => isSessionValid({ authState: null }))
        .toThrow('authState must be a boolean');
    });

    it('should throw error for undefined authState', () => {
      expect(() => isSessionValid({ authState: undefined }))
        .toThrow('authState must be a boolean');
    });

    it('should throw error for string "true"', () => {
      expect(() => isSessionValid({ authState: 'true' }))
        .toThrow('authState must be a boolean');
    });

    it('should throw error for string "false"', () => {
      expect(() => isSessionValid({ authState: 'false' }))
        .toThrow('authState must be a boolean');
    });

    it('should throw error for number 1', () => {
      expect(() => isSessionValid({ authState: 1 }))
        .toThrow('authState must be a boolean');
    });

    it('should throw error for number 0', () => {
      expect(() => isSessionValid({ authState: 0 }))
        .toThrow('authState must be a boolean');
    });

    it('should throw error for empty object', () => {
      expect(() => isSessionValid({ authState: {} }))
        .toThrow('authState must be a boolean');
    });

    it('should throw error for empty array', () => {
      expect(() => isSessionValid({ authState: [] }))
        .toThrow('authState must be a boolean');
    });

    it('should throw error for NaN', () => {
      expect(() => isSessionValid({ authState: NaN }))
        .toThrow('authState must be a boolean');
    });

    it('should throw error for empty string', () => {
      expect(() => isSessionValid({ authState: '' }))
        .toThrow('authState must be a boolean');
    });
  });

  // ============================================================================
  // Error Message Format
  // ============================================================================
  describe('error message format', () => {
    it('should include type info for string', () => {
      expect(() => isSessionValid({ authState: 'yes' }))
        .toThrow('authState must be a boolean, got string');
    });

    it('should include type info for number', () => {
      expect(() => isSessionValid({ authState: 42 }))
        .toThrow('authState must be a boolean, got number');
    });

    it('should include type info for object', () => {
      expect(() => isSessionValid({ authState: { valid: true } }))
        .toThrow('authState must be a boolean, got object');
    });

    it('should include type info for undefined', () => {
      expect(() => isSessionValid({ authState: undefined }))
        .toThrow('authState must be a boolean, got undefined');
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle Boolean object (false)', () => {
      // Boolean objects are objects, not booleans
      expect(() => isSessionValid({ authState: new Boolean(false) }))
        .toThrow('authState must be a boolean, got object');
    });

    it('should handle Boolean object (true)', () => {
      // Boolean objects are objects, not booleans
      expect(() => isSessionValid({ authState: new Boolean(true) }))
        .toThrow('authState must be a boolean, got object');
    });

    it('should not accept truthy values other than true', () => {
      expect(() => isSessionValid({ authState: 'anything' })).toThrow();
      expect(() => isSessionValid({ authState: 100 })).toThrow();
      expect(() => isSessionValid({ authState: [] })).toThrow();
    });

    it('should not accept falsy values other than false', () => {
      expect(() => isSessionValid({ authState: null })).toThrow();
      expect(() => isSessionValid({ authState: 0 })).toThrow();
      expect(() => isSessionValid({ authState: '' })).toThrow();
    });
  });

  // ============================================================================
  // Input Object Validation
  // ============================================================================
  describe('input object validation', () => {
    it('should work with extra properties in params object', () => {
      expect(isSessionValid({ authState: true, extraProp: 'ignored' })).toBe(true);
    });

    it('should throw error for missing params object', () => {
      expect(() => isSessionValid()).toThrow();
    });

    it('should throw error for empty params object', () => {
      expect(() => isSessionValid({})).toThrow('authState must be a boolean');
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should validate authenticated user session', () => {
      expect(isSessionValid({ authState: true })).toBe(true);
    });

    it('should validate logged out user session', () => {
      expect(isSessionValid({ authState: false })).toBe(false);
    });

    it('should reject uninitialized session state', () => {
      expect(() => isSessionValid({ authState: null })).toThrow();
    });

    it('should reject session state from localStorage (string)', () => {
      // localStorage always returns strings
      expect(() => isSessionValid({ authState: 'true' })).toThrow();
    });
  });
});
