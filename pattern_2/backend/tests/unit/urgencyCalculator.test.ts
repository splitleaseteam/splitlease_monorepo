/**
 * Unit Tests for Urgency Calculator
 *
 * Comprehensive tests for urgency pricing calculation
 * Tests exponential formula with steepness = 2.0
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { UrgencyCalculator } from '../../src/core/urgencyCalculator';
import {
  UrgencyContext,
  UrgencyLevel,
  URGENCY_CONSTANTS,
} from '../../src/types/urgency.types';
import { DateUtils } from '../../src/utils/dateUtils';

describe('UrgencyCalculator', () => {
  describe('calculateUrgencyMultiplier', () => {
    test('should calculate multiplier correctly for 30 days out', () => {
      const multiplier = UrgencyCalculator.calculateUrgencyMultiplier({
        daysOut: 30,
        steepness: 2.0,
        lookbackWindow: 90,
      });

      // Expected: ~2.2x at 30 days with steepness 2.0
      expect(multiplier).toBeCloseTo(2.2, 1);
    });

    test('should calculate multiplier correctly for 14 days out', () => {
      const multiplier = UrgencyCalculator.calculateUrgencyMultiplier({
        daysOut: 14,
        steepness: 2.0,
        lookbackWindow: 90,
      });

      // Expected: ~3.2x at 14 days with steepness 2.0
      expect(multiplier).toBeCloseTo(3.2, 1);
    });

    test('should calculate multiplier correctly for 7 days out', () => {
      const multiplier = UrgencyCalculator.calculateUrgencyMultiplier({
        daysOut: 7,
        steepness: 2.0,
        lookbackWindow: 90,
      });

      // Expected: ~4.5x at 7 days with steepness 2.0
      expect(multiplier).toBeCloseTo(4.5, 1);
    });

    test('should calculate multiplier correctly for 3 days out', () => {
      const multiplier = UrgencyCalculator.calculateUrgencyMultiplier({
        daysOut: 3,
        steepness: 2.0,
        lookbackWindow: 90,
      });

      // Expected: ~6.4x at 3 days with steepness 2.0
      expect(multiplier).toBeCloseTo(6.4, 1);
    });

    test('should calculate multiplier correctly for 1 day out', () => {
      const multiplier = UrgencyCalculator.calculateUrgencyMultiplier({
        daysOut: 1,
        steepness: 2.0,
        lookbackWindow: 90,
      });

      // Expected: ~8.8x at 1 day with steepness 2.0
      expect(multiplier).toBeCloseTo(8.8, 1);
    });

    test('should never go below minimum multiplier (1.0)', () => {
      const multiplier = UrgencyCalculator.calculateUrgencyMultiplier({
        daysOut: 90,
        steepness: 2.0,
        lookbackWindow: 90,
      });

      expect(multiplier).toBeGreaterThanOrEqual(URGENCY_CONSTANTS.MIN_MULTIPLIER);
    });

    test('should cap at maximum multiplier', () => {
      const multiplier = UrgencyCalculator.calculateUrgencyMultiplier({
        daysOut: 0,
        steepness: 5.0, // Very high steepness
        lookbackWindow: 90,
      });

      expect(multiplier).toBeLessThanOrEqual(URGENCY_CONSTANTS.MAX_MULTIPLIER);
    });

    test('should handle negative days out (clamp to 0)', () => {
      const multiplier = UrgencyCalculator.calculateUrgencyMultiplier({
        daysOut: -5,
        steepness: 2.0,
        lookbackWindow: 90,
      });

      expect(multiplier).toBeDefined();
      expect(multiplier).toBeGreaterThanOrEqual(URGENCY_CONSTANTS.MIN_MULTIPLIER);
    });

    test('should increase multiplier as days out decreases', () => {
      const multiplier30 = UrgencyCalculator.calculateUrgencyMultiplier({
        daysOut: 30,
        steepness: 2.0,
        lookbackWindow: 90,
      });

      const multiplier7 = UrgencyCalculator.calculateUrgencyMultiplier({
        daysOut: 7,
        steepness: 2.0,
        lookbackWindow: 90,
      });

      const multiplier1 = UrgencyCalculator.calculateUrgencyMultiplier({
        daysOut: 1,
        steepness: 2.0,
        lookbackWindow: 90,
      });

      expect(multiplier7).toBeGreaterThan(multiplier30);
      expect(multiplier1).toBeGreaterThan(multiplier7);
    });

    test('should throw error for invalid steepness', () => {
      expect(() => {
        UrgencyCalculator.calculateUrgencyMultiplier({
          daysOut: 7,
          steepness: 0,
          lookbackWindow: 90,
        });
      }).toThrow();

      expect(() => {
        UrgencyCalculator.calculateUrgencyMultiplier({
          daysOut: 7,
          steepness: -1,
          lookbackWindow: 90,
        });
      }).toThrow();
    });
  });

  describe('calculateUrgencyLevel', () => {
    test('should classify 2 days as CRITICAL', () => {
      const level = UrgencyCalculator.calculateUrgencyLevel(2);
      expect(level).toBe(UrgencyLevel.CRITICAL);
    });

    test('should classify 5 days as HIGH', () => {
      const level = UrgencyCalculator.calculateUrgencyLevel(5);
      expect(level).toBe(UrgencyLevel.HIGH);
    });

    test('should classify 10 days as MEDIUM', () => {
      const level = UrgencyCalculator.calculateUrgencyLevel(10);
      expect(level).toBe(UrgencyLevel.MEDIUM);
    });

    test('should classify 20 days as LOW', () => {
      const level = UrgencyCalculator.calculateUrgencyLevel(20);
      expect(level).toBe(UrgencyLevel.LOW);
    });

    test('should handle boundary conditions', () => {
      expect(UrgencyCalculator.calculateUrgencyLevel(3)).toBe(UrgencyLevel.CRITICAL);
      expect(UrgencyCalculator.calculateUrgencyLevel(4)).toBe(UrgencyLevel.HIGH);
      expect(UrgencyCalculator.calculateUrgencyLevel(7)).toBe(UrgencyLevel.HIGH);
      expect(UrgencyCalculator.calculateUrgencyLevel(8)).toBe(UrgencyLevel.MEDIUM);
      expect(UrgencyCalculator.calculateUrgencyLevel(14)).toBe(UrgencyLevel.MEDIUM);
      expect(UrgencyCalculator.calculateUrgencyLevel(15)).toBe(UrgencyLevel.LOW);
    });
  });

  describe('calculateUrgencyPricing', () => {
    let context: UrgencyContext;

    beforeEach(() => {
      const currentDate = new Date('2026-01-28T00:00:00Z');
      const targetDate = new Date('2026-02-04T00:00:00Z'); // 7 days out

      context = {
        targetDate,
        currentDate,
        daysUntilCheckIn: 7,
        hoursUntilCheckIn: 168,
        basePrice: 180,
        urgencySteepness: 2.0,
        marketDemandMultiplier: 1.0,
        lookbackWindow: 90,
      };
    });

    test('should calculate complete pricing structure', () => {
      const pricing = UrgencyCalculator.calculateUrgencyPricing(context);

      expect(pricing).toBeDefined();
      expect(pricing.currentPrice).toBeDefined();
      expect(pricing.currentMultiplier).toBeDefined();
      expect(pricing.basePrice).toBe(180);
      expect(pricing.marketAdjustedBase).toBe(180);
      expect(pricing.urgencyLevel).toBe(UrgencyLevel.HIGH);
      expect(pricing.daysUntilCheckIn).toBe(7);
      expect(pricing.projections).toBeInstanceOf(Array);
      expect(pricing.calculatedAt).toBeInstanceOf(Date);
      expect(pricing.expiresAt).toBeInstanceOf(Date);
    });

    test('should apply market demand multiplier correctly', () => {
      const contextWithMarket = {
        ...context,
        marketDemandMultiplier: 1.25,
      };

      const pricing = UrgencyCalculator.calculateUrgencyPricing(contextWithMarket);

      expect(pricing.marketAdjustedBase).toBe(180 * 1.25);
      expect(pricing.currentPrice).toBeGreaterThan(180);
    });

    test('should generate price projections', () => {
      const pricing = UrgencyCalculator.calculateUrgencyPricing(context);

      expect(pricing.projections.length).toBeGreaterThan(0);

      // All projections should have higher prices than current
      pricing.projections.forEach((projection) => {
        expect(projection.price).toBeGreaterThan(pricing.currentPrice);
        expect(projection.increaseFromCurrent).toBeGreaterThan(0);
        expect(projection.percentageIncrease).toBeGreaterThan(0);
      });
    });

    test('should calculate peak price (1-day out)', () => {
      const pricing = UrgencyCalculator.calculateUrgencyPricing(context);

      expect(pricing.peakPrice).toBeDefined();
      expect(pricing.peakPrice).toBeGreaterThan(pricing.currentPrice);
    });

    test('should calculate daily increase rate', () => {
      const pricing = UrgencyCalculator.calculateUrgencyPricing(context);

      expect(pricing.increaseRatePerDay).toBeDefined();
      expect(pricing.increaseRatePerDay).toBeGreaterThan(0);

      // Verify rate is consistent with price difference
      const expectedIncrease = pricing.peakPrice - pricing.currentPrice;
      const daysRemaining = context.daysUntilCheckIn - 1;
      const expectedRate = Math.round(expectedIncrease / daysRemaining);

      expect(pricing.increaseRatePerDay).toBe(expectedRate);
    });

    test('should set cache expiry based on urgency level', () => {
      const pricing = UrgencyCalculator.calculateUrgencyPricing(context);

      const expiryTime = pricing.expiresAt.getTime() - pricing.calculatedAt.getTime();
      const expectedTTL = 15 * 60 * 1000; // 15 minutes for HIGH urgency

      expect(expiryTime).toBeCloseTo(expectedTTL, -3); // Within 1 second
    });

    test('should throw error for invalid context', () => {
      const invalidContext = {
        ...context,
        basePrice: -100,
      };

      expect(() => {
        UrgencyCalculator.calculateUrgencyPricing(invalidContext);
      }).toThrow();
    });

    test('should handle critical urgency (< 3 days)', () => {
      const criticalContext = {
        ...context,
        targetDate: DateUtils.addDays(context.currentDate, 2),
        daysUntilCheckIn: 2,
        hoursUntilCheckIn: 48,
      };

      const pricing = UrgencyCalculator.calculateUrgencyPricing(criticalContext);

      expect(pricing.urgencyLevel).toBe(UrgencyLevel.CRITICAL);
      expect(pricing.currentMultiplier).toBeGreaterThan(6.0);

      // Cache TTL should be shorter for critical urgency
      const expiryTime = pricing.expiresAt.getTime() - pricing.calculatedAt.getTime();
      expect(expiryTime).toBeLessThan(10 * 60 * 1000); // Less than 10 minutes
    });
  });

  describe('calculatePriceForDaysOut', () => {
    test('should calculate quick price for specific days out', () => {
      const price = UrgencyCalculator.calculatePriceForDaysOut(
        180, // base price
        7,   // days out
        2.0  // steepness
      );

      expect(price).toBeDefined();
      expect(price).toBeGreaterThan(180);

      // Should be approximately base * multiplier for 7 days
      const expectedMultiplier = 4.5; // ~4.5x at 7 days
      const expectedPrice = 180 * expectedMultiplier;
      expect(price).toBeCloseTo(expectedPrice, -1); // Within 10
    });

    test('should apply market multiplier', () => {
      const priceWithMarket = UrgencyCalculator.calculatePriceForDaysOut(
        180,
        7,
        2.0,
        1.25 // market multiplier
      );

      const priceWithoutMarket = UrgencyCalculator.calculatePriceForDaysOut(
        180,
        7,
        2.0,
        1.0
      );

      expect(priceWithMarket).toBeGreaterThan(priceWithoutMarket);
      expect(priceWithMarket / priceWithoutMarket).toBeCloseTo(1.25, 2);
    });
  });

  describe('getMultiplierExamples', () => {
    test('should return expected multiplier examples', () => {
      const examples = UrgencyCalculator.getMultiplierExamples();

      expect(examples[90]).toBe(1.0);
      expect(examples[30]).toBe(2.2);
      expect(examples[14]).toBe(3.2);
      expect(examples[7]).toBe(4.5);
      expect(examples[3]).toBe(6.4);
      expect(examples[1]).toBe(8.8);
    });
  });

  describe('getUpdateInterval', () => {
    test('should return correct update interval for each urgency level', () => {
      expect(UrgencyCalculator.getUpdateInterval(UrgencyLevel.CRITICAL)).toBe(60000);
      expect(UrgencyCalculator.getUpdateInterval(UrgencyLevel.HIGH)).toBe(900000);
      expect(UrgencyCalculator.getUpdateInterval(UrgencyLevel.MEDIUM)).toBe(3600000);
      expect(UrgencyCalculator.getUpdateInterval(UrgencyLevel.LOW)).toBe(21600000);
    });
  });
});
