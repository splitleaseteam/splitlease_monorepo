/**
 * Suggested Proposal Service
 *
 * API calls for the Create Suggested Proposal page.
 * Uses direct Supabase queries for search and the proposal Edge Function for creation.
 */

import { supabase } from '../../../lib/supabase.js';

// ============================================================================
// REFERENCE DATA LOOKUPS
// ============================================================================

// Borough Bubble FK ID to display name mapping
const BOROUGH_LOOKUP = {
  '1607041299637x913970439175620100': 'Brooklyn',
  '1607041299687x679479834266385900': 'Manhattan',
  '1607041299715x741251947580746200': 'Bronx',
  '1607041299828x406969561802059650': 'Queens',
  '1686599616073x348655546878883200': 'Weehawken, NJ',
  '1686674905048x436838997624262400': 'Newark, NJ'
};

// ============================================================================
// LISTING OPERATIONS
// ============================================================================

// Standard fields to select for listing queries
// Includes join with account_host and user to fetch host information
const LISTING_SELECT_FIELDS = `
  id,
  listing_title,
  "Description",
  is_active,
  is_approved,
  host_user_id,
  "Host email",
  host_display_name,
  "Host / Landlord",
  address_with_lat_lng_json,
  city,
  state,
  borough,
  primary_neighborhood_reference_id,
  zip_code,
  photos_with_urls_captions_and_sort_order_json,
  bedroom_count,
  bathroom_count,
  bed_count,
  space_type,
  rental_type,
  available_nights_as_day_numbers_json,
  available_days_as_day_numbers_json,
  minimum_nights_per_stay,
  maximum_weeks_per_stay,
  monthly_rate_paid_to_host,
  weekly_rate_paid_to_host,
  nightly_rate_for_2_night_stay,
  nightly_rate_for_3_night_stay,
  nightly_rate_for_4_night_stay,
  nightly_rate_for_5_night_stay,
  nightly_rate_for_6_night_stay,
  nightly_rate_for_7_night_stay,
  cleaning_fee_amount,
  damage_deposit_amount,
  account_host!inner(
    user!inner(
      first_name,
      last_name,
      "email as text"
    )
  )
`;

/**
 * Check if a listing has valid pricing for its rental type
 * @param {Object} listing - Listing object
 * @returns {boolean} True if listing has valid pricing
 */
function hasValidPricing(listing) {
  const rentalType = listing.rental_type;
  if (!rentalType) return false;

  if (rentalType === 'Monthly') {
    return !!listing.monthly_rate_paid_to_host && listing.monthly_rate_paid_to_host > 0;
  }
  if (rentalType === 'Weekly') {
    return !!listing.weekly_rate_paid_to_host && listing.weekly_rate_paid_to_host > 0;
  }
  // Nightly - check if any nightly rate is set
  return !!(
    listing.nightly_rate_for_2_night_stay ||
    listing.nightly_rate_for_3_night_stay ||
    listing.nightly_rate_for_4_night_stay ||
    listing.nightly_rate_for_5_night_stay ||
    listing.nightly_rate_for_6_night_stay ||
    listing.nightly_rate_for_7_night_stay
  );
}

/**
 * Get default listings with valid pricing (for showing when search box is empty)
 * Listings must have a rental type set and the corresponding price field populated
 */
export async function getDefaultListings() {
  try {
    const { data, error } = await supabase
      .from('listing')
      .select(LISTING_SELECT_FIELDS)
      .eq('is_deleted', false)
      .not('rental_type', 'is', null)
      .order('original_updated_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Filter client-side for valid pricing (Supabase can't do OR across different fields easily)
    const validListings = (data || []).filter(hasValidPricing);

    return { data: validListings.slice(0, 20), error: null };
  } catch (error) {
    console.error('[suggestedProposalService] getDefaultListings error:', error);
    return { data: [], error: error.message };
  }
}

/**
 * Search listings by host name, email, listing name, unique ID, or rental type
 */
export async function searchListings(searchTerm) {
  try {
    const { data, error } = await supabase
      .from('listing')
      .select(LISTING_SELECT_FIELDS)
      .eq('is_deleted', false)
      .or(`listing_title.ilike.%${searchTerm}%,host_display_name.ilike.%${searchTerm}%,host_email.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%,rental_type.ilike.%${searchTerm}%`)
      .limit(20);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('[suggestedProposalService] searchListings error:', error);
    return { data: [], error: error.message };
  }
}

/**
 * Get photos for a listing from the embedded JSONB column
 */
export async function getListingPhotos(listingId) {
  try {
    const { data: listing, error } = await supabase
      .from('listing')
      .select('photos_with_urls_captions_and_sort_order_json')
      .eq('id', listingId)
      .single();

    if (error) throw error;

    let photos = listing?.photos_with_urls_captions_and_sort_order_json;
    // Handle double-encoded JSON string
    if (typeof photos === 'string') {
      try {
        photos = JSON.parse(photos);
      } catch {
        photos = [];
      }
    }

    if (!Array.isArray(photos)) {
      return { data: [], error: null };
    }

    // Sort by sort_order and transform to match old listing_photo shape
    const sorted = [...photos].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const transformed = sorted.map((photo, index) => ({
      _id: photo.id || `photo_${index}`,
      Photo: typeof photo === 'string' ? photo : (photo.url || ''),
      'Photo (thumbnail)': typeof photo === 'string' ? photo : (photo.url || ''),
      caption: photo.caption || '',
      SortOrder: photo.sort_order ?? index,
      Active: true,
    }));

    return { data: transformed, error: null };
  } catch (error) {
    console.error('[suggestedProposalService] getListingPhotos error:', error);
    return { data: [], error: error.message };
  }
}

// ============================================================================
// USER/GUEST OPERATIONS
// ============================================================================

// Standard fields to select for user/guest queries
const USER_SELECT_FIELDS = `
  id,
  first_name,
  last_name,
  email,
  phone_number,
  profile_photo_url,
  bio_text,
  stated_need_for_space_text,
  stated_special_needs_text,
  current_user_role,
  original_created_at
`;

/**
 * Get default guest list (users with guest user type)
 * Shows all guests when search box is empty/focused
 */
export async function getDefaultGuests() {
  try {
    const { data, error } = await supabase
      .from('user')
      .select(USER_SELECT_FIELDS)
      .ilike('current_user_role', '%Guest%')
      .order('original_created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('[suggestedProposalService] getDefaultGuests error:', error);
    return { data: [], error: error.message };
  }
}

/**
 * Search guests by name, email, phone, or unique ID
 * Only returns users with guest user type
 */
export async function searchGuests(searchTerm) {
  try {
    const { data, error } = await supabase
      .from('user')
      .select(USER_SELECT_FIELDS)
      .ilike('current_user_role', '%Guest%')
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`)
      .order('original_created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('[suggestedProposalService] searchGuests error:', error);
    return { data: [], error: error.message };
  }
}

/**
 * Get existing proposals for a user on a specific listing
 * Returns proposals with prefill fields, ordered by most recent first
 */
export async function getUserProposalsForListing(userId, listingId) {
  try {
    const { data, error } = await supabase
      .from('booking_proposal')
      .select(`
        id,
        proposal_workflow_status,
        guest_selected_days_numbers_json,
        reservation_span_in_weeks,
        move_in_range_start_date,
        original_created_at
      `)
      .eq('guest_user_id', userId)
      .eq('listing_id', listingId)
      .neq('is_deleted', true)
      .order('original_created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('[suggestedProposalService] getUserProposalsForListing error:', error);
    return { data: [], error: error.message };
  }
}

/**
 * Get the most recent proposal for a user across ALL listings
 * Used for prefilling form fields when creating new proposals
 *
 * Note: Uses Edge Function with service role to bypass RLS,
 * since hosts need to query other users' proposals for prefill.
 */
export async function getUserMostRecentProposal(userId) {
  console.log('[PREFILL DEBUG] getUserMostRecentProposal called with userId:', userId);
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proposal`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_prefill_data',
          payload: { guestId: userId }
        })
      }
    );

    const result = await response.json();
    console.log('[PREFILL DEBUG] Edge Function result:', result);

    if (!response.ok || result.error) {
      throw new Error(result.error || result.message || 'Failed to fetch prefill data');
    }

    // Transform Edge Function response to match expected format
    const prefillData = result.data;
    if (!prefillData) {
      return { data: null, error: null };
    }

    // Map to the format expected by the hook
    const mappedData = {
      id: prefillData.id,
      guest_selected_days_numbers_json: prefillData.daysSelected,
      reservation_span_in_weeks: prefillData.reservationSpanWeeks,
      move_in_range_start_date: prefillData.moveInRangeStart,
    };

    console.log('[PREFILL DEBUG] Mapped prefill data:', mappedData);

    return { data: mappedData, error: null };
  } catch (error) {
    console.error('[suggestedProposalService] getUserMostRecentProposal error:', error);
    return { data: null, error: error.message };
  }
}

// ============================================================================
// PROPOSAL CREATION
// ============================================================================

/**
 * Create a suggested proposal via the proposal Edge Function
 *
 * This uses the Edge Function to ensure proper ID generation,
 * sync queue handling, and thread creation.
 */
export async function createSuggestedProposal(proposalData) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proposal`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_suggested',
          payload: proposalData
        })
      }
    );

    const result = await response.json();

    if (!response.ok || result.error) {
      throw new Error(result.error || result.message || 'Failed to create proposal');
    }

    return { data: result.data, error: null };
  } catch (error) {
    console.error('[suggestedProposalService] createSuggestedProposal error:', error);
    return { data: null, error: error.message };
  }
}

// ============================================================================
// AI TRANSCRIPTION PARSING
// ============================================================================

/**
 * Parse a call transcription using AI to extract guest profile fields
 *
 * @param {string} transcription - The call transcription or notes text
 * @returns {Promise<{data: {aboutMe: string, needForSpace: string, specialNeeds: string}, error: string|null}>}
 */
export async function parseCallTranscription(transcription) {
  try {
    if (!transcription || transcription.trim().length === 0) {
      return { data: null, error: 'Transcription text is required' };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-gateway`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'complete',
          payload: {
            prompt_key: 'parse-call-transcription',
            variables: {
              transcription: transcription.trim()
            }
          }
        })
      }
    );

    const result = await response.json();

    if (!response.ok || result.error) {
      throw new Error(result.error || result.message || 'Failed to parse transcription');
    }

    // The AI gateway returns the completion in result.data.content
    const completion = result.data?.content;

    if (!completion) {
      throw new Error('No completion returned from AI');
    }

    // Parse the JSON response from the AI
    let parsed;
    try {
      parsed = typeof completion === 'string' ? JSON.parse(completion) : completion;
    } catch (_parseError) {
      console.error('[suggestedProposalService] Failed to parse AI response:', completion);
      throw new Error('AI returned invalid JSON response');
    }

    return {
      data: {
        aboutMe: parsed.aboutMe || '',
        needForSpace: parsed.needForSpace || '',
        specialNeeds: parsed.specialNeeds || ''
      },
      error: null
    };
  } catch (error) {
    console.error('[suggestedProposalService] parseCallTranscription error:', error);
    return { data: null, error: error.message };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract URL from a photo object or return string as-is
 * Photo objects have structure: { url: "...", Photo: "...", "Photo (thumbnail)": "..." }
 */
function extractPhotoUrl(photo) {
  if (!photo) return '';
  if (typeof photo === 'string') return photo;
  // Photo object - prefer url, then Photo, then thumbnail
  return photo.url || photo.Photo || photo['Photo (thumbnail)'] || '';
}

/**
 * Get the first photo URL from a listing
 */
export function getFirstPhoto(listing, photos = []) {
  // First try photos array passed in
  if (photos.length > 0) {
    return photos[0]?.Photo || photos[0]?.['Photo (thumbnail)'] || '';
  }

  // Read from listing's embedded photos JSONB column
  const featurePhotos = listing?.photos_with_urls_captions_and_sort_order_json;
  if (Array.isArray(featurePhotos) && featurePhotos.length > 0) {
    return extractPhotoUrl(featurePhotos[0]);
  }
  if (typeof featurePhotos === 'string') {
    try {
      const parsed = JSON.parse(featurePhotos);
      return Array.isArray(parsed) ? extractPhotoUrl(parsed[0]) : '';
    } catch {
      return featurePhotos;
    }
  }

  return '';
}

/**
 * Get the last photo URL from a listing
 */
export function getLastPhoto(listing, photos = []) {
  if (photos.length > 0) {
    return photos[photos.length - 1]?.Photo || photos[photos.length - 1]?.['Photo (thumbnail)'] || '';
  }

  const featurePhotos = listing?.photos_with_urls_captions_and_sort_order_json;
  if (Array.isArray(featurePhotos) && featurePhotos.length > 0) {
    return extractPhotoUrl(featurePhotos[featurePhotos.length - 1]);
  }
  if (typeof featurePhotos === 'string') {
    try {
      const parsed = JSON.parse(featurePhotos);
      return Array.isArray(parsed) ? extractPhotoUrl(parsed[parsed.length - 1]) : '';
    } catch {
      return '';
    }
  }

  return '';
}

/**
 * Get borough display name from Bubble FK ID
 */
export function getBoroughName(boroughId) {
  return BOROUGH_LOOKUP[boroughId] || null;
}

/**
 * Get address string from listing
 *
 * Returns: "Borough, Full Address" or fallback to "Borough, State, Zip"
 * Location - Address JSON structure: { address: "Full Address String", lat, lng }
 */
export function getAddressString(listing) {
  if (!listing) return '';

  const boroughName = getBoroughName(listing.borough);
  const locationAddress = listing.address_with_lat_lng_json;

  // Primary: Borough + full address from JSON
  if (typeof locationAddress === 'object' && locationAddress !== null && locationAddress.address) {
    return boroughName
      ? `${boroughName}, ${locationAddress.address}`
      : locationAddress.address;
  }

  // Fallback: Borough + State + Zip
  return [
    boroughName,
    listing.state,
    listing.zip_code
  ].filter(Boolean).join(', ');
}

/**
 * Default placeholder photo
 */
export function getDefaultPhoto() {
  return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23E0E0E0" width="100" height="100"/%3E%3Ctext fill="%23999" x="50" y="55" text-anchor="middle" font-size="12"%3ENo Photo%3C/text%3E%3C/svg%3E';
}
