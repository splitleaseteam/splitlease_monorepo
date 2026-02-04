/**
 * Bulk Proposal Pricing Fix Script
 *
 * This script recalculates pricing fields for ALL proposals based on their
 * linked listing's pricing_list table.
 *
 * Run with: node scripts/run_bulk_pricing_fix.js
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
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('ERROR: VITE_SUPABASE_URL not found in app/.env');
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not found');
  console.log('You need to set SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('Get it from: Supabase Dashboard > Project Settings > API > service_role key');
  process.exit(1);
}

console.log('Connecting to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  console.log('\n========================================');
  console.log('BULK FIX: Proposal Pricing Recalculation');
  console.log('========================================\n');

  // Step 1: Count proposals with pricing_list
  console.log('STEP 1: Counting proposals with linked pricing_list...\n');

  const { data: countData, error: countError } = await supabase
    .from('proposal')
    .select(`
      _id,
      Listing (
        _id,
        pricing_list
      )
    `, { count: 'exact' });

  if (countError) {
    console.error('Error counting proposals:', countError);
    return;
  }

  const proposalsWithPricingList = countData.filter(p => p.Listing?.pricing_list);
  console.log(`Total proposals: ${countData.length}`);
  console.log(`Proposals with pricing_list link: ${proposalsWithPricingList.length}`);

  // Step 2: Fetch all proposals with their listing and pricing_list data
  console.log('\nSTEP 2: Fetching proposal details...\n');

  // We need to do a more complex query to get pricing_list data
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
      Listing
    `);

  if (proposalsError) {
    console.error('Error fetching proposals:', proposalsError);
    return;
  }

  console.log(`Fetched ${proposals.length} proposals`);

  // Fetch listings with their pricing_list
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

  // Get pricing_list IDs
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

  // Step 3: Calculate new pricing for each proposal
  console.log('\nSTEP 3: Analyzing pricing calculations...\n');

  const updates = [];
  const skipped = [];

  for (const proposal of proposals) {
    const listing = listingMap.get(proposal.Listing);
    if (!listing) {
      skipped.push({ id: proposal._id, reason: 'No linked listing' });
      continue;
    }

    const pricingList = pricingListMap.get(listing.pricing_list);
    if (!pricingList) {
      skipped.push({ id: proposal._id, reason: 'No pricing_list on listing' });
      continue;
    }

    // Get nights_per_week
    const nightsArray = proposal['Nights Selected (Nights list)'];
    const nightsPerWeek = Array.isArray(nightsArray)
      ? nightsArray.length
      : Number(proposal['nights per week (num)']) || null;

    if (!nightsPerWeek || nightsPerWeek < 1 || nightsPerWeek > 7) {
      skipped.push({ id: proposal._id, reason: `Invalid nights_per_week: ${nightsPerWeek}` });
      continue;
    }

    const weeks = proposal['Reservation Span (Weeks)'];
    if (!weeks || weeks < 1) {
      skipped.push({ id: proposal._id, reason: `Invalid weeks: ${weeks}` });
      continue;
    }

    // Get rates from pricing arrays (0-indexed, so nightsPerWeek - 1)
    const nightlyPriceArray = pricingList['Nightly Price'];
    const hostCompensationArray = pricingList['Host Compensation'];

    if (!Array.isArray(nightlyPriceArray) || !Array.isArray(hostCompensationArray)) {
      skipped.push({ id: proposal._id, reason: 'Pricing arrays not valid' });
      continue;
    }

    const guestNightlyRate = nightlyPriceArray[nightsPerWeek - 1];
    const hostNightlyRate = hostCompensationArray[nightsPerWeek - 1];

    if (guestNightlyRate == null || hostNightlyRate == null) {
      skipped.push({ id: proposal._id, reason: `Missing rate at index ${nightsPerWeek - 1}` });
      continue;
    }

    // Calculate new values
    const new4WeekCompensation = Math.round(hostNightlyRate * nightsPerWeek * 4);
    const newHostTotal = Math.round(hostNightlyRate * nightsPerWeek * weeks * 100) / 100;
    const newGuestTotal = Math.round(guestNightlyRate * nightsPerWeek * weeks * 100) / 100;

    updates.push({
      id: proposal._id,
      status: proposal.Status,
      listingName: listing.Name,
      nightsPerWeek,
      weeks,
      current: {
        fourWeekCompensation: proposal['4 week compensation'],
        hostTotal: proposal['Total Compensation (proposal - host)'],
        guestTotal: proposal['Total Price for Reservation (guest)'],
      },
      new: {
        fourWeekCompensation: new4WeekCompensation,
        hostTotal: newHostTotal,
        guestTotal: newGuestTotal,
      },
      delta: {
        fourWeekCompensation: new4WeekCompensation - (proposal['4 week compensation'] || 0),
        hostTotal: newHostTotal - (Number(proposal['Total Compensation (proposal - host)']) || 0),
        guestTotal: newGuestTotal - (Number(proposal['Total Price for Reservation (guest)']) || 0),
      }
    });
  }

  console.log(`Proposals to update: ${updates.length}`);
  console.log(`Proposals skipped: ${skipped.length}`);

  // Show sample of updates
  console.log('\n========================================');
  console.log('PREVIEW: First 10 proposals to update');
  console.log('========================================\n');

  const preview = updates.slice(0, 10);
  for (const u of preview) {
    console.log(`Proposal: ${u.id}`);
    console.log(`  Status: ${u.status}`);
    console.log(`  Listing: ${u.listingName}`);
    console.log(`  Nights/week: ${u.nightsPerWeek}, Weeks: ${u.weeks}`);
    console.log(`  4-Week Compensation: ${u.current.fourWeekCompensation} -> ${u.new.fourWeekCompensation} (${u.delta.fourWeekCompensation > 0 ? '+' : ''}${u.delta.fourWeekCompensation})`);
    console.log(`  Host Total: ${u.current.hostTotal} -> ${u.new.hostTotal} (${u.delta.hostTotal > 0 ? '+' : ''}${Math.round(u.delta.hostTotal)})`);
    console.log(`  Guest Total: ${u.current.guestTotal} -> ${u.new.guestTotal} (${u.delta.guestTotal > 0 ? '+' : ''}${Math.round(u.delta.guestTotal)})`);
    console.log('');
  }

  // Show skipped reasons
  if (skipped.length > 0) {
    console.log('\n========================================');
    console.log('SKIPPED: Sample of skipped proposals');
    console.log('========================================\n');

    const skipPreview = skipped.slice(0, 5);
    for (const s of skipPreview) {
      console.log(`  ${s.id}: ${s.reason}`);
    }
  }

  // Summary
  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================\n');
  console.log(`Total proposals analyzed: ${proposals.length}`);
  console.log(`Will update: ${updates.length}`);
  console.log(`Skipped: ${skipped.length}`);

  // Ask for confirmation
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise(resolve => {
    rl.question('\nDo you want to proceed with the update? (yes/no): ', resolve);
  });
  rl.close();

  if (answer.toLowerCase() !== 'yes') {
    console.log('\nUpdate cancelled.');
    return;
  }

  // Step 4: Execute updates
  console.log('\n========================================');
  console.log('EXECUTING UPDATES...');
  console.log('========================================\n');

  let successCount = 0;
  let errorCount = 0;

  for (const u of updates) {
    const { error } = await supabase
      .from('proposal')
      .update({
        '4 week compensation': u.new.fourWeekCompensation,
        'Total Compensation (proposal - host)': u.new.hostTotal,
        'Total Price for Reservation (guest)': u.new.guestTotal,
      })
      .eq('_id', u.id);

    if (error) {
      console.error(`Error updating ${u.id}:`, error);
      errorCount++;
    } else {
      successCount++;
      if (successCount % 10 === 0) {
        console.log(`Updated ${successCount}/${updates.length}...`);
      }
    }
  }

  console.log('\n========================================');
  console.log('UPDATE COMPLETE');
  console.log('========================================\n');
  console.log(`Successfully updated: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

main().catch(console.error);
