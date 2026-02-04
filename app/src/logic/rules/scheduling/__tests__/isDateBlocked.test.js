/**
 * Tests for isDateBlocked
 *
 * Check if a specific date is blocked.
 * Compares dates in YYYY-MM-DD format (ignoring time).
 */
import { describe, it, expect } from 'vitest';
import { isDateBlocked } from '../isDateBlocked.js';

describe('isDateBlocked', () => {
  // ============================================================================
  // Happy Path - Date Is Blocked
  // ============================================================================
  describe('date is blocked (returns true)', () => {
    it('should return true when date matches blocked date string', () => {
      const result = isDateBlocked({
        date: new Date('2025-12-25'),
        blockedDates: ['2025-12-25']
      });
      expect(result).toBe(true);
    });

    it('should return true when date matches one of multiple blocked dates', () => {
      const result = isDateBlocked({
        date: new Date('2025-12-26'),
        blockedDates: ['2025-12-25', '2025-12-26', '2025-12-27']
      });
      expect(result).toBe(true);
    });

    it('should return true when date matches blocked Date object', () => {
      const result = isDateBlocked({
        date: new Date('2025-12-25'),
        blockedDates: [new Date('2025-12-25')]
      });
      expect(result).toBe(true);
    });

    it('should return true with mixed string and Date blocked dates', () => {
      const result = isDateBlocked({
        date: new Date('2025-12-26'),
        blockedDates: ['2025-12-25', new Date('2025-12-26'), '2025-12-27']
      });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Happy Path - Date Is Not Blocked
  // ============================================================================
  describe('date is not blocked (returns false)', () => {
    it('should return false when date does not match any blocked date', () => {
      const result = isDateBlocked({
        date: new Date('2025-12-24'),
        blockedDates: ['2025-12-25', '2025-12-26']
      });
      expect(result).toBe(false);
    });

    it('should return false for empty blockedDates array', () => {
      const result = isDateBlocked({
        date: new Date('2025-12-25'),
        blockedDates: []
      });
      expect(result).toBe(false);
    });

    it('should return false when date is one day before blocked', () => {
      const result = isDateBlocked({
        date: new Date('2025-12-24'),
        blockedDates: ['2025-12-25']
      });
      expect(result).toBe(false);
    });

    it('should return false when date is one day after blocked', () => {
      const result = isDateBlocked({
        date: new Date('2025-12-26'),
        blockedDates: ['2025-12-25']
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Time Component Handling
  // ============================================================================
  describe('time component handling', () => {
    it('should ignore time when checking date (date matches)', () => {
      const result = isDateBlocked({
        date: new Date('2025-12-25T14:30:00Z'),
        blockedDates: ['2025-12-25']
      });
      expect(result).toBe(true);
    });

    it('should ignore time in blocked dates (ISO format)', () => {
      const result = isDateBlocked({
        date: new Date('2025-12-25'),
        blockedDates: ['2025-12-25T00:00:00.000Z']
      });
      expect(result).toBe(true);
    });

    it('should match dates regardless of timezone', () => {
      const result = isDateBlocked({
        date: new Date('2025-12-25T23:59:59Z'),
        blockedDates: ['2025-12-25T00:00:00Z']
      });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Invalid Entries in blockedDates
  // ============================================================================
  describe('invalid entries in blockedDates (skipped silently)', () => {
    it('should skip null entries in blockedDates', () => {
      const result = isDateBlocked({
        date: new Date('2025-12-25'),
        blockedDates: [null, '2025-12-25']
      });
      expect(result).toBe(true);
    });

    it('should skip undefined entries in blockedDates', () => {
      const result = isDateBlocked({
        date: new Date('2025-12-25'),
        blockedDates: [undefined, '2025-12-25']
      });
      expect(result).toBe(true);
    });

    it('should skip number entries in blockedDates', () => {
      const result = isDateBlocked({
        date: new Date('2025-12-25'),
        blockedDates: [123, '2025-12-25']
      });
      expect(result).toBe(true);
    });

    it('should return false when only invalid entries exist', () => {
      const result = isDateBlocked({
        date: new Date('2025-12-25'),
        blockedDates: [null, undefined, 123, {}]
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Error Handling - Invalid date Parameter
  // ============================================================================
  describe('error handling - invalid date parameter', () => {
    it('should throw error for null date', () => {
      expect(() => isDateBlocked({
        date: null,
        blockedDates: ['2025-12-25']
      })).toThrow('date must be a valid Date object');
    });

    it('should throw error for undefined date', () => {
      expect(() => isDateBlocked({
        date: undefined,
        blockedDates: ['2025-12-25']
      })).toThrow('date must be a valid Date object');
    });

    it('should throw error for string date', () => {
      expect(() => isDateBlocked({
        date: '2025-12-25',
        blockedDates: ['2025-12-25']
      })).toThrow('date must be a valid Date object');
    });

    it('should throw error for invalid Date object', () => {
      expect(() => isDateBlocked({
        date: new Date('invalid'),
        blockedDates: ['2025-12-25']
      })).toThrow('date must be a valid Date object');
    });

    it('should throw error for number date', () => {
      expect(() => isDateBlocked({
        date: 1735084800000,
        blockedDates: ['2025-12-25']
      })).toThrow('date must be a valid Date object');
    });
  });

  // ============================================================================
  // Error Handling - Invalid blockedDates Parameter
  // ============================================================================
  describe('error handling - invalid blockedDates parameter', () => {
    it('should throw error for null blockedDates', () => {
      expect(() => isDateBlocked({
        date: new Date('2025-12-25'),
        blockedDates: null
      })).toThrow('blockedDates must be an array');
    });

    it('should throw error for undefined blockedDates', () => {
      expect(() => isDateBlocked({
        date: new Date('2025-12-25'),
        blockedDates: undefined
      })).toThrow('blockedDates must be an array');
    });

    it('should throw error for string blockedDates', () => {
      expect(() => isDateBlocked({
        date: new Date('2025-12-25'),
        blockedDates: '2025-12-25'
      })).toThrow('blockedDates must be an array');
    });

    it('should throw error for object blockedDates', () => {
      expect(() => isDateBlocked({
        date: new Date('2025-12-25'),
        blockedDates: { '0': '2025-12-25' }
      })).toThrow('blockedDates must be an array');
    });

    it('should throw error for missing params object', () => {
      expect(() => isDateBlocked()).toThrow();
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should check holiday availability', () => {
      const holidays = [
        '2025-12-25', // Christmas
        '2025-12-31', // New Year Eve
        '2026-01-01'  // New Year Day
      ];

      expect(isDateBlocked({
        date: new Date('2025-12-25'),
        blockedDates: holidays
      })).toBe(true);

      expect(isDateBlocked({
        date: new Date('2025-12-26'),
        blockedDates: holidays
      })).toBe(false);
    });

    it('should handle maintenance block dates', () => {
      const maintenanceDates = [
        new Date('2025-12-15'),
        new Date('2025-12-16'),
        new Date('2025-12-17')
      ];

      expect(isDateBlocked({
        date: new Date('2025-12-16'),
        blockedDates: maintenanceDates
      })).toBe(true);
    });

    it('should check if proposed move-in date is blocked', () => {
      const listingBlockedDates = ['2025-12-01', '2025-12-08', '2025-12-15'];
      const proposedMoveIn = new Date('2025-12-08');

      const result = isDateBlocked({
        date: proposedMoveIn,
        blockedDates: listingBlockedDates
      });
      expect(result).toBe(true);
    });
  });
});
