/**
 * Unit Tests for Market Demand Calculator
 *
 * Tests day-of-week, seasonal, and event-based demand multipliers
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { MarketDemandCalculator } from '../../src/core/marketDemandCalculator';
import { EventMultiplier } from '../../src/types/urgency.types';

describe('MarketDemandCalculator', () => {
  let calculator: MarketDemandCalculator;

  beforeEach(() => {
    calculator = new MarketDemandCalculator();
  });

  describe('calculateMultiplier', () => {
    test('should calculate multiplier for weekday (urban pattern)', () => {
      calculator = MarketDemandCalculator.fromSimulationParams('urban');

      // Monday (should have weekday premium)
      const monday = new Date('2026-02-02T00:00:00Z'); // Monday
      const multiplier = calculator.calculateMultiplier(monday);

      expect(multiplier).toBeGreaterThan(1.0);
      expect(multiplier).toBeCloseTo(1.25, 2); // 1.25x for weekdays
    });

    test('should calculate multiplier for weekend (urban pattern)', () => {
      calculator = MarketDemandCalculator.fromSimulationParams('urban');

      // Saturday (should have weekend discount)
      const saturday = new Date('2026-01-31T00:00:00Z'); // Saturday
      const multiplier = calculator.calculateMultiplier(saturday);

      expect(multiplier).toBeLessThan(1.0);
      expect(multiplier).toBeCloseTo(0.8, 2); // 0.8x for weekends
    });

    test('should calculate multiplier for weekend (resort pattern)', () => {
      calculator = MarketDemandCalculator.fromSimulationParams('resort');

      // Saturday (should have weekend premium)
      const saturday = new Date('2026-01-31T00:00:00Z'); // Saturday
      const multiplier = calculator.calculateMultiplier(saturday);

      expect(multiplier).toBeGreaterThan(1.0);
      expect(multiplier).toBeCloseTo(1.4, 2); // 1.4x for weekends
    });

    test('should apply seasonal multiplier', () => {
      // June (peak season, multiplier 1.2)
      const june = new Date('2026-06-15T00:00:00Z');
      const juneMultiplier = calculator.calculateMultiplier(june);

      // January (low season, multiplier 0.9)
      const january = new Date('2026-01-15T00:00:00Z');
      const januaryMultiplier = calculator.calculateMultiplier(january);

      expect(juneMultiplier).toBeGreaterThan(januaryMultiplier);
    });

    test('should combine day-of-week and seasonal multipliers', () => {
      calculator = MarketDemandCalculator.fromSimulationParams('urban');

      // Monday in June (weekday premium + peak season)
      const mondayJune = new Date('2026-06-01T00:00:00Z'); // Monday
      const multiplier = calculator.calculateMultiplier(mondayJune);

      // Should be ~1.25 (weekday) * 1.2 (June) = ~1.5
      expect(multiplier).toBeGreaterThan(1.4);
    });
  });

  describe('Event multipliers', () => {
    test('should add event multiplier', () => {
      const event: EventMultiplier = {
        eventId: 'test-event-1',
        eventName: 'Test Conference',
        startDate: new Date('2026-02-10T00:00:00Z'),
        endDate: new Date('2026-02-15T00:00:00Z'),
        multiplier: 3.0,
        cities: ['nyc'],
      };

      calculator.addEvent(event);

      // Date within event period
      const eventDate = new Date('2026-02-12T00:00:00Z');
      const multiplier = calculator.calculateMultiplier(eventDate, 'nyc');

      // Should include event multiplier
      expect(multiplier).toBeGreaterThan(2.0);
    });

    test('should not apply event multiplier outside date range', () => {
      const event: EventMultiplier = {
        eventId: 'test-event-2',
        eventName: 'Test Conference',
        startDate: new Date('2026-02-10T00:00:00Z'),
        endDate: new Date('2026-02-15T00:00:00Z'),
        multiplier: 3.0,
        cities: ['nyc'],
      };

      calculator.addEvent(event);

      // Date before event
      const beforeEvent = new Date('2026-02-05T00:00:00Z');
      const multiplierBefore = calculator.calculateMultiplier(beforeEvent, 'nyc');

      // Date after event
      const afterEvent = new Date('2026-02-20T00:00:00Z');
      const multiplierAfter = calculator.calculateMultiplier(afterEvent, 'nyc');

      // Should not include event multiplier
      expect(multiplierBefore).toBeLessThan(2.0);
      expect(multiplierAfter).toBeLessThan(2.0);
    });

    test('should not apply event multiplier for different city', () => {
      const event: EventMultiplier = {
        eventId: 'test-event-3',
        eventName: 'Test Conference',
        startDate: new Date('2026-02-10T00:00:00Z'),
        endDate: new Date('2026-02-15T00:00:00Z'),
        multiplier: 3.0,
        cities: ['nyc'],
      };

      calculator.addEvent(event);

      // Date within event period but different city
      const eventDate = new Date('2026-02-12T00:00:00Z');
      const multiplier = calculator.calculateMultiplier(eventDate, 'la');

      // Should not include event multiplier
      expect(multiplier).toBeLessThan(2.0);
    });

    test('should use highest multiplier if multiple events overlap', () => {
      const event1: EventMultiplier = {
        eventId: 'event-1',
        eventName: 'Event 1',
        startDate: new Date('2026-02-10T00:00:00Z'),
        endDate: new Date('2026-02-15T00:00:00Z'),
        multiplier: 2.5,
        cities: ['nyc'],
      };

      const event2: EventMultiplier = {
        eventId: 'event-2',
        eventName: 'Event 2',
        startDate: new Date('2026-02-12T00:00:00Z'),
        endDate: new Date('2026-02-18T00:00:00Z'),
        multiplier: 3.5,
        cities: ['nyc'],
      };

      calculator.addEvent(event1);
      calculator.addEvent(event2);

      // Date with overlapping events
      const overlapDate = new Date('2026-02-13T00:00:00Z');
      const multiplier = calculator.calculateMultiplier(overlapDate, 'nyc');

      // Should use highest event multiplier (3.5)
      expect(multiplier).toBeGreaterThan(3.0);
    });
  });

  describe('getActiveEvents', () => {
    beforeEach(() => {
      const event1: EventMultiplier = {
        eventId: 'event-1',
        eventName: 'Event 1',
        startDate: new Date('2026-02-01T00:00:00Z'),
        endDate: new Date('2026-02-05T00:00:00Z'),
        multiplier: 2.0,
        cities: ['nyc'],
      };

      const event2: EventMultiplier = {
        eventId: 'event-2',
        eventName: 'Event 2',
        startDate: new Date('2026-02-10T00:00:00Z'),
        endDate: new Date('2026-02-15T00:00:00Z'),
        multiplier: 3.0,
        cities: ['nyc', 'sf'],
      };

      calculator.addEvent(event1);
      calculator.addEvent(event2);
    });

    test('should get active events for date range', () => {
      const startDate = new Date('2026-02-01T00:00:00Z');
      const endDate = new Date('2026-02-20T00:00:00Z');

      const events = calculator.getActiveEvents(startDate, endDate);

      expect(events.length).toBe(2);
    });

    test('should filter events by city', () => {
      const startDate = new Date('2026-02-01T00:00:00Z');
      const endDate = new Date('2026-02-20T00:00:00Z');

      const eventsNYC = calculator.getActiveEvents(startDate, endDate, 'nyc');
      const eventsSF = calculator.getActiveEvents(startDate, endDate, 'sf');

      expect(eventsNYC.length).toBe(2);
      expect(eventsSF.length).toBe(1);
    });

    test('should return empty array for non-overlapping range', () => {
      const startDate = new Date('2026-03-01T00:00:00Z');
      const endDate = new Date('2026-03-31T00:00:00Z');

      const events = calculator.getActiveEvents(startDate, endDate);

      expect(events.length).toBe(0);
    });
  });

  describe('calculateDemandBreakdown', () => {
    test('should return breakdown of all multipliers', () => {
      const date = new Date('2026-02-02T00:00:00Z'); // Monday
      const breakdown = calculator.calculateDemandBreakdown(date);

      expect(breakdown).toHaveProperty('base');
      expect(breakdown).toHaveProperty('dayOfWeek');
      expect(breakdown).toHaveProperty('seasonal');
      expect(breakdown).toHaveProperty('event');
      expect(breakdown).toHaveProperty('total');

      expect(breakdown.base).toBe(1.0);
      expect(breakdown.total).toBeGreaterThan(0);
    });

    test('should have total equal to product of components', () => {
      const date = new Date('2026-02-02T00:00:00Z');
      const breakdown = calculator.calculateDemandBreakdown(date);

      const expectedTotal =
        breakdown.base *
        breakdown.dayOfWeek *
        breakdown.seasonal *
        breakdown.event;

      expect(breakdown.total).toBeCloseTo(expectedTotal, 5);
    });
  });

  describe('addHighImpactEvent', () => {
    test('should add high-impact event with correct multiplier range', () => {
      const event = calculator.addHighImpactEvent(
        'AWS re:Invent',
        new Date('2026-11-30T00:00:00Z'),
        new Date('2026-12-04T00:00:00Z'),
        ['las-vegas'],
        [3.0, 4.0]
      );

      expect(event.multiplier).toBeGreaterThanOrEqual(3.0);
      expect(event.multiplier).toBeLessThanOrEqual(4.0);
      expect(event.cities).toContain('las-vegas');
    });
  });
});
