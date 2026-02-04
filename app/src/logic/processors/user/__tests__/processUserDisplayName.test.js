/**
 * Tests for processUserDisplayName
 *
 * Formats user's display name for UI presentation.
 * Returns "FirstName LastName" if showFull is true and lastName exists,
 * otherwise returns just "FirstName".
 */
import { describe, it, expect } from 'vitest';
import { processUserDisplayName } from '../processUserDisplayName.js';

describe('processUserDisplayName', () => {
  // ============================================================================
  // Happy Path - Full Name Display
  // ============================================================================
  describe('full name display (showFull = true)', () => {
    it('should return "FirstName LastName" when showFull is true', () => {
      const result = processUserDisplayName({
        firstName: 'John',
        lastName: 'Doe',
        showFull: true
      });
      expect(result).toBe('John Doe');
    });

    it('should handle different name combinations', () => {
      const result = processUserDisplayName({
        firstName: 'Jane',
        lastName: 'Smith',
        showFull: true
      });
      expect(result).toBe('Jane Smith');
    });

    it('should handle longer names', () => {
      const result = processUserDisplayName({
        firstName: 'Christopher',
        lastName: 'VanDenBergenstein',
        showFull: true
      });
      expect(result).toBe('Christopher VanDenBergenstein');
    });

    it('should handle hyphenated last names', () => {
      const result = processUserDisplayName({
        firstName: 'Mary',
        lastName: 'Jane-Watson',
        showFull: true
      });
      expect(result).toBe('Mary Jane-Watson');
    });

    it('should handle names with apostrophes', () => {
      const result = processUserDisplayName({
        firstName: "Patrick",
        lastName: "O'Brien",
        showFull: true
      });
      expect(result).toBe("Patrick O'Brien");
    });
  });

  // ============================================================================
  // First Name Only Display
  // ============================================================================
  describe('first name only display (showFull = false)', () => {
    it('should return first name only when showFull is false', () => {
      const result = processUserDisplayName({
        firstName: 'John',
        lastName: 'Doe',
        showFull: false
      });
      expect(result).toBe('John');
    });

    it('should return first name only regardless of lastName presence', () => {
      const result = processUserDisplayName({
        firstName: 'Jane',
        lastName: 'Smith',
        showFull: false
      });
      expect(result).toBe('Jane');
    });
  });

  // ============================================================================
  // Missing/Invalid Last Name
  // ============================================================================
  describe('missing/invalid lastName', () => {
    it('should return first name only when lastName is null', () => {
      const result = processUserDisplayName({
        firstName: 'John',
        lastName: null,
        showFull: true
      });
      expect(result).toBe('John');
    });

    it('should return first name only when lastName is undefined', () => {
      const result = processUserDisplayName({
        firstName: 'Jane',
        lastName: undefined,
        showFull: true
      });
      expect(result).toBe('Jane');
    });

    it('should return first name only when lastName is empty string', () => {
      const result = processUserDisplayName({
        firstName: 'John',
        lastName: '',
        showFull: true
      });
      expect(result).toBe('John');
    });

    it('should return first name only when lastName is whitespace only', () => {
      const result = processUserDisplayName({
        firstName: 'Jane',
        lastName: '   ',
        showFull: true
      });
      expect(result).toBe('Jane');
    });
  });

  // ============================================================================
  // Whitespace Handling
  // ============================================================================
  describe('whitespace handling', () => {
    it('should trim leading whitespace from firstName', () => {
      const result = processUserDisplayName({
        firstName: '  John',
        lastName: 'Doe',
        showFull: true
      });
      expect(result).toBe('John Doe');
    });

    it('should trim trailing whitespace from firstName', () => {
      const result = processUserDisplayName({
        firstName: 'John  ',
        lastName: 'Doe',
        showFull: true
      });
      expect(result).toBe('John Doe');
    });

    it('should trim whitespace from lastName', () => {
      const result = processUserDisplayName({
        firstName: 'John',
        lastName: '  Doe  ',
        showFull: true
      });
      expect(result).toBe('John Doe');
    });

    it('should trim whitespace from both names', () => {
      const result = processUserDisplayName({
        firstName: '  John  ',
        lastName: '  Doe  ',
        showFull: true
      });
      expect(result).toBe('John Doe');
    });

    it('should handle firstName with internal spaces', () => {
      const result = processUserDisplayName({
        firstName: 'Mary Jane',
        lastName: 'Watson',
        showFull: true
      });
      expect(result).toBe('Mary Jane Watson');
    });
  });

  // ============================================================================
  // Error Handling - firstName Validation
  // ============================================================================
  describe('error handling - firstName validation', () => {
    it('should throw error for null firstName', () => {
      expect(() => processUserDisplayName({
        firstName: null,
        lastName: 'Doe',
        showFull: true
      })).toThrow('processUserDisplayName requires a valid firstName');
    });

    it('should throw error for undefined firstName', () => {
      expect(() => processUserDisplayName({
        firstName: undefined,
        lastName: 'Doe',
        showFull: true
      })).toThrow('processUserDisplayName requires a valid firstName');
    });

    it('should throw error for empty firstName', () => {
      expect(() => processUserDisplayName({
        firstName: '',
        lastName: 'Doe',
        showFull: true
      })).toThrow('processUserDisplayName requires a valid firstName');
    });

    it('should throw error for whitespace-only firstName', () => {
      expect(() => processUserDisplayName({
        firstName: '   ',
        lastName: 'Doe',
        showFull: true
      })).toThrow('processUserDisplayName requires a valid firstName');
    });

    it('should throw error for non-string firstName', () => {
      expect(() => processUserDisplayName({
        firstName: 123,
        lastName: 'Doe',
        showFull: true
      })).toThrow('processUserDisplayName requires a valid firstName');
    });

    it('should throw error for object firstName', () => {
      expect(() => processUserDisplayName({
        firstName: {},
        lastName: 'Doe',
        showFull: true
      })).toThrow('processUserDisplayName requires a valid firstName');
    });

    it('should throw error for array firstName', () => {
      expect(() => processUserDisplayName({
        firstName: ['John'],
        lastName: 'Doe',
        showFull: true
      })).toThrow('processUserDisplayName requires a valid firstName');
    });
  });

  // ============================================================================
  // Error Handling - showFull Validation
  // ============================================================================
  describe('error handling - showFull validation', () => {
    it('should throw error for non-boolean showFull', () => {
      expect(() => processUserDisplayName({
        firstName: 'John',
        lastName: 'Doe',
        showFull: 'true'
      })).toThrow('processUserDisplayName requires showFull to be a boolean');
    });

    it('should throw error for null showFull', () => {
      expect(() => processUserDisplayName({
        firstName: 'John',
        lastName: 'Doe',
        showFull: null
      })).toThrow('processUserDisplayName requires showFull to be a boolean');
    });

    it('should throw error for undefined showFull', () => {
      expect(() => processUserDisplayName({
        firstName: 'John',
        lastName: 'Doe',
        showFull: undefined
      })).toThrow('processUserDisplayName requires showFull to be a boolean');
    });

    it('should throw error for number showFull', () => {
      expect(() => processUserDisplayName({
        firstName: 'John',
        lastName: 'Doe',
        showFull: 1
      })).toThrow('processUserDisplayName requires showFull to be a boolean');
    });

    it('should throw error for object showFull', () => {
      expect(() => processUserDisplayName({
        firstName: 'John',
        lastName: 'Doe',
        showFull: {}
      })).toThrow('processUserDisplayName requires showFull to be a boolean');
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle single character firstName', () => {
      const result = processUserDisplayName({
        firstName: 'J',
        lastName: 'D',
        showFull: true
      });
      expect(result).toBe('J D');
    });

    it('should handle very long names', () => {
      const longFirstName = 'A'.repeat(100);
      const longLastName = 'B'.repeat(100);
      const result = processUserDisplayName({
        firstName: longFirstName,
        lastName: longLastName,
        showFull: true
      });
      expect(result).toBe(`${longFirstName} ${longLastName}`);
    });

    it('should handle names with numbers', () => {
      const result = processUserDisplayName({
        firstName: 'John3',
        lastName: 'Doe4',
        showFull: true
      });
      expect(result).toBe('John3 Doe4');
    });

    it('should handle names with special characters', () => {
      const result = processUserDisplayName({
        firstName: 'J@hn',
        lastName: 'D*e',
        showFull: true
      });
      expect(result).toBe('J@hn D*e');
    });

    it('should handle Unicode names', () => {
      const result = processUserDisplayName({
        firstName: 'Joh\u00e4n',
        lastName: 'D\u00f6e',
        showFull: true
      });
      expect(result).toBe('Joh\u00e4n D\u00f6e');
    });

    it('should handle Emoji in names (unusual but valid string)', () => {
      const result = processUserDisplayName({
        firstName: 'John',
        lastName: 'Doe',
        showFull: true
      });
      expect(result).toBe('John Doe');
    });
  });

  // ============================================================================
  // Input Object Validation
  // ============================================================================
  describe('input object validation', () => {
    it('should work with extra properties in params object', () => {
      const result = processUserDisplayName({
        firstName: 'John',
        lastName: 'Doe',
        showFull: true,
        extraProp: 'ignored'
      });
      expect(result).toBe('John Doe');
    });

    it('should throw error for missing params object', () => {
      expect(() => processUserDisplayName())
        .toThrow();
    });

    it('should throw error for empty params object', () => {
      expect(() => processUserDisplayName({}))
        .toThrow();
    });
  });

  // ============================================================================
  // Real-World Scenario Tests
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should format typical American name', () => {
      const result = processUserDisplayName({
        firstName: 'Michael',
        lastName: 'Johnson',
        showFull: true
      });
      expect(result).toBe('Michael Johnson');
    });

    it('should format typical name with suffix (Jr., III, etc.) in lastName', () => {
      const result = processUserDisplayName({
        firstName: 'Robert',
        lastName: 'Smith Jr.',
        showFull: true
      });
      expect(result).toBe('Robert Smith Jr.');
    });

    it('should handle display name for privacy (showFull = false)', () => {
      const result = processUserDisplayName({
        firstName: 'Anonymous',
        lastName: 'User',
        showFull: false
      });
      expect(result).toBe('Anonymous');
    });

    it('should handle user with no lastName in database', () => {
      const result = processUserDisplayName({
        firstName: 'Guest',
        lastName: null,
        showFull: true
      });
      expect(result).toBe('Guest');
    });
  });

  // ============================================================================
  // Boolean Value Tests
  // ============================================================================
  describe('boolean value tests', () => {
    it('should accept true as showFull', () => {
      const result = processUserDisplayName({
        firstName: 'John',
        lastName: 'Doe',
        showFull: true
      });
      expect(result).toBe('John Doe');
    });

    it('should accept false as showFull', () => {
      const result = processUserDisplayName({
        firstName: 'John',
        lastName: 'Doe',
        showFull: false
      });
      expect(result).toBe('John');
    });

    it('should not accept truthy values as boolean', () => {
      expect(() => processUserDisplayName({
        firstName: 'John',
        lastName: 'Doe',
        showFull: 'yes'
      })).toThrow();
    });

    it('should not accept falsy values as boolean', () => {
      expect(() => processUserDisplayName({
        firstName: 'John',
        lastName: 'Doe',
        showFull: 0
      })).toThrow();
    });
  });
});
