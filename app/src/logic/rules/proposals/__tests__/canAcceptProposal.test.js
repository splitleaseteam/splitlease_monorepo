/**
 * Tests for canAcceptProposal
 *
 * Determines if a guest can accept a proposal (or host counteroffer).
 * Guest can only accept when host has countered (Stage 2).
 */
import { describe, it, expect } from 'vitest';
import { canAcceptProposal } from '../canAcceptProposal.js';
import { PROPOSAL_STATUSES } from '../../../constants/proposalStatuses.js';

describe('canAcceptProposal', () => {
  // ============================================================================
  // Happy Path - Returns True
  // ============================================================================
  describe('returns true when guest can accept', () => {
    it('should return true for "Host Counteroffer Submitted / Awaiting Guest Review" status', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.COUNTEROFFER_SUBMITTED_AWAITING_GUEST_REVIEW.key
      });
      expect(result).toBe(true);
    });

    it('should return true for status with trailing whitespace', () => {
      const result = canAcceptProposal({
        proposalStatus: 'Host Counteroffer Submitted / Awaiting Guest Review  '
      });
      expect(result).toBe(true);
    });

    it('should return true for status with leading whitespace', () => {
      const result = canAcceptProposal({
        proposalStatus: '  Host Counteroffer Submitted / Awaiting Guest Review'
      });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Returns False - Waiting Statuses
  // ============================================================================
  describe('returns false for waiting statuses', () => {
    it('should return false for "Pending" status', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.PENDING.key
      });
      expect(result).toBe(false);
    });

    it('should return false for "Pending Confirmation" status', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.PENDING_CONFIRMATION.key
      });
      expect(result).toBe(false);
    });

    it('should return false for "Host Review" status', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.HOST_REVIEW.key
      });
      expect(result).toBe(false);
    });

    it('should return false for "Rental Application Submitted" status', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.RENTAL_APP_SUBMITTED.key
      });
      expect(result).toBe(false);
    });

    it('should return false for "Proposal Submitted by guest - Awaiting Rental Application" status', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.PROPOSAL_SUBMITTED_AWAITING_RENTAL_APP.key
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Returns False - Already Accepted/Completed Statuses
  // ============================================================================
  describe('returns false for already accepted/completed statuses', () => {
    it('should return false for "Proposal or Counteroffer Accepted / Drafting Lease Documents" status', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.PROPOSAL_OR_COUNTEROFFER_ACCEPTED.key
      });
      expect(result).toBe(false);
    });

    it('should return false for "Lease Documents Sent for Review" status', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.LEASE_DOCUMENTS_SENT_FOR_REVIEW.key
      });
      expect(result).toBe(false);
    });

    it('should return false for "Lease Documents Sent for Signatures" status', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.LEASE_DOCUMENTS_SENT_FOR_SIGNATURES.key
      });
      expect(result).toBe(false);
    });

    it('should return false for "Lease Documents Signed / Awaiting Initial payment" status', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.LEASE_DOCUMENTS_SIGNED_AWAITING_PAYMENT.key
      });
      expect(result).toBe(false);
    });

    it('should return false for "Initial Payment Submitted / Lease activated " status', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.INITIAL_PAYMENT_SUBMITTED_LEASE_ACTIVATED.key
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Returns False - Cancelled/Rejected Statuses
  // ============================================================================
  describe('returns false for cancelled/rejected statuses', () => {
    it('should return false for "Proposal Cancelled by Guest" status', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.CANCELLED_BY_GUEST.key
      });
      expect(result).toBe(false);
    });

    it('should return false for "Proposal Cancelled by Split Lease" status', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.CANCELLED_BY_SPLITLEASE.key
      });
      expect(result).toBe(false);
    });

    it('should return false for "Proposal Rejected by Host" status', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.REJECTED_BY_HOST.key
      });
      expect(result).toBe(false);
    });

    it('should return false for "Expired" status', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.EXPIRED.key
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Returns False - Deleted Proposals
  // ============================================================================
  describe('returns false for deleted proposals', () => {
    it('should return false when proposal is deleted', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.COUNTEROFFER_SUBMITTED_AWAITING_GUEST_REVIEW.key,
        deleted: true
      });
      expect(result).toBe(false);
    });

    it('should return false when deleted is true regardless of status', () => {
      const statuses = [
        PROPOSAL_STATUSES.PENDING.key,
        PROPOSAL_STATUSES.HOST_REVIEW.key,
        PROPOSAL_STATUSES.COUNTEROFFER_SUBMITTED_AWAITING_GUEST_REVIEW.key
      ];

      for (const status of statuses) {
        const result = canAcceptProposal({
          proposalStatus: status,
          deleted: true
        });
        expect(result).toBe(false);
      }
    });

    it('should return true when deleted is explicitly false', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.COUNTEROFFER_SUBMITTED_AWAITING_GUEST_REVIEW.key,
        deleted: false
      });
      expect(result).toBe(true);
    });

    it('should return true when deleted is undefined (defaults to false)', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.COUNTEROFFER_SUBMITTED_AWAITING_GUEST_REVIEW.key
      });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Returns False - Invalid/Missing Status
  // ============================================================================
  describe('returns false for invalid/missing status', () => {
    it('should return false for null proposalStatus', () => {
      const result = canAcceptProposal({ proposalStatus: null });
      expect(result).toBe(false);
    });

    it('should return false for undefined proposalStatus', () => {
      const result = canAcceptProposal({ proposalStatus: undefined });
      expect(result).toBe(false);
    });

    it('should return false for empty string proposalStatus', () => {
      const result = canAcceptProposal({ proposalStatus: '' });
      expect(result).toBe(false);
    });

    it('should return false for whitespace-only proposalStatus', () => {
      const result = canAcceptProposal({ proposalStatus: '   ' });
      expect(result).toBe(false);
    });

    it('should return false for non-string proposalStatus', () => {
      const result = canAcceptProposal({ proposalStatus: 123 });
      expect(result).toBe(false);
    });

    it('should return false for unknown status string', () => {
      const result = canAcceptProposal({ proposalStatus: 'Unknown Status' });
      expect(result).toBe(false);
    });

    it('should return false for object proposalStatus', () => {
      const result = canAcceptProposal({ proposalStatus: {} });
      expect(result).toBe(false);
    });

    it('should return false for array proposalStatus', () => {
      const result = canAcceptProposal({ proposalStatus: [] });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Suggested Proposal Statuses
  // ============================================================================
  describe('suggested proposal statuses', () => {
    it('should return false for suggested proposal awaiting rental app', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.SUGGESTED_PROPOSAL_AWAITING_RENTAL_APP.key
      });
      expect(result).toBe(false);
    });

    it('should return false for suggested proposal pending confirmation', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.SUGGESTED_PROPOSAL_PENDING_CONFIRMATION.key
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Document Review Statuses
  // ============================================================================
  describe('document review statuses', () => {
    it('should return false for "Reviewing Documents" status', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.REVIEWING_DOCUMENTS.key
      });
      expect(result).toBe(false);
    });

    it('should return false for "Draft" status', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.DRAFT.key
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle case sensitivity (should be case-sensitive)', () => {
      // The actual status is case-sensitive
      const result = canAcceptProposal({
        proposalStatus: 'host counteroffer submitted / awaiting guest review'
      });
      expect(result).toBe(false);
    });

    it('should handle status with extra internal whitespace', () => {
      // This should not match due to different internal spacing
      const result = canAcceptProposal({
        proposalStatus: 'Host  Counteroffer  Submitted  /  Awaiting  Guest  Review'
      });
      expect(result).toBe(false);
    });

    it('should handle boolean deleted parameter variations', () => {
      // deleted = 0 should act as false
      const result1 = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.COUNTEROFFER_SUBMITTED_AWAITING_GUEST_REVIEW.key,
        deleted: 0
      });
      expect(result1).toBe(true);

      // deleted = 1 should act as truthy
      const result2 = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.COUNTEROFFER_SUBMITTED_AWAITING_GUEST_REVIEW.key,
        deleted: 1
      });
      expect(result2).toBe(false);
    });
  });

  // ============================================================================
  // Business Logic Verification
  // ============================================================================
  describe('business logic verification', () => {
    it('should only allow acceptance for counteroffer status', () => {
      const allStatuses = Object.values(PROPOSAL_STATUSES);
      const acceptableStatuses = allStatuses.filter(status =>
        canAcceptProposal({ proposalStatus: status.key })
      );

      // Only one status should be acceptable
      expect(acceptableStatuses).toHaveLength(1);
      expect(acceptableStatuses[0].key).toBe(
        PROPOSAL_STATUSES.COUNTEROFFER_SUBMITTED_AWAITING_GUEST_REVIEW.key
      );
    });

    it('should not allow guest to accept their own pending proposal', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.PENDING.key
      });
      expect(result).toBe(false);
    });

    it('should not allow acceptance of already accepted proposal', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.PROPOSAL_OR_COUNTEROFFER_ACCEPTED.key
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Input Object Validation
  // ============================================================================
  describe('input object validation', () => {
    it('should work with extra properties in params object', () => {
      const result = canAcceptProposal({
        proposalStatus: PROPOSAL_STATUSES.COUNTEROFFER_SUBMITTED_AWAITING_GUEST_REVIEW.key,
        deleted: false,
        extraProp: 'ignored'
      });
      expect(result).toBe(true);
    });

    it('should throw error for missing params object', () => {
      // The function uses destructuring { proposalStatus }
      // which throws when called without an argument
      expect(() => canAcceptProposal()).toThrow();
    });

    it('should handle empty params object', () => {
      const result = canAcceptProposal({});
      expect(result).toBe(false);
    });
  });
});
