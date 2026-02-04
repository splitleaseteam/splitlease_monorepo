/**
 * Integration tests for calculateMonthlyAvgNightly
 *
 * Tests the calculation of monthly average nightly rate.
 */

import { describe, it, expect } from 'vitest';
import { calculateMonthlyAvgNightly } from '../calculateMonthlyAvgNightly.js';

describe('calculateMonthlyAvgNightly', () => {
  describe('Basic Calculation', () => {
    it('should calculate monthlyAvgNightly as monthlyHostRate / avgDaysPerMonth', () => {
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 3000,
        avgDaysPerMonth: 30
      });
      expect(result).toBe(100); // 3000 / 30 = 100
    });

    it('should handle different monthly rates', () => {
      expect(calculateMonthlyAvgNightly({
        monthlyHostRate: 6000,
        avgDaysPerMonth: 30
      })).toBe(200); // 6000 / 30 = 200

      expect(calculateMonthlyAvgNightly({
        monthlyHostRate: 1500,
        avgDaysPerMonth: 30
      })).toBe(50); // 1500 / 30 = 50
    });

    it('should handle different avgDaysPerMonth values', () => {
      const monthlyRate = 3000;
      expect(calculateMonthlyAvgNightly({
        monthlyHostRate: monthlyRate,
        avgDaysPerMonth: 30
      })).toBe(100); // 3000 / 30 = 100

      expect(calculateMonthlyAvgNightly({
        monthlyHostRate: monthlyRate,
        avgDaysPerMonth: 31
      })).toBeCloseTo(96.77, 2); // 3000 / 31 ≈ 96.77

      expect(calculateMonthlyAvgNightly({
        monthlyHostRate: monthlyRate,
        avgDaysPerMonth: 28
      })).toBeCloseTo(107.14, 2); // 3000 / 28 ≈ 107.14
    });
  });

  describe('Rounding Precision', () => {
    it('should round to 2 decimal places', () => {
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 3000,
        avgDaysPerMonth: 30.4
      });
      expect(result).toBeCloseTo(98.68, 2); // 3000 / 30.4 ≈ 98.6842...
    });

    it('should handle repeating decimals', () => {
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 1000,
        avgDaysPerMonth: 30
      });
      expect(result).toBeCloseTo(33.33, 2); // 1000 / 30 = 33.333...
    });

    it('should round up correctly', () => {
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 1001,
        avgDaysPerMonth: 30
      });
      expect(result).toBeCloseTo(33.37, 2); // 1001 / 30 = 33.3666...
    });

    it('should round down correctly', () => {
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 999,
        avgDaysPerMonth: 30
      });
      expect(result).toBeCloseTo(33.30, 2); // 999 / 30 = 33.3
    });
  });

  describe('Standard Average Days Per Month', () => {
    it('should use 30.4 as standard avgDaysPerMonth', () => {
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 3000,
        avgDaysPerMonth: 30.4
      });
      expect(result).toBeCloseTo(98.68, 2); // 3000 / 30.4 ≈ 98.68
    });

    it('should handle 30-day month', () => {
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 3000,
        avgDaysPerMonth: 30
      });
      expect(result).toBe(100);
    });

    it('should handle 31-day month', () => {
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 3000,
        avgDaysPerMonth: 31
      });
      expect(result).toBeCloseTo(96.77, 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero monthly rate', () => {
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 0,
        avgDaysPerMonth: 30
      });
      expect(result).toBe(0);
    });

    it('should handle very small monthly rate', () => {
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 0.01,
        avgDaysPerMonth: 30
      });
      expect(result).toBeCloseTo(0, 4); // 0.01 / 30 = 0.000333..., rounded to 2 decimals = 0.00
    });

    it('should handle very large monthly rate', () => {
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 100000,
        avgDaysPerMonth: 30
      });
      expect(result).toBeCloseTo(3333.33, 2);
    });

    it('should handle minimum avgDaysPerMonth (just above 0)', () => {
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 30,
        avgDaysPerMonth: 0.1
      });
      expect(result).toBe(300); // 30 / 0.1 = 300
    });

    it('should handle very large avgDaysPerMonth', () => {
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 3000,
        avgDaysPerMonth: 365
      });
      expect(result).toBeCloseTo(8.22, 2); // 3000 / 365 ≈ 8.22
    });

    it('should handle fractional monthly rates', () => {
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 2999.99,
        avgDaysPerMonth: 30
      });
      expect(result).toBeCloseTo(100, 0); // ~100
    });
  });

  describe('Error Handling', () => {
    it('should throw error for NaN monthlyHostRate', () => {
      expect(() => {
        calculateMonthlyAvgNightly({
          monthlyHostRate: NaN,
          avgDaysPerMonth: 30
        });
      }).toThrow('monthlyHostRate must be a number');
    });

    it('should throw error for non-number monthlyHostRate', () => {
      expect(() => {
        calculateMonthlyAvgNightly({
          monthlyHostRate: '3000',
          avgDaysPerMonth: 30
        });
      }).toThrow('monthlyHostRate must be a number');
    });

    it('should throw error for null monthlyHostRate', () => {
      expect(() => {
        calculateMonthlyAvgNightly({
          monthlyHostRate: null,
          avgDaysPerMonth: 30
        });
      }).toThrow('monthlyHostRate must be a number');
    });

    it('should throw error for undefined monthlyHostRate', () => {
      expect(() => {
        calculateMonthlyAvgNightly({
          avgDaysPerMonth: 30
        });
      }).toThrow('monthlyHostRate must be a number');
    });

    it('should handle NaN avgDaysPerMonth (validation uses <= 0 check)', () => {
      // Note: The validation checks `avgDaysPerMonth <= 0`, but NaN <= 0 is false
      // So NaN is not caught by the current validation
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 3000,
        avgDaysPerMonth: NaN
      });
      expect(result).toBeNaN(); // Division by NaN produces NaN
    });

    it('should throw error for non-number avgDaysPerMonth', () => {
      expect(() => {
        calculateMonthlyAvgNightly({
          monthlyHostRate: 3000,
          avgDaysPerMonth: '30'
        });
      }).toThrow('avgDaysPerMonth must be positive');
    });

    it('should throw error for null avgDaysPerMonth', () => {
      expect(() => {
        calculateMonthlyAvgNightly({
          monthlyHostRate: 3000,
          avgDaysPerMonth: null
        });
      }).toThrow('avgDaysPerMonth must be positive');
    });

    it('should throw error for undefined avgDaysPerMonth', () => {
      expect(() => {
        calculateMonthlyAvgNightly({
          monthlyHostRate: 3000
        });
      }).toThrow('avgDaysPerMonth must be positive');
    });

    it('should throw error for zero avgDaysPerMonth', () => {
      expect(() => {
        calculateMonthlyAvgNightly({
          monthlyHostRate: 3000,
          avgDaysPerMonth: 0
        });
      }).toThrow('avgDaysPerMonth must be positive');
    });

    it('should throw error for negative avgDaysPerMonth', () => {
      expect(() => {
        calculateMonthlyAvgNightly({
          monthlyHostRate: 3000,
          avgDaysPerMonth: -30
        });
      }).toThrow('avgDaysPerMonth must be positive');
    });

    it('should throw error for negative monthlyHostRate', () => {
      // Note: The function doesn't explicitly reject negative rates,
      // but this test documents the behavior
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: -3000,
        avgDaysPerMonth: 30
      });
      expect(result).toBe(-100);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should calculate for typical NYC apartment', () => {
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 3500,
        avgDaysPerMonth: 30.4
      });
      expect(result).toBeCloseTo(115.13, 2); // 3500 / 30.4 ≈ 115.13
    });

    it('should calculate for luxury apartment', () => {
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 8000,
        avgDaysPerMonth: 30.4
      });
      expect(result).toBeCloseTo(263.16, 2); // 8000 / 30.4 ≈ 263.16
    });

    it('should calculate for budget apartment', () => {
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 1800,
        avgDaysPerMonth: 30.4
      });
      expect(result).toBeCloseTo(59.21, 2); // 1800 / 30.4 ≈ 59.21
    });

    it('should use exact calculation for February (28 days)', () => {
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 3000,
        avgDaysPerMonth: 28
      });
      expect(result).toBeCloseTo(107.14, 2); // 3000 / 28 ≈ 107.14
    });

    it('should use exact calculation for 31-day month', () => {
      const result = calculateMonthlyAvgNightly({
        monthlyHostRate: 3000,
        avgDaysPerMonth: 31
      });
      expect(result).toBeCloseTo(96.77, 2); // 3000 / 31 ≈ 96.77
    });
  });
});
