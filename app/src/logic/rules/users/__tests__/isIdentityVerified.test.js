/**
 * Tests for isIdentityVerified and isIdentityVerificationPending
 *
 * Rule functions to check user's identity verification status.
 */
import { describe, it, expect } from 'vitest';
import { isIdentityVerified, isIdentityVerificationPending } from '../isIdentityVerified.js';

describe('isIdentityVerified', () => {
  // ============================================================================
  // Returns True - User Is Verified
  // ============================================================================
  describe('returns true when user is verified', () => {
    it('should return true when identity_verified is true', () => {
      const result = isIdentityVerified({ identity_verified: true });
      expect(result).toBe(true);
    });

    it('should return true when user has other fields and identity_verified is true', () => {
      const user = {
        id: 'user123',
        firstName: 'John',
        identity_verified: true,
        identity_submitted_at: '2025-01-15'
      };
      expect(isIdentityVerified(user)).toBe(true);
    });
  });

  // ============================================================================
  // Returns False - User Is Not Verified
  // ============================================================================
  describe('returns false when user is not verified', () => {
    it('should return false when identity_verified is false', () => {
      const result = isIdentityVerified({ identity_verified: false });
      expect(result).toBe(false);
    });

    it('should return false when identity_verified is null', () => {
      const result = isIdentityVerified({ identity_verified: null });
      expect(result).toBe(false);
    });

    it('should return false when identity_verified is undefined', () => {
      const result = isIdentityVerified({ identity_verified: undefined });
      expect(result).toBe(false);
    });

    it('should return false when identity_verified field is missing', () => {
      const result = isIdentityVerified({ id: 'user123', firstName: 'John' });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Returns False - Invalid/Missing User
  // ============================================================================
  describe('returns false for invalid/missing user', () => {
    it('should return false for null user', () => {
      expect(isIdentityVerified(null)).toBe(false);
    });

    it('should return false for undefined user', () => {
      expect(isIdentityVerified(undefined)).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isIdentityVerified({})).toBe(false);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should return false for truthy non-boolean value', () => {
      expect(isIdentityVerified({ identity_verified: 'yes' })).toBe(false);
    });

    it('should return false for truthy number value', () => {
      expect(isIdentityVerified({ identity_verified: 1 })).toBe(false);
    });

    it('should return false for falsy non-boolean values', () => {
      expect(isIdentityVerified({ identity_verified: 0 })).toBe(false);
      expect(isIdentityVerified({ identity_verified: '' })).toBe(false);
    });
  });
});

describe('isIdentityVerificationPending', () => {
  // ============================================================================
  // Returns True - Verification Is Pending
  // ============================================================================
  describe('returns true when verification is pending', () => {
    it('should return true when submitted but not verified', () => {
      const user = {
        identity_submitted_at: '2025-01-15T10:30:00Z',
        identity_verified: false
      };
      expect(isIdentityVerificationPending(user)).toBe(true);
    });

    it('should return true when submitted and verified is undefined', () => {
      const user = {
        identity_submitted_at: '2025-01-15T10:30:00Z'
        // identity_verified not set
      };
      expect(isIdentityVerificationPending(user)).toBe(true);
    });

    it('should return true when submitted and verified is null', () => {
      const user = {
        identity_submitted_at: '2025-01-15T10:30:00Z',
        identity_verified: null
      };
      expect(isIdentityVerificationPending(user)).toBe(true);
    });

    it('should return true with Date object for submission time', () => {
      const user = {
        identity_submitted_at: new Date('2025-01-15T10:30:00Z'),
        identity_verified: false
      };
      expect(isIdentityVerificationPending(user)).toBe(true);
    });
  });

  // ============================================================================
  // Returns False - Not Pending
  // ============================================================================
  describe('returns false when not pending', () => {
    it('should return false when already verified', () => {
      const user = {
        identity_submitted_at: '2025-01-15T10:30:00Z',
        identity_verified: true
      };
      expect(isIdentityVerificationPending(user)).toBe(false);
    });

    it('should return false when never submitted', () => {
      const user = {
        identity_submitted_at: null,
        identity_verified: false
      };
      expect(isIdentityVerificationPending(user)).toBe(false);
    });

    it('should return false when submitted_at is undefined', () => {
      const user = {
        identity_verified: false
      };
      expect(isIdentityVerificationPending(user)).toBe(false);
    });
  });

  // ============================================================================
  // Returns False - Invalid/Missing User
  // ============================================================================
  describe('returns false for invalid/missing user', () => {
    it('should return false for null user', () => {
      expect(isIdentityVerificationPending(null)).toBe(false);
    });

    it('should return false for undefined user', () => {
      expect(isIdentityVerificationPending(undefined)).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isIdentityVerificationPending({})).toBe(false);
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should handle user who just submitted verification', () => {
      const user = {
        id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        identity_submitted_at: new Date().toISOString(),
        identity_verified: false
      };
      expect(isIdentityVerificationPending(user)).toBe(true);
    });

    it('should handle user whose verification was approved', () => {
      const user = {
        id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        identity_submitted_at: '2025-01-10T10:30:00Z',
        identity_verified: true
      };
      expect(isIdentityVerificationPending(user)).toBe(false);
    });

    it('should handle new user who never submitted', () => {
      const user = {
        id: 'user456',
        firstName: 'Jane',
        email: 'jane@example.com'
      };
      expect(isIdentityVerificationPending(user)).toBe(false);
    });
  });
});
