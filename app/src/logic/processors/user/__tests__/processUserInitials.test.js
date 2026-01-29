/**
 * Tests for processUserInitials
 *
 * Generates user initials from first and last name for avatar display.
 * If both names provided, use first letter of each (uppercase).
 * If only firstName, use first letter (uppercase).
 */
import { describe, it, expect } from 'vitest';
import { processUserInitials } from '../processUserInitials.js';

describe('processUserInitials', () => {
  // ============================================================================
  // Happy Path - Full Name (2 Initials)
  // ============================================================================
  describe('full name (2 initials)', () => {
    it('should return "JD" for John Doe', () => {
      expect(processUserInitials({ firstName: 'John', lastName: 'Doe' })).toBe('JD');
    });

    it('should return "JS" for Jane Smith', () => {
      expect(processUserInitials({ firstName: 'Jane', lastName: 'Smith' })).toBe('JS');
    });

    it('should return "AB" for Alice Brown', () => {
      expect(processUserInitials({ firstName: 'Alice', lastName: 'Brown' })).toBe('AB');
    });

    it('should handle lowercase names', () => {
      expect(processUserInitials({ firstName: 'john', lastName: 'doe' })).toBe('JD');
    });

    it('should handle mixed case names', () => {
      expect(processUserInitials({ firstName: 'jOhN', lastName: 'dOe' })).toBe('JD');
    });
  });

  // ============================================================================
  // First Name Only (1 Initial)
  // ============================================================================
  describe('first name only (1 initial)', () => {
    it('should return "J" when lastName is null', () => {
      expect(processUserInitials({ firstName: 'John', lastName: null })).toBe('J');
    });

    it('should return "J" when lastName is undefined', () => {
      expect(processUserInitials({ firstName: 'John', lastName: undefined })).toBe('J');
    });

    it('should return "J" when lastName is empty string', () => {
      expect(processUserInitials({ firstName: 'John', lastName: '' })).toBe('J');
    });

    it('should return "J" when lastName is whitespace only', () => {
      expect(processUserInitials({ firstName: 'John', lastName: '   ' })).toBe('J');
    });

    it('should return "M" for Maria without lastName', () => {
      expect(processUserInitials({ firstName: 'Maria' })).toBe('M');
    });
  });

  // ============================================================================
  // Whitespace Handling
  // ============================================================================
  describe('whitespace handling', () => {
    it('should trim leading whitespace from firstName', () => {
      expect(processUserInitials({ firstName: '  John', lastName: 'Doe' })).toBe('JD');
    });

    it('should trim trailing whitespace from firstName', () => {
      expect(processUserInitials({ firstName: 'John  ', lastName: 'Doe' })).toBe('JD');
    });

    it('should trim whitespace from lastName', () => {
      expect(processUserInitials({ firstName: 'John', lastName: '  Doe  ' })).toBe('JD');
    });

    it('should trim whitespace from both names', () => {
      expect(processUserInitials({ firstName: '  John  ', lastName: '  Doe  ' })).toBe('JD');
    });
  });

  // ============================================================================
  // Error Handling - Invalid firstName
  // ============================================================================
  describe('error handling - invalid firstName', () => {
    it('should throw error for null firstName', () => {
      expect(() => processUserInitials({ firstName: null, lastName: 'Doe' }))
        .toThrow('processUserInitials requires a valid firstName');
    });

    it('should throw error for undefined firstName', () => {
      expect(() => processUserInitials({ firstName: undefined, lastName: 'Doe' }))
        .toThrow('processUserInitials requires a valid firstName');
    });

    it('should throw error for empty string firstName', () => {
      expect(() => processUserInitials({ firstName: '', lastName: 'Doe' }))
        .toThrow('processUserInitials requires a valid firstName');
    });

    it('should throw error for whitespace-only firstName', () => {
      expect(() => processUserInitials({ firstName: '   ', lastName: 'Doe' }))
        .toThrow('processUserInitials requires a valid firstName');
    });

    it('should throw error for non-string firstName (number)', () => {
      expect(() => processUserInitials({ firstName: 123, lastName: 'Doe' }))
        .toThrow('processUserInitials requires a valid firstName');
    });

    it('should throw error for non-string firstName (object)', () => {
      expect(() => processUserInitials({ firstName: {}, lastName: 'Doe' }))
        .toThrow('processUserInitials requires a valid firstName');
    });

    it('should throw error for non-string firstName (array)', () => {
      expect(() => processUserInitials({ firstName: ['John'], lastName: 'Doe' }))
        .toThrow('processUserInitials requires a valid firstName');
    });

    it('should throw error for missing params object', () => {
      expect(() => processUserInitials()).toThrow();
    });

    it('should throw error for empty params object', () => {
      expect(() => processUserInitials({}))
        .toThrow('processUserInitials requires a valid firstName');
    });
  });

  // ============================================================================
  // Invalid lastName (Should Still Work - Optional)
  // ============================================================================
  describe('invalid lastName (optional, should not throw)', () => {
    it('should return single initial for non-string lastName (number)', () => {
      expect(processUserInitials({ firstName: 'John', lastName: 123 })).toBe('J');
    });

    it('should return single initial for non-string lastName (object)', () => {
      expect(processUserInitials({ firstName: 'John', lastName: {} })).toBe('J');
    });

    it('should return single initial for non-string lastName (array)', () => {
      expect(processUserInitials({ firstName: 'John', lastName: [] })).toBe('J');
    });

    it('should return single initial for non-string lastName (boolean)', () => {
      expect(processUserInitials({ firstName: 'John', lastName: true })).toBe('J');
    });
  });

  // ============================================================================
  // Special Characters and Unicode
  // ============================================================================
  describe('special characters and unicode', () => {
    it('should handle names with apostrophes', () => {
      expect(processUserInitials({ firstName: "Patrick", lastName: "O'Brien" })).toBe('PO');
    });

    it('should handle hyphenated names', () => {
      expect(processUserInitials({ firstName: 'Mary', lastName: 'Jane-Watson' })).toBe('MJ');
    });

    it('should handle Unicode characters', () => {
      expect(processUserInitials({ firstName: 'Joh\u00e4n', lastName: 'D\u00f6e' })).toBe('JD');
    });

    it('should handle names starting with numbers (edge case)', () => {
      expect(processUserInitials({ firstName: '123John', lastName: 'Doe' })).toBe('1D');
    });

    it('should handle names with special characters at start', () => {
      expect(processUserInitials({ firstName: '@John', lastName: '#Doe' })).toBe('@#');
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================
  describe('edge cases', () => {
    it('should handle single character firstName', () => {
      expect(processUserInitials({ firstName: 'J', lastName: 'D' })).toBe('JD');
    });

    it('should handle single character firstName only', () => {
      expect(processUserInitials({ firstName: 'J' })).toBe('J');
    });

    it('should handle very long names', () => {
      const longFirst = 'A' + 'a'.repeat(100);
      const longLast = 'B' + 'b'.repeat(100);
      expect(processUserInitials({ firstName: longFirst, lastName: longLast })).toBe('AB');
    });

    it('should handle names with internal spaces', () => {
      expect(processUserInitials({ firstName: 'Mary Jane', lastName: 'Watson' })).toBe('MW');
    });

    it('should handle firstName with only spaces after first char', () => {
      expect(processUserInitials({ firstName: 'J   ', lastName: 'D' })).toBe('JD');
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should generate initials for typical user', () => {
      expect(processUserInitials({ firstName: 'Michael', lastName: 'Johnson' })).toBe('MJ');
    });

    it('should handle guest user without lastName', () => {
      expect(processUserInitials({ firstName: 'Guest', lastName: null })).toBe('G');
    });

    it('should handle user with suffix in lastName', () => {
      expect(processUserInitials({ firstName: 'Robert', lastName: 'Smith Jr.' })).toBe('RS');
    });

    it('should handle international names', () => {
      expect(processUserInitials({ firstName: 'Li', lastName: 'Wei' })).toBe('LW');
      expect(processUserInitials({ firstName: 'Hans', lastName: 'Muller' })).toBe('HM');
      expect(processUserInitials({ firstName: 'Maria', lastName: 'Garcia' })).toBe('MG');
    });

    it('should handle mononym (single name)', () => {
      expect(processUserInitials({ firstName: 'Madonna', lastName: null })).toBe('M');
      expect(processUserInitials({ firstName: 'Prince' })).toBe('P');
    });
  });

  // ============================================================================
  // Output Format Verification
  // ============================================================================
  describe('output format verification', () => {
    it('should always return uppercase initials', () => {
      const result = processUserInitials({ firstName: 'john', lastName: 'doe' });
      expect(result).toBe(result.toUpperCase());
    });

    it('should return 1 character when no lastName', () => {
      const result = processUserInitials({ firstName: 'John' });
      expect(result).toHaveLength(1);
    });

    it('should return 2 characters when lastName provided', () => {
      const result = processUserInitials({ firstName: 'John', lastName: 'Doe' });
      expect(result).toHaveLength(2);
    });

    it('should return string type', () => {
      const result = processUserInitials({ firstName: 'John', lastName: 'Doe' });
      expect(typeof result).toBe('string');
    });
  });
});
