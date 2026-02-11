/**
 * Listing Service - Direct Supabase Operations for listing table
 *
 * Handles CRUD operations for self-listing form submissions.
 * Creates listings directly in the `listing` table using generate_unique_id() RPC.
 *
 * NO FALLBACK: If operation fails, we fail. No workarounds.
 */

import { supabase } from './supabase.js';
import { getUserId } from './secureStorage.js';
import { uploadPhotos } from './photoUpload.js';
import { logger } from './logger.js';

// ============================================================================
// GEO LOOKUP UTILITIES
// ============================================================================

/**
 * Look up borough ID by zip code from reference table
 * @param {string} zipCode - The zip code to look up
 * @returns {Promise<string|null>} Borough _id or null if not found
 */
async function getBoroughIdByZipCode(zipCode) {
  if (!zipCode) return null;

  const cleanZip = String(zipCode).trim().substring(0, 5);
  if (!/^\d{5}$/.test(cleanZip)) return null;

  try {
    const { data, error } = await supabase
      .schema('reference_table')
      .from('zat_geo_borough_toplevel')
      .select('_id, "Display Borough"')
      .contains('Zip Codes', [cleanZip])
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      logger.debug('[ListingService] No borough found for zip:', cleanZip);
      return null;
    }

    logger.debug('[ListingService] ✅ Found borough:', data['Display Borough'], 'for zip:', cleanZip);
    return data._id;
  } catch (err) {
    logger.error('[ListingService] Error looking up borough:', err);
    return null;
  }
}

/**
 * Look up hood (neighborhood) ID by zip code from reference table
 * @param {string} zipCode - The zip code to look up
 * @returns {Promise<string|null>} Hood _id or null if not found
 */
async function getHoodIdByZipCode(zipCode) {
  if (!zipCode) return null;

  const cleanZip = String(zipCode).trim().substring(0, 5);
  if (!/^\d{5}$/.test(cleanZip)) return null;

  try {
    const { data, error } = await supabase
      .schema('reference_table')
      .from('zat_geo_hood_mediumlevel')
      .select('_id, "Display"')
      .contains('Zips', [cleanZip])
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      logger.debug('[ListingService] No hood found for zip:', cleanZip);
      return null;
    }

    logger.debug('[ListingService] ✅ Found hood:', data['Display'], 'for zip:', cleanZip);
    return data._id;
  } catch (err) {
    logger.error('[ListingService] Error looking up hood:', err);
    return null;
  }
}

/**
 * Look up both borough and hood IDs by zip code
 * @param {string} zipCode - The zip code to look up
 * @returns {Promise<{boroughId: string|null, hoodId: string|null}>}
 */
async function getGeoIdsByZipCode(zipCode) {
  logger.debug('[ListingService] Looking up geo IDs for zip:', zipCode);

  const [boroughId, hoodId] = await Promise.all([
    getBoroughIdByZipCode(zipCode),
    getHoodIdByZipCode(zipCode)
  ]);

  return { boroughId, hoodId };
}

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

/**
 * Map cancellation policy display name to its database FK ID
 * The 'Cancellation Policy' column has a foreign key constraint to reference_table.zat_features_cancellationpolicy
 *
 * @param {string|null} policyName - Human-readable policy name (e.g., 'Standard')
 * @returns {string|null} - The FK ID for the policy, or null if not found
 */
function mapCancellationPolicyToId(policyName) {
  const policyMap = {
    'Standard': '1665431440883x653177548350901500',
    'Additional Host Restrictions': '1665431684611x656977293321267800',
    'Prior to First-Time Arrival': '1599791792265x281203802121463780',
    'After First-Time Arrival': '1599791785559x603327510287017500',
  };

  const result = !policyName ? policyMap['Standard'] : (policyMap[policyName] || policyMap['Standard']);
  logger.debug('[ListingService] Cancellation policy mapping:', { input: policyName, output: result });
  return result;
}

/**
 * Map parking type display name to its database FK ID
 * The 'Features - Parking type' column has a foreign key constraint to reference_table.zat_features_parkingoptions
 *
 * @param {string|null} parkingType - Human-readable parking type (e.g., 'Street Parking')
 * @returns {string|null} - The FK ID for the parking type, or null if not provided
 */
function mapParkingTypeToId(parkingType) {
  const parkingMap = {
    'Street Parking': '1642428637379x970678957586007000',
    'No Parking': '1642428658755x946399373738815900',
    'Off-Street Parking': '1642428710705x523449235750343100',
    'Attached Garage': '1642428740411x489476808574605760',
    'Detached Garage': '1642428749714x405527148800546750',
    'Nearby Parking Structure': '1642428759346x972313924643388700',
  };

  if (!parkingType) return null; // Parking type is optional
  const result = parkingMap[parkingType] || null;
  logger.debug('[ListingService] Parking type mapping:', { input: parkingType, output: result });
  return result;
}

/**
 * Map listing type (Type of Space) display name to its database FK ID
 * The 'Features - Type of Space' column has a foreign key constraint to reference_table.zat_features_listingtype
 *
 * @param {string|null} spaceType - Human-readable space type (e.g., 'Private Room')
 * @returns {string|null} - The FK ID for the space type, or null if not provided
 */
function mapSpaceTypeToId(spaceType) {
  const spaceTypeMap = {
    'Private Room': '1569530159044x216130979074711000',
    'Entire Place': '1569530331984x152755544104023800',
    'Shared Room': '1585742011301x719941865479153400',
    'All Spaces': '1588063597111x228486447854442800',
  };

  if (!spaceType) return null; // Space type is optional
  const result = spaceTypeMap[spaceType] || null;
  logger.debug('[ListingService] Space type mapping:', { input: spaceType, output: result });
  return result;
}

/**
 * Map storage option display name to its database FK ID
 * The 'Features - Secure Storage Option' column has a foreign key constraint to reference_table.zat_features_storageoptions
 *
 * @param {string|null} storageOption - Human-readable storage option (e.g., 'In the room')
 * @returns {string|null} - The FK ID for the storage option, or null if not provided
 */
function mapStorageOptionToId(storageOption) {
  const storageMap = {
    'In the room': '1606866759190x694414586166435100',
    'In a locked closet': '1606866790336x155474305631091200',
    'In a suitcase': '1606866843299x274753427318384030',
  };

  if (!storageOption) return null; // Storage option is optional
  const result = storageMap[storageOption] || null;
  logger.debug('[ListingService] Storage option mapping:', { input: storageOption, output: result });
  return result;
}

/**
 * Map state abbreviation to full state name for FK constraint
 * The 'Location - State' column has a FK to reference_table.os_us_states.display
 * which expects full state names like "New York", not abbreviations like "NY"
 *
 * @param {string|null} stateInput - State abbreviation (e.g., 'NY') or full name
 * @returns {string|null} - Full state name for FK, or null if not provided
 */
function mapStateToDisplayName(stateInput) {
  if (!stateInput) return null;

  // If it's already a full state name (more than 2 chars), return as-is
  if (stateInput.length > 2) {
    return stateInput;
  }

  // Map of state abbreviations to full display names
  const stateAbbreviationMap = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
  };

  const result = stateAbbreviationMap[stateInput.toUpperCase()] || stateInput;
  logger.debug('[ListingService] State mapping:', { input: stateInput, output: result });
  return result;
}

/**
 * Map SelfListingPage form data to listing table columns
 * Creates a record ready for direct insertion into the listing table
 *
 * Column Mapping Notes:
 * - form_metadata → Handled by localStorage (not stored in DB)
 * - address_validated → Stored in 'address_with_lat_lng_json' JSONB
 * - weekly_pattern → Mapped to 'weeks_offered_schedule_text'
 * - subsidy_agreement → Omitted (not in listing table)
 * - nightly_pricing → Mapped to individual 'nightly_rate_for_X_night_stay' columns
 * - ideal_min_duration → Mapped to 'minimum_months_per_stay'
 * - ideal_max_duration → Mapped to 'maximum_months_per_stay'
 * - previous_reviews_link → Mapped to 'Source Link'
 * - optional_notes → Omitted (not in listing table)
 * - source_type → Omitted (created_by_user_id is for user ID)
 *
 * @param {object} formData - Form data from SelfListingPage
 * @param {string|null} userId - The current user's id (for created_by_user_id)
 * @param {string} generatedId - The unique id from generate_unique_id()
 * @param {string|null} hostAccountId - The user.id (for host_user_id FK)
 * @param {string|null} boroughId - The borough FK ID (from geo lookup)
 * @param {string|null} hoodId - The hood/neighborhood FK ID (from geo lookup)
 * @returns {object} - Database-ready object for listing table
 */
function mapFormDataToListingTable(formData, userId, generatedId, hostAccountId = null, boroughId = null, hoodId = null) {
  const now = new Date().toISOString();

  // Map available nights from object to array of day numbers (1-based for Bubble compatibility)
  const daysAvailable = formData.leaseStyles?.availableNights
    ? mapAvailableNightsToArray(formData.leaseStyles.availableNights)
    : [];

  // Map available nights to day name strings (for Nights Available column)
  const nightsAvailableNames = formData.leaseStyles?.availableNights
    ? mapAvailableNightsToNames(formData.leaseStyles.availableNights)
    : [];

  // Build the listing table record
  return {
    // Primary key - generated Bubble-compatible ID
    id: generatedId,

    // User/Host reference - host_user_id contains user.id directly
    created_by_user_id: userId || null,
    host_user_id: hostAccountId || null, // user.id
    original_created_at: now,
    original_updated_at: now,

    // Section 1: Space Snapshot
    listing_title: formData.spaceSnapshot?.listingName || null,
    // Note: Type of Space is a FK reference to reference_table.zat_features_listingtype
    space_type: mapSpaceTypeToId(formData.spaceSnapshot?.typeOfSpace),
    bedroom_count: formData.spaceSnapshot?.bedrooms || null,
    bed_count: formData.spaceSnapshot?.beds || null,
    bathroom_count: formData.spaceSnapshot?.bathrooms
      ? Number(formData.spaceSnapshot.bathrooms)
      : null,
    // Note: Kitchen Type is a string FK to reference_table.os_kitchen_type.display (no mapping needed)
    kitchen_type: formData.spaceSnapshot?.typeOfKitchen || null,
    // Note: Parking type is a FK reference to reference_table.zat_features_parkingoptions
    parking_type: mapParkingTypeToId(formData.spaceSnapshot?.typeOfParking),

    // Address (stored as JSONB with validated flag inside)
    address_with_lat_lng_json: formData.spaceSnapshot?.address
      ? {
          address: formData.spaceSnapshot.address.fullAddress,
          number: formData.spaceSnapshot.address.number,
          street: formData.spaceSnapshot.address.street,
          lat: formData.spaceSnapshot.address.latitude,
          lng: formData.spaceSnapshot.address.longitude,
          validated: formData.spaceSnapshot.address.validated || false,
        }
      : null,
    // Note: city is a FK to reference_table.zat_location.id - set to null for now
    // The city string is stored in 'address_with_lat_lng_json' JSONB field above
    city: null,
    // Note: state is a string FK to reference_table.os_us_states.display
    // Google Maps returns abbreviation (e.g., 'NY'), but FK expects full name (e.g., 'New York')
    state: mapStateToDisplayName(formData.spaceSnapshot?.address?.state),
    zip_code: formData.spaceSnapshot?.address?.zip || null,
    neighborhood_name_entered_by_host:
      formData.spaceSnapshot?.address?.neighborhood || null,
    // borough and primary_neighborhood_reference_id are FK columns populated from zip code lookup
    borough: boroughId || null,
    primary_neighborhood_reference_id: hoodId || null,

    // Section 2: Features
    in_unit_amenity_reference_ids_json: formData.features?.amenitiesInsideUnit || [],
    in_building_amenity_reference_ids_json:
      formData.features?.amenitiesOutsideUnit || [],
    listing_description: formData.features?.descriptionOfLodging || null,
    neighborhood_description_by_host:
      formData.features?.neighborhoodDescription || null,

    // Section 3: Lease Styles
    rental_type: formData.leaseStyles?.rentalType || 'Monthly',
    available_days_as_day_numbers_json: daysAvailable,
    available_nights_as_day_numbers_json: nightsAvailableNames,
    // weekly_pattern → Mapped to 'weeks_offered_schedule_text'
    weeks_offered_schedule_text: formData.leaseStyles?.weeklyPattern || 'Every week',

    // Section 4: Pricing
    damage_deposit_amount: formData.pricing?.damageDeposit || 0,
    cleaning_fee_amount: formData.pricing?.maintenanceFee || 0,
    extra_charges: formData.pricing?.extraCharges || null,
    weekly_rate_paid_to_host: formData.pricing?.weeklyCompensation || null,
    monthly_rate_paid_to_host: formData.pricing?.monthlyCompensation || null,

    // Nightly rates from nightly_pricing.calculatedRates
    ...mapNightlyRatesToColumns(formData.pricing?.nightlyPricing),

    // Section 5: Rules
    // Note: cancellation_policy is a FK reference to reference_table.zat_features_cancellationpolicy
    cancellation_policy: mapCancellationPolicyToId(formData.rules?.cancellationPolicy),
    preferred_guest_gender: formData.rules?.preferredGender || 'No Preference',
    max_guest_count: formData.rules?.numberOfGuests || 2,
    checkin_time_of_day: formData.rules?.checkInTime || '2:00 PM',
    checkout_time_of_day: formData.rules?.checkOutTime || '11:00 AM',
    // ideal_min_duration → Mapped to minimum_months_per_stay/weeks
    minimum_months_per_stay: formData.rules?.idealMinDuration || null,
    maximum_months_per_stay: formData.rules?.idealMaxDuration || null,
    house_rule_reference_ids_json: formData.rules?.houseRules || [],
    blocked_specific_dates_json: formData.rules?.blockedDates || [],

    // Section 6: Photos - Store with format compatible with listing display
    photos_with_urls_captions_and_sort_order_json: formData.photos?.photos?.map((p, index) => ({
      id: p.id,
      url: p.url || p.Photo,
      Photo: p.url || p.Photo,
      'Photo (thumbnail)': p['Photo (thumbnail)'] || p.url || p.Photo,
      caption: p.caption || '',
      displayOrder: p.displayOrder ?? index,
      SortOrder: p.SortOrder ?? p.displayOrder ?? index,
      toggleMainPhoto: p.toggleMainPhoto ?? (index === 0),
      storagePath: p.storagePath || null
    })) || [],

    // Section 7: Review
    safety_feature_reference_ids_json: formData.review?.safetyFeatures || [],
    square_feet: formData.review?.squareFootage || null,
    first_available_date: formData.review?.firstDayAvailable || null,
    // previous_reviews_link → Mapped to Source Link
    'Source Link': formData.review?.previousReviewsLink || null,

    // V2 fields
    host_type: formData.hostType || null,
    market_strategy: formData.marketStrategy || 'private',

    // Status defaults for new self-listings
    is_active: false,
    is_approved: false,
    is_listing_profile_complete: formData.isSubmitted || false,

    // Required defaults for listing table
    is_trial_period_allowed: false,
    maximum_weeks_per_stay: 52,
    minimum_nights_per_stay: 1,
  };
}

/**
 * Map available nights object to array of day name strings
 * Used for 'Nights Available (List of Nights)' column
 *
 * @param {object} availableNights - {sunday: bool, monday: bool, ...}
 * @returns {string[]} - Array of day names like ["Monday", "Tuesday", ...]
 */
function mapAvailableNightsToNames(availableNights) {
  const dayNameMapping = {
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
  };

  const result = [];
  // Maintain proper day order
  const dayOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  for (const day of dayOrder) {
    if (availableNights[day] && dayNameMapping[day]) {
      result.push(dayNameMapping[day]);
    }
  }

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
 * Map SelfListingPage form data to listing table columns for updates
 * Similar to mapFormDataToListingTable but without generating new id
 *
 * @param {object} formData - Form data from SelfListingPage
 * @returns {object} - Database-ready object for listing table update
 */
function mapFormDataToListingTableForUpdate(formData) {
  // Map available nights from object to array of day numbers (1-based for Bubble compatibility)
  const daysAvailable = formData.leaseStyles?.availableNights
    ? mapAvailableNightsToArray(formData.leaseStyles.availableNights)
    : undefined;

  // Map available nights to day name strings (for Nights Available column)
  const nightsAvailableNames = formData.leaseStyles?.availableNights
    ? mapAvailableNightsToNames(formData.leaseStyles.availableNights)
    : undefined;

  // Build update object - only include fields that are present in formData
  const updateData = {};

  // Section 1: Space Snapshot
  if (formData.spaceSnapshot) {
    if (formData.spaceSnapshot.listingName !== undefined) updateData.listing_title = formData.spaceSnapshot.listingName;
    if (formData.spaceSnapshot.typeOfSpace !== undefined) updateData.space_type = mapSpaceTypeToId(formData.spaceSnapshot.typeOfSpace);
    if (formData.spaceSnapshot.bedrooms !== undefined) updateData.bedroom_count = formData.spaceSnapshot.bedrooms;
    if (formData.spaceSnapshot.beds !== undefined) updateData.bed_count = formData.spaceSnapshot.beds;
    if (formData.spaceSnapshot.bathrooms !== undefined) updateData.bathroom_count = Number(formData.spaceSnapshot.bathrooms);
    if (formData.spaceSnapshot.typeOfKitchen !== undefined) updateData.kitchen_type = formData.spaceSnapshot.typeOfKitchen;
    if (formData.spaceSnapshot.typeOfParking !== undefined) updateData.parking_type = mapParkingTypeToId(formData.spaceSnapshot.typeOfParking);

    if (formData.spaceSnapshot.address) {
      updateData.address_with_lat_lng_json = {
        address: formData.spaceSnapshot.address.fullAddress,
        number: formData.spaceSnapshot.address.number,
        street: formData.spaceSnapshot.address.street,
        lat: formData.spaceSnapshot.address.latitude,
        lng: formData.spaceSnapshot.address.longitude,
        validated: formData.spaceSnapshot.address.validated || false,
      };
      // Note: city is a FK - don't update from string value
      updateData.state = mapStateToDisplayName(formData.spaceSnapshot.address.state);
      updateData.zip_code = formData.spaceSnapshot.address.zip;
      updateData.neighborhood_name_entered_by_host = formData.spaceSnapshot.address.neighborhood;
    }
  }

  // Section 2: Features
  if (formData.features) {
    if (formData.features.amenitiesInsideUnit !== undefined) updateData.in_unit_amenity_reference_ids_json = formData.features.amenitiesInsideUnit;
    if (formData.features.amenitiesOutsideUnit !== undefined) updateData.in_building_amenity_reference_ids_json = formData.features.amenitiesOutsideUnit;
    if (formData.features.descriptionOfLodging !== undefined) updateData.listing_description = formData.features.descriptionOfLodging;
    if (formData.features.neighborhoodDescription !== undefined) updateData.neighborhood_description_by_host = formData.features.neighborhoodDescription;
  }

  // Section 3: Lease Styles
  if (formData.leaseStyles) {
    if (formData.leaseStyles.rentalType !== undefined) updateData.rental_type = formData.leaseStyles.rentalType;
    if (daysAvailable !== undefined) updateData.available_days_as_day_numbers_json = daysAvailable;
    if (nightsAvailableNames !== undefined) updateData.available_nights_as_day_numbers_json = nightsAvailableNames;
    if (formData.leaseStyles.weeklyPattern !== undefined) updateData.weeks_offered_schedule_text = formData.leaseStyles.weeklyPattern;
  }

  // Section 4: Pricing
  if (formData.pricing) {
    if (formData.pricing.damageDeposit !== undefined) updateData.damage_deposit_amount = formData.pricing.damageDeposit;
    if (formData.pricing.maintenanceFee !== undefined) updateData.cleaning_fee_amount = formData.pricing.maintenanceFee;
    if (formData.pricing.extraCharges !== undefined) updateData.extra_charges = formData.pricing.extraCharges;
    if (formData.pricing.weeklyCompensation !== undefined) updateData.weekly_rate_paid_to_host = formData.pricing.weeklyCompensation;
    if (formData.pricing.monthlyCompensation !== undefined) updateData.monthly_rate_paid_to_host = formData.pricing.monthlyCompensation;
    if (formData.pricing.nightlyPricing) {
      Object.assign(updateData, mapNightlyRatesToColumns(formData.pricing.nightlyPricing));
    }
  }

  // Section 5: Rules
  if (formData.rules) {
    if (formData.rules.cancellationPolicy !== undefined) updateData.cancellation_policy = mapCancellationPolicyToId(formData.rules.cancellationPolicy);
    if (formData.rules.preferredGender !== undefined) updateData.preferred_guest_gender = formData.rules.preferredGender;
    if (formData.rules.numberOfGuests !== undefined) updateData.max_guest_count = formData.rules.numberOfGuests;
    if (formData.rules.checkInTime !== undefined) updateData.checkin_time_of_day = formData.rules.checkInTime;
    if (formData.rules.checkOutTime !== undefined) updateData.checkout_time_of_day = formData.rules.checkOutTime;
    if (formData.rules.idealMinDuration !== undefined) updateData.minimum_months_per_stay = formData.rules.idealMinDuration;
    if (formData.rules.idealMaxDuration !== undefined) updateData.maximum_months_per_stay = formData.rules.idealMaxDuration;
    if (formData.rules.houseRules !== undefined) updateData.house_rule_reference_ids_json = formData.rules.houseRules;
    if (formData.rules.blockedDates !== undefined) updateData.blocked_specific_dates_json = formData.rules.blockedDates;
  }

  // Section 6: Photos
  if (formData.photos?.photos) {
    updateData.photos_with_urls_captions_and_sort_order_json = formData.photos.photos.map((p, index) => ({
      id: p.id,
      url: p.url || p.Photo,
      Photo: p.url || p.Photo,
      'Photo (thumbnail)': p['Photo (thumbnail)'] || p.url || p.Photo,
      caption: p.caption || '',
      displayOrder: p.displayOrder ?? index,
      SortOrder: p.SortOrder ?? p.displayOrder ?? index,
      toggleMainPhoto: p.toggleMainPhoto ?? (index === 0),
      storagePath: p.storagePath || null
    }));
  }

  // Section 7: Review
  if (formData.review) {
    if (formData.review.safetyFeatures !== undefined) updateData.safety_feature_reference_ids_json = formData.review.safetyFeatures;
    if (formData.review.squareFootage !== undefined) updateData.square_feet = formData.review.squareFootage;
    if (formData.review.firstDayAvailable !== undefined) updateData.first_available_date = formData.review.firstDayAvailable;
    if (formData.review.previousReviewsLink !== undefined) updateData['Source Link'] = formData.review.previousReviewsLink;
  }

  return updateData;
}

/**
 * Check if formData uses flat database column names
 * @param {object} formData - Form data to check
 * @returns {boolean} - True if using flat DB column format
 */
function isFlatDatabaseFormat(formData) {
  // Database column names have specific snake_case patterns
  const dbColumnPatterns = [
    'listing_title',
    'listing_description',
    'space_type',
    'bedroom_count',
    'bed_count',
    'bathroom_count',
    'kitchen_type',
    'parking_type',
    'address_with_lat_lng_json',
    'city',
    'state',
    'zip_code',
    'cancellation_policy',
    'first_available_date',
    'is_active',
    'is_approved'
  ];

  const keys = Object.keys(formData);
  return keys.some(key =>
    dbColumnPatterns.some(pattern => key === pattern)
  );
}

/**
 * Normalize database column names for update operations.
 * With the new snake_case column names, no quirky leading/trailing space
 * normalization is needed. This function now simply passes through the data.
 *
 * @param {object} formData - Form data with database column names
 * @returns {object} - Data ready for database update
 */
function normalizeDatabaseColumns(formData) {
  // New snake_case column names are clean - no normalization needed.
  // Return a shallow copy to maintain the same contract as before.
  return { ...formData };
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map available nights object to array of day numbers for database
 *
 * Day indices use JavaScript's 0-based standard (matching Date.getDay()):
 * 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
 *
 * @param {object} availableNights - {sunday: bool, monday: bool, ...}
 * @returns {number[]} - Array of 0-based day numbers (0-6)
 */
function mapAvailableNightsToArray(availableNights) {
  const dayMapping = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const result = [];
  for (const [day, isSelected] of Object.entries(availableNights)) {
    if (isSelected && dayMapping[day] !== undefined) {
      result.push(dayMapping[day]);
    }
  }

  return result.sort((a, b) => a - b);
}

/**
 * Map nightly pricing object to individual rate columns
 * Used for search/filtering on price fields
 *
 * @param {object|null} nightlyPricing - Pricing object with calculatedRates
 * @returns {object} - Individual rate columns
 */
function mapNightlyRatesToColumns(nightlyPricing) {
  if (!nightlyPricing?.calculatedRates) {
    return {};
  }

  const rates = nightlyPricing.calculatedRates;

  return {
    nightly_rate_for_1_night_stay: rates.night1 || null,
    nightly_rate_for_2_night_stay: rates.night2 || null,
    nightly_rate_for_3_night_stay: rates.night3 || null,
    nightly_rate_for_4_night_stay: rates.night4 || null,
    nightly_rate_for_5_night_stay: rates.night5 || null,
    nightly_rate_for_6_night_stay: rates.night6 || null,
    nightly_rate_for_7_night_stay: rates.night7 || null,
  };
}

/**
 * Map database record back to form data structure
 * Used when loading an existing listing for editing
 *
 * @param {object} dbRecord - Database record from listing table
 * @returns {object} - Form data structure for SelfListingPage
 */
export function mapDatabaseToFormData(dbRecord) {
  if (!dbRecord) return null;

  const address = dbRecord.address_with_lat_lng_json || {};
  const coordinates = dbRecord['Location - Coordinates'] || {};
  const formMetadata = dbRecord.form_metadata || {};

  return {
    id: dbRecord.id,
    spaceSnapshot: {
      listingName: dbRecord.listing_title || '',
      typeOfSpace: dbRecord.space_type || '',
      bedrooms: dbRecord.bedroom_count || 2,
      beds: dbRecord.bed_count || 2,
      bathrooms: dbRecord.bathroom_count || 2.5,
      typeOfKitchen: dbRecord.kitchen_type || '',
      typeOfParking: dbRecord.parking_type || '',
      address: {
        fullAddress: address.address || '',
        number: address.number || '',
        street: address.street || '',
        city: dbRecord.city || '',
        state: dbRecord.state || '',
        zip: dbRecord.zip_code || '',
        neighborhood: dbRecord.neighborhood_name_entered_by_host || '',
        latitude: coordinates.lat || address.lat || null,
        longitude: coordinates.lng || address.lng || null,
        validated: dbRecord.address_validated || false,
      },
    },
    features: {
      amenitiesInsideUnit: dbRecord.in_unit_amenity_reference_ids_json || [],
      amenitiesOutsideUnit: dbRecord.in_building_amenity_reference_ids_json || [],
      descriptionOfLodging: dbRecord.listing_description || '',
      neighborhoodDescription: dbRecord.neighborhood_description_by_host || '',
    },
    leaseStyles: {
      rentalType: dbRecord.rental_type || 'Monthly',
      availableNights: mapArrayToAvailableNights(
        dbRecord.available_days_as_day_numbers_json
      ),
      weeklyPattern: dbRecord.weekly_pattern || '',
      subsidyAgreement: dbRecord.subsidy_agreement || false,
    },
    pricing: {
      damageDeposit: dbRecord.damage_deposit_amount || 500,
      maintenanceFee: dbRecord.cleaning_fee_amount || 0,
      weeklyCompensation: dbRecord.weekly_rate_paid_to_host || null,
      monthlyCompensation: dbRecord.monthly_rate_paid_to_host || null,
      nightlyPricing: dbRecord.nightly_pricing || null,
    },
    rules: {
      cancellationPolicy: dbRecord.cancellation_policy || '',
      preferredGender: dbRecord.preferred_guest_gender || 'No Preference',
      numberOfGuests: dbRecord.max_guest_count || 2,
      checkInTime: dbRecord.checkin_time_of_day || '2:00 PM',
      checkOutTime: dbRecord.checkout_time_of_day || '11:00 AM',
      idealMinDuration: dbRecord.minimum_months_per_stay || 2,
      idealMaxDuration: dbRecord.maximum_months_per_stay || 6,
      houseRules: dbRecord.house_rule_reference_ids_json || [],
      blockedDates: dbRecord.blocked_specific_dates_json || [],
    },
    photos: {
      photos: (dbRecord.photos_with_urls_captions_and_sort_order_json || []).map((p, index) => ({
        id: p.id,
        url: p.url || p.Photo,
        Photo: p.Photo || p.url,
        'Photo (thumbnail)': p['Photo (thumbnail)'] || p.url || p.Photo,
        caption: p.caption || '',
        displayOrder: p.displayOrder ?? index,
        SortOrder: p.SortOrder ?? p.displayOrder ?? index,
        toggleMainPhoto: p.toggleMainPhoto ?? (index === 0),
        storagePath: p.storagePath || null
      })),
      minRequired: 3,
    },
    review: {
      safetyFeatures: dbRecord.safety_feature_reference_ids_json || [],
      squareFootage: dbRecord.square_feet || null,
      firstDayAvailable: dbRecord.first_available_date || '',
      agreedToTerms: dbRecord.agreed_to_terms || false,
      optionalNotes: dbRecord.optional_notes || '',
      previousReviewsLink: dbRecord.previous_reviews_link || '',
    },
    currentSection: formMetadata.currentSection || 1,
    completedSections: formMetadata.completedSections || [],
    isDraft: formMetadata.isDraft !== false,
    isSubmitted: formMetadata.isSubmitted || false,

    // V2 fields
    hostType: dbRecord.host_type || null,
    marketStrategy: dbRecord.market_strategy || 'private',
  };
}

/**
 * Map array of 1-based day numbers to available nights object
 *
 * @param {number[]} daysArray - Array of 1-based day numbers
 * @returns {object} - {sunday: bool, monday: bool, ...}
 */
function mapArrayToAvailableNights(daysArray) {
  const dayMapping = {
    1: 'sunday',
    2: 'monday',
    3: 'tuesday',
    4: 'wednesday',
    5: 'thursday',
    6: 'friday',
    7: 'saturday',
  };

  const result = {
    sunday: false,
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
  };

  if (Array.isArray(daysArray)) {
    for (const dayNum of daysArray) {
      const dayName = dayMapping[dayNum];
      if (dayName) {
        result[dayName] = true;
      }
    }
  }

  return result;
}
