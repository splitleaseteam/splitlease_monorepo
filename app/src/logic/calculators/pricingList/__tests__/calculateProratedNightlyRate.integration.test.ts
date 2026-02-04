/**
 * Integration tests for calculateProratedNightlyRate
 *
 * Tests the calculation of prorated nightly rate based on rental type.
 */

import { describe, it, expect } from 'vitest';
import { calculateProratedNightlyRate } from '../calculateProratedNightlyRate.js';

describe('calculateProratedNightlyRate', () => {
  describe('Weekly Rental Type', () => {
    it('should calculate rate as weeklyHostRate / selectedNights', () => {
      const result = calculateProratedNightlyRate({
        rentalType: 'Weekly',
        selectedNights: 3,
        weeklyHostRate: 600
      });
      expect(result).toBe(200); // 600 / 3 = 200
    });

    it('should handle different selected nights', () => {
      const weeklyRate = 700;
      expect(calculateProratedNightlyRate({
        rentalType: 'Weekly',
        selectedNights: 2,
        weeklyHostRate: weeklyRate
      })).toBe(350); // 700 / 2 = 350

      expect(calculateProratedNightlyRate({
        rentalType: 'Weekly',
        selectedNights: 7,
        weeklyHostRate: weeklyRate
      })).toBeCloseTo(100, 1); // 700 / 7 = 100
    });

    it('should round to 2 decimal places', () => {
      const result = calculateProratedNightlyRate({
        rentalType: 'Weekly',
        selectedNights: 3,
        weeklyHostRate: 1000
      });
      expect(result).toBeCloseTo(333.33, 2); // 1000 / 3 = 333.333...
    });
  });

  describe('Monthly Rental Type', () => {
    it('should calculate rate using monthlyHostRate / avgDaysPerMonth * 7 / selectedNights', () => {
      const result = calculateProratedNightlyRate({
        rentalType: 'Monthly',
        selectedNights: 3,
        monthlyHostRate: 3000,
        avgDaysPerMonth: 30
      });
      // (3000 / 30) * 7 / 3 = 100 * 7 / 3 = 233.333...
      expect(result).toBeCloseTo(233.33, 2);
    });

    it('should handle standard 30-day month', () => {
      const result = calculateProratedNightlyRate({
        rentalType: 'Monthly',
        selectedNights: 7,
        monthlyHostRate: 3000,
        avgDaysPerMonth: 30
      });
      // (3000 / 30) * 7 / 7 = 100 * 1 = 100
      expect(result).toBe(100);
    });

    it('should handle average days per month (30.4)', () => {
      const result = calculateProratedNightlyRate({
        rentalType: 'Monthly',
        selectedNights: 7,
        monthlyHostRate: 3000,
        avgDaysPerMonth: 30.4
      });
      // (3000 / 30.4) * 7 / 7 ≈ 98.68
      expect(result).toBeCloseTo(98.68, 2);
    });

    it('should round to 2 decimal places', () => {
      const result = calculateProratedNightlyRate({
        rentalType: 'Monthly',
        selectedNights: 5,
        monthlyHostRate: 3500,
        avgDaysPerMonth: 30
      });
      // (3500 / 30) * 7 / 5 = 116.666... * 7 / 5 ≈ 163.33
      expect(result).toBeCloseTo(163.33, 2);
    });
  });

  describe('Nightly Rental Type', () => {
    it('should use specific night rate from nightlyRates array', () => {
      const result = calculateProratedNightlyRate({
        rentalType: 'Nightly',
        selectedNights: 2,
        nightlyRates: [100, 95, 90, 85, 80, 75, 70]
      });
      expect(result).toBe(100); // Index 0 (2 nights)
    });

    it('should map selectedNights to correct array index', () => {
      const nightlyRates = [100, 95, 90, 85, 80, 75, 70];

      // 2 nights -> index 0
      expect(calculateProratedNightlyRate({
        rentalType: 'Nightly',
        selectedNights: 2,
        nightlyRates
      })).toBe(100);

      // 3 nights -> index 1
      expect(calculateProratedNightlyRate({
        rentalType: 'Nightly',
        selectedNights: 3,
        nightlyRates
      })).toBe(95);

      // 4 nights -> index 2
      expect(calculateProratedNightlyRate({
        rentalType: 'Nightly',
        selectedNights: 4,
        nightlyRates
      })).toBe(90);

      // 7 nights -> index 5
      expect(calculateProratedNightlyRate({
        rentalType: 'Nightly',
        selectedNights: 7,
        nightlyRates
      })).toBe(75);
    });

    it('should return the rate directly (no division)', () => {
      const result = calculateProratedNightlyRate({
        rentalType: 'Nightly',
        selectedNights: 5,
        nightlyRates: [150, 140, 130, 120, 110, 100, 90]
      });
      expect(result).toBe(120); // Index 3 (5-2=3)
    });
  });

  describe('Rounding Precision', () => {
    it('should round weekly rates to 2 decimal places', () => {
      const result = calculateProratedNightlyRate({
        rentalType: 'Weekly',
        selectedNights: 3,
        weeklyHostRate: 1000
      });
      expect(result).toBe(333.33);
    });

    it('should round monthly rates to 2 decimal places', () => {
      const result = calculateProratedNightlyRate({
        rentalType: 'Monthly',
        selectedNights: 3,
        monthlyHostRate: 3000,
        avgDaysPerMonth: 30
      });
      expect(result).toBe(233.33);
    });

    it('should round nightly rates to 2 decimal places', () => {
      const result = calculateProratedNightlyRate({
        rentalType: 'Nightly',
        selectedNights: 3,
        nightlyRates: [100.456, 95.789, 90.123, 85.456, 80.789, 75.123, 70.456]
      });
      expect(result).toBeCloseTo(95.79, 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum selectedNights (1)', () => {
      const result = calculateProratedNightlyRate({
        rentalType: 'Weekly',
        selectedNights: 1,
        weeklyHostRate: 700
      });
      expect(result).toBe(700);
    });

    it('should handle maximum selectedNights (7)', () => {
      const result = calculateProratedNightlyRate({
        rentalType: 'Weekly',
        selectedNights: 7,
        weeklyHostRate: 700
      });
      expect(result).toBeCloseTo(100, 1);
    });

    it('should handle zero weekly rate', () => {
      const result = calculateProratedNightlyRate({
        rentalType: 'Weekly',
        selectedNights: 3,
        weeklyHostRate: 0
      });
      expect(result).toBe(0);
    });

    it('should handle zero monthly rate', () => {
      const result = calculateProratedNightlyRate({
        rentalType: 'Monthly',
        selectedNights: 7,
        monthlyHostRate: 0,
        avgDaysPerMonth: 30
      });
      expect(result).toBe(0);
    });

    it('should handle very small avgDaysPerMonth', () => {
      const result = calculateProratedNightlyRate({
        rentalType: 'Monthly',
        selectedNights: 7,
        monthlyHostRate: 3000,
        avgDaysPerMonth: 1
      });
      expect(result).toBe(3000); // (3000 / 1) * 7 / 7 = 3000
    });
  });

  describe('Error Handling', () => {
    describe('selectedNights validation', () => {
      it('should throw error for selectedNights < 1', () => {
        expect(() => {
          calculateProratedNightlyRate({
            rentalType: 'Weekly',
            selectedNights: 0,
            weeklyHostRate: 600
          });
        }).toThrow('selectedNights must be 1-7');
      });

      it('should throw error for selectedNights > 7', () => {
        expect(() => {
          calculateProratedNightlyRate({
            rentalType: 'Weekly',
            selectedNights: 8,
            weeklyHostRate: 600
          });
        }).toThrow('selectedNights must be 1-7');
      });

      it('should throw error for non-number selectedNights', () => {
        expect(() => {
          calculateProratedNightlyRate({
            rentalType: 'Weekly',
            selectedNights: '3',
            weeklyHostRate: 600
          });
        }).toThrow('selectedNights must be 1-7');
      });
    });

    describe('Weekly rental errors', () => {
      it('should throw error for missing weeklyHostRate', () => {
        expect(() => {
          calculateProratedNightlyRate({
            rentalType: 'Weekly',
            selectedNights: 3
          });
        }).toThrow('weeklyHostRate required for Weekly rental');
      });

      it('should throw error for NaN weeklyHostRate', () => {
        expect(() => {
          calculateProratedNightlyRate({
            rentalType: 'Weekly',
            selectedNights: 3,
            weeklyHostRate: NaN
          });
        }).toThrow('weeklyHostRate required for Weekly rental');
      });

      it('should throw error for null weeklyHostRate', () => {
        expect(() => {
          calculateProratedNightlyRate({
            rentalType: 'Weekly',
            selectedNights: 3,
            weeklyHostRate: null
          });
        }).toThrow('weeklyHostRate required for Weekly rental');
      });
    });

    describe('Monthly rental errors', () => {
      it('should throw error for missing monthlyHostRate', () => {
        expect(() => {
          calculateProratedNightlyRate({
            rentalType: 'Monthly',
            selectedNights: 7,
            avgDaysPerMonth: 30
          });
        }).toThrow('monthlyHostRate required for Monthly rental');
      });

      it('should throw error for missing avgDaysPerMonth', () => {
        expect(() => {
          calculateProratedNightlyRate({
            rentalType: 'Monthly',
            selectedNights: 7,
            monthlyHostRate: 3000
          });
        }).toThrow('avgDaysPerMonth must be positive');
      });

      it('should throw error for non-positive avgDaysPerMonth', () => {
        expect(() => {
          calculateProratedNightlyRate({
            rentalType: 'Monthly',
            selectedNights: 7,
            monthlyHostRate: 3000,
            avgDaysPerMonth: 0
          });
        }).toThrow('avgDaysPerMonth must be positive');
      });

      it('should throw error for negative avgDaysPerMonth', () => {
        expect(() => {
          calculateProratedNightlyRate({
            rentalType: 'Monthly',
            selectedNights: 7,
            monthlyHostRate: 3000,
            avgDaysPerMonth: -30
          });
        }).toThrow('avgDaysPerMonth must be positive');
      });
    });

    describe('Nightly rental errors', () => {
      it('should throw error for missing nightlyRates', () => {
        expect(() => {
          calculateProratedNightlyRate({
            rentalType: 'Nightly',
            selectedNights: 3
          });
        }).toThrow('nightlyRates must be array with at least 4 elements');
      });

      it('should throw error for non-array nightlyRates', () => {
        expect(() => {
          calculateProratedNightlyRate({
            rentalType: 'Nightly',
            selectedNights: 3,
            nightlyRates: 'not an array'
          });
        }).toThrow('nightlyRates must be array with at least 4 elements');
      });

      it('should throw error for insufficient nightlyRates length', () => {
        expect(() => {
          calculateProratedNightlyRate({
            rentalType: 'Nightly',
            selectedNights: 3,
            nightlyRates: [100, 95] // Only 2 elements
          });
        }).toThrow('nightlyRates must be array with at least 4 elements');
      });

      it('should throw error for null rate at index', () => {
        expect(() => {
          calculateProratedNightlyRate({
            rentalType: 'Nightly',
            selectedNights: 3,
            nightlyRates: [100, null, 90, 85]
          });
        }).toThrow('Rate for 3 nights is null');
      });

      it('should throw error for rate out of bounds', () => {
        expect(() => {
          calculateProratedNightlyRate({
            rentalType: 'Nightly',
            selectedNights: 1,
            nightlyRates: [100, 95, 90, 85]
          });
        }).toThrow('No rate for 1 nights');
      });
    });

    describe('Unknown rental type', () => {
      it('should throw error for unknown rentalType', () => {
        expect(() => {
          calculateProratedNightlyRate({
            rentalType: 'Unknown',
            selectedNights: 3
          });
        }).toThrow('Unknown rentalType "Unknown"');
      });

      it('should throw error for case-sensitive rentalType', () => {
        expect(() => {
          calculateProratedNightlyRate({
            rentalType: 'weekly',
            selectedNights: 3,
            weeklyHostRate: 600
          });
        }).toThrow('Unknown rentalType "weekly"');
      });
    });
  });

  describe('Real-World Scenarios', () => {
    it('should calculate weekly rate for 4-night stay', () => {
      const result = calculateProratedNightlyRate({
        rentalType: 'Weekly',
        selectedNights: 4,
        weeklyHostRate: 800
      });
      expect(result).toBe(200);
    });

    it('should calculate monthly rate for 7-night stay', () => {
      const result = calculateProratedNightlyRate({
        rentalType: 'Monthly',
        selectedNights: 7,
        monthlyHostRate: 3000,
        avgDaysPerMonth: 30.4
      });
      expect(result).toBeCloseTo(98.68, 2);
    });

    it('should calculate nightly rate for 5-night stay', () => {
      const result = calculateProratedNightlyRate({
        rentalType: 'Nightly',
        selectedNights: 5,
        nightlyRates: [150, 140, 130, 120, 110, 100, 90]
      });
      expect(result).toBe(120);
    });

    it('should handle conversion from monthly to weekly equivalent', () => {
      // $3000/month with 30.4 avg days
      // = $98.68/night * 7 nights = $690.76/week
      // For 3 nights: $690.76 / 3 = $230.25/night
      const result = calculateProratedNightlyRate({
        rentalType: 'Monthly',
        selectedNights: 3,
        monthlyHostRate: 3000,
        avgDaysPerMonth: 30.4
      });
      expect(result).toBeCloseTo(230.26, 2);
    });
  });
});
