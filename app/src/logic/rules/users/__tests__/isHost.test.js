/**
 * Tests for isHost
 *
 * Determine if a user type indicates Host privileges.
 * Host types: "A Host (I have a space available to rent)", "Trial Host", "Split Lease"
 */
import { describe, it, expect } from 'vitest';
import { isHost } from '../isHost.js';

describe('isHost', () => {
  // ============================================================================
  // Happy Path - Host Types
  // ============================================================================
  describe('host types', () => {
    it('should return true for "A Host (I have a space available to rent)"', () => {
      expect(isHost({ userType: 'A Host (I have a space available to rent)' })).toBe(true);
    });

    it('should return true for "Trial Host"', () => {
      expect(isHost({ userType: 'Trial Host' })).toBe(true);
    });

    it('should return true for "Split Lease" (internal user)', () => {
      expect(isHost({ userType: 'Split Lease' })).toBe(true);
    });

    it('should return true for any string containing "Host"', () => {
      expect(isHost({ userType: 'Host' })).toBe(true);
      expect(isHost({ userType: 'SuperHost' })).toBe(true);
      expect(isHost({ userType: 'HostManager' })).toBe(true);
    });
  });

  // ============================================================================
  // Non-Host Types
  // ============================================================================
  describe('non-host types', () => {
    it('should return false for "A Guest (I would like to rent a space)"', () => {
      expect(isHost({ userType: 'A Guest (I would like to rent a space)' })).toBe(false);
    });

    it('should return false for guest-only types', () => {
      expect(isHost({ userType: 'Guest' })).toBe(false);
    });

    it('should return false for "Admin"', () => {
      expect(isHost({ userType: 'Admin' })).toBe(false);
    });

    it('should return false for types without "Host"', () => {
      expect(isHost({ userType: 'Regular User' })).toBe(false);
    });
  });

  // ============================================================================
  // Invalid Inputs
  // ============================================================================
  describe('invalid inputs', () => {
    it('should return false for null userType', () => {
      expect(isHost({ userType: null })).toBe(false);
    });

    it('should return false for undefined userType', () => {
      expect(isHost({ userType: undefined })).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isHost({ userType: '' })).toBe(false);
    });

    it('should return false for non-string userType (number)', () => {
      expect(isHost({ userType: 123 })).toBe(false);
    });

    it('should return false for non-string userType (boolean)', () => {
      expect(isHost({ userType: true })).toBe(false);
    });

    it('should return false for non-string userType (object)', () => {
      expect(isHost({ userType: { type: 'Host' } })).toBe(false);
    });

    it('should return false for non-string userType (array)', () => {
      expect(isHost({ userType: ['Host'] })).toBe(false);
    });
  });

  // ============================================================================
  // Whitespace Handling
  // ============================================================================
  describe('whitespace handling', () => {
    it('should handle leading whitespace', () => {
      expect(isHost({ userType: '  A Host (I have a space available to rent)' })).toBe(true);
    });

    it('should handle trailing whitespace', () => {
      expect(isHost({ userType: 'A Host (I have a space available to rent)  ' })).toBe(true);
    });

    it('should handle Trial Host with whitespace', () => {
      expect(isHost({ userType: '  Trial Host  ' })).toBe(true);
    });

    it('should handle Split Lease with whitespace', () => {
      expect(isHost({ userType: '  Split Lease  ' })).toBe(true);
    });

    it('should return false for whitespace-only string', () => {
      expect(isHost({ userType: '   ' })).toBe(false);
    });
  });

  // ============================================================================
  // Case Sensitivity
  // ============================================================================
  describe('case sensitivity', () => {
    it('should be case-sensitive for "Host"', () => {
      expect(isHost({ userType: 'A HOST' })).toBe(false);
      expect(isHost({ userType: 'A host' })).toBe(false);
      expect(isHost({ userType: 'A Host' })).toBe(true);
    });

    it('should be case-sensitive for "Split Lease"', () => {
      expect(isHost({ userType: 'split lease' })).toBe(false);
      expect(isHost({ userType: 'SPLIT LEASE' })).toBe(false);
      expect(isHost({ userType: 'Split Lease' })).toBe(true);
    });

    it('should be case-sensitive for "Trial Host"', () => {
      expect(isHost({ userType: 'trial host' })).toBe(false);
      expect(isHost({ userType: 'TRIAL HOST' })).toBe(false);
      expect(isHost({ userType: 'Trial Host' })).toBe(true);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle partial matches', () => {
      expect(isHost({ userType: 'HostManager' })).toBe(true);
      expect(isHost({ userType: 'MyHost' })).toBe(true);
    });

    it('should return false for "host" lowercase', () => {
      expect(isHost({ userType: 'host' })).toBe(false);
    });

    it('should handle user type with special characters', () => {
      expect(isHost({ userType: 'Host@Test' })).toBe(true);
      expect(isHost({ userType: 'Host-123' })).toBe(true);
    });

    it('should handle very long strings', () => {
      const longType = 'A' + 'B'.repeat(1000) + 'Host' + 'C'.repeat(1000);
      expect(isHost({ userType: longType })).toBe(true);
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should identify regular host user', () => {
      expect(isHost({ userType: 'A Host (I have a space available to rent)' })).toBe(true);
    });

    it('should identify trial host', () => {
      expect(isHost({ userType: 'Trial Host' })).toBe(true);
    });

    it('should identify Split Lease admin as host', () => {
      // Split Lease internal users have both Host and Guest privileges
      expect(isHost({ userType: 'Split Lease' })).toBe(true);
    });

    it('should not identify guest as host', () => {
      expect(isHost({ userType: 'A Guest (I would like to rent a space)' })).toBe(false);
    });

    it('should handle unauthenticated user', () => {
      expect(isHost({ userType: null })).toBe(false);
    });
  });

  // ============================================================================
  // Split Lease User Verification
  // ============================================================================
  describe('Split Lease user (dual privileges)', () => {
    it('should be identified as Host', () => {
      expect(isHost({ userType: 'Split Lease' })).toBe(true);
    });

    it('should have strict matching (not partial)', () => {
      expect(isHost({ userType: 'Split Lease Admin' })).toBe(false);
      expect(isHost({ userType: 'MySplit Lease' })).toBe(false);
    });
  });
});
