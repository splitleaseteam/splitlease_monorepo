/**
 * Integration Tests: User Archetype API
 *
 * Tests the archetype retrieval, recalculation, and override endpoints.
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/user-archetype`;

Deno.test('Integration - GET user archetype', async () => {
  const response = await fetch(
    `${FUNCTION_URL}?userId=test_user_1`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  assertEquals(response.status, 200);

  const data = await response.json();

  assertExists(data.userId);
  assertExists(data.archetypeType);
  assertEquals(['big_spender', 'high_flexibility', 'average_user'].includes(data.archetypeType), true);
  assertExists(data.confidence);
  assertEquals(data.confidence >= 0, true);
  assertEquals(data.confidence <= 1, true);
  assertExists(data.signals);
  assertExists(data.reasoning);
  assertExists(data.label);
  assertExists(data.description);
  assertExists(data.computedAt);
  assertExists(data.nextUpdateIn);
  assertEquals(typeof data.cached, 'boolean');
});

Deno.test('Integration - GET archetype missing userId', async () => {
  const response = await fetch(
    FUNCTION_URL,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  assertEquals(response.status, 400);

  const data = await response.json();
  assertExists(data.error);
});

Deno.test('Integration - GET archetype signals structure', async () => {
  const response = await fetch(
    `${FUNCTION_URL}?userId=test_user_1`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  const data = await response.json();

  // Validate signals structure
  assertExists(data.signals);
  assertExists(data.signals.avgTransactionValue);
  assertExists(data.signals.willingnessToPay);
  assertExists(data.signals.priceRejectionRate);
  assertExists(data.signals.avgResponseTimeHours);
  assertExists(data.signals.acceptanceRate);
  assertExists(data.signals.requestFrequencyPerMonth);
  assertExists(data.signals.buyoutPreference);
  assertExists(data.signals.crashPreference);
  assertExists(data.signals.swapPreference);
  assertExists(data.signals.flexibilityScore);
  assertExists(data.signals.accommodationHistory);
  assertExists(data.signals.reciprocityRatio);
});

Deno.test('Integration - Cached vs Fresh Response', async () => {
  // First request
  const response1 = await fetch(
    `${FUNCTION_URL}?userId=test_user_fresh`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  const data1 = await response1.json();
  const cached1 = data1.cached;

  // Second request (should be cached)
  const response2 = await fetch(
    `${FUNCTION_URL}?userId=test_user_fresh`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  const data2 = await response2.json();
  const cached2 = data2.cached;

  // If first was fresh, second should be cached
  if (cached1 === false) {
    assertEquals(cached2, true);
  }
});

Deno.test('Integration - POST recalculate (requires admin)', async () => {
  // This test requires an admin auth token
  const adminToken = Deno.env.get('SUPABASE_ADMIN_TOKEN');

  if (!adminToken) {
    console.log('Skipping admin test - no admin token');
    return;
  }

  const response = await fetch(
    FUNCTION_URL,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test_user_1'
      })
    }
  );

  // Should succeed or return 403 if not admin
  assertEquals([200, 401, 403].includes(response.status), true);

  if (response.status === 200) {
    const data = await response.json();
    assertEquals(data.success, true);
    assertExists(data.archetype);
  }
});

Deno.test('Integration - POST recalculate without admin fails', async () => {
  const response = await fetch(
    FUNCTION_URL,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test_user_1'
      })
    }
  );

  // Should be unauthorized or forbidden
  assertEquals([401, 403].includes(response.status), true);
});

Deno.test('Integration - PUT override (requires admin)', async () => {
  const adminToken = Deno.env.get('SUPABASE_ADMIN_TOKEN');

  if (!adminToken) {
    console.log('Skipping admin test - no admin token');
    return;
  }

  const response = await fetch(
    FUNCTION_URL,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test_user_1',
        archetypeType: 'big_spender',
        reason: 'Test override'
      })
    }
  );

  assertEquals([200, 401, 403].includes(response.status), true);

  if (response.status === 200) {
    const data = await response.json();
    assertEquals(data.success, true);
    assertExists(data.archetype);
    assertEquals(data.archetype.isManualOverride, true);
  }
});

Deno.test('Integration - PUT override with invalid archetype fails', async () => {
  const adminToken = Deno.env.get('SUPABASE_ADMIN_TOKEN');

  if (!adminToken) {
    console.log('Skipping admin test - no admin token');
    return;
  }

  const response = await fetch(
    FUNCTION_URL,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test_user_1',
        archetypeType: 'invalid_type',
        reason: 'Test'
      })
    }
  );

  assertEquals([400, 401, 403].includes(response.status), true);
});
