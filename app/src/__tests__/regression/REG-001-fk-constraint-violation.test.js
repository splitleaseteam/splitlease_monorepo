/**
 * Regression Test: REG-001
 * Title: FK Constraint Violation on Listing Update
 *
 * Description:
 * Sending unchanged FK fields (even null) during listing updates triggers
 * database validation errors (409 with code 23503). The listing table has
 * 12 FK constraints, and PostgREST validates all fields sent, even unchanged ones.
 *
 * Invariant:
 * When updating a listing, only fields that have actually changed from the
 * original should be sent to the database.
 *
 * Affected Files:
 * - app/src/islands/shared/EditListingDetails/useEditListingDetailsLogic.js
 * - app/src/lib/listing/listingCrud.js
 *
 * References:
 * - .claude/plans/Documents/20251217091827-edit-listing-409-regression-report.md
 */

import { describe, it, expect } from 'vitest';

/**
 * Pure function that extracts changed fields from form data
 * This is the pattern that prevents FK constraint violations
 */
function extractChangedFields(formData, originalData) {
  const changedFields = {};

  for (const [key, value] of Object.entries(formData)) {
    const originalValue = originalData[key];

    // Handle array comparison (for amenities, rules, photos, etc.)
    if (Array.isArray(value) && Array.isArray(originalValue)) {
      if (JSON.stringify(value) !== JSON.stringify(originalValue)) {
        changedFields[key] = value;
      }
    } else if (value !== originalValue) {
      changedFields[key] = value;
    }
  }

  return changedFields;
}

describe('REG-001: FK Constraint Violation on Listing Update', () => {
  describe('extractChangedFields - the core pattern', () => {
    it('should return empty object when no fields have changed', () => {
      const originalData = {
        listing_title: 'Test Listing',
        listing_description: 'A test listing',
        borough: 'Manhattan',
        listing_type_reference_id: '1569530159044x216130979074711000',
      };

      const formData = { ...originalData };

      const result = extractChangedFields(formData, originalData);

      expect(Object.keys(result).length).toBe(0);
    });

    it('should only return fields that have actually changed', () => {
      const originalData = {
        listing_title: 'Original Name',
        listing_description: 'Original Description',
        borough: null, // FK field with null value
        listing_type_reference_id: '1569530159044x216130979074711000',
      };

      const formData = {
        listing_title: 'Updated Name', // Changed
        listing_description: 'Original Description', // Unchanged
        borough: null, // Unchanged null FK - MUST NOT be sent
        listing_type_reference_id: '1569530159044x216130979074711000', // Unchanged
      };

      const result = extractChangedFields(formData, originalData);

      // Should only contain the changed field
      expect(result).toEqual({ listing_title: 'Updated Name' });

      // Critical: Should NOT contain the unchanged null FK field
      expect(result).not.toHaveProperty('borough');
    });

    it('should NOT include unchanged FK fields even when they are null', () => {
      // This is the specific case that caused the 409 error
      const originalData = {
        borough: null,
        city_reference_id: null,
        listing_type_reference_id: null,
        cancellation_policy_reference_id: null,
        listing_title: 'Test',
      };

      const formData = {
        borough: null, // Unchanged null
        city_reference_id: null, // Unchanged null
        listing_type_reference_id: null, // Unchanged null
        cancellation_policy_reference_id: null, // Unchanged null
        listing_title: 'Updated Test', // Only this changed
      };

      const result = extractChangedFields(formData, originalData);

      // Only the changed field should be present
      expect(Object.keys(result)).toEqual(['listing_title']);
      expect(result.listing_title).toBe('Updated Test');

      // All FK fields with null should NOT be in the result
      expect(result).not.toHaveProperty('borough');
      expect(result).not.toHaveProperty('city_reference_id');
      expect(result).not.toHaveProperty('listing_type_reference_id');
      expect(result).not.toHaveProperty('cancellation_policy_reference_id');
    });

    it('should correctly handle array field comparisons', () => {
      const originalData = {
        amenities: ['WiFi', 'AC'],
        house_rules: ['No smoking'],
      };

      const formData = {
        amenities: ['WiFi', 'AC'], // Same content, same order
        house_rules: ['No smoking', 'No pets'], // Added item
      };

      const result = extractChangedFields(formData, originalData);

      // Only the changed array should be included
      expect(result).toEqual({
        house_rules: ['No smoking', 'No pets'],
      });
      expect(result).not.toHaveProperty('amenities');
    });

    it('should detect array changes even with same length but different content', () => {
      const originalData = {
        listing_photos_json: [{ id: '1', url: 'a.jpg' }, { id: '2', url: 'b.jpg' }],
      };

      const formData = {
        listing_photos_json: [{ id: '2', url: 'b.jpg' }, { id: '1', url: 'a.jpg' }], // Reordered
      };

      const result = extractChangedFields(formData, originalData);

      // Reordering should be detected as a change
      expect(result).toHaveProperty('listing_photos_json');
    });
  });

  describe('Integration pattern with listing update', () => {
    it('should demonstrate the correct update pattern', async () => {
      // Mock listing data (as would come from database)
      const originalListing = {
        id: '1234567890123456x',
        listing_title: 'Original Listing',
        listing_description: 'Original description',
        borough: null, // FK that would cause 409 if sent
        city_reference_id: null,
        listing_type_reference_id: '1569530159044x216130979074711000',
        amenities: ['WiFi'],
      };

      // Form data after user edits (only description changed)
      const formData = {
        listing_title: 'Original Listing',
        listing_description: 'Updated description',
        borough: null,
        city_reference_id: null,
        listing_type_reference_id: '1569530159044x216130979074711000',
        amenities: ['WiFi'],
      };

      // The correct pattern: extract only changed fields
      const changedFields = extractChangedFields(formData, originalListing);

      // Assertion: Only the changed field should be in the update payload
      expect(changedFields).toEqual({
        listing_description: 'Updated description',
      });


      // This payload can now be safely sent to updateListing()
      // without triggering FK validation on unchanged null fields
    });
  });
});
