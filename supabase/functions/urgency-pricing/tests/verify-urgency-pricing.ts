/**
 * Urgency Pricing Verification Script
 *
 * Tests the urgency-pricing Edge Function for correctness and edge cases
 * Run with: deno run --allow-net --allow-env verify-urgency-pricing.ts
 */

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  actual?: any;
  expected?: any;
}

const results: TestResult[] = [];

// Configuration
const BASE_URL = Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321';
const FUNCTION_URL = `${BASE_URL}/functions/v1/urgency-pricing`;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

console.log(`${COLORS.cyan}╔═══════════════════════════════════════════════════════════════╗${COLORS.reset}`);
console.log(`${COLORS.cyan}║   URGENCY PRICING VERIFICATION SUITE                          ║${COLORS.reset}`);
console.log(`${COLORS.cyan}╚═══════════════════════════════════════════════════════════════╝${COLORS.reset}`);
console.log(`\nTesting endpoint: ${COLORS.blue}${FUNCTION_URL}${COLORS.reset}\n`);

/**
 * Helper: Call the Edge Function
 */
async function callFunction(action: string, payload: any): Promise<any> {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ action, payload }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${data.error || JSON.stringify(data)}`);
  }

  return data;
}

/**
 * Helper: Calculate future date
 */
function getFutureDate(daysOut: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOut);
  return date.toISOString();
}

/**
 * Helper: Assert within tolerance
 */
function assertWithinTolerance(
  name: string,
  actual: number,
  expected: number,
  tolerance: number = 0.1
): void {
  const diff = Math.abs(actual - expected);
  const passed = diff <= tolerance;

  results.push({
    name,
    passed,
    actual,
    expected,
    error: passed ? undefined : `Expected ${expected} ± ${tolerance}, got ${actual}`,
  });
}

/**
 * Helper: Assert error thrown
 */
function assertError(name: string, passed: boolean, error?: string): void {
  results.push({ name, passed, error });
}

/**
 * Test Suite 1: Formula Correctness (Steepness 2.0)
 */
console.log(`${COLORS.yellow}[TEST SUITE 1] Formula Correctness (Steepness 2.0)${COLORS.reset}`);

try {
  // Test 1: 90 Days Out (baseline)
  console.log('  Testing 90 days out (baseline 1.0x)...');
  const test90 = await callFunction('calculate', {
    targetDate: getFutureDate(90),
    basePrice: 180,
    urgencySteepness: 2.0,
  });
  assertWithinTolerance(
    '90 days out → 1.0x multiplier',
    test90.data.currentMultiplier,
    1.0,
    0.05
  );

  // Test 2: 30 Days Out
  console.log('  Testing 30 days out (2.2x)...');
  const test30 = await callFunction('calculate', {
    targetDate: getFutureDate(30),
    basePrice: 180,
    urgencySteepness: 2.0,
  });
  assertWithinTolerance(
    '30 days out → 2.2x multiplier',
    test30.data.currentMultiplier,
    2.2,
    0.1
  );

  // Test 3: 14 Days Out
  console.log('  Testing 14 days out (3.2x)...');
  const test14 = await callFunction('calculate', {
    targetDate: getFutureDate(14),
    basePrice: 180,
    urgencySteepness: 2.0,
  });
  assertWithinTolerance(
    '14 days out → 3.2x multiplier',
    test14.data.currentMultiplier,
    3.2,
    0.1
  );

  // Test 4: 7 Days Out
  console.log('  Testing 7 days out (4.5x)...');
  const test7 = await callFunction('calculate', {
    targetDate: getFutureDate(7),
    basePrice: 180,
    urgencySteepness: 2.0,
  });
  assertWithinTolerance(
    '7 days out → 4.5x multiplier',
    test7.data.currentMultiplier,
    4.5,
    0.1
  );

  // Test 5: 3 Days Out
  console.log('  Testing 3 days out (6.4x)...');
  const test3 = await callFunction('calculate', {
    targetDate: getFutureDate(3),
    basePrice: 180,
    urgencySteepness: 2.0,
  });
  assertWithinTolerance(
    '3 days out → 6.4x multiplier',
    test3.data.currentMultiplier,
    6.4,
    0.2
  );

  // Test 6: 1 Day Out
  console.log('  Testing 1 day out (8.8x)...');
  const test1 = await callFunction('calculate', {
    targetDate: getFutureDate(1),
    basePrice: 180,
    urgencySteepness: 2.0,
  });
  assertWithinTolerance(
    '1 day out → 8.8x multiplier',
    test1.data.currentMultiplier,
    8.8,
    0.2
  );

  // Test 7: 0 Days (Today)
  console.log('  Testing 0 days out (today)...');
  const test0 = await callFunction('calculate', {
    targetDate: new Date().toISOString(),
    basePrice: 180,
    urgencySteepness: 2.0,
  });
  assertWithinTolerance(
    '0 days out → max multiplier (capped at 10.0x)',
    test0.data.currentMultiplier,
    10.0,
    0.5
  );

} catch (error) {
  console.error(`${COLORS.red}  ✗ Formula test failed: ${error}${COLORS.reset}`);
  assertError('Formula correctness', false, String(error));
}

/**
 * Test Suite 2: Urgency Level Classification
 */
console.log(`\n${COLORS.yellow}[TEST SUITE 2] Urgency Level Classification${COLORS.reset}`);

try {
  // Test: CRITICAL (0-3 days)
  console.log('  Testing CRITICAL urgency level (3 days)...');
  const testCritical = await callFunction('calculate', {
    targetDate: getFutureDate(3),
    basePrice: 180,
  });
  assertError(
    'CRITICAL urgency level (0-3 days)',
    testCritical.data.urgencyLevel === 'CRITICAL'
  );

  // Test: HIGH (3-7 days)
  console.log('  Testing HIGH urgency level (7 days)...');
  const testHigh = await callFunction('calculate', {
    targetDate: getFutureDate(7),
    basePrice: 180,
  });
  assertError(
    'HIGH urgency level (3-7 days)',
    testHigh.data.urgencyLevel === 'HIGH'
  );

  // Test: MEDIUM (7-14 days)
  console.log('  Testing MEDIUM urgency level (14 days)...');
  const testMedium = await callFunction('calculate', {
    targetDate: getFutureDate(14),
    basePrice: 180,
  });
  assertError(
    'MEDIUM urgency level (7-14 days)',
    testMedium.data.urgencyLevel === 'MEDIUM'
  );

  // Test: LOW (14+ days)
  console.log('  Testing LOW urgency level (30 days)...');
  const testLow = await callFunction('calculate', {
    targetDate: getFutureDate(30),
    basePrice: 180,
  });
  assertError(
    'LOW urgency level (14+ days)',
    testLow.data.urgencyLevel === 'LOW'
  );

} catch (error) {
  console.error(`${COLORS.red}  ✗ Urgency level test failed: ${error}${COLORS.reset}`);
  assertError('Urgency level classification', false, String(error));
}

/**
 * Test Suite 3: Edge Cases & Validation
 */
console.log(`\n${COLORS.yellow}[TEST SUITE 3] Edge Cases & Validation${COLORS.reset}`);

// Test: Negative base price
console.log('  Testing negative base price (should fail)...');
try {
  await callFunction('calculate', {
    targetDate: getFutureDate(7),
    basePrice: -100,
  });
  assertError('Negative base price rejection', false, 'Should have thrown error');
} catch (error) {
  assertError(
    'Negative base price rejection',
    String(error).includes('Base price must be positive') || String(error).includes('400'),
    undefined
  );
}

// Test: Invalid date format
console.log('  Testing invalid date format (should fail)...');
try {
  await callFunction('calculate', {
    targetDate: 'not-a-date',
    basePrice: 180,
  });
  assertError('Invalid date format rejection', false, 'Should have thrown error');
} catch (error) {
  assertError(
    'Invalid date format rejection',
    String(error).includes('Invalid date') || String(error).includes('400'),
    undefined
  );
}

// Test: Missing required fields
console.log('  Testing missing targetDate (should fail)...');
try {
  await callFunction('calculate', {
    basePrice: 180,
  });
  assertError('Missing targetDate rejection', false, 'Should have thrown error');
} catch (error) {
  assertError(
    'Missing targetDate rejection',
    String(error).includes('targetDate') || String(error).includes('400'),
    undefined
  );
}

// Test: Zero base price
console.log('  Testing zero base price (should fail)...');
try {
  await callFunction('calculate', {
    targetDate: getFutureDate(7),
    basePrice: 0,
  });
  assertError('Zero base price rejection', false, 'Should have thrown error');
} catch (error) {
  assertError(
    'Zero base price rejection',
    String(error).includes('positive') || String(error).includes('400'),
    undefined
  );
}

/**
 * Test Suite 4: Caching Behavior
 */
console.log(`\n${COLORS.yellow}[TEST SUITE 4] Caching Behavior${COLORS.reset}`);

try {
  // Test: First call (cache miss)
  console.log('  Testing cache miss (first call)...');
  const firstCall = await callFunction('calculate', {
    targetDate: getFutureDate(15),
    basePrice: 200,
    urgencySteepness: 2.0,
  });
  assertError(
    'Cache miss on first call',
    firstCall.metadata.cacheHit === false
  );

  // Test: Second call (cache hit)
  console.log('  Testing cache hit (second call)...');
  const secondCall = await callFunction('calculate', {
    targetDate: getFutureDate(15),
    basePrice: 200,
    urgencySteepness: 2.0,
  });
  assertError(
    'Cache hit on second call',
    secondCall.metadata.cacheHit === true
  );

  // Test: Same date, different price (cache miss)
  console.log('  Testing cache miss (different base price)...');
  const differentPrice = await callFunction('calculate', {
    targetDate: getFutureDate(15),
    basePrice: 250, // Different price
    urgencySteepness: 2.0,
  });
  assertError(
    'Cache miss with different base price',
    differentPrice.metadata.cacheHit === false
  );

} catch (error) {
  console.error(`${COLORS.red}  ✗ Caching test failed: ${error}${COLORS.reset}`);
  assertError('Caching behavior', false, String(error));
}

/**
 * Test Suite 5: Batch & Calendar Actions
 */
console.log(`\n${COLORS.yellow}[TEST SUITE 5] Batch & Calendar Actions${COLORS.reset}`);

try {
  // Test: Batch processing
  console.log('  Testing batch processing...');
  const batchResult = await callFunction('batch', {
    requests: [
      { targetDate: getFutureDate(7), basePrice: 180 },
      { targetDate: getFutureDate(14), basePrice: 180 },
      { targetDate: getFutureDate(30), basePrice: 180 },
    ],
  });
  assertError(
    'Batch processing (3 requests)',
    batchResult.results.length === 3 &&
    batchResult.metadata.successfulRequests === 3
  );

  // Test: Calendar view
  console.log('  Testing calendar view...');
  const calendarResult = await callFunction('calendar', {
    basePrice: 180,
    dates: [getFutureDate(7), getFutureDate(14), getFutureDate(21)],
    steepness: 2.0,
  });
  assertError(
    'Calendar view (3 dates)',
    calendarResult.success && Object.keys(calendarResult.data).length === 3
  );

} catch (error) {
  console.error(`${COLORS.red}  ✗ Batch/Calendar test failed: ${error}${COLORS.reset}`);
  assertError('Batch & Calendar actions', false, String(error));
}

/**
 * Test Suite 6: Health & Stats
 */
console.log(`\n${COLORS.yellow}[TEST SUITE 6] Health & Stats${COLORS.reset}`);

try {
  // Test: Health check
  console.log('  Testing health endpoint...');
  const healthResult = await callFunction('health', {});
  assertError(
    'Health check',
    healthResult.success && healthResult.data.status === 'healthy'
  );

  // Test: Stats endpoint
  console.log('  Testing stats endpoint...');
  const statsResult = await callFunction('stats', {});
  assertError(
    'Stats endpoint',
    statsResult.success && statsResult.data.cacheStats !== undefined
  );

} catch (error) {
  console.error(`${COLORS.red}  ✗ Health/Stats test failed: ${error}${COLORS.reset}`);
  assertError('Health & Stats', false, String(error));
}

/**
 * Print Results
 */
console.log(`\n${COLORS.cyan}╔═══════════════════════════════════════════════════════════════╗${COLORS.reset}`);
console.log(`${COLORS.cyan}║   TEST RESULTS                                                ║${COLORS.reset}`);
console.log(`${COLORS.cyan}╚═══════════════════════════════════════════════════════════════╝${COLORS.reset}\n`);

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
const total = results.length;

results.forEach(result => {
  const icon = result.passed ? `${COLORS.green}✓${COLORS.reset}` : `${COLORS.red}✗${COLORS.reset}`;
  const name = result.passed ? `${COLORS.green}${result.name}${COLORS.reset}` : `${COLORS.red}${result.name}${COLORS.reset}`;

  console.log(`  ${icon} ${name}`);

  if (!result.passed && result.error) {
    console.log(`    ${COLORS.red}Error: ${result.error}${COLORS.reset}`);
  }

  if (result.actual !== undefined && result.expected !== undefined) {
    console.log(`    Expected: ${result.expected}, Got: ${result.actual}`);
  }
});

console.log(`\n${COLORS.cyan}═══════════════════════════════════════════════════════════════${COLORS.reset}`);
console.log(`  Total: ${total} | ${COLORS.green}Passed: ${passed}${COLORS.reset} | ${failed > 0 ? COLORS.red : COLORS.green}Failed: ${failed}${COLORS.reset}`);
console.log(`${COLORS.cyan}═══════════════════════════════════════════════════════════════${COLORS.reset}\n`);

/**
 * Final Verdict
 */
if (failed === 0) {
  console.log(`${COLORS.green}╔═══════════════════════════════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.green}║   ✓ ALL TESTS PASSED - READY FOR DEPLOYMENT                  ║${COLORS.reset}`);
  console.log(`${COLORS.green}╚═══════════════════════════════════════════════════════════════╝${COLORS.reset}\n`);
  console.log(`${COLORS.green}The urgency-pricing Edge Function is verified and production-ready.${COLORS.reset}`);
  console.log(`${COLORS.green}Steepness 2.0 formula is correct within tolerance.${COLORS.reset}`);
  console.log(`${COLORS.green}Edge cases are handled properly.${COLORS.reset}`);
  console.log(`${COLORS.green}Caching behavior is working as expected.${COLORS.reset}\n`);
  Deno.exit(0);
} else {
  console.log(`${COLORS.red}╔═══════════════════════════════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.red}║   ✗ TESTS FAILED - NOT READY FOR DEPLOYMENT                  ║${COLORS.reset}`);
  console.log(`${COLORS.red}╚═══════════════════════════════════════════════════════════════╝${COLORS.reset}\n`);
  console.log(`${COLORS.red}Please review the failed tests above and fix the issues.${COLORS.reset}\n`);
  Deno.exit(1);
}
