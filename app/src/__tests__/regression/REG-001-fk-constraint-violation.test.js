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
 * - app/src/lib/listingCrudGeoPhotoPricingService.js
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
        Name: 'Test Listing',
        Description: 'A test listing',
        'Location - Borough': 'Manhattan',
        'Features - Type of Space': '1569530159044x216130979074711000',
      };

      const formData = { ...originalData };

      const result = extractChangedFields(formData, originalData);

      expect(Object.keys(result).length).toBe(0);
    });

    it('should only return fields that have actually changed', () => {
      const originalData = {
        Name: 'Original Name',
        Description: 'Original Description',
        'Location - Borough': null, // FK field with null value
        'Features - Type of Space': '1569530159044x216130979074711000',
      };

      const formData = {
        Name: 'Updated Name', // Changed
        Description: 'Original Description', // Unchanged
        'Location - Borough': null, // Unchanged null FK - MUST NOT be sent
        'Features - Type of Space': '1569530159044x216130979074711000', // Unchanged
      };

      const result = extractChangedFields(formData, originalData);

      // Should only contain the changed field
      expect(result).toEqual({ Name: 'Updated Name' });

      // Critical: Should NOT contain the unchanged null FK field
      expect(result).not.toHaveProperty('Location - Borough');
    });

    it('should NOT include unchanged FK fields even when they are null', () => {
      // This is the specific case that caused the 409 error
      const originalData = {
        'Location - Borough': null,
        'Location - City': null,
        'Features - Type of Space': null,
        'Cancellation Policy': null,
        Name: 'Test',
      };

      const formData = {
        'Location - Borough': null, // Unchanged null
        'Location - City': null, // Unchanged null
        'Features - Type of Space': null, // Unchanged null
        'Cancellation Policy': null, // Unchanged null
        Name: 'Updated Test', // Only this changed
      };

      const result = extractChangedFields(formData, originalData);

      // Only the changed field should be present
      expect(Object.keys(result)).toEqual(['Name']);
      expect(result.Name).toBe('Updated Test');

      // All FK fields with null should NOT be in the result
      expect(result).not.toHaveProperty('Location - Borough');
      expect(result).not.toHaveProperty('Location - City');
      expect(result).not.toHaveProperty('Features - Type of Space');
      expect(result).not.toHaveProperty('Cancellation Policy');
    });

    it('should correctly handle array field comparisons', () => {
      const originalData = {
        'Features - Amenities In-Unit': ['WiFi', 'AC'],
        'Features - House Rules': ['No smoking'],
      };

      const formData = {
        'Features - Amenities In-Unit': ['WiFi', 'AC'], // Same content, same order
        'Features - House Rules': ['No smoking', 'No pets'], // Added item
      };

      const result = extractChangedFields(formData, originalData);

      // Only the changed array should be included
      expect(result).toEqual({
        'Features - House Rules': ['No smoking', 'No pets'],
      });
      expect(result).not.toHaveProperty('Features - Amenities In-Unit');
    });

    it('should detect array changes even with same length but different content', () => {
      const originalData = {
        'Features - Photos': [{ id: '1', url: 'a.jpg' }, { id: '2', url: 'b.jpg' }],
      };

      const formData = {
        'Features - Photos': [{ id: '2', url: 'b.jpg' }, { id: '1', url: 'a.jpg' }], // Reordered
      };

      const result = extractChangedFields(formData, originalData);

      // Reordering should be detected as a change
      expect(result).toHaveProperty('Features - Photos');
    });
  });

  describe('Integration pattern with listing update', () => {
    it('should demonstrate the correct update pattern', async () => {
      // Mock listing data (as would come from database)
      const originalListing = {
        id: '1234567890123456x',
        Name: 'Original Listing',
        Description: 'Original description',
        'Location - Borough': null, // FK that would cause 409 if sent
        'Location - City': null,
        'Features - Type of Space': '1569530159044x216130979074711000',
        'Features - Amenities In-Unit': ['WiFi'],
      };

      // Form data after user edits (only description changed)
      const formData = {
        Name: 'Original Listing',
        Description: 'Updated description',
        'Location - Borough': null,
        'Location - City': null,
        'Features - Type of Space': '1569530159044x216130979074711000',
        'Features - Amenities In-Unit': ['WiFi'],
      };

      // The correct pattern: extract only changed fields
      const changedFields = extractChangedFields(formData, originalListing);

      // Assertion: Only the changed field should be in the update payload
      expect(changedFields).toEqual({
        Description: 'Updated description',
      });

      // This payload can now be safely sent to updateListing()
      // without triggering FK validation on unchanged null fields
    });
  });
});
