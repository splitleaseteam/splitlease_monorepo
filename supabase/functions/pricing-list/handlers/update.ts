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
        id,
        pricing_configuration_id,
        nightly_rate_for_1_night_stay,
        nightly_rate_for_2_night_stay,
        nightly_rate_for_3_night_stay,
        nightly_rate_for_4_night_stay,
        nightly_rate_for_5_night_stay,
        nightly_rate_for_7_night_stay,
        weekly_rate_paid_to_host,
        monthly_rate_paid_to_host,
        rental_type,
        host_user_id
      `)
      .eq('id', listing_id)
      .single();

    if (fetchError || !listing) {
      console.error('[pricing-list:update] Listing not found:', listing_id);
      throw new Error(`Listing not found: ${listing_id}`);
    }

    if (!listing.pricing_configuration_id) {
      console.error('[pricing-list:update] No pricing_configuration_id on listing:', listing_id);
      throw new Error(`No pricing_list found for listing: ${listing_id}. Call create first.`);
    }

    const pricingListId = listing.pricing_configuration_id;
    console.log('[pricing-list:update] ✅ Step 1 complete - Listing found with pricing_configuration_id:', pricingListId);

    // Step 2: Calculate pricing with new inputs
    console.log('[pricing-list:update] Step 2/3: Calculating pricing...');
    const pricingData = calculatePricingList({
      listing,
      unitMarkup: unit_markup,
    });

    console.log('[pricing-list:update] ✅ Step 2 complete - Pricing calculated');

    // Step 3: Update pricing_list by its id
    // Note: Only include columns that exist in pricing_list table schema
    console.log('[pricing-list:update] Step 3/3: Updating pricing_list...');

    const now = new Date().toISOString();

    const updateData = {
      // Arrays (JSONB)
      host_compensation: pricingData.hostCompensation,
      markup_and_discount_multiplier: pricingData.markupAndDiscountMultiplier,
      nightly_price: pricingData.nightlyPrice,
      unused_nights_discount: pricingData.unusedNightsDiscount,

      // Scalar markups
      unit_markup: pricingData.unitMarkup,
      combined_markup: pricingData.combinedMarkup,
      full_time_discount: pricingData.fullTimeDiscount,

      // Derived scalars
      starting_nightly_price: pricingData.startingNightlyPrice,

      // Metadata
      original_updated_at: now,
    };

    const { error: updateError } = await supabase
      .from('pricing_list')
      .update(updateData)
      .eq('id', pricingListId);

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
