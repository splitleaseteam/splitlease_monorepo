/**
 * Integration tests for calculateAverageWeeklyPrice
 *
 * Tests the calculation of average weekly price from monthly average nightly rate.
 */

import { describe, it, expect } from 'vitest';
import { calculateAverageWeeklyPrice } from '../calculateAverageWeeklyPrice.js';

describe('calculateAverageWeeklyPrice', () => {
  describe('Basic Calculation', () => {
    it('should calculate avgWeeklyPrice as monthlyAvgNightly × 7', () => {
      const result = calculateAverageWeeklyPrice({
        monthlyAvgNightly: 100
      });
      expect(result).toBe(700); // 100 × 7 = 700
    });

    it('should handle different monthlyAvgNightly values', () => {
      expect(calculateAverageWeeklyPrice({
        monthlyAvgNightly: 150
      })).toBe(1050); // 150 × 7 = 1050

      expect(calculateAverageWeeklyPrice({
        monthlyAvgNightly: 200
      })).toBe(1400); // 200 × 7 = 1400

      expect(calculateAverageWeeklyPrice({
        monthlyAvgNightly: 50
      })).toBe(350); // 50 × 7 = 350
    });
  });

  describe('Rounding Precision', () => {
    it('should round to 2 decimal places', () => {
      const result = calculateAverageWeeklyPrice({
        monthlyAvgNightly: 98.6842
      });
      expect(result).toBeCloseTo(690.79, 2); // 98.6842 × 7 = 690.7894, rounded
    });

    it('should handle repeating decimals', () => {
      const result = calculateAverageWeeklyPrice({
        monthlyAvgNightly: 33.3333
      });
      expect(result).toBeCloseTo(233.33, 2); // 33.3333 × 7 = 233.3331, rounded
    });

    it('should round up correctly', () => {
      const result = calculateAverageWeeklyPrice({
        monthlyAvgNightly: 100.001
      });
      expect(result).toBeCloseTo(700.01, 2); // 100.001 × 7 = 700.007, rounded
    });

    it('should round down correctly', () => {
      const result = calculateAverageWeeklyPrice({
        monthlyAvgNightly: 100.004
      });
      expect(result).toBeCloseTo(700.03, 2); // 100.004 × 7 = 700.028, rounded
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero monthlyAvgNightly', () => {
      const result = calculateAverageWeeklyPrice({
        monthlyAvgNightly: 0
      });
      expect(result).toBe(0);
    });

    it('should handle very small values', () => {
      const result = calculateAverageWeeklyPrice({
        monthlyAvgNightly: 0.01
      });
      expect(result).toBeCloseTo(0.07, 2); // 0.01 × 7 = 0.07
    });

    it('should handle very large values', () => {
      const result = calculateAverageWeeklyPrice({
        monthlyAvgNightly: 10000
      });
      expect(result).toBe(70000); // 10000 × 7 = 70000
    });

    it('should handle fractional values', () => {
      const result = calculateAverageWeeklyPrice({
        monthlyAvgNightly: 99.99
      });
      expect(result).toBeCloseTo(699.93, 2); // 99.99 × 7 = 699.93
    });

    it('should handle negative values (edge case)', () => {
      const result = calculateAverageWeeklyPrice({
        monthlyAvgNightly: -100
      });
      expect(result).toBe(-700); // -100 × 7 = -700
    });
  });

  describe('Integration with calculateMonthlyAvgNightly', () => {
    it('should work with output from calculateMonthlyAvgNightly', () => {
      // Simulate: monthly rate of $3000 with 30.4 avg days
      // Monthly avg nightly = 3000 / 30.4 ≈ 98.68
      // Weekly price = 98.68 × 7 ≈ 690.76
      const monthlyAvgNightly = 98.68;
      const result = calculateAverageWeeklyPrice({ monthlyAvgNightly });
      expect(result).toBeCloseTo(690.76, 2);
    });

    it('should handle precise calculation chain', () => {
      // Monthly rate: $3500, avg days: 30.4
      // Monthly avg nightly = 3500 / 30.4 ≈ 115.13
      // Weekly price = 115.13 × 7 ≈ 805.91
      const monthlyAvgNightly = 115.13;
      const result = calculateAverageWeeklyPrice({ monthlyAvgNightly });
      expect(result).toBeCloseTo(805.91, 2);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for NaN monthlyAvgNightly', () => {
      expect(() => {
        calculateAverageWeeklyPrice({
          monthlyAvgNightly: NaN
        });
      }).toThrow('monthlyAvgNightly must be a number');
    });

    it('should throw error for non-number monthlyAvgNightly', () => {
      expect(() => {
        calculateAverageWeeklyPrice({
          monthlyAvgNightly: '100'
        });
      }).toThrow('monthlyAvgNightly must be a number');
    });

    it('should throw error for null monthlyAvgNightly', () => {
      expect(() => {
        calculateAverageWeeklyPrice({
          monthlyAvgNightly: null
        });
      }).toThrow('monthlyAvgNightly must be a number');
    });

    it('should throw error for undefined monthlyAvgNightly', () => {
      expect(() => {
        calculateAverageWeeklyPrice({});
      }).toThrow('monthlyAvgNightly must be a number');
    });

    it('should handle Infinity (not rejected by isNaN check)', () => {
      // Note: typeof Infinity === 'number' and isNaN(Infinity) === false
      // So the current implementation accepts Infinity
      const result = calculateAverageWeeklyPrice({
        monthlyAvgNightly: Infinity
      });
      expect(result).toBe(Infinity);
    });

    it('should handle negative Infinity (not rejected by isNaN check)', () => {
      // Note: typeof -Infinity === 'number' and isNaN(-Infinity) === false
      // So the current implementation accepts -Infinity
      const result = calculateAverageWeeklyPrice({
        monthlyAvgNightly: -Infinity
      });
      expect(result).toBe(-Infinity);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should calculate weekly price for typical NYC apartment', () => {
      // Monthly rate: $3500, avg days: 30.4
      // Monthly avg nightly ≈ 115.13
      // Weekly price ≈ 805.91
      const monthlyAvgNightly = 115.13;
      const result = calculateAverageWeeklyPrice({ monthlyAvgNightly });
      expect(result).toBeCloseTo(805.91, 2);
    });

    it('should calculate weekly price for luxury apartment', () => {
      // Monthly rate: $8000, avg days: 30.4
      // Monthly avg nightly ≈ 263.16
      // Weekly price ≈ 1842.12
      const monthlyAvgNightly = 263.16;
      const result = calculateAverageWeeklyPrice({ monthlyAvgNightly });
      expect(result).toBeCloseTo(1842.12, 2);
    });

    it('should calculate weekly price for budget apartment', () => {
      // Monthly rate: $1800, avg days: 30.4
      // Monthly avg nightly ≈ 59.21
      // Weekly price ≈ 414.47
      const monthlyAvgNightly = 59.21;
      const result = calculateAverageWeeklyPrice({ monthlyAvgNightly });
      expect(result).toBeCloseTo(414.47, 2);
    });

    it('should calculate weekly price for exact $100/night', () => {
      const result = calculateAverageWeeklyPrice({
        monthlyAvgNightly: 100
      });
      expect(result).toBe(700);
    });

    it('should calculate weekly price for exact $150/night', () => {
      const result = calculateAverageWeeklyPrice({
        monthlyAvgNightly: 150
      });
      expect(result).toBe(1050);
    });

    it('should calculate weekly price for exact $200/night', () => {
      const result = calculateAverageWeeklyPrice({
        monthlyAvgNightly: 200
      });
      expect(result).toBe(1400);
    });
  });

  describe('Mathematical Accuracy', () => {
    it('should always multiply by exactly 7', () => {
      const testValues = [50, 75, 100, 125, 150, 175, 200];
      testValues.forEach(monthlyAvgNightly => {
        const result = calculateAverageWeeklyPrice({ monthlyAvgNightly });
        const expected = monthlyAvgNightly * 7;
        expect(result).toBeCloseTo(expected, 2);
      });
    });

    it('should maintain precision through multiplication', () => {
      const monthlyAvgNightly = 123.456;
      const result = calculateAverageWeeklyPrice({ monthlyAvgNightly });
      const expected = 123.456 * 7; // 864.192
      expect(result).toBeCloseTo(expected, 2);
      expect(result).toBe(864.19); // Rounded to 2 decimals
    });
  });
});
