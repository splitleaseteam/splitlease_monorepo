/**
 * Tests for calculateHostScore
 *
 * Calculates host verification score for matching algorithm.
 * Score based on number of verifications (LinkedIn, Phone, User Verified).
 * 3 verifications = 5 points, 2 = 3 points, 1 = 1 point, 0 = 0 points.
 */
import { describe, it, expect } from 'vitest';
import { calculateHostScore } from '../calculateHostScore.js';

describe('calculateHostScore', () => {
  // ============================================================================
  // Full Verification (3 verifications = 5 points)
  // ============================================================================
  describe('3 verifications (5 points)', () => {
    it('should return 5 for host with all 3 verifications (Bubble field names)', () => {
      const result = calculateHostScore({
        hostData: {
          'Verify - Linked In ID': true,
          'Verify - Phone': true,
          'user verified?': true
        }
      });
      expect(result).toBe(5);
    });

    it('should return 5 for host with all 3 verifications (alternative field names)', () => {
      const result = calculateHostScore({
        hostData: {
          linkedInVerified: true,
          phoneVerified: true,
          userVerified: true
        }
      });
      expect(result).toBe(5);
    });

    it('should return 5 for host with mixed field name formats', () => {
      const result = calculateHostScore({
        hostData: {
          'Verify - Linked In ID': true,
          phoneVerified: true,
          'user verified?': true
        }
      });
      expect(result).toBe(5);
    });
  });

  // ============================================================================
  // Two Verifications (2 verifications = 3 points)
  // ============================================================================
  describe('2 verifications (3 points)', () => {
    it('should return 3 for LinkedIn and Phone verified', () => {
      const result = calculateHostScore({
        hostData: {
          'Verify - Linked In ID': true,
          'Verify - Phone': true,
          'user verified?': false
        }
      });
      expect(result).toBe(3);
    });

    it('should return 3 for LinkedIn and User verified', () => {
      const result = calculateHostScore({
        hostData: {
          'Verify - Linked In ID': true,
          'Verify - Phone': false,
          'user verified?': true
        }
      });
      expect(result).toBe(3);
    });

    it('should return 3 for Phone and User verified', () => {
      const result = calculateHostScore({
        hostData: {
          'Verify - Linked In ID': false,
          'Verify - Phone': true,
          'user verified?': true
        }
      });
      expect(result).toBe(3);
    });
  });

  // ============================================================================
  // One Verification (1 verification = 1 point)
  // ============================================================================
  describe('1 verification (1 point)', () => {
    it('should return 1 for only LinkedIn verified', () => {
      const result = calculateHostScore({
        hostData: {
          'Verify - Linked In ID': true,
          'Verify - Phone': false,
          'user verified?': false
        }
      });
      expect(result).toBe(1);
    });

    it('should return 1 for only Phone verified', () => {
      const result = calculateHostScore({
        hostData: {
          'Verify - Linked In ID': false,
          'Verify - Phone': true,
          'user verified?': false
        }
      });
      expect(result).toBe(1);
    });

    it('should return 1 for only User verified', () => {
      const result = calculateHostScore({
        hostData: {
          'Verify - Linked In ID': false,
          'Verify - Phone': false,
          'user verified?': true
        }
      });
      expect(result).toBe(1);
    });
  });

  // ============================================================================
  // No Verifications (0 verifications = 0 points)
  // ============================================================================
  describe('0 verifications (0 points)', () => {
    it('should return 0 when all verifications are false', () => {
      const result = calculateHostScore({
        hostData: {
          'Verify - Linked In ID': false,
          'Verify - Phone': false,
          'user verified?': false
        }
      });
      expect(result).toBe(0);
    });

    it('should return 0 when verification fields are missing', () => {
      const result = calculateHostScore({
        hostData: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      });
      expect(result).toBe(0);
    });

    it('should return 0 when hostData is empty object', () => {
      const result = calculateHostScore({ hostData: {} });
      expect(result).toBe(0);
    });
  });

  // ============================================================================
  // Null/Undefined hostData
  // ============================================================================
  describe('null/undefined hostData', () => {
    it('should return 0 for null hostData', () => {
      const result = calculateHostScore({ hostData: null });
      expect(result).toBe(0);
    });

    it('should return 0 for undefined hostData', () => {
      const result = calculateHostScore({ hostData: undefined });
      expect(result).toBe(0);
    });
  });

  // ============================================================================
  // Truthy/Falsy Values
  // ============================================================================
  describe('truthy/falsy value handling', () => {
    it('should treat null verification values as false', () => {
      const result = calculateHostScore({
        hostData: {
          'Verify - Linked In ID': null,
          'Verify - Phone': true,
          'user verified?': null
        }
      });
      expect(result).toBe(1);
    });

    it('should treat undefined verification values as false', () => {
      const result = calculateHostScore({
        hostData: {
          'Verify - Linked In ID': undefined,
          'Verify - Phone': true,
          'user verified?': undefined
        }
      });
      expect(result).toBe(1);
    });

    it('should treat 0 as false', () => {
      const result = calculateHostScore({
        hostData: {
          'Verify - Linked In ID': 0,
          'Verify - Phone': 0,
          'user verified?': 0
        }
      });
      expect(result).toBe(0);
    });

    it('should treat empty string as false', () => {
      const result = calculateHostScore({
        hostData: {
          'Verify - Linked In ID': '',
          'Verify - Phone': '',
          'user verified?': ''
        }
      });
      expect(result).toBe(0);
    });

    it('should treat 1 as true', () => {
      const result = calculateHostScore({
        hostData: {
          'Verify - Linked In ID': 1,
          'Verify - Phone': 1,
          'user verified?': 1
        }
      });
      expect(result).toBe(5);
    });

    it('should treat non-empty string as true', () => {
      const result = calculateHostScore({
        hostData: {
          'Verify - Linked In ID': 'yes',
          'Verify - Phone': 'true',
          'user verified?': 'verified'
        }
      });
      expect(result).toBe(5);
    });
  });

  // ============================================================================
  // Alternative Field Names
  // ============================================================================
  describe('alternative field name support', () => {
    it('should check both Bubble and alternative field names', () => {
      // Bubble field names take precedence if both exist
      const result = calculateHostScore({
        hostData: {
          'Verify - Linked In ID': true,
          linkedInVerified: false, // Should be ignored since Bubble field is present
          'Verify - Phone': false,
          phoneVerified: true, // Should be used since Bubble field is false
          'user verified?': true,
          userVerified: false // Should be ignored since Bubble field is present
        }
      });
      // LinkedIn: true (from Bubble), Phone: false||true = true, User: true
      expect(result).toBe(5);
    });

    it('should use alternative names when Bubble names missing', () => {
      const result = calculateHostScore({
        hostData: {
          linkedInVerified: true,
          phoneVerified: true,
          userVerified: true
        }
      });
      expect(result).toBe(5);
    });
  });

  // ============================================================================
  // Score Range Validation
  // ============================================================================
  describe('score range validation', () => {
    it('should always return a score between 0 and 5', () => {
      const testCases = [
        { data: null, expected: 0 },
        { data: {}, expected: 0 },
        { data: { 'Verify - Phone': true }, expected: 1 },
        { data: { 'Verify - Phone': true, 'user verified?': true }, expected: 3 },
        { data: { 'Verify - Linked In ID': true, 'Verify - Phone': true, 'user verified?': true }, expected: 5 }
      ];

      for (const { data, expected } of testCases) {
        const result = calculateHostScore({ hostData: data });
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(5);
        expect(result).toBe(expected);
      }
    });
  });

  // ============================================================================
  // Input Object Validation
  // ============================================================================
  describe('input object validation', () => {
    it('should throw error for missing params object', () => {
      expect(() => calculateHostScore()).toThrow();
    });

    it('should handle empty params object', () => {
      const result = calculateHostScore({});
      expect(result).toBe(0);
    });

    it('should handle extra properties in hostData', () => {
      const result = calculateHostScore({
        hostData: {
          'Verify - Linked In ID': true,
          'Verify - Phone': true,
          'user verified?': true,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        }
      });
      expect(result).toBe(5);
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should score new host with basic verification', () => {
      const newHost = {
        firstName: 'Jane',
        lastName: 'Smith',
        'Verify - Phone': true,
        'Verify - Linked In ID': false,
        'user verified?': false
      };
      expect(calculateHostScore({ hostData: newHost })).toBe(1);
    });

    it('should score established host with full verification', () => {
      const establishedHost = {
        firstName: 'John',
        lastName: 'Doe',
        'Verify - Phone': true,
        'Verify - Linked In ID': true,
        'user verified?': true,
        listingCount: 5,
        hostingSince: '2020-01-01'
      };
      expect(calculateHostScore({ hostData: establishedHost })).toBe(5);
    });

    it('should score host from Supabase with alternative field names', () => {
      const supabaseHost = {
        first_name: 'Alice',
        last_name: 'Johnson',
        phoneVerified: true,
        linkedInVerified: true,
        userVerified: false
      };
      expect(calculateHostScore({ hostData: supabaseHost })).toBe(3);
    });
  });
});
