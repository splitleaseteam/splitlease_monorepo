/**
 * Tests for shouldShowFullName
 *
 * Determines if the full user name (first + last) should be displayed.
 * Business rule: Show full name only if lastName exists and viewport is not mobile.
 */
import { describe, it, expect } from 'vitest';
import { shouldShowFullName } from '../shouldShowFullName.js';

describe('shouldShowFullName', () => {
  // ============================================================================
  // Returns True - Full Name Should Be Shown
  // ============================================================================
  describe('returns true when full name should be shown', () => {
    it('should return true when has lastName and not mobile', () => {
      const result = shouldShowFullName({
        firstName: 'John',
        lastName: 'Doe',
        isMobile: false
      });
      expect(result).toBe(true);
    });

    it('should return true with multi-word lastName and not mobile', () => {
      const result = shouldShowFullName({
        firstName: 'Maria',
        lastName: 'De La Cruz',
        isMobile: false
      });
      expect(result).toBe(true);
    });

    it('should return true with hyphenated lastName', () => {
      const result = shouldShowFullName({
        firstName: 'Jane',
        lastName: 'Smith-Jones',
        isMobile: false
      });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Returns False - Mobile Viewport
  // ============================================================================
  describe('returns false on mobile viewport', () => {
    it('should return false on mobile even with valid lastName', () => {
      const result = shouldShowFullName({
        firstName: 'John',
        lastName: 'Doe',
        isMobile: true
      });
      expect(result).toBe(false);
    });

    it('should return false on mobile with long lastName', () => {
      const result = shouldShowFullName({
        firstName: 'Alexander',
        lastName: 'MacMahon-Fitzgerald',
        isMobile: true
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Returns False - Missing or Invalid LastName
  // ============================================================================
  describe('returns false when lastName is missing or invalid', () => {
    it('should return false when lastName is null', () => {
      const result = shouldShowFullName({
        firstName: 'John',
        lastName: null,
        isMobile: false
      });
      expect(result).toBe(false);
    });

    it('should return false when lastName is undefined', () => {
      const result = shouldShowFullName({
        firstName: 'John',
        lastName: undefined,
        isMobile: false
      });
      expect(result).toBe(false);
    });

    it('should return false when lastName is empty string', () => {
      const result = shouldShowFullName({
        firstName: 'John',
        lastName: '',
        isMobile: false
      });
      expect(result).toBe(false);
    });

    it('should return false when lastName is whitespace only', () => {
      const result = shouldShowFullName({
        firstName: 'John',
        lastName: '   ',
        isMobile: false
      });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Error Handling - Invalid FirstName
  // ============================================================================
  describe('error handling - invalid firstName', () => {
    it('should throw error for null firstName', () => {
      expect(() => shouldShowFullName({
        firstName: null,
        lastName: 'Doe',
        isMobile: false
      })).toThrow('shouldShowFullName requires a valid firstName');
    });

    it('should throw error for undefined firstName', () => {
      expect(() => shouldShowFullName({
        firstName: undefined,
        lastName: 'Doe',
        isMobile: false
      })).toThrow('shouldShowFullName requires a valid firstName');
    });

    it('should throw error for empty string firstName', () => {
      expect(() => shouldShowFullName({
        firstName: '',
        lastName: 'Doe',
        isMobile: false
      })).toThrow('shouldShowFullName requires a valid firstName');
    });

    it('should throw error for whitespace-only firstName', () => {
      expect(() => shouldShowFullName({
        firstName: '   ',
        lastName: 'Doe',
        isMobile: false
      })).toThrow('shouldShowFullName requires a valid firstName');
    });

    it('should throw error for non-string firstName', () => {
      expect(() => shouldShowFullName({
        firstName: 123,
        lastName: 'Doe',
        isMobile: false
      })).toThrow('shouldShowFullName requires a valid firstName');
    });
  });

  // ============================================================================
  // Error Handling - Invalid isMobile
  // ============================================================================
  describe('error handling - invalid isMobile', () => {
    it('should throw error for undefined isMobile', () => {
      expect(() => shouldShowFullName({
        firstName: 'John',
        lastName: 'Doe',
        isMobile: undefined
      })).toThrow('shouldShowFullName requires isMobile to be a boolean');
    });

    it('should throw error for null isMobile', () => {
      expect(() => shouldShowFullName({
        firstName: 'John',
        lastName: 'Doe',
        isMobile: null
      })).toThrow('shouldShowFullName requires isMobile to be a boolean');
    });

    it('should throw error for string isMobile', () => {
      expect(() => shouldShowFullName({
        firstName: 'John',
        lastName: 'Doe',
        isMobile: 'false'
      })).toThrow('shouldShowFullName requires isMobile to be a boolean');
    });

    it('should throw error for number isMobile (truthy)', () => {
      expect(() => shouldShowFullName({
        firstName: 'John',
        lastName: 'Doe',
        isMobile: 1
      })).toThrow('shouldShowFullName requires isMobile to be a boolean');
    });

    it('should throw error for number isMobile (falsy)', () => {
      expect(() => shouldShowFullName({
        firstName: 'John',
        lastName: 'Doe',
        isMobile: 0
      })).toThrow('shouldShowFullName requires isMobile to be a boolean');
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle firstName with leading/trailing whitespace', () => {
      const result = shouldShowFullName({
        firstName: '  John  ',
        lastName: 'Doe',
        isMobile: false
      });
      expect(result).toBe(true);
    });

    it('should handle lastName with leading/trailing whitespace', () => {
      const result = shouldShowFullName({
        firstName: 'John',
        lastName: '  Doe  ',
        isMobile: false
      });
      expect(result).toBe(true);
    });

    it('should handle single character lastName', () => {
      const result = shouldShowFullName({
        firstName: 'John',
        lastName: 'D',
        isMobile: false
      });
      expect(result).toBe(true);
    });

    it('should handle single character firstName', () => {
      const result = shouldShowFullName({
        firstName: 'J',
        lastName: 'Doe',
        isMobile: false
      });
      expect(result).toBe(true);
    });

    it('should throw error for missing params object', () => {
      expect(() => shouldShowFullName()).toThrow();
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should show full name on desktop for guest profile display', () => {
      const user = { firstName: 'Sarah', lastName: 'Johnson' };
      const isMobile = false;

      const result = shouldShowFullName({
        firstName: user.firstName,
        lastName: user.lastName,
        isMobile
      });

      expect(result).toBe(true);
    });

    it('should show first name only on mobile for space conservation', () => {
      const user = { firstName: 'Sarah', lastName: 'Johnson' };
      const isMobile = true;

      const result = shouldShowFullName({
        firstName: user.firstName,
        lastName: user.lastName,
        isMobile
      });

      expect(result).toBe(false);
    });

    it('should handle user without lastName on desktop', () => {
      const user = { firstName: 'Sarah', lastName: null };
      const isMobile = false;

      const result = shouldShowFullName({
        firstName: user.firstName,
        lastName: user.lastName,
        isMobile
      });

      expect(result).toBe(false);
    });

    it('should handle user from legacy data with empty lastName', () => {
      const user = { firstName: 'Mike', lastName: '' };
      const isMobile = false;

      const result = shouldShowFullName({
        firstName: user.firstName,
        lastName: user.lastName,
        isMobile
      });

      expect(result).toBe(false);
    });
  });
});
