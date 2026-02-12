/**
 * Bulk Pricing List Processor
 *
 * Recalculates pricing lists for all listings in the database.
 * Addresses:
 * - Missing pricing_list FK (creates new)
 * - Empty Host Compensation arrays
 * - Empty Nightly Price arrays
 * - Wrong formula (Weekly/Monthly now corrected)
 *
 * Usage:
 *   POST /functions/v1/pricing-list-bulk
 *   Body: { "dry_run": false, "limit": 1000, "offset": 0 }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { calculatePricingList } from '../pricing-list/utils/pricingCalculator.ts';

interface BulkResults {
  total: number;
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Parse request body for options
    const { dry_run = false, limit = 1000, offset = 0 } = await req
      .json()
      .catch(() => ({}));

    console.log(
      `[bulk] Starting bulk pricing list update (dry_run: ${dry_run}, limit: ${limit}, offset: ${offset})`
    );

    // Fetch all listings with required pricing columns
    const { data: listings, error: fetchError } = await supabase
      .from('listing')
      .select(
        `
        id,
        nightly_rate_1_night,
        nightly_rate_2_nights,
        nightly_rate_3_nights,
        nightly_rate_4_nights,
        nightly_rate_5_nights,
        nightly_rate_6_nights,
        nightly_rate_7_nights,
        weekly_host_rate,
        monthly_host_rate,
        unit_markup,
        "rental type",
        "Host User",
        pricing_list
      `
      )
      .range(offset, offset + limit - 1);

    if (fetchError) {
      throw new Error(`Failed to fetch listings: ${fetchError.message}`);
    }

    console.log(`[bulk] Found ${listings?.length || 0} listings to process`);

    const results: BulkResults = {
      total: listings?.length || 0,
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    // Process each listing
    for (const listing of listings || []) {
      try {
        const pricingData = calculatePricingList({
          listing,
          unitMarkup: listing['unit_markup'] || 0,
        });

        // Skip if no valid pricing data (no host rates at all)
        if (pricingData.startingNightlyPrice === null) {
          console.log(`[bulk] Skipping ${listing.id} - no valid host rates`);
          results.skipped++;
          continue;
        }

        if (dry_run) {
          console.log(
            `[bulk] DRY RUN: Would update ${listing.id} (${listing['rental type'] || 'null'}) -> $${pricingData.startingNightlyPrice}`
          );
          results.processed++;
          continue;
        }

        // Generate new ID if needed
        let pricingListId = listing.pricing_list;
        let isNew = false;

        if (!pricingListId) {
          const { data: newId } = await supabase.rpc('generate_unique_id');
          pricingListId = newId;
          isNew = true;
        }

        const now = new Date().toISOString();
        const pricingListRecord = {
          id: pricingListId,
          'Created By': listing['Host User'],
          'Host Compensation': pricingData.hostCompensation,
          'Markup and Discount Multiplier': pricingData.markupAndDiscountMultiplier,
          'Nightly Price': pricingData.nightlyPrice,
          'Unused Nights Discount': pricingData.unusedNightsDiscount,
          'Unit Markup': pricingData.unitMarkup,
          'Combined Markup': pricingData.combinedMarkup,
          'Full Time Discount': pricingData.fullTimeDiscount,
          'Starting Nightly Price': pricingData.startingNightlyPrice,
          'Modified Date': now,
          ...(isNew && { 'Created Date': now }),
        };

        // Upsert pricing_list
        const { error: upsertError } = await supabase
          .from('pricing_list')
          .upsert(pricingListRecord, { onConflict: 'id' });

        if (upsertError) {
          throw new Error(`Upsert failed: ${upsertError.message}`);
        }

        // Update listing FK if new
        if (isNew) {
          const { error: updateError } = await supabase
            .from('listing')
            .update({ pricing_list: pricingListId })
            .eq('id', listing.id);

          if (updateError) {
            throw new Error(`FK update failed: ${updateError.message}`);
          }
          results.created++;
        } else {
          results.updated++;
        }

        results.processed++;
        console.log(
          `[bulk] ✓ ${listing.id} (${listing['rental type'] || 'null'}) -> $${pricingData.startingNightlyPrice}`
        );

        // Rate limiting: 50ms delay between operations
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (err) {
        const errorMsg = `${listing.id}: ${(err as Error).message}`;
        console.error(`[bulk] ✗ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    console.log(`[bulk] Complete:`, results);

    return new Response(JSON.stringify({ success: true, data: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[bulk] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
