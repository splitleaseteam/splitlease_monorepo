/**
 * Tests for hasProfilePhoto
 *
 * Determines if a user has a valid profile photo URL.
 * A profile photo is valid if the URL is a non-empty string.
 */
import { describe, it, expect } from 'vitest';
import { hasProfilePhoto } from '../hasProfilePhoto.js';

describe('hasProfilePhoto', () => {
  // ============================================================================
  // Has Photo (Returns True)
  // ============================================================================
  describe('has photo (returns true)', () => {
    it('should return true for https URL', () => {
      const result = hasProfilePhoto({
        photoUrl: 'https://example.com/photo.jpg'
      });
      expect(result).toBe(true);
    });

    it('should return true for http URL', () => {
      const result = hasProfilePhoto({
        photoUrl: 'http://example.com/photo.jpg'
      });
      expect(result).toBe(true);
    });

    it('should return true for protocol-relative URL', () => {
      const result = hasProfilePhoto({
        photoUrl: '//example.com/photo.jpg'
      });
      expect(result).toBe(true);
    });

    it('should return true for relative path', () => {
      const result = hasProfilePhoto({
        photoUrl: '/images/photo.jpg'
      });
      expect(result).toBe(true);
    });

    it('should return true for any non-empty string', () => {
      const result = hasProfilePhoto({
        photoUrl: 'photo'
      });
      expect(result).toBe(true);
    });

    it('should return true for URL with query parameters', () => {
      const result = hasProfilePhoto({
        photoUrl: 'https://example.com/photo.jpg?size=large'
      });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // No Photo (Returns False) - Null/Undefined
  // ============================================================================
  describe('no photo - null/undefined (returns false)', () => {
    it('should return false for null photoUrl', () => {
      const result = hasProfilePhoto({ photoUrl: null });
      expect(result).toBe(false);
    });

    it('should return false for undefined photoUrl', () => {
      const result = hasProfilePhoto({ photoUrl: undefined });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // No Photo (Returns False) - Empty/Whitespace
  // ============================================================================
  describe('no photo - empty/whitespace (returns false)', () => {
    it('should return false for empty string', () => {
      const result = hasProfilePhoto({ photoUrl: '' });
      expect(result).toBe(false);
    });

    it('should return false for whitespace-only string', () => {
      const result = hasProfilePhoto({ photoUrl: '   ' });
      expect(result).toBe(false);
    });

    it('should return false for tab-only string', () => {
      const result = hasProfilePhoto({ photoUrl: '\t\t' });
      expect(result).toBe(false);
    });

    it('should return false for newline-only string', () => {
      const result = hasProfilePhoto({ photoUrl: '\n\n' });
      expect(result).toBe(false);
    });

    it('should return false for mixed whitespace', () => {
      const result = hasProfilePhoto({ photoUrl: ' \t \n ' });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // No Photo (Returns False) - Non-String Types
  // ============================================================================
  describe('no photo - non-string types (returns false)', () => {
    it('should return false for number', () => {
      const result = hasProfilePhoto({ photoUrl: 123 });
      expect(result).toBe(false);
    });

    it('should return false for object', () => {
      const result = hasProfilePhoto({ photoUrl: { url: 'test.jpg' } });
      expect(result).toBe(false);
    });

    it('should return false for array', () => {
      const result = hasProfilePhoto({ photoUrl: ['test.jpg'] });
      expect(result).toBe(false);
    });

    it('should return false for boolean true', () => {
      const result = hasProfilePhoto({ photoUrl: true });
      expect(result).toBe(false);
    });

    it('should return false for boolean false', () => {
      const result = hasProfilePhoto({ photoUrl: false });
      expect(result).toBe(false);
    });

    it('should return false for zero', () => {
      const result = hasProfilePhoto({ photoUrl: 0 });
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Whitespace Trimming
  // ============================================================================
  describe('whitespace trimming', () => {
    it('should return true for URL with leading whitespace (trimmed)', () => {
      const result = hasProfilePhoto({
        photoUrl: '  https://example.com/photo.jpg'
      });
      expect(result).toBe(true);
    });

    it('should return true for URL with trailing whitespace (trimmed)', () => {
      const result = hasProfilePhoto({
        photoUrl: 'https://example.com/photo.jpg  '
      });
      expect(result).toBe(true);
    });

    it('should return true for single character after trim', () => {
      const result = hasProfilePhoto({
        photoUrl: '  a  '
      });
      expect(result).toBe(true);
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should detect Supabase storage photo', () => {
      const result = hasProfilePhoto({
        photoUrl: 'https://xyz.supabase.co/storage/v1/object/public/avatars/user123.jpg'
      });
      expect(result).toBe(true);
    });

    it('should detect Gravatar photo', () => {
      const result = hasProfilePhoto({
        photoUrl: 'https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50'
      });
      expect(result).toBe(true);
    });

    it('should detect Bubble CDN photo', () => {
      const result = hasProfilePhoto({
        photoUrl: '//d1muf25xaso8hp.cloudfront.net/user_photo.jpg'
      });
      expect(result).toBe(true);
    });

    it('should handle user without uploaded photo', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        photoUrl: null
      };
      const result = hasProfilePhoto({ photoUrl: userData.photoUrl });
      expect(result).toBe(false);
    });

    it('should handle user with empty photo field from database', () => {
      const userData = {
        name: 'John Doe',
        photoUrl: '' // Empty string from database
      };
      const result = hasProfilePhoto({ photoUrl: userData.photoUrl });
      expect(result).toBe(false);
    });

    it('should conditionally show avatar based on hasProfilePhoto', () => {
      const userWithPhoto = { photoUrl: 'https://example.com/avatar.jpg' };
      const userWithoutPhoto = { photoUrl: null };

      expect(hasProfilePhoto({ photoUrl: userWithPhoto.photoUrl })).toBe(true);
      expect(hasProfilePhoto({ photoUrl: userWithoutPhoto.photoUrl })).toBe(false);
    });
  });
});
