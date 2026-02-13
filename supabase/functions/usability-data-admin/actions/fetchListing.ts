/**
 * Fetch Listing Action Handler
 * Get listing by ID (supports both id and legacy platform ID)
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface FetchListingPayload {
  listingId: string;
}

export async function handleFetchListing(
  payload: FetchListingPayload,
  supabase: SupabaseClient
) {
  const { listingId } = payload;

  if (!listingId) {
    throw new Error('listingId is required');
  }

  console.log('[usability-data-admin] Fetching listing:', listingId);

  // Try fetching by id first
  let { data, error } = await supabase
    .from('listing')
    .select('id, legacy_platform_id, listing_title, nightly_rate_for_1_night_stay, photos, host_user_id')
    .eq('id', listingId)
    .single();

  // If not found by id, try by legacy platform ID
  if (error && error.code === 'PGRST116') {
    const result = await supabase
      .from('listing')
      .select('id, legacy_platform_id, listing_title, nightly_rate_for_1_night_stay, photos, host_user_id')
      .eq('legacy_platform_id', listingId)
      .single();

    data = result.data;
    error = result.error;
  }

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error(`Listing not found: ${listingId}`);
    }
    console.error('[usability-data-admin] Fetch listing error:', error);
    throw new Error(`Failed to fetch listing: ${error.message}`);
  }

  // Parse photos JSON if it's a string
  let photos: string[] = [];
  if (data.photos) {
    if (typeof data.photos === 'string') {
      try {
        photos = JSON.parse(data.photos);
      } catch {
        photos = [];
      }
    } else if (Array.isArray(data.photos)) {
      photos = data.photos;
    }
  }

  return {
    listing: {
      id: data.id,
      uniqueId: data.legacy_platform_id,
      name: data.listing_title || 'Untitled Listing',
      nightlyPrice: data.nightly_rate_for_1_night_stay || 0,
      photos,
      hostId: data.host_user_id,
    },
  };
}
