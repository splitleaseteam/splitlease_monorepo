/**
 * Tests for processProfilePhotoUrl
 *
 * Normalizes and validates a profile photo URL.
 * Handles protocol-relative URLs and prevents XSS.
 */
import { describe, it, expect } from 'vitest';
import { processProfilePhotoUrl } from '../processProfilePhotoUrl.js';

describe('processProfilePhotoUrl', () => {
  // ============================================================================
  // Happy Path - Valid URLs
  // ============================================================================
  describe('valid URLs (return normalized)', () => {
    it('should return https URL unchanged', () => {
      const result = processProfilePhotoUrl({
        photoUrl: 'https://example.com/photo.jpg'
      });
      expect(result).toBe('https://example.com/photo.jpg');
    });

    it('should return http URL unchanged', () => {
      const result = processProfilePhotoUrl({
        photoUrl: 'http://example.com/photo.jpg'
      });
      expect(result).toBe('http://example.com/photo.jpg');
    });

    it('should handle URL with query parameters', () => {
      const result = processProfilePhotoUrl({
        photoUrl: 'https://example.com/photo.jpg?size=large&format=webp'
      });
      expect(result).toBe('https://example.com/photo.jpg?size=large&format=webp');
    });

    it('should handle URL with hash fragment', () => {
      const result = processProfilePhotoUrl({
        photoUrl: 'https://example.com/photo.jpg#section1'
      });
      expect(result).toBe('https://example.com/photo.jpg#section1');
    });

    it('should handle URL with special characters', () => {
      const result = processProfilePhotoUrl({
        photoUrl: 'https://example.com/photo%20image.jpg'
      });
      expect(result).toBe('https://example.com/photo%20image.jpg');
    });
  });

  // ============================================================================
  // Protocol-Relative URLs
  // ============================================================================
  describe('protocol-relative URLs', () => {
    it('should add https: to protocol-relative URL', () => {
      const result = processProfilePhotoUrl({
        photoUrl: '//example.com/photo.jpg'
      });
      expect(result).toBe('https://example.com/photo.jpg');
    });

    it('should add https: to protocol-relative URL with path', () => {
      const result = processProfilePhotoUrl({
        photoUrl: '//cdn.example.com/users/123/avatar.png'
      });
      expect(result).toBe('https://cdn.example.com/users/123/avatar.png');
    });

    it('should add https: to protocol-relative URL with query', () => {
      const result = processProfilePhotoUrl({
        photoUrl: '//example.com/photo.jpg?size=100'
      });
      expect(result).toBe('https://example.com/photo.jpg?size=100');
    });
  });

  // ============================================================================
  // Null/Undefined Input - Returns Null
  // ============================================================================
  describe('null/undefined input (returns null)', () => {
    it('should return null for null photoUrl', () => {
      const result = processProfilePhotoUrl({ photoUrl: null });
      expect(result).toBeNull();
    });

    it('should return null for undefined photoUrl', () => {
      const result = processProfilePhotoUrl({ photoUrl: undefined });
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // Empty/Whitespace - Returns Null
  // ============================================================================
  describe('empty/whitespace (returns null)', () => {
    it('should return null for empty string', () => {
      const result = processProfilePhotoUrl({ photoUrl: '' });
      expect(result).toBeNull();
    });

    it('should return null for whitespace-only string', () => {
      const result = processProfilePhotoUrl({ photoUrl: '   ' });
      expect(result).toBeNull();
    });

    it('should return null for tabs-only string', () => {
      const result = processProfilePhotoUrl({ photoUrl: '\t\t' });
      expect(result).toBeNull();
    });

    it('should return null for newline-only string', () => {
      const result = processProfilePhotoUrl({ photoUrl: '\n\n' });
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // Non-String Input - Returns Null
  // ============================================================================
  describe('non-string input (returns null)', () => {
    it('should return null for number', () => {
      const result = processProfilePhotoUrl({ photoUrl: 123 });
      expect(result).toBeNull();
    });

    it('should return null for object', () => {
      const result = processProfilePhotoUrl({ photoUrl: { url: 'test' } });
      expect(result).toBeNull();
    });

    it('should return null for array', () => {
      const result = processProfilePhotoUrl({ photoUrl: ['https://example.com/photo.jpg'] });
      expect(result).toBeNull();
    });

    it('should return null for boolean', () => {
      const result = processProfilePhotoUrl({ photoUrl: true });
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // XSS Prevention - Invalid Protocols
  // ============================================================================
  describe('XSS prevention (invalid protocols return null)', () => {
    it('should return null for javascript: protocol', () => {
      const result = processProfilePhotoUrl({
        photoUrl: 'javascript:alert(1)'
      });
      expect(result).toBeNull();
    });

    it('should return null for data: protocol', () => {
      const result = processProfilePhotoUrl({
        photoUrl: 'data:image/png;base64,iVBORw0KGgo='
      });
      expect(result).toBeNull();
    });

    it('should return null for vbscript: protocol', () => {
      const result = processProfilePhotoUrl({
        photoUrl: 'vbscript:msgbox("XSS")'
      });
      expect(result).toBeNull();
    });

    it('should return null for file: protocol', () => {
      const result = processProfilePhotoUrl({
        photoUrl: 'file:///etc/passwd'
      });
      expect(result).toBeNull();
    });

    it('should return null for relative path', () => {
      const result = processProfilePhotoUrl({
        photoUrl: '/images/photo.jpg'
      });
      expect(result).toBeNull();
    });

    it('should return null for just filename', () => {
      const result = processProfilePhotoUrl({
        photoUrl: 'photo.jpg'
      });
      expect(result).toBeNull();
    });

    it('should return null for ftp: protocol', () => {
      const result = processProfilePhotoUrl({
        photoUrl: 'ftp://example.com/photo.jpg'
      });
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // Whitespace Trimming
  // ============================================================================
  describe('whitespace trimming', () => {
    it('should trim leading whitespace from valid URL', () => {
      const result = processProfilePhotoUrl({
        photoUrl: '  https://example.com/photo.jpg'
      });
      expect(result).toBe('https://example.com/photo.jpg');
    });

    it('should trim trailing whitespace from valid URL', () => {
      const result = processProfilePhotoUrl({
        photoUrl: 'https://example.com/photo.jpg  '
      });
      expect(result).toBe('https://example.com/photo.jpg');
    });

    it('should trim both leading and trailing whitespace', () => {
      const result = processProfilePhotoUrl({
        photoUrl: '  https://example.com/photo.jpg  '
      });
      expect(result).toBe('https://example.com/photo.jpg');
    });

    it('should trim whitespace from protocol-relative URL', () => {
      const result = processProfilePhotoUrl({
        photoUrl: '  //example.com/photo.jpg  '
      });
      expect(result).toBe('https://example.com/photo.jpg');
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should handle Supabase storage URL', () => {
      const result = processProfilePhotoUrl({
        photoUrl: 'https://xyz.supabase.co/storage/v1/object/public/avatars/user123.jpg'
      });
      expect(result).toBe('https://xyz.supabase.co/storage/v1/object/public/avatars/user123.jpg');
    });

    it('should handle Cloudinary URL', () => {
      const result = processProfilePhotoUrl({
        photoUrl: 'https://res.cloudinary.com/demo/image/upload/v1234/sample.jpg'
      });
      expect(result).toBe('https://res.cloudinary.com/demo/image/upload/v1234/sample.jpg');
    });

    it('should handle Gravatar URL', () => {
      const result = processProfilePhotoUrl({
        photoUrl: 'https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50'
      });
      expect(result).toBe('https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50');
    });

    it('should handle Bubble.io CDN URL', () => {
      const result = processProfilePhotoUrl({
        photoUrl: '//d1muf25xaso8hp.cloudfront.net/photo.jpg'
      });
      expect(result).toBe('https://d1muf25xaso8hp.cloudfront.net/photo.jpg');
    });

    it('should handle user with no profile photo', () => {
      const result = processProfilePhotoUrl({ photoUrl: '' });
      expect(result).toBeNull();
    });
  });
});
