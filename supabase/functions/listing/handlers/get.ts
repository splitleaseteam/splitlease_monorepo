/**
 * Get Listing Handler
 * Priority: HIGH
 *
 * Fetches listing data from Supabase
 * Used by self-listing page to preload listing name and other data
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateRequiredFields } from '../../_shared/validation.ts';

interface GetListingPayload {
  listing_id: string;
}

/**
 * Handle fetching a listing by ID
 * Fetches from Supabase and returns the data
 */
export async function handleGet(
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  console.log('[listing:get] ========== GET LISTING ==========');
  console.log('[listing:get] Payload:', JSON.stringify(payload, null, 2));

  // Validate required fields
  validateRequiredFields(payload, ['listing_id']);

  const { listing_id } = payload as GetListingPayload;

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('[listing:get] Fetching listing ID:', listing_id);

  try {
    const { data: listingData, error } = await supabase
      .from('listing')
      .select('*')
      .eq('_id', listing_id)
      .single();

    if (error || !listingData) {
      console.error('[listing:get] Listing fetch failed:', error);
      throw new Error(`Listing not found: ${listing_id}`);
    }

    console.log('[listing:get] Listing fetched from Supabase');
    console.log('[listing:get] Listing Name:', listingData?.Name);
    console.log('[listing:get] ========== SUCCESS ==========');

    return listingData;
  } catch (error) {
    console.error('[listing:get] ========== ERROR ==========');
    console.error('[listing:get] Failed to fetch listing:', error);
    throw error;
  }
}
