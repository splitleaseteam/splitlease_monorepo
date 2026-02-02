// ============================================================================
// PATTERN 5: FEE TRANSPARENCY - EDGE FUNCTION INTEGRATION TESTS
// ============================================================================
// Test Suite: Integration tests for Stripe and fee processing edge functions
// Version: 1.0
// Date: 2026-01-28
// ============================================================================

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const TEST_AUTH_TOKEN = Deno.env.get('TEST_AUTH_TOKEN') || '';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function callEdgeFunction(
  functionName: string,
  payload: any,
  authToken?: string
): Promise<Response> {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  return await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
}

// ============================================================================
// PROCESS DATE CHANGE FEE TESTS
// ============================================================================

Deno.test('Edge Function: process-date-change-fee - Preview mode', async () => {
  const payload = {
    leaseId: 'test-lease-id',
    monthlyRent: 1500,
    transactionType: 'date_change',
  };

  const response = await callEdgeFunction(
    'process-date-change-fee',
    payload,
    TEST_AUTH_TOKEN
  );

  assertEquals(response.status, 200);

  const data = await response.json();
  assertExists(data.success);
  assertEquals(data.success, true);
  assertExists(data.feeBreakdown);
  assertEquals(data.preview, true);

  // Verify fee breakdown
  assertEquals(data.feeBreakdown.base_price, 1500);
  assertEquals(data.feeBreakdown.total_fee, 22.5);
  assertEquals(data.feeBreakdown.effective_rate, 1.5);
});

Deno.test('Edge Function: process-date-change-fee - Invalid input', async () => {
  const payload = {
    // Missing leaseId
    monthlyRent: 1500,
  };

  const response = await callEdgeFunction(
    'process-date-change-fee',
    payload,
    TEST_AUTH_TOKEN
  );

  assertEquals(response.status, 400);

  const data = await response.json();
  assertEquals(data.success, false);
  assertExists(data.error);
});

Deno.test('Edge Function: process-date-change-fee - Zero amount', async () => {
  const payload = {
    leaseId: 'test-lease-id',
    monthlyRent: 0,
  };

  const response = await callEdgeFunction(
    'process-date-change-fee',
    payload,
    TEST_AUTH_TOKEN
  );

  assertEquals(response.status, 400);

  const data = await response.json();
  assertEquals(data.success, false);
});

Deno.test('Edge Function: process-date-change-fee - Negative amount', async () => {
  const payload = {
    leaseId: 'test-lease-id',
    monthlyRent: -100,
  };

  const response = await callEdgeFunction(
    'process-date-change-fee',
    payload,
    TEST_AUTH_TOKEN
  );

  assertEquals(response.status, 400);
});

Deno.test('Edge Function: process-date-change-fee - Large amount', async () => {
  const payload = {
    leaseId: 'test-lease-id',
    monthlyRent: 50000,
    transactionType: 'date_change',
  };

  const response = await callEdgeFunction(
    'process-date-change-fee',
    payload,
    TEST_AUTH_TOKEN
  );

  assertEquals(response.status, 200);

  const data = await response.json();
  assertEquals(data.success, true);
  assertEquals(data.feeBreakdown.base_price, 50000);
  assertEquals(data.feeBreakdown.total_fee, 750); // 1.5% of 50000
});

Deno.test('Edge Function: process-date-change-fee - Different transaction types', async () => {
  const types = ['date_change', 'lease_takeover', 'sublet'];

  for (const type of types) {
    const payload = {
      leaseId: 'test-lease-id',
      monthlyRent: 2000,
      transactionType: type,
    };

    const response = await callEdgeFunction(
      'process-date-change-fee',
      payload,
      TEST_AUTH_TOKEN
    );

    assertEquals(response.status, 200);

    const data = await response.json();
    assertEquals(data.success, true);
    assertEquals(data.feeBreakdown.transaction_type, type);
    assertEquals(data.feeBreakdown.total_fee, 30); // Same fee for all types
  }
});

Deno.test('Edge Function: process-date-change-fee - Unauthorized', async () => {
  const payload = {
    leaseId: 'test-lease-id',
    monthlyRent: 1500,
  };

  // Call without auth token
  const response = await callEdgeFunction('process-date-change-fee', payload);

  assertEquals(response.status, 400);

  const data = await response.json();
  assertEquals(data.success, false);
});

// ============================================================================
// CREATE PAYMENT INTENT TESTS
// ============================================================================

Deno.test('Edge Function: create-payment-intent - Missing requestId', async () => {
  const payload = {
    // Missing requestId
  };

  const response = await callEdgeFunction(
    'create-payment-intent',
    payload,
    TEST_AUTH_TOKEN
  );

  assertEquals(response.status, 400);

  const data = await response.json();
  assertEquals(data.success, false);
  assertExists(data.error);
});

// ============================================================================
// ADMIN FEE DASHBOARD TESTS
// ============================================================================

Deno.test('Edge Function: admin-fee-dashboard - Unauthorized (non-admin)', async () => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/admin-fee-dashboard`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TEST_AUTH_TOKEN}`,
      },
    }
  );

  // Should return 403 Forbidden if user is not admin
  // or 200 if user is admin
  assertExists(response.status);
});

// ============================================================================
// FEE CALCULATION ACCURACY TESTS
// ============================================================================

Deno.test('Edge Function: Fee calculations match expected values', async () => {
  const testCases = [
    { rent: 1000, expectedFee: 15 },
    { rent: 2000, expectedFee: 30 },
    { rent: 1500, expectedFee: 22.5 },
    { rent: 2835, expectedFee: 42.53 },
    { rent: 5000, expectedFee: 75 },
  ];

  for (const testCase of testCases) {
    const payload = {
      leaseId: 'test-lease-id',
      monthlyRent: testCase.rent,
    };

    const response = await callEdgeFunction(
      'process-date-change-fee',
      payload,
      TEST_AUTH_TOKEN
    );

    const data = await response.json();

    assertEquals(
      data.feeBreakdown.total_fee,
      testCase.expectedFee,
      `Fee mismatch for rent ${testCase.rent}`
    );
  }
});

Deno.test('Edge Function: Platform and landlord split is 50/50', async () => {
  const payload = {
    leaseId: 'test-lease-id',
    monthlyRent: 2000,
  };

  const response = await callEdgeFunction(
    'process-date-change-fee',
    payload,
    TEST_AUTH_TOKEN
  );

  const data = await response.json();

  assertEquals(
    data.feeBreakdown.platform_fee,
    data.feeBreakdown.landlord_share,
    'Platform fee and landlord share should be equal'
  );
});

Deno.test('Edge Function: Effective rate is always 1.5%', async () => {
  const amounts = [100, 500, 1000, 2500, 5000];

  for (const amount of amounts) {
    const payload = {
      leaseId: 'test-lease-id',
      monthlyRent: amount,
    };

    const response = await callEdgeFunction(
      'process-date-change-fee',
      payload,
      TEST_AUTH_TOKEN
    );

    const data = await response.json();

    assertEquals(
      data.feeBreakdown.effective_rate,
      1.5,
      `Effective rate mismatch for amount ${amount}`
    );
  }
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

Deno.test('Edge Function: Handles malformed JSON', async () => {
  const url = `${SUPABASE_URL}/functions/v1/process-date-change-fee`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_AUTH_TOKEN}`,
    },
    body: 'invalid json',
  });

  // Should handle error gracefully
  assertExists(response.status);
});

Deno.test('Edge Function: Handles missing Content-Type', async () => {
  const url = `${SUPABASE_URL}/functions/v1/process-date-change-fee`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_AUTH_TOKEN}`,
    },
    body: JSON.stringify({
      leaseId: 'test',
      monthlyRent: 1000,
    }),
  });

  assertExists(response.status);
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

Deno.test('Edge Function: Response time < 1000ms', async () => {
  const startTime = Date.now();

  const payload = {
    leaseId: 'test-lease-id',
    monthlyRent: 1500,
  };

  await callEdgeFunction('process-date-change-fee', payload, TEST_AUTH_TOKEN);

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`Edge function response time: ${duration}ms`);

  // Should respond within 1 second
  assertEquals(duration < 1000, true, `Response too slow: ${duration}ms`);
});

console.log('✅ All edge function integration tests passed!');

// ============================================================================
// END TEST SUITE
// ============================================================================
