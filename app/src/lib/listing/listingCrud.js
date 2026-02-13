/**
 * Listing CRUD Operations
 *
 * Create, read, update, and delete operations for the listing table.
 * Uses Supabase directly with generate_unique_id() RPC for ID generation.
 *
 * NO FALLBACK: If operation fails, we fail. No workarounds.
 */

import { supabase } from '../supabase.js';
import { getUserId } from '../secureStorage.js';
import { uploadPhotos } from '../photoUpload.js';
import { logger } from '../logger.js';
import { getGeoIdsByZipCode } from './geoLookup.js';
import {
  mapFormDataToListingTable,
  mapFormDataToListingTableForUpdate,
  isFlatDatabaseFormat,
  normalizeDatabaseColumns,
} from './listingHelpers.js';

/**
 * Create a new listing directly in the listing table
 *
 * Flow:
 * 1. Get current user ID from secure storage
 * 2. Generate unique id via RPC
 * 3. Upload photos to Supabase Storage
 * 4. Insert directly into listing table with id as primary key
 * 5. Link listing to user's listings_json array using id
 * 6. Return the complete listing
 *
 * @param {object} formData - Complete form data from SelfListingPage
 * @returns {Promise<object>} - Created listing with id
 */
export async function createListing(formData) {
  logger.debug('[ListingService] Creating listing directly in listing table');

  // Get current user ID from storage
  const storedUserId = getUserId();
  logger.debug('[ListingService] Stored user ID:', storedUserId);

  // Resolve user.id - this is used for BOTH "created_by_user_id" AND "host_user_id"
  // user.id is used directly as the host reference
  let userId = storedUserId;
  const isSupabaseUUID = storedUserId && storedUserId.includes('-');

  if (isSupabaseUUID) {
    logger.debug('[ListingService] Detected Supabase Auth UUID, resolving user.id by email...');
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user?.email) {
      // Fetch user.id - this is all we need since user.id = host account ID
      // Note: Some users have email in 'email' column, others in 'email as text' (legacy Bubble column)
      const { data: userData, error: userError } = await supabase
        .from('user')
        .select('id')
        .or(`email.eq.${session.user.email},email as text.eq.${session.user.email}`)
        .maybeSingle();

      if (userData?.id) {
        userId = userData.id;
        logger.debug('[ListingService] ✅ Resolved user.id:', userId);
      } else {
        logger.warn('[ListingService] ⚠️ Could not resolve user data, using stored ID:', storedUserId);
      }
    }
  }

  logger.debug('[ListingService] User ID (for created_by_user_id and host_user_id):', userId);

  // Step 1: Generate unique id via RPC
  const { data: generatedId, error: rpcError } = await supabase.rpc('generate_unique_id');

  if (rpcError || !generatedId) {
    logger.error('[ListingService] ❌ Failed to generate listing ID:', rpcError);
    throw new Error('Failed to generate listing ID');
  }

  logger.debug('[ListingService] ✅ Generated listing id:', generatedId);

  // Step 2: Process photos
  // Photos may come with:
  // - http/https URLs: Already uploaded to Supabase Storage (just format them)
  // - blob URLs + file property: Need upload to Supabase Storage (SelfListingPageV2 flow)
  let uploadedPhotos = [];
  if (formData.photos?.photos?.length > 0) {
    logger.debug('[ListingService] Processing photos...');

    // Check if photos already have permanent URLs (uploaded during form editing)
    const allPhotosHaveUrls = formData.photos.photos.every(
      (p) => p.url && (p.url.startsWith('http://') || p.url.startsWith('https://'))
    );

    if (allPhotosHaveUrls) {
      // Photos are already uploaded - just format them
      logger.debug('[ListingService] ✅ Photos already uploaded to storage');
      uploadedPhotos = formData.photos.photos.map((p, i) => ({
        id: p.id,
        url: p.url,
        Photo: p.url,
        'Photo (thumbnail)': p.url,
        storagePath: p.storagePath || null,
        caption: p.caption || '',
        displayOrder: p.displayOrder ?? i,
        SortOrder: p.displayOrder ?? i,
        toggleMainPhoto: i === 0
      }));
    } else {
      // Photos have blob URLs - need to upload to Supabase Storage
      // Requires photo.file (File object) to be present for upload
      logger.debug('[ListingService] Uploading photos to Supabase Storage...');
      try {
        uploadedPhotos = await uploadPhotos(formData.photos.photos, generatedId);
        logger.debug('[ListingService] ✅ Photos uploaded:', uploadedPhotos.length);
      } catch (uploadError) {
        logger.error('[ListingService] ❌ Photo upload failed:', uploadError);
        throw new Error('Failed to upload photos: ' + uploadError.message);
      }
    }
  }

  // Create form data with uploaded photo URLs
  const formDataWithPhotos = {
    ...formData,
    photos: {
      ...formData.photos,
      photos: uploadedPhotos
    }
  };

  // Step 2b: Look up borough and hood IDs from zip code
  const zipCode = formData.spaceSnapshot?.address?.zip;
  let boroughId = null;
  let hoodId = null;

  if (zipCode) {
    logger.debug('[ListingService] Looking up borough/hood for zip:', zipCode);
    const geoIds = await getGeoIdsByZipCode(zipCode);
    boroughId = geoIds.boroughId;
    hoodId = geoIds.hoodId;
  }

  // Step 3: Map form data to listing table columns
  // Pass userId for both "created_by_user_id" and "host_user_id", plus geo IDs
  const listingData = mapFormDataToListingTable(formDataWithPhotos, userId, generatedId, userId, boroughId, hoodId);

  // Debug: Log the cancellation policy value being inserted
  logger.debug('[ListingService] cancellation_policy value to insert:', listingData.cancellation_policy);
  logger.debug('[ListingService] Rules from form:', formDataWithPhotos.rules);

  // Step 4: Insert directly into listing table
  const { data, error } = await supabase
    .from('listing')
    .insert(listingData)
    .select()
    .single();

  if (error) {
    logger.error('[ListingService] ❌ Error creating listing in Supabase:', error);
    logger.error('[ListingService] ❌ Full listing data that failed:', JSON.stringify(listingData, null, 2));
    throw new Error(error.message || 'Failed to create listing');
  }

  logger.debug('[ListingService] ✅ Listing created in listing table with id:', data.id);

  // Step 5: Link listing to user's listings_json array using id
  // This MUST succeed - if it fails, the user won't see their listing
  if (!userId) {
    logger.error('[ListingService] ❌ No userId provided - cannot link listing to user');
    throw new Error('User ID is required to create a listing');
  }

  await linkListingToHost(userId, data.id);
  logger.debug('[ListingService] ✅ Listing linked to user account');

  // NOTE: Bubble sync disabled - see /docs/tech-debt/BUBBLE_SYNC_DISABLED.md
  // The listing is now created directly in Supabase without Bubble synchronization

  // Step 5.5: Trigger pricing list creation (non-blocking)
  triggerPricingListCreation(userId, data.id).catch(err => {
    logger.warn('[ListingService] ⚠️ Pricing list creation failed (non-blocking):', err.message);
  });

  // Step 6: Trigger mockup proposal creation for first-time hosts (non-blocking)
  triggerMockupProposalIfFirstListing(userId, data.id).catch(err => {
    logger.warn('[ListingService] ⚠️ Mockup proposal creation failed (non-blocking):', err.message);
  });

  return data;
}

/**
 * Link a listing to the host's user record
 * Adds the listing id to the listings_json array in the user table
 *
 * Handles both Supabase Auth UUIDs and Bubble IDs:
 * - Supabase UUID (contains dashes): Look up user by email from auth session
 * - Bubble ID (timestamp format): Direct lookup by id
 *
 * @param {string} userId - The user's Supabase Auth UUID or Bubble id
 * @param {string} listingId - The listing's id (Bubble-compatible ID)
 * @returns {Promise<void>}
 */
async function linkListingToHost(userId, listingId) {
  logger.debug('[ListingService] Linking listing id to host:', userId, listingId);

  let userData = null;
  let fetchError = null;

  // Check if userId is a Supabase Auth UUID (contains dashes) or Bubble ID
  const isSupabaseUUID = userId && userId.includes('-');

  if (isSupabaseUUID) {
    // Get user email from Supabase Auth session
    logger.debug('[ListingService] Detected Supabase Auth UUID, looking up user by email...');
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.email) {
      logger.error('[ListingService] ❌ No email found in auth session');
      throw new Error('Could not retrieve user email from session');
    }

    const userEmail = session.user.email;
    logger.debug('[ListingService] Looking up user by email:', userEmail);

    // Look up user by email in public.user table
    // Note: Some users have email in 'email' column, others in 'email as text' (legacy Bubble column)
    const result = await supabase
      .from('user')
      .select('id, listings_json')
      .or(`email.eq.${userEmail},email as text.eq.${userEmail}`)
      .maybeSingle();

    userData = result.data;
    fetchError = result.error;
  } else {
    // Legacy path: Direct lookup by Bubble id
    logger.debug('[ListingService] Using Bubble ID for user lookup');
    const result = await supabase
      .from('user')
      .select('id, listings_json')
      .eq('id', userId)
      .maybeSingle();

    userData = result.data;
    fetchError = result.error;
  }

  if (fetchError) {
    logger.error('[ListingService] ❌ Error fetching user:', fetchError);
    throw fetchError;
  }

  if (!userData) {
    logger.error('[ListingService] ❌ No user found for userId:', userId);
    throw new Error(`User not found: ${userId}`);
  }

  logger.debug('[ListingService] ✅ Found user with id:', userData.id);

  // Add the new listing ID to the array
  const currentListings = userData.listings_json || [];
  if (!currentListings.includes(listingId)) {
    currentListings.push(listingId);
  }

  // Update the user with the new listings_json array
  const { error: updateError } = await supabase
    .from('user')
    .update({ listings_json: currentListings })
    .eq('id', userData.id);

  if (updateError) {
    logger.error('[ListingService] ❌ Error updating user listings_json:', updateError);
    throw updateError;
  }

  logger.debug('[ListingService] ✅ user listings_json updated:', currentListings);
}

/**
 * Trigger mockup proposal creation for first-time hosts
 *
 * Non-blocking operation - failures don't affect listing creation.
 * Only triggers if this is the host's first listing.
 *
 * Handles both ID formats:
 * - Supabase Auth UUID (contains dashes): Lookup by email from auth session
 * - Bubble ID (timestamp format): Direct lookup by id
 *
 * @param {string} userId - The user's Supabase Auth UUID or Bubble id
 * @param {string} listingId - The newly created listing's id
 * @returns {Promise<void>}
 */
async function triggerMockupProposalIfFirstListing(userId, listingId) {
  logger.debug('[ListingService] Step 6: Checking if first listing for mockup proposal...');

  let userData = null;
  let fetchError = null;

  // Check if userId is a Supabase Auth UUID (contains dashes) or Bubble ID
  const isSupabaseUUID = userId && userId.includes('-');

  if (isSupabaseUUID) {
    // Get user email from Supabase Auth session
    logger.debug('[ListingService] Detected Supabase Auth UUID, looking up user by email...');
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.email) {
      logger.warn('[ListingService] ⚠️ No email found in auth session for mockup proposal check');
      return;
    }

    const sessionEmail = session.user.email;
    logger.debug('[ListingService] Looking up user by email for mockup check:', sessionEmail);

    // Look up user by email in public.user table
    const result = await supabase
      .from('user')
      .select('id, email, listings_json')
      .eq('email', sessionEmail)
      .maybeSingle();

    userData = result.data;
    fetchError = result.error;
  } else {
    // Legacy path: Direct lookup by Bubble id
    logger.debug('[ListingService] Using Bubble ID for mockup proposal user lookup');
    const result = await supabase
      .from('user')
      .select('id, email, listings_json')
      .eq('id', userId)
      .maybeSingle();

    userData = result.data;
    fetchError = result.error;
  }

  // Handle case where user exists in Supabase Auth but not in legacy user table
  // This happens for users who signed up via native Supabase Auth (not legacy Bubble)
  let hostUserId = userData?.id;
  let hostEmail = userData?.email;
  let listings = userData?.listings_json || [];

  if (!userData && isSupabaseUUID) {
    // User not in legacy table - use Supabase Auth data directly
    logger.debug('[ListingService] User not in legacy user table, using Supabase Auth session data');
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      // For Supabase Auth users, use the UUID as the host user ID
      // The Edge Function will handle this appropriately
      hostUserId = session.user.id;
      hostEmail = session.user.email;
      // Since this is a new Supabase Auth user not in legacy table, this is definitely their first listing
      listings = [listingId];
      logger.debug('[ListingService] ✅ Using Supabase Auth data for mockup proposal:', hostUserId);
    } else {
      logger.warn('[ListingService] ⚠️ No Supabase Auth session found for mockup proposal');
      return;
    }
  } else if (fetchError || !userData) {
    logger.warn('[ListingService] ⚠️ Could not fetch user for mockup proposal check:', fetchError?.message);
    return;
  } else {
    logger.debug('[ListingService] ✅ Found user for mockup check with id:', userData.id);
  }

  // Only create mockup proposal for first listing
  if (listings.length !== 1) {
    logger.debug(`[ListingService] ⏭️ Skipping mockup proposal - not first listing (count: ${listings.length})`);
    return;
  }

  if (!hostEmail) {
    logger.warn('[ListingService] ⚠️ Missing email for mockup proposal');
    return;
  }

  logger.debug('[ListingService] 🎯 First listing detected, triggering mockup proposal creation...');

  // Get the Supabase URL from environment or config
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  // Call the proposal edge function with create_mockup action
  // Note: Mockup creation was moved from listing to proposal edge function
  // Uses hostUserId and hostEmail variables set above (from legacy table or Supabase Auth)
  const response = await fetch(`${supabaseUrl}/functions/v1/proposal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'create_mockup',
      payload: {
        listingId: listingId,
        hostUserId: hostUserId,
        hostEmail: hostEmail,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Edge function returned ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  logger.debug('[ListingService] ✅ Mockup proposal creation triggered:', result);
}

/**
 * Trigger pricing list creation for a new listing.
 * Non-blocking - failures logged but don't block listing creation.
 *
 * @param {string} userId - The host user ID
 * @param {string} listingId - The newly created listing ID
 * @param {number} unitMarkup - Optional unit markup (default: 0)
 */
async function triggerPricingListCreation(userId, listingId, unitMarkup = 0) {
  logger.debug('[ListingService] Triggering pricing list creation for listing:', listingId);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const response = await fetch(`${supabaseUrl}/functions/v1/pricing-list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'create',
      payload: {
        listing_id: listingId,
        user_id: userId,
        unit_markup_percentage: unitMarkup,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pricing list creation failed (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  logger.debug('[ListingService] Pricing list created:', result.data?.pricing_list_id);

  return result;
}

// ============================================================================
// DISABLED FUNCTIONS - Moved to tech-debt
// See /docs/tech-debt/BUBBLE_SYNC_DISABLED.md for details
// ============================================================================

/**
 * Update an existing listing in listing table
 *
 * When originalData is provided, only fields that have actually changed from the
 * original are sent to Supabase. This prevents FK constraint violations (409/23503)
 * caused by PostgREST validating unchanged null FK fields.
 *
 * @param {string} listingId - The listing's id (Bubble-compatible ID)
 * @param {object} formData - Updated form data (can be flat DB columns or nested SelfListingPage format)
 * @param {object} [originalData] - Original listing data for change detection. If omitted, all fields are sent (backward compatible).
 * @returns {Promise<object>} - Updated listing
 */
export async function updateListing(listingId, formData, originalData = null) {
  logger.debug('[ListingService] Updating listing:', listingId);

  if (!listingId) {
    throw new Error('Listing ID is required for update');
  }

  // Check if formData is already in flat database column format
  // (e.g., from EditListingDetails which uses DB column names directly)
  const isFlatDbFormat = isFlatDatabaseFormat(formData);

  let listingData;
  if (isFlatDbFormat) {
    // Already using database column names - normalize special columns
    listingData = normalizeDatabaseColumns(formData);
    logger.debug('[ListingService] Using flat DB format update');
  } else {
    // Nested SelfListingPage format - needs mapping
    // Note: For updates, we use the existing id, not generate a new one
    listingData = mapFormDataToListingTableForUpdate(formData);
    logger.debug('[ListingService] Using mapped SelfListingPage format');
  }

  listingData.original_updated_at = new Date().toISOString();

  // REG-001: Filter out unchanged fields to prevent FK constraint violations.
  // When originalData is provided, only send fields that actually differ from the original.
  // This stops PostgREST from re-validating unchanged null FK fields (which causes 409/23503).
  if (originalData) {
    const filteredData = {};
    for (const [key, value] of Object.entries(listingData)) {
      // Always include the timestamp
      if (key === 'original_updated_at') {
        filteredData[key] = value;
        continue;
      }

      const originalValue = originalData[key];

      // Compare using JSON.stringify to handle arrays, objects, and primitives uniformly
      if (JSON.stringify(value) !== JSON.stringify(originalValue)) {
        filteredData[key] = value;
      }
    }

    const droppedCount = Object.keys(listingData).length - Object.keys(filteredData).length;
    if (droppedCount > 0) {
      logger.debug(`[ListingService] Filtered out ${droppedCount} unchanged field(s) to prevent FK constraint issues`);
    }

    listingData = filteredData;
  }

  // If only the timestamp remains after filtering, skip the update
  if (Object.keys(listingData).length <= 1 && listingData.original_updated_at) {
    logger.debug('[ListingService] No changed fields to update, skipping Supabase call');
    // Fetch and return the current listing so callers still get data back
    const { data: currentData } = await supabase
      .from('listing')
      .select('*')
      .eq('id', listingId)
      .single();
    return currentData;
  }

  const { data, error } = await supabase
    .from('listing')
    .update(listingData)
    .eq('id', listingId)
    .select()
    .single();

  if (error) {
    logger.error('[ListingService] ❌ Error updating listing:', error);
    throw new Error(error.message || 'Failed to update listing');
  }

  logger.debug('[ListingService] ✅ Listing updated:', data.id);
  return data;
}

/**
 * Get a listing by id from listing table
 * @param {string} listingId - The listing's id (Bubble-compatible ID)
 * @returns {Promise<object|null>} - Listing data or null if not found
 */
export async function getListingById(listingId) {
  logger.debug('[ListingService] Fetching listing:', listingId);

  if (!listingId) {
    throw new Error('Listing ID is required');
  }

  const { data, error } = await supabase
    .from('listing')
    .select('*')
    .eq('id', listingId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      logger.debug('[ListingService] Listing not found:', listingId);
      return null;
    }
    logger.error('[ListingService] ❌ Error fetching listing:', error);
    throw new Error(error.message || 'Failed to fetch listing');
  }

  // Check if listing is soft-deleted
  if (data && data.is_deleted === true) {
    logger.debug('[ListingService] Listing is soft-deleted:', listingId);
    return null;
  }

  logger.debug('[ListingService] ✅ Listing fetched:', data.id);
  return data;
}

/**
 * Save a draft listing
 * Note: Drafts are now primarily saved to localStorage via the store.
 * This function creates/updates a listing in the database if needed.
 *
 * @param {object} formData - Form data to save as draft
 * @param {string|null} existingId - Existing listing id if updating
 * @returns {Promise<object>} - Saved listing
 */
export async function saveDraft(formData, existingId = null) {
  logger.debug('[ListingService] Saving draft, existingId:', existingId);

  if (existingId) {
    return updateListing(existingId, { ...formData, isDraft: true });
  }

  return createListing({ ...formData, isDraft: true });
}
