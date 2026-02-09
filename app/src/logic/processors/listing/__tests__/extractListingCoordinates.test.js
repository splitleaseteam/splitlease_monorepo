/**
 * Tests for extractListingCoordinates
 *
 * Extract coordinates from listing's JSONB location fields.
 * Priority: map_pin_offset_address_json (privacy) → address_with_lat_lng_json (main).
 * Coordinates must fall within NYC metro area bounds.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractListingCoordinates } from '../extractListingCoordinates.js';

// NYC bounds for reference (from constants.js):
// Lat: 40.4774 to 40.9176
// Lng: -74.2591 to -73.7004

// Valid NYC coordinates
const VALID_NYC_COORDS = { lat: 40.7128, lng: -74.0060 }; // Manhattan
const VALID_NYC_COORDS_2 = { lat: 40.6782, lng: -73.9442 }; // Brooklyn
const VALID_NYC_COORDS_BRONX = { lat: 40.8448, lng: -73.8648 }; // Bronx

// Invalid coordinates (outside NYC)
const INVALID_COORDS_ZERO = { lat: 0, lng: 0 }; // Null Island
const INVALID_COORDS_LA = { lat: 34.0522, lng: -118.2437 }; // Los Angeles
const INVALID_COORDS_LONDON = { lat: 51.5074, lng: -0.1278 }; // London

describe('extractListingCoordinates', () => {
  // Suppress console warnings/errors during tests
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Happy Path - Priority: Slightly Different Address
  // ============================================================================
  describe('priority: slightly different address', () => {
    it('should use slightly different address when both available', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: VALID_NYC_COORDS,
        locationAddress: VALID_NYC_COORDS_2,
        listingId: 'listing_123'
      });

      expect(result).toEqual({
        lat: VALID_NYC_COORDS.lat,
        lng: VALID_NYC_COORDS.lng,
        source: 'slightly-different-address'
      });
    });

    it('should use slightly different address when only that is available', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: VALID_NYC_COORDS,
        locationAddress: null,
        listingId: 'listing_123'
      });

      expect(result).toEqual({
        lat: VALID_NYC_COORDS.lat,
        lng: VALID_NYC_COORDS.lng,
        source: 'slightly-different-address'
      });
    });
  });

  // ============================================================================
  // Fallback: Main Address
  // ============================================================================
  describe('fallback: main address', () => {
    it('should use main address when slightly different is null', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: null,
        locationAddress: VALID_NYC_COORDS,
        listingId: 'listing_123'
      });

      expect(result).toEqual({
        lat: VALID_NYC_COORDS.lat,
        lng: VALID_NYC_COORDS.lng,
        source: 'main-address'
      });
    });

    it('should use main address when slightly different is undefined', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: undefined,
        locationAddress: VALID_NYC_COORDS,
        listingId: 'listing_123'
      });

      expect(result).toEqual({
        lat: VALID_NYC_COORDS.lat,
        lng: VALID_NYC_COORDS.lng,
        source: 'main-address'
      });
    });

    it('should use main address when slightly different is outside NYC', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: INVALID_COORDS_LA,
        locationAddress: VALID_NYC_COORDS,
        listingId: 'listing_123'
      });

      expect(result).toEqual({
        lat: VALID_NYC_COORDS.lat,
        lng: VALID_NYC_COORDS.lng,
        source: 'main-address'
      });
    });
  });

  // ============================================================================
  // JSON String Parsing
  // ============================================================================
  describe('JSON string parsing', () => {
    it('should parse JSON string for slightly different address', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: JSON.stringify(VALID_NYC_COORDS),
        locationAddress: null,
        listingId: 'listing_123'
      });

      expect(result).toEqual({
        lat: VALID_NYC_COORDS.lat,
        lng: VALID_NYC_COORDS.lng,
        source: 'slightly-different-address'
      });
    });

    it('should parse JSON string for main address', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: null,
        locationAddress: JSON.stringify(VALID_NYC_COORDS),
        listingId: 'listing_123'
      });

      expect(result).toEqual({
        lat: VALID_NYC_COORDS.lat,
        lng: VALID_NYC_COORDS.lng,
        source: 'main-address'
      });
    });

    it('should handle invalid JSON string gracefully', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: 'not valid json',
        locationAddress: VALID_NYC_COORDS,
        listingId: 'listing_123'
      });

      expect(result).toEqual({
        lat: VALID_NYC_COORDS.lat,
        lng: VALID_NYC_COORDS.lng,
        source: 'main-address'
      });
    });

    it('should log error for invalid JSON', () => {
      extractListingCoordinates({
        locationSlightlyDifferent: 'invalid json',
        locationAddress: VALID_NYC_COORDS,
        listingId: 'listing_123'
      });

      expect(console.error).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // NYC Bounds Validation
  // ============================================================================
  describe('NYC bounds validation', () => {
    it('should reject Null Island (0, 0)', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: INVALID_COORDS_ZERO,
        locationAddress: INVALID_COORDS_ZERO,
        listingId: 'listing_123'
      });

      expect(result).toBeNull();
    });

    it('should reject Los Angeles coordinates', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: INVALID_COORDS_LA,
        locationAddress: null,
        listingId: 'listing_123'
      });

      expect(result).toBeNull();
    });

    it('should reject London coordinates', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: INVALID_COORDS_LONDON,
        locationAddress: null,
        listingId: 'listing_123'
      });

      expect(result).toBeNull();
    });

    it('should accept Manhattan coordinates', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: VALID_NYC_COORDS,
        locationAddress: null,
        listingId: 'listing_123'
      });

      expect(result).not.toBeNull();
      expect(result.lat).toBe(VALID_NYC_COORDS.lat);
    });

    it('should accept Brooklyn coordinates', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: VALID_NYC_COORDS_2,
        locationAddress: null,
        listingId: 'listing_123'
      });

      expect(result).not.toBeNull();
      expect(result.lat).toBe(VALID_NYC_COORDS_2.lat);
    });

    it('should accept Bronx coordinates', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: VALID_NYC_COORDS_BRONX,
        locationAddress: null,
        listingId: 'listing_123'
      });

      expect(result).not.toBeNull();
      expect(result.lat).toBe(VALID_NYC_COORDS_BRONX.lat);
    });
  });

  // ============================================================================
  // Error Handling - listingId Validation
  // ============================================================================
  describe('error handling - listingId validation', () => {
    it('should throw error for null listingId', () => {
      expect(() => extractListingCoordinates({
        locationSlightlyDifferent: VALID_NYC_COORDS,
        locationAddress: null,
        listingId: null
      })).toThrow('listingId is required and must be a string');
    });

    it('should throw error for undefined listingId', () => {
      expect(() => extractListingCoordinates({
        locationSlightlyDifferent: VALID_NYC_COORDS,
        locationAddress: null,
        listingId: undefined
      })).toThrow('listingId is required and must be a string');
    });

    it('should throw error for empty string listingId', () => {
      expect(() => extractListingCoordinates({
        locationSlightlyDifferent: VALID_NYC_COORDS,
        locationAddress: null,
        listingId: ''
      })).toThrow('listingId is required and must be a string');
    });

    it('should throw error for non-string listingId (number)', () => {
      expect(() => extractListingCoordinates({
        locationSlightlyDifferent: VALID_NYC_COORDS,
        locationAddress: null,
        listingId: 123
      })).toThrow('listingId is required and must be a string');
    });

    it('should throw error for non-string listingId (object)', () => {
      expect(() => extractListingCoordinates({
        locationSlightlyDifferent: VALID_NYC_COORDS,
        locationAddress: null,
        listingId: { id: 'listing_123' }
      })).toThrow('listingId is required and must be a string');
    });
  });

  // ============================================================================
  // No Coordinates Found (Return Null)
  // ============================================================================
  describe('no coordinates found (return null)', () => {
    it('should return null when both locations are null', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: null,
        locationAddress: null,
        listingId: 'listing_123'
      });

      expect(result).toBeNull();
    });

    it('should return null when both locations are undefined', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: undefined,
        locationAddress: undefined,
        listingId: 'listing_123'
      });

      expect(result).toBeNull();
    });

    it('should return null when both locations are outside NYC', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: INVALID_COORDS_LA,
        locationAddress: INVALID_COORDS_LONDON,
        listingId: 'listing_123'
      });

      expect(result).toBeNull();
    });

    it('should log warning when no valid coordinates found', () => {
      extractListingCoordinates({
        locationSlightlyDifferent: null,
        locationAddress: null,
        listingId: 'listing_123'
      });

      expect(console.warn).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Output Structure Verification
  // ============================================================================
  describe('output structure verification', () => {
    it('should return object with lat, lng, and source properties', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: VALID_NYC_COORDS,
        locationAddress: null,
        listingId: 'listing_123'
      });

      expect(result).toHaveProperty('lat');
      expect(result).toHaveProperty('lng');
      expect(result).toHaveProperty('source');
    });

    it('should have numeric lat and lng', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: VALID_NYC_COORDS,
        locationAddress: null,
        listingId: 'listing_123'
      });

      expect(typeof result.lat).toBe('number');
      expect(typeof result.lng).toBe('number');
    });

    it('should have string source', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: VALID_NYC_COORDS,
        locationAddress: null,
        listingId: 'listing_123'
      });

      expect(typeof result.source).toBe('string');
    });

    it('should have source "slightly-different-address" when using priority location', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: VALID_NYC_COORDS,
        locationAddress: VALID_NYC_COORDS_2,
        listingId: 'listing_123'
      });

      expect(result.source).toBe('slightly-different-address');
    });

    it('should have source "main-address" when using fallback location', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: null,
        locationAddress: VALID_NYC_COORDS,
        listingId: 'listing_123'
      });

      expect(result.source).toBe('main-address');
    });
  });

  // ============================================================================
  // Real-World Scenarios
  // ============================================================================
  describe('real-world scenarios', () => {
    it('should handle typical listing with both addresses', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: { lat: 40.7589, lng: -73.9851 }, // Times Square area
        locationAddress: { lat: 40.7580, lng: -73.9855 }, // Slightly different
        listingId: '1703456789012345678'
      });

      expect(result.source).toBe('slightly-different-address');
    });

    it('should handle listing from Supabase with JSON strings', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: '{"lat":40.7128,"lng":-74.0060}',
        locationAddress: '{"lat":40.7130,"lng":-74.0058}',
        listingId: '1703456789012345678'
      });

      expect(result).not.toBeNull();
      expect(result.lat).toBe(40.7128);
    });

    it('should handle legacy listing with only main address', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: null,
        locationAddress: { lat: 40.6782, lng: -73.9442 },
        listingId: '1703456789012345678'
      });

      expect(result.source).toBe('main-address');
    });

    it('should handle listing with corrupted location data', () => {
      const result = extractListingCoordinates({
        locationSlightlyDifferent: 'corrupted data',
        locationAddress: { lat: 40.7128, lng: -74.0060 },
        listingId: '1703456789012345678'
      });

      expect(result).not.toBeNull();
      expect(result.source).toBe('main-address');
    });
  });
});
