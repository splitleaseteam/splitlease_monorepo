/**
 * Analyze Proposal Pricing Script
 *
 * This script analyzes proposals and their pricing_list data to determine
 * which proposals need pricing corrections.
 *
 * Run with: node scripts/analyze_proposal_pricing.js
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables from app/.env
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../app/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Missing Supabase credentials in app/.env');
  process.exit(1);
}

console.log('Connecting to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('\n========================================');
  console.log('ANALYSIS: Proposal Pricing Check');
  console.log('========================================\n');

  // Step 1: Fetch all proposals
  console.log('Fetching proposals...');

  const { data: proposals, error: proposalsError } = await supabase
    .from('proposal')
    .select(`
      _id,
      "Status",
      "Nights Selected (Nights list)",
      "nights per week (num)",
      "Reservation Span (Weeks)",
      "4 week compensation",
      "Total Compensation (proposal - host)",
      "Total Price for Reservation (guest)",
      "Listing"
    `);

  if (proposalsError) {
    console.error('Error fetching proposals:', proposalsError);
    return;
  }

  console.log(`Fetched ${proposals.length} proposals`);

  // Step 2: Fetch listings with pricing_list
  const listingIds = [...new Set(proposals.map(p => p.Listing).filter(Boolean))];
  console.log(`Found ${listingIds.length} unique listings`);

  const { data: listings, error: listingsError } = await supabase
    .from('listing')
    .select('_id, "Name", pricing_list')
    .in('_id', listingIds);

  if (listingsError) {
    console.error('Error fetching listings:', listingsError);
    return;
  }

  // Step 3: Fetch pricing_list records
  const pricingListIds = [...new Set(listings.map(l => l.pricing_list).filter(Boolean))];
  console.log(`Found ${pricingListIds.length} pricing_list records`);

  const { data: pricingLists, error: pricingListError } = await supabase
    .from('pricing_list')
    .select('_id, "Nightly Price", "Host Compensation"')
    .in('_id', pricingListIds);

  if (pricingListError) {
    console.error('Error fetching pricing_list:', pricingListError);
    return;
  }

  // Create lookups
  const listingMap = new Map(listings.map(l => [l._id, l]));
  const pricingListMap = new Map(pricingLists.map(pl => [pl._id, pl]));

  // Step 4: Analyze each proposal
  console.log('\nAnalyzing proposals...\n');

  let withPricingList = 0;
  let withoutPricingList = 0;
  let calculable = 0;
  let needsUpdate = 0;

  const updates = [];

  for (const proposal of proposals) {
    const listing = listingMap.get(proposal.Listing);
    if (!listing || !listing.pricing_list) {
      withoutPricingList++;
      continue;
    }

    const pricingList = pricingListMap.get(listing.pricing_list);
    if (!pricingList) {
      withoutPricingList++;
      continue;
    }

    withPricingList++;

    // Get nights_per_week
    const nightsArray = proposal['Nights Selected (Nights list)'];
    const nightsPerWeek = Array.isArray(nightsArray)
      ? nightsArray.length
      : Number(proposal['nights per week (num)']) || null;

    if (!nightsPerWeek || nightsPerWeek < 1 || nightsPerWeek > 7) {
      continue;
    }

    const weeks = proposal['Reservation Span (Weeks)'];
    if (!weeks || weeks < 1) {
      continue;
    }

    // Get rates from pricing arrays
    const nightlyPriceArray = pricingList['Nightly Price'];
    const hostCompensationArray = pricingList['Host Compensation'];

    if (!Array.isArray(nightlyPriceArray) || !Array.isArray(hostCompensationArray)) {
      continue;
    }

    const guestNightlyRate = nightlyPriceArray[nightsPerWeek - 1];
    const hostNightlyRate = hostCompensationArray[nightsPerWeek - 1];

    if (guestNightlyRate == null || hostNightlyRate == null) {
      continue;
    }

    calculable++;

    // Calculate new values
    const new4WeekCompensation = Math.round(hostNightlyRate * nightsPerWeek * 4);
    const newHostTotal = Math.round(hostNightlyRate * nightsPerWeek * weeks * 100) / 100;
    const newGuestTotal = Math.round(guestNightlyRate * nightsPerWeek * weeks * 100) / 100;

    // Check if update needed (allow $1 tolerance)
    const current4Week = proposal['4 week compensation'] || 0;
    const currentHostTotal = Number(proposal['Total Compensation (proposal - host)']) || 0;
    const currentGuestTotal = Number(proposal['Total Price for Reservation (guest)']) || 0;

    const diff4Week = Math.abs(new4WeekCompensation - current4Week);
    const diffHostTotal = Math.abs(newHostTotal - currentHostTotal);
    const diffGuestTotal = Math.abs(newGuestTotal - currentGuestTotal);

    if (diff4Week > 1 || diffHostTotal > 1 || diffGuestTotal > 1) {
      needsUpdate++;
      updates.push({
        id: proposal._id,
        status: proposal.Status,
        listingName: listing.Name,
        nightsPerWeek,
        weeks,
        guestNightlyRate,
        hostNightlyRate,
        current: { fourWeek: current4Week, hostTotal: currentHostTotal, guestTotal: currentGuestTotal },
        new: { fourWeek: new4WeekCompensation, hostTotal: newHostTotal, guestTotal: newGuestTotal },
        delta: { fourWeek: new4WeekCompensation - current4Week, hostTotal: newHostTotal - currentHostTotal, guestTotal: newGuestTotal - currentGuestTotal }
      });
    }
  }

  // Print summary
  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================\n');
  console.log(`Total proposals: ${proposals.length}`);
  console.log(`With pricing_list: ${withPricingList}`);
  console.log(`Without pricing_list: ${withoutPricingList}`);
  console.log(`Calculable (valid data): ${calculable}`);
  console.log(`Need pricing update: ${needsUpdate}`);

  // Print detailed updates
  if (updates.length > 0) {
    console.log('\n========================================');
    console.log(`PROPOSALS NEEDING UPDATE (${updates.length} total):`);
    console.log('========================================\n');

    for (const u of updates) {
      console.log(`Proposal: ${u.id}`);
      console.log(`  Status: ${u.status}`);
      console.log(`  Listing: ${u.listingName}`);
      console.log(`  Nights/week: ${u.nightsPerWeek}, Weeks: ${u.weeks}`);
      console.log(`  Guest Nightly Rate: $${u.guestNightlyRate}`);
      console.log(`  Host Nightly Rate: $${u.hostNightlyRate}`);
      console.log(`  4-Week Compensation: $${u.current.fourWeek} -> $${u.new.fourWeek} (${u.delta.fourWeek > 0 ? '+' : ''}$${u.delta.fourWeek})`);
      console.log(`  Host Total: $${u.current.hostTotal} -> $${u.new.hostTotal} (${u.delta.hostTotal > 0 ? '+' : ''}$${Math.round(u.delta.hostTotal)})`);
      console.log(`  Guest Total: $${u.current.guestTotal} -> $${u.new.guestTotal} (${u.delta.guestTotal > 0 ? '+' : ''}$${Math.round(u.delta.guestTotal)})`);
      console.log('');
    }

    // Generate SQL UPDATE statement
    console.log('\n========================================');
    console.log('SQL UPDATE STATEMENT');
    console.log('========================================\n');

    console.log(`-- Run this in Supabase SQL Editor to update ${updates.length} proposals\n`);
    console.log(`UPDATE proposal p
SET
    "4 week compensation" = ROUND(
        (pl."Host Compensation"->(
            COALESCE(
                jsonb_array_length(p."Nights Selected (Nights list)"),
                (p."nights per week (num)")::int
            ) - 1
        ))::numeric *
        COALESCE(
            jsonb_array_length(p."Nights Selected (Nights list)"),
            (p."nights per week (num)")::int
        ) * 4,
    0)::integer,

    "Total Compensation (proposal - host)" = ROUND(
        (pl."Host Compensation"->(
            COALESCE(
                jsonb_array_length(p."Nights Selected (Nights list)"),
                (p."nights per week (num)")::int
            ) - 1
        ))::numeric *
        COALESCE(
            jsonb_array_length(p."Nights Selected (Nights list)"),
            (p."nights per week (num)")::int
        ) *
        p."Reservation Span (Weeks)",
    2),

    "Total Price for Reservation (guest)" = ROUND(
        (pl."Nightly Price"->(
            COALESCE(
                jsonb_array_length(p."Nights Selected (Nights list)"),
                (p."nights per week (num)")::int
            ) - 1
        ))::numeric *
        COALESCE(
            jsonb_array_length(p."Nights Selected (Nights list)"),
            (p."nights per week (num)")::int
        ) *
        p."Reservation Span (Weeks)",
    2)

FROM listing l
JOIN pricing_list pl ON l.pricing_list = pl._id
WHERE p."Listing" = l._id
  AND l.pricing_list IS NOT NULL
  AND COALESCE(
        jsonb_array_length(p."Nights Selected (Nights list)"),
        (p."nights per week (num)")::int
    ) IS NOT NULL
  AND COALESCE(
        jsonb_array_length(p."Nights Selected (Nights list)"),
        (p."nights per week (num)")::int
    ) > 0
  AND COALESCE(
        jsonb_array_length(p."Nights Selected (Nights list)"),
        (p."nights per week (num)")::int
    ) <= 7
  AND p."Reservation Span (Weeks)" IS NOT NULL
  AND p."Reservation Span (Weeks)" > 0
  AND (pl."Nightly Price"->(
        COALESCE(
            jsonb_array_length(p."Nights Selected (Nights list)"),
            (p."nights per week (num)")::int
        ) - 1
    )) IS NOT NULL
  AND (pl."Host Compensation"->(
        COALESCE(
            jsonb_array_length(p."Nights Selected (Nights list)"),
            (p."nights per week (num)")::int
        ) - 1
    )) IS NOT NULL;`);
  }
}

main().catch(console.error);
