/**
 * Tests for isWithinBudget
 *
 * Check if listing price is within acceptable budget range.
 * Uses configurable threshold (default 50% above budget).
 */
import { describe, it, expect } from 'vitest';
import { isWithinBudget } from '../isWithinBudget.js';

describe('isWithinBudget', () => {
  // ============================================================================
  // Returns True - Within Budget (Default 50% Threshold)
  // ============================================================================
  describe('returns true when within default 50% threshold', () => {
    it('should return true when candidate is same as proposal rate', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 100,
        proposalNightlyRate: 100
      });
      expect(result).toBe(true);
    });

    it('should return true when candidate is under proposal rate', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 80,
        proposalNightlyRate: 100
      });
      expect(result).toBe(true);
    });

    it('should return true when exactly 50% over budget', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 150,
        proposalNightlyRate: 100
      });
      expect(result).toBe(true);
    });

    it('should return true when 25% over budget', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 125,
        proposalNightlyRate: 100
      });
      expect(result).toBe(true);
    });

    it('should return true when 49% over budget', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 149,
        proposalNightlyRate: 100
      });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Returns False - Over Budget (Default 50% Threshold)
  // ============================================================================
  describe('returns false when over default 50% threshold', () => {
    it('should return false when 51% over budget', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 151,
        proposalNightlyRate: 100
      });
      expect(result).toBe(false);
    });

    it('should return false when 60% over budget', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 160,
        proposalNightlyRate: 100
      });
      expect(result).toBe(false);
    });

    it('should return false when double the budget', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 200,
        proposalNightlyRate: 100
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Custom Threshold Tests
  // ============================================================================
  describe('custom threshold behavior', () => {
    it('should return true within custom 25% threshold', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 125,
        proposalNightlyRate: 100,
        maxOverBudgetPercent: 0.25
      });
      expect(result).toBe(true);
    });

    it('should return false over custom 25% threshold', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 126,
        proposalNightlyRate: 100,
        maxOverBudgetPercent: 0.25
      });
      expect(result).toBe(false);
    });

    it('should return true within custom 100% threshold (double)', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 200,
        proposalNightlyRate: 100,
        maxOverBudgetPercent: 1.0
      });
      expect(result).toBe(true);
    });

    it('should return false over custom 100% threshold', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 201,
        proposalNightlyRate: 100,
        maxOverBudgetPercent: 1.0
      });
      expect(result).toBe(false);
    });

    it('should return true with 0% threshold when candidate equals proposal', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 100,
        proposalNightlyRate: 100,
        maxOverBudgetPercent: 0
      });
      expect(result).toBe(true);
    });

    it('should return false with 0% threshold when any over', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 101,
        proposalNightlyRate: 100,
        maxOverBudgetPercent: 0
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Under Budget (Always True)
  // ============================================================================
  describe('under budget always returns true', () => {
    it('should return true when significantly under budget', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 50,
        proposalNightlyRate: 100
      });
      expect(result).toBe(true);
    });

    it('should return true when 50% under budget', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 50,
        proposalNightlyRate: 100
      });
      expect(result).toBe(true);
    });

    it('should return true when just $1 under budget', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 99,
        proposalNightlyRate: 100
      });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Returns False - Invalid Inputs
  // ============================================================================
  describe('returns false for invalid inputs', () => {
    it('should return false when candidateNightlyRate is null', () => {
      const result = isWithinBudget({
        candidateNightlyRate: null,
        proposalNightlyRate: 100
      });
      expect(result).toBe(false);
    });

    it('should return false when proposalNightlyRate is null', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 100,
        proposalNightlyRate: null
      });
      expect(result).toBe(false);
    });

    it('should return false when candidateNightlyRate is undefined', () => {
      const result = isWithinBudget({
        candidateNightlyRate: undefined,
        proposalNightlyRate: 100
      });
      expect(result).toBe(false);
    });

    it('should return false when proposalNightlyRate is undefined', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 100,
        proposalNightlyRate: undefined
      });
      expect(result).toBe(false);
    });

    it('should return false when candidateNightlyRate is NaN', () => {
      const result = isWithinBudget({
        candidateNightlyRate: NaN,
        proposalNightlyRate: 100
      });
      expect(result).toBe(false);
    });

    it('should return false when proposalNightlyRate is NaN', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 100,
        proposalNightlyRate: NaN
      });
      expect(result).toBe(false);
    });

    it('should return false when candidateNightlyRate is a string', () => {
      const result = isWithinBudget({
        candidateNightlyRate: '100',
        proposalNightlyRate: 100
      });
      expect(result).toBe(false);
    });

    it('should return false when proposalNightlyRate is a string', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 100,
        proposalNightlyRate: '100'
      });
      expect(result).toBe(false);
    });

    it('should return false when proposalNightlyRate is zero', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 100,
        proposalNightlyRate: 0
      });
      expect(result).toBe(false);
    });

    it('should return false when proposalNightlyRate is negative', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 100,
        proposalNightlyRate: -100
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle very small rates', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 1.5,
        proposalNightlyRate: 1.0
      });
      expect(result).toBe(true);
    });

    it('should handle very large rates', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 15000,
        proposalNightlyRate: 10000
      });
      expect(result).toBe(true);
    });

    it('should handle decimal precision', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 149.99,
        proposalNightlyRate: 100
      });
      expect(result).toBe(true);
    });

    it('should handle candidate rate of 0', () => {
      const result = isWithinBudget({
        candidateNightlyRate: 0,
        proposalNightlyRate: 100
      });
      expect(result).toBe(true); // 0 is under any budget
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should accept affordable listing within budget', () => {
      const guestBudget = 200; // per night
      const listingRate = 220; // 10% over

      const result = isWithinBudget({
        candidateNightlyRate: listingRate,
        proposalNightlyRate: guestBudget
      });

      expect(result).toBe(true);
    });

    it('should reject expensive listing over budget', () => {
      const guestBudget = 200; // per night
      const listingRate = 350; // 75% over

      const result = isWithinBudget({
        candidateNightlyRate: listingRate,
        proposalNightlyRate: guestBudget
      });

      expect(result).toBe(false);
    });

    it('should handle budget matching scenario', () => {
      // Guest looking for budget $150-$225 (50% threshold)
      const guestBudget = 150;

      expect(isWithinBudget({
        candidateNightlyRate: 150,
        proposalNightlyRate: guestBudget
      })).toBe(true);

      expect(isWithinBudget({
        candidateNightlyRate: 225,
        proposalNightlyRate: guestBudget
      })).toBe(true);

      expect(isWithinBudget({
        candidateNightlyRate: 226,
        proposalNightlyRate: guestBudget
      })).toBe(false);
    });
  });
});
