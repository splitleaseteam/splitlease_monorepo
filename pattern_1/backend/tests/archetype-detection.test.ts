/**
 * Unit Tests: Archetype Detection
 *
 * Tests the archetype detection algorithm with various user signals.
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import {
  detectUserArchetype,
  getArchetypeLabel,
  getArchetypeDescription,
  type ArchetypeSignals
} from '../functions/_shared/archetype-detection.ts';

Deno.test('Archetype Detection - Big Spender', () => {
  const signals: ArchetypeSignals = {
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

  const result = detectUserArchetype(signals);

  assertEquals(result.archetypeType, 'big_spender');
  assertEquals(result.confidence > 0.7, true, 'Confidence should be > 0.7');
  assertExists(result.reasoning);
  assertEquals(result.reasoning.length > 0, true, 'Should have reasoning');
});

Deno.test('Archetype Detection - High Flexibility', () => {
  const signals: ArchetypeSignals = {
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

  const result = detectUserArchetype(signals);

  assertEquals(result.archetypeType, 'high_flexibility');
  assertEquals(result.confidence > 0.7, true, 'Confidence should be > 0.7');
  assertExists(result.reasoning);
  assertEquals(result.reasoning.length > 0, true, 'Should have reasoning');
});

Deno.test('Archetype Detection - Average User', () => {
  const signals: ArchetypeSignals = {
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

  const result = detectUserArchetype(signals);

  assertEquals(result.archetypeType, 'average_user');
  assertExists(result.reasoning);
});

Deno.test('Archetype Detection - New User (Zero Signals)', () => {
  const signals: ArchetypeSignals = {
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

  const result = detectUserArchetype(signals);

  // Should default to average
  assertEquals(result.archetypeType, 'average_user');
  assertEquals(result.confidence < 0.7, true, 'Confidence should be lower for new users');
});

Deno.test('Archetype Detection - Edge Case: Very High Transaction Value', () => {
  const signals: ArchetypeSignals = {
    avgTransactionValue: 5000,
    willingnessToPay: 0.95,
    priceRejectionRate: 0.05,
    avgResponseTimeHours: 10,
    acceptanceRate: 0.30,
    requestFrequencyPerMonth: 3.5,
    buyoutPreference: 0.85,
    crashPreference: 0.10,
    swapPreference: 0.05,
    flexibilityScore: 20,
    accommodationHistory: 1,
    reciprocityRatio: 0.15
  };

  const result = detectUserArchetype(signals);

  assertEquals(result.archetypeType, 'big_spender');
  assertEquals(result.confidence > 0.8, true, 'Very strong signals should give high confidence');
});

Deno.test('Archetype Detection - Edge Case: Conflicting Signals', () => {
  // High transaction value but also high flexibility
  const signals: ArchetypeSignals = {
    avgTransactionValue: 1200,
    willingnessToPay: 0.75,
    priceRejectionRate: 0.25,
    avgResponseTimeHours: 1.5,
    acceptanceRate: 0.80,
    requestFrequencyPerMonth: 1.8,
    buyoutPreference: 0.50,
    crashPreference: 0.25,
    swapPreference: 0.25,
    flexibilityScore: 75,
    accommodationHistory: 12,
    reciprocityRatio: 1.8
  };

  const result = detectUserArchetype(signals);

  assertExists(result.archetypeType);
  assertEquals(['big_spender', 'high_flexibility', 'average_user'].includes(result.archetypeType), true);
  // Confidence might be lower due to conflicting signals
  assertEquals(result.confidence > 0, true);
});

Deno.test('Get Archetype Label', () => {
  assertEquals(getArchetypeLabel('big_spender'), 'Premium Booker');
  assertEquals(getArchetypeLabel('high_flexibility'), 'Flexible Scheduler');
  assertEquals(getArchetypeLabel('average_user'), 'Standard User');
  assertEquals(getArchetypeLabel('invalid'), 'Standard User'); // Fallback
});

Deno.test('Get Archetype Description', () => {
  const bigSpenderDesc = getArchetypeDescription('big_spender');
  assertExists(bigSpenderDesc);
  assertEquals(bigSpenderDesc.length > 0, true);

  const highFlexDesc = getArchetypeDescription('high_flexibility');
  assertExists(highFlexDesc);
  assertEquals(highFlexDesc.length > 0, true);

  const avgDesc = getArchetypeDescription('average_user');
  assertExists(avgDesc);
  assertEquals(avgDesc.length > 0, true);
});

Deno.test('Archetype Detection - Reasoning Quality', () => {
  const signals: ArchetypeSignals = {
    avgTransactionValue: 2000,
    willingnessToPay: 0.90,
    priceRejectionRate: 0.10,
    avgResponseTimeHours: 5,
    acceptanceRate: 0.35,
    requestFrequencyPerMonth: 3,
    buyoutPreference: 0.80,
    crashPreference: 0.15,
    swapPreference: 0.05,
    flexibilityScore: 25,
    accommodationHistory: 2,
    reciprocityRatio: 0.3
  };

  const result = detectUserArchetype(signals);

  assertEquals(result.reasoning.length > 0, true, 'Should provide reasoning');
  assertEquals(result.reasoning.length <= 5, true, 'Should limit to top 5 reasons');

  // Check that reasoning is descriptive
  result.reasoning.forEach(reason => {
    assertEquals(reason.length > 10, true, 'Each reason should be descriptive');
  });
});
