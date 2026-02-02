/**
 * Pattern 2: Urgency Countdown - Urgency Calculations Tests
 *
 * Comprehensive test suite for urgency pricing calculations
 */

import { describe, it, expect } from 'vitest';
import {
  calculateUrgencyMultiplier,
  calculateUrgentPrice,
  calculateUrgencyPricing,
  generatePriceProgression,
  calculateDailyIncreaseRate,
  getUrgencyLevel,
  getUrgencyMetadata,
  checkPriceAlerts,
  formatCurrency,
  formatPercentage,
  validateUrgencyContext,
} from '../utils/urgencyCalculations';

import { UrgencyContext } from '../types';

describe('urgencyCalculations', () => {
  describe('calculateUrgencyMultiplier', () => {
    it('should return 1.0 at 90 days out', () => {
      const multiplier = calculateUrgencyMultiplier(90, 2.0, 90);
      expect(multiplier).toBeCloseTo(1.0, 1);
    });

    it('should return ~2.2x at 30 days out', () => {
      const multiplier = calculateUrgencyMultiplier(30, 2.0, 90);
      expect(multiplier).toBeCloseTo(2.2, 1);
    });

    it('should return ~4.5x at 7 days out', () => {
      const multiplier = calculateUrgencyMultiplier(7, 2.0, 90);
      expect(multiplier).toBeCloseTo(4.5, 1);
    });

    it('should return ~6.4x at 3 days out', () => {
      const multiplier = calculateUrgencyMultiplier(3, 2.0, 90);
      expect(multiplier).toBeCloseTo(6.4, 1);
    });

    it('should return ~8.8x at 1 day out', () => {
      const multiplier = calculateUrgencyMultiplier(1, 2.0, 90);
      expect(multiplier).toBeCloseTo(8.8, 1);
    });

    it('should never return below 1.0', () => {
      const multiplier = calculateUrgencyMultiplier(100, 2.0, 90);
      expect(multiplier).toBeGreaterThanOrEqual(1.0);
    });

    it('should handle edge case of 0 days', () => {
      const multiplier = calculateUrgencyMultiplier(0, 2.0, 90);
      expect(multiplier).toBeGreaterThan(8.0);
    });

    it('should return consistent values regardless of steepness (using lookup table)', () => {
      // After interpolation refactor, steepness parameter is kept for API compatibility
      // but the function uses lookup table values, so steepness doesn't affect output
      const multiplier1 = calculateUrgencyMultiplier(7, 1.0, 90);
      const multiplier2 = calculateUrgencyMultiplier(7, 2.0, 90);
      const multiplier3 = calculateUrgencyMultiplier(7, 3.0, 90);

      // All should return the same value from lookup table (4.5x at 7 days)
      expect(multiplier1).toBe(multiplier2);
      expect(multiplier2).toBe(multiplier3);
      expect(multiplier1).toBeCloseTo(4.5, 1);
    });
  });

  describe('calculateUrgentPrice', () => {
    it('should calculate price with urgency multiplier', () => {
      const price = calculateUrgentPrice({
        basePrice: 180,
        daysOut: 7,
        urgencySteepness: 2.0,
        marketDemandMultiplier: 1.0,
      });

      // 180 * 4.5 = 810
      expect(price).toBeCloseTo(810, 0);
    });

    it('should apply market demand multiplier', () => {
      const price = calculateUrgentPrice({
        basePrice: 180,
        daysOut: 7,
        urgencySteepness: 2.0,
        marketDemandMultiplier: 1.2,
      });

      // 180 * 1.2 * 4.5 = 972
      expect(price).toBeCloseTo(972, 0);
    });

    it('should round to nearest dollar', () => {
      const price = calculateUrgentPrice({
        basePrice: 123.45,
        daysOut: 7,
        urgencySteepness: 2.0,
        marketDemandMultiplier: 1.0,
      });

      expect(price).toBe(Math.round(123.45 * 4.5));
    });
  });

  describe('calculateUrgencyPricing', () => {
    const createContext = (daysUntil: number): UrgencyContext => ({
      targetDate: new Date(Date.now() + daysUntil * 24 * 60 * 60 * 1000),
      currentDate: new Date(),
      daysUntilCheckIn: daysUntil,
      hoursUntilCheckIn: daysUntil * 24,
      basePrice: 180,
      urgencySteepness: 2.0,
      marketDemandMultiplier: 1.0,
      lookbackWindow: 90,
    });

    it('should calculate full pricing structure', () => {
      const pricing = calculateUrgencyPricing(createContext(7));

      expect(pricing.currentPrice).toBeDefined();
      expect(pricing.currentMultiplier).toBeDefined();
      expect(pricing.projections).toBeInstanceOf(Array);
      expect(pricing.increaseRatePerDay).toBeDefined();
      expect(pricing.peakPrice).toBeDefined();
    });

    it('should generate appropriate projections', () => {
      const pricing = calculateUrgencyPricing(createContext(14));

      expect(pricing.projections.length).toBeGreaterThan(0);
      pricing.projections.forEach((proj) => {
        expect(proj.daysOut).toBeGreaterThanOrEqual(0);
        expect(proj.price).toBeGreaterThan(0);
        expect(proj.multiplier).toBeGreaterThanOrEqual(1.0);
      });
    });

    it('should show increasing prices in projections', () => {
      const pricing = calculateUrgencyPricing(createContext(30));

      for (let i = 1; i < pricing.projections.length; i++) {
        expect(pricing.projections[i].price).toBeGreaterThanOrEqual(
          pricing.projections[i - 1].price
        );
      }
    });

    it('should calculate daily increase rate', () => {
      const pricing = calculateUrgencyPricing(createContext(7));

      expect(pricing.increaseRatePerDay).toBeGreaterThan(0);
      expect(pricing.increaseRatePerDay).toBeLessThan(pricing.peakPrice);
    });
  });

  describe('generatePriceProgression', () => {
    it('should generate progression for forecast days', () => {
      const context: UrgencyContext = {
        targetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        currentDate: new Date(),
        daysUntilCheckIn: 10,
        hoursUntilCheckIn: 240,
        basePrice: 180,
        urgencySteepness: 2.0,
        marketDemandMultiplier: 1.0,
        lookbackWindow: 90,
      };

      const progression = generatePriceProgression(context, 5);

      expect(progression).toHaveLength(5);
      progression.forEach((proj) => {
        expect(proj.price).toBeGreaterThan(0);
        expect(proj.multiplier).toBeGreaterThanOrEqual(1.0);
      });
    });

    it('should show increasing prices over time', () => {
      const context: UrgencyContext = {
        targetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        currentDate: new Date(),
        daysUntilCheckIn: 10,
        hoursUntilCheckIn: 240,
        basePrice: 180,
        urgencySteepness: 2.0,
        marketDemandMultiplier: 1.0,
        lookbackWindow: 90,
      };

      const progression = generatePriceProgression(context, 7);

      expect(progression[0].price).toBeLessThan(progression[1].price);
      expect(progression[1].price).toBeLessThan(progression[2].price);
    });
  });

  describe('calculateDailyIncreaseRate', () => {
    it('should calculate positive rate', () => {
      const rate = calculateDailyIncreaseRate(810, 1584, 7);
      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeCloseTo(129, 0);
    });

    it('should return 0 for 1 day or less', () => {
      const rate = calculateDailyIncreaseRate(810, 1584, 1);
      expect(rate).toBe(0);
    });

    it('should handle equal prices', () => {
      const rate = calculateDailyIncreaseRate(100, 100, 7);
      expect(rate).toBe(0);
    });
  });

  describe('getUrgencyLevel', () => {
    it('should return critical for 0-3 days', () => {
      expect(getUrgencyLevel(0)).toBe('critical');
      expect(getUrgencyLevel(1)).toBe('critical');
      expect(getUrgencyLevel(3)).toBe('critical');
    });

    it('should return high for 4-7 days', () => {
      expect(getUrgencyLevel(4)).toBe('high');
      expect(getUrgencyLevel(5)).toBe('high');
      expect(getUrgencyLevel(7)).toBe('high');
    });

    it('should return medium for 8-14 days', () => {
      expect(getUrgencyLevel(8)).toBe('medium');
      expect(getUrgencyLevel(10)).toBe('medium');
      expect(getUrgencyLevel(14)).toBe('medium');
    });

    it('should return low for 15+ days', () => {
      expect(getUrgencyLevel(15)).toBe('low');
      expect(getUrgencyLevel(30)).toBe('low');
      expect(getUrgencyLevel(90)).toBe('low');
    });
  });

  describe('getUrgencyMetadata', () => {
    it('should return metadata for each level', () => {
      const levels = ['low', 'medium', 'high', 'critical'] as const;

      levels.forEach((level) => {
        const metadata = getUrgencyMetadata(level, 10);
        expect(metadata.level).toBe(level);
        expect(metadata.color).toBeDefined();
        expect(metadata.backgroundColor).toBeDefined();
        expect(metadata.label).toBeDefined();
        expect(metadata.message).toBeDefined();
      });
    });

    it('should set showCTA for medium and higher', () => {
      expect(getUrgencyMetadata('low', 20).showCTA).toBe(false);
      expect(getUrgencyMetadata('medium', 10).showCTA).toBe(true);
      expect(getUrgencyMetadata('high', 5).showCTA).toBe(true);
      expect(getUrgencyMetadata('critical', 1).showCTA).toBe(true);
    });
  });

  describe('checkPriceAlerts', () => {
    it('should detect 2x milestone', () => {
      const alerts = checkPriceAlerts(400, 200);
      const milestoneAlert = alerts.find((a) => a.type === 'milestone');
      expect(milestoneAlert).toBeDefined();
      expect(milestoneAlert?.message).toContain('doubled');
    });

    it('should detect critical threshold at 8x', () => {
      const alerts = checkPriceAlerts(1600, 200);
      const criticalAlert = alerts.find((a) => a.type === 'critical');
      expect(criticalAlert).toBeDefined();
    });

    it('should detect significant multiplier increase', () => {
      const alerts = checkPriceAlerts(400, 200, 1.5);
      const doublingAlert = alerts.find((a) => a.type === 'doubling');
      expect(doublingAlert).toBeDefined();
    });
  });

  describe('formatCurrency', () => {
    it('should format without cents by default', () => {
      expect(formatCurrency(1234.56)).toBe('1,235');
    });

    it('should format with cents when requested', () => {
      expect(formatCurrency(1234.56, true)).toBe('1,234.56');
    });

    it('should handle thousands separator', () => {
      expect(formatCurrency(1234567)).toBe('1,234,567');
    });
  });

  describe('formatPercentage', () => {
    it('should format without decimals by default', () => {
      expect(formatPercentage(42.5678)).toBe('43%');
    });

    it('should format with specified decimals', () => {
      expect(formatPercentage(42.5678, 2)).toBe('42.57%');
    });
  });

  describe('validateUrgencyContext', () => {
    it('should accept valid context', () => {
      const validContext: UrgencyContext = {
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        currentDate: new Date(),
        daysUntilCheckIn: 7,
        hoursUntilCheckIn: 168,
        basePrice: 180,
        urgencySteepness: 2.0,
        marketDemandMultiplier: 1.0,
      };

      expect(() => validateUrgencyContext(validContext)).not.toThrow();
    });

    it('should reject invalid base price', () => {
      const invalidContext: UrgencyContext = {
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        currentDate: new Date(),
        daysUntilCheckIn: 7,
        hoursUntilCheckIn: 168,
        basePrice: -100,
        urgencySteepness: 2.0,
        marketDemandMultiplier: 1.0,
      };

      expect(() => validateUrgencyContext(invalidContext)).toThrow();
    });

    it('should reject past target date', () => {
      const invalidContext: UrgencyContext = {
        targetDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        currentDate: new Date(),
        daysUntilCheckIn: -7,
        hoursUntilCheckIn: -168,
        basePrice: 180,
        urgencySteepness: 2.0,
        marketDemandMultiplier: 1.0,
      };

      expect(() => validateUrgencyContext(invalidContext)).toThrow();
    });
  });
});
