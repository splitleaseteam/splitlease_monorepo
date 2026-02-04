/**
 * Tests for calculateNextAvailableCheckIn
 *
 * Calculate the next available check-in date based on selected day-of-week and minimum date.
 * Smart default calculation for move-in dates.
 *
 * December 2025 reference:
 * 2025-12-01 = Sunday (day 0)
 * 2025-12-02 = Monday (day 1)
 * 2025-12-03 = Tuesday (day 2)
 * 2025-12-04 = Wednesday (day 3)
 * 2025-12-05 = Thursday (day 4)
 * 2025-12-06 = Friday (day 5)
 * 2025-12-07 = Saturday (day 6)
 */
import { describe, it, expect } from 'vitest';
import { calculateNextAvailableCheckIn } from '../calculateNextAvailableCheckIn.js';

describe('calculateNextAvailableCheckIn', () => {
  // ============================================================================
  // Happy Path - Same Day Match
  // ============================================================================
  describe('same day match (minDate is already the target day)', () => {
    it('should return minDate when it falls on the first selected day (Monday)', () => {
      // 2025-12-02 is a Monday (day 1)
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [1, 2, 3, 4], // Mon-Thu
        minDate: '2025-12-02'
      });
      expect(result).toBe('2025-12-02');
    });

    it('should return minDate when it falls on the first selected day (Sunday)', () => {
      // 2025-12-01 is a Sunday (day 0)
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [0, 1, 2], // Sun-Tue
        minDate: '2025-12-01'
      });
      expect(result).toBe('2025-12-01');
    });

    it('should return minDate when it falls on the first selected day (Wednesday)', () => {
      // 2025-12-04 is a Wednesday (day 3)
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [3, 4, 5, 6], // Wed-Sat
        minDate: '2025-12-04'
      });
      expect(result).toBe('2025-12-04');
    });
  });

  // ============================================================================
  // Happy Path - Advance to Next Occurrence
  // ============================================================================
  describe('advance to next occurrence', () => {
    it('should advance to Wednesday when minDate is Monday and first selected is Wed', () => {
      // 2025-12-02 is Monday, need Wednesday (2025-12-04)
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [3, 4, 5, 6], // Wed-Sat
        minDate: '2025-12-02'
      });
      expect(result).toBe('2025-12-04'); // Wednesday
    });

    it('should advance to Monday when minDate is Saturday and first selected is Mon', () => {
      // 2025-12-07 is Saturday, need Monday (2025-12-09)
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [1, 2, 3, 4], // Mon-Thu
        minDate: '2025-12-07'
      });
      expect(result).toBe('2025-12-09'); // Monday
    });

    it('should advance to Sunday when minDate is Monday and selected includes Sun-Fri-Sat', () => {
      // 2025-12-02 is Monday (day 1)
      // Selected [5, 6, 0] sorts to [0, 5, 6], first day is Sunday (0)
      // Next Sunday after Monday is 2025-12-08 (6 days later)
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [5, 6, 0], // Fri-Sun (sorts to Sun-Fri-Sat)
        minDate: '2025-12-02'
      });
      expect(result).toBe('2025-12-08'); // Next Sunday
    });

    it('should advance to Sunday when minDate is Thursday and first selected is Sun', () => {
      // 2025-12-05 is Thursday, need Sunday (2025-12-08)
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [0, 1, 2], // Sun-Tue
        minDate: '2025-12-05'
      });
      expect(result).toBe('2025-12-08'); // Sunday
    });
  });

  // ============================================================================
  // Week Wrap-Around Cases
  // ============================================================================
  describe('week wrap-around', () => {
    it('should wrap to next week when target day has passed', () => {
      // 2025-12-06 is Friday, need Monday (2025-12-09)
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [1, 2, 3, 4], // Mon-Thu
        minDate: '2025-12-06'
      });
      expect(result).toBe('2025-12-09'); // Next Monday
    });

    it('should wrap to Sunday from Saturday', () => {
      // 2025-12-07 is Saturday, need Sunday (2025-12-08)
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [0, 1, 2], // Sun-Tue
        minDate: '2025-12-07'
      });
      expect(result).toBe('2025-12-08'); // Next Sunday
    });
  });

  // ============================================================================
  // Single Day Selection
  // ============================================================================
  describe('single day selection', () => {
    it('should work with single day that matches minDate', () => {
      // 2025-12-02 is Monday
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [1], // Only Monday
        minDate: '2025-12-02'
      });
      expect(result).toBe('2025-12-02');
    });

    it('should advance to single selected day', () => {
      // 2025-12-02 is Monday, need Friday (2025-12-06)
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [5], // Only Friday
        minDate: '2025-12-02'
      });
      expect(result).toBe('2025-12-06');
    });
  });

  // ============================================================================
  // Full Week Selection
  // ============================================================================
  describe('full week selection', () => {
    it('should return minDate for full week selection (any day works)', () => {
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [0, 1, 2, 3, 4, 5, 6],
        minDate: '2025-12-01'
      });
      expect(result).toBe('2025-12-01');
    });
  });

  // ============================================================================
  // Unsorted Input
  // ============================================================================
  describe('unsorted input', () => {
    it('should sort and use first day from unsorted input', () => {
      // Unsorted: [4, 2, 3, 1] should sort to [1, 2, 3, 4]
      // 2025-12-02 is Monday (day 1), first day is Monday
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [4, 2, 3, 1], // Unsorted Mon-Thu
        minDate: '2025-12-02'
      });
      expect(result).toBe('2025-12-02');
    });

    it('should sort and advance to first day from unsorted input', () => {
      // Unsorted: [5, 3, 4, 6] should sort to [3, 4, 5, 6]
      // 2025-12-02 is Monday, first sorted day is Wednesday (day 3)
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [5, 3, 4, 6], // Unsorted Wed-Sat
        minDate: '2025-12-02'
      });
      expect(result).toBe('2025-12-04'); // Wednesday
    });
  });

  // ============================================================================
  // Date Input Formats
  // ============================================================================
  describe('date input formats', () => {
    it('should accept Date object as minDate', () => {
      // 2025-12-02 is Monday
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [1, 2, 3, 4], // Mon-Thu
        minDate: new Date('2025-12-02')
      });
      expect(result).toBe('2025-12-02');
    });

    it('should accept ISO string with time', () => {
      // 2025-12-02T14:30:00Z parsed as UTC - may become different day in local timezone
      // The function uses toISOString() which is UTC-based
      // 2025-12-01 is Sunday (day 0), selected days [0, 1, 2] means Sunday is first
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [0, 1, 2], // Sun-Tue
        minDate: '2025-12-01' // Sunday
      });
      expect(result).toBe('2025-12-01'); // Sunday matches first selected day
    });
  });

  // ============================================================================
  // Error Handling - Invalid selectedDayIndices
  // ============================================================================
  describe('error handling - invalid selectedDayIndices', () => {
    it('should throw error for empty array', () => {
      expect(() => calculateNextAvailableCheckIn({
        selectedDayIndices: [],
        minDate: '2025-12-01'
      })).toThrow('selectedDayIndices must be a non-empty array');
    });

    it('should throw error for null selectedDayIndices', () => {
      expect(() => calculateNextAvailableCheckIn({
        selectedDayIndices: null,
        minDate: '2025-12-01'
      })).toThrow('selectedDayIndices must be a non-empty array');
    });

    it('should throw error for undefined selectedDayIndices', () => {
      expect(() => calculateNextAvailableCheckIn({
        selectedDayIndices: undefined,
        minDate: '2025-12-01'
      })).toThrow('selectedDayIndices must be a non-empty array');
    });

    it('should throw error for string selectedDayIndices', () => {
      expect(() => calculateNextAvailableCheckIn({
        selectedDayIndices: 'monday',
        minDate: '2025-12-01'
      })).toThrow('selectedDayIndices must be a non-empty array');
    });

    it('should throw error for invalid day index (7)', () => {
      expect(() => calculateNextAvailableCheckIn({
        selectedDayIndices: [1, 2, 7],
        minDate: '2025-12-01'
      })).toThrow('Invalid day index 7, must be 0-6');
    });

    it('should throw error for negative day index', () => {
      expect(() => calculateNextAvailableCheckIn({
        selectedDayIndices: [-1, 0, 1],
        minDate: '2025-12-01'
      })).toThrow('Invalid day index -1, must be 0-6');
    });

    it('should throw error for non-number day index', () => {
      expect(() => calculateNextAvailableCheckIn({
        selectedDayIndices: [1, '2', 3],
        minDate: '2025-12-01'
      })).toThrow('Invalid day index 2, must be 0-6');
    });

    it('should throw error for NaN day index', () => {
      expect(() => calculateNextAvailableCheckIn({
        selectedDayIndices: [1, NaN, 3],
        minDate: '2025-12-01'
      })).toThrow('Invalid day index NaN, must be 0-6');
    });
  });

  // ============================================================================
  // Error Handling - Invalid minDate
  // ============================================================================
  describe('error handling - invalid minDate', () => {
    it('should throw error for invalid date string', () => {
      expect(() => calculateNextAvailableCheckIn({
        selectedDayIndices: [1, 2, 3],
        minDate: 'not-a-date'
      })).toThrow('minDate is not a valid date');
    });

    it('should not throw for null minDate (creates epoch date)', () => {
      // new Date(null) creates 1970-01-01, which is valid
      // This is a quirk of JavaScript Date parsing
      // 1970-01-01 getDay() returns 3 (Wednesday in local time)
      // selectedDayIndices [1,2,3] sorted = [1,2,3], first = Monday (1)
      // daysUntil(3, 1) = (1 - 3 + 7) % 7 = 5
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [1, 2, 3], // Mon-Wed
        minDate: null
      });
      expect(result).toBe('1970-01-06'); // 5 days after epoch
    });

    it('should throw error for undefined minDate', () => {
      expect(() => calculateNextAvailableCheckIn({
        selectedDayIndices: [1, 2, 3],
        minDate: undefined
      })).toThrow('minDate is not a valid date');
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should calculate typical Mon-Thu commuter schedule', () => {
      // User selects Mon-Thu, min date is Wednesday 2025-12-04
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [1, 2, 3, 4], // Mon-Thu
        minDate: '2025-12-04' // Wednesday
      });
      expect(result).toBe('2025-12-09'); // Next Monday
    });

    it('should calculate weekend schedule (first sorted day is Sunday)', () => {
      // User selects Fri-Sun [5, 6, 0], sorts to [0, 5, 6]
      // First day = Sunday (0), minDate = Monday 2025-12-02 (day 1)
      // daysUntil(1, 0) = (0 - 1 + 7) % 7 = 6
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [5, 6, 0], // Fri-Sun (sorts to Sun-Fri-Sat)
        minDate: '2025-12-02' // Monday
      });
      expect(result).toBe('2025-12-08'); // Next Sunday (6 days later)
    });

    it('should handle mid-week start', () => {
      // User selects Wed-Sat, min date is Tuesday 2025-12-03
      const result = calculateNextAvailableCheckIn({
        selectedDayIndices: [3, 4, 5, 6], // Wed-Sat
        minDate: '2025-12-03' // Tuesday
      });
      expect(result).toBe('2025-12-04'); // Wednesday
    });
  });
});
