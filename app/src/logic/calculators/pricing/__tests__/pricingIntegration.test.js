/**
 * Pricing Calculator Integration Test Suite
 *
 * Tests chained calculator operations to ensure end-to-end pricing works correctly.
 * These tests catch bugs that occur when calculators are combined.
 *
 * @intent Verify pricing calculators work correctly when chained
 * @covers Bug inventory: pricing calculator integration bugs
 */
import { describe, it, expect } from 'vitest';
import { getNightlyRateByFrequency } from '../getNightlyRateByFrequency.js';
import { calculateFourWeekRent } from '../calculateFourWeekRent.js';
import { calculateGuestFacingPrice } from '../calculateGuestFacingPrice.js';
import { calculateReservationTotal } from '../calculateReservationTotal.js';
import { calculatePricingBreakdown } from '../calculatePricingBreakdown.js';

describe('Pricing Calculator Integration Tests', () => {
  // ============================================================================
  // Complete Pricing Flow
  // ============================================================================
  describe('complete pricing flow - listing to total', () => {
    it('should calculate full flow: listing → nightly rate → guest price → total', () => {
      const listing = {
        'nightly_rate_4_nights': 100,
        'cleaning_fee': 50,
        'damage_deposit': 500
      };

      // Step 1: Get nightly rate
      const nightlyRate = getNightlyRateByFrequency({
        listing,
        nightsSelected: 4
      });
      expect(nightlyRate).toBe(100);

      // Step 2: Calculate 4-week rent (host compensation)
      const fourWeekRent = calculateFourWeekRent({
        nightlyRate,
        frequency: 4
      });
      expect(fourWeekRent).toBe(1600);

      // Step 3: Calculate reservation total
      const reservationTotal = calculateReservationTotal({
        fourWeekRent,
        totalWeeks: 13
      });
      expect(reservationTotal).toBe(5200);

      // Verify using calculatePricingBreakdown
      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 4,
        reservationWeeks: 13
      });
      expect(breakdown.nightlyPrice).toBe(100);
      expect(breakdown.fourWeekRent).toBe(1600);
      expect(breakdown.reservationTotal).toBe(5200);
      expect(breakdown.cleaningFee).toBe(50);
      expect(breakdown.damageDeposit).toBe(500);
      expect(breakdown.grandTotal).toBe(5250);
    });

    it('should calculate flow with guest-facing pricing', () => {
      const listing = {
        'nightly_rate_4_nights': 100
      };

      // Get host rate
      const hostRate = getNightlyRateByFrequency({
        listing,
        nightsSelected: 4
      });

      // Convert to guest-facing price
      const guestPrice = calculateGuestFacingPrice({
        hostNightlyRate: hostRate,
        nightsCount: 4
      });
      expect(guestPrice).toBe(117); // 100 + 17% markup

      // Calculate 4-week rent at guest price
      const guestFourWeekRent = calculateFourWeekRent({
        nightlyRate: guestPrice,
        frequency: 4
      });
      expect(guestFourWeekRent).toBe(1872); // 117 * 4 * 4
    });

    it('should calculate flow with full-time discount', () => {
      const listing = {
        'nightly_rate_7_nights': 100
      };

      // Get host rate for 7 nights
      const hostRate = getNightlyRateByFrequency({
        listing,
        nightsSelected: 7
      });

      // Convert to guest-facing price (with 13% discount)
      const guestPrice = calculateGuestFacingPrice({
        hostNightlyRate: hostRate,
        nightsCount: 7
      });
      expect(guestPrice).toBeCloseTo(101.79, 2);

      // Calculate 4-week rent
      const guestFourWeekRent = calculateFourWeekRent({
        nightlyRate: guestPrice,
        frequency: 7
      });
      // 101.79 * 7 * 4 ≈ 2850.12
      expect(guestFourWeekRent).toBeCloseTo(2850.12, 2);
    });
  });

  // ============================================================================
  // Error Propagation in Chains
  // ============================================================================
  describe('error propagation through calculator chains', () => {
    it('should propagate error from missing nightly rate field', () => {
      const listing = {
        'nightly_rate_4_nights': 100
        // Missing nightly_rate_3_nights
      };

      expect(() => {
        const rate = getNightlyRateByFrequency({
          listing,
          nightsSelected: 3
        });
        // If we got here, continue chain
        calculateFourWeekRent({ nightlyRate: rate, frequency: 3 });
      }).toThrow('No price found for 3 nights in listing');
    });

    it('should propagate error from invalid frequency', () => {
      const listing = {
        'nightly_rate_4_nights': 100
      };

      expect(() => {
        const rate = getNightlyRateByFrequency({
          listing,
          nightsSelected: 4
        });
        // Invalid frequency (outside 2-7)
        calculateFourWeekRent({ nightlyRate: rate, frequency: 1 });
      }).toThrow();
    });

    it('should propagate error from null listing', () => {
      expect(() => calculatePricingBreakdown({
        listing: null,
        nightsPerWeek: 4,
        reservationWeeks: 13
      })).toThrow('listing must be a valid object');
    });

    it('should propagate error from negative rates', () => {
      expect(() => calculateFourWeekRent({
        nightlyRate: -100,
        frequency: 4
      })).toThrow();
    });
  });

  // ============================================================================
  // Legacy Data Integration
  // ============================================================================
  describe('legacy data integration scenarios', () => {
    it('should handle listing with string numeric rates', () => {
      const listing = {
        'nightly_rate_4_nights': '100',
        'cleaning_fee': '50',
        'damage_deposit': '500'
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 4,
        reservationWeeks: 13
      });

      expect(breakdown.nightlyPrice).toBe(100);
      expect(breakdown.fourWeekRent).toBe(1600);
      expect(breakdown.cleaningFee).toBe(50);
      expect(breakdown.damageDeposit).toBe(500);
    });

    it('should handle listing with null optional fees', () => {
      const listing = {
        'nightly_rate_4_nights': 100,
        'cleaning_fee': null,
        'damage_deposit': null
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 4,
        reservationWeeks: 13
      });

      expect(breakdown.cleaningFee).toBe(0);
      expect(breakdown.damageDeposit).toBe(0);
      expect(breakdown.grandTotal).toBe(5200);
    });

    it('should handle listing with missing optional fee fields', () => {
      const listing = {
        'nightly_rate_4_nights': 100
        // No cleaning_fee or damage_deposit fields
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 4,
        reservationWeeks: 13
      });

      expect(breakdown.cleaningFee).toBe(0);
      expect(breakdown.damageDeposit).toBe(0);
    });

    it('should reject listing with invalid string rates', () => {
      const listing = {
        'nightly_rate_4_nights': 'invalid'
      };

      expect(() => getNightlyRateByFrequency({
        listing,
        nightsSelected: 4
      })).toThrow('Invalid rate value');
    });
  });

  // ============================================================================
  // Multi-Night Pricing Flow
  // ============================================================================
  describe('multi-night pricing scenarios', () => {
    it('should calculate 2-night weekend pricing', () => {
      const listing = {
        'nightly_rate_2_nights': 150,
        'cleaning_fee': 40
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 2,
        reservationWeeks: 8
      });

      expect(breakdown.nightlyPrice).toBe(150);
      expect(breakdown.fourWeekRent).toBe(1200); // 150 * 2 * 4
      expect(breakdown.reservationTotal).toBe(2400); // 1200 * (8/4)
      expect(breakdown.grandTotal).toBe(2440); // + cleaning fee
    });

    it('should calculate 3-night midweek pricing', () => {
      const listing = {
        'nightly_rate_3_nights': 120,
        'cleaning_fee': 45
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 3,
        reservationWeeks: 12
      });

      expect(breakdown.nightlyPrice).toBe(120);
      expect(breakdown.fourWeekRent).toBe(1440); // 120 * 3 * 4
      expect(breakdown.reservationTotal).toBe(4320); // 1440 * (12/4)
    });

    it('should calculate 5-night pricing', () => {
      const listing = {
        'nightly_rate_5_nights': 90
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 5,
        reservationWeeks: 16
      });

      expect(breakdown.nightlyPrice).toBe(90);
      expect(breakdown.fourWeekRent).toBe(1800); // 90 * 5 * 4
      expect(breakdown.reservationTotal).toBe(7200); // 1800 * (16/4)
    });

    it('should calculate 6-night pricing', () => {
      const listing = {
        'nightly_rate_6_nights': 85
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 6,
        reservationWeeks: 20
      });

      expect(breakdown.nightlyPrice).toBe(85);
      expect(breakdown.fourWeekRent).toBe(2040); // 85 * 6 * 4
      expect(breakdown.reservationTotal).toBe(10200); // 2040 * (20/4)
    });

    it('should calculate 7-night full-time pricing', () => {
      const listing = {
        'nightly_rate_7_nights': 75
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 7,
        reservationWeeks: 26
      });

      expect(breakdown.nightlyPrice).toBe(75);
      expect(breakdown.fourWeekRent).toBe(2100); // 75 * 7 * 4
      expect(breakdown.reservationTotal).toBe(13650); // 2100 * (26/4)
    });
  });

  // ============================================================================
  // Price Override Scenarios
  // ============================================================================
  describe('price override integration', () => {
    it('should use price override instead of tiered rates', () => {
      const listing = {
        'nightly_rate_2_nights': 150,
        'nightly_rate_3_nights': 140,
        'nightly_rate_4_nights': 130,
        'nightly_rate_5_nights': 120,
        'nightly_rate_6_nights': 110,
        'nightly_rate_7_nights': 100,
        'price_override': 200,
        'cleaning_fee': 50
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 4,
        reservationWeeks: 13
      });

      // Should use override price
      expect(breakdown.nightlyPrice).toBe(200);
      expect(breakdown.fourWeekRent).toBe(3200); // 200 * 4 * 4
      expect(breakdown.reservationTotal).toBe(10400); // 3200 * (13/4)
    });

    it('should handle price override with null fees', () => {
      const listing = {
        'price_override': 175,
        'cleaning_fee': null,
        'damage_deposit': null
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 5,
        reservationWeeks: 8
      });

      expect(breakdown.nightlyPrice).toBe(175);
      expect(breakdown.fourWeekRent).toBe(3500); // 175 * 5 * 4
      expect(breakdown.cleaningFee).toBe(0);
      expect(breakdown.damageDeposit).toBe(0);
    });

    it('should reject negative price override', () => {
      const listing = {
        'price_override': -100
      };

      expect(() => getNightlyRateByFrequency({
        listing,
        nightsSelected: 4
      })).toThrow('Invalid price override value');
    });

    it('should reject NaN price override', () => {
      const listing = {
        'price_override': 'not a number'
      };

      expect(() => getNightlyRateByFrequency({
        listing,
        nightsSelected: 4
      })).toThrow('Invalid price override value');
    });

    it('should treat zero price override as falsy and use tiered rate', () => {
      const listing = {
        'nightly_rate_4_nights': 100,
        'price_override': 0
      };

      const rate = getNightlyRateByFrequency({
        listing,
        nightsSelected: 4
      });

      // Zero is falsy, so it falls back to tiered rate
      expect(rate).toBe(100);
    });
  });

  // ============================================================================
  // Variable Duration Stays
  // ============================================================================
  describe('variable duration stay calculations', () => {
    it('should calculate 1-month stay (4 weeks)', () => {
      const listing = {
        'nightly_rate_4_nights': 100
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 4,
        reservationWeeks: 4
      });

      expect(breakdown.reservationTotal).toBe(1600); // Equals 4-week rent
    });

    it('should calculate 3-month stay (13 weeks)', () => {
      const listing = {
        'nightly_rate_4_nights': 100
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 4,
        reservationWeeks: 13
      });

      expect(breakdown.reservationTotal).toBe(5200); // 1600 * 3.25
    });

    it('should calculate 6-month stay (26 weeks)', () => {
      const listing = {
        'nightly_rate_4_nights': 100
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 4,
        reservationWeeks: 26
      });

      expect(breakdown.reservationTotal).toBe(10400); // 1600 * 6.5
    });

    it('should calculate 12-month stay (52 weeks)', () => {
      const listing = {
        'nightly_rate_4_nights': 100
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 4,
        reservationWeeks: 52
      });

      expect(breakdown.reservationTotal).toBe(20800); // 1600 * 13
    });

    it('should calculate custom duration (17 weeks)', () => {
      const listing = {
        'nightly_rate_4_nights': 100
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 4,
        reservationWeeks: 17
      });

      expect(breakdown.reservationTotal).toBe(6800); // 1600 * 4.25
    });
  });

  // ============================================================================
  // Fee Impact Scenarios
  // ============================================================================
  describe('fee impact on total pricing', () => {
    it('should calculate high cleaning fee impact', () => {
      const listing = {
        'nightly_rate_4_nights': 100,
        'cleaning_fee': 200
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 4,
        reservationWeeks: 13
      });

      expect(breakdown.reservationTotal).toBe(5200);
      expect(breakdown.cleaningFee).toBe(200);
      expect(breakdown.grandTotal).toBe(5400);
    });

    it('should calculate high damage deposit impact', () => {
      const listing = {
        'nightly_rate_4_nights': 100,
        'damage_deposit': 2000
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 4,
        reservationWeeks: 13
      });

      // Damage deposit is NOT added to grand total (it's refundable)
      expect(breakdown.damageDeposit).toBe(2000);
      expect(breakdown.grandTotal).toBe(5200);
    });

    it('should calculate both fees impact', () => {
      const listing = {
        'nightly_rate_4_nights': 100,
        'cleaning_fee': 150,
        'damage_deposit': 1500
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 4,
        reservationWeeks: 13
      });

      expect(breakdown.reservationTotal).toBe(5200);
      expect(breakdown.cleaningFee).toBe(150);
      expect(breakdown.damageDeposit).toBe(1500);
      expect(breakdown.grandTotal).toBe(5350); // Only cleaning fee added
    });
  });

  // ============================================================================
  // Cross-Calculator Consistency
  // ============================================================================
  describe('cross-calculator consistency checks', () => {
    it('should maintain consistency between individual and breakdown calculations', () => {
      const listing = {
        'nightly_rate_4_nights': 100
      };

      // Individual calculations
      const rate1 = getNightlyRateByFrequency({ listing, nightsSelected: 4 });
      const rent1 = calculateFourWeekRent({ nightlyRate: rate1, frequency: 4 });
      const total1 = calculateReservationTotal({ fourWeekRent: rent1, totalWeeks: 13 });

      // Breakdown calculation
      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 4,
        reservationWeeks: 13
      });

      expect(rate1).toBe(breakdown.nightlyPrice);
      expect(rent1).toBe(breakdown.fourWeekRent);
      expect(total1).toBe(breakdown.reservationTotal);
    });

    it('should handle same listing with different night counts correctly', () => {
      const listing = {
        'nightly_rate_2_nights': 150,
        'nightly_rate_4_nights': 100,
        'nightly_rate_7_nights': 75
      };

      const twoNightRate = getNightlyRateByFrequency({ listing, nightsSelected: 2 });
      const fourNightRate = getNightlyRateByFrequency({ listing, nightsSelected: 4 });
      const sevenNightRate = getNightlyRateByFrequency({ listing, nightsSelected: 7 });

      expect(twoNightRate).toBe(150);
      expect(fourNightRate).toBe(100);
      expect(sevenNightRate).toBe(75);

      // Verify decreasing rates with more nights
      expect(twoNightRate).toBeGreaterThan(fourNightRate);
      expect(fourNightRate).toBeGreaterThan(sevenNightRate);
    });
  });

  // ============================================================================
  // Real-World NYC Pricing Scenarios
  // ============================================================================
  describe('real-world NYC pricing scenarios', () => {
    it('should calculate budget studio in outer borough', () => {
      const listing = {
        'nightly_rate_4_nights': 60,
        'cleaning_fee': 40,
        'damage_deposit': 300
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 4,
        reservationWeeks: 13
      });

      expect(breakdown.nightlyPrice).toBe(60);
      expect(breakdown.reservationTotal).toBe(960);
      expect(breakdown.grandTotal).toBe(1000);
    });

    it('should calculate mid-range 1-bedroom in Manhattan', () => {
      const listing = {
        'nightly_rate_4_nights': 175,
        'cleaning_fee': 100,
        'damage_deposit': 750
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 4,
        reservationWeeks: 13
      });

      expect(breakdown.nightlyPrice).toBe(175);
      expect(breakdown.reservationTotal).toBe(2800);
      expect(breakdown.grandTotal).toBe(2900);
    });

    it('should calculate luxury 2-bedroom in prime Manhattan', () => {
      const listing = {
        'nightly_rate_7_nights': 350,
        'cleaning_fee': 200,
        'damage_deposit': 2000
      };

      const breakdown = calculatePricingBreakdown({
        listing,
        nightsPerWeek: 7,
        reservationWeeks: 26
      });

      expect(breakdown.nightlyPrice).toBe(350);
      expect(breakdown.reservationTotal).toBe(25480); // 9800 * 2.6
      expect(breakdown.grandTotal).toBe(25680);
    });
  });
});
