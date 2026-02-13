/**
 * Listings Overview API Layer
 *
 * Direct Supabase queries for the Listings Overview page.
 * Uses JOINs to reference tables for borough/neighborhood names.
 *
 * IMPORTANT: All updates use the changed-fields-only pattern
 * to avoid FK constraint violations on the listing table.
 */

import { supabase } from '../../../lib/supabase.js';
import { PAGE_SIZE } from './constants.js';

// ============================================================================
// GEOGRAPHIC REFERENCE DATA (Hardcoded for NYC)
// ============================================================================

/**
 * NYC Boroughs - Static data mapped to Bubble.io IDs from the database.
 * These IDs match the values stored in listing.borough.
 *
 * Mapping derived from actual database records:
 * - Manhattan: 149 listings
 * - Brooklyn: 31 listings
 * - Queens: 9 listings
 * - Bronx: 3 listings
 * - Jersey City/Newark: included for completeness (NJ properties in system)
 */
const NYC_BOROUGHS = [
  { id: '1607041299715x741251947580746200', name: 'Bronx' },
  { id: '1607041299637x913970439175620100', name: 'Brooklyn' },
  { id: '1686599616073x348655546878883200', name: 'Jersey City, NJ' },
  { id: '1607041299687x679479834266385900', name: 'Manhattan' },
  { id: '1686674905048x436838997624262400', name: 'Newark, NJ' },
  { id: '1607041299828x406969561802059650', name: 'Queens' },
];

/**
 * Get all NYC boroughs.
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function getBoroughs() {
  // Return hardcoded NYC boroughs - no database query needed
  return NYC_BOROUGHS;
}

/**
 * Get neighborhoods - returns empty array for now.
 * Neighborhood filtering is optional and tables don't exist yet.
 * @param {string|null} boroughId - Optional borough ID to filter by (unused)
 * @returns {Promise<Array<{id: string, name: string, boroughId: string}>>}
 */
export async function getNeighborhoods(boroughId = null) {
  // Neighborhood tables don't exist - return empty array
  // This is intentional: neighborhood filtering is optional
  return [];
}

// ============================================================================
// LISTINGS QUERIES
// ============================================================================

/**
 * Fetch listings with filters and pagination.
 * Joins to reference tables to get human-readable borough/neighborhood names.
 *
 * @param {Object} options
 * @param {Object} options.filters - Filter state object
 * @param {number} options.page - Page number (1-indexed)
 * @param {number} options.pageSize - Items per page
 * @returns {Promise<{data: Array, count: number, error: Error|null}>}
 */
export async function getListings({ filters, page = 1, pageSize = PAGE_SIZE }) {
  // Build the query with JOINs to reference tables
  // Note: Supabase doesn't support cross-schema JOINs directly in the JS client,
  // so we fetch listings first, then resolve names in a second query.

  // Note: Column names from Bubble migration include emoji prefixes for pricing
  // Host phone is not on listing table - it's on the user table (via host_user_id FK)
  let query = supabase
    .from('listing')
    .select(`
      id,
      listing_title,
      "Description",
      host_user_id,
      "Host email",
      host_display_name,
      borough,
      primary_neighborhood_reference_id,
      nightly_rate_for_1_night_stay,
      nightly_rate_for_3_night_stay,
      price_override,
      is_active,
      is_approved,
      is_listing_profile_complete,
      pending,
      is_deleted,
      is_usability_test_listing,
      is_showcase,
      photos_with_urls_captions_and_sort_order_json,
      in_unit_amenity_reference_ids_json,
      "Errors",
      original_updated_at,
      original_created_at,
      "Listing Code OP"
    `, { count: 'exact' });

  // Exclude deleted listings by default
  query = query.or('is_deleted.is.null,is_deleted.eq.false');

  // Apply filters
  if (filters.showOnlyAvailable) {
    query = query.eq('is_active', true).eq('is_approved', true);
  }

  if (filters.completedListings && !filters.notFinishedListings) {
    query = query.eq('is_listing_profile_complete', true);
  } else if (filters.notFinishedListings && !filters.completedListings) {
    query = query.or('is_listing_profile_complete.is.null,is_listing_profile_complete.eq.false');
  }

  if (filters.selectedBorough) {
    query = query.eq('borough', filters.selectedBorough);
  }

  if (filters.selectedNeighborhood) {
    query = query.eq('primary_neighborhood_reference_id', filters.selectedNeighborhood);
  }

  if (filters.searchQuery) {
    const searchTerm = `%${filters.searchQuery}%`;
    query = query.or(`listing_title.ilike.${searchTerm},"Host email".ilike.${searchTerm},host_display_name.ilike.${searchTerm},"Listing Code OP".ilike.${searchTerm}`);
  }

  if (filters.showAllFilter === 'active') {
    query = query.eq('is_active', true);
  } else if (filters.showAllFilter === 'inactive') {
    query = query.or('is_active.is.null,is_active.eq.false');
  } else if (filters.showAllFilter === 'showcase') {
    query = query.eq('is_showcase', true);
  } else if (filters.showAllFilter === 'usability') {
    query = query.eq('is_usability_test_listing', true);
  }

  if (filters.startDate) {
    query = query.gte('original_updated_at', filters.startDate.toISOString());
  }

  if (filters.endDate) {
    query = query.lte('original_updated_at', filters.endDate.toISOString());
  }

  // Pagination
  const from = (page - 1) * pageSize;
  query = query
    .order('original_updated_at', { ascending: false })
    .range(from, from + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[ListingsOverview] Failed to fetch listings:', error);
    return { data: [], count: 0, error };
  }

  return { data: data || [], count: count || 0, error: null };
}

/**
 * Resolve borough and neighborhood names for a list of listings.
 * Called after getListings to enrich data with display names.
 *
 * @param {Array} listings - Listings from getListings
 * @param {Array} boroughs - Borough lookup data
 * @param {Array} neighborhoods - Neighborhood lookup data
 * @returns {Array} Listings with resolved borough/neighborhood names
 */
export function resolveLocationNames(listings, boroughs, neighborhoods) {
  const boroughMap = new Map(boroughs.map(b => [b.id, b.name]));
  const neighborhoodMap = new Map(neighborhoods.map(n => [n.id, n.name]));

  return listings.map(listing => ({
    ...listing,
    boroughName: boroughMap.get(listing.borough) || 'Unknown',
    neighborhoodName: neighborhoodMap.get(listing.primary_neighborhood_reference_id) || 'Unknown',
  }));
}

// ============================================================================
// LISTING UPDATES
// ============================================================================

/**
 * Update a listing. ONLY sends changed fields to avoid FK constraint violations.
 *
 * @param {string} id - Listing ID
 * @param {Object} changes - Object containing only the fields to update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateListing(id, changes) {
  // Add timestamp
  const updatePayload = {
    ...changes,
    original_updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('listing')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[ListingsOverview] Failed to update listing:', {
      id,
      changes,
      error: { code: error.code, message: error.message, details: error.details, hint: error.hint },
    });
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Soft delete a listing by setting is_deleted = true.
 *
 * @param {string} id - Listing ID
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function deleteListing(id) {
  const { error } = await supabase
    .from('listing')
    .update({
      is_deleted: true,
      original_updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('[ListingsOverview] Failed to delete listing:', error);
    return { success: false, error };
  }

  return { success: true, error: null };
}

// ============================================================================
// ERROR MANAGEMENT
// ============================================================================

/**
 * Add an error to a listing's Errors JSONB array.
 *
 * @param {string} listingId - Listing ID
 * @param {string} errorCode - Error code or message to add
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function addError(listingId, errorCode) {
  // First, get current errors
  const { data: listing, error: fetchError } = await supabase
    .from('listing')
    .select('errors')
    .eq('id', listingId)
    .maybeSingle();

  if (fetchError) {
    console.error('[ListingsOverview] Failed to fetch listing for error add:', fetchError);
    return { data: null, error: fetchError };
  }

  const currentErrors = listing?.errors || [];

  // Check if error already exists
  if (currentErrors.includes(errorCode)) {
    return { data: listing, error: null };
  }

  // Add new error
  const updatedErrors = [...currentErrors, errorCode];

  const { data, error } = await supabase
    .from('listing')
    .update({
      errors: updatedErrors,
      original_updated_at: new Date().toISOString(),
    })
    .eq('id', listingId)
    .select()
    .single();

  if (error) {
    console.error('[ListingsOverview] Failed to add error:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Clear all errors from a listing.
 *
 * @param {string} listingId - Listing ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function clearErrors(listingId) {
  const { data, error } = await supabase
    .from('listing')
    .update({
      errors: [],
      original_updated_at: new Date().toISOString(),
    })
    .eq('id', listingId)
    .select()
    .single();

  if (error) {
    console.error('[ListingsOverview] Failed to clear errors:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk increment prices for multiple listings.
 * Updates both nightly rate and 3-night rate.
 *
 * @param {Array<string>} listingIds - Array of listing IDs
 * @param {number} multiplier - Price multiplier (e.g., 1.75 for 75% increase)
 * @returns {Promise<{results: Array, successCount: number, failCount: number}>}
 */
export async function bulkIncrementPrices(listingIds, multiplier) {
  const results = [];

  for (const id of listingIds) {
    // Fetch current prices (note: column names have emoji prefixes from Bubble)
    const { data: listing, error: fetchError } = await supabase
      .from('listing')
      .select('nightly_rate_for_1_night_stay, nightly_rate_for_3_night_stay')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      results.push({ id, success: false, error: fetchError.message });
      continue;
    }

    const currentNightly = listing.nightly_rate_for_1_night_stay || 0;
    const current3Night = listing.nightly_rate_for_3_night_stay || 0;

    // Calculate new prices
    const newNightly = Math.round(currentNightly * multiplier * 100) / 100;
    const new3Night = Math.round(current3Night * multiplier * 100) / 100;

    // Update (only price fields to avoid FK issues)
    const { error: updateError } = await supabase
      .from('listing')
      .update({
        'nightly_rate_for_1_night_stay': newNightly,
        'nightly_rate_for_3_night_stay': new3Night,
        original_updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      results.push({ id, success: false, error: updateError.message });
    } else {
      results.push({ id, success: true, newNightly, new3Night });
    }
  }

  return {
    results,
    successCount: results.filter(r => r.success).length,
    failCount: results.filter(r => !r.success).length,
  };
}
