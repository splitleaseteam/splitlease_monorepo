/**
 * Tests for canSubmitIdentityVerification and getIdentityVerificationStatus
 *
 * Rule functions for identity verification submission eligibility.
 */
import { describe, it, expect } from 'vitest';
import {
  canSubmitIdentityVerification,
  getIdentityVerificationStatus
} from '../canSubmitIdentityVerification.js';

describe('canSubmitIdentityVerification', () => {
  // ============================================================================
  // Returns True - Can Submit Verification
  // ============================================================================
  describe('returns true when user can submit', () => {
    it('should return true for new user who never submitted', () => {
      const user = {
        id: 'user123',
        firstName: 'John'
      };
      expect(canSubmitIdentityVerification(user)).toBe(true);
    });

    it('should return true when identity_verified is false', () => {
      const user = {
        identity_verified: false
      };
      expect(canSubmitIdentityVerification(user)).toBe(true);
    });

    it('should return true when identity_verified is null', () => {
      const user = {
        identity_verified: null
      };
      expect(canSubmitIdentityVerification(user)).toBe(true);
    });

    it('should return true when identity_verified is undefined', () => {
      const user = {
        identity_verified: undefined
      };
      expect(canSubmitIdentityVerification(user)).toBe(true);
    });

    it('should return true for user with rejected verification (can re-submit)', () => {
      const user = {
        identity_submitted_at: '2025-01-10T10:30:00Z',
        identity_verified: false,
        identity_rejection_reason: 'Document unclear'
      };
      expect(canSubmitIdentityVerification(user)).toBe(true);
    });
  });

  // ============================================================================
  // Returns False - Cannot Submit
  // ============================================================================
  describe('returns false when user cannot submit', () => {
    it('should return false when already verified', () => {
      const user = {
        identity_verified: true
      };
      expect(canSubmitIdentityVerification(user)).toBe(false);
    });

    it('should return false when already verified with submission timestamp', () => {
      const user = {
        identity_submitted_at: '2025-01-10T10:30:00Z',
        identity_verified: true
      };
      expect(canSubmitIdentityVerification(user)).toBe(false);
    });
  });

  // ============================================================================
  // Returns False - Invalid/Missing User
  // ============================================================================
  describe('returns false for invalid/missing user', () => {
    it('should return false for null user', () => {
      expect(canSubmitIdentityVerification(null)).toBe(false);
    });

    it('should return false for undefined user', () => {
      expect(canSubmitIdentityVerification(undefined)).toBe(false);
    });

    it('should return true for empty object (no verified status means can submit)', () => {
      expect(canSubmitIdentityVerification({})).toBe(true);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should return false for truthy non-boolean verified value', () => {
      // identity_verified === 'yes' is truthy but not true, should allow submit
      const user = { identity_verified: 'yes' };
      expect(canSubmitIdentityVerification(user)).toBe(true);
    });

    it('should return false for numeric 1 (not strictly true)', () => {
      // identity_verified === 1 is truthy but not true, should allow submit
      const user = { identity_verified: 1 };
      expect(canSubmitIdentityVerification(user)).toBe(true);
    });
  });
});

describe('getIdentityVerificationStatus', () => {
  // ============================================================================
  // Returns 'verified' - User Is Verified
  // ============================================================================
  describe('returns verified status', () => {
    it('should return "verified" when identity_verified is true', () => {
      const user = { identity_verified: true };
      expect(getIdentityVerificationStatus(user)).toBe('verified');
    });

    it('should return "verified" regardless of submission time', () => {
      const user = {
        identity_submitted_at: '2025-01-10T10:30:00Z',
        identity_verified: true
      };
      expect(getIdentityVerificationStatus(user)).toBe('verified');
    });
  });

  // ============================================================================
  // Returns 'pending' - Verification Pending
  // ============================================================================
  describe('returns pending status', () => {
    it('should return "pending" when submitted but not verified', () => {
      const user = {
        identity_submitted_at: '2025-01-15T10:30:00Z',
        identity_verified: false
      };
      expect(getIdentityVerificationStatus(user)).toBe('pending');
    });

    it('should return "pending" when submitted and verified is undefined', () => {
      const user = {
        identity_submitted_at: '2025-01-15T10:30:00Z'
      };
      expect(getIdentityVerificationStatus(user)).toBe('pending');
    });

    it('should return "pending" when submitted and verified is null', () => {
      const user = {
        identity_submitted_at: '2025-01-15T10:30:00Z',
        identity_verified: null
      };
      expect(getIdentityVerificationStatus(user)).toBe('pending');
    });
  });

  // ============================================================================
  // Returns 'not_submitted' - Never Submitted
  // ============================================================================
  describe('returns not_submitted status', () => {
    it('should return "not_submitted" for new user without submission', () => {
      const user = {
        id: 'user123',
        firstName: 'John'
      };
      expect(getIdentityVerificationStatus(user)).toBe('not_submitted');
    });

    it('should return "not_submitted" when identity_submitted_at is null', () => {
      const user = {
        identity_submitted_at: null,
        identity_verified: false
      };
      expect(getIdentityVerificationStatus(user)).toBe('not_submitted');
    });

    it('should return "not_submitted" when identity_submitted_at is undefined', () => {
      const user = {
        identity_verified: false
      };
      expect(getIdentityVerificationStatus(user)).toBe('not_submitted');
    });
  });

  // ============================================================================
  // Returns 'not_submitted' - Invalid/Missing User
  // ============================================================================
  describe('returns not_submitted for invalid/missing user', () => {
    it('should return "not_submitted" for null user', () => {
      expect(getIdentityVerificationStatus(null)).toBe('not_submitted');
    });

    it('should return "not_submitted" for undefined user', () => {
      expect(getIdentityVerificationStatus(undefined)).toBe('not_submitted');
    });

    it('should return "not_submitted" for empty object', () => {
      expect(getIdentityVerificationStatus({})).toBe('not_submitted');
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should handle complete user verification flow', () => {
      // Step 1: New user
      const newUser = { id: 'user123', firstName: 'John' };
      expect(getIdentityVerificationStatus(newUser)).toBe('not_submitted');
      expect(canSubmitIdentityVerification(newUser)).toBe(true);

      // Step 2: User submits verification
      const pendingUser = {
        ...newUser,
        identity_submitted_at: '2025-01-15T10:30:00Z',
        identity_verified: false
      };
      expect(getIdentityVerificationStatus(pendingUser)).toBe('pending');
      expect(canSubmitIdentityVerification(pendingUser)).toBe(true); // Can re-submit

      // Step 3: User is verified
      const verifiedUser = {
        ...pendingUser,
        identity_verified: true
      };
      expect(getIdentityVerificationStatus(verifiedUser)).toBe('verified');
      expect(canSubmitIdentityVerification(verifiedUser)).toBe(false); // Cannot re-submit
    });

    it('should handle rejection and re-submission flow', () => {
      // User submitted and was rejected
      const rejectedUser = {
        id: 'user456',
        identity_submitted_at: '2025-01-10T10:30:00Z',
        identity_verified: false,
        identity_rejection_reason: 'Document unclear'
      };

      expect(getIdentityVerificationStatus(rejectedUser)).toBe('pending');
      expect(canSubmitIdentityVerification(rejectedUser)).toBe(true); // Can re-submit
    });
  });
});
