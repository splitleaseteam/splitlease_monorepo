/**
 * Tests for calculateFeeBreakdown
 *
 * Calculates detailed fee breakdown including cleaning fee, damage deposit,
 * and any additional fees. Tests legacy data scenarios and precision handling.
 *
 * @intent Comprehensive coverage of fee calculation edge cases
 * @covers Bug inventory: pricing calculator bugs with null/undefined handling
 */
import { describe, it, expect } from 'vitest';
import { calculateFeeBreakdown } from '../calculateFeeBreakdown.js';

describe('calculateFeeBreakdown', () => {
  // ============================================================================
  // Happy Path Tests
  // ============================================================================
  describe('happy path - standard fees', () => {
    it('should calculate breakdown with all fees present', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 50,
          damage_deposit: 500
        }
      });

      expect(result.cleaningFee).toBe(50);
      expect(result.damageDeposit).toBe(500);
      expect(result.totalFees).toBe(50); // Damage deposit is refundable, not added to total
    });

    it('should calculate breakdown with only cleaning fee', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 75
        }
      });

      expect(result.cleaningFee).toBe(75);
      expect(result.damageDeposit).toBe(0);
      expect(result.totalFees).toBe(75);
    });

    it('should calculate breakdown with only damage deposit', () => {
      const result = calculateFeeBreakdown({
        listing: {
          damage_deposit: 1000
        }
      });

      expect(result.cleaningFee).toBe(0);
      expect(result.damageDeposit).toBe(1000);
      expect(result.totalFees).toBe(0);
    });

    it('should handle zero fees explicitly', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 0,
          damage_deposit: 0
        }
      });

      expect(result.cleaningFee).toBe(0);
      expect(result.damageDeposit).toBe(0);
      expect(result.totalFees).toBe(0);
    });
  });

  // ============================================================================
  // Legacy Data Scenarios - Bug Inventory Coverage
  // ============================================================================
  describe('legacy data scenarios - null/undefined handling', () => {
    it('should handle null cleaning fee from legacy data', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: null,
          damage_deposit: 500
        }
      });

      expect(result.cleaningFee).toBe(0);
      expect(result.damageDeposit).toBe(500);
      expect(result.totalFees).toBe(0);
    });

    it('should handle undefined cleaning fee', () => {
      const result = calculateFeeBreakdown({
        listing: {
          damage_deposit: 500
        }
      });

      expect(result.cleaningFee).toBe(0);
      expect(result.damageDeposit).toBe(500);
    });

    it('should handle null damage deposit from legacy data', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 50,
          damage_deposit: null
        }
      });

      expect(result.cleaningFee).toBe(50);
      expect(result.damageDeposit).toBe(0);
      expect(result.totalFees).toBe(50);
    });

    it('should handle undefined damage deposit', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 50
        }
      });

      expect(result.damageDeposit).toBe(0);
    });

    it('should handle all null fees', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: null,
          damage_deposit: null
        }
      });

      expect(result.cleaningFee).toBe(0);
      expect(result.damageDeposit).toBe(0);
      expect(result.totalFees).toBe(0);
    });

    it('should handle completely empty listing object', () => {
      const result = calculateFeeBreakdown({
        listing: {}
      });

      expect(result.cleaningFee).toBe(0);
      expect(result.damageDeposit).toBe(0);
      expect(result.totalFees).toBe(0);
    });

    it('should handle listing with undefined properties', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: undefined,
          damage_deposit: undefined
        }
      });

      expect(result.cleaningFee).toBe(0);
      expect(result.damageDeposit).toBe(0);
    });
  });

  // ============================================================================
  // String Number Conversion - Legacy Bubble Data
  // ============================================================================
  describe('string number conversion', () => {
    it('should convert numeric string cleaning fee', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: '50',
          damage_deposit: 500
        }
      });

      expect(result.cleaningFee).toBe(50);
    });

    it('should convert numeric string damage deposit', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 50,
          damage_deposit: '500'
        }
      });

      expect(result.damageDeposit).toBe(500);
    });

    it('should convert both fees as strings', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: '75.50',
          damage_deposit: '1000'
        }
      });

      expect(result.cleaningFee).toBe(75.50);
      expect(result.damageDeposit).toBe(1000);
    });

    it('should handle string with leading zeros', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: '0075',
          damage_deposit: '0500'
        }
      });

      expect(result.cleaningFee).toBe(75);
      expect(result.damageDeposit).toBe(500);
    });

    it('should handle string with trailing decimal', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: '75.',
          damage_deposit: '500.'
        }
      });

      expect(result.cleaningFee).toBe(75);
      expect(result.damageDeposit).toBe(500);
    });
  });

  // ============================================================================
  // Error Handling - Invalid Values
  // ============================================================================
  describe('error handling - invalid values', () => {
    it('should throw error for negative cleaning fee', () => {
      expect(() => calculateFeeBreakdown({
        listing: {
          cleaning_fee: -50,
          damage_deposit: 500
        }
      })).toThrow('Cleaning Fee cannot be negative');
    });

    it('should throw error for negative damage deposit', () => {
      expect(() => calculateFeeBreakdown({
        listing: {
          cleaning_fee: 50,
          damage_deposit: -500
        }
      })).toThrow('Damage Deposit cannot be negative');
    });

    it('should throw error for NaN cleaning fee', () => {
      expect(() => calculateFeeBreakdown({
        listing: {
          cleaning_fee: NaN,
          damage_deposit: 500
        }
      })).toThrow('Cleaning Fee has invalid value');
    });

    it('should throw error for NaN damage deposit', () => {
      expect(() => calculateFeeBreakdown({
        listing: {
          cleaning_fee: 50,
          damage_deposit: NaN
        }
      })).toThrow('Damage Deposit has invalid value');
    });

    it('should throw error for non-numeric string cleaning fee', () => {
      expect(() => calculateFeeBreakdown({
        listing: {
          cleaning_fee: 'fifty',
          damage_deposit: 500
        }
      })).toThrow('Cleaning Fee has invalid value');
    });

    it('should throw error for non-numeric string damage deposit', () => {
      expect(() => calculateFeeBreakdown({
        listing: {
          cleaning_fee: 50,
          damage_deposit: 'five hundred'
        }
      })).toThrow('Damage Deposit has invalid value');
    });

    it('should throw error for array cleaning fee', () => {
      expect(() => calculateFeeBreakdown({
        listing: {
          cleaning_fee: [50],
          damage_deposit: 500
        }
      })).toThrow('Cleaning Fee has invalid value');
    });

    it('should throw error for object cleaning fee', () => {
      expect(() => calculateFeeBreakdown({
        listing: {
          cleaning_fee: { amount: 50 },
          damage_deposit: 500
        }
      })).toThrow('Cleaning Fee has invalid value');
    });

    it('should throw error for boolean cleaning fee', () => {
      expect(() => calculateFeeBreakdown({
        listing: {
          cleaning_fee: true,
          damage_deposit: 500
        }
      })).toThrow('Cleaning Fee has invalid value');
    });
  });

  // ============================================================================
  // Precision and Rounding Tests
  // ============================================================================
  describe('precision and rounding', () => {
    it('should handle decimal cleaning fee', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 49.99,
          damage_deposit: 500
        }
      });

      expect(result.cleaningFee).toBeCloseTo(49.99, 2);
    });

    it('should handle decimal damage deposit', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 50,
          damage_deposit: 500.50
        }
      });

      expect(result.damageDeposit).toBeCloseTo(500.50, 2);
    });

    it('should handle very small decimal fees', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 0.01,
          damage_deposit: 0.01
        }
      });

      expect(result.cleaningFee).toBe(0.01);
      expect(result.damageDeposit).toBe(0.01);
    });

    it('should handle large decimal fees', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 9999.99,
          damage_deposit: 99999.99
        }
      });

      expect(result.cleaningFee).toBeCloseTo(9999.99, 2);
      expect(result.damageDeposit).toBeCloseTo(99999.99, 2);
    });

    it('should handle floating point precision issues', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 0.1 + 0.2, // 0.30000000000000004
          damage_deposit: 0
        }
      });

      expect(result.cleaningFee).toBeCloseTo(0.3, 10);
    });
  });

  // ============================================================================
  // Boundary Conditions
  // ============================================================================
  describe('boundary conditions', () => {
    it('should handle maximum realistic cleaning fee', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 500,
          damage_deposit: 0
        }
      });

      expect(result.cleaningFee).toBe(500);
    });

    it('should handle maximum realistic damage deposit', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 0,
          damage_deposit: 10000
        }
      });

      expect(result.damageDeposit).toBe(10000);
    });

    it('should handle combination of maximum fees', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 500,
          damage_deposit: 10000
        }
      });

      expect(result.cleaningFee).toBe(500);
      expect(result.damageDeposit).toBe(10000);
      expect(result.totalFees).toBe(500);
    });

    it('should handle very large fees', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 10000,
          damage_deposit: 100000
        }
      });

      expect(result.cleaningFee).toBe(10000);
      expect(result.damageDeposit).toBe(100000);
    });
  });

  // ============================================================================
  // Output Structure Verification
  // ============================================================================
  describe('output structure verification', () => {
    it('should return all expected properties', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 50,
          damage_deposit: 500
        }
      });

      expect(result).toHaveProperty('cleaningFee');
      expect(result).toHaveProperty('damageDeposit');
      expect(result).toHaveProperty('totalFees');
    });

    it('should return correct types for all properties', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 50,
          damage_deposit: 500
        }
      });

      expect(typeof result.cleaningFee).toBe('number');
      expect(typeof result.damageDeposit).toBe('number');
      expect(typeof result.totalFees).toBe('number');
    });

    it('should not return NaN for any property', () => {
      const result = calculateFeeBreakdown({
        listing: {}
      });

      expect(result.cleaningFee).not.toBeNaN();
      expect(result.damageDeposit).not.toBeNaN();
      expect(result.totalFees).not.toBeNaN();
    });
  });

  // ============================================================================
  // Input Validation
  // ============================================================================
  describe('input validation', () => {
    it('should throw error for null listing', () => {
      expect(() => calculateFeeBreakdown({
        listing: null
      })).toThrow('listing must be a valid object');
    });

    it('should throw error for undefined listing', () => {
      expect(() => calculateFeeBreakdown({
        listing: undefined
      })).toThrow('listing must be a valid object');
    });

    it('should throw error for non-object listing', () => {
      expect(() => calculateFeeBreakdown({
        listing: 'not an object'
      })).toThrow('listing must be a valid object');
    });

    it('should throw error for array listing', () => {
      expect(() => calculateFeeBreakdown({
        listing: []
      })).toThrow('listing must be a valid object');
    });

    it('should throw error for number listing', () => {
      expect(() => calculateFeeBreakdown({
        listing: 123
      })).toThrow('listing must be a valid object');
    });

    it('should ignore extra properties in listing', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 50,
          damage_deposit: 500,
          extra_prop: 'ignored',
          another_prop: 123
        }
      });

      expect(result.cleaningFee).toBe(50);
      expect(result.damageDeposit).toBe(500);
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should handle typical NYC apartment fees', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 100,
          damage_deposit: 1000
        }
      });

      expect(result.cleaningFee).toBe(100);
      expect(result.damageDeposit).toBe(1000);
    });

    it('should handle budget listing fees', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 40,
          damage_deposit: 300
        }
      });

      expect(result.cleaningFee).toBe(40);
      expect(result.damageDeposit).toBe(300);
    });

    it('should handle luxury listing fees', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 200,
          damage_deposit: 2500
        }
      });

      expect(result.cleaningFee).toBe(200);
      expect(result.damageDeposit).toBe(2500);
    });

    it('should handle no-fee listing', () => {
      const result = calculateFeeBreakdown({
        listing: {}
      });

      expect(result.totalFees).toBe(0);
    });

    it('should handle deposit-only listing', () => {
      const result = calculateFeeBreakdown({
        listing: {
          damage_deposit: 500
        }
      });

      expect(result.totalFees).toBe(0); // Deposit is refundable
    });

    it('should handle cleaning-fee-only listing', () => {
      const result = calculateFeeBreakdown({
        listing: {
          cleaning_fee: 75
        }
      });

      expect(result.totalFees).toBe(75);
    });
  });
});
