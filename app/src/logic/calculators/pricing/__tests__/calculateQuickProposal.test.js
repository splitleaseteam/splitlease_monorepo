/**
 * Tests for calculateQuickProposal
 *
 * Calculates pricing breakdown for quick proposal creation.
 * Includes: fourWeeksRent, totalPrice, initialPayment, totalNights, etc.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateQuickProposal,
  formatDayPattern,
  dayLabelToIndex,
  indexToDayLabel,
  getAllDayIndices
} from '../calculateQuickProposal.js';

describe('calculateQuickProposal', () => {
  // ============================================================================
  // Happy Path Tests
  // ============================================================================
  describe('happy path', () => {
    it('should calculate pricing for typical 4-night weekly stay', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 100,
        selectedDayIndices: [1, 2, 3, 4], // Mon-Thu
        reservationWeeks: 13
      });

      expect(result.nightlyPrice).toBe(100);
      expect(result.daysPerWeek).toBe(4);
      expect(result.fourWeeksRent).toBe(1600); // 100 * 4 * 4
      expect(result.actualWeeks).toBe(13);
      expect(result.totalPrice).toBe(5200); // 100 * 4 * 13
      expect(result.initialPayment).toBe(1600);
      expect(result.totalNights).toBe(52); // 4 * 13
    });

    it('should calculate pricing for full week stay', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 80,
        selectedDayIndices: [0, 1, 2, 3, 4, 5, 6], // All days
        reservationWeeks: 26
      });

      expect(result.nightlyPrice).toBe(80);
      expect(result.daysPerWeek).toBe(7);
      expect(result.fourWeeksRent).toBe(2240); // 80 * 7 * 4
      expect(result.actualWeeks).toBe(26);
      expect(result.totalPrice).toBe(14560); // 80 * 7 * 26
      expect(result.initialPayment).toBe(2240);
      expect(result.totalNights).toBe(182); // 7 * 26
    });

    it('should calculate pricing for weekend-only stay', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 150,
        selectedDayIndices: [5, 6], // Fri-Sat
        reservationWeeks: 8
      });

      expect(result.nightlyPrice).toBe(150);
      expect(result.daysPerWeek).toBe(2);
      expect(result.fourWeeksRent).toBe(1200); // 150 * 2 * 4
      expect(result.actualWeeks).toBe(8);
      expect(result.totalPrice).toBe(2400); // 150 * 2 * 8
      expect(result.totalNights).toBe(16); // 2 * 8
    });

    it('should calculate pricing for midweek stay', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 120,
        selectedDayIndices: [2, 3, 4], // Tue-Thu
        reservationWeeks: 52
      });

      expect(result.daysPerWeek).toBe(3);
      expect(result.fourWeeksRent).toBe(1440); // 120 * 3 * 4
      expect(result.totalPrice).toBe(18720); // 120 * 3 * 52
      expect(result.totalNights).toBe(156); // 3 * 52
    });
  });

  // ============================================================================
  // Edge Cases - Invalid Inputs Return Default Object
  // ============================================================================
  describe('edge cases - invalid inputs', () => {
    it('should return zero values for negative nightlyPrice', () => {
      const result = calculateQuickProposal({
        nightlyPrice: -100,
        selectedDayIndices: [1, 2, 3, 4],
        reservationWeeks: 13
      });

      expect(result.fourWeeksRent).toBe(0);
      expect(result.totalPrice).toBe(0);
      expect(result.nightlyPrice).toBe(0);
      expect(result.daysPerWeek).toBe(0);
    });

    it('should return zero values for non-number nightlyPrice', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 'invalid',
        selectedDayIndices: [1, 2, 3, 4],
        reservationWeeks: 13
      });

      expect(result.fourWeeksRent).toBe(0);
      expect(result.totalPrice).toBe(0);
    });

    it('should return zero values for null nightlyPrice', () => {
      const result = calculateQuickProposal({
        nightlyPrice: null,
        selectedDayIndices: [1, 2, 3, 4],
        reservationWeeks: 13
      });

      expect(result.fourWeeksRent).toBe(0);
      expect(result.totalPrice).toBe(0);
    });

    it('should handle empty selectedDayIndices array', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 100,
        selectedDayIndices: [],
        reservationWeeks: 13
      });

      expect(result.fourWeeksRent).toBe(0);
      expect(result.totalPrice).toBe(0);
      expect(result.nightlyPrice).toBe(100);
      expect(result.daysPerWeek).toBe(0);
      expect(result.actualWeeks).toBe(13);
    });

    it('should handle null selectedDayIndices', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 100,
        selectedDayIndices: null,
        reservationWeeks: 13
      });

      expect(result.fourWeeksRent).toBe(0);
      expect(result.totalPrice).toBe(0);
    });

    it('should handle undefined selectedDayIndices', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 100,
        selectedDayIndices: undefined,
        reservationWeeks: 13
      });

      expect(result.fourWeeksRent).toBe(0);
      expect(result.totalPrice).toBe(0);
    });

    it('should handle zero reservationWeeks', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 100,
        selectedDayIndices: [1, 2, 3, 4],
        reservationWeeks: 0
      });

      expect(result.fourWeeksRent).toBe(1600);
      expect(result.totalPrice).toBe(0);
      expect(result.actualWeeks).toBe(0);
      expect(result.totalNights).toBe(0);
    });

    it('should handle undefined reservationWeeks', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 100,
        selectedDayIndices: [1, 2, 3, 4],
        reservationWeeks: undefined
      });

      expect(result.actualWeeks).toBe(0);
      expect(result.totalPrice).toBe(0);
    });
  });

  // ============================================================================
  // Boundary Conditions
  // ============================================================================
  describe('boundary conditions', () => {
    it('should handle single day selection', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 100,
        selectedDayIndices: [3], // Wednesday only
        reservationWeeks: 10
      });

      expect(result.daysPerWeek).toBe(1);
      expect(result.fourWeeksRent).toBe(400); // 100 * 1 * 4
      expect(result.totalPrice).toBe(1000); // 100 * 1 * 10
      expect(result.totalNights).toBe(10);
    });

    it('should handle very small nightlyPrice', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 0.01,
        selectedDayIndices: [1, 2, 3, 4],
        reservationWeeks: 4
      });

      expect(result.fourWeeksRent).toBeCloseTo(0.16, 2);
      expect(result.totalPrice).toBeCloseTo(0.16, 2);
    });

    it('should handle very large nightlyPrice', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 10000,
        selectedDayIndices: [0, 1, 2, 3, 4, 5, 6],
        reservationWeeks: 52
      });

      expect(result.fourWeeksRent).toBe(280000);
      expect(result.totalPrice).toBe(3640000);
    });

    it('should handle zero nightlyPrice', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 0,
        selectedDayIndices: [1, 2, 3, 4],
        reservationWeeks: 13
      });

      expect(result.fourWeeksRent).toBe(0);
      expect(result.totalPrice).toBe(0);
      expect(result.nightlyPrice).toBe(0);
    });

    it('should handle very long reservation (100 weeks)', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 100,
        selectedDayIndices: [1, 2, 3, 4],
        reservationWeeks: 100
      });

      expect(result.totalPrice).toBe(40000); // 100 * 4 * 100
      expect(result.totalNights).toBe(400);
    });

    it('should handle minimum 1 week reservation', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 100,
        selectedDayIndices: [1, 2, 3, 4],
        reservationWeeks: 1
      });

      expect(result.totalPrice).toBe(400);
      expect(result.totalNights).toBe(4);
    });
  });

  // ============================================================================
  // Day Index Coverage
  // ============================================================================
  describe('day index coverage', () => {
    it('should handle Sunday (0)', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 100,
        selectedDayIndices: [0],
        reservationWeeks: 4
      });
      expect(result.daysPerWeek).toBe(1);
      expect(result.totalNights).toBe(4);
    });

    it('should handle Saturday (6)', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 100,
        selectedDayIndices: [6],
        reservationWeeks: 4
      });
      expect(result.daysPerWeek).toBe(1);
      expect(result.totalNights).toBe(4);
    });

    it('should handle wrap-around selection (Fri-Sun)', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 100,
        selectedDayIndices: [5, 6, 0], // Fri, Sat, Sun
        reservationWeeks: 4
      });
      expect(result.daysPerWeek).toBe(3);
      expect(result.totalNights).toBe(12);
    });

    it('should handle non-contiguous days', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 100,
        selectedDayIndices: [1, 3, 5], // Mon, Wed, Fri
        reservationWeeks: 4
      });
      expect(result.daysPerWeek).toBe(3);
      expect(result.totalNights).toBe(12);
    });
  });

  // ============================================================================
  // Output Structure Verification
  // ============================================================================
  describe('output structure verification', () => {
    it('should return all expected properties', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 100,
        selectedDayIndices: [1, 2, 3, 4],
        reservationWeeks: 13
      });

      expect(result).toHaveProperty('fourWeeksRent');
      expect(result).toHaveProperty('actualWeeks');
      expect(result).toHaveProperty('totalPrice');
      expect(result).toHaveProperty('initialPayment');
      expect(result).toHaveProperty('nightlyPrice');
      expect(result).toHaveProperty('daysPerWeek');
      expect(result).toHaveProperty('totalNights');
    });

    it('should return numeric types for all properties', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 100,
        selectedDayIndices: [1, 2, 3, 4],
        reservationWeeks: 13
      });

      expect(typeof result.fourWeeksRent).toBe('number');
      expect(typeof result.actualWeeks).toBe('number');
      expect(typeof result.totalPrice).toBe('number');
      expect(typeof result.initialPayment).toBe('number');
      expect(typeof result.nightlyPrice).toBe('number');
      expect(typeof result.daysPerWeek).toBe('number');
      expect(typeof result.totalNights).toBe('number');
    });

    it('should have initialPayment equal to fourWeeksRent', () => {
      const result = calculateQuickProposal({
        nightlyPrice: 100,
        selectedDayIndices: [1, 2, 3, 4],
        reservationWeeks: 13
      });

      expect(result.initialPayment).toBe(result.fourWeeksRent);
    });
  });
});

// ============================================================================
// formatDayPattern Tests
// ============================================================================
describe('formatDayPattern', () => {
  describe('happy path', () => {
    it('should format full week as SMTWTFS', () => {
      const result = formatDayPattern([0, 1, 2, 3, 4, 5, 6]);
      expect(result).toBe('SMTWTFS');
    });

    it('should format weekdays as -MTWTF-', () => {
      const result = formatDayPattern([1, 2, 3, 4, 5]);
      expect(result).toBe('-MTWTF-');
    });

    it('should format weekend as S-----S', () => {
      const result = formatDayPattern([0, 6]);
      expect(result).toBe('S-----S');
    });

    it('should format Mon-Thu as -MTWT--', () => {
      const result = formatDayPattern([1, 2, 3, 4]);
      expect(result).toBe('-MTWT--');
    });

    it('should format single day (Wednesday)', () => {
      const result = formatDayPattern([3]);
      expect(result).toBe('---W---');
    });
  });

  describe('edge cases', () => {
    it('should handle empty array', () => {
      const result = formatDayPattern([]);
      expect(result).toBe('-------');
    });

    it('should handle single Sunday', () => {
      const result = formatDayPattern([0]);
      expect(result).toBe('S------');
    });

    it('should handle single Saturday', () => {
      const result = formatDayPattern([6]);
      expect(result).toBe('------S');
    });

    it('should handle out-of-order indices', () => {
      const result = formatDayPattern([5, 1, 3]);
      expect(result).toBe('-M-W-F-');
    });

    it('should handle duplicate indices', () => {
      const result = formatDayPattern([1, 1, 2, 2]);
      expect(result).toBe('-MT----');
    });
  });
});

// ============================================================================
// dayLabelToIndex Tests
// ============================================================================
describe('dayLabelToIndex', () => {
  describe('happy path', () => {
    it('should return 0 for S (Sunday)', () => {
      expect(dayLabelToIndex('S')).toBe(0);
    });

    it('should return 1 for M (Monday)', () => {
      expect(dayLabelToIndex('M')).toBe(1);
    });

    it('should return 2 for T (Tuesday)', () => {
      expect(dayLabelToIndex('T')).toBe(2);
    });

    it('should return 3 for W (Wednesday)', () => {
      expect(dayLabelToIndex('W')).toBe(3);
    });

    it('should return 4 for Th (Thursday)', () => {
      expect(dayLabelToIndex('Th')).toBe(4);
    });

    it('should return 5 for F (Friday)', () => {
      expect(dayLabelToIndex('F')).toBe(5);
    });

    it('should return 6 for Sa (Saturday)', () => {
      expect(dayLabelToIndex('Sa')).toBe(6);
    });
  });

  describe('edge cases', () => {
    it('should return -1 for invalid label', () => {
      expect(dayLabelToIndex('X')).toBe(-1);
    });

    it('should return -1 for empty string', () => {
      expect(dayLabelToIndex('')).toBe(-1);
    });

    it('should return -1 for lowercase', () => {
      expect(dayLabelToIndex('m')).toBe(-1);
    });

    it('should return -1 for null', () => {
      expect(dayLabelToIndex(null)).toBe(-1);
    });

    it('should return -1 for undefined', () => {
      expect(dayLabelToIndex(undefined)).toBe(-1);
    });
  });
});

// ============================================================================
// indexToDayLabel Tests
// ============================================================================
describe('indexToDayLabel', () => {
  describe('happy path', () => {
    it('should return S for 0 (Sunday)', () => {
      expect(indexToDayLabel(0)).toBe('S');
    });

    it('should return M for 1 (Monday)', () => {
      expect(indexToDayLabel(1)).toBe('M');
    });

    it('should return T for 2 (Tuesday)', () => {
      expect(indexToDayLabel(2)).toBe('T');
    });

    it('should return W for 3 (Wednesday)', () => {
      expect(indexToDayLabel(3)).toBe('W');
    });

    it('should return Th for 4 (Thursday)', () => {
      expect(indexToDayLabel(4)).toBe('Th');
    });

    it('should return F for 5 (Friday)', () => {
      expect(indexToDayLabel(5)).toBe('F');
    });

    it('should return Sa for 6 (Saturday)', () => {
      expect(indexToDayLabel(6)).toBe('Sa');
    });
  });

  describe('edge cases', () => {
    it('should return ? for invalid index (-1)', () => {
      expect(indexToDayLabel(-1)).toBe('?');
    });

    it('should return ? for invalid index (7)', () => {
      expect(indexToDayLabel(7)).toBe('?');
    });

    it('should return ? for null', () => {
      expect(indexToDayLabel(null)).toBe('?');
    });

    it('should return ? for undefined', () => {
      expect(indexToDayLabel(undefined)).toBe('?');
    });
  });
});

// ============================================================================
// getAllDayIndices Tests
// ============================================================================
describe('getAllDayIndices', () => {
  it('should return array of all day indices [0-6]', () => {
    const result = getAllDayIndices();
    expect(result).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('should return array of length 7', () => {
    const result = getAllDayIndices();
    expect(result).toHaveLength(7);
  });

  it('should return new array on each call', () => {
    const result1 = getAllDayIndices();
    const result2 = getAllDayIndices();
    expect(result1).not.toBe(result2);
    expect(result1).toEqual(result2);
  });
});
