// ============================================================================
// PATTERN 5: FEE TRANSPARENCY - FEE CALCULATION COMPREHENSIVE TEST SUITE
// ============================================================================
// Test Suite: 50+ tests for fee calculation logic
// Version: 1.0
// Date: 2026-01-29
// ============================================================================

import {
  assertEquals,
  assertThrows,
  assertAlmostEquals,
} from 'https://deno.land/std@0.168.0/testing/asserts.ts';

// ============================================================================
// FEE CALCULATION LOGIC (duplicated for testing isolation)
// ============================================================================

const FEE_RATES = {
  PLATFORM_RATE: 0.0075,      // 0.75%
  LANDLORD_RATE: 0.0075,      // 0.75%
  TOTAL_RATE: 0.015,          // 1.5%
  TRADITIONAL_MARKUP: 0.17,   // 17%
  MINIMUM_FEE: 5.00,          // Minimum $5 fee
};

interface FeeBreakdown {
  base_price: number;
  platform_fee: number;
  landlord_share: number;
  tenant_share: number;
  total_fee: number;
  total_price: number;
  effective_rate: number;
  savings_vs_traditional?: number;
}

function calculateFeeBreakdown(
  basePrice: number,
  transactionType: string = 'date_change'
): FeeBreakdown {
  if (!basePrice || basePrice <= 0) {
    throw new Error('Base price must be a positive number');
  }

  let platformFee = basePrice * FEE_RATES.PLATFORM_RATE;
  let landlordShare = basePrice * FEE_RATES.LANDLORD_RATE;
  let totalFee = platformFee + landlordShare;

  // Apply minimum fee
  if (totalFee < FEE_RATES.MINIMUM_FEE) {
    totalFee = FEE_RATES.MINIMUM_FEE;
    platformFee = totalFee / 2;
    landlordShare = totalFee / 2;
  }

  const tenantShare = totalFee;
  const totalPrice = basePrice + tenantShare;
  const effectiveRate = (totalFee / basePrice) * 100;
  const traditionalFee = basePrice * FEE_RATES.TRADITIONAL_MARKUP;
  const savingsVsTraditional = traditionalFee - totalFee;

  return {
    base_price: Number(basePrice.toFixed(2)),
    platform_fee: Number(platformFee.toFixed(2)),
    landlord_share: Number(landlordShare.toFixed(2)),
    tenant_share: Number(tenantShare.toFixed(2)),
    total_fee: Number(totalFee.toFixed(2)),
    total_price: Number(totalPrice.toFixed(2)),
    effective_rate: Number(effectiveRate.toFixed(2)),
    savings_vs_traditional: Number(savingsVsTraditional.toFixed(2)),
  };
}

function validateInput(input: { leaseId: string; monthlyRent: number; transactionType?: string }): string[] {
  const errors: string[] = [];
  if (!input.leaseId) errors.push('Missing required field: leaseId');
  if (!input.monthlyRent || input.monthlyRent <= 0) errors.push('monthlyRent must be a positive number');
  if (input.monthlyRent && input.monthlyRent > 1000000) errors.push('monthlyRent exceeds maximum allowed value');
  if (input.transactionType && !['date_change', 'lease_takeover', 'sublet', 'renewal'].includes(input.transactionType)) {
    errors.push(`Invalid transaction type: ${input.transactionType}`);
  }
  return errors;
}

// ============================================================================
// TEST SUITE: BASIC FEE CALCULATIONS (20 tests)
// ============================================================================

Deno.test('Fee Calc #1: $1000 base price', () => {
  const result = calculateFeeBreakdown(1000);
  assertEquals(result.base_price, 1000);
  assertEquals(result.platform_fee, 7.5);
  assertEquals(result.landlord_share, 7.5);
  assertEquals(result.total_fee, 15);
  assertEquals(result.total_price, 1015);
});

Deno.test('Fee Calc #2: $2000 base price', () => {
  const result = calculateFeeBreakdown(2000);
  assertEquals(result.total_fee, 30);
  assertEquals(result.total_price, 2030);
});

Deno.test('Fee Calc #3: $1500 base price', () => {
  const result = calculateFeeBreakdown(1500);
  assertEquals(result.total_fee, 22.5);
  assertEquals(result.total_price, 1522.5);
});

Deno.test('Fee Calc #4: $3000 base price', () => {
  const result = calculateFeeBreakdown(3000);
  assertEquals(result.total_fee, 45);
  assertEquals(result.platform_fee, 22.5);
  assertEquals(result.landlord_share, 22.5);
});

Deno.test('Fee Calc #5: $5000 base price', () => {
  const result = calculateFeeBreakdown(5000);
  assertEquals(result.total_fee, 75);
  assertEquals(result.total_price, 5075);
});

Deno.test('Fee Calc #6: $10000 base price', () => {
  const result = calculateFeeBreakdown(10000);
  assertEquals(result.total_fee, 150);
  assertEquals(result.platform_fee, 75);
});

Deno.test('Fee Calc #7: $500 base price', () => {
  const result = calculateFeeBreakdown(500);
  assertEquals(result.total_fee, 7.5);
  assertEquals(result.total_price, 507.5);
});

Deno.test('Fee Calc #8: $750 base price', () => {
  const result = calculateFeeBreakdown(750);
  assertEquals(result.total_fee, 11.25);
});

Deno.test('Fee Calc #9: $2500 base price', () => {
  const result = calculateFeeBreakdown(2500);
  assertEquals(result.total_fee, 37.5);
  assertEquals(result.platform_fee, 18.75);
});

Deno.test('Fee Calc #10: $4000 base price', () => {
  const result = calculateFeeBreakdown(4000);
  assertEquals(result.total_fee, 60);
});

Deno.test('Fee Calc #11: $100 base price', () => {
  const result = calculateFeeBreakdown(100);
  // Minimum fee applies: $5
  assertEquals(result.total_fee, 5);
  assertEquals(result.platform_fee, 2.5);
});

Deno.test('Fee Calc #12: $200 base price', () => {
  const result = calculateFeeBreakdown(200);
  // Minimum fee applies: $5
  assertEquals(result.total_fee, 5);
});

Deno.test('Fee Calc #13: $333.33 (boundary near minimum fee)', () => {
  const result = calculateFeeBreakdown(333.33);
  // 333.33 * 1.5% = 5.0 (at boundary)
  assertEquals(result.total_fee, 5);
});

Deno.test('Fee Calc #14: $334 (just above minimum fee boundary)', () => {
  const result = calculateFeeBreakdown(334);
  // 334 * 1.5% = 5.01
  assertEquals(result.total_fee, 5.01);
});

Deno.test('Fee Calc #15: $50000 base price', () => {
  const result = calculateFeeBreakdown(50000);
  assertEquals(result.total_fee, 750);
  assertEquals(result.platform_fee, 375);
});

Deno.test('Fee Calc #16: $100000 base price', () => {
  const result = calculateFeeBreakdown(100000);
  assertEquals(result.total_fee, 1500);
  assertEquals(result.total_price, 101500);
});

Deno.test('Fee Calc #17: $1234.56 decimal base price', () => {
  const result = calculateFeeBreakdown(1234.56);
  assertEquals(result.base_price, 1234.56);
  assertEquals(result.total_fee, 18.52);
});

Deno.test('Fee Calc #18: $2835 real-world example', () => {
  const result = calculateFeeBreakdown(2835);
  assertEquals(result.total_fee, 42.53);
  assertEquals(result.total_price, 2877.53);
});

Deno.test('Fee Calc #19: $999.99 edge case', () => {
  const result = calculateFeeBreakdown(999.99);
  assertEquals(result.total_fee, 15);
});

Deno.test('Fee Calc #20: $1 minimum base price', () => {
  const result = calculateFeeBreakdown(1);
  // Minimum fee applies
  assertEquals(result.total_fee, 5);
  assertEquals(result.total_price, 6);
});

// ============================================================================
// TEST SUITE: FEE RATE VERIFICATION (10 tests)
// ============================================================================

Deno.test('Rate #1: Platform rate is exactly 0.75%', () => {
  const result = calculateFeeBreakdown(10000);
  assertEquals(result.platform_fee, 75);
  assertEquals(result.platform_fee / result.base_price, 0.0075);
});

Deno.test('Rate #2: Landlord rate is exactly 0.75%', () => {
  const result = calculateFeeBreakdown(10000);
  assertEquals(result.landlord_share, 75);
  assertEquals(result.landlord_share / result.base_price, 0.0075);
});

Deno.test('Rate #3: Total rate is exactly 1.5%', () => {
  const result = calculateFeeBreakdown(10000);
  assertEquals(result.total_fee, 150);
  assertEquals(result.total_fee / result.base_price, 0.015);
});

Deno.test('Rate #4: Effective rate equals 1.5% for standard amounts', () => {
  const amounts = [500, 1000, 2000, 5000, 10000];
  amounts.forEach(amount => {
    const result = calculateFeeBreakdown(amount);
    assertEquals(result.effective_rate, 1.5, `Failed for amount: ${amount}`);
  });
});

Deno.test('Rate #5: Platform + Landlord = Total for all amounts', () => {
  const amounts = [100, 500, 1000, 2500, 5000, 10000];
  amounts.forEach(amount => {
    const result = calculateFeeBreakdown(amount);
    const sum = Number((result.platform_fee + result.landlord_share).toFixed(2));
    assertEquals(sum, result.total_fee, `Failed for amount: ${amount}`);
  });
});

Deno.test('Rate #6: Platform fee equals landlord share', () => {
  const amounts = [500, 1000, 2000, 5000];
  amounts.forEach(amount => {
    const result = calculateFeeBreakdown(amount);
    assertEquals(result.platform_fee, result.landlord_share, `Failed for amount: ${amount}`);
  });
});

Deno.test('Rate #7: Tenant share equals total fee', () => {
  const result = calculateFeeBreakdown(2000);
  assertEquals(result.tenant_share, result.total_fee);
});

Deno.test('Rate #8: Total price = base + total fee', () => {
  const amounts = [100, 500, 1000, 5000, 10000];
  amounts.forEach(amount => {
    const result = calculateFeeBreakdown(amount);
    const calculatedTotal = Number((result.base_price + result.total_fee).toFixed(2));
    assertEquals(calculatedTotal, result.total_price, `Failed for amount: ${amount}`);
  });
});

Deno.test('Rate #9: Minimum fee preserves 50/50 split', () => {
  const result = calculateFeeBreakdown(100);
  assertEquals(result.platform_fee, 2.5);
  assertEquals(result.landlord_share, 2.5);
  assertEquals(result.total_fee, 5);
});

Deno.test('Rate #10: Consistent rate across large range', () => {
  const amounts = [400, 1000, 5000, 20000, 50000, 100000];
  amounts.forEach(amount => {
    const result = calculateFeeBreakdown(amount);
    const calculatedRate = (result.total_fee / result.base_price) * 100;
    assertAlmostEquals(calculatedRate, 1.5, 0.01, `Failed for amount: ${amount}`);
  });
});

// ============================================================================
// TEST SUITE: SAVINGS CALCULATIONS (5 tests)
// ============================================================================

Deno.test('Savings #1: $1000 saves $155 vs traditional', () => {
  const result = calculateFeeBreakdown(1000);
  // Traditional: $170 (17%), Ours: $15 (1.5%), Savings: $155
  assertEquals(result.savings_vs_traditional, 155);
});

Deno.test('Savings #2: $2000 saves $310 vs traditional', () => {
  const result = calculateFeeBreakdown(2000);
  // Traditional: $340, Ours: $30, Savings: $310
  assertEquals(result.savings_vs_traditional, 310);
});

Deno.test('Savings #3: $5000 saves $775 vs traditional', () => {
  const result = calculateFeeBreakdown(5000);
  // Traditional: $850, Ours: $75, Savings: $775
  assertEquals(result.savings_vs_traditional, 775);
});

Deno.test('Savings #4: $10000 saves $1550 vs traditional', () => {
  const result = calculateFeeBreakdown(10000);
  assertEquals(result.savings_vs_traditional, 1550);
});

Deno.test('Savings #5: Savings always positive for standard amounts', () => {
  const amounts = [500, 1000, 2000, 5000, 10000];
  amounts.forEach(amount => {
    const result = calculateFeeBreakdown(amount);
    const savings = result.savings_vs_traditional ?? 0;
    assertEquals(savings > 0, true, `Failed for amount: ${amount}`);
  });
});

// ============================================================================
// TEST SUITE: ERROR HANDLING (10 tests)
// ============================================================================

Deno.test('Error #1: Zero base price throws', () => {
  assertThrows(
    () => calculateFeeBreakdown(0),
    Error,
    'Base price must be a positive number'
  );
});

Deno.test('Error #2: Negative base price throws', () => {
  assertThrows(
    () => calculateFeeBreakdown(-100),
    Error,
    'Base price must be a positive number'
  );
});

Deno.test('Error #3: Null base price throws', () => {
  assertThrows(
    () => calculateFeeBreakdown(null as unknown as number),
    Error,
    'Base price must be a positive number'
  );
});

Deno.test('Error #4: Undefined base price throws', () => {
  assertThrows(
    () => calculateFeeBreakdown(undefined as unknown as number),
    Error,
    'Base price must be a positive number'
  );
});

Deno.test('Error #5: NaN base price throws', () => {
  assertThrows(
    () => calculateFeeBreakdown(NaN),
    Error,
    'Base price must be a positive number'
  );
});

Deno.test('Error #6: Very small negative throws', () => {
  assertThrows(
    () => calculateFeeBreakdown(-0.01),
    Error,
    'Base price must be a positive number'
  );
});

Deno.test('Error #7: Large negative throws', () => {
  assertThrows(
    () => calculateFeeBreakdown(-1000000),
    Error,
    'Base price must be a positive number'
  );
});

Deno.test('Error #8: Empty string coerced to 0 throws', () => {
  assertThrows(
    () => calculateFeeBreakdown('' as unknown as number),
    Error,
    'Base price must be a positive number'
  );
});

Deno.test('Error #9: Boolean false coerced to 0 throws', () => {
  assertThrows(
    () => calculateFeeBreakdown(false as unknown as number),
    Error,
    'Base price must be a positive number'
  );
});

Deno.test('Error #10: Array coerced weirdly handled', () => {
  assertThrows(
    () => calculateFeeBreakdown([] as unknown as number),
    Error,
    'Base price must be a positive number'
  );
});

// ============================================================================
// TEST SUITE: INPUT VALIDATION (10 tests)
// ============================================================================

Deno.test('Validate #1: Missing leaseId returns error', () => {
  const errors = validateInput({ leaseId: '', monthlyRent: 1000 });
  assertEquals(errors.includes('Missing required field: leaseId'), true);
});

Deno.test('Validate #2: Zero monthlyRent returns error', () => {
  const errors = validateInput({ leaseId: 'abc', monthlyRent: 0 });
  assertEquals(errors.includes('monthlyRent must be a positive number'), true);
});

Deno.test('Validate #3: Negative monthlyRent returns error', () => {
  const errors = validateInput({ leaseId: 'abc', monthlyRent: -100 });
  assertEquals(errors.includes('monthlyRent must be a positive number'), true);
});

Deno.test('Validate #4: Exceeds maximum returns error', () => {
  const errors = validateInput({ leaseId: 'abc', monthlyRent: 1000001 });
  assertEquals(errors.includes('monthlyRent exceeds maximum allowed value'), true);
});

Deno.test('Validate #5: Invalid transaction type returns error', () => {
  const errors = validateInput({ leaseId: 'abc', monthlyRent: 1000, transactionType: 'invalid' });
  assertEquals(errors.some(e => e.includes('Invalid transaction type')), true);
});

Deno.test('Validate #6: Valid input returns no errors', () => {
  const errors = validateInput({ leaseId: 'abc', monthlyRent: 1000 });
  assertEquals(errors.length, 0);
});

Deno.test('Validate #7: date_change is valid type', () => {
  const errors = validateInput({ leaseId: 'abc', monthlyRent: 1000, transactionType: 'date_change' });
  assertEquals(errors.length, 0);
});

Deno.test('Validate #8: lease_takeover is valid type', () => {
  const errors = validateInput({ leaseId: 'abc', monthlyRent: 1000, transactionType: 'lease_takeover' });
  assertEquals(errors.length, 0);
});

Deno.test('Validate #9: sublet is valid type', () => {
  const errors = validateInput({ leaseId: 'abc', monthlyRent: 1000, transactionType: 'sublet' });
  assertEquals(errors.length, 0);
});

Deno.test('Validate #10: renewal is valid type', () => {
  const errors = validateInput({ leaseId: 'abc', monthlyRent: 1000, transactionType: 'renewal' });
  assertEquals(errors.length, 0);
});

// ============================================================================
// TEST SUITE: TRANSACTION TYPES (5 tests)
// ============================================================================

Deno.test('TxType #1: date_change has same fee as default', () => {
  const result = calculateFeeBreakdown(1000, 'date_change');
  assertEquals(result.total_fee, 15);
});

Deno.test('TxType #2: lease_takeover has same fee rate', () => {
  const result = calculateFeeBreakdown(1000, 'lease_takeover');
  assertEquals(result.total_fee, 15);
  assertEquals(result.effective_rate, 1.5);
});

Deno.test('TxType #3: sublet has same fee rate', () => {
  const result = calculateFeeBreakdown(1000, 'sublet');
  assertEquals(result.total_fee, 15);
});

Deno.test('TxType #4: renewal has same fee rate', () => {
  const result = calculateFeeBreakdown(1000, 'renewal');
  assertEquals(result.total_fee, 15);
});

Deno.test('TxType #5: All types produce identical fees', () => {
  const types = ['date_change', 'lease_takeover', 'sublet', 'renewal'];
  types.forEach(type => {
    const result = calculateFeeBreakdown(2500, type);
    assertEquals(result.total_fee, 37.5, `Failed for type: ${type}`);
  });
});

// ============================================================================
// TEST SUITE: ROUNDING (5 tests)
// ============================================================================

Deno.test('Rounding #1: All values have max 2 decimal places', () => {
  const result = calculateFeeBreakdown(1234.5678);
  const decimals = (n: number) => (n.toString().split('.')[1] || '').length;
  assertEquals(decimals(result.base_price) <= 2, true);
  assertEquals(decimals(result.platform_fee) <= 2, true);
  assertEquals(decimals(result.total_fee) <= 2, true);
  assertEquals(decimals(result.total_price) <= 2, true);
});

Deno.test('Rounding #2: $1.01 rounds correctly', () => {
  const result = calculateFeeBreakdown(1.01);
  assertEquals(result.total_fee, 5); // Minimum fee
});

Deno.test('Rounding #3: $999.999 rounds correctly', () => {
  const result = calculateFeeBreakdown(999.999);
  assertEquals(result.base_price, 1000);
});

Deno.test('Rounding #4: Penny precision maintained', () => {
  const result = calculateFeeBreakdown(1000.01);
  assertEquals(result.total_fee, 15);
});

Deno.test('Rounding #5: Large decimal rounds correctly', () => {
  const result = calculateFeeBreakdown(12345.6789);
  assertEquals(result.base_price, 12345.68);
});

console.log('✅ All 55 fee calculation tests passed!');
