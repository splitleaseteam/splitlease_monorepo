/**
 * Tests for isDateInRange
 *
 * Check if a date is within the available range.
 * Validates that a date falls within the listing's availability window.
 */
import { describe, it, expect } from 'vitest';
import { isDateInRange } from '../isDateInRange.js';

describe('isDateInRange', () => {
  // ============================================================================
  // Happy Path - Date Is In Range
  // ============================================================================
  describe('date is in range (returns true)', () => {
    it('should return true when date is within range', () => {
      const result = isDateInRange({
        date: new Date('2025-12-15'),
        firstAvailable: '2025-12-01',
        lastAvailable: '2025-12-31'
      });
      expect(result).toBe(true);
    });

    it('should return true when date equals firstAvailable (inclusive)', () => {
      const result = isDateInRange({
        date: new Date('2025-12-01'),
        firstAvailable: '2025-12-01',
        lastAvailable: '2025-12-31'
      });
      expect(result).toBe(true);
    });

    it('should return true when date equals lastAvailable (inclusive)', () => {
      const result = isDateInRange({
        date: new Date('2025-12-31'),
        firstAvailable: '2025-12-01',
        lastAvailable: '2025-12-31'
      });
      expect(result).toBe(true);
    });

    it('should return true when date is one day after firstAvailable', () => {
      const result = isDateInRange({
        date: new Date('2025-12-02'),
        firstAvailable: '2025-12-01',
        lastAvailable: '2025-12-31'
      });
      expect(result).toBe(true);
    });

    it('should return true when date is one day before lastAvailable', () => {
      const result = isDateInRange({
        date: new Date('2025-12-30'),
        firstAvailable: '2025-12-01',
        lastAvailable: '2025-12-31'
      });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Date Is Out Of Range
  // ============================================================================
  describe('date is out of range (returns false)', () => {
    it('should return false when date is before firstAvailable', () => {
      const result = isDateInRange({
        date: new Date('2025-11-30'),
        firstAvailable: '2025-12-01',
        lastAvailable: '2025-12-31'
      });
      expect(result).toBe(false);
    });

    it('should return false when date is after lastAvailable', () => {
      const result = isDateInRange({
        date: new Date('2026-01-01'),
        firstAvailable: '2025-12-01',
        lastAvailable: '2025-12-31'
      });
      expect(result).toBe(false);
    });

    it('should return false when date is well before range', () => {
      const result = isDateInRange({
        date: new Date('2025-06-01'),
        firstAvailable: '2025-12-01',
        lastAvailable: '2025-12-31'
      });
      expect(result).toBe(false);
    });

    it('should return false when date is well after range', () => {
      const result = isDateInRange({
        date: new Date('2026-06-01'),
        firstAvailable: '2025-12-01',
        lastAvailable: '2025-12-31'
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Unbounded Ranges (null/undefined bounds)
  // ============================================================================
  describe('unbounded ranges (null/undefined bounds)', () => {
    it('should return true when firstAvailable is null (no lower bound)', () => {
      const result = isDateInRange({
        date: new Date('2020-01-01'),
        firstAvailable: null,
        lastAvailable: '2025-12-31'
      });
      expect(result).toBe(true);
    });

    it('should return true when lastAvailable is null (no upper bound)', () => {
      const result = isDateInRange({
        date: new Date('2030-12-31'),
        firstAvailable: '2025-01-01',
        lastAvailable: null
      });
      expect(result).toBe(true);
    });

    it('should return true when both bounds are null (always in range)', () => {
      const result = isDateInRange({
        date: new Date('2025-06-15'),
        firstAvailable: null,
        lastAvailable: null
      });
      expect(result).toBe(true);
    });

    it('should return true when firstAvailable is undefined', () => {
      const result = isDateInRange({
        date: new Date('2020-01-01'),
        firstAvailable: undefined,
        lastAvailable: '2025-12-31'
      });
      expect(result).toBe(true);
    });

    it('should return true when lastAvailable is undefined', () => {
      const result = isDateInRange({
        date: new Date('2030-12-31'),
        firstAvailable: '2025-01-01',
        lastAvailable: undefined
      });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Date Input Formats
  // ============================================================================
  describe('date input formats', () => {
    it('should accept Date objects for bounds', () => {
      const result = isDateInRange({
        date: new Date('2025-12-15'),
        firstAvailable: new Date('2025-12-01'),
        lastAvailable: new Date('2025-12-31')
      });
      expect(result).toBe(true);
    });

    it('should accept ISO strings with time', () => {
      const result = isDateInRange({
        date: new Date('2025-12-15'),
        firstAvailable: '2025-12-01T00:00:00Z',
        lastAvailable: '2025-12-31T23:59:59Z'
      });
      expect(result).toBe(true);
    });

    it('should normalize dates to local midnight before comparison', () => {
      // Note: setHours(0,0,0,0) normalizes to LOCAL midnight, not UTC
      // This can cause dates to shift when crossing UTC day boundaries
      // Testing with dates that don't cross boundaries
      const result = isDateInRange({
        date: new Date('2025-12-15T14:30:00'),  // Local time, stays Dec 15
        firstAvailable: '2025-12-01',
        lastAvailable: '2025-12-31'
      });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Error Handling - Invalid date Parameter
  // ============================================================================
  describe('error handling - invalid date parameter', () => {
    it('should throw error for null date', () => {
      expect(() => isDateInRange({
        date: null,
        firstAvailable: '2025-12-01',
        lastAvailable: '2025-12-31'
      })).toThrow('date must be a valid Date object');
    });

    it('should throw error for undefined date', () => {
      expect(() => isDateInRange({
        date: undefined,
        firstAvailable: '2025-12-01',
        lastAvailable: '2025-12-31'
      })).toThrow('date must be a valid Date object');
    });

    it('should throw error for string date', () => {
      expect(() => isDateInRange({
        date: '2025-12-15',
        firstAvailable: '2025-12-01',
        lastAvailable: '2025-12-31'
      })).toThrow('date must be a valid Date object');
    });

    it('should throw error for invalid Date object', () => {
      expect(() => isDateInRange({
        date: new Date('invalid'),
        firstAvailable: '2025-12-01',
        lastAvailable: '2025-12-31'
      })).toThrow('date must be a valid Date object');
    });

    it('should throw error for missing params object', () => {
      expect(() => isDateInRange()).toThrow();
    });
  });

  // ============================================================================
  // Error Handling - Invalid Bound Values
  // ============================================================================
  describe('error handling - invalid bound values', () => {
    it('should throw error for invalid firstAvailable string', () => {
      expect(() => isDateInRange({
        date: new Date('2025-12-15'),
        firstAvailable: 'not-a-date',
        lastAvailable: '2025-12-31'
      })).toThrow('firstAvailable is not a valid date');
    });

    it('should throw error for invalid lastAvailable string', () => {
      expect(() => isDateInRange({
        date: new Date('2025-12-15'),
        firstAvailable: '2025-12-01',
        lastAvailable: 'not-a-date'
      })).toThrow('lastAvailable is not a valid date');
    });
  });

  // ============================================================================
  // Same Day Range
  // ============================================================================
  describe('same day range', () => {
    it('should return true when date equals single-day range', () => {
      const result = isDateInRange({
        date: new Date('2025-12-25'),
        firstAvailable: '2025-12-25',
        lastAvailable: '2025-12-25'
      });
      expect(result).toBe(true);
    });

    it('should return false when date is before single-day range', () => {
      const result = isDateInRange({
        date: new Date('2025-12-24'),
        firstAvailable: '2025-12-25',
        lastAvailable: '2025-12-25'
      });
      expect(result).toBe(false);
    });

    it('should return false when date is after single-day range', () => {
      const result = isDateInRange({
        date: new Date('2025-12-26'),
        firstAvailable: '2025-12-25',
        lastAvailable: '2025-12-25'
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should validate move-in date against listing availability', () => {
      const listing = {
        firstAvailable: '2025-12-01',
        lastAvailable: '2026-06-30'
      };

      const proposedMoveIn = new Date('2025-12-15');
      const result = isDateInRange({
        date: proposedMoveIn,
        firstAvailable: listing.firstAvailable,
        lastAvailable: listing.lastAvailable
      });
      expect(result).toBe(true);
    });

    it('should reject move-in date before listing becomes available', () => {
      const listing = {
        firstAvailable: '2025-12-01',
        lastAvailable: '2026-06-30'
      };

      const tooEarly = new Date('2025-11-15');
      const result = isDateInRange({
        date: tooEarly,
        firstAvailable: listing.firstAvailable,
        lastAvailable: listing.lastAvailable
      });
      expect(result).toBe(false);
    });

    it('should handle open-ended listings (no end date)', () => {
      const listing = {
        firstAvailable: '2025-12-01',
        lastAvailable: null // Open ended
      };

      const farFuture = new Date('2030-01-01');
      const result = isDateInRange({
        date: farFuture,
        firstAvailable: listing.firstAvailable,
        lastAvailable: listing.lastAvailable
      });
      expect(result).toBe(true);
    });

    it('should handle immediately available listings (no start restriction)', () => {
      const listing = {
        firstAvailable: null, // Immediately available
        lastAvailable: '2026-06-30'
      };

      const today = new Date('2025-06-01');
      const result = isDateInRange({
        date: today,
        firstAvailable: listing.firstAvailable,
        lastAvailable: listing.lastAvailable
      });
      expect(result).toBe(true);
    });
  });
});
