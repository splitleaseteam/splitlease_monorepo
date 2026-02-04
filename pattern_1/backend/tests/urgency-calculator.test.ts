/**
 * Unit Tests: Urgency Calculator
 *
 * Tests urgency level calculation and formatting.
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import {
  calculateUrgency,
  formatUrgencyMessage,
  getUrgencyIcon,
  shouldShowUrgencyWarning,
  getRecommendedAction
} from '../functions/_shared/urgency-calculator.ts';

Deno.test('Urgency - CRITICAL (0-3 days)', () => {
  const checkInDate = new Date();
  checkInDate.setDate(checkInDate.getDate() + 2);

  const result = calculateUrgency({ checkInDate });

  assertEquals(result.level, 'CRITICAL');
  assertEquals(result.daysUntil, 2);
  assertEquals(result.multiplier, 1.5);
  assertEquals(result.color, 'red');
  assertExists(result.message);
});

Deno.test('Urgency - HIGH (4-7 days)', () => {
  const checkInDate = new Date();
  checkInDate.setDate(checkInDate.getDate() + 5);

  const result = calculateUrgency({ checkInDate });

  assertEquals(result.level, 'HIGH');
  assertEquals(result.daysUntil, 5);
  assertEquals(result.multiplier, 1.25);
  assertEquals(result.color, 'orange');
  assertExists(result.message);
});

Deno.test('Urgency - MEDIUM (8-14 days)', () => {
  const checkInDate = new Date();
  checkInDate.setDate(checkInDate.getDate() + 10);

  const result = calculateUrgency({ checkInDate });

  assertEquals(result.level, 'MEDIUM');
  assertEquals(result.daysUntil, 10);
  assertEquals(result.multiplier, 1.1);
  assertEquals(result.color, 'yellow');
  assertExists(result.message);
});

Deno.test('Urgency - LOW (15+ days)', () => {
  const checkInDate = new Date();
  checkInDate.setDate(checkInDate.getDate() + 20);

  const result = calculateUrgency({ checkInDate });

  assertEquals(result.level, 'LOW');
  assertEquals(result.daysUntil, 20);
  assertEquals(result.multiplier, 1.0);
  assertEquals(result.color, 'green');
});

Deno.test('Urgency - Same Day (0 days)', () => {
  const checkInDate = new Date();

  const result = calculateUrgency({ checkInDate });

  assertEquals(result.level, 'CRITICAL');
  assertEquals(result.daysUntil, 0);
  assertEquals(result.multiplier, 1.5);
  assertEquals(result.message.includes('today'), true);
});

Deno.test('Urgency - Tomorrow (1 day)', () => {
  const checkInDate = new Date();
  checkInDate.setDate(checkInDate.getDate() + 1);

  const result = calculateUrgency({ checkInDate });

  assertEquals(result.level, 'CRITICAL');
  assertEquals(result.daysUntil, 1);
  assertEquals(result.message.includes('tomorrow'), true);
});

Deno.test('Urgency - Past Date', () => {
  const checkInDate = new Date();
  checkInDate.setDate(checkInDate.getDate() - 5);

  const result = calculateUrgency({ checkInDate });

  assertEquals(result.level, 'CRITICAL');
  assertEquals(result.daysUntil, 0);
  assertEquals(result.multiplier, 2.0);
});

Deno.test('Urgency - Null Date', () => {
  // @ts-ignore - testing null
  const result = calculateUrgency({ checkInDate: null });

  assertEquals(result.level, 'LOW');
  assertEquals(result.multiplier, 1.0);
  assertEquals(result.message, '');
});

Deno.test('Urgency - Custom Current Date', () => {
  const checkInDate = new Date('2026-03-15');
  const currentDate = new Date('2026-03-10');

  const result = calculateUrgency({ checkInDate, currentDate });

  assertEquals(result.daysUntil, 5);
  assertEquals(result.level, 'HIGH');
});

Deno.test('Format Urgency Message', () => {
  const urgency = {
    level: 'HIGH' as const,
    daysUntil: 5,
    multiplier: 1.25,
    color: 'orange',
    label: 'Urgent',
    message: 'Check-in is in 5 days. Consider finalizing your plans soon.'
  };

  const message = formatUrgencyMessage(urgency);

  assertExists(message);
  assertEquals(typeof message, 'string');
  assertEquals(message.includes('5 days'), true);
});

Deno.test('Get Urgency Icon', () => {
  const critical = {
    level: 'CRITICAL' as const,
    daysUntil: 2,
    multiplier: 1.5,
    color: 'red',
    label: 'Very Urgent',
    message: ''
  };

  const high = { ...critical, level: 'HIGH' as const };
  const medium = { ...critical, level: 'MEDIUM' as const };
  const low = { ...critical, level: 'LOW' as const };

  assertEquals(getUrgencyIcon(critical), '🔴');
  assertEquals(getUrgencyIcon(high), '🟠');
  assertEquals(getUrgencyIcon(medium), '🟡');
  assertEquals(getUrgencyIcon(low), '🟢');
});

Deno.test('Should Show Urgency Warning', () => {
  const critical = {
    level: 'CRITICAL' as const,
    daysUntil: 2,
    multiplier: 1.5,
    color: 'red',
    label: 'Very Urgent',
    message: ''
  };

  const high = { ...critical, level: 'HIGH' as const };
  const medium = { ...critical, level: 'MEDIUM' as const };
  const low = { ...critical, level: 'LOW' as const };

  assertEquals(shouldShowUrgencyWarning(critical), true);
  assertEquals(shouldShowUrgencyWarning(high), true);
  assertEquals(shouldShowUrgencyWarning(medium), false);
  assertEquals(shouldShowUrgencyWarning(low), false);
});

Deno.test('Get Recommended Action', () => {
  const critical = {
    level: 'CRITICAL' as const,
    daysUntil: 2,
    multiplier: 1.5,
    color: 'red',
    label: 'Very Urgent',
    message: ''
  };

  const high = { ...critical, level: 'HIGH' as const };
  const medium = { ...critical, level: 'MEDIUM' as const };
  const low = { ...critical, level: 'LOW' as const };

  assertExists(getRecommendedAction(critical));
  assertExists(getRecommendedAction(high));
  assertExists(getRecommendedAction(medium));
  assertExists(getRecommendedAction(low));

  assertEquals(getRecommendedAction(critical).length > 0, true);
  assertEquals(getRecommendedAction(high).length > 0, true);
  assertEquals(getRecommendedAction(medium).length > 0, true);
  assertEquals(getRecommendedAction(low).length > 0, true);
});

Deno.test('Urgency Multiplier Progression', () => {
  // Test that multipliers decrease as days increase
  const dates = [1, 5, 10, 20];
  const multipliers = dates.map(days => {
    const checkInDate = new Date();
    checkInDate.setDate(checkInDate.getDate() + days);
    return calculateUrgency({ checkInDate }).multiplier;
  });

  // Multipliers should decrease or stay same
  for (let i = 1; i < multipliers.length; i++) {
    assertEquals(multipliers[i] <= multipliers[i - 1], true);
  }
});
