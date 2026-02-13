/**
 * Listing Service - Backwards Compatibility Re-export Layer
 *
 * This file has been split into focused modules under lib/listing/:
 * - geoLookup.js: Geocoding and location lookup functions
 * - listingCrud.js: CRUD operations (create, update, delete, read)
 * - listingHelpers.js: Utility/helper functions for data mapping
 *
 * Import from 'lib/listing' for new code. This file re-exports
 * everything for backwards compatibility with existing imports.
 */

export {
  // Geo Lookup
  getBoroughIdByZipCode,
  getHoodIdByZipCode,
  getGeoIdsByZipCode,

  // CRUD Operations
  createListing,
  updateListing,
  getListingById,
  saveDraft,

  // Helpers / Mappers
  mapCancellationPolicyToId,
  mapParkingTypeToId,
  mapSpaceTypeToId,
  mapStorageOptionToId,
  mapStateToDisplayName,
  mapFormDataToListingTable,
  mapAvailableNightsToNames,
  mapFormDataToListingTableForUpdate,
  isFlatDatabaseFormat,
  normalizeDatabaseColumns,
  mapDatabaseToFormData,
  mapAvailableNightsToArray,
  mapNightlyRatesToColumns,
  mapArrayToAvailableNights,
} from './listing/index.js';
