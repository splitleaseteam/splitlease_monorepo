/**
 * Get Pricing List Handler
 *
 * Retrieves pricing_list by listing_id.
 * First fetches the listing to get its pricing_list FK, then fetches the pricing_list.
 *
 * NO FALLBACK PRINCIPLE: Returns null if not found (not an error)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateRequiredFields } from '../../_shared/validation.ts';

interface GetPayload {
  listing_id: string;
}

interface GetResult {
  pricing_list: Record<string, unknown> | null;
  found: boolean;
  message: string;
}

/**
 * Handle get pricing list action
 */
export async function handleGet(
  payload: Record<string, unknown>
): Promise<GetResult> {
  console.log('[pricing-list:get] ========== GET PRICING LIST ==========');

  // Validate required fields
  validateRequiredFields(payload, ['listing_id']);

  const { listing_id } = payload as GetPayload;

  // Get environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables');
  }

  // Initialize Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('[pricing-list:get] Looking up pricing for listing:', listing_id);

  try {
    // Step 1: Fetch listing to get its pricing_list FK
    // Note: The FK is on listing.pricing_list (listing points to pricing_list)
    const { data: listing, error: listingError } = await supabase
      .from('listing')
      .select('pricing_list')
      .eq('_id', listing_id)
      .single();

    if (listingError) {
      console.error('[pricing-list:get] Listing fetch error:', listingError);
      throw new Error(`Failed to fetch listing: ${listingError.message}`);
    }

    if (!listing?.pricing_list) {
      console.log('[pricing-list:get] No pricing_list FK on listing:', listing_id);
      return {
        pricing_list: null,
        found: false,
        message: 'No pricing list found for this listing',
      };
    }

    console.log('[pricing-list:get] Found pricing_list FK:', listing.pricing_list);

    // Step 2: Fetch the pricing_list by its _id
    const { data: pricingList, error: fetchError } = await supabase
      .from('pricing_list')
      .select('*')
      .eq('_id', listing.pricing_list)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = "No rows found" - not an error, just empty
      console.error('[pricing-list:get] Fetch error:', fetchError);
      throw new Error(`Failed to fetch pricing_list: ${fetchError.message}`);
    }

    if (!pricingList) {
      console.log('[pricing-list:get] pricing_list record not found:', listing.pricing_list);
      return {
        pricing_list: null,
        found: false,
        message: 'Pricing list record not found (orphaned FK)',
      };
    }

    console.log('[pricing-list:get] ✅ Pricing list found');
    console.log('[pricing-list:get] Starting price:', pricingList['Starting Nightly Price']);

    return {
      pricing_list: pricingList,
      found: true,
      message: 'Pricing list retrieved successfully',
    };
  } catch (error) {
    console.error('[pricing-list:get] ========== ERROR ==========');
    console.error('[pricing-list:get] Failed:', error);
    throw error;
  }
}
