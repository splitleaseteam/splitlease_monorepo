/**
 * Tests for isGuest
 *
 * Determine if a user type indicates Guest privileges.
 * Guest types: "A Guest (I would like to rent a space)", "Split Lease"
 */
import { describe, it, expect } from 'vitest';
import { isGuest } from '../isGuest.js';

describe('isGuest', () => {
  // ============================================================================
  // Happy Path - Guest Types
  // ============================================================================
  describe('guest types', () => {
    it('should return true for "A Guest (I would like to rent a space)"', () => {
      expect(isGuest({ userType: 'A Guest (I would like to rent a space)' })).toBe(true);
    });

    it('should return true for "Split Lease" (internal user)', () => {
      expect(isGuest({ userType: 'Split Lease' })).toBe(true);
    });

    it('should return true for any string containing "Guest"', () => {
      expect(isGuest({ userType: 'Guest' })).toBe(true);
      expect(isGuest({ userType: 'guest user' })).toBe(false); // case-sensitive
      expect(isGuest({ userType: 'GuestUser' })).toBe(true);
    });
  });

  // ============================================================================
  // Non-Guest Types
  // ============================================================================
  describe('non-guest types', () => {
    it('should return false for "A Host (I have a space available to rent)"', () => {
      expect(isGuest({ userType: 'A Host (I have a space available to rent)' })).toBe(false);
    });

    it('should return false for "Trial Host"', () => {
      expect(isGuest({ userType: 'Trial Host' })).toBe(false);
    });

    it('should return false for host-only types', () => {
      expect(isGuest({ userType: 'Host' })).toBe(false);
    });

    it('should return false for "Admin"', () => {
      expect(isGuest({ userType: 'Admin' })).toBe(false);
    });
  });

  // ============================================================================
  // Invalid Inputs
  // ============================================================================
  describe('invalid inputs', () => {
    it('should return false for null userType', () => {
      expect(isGuest({ userType: null })).toBe(false);
    });

    it('should return false for undefined userType', () => {
      expect(isGuest({ userType: undefined })).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isGuest({ userType: '' })).toBe(false);
    });

    it('should return false for non-string userType (number)', () => {
      expect(isGuest({ userType: 123 })).toBe(false);
    });

    it('should return false for non-string userType (boolean)', () => {
      expect(isGuest({ userType: true })).toBe(false);
    });

    it('should return false for non-string userType (object)', () => {
      expect(isGuest({ userType: { type: 'Guest' } })).toBe(false);
    });

    it('should return false for non-string userType (array)', () => {
      expect(isGuest({ userType: ['Guest'] })).toBe(false);
    });
  });

  // ============================================================================
  // Whitespace Handling
  // ============================================================================
  describe('whitespace handling', () => {
    it('should handle leading whitespace', () => {
      expect(isGuest({ userType: '  A Guest (I would like to rent a space)' })).toBe(true);
    });

    it('should handle trailing whitespace', () => {
      expect(isGuest({ userType: 'A Guest (I would like to rent a space)  ' })).toBe(true);
    });

    it('should handle Split Lease with whitespace', () => {
      expect(isGuest({ userType: '  Split Lease  ' })).toBe(true);
    });

    it('should return false for whitespace-only string', () => {
      expect(isGuest({ userType: '   ' })).toBe(false);
    });
  });

  // ============================================================================
  // Case Sensitivity
  // ============================================================================
  describe('case sensitivity', () => {
    it('should be case-sensitive for "Guest"', () => {
      expect(isGuest({ userType: 'A GUEST' })).toBe(false);
      expect(isGuest({ userType: 'A guest' })).toBe(false);
      expect(isGuest({ userType: 'A Guest' })).toBe(true);
    });

    it('should be case-sensitive for "Split Lease"', () => {
      expect(isGuest({ userType: 'split lease' })).toBe(false);
      expect(isGuest({ userType: 'SPLIT LEASE' })).toBe(false);
      expect(isGuest({ userType: 'Split Lease' })).toBe(true);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle partial matches', () => {
      expect(isGuest({ userType: 'GuestManager' })).toBe(true);
      expect(isGuest({ userType: 'MyGuest' })).toBe(true);
    });

    it('should return false for "guest" lowercase', () => {
      expect(isGuest({ userType: 'guest' })).toBe(false);
    });

    it('should handle user type with special characters', () => {
      expect(isGuest({ userType: 'Guest@Test' })).toBe(true);
      expect(isGuest({ userType: 'Guest-123' })).toBe(true);
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should identify regular guest user', () => {
      expect(isGuest({ userType: 'A Guest (I would like to rent a space)' })).toBe(true);
    });

    it('should identify Split Lease admin as guest', () => {
      // Split Lease internal users have both Host and Guest privileges
      expect(isGuest({ userType: 'Split Lease' })).toBe(true);
    });

    it('should not identify host as guest', () => {
      expect(isGuest({ userType: 'A Host (I have a space available to rent)' })).toBe(false);
    });

    it('should not identify trial host as guest', () => {
      expect(isGuest({ userType: 'Trial Host' })).toBe(false);
    });

    it('should handle unauthenticated user', () => {
      expect(isGuest({ userType: null })).toBe(false);
    });
  });
});
