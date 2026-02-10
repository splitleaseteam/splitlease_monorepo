/**
 * Update Pricing List Handler
 *
 * Updates pricing inputs (unit markup) and recalculates pricing.
 * First looks up the listing's pricing_list FK, then updates that record.
 *
 * NO FALLBACK PRINCIPLE: Fails fast if listing not found
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateRequiredFields } from '../../_shared/validation.ts';
import { calculatePricingList } from '../utils/pricingCalculator.ts';

interface UpdatePayload {
  listing_id: string;
  unit_markup?: number;
  user_id?: string;
}

interface UpdateResult {
  pricing_list_id: string;
  listing_id: string;
  starting_nightly_price: number | null;
  message: string;
}

/**
 * Handle update pricing list action
 */
export async function handleUpdate(
  payload: Record<string, unknown>
): Promise<UpdateResult> {
  console.log('[pricing-list:update] ========== UPDATE PRICING LIST ==========');

  // Validate required fields
  validateRequiredFields(payload, ['listing_id']);

  const { listing_id, unit_markup = 0, user_id: _user_id } = payload as UpdatePayload;

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

  console.log('[pricing-list:update] Listing ID:', listing_id);
  console.log('[pricing-list:update] Unit Markup:', unit_markup);

  try {
    // Step 1: Fetch listing with its pricing_list FK
    console.log('[pricing-list:update] Step 1/3: Fetching listing...');
    const { data: listing, error: fetchError } = await supabase
      .from('listing')
      .select(`
        _id,
        pricing_list,
        nightly_rate_1_night,
        nightly_rate_2_nights,
        nightly_rate_3_nights,
        nightly_rate_4_nights,
        nightly_rate_5_nights,
        nightly_rate_6_nights,
        nightly_rate_7_nights,
        "rental type",
        "Host User"
      `)
      .eq('_id', listing_id)
      .single();

    if (fetchError || !listing) {
      console.error('[pricing-list:update] Listing not found:', listing_id);
      throw new Error(`Listing not found: ${listing_id}`);
    }

    if (!listing.pricing_list) {
      console.error('[pricing-list:update] No pricing_list FK on listing:', listing_id);
      throw new Error(`No pricing_list found for listing: ${listing_id}. Call create first.`);
    }

    const pricingListId = listing.pricing_list;
    console.log('[pricing-list:update] ✅ Step 1 complete - Listing found with pricing_list:', pricingListId);

    // Step 2: Calculate pricing with new inputs
    console.log('[pricing-list:update] Step 2/3: Calculating pricing...');
    const pricingData = calculatePricingList({
      listing,
      unitMarkup: unit_markup,
    });

    console.log('[pricing-list:update] ✅ Step 2 complete - Pricing calculated');

    // Step 3: Update pricing_list by its _id
    // Note: Only include columns that exist in pricing_list table schema
    console.log('[pricing-list:update] Step 3/3: Updating pricing_list...');

    const now = new Date().toISOString();

    const updateData = {
      // Arrays (JSONB)
      'Host Compensation': pricingData.hostCompensation,
      'Markup and Discount Multiplier': pricingData.markupAndDiscountMultiplier,
      'Nightly Price': pricingData.nightlyPrice,
      'Unused Nights Discount': pricingData.unusedNightsDiscount,

      // Scalar markups
      'Unit Markup': pricingData.unitMarkup,
      'Combined Markup': pricingData.combinedMarkup,
      'Full Time Discount': pricingData.fullTimeDiscount,

      // Derived scalars
      'Starting Nightly Price': pricingData.startingNightlyPrice,

      // Metadata
      'Modified Date': now,
    };

    const { error: updateError } = await supabase
      .from('pricing_list')
      .update(updateData)
      .eq('_id', pricingListId);

    if (updateError) {
      console.error('[pricing-list:update] Update failed:', updateError);
      throw new Error(`Failed to update pricing_list: ${updateError.message}`);
    }

    console.log('[pricing-list:update] ✅ Step 3 complete - Pricing list updated');

    console.log('[pricing-list:update] ========== SUCCESS ==========');

    return {
      pricing_list_id: pricingListId,
      listing_id: listing_id,
      starting_nightly_price: pricingData.startingNightlyPrice,
      message: 'Pricing list updated successfully',
    };
  } catch (error) {
    console.error('[pricing-list:update] ========== ERROR ==========');
    console.error('[pricing-list:update] Failed:', error);
    throw error;
  }
}
