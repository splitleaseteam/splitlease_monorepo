/**
 * Unit Tests: Default Selection Engine
 *
 * Tests the core algorithm for selecting personalized transaction defaults.
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import {
  selectPersonalizedDefault,
  buildTransactionOptions,
  validateContext,
  type TransactionContext
} from '../functions/_shared/default-selection-engine.ts';
import { detectUserArchetype, type ArchetypeSignals } from '../functions/_shared/archetype-detection.ts';

// Helper to create test context
function createTestContext(overrides: Partial<any> = {}): TransactionContext {
  const bigSpenderSignals: ArchetypeSignals = {
    avgTransactionValue: 1850,
    willingnessToPay: 0.85,
    priceRejectionRate: 0.15,
    avgResponseTimeHours: 4.2,
    acceptanceRate: 0.42,
    requestFrequencyPerMonth: 2.3,
    buyoutPreference: 0.70,
    crashPreference: 0.20,
    swapPreference: 0.10,
    flexibilityScore: 32,
    accommodationHistory: 3,
    reciprocityRatio: 0.25
  };

  const requestingUser = detectUserArchetype(bigSpenderSignals);
  const roommateUser = detectUserArchetype(bigSpenderSignals);

  return {
    requestingUser,
    targetNight: {
      date: new Date('2026-02-15'),
      basePrice: 150,
      dayOfWeek: 'Saturday',
      marketDemand: 1.2
    },
    daysUntilCheckIn: 14,
    roommate: {
      id: 'roommate_123',
      archetype: roommateUser,
      acceptanceRate: 0.70,
      avgResponseTimeHours: 3.5
    },
    userHistory: {
      previousTransactions: 5,
      lastTransactionType: 'buyout',
      lastTransactionSuccess: true
    },
    ...overrides
  };
}

Deno.test('Default Selection - Big Spender + High Urgency → Buyout', () => {
  const bigSpenderSignals: ArchetypeSignals = {
    avgTransactionValue: 1850,
    willingnessToPay: 0.85,
    priceRejectionRate: 0.15,
    avgResponseTimeHours: 4.2,
    acceptanceRate: 0.42,
    requestFrequencyPerMonth: 2.3,
    buyoutPreference: 0.70,
    crashPreference: 0.20,
    swapPreference: 0.10,
    flexibilityScore: 32,
    accommodationHistory: 3,
    reciprocityRatio: 0.25
  };

  const context = createTestContext({
    requestingUser: detectUserArchetype(bigSpenderSignals),
    daysUntilCheckIn: 7
  });

  const result = selectPersonalizedDefault(context);

  assertEquals(result.primaryOption, 'buyout');
  assertEquals(result.confidence > 0.8, true);
  assertEquals(result.sortedOptions[0], 'buyout');
  assertExists(result.reasoning);
  assertEquals(result.reasoning.length > 0, true);
});

Deno.test('Default Selection - High Flex → Swap (regardless of urgency)', () => {
  const highFlexSignals: ArchetypeSignals = {
    avgTransactionValue: 125,
    willingnessToPay: 0.35,
    priceRejectionRate: 0.60,
    avgResponseTimeHours: 1.1,
    acceptanceRate: 0.78,
    requestFrequencyPerMonth: 0.9,
    buyoutPreference: 0.10,
    crashPreference: 0.30,
    swapPreference: 0.60,
    flexibilityScore: 87,
    accommodationHistory: 18,
    reciprocityRatio: 2.1
  };

  const context = createTestContext({
    requestingUser: detectUserArchetype(highFlexSignals),
    daysUntilCheckIn: 3  // Even with high urgency
  });

  const result = selectPersonalizedDefault(context);

  assertEquals(result.primaryOption, 'swap');
  assertEquals(result.sortedOptions[0], 'swap');
});

Deno.test('Default Selection - Average User + Low Urgency (30 days) → Swap', () => {
  const avgSignals: ArchetypeSignals = {
    avgTransactionValue: 450,
    willingnessToPay: 0.55,
    priceRejectionRate: 0.40,
    avgResponseTimeHours: 3.5,
    acceptanceRate: 0.60,
    requestFrequencyPerMonth: 1.2,
    buyoutPreference: 0.30,
    crashPreference: 0.35,
    swapPreference: 0.35,
    flexibilityScore: 55,
    accommodationHistory: 5,
    reciprocityRatio: 0.9
  };

  const context = createTestContext({
    requestingUser: detectUserArchetype(avgSignals),
    daysUntilCheckIn: 30
  });

  const result = selectPersonalizedDefault(context);

  assertEquals(result.primaryOption, 'swap');
});

Deno.test('Default Selection - Average User + Medium Urgency (14 days) → Crash', () => {
  const avgSignals: ArchetypeSignals = {
    avgTransactionValue: 450,
    willingnessToPay: 0.55,
    priceRejectionRate: 0.40,
    avgResponseTimeHours: 3.5,
    acceptanceRate: 0.60,
    requestFrequencyPerMonth: 1.2,
    buyoutPreference: 0.30,
    crashPreference: 0.35,
    swapPreference: 0.35,
    flexibilityScore: 55,
    accommodationHistory: 5,
    reciprocityRatio: 0.9
  };

  const context = createTestContext({
    requestingUser: detectUserArchetype(avgSignals),
    daysUntilCheckIn: 14
  });

  const result = selectPersonalizedDefault(context);

  assertEquals(result.primaryOption, 'crash');
});

Deno.test('Default Selection - Average User + High Urgency (3 days) → Crash', () => {
  const avgSignals: ArchetypeSignals = {
    avgTransactionValue: 450,
    willingnessToPay: 0.55,
    priceRejectionRate: 0.40,
    avgResponseTimeHours: 3.5,
    acceptanceRate: 0.60,
    requestFrequencyPerMonth: 1.2,
    buyoutPreference: 0.30,
    crashPreference: 0.35,
    swapPreference: 0.35,
    flexibilityScore: 55,
    accommodationHistory: 5,
    reciprocityRatio: 0.9
  };

  const context = createTestContext({
    requestingUser: detectUserArchetype(avgSignals),
    daysUntilCheckIn: 3
  });

  const result = selectPersonalizedDefault(context);

  assertEquals(result.primaryOption, 'crash');
  assertEquals(result.sortedOptions.includes('buyout'), true, 'Should still show buyout as option');
});

Deno.test('Default Selection - New User (No History) → Crash', () => {
  const newUserSignals: ArchetypeSignals = {
    avgTransactionValue: 0,
    willingnessToPay: 0.5,
    priceRejectionRate: 0.5,
    avgResponseTimeHours: 24,
    acceptanceRate: 0.5,
    requestFrequencyPerMonth: 0,
    buyoutPreference: 0.33,
    crashPreference: 0.33,
    swapPreference: 0.34,
    flexibilityScore: 50,
    accommodationHistory: 0,
    reciprocityRatio: 1
  };

  const context = createTestContext({
    requestingUser: detectUserArchetype(newUserSignals),
    userHistory: {
      previousTransactions: 0,
      lastTransactionType: null,
      lastTransactionSuccess: false
    }
  });

  const result = selectPersonalizedDefault(context);

  assertEquals(result.primaryOption, 'crash');
  assertEquals(result.confidence < 0.5, true, 'Low confidence for new users');
});

Deno.test('Build Transaction Options - Pricing Calculation', () => {
  const context = createTestContext();
  const sortedOptions = ['buyout', 'crash', 'swap'] as Array<'buyout' | 'crash' | 'swap'>;

  const options = buildTransactionOptions(context, sortedOptions);

  assertEquals(options.length, 3);

  const buyout = options.find(o => o.type === 'buyout')!;
  const crash = options.find(o => o.type === 'crash')!;
  const swap = options.find(o => o.type === 'swap')!;

  assertExists(buyout);
  assertExists(crash);
  assertExists(swap);

  // Buyout should be most expensive
  assertEquals(buyout.totalCost > crash.totalCost, true);
  assertEquals(buyout.totalCost > swap.totalCost, true);

  // Swap should be cheapest (only platform fee)
  assertEquals(swap.price, 0);
  assertEquals(swap.platformFee, 5);

  // Crash should be ~18% of buyout price
  const expectedCrashPrice = context.targetNight.basePrice * 0.18;
  assertEquals(crash.price < buyout.price, true);
  assertEquals(crash.price > swap.price, true);
});

Deno.test('Build Transaction Options - Priority Assignment', () => {
  const context = createTestContext();
  const sortedOptions = ['buyout', 'crash', 'swap'] as Array<'buyout' | 'crash' | 'swap'>;

  const options = buildTransactionOptions(context, sortedOptions);

  const buyout = options.find(o => o.type === 'buyout')!;
  const crash = options.find(o => o.type === 'crash')!;
  const swap = options.find(o => o.type === 'swap')!;

  assertEquals(buyout.priority, 1);
  assertEquals(buyout.recommended, true);
  assertEquals(crash.priority, 2);
  assertEquals(crash.recommended, false);
  assertEquals(swap.priority, 3);
  assertEquals(swap.recommended, false);
});

Deno.test('Build Transaction Options - Urgency Multiplier', () => {
  const criticalContext = createTestContext({ daysUntilCheckIn: 2 });
  const lowContext = createTestContext({ daysUntilCheckIn: 20 });

  const criticalOptions = buildTransactionOptions(criticalContext, ['buyout', 'crash', 'swap']);
  const lowOptions = buildTransactionOptions(lowContext, ['buyout', 'crash', 'swap']);

  const criticalBuyout = criticalOptions.find(o => o.type === 'buyout')!;
  const lowBuyout = lowOptions.find(o => o.type === 'buyout')!;

  assertEquals(criticalBuyout.urgencyMultiplier, 1.5);
  assertEquals(lowBuyout.urgencyMultiplier, 1.0);
  assertEquals(criticalBuyout.totalCost > lowBuyout.totalCost, true);
});

Deno.test('Validate Context - Valid Context', () => {
  const context = createTestContext();
  const validation = validateContext(context);

  assertEquals(validation.valid, true);
  assertEquals(validation.errors.length, 0);
});

Deno.test('Validate Context - Missing Fields', () => {
  const invalidContext = {
    requestingUser: null,
    targetNight: null
  };

  const validation = validateContext(invalidContext);

  assertEquals(validation.valid, false);
  assertEquals(validation.errors.length > 0, true);
});

Deno.test('Build Transaction Options - Savings Calculation', () => {
  const context = createTestContext();
  const options = buildTransactionOptions(context, ['buyout', 'crash', 'swap']);

  const buyout = options.find(o => o.type === 'buyout')!;
  const crash = options.find(o => o.type === 'crash')!;
  const swap = options.find(o => o.type === 'swap')!;

  assertExists(crash.savingsVsBuyout);
  assertExists(swap.savingsVsBuyout);

  assertEquals(crash.savingsVsBuyout! > 0, true);
  assertEquals(swap.savingsVsBuyout! > crash.savingsVsBuyout!, true);
  assertEquals(buyout.savingsVsBuyout, undefined);
});

Deno.test('Build Transaction Options - Reasoning Quality', () => {
  const context = createTestContext();
  const options = buildTransactionOptions(context, ['buyout', 'crash', 'swap']);

  options.forEach(option => {
    assertExists(option.reasoning);
    assertEquals(option.reasoning.length > 0, true);
    option.reasoning.forEach(reason => {
      assertEquals(typeof reason, 'string');
      assertEquals(reason.length > 5, true);
    });
  });
});
