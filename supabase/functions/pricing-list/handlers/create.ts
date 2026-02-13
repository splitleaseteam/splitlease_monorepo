/**
 * Create Pricing List Handler
 *
 * Creates or updates a pricing_list for a listing by calculating
 * all pricing arrays and scalars from the listing's host rates.
 *
 * FLOW:
 * 1. Fetch listing from Supabase
 * 2. Extract host rates from listing
 * 3. Calculate all pricing arrays and scalars
 * 4. Generate unique ID via RPC
 * 5. Insert pricing_list record
 * 6. Update listing FK to point to new pricing_list
 *
 * NO FALLBACK PRINCIPLE: Fails fast if listing not found or invalid
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateRequiredFields } from '../../_shared/validation.ts';
import { calculatePricingList } from '../utils/pricingCalculator.ts';

interface CreatePayload {
  listing_id: string;
  user_id?: string;
  unit_markup?: number;
}

interface CreateResult {
  pricing_list_id: string;
  listing_id: string;
  starting_nightly_price: number | null;
  message: string;
}

/**
 * Handle create pricing list action
 */
export async function handleCreate(
  payload: Record<string, unknown>
): Promise<CreateResult> {
  console.log('[pricing-list:create] ========== CREATE PRICING LIST ==========');

  // Validate required fields
  validateRequiredFields(payload, ['listing_id']);

  const { listing_id, user_id, unit_markup = 0 } = payload as CreatePayload;

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

  console.log('[pricing-list:create] Listing ID:', listing_id);

  try {
    // Step 1: Fetch listing
    console.log('[pricing-list:create] Step 1/5: Fetching listing...');
    const { data: listing, error: fetchError } = await supabase
      .from('listing')
      .select(`
        id,
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
      console.error('[pricing-list:create] Listing not found:', listing_id);
      throw new Error(`Listing not found: ${listing_id}`);
    }

    console.log('[pricing-list:create] ✅ Step 1 complete - Listing found');

    // Step 2: Calculate pricing
    console.log('[pricing-list:create] Step 2/5: Calculating pricing...');
    const pricingData = calculatePricingList({
      listing,
      unitMarkup: unit_markup,
    });

    console.log('[pricing-list:create] ✅ Step 2 complete - Pricing calculated');
    console.log('[pricing-list:create] Starting price:', pricingData.startingNightlyPrice);

    // Step 3: Generate unique ID via RPC
    console.log('[pricing-list:create] Step 3/5: Generating pricing_list ID...');

    const { data: pricingListId, error: rpcError } = await supabase.rpc('generate_unique_id');

    if (rpcError || !pricingListId) {
      console.error('[pricing-list:create] Failed to generate ID:', rpcError);
      throw new Error('Failed to generate pricing_list ID');
    }

    console.log('[pricing-list:create] ✅ Step 3 complete - Generated ID:', pricingListId);

    // Step 4: Insert pricing_list
    console.log('[pricing-list:create] Step 4/5: Inserting pricing_list...');
    const now = new Date().toISOString();

    // Note: Only include columns that exist in pricing_list table schema
    // Missing columns (not in DB): listing, Overall Site Markup, Slope, rental type
    const pricingListRecord = {
      id: pricingListId,
      created_by: user_id || listing['host_user_id'],

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
      original_created_at: now,
    };

    const { error: insertError } = await supabase
      .from('pricing_list')
      .insert(pricingListRecord);

    if (insertError) {
      console.error('[pricing-list:create] Insert failed:', insertError);
      throw new Error(`Failed to insert pricing_list: ${insertError.message}`);
    }

    console.log('[pricing-list:create] ✅ Step 4 complete - Pricing list saved');

    // Step 5: Update listing FK to point to new pricing_list
    console.log('[pricing-list:create] Step 5/5: Updating listing FK...');

    const { error: updateError } = await supabase
      .from('listing')
      .update({ pricing_configuration_id: pricingListId })
      .eq('id', listing_id);

    if (updateError) {
      console.error('[pricing-list:create] Failed to update listing FK:', updateError);
      throw new Error(`Failed to update listing FK: ${updateError.message}`);
    }

    console.log('[pricing-list:create] ✅ Step 5 complete - Listing FK updated');

    console.log('[pricing-list:create] ========== SUCCESS ==========');

    return {
      pricing_list_id: pricingListId,
      listing_id: listing_id,
      starting_nightly_price: pricingData.startingNightlyPrice,
      message: 'Pricing list created successfully',
    };
  } catch (error) {
    console.error('[pricing-list:create] ========== ERROR ==========');
    console.error('[pricing-list:create] Failed:', error);
    throw error;
  }
}
