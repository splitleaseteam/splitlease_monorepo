/**
 * Tests for calculateCheckInOutDays
 *
 * Calculates check-in and check-out days from selected days.
 * Check-in is the first selected day, check-out is the day AFTER the last selected day.
 * Handles week wrap-around cases (e.g., Fri-Mon).
 */
import { describe, it, expect } from 'vitest';
import { calculateCheckInOutDays } from '../calculateCheckInOutDays.js';

describe('calculateCheckInOutDays', () => {
  // ============================================================================
  // Happy Path Tests - Standard Cases (No Wrap-Around)
  // ============================================================================
  describe('happy path - standard cases (no wrap-around)', () => {
    it('should calculate Mon-Fri schedule (5 days)', () => {
      const result = calculateCheckInOutDays({ selectedDays: [1, 2, 3, 4, 5] });

      expect(result.checkInDay).toBe(1);
      expect(result.checkOutDay).toBe(6); // Day after Friday is Saturday
      expect(result.checkInName).toBe('Monday');
      expect(result.checkOutName).toBe('Saturday');
    });

    it('should calculate Tue-Thu schedule (3 days)', () => {
      const result = calculateCheckInOutDays({ selectedDays: [2, 3, 4] });

      expect(result.checkInDay).toBe(2);
      expect(result.checkOutDay).toBe(5); // Day after Thursday is Friday
      expect(result.checkInName).toBe('Tuesday');
      expect(result.checkOutName).toBe('Friday');
    });

    it('should calculate Wed-Sat schedule (4 days)', () => {
      const result = calculateCheckInOutDays({ selectedDays: [3, 4, 5, 6] });

      expect(result.checkInDay).toBe(3);
      expect(result.checkOutDay).toBe(0); // Day after Saturday wraps to Sunday
      expect(result.checkInName).toBe('Wednesday');
      expect(result.checkOutName).toBe('Sunday');
    });

    it('should calculate single day (Monday only)', () => {
      const result = calculateCheckInOutDays({ selectedDays: [1] });

      expect(result.checkInDay).toBe(1);
      expect(result.checkOutDay).toBe(2); // Day after Monday is Tuesday
      expect(result.checkInName).toBe('Monday');
      expect(result.checkOutName).toBe('Tuesday');
    });

    it('should calculate Sun-Mon schedule (2 days)', () => {
      const result = calculateCheckInOutDays({ selectedDays: [0, 1] });

      expect(result.checkInDay).toBe(0);
      expect(result.checkOutDay).toBe(2);
      expect(result.checkInName).toBe('Sunday');
      expect(result.checkOutName).toBe('Tuesday');
    });
  });

  // ============================================================================
  // Wrap-Around Cases (Week Boundary)
  // ============================================================================
  describe('wrap-around cases', () => {
    it('should handle Fri-Mon wrap-around (4 days)', () => {
      const result = calculateCheckInOutDays({ selectedDays: [5, 6, 0, 1] });

      // Gap is between 1 (Mon) and 5 (Fri)
      // Check-in is after gap: Friday (5)
      // Last day before gap: Monday (1)
      // Check-out is day after Monday: Tuesday (2)
      expect(result.checkInDay).toBe(5);
      expect(result.checkOutDay).toBe(2);
      expect(result.checkInName).toBe('Friday');
      expect(result.checkOutName).toBe('Tuesday');
    });

    it('should handle Sat-Tue wrap-around (4 days)', () => {
      const result = calculateCheckInOutDays({ selectedDays: [6, 0, 1, 2] });

      // Gap is between 2 (Tue) and 6 (Sat)
      expect(result.checkInDay).toBe(6);
      expect(result.checkOutDay).toBe(3);
      expect(result.checkInName).toBe('Saturday');
      expect(result.checkOutName).toBe('Wednesday');
    });

    it('should handle Fri-Sun wrap-around (3 days)', () => {
      const result = calculateCheckInOutDays({ selectedDays: [5, 6, 0] });

      expect(result.checkInDay).toBe(5);
      expect(result.checkOutDay).toBe(1);
      expect(result.checkInName).toBe('Friday');
      expect(result.checkOutName).toBe('Monday');
    });

    it('should handle Sat-Sun wrap-around (2 days)', () => {
      const result = calculateCheckInOutDays({ selectedDays: [6, 0] });

      expect(result.checkInDay).toBe(6);
      expect(result.checkOutDay).toBe(1);
      expect(result.checkInName).toBe('Saturday');
      expect(result.checkOutName).toBe('Monday');
    });

    it('should handle Thu-Mon wrap-around (5 days)', () => {
      const result = calculateCheckInOutDays({ selectedDays: [4, 5, 6, 0, 1] });

      expect(result.checkInDay).toBe(4);
      expect(result.checkOutDay).toBe(2);
      expect(result.checkInName).toBe('Thursday');
      expect(result.checkOutName).toBe('Tuesday');
    });
  });

  // ============================================================================
  // Full Week Cases
  // ============================================================================
  describe('full week cases', () => {
    it('should handle full week (7 days)', () => {
      const result = calculateCheckInOutDays({ selectedDays: [0, 1, 2, 3, 4, 5, 6] });

      // Full week has no gap, standard case applies
      expect(result.checkInDay).toBe(0);
      expect(result.checkOutDay).toBe(0); // Day after Saturday wraps to Sunday
      expect(result.checkInName).toBe('Sunday');
      expect(result.checkOutName).toBe('Sunday');
    });

    it('should handle 6 days (Mon-Sat)', () => {
      const result = calculateCheckInOutDays({ selectedDays: [1, 2, 3, 4, 5, 6] });

      expect(result.checkInDay).toBe(1);
      expect(result.checkOutDay).toBe(0); // Day after Saturday wraps to Sunday
      expect(result.checkInName).toBe('Monday');
      expect(result.checkOutName).toBe('Sunday');
    });

    it('should handle 6 days (Sun-Fri)', () => {
      const result = calculateCheckInOutDays({ selectedDays: [0, 1, 2, 3, 4, 5] });

      expect(result.checkInDay).toBe(0);
      expect(result.checkOutDay).toBe(6);
      expect(result.checkInName).toBe('Sunday');
      expect(result.checkOutName).toBe('Saturday');
    });
  });

  // ============================================================================
  // Individual Day Tests
  // ============================================================================
  describe('individual day tests', () => {
    it('should handle Sunday only', () => {
      const result = calculateCheckInOutDays({ selectedDays: [0] });
      expect(result.checkInDay).toBe(0);
      expect(result.checkOutDay).toBe(1);
    });

    it('should handle Monday only', () => {
      const result = calculateCheckInOutDays({ selectedDays: [1] });
      expect(result.checkInDay).toBe(1);
      expect(result.checkOutDay).toBe(2);
    });

    it('should handle Saturday only', () => {
      const result = calculateCheckInOutDays({ selectedDays: [6] });
      expect(result.checkInDay).toBe(6);
      expect(result.checkOutDay).toBe(0); // Wraps to Sunday
    });
  });

  // ============================================================================
  // Unsorted Input Tests
  // ============================================================================
  describe('unsorted input handling', () => {
    it('should handle unsorted input correctly', () => {
      const result = calculateCheckInOutDays({ selectedDays: [4, 2, 3, 1, 5] });

      expect(result.checkInDay).toBe(1);
      expect(result.checkOutDay).toBe(6);
    });

    it('should handle reverse-ordered input', () => {
      const result = calculateCheckInOutDays({ selectedDays: [5, 4, 3, 2, 1] });

      expect(result.checkInDay).toBe(1);
      expect(result.checkOutDay).toBe(6);
    });

    it('should handle wrap-around with unsorted input', () => {
      const result = calculateCheckInOutDays({ selectedDays: [0, 6, 5, 1] });

      expect(result.checkInDay).toBe(5);
      expect(result.checkOutDay).toBe(2);
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================
  describe('error handling', () => {
    it('should throw error for non-array input', () => {
      expect(() => calculateCheckInOutDays({ selectedDays: 'not an array' }))
        .toThrow('selectedDays must be an array');
    });

    it('should throw error for null input', () => {
      expect(() => calculateCheckInOutDays({ selectedDays: null }))
        .toThrow('selectedDays must be an array');
    });

    it('should throw error for undefined input', () => {
      expect(() => calculateCheckInOutDays({ selectedDays: undefined }))
        .toThrow('selectedDays must be an array');
    });

    it('should throw error for empty array', () => {
      expect(() => calculateCheckInOutDays({ selectedDays: [] }))
        .toThrow('selectedDays cannot be empty');
    });

    it('should throw error for invalid day index (7)', () => {
      expect(() => calculateCheckInOutDays({ selectedDays: [1, 2, 7] }))
        .toThrow('Invalid day index 7');
    });

    it('should throw error for negative day index', () => {
      expect(() => calculateCheckInOutDays({ selectedDays: [1, -1, 3] }))
        .toThrow('Invalid day index -1');
    });

    it('should throw error for non-number day index', () => {
      expect(() => calculateCheckInOutDays({ selectedDays: [1, '2', 3] }))
        .toThrow('Invalid day index 2');
    });

    it('should throw error for NaN day index', () => {
      expect(() => calculateCheckInOutDays({ selectedDays: [1, NaN, 3] }))
        .toThrow('Invalid day index NaN');
    });

    it('should throw error for missing params object', () => {
      expect(() => calculateCheckInOutDays())
        .toThrow();
    });

    it('should throw error for empty params object', () => {
      expect(() => calculateCheckInOutDays({}))
        .toThrow();
    });
  });

  // ============================================================================
  // Output Structure Verification
  // ============================================================================
  describe('output structure verification', () => {
    it('should return all expected properties', () => {
      const result = calculateCheckInOutDays({ selectedDays: [1, 2, 3] });

      expect(result).toHaveProperty('checkInDay');
      expect(result).toHaveProperty('checkOutDay');
      expect(result).toHaveProperty('checkInName');
      expect(result).toHaveProperty('checkOutName');
    });

    it('should return correct types for all properties', () => {
      const result = calculateCheckInOutDays({ selectedDays: [1, 2, 3] });

      expect(typeof result.checkInDay).toBe('number');
      expect(typeof result.checkOutDay).toBe('number');
      expect(typeof result.checkInName).toBe('string');
      expect(typeof result.checkOutName).toBe('string');
    });

    it('should return day indices in valid range (0-6)', () => {
      const testCases = [
        [1, 2, 3],
        [5, 6, 0, 1],
        [0, 1, 2, 3, 4, 5, 6],
        [6]
      ];

      for (const days of testCases) {
        const result = calculateCheckInOutDays({ selectedDays: days });
        expect(result.checkInDay).toBeGreaterThanOrEqual(0);
        expect(result.checkInDay).toBeLessThanOrEqual(6);
        expect(result.checkOutDay).toBeGreaterThanOrEqual(0);
        expect(result.checkOutDay).toBeLessThanOrEqual(6);
      }
    });
  });

  // ============================================================================
  // Business Logic Verification
  // ============================================================================
  describe('business logic verification', () => {
    it('should have check-out be day after last selected day', () => {
      // Mon-Fri: last day is Fri (5), check-out should be Sat (6)
      const result = calculateCheckInOutDays({ selectedDays: [1, 2, 3, 4, 5] });
      const lastSelectedDay = 5;
      const expectedCheckOut = (lastSelectedDay + 1) % 7;
      expect(result.checkOutDay).toBe(expectedCheckOut);
    });

    it('should handle check-out wrapping to next week', () => {
      // Sat only: check-out should be Sun (0)
      const result = calculateCheckInOutDays({ selectedDays: [6] });
      expect(result.checkOutDay).toBe(0);
    });

    it('should identify correct check-in for wrap-around', () => {
      // Fri-Mon: check-in should be Fri (first day after gap)
      const result = calculateCheckInOutDays({ selectedDays: [5, 6, 0, 1] });
      expect(result.checkInDay).toBe(5);
    });
  });

  // ============================================================================
  // Real-World Scenario Tests
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should calculate typical part-time stay (Mon-Thu)', () => {
      const result = calculateCheckInOutDays({ selectedDays: [1, 2, 3, 4] });

      expect(result.checkInName).toBe('Monday');
      expect(result.checkOutName).toBe('Friday');
    });

    it('should calculate weekend stay (Fri-Sun)', () => {
      const result = calculateCheckInOutDays({ selectedDays: [5, 6, 0] });

      expect(result.checkInName).toBe('Friday');
      expect(result.checkOutName).toBe('Monday');
    });

    it('should calculate midweek stay (Tue-Thu)', () => {
      const result = calculateCheckInOutDays({ selectedDays: [2, 3, 4] });

      expect(result.checkInName).toBe('Tuesday');
      expect(result.checkOutName).toBe('Friday');
    });

    it('should calculate workweek stay (Mon-Fri)', () => {
      const result = calculateCheckInOutDays({ selectedDays: [1, 2, 3, 4, 5] });

      expect(result.checkInName).toBe('Monday');
      expect(result.checkOutName).toBe('Saturday');
    });
  });
});
