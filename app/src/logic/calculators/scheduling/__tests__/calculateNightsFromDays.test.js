/**
 * Tests for calculateNightsFromDays
 *
 * Calculates number of nights from selected days.
 * In split lease, nights = days selected (continuous selection).
 */
import { describe, it, expect } from 'vitest';
import { calculateNightsFromDays } from '../calculateNightsFromDays.js';

describe('calculateNightsFromDays', () => {
  // ============================================================================
  // Happy Path Tests
  // ============================================================================
  describe('happy path', () => {
    it('should return 5 nights for Mon-Fri selection', () => {
      const result = calculateNightsFromDays({ selectedDays: [1, 2, 3, 4, 5] });
      expect(result).toBe(5);
    });

    it('should return 4 nights for Mon-Thu selection', () => {
      const result = calculateNightsFromDays({ selectedDays: [1, 2, 3, 4] });
      expect(result).toBe(4);
    });

    it('should return 7 nights for full week selection', () => {
      const result = calculateNightsFromDays({ selectedDays: [0, 1, 2, 3, 4, 5, 6] });
      expect(result).toBe(7);
    });

    it('should return 2 nights for weekend selection', () => {
      const result = calculateNightsFromDays({ selectedDays: [5, 6] });
      expect(result).toBe(2);
    });

    it('should return 3 nights for Fri-Sun selection', () => {
      const result = calculateNightsFromDays({ selectedDays: [5, 6, 0] });
      expect(result).toBe(3);
    });

    it('should return 1 night for single day selection', () => {
      const result = calculateNightsFromDays({ selectedDays: [3] });
      expect(result).toBe(1);
    });
  });

  // ============================================================================
  // Day Index Coverage Tests
  // ============================================================================
  describe('day index coverage', () => {
    it('should handle Sunday (0) correctly', () => {
      const result = calculateNightsFromDays({ selectedDays: [0] });
      expect(result).toBe(1);
    });

    it('should handle Monday (1) correctly', () => {
      const result = calculateNightsFromDays({ selectedDays: [1] });
      expect(result).toBe(1);
    });

    it('should handle Tuesday (2) correctly', () => {
      const result = calculateNightsFromDays({ selectedDays: [2] });
      expect(result).toBe(1);
    });

    it('should handle Wednesday (3) correctly', () => {
      const result = calculateNightsFromDays({ selectedDays: [3] });
      expect(result).toBe(1);
    });

    it('should handle Thursday (4) correctly', () => {
      const result = calculateNightsFromDays({ selectedDays: [4] });
      expect(result).toBe(1);
    });

    it('should handle Friday (5) correctly', () => {
      const result = calculateNightsFromDays({ selectedDays: [5] });
      expect(result).toBe(1);
    });

    it('should handle Saturday (6) correctly', () => {
      const result = calculateNightsFromDays({ selectedDays: [6] });
      expect(result).toBe(1);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle duplicate day indices', () => {
      const result = calculateNightsFromDays({ selectedDays: [1, 1, 2, 2, 3] });
      expect(result).toBe(5); // Counts duplicates (array length)
    });

    it('should handle unsorted input', () => {
      const result = calculateNightsFromDays({ selectedDays: [5, 2, 4, 1, 3] });
      expect(result).toBe(5);
    });

    it('should handle reverse-ordered input', () => {
      const result = calculateNightsFromDays({ selectedDays: [5, 4, 3, 2, 1] });
      expect(result).toBe(5);
    });

    it('should handle non-contiguous days', () => {
      // Mon, Wed, Fri
      const result = calculateNightsFromDays({ selectedDays: [1, 3, 5] });
      expect(result).toBe(3);
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================
  describe('error handling', () => {
    it('should throw error for non-array input', () => {
      expect(() => calculateNightsFromDays({ selectedDays: 'not an array' }))
        .toThrow('selectedDays must be an array');
    });

    it('should throw error for null input', () => {
      expect(() => calculateNightsFromDays({ selectedDays: null }))
        .toThrow('selectedDays must be an array');
    });

    it('should throw error for undefined input', () => {
      expect(() => calculateNightsFromDays({ selectedDays: undefined }))
        .toThrow('selectedDays must be an array');
    });

    it('should throw error for number input', () => {
      expect(() => calculateNightsFromDays({ selectedDays: 5 }))
        .toThrow('selectedDays must be an array');
    });

    it('should throw error for object input', () => {
      expect(() => calculateNightsFromDays({ selectedDays: { 0: 1 } }))
        .toThrow('selectedDays must be an array');
    });

    it('should throw error for invalid day index (7)', () => {
      expect(() => calculateNightsFromDays({ selectedDays: [1, 2, 7] }))
        .toThrow('Invalid day index 7');
    });

    it('should throw error for invalid day index (8)', () => {
      expect(() => calculateNightsFromDays({ selectedDays: [8] }))
        .toThrow('Invalid day index 8');
    });

    it('should throw error for negative day index', () => {
      expect(() => calculateNightsFromDays({ selectedDays: [-1] }))
        .toThrow('Invalid day index -1');
    });

    it('should throw error for non-number day index (string)', () => {
      expect(() => calculateNightsFromDays({ selectedDays: ['1', 2, 3] }))
        .toThrow('Invalid day index 1');
    });

    it('should throw error for NaN day index', () => {
      expect(() => calculateNightsFromDays({ selectedDays: [1, NaN, 3] }))
        .toThrow('Invalid day index NaN');
    });

    it('should throw error for null day index', () => {
      expect(() => calculateNightsFromDays({ selectedDays: [1, null, 3] }))
        .toThrow('Invalid day index null');
    });

    it('should throw error for undefined day index', () => {
      expect(() => calculateNightsFromDays({ selectedDays: [1, undefined, 3] }))
        .toThrow('Invalid day index undefined');
    });

    it('should throw error for object day index', () => {
      expect(() => calculateNightsFromDays({ selectedDays: [1, {}, 3] }))
        .toThrow('Invalid day index');
    });

    it('should throw error for missing params object', () => {
      expect(() => calculateNightsFromDays())
        .toThrow();
    });

    it('should throw error for empty params object', () => {
      expect(() => calculateNightsFromDays({}))
        .toThrow();
    });
  });

  // ============================================================================
  // Boundary Conditions
  // ============================================================================
  describe('boundary conditions', () => {
    it('should handle empty array (0 nights)', () => {
      const result = calculateNightsFromDays({ selectedDays: [] });
      expect(result).toBe(0);
    });

    it('should handle minimum day index (0)', () => {
      const result = calculateNightsFromDays({ selectedDays: [0] });
      expect(result).toBe(1);
    });

    it('should handle maximum day index (6)', () => {
      const result = calculateNightsFromDays({ selectedDays: [6] });
      expect(result).toBe(1);
    });

    it('should handle minimum and maximum together', () => {
      const result = calculateNightsFromDays({ selectedDays: [0, 6] });
      expect(result).toBe(2);
    });
  });

  // ============================================================================
  // Business Logic Verification
  // ============================================================================
  describe('business logic verification', () => {
    it('should return array length (nights = selected days)', () => {
      const selectedDays = [1, 2, 3, 4, 5];
      const result = calculateNightsFromDays({ selectedDays });
      expect(result).toBe(selectedDays.length);
    });

    it('should verify typical part-time stay nights', () => {
      // 4 nights per week is typical part-time
      const result = calculateNightsFromDays({ selectedDays: [1, 2, 3, 4] });
      expect(result).toBe(4);
    });

    it('should verify full-time stay nights', () => {
      // 7 nights per week is full-time
      const result = calculateNightsFromDays({ selectedDays: [0, 1, 2, 3, 4, 5, 6] });
      expect(result).toBe(7);
    });

    it('should verify minimum stay nights', () => {
      // 2 nights is minimum for split lease
      const result = calculateNightsFromDays({ selectedDays: [5, 6] });
      expect(result).toBe(2);
    });
  });

  // ============================================================================
  // Real-World Scenario Tests
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should calculate typical weekday stay (Mon-Thu)', () => {
      const result = calculateNightsFromDays({ selectedDays: [1, 2, 3, 4] });
      expect(result).toBe(4);
    });

    it('should calculate weekend warrior stay (Fri-Sun)', () => {
      const result = calculateNightsFromDays({ selectedDays: [5, 6, 0] });
      expect(result).toBe(3);
    });

    it('should calculate Saturday-only stay', () => {
      const result = calculateNightsFromDays({ selectedDays: [6] });
      expect(result).toBe(1);
    });

    it('should calculate business week stay (Mon-Fri)', () => {
      const result = calculateNightsFromDays({ selectedDays: [1, 2, 3, 4, 5] });
      expect(result).toBe(5);
    });

    it('should calculate long weekend stay (Thu-Sun)', () => {
      const result = calculateNightsFromDays({ selectedDays: [4, 5, 6, 0] });
      expect(result).toBe(4);
    });
  });

  // ============================================================================
  // Input Object Validation
  // ============================================================================
  describe('input object validation', () => {
    it('should work with extra properties in params object', () => {
      const result = calculateNightsFromDays({
        selectedDays: [1, 2, 3],
        extraProp: 'ignored'
      });
      expect(result).toBe(3);
    });

    it('should handle nested arrays (only outer array counted)', () => {
      // This would throw due to invalid day index
      expect(() => calculateNightsFromDays({ selectedDays: [[1, 2], 3] }))
        .toThrow('Invalid day index');
    });
  });
});
