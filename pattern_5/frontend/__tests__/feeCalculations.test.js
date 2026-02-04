/**
 * Fee Calculation Utilities Test Suite
 * Comprehensive tests for all fee calculation functions
 *
 * @test feeCalculations
 * @version 1.0.0
 * @production
 */

import {
  calculateFeeBreakdown,
  calculateTotalPrice,
  formatFeeBreakdownForDB,
  calculateLandlordNetReceipt,
  calculateTenantPayment,
  validateFeeCalculation,
  compareFeesByType,
  calculateBatchFees,
  formatCurrency,
  formatPercentage,
  formatBreakdownForDisplay,
  FEE_CONSTANTS,
  SUPPORTED_TRANSACTION_TYPES
} from '../utils/feeCalculations';

describe('Fee Calculation Utilities', () => {
  // ========================================
  // calculateFeeBreakdown Tests
  // ========================================
  describe('calculateFeeBreakdown', () => {
    test('should correctly calculate fees for $1000 base price', () => {
      const result = calculateFeeBreakdown(1000, 'date_change');

      expect(result.basePrice).toBe(1000);
      expect(result.platformFee).toBe(7.5); // 0.75%
      expect(result.landlordShare).toBe(7.5); // 0.75%
      expect(result.totalFee).toBe(15); // 1.5%
      expect(result.totalPrice).toBe(1015); // $1000 + $15
      expect(result.effectiveRate).toBe(1.5);
    });

    test('should handle $2,835 buyout example correctly', () => {
      const result = calculateFeeBreakdown(2835, 'buyout');

      expect(result.basePrice).toBe(2835);
      expect(result.platformFee).toBe(21.26); // 0.75% of 2835
      expect(result.landlordShare).toBe(21.26); // 0.75% of 2835
      expect(result.totalFee).toBe(42.52); // Rounded from 42.525
      expect(result.totalPrice).toBe(2877.52); // 2835 + 42.52
      expect(result.effectiveRate).toBe(1.5);
    });

    test('should apply urgency multiplier correctly', () => {
      const basePrice = 180;
      const urgencyMultiplier = 4.5; // 180 * 4.5 = 810

      const result = calculateFeeBreakdown(basePrice, 'date_change', {
        urgencyMultiplier
      });

      expect(result.basePrice).toBe(180);
      expect(result.adjustedPrice).toBe(810); // 180 * 4.5
      expect(result.multipliers.urgency).toBe(4.5);

      // Fee should be calculated on adjusted price
      const expectedFee = Math.round(810 * 0.015 * 100) / 100;
      expect(result.totalFee).toBe(expectedFee);
    });

    test('should apply buyout multiplier correctly', () => {
      const basePrice = 1000;
      const buyoutMultiplier = 2.0;

      const result = calculateFeeBreakdown(basePrice, 'buyout', {
        buyoutMultiplier
      });

      expect(result.basePrice).toBe(1000);
      expect(result.adjustedPrice).toBe(2000); // 1000 * 2.0
      expect(result.multipliers.buyout).toBe(2.0);
    });

    test('should apply both urgency and buyout multipliers', () => {
      const basePrice = 180;
      const urgencyMultiplier = 4.5;
      const buyoutMultiplier = 3.5;

      const result = calculateFeeBreakdown(basePrice, 'buyout', {
        urgencyMultiplier,
        buyoutMultiplier
      });

      // First apply urgency: 180 * 4.5 = 810
      // Then apply buyout: 810 * 3.5 = 2835
      expect(result.adjustedPrice).toBe(2835);
      expect(result.totalFee).toBe(42.52); // 1.5% of 2835, rounded
    });

    test('should handle different transaction types', () => {
      const dateChange = calculateFeeBreakdown(1000, 'date_change');
      const leaseTakeover = calculateFeeBreakdown(1000, 'lease_takeover');
      const sublet = calculateFeeBreakdown(1000, 'sublet');

      expect(dateChange.totalFee).toBe(leaseTakeover.totalFee);
      expect(dateChange.effectiveRate).toBe(1.5);
      expect(sublet.landlordShare).toBe(0); // Subletting doesn't charge landlord
    });

    test('should handle swap with zero settlement (flat fee)', () => {
      const result = calculateFeeBreakdown(0, 'swap', {
        swapSettlement: 0
      });

      expect(result.platformFee).toBe(5.00); // Flat $5 fee
      expect(result.totalFee).toBe(5.00);
      expect(result.totalPrice).toBe(5.00);
      expect(result.isSwap).toBe(true);
      expect(result.isFlatFee).toBe(true);
    });

    test('should handle swap with settlement', () => {
      const result = calculateFeeBreakdown(0, 'swap', {
        swapSettlement: 210
      });

      expect(result.basePrice).toBe(210);
      expect(result.platformFee).toBeGreaterThanOrEqual(5.00); // Min $5
      expect(result.hasSettlement).toBe(true);
    });

    test('should throw error for invalid base price', () => {
      expect(() => calculateFeeBreakdown(0, 'date_change')).not.toThrow(); // Zero is valid for swaps
      expect(() => calculateFeeBreakdown(-100, 'date_change')).toThrow();
      expect(() => calculateFeeBreakdown(null, 'date_change')).toThrow();
      expect(() => calculateFeeBreakdown(undefined, 'date_change')).toThrow();
      expect(() => calculateFeeBreakdown('invalid', 'date_change')).toThrow();
    });

    test('should apply minimum fee when total is below threshold', () => {
      const result = calculateFeeBreakdown(100, 'date_change', {
        applyMinimumFee: true
      });

      // 100 * 0.015 = 1.5, which is below minimum of $5
      expect(result.totalFee).toBe(5.00);
      expect(result.metadata.minimumFeeApplied).toBe(true);
    });

    test('should calculate savings vs traditional model', () => {
      const result = calculateFeeBreakdown(1000, 'date_change');
      const traditionalFee = 1000 * FEE_CONSTANTS.TRADITIONAL_MARKUP; // 17% = $170

      expect(result.savingsVsTraditional).toBe(traditionalFee - 15);
      expect(result.savingsVsTraditional).toBe(155); // $170 - $15
    });

    test('should include price components breakdown', () => {
      const result = calculateFeeBreakdown(180, 'buyout', {
        urgencyMultiplier: 4.5,
        buyoutMultiplier: 3.5
      });

      expect(result.components).toBeDefined();
      expect(Array.isArray(result.components)).toBe(true);
      expect(result.components.length).toBeGreaterThan(0);

      // Check for base price component
      const baseComponent = result.components.find(c => c.type === 'base');
      expect(baseComponent).toBeDefined();
      expect(baseComponent.amount).toBe(180);

      // Check for fee component
      const feeComponent = result.components.find(c => c.type === 'fee');
      expect(feeComponent).toBeDefined();
    });
  });

  // ========================================
  // calculateTotalPrice Tests
  // ========================================
  describe('calculateTotalPrice', () => {
    test('should return correct total price', () => {
      const total = calculateTotalPrice(2000, 'date_change');
      expect(total).toBe(2030); // $2000 + $30 (1.5%)
    });

    test('should handle urgency multiplier', () => {
      const total = calculateTotalPrice(1000, 'date_change', {
        urgencyMultiplier: 2.0
      });
      expect(total).toBe(2030); // (1000 * 2.0) + (2000 * 0.015)
    });
  });

  // ========================================
  // formatFeeBreakdownForDB Tests
  // ========================================
  describe('formatFeeBreakdownForDB', () => {
    test('should format breakdown for database storage', () => {
      const formatted = formatFeeBreakdownForDB(1500, 'date_change');

      expect(formatted).toHaveProperty('base_price', 1500);
      expect(formatted).toHaveProperty('platform_fee', 11.25);
      expect(formatted).toHaveProperty('landlord_share', 11.25);
      expect(formatted).toHaveProperty('total_fee', 22.5);
      expect(formatted).toHaveProperty('total_price', 1522.5);
      expect(formatted).toHaveProperty('effective_rate', 1.5);
      expect(formatted).toHaveProperty('transaction_type', 'date_change');
      expect(formatted).toHaveProperty('calculated_at');
      expect(formatted).toHaveProperty('fee_structure_version', '1.5_split_model_v1');
      expect(formatted.calculated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
    });

    test('should include multipliers in DB format', () => {
      const formatted = formatFeeBreakdownForDB(1000, 'buyout', {
        urgencyMultiplier: 2.0,
        buyoutMultiplier: 1.5
      });

      expect(formatted.multipliers).toBeDefined();
      expect(formatted.multipliers.urgency).toBe(2.0);
      expect(formatted.multipliers.buyout).toBe(1.5);
    });
  });

  // ========================================
  // calculateLandlordNetReceipt Tests
  // ========================================
  describe('calculateLandlordNetReceipt', () => {
    test('should calculate landlord net receipt correctly', () => {
      const result = calculateLandlordNetReceipt(1000, 'date_change');

      expect(result.basePrice).toBe(1000);
      expect(result.landlordShare).toBe(7.5); // 0.75%
      expect(result.netReceipt).toBe(992.5); // $1000 - $7.5
      expect(result.effectiveReceiptRate).toBe(99.25); // 99.25%
    });

    test('should handle adjusted prices with multipliers', () => {
      const result = calculateLandlordNetReceipt(1000, 'buyout', {
        buyoutMultiplier: 2.0
      });

      // Adjusted price: 2000
      // Landlord share: 2000 * 0.0075 = 15
      // Net receipt: 2000 - 15 = 1985
      expect(result.netReceipt).toBe(1985);
    });

    test('should handle sublet (no landlord share)', () => {
      const result = calculateLandlordNetReceipt(1000, 'sublet');

      expect(result.landlordShare).toBe(0);
      expect(result.netReceipt).toBe(1000); // No deduction
    });
  });

  // ========================================
  // calculateTenantPayment Tests
  // ========================================
  describe('calculateTenantPayment', () => {
    test('should calculate tenant payment breakdown', () => {
      const result = calculateTenantPayment(1000, 'date_change');

      expect(result.basePrice).toBe(1000);
      expect(result.tenantShare).toBe(15); // Full 1.5%
      expect(result.totalPayment).toBe(1015);
      expect(result.savingsVsTraditional).toBeGreaterThan(0);
      expect(result.components).toBeDefined();
    });
  });

  // ========================================
  // validateFeeCalculation Tests
  // ========================================
  describe('validateFeeCalculation', () => {
    test('should validate correct inputs', () => {
      const result = validateFeeCalculation(1000, 'date_change');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid base price', () => {
      const result = validateFeeCalculation(-100, 'date_change');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject null/undefined base price', () => {
      const resultNull = validateFeeCalculation(null, 'date_change');
      const resultUndefined = validateFeeCalculation(undefined, 'date_change');

      expect(resultNull.isValid).toBe(false);
      expect(resultUndefined.isValid).toBe(false);
    });

    test('should reject invalid transaction type', () => {
      const result = validateFeeCalculation(1000, 'invalid_type');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/Invalid transaction type/));
    });

    test('should warn about unusual values', () => {
      const result = validateFeeCalculation(0, 'date_change');

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('should validate multipliers', () => {
      const resultInvalid = validateFeeCalculation(1000, 'date_change', {
        urgencyMultiplier: 0.5 // Invalid: must be >= 1.0
      });

      expect(resultInvalid.isValid).toBe(false);

      const resultValid = validateFeeCalculation(1000, 'date_change', {
        urgencyMultiplier: 2.5
      });

      expect(resultValid.isValid).toBe(true);
    });

    test('should warn about extremely high multipliers', () => {
      const result = validateFeeCalculation(1000, 'date_change', {
        urgencyMultiplier: 15.0 // Unusually high
      });

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  // ========================================
  // compareFeesByType Tests
  // ========================================
  describe('compareFeesByType', () => {
    test('should compare fees across all transaction types', () => {
      const comparison = compareFeesByType(1000);

      expect(Array.isArray(comparison)).toBe(true);
      expect(comparison.length).toBe(SUPPORTED_TRANSACTION_TYPES.length);

      comparison.forEach(item => {
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('totalFee');
        expect(item).toHaveProperty('effectiveRate');
        expect(item).toHaveProperty('totalPrice');
      });
    });
  });

  // ========================================
  // calculateBatchFees Tests
  // ========================================
  describe('calculateBatchFees', () => {
    test('should calculate fees for multiple items', () => {
      const items = [
        { basePrice: 1000, transactionType: 'date_change' },
        { basePrice: 2000, transactionType: 'lease_takeover' },
        { basePrice: 1500, transactionType: 'buyout' }
      ];

      const result = calculateBatchFees(items);

      expect(result.itemCount).toBe(3);
      expect(result.totalBasePrice).toBe(4500);
      expect(result.items).toHaveLength(3);
      expect(result.totalFee).toBeGreaterThan(0);
      expect(result.totalPrice).toBe(result.totalBasePrice + result.totalFee);
    });

    test('should throw error for empty array', () => {
      expect(() => calculateBatchFees([])).toThrow();
    });

    test('should throw error for non-array input', () => {
      expect(() => calculateBatchFees(null)).toThrow();
      expect(() => calculateBatchFees(undefined)).toThrow();
      expect(() => calculateBatchFees('invalid')).toThrow();
    });

    test('should handle items with options', () => {
      const items = [
        {
          basePrice: 1000,
          transactionType: 'buyout',
          options: { urgencyMultiplier: 2.0 }
        }
      ];

      const result = calculateBatchFees(items);

      expect(result.items[0].feeBreakdown.adjustedPrice).toBe(2000);
    });
  });

  // ========================================
  // Formatting Tests
  // ========================================
  describe('formatCurrency', () => {
    test('should format currency correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(42.525)).toBe('$42.53'); // Rounded
      expect(formatCurrency(0)).toBe('$0.00');
    });

    test('should handle large numbers', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    test('should handle invalid input', () => {
      expect(formatCurrency(null)).toBe('$0.00');
      expect(formatCurrency(undefined)).toBe('$0.00');
      expect(formatCurrency('invalid')).toBe('$0.00');
    });
  });

  describe('formatPercentage', () => {
    test('should format percentage correctly', () => {
      expect(formatPercentage(0.015)).toBe('1.50%');
      expect(formatPercentage(0.17)).toBe('17.00%');
      expect(formatPercentage(0.0075)).toBe('0.75%');
    });

    test('should handle custom decimal places', () => {
      expect(formatPercentage(0.015, 1)).toBe('1.5%');
      expect(formatPercentage(0.015, 3)).toBe('1.500%');
    });

    test('should handle invalid input', () => {
      expect(formatPercentage(null)).toBe('0%');
      expect(formatPercentage(undefined)).toBe('0%');
    });
  });

  describe('formatBreakdownForDisplay', () => {
    test('should format entire breakdown for display', () => {
      const breakdown = calculateFeeBreakdown(1000, 'date_change');
      const formatted = formatBreakdownForDisplay(breakdown);

      expect(formatted.basePrice).toMatch(/^\$/);
      expect(formatted.totalFee).toMatch(/^\$/);
      expect(formatted.effectiveRate).toMatch(/%$/);
      expect(Array.isArray(formatted.components)).toBe(true);
    });
  });

  // ========================================
  // Edge Cases
  // ========================================
  describe('Edge cases', () => {
    test('should handle very small amounts', () => {
      const result = calculateFeeBreakdown(10);

      expect(result.totalFee).toBeGreaterThanOrEqual(0.15);
      expect(result.totalPrice).toBeGreaterThanOrEqual(10.15);
    });

    test('should handle very large amounts', () => {
      const result = calculateFeeBreakdown(100000);

      expect(result.totalFee).toBe(1500);
      expect(result.totalPrice).toBe(101500);
      expect(result.effectiveRate).toBe(1.5);
    });

    test('should handle decimal base prices', () => {
      const result = calculateFeeBreakdown(1234.56);

      expect(result.platformFee).toBeCloseTo(9.26, 2);
      expect(result.landlordShare).toBeCloseTo(9.26, 2);
      expect(result.totalFee).toBeCloseTo(18.52, 2);
    });

    test('should round consistently', () => {
      const result1 = calculateFeeBreakdown(1000);
      const result2 = calculateFeeBreakdown(1000);

      expect(result1.totalFee).toBe(result2.totalFee);
      expect(result1.totalPrice).toBe(result2.totalPrice);
    });
  });

  // ========================================
  // Constants Tests
  // ========================================
  describe('Constants', () => {
    test('FEE_CONSTANTS should be defined', () => {
      expect(FEE_CONSTANTS).toBeDefined();
      expect(FEE_CONSTANTS.PLATFORM_RATE).toBe(0.0075);
      expect(FEE_CONSTANTS.LANDLORD_RATE).toBe(0.0075);
      expect(FEE_CONSTANTS.TOTAL_RATE).toBe(0.015);
      expect(FEE_CONSTANTS.TRADITIONAL_MARKUP).toBe(0.17);
      expect(FEE_CONSTANTS.MIN_FEE_AMOUNT).toBe(5.00);
    });

    test('SUPPORTED_TRANSACTION_TYPES should be defined', () => {
      expect(SUPPORTED_TRANSACTION_TYPES).toBeDefined();
      expect(Array.isArray(SUPPORTED_TRANSACTION_TYPES)).toBe(true);
      expect(SUPPORTED_TRANSACTION_TYPES.length).toBeGreaterThan(0);
      expect(SUPPORTED_TRANSACTION_TYPES).toContain('date_change');
      expect(SUPPORTED_TRANSACTION_TYPES).toContain('lease_takeover');
    });
  });
});
