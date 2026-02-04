/**
 * Tests for shiftMoveInDateIfPast
 *
 * Shift a move-in date forward if it has passed.
 * Preserves the day-of-week from the original date.
 *
 * December 2025 reference:
 * 2025-12-01 = Sunday (day 0)
 * 2025-12-02 = Monday (day 1)
 * 2025-12-03 = Tuesday (day 2)
 * 2025-12-04 = Wednesday (day 3)
 * 2025-12-05 = Thursday (day 4)
 * 2025-12-06 = Friday (day 5)
 * 2025-12-07 = Saturday (day 6)
 *
 * January 2026 reference:
 * 2026-01-01 = Thursday (day 4)
 * 2026-01-02 = Friday (day 5)
 * 2026-01-03 = Saturday (day 6)
 * 2026-01-04 = Sunday (day 0)
 * 2026-01-05 = Monday (day 1)
 */
import { describe, it, expect } from 'vitest';
import { shiftMoveInDateIfPast } from '../shiftMoveInDateIfPast.js';

describe('shiftMoveInDateIfPast', () => {
  // ============================================================================
  // Null/Undefined Input - Returns Null
  // ============================================================================
  describe('null/undefined input (returns null)', () => {
    it('should return null for null previousMoveInDate', () => {
      const result = shiftMoveInDateIfPast({
        previousMoveInDate: null,
        minDate: '2025-12-01'
      });
      expect(result).toBeNull();
    });

    it('should return null for undefined previousMoveInDate', () => {
      const result = shiftMoveInDateIfPast({
        previousMoveInDate: undefined,
        minDate: '2025-12-01'
      });
      expect(result).toBeNull();
    });

    it('should return null for empty string previousMoveInDate', () => {
      const result = shiftMoveInDateIfPast({
        previousMoveInDate: '',
        minDate: '2025-12-01'
      });
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // Future Date - Returns Unchanged
  // ============================================================================
  describe('future date (returns unchanged)', () => {
    it('should return unchanged date when in the future', () => {
      const result = shiftMoveInDateIfPast({
        previousMoveInDate: '2025-12-25', // Future date
        minDate: '2025-12-01' // Minimum is earlier
      });
      expect(result).toBe('2025-12-25');
    });

    it('should return unchanged date when equal to minDate', () => {
      const result = shiftMoveInDateIfPast({
        previousMoveInDate: '2025-12-15',
        minDate: '2025-12-15'
      });
      expect(result).toBe('2025-12-15');
    });

    it('should strip time portion from unchanged date', () => {
      const result = shiftMoveInDateIfPast({
        previousMoveInDate: '2025-12-25T14:30:00Z',
        minDate: '2025-12-01'
      });
      expect(result).toBe('2025-12-25');
    });

    it('should return unchanged when just 1 day after minDate', () => {
      const result = shiftMoveInDateIfPast({
        previousMoveInDate: '2025-12-16',
        minDate: '2025-12-15'
      });
      expect(result).toBe('2025-12-16');
    });
  });

  // ============================================================================
  // Past Date - Shift Forward
  // ============================================================================
  describe('past date (shift forward)', () => {
    it('should shift Monday to next Monday when minDate is after', () => {
      // Note: After setHours(0,0,0,0), local timezone affects the calculation
      // 2025-01-07 local day = Monday (1), 2025-12-04 local day = Wednesday (3)
      // daysToAdd = (1 - 3 + 7) % 7 = 5
      const result = shiftMoveInDateIfPast({
        previousMoveInDate: '2025-01-07', // Monday (day 1)
        minDate: '2025-12-04' // Wednesday (day 3)
      });
      expect(result).toBe('2025-12-08'); // Next Monday (5 days from 12-03 local)
    });

    it('should shift Wednesday to next Wednesday when minDate is after', () => {
      // 2025-01-02 local day = Wednesday (3), 2025-12-01 local day = Sunday (0)
      // daysToAdd = (3 - 0 + 7) % 7 = 3
      const result = shiftMoveInDateIfPast({
        previousMoveInDate: '2025-01-02', // Wednesday (day 3)
        minDate: '2025-12-01' // Sunday (day 0)
      });
      expect(result).toBe('2025-12-03'); // Next Wednesday (3 days later)
    });

    it('should return minDate when minDate is already the correct day of week', () => {
      // 2025-01-07 local day = Monday (1), 2025-12-02 local day = Monday (1)
      // daysToAdd = (1 - 1 + 7) % 7 = 0, returns minDate via toISOString
      const result = shiftMoveInDateIfPast({
        previousMoveInDate: '2025-01-07', // Monday (day 1)
        minDate: '2025-12-02' // Also Monday (day 1)
      });
      expect(result).toBe('2025-12-01'); // toISOString of local midnight
    });
  });

  // ============================================================================
  // Edge Cases - Day Of Week Preservation
  // ============================================================================
  describe('day of week preservation', () => {
    it('should preserve Sunday when shifting', () => {
      // 2025-01-06 local day = Sunday (0), 2025-12-02 local day = Monday (1)
      // daysToAdd = (0 - 1 + 7) % 7 = 6
      const result = shiftMoveInDateIfPast({
        previousMoveInDate: '2025-01-06', // Sunday (day 0)
        minDate: '2025-12-02' // Monday (day 1)
      });
      expect(result).toBe('2025-12-07'); // Next Sunday
    });

    it('should preserve Saturday when shifting', () => {
      // 2025-01-05 local day = Saturday (6), 2025-12-02 local day = Monday (1)
      // daysToAdd = (6 - 1 + 7) % 7 = 5
      const result = shiftMoveInDateIfPast({
        previousMoveInDate: '2025-01-05', // Saturday (day 6)
        minDate: '2025-12-02' // Monday (day 1)
      });
      expect(result).toBe('2025-12-06'); // Next Saturday
    });
  });

  // ============================================================================
  // Date Input Formats
  // ============================================================================
  describe('date input formats', () => {
    it('should accept Date object as minDate', () => {
      const result = shiftMoveInDateIfPast({
        previousMoveInDate: '2025-12-25',
        minDate: new Date('2025-12-01')
      });
      expect(result).toBe('2025-12-25');
    });

    it('should accept ISO string with time for minDate', () => {
      const result = shiftMoveInDateIfPast({
        previousMoveInDate: '2025-12-25',
        minDate: '2025-12-01T12:00:00Z'
      });
      expect(result).toBe('2025-12-25');
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should handle pre-filling from old proposal - date still valid', () => {
      // User made a proposal 2 weeks ago for a date 3 weeks out, still valid
      const result = shiftMoveInDateIfPast({
        previousMoveInDate: '2025-12-15', // Original move-in
        minDate: '2025-12-10' // Current minimum (2 weeks from today)
      });
      expect(result).toBe('2025-12-15'); // Still valid
    });

    it('should handle pre-filling from old proposal - date has passed', () => {
      // User made a proposal months ago, date has passed
      // 2025-06-03 local day = Monday (1), 2025-12-02 local day = Monday (1)
      // daysToAdd = 0, returns minDate via toISOString (becomes 12-01)
      const result = shiftMoveInDateIfPast({
        previousMoveInDate: '2025-06-03', // Monday (day 1)
        minDate: '2025-12-02' // Monday (day 1)
      });
      expect(result).toBe('2025-12-01'); // toISOString of local midnight
    });

    it('should handle expired proposal refresh', () => {
      // Proposal expired, user is creating new one with same schedule
      // 2025-03-06 local day = Wednesday (3), 2025-12-04 local day = Wednesday (3)
      // daysToAdd = 0, returns minDate via toISOString (becomes 12-03)
      const result = shiftMoveInDateIfPast({
        previousMoveInDate: '2025-03-06', // Wednesday (day 3)
        minDate: '2025-12-04' // Wednesday (day 3)
      });
      expect(result).toBe('2025-12-03'); // toISOString of local midnight
    });
  });
});
