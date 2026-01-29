/**
 * Tests for calculateReservationTotal
 *
 * Calculates estimated reservation total for the full stay period.
 * Formula: (4-week rent) * (total weeks / 4)
 */
import { describe, it, expect } from 'vitest';
import { calculateReservationTotal } from '../calculateReservationTotal.js';

describe('calculateReservationTotal', () => {
  // ============================================================================
  // Happy Path Tests
  // ============================================================================
  describe('happy path', () => {
    it('should calculate total for 13 weeks (standard quarter)', () => {
      const result = calculateReservationTotal({ fourWeekRent: 1600, totalWeeks: 13 });
      // 1600 * (13 / 4) = 1600 * 3.25 = 5200
      expect(result).toBe(5200);
    });

    it('should calculate total for 4 weeks (one billing cycle)', () => {
      const result = calculateReservationTotal({ fourWeekRent: 1600, totalWeeks: 4 });
      // 1600 * (4 / 4) = 1600 * 1 = 1600
      expect(result).toBe(1600);
    });

    it('should calculate total for 8 weeks (two billing cycles)', () => {
      const result = calculateReservationTotal({ fourWeekRent: 2000, totalWeeks: 8 });
      // 2000 * (8 / 4) = 2000 * 2 = 4000
      expect(result).toBe(4000);
    });

    it('should calculate total for 52 weeks (full year)', () => {
      const result = calculateReservationTotal({ fourWeekRent: 1600, totalWeeks: 52 });
      // 1600 * (52 / 4) = 1600 * 13 = 20800
      expect(result).toBe(20800);
    });

    it('should calculate total for 26 weeks (half year)', () => {
      const result = calculateReservationTotal({ fourWeekRent: 2400, totalWeeks: 26 });
      // 2400 * (26 / 4) = 2400 * 6.5 = 15600
      expect(result).toBe(15600);
    });

    it('should calculate total for 1 week (minimum)', () => {
      const result = calculateReservationTotal({ fourWeekRent: 1600, totalWeeks: 1 });
      // 1600 * (1 / 4) = 1600 * 0.25 = 400
      expect(result).toBe(400);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle zero four-week rent', () => {
      const result = calculateReservationTotal({ fourWeekRent: 0, totalWeeks: 13 });
      expect(result).toBe(0);
    });

    it('should handle decimal four-week rent', () => {
      const result = calculateReservationTotal({ fourWeekRent: 1599.99, totalWeeks: 4 });
      // 1599.99 * 1 = 1599.99
      expect(result).toBeCloseTo(1599.99, 2);
    });

    it('should handle very large four-week rent', () => {
      const result = calculateReservationTotal({ fourWeekRent: 50000, totalWeeks: 52 });
      // 50000 * 13 = 650000
      expect(result).toBe(650000);
    });

    it('should handle very small four-week rent', () => {
      const result = calculateReservationTotal({ fourWeekRent: 0.01, totalWeeks: 4 });
      expect(result).toBeCloseTo(0.01, 2);
    });

    it('should handle non-standard week counts (3 weeks)', () => {
      const result = calculateReservationTotal({ fourWeekRent: 1600, totalWeeks: 3 });
      // 1600 * (3 / 4) = 1600 * 0.75 = 1200
      expect(result).toBe(1200);
    });

    it('should handle non-standard week counts (5 weeks)', () => {
      const result = calculateReservationTotal({ fourWeekRent: 1600, totalWeeks: 5 });
      // 1600 * (5 / 4) = 1600 * 1.25 = 2000
      expect(result).toBe(2000);
    });

    it('should handle very large week count', () => {
      const result = calculateReservationTotal({ fourWeekRent: 1600, totalWeeks: 520 });
      // 1600 * (520 / 4) = 1600 * 130 = 208000
      expect(result).toBe(208000);
    });
  });

  // ============================================================================
  // Error Handling - fourWeekRent Validation
  // ============================================================================
  describe('error handling - fourWeekRent validation', () => {
    it('should throw error for negative fourWeekRent', () => {
      expect(() => calculateReservationTotal({ fourWeekRent: -1600, totalWeeks: 13 }))
        .toThrow('fourWeekRent must be a non-negative number');
    });

    it('should throw error for null fourWeekRent', () => {
      expect(() => calculateReservationTotal({ fourWeekRent: null, totalWeeks: 13 }))
        .toThrow('fourWeekRent must be a non-negative number');
    });

    it('should throw error for undefined fourWeekRent', () => {
      expect(() => calculateReservationTotal({ fourWeekRent: undefined, totalWeeks: 13 }))
        .toThrow('fourWeekRent must be a non-negative number');
    });

    it('should throw error for string fourWeekRent', () => {
      expect(() => calculateReservationTotal({ fourWeekRent: '1600', totalWeeks: 13 }))
        .toThrow('fourWeekRent must be a non-negative number');
    });

    it('should throw error for NaN fourWeekRent', () => {
      expect(() => calculateReservationTotal({ fourWeekRent: NaN, totalWeeks: 13 }))
        .toThrow('fourWeekRent must be a non-negative number');
    });

    it('should throw error for object fourWeekRent', () => {
      expect(() => calculateReservationTotal({ fourWeekRent: {}, totalWeeks: 13 }))
        .toThrow('fourWeekRent must be a non-negative number');
    });

    it('should throw error for array fourWeekRent', () => {
      expect(() => calculateReservationTotal({ fourWeekRent: [1600], totalWeeks: 13 }))
        .toThrow('fourWeekRent must be a non-negative number');
    });

    it('should throw error for boolean fourWeekRent', () => {
      expect(() => calculateReservationTotal({ fourWeekRent: true, totalWeeks: 13 }))
        .toThrow('fourWeekRent must be a non-negative number');
    });
  });

  // ============================================================================
  // Error Handling - totalWeeks Validation
  // ============================================================================
  describe('error handling - totalWeeks validation', () => {
    it('should throw error for zero totalWeeks', () => {
      expect(() => calculateReservationTotal({ fourWeekRent: 1600, totalWeeks: 0 }))
        .toThrow('totalWeeks must be positive');
    });

    it('should throw error for negative totalWeeks', () => {
      expect(() => calculateReservationTotal({ fourWeekRent: 1600, totalWeeks: -5 }))
        .toThrow('totalWeeks must be positive');
    });

    it('should throw error for null totalWeeks', () => {
      expect(() => calculateReservationTotal({ fourWeekRent: 1600, totalWeeks: null }))
        .toThrow('totalWeeks must be positive');
    });

    it('should throw error for undefined totalWeeks', () => {
      expect(() => calculateReservationTotal({ fourWeekRent: 1600, totalWeeks: undefined }))
        .toThrow('totalWeeks must be positive');
    });

    it('should throw error for string totalWeeks', () => {
      expect(() => calculateReservationTotal({ fourWeekRent: 1600, totalWeeks: '13' }))
        .toThrow('totalWeeks must be positive');
    });

    it('should throw error for NaN totalWeeks', () => {
      expect(() => calculateReservationTotal({ fourWeekRent: 1600, totalWeeks: NaN }))
        .toThrow('totalWeeks must be positive');
    });

    it('should throw error for object totalWeeks', () => {
      expect(() => calculateReservationTotal({ fourWeekRent: 1600, totalWeeks: {} }))
        .toThrow('totalWeeks must be positive');
    });
  });

  // ============================================================================
  // Boundary Conditions
  // ============================================================================
  describe('boundary conditions', () => {
    it('should handle minimum valid totalWeeks (1 week)', () => {
      const result = calculateReservationTotal({ fourWeekRent: 1600, totalWeeks: 1 });
      expect(result).toBe(400);
    });

    it('should handle fractional week calculation precisely', () => {
      const result = calculateReservationTotal({ fourWeekRent: 1000, totalWeeks: 7 });
      // 1000 * (7 / 4) = 1000 * 1.75 = 1750
      expect(result).toBe(1750);
    });

    it('should maintain precision with decimal inputs', () => {
      const result = calculateReservationTotal({ fourWeekRent: 1599.99, totalWeeks: 13 });
      // 1599.99 * 3.25 = 5199.9675
      expect(result).toBeCloseTo(5199.9675, 2);
    });

    it('should handle decimal week count', () => {
      const result = calculateReservationTotal({ fourWeekRent: 1600, totalWeeks: 4.5 });
      // 1600 * (4.5 / 4) = 1600 * 1.125 = 1800
      expect(result).toBe(1800);
    });
  });

  // ============================================================================
  // Business Logic Verification
  // ============================================================================
  describe('business logic verification', () => {
    it('should follow the formula: fourWeekRent * (totalWeeks / 4)', () => {
      const fourWeekRent = 2500;
      const totalWeeks = 17;
      const expected = fourWeekRent * (totalWeeks / 4);

      const result = calculateReservationTotal({ fourWeekRent, totalWeeks });
      expect(result).toBe(expected);
    });

    it('should calculate typical 3-month stay', () => {
      // 3 months = ~13 weeks, $1600/4weeks
      const result = calculateReservationTotal({ fourWeekRent: 1600, totalWeeks: 13 });
      expect(result).toBe(5200);
    });

    it('should calculate typical 6-month stay', () => {
      // 6 months = ~26 weeks, $1800/4weeks
      const result = calculateReservationTotal({ fourWeekRent: 1800, totalWeeks: 26 });
      expect(result).toBe(11700);
    });

    it('should calculate typical 12-month stay', () => {
      // 12 months = ~52 weeks, $2000/4weeks
      const result = calculateReservationTotal({ fourWeekRent: 2000, totalWeeks: 52 });
      expect(result).toBe(26000);
    });

    it('should scale linearly with weeks', () => {
      const fourWeekRent = 1600;

      const fourWeeks = calculateReservationTotal({ fourWeekRent, totalWeeks: 4 });
      const eightWeeks = calculateReservationTotal({ fourWeekRent, totalWeeks: 8 });
      const twelveWeeks = calculateReservationTotal({ fourWeekRent, totalWeeks: 12 });

      expect(eightWeeks).toBe(fourWeeks * 2);
      expect(twelveWeeks).toBe(fourWeeks * 3);
    });

    it('should scale linearly with four-week rent', () => {
      const totalWeeks = 13;

      const rent1000 = calculateReservationTotal({ fourWeekRent: 1000, totalWeeks });
      const rent2000 = calculateReservationTotal({ fourWeekRent: 2000, totalWeeks });
      const rent3000 = calculateReservationTotal({ fourWeekRent: 3000, totalWeeks });

      expect(rent2000).toBe(rent1000 * 2);
      expect(rent3000).toBe(rent1000 * 3);
    });
  });

  // ============================================================================
  // Input Object Validation
  // ============================================================================
  describe('input object validation', () => {
    it('should work with extra properties in params object', () => {
      const result = calculateReservationTotal({
        fourWeekRent: 1600,
        totalWeeks: 13,
        extraProp: 'ignored'
      });
      expect(result).toBe(5200);
    });

    it('should throw error for missing params object', () => {
      expect(() => calculateReservationTotal())
        .toThrow();
    });

    it('should throw error for empty params object', () => {
      expect(() => calculateReservationTotal({}))
        .toThrow();
    });
  });

  // ============================================================================
  // Real-World Scenario Tests
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should calculate NYC budget stay (4 nights/week, $100/night)', () => {
      // Four-week rent: $100 * 4 nights * 4 weeks = $1600
      // 13 weeks: $1600 * 3.25 = $5200
      const result = calculateReservationTotal({ fourWeekRent: 1600, totalWeeks: 13 });
      expect(result).toBe(5200);
    });

    it('should calculate NYC mid-range stay (4 nights/week, $150/night)', () => {
      // Four-week rent: $150 * 4 nights * 4 weeks = $2400
      // 26 weeks: $2400 * 6.5 = $15600
      const result = calculateReservationTotal({ fourWeekRent: 2400, totalWeeks: 26 });
      expect(result).toBe(15600);
    });

    it('should calculate NYC premium stay (7 nights/week, $200/night)', () => {
      // Four-week rent: $200 * 7 nights * 4 weeks = $5600
      // 52 weeks: $5600 * 13 = $72800
      const result = calculateReservationTotal({ fourWeekRent: 5600, totalWeeks: 52 });
      expect(result).toBe(72800);
    });

    it('should calculate short-term stay', () => {
      // Short stay: 2 weeks
      const result = calculateReservationTotal({ fourWeekRent: 1600, totalWeeks: 2 });
      // 1600 * 0.5 = 800
      expect(result).toBe(800);
    });
  });
});
