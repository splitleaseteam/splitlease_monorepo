/**
 * Tests for calculateFourWeekRent
 *
 * Tests the baseline rent calculation for a standard 4-week period.
 *
 * To run:
 *   bun run test app/src/logic/calculators/pricing/__tests__/calculateFourWeekRent.test.js
 */

import { describe, it, expect } from 'vitest';
import { calculateFourWeekRent } from '../calculateFourWeekRent.js';

// ============================================================================
// Happy Path Tests
// ============================================================================

describe('calculateFourWeekRent', () => {
  describe('valid inputs', () => {
    it('calculates rent for standard 4-night stay', () => {
      // $100/night * 4 nights/week * 4 weeks = $1,600
      const result = calculateFourWeekRent({ nightlyRate: 100, frequency: 4 });
      expect(result).toBe(1600);
    });

    it('calculates rent for minimum frequency (2 nights)', () => {
      // $150/night * 2 nights/week * 4 weeks = $1,200
      const result = calculateFourWeekRent({ nightlyRate: 150, frequency: 2 });
      expect(result).toBe(1200);
    });

    it('calculates rent for maximum frequency (7 nights)', () => {
      // $80/night * 7 nights/week * 4 weeks = $2,240
      const result = calculateFourWeekRent({ nightlyRate: 80, frequency: 7 });
      expect(result).toBe(2240);
    });

    it('handles zero nightly rate', () => {
      // $0/night * 4 nights/week * 4 weeks = $0
      const result = calculateFourWeekRent({ nightlyRate: 0, frequency: 4 });
      expect(result).toBe(0);
    });

    it('handles decimal nightly rate', () => {
      // $99.99/night * 3 nights/week * 4 weeks = $1199.88
      const result = calculateFourWeekRent({ nightlyRate: 99.99, frequency: 3 });
      expect(result).toBeCloseTo(1199.88);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe('edge cases', () => {
    it('handles very large nightly rates', () => {
      // $10,000/night * 7 nights/week * 4 weeks = $280,000
      const result = calculateFourWeekRent({ nightlyRate: 10000, frequency: 7 });
      expect(result).toBe(280000);
    });

    it('handles very small nightly rates', () => {
      // $0.01/night * 2 nights/week * 4 weeks = $0.08
      const result = calculateFourWeekRent({ nightlyRate: 0.01, frequency: 2 });
      expect(result).toBeCloseTo(0.08);
    });
  });

  // ============================================================================
  // Error Cases - Invalid nightlyRate
  // ============================================================================

  describe('invalid nightlyRate', () => {
    it('throws error for negative nightly rate', () => {
      expect(() => {
        calculateFourWeekRent({ nightlyRate: -100, frequency: 4 });
      }).toThrow();
    });

    it('throws error for NaN nightly rate', () => {
      expect(() => {
        calculateFourWeekRent({ nightlyRate: NaN, frequency: 4 });
      }).toThrow();
    });

    it('throws error for string nightly rate', () => {
      expect(() => {
        calculateFourWeekRent({ nightlyRate: '100', frequency: 4 });
      }).toThrow();
    });

    it('throws error for null nightly rate', () => {
      expect(() => {
        calculateFourWeekRent({ nightlyRate: null, frequency: 4 });
      }).toThrow();
    });

    it('throws error for undefined nightly rate', () => {
      expect(() => {
        calculateFourWeekRent({ nightlyRate: undefined, frequency: 4 });
      }).toThrow();
    });
  });

  // ============================================================================
  // Error Cases - Invalid frequency
  // ============================================================================

  describe('invalid frequency', () => {
    it('throws error for frequency below minimum (1)', () => {
      expect(() => {
        calculateFourWeekRent({ nightlyRate: 100, frequency: 1 });
      }).toThrow();
    });

    it('throws error for frequency above maximum (8)', () => {
      expect(() => {
        calculateFourWeekRent({ nightlyRate: 100, frequency: 8 });
      }).toThrow();
    });

    it('throws error for zero frequency', () => {
      expect(() => {
        calculateFourWeekRent({ nightlyRate: 100, frequency: 0 });
      }).toThrow();
    });

    it('throws error for negative frequency', () => {
      expect(() => {
        calculateFourWeekRent({ nightlyRate: 100, frequency: -4 });
      }).toThrow();
    });

    // Note: Decimal frequencies (e.g., 4.5) are currently accepted by the validator
    // since it only checks range (2-7), not integer values. This may be a gap to address.
    it('accepts decimal frequency within range (potential validation gap)', () => {
      // 4.5 is between 2-7, so it passes validation
      const result = calculateFourWeekRent({ nightlyRate: 100, frequency: 4.5 });
      expect(result).toBe(1800); // 100 * 4.5 * 4 = 1800
    });

    it('throws error for string frequency', () => {
      expect(() => {
        calculateFourWeekRent({ nightlyRate: 100, frequency: '4' });
      }).toThrow();
    });
  });
});
