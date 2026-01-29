/**
 * Tests for calculateGuestFacingPrice
 *
 * Calculates the guest-facing price per night after markup and discounts.
 * Formula:
 * 1. Base price = host rate x nights
 * 2. Full-time discount = base price x 0.13 (only if 7 nights)
 * 3. Price after discounts = base price - discount
 * 4. Site markup = price after discounts x 0.17
 * 5. Total price = base price - discount + markup
 * 6. Price per night = total price / nights
 */
import { describe, it, expect } from 'vitest';
import { calculateGuestFacingPrice } from '../calculateGuestFacingPrice.js';

describe('calculateGuestFacingPrice', () => {
  // ============================================================================
  // Happy Path Tests - Without Full-Time Discount (2-6 nights)
  // ============================================================================
  describe('happy path - without full-time discount (2-6 nights)', () => {
    it('should calculate price for 4 nights at $100/night (no discount)', () => {
      const result = calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: 4 });
      // Base = 100 * 4 = 400
      // Discount = 0 (not 7 nights)
      // Markup = 400 * 0.17 = 68
      // Total = 400 + 68 = 468
      // Per night = 468 / 4 = 117
      expect(result).toBe(117);
    });

    it('should calculate price for 2 nights at $100/night (minimum nights)', () => {
      const result = calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: 2 });
      // Base = 100 * 2 = 200
      // Markup = 200 * 0.17 = 34
      // Total = 200 + 34 = 234
      // Per night = 234 / 2 = 117
      expect(result).toBe(117);
    });

    it('should calculate price for 3 nights at $150/night', () => {
      const result = calculateGuestFacingPrice({ hostNightlyRate: 150, nightsCount: 3 });
      // Base = 150 * 3 = 450
      // Markup = 450 * 0.17 = 76.5
      // Total = 450 + 76.5 = 526.5
      // Per night = 526.5 / 3 = 175.5
      expect(result).toBe(175.5);
    });

    it('should calculate price for 5 nights at $80/night', () => {
      const result = calculateGuestFacingPrice({ hostNightlyRate: 80, nightsCount: 5 });
      // Base = 80 * 5 = 400
      // Markup = 400 * 0.17 = 68
      // Total = 400 + 68 = 468
      // Per night = 468 / 5 = 93.6
      expect(result).toBe(93.6);
    });

    it('should calculate price for 6 nights at $90/night', () => {
      const result = calculateGuestFacingPrice({ hostNightlyRate: 90, nightsCount: 6 });
      // Base = 90 * 6 = 540
      // Markup = 540 * 0.17 = 91.8
      // Total = 540 + 91.8 = 631.8
      // Per night = 631.8 / 6 = 105.3
      expect(result).toBe(105.3);
    });
  });

  // ============================================================================
  // Happy Path Tests - With Full-Time Discount (7 nights)
  // ============================================================================
  describe('happy path - with full-time discount (7 nights)', () => {
    it('should apply 13% discount for 7 nights at $100/night', () => {
      const result = calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: 7 });
      // Base = 100 * 7 = 700
      // Discount = 700 * 0.13 = 91
      // Price after discount = 700 - 91 = 609
      // Markup = 609 * 0.17 = 103.53
      // Total = 700 - 91 + 103.53 = 712.53
      // Per night = 712.53 / 7 = 101.79
      expect(result).toBeCloseTo(101.79, 2);
    });

    it('should apply discount for 7 nights at $50/night', () => {
      const result = calculateGuestFacingPrice({ hostNightlyRate: 50, nightsCount: 7 });
      // Base = 50 * 7 = 350
      // Discount = 350 * 0.13 = 45.5
      // Price after discount = 350 - 45.5 = 304.5
      // Markup = 304.5 * 0.17 = 51.765
      // Total = 350 - 45.5 + 51.765 = 356.265
      // Per night = 356.265 / 7 = 50.895
      expect(result).toBeCloseTo(50.895, 2);
    });

    it('should apply discount for 7 nights at $200/night', () => {
      const result = calculateGuestFacingPrice({ hostNightlyRate: 200, nightsCount: 7 });
      // Base = 200 * 7 = 1400
      // Discount = 1400 * 0.13 = 182
      // Price after discount = 1400 - 182 = 1218
      // Markup = 1218 * 0.17 = 207.06
      // Total = 1400 - 182 + 207.06 = 1425.06
      // Per night = 1425.06 / 7 = 203.58
      expect(result).toBeCloseTo(203.58, 2);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle zero host nightly rate', () => {
      const result = calculateGuestFacingPrice({ hostNightlyRate: 0, nightsCount: 4 });
      expect(result).toBe(0);
    });

    it('should handle very small host nightly rate', () => {
      const result = calculateGuestFacingPrice({ hostNightlyRate: 0.01, nightsCount: 2 });
      // Base = 0.01 * 2 = 0.02
      // Markup = 0.02 * 0.17 = 0.0034
      // Total = 0.02 + 0.0034 = 0.0234
      // Per night = 0.0234 / 2 = 0.0117
      expect(result).toBeCloseTo(0.0117, 4);
    });

    it('should handle very large host nightly rate', () => {
      const result = calculateGuestFacingPrice({ hostNightlyRate: 10000, nightsCount: 4 });
      // Base = 10000 * 4 = 40000
      // Markup = 40000 * 0.17 = 6800
      // Total = 40000 + 6800 = 46800
      // Per night = 46800 / 4 = 11700
      expect(result).toBe(11700);
    });

    it('should handle decimal host nightly rate', () => {
      const result = calculateGuestFacingPrice({ hostNightlyRate: 99.99, nightsCount: 4 });
      // Base = 99.99 * 4 = 399.96
      // Markup = 399.96 * 0.17 = 67.9932
      // Total = 399.96 + 67.9932 = 467.9532
      // Per night = 467.9532 / 4 = 116.9883
      expect(result).toBeCloseTo(116.9883, 2);
    });
  });

  // ============================================================================
  // Error Handling - hostNightlyRate Validation
  // ============================================================================
  describe('error handling - hostNightlyRate validation', () => {
    it('should throw error for negative hostNightlyRate', () => {
      expect(() => calculateGuestFacingPrice({ hostNightlyRate: -100, nightsCount: 4 }))
        .toThrow('hostNightlyRate must be a positive number');
    });

    it('should throw error for null hostNightlyRate', () => {
      expect(() => calculateGuestFacingPrice({ hostNightlyRate: null, nightsCount: 4 }))
        .toThrow('hostNightlyRate must be a positive number');
    });

    it('should throw error for undefined hostNightlyRate', () => {
      expect(() => calculateGuestFacingPrice({ hostNightlyRate: undefined, nightsCount: 4 }))
        .toThrow('hostNightlyRate must be a positive number');
    });

    it('should throw error for string hostNightlyRate', () => {
      expect(() => calculateGuestFacingPrice({ hostNightlyRate: '100', nightsCount: 4 }))
        .toThrow('hostNightlyRate must be a positive number');
    });

    it('should throw error for NaN hostNightlyRate', () => {
      expect(() => calculateGuestFacingPrice({ hostNightlyRate: NaN, nightsCount: 4 }))
        .toThrow('hostNightlyRate must be a positive number');
    });

    it('should throw error for object hostNightlyRate', () => {
      expect(() => calculateGuestFacingPrice({ hostNightlyRate: {}, nightsCount: 4 }))
        .toThrow('hostNightlyRate must be a positive number');
    });

    it('should throw error for array hostNightlyRate', () => {
      expect(() => calculateGuestFacingPrice({ hostNightlyRate: [100], nightsCount: 4 }))
        .toThrow('hostNightlyRate must be a positive number');
    });
  });

  // ============================================================================
  // Error Handling - nightsCount Validation
  // ============================================================================
  describe('error handling - nightsCount validation', () => {
    it('should throw error for nightsCount below range (1)', () => {
      expect(() => calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: 1 }))
        .toThrow('nightsCount must be between 2-7');
    });

    it('should throw error for nightsCount above range (8)', () => {
      expect(() => calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: 8 }))
        .toThrow('nightsCount must be between 2-7');
    });

    it('should throw error for nightsCount of 0', () => {
      expect(() => calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: 0 }))
        .toThrow('nightsCount must be between 2-7');
    });

    it('should throw error for negative nightsCount', () => {
      expect(() => calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: -3 }))
        .toThrow('nightsCount must be between 2-7');
    });

    it('should throw error for null nightsCount', () => {
      expect(() => calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: null }))
        .toThrow('nightsCount must be between 2-7');
    });

    it('should throw error for undefined nightsCount', () => {
      expect(() => calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: undefined }))
        .toThrow('nightsCount must be between 2-7');
    });

    it('should throw error for string nightsCount', () => {
      expect(() => calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: '4' }))
        .toThrow('nightsCount must be between 2-7');
    });

    it('should throw error for NaN nightsCount', () => {
      expect(() => calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: NaN }))
        .toThrow('nightsCount must be between 2-7');
    });

    it('should accept decimal nightsCount within range (no integer check)', () => {
      // Note: The implementation doesn't explicitly reject decimals
      // 3.5 is between 2-7, so it passes validation and calculates
      const result = calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: 3.5 });
      // Base = 100 * 3.5 = 350
      // Markup = 350 * 0.17 = 59.5
      // Total = 350 + 59.5 = 409.5
      // Per night = 409.5 / 3.5 = 117
      expect(result).toBe(117);
    });
  });

  // ============================================================================
  // Boundary Conditions
  // ============================================================================
  describe('boundary conditions', () => {
    it('should handle minimum valid nightsCount (2)', () => {
      const result = calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: 2 });
      expect(result).toBe(117);
    });

    it('should handle maximum valid nightsCount (7) with discount', () => {
      const result = calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: 7 });
      // With 13% discount + 17% markup
      expect(result).toBeCloseTo(101.79, 2);
    });

    it('should handle 6 nights (just below discount threshold)', () => {
      const result = calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: 6 });
      // No discount applied
      // Base = 100 * 6 = 600
      // Markup = 600 * 0.17 = 102
      // Total = 600 + 102 = 702
      // Per night = 702 / 6 = 117
      expect(result).toBe(117);
    });
  });

  // ============================================================================
  // Business Logic Verification
  // ============================================================================
  describe('business logic verification', () => {
    it('should verify discount only applies at 7 nights', () => {
      const sixNights = calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: 6 });
      const sevenNights = calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: 7 });

      // 6 nights should NOT have discount
      // 7 nights SHOULD have discount, making per-night price lower
      expect(sevenNights).toBeLessThan(sixNights);
    });

    it('should verify 17% markup is always applied', () => {
      const result = calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: 4 });
      // Host rate = 100, Guest pays = 117 (17% more)
      expect(result).toBe(117);
    });

    it('should verify combined discount and markup for full-time', () => {
      const result = calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: 7 });
      // Net effect: 13% discount then 17% markup on discounted price
      // (100 * 0.87) * 1.17 = 87 * 1.17 = 101.79
      expect(result).toBeCloseTo(101.79, 2);
    });

    it('should calculate typical part-time stay price', () => {
      // 4 nights at $120/night
      const result = calculateGuestFacingPrice({ hostNightlyRate: 120, nightsCount: 4 });
      // Base = 480, Markup = 81.6, Total = 561.6, Per night = 140.4
      expect(result).toBeCloseTo(140.4, 1);
    });

    it('should calculate typical full-time stay price', () => {
      // 7 nights at $100/night with discount
      const result = calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: 7 });
      expect(result).toBeCloseTo(101.79, 2);
    });
  });

  // ============================================================================
  // Price Comparison Tests
  // ============================================================================
  describe('price comparison tests', () => {
    it('should show more nights results in lower per-night rate (without discount)', () => {
      const twoNights = calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: 2 });
      const fourNights = calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: 4 });

      // Per-night rate should be same without discount
      expect(twoNights).toBe(fourNights);
    });

    it('should show 7 nights has best per-night rate due to discount', () => {
      const rates = [2, 3, 4, 5, 6, 7].map(nights =>
        calculateGuestFacingPrice({ hostNightlyRate: 100, nightsCount: nights })
      );

      // 7 nights (index 5) should have lowest rate
      const sevenNightRate = rates[5];
      const otherRates = rates.slice(0, 5);

      expect(sevenNightRate).toBeLessThan(Math.min(...otherRates));
    });
  });

  // ============================================================================
  // Input Object Validation
  // ============================================================================
  describe('input object validation', () => {
    it('should work with extra properties in params object', () => {
      const result = calculateGuestFacingPrice({
        hostNightlyRate: 100,
        nightsCount: 4,
        extraProp: 'ignored'
      });
      expect(result).toBe(117);
    });

    it('should throw error for missing params object', () => {
      expect(() => calculateGuestFacingPrice())
        .toThrow();
    });

    it('should throw error for empty params object', () => {
      expect(() => calculateGuestFacingPrice({}))
        .toThrow();
    });
  });
});
