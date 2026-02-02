/**
 * Tests for sanitize.js
 *
 * Input sanitization utilities for XSS protection, SQL injection prevention,
 * and general input validation.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sanitizeText,
  sanitizeSearchQuery,
  sanitizeNeighborhoodSearch,
  escapeHtml,
  sanitizeUrlParam,
  isValidEmail,
  isValidPhone,
  sanitizeListingId,
  checkRateLimit,
  cleanupRateLimits
} from '../sanitize.js';

describe('sanitizeText', () => {
  // ============================================================================
  // Basic Sanitization
  // ============================================================================
  describe('basic sanitization', () => {
    it('should return empty string for null input', () => {
      expect(sanitizeText(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(sanitizeText(undefined)).toBe('');
    });

    it('should return empty string for non-string input', () => {
      expect(sanitizeText(123)).toBe('');
      expect(sanitizeText({})).toBe('');
      expect(sanitizeText([])).toBe('');
    });

    it('should trim whitespace from input', () => {
      expect(sanitizeText('  hello world  ')).toBe('hello world');
    });

    it('should preserve normal text', () => {
      expect(sanitizeText('Hello World')).toBe('Hello World');
    });
  });

  // ============================================================================
  // Length Limiting
  // ============================================================================
  describe('length limiting', () => {
    it('should truncate text exceeding default maxLength (1000)', () => {
      const longText = 'a'.repeat(1500);
      const result = sanitizeText(longText);
      expect(result.length).toBe(1000);
    });

    it('should truncate text exceeding custom maxLength', () => {
      const text = 'Hello World';
      const result = sanitizeText(text, { maxLength: 5 });
      expect(result).toBe('Hello');
    });

    it('should not truncate text within maxLength', () => {
      const text = 'Short';
      const result = sanitizeText(text, { maxLength: 100 });
      expect(result).toBe('Short');
    });
  });

  // ============================================================================
  // XSS Prevention
  // ============================================================================
  describe('XSS prevention', () => {
    it('should remove script tags', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = sanitizeText(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('should remove nested script tags', () => {
      const input = '<script><script>inner</script></script>';
      const result = sanitizeText(input);
      expect(result).not.toContain('<script>');
    });

    it('should remove onclick handlers', () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      const result = sanitizeText(input);
      expect(result).not.toContain('onclick');
    });

    it('should remove onerror handlers', () => {
      const input = '<img src=x onerror="alert(1)">';
      const result = sanitizeText(input);
      expect(result).not.toContain('onerror');
    });

    it('should remove onmouseover handlers', () => {
      const input = '<a onmouseover="alert(1)">link</a>';
      const result = sanitizeText(input);
      expect(result).not.toContain('onmouseover');
    });

    it('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">link</a>';
      const result = sanitizeText(input);
      expect(result).not.toContain('javascript:');
    });

    it('should remove data:text/html protocol', () => {
      const input = '<a href="data:text/html,<script>alert(1)</script>">link</a>';
      const result = sanitizeText(input);
      expect(result).not.toContain('data:text/html');
    });

    it('should remove HTML comments', () => {
      const input = 'Hello <!-- hidden comment --> World';
      const result = sanitizeText(input);
      expect(result).not.toContain('<!--');
      expect(result).not.toContain('-->');
    });
  });

  // ============================================================================
  // Control Character Handling
  // ============================================================================
  describe('control character handling', () => {
    it('should remove control characters by default', () => {
      const input = 'Hello\x00\x01\x02World';
      const result = sanitizeText(input);
      expect(result).toBe('HelloWorld');
    });

    it('should remove newlines by default', () => {
      const input = 'Hello\nWorld\rTest';
      const result = sanitizeText(input);
      expect(result).toBe('HelloWorldTest');
    });

    it('should preserve newlines when allowNewlines is true', () => {
      const input = 'Hello\nWorld';
      const result = sanitizeText(input, { allowNewlines: true });
      expect(result).toBe('Hello\nWorld');
    });

    it('should still remove control characters when allowNewlines is true', () => {
      const input = 'Hello\x00\nWorld';
      const result = sanitizeText(input, { allowNewlines: true });
      expect(result).toBe('Hello\nWorld');
    });
  });

  // ============================================================================
  // Special Character Handling
  // ============================================================================
  describe('special character handling', () => {
    it('should allow special characters by default', () => {
      const input = 'Hello <World>';
      const result = sanitizeText(input);
      expect(result).toContain('<');
      expect(result).toContain('>');
    });

    it('should remove special characters when allowSpecialChars is false', () => {
      const input = 'Hello <World> [Test] {Data}';
      const result = sanitizeText(input, { allowSpecialChars: false });
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('[');
      expect(result).not.toContain(']');
      expect(result).not.toContain('{');
      expect(result).not.toContain('}');
    });
  });
});

describe('sanitizeSearchQuery', () => {
  it('should sanitize search queries with default options', () => {
    const result = sanitizeSearchQuery('  Brooklyn apartments  ');
    expect(result).toBe('Brooklyn apartments');
  });

  it('should limit search query to 200 characters', () => {
    const longQuery = 'a'.repeat(300);
    const result = sanitizeSearchQuery(longQuery);
    expect(result.length).toBe(200);
  });

  it('should remove special characters from search', () => {
    const result = sanitizeSearchQuery('Brooklyn <script>');
    expect(result).not.toContain('<');
  });

  it('should return empty string for null input', () => {
    expect(sanitizeSearchQuery(null)).toBe('');
  });
});

describe('sanitizeNeighborhoodSearch', () => {
  it('should sanitize neighborhood input', () => {
    const result = sanitizeNeighborhoodSearch('  Williamsburg  ');
    expect(result).toBe('Williamsburg');
  });

  it('should limit neighborhood to 100 characters', () => {
    const longName = 'a'.repeat(150);
    const result = sanitizeNeighborhoodSearch(longName);
    expect(result.length).toBe(100);
  });
});

describe('escapeHtml', () => {
  it('should return empty string for null input', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('should return empty string for undefined input', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  it('should return empty string for non-string input', () => {
    expect(escapeHtml(123)).toBe('');
  });

  it('should escape ampersand', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('should escape less than', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
  });

  it('should escape greater than', () => {
    expect(escapeHtml('5 > 3')).toBe('5 &gt; 3');
  });

  it('should escape double quotes', () => {
    expect(escapeHtml('He said "hello"')).toBe('He said &quot;hello&quot;');
  });

  it('should escape single quotes', () => {
    expect(escapeHtml("It's fine")).toBe('It&#x27;s fine');
  });

  it('should escape forward slash', () => {
    expect(escapeHtml('a/b')).toBe('a&#x2F;b');
  });

  it('should escape all special characters together', () => {
    const input = '<script>alert("XSS")</script>';
    const result = escapeHtml(input);
    expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
  });
});

describe('sanitizeUrlParam', () => {
  // ============================================================================
  // String Type
  // ============================================================================
  describe('string type', () => {
    it('should return null for empty param', () => {
      expect(sanitizeUrlParam('')).toBeNull();
    });

    it('should return null for null param', () => {
      expect(sanitizeUrlParam(null)).toBeNull();
    });

    it('should sanitize string param', () => {
      expect(sanitizeUrlParam('  hello  ')).toBe('hello');
    });

    it('should limit string to 100 characters', () => {
      const longParam = 'a'.repeat(150);
      const result = sanitizeUrlParam(longParam);
      expect(result.length).toBe(100);
    });
  });

  // ============================================================================
  // Number Type
  // ============================================================================
  describe('number type', () => {
    it('should parse valid number', () => {
      expect(sanitizeUrlParam('42', 'number')).toBe(42);
    });

    it('should parse negative number', () => {
      expect(sanitizeUrlParam('-10', 'number')).toBe(-10);
    });

    it('should return null for non-numeric string', () => {
      expect(sanitizeUrlParam('abc', 'number')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(sanitizeUrlParam('', 'number')).toBeNull();
    });

    it('should parse integer from decimal string', () => {
      expect(sanitizeUrlParam('3.14', 'number')).toBe(3);
    });
  });

  // ============================================================================
  // Array Type
  // ============================================================================
  describe('array type', () => {
    it('should parse comma-separated values', () => {
      const result = sanitizeUrlParam('a,b,c', 'array');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should trim array items', () => {
      const result = sanitizeUrlParam(' a , b , c ', 'array');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should filter empty items', () => {
      const result = sanitizeUrlParam('a,,b,', 'array');
      expect(result).toEqual(['a', 'b']);
    });

    it('should return empty array for non-string input', () => {
      expect(sanitizeUrlParam(123, 'array')).toEqual([]);
    });

    it('should return empty array for null', () => {
      expect(sanitizeUrlParam(null, 'array')).toBeNull();
    });
  });

  // ============================================================================
  // Boolean Type
  // ============================================================================
  describe('boolean type', () => {
    it('should return true for "true"', () => {
      expect(sanitizeUrlParam('true', 'boolean')).toBe(true);
    });

    it('should return true for "1"', () => {
      expect(sanitizeUrlParam('1', 'boolean')).toBe(true);
    });

    it('should return false for "false"', () => {
      expect(sanitizeUrlParam('false', 'boolean')).toBe(false);
    });

    it('should return false for "0"', () => {
      expect(sanitizeUrlParam('0', 'boolean')).toBe(false);
    });

    it('should return false for other values', () => {
      expect(sanitizeUrlParam('yes', 'boolean')).toBe(false);
    });
  });
});

describe('isValidEmail', () => {
  // ============================================================================
  // Valid Emails
  // ============================================================================
  describe('valid emails', () => {
    it('should accept standard email', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
    });

    it('should accept email with subdomain', () => {
      expect(isValidEmail('user@mail.example.com')).toBe(true);
    });

    it('should accept email with plus sign', () => {
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should accept email with dots in local part', () => {
      expect(isValidEmail('first.last@example.com')).toBe(true);
    });

    it('should accept email with numbers', () => {
      expect(isValidEmail('user123@example123.com')).toBe(true);
    });

    it('should accept email with hyphen in domain', () => {
      expect(isValidEmail('user@my-domain.com')).toBe(true);
    });

    it('should accept email with underscore', () => {
      expect(isValidEmail('user_name@example.com')).toBe(true);
    });
  });

  // ============================================================================
  // Invalid Emails
  // ============================================================================
  describe('invalid emails', () => {
    it('should reject null', () => {
      expect(isValidEmail(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isValidEmail(undefined)).toBe(false);
    });

    it('should reject non-string', () => {
      expect(isValidEmail(123)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidEmail('')).toBe(false);
    });

    it('should reject missing @ symbol', () => {
      expect(isValidEmail('userexample.com')).toBe(false);
    });

    it('should reject missing domain', () => {
      expect(isValidEmail('user@')).toBe(false);
    });

    it('should reject missing local part', () => {
      expect(isValidEmail('@example.com')).toBe(false);
    });

    it('should reject email with spaces', () => {
      expect(isValidEmail('user @example.com')).toBe(false);
    });

    it('should reject email exceeding 254 characters', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });
});

describe('isValidPhone', () => {
  // ============================================================================
  // Valid Phones
  // ============================================================================
  describe('valid phones', () => {
    it('should accept 10-digit phone', () => {
      expect(isValidPhone('5551234567')).toBe(true);
    });

    it('should accept 11-digit phone with country code', () => {
      expect(isValidPhone('15551234567')).toBe(true);
    });

    it('should accept phone with dashes', () => {
      expect(isValidPhone('555-123-4567')).toBe(true);
    });

    it('should accept phone with parentheses', () => {
      expect(isValidPhone('(555) 123-4567')).toBe(true);
    });

    it('should accept phone with dots', () => {
      expect(isValidPhone('555.123.4567')).toBe(true);
    });

    it('should accept phone with spaces', () => {
      expect(isValidPhone('555 123 4567')).toBe(true);
    });
  });

  // ============================================================================
  // Invalid Phones
  // ============================================================================
  describe('invalid phones', () => {
    it('should reject null', () => {
      expect(isValidPhone(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isValidPhone(undefined)).toBe(false);
    });

    it('should reject non-string', () => {
      expect(isValidPhone(5551234567)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidPhone('')).toBe(false);
    });

    it('should reject too few digits', () => {
      expect(isValidPhone('555123')).toBe(false);
    });

    it('should reject too many digits', () => {
      expect(isValidPhone('555123456789')).toBe(false);
    });

    it('should reject letters', () => {
      expect(isValidPhone('555-ABC-4567')).toBe(false);
    });
  });
});

describe('sanitizeListingId', () => {
  // ============================================================================
  // UUID Format
  // ============================================================================
  describe('UUID format', () => {
    it('should accept valid UUID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(sanitizeListingId(uuid)).toBe(uuid);
    });

    it('should lowercase UUID', () => {
      const uuid = '123E4567-E89B-12D3-A456-426614174000';
      expect(sanitizeListingId(uuid)).toBe(uuid.toLowerCase());
    });
  });

  // ============================================================================
  // Numeric ID
  // ============================================================================
  describe('numeric ID', () => {
    it('should accept numeric ID', () => {
      expect(sanitizeListingId('12345')).toBe('12345');
    });

    it('should accept zero', () => {
      expect(sanitizeListingId('0')).toBe('0');
    });
  });

  // ============================================================================
  // Alphanumeric ID
  // ============================================================================
  describe('alphanumeric ID', () => {
    it('should accept alphanumeric ID', () => {
      expect(sanitizeListingId('abc123')).toBe('abc123');
    });

    it('should accept ID with underscore', () => {
      expect(sanitizeListingId('listing_123')).toBe('listing_123');
    });

    it('should accept ID with hyphen', () => {
      expect(sanitizeListingId('listing-123')).toBe('listing-123');
    });

    it('should reject ID exceeding 50 characters', () => {
      const longId = 'a'.repeat(51);
      expect(sanitizeListingId(longId)).toBeNull();
    });
  });

  // ============================================================================
  // Invalid IDs
  // ============================================================================
  describe('invalid IDs', () => {
    it('should return null for null', () => {
      expect(sanitizeListingId(null)).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(sanitizeListingId(undefined)).toBeNull();
    });

    it('should return null for non-string', () => {
      expect(sanitizeListingId(123)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(sanitizeListingId('')).toBeNull();
    });

    it('should return null for ID with special characters', () => {
      expect(sanitizeListingId('listing@123')).toBeNull();
      expect(sanitizeListingId('listing<123>')).toBeNull();
      expect(sanitizeListingId('listing;123')).toBeNull();
    });
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Clean up any existing rate limits
    cleanupRateLimits();
  });

  it('should allow first request', () => {
    expect(checkRateLimit('test-key')).toBe(true);
  });

  it('should allow requests within limit', () => {
    const key = 'test-key-2';
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(key)).toBe(true);
    }
  });

  it('should block requests exceeding limit', () => {
    const key = 'test-key-3';
    // Default limit is 10
    for (let i = 0; i < 10; i++) {
      checkRateLimit(key);
    }
    expect(checkRateLimit(key)).toBe(false);
  });

  it('should respect custom maxRequests', () => {
    const key = 'test-key-4';
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, 3)).toBe(true);
    }
    expect(checkRateLimit(key, 3)).toBe(false);
  });

  it('should track different keys separately', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('key-a');
    }
    // key-b should still be allowed
    expect(checkRateLimit('key-b')).toBe(true);
  });
});

describe('cleanupRateLimits', () => {
  it('should be callable without error', () => {
    expect(() => cleanupRateLimits()).not.toThrow();
  });
});
