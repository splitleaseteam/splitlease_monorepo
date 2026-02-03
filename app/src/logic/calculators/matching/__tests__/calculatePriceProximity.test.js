/**
 * Tests for calculatePriceProximity
 *
 * Calculates how close a candidate listing's price is to a proposal's budget.
 * Used in matching algorithms to rank listings by price compatibility.
 *
 * @intent Verify price proximity calculations for matching
 * @covers Bug inventory: pricing calculator bugs in matching/comp calculations
 */
import { describe, it, expect } from 'vitest';
import { calculatePriceProximity } from '../calculatePriceProximity.js';

describe('calculatePriceProximity', () => {
  // ============================================================================
  // Happy Path Tests
  // ============================================================================
  describe('happy path', () => {
    it('should return 0 for exact price match', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 100,
        proposalNightlyRate: 100
      });
      expect(result).toBe(0);
    });

    it('should calculate 15% higher correctly', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 115,
        proposalNightlyRate: 100
      });
      expect(result).toBe(0.15); // |115 - 100| / 100 = 0.15
    });

    it('should calculate 15% lower correctly (absolute value)', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 85,
        proposalNightlyRate: 100
      });
      expect(result).toBe(0.15); // |85 - 100| / 100 = 0.15
    });

    it('should calculate 50% higher correctly', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 150,
        proposalNightlyRate: 100
      });
      expect(result).toBe(0.5);
    });

    it('should calculate 100% higher (double) correctly', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 200,
        proposalNightlyRate: 100
      });
      expect(result).toBe(1.0);
    });

    it('should calculate 50% lower (half) correctly', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 50,
        proposalNightlyRate: 100
      });
      expect(result).toBe(0.5);
    });

    it('should handle small price differences', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 102,
        proposalNightlyRate: 100
      });
      expect(result).toBe(0.02); // 2% difference
    });

    it('should handle very large price differences', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 500,
        proposalNightlyRate: 100
      });
      expect(result).toBe(4); // 400% difference
    });
  });

  // ============================================================================
  // Precision and Rounding
  // ============================================================================
  describe('precision and rounding', () => {
    it('should handle decimal prices', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 117.50,
        proposalNightlyRate: 100
      });
      expect(result).toBe(0.175); // 17.5% difference
    });

    it('should handle repeating decimal result', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 100,
        proposalNightlyRate: 3
      });
      expect(result).toBeCloseTo(32.33, 2); // (100-3)/3 = 32.333...
    });

    it('should handle small decimal differences', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 100.01,
        proposalNightlyRate: 100
      });
      expect(result).toBeCloseTo(0.0001, 4);
    });

    it('should maintain precision for close matches', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 100.01,
        proposalNightlyRate: 100
      });
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(0.001);
    });
  });

  // ============================================================================
  // Error Handling - proposalNightlyRate Validation
  // ============================================================================
  describe('error handling - proposalNightlyRate validation', () => {
    it('should throw error for zero proposalNightlyRate', () => {
      expect(() => calculatePriceProximity({
        candidateNightlyRate: 100,
        proposalNightlyRate: 0
      })).toThrow('proposalNightlyRate must be greater than 0');
    });

    it('should throw error for negative proposalNightlyRate', () => {
      expect(() => calculatePriceProximity({
        candidateNightlyRate: 100,
        proposalNightlyRate: -100
      })).toThrow('proposalNightlyRate must be greater than 0');
    });

    it('should throw error for null proposalNightlyRate', () => {
      expect(() => calculatePriceProximity({
        candidateNightlyRate: 100,
        proposalNightlyRate: null
      })).toThrow('proposalNightlyRate must be a valid number');
    });

    it('should throw error for undefined proposalNightlyRate', () => {
      expect(() => calculatePriceProximity({
        candidateNightlyRate: 100,
        proposalNightlyRate: undefined
      })).toThrow('proposalNightlyRate must be a valid number');
    });

    it('should throw error for NaN proposalNightlyRate', () => {
      expect(() => calculatePriceProximity({
        candidateNightlyRate: 100,
        proposalNightlyRate: NaN
      })).toThrow('proposalNightlyRate must be a valid number');
    });

    it('should throw error for string proposalNightlyRate', () => {
      expect(() => calculatePriceProximity({
        candidateNightlyRate: 100,
        proposalNightlyRate: '100'
      })).toThrow('proposalNightlyRate must be a valid number');
    });

    it('should throw error for object proposalNightlyRate', () => {
      expect(() => calculatePriceProximity({
        candidateNightlyRate: 100,
        proposalNightlyRate: {}
      })).toThrow('proposalNightlyRate must be a valid number');
    });

    it('should throw error for array proposalNightlyRate', () => {
      expect(() => calculatePriceProximity({
        candidateNightlyRate: 100,
        proposalNightlyRate: [100]
      })).toThrow('proposalNightlyRate must be a valid number');
    });

    it('should throw error for boolean proposalNightlyRate', () => {
      expect(() => calculatePriceProximity({
        candidateNightlyRate: 100,
        proposalNightlyRate: true
      })).toThrow('proposalNightlyRate must be a valid number');
    });
  });

  // ============================================================================
  // Error Handling - candidateNightlyRate Validation
  // ============================================================================
  describe('error handling - candidateNightlyRate validation', () => {
    it('should throw error for negative candidateNightlyRate', () => {
      expect(() => calculatePriceProximity({
        candidateNightlyRate: -50,
        proposalNightlyRate: 100
      })).toThrow('candidateNightlyRate cannot be negative');
    });

    it('should allow zero candidateNightlyRate', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 0,
        proposalNightlyRate: 100
      });
      expect(result).toBe(1); // 100% difference
    });

    it('should throw error for null candidateNightlyRate', () => {
      expect(() => calculatePriceProximity({
        candidateNightlyRate: null,
        proposalNightlyRate: 100
      })).toThrow('candidateNightlyRate must be a valid number');
    });

    it('should throw error for undefined candidateNightlyRate', () => {
      expect(() => calculatePriceProximity({
        candidateNightlyRate: undefined,
        proposalNightlyRate: 100
      })).toThrow('candidateNightlyRate must be a valid number');
    });

    it('should throw error for NaN candidateNightlyRate', () => {
      expect(() => calculatePriceProximity({
        candidateNightlyRate: NaN,
        proposalNightlyRate: 100
      })).toThrow('candidateNightlyRate must be a valid number');
    });

    it('should throw error for string candidateNightlyRate', () => {
      expect(() => calculatePriceProximity({
        candidateNightlyRate: '115',
        proposalNightlyRate: 100
      })).toThrow('candidateNightlyRate must be a valid number');
    });

    it('should throw error for object candidateNightlyRate', () => {
      expect(() => calculatePriceProximity({
        candidateNightlyRate: {},
        proposalNightlyRate: 100
      })).toThrow('candidateNightlyRate must be a valid number');
    });

    it('should throw error for boolean candidateNightlyRate', () => {
      expect(() => calculatePriceProximity({
        candidateNightlyRate: false,
        proposalNightlyRate: 100
      })).toThrow('candidateNightlyRate must be a valid number');
    });
  });

  // ============================================================================
  // Boundary Conditions
  // ============================================================================
  describe('boundary conditions', () => {
    it('should handle very small proposalNightlyRate', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 2,
        proposalNightlyRate: 1
      });
      expect(result).toBe(1); // 100% difference
    });

    it('should handle very large proposalNightlyRate', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 11000,
        proposalNightlyRate: 10000
      });
      expect(result).toBe(0.1); // 10% difference
    });

    it('should handle candidate rate equal to proposal', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 123.45,
        proposalNightlyRate: 123.45
      });
      expect(result).toBe(0);
    });

    it('should handle candidate rate slightly above proposal', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 100.01,
        proposalNightlyRate: 100
      });
      expect(result).toBeCloseTo(0.0001, 4);
    });

    it('should handle candidate rate slightly below proposal', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 99.99,
        proposalNightlyRate: 100
      });
      expect(result).toBeCloseTo(0.0001, 4);
    });
  });

  // ============================================================================
  // Absolute Value Behavior
  // ============================================================================
  describe('absolute value behavior', () => {
    it('should return same value for +/- same difference', () => {
      const higher = calculatePriceProximity({
        candidateNightlyRate: 120,
        proposalNightlyRate: 100
      });

      const lower = calculatePriceProximity({
        candidateNightlyRate: 80,
        proposalNightlyRate: 100
      });

      expect(higher).toBe(lower); // Both 0.2
    });

    it('should always return non-negative result', () => {
      const result1 = calculatePriceProximity({
        candidateNightlyRate: 200,
        proposalNightlyRate: 100
      });
      expect(result1).toBeGreaterThanOrEqual(0);

      const result2 = calculatePriceProximity({
        candidateNightlyRate: 50,
        proposalNightlyRate: 100
      });
      expect(result2).toBeGreaterThanOrEqual(0);
    });

    it('should handle extreme price differences', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 1000,
        proposalNightlyRate: 1
      });
      expect(result).toBe(999); // (1000-1)/1 = 999
    });
  });

  // ============================================================================
  // Input Object Validation
  // ============================================================================
  describe('input object validation', () => {
    it('should work with extra properties in params object', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 115,
        proposalNightlyRate: 100,
        extraProp: 'ignored'
      });
      expect(result).toBe(0.15);
    });

    it('should throw error for missing params object', () => {
      expect(() => calculatePriceProximity())
        .toThrow();
    });

    it('should throw error for empty params object', () => {
      expect(() => calculatePriceProximity({}))
        .toThrow();
    });

    it('should throw error for missing candidateNightlyRate', () => {
      expect(() => calculatePriceProximity({
        proposalNightlyRate: 100
      })).toThrow();
    });

    it('should throw error for missing proposalNightlyRate', () => {
      expect(() => calculatePriceProximity({
        candidateNightlyRate: 115
      })).toThrow();
    });
  });

  // ============================================================================
  // Business Logic Verification
  // ============================================================================
  describe('business logic verification', () => {
    it('should follow formula: |candidate - proposal| / proposal', () => {
      const candidate = 135;
      const proposal = 100;
      const expected = Math.abs(candidate - proposal) / proposal;

      const result = calculatePriceProximity({
        candidateNightlyRate: candidate,
        proposalNightlyRate: proposal
      });

      expect(result).toBe(expected);
    });

    it('should rank closer prices as better (lower score)', () => {
      const proposal = 100;

      const close = calculatePriceProximity({
        candidateNightlyRate: 105,
        proposalNightlyRate: proposal
      });

      const far = calculatePriceProximity({
        candidateNightlyRate: 150,
        proposalNightlyRate: proposal
      });

      expect(close).toBeLessThan(far); // 0.05 < 0.50
    });

    it('should handle exact match as best possible score', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 100,
        proposalNightlyRate: 100
      });

      expect(result).toBe(0);
      expect(result).toBeLessThan(calculatePriceProximity({
        candidateNightlyRate: 101,
        proposalNightlyRate: 100
      }));
    });

    it('should treat same percentage difference equally', () => {
      const proposal = 100;

      const tenPercentHigh = calculatePriceProximity({
        candidateNightlyRate: 110,
        proposalNightlyRate: proposal
      });

      const tenPercentLow = calculatePriceProximity({
        candidateNightlyRate: 90,
        proposalNightlyRate: proposal
      });

      expect(tenPercentHigh).toBe(tenPercentLow);
    });
  });

  // ============================================================================
  // Real-World Matching Scenarios
  // ============================================================================
  describe('real-world matching scenarios', () => {
    it('should handle proposal with $100/night budget', () => {
      const proposalBudget = 100;

      const exactMatch = calculatePriceProximity({
        candidateNightlyRate: 100,
        proposalNightlyRate: proposalBudget
      });

      const slightlyOver = calculatePriceProximity({
        candidateNightlyRate: 110,
        proposalNightlyRate: proposalBudget
      });

      const slightlyUnder = calculatePriceProximity({
        candidateNightlyRate: 90,
        proposalNightlyRate: proposalBudget
      });

      expect(exactMatch).toBe(0);
      expect(slightlyOver).toBe(0.1);
      expect(slightlyUnder).toBe(0.1);
    });

    it('should handle luxury proposal with $500/night budget', () => {
      const proposalBudget = 500;

      const closeMatch = calculatePriceProximity({
        candidateNightlyRate: 525,
        proposalNightlyRate: proposalBudget
      });

      const poorMatch = calculatePriceProximity({
        candidateNightlyRate: 750,
        proposalNightlyRate: proposalBudget
      });

      expect(closeMatch).toBe(0.05); // 5% difference
      expect(poorMatch).toBe(0.5); // 50% difference
    });

    it('should handle budget proposal with $50/night budget', () => {
      const proposalBudget = 50;

      const affordable = calculatePriceProximity({
        candidateNightlyRate: 55,
        proposalNightlyRate: proposalBudget
      });

      const expensive = calculatePriceProximity({
        candidateNightlyRate: 100,
        proposalNightlyRate: proposalBudget
      });

      expect(affordable).toBe(0.1); // 10% over
      expect(expensive).toBe(1); // 100% over (double)
    });

    it('should compare multiple candidates for ranking', () => {
      const proposalBudget = 120;

      const candidates = [
        { rate: 115 },
        { rate: 125 },
        { rate: 130 },
        { rate: 100 },
        { rate: 150 }
      ].map(c => calculatePriceProximity({
        candidateNightlyRate: c.rate,
        proposalNightlyRate: proposalBudget
      }));

      // Sorted by proximity (best to worst): 115, 125, 130, 100, 150
      expect(candidates[0]).toBeLessThan(candidates[1]); // 115 is closest
      expect(candidates[4]).toBeGreaterThan(candidates[3]); // 150 is farthest
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle proposal rate of 0.01', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 0.02,
        proposalNightlyRate: 0.01
      });
      expect(result).toBe(1); // 100% difference
    });

    it('should handle very close prices', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 100.001,
        proposalNightlyRate: 100
      });
      expect(result).toBeCloseTo(0.00001, 5);
    });

    it('should handle Infinity proposal rate', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: 100,
        proposalNightlyRate: Infinity
      });
      expect(result).toBe(0); // |100 - Infinity| / Infinity = 0
    });

    it('should handle Infinity candidate rate', () => {
      const result = calculatePriceProximity({
        candidateNightlyRate: Infinity,
        proposalNightlyRate: 100
      });
      expect(result).toBe(Infinity); // |Infinity - 100| / 100 = Infinity
    });
  });
});
