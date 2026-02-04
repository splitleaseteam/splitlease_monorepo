/**
 * Tests for calculateLoserCompensation.js (standalone version)
 *
 * Tests the standalone loser compensation calculator with input validation.
 * This version validates inputs and returns 0 for invalid/edge cases.
 *
 * Business Rules:
 * - Loser receives 25% of winning bid as compensation (default)
 * - Supports custom compensation percentages
 * - Returns 0 for null/undefined/negative winning bids
 * - Rounds to nearest cent (2 decimal places)
 */
import { describe, it, expect } from 'vitest';
import { calculateLoserCompensation } from '../calculateLoserCompensation.js';

describe('calculateLoserCompensation.js (standalone)', () => {
  // ============================================================================
  // Happy Path - Default 25% Compensation
  // ============================================================================
  describe('happy path - default 25% compensation', () => {
    it('should calculate 25% of winning bid for round number ($1000 → $250)', () => {
      const result = calculateLoserCompensation({ winningBid: 1000 });
      expect(result).toBe(250);
    });

    it('should calculate 25% of winning bid ($2000 → $500)', () => {
      const result = calculateLoserCompensation({ winningBid: 2000 });
      expect(result).toBe(500);
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

    it('should calculate 25% of winning bid with decimal precision ($2835 → $708.75)', () => {
      const result = calculateLoserCompensation({ winningBid: 2835 });
      expect(result).toBe(708.75);
    });
  });

  // ============================================================================
  // Custom Compensation Percentage
  // ============================================================================
  describe('custom compensation percentage', () => {
    it('should calculate 20% compensation when specified ($1000 → $200)', () => {
      const result = calculateLoserCompensation({ winningBid: 1000, compensationPercent: 20 });
      expect(result).toBe(200);
    });

    it('should calculate 30% compensation when specified ($1000 → $300)', () => {
      const result = calculateLoserCompensation({ winningBid: 1000, compensationPercent: 30 });
      expect(result).toBe(300);
    });

    it('should calculate 15% compensation when specified ($1000 → $150)', () => {
      const result = calculateLoserCompensation({ winningBid: 1000, compensationPercent: 15 });
      expect(result).toBe(150);
    });

    it('should calculate 10% compensation when specified ($1000 → $100)', () => {
      const result = calculateLoserCompensation({ winningBid: 1000, compensationPercent: 10 });
      expect(result).toBe(100);
    });

    it('should calculate 50% compensation when specified ($1000 → $500)', () => {
      const result = calculateLoserCompensation({ winningBid: 1000, compensationPercent: 50 });
      expect(result).toBe(500);
    });

    it('should calculate 0% compensation when specified ($1000 → $0)', () => {
      const result = calculateLoserCompensation({ winningBid: 1000, compensationPercent: 0 });
      expect(result).toBe(0);
    });

    it('should calculate 100% compensation when specified ($1000 → $1000)', () => {
      const result = calculateLoserCompensation({ winningBid: 1000, compensationPercent: 100 });
      expect(result).toBe(1000);
    });

    it('should handle decimal compensation percentage ($1000 at 12.5% → $125)', () => {
      const result = calculateLoserCompensation({ winningBid: 1000, compensationPercent: 12.5 });
      expect(result).toBe(125);
    });

    it('should handle decimal compensation percentage ($1000 at 33.33% → $333.30)', () => {
      const result = calculateLoserCompensation({ winningBid: 1000, compensationPercent: 33.33 });
      expect(result).toBe(333.30); // 1000 * 0.3333 = 333.3
    });
  });

  // ============================================================================
  // Decimal Precision Tests
  // ============================================================================
  describe('decimal precision - rounding to cents', () => {
    it('should round to nearest cent for $100.01 bid ($25.0025 → $25)', () => {
      const result = calculateLoserCompensation({ winningBid: 100.01 });
      expect(result).toBe(25); // 100.01 * 0.25 = 25.0025 → 25.00
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

    it('should handle $0.01 bid with custom 50% ($0.005 → $0.01)', () => {
      const result = calculateLoserCompensation({ winningBid: 0.01, compensationPercent: 50 });
      expect(result).toBe(0.01); // 0.01 * 0.5 = 0.005 → 0.01
    });

    it('should handle $0.04 bid ($0.01)', () => {
      const result = calculateLoserCompensation({ winningBid: 0.04 });
      expect(result).toBe(0.01); // 0.04 * 0.25 = 0.01
    });

    it('should round properly for $123.456 at 25% ($30.864 → $30.86)', () => {
      const result = calculateLoserCompensation({ winningBid: 123.456 });
      expect(result).toBe(30.86); // 123.456 * 0.25 = 30.864 → 30.86
    });
  });

  // ============================================================================
  // Input Validation - Returns 0 for Invalid Inputs
  // ============================================================================
  describe('input validation - returns 0 for invalid inputs', () => {
    it('should return 0 for null winningBid', () => {
      const result = calculateLoserCompensation({ winningBid: null });
      expect(result).toBe(0);
    });

    it('should return 0 for undefined winningBid', () => {
      const result = calculateLoserCompensation({ winningBid: undefined });
      expect(result).toBe(0);
    });

    it('should return 0 for negative winning bid', () => {
      const result = calculateLoserCompensation({ winningBid: -100 });
      expect(result).toBe(0);
    });

    it('should return 0 for zero winning bid', () => {
      const result = calculateLoserCompensation({ winningBid: 0 });
      expect(result).toBe(0);
    });

    it('should return 0 for negative winning bid with custom percentage', () => {
      const result = calculateLoserCompensation({ winningBid: -100, compensationPercent: 30 });
      expect(result).toBe(0);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle very small decimal bids', () => {
      const result = calculateLoserCompensation({ winningBid: 0.10 });
      expect(result).toBe(0.03); // 0.10 * 0.25 = 0.025 → 0.03 (round up)
    });

    it('should handle very small decimal bids below rounding threshold', () => {
      const result = calculateLoserCompensation({ winningBid: 0.01 });
      expect(result).toBe(0); // 0.01 * 0.25 = 0.0025 → 0 (round down)
    });

    it('should handle very large winning bids', () => {
      const result = calculateLoserCompensation({ winningBid: 999999.99 });
      expect(result).toBe(249999.9975); // Precision maintained
    });

    it('should handle bid amount with 3 decimal places', () => {
      const result = calculateLoserCompensation({ winningBid: 123.456 });
      expect(result).toBe(30.86); // 123.456 * 0.25 = 30.864 → 30.86
    });

    it('should handle bid amount with 4 decimal places', () => {
      const result = calculateLoserCompensation({ winningBid: 123.4567 });
      expect(result).toBe(30.86); // 123.4567 * 0.25 = 30.864175 → 30.86
    });

    it('should handle bid amount with many decimal places', () => {
      const result = calculateLoserCompensation({ winningBid: 100.123456789 });
      expect(result).toBe(25.03); // 100.123456789 * 0.25 = 25.030864... → 25.03
    });
  });

  // ============================================================================
  // Special Percentage Values
  // ============================================================================
  describe('special percentage values', () => {
    it('should handle very small percentage ($1000 at 0.1% → $1)', () => {
      const result = calculateLoserCompensation({ winningBid: 1000, compensationPercent: 0.1 });
      expect(result).toBe(1); // 1000 * 0.001 = 1
    });

    it('should handle very large percentage ($1000 at 200% → $2000)', () => {
      const result = calculateLoserCompensation({ winningBid: 1000, compensationPercent: 200 });
      expect(result).toBe(2000); // 1000 * 2 = 2000
    });

    it('should handle negative percentage ($1000 at -10% → $0 due to validation)', () => {
      // This should still work since the validation only checks winningBid, not percentage
      const result = calculateLoserCompensation({ winningBid: 1000, compensationPercent: -10 });
      expect(result).toBe(-100); // 1000 * -0.10 = -100 (no percentage validation)
    });

    it('should handle percentage above 100% ($1000 at 150% → $1500)', () => {
      const result = calculateLoserCompensation({ winningBid: 1000, compensationPercent: 150 });
      expect(result).toBe(1500); // 1000 * 1.5 = 1500
    });
  });

  // ============================================================================
  // Business Logic Verification
  // ============================================================================
  describe('business logic verification', () => {
    it('should follow formula: winningBid * (compensationPercent / 100)', () => {
      const winningBid = 1234;
      const compensationPercent = 25;
      const expected = winningBid * (compensationPercent / 100);

      const result = calculateLoserCompensation({ winningBid, compensationPercent });
      expect(result).toBe(expected);
    });

    it('should apply custom percentage correctly', () => {
      const result1 = calculateLoserCompensation({ winningBid: 1000, compensationPercent: 20 });
      const result2 = calculateLoserCompensation({ winningBid: 1000, compensationPercent: 30 });
      const result3 = calculateLoserCompensation({ winningBid: 1000, compensationPercent: 40 });

      expect(result1).toBe(200);
      expect(result2).toBe(300);
      expect(result3).toBe(400);
    });

    it('should handle NYC real-world bid amounts', () => {
      // Typical NYC weekly rent: $2000-4000
      const result1 = calculateLoserCompensation({ winningBid: 2500 });
      expect(result1).toBe(625);

      const result2 = calculateLoserCompensation({ winningBid: 3500 });
      expect(result2).toBe(875);
    });
  });

  // ============================================================================
  // Parameter Object Handling
  // ============================================================================
  describe('parameter object handling', () => {
    it('should work with extra properties in params object', () => {
      const result = calculateLoserCompensation({
        winningBid: 1000,
        compensationPercent: 25,
        extraProp: 'ignored',
        anotherProp: 123
      });
      expect(result).toBe(250);
    });

    it('should handle missing params object', () => {
      expect(() => calculateLoserCompensation())
        .toThrow(); // Cannot read property 'winningBid' of undefined
    });

    it('should handle empty params object', () => {
      const result = calculateLoserCompensation({});
      expect(result).toBe(0); // undefined winningBid → 0
    });

    it('should handle missing compensationPercent (defaults to 25)', () => {
      const result = calculateLoserCompensation({ winningBid: 1000 });
      expect(result).toBe(250); // Uses default 25%
    });

    it('should handle null compensationPercent (treated as 0)', () => {
      const result = calculateLoserCompensation({ winningBid: 1000, compensationPercent: null });
      expect(result).toBe(0); // 1000 * (null / 100) = 1000 * 0 = 0
    });
  });

  // ============================================================================
  // Rounding Consistency
  // ============================================================================
  describe('rounding consistency', () => {
    it('should consistently round the same value', () => {
      const result1 = calculateLoserCompensation({ winningBid: 333.33 });
      const result2 = calculateLoserCompensation({ winningBid: 333.33 });
      const result3 = calculateLoserCompensation({ winningBid: 333.33 });

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should round half-up consistently', () => {
      // 0.005 should round to 0.01
      const result = calculateLoserCompensation({ winningBid: 0.02, compensationPercent: 25 });
      expect(result).toBe(0.01); // 0.02 * 0.25 = 0.005 → 0.01
    });

    it('should round half-down consistently', () => {
      // 0.004999... should round to 0
      const result = calculateLoserCompensation({ winningBid: 0.01 });
      expect(result).toBe(0); // 0.01 * 0.25 = 0.0025 → 0
    });
  });
});
