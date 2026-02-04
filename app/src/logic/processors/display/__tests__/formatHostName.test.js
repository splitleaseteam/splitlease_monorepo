/**
 * Tests for formatHostName
 *
 * Format full host name to "FirstName L." format for privacy.
 * Show first name + last initial.
 */
import { describe, it, expect } from 'vitest';
import { formatHostName } from '../formatHostName.js';

describe('formatHostName', () => {
  // ============================================================================
  // Happy Path - Two Part Names
  // ============================================================================
  describe('two part names', () => {
    it('should format "John Smith" as "John S."', () => {
      const result = formatHostName({ fullName: 'John Smith' });
      expect(result).toBe('John S.');
    });

    it('should format "Jane Doe" as "Jane D."', () => {
      const result = formatHostName({ fullName: 'Jane Doe' });
      expect(result).toBe('Jane D.');
    });

    it('should format "Michael Johnson" as "Michael J."', () => {
      const result = formatHostName({ fullName: 'Michael Johnson' });
      expect(result).toBe('Michael J.');
    });

    it('should uppercase the last initial', () => {
      const result = formatHostName({ fullName: 'john smith' });
      expect(result).toBe('john S.');
    });
  });

  // ============================================================================
  // Single Name - Return As-Is
  // ============================================================================
  describe('single name (return as-is)', () => {
    it('should return single name unchanged', () => {
      const result = formatHostName({ fullName: 'John' });
      expect(result).toBe('John');
    });

    it('should return single name unchanged (lowercase)', () => {
      const result = formatHostName({ fullName: 'jane' });
      expect(result).toBe('jane');
    });

    it('should return single name unchanged (mixed case)', () => {
      const result = formatHostName({ fullName: 'Madonna' });
      expect(result).toBe('Madonna');
    });
  });

  // ============================================================================
  // Multiple Names (Three or More)
  // ============================================================================
  describe('multiple names (three or more)', () => {
    it('should use last name initial for three part name', () => {
      const result = formatHostName({ fullName: 'John Michael Smith' });
      expect(result).toBe('John S.');
    });

    it('should use last name initial for four part name', () => {
      const result = formatHostName({ fullName: 'John Michael David Smith' });
      expect(result).toBe('John S.');
    });

    it('should handle hyphenated last name', () => {
      const result = formatHostName({ fullName: 'Mary Johnson-Smith' });
      expect(result).toBe('Mary J.');
    });

    it('should handle name with suffix', () => {
      const result = formatHostName({ fullName: 'John Smith Jr' });
      expect(result).toBe('John J.');
    });
  });

  // ============================================================================
  // Whitespace Handling
  // ============================================================================
  describe('whitespace handling', () => {
    it('should trim leading whitespace', () => {
      const result = formatHostName({ fullName: '  John Smith' });
      expect(result).toBe('John S.');
    });

    it('should trim trailing whitespace', () => {
      const result = formatHostName({ fullName: 'John Smith  ' });
      expect(result).toBe('John S.');
    });

    it('should handle multiple spaces between names', () => {
      const result = formatHostName({ fullName: 'John    Smith' });
      expect(result).toBe('John S.');
    });

    it('should handle tabs between names', () => {
      const result = formatHostName({ fullName: 'John\tSmith' });
      expect(result).toBe('John S.');
    });

    it('should trim single name with whitespace', () => {
      const result = formatHostName({ fullName: '  John  ' });
      expect(result).toBe('John');
    });
  });

  // ============================================================================
  // Error Handling - Invalid Input
  // ============================================================================
  describe('error handling - invalid input', () => {
    it('should throw error for null fullName', () => {
      expect(() => formatHostName({ fullName: null }))
        .toThrow('fullName must be a string');
    });

    it('should throw error for undefined fullName', () => {
      expect(() => formatHostName({ fullName: undefined }))
        .toThrow('fullName must be a string');
    });

    it('should throw error for number fullName', () => {
      expect(() => formatHostName({ fullName: 123 }))
        .toThrow('fullName must be a string');
    });

    it('should throw error for object fullName', () => {
      expect(() => formatHostName({ fullName: {} }))
        .toThrow('fullName must be a string');
    });

    it('should throw error for array fullName', () => {
      expect(() => formatHostName({ fullName: ['John', 'Smith'] }))
        .toThrow('fullName must be a string');
    });

    it('should throw error for empty string', () => {
      expect(() => formatHostName({ fullName: '' }))
        .toThrow('fullName cannot be empty or whitespace');
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => formatHostName({ fullName: '   ' }))
        .toThrow('fullName cannot be empty or whitespace');
    });

    it('should throw error for tabs-only string', () => {
      expect(() => formatHostName({ fullName: '\t\t' }))
        .toThrow('fullName cannot be empty or whitespace');
    });

    it('should throw error for missing params object', () => {
      expect(() => formatHostName()).toThrow();
    });
  });

  // ============================================================================
  // Special Characters
  // ============================================================================
  describe('special characters', () => {
    it('should handle name with apostrophe', () => {
      const result = formatHostName({ fullName: "O'Brien Smith" });
      expect(result).toBe("O'Brien S.");
    });

    it('should handle accented characters', () => {
      const result = formatHostName({ fullName: 'José García' });
      expect(result).toBe('José G.');
    });

    it('should handle name with period', () => {
      const result = formatHostName({ fullName: 'Dr. John Smith' });
      expect(result).toBe('Dr. S.');
    });

    it('should handle unicode characters', () => {
      const result = formatHostName({ fullName: '田中 太郎' });
      expect(result).toBe('田中 太.');
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should format typical host name for listing display', () => {
      const result = formatHostName({ fullName: 'Sarah Thompson' });
      expect(result).toBe('Sarah T.');
    });

    it('should handle nickname as full name', () => {
      const result = formatHostName({ fullName: 'Bob' });
      expect(result).toBe('Bob');
    });

    it('should handle professional title in name', () => {
      const result = formatHostName({ fullName: 'Dr Emily Watson' });
      expect(result).toBe('Dr W.');
    });
  });
});
