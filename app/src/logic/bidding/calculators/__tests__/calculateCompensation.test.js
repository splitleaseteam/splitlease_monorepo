/**
 * Tests for calculateCompensation.js
 *
 * Tests for:
 * - calculateLoserCompensation: 25% of winning bid
 * - calculatePlatformRevenue: 75% of winning bid (or bid - compensation)
 * - calculateFinancialBreakdown: Complete financial breakdown
 *
 * Business Rules:
 * - Loser receives exactly 25% of winning bid as compensation
 * - Platform keeps exactly 75% of winning bid as revenue
 * - All amounts rounded to nearest cent (2 decimal places)
 */
import { describe, it, expect } from 'vitest';
import {
  calculateLoserCompensation,
  calculatePlatformRevenue,
  calculateFinancialBreakdown,
} from '../calculateCompensation.js';

describe('calculateCompensation.js', () => {
  // ============================================================================
  // calculateLoserCompensation
  // ============================================================================
  describe('calculateLoserCompensation', () => {
    // ------------------------------------------------------------------------
    // Happy Path - 25% Compensation Calculation
    // ------------------------------------------------------------------------
    describe('happy path - 25% compensation calculation', () => {
      it('should calculate 25% of winning bid for round number ($1000 → $250)', () => {
        const result = calculateLoserCompensation({ winningBid: 1000 });
        expect(result).toBe(250);
      });

      it('should calculate 25% of winning bid for round number ($2000 → $500)', () => {
        const result = calculateLoserCompensation({ winningBid: 2000 });
        expect(result).toBe(500);
      });

      it('should calculate 25% of winning bid with decimal precision ($2835 → $708.75)', () => {
        const result = calculateLoserCompensation({ winningBid: 2835 });
        expect(result).toBe(708.75);
      });

      it('should calculate 25% of winning bid ($1500 → $375)', () => {
        const result = calculateLoserCompensation({ winningBid: 1500 });
        expect(result).toBe(375);
      });

      it('should calculate 25% of winning bid ($500 → $125)', () => {
        const result = calculateLoserCompensation({ winningBid: 500 });
        expect(result).toBe(125);
      });

      it('should calculate 25% of winning bid ($250 → $62.50)', () => {
        const result = calculateLoserCompensation({ winningBid: 250 });
        expect(result).toBe(62.50);
      });

      it('should calculate 25% of winning bid for very high bid ($10000 → $2500)', () => {
        const result = calculateLoserCompensation({ winningBid: 10000 });
        expect(result).toBe(2500);
      });

      it('should calculate 25% of winning bid for very low bid ($100 → $25)', () => {
        const result = calculateLoserCompensation({ winningBid: 100 });
        expect(result).toBe(25);
      });
    });

    // ------------------------------------------------------------------------
    // Decimal Precision Tests
    // ------------------------------------------------------------------------
    describe('decimal precision - rounding to cents', () => {
      it('should round to nearest cent for $100.01 bid ($25.0025 → $25)', () => {
        const result = calculateLoserCompensation({ winningBid: 100.01 });
        expect(result).toBe(25.00); // 100.01 * 0.25 = 25.0025 → 25.00
      });

      it('should round to nearest cent for $100.03 bid ($25.0075 → $25.01)', () => {
        const result = calculateLoserCompensation({ winningBid: 100.03 });
        expect(result).toBe(25.01); // 100.03 * 0.25 = 25.0075 → 25.01
      });

      it('should round to nearest cent for $333.33 bid ($83.3325 → $83.33)', () => {
        const result = calculateLoserCompensation({ winningBid: 333.33 });
        expect(result).toBe(83.33); // 333.33 * 0.25 = 83.3325 → 83.33
      });

      it('should round to nearest cent for $666.66 bid ($166.665 → $166.67)', () => {
        const result = calculateLoserCompensation({ winningBid: 666.66 });
        expect(result).toBe(166.67); // 666.66 * 0.25 = 166.665 → 166.67
      });

      it('should round to nearest cent for $999.99 bid ($249.9975 → $250)', () => {
        const result = calculateLoserCompensation({ winningBid: 999.99 });
        expect(result).toBe(250); // 999.99 * 0.25 = 249.9975 → 250.00
      });

      it('should handle $0.01 bid ($0.0025 → $0)', () => {
        const result = calculateLoserCompensation({ winningBid: 0.01 });
        expect(result).toBe(0); // 0.01 * 0.25 = 0.0025 → 0
      });

      it('should handle $0.04 bid ($0.01)', () => {
        const result = calculateLoserCompensation({ winningBid: 0.04 });
        expect(result).toBe(0.01); // 0.04 * 0.25 = 0.01
      });
    });

    // ------------------------------------------------------------------------
    // Edge Cases
    // ------------------------------------------------------------------------
    describe('edge cases', () => {
      it('should handle zero winning bid', () => {
        const result = calculateLoserCompensation({ winningBid: 0 });
        expect(result).toBe(0);
      });

      it('should handle very small decimal bids', () => {
        const result = calculateLoserCompensation({ winningBid: 0.10 });
        expect(result).toBe(0.03); // 0.10 * 0.25 = 0.025 → 0.03 (round up)
      });

      it('should handle very large winning bids', () => {
        const result = calculateLoserCompensation({ winningBid: 999999.99 });
        expect(result).toBe(250000); // 999999.99 * 0.25 = 249999.9975 → 250000 (rounded)
      });

      it('should handle bid amount with 3 decimal places', () => {
        const result = calculateLoserCompensation({ winningBid: 123.456 });
        expect(result).toBe(30.86); // 123.456 * 0.25 = 30.864 → 30.86
      });

      it('should handle bid amount with 4 decimal places', () => {
        const result = calculateLoserCompensation({ winningBid: 123.4567 });
        expect(result).toBe(30.86); // 123.4567 * 0.25 = 30.864175 → 30.86
      });
    });

    // ------------------------------------------------------------------------
    // Input Validation
    // ------------------------------------------------------------------------
    describe('input validation', () => {
      it('should handle null winningBid (returns 0 after coercion)', () => {
        const result = calculateLoserCompensation({ winningBid: null });
        expect(result).toBe(0); // null * 0.25 = 0
      });

      it('should handle undefined winningBid (returns NaN)', () => {
        const result = calculateLoserCompensation({ winningBid: undefined });
        expect(result).toBeNaN();
      });

      it('should handle negative winning bid', () => {
        const result = calculateLoserCompensation({ winningBid: -100 });
        expect(result).toBe(-25);
      });

      it('should handle string winningBid (coerced to number)', () => {
        const result = calculateLoserCompensation({ winningBid: '1000' });
        expect(result).toBe(250);
      });

      it('should handle missing params object', () => {
        expect(() => calculateLoserCompensation())
          .toThrow(); // Cannot read property 'winningBid' of undefined
      });
    });
  });

  // ============================================================================
  // calculatePlatformRevenue
  // ============================================================================
  describe('calculatePlatformRevenue', () => {
    // ------------------------------------------------------------------------
    // Happy Path - Direct 75% Calculation
    // ------------------------------------------------------------------------
    describe('happy path - direct 75% calculation', () => {
      it('should calculate 75% of winning bid ($1000 → $750)', () => {
        const result = calculatePlatformRevenue({ winningBid: 1000 });
        expect(result).toBe(750);
      });

      it('should calculate 75% of winning bid ($2000 → $1500)', () => {
        const result = calculatePlatformRevenue({ winningBid: 2000 });
        expect(result).toBe(1500);
      });

      it('should calculate 75% of winning bid ($2835 → $2126.25)', () => {
        const result = calculatePlatformRevenue({ winningBid: 2835 });
        expect(result).toBe(2126.25);
      });

      it('should calculate 75% of winning bid ($1500 → $1125)', () => {
        const result = calculatePlatformRevenue({ winningBid: 1500 });
        expect(result).toBe(1125);
      });

      it('should calculate 75% of winning bid ($500 → $375)', () => {
        const result = calculatePlatformRevenue({ winningBid: 500 });
        expect(result).toBe(375);
      });

      it('should calculate 75% of winning bid for very high bid ($10000 → $7500)', () => {
        const result = calculatePlatformRevenue({ winningBid: 10000 });
        expect(result).toBe(7500);
      });

      it('should calculate 75% of winning bid for very low bid ($100 → $75)', () => {
        const result = calculatePlatformRevenue({ winningBid: 100 });
        expect(result).toBe(75);
      });
    });

    // ------------------------------------------------------------------------
    // Using Pre-calculated Compensation
    // ------------------------------------------------------------------------
    describe('using pre-calculated compensation', () => {
      it('should calculate revenue as bid - compensation ($1000 - $250 = $750)', () => {
        const result = calculatePlatformRevenue({
          winningBid: 1000,
          compensation: 250
        });
        expect(result).toBe(750);
      });

      it('should calculate revenue as bid - compensation ($2835 - $708.75 = $2126.25)', () => {
        const result = calculatePlatformRevenue({
          winningBid: 2835,
          compensation: 708.75
        });
        expect(result).toBe(2126.25);
      });

      it('should use pre-calculated compensation when provided', () => {
        // Even if compensation differs from 25%, use the provided value
        const result = calculatePlatformRevenue({
          winningBid: 1000,
          compensation: 300 // Non-standard 30%
        });
        expect(result).toBe(700);
      });

      it('should handle compensation of zero', () => {
        const result = calculatePlatformRevenue({
          winningBid: 1000,
          compensation: 0
        });
        expect(result).toBe(1000);
      });

      it('should handle compensation equal to bid (100% compensation)', () => {
        const result = calculatePlatformRevenue({
          winningBid: 1000,
          compensation: 1000
        });
        expect(result).toBe(0);
      });
    });

    // ------------------------------------------------------------------------
    // Decimal Precision Tests
    // ------------------------------------------------------------------------
    describe('decimal precision - rounding to cents', () => {
      it('should round to nearest cent for $100.01 bid ($75.0075 → $75.01)', () => {
        const result = calculatePlatformRevenue({ winningBid: 100.01 });
        expect(result).toBe(75.01); // 100.01 * 0.75 = 75.0075 → 75.01
      });

      it('should round to nearest cent for $333.33 bid ($249.9975 → $250)', () => {
        const result = calculatePlatformRevenue({ winningBid: 333.33 });
        expect(result).toBe(250); // 333.33 * 0.75 = 249.9975 → 250.00
      });

      it('should round to nearest cent for $666.66 bid ($499.995 → $500)', () => {
        const result = calculatePlatformRevenue({ winningBid: 666.66 });
        expect(result).toBe(500); // 666.66 * 0.75 = 499.995 → 500.00
      });

      it('should round to nearest cent for $999.99 bid ($749.9925 → $749.99)', () => {
        const result = calculatePlatformRevenue({ winningBid: 999.99 });
        expect(result).toBe(749.99); // 999.99 * 0.75 = 749.9925 → 749.99
      });

      it('should handle bid - compensation with rounding edge case', () => {
        const result = calculatePlatformRevenue({
          winningBid: 100.01,
          compensation: 25.00
        });
        expect(result).toBe(75.01); // 100.01 - 25.00 = 75.01
      });
    });

    // ------------------------------------------------------------------------
    // Edge Cases
    // ------------------------------------------------------------------------
    describe('edge cases', () => {
      it('should handle zero winning bid', () => {
        const result = calculatePlatformRevenue({ winningBid: 0 });
        expect(result).toBe(0);
      });

      it('should handle very small decimal bids', () => {
        const result = calculatePlatformRevenue({ winningBid: 0.10 });
        expect(result).toBe(0.08); // 0.10 * 0.75 = 0.075 → 0.08 (round up)
      });

      it('should handle very large winning bids', () => {
        const result = calculatePlatformRevenue({ winningBid: 999999.99 });
        expect(result).toBe(749999.99); // 999999.99 * 0.75 = 749999.9925 → 749999.99 (rounded)
      });
    });
  });

  // ============================================================================
  // calculateFinancialBreakdown
  // ============================================================================
  describe('calculateFinancialBreakdown', () => {
    // ------------------------------------------------------------------------
    // Happy Path - Complete Breakdown
    // ------------------------------------------------------------------------
    describe('happy path - complete breakdown', () => {
      it('should return complete breakdown for $1000 winning bid', () => {
        const result = calculateFinancialBreakdown({ winningBid: 1000 });

        expect(result.winningBid).toBe(1000);
        expect(result.loserCompensation).toBe(250); // 25%
        expect(result.platformRevenue).toBe(750); // 75%
        expect(result.compensationPercent).toBe(25);
        expect(result.revenuePercent).toBe(75);
      });

      it('should return complete breakdown for $2000 winning bid', () => {
        const result = calculateFinancialBreakdown({ winningBid: 2000 });

        expect(result.winningBid).toBe(2000);
        expect(result.loserCompensation).toBe(500); // 25%
        expect(result.platformRevenue).toBe(1500); // 75%
        expect(result.compensationPercent).toBe(25);
        expect(result.revenuePercent).toBe(75);
      });

      it('should return complete breakdown for $2835 winning bid', () => {
        const result = calculateFinancialBreakdown({ winningBid: 2835 });

        expect(result.winningBid).toBe(2835);
        expect(result.loserCompensation).toBe(708.75); // 25%
        expect(result.platformRevenue).toBe(2126.25); // 75%
        expect(result.compensationPercent).toBe(25);
        expect(result.revenuePercent).toBe(75);
      });

      it('should return complete breakdown for $500 winning bid', () => {
        const result = calculateFinancialBreakdown({ winningBid: 500 });

        expect(result.winningBid).toBe(500);
        expect(result.loserCompensation).toBe(125); // 25%
        expect(result.platformRevenue).toBe(375); // 75%
        expect(result.compensationPercent).toBe(25);
        expect(result.revenuePercent).toBe(75);
      });
    });

    // ------------------------------------------------------------------------
    // Business Logic Verification
    // ------------------------------------------------------------------------
    describe('business logic verification', () => {
      it('should ensure compensation + revenue equals winning bid', () => {
        const result = calculateFinancialBreakdown({ winningBid: 2835 });
        const sum = result.loserCompensation + result.platformRevenue;
        expect(sum).toBeCloseTo(result.winningBid, 2);
      });

      it('should ensure compensation + revenue equals winning bid for decimal amounts', () => {
        const result = calculateFinancialBreakdown({ winningBid: 333.33 });
        const sum = result.loserCompensation + result.platformRevenue;
        expect(sum).toBeCloseTo(result.winningBid, 2);
      });

      it('should always return compensationPercent = 25', () => {
        const result1 = calculateFinancialBreakdown({ winningBid: 1000 });
        const result2 = calculateFinancialBreakdown({ winningBid: 5000 });
        const result3 = calculateFinancialBreakdown({ winningBid: 99.99 });

        expect(result1.compensationPercent).toBe(25);
        expect(result2.compensationPercent).toBe(25);
        expect(result3.compensationPercent).toBe(25);
      });

      it('should always return revenuePercent = 75', () => {
        const result1 = calculateFinancialBreakdown({ winningBid: 1000 });
        const result2 = calculateFinancialBreakdown({ winningBid: 5000 });
        const result3 = calculateFinancialBreakdown({ winningBid: 99.99 });

        expect(result1.revenuePercent).toBe(75);
        expect(result2.revenuePercent).toBe(75);
        expect(result3.revenuePercent).toBe(75);
      });

      it('should ensure percentages add to 100', () => {
        const result = calculateFinancialBreakdown({ winningBid: 1234.56 });
        const totalPercent = result.compensationPercent + result.revenuePercent;
        expect(totalPercent).toBe(100);
      });
    });

    // ------------------------------------------------------------------------
    // Decimal Precision Tests
    // ------------------------------------------------------------------------
    describe('decimal precision', () => {
      it('should handle $333.33 bid with proper rounding', () => {
        const result = calculateFinancialBreakdown({ winningBid: 333.33 });

        expect(result.winningBid).toBe(333.33);
        expect(result.loserCompensation).toBe(83.33); // 333.33 * 0.25 = 83.3325 → 83.33
        expect(result.platformRevenue).toBe(250); // 333.33 * 0.75 = 249.9975 → 250.00
        expect(result.loserCompensation + result.platformRevenue).toBeCloseTo(333.33, 2);
      });

      it('should handle $666.66 bid with proper rounding', () => {
        const result = calculateFinancialBreakdown({ winningBid: 666.66 });

        expect(result.winningBid).toBe(666.66);
        expect(result.loserCompensation).toBe(166.67); // 666.66 * 0.25 = 166.665 → 166.67
        expect(result.platformRevenue).toBe(500); // 666.66 * 0.75 = 499.995 → 500.00
        expect(result.loserCompensation + result.platformRevenue).toBeCloseTo(666.66, 2);
      });

      it('should handle $999.99 bid with proper rounding', () => {
        const result = calculateFinancialBreakdown({ winningBid: 999.99 });

        expect(result.winningBid).toBe(999.99);
        expect(result.loserCompensation).toBe(250); // 999.99 * 0.25 = 249.9975 → 250.00
        expect(result.platformRevenue).toBe(749.99); // 999.99 * 0.75 = 749.9925 → 749.99
        expect(result.loserCompensation + result.platformRevenue).toBeCloseTo(999.99, 2);
      });
    });

    // ------------------------------------------------------------------------
    // Edge Cases
    // ------------------------------------------------------------------------
    describe('edge cases', () => {
      it('should handle zero winning bid', () => {
        const result = calculateFinancialBreakdown({ winningBid: 0 });

        expect(result.winningBid).toBe(0);
        expect(result.loserCompensation).toBe(0);
        expect(result.platformRevenue).toBe(0);
        expect(result.compensationPercent).toBe(25);
        expect(result.revenuePercent).toBe(75);
      });

      it('should handle very small winning bid', () => {
        const result = calculateFinancialBreakdown({ winningBid: 0.04 });

        expect(result.winningBid).toBe(0.04);
        expect(result.loserCompensation).toBe(0.01); // 0.04 * 0.25 = 0.01
        expect(result.platformRevenue).toBe(0.03); // 0.04 * 0.75 = 0.03
      });

      it('should handle very large winning bid', () => {
        const result = calculateFinancialBreakdown({ winningBid: 99999.99 });

        expect(result.winningBid).toBe(99999.99);
        expect(result.loserCompensation).toBe(24999.9975);
        expect(result.platformRevenue).toBe(74999.9925);
      });
    });

    // ------------------------------------------------------------------------
    // Return Value Structure
    // ------------------------------------------------------------------------
    describe('return value structure', () => {
      it('should return object with all required properties', () => {
        const result = calculateFinancialBreakdown({ winningBid: 1000 });

        expect(result).toHaveProperty('winningBid');
        expect(result).toHaveProperty('loserCompensation');
        expect(result).toHaveProperty('platformRevenue');
        expect(result).toHaveProperty('compensationPercent');
        expect(result).toHaveProperty('revenuePercent');
      });

      it('should return all properties as numbers', () => {
        const result = calculateFinancialBreakdown({ winningBid: 1000 });

        expect(typeof result.winningBid).toBe('number');
        expect(typeof result.loserCompensation).toBe('number');
        expect(typeof result.platformRevenue).toBe('number');
        expect(typeof result.compensationPercent).toBe('number');
        expect(typeof result.revenuePercent).toBe('number');
      });

      it('should not include extra properties', () => {
        const result = calculateFinancialBreakdown({ winningBid: 1000 });
        const keys = Object.keys(result);

        expect(keys).toEqual([
          'winningBid',
          'loserCompensation',
          'platformRevenue',
          'compensationPercent',
          'revenuePercent'
        ]);
      });
    });
  });
});
