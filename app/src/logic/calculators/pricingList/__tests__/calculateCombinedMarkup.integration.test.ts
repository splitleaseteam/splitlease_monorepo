/**
 * Integration tests for calculateCombinedMarkup
 *
 * Tests the combination of unit and site markups for pricing calculations.
 */

import { describe, it, expect } from 'vitest';
import { calculateCombinedMarkup } from '../calculateCombinedMarkup.js';
import { PRICING_CONSTANTS } from '../../../constants/pricingConstants.js';

describe('calculateCombinedMarkup', () => {
  describe('Default Parameters', () => {
    it('should use DEFAULT_UNIT_MARKUP (0) when unitMarkup not specified', () => {
      const result = calculateCombinedMarkup({});
      expect(result).toBe(PRICING_CONSTANTS.DEFAULT_UNIT_MARKUP + PRICING_CONSTANTS.SITE_MARKUP_RATE);
    });

    it('should use SITE_MARKUP_RATE (0.17) when siteMarkup not specified', () => {
      const result = calculateCombinedMarkup({ unitMarkup: 0 });
      expect(result).toBe(0.17);
    });

    it('should use both defaults when no parameters provided', () => {
      const result = calculateCombinedMarkup({});
      expect(result).toBe(PRICING_CONSTANTS.SITE_MARKUP_RATE);
    });
  });

  describe('Markup Combination', () => {
    it('should add unitMarkup and siteMarkup', () => {
      const result = calculateCombinedMarkup({
        unitMarkup: 0.05,
        siteMarkup: 0.17
      });
      expect(result).toBe(0.22);
    });

    it('should handle zero unitMarkup', () => {
      const result = calculateCombinedMarkup({
        unitMarkup: 0,
        siteMarkup: 0.17
      });
      expect(result).toBe(0.17);
    });

    it('should handle zero siteMarkup', () => {
      const result = calculateCombinedMarkup({
        unitMarkup: 0.10,
        siteMarkup: 0
      });
      expect(result).toBe(0.10);
    });

    it('should handle both zero markups', () => {
      const result = calculateCombinedMarkup({
        unitMarkup: 0,
        siteMarkup: 0
      });
      expect(result).toBe(0);
    });
  });

  describe('Rounding Precision', () => {
    it('should round to 4 decimal places', () => {
      const result = calculateCombinedMarkup({
        unitMarkup: 0.12345,
        siteMarkup: 0.17
      });
      expect(result).toBe(0.2935); // 0.12345 + 0.17 = 0.29345, rounded to 0.2935
    });

    it('should handle repeating decimals', () => {
      const result = calculateCombinedMarkup({
        unitMarkup: 0.3333,
        siteMarkup: 0.6666
      });
      expect(result).toBe(0.9999); // 0.3333 + 0.6666 = 0.9999
    });
  });

  describe('Clamping Behavior', () => {
    it('should clamp to 1.0 when sum exceeds 100%', () => {
      const result = calculateCombinedMarkup({
        unitMarkup: 0.85,
        siteMarkup: 0.20
      });
      expect(result).toBe(1); // 0.85 + 0.20 = 1.05, clamped to 1.0
    });

    it('should clamp to exactly 1.0 at boundary', () => {
      const result = calculateCombinedMarkup({
        unitMarkup: 0.80,
        siteMarkup: 0.20
      });
      expect(result).toBe(1);
    });

    it('should not clamp when sum is less than 1.0', () => {
      const result = calculateCombinedMarkup({
        unitMarkup: 0.50,
        siteMarkup: 0.30
      });
      expect(result).toBe(0.80);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small markups', () => {
      const result = calculateCombinedMarkup({
        unitMarkup: 0.0001,
        siteMarkup: 0.0001
      });
      expect(result).toBe(0.0002);
    });

    it('should handle boundary values', () => {
      const result1 = calculateCombinedMarkup({
        unitMarkup: 0,
        siteMarkup: 1
      });
      expect(result1).toBe(1);

      const result2 = calculateCombinedMarkup({
        unitMarkup: 1,
        siteMarkup: 0
      });
      expect(result2).toBe(1);
    });

    it('should handle decimal markups', () => {
      const result = calculateCombinedMarkup({
        unitMarkup: 0.075,
        siteMarkup: 0.125
      });
      expect(result).toBe(0.20);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for NaN unitMarkup', () => {
      expect(() => {
        calculateCombinedMarkup({ unitMarkup: NaN, siteMarkup: 0.17 });
      }).toThrow('unitMarkup must be a number');
    });

    it('should throw error for NaN siteMarkup', () => {
      expect(() => {
        calculateCombinedMarkup({ unitMarkup: 0, siteMarkup: NaN });
      }).toThrow('siteMarkup must be a number');
    });

    it('should throw error for negative unitMarkup', () => {
      expect(() => {
        calculateCombinedMarkup({ unitMarkup: -0.05, siteMarkup: 0.17 });
      }).toThrow('unitMarkup must be between 0 and 1');
    });

    it('should throw error for negative siteMarkup', () => {
      expect(() => {
        calculateCombinedMarkup({ unitMarkup: 0, siteMarkup: -0.17 });
      }).toThrow('siteMarkup must be between 0 and 1');
    });

    it('should throw error for unitMarkup > 1', () => {
      expect(() => {
        calculateCombinedMarkup({ unitMarkup: 1.5, siteMarkup: 0.17 });
      }).toThrow('unitMarkup must be between 0 and 1');
    });

    it('should throw error for siteMarkup > 1', () => {
      expect(() => {
        calculateCombinedMarkup({ unitMarkup: 0, siteMarkup: 1.5 });
      }).toThrow('siteMarkup must be between 0 and 1');
    });

    it('should throw error for non-number unitMarkup', () => {
      expect(() => {
        calculateCombinedMarkup({ unitMarkup: '0.05', siteMarkup: 0.17 });
      }).toThrow('unitMarkup must be a number');
    });

    it('should throw error for non-number siteMarkup', () => {
      expect(() => {
        calculateCombinedMarkup({ unitMarkup: 0, siteMarkup: '0.17' });
      }).toThrow('siteMarkup must be a number');
    });

    it('should throw error for null unitMarkup', () => {
      expect(() => {
        calculateCombinedMarkup({ unitMarkup: null, siteMarkup: 0.17 });
      }).toThrow('unitMarkup must be a number');
    });

    it('should throw error for null siteMarkup', () => {
      expect(() => {
        calculateCombinedMarkup({ unitMarkup: 0, siteMarkup: null });
      }).toThrow('siteMarkup must be a number');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should calculate standard markup with default unit markup', () => {
      const result = calculateCombinedMarkup({
        unitMarkup: PRICING_CONSTANTS.DEFAULT_UNIT_MARKUP
      });
      expect(result).toBe(PRICING_CONSTANTS.SITE_MARKUP_RATE);
      expect(result).toBe(0.17);
    });

    it('should calculate markup for premium listing', () => {
      const result = calculateCombinedMarkup({
        unitMarkup: 0.10,
        siteMarkup: 0.17
      });
      expect(result).toBe(0.27);
    });

    it('should calculate markup for discounted listing', () => {
      const result = calculateCombinedMarkup({
        unitMarkup: 0,
        siteMarkup: 0.17
      });
      expect(result).toBe(0.17);
    });

    it('should handle high markup scenario', () => {
      const result = calculateCombinedMarkup({
        unitMarkup: 0.30,
        siteMarkup: 0.17
      });
      expect(result).toBe(0.47);
    });
  });
});
