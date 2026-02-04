/**
 * Tests for canEditProposal
 *
 * Determines if a guest can edit their proposal.
 * Based on the actions available for each status in proposalStatuses.js.
 *
 * ACTUAL BEHAVIOR: Only returns true if status has 'edit_proposal' or 'modify_proposal' action.
 * From proposalStatuses.js, ONLY the "Draft" status has 'edit_proposal' action.
 * All other statuses (Pending, Host Review, etc.) do NOT have edit actions.
 */
import { describe, it, expect } from 'vitest';
import { canEditProposal } from '../canEditProposal.js';

describe('canEditProposal', () => {
  // ============================================================================
  // Returns True - Only Draft Status Has Edit Action
  // ============================================================================
  describe('returns true (only Draft status has edit_proposal action)', () => {
    it('should return true for "Draft" status (has edit_proposal action)', () => {
      const result = canEditProposal({ proposalStatus: 'Draft' });
      expect(result).toBe(true);
    });

    it('should handle Draft status with trailing whitespace', () => {
      const result = canEditProposal({ proposalStatus: 'Draft  ' });
      expect(result).toBe(true);
    });

    it('should handle Draft status with leading whitespace', () => {
      const result = canEditProposal({ proposalStatus: '  Draft' });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Returns False - Pending Statuses (No Edit Actions)
  // ============================================================================
  describe('returns false for pending statuses (no edit_proposal action)', () => {
    it('should return false for "Pending" status', () => {
      const result = canEditProposal({ proposalStatus: 'Pending' });
      expect(result).toBe(false);
    });

    it('should return false for "Pending Confirmation" status', () => {
      const result = canEditProposal({ proposalStatus: 'Pending Confirmation' });
      expect(result).toBe(false);
    });

    it('should return false for "Proposal Submitted by guest - Awaiting Rental Application"', () => {
      const result = canEditProposal({
        proposalStatus: 'Proposal Submitted by guest - Awaiting Rental Application'
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Returns False - Host Review Statuses
  // ============================================================================
  describe('returns false for host review statuses', () => {
    it('should return false for "Host Review" status', () => {
      const result = canEditProposal({ proposalStatus: 'Host Review' });
      expect(result).toBe(false);
    });

    it('should return false for "Rental Application Submitted"', () => {
      const result = canEditProposal({
        proposalStatus: 'Rental Application Submitted'
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Returns False - Counteroffer/Accepted Statuses
  // ============================================================================
  describe('returns false for counteroffer and accepted statuses', () => {
    it('should return false for "Host Counteroffer Submitted / Awaiting Guest Review"', () => {
      const result = canEditProposal({
        proposalStatus: 'Host Counteroffer Submitted / Awaiting Guest Review'
      });
      expect(result).toBe(false);
    });

    it('should return false for "Proposal or Counteroffer Accepted / Drafting Lease Documents"', () => {
      const result = canEditProposal({
        proposalStatus: 'Proposal or Counteroffer Accepted / Drafting Lease Documents'
      });
      expect(result).toBe(false);
    });

    it('should return false for "Lease Documents Sent for Review"', () => {
      const result = canEditProposal({
        proposalStatus: 'Lease Documents Sent for Review'
      });
      expect(result).toBe(false);
    });

    it('should return false for "Lease Documents Sent for Signatures"', () => {
      const result = canEditProposal({
        proposalStatus: 'Lease Documents Sent for Signatures'
      });
      expect(result).toBe(false);
    });

    it('should return false for "Lease Documents Signed / Awaiting Initial payment"', () => {
      const result = canEditProposal({
        proposalStatus: 'Lease Documents Signed / Awaiting Initial payment'
      });
      expect(result).toBe(false);
    });

    it('should return false for "Initial Payment Submitted / Lease activated "', () => {
      const result = canEditProposal({
        proposalStatus: 'Initial Payment Submitted / Lease activated '
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Returns False - Cancelled/Rejected Statuses
  // ============================================================================
  describe('returns false for cancelled/rejected statuses', () => {
    it('should return false for "Proposal Cancelled by Guest"', () => {
      const result = canEditProposal({
        proposalStatus: 'Proposal Cancelled by Guest'
      });
      expect(result).toBe(false);
    });

    it('should return false for "Proposal Cancelled by Split Lease"', () => {
      const result = canEditProposal({
        proposalStatus: 'Proposal Cancelled by Split Lease'
      });
      expect(result).toBe(false);
    });

    it('should return false for "Proposal Rejected by Host"', () => {
      const result = canEditProposal({
        proposalStatus: 'Proposal Rejected by Host'
      });
      expect(result).toBe(false);
    });

    it('should return false for "Expired"', () => {
      const result = canEditProposal({ proposalStatus: 'Expired' });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Returns False - Deleted Proposals
  // ============================================================================
  describe('returns false for deleted proposals', () => {
    it('should return false when proposal is deleted (even Draft status)', () => {
      const result = canEditProposal({
        proposalStatus: 'Draft',
        deleted: true
      });
      expect(result).toBe(false);
    });

    it('should return true when deleted is explicitly false for Draft', () => {
      const result = canEditProposal({
        proposalStatus: 'Draft',
        deleted: false
      });
      expect(result).toBe(true);
    });

    it('should return true when deleted is undefined for Draft (defaults to false)', () => {
      const result = canEditProposal({ proposalStatus: 'Draft' });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Returns False - Invalid/Missing Status
  // ============================================================================
  describe('returns false for invalid/missing status', () => {
    it('should return false for null proposalStatus', () => {
      const result = canEditProposal({ proposalStatus: null });
      expect(result).toBe(false);
    });

    it('should return false for undefined proposalStatus', () => {
      const result = canEditProposal({ proposalStatus: undefined });
      expect(result).toBe(false);
    });

    it('should return false for empty string proposalStatus', () => {
      const result = canEditProposal({ proposalStatus: '' });
      expect(result).toBe(false);
    });

    it('should return false for whitespace-only proposalStatus', () => {
      const result = canEditProposal({ proposalStatus: '   ' });
      expect(result).toBe(false);
    });

    it('should return false for non-string proposalStatus', () => {
      const result = canEditProposal({ proposalStatus: 123 });
      expect(result).toBe(false);
    });

    it('should return false for unknown status string', () => {
      const result = canEditProposal({ proposalStatus: 'Unknown Status' });
      expect(result).toBe(false);
    });

    it('should return false for object proposalStatus', () => {
      const result = canEditProposal({ proposalStatus: {} });
      expect(result).toBe(false);
    });

    it('should return false for array proposalStatus', () => {
      const result = canEditProposal({ proposalStatus: [] });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Suggested Proposal Statuses
  // ============================================================================
  describe('suggested proposal statuses', () => {
    it('should return false for suggested proposal awaiting rental app (no edit action)', () => {
      const result = canEditProposal({
        proposalStatus: 'Proposal Submitted for guest by Split Lease - Awaiting Rental Application'
      });
      expect(result).toBe(false);
    });

    it('should return false for suggested proposal pending confirmation (no edit action)', () => {
      const result = canEditProposal({
        proposalStatus: 'Proposal Submitted for guest by Split Lease - Pending Confirmation'
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should be case-sensitive for status matching', () => {
      // Lowercase should not match the exact status
      const result = canEditProposal({ proposalStatus: 'draft' });
      expect(result).toBe(false);
    });

    it('should handle boolean deleted parameter variations', () => {
      // deleted = 0 should act as false (falsy)
      const result1 = canEditProposal({
        proposalStatus: 'Draft',
        deleted: 0
      });
      expect(result1).toBe(true);

      // deleted = 1 should act as truthy
      const result2 = canEditProposal({
        proposalStatus: 'Draft',
        deleted: 1
      });
      expect(result2).toBe(false);
    });

    it('should handle extra properties in params object', () => {
      const result = canEditProposal({
        proposalStatus: 'Draft',
        deleted: false,
        extraProp: 'ignored',
        anotherProp: 123
      });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Business Logic Verification
  // ============================================================================
  describe('business logic verification', () => {
    it('should only allow editing for Draft status (the only status with edit_proposal action)', () => {
      // Only Draft has edit_proposal action in proposalStatuses.js
      const draftResult = canEditProposal({ proposalStatus: 'Draft' });
      expect(draftResult).toBe(true);
    });

    it('should not allow editing for non-Draft early stage statuses', () => {
      const earlyStatuses = [
        'Pending',
        'Pending Confirmation',
        'Host Review',
        'Proposal Submitted by guest - Awaiting Rental Application'
      ];

      for (const status of earlyStatuses) {
        const result = canEditProposal({ proposalStatus: status });
        expect(result).toBe(false);
      }
    });

    it('should not allow editing for late stage statuses', () => {
      const lateStatuses = [
        'Proposal or Counteroffer Accepted / Drafting Lease Documents',
        'Lease Documents Sent for Review',
        'Lease Documents Sent for Signatures',
        'Lease Documents Signed / Awaiting Initial payment',
        'Initial Payment Submitted / Lease activated '
      ];

      for (const status of lateStatuses) {
        const result = canEditProposal({ proposalStatus: status });
        expect(result).toBe(false);
      }
    });

    it('should not allow editing for terminal statuses', () => {
      const terminalStatuses = [
        'Proposal Cancelled by Guest',
        'Proposal Cancelled by Split Lease',
        'Proposal Rejected by Host',
        'Expired'
      ];

      for (const status of terminalStatuses) {
        const result = canEditProposal({ proposalStatus: status });
        expect(result).toBe(false);
      }
    });
  });

  // ============================================================================
  // Input Object Validation
  // ============================================================================
  describe('input object validation', () => {
    it('should throw error for missing params object', () => {
      // The function uses destructuring which throws when called without argument
      expect(() => canEditProposal()).toThrow();
    });

    it('should handle empty params object', () => {
      const result = canEditProposal({});
      expect(result).toBe(false);
    });
  });
});
