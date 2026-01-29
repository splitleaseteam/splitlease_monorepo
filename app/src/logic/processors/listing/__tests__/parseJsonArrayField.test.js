/**
 * Tests for parseJsonArrayField and parseJsonArrayFieldOptional
 *
 * Parse JSONB field that may be double-encoded as JSON string.
 * Handles both native arrays and JSON-stringified arrays from Supabase.
 */
import { describe, it, expect } from 'vitest';
import {
  parseJsonArrayField,
  parseJsonArrayFieldOptional
} from '../parseJsonArrayField.js';

// ============================================================================
// parseJsonArrayField Tests
// ============================================================================
describe('parseJsonArrayField', () => {
  // ============================================================================
  // Already Array Input
  // ============================================================================
  describe('array input (already parsed)', () => {
    it('should return array as-is when input is already an array', () => {
      const result = parseJsonArrayField({
        field: ['amenity1', 'amenity2'],
        fieldName: 'Features - Amenities'
      });
      expect(result).toEqual(['amenity1', 'amenity2']);
    });

    it('should return empty array as-is', () => {
      const result = parseJsonArrayField({
        field: [],
        fieldName: 'Features - Amenities'
      });
      expect(result).toEqual([]);
    });

    it('should return array with mixed types', () => {
      const result = parseJsonArrayField({
        field: [1, 'two', true, { key: 'value' }],
        fieldName: 'Mixed Array'
      });
      expect(result).toEqual([1, 'two', true, { key: 'value' }]);
    });

    it('should return array with nested arrays', () => {
      const result = parseJsonArrayField({
        field: [[1, 2], [3, 4]],
        fieldName: 'Nested Array'
      });
      expect(result).toEqual([[1, 2], [3, 4]]);
    });
  });

  // ============================================================================
  // JSON String Input (Double-Encoded)
  // ============================================================================
  describe('JSON string input (double-encoded)', () => {
    it('should parse JSON-encoded array string', () => {
      const result = parseJsonArrayField({
        field: '["amenity1","amenity2"]',
        fieldName: 'Features - Amenities'
      });
      expect(result).toEqual(['amenity1', 'amenity2']);
    });

    it('should parse JSON-encoded empty array', () => {
      const result = parseJsonArrayField({
        field: '[]',
        fieldName: 'Features - Amenities'
      });
      expect(result).toEqual([]);
    });

    it('should parse JSON-encoded array with numbers', () => {
      const result = parseJsonArrayField({
        field: '[1, 2, 3, 4, 5]',
        fieldName: 'Days Selected'
      });
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should parse JSON-encoded array with mixed types', () => {
      const result = parseJsonArrayField({
        field: '["string", 123, true, null]',
        fieldName: 'Mixed Data'
      });
      expect(result).toEqual(['string', 123, true, null]);
    });

    it('should parse JSON-encoded array with objects', () => {
      const result = parseJsonArrayField({
        field: '[{"id": 1}, {"id": 2}]',
        fieldName: 'Object Array'
      });
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  // ============================================================================
  // Error Handling - Null/Undefined Field
  // ============================================================================
  describe('error handling - null/undefined field', () => {
    it('should throw error for null field', () => {
      expect(() => parseJsonArrayField({
        field: null,
        fieldName: 'Features - Amenities'
      })).toThrow('parseJsonArrayField: Features - Amenities is null or undefined');
    });

    it('should throw error for undefined field', () => {
      expect(() => parseJsonArrayField({
        field: undefined,
        fieldName: 'Features - Amenities'
      })).toThrow('parseJsonArrayField: Features - Amenities is null or undefined');
    });
  });

  // ============================================================================
  // Error Handling - Invalid JSON String
  // ============================================================================
  describe('error handling - invalid JSON string', () => {
    it('should throw error for invalid JSON', () => {
      expect(() => parseJsonArrayField({
        field: '{invalid json}',
        fieldName: 'Bad JSON'
      })).toThrow('parseJsonArrayField: Failed to parse Bad JSON as JSON');
    });

    it('should throw error for partial JSON', () => {
      expect(() => parseJsonArrayField({
        field: '[1, 2, 3',
        fieldName: 'Incomplete Array'
      })).toThrow('parseJsonArrayField: Failed to parse Incomplete Array as JSON');
    });

    it('should throw error for plain string (not JSON)', () => {
      expect(() => parseJsonArrayField({
        field: 'just a string',
        fieldName: 'Plain String'
      })).toThrow('parseJsonArrayField: Failed to parse Plain String as JSON');
    });
  });

  // ============================================================================
  // Error Handling - Non-Array JSON
  // ============================================================================
  describe('error handling - non-array JSON', () => {
    it('should throw error for JSON object', () => {
      expect(() => parseJsonArrayField({
        field: '{"key": "value"}',
        fieldName: 'Object Field'
      })).toThrow('parseJsonArrayField: Object Field parsed to object, expected array');
    });

    it('should throw error for JSON number', () => {
      expect(() => parseJsonArrayField({
        field: '42',
        fieldName: 'Number Field'
      })).toThrow('parseJsonArrayField: Number Field parsed to number, expected array');
    });

    it('should throw error for JSON string', () => {
      expect(() => parseJsonArrayField({
        field: '"hello"',
        fieldName: 'String Field'
      })).toThrow('parseJsonArrayField: String Field parsed to string, expected array');
    });

    it('should throw error for JSON boolean', () => {
      expect(() => parseJsonArrayField({
        field: 'true',
        fieldName: 'Boolean Field'
      })).toThrow('parseJsonArrayField: Boolean Field parsed to boolean, expected array');
    });

    it('should throw error for JSON null', () => {
      expect(() => parseJsonArrayField({
        field: 'null',
        fieldName: 'Null JSON Field'
      })).toThrow('parseJsonArrayField: Null JSON Field parsed to object, expected array');
    });
  });

  // ============================================================================
  // Error Handling - Unexpected Types
  // ============================================================================
  describe('error handling - unexpected types', () => {
    it('should throw error for number input', () => {
      expect(() => parseJsonArrayField({
        field: 42,
        fieldName: 'Number Field'
      })).toThrow('parseJsonArrayField: Number Field has unexpected type number');
    });

    it('should throw error for boolean input', () => {
      expect(() => parseJsonArrayField({
        field: true,
        fieldName: 'Boolean Field'
      })).toThrow('parseJsonArrayField: Boolean Field has unexpected type boolean');
    });

    it('should throw error for object input (non-array)', () => {
      expect(() => parseJsonArrayField({
        field: { key: 'value' },
        fieldName: 'Object Field'
      })).toThrow('parseJsonArrayField: Object Field has unexpected type object');
    });
  });

  // ============================================================================
  // Error Handling - Invalid fieldName
  // ============================================================================
  describe('error handling - invalid fieldName', () => {
    it('should throw error for null fieldName', () => {
      expect(() => parseJsonArrayField({
        field: [],
        fieldName: null
      })).toThrow('parseJsonArrayField: fieldName parameter is required and must be a string');
    });

    it('should throw error for undefined fieldName', () => {
      expect(() => parseJsonArrayField({
        field: [],
        fieldName: undefined
      })).toThrow('parseJsonArrayField: fieldName parameter is required and must be a string');
    });

    it('should throw error for empty string fieldName', () => {
      expect(() => parseJsonArrayField({
        field: [],
        fieldName: ''
      })).toThrow('parseJsonArrayField: fieldName parameter is required and must be a string');
    });

    it('should throw error for number fieldName', () => {
      expect(() => parseJsonArrayField({
        field: [],
        fieldName: 123
      })).toThrow('parseJsonArrayField: fieldName parameter is required and must be a string');
    });
  });

  // ============================================================================
  // Input Object Validation
  // ============================================================================
  describe('input object validation', () => {
    it('should throw error for missing params object', () => {
      expect(() => parseJsonArrayField()).toThrow();
    });

    it('should throw error for empty params object', () => {
      expect(() => parseJsonArrayField({})).toThrow();
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should parse amenities array from Supabase', () => {
      const supabaseData = {
        'Features - Amenities': ['Wifi', 'AC', 'Washer', 'Dryer']
      };
      const result = parseJsonArrayField({
        field: supabaseData['Features - Amenities'],
        fieldName: 'Features - Amenities'
      });
      expect(result).toEqual(['Wifi', 'AC', 'Washer', 'Dryer']);
    });

    it('should parse double-encoded days selected', () => {
      // Simulating double-encoded JSONB from Supabase
      const supabaseData = {
        days_selected: '[1, 2, 3, 4, 5]'
      };
      const result = parseJsonArrayField({
        field: supabaseData.days_selected,
        fieldName: 'Days Selected'
      });
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle gallery photos array', () => {
      const listing = {
        'Gallery Photo URLs': [
          'https://example.com/photo1.jpg',
          'https://example.com/photo2.jpg'
        ]
      };
      const result = parseJsonArrayField({
        field: listing['Gallery Photo URLs'],
        fieldName: 'Gallery Photo URLs'
      });
      expect(result).toHaveLength(2);
    });
  });
});

// ============================================================================
// parseJsonArrayFieldOptional Tests
// ============================================================================
describe('parseJsonArrayFieldOptional', () => {
  // ============================================================================
  // Null/Undefined Returns Empty Array
  // ============================================================================
  describe('null/undefined returns empty array', () => {
    it('should return empty array for null field', () => {
      const result = parseJsonArrayFieldOptional({
        field: null,
        fieldName: 'Optional Field'
      });
      expect(result).toEqual([]);
    });

    it('should return empty array for undefined field', () => {
      const result = parseJsonArrayFieldOptional({
        field: undefined,
        fieldName: 'Optional Field'
      });
      expect(result).toEqual([]);
    });

    it('should return empty array for empty string field', () => {
      const result = parseJsonArrayFieldOptional({
        field: '',
        fieldName: 'Optional Field'
      });
      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // Valid Input - Delegated to parseJsonArrayField
  // ============================================================================
  describe('valid input - delegated to strict validator', () => {
    it('should parse array input', () => {
      const result = parseJsonArrayFieldOptional({
        field: ['item1', 'item2'],
        fieldName: 'Optional Array'
      });
      expect(result).toEqual(['item1', 'item2']);
    });

    it('should parse JSON string input', () => {
      const result = parseJsonArrayFieldOptional({
        field: '["item1", "item2"]',
        fieldName: 'Optional JSON'
      });
      expect(result).toEqual(['item1', 'item2']);
    });

    it('should return provided empty array', () => {
      const result = parseJsonArrayFieldOptional({
        field: [],
        fieldName: 'Optional Empty'
      });
      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // Error for Invalid Non-Null Data
  // ============================================================================
  describe('error for invalid non-null data', () => {
    it('should throw error for invalid JSON string', () => {
      expect(() => parseJsonArrayFieldOptional({
        field: 'not json',
        fieldName: 'Bad JSON'
      })).toThrow('parseJsonArrayField: Failed to parse Bad JSON as JSON');
    });

    it('should throw error for JSON object', () => {
      expect(() => parseJsonArrayFieldOptional({
        field: '{"key": "value"}',
        fieldName: 'Object JSON'
      })).toThrow('parseJsonArrayField: Object JSON parsed to object, expected array');
    });

    it('should throw error for number input', () => {
      expect(() => parseJsonArrayFieldOptional({
        field: 42,
        fieldName: 'Number Field'
      })).toThrow('parseJsonArrayField: Number Field has unexpected type number');
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should handle optional amenities when not set', () => {
      const listing = {
        'Premium Amenities': null
      };
      const result = parseJsonArrayFieldOptional({
        field: listing['Premium Amenities'],
        fieldName: 'Premium Amenities'
      });
      expect(result).toEqual([]);
    });

    it('should handle optional amenities when set', () => {
      const listing = {
        'Premium Amenities': ['Pool', 'Gym']
      };
      const result = parseJsonArrayFieldOptional({
        field: listing['Premium Amenities'],
        fieldName: 'Premium Amenities'
      });
      expect(result).toEqual(['Pool', 'Gym']);
    });

    it('should handle new listing with no features yet', () => {
      const newListing = {};
      const result = parseJsonArrayFieldOptional({
        field: newListing['Features - Amenities'],
        fieldName: 'Features - Amenities'
      });
      expect(result).toEqual([]);
    });
  });
});
