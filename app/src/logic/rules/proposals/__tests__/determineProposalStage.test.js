/**
 * Tests for determineProposalStage
 *
 * Maps proposal status to visual progress tracker stage (1-6).
 *
 * Actual Stage Mappings (from proposalStatuses.js):
 * Stage 1: Proposal Sent / Pending / Draft (default fallback)
 * Stage 2: Rental Application Submitted
 * Stage 3: Host Review / Host Countered
 * Stage 4: Accepted / Reviewing Documents / Lease Sent for Review
 * Stage 5: Lease Documents Sent for Signatures
 * Stage 6: Lease Signed / Payment / Cancelled (terminal with red color)
 *
 * Note: statuses with stage: null and NOT terminal return 1 (fallback)
 */
import { describe, it, expect } from 'vitest';
import { determineProposalStage } from '../determineProposalStage.js';

describe('determineProposalStage', () => {
  // ============================================================================
  // Stage 1: Proposal Sent (Initial / Default Fallback)
  // ============================================================================
  describe('Stage 1: Proposal Sent', () => {
    it('should return 1 for "Pending" status', () => {
      const result = determineProposalStage({ proposalStatus: 'Pending' });
      expect(result).toBe(1);
    });

    it('should return 1 for "Pending Confirmation" status', () => {
      const result = determineProposalStage({ proposalStatus: 'Pending Confirmation' });
      expect(result).toBe(1);
    });

    it('should return 1 for "Draft" status (stage: null, fallback)', () => {
      const result = determineProposalStage({ proposalStatus: 'Draft' });
      expect(result).toBe(1);
    });

    it('should return 1 for "Proposal Submitted by guest - Awaiting Rental Application"', () => {
      const result = determineProposalStage({
        proposalStatus: 'Proposal Submitted by guest - Awaiting Rental Application'
      });
      expect(result).toBe(1);
    });

    it('should return 1 for suggested proposal statuses', () => {
      expect(determineProposalStage({
        proposalStatus: 'Proposal Submitted for guest by Split Lease - Awaiting Rental Application'
      })).toBe(1);

      expect(determineProposalStage({
        proposalStatus: 'Proposal Submitted for guest by Split Lease - Pending Confirmation'
      })).toBe(1);
    });

    it('should return 1 for VM statuses (not in config, fallback)', () => {
      // VM statuses are not defined in PROPOSAL_STATUSES, so stage is null, fallback to 1
      expect(determineProposalStage({ proposalStatus: 'VM Requested' })).toBe(1);
      expect(determineProposalStage({ proposalStatus: 'VM Confirmed' })).toBe(1);
      expect(determineProposalStage({ proposalStatus: 'Virtual Meeting Scheduled' })).toBe(1);
    });

    it('should return 1 for unknown statuses (fallback)', () => {
      const result = determineProposalStage({
        proposalStatus: 'Some Unknown Status'
      });
      expect(result).toBe(1);
    });

    it('should return 1 for "Expired" status (stage: null, not terminal by color)', () => {
      // Expired has stage: null and color: 'gray', not 'red'
      // So isTerminalStatus returns false, falls back to 1
      const result = determineProposalStage({ proposalStatus: 'Expired' });
      expect(result).toBe(1);
    });

    it('should return 1 for "Completed" status (unknown, fallback)', () => {
      // "Completed" is not defined in PROPOSAL_STATUSES
      const result = determineProposalStage({ proposalStatus: 'Completed' });
      expect(result).toBe(1);
    });
  });

  // ============================================================================
  // Stage 2: Rental Application Submitted
  // ============================================================================
  describe('Stage 2: Rental Application Submitted', () => {
    it('should return 2 for "Rental Application Submitted"', () => {
      const result = determineProposalStage({
        proposalStatus: 'Rental Application Submitted'
      });
      expect(result).toBe(2);
    });
  });

  // ============================================================================
  // Stage 3: Host Review / Host Countered
  // ============================================================================
  describe('Stage 3: Host Review / Host Countered', () => {
    it('should return 3 for "Host Review" status', () => {
      const result = determineProposalStage({ proposalStatus: 'Host Review' });
      expect(result).toBe(3);
    });

    it('should return 3 for "Host Counteroffer Submitted / Awaiting Guest Review"', () => {
      const result = determineProposalStage({
        proposalStatus: 'Host Counteroffer Submitted / Awaiting Guest Review'
      });
      expect(result).toBe(3);
    });
  });

  // ============================================================================
  // Stage 4: Accepted / Reviewing Documents
  // ============================================================================
  describe('Stage 4: Accepted / Reviewing Documents', () => {
    it('should return 4 for "Proposal or Counteroffer Accepted / Drafting Lease Documents"', () => {
      const result = determineProposalStage({
        proposalStatus: 'Proposal or Counteroffer Accepted / Drafting Lease Documents'
      });
      expect(result).toBe(4);
    });

    it('should return 4 for "Lease Documents Sent for Review"', () => {
      const result = determineProposalStage({
        proposalStatus: 'Lease Documents Sent for Review'
      });
      expect(result).toBe(4);
    });

    it('should return 4 for "Reviewing Documents"', () => {
      const result = determineProposalStage({
        proposalStatus: 'Reviewing Documents'
      });
      expect(result).toBe(4);
    });
  });

  // ============================================================================
  // Stage 5: Lease Documents Sent for Signatures
  // ============================================================================
  describe('Stage 5: Lease Documents Sent for Signatures', () => {
    it('should return 5 for "Lease Documents Sent for Signatures"', () => {
      const result = determineProposalStage({
        proposalStatus: 'Lease Documents Sent for Signatures'
      });
      expect(result).toBe(5);
    });
  });

  // ============================================================================
  // Stage 6: Lease Signed / Payment / Cancelled (Terminal)
  // ============================================================================
  describe('Stage 6: Lease Signed / Payment / Cancelled', () => {
    it('should return 6 for "Lease Documents Signed / Awaiting Initial payment"', () => {
      const result = determineProposalStage({
        proposalStatus: 'Lease Documents Signed / Awaiting Initial payment'
      });
      expect(result).toBe(6);
    });

    it('should return 6 for "Lease Signed / Awaiting Initial Payment"', () => {
      const result = determineProposalStage({
        proposalStatus: 'Lease Signed / Awaiting Initial Payment'
      });
      expect(result).toBe(6);
    });

    it('should return 6 for "Initial Payment Submitted / Lease activated " (note trailing space)', () => {
      const result = determineProposalStage({
        proposalStatus: 'Initial Payment Submitted / Lease activated '
      });
      expect(result).toBe(6);
    });

    it('should return 6 for "Proposal Cancelled by Guest" (terminal)', () => {
      const result = determineProposalStage({
        proposalStatus: 'Proposal Cancelled by Guest'
      });
      expect(result).toBe(6);
    });

    it('should return 6 for "Proposal Cancelled by Split Lease" (terminal)', () => {
      const result = determineProposalStage({
        proposalStatus: 'Proposal Cancelled by Split Lease'
      });
      expect(result).toBe(6);
    });

    it('should return 6 for "Proposal Rejected by Host" (terminal)', () => {
      const result = determineProposalStage({
        proposalStatus: 'Proposal Rejected by Host'
      });
      expect(result).toBe(6);
    });

    it('should return 6 for deleted proposals regardless of status', () => {
      const result = determineProposalStage({
        proposalStatus: 'Pending',
        deleted: true
      });
      expect(result).toBe(6);
    });
  });

  // ============================================================================
  // Whitespace Handling
  // ============================================================================
  describe('whitespace handling', () => {
    it('should handle status with leading whitespace', () => {
      const result = determineProposalStage({ proposalStatus: '  Pending' });
      expect(result).toBe(1);
    });

    it('should handle status with trailing whitespace', () => {
      const result = determineProposalStage({ proposalStatus: 'Pending  ' });
      expect(result).toBe(1);
    });

    it('should handle status with both leading and trailing whitespace', () => {
      const result = determineProposalStage({ proposalStatus: '  Pending  ' });
      expect(result).toBe(1);
    });

    it('should return 1 for whitespace-only status (fallback after trim)', () => {
      // Whitespace-only is technically a string, trims to '', unknown returns 1
      const result = determineProposalStage({ proposalStatus: '   ' });
      expect(result).toBe(1);
    });
  });

  // ============================================================================
  // Error Handling
  // ============================================================================
  describe('error handling', () => {
    it('should throw error for null proposalStatus', () => {
      expect(() => determineProposalStage({ proposalStatus: null })).toThrow(
        'determineProposalStage: proposalStatus is required and must be a string'
      );
    });

    it('should throw error for undefined proposalStatus', () => {
      expect(() => determineProposalStage({ proposalStatus: undefined })).toThrow(
        'determineProposalStage: proposalStatus is required and must be a string'
      );
    });

    it('should throw error for empty string proposalStatus', () => {
      expect(() => determineProposalStage({ proposalStatus: '' })).toThrow(
        'determineProposalStage: proposalStatus is required and must be a string'
      );
    });

    it('should throw error for non-string proposalStatus', () => {
      expect(() => determineProposalStage({ proposalStatus: 123 })).toThrow(
        'determineProposalStage: proposalStatus is required and must be a string'
      );
    });

    it('should throw error for object proposalStatus', () => {
      expect(() => determineProposalStage({ proposalStatus: {} })).toThrow();
    });

    it('should throw error for array proposalStatus', () => {
      expect(() => determineProposalStage({ proposalStatus: [] })).toThrow();
    });
  });

  // ============================================================================
  // Deleted Flag Behavior
  // ============================================================================
  describe('deleted flag behavior', () => {
    it('should return 6 when deleted is true regardless of status', () => {
      const allStages = [
        'Pending',
        'Rental Application Submitted',
        'Host Review',
        'Proposal or Counteroffer Accepted / Drafting Lease Documents',
        'Lease Documents Sent for Signatures'
      ];

      for (const status of allStages) {
        const result = determineProposalStage({
          proposalStatus: status,
          deleted: true
        });
        expect(result).toBe(6);
      }
    });

    it('should respect status when deleted is false', () => {
      const result = determineProposalStage({
        proposalStatus: 'Pending',
        deleted: false
      });
      expect(result).toBe(1);
    });

    it('should respect status when deleted is undefined', () => {
      const result = determineProposalStage({ proposalStatus: 'Pending' });
      expect(result).toBe(1);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should be case-sensitive for status matching', () => {
      // Lowercase 'pending' should be treated as unknown -> default to 1
      const result = determineProposalStage({ proposalStatus: 'pending' });
      expect(result).toBe(1);
    });

    it('should handle status with extra internal whitespace', () => {
      // Status with different internal spacing might not match
      const result = determineProposalStage({
        proposalStatus: 'Host  Counteroffer  Submitted'
      });
      // Unknown status defaults to 1
      expect(result).toBe(1);
    });

    it('should throw error for missing params object', () => {
      expect(() => determineProposalStage()).toThrow();
    });

    it('should throw error for empty params object', () => {
      expect(() => determineProposalStage({})).toThrow();
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should progress through typical happy path', () => {
      // Guest submits proposal
      expect(determineProposalStage({
        proposalStatus: 'Proposal Submitted by guest - Awaiting Rental Application'
      })).toBe(1);

      // Rental app submitted
      expect(determineProposalStage({
        proposalStatus: 'Rental Application Submitted'
      })).toBe(2);

      // Host reviews
      expect(determineProposalStage({
        proposalStatus: 'Host Review'
      })).toBe(3);

      // Accepted
      expect(determineProposalStage({
        proposalStatus: 'Proposal or Counteroffer Accepted / Drafting Lease Documents'
      })).toBe(4);

      // Lease documents sent for signatures
      expect(determineProposalStage({
        proposalStatus: 'Lease Documents Sent for Signatures'
      })).toBe(5);

      // Payment pending / Activated
      expect(determineProposalStage({
        proposalStatus: 'Lease Documents Signed / Awaiting Initial payment'
      })).toBe(6);
    });

    it('should handle counteroffer flow', () => {
      // Host counters
      expect(determineProposalStage({
        proposalStatus: 'Host Counteroffer Submitted / Awaiting Guest Review'
      })).toBe(3);
    });

    it('should handle cancellation (terminal)', () => {
      expect(determineProposalStage({
        proposalStatus: 'Proposal Cancelled by Guest'
      })).toBe(6);

      expect(determineProposalStage({
        proposalStatus: 'Proposal Rejected by Host'
      })).toBe(6);
    });

    it('should return valid stage numbers (1-6)', () => {
      const allStatuses = [
        'Pending',
        'Pending Confirmation',
        'Rental Application Submitted',
        'Host Review',
        'Host Counteroffer Submitted / Awaiting Guest Review',
        'Proposal or Counteroffer Accepted / Drafting Lease Documents',
        'Lease Documents Sent for Review',
        'Lease Documents Sent for Signatures',
        'Lease Documents Signed / Awaiting Initial payment',
        'Proposal Cancelled by Guest',
        'Expired',
        'Unknown Status'
      ];

      for (const status of allStatuses) {
        const result = determineProposalStage({ proposalStatus: status });
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
      }
    });
  });
});
