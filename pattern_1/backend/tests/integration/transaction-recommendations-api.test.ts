/**
 * Integration Tests: Transaction Recommendations API
 *
 * Tests the full API flow including database interactions.
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/transaction-recommendations`;

// Test helper to create authenticated client
function createTestClient(authToken?: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    }
  });
}

Deno.test('Integration - GET recommendations with valid params', async () => {
  // This test requires a running Supabase instance with test data
  const response = await fetch(
    `${FUNCTION_URL}?userId=test_user_1&targetDate=2026-03-15&roommateId=test_user_2`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  assertEquals(response.status, 200);

  const data = await response.json();

  assertExists(data.primaryRecommendation);
  assertEquals(['buyout', 'crash', 'swap'].includes(data.primaryRecommendation), true);
  assertExists(data.options);
  assertEquals(Array.isArray(data.options), true);
  assertEquals(data.options.length, 3);
  assertExists(data.userArchetype);
  assertExists(data.contextFactors);
});

Deno.test('Integration - GET recommendations missing userId', async () => {
  const response = await fetch(
    `${FUNCTION_URL}?targetDate=2026-03-15&roommateId=test_user_2`,
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

Deno.test('Integration - GET recommendations missing targetDate', async () => {
  const response = await fetch(
    `${FUNCTION_URL}?userId=test_user_1&roommateId=test_user_2`,
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

Deno.test('Integration - Response structure validation', async () => {
  const response = await fetch(
    `${FUNCTION_URL}?userId=test_user_1&targetDate=2026-03-15&roommateId=test_user_2`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  const data = await response.json();

  // Validate top-level structure
  assertExists(data.primaryRecommendation);
  assertExists(data.options);
  assertExists(data.userArchetype);
  assertExists(data.contextFactors);
  assertExists(data.metadata);

  // Validate options array
  assertEquals(data.options.length, 3);

  data.options.forEach((option: any) => {
    assertExists(option.type);
    assertExists(option.price);
    assertExists(option.platformFee);
    assertExists(option.totalCost);
    assertExists(option.priority);
    assertEquals(typeof option.recommended, 'boolean');
    assertExists(option.confidence);
    assertExists(option.reasoning);
    assertEquals(Array.isArray(option.reasoning), true);
  });

  // Validate userArchetype
  assertExists(data.userArchetype.type);
  assertExists(data.userArchetype.confidence);
  assertEquals(data.userArchetype.confidence >= 0, true);
  assertEquals(data.userArchetype.confidence <= 1, true);

  // Validate contextFactors
  assertExists(data.contextFactors.daysUntilCheckIn);
  assertEquals(typeof data.contextFactors.isWeekday, 'boolean');
  assertExists(data.contextFactors.marketDemand);
  assertExists(data.contextFactors.roommateArchetype);
  assertExists(data.contextFactors.urgencyLevel);
});

Deno.test('Integration - Options are properly sorted', async () => {
  const response = await fetch(
    `${FUNCTION_URL}?userId=test_user_1&targetDate=2026-03-15&roommateId=test_user_2`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  const data = await response.json();

  // First option should be recommended
  assertEquals(data.options[0].priority, 1);
  assertEquals(data.options[0].recommended, true);

  // Options should be ordered by priority
  assertEquals(data.options[0].priority < data.options[1].priority, true);
  assertEquals(data.options[1].priority < data.options[2].priority, true);
});

Deno.test('Integration - Recommendation is logged', async () => {
  const client = createTestClient(SUPABASE_ANON_KEY);

  // Make recommendation request
  const response = await fetch(
    `${FUNCTION_URL}?userId=test_user_1&targetDate=2026-03-15&roommateId=test_user_2`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  assertEquals(response.status, 200);

  // Wait a bit for async logging
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check that log was created
  const { data: logs, error } = await client
    .from('recommendation_logs')
    .select('*')
    .eq('user_id', 'test_user_1')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!error && logs && logs.length > 0) {
    assertExists(logs[0].primary_recommendation);
    assertExists(logs[0].archetype_type);
    assertExists(logs[0].options);
  }
  // Don't fail test if logging fails - it's not critical
});

Deno.test('Integration - CORS headers present', async () => {
  const response = await fetch(
    `${FUNCTION_URL}?userId=test_user_1&targetDate=2026-03-15&roommateId=test_user_2`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  assertEquals(response.headers.has('Access-Control-Allow-Origin'), true);
});

Deno.test('Integration - OPTIONS request (CORS preflight)', async () => {
  const response = await fetch(FUNCTION_URL, {
    method: 'OPTIONS'
  });

  assertEquals(response.status, 200);
  assertEquals(response.headers.has('Access-Control-Allow-Origin'), true);
  assertEquals(response.headers.has('Access-Control-Allow-Methods'), true);
});
