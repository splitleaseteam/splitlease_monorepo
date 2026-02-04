/**
 * Tests for calculateBidIncrement.js
 *
 * Tests for bid increment calculation including:
 * - Absolute increment amount (newBid - previousBid)
 * - Percentage increment ((increment / previousBid) * 100)
 * - Rounding to 2 decimal places
 * - Edge cases (zero previous bid, equal bids, etc.)
 *
 * Business Rules:
 * - Minimum bid increment: 10% above previous bid (enforced elsewhere)
 * - This calculator only computes the increment, doesn't validate
 * - Both amount and percent rounded to 2 decimal places
 */
import { describe, it, expect } from 'vitest';
import { calculateBidIncrement } from '../calculateBidIncrement.js';

describe('calculateBidIncrement.js', () => {
  // ============================================================================
  // Happy Path - Standard Increment Calculations
  // ============================================================================
  describe('happy path - standard increment calculations', () => {
    it('should calculate 10% increment ($1000 → $1100)', () => {
      const result = calculateBidIncrement({ newBid: 1100, previousBid: 1000 });
      expect(result.amount).toBe(100);
      expect(result.percent).toBe(10);
    });

    it('should calculate 25% increment ($1000 → $1250)', () => {
      const result = calculateBidIncrement({ newBid: 1250, previousBid: 1000 });
      expect(result.amount).toBe(250);
      expect(result.percent).toBe(25);
    });

    it('should calculate 50% increment ($1000 → $1500)', () => {
      const result = calculateBidIncrement({ newBid: 1500, previousBid: 1000 });
      expect(result.amount).toBe(500);
      expect(result.percent).toBe(50);
    });

    it('should calculate 100% increment ($1000 → $2000)', () => {
      const result = calculateBidIncrement({ newBid: 2000, previousBid: 1000 });
      expect(result.amount).toBe(1000);
      expect(result.percent).toBe(100);
    });

    it('should calculate small increment ($1000 → $1050)', () => {
      const result = calculateBidIncrement({ newBid: 1050, previousBid: 1000 });
      expect(result.amount).toBe(50);
      expect(result.percent).toBe(5);
    });

    it('should calculate large increment ($1000 → $5000)', () => {
      const result = calculateBidIncrement({ newBid: 5000, previousBid: 1000 });
      expect(result.amount).toBe(4000);
      expect(result.percent).toBe(400);
    });

    it('should calculate increment from $200 to $220 (10%)', () => {
      const result = calculateBidIncrement({ newBid: 220, previousBid: 200 });
      expect(result.amount).toBe(20);
      expect(result.percent).toBe(10);
    });

    it('should calculate increment from $500 to $550 (10%)', () => {
      const result = calculateBidIncrement({ newBid: 550, previousBid: 500 });
      expect(result.amount).toBe(50);
      expect(result.percent).toBe(10);
    });
  });

  // ============================================================================
  // Decimal Precision Tests
  // ============================================================================
  describe('decimal precision - rounding to 2 decimal places', () => {
    it('should round amount to 2 decimal places ($1000 → $1100.567)', () => {
      const result = calculateBidIncrement({ newBid: 1100.567, previousBid: 1000 });
      expect(result.amount).toBe(100.57); // 100.567 → 100.57
      expect(result.percent).toBeCloseTo(10.06, 2); // 10.0567 → 10.06
    });

    it('should round percent to 2 decimal places for non-terminating decimal', () => {
      const result = calculateBidIncrement({ newBid: 1100, previousBid: 333 });
      expect(result.amount).toBe(767);
      expect(result.percent).toBeCloseTo(230.33, 2); // 767/333 * 100 = 230.33033... → 230.33
    });

    it('should round percent properly for $1000 → $1125', () => {
      const result = calculateBidIncrement({ newBid: 1125, previousBid: 1000 });
      expect(result.amount).toBe(125);
      expect(result.percent).toBe(12.5);
    });

    it('should handle decimal amounts with rounding', () => {
      const result = calculateBidIncrement({ newBid: 1234.567, previousBid: 1000 });
      expect(result.amount).toBe(234.57); // 234.567 → 234.57
      expect(result.percent).toBeCloseTo(23.46, 2); // 23.4567 → 23.46
    });

    it('should round half up on amount', () => {
      const result = calculateBidIncrement({ newBid: 1100.005, previousBid: 1000 });
      expect(result.amount).toBe(100.01); // 100.005 → 100.01 (round half up)
    });

    it('should round half up on percent', () => {
      const result = calculateBidIncrement({ newBid: 1100.005, previousBid: 1000 });
      expect(result.percent).toBeCloseTo(10, 2); // 10.0005 → 10.00
    });
  });

  // ============================================================================
  // Edge Cases - Zero Previous Bid
  // ============================================================================
  describe('edge cases - zero previous bid', () => {
    it('should handle zero previous bid ($0 → $1000)', () => {
      const result = calculateBidIncrement({ newBid: 1000, previousBid: 0 });
      expect(result.amount).toBe(1000);
      expect(result.percent).toBe(0); // No percentage when no previous bid
    });

    it('should handle zero previous bid ($0 → $500)', () => {
      const result = calculateBidIncrement({ newBid: 500, previousBid: 0 });
      expect(result.amount).toBe(500);
      expect(result.percent).toBe(0);
    });

    it('should handle zero previous bid with decimal amount ($0 → $123.45)', () => {
      const result = calculateBidIncrement({ newBid: 123.45, previousBid: 0 });
      expect(result.amount).toBe(123.45);
      expect(result.percent).toBe(0);
    });

    it('should handle zero previous bid with very small amount ($0 → $0.01)', () => {
      const result = calculateBidIncrement({ newBid: 0.01, previousBid: 0 });
      expect(result.amount).toBe(0.01);
      expect(result.percent).toBe(0);
    });
  });

  // ============================================================================
  // Edge Cases - Equal Bids
  // ============================================================================
  describe('edge cases - equal bids (no increment)', () => {
    it('should handle equal bids ($1000 → $1000)', () => {
      const result = calculateBidIncrement({ newBid: 1000, previousBid: 1000 });
      expect(result.amount).toBe(0);
      expect(result.percent).toBe(0);
    });

    it('should handle equal decimal bids ($500.50 → $500.50)', () => {
      const result = calculateBidIncrement({ newBid: 500.50, previousBid: 500.50 });
      expect(result.amount).toBe(0);
      expect(result.percent).toBe(0);
    });

    it('should handle equal zero bids ($0 → $0)', () => {
      const result = calculateBidIncrement({ newBid: 0, previousBid: 0 });
      expect(result.amount).toBe(0);
      expect(result.percent).toBe(0);
    });
  });

  // ============================================================================
  // Edge Cases - Decreasing Bids (Invalid in Real Bidding)
  // ============================================================================
  describe('edge cases - decreasing bids (invalid in real bidding)', () => {
    it('should calculate negative increment for lower bid ($1000 → $900)', () => {
      const result = calculateBidIncrement({ newBid: 900, previousBid: 1000 });
      expect(result.amount).toBe(-100);
      expect(result.percent).toBe(-10);
    });

    it('should calculate negative increment for much lower bid ($1000 → $500)', () => {
      const result = calculateBidIncrement({ newBid: 500, previousBid: 1000 });
      expect(result.amount).toBe(-500);
      expect(result.percent).toBe(-50);
    });

    it('should handle negative increment with decimals ($1000 → $999.99)', () => {
      const result = calculateBidIncrement({ newBid: 999.99, previousBid: 1000 });
      expect(result.amount).toBe(-0.01);
      expect(result.percent).toBeCloseTo(-0, 2); // -0.001 → -0.00 (rounded)
    });
  });

  // ============================================================================
  // Very Small and Very Large Values
  // ============================================================================
  describe('very small and very large values', () => {
    it('should handle very small previous bid ($0.01 → $0.02)', () => {
      const result = calculateBidIncrement({ newBid: 0.02, previousBid: 0.01 });
      expect(result.amount).toBe(0.01);
      expect(result.percent).toBe(100); // 100% increase
    });

    it('should handle very small previous bid ($0.10 → $0.11)', () => {
      const result = calculateBidIncrement({ newBid: 0.11, previousBid: 0.10 });
      expect(result.amount).toBe(0.01);
      expect(result.percent).toBe(10);
    });

    it('should handle very large bids ($10000 → $11000)', () => {
      const result = calculateBidIncrement({ newBid: 11000, previousBid: 10000 });
      expect(result.amount).toBe(1000);
      expect(result.percent).toBe(10);
    });

    it('should handle very large bids ($50000 → $75000)', () => {
      const result = calculateBidIncrement({ newBid: 75000, previousBid: 50000 });
      expect(result.amount).toBe(25000);
      expect(result.percent).toBe(50);
    });

    it('should handle extreme values ($0.01 → $10000)', () => {
      const result = calculateBidIncrement({ newBid: 10000, previousBid: 0.01 });
      expect(result.amount).toBe(9999.99);
      expect(result.percent).toBe(999999); // Huge percentage
    });
  });

  // ============================================================================
  // Business Logic - 10% Minimum Increment Verification
  // ============================================================================
  describe('business logic - 10% minimum increment verification', () => {
    it('should show exactly 10% increment meets minimum', () => {
      const result = calculateBidIncrement({ newBid: 1100, previousBid: 1000 });
      expect(result.percent).toBe(10); // Exactly 10% - valid minimum
    });

    it('should show 11% increment exceeds minimum', () => {
      const result = calculateBidIncrement({ newBid: 1110, previousBid: 1000 });
      expect(result.amount).toBe(110);
      expect(result.percent).toBe(11); // Above 10% - valid
    });

    it('should show 9.99% increment falls below minimum', () => {
      const result = calculateBidIncrement({ newBid: 1099.90, previousBid: 1000 });
      expect(result.amount).toBe(99.90);
      expect(result.percent).toBeCloseTo(9.99, 2); // Below 10% - invalid in real bidding
    });

    it('should show 5% increment falls below minimum', () => {
      const result = calculateBidIncrement({ newBid: 1050, previousBid: 1000 });
      expect(result.amount).toBe(50);
      expect(result.percent).toBe(5); // Below 10% - invalid in real bidding
    });

    it('should show 15% increment exceeds minimum', () => {
      const result = calculateBidIncrement({ newBid: 1150, previousBid: 1000 });
      expect(result.amount).toBe(150);
      expect(result.percent).toBe(15); // Above 10% - valid
    });

    it('should calculate 10% increment for $200 starting bid', () => {
      const result = calculateBidIncrement({ newBid: 220, previousBid: 200 });
      expect(result.amount).toBe(20);
      expect(result.percent).toBe(10);
    });

    it('should calculate 10% increment for $500 starting bid', () => {
      const result = calculateBidIncrement({ newBid: 550, previousBid: 500 });
      expect(result.amount).toBe(50);
      expect(result.percent).toBe(10);
    });
  });

  // ============================================================================
  // Input Validation
  // ============================================================================
  describe('input validation', () => {
    it('should handle null newBid', () => {
      const result = calculateBidIncrement({ newBid: null, previousBid: 1000 });
      expect(result.amount).toBe(-1000); // null - 1000 = -1000 (coerced)
      expect(result.percent).toBe(-100);
    });

    it('should handle null previousBid', () => {
      const result = calculateBidIncrement({ newBid: 1100, previousBid: null });
      expect(result.amount).toBe(1100); // 1100 - null = 1100 (coerced)
      expect(result.percent).toBe(Infinity); // Division by zero after coercion
    });

    it('should handle undefined values', () => {
      const result = calculateBidIncrement({ newBid: undefined, previousBid: 1000 });
      expect(result.amount).toBe(-1000); // undefined - 1000 = NaN, but gets coerced
    });

    it('should handle string values (coerced to numbers)', () => {
      const result = calculateBidIncrement({ newBid: '1100', previousBid: '1000' });
      expect(result.amount).toBe(100); // String coercion works
      expect(result.percent).toBe(10);
    });

    it('should handle negative previous bid', () => {
      const result = calculateBidIncrement({ newBid: 1000, previousBid: -500 });
      expect(result.amount).toBe(1500);
      expect(result.percent).toBe(-300); // Weird but mathematically correct
    });

    it('should handle negative new bid', () => {
      const result = calculateBidIncrement({ newBid: -500, previousBid: 1000 });
      expect(result.amount).toBe(-1500);
      expect(result.percent).toBe(-150);
    });
  });

  // ============================================================================
  // Return Value Structure
  // ============================================================================
  describe('return value structure', () => {
    it('should return object with amount and percent properties', () => {
      const result = calculateBidIncrement({ newBid: 1100, previousBid: 1000 });

      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('percent');
    });

    it('should return amount as number', () => {
      const result = calculateBidIncrement({ newBid: 1100, previousBid: 1000 });
      expect(typeof result.amount).toBe('number');
    });

    it('should return percent as number', () => {
      const result = calculateBidIncrement({ newBid: 1100, previousBid: 1000 });
      expect(typeof result.percent).toBe('number');
    });

    it('should not include extra properties', () => {
      const result = calculateBidIncrement({ newBid: 1100, previousBid: 1000 });
      const keys = Object.keys(result);

      expect(keys).toEqual(['amount', 'percent']);
    });

    it('should handle extra properties in params object', () => {
      const result = calculateBidIncrement({
        newBid: 1100,
        previousBid: 1000,
        extraProp: 'ignored'
      });

      expect(result.amount).toBe(100);
      expect(result.percent).toBe(10);
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world bidding scenarios', () => {
    it('should calculate increment for typical NYC bidding ($2000 → $2250)', () => {
      const result = calculateBidIncrement({ newBid: 2250, previousBid: 2000 });
      expect(result.amount).toBe(250);
      expect(result.percent).toBe(12.5);
    });

    it('should calculate increment for minimum valid bid ($200 → $220)', () => {
      const result = calculateBidIncrement({ newBid: 220, previousBid: 200 });
      expect(result.amount).toBe(20);
      expect(result.percent).toBe(10); // Exactly 10%
    });

    it('should calculate increment for aggressive bidding ($3000 → $5000)', () => {
      const result = calculateBidIncrement({ newBid: 5000, previousBid: 3000 });
      expect(result.amount).toBe(2000);
      expect(result.percent).toBeCloseTo(66.67, 2);
    });

    it('should calculate increment for conservative bidding ($1000 → $1100)', () => {
      const result = calculateBidIncrement({ newBid: 1100, previousBid: 1000 });
      expect(result.amount).toBe(100);
      expect(result.percent).toBe(10); // Exactly 10%
    });

    it('should calculate increment for luxury property bidding ($5000 → $6000)', () => {
      const result = calculateBidIncrement({ newBid: 6000, previousBid: 5000 });
      expect(result.amount).toBe(1000);
      expect(result.percent).toBe(20);
    });
  });

  // ============================================================================
  // Precision Edge Cases
  // ============================================================================
  describe('precision edge cases', () => {
    it('should handle very small percentage increment', () => {
      const result = calculateBidIncrement({ newBid: 1000.01, previousBid: 1000 });
      expect(result.amount).toBe(0.01);
      expect(result.percent).toBeCloseTo(0, 2); // 0.001% → 0.00
    });

    it('should handle 33.33% increment properly', () => {
      const result = calculateBidIncrement({ newBid: 1333.33, previousBid: 1000 });
      expect(result.amount).toBe(333.33);
      expect(result.percent).toBeCloseTo(33.33, 2);
    });

    it('should handle 66.66% increment properly', () => {
      const result = calculateBidIncrement({ newBid: 1666.66, previousBid: 1000 });
      expect(result.amount).toBe(666.66);
      expect(result.percent).toBeCloseTo(66.67, 2); // 66.666 → 66.67
    });

    it('should handle 99.99% increment properly', () => {
      const result = calculateBidIncrement({ newBid: 1999.99, previousBid: 1000 });
      expect(result.amount).toBe(999.99);
      expect(result.percent).toBeCloseTo(100, 2); // 99.999 → 100.00
    });
  });
});
