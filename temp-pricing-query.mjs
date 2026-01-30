/**
 * Temporary script to query pricing_list for listing ID 1769723744610x93678809560584048
 * Run with: bun temp-pricing-query.mjs
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from app/.env
dotenv.config({ path: resolve(process.cwd(), 'app', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const LISTING_ID = '1769723744610x93678809560584048';

async function runQuery() {
  console.log('='.repeat(60));
  console.log('PRICING LIST LOOKUP FOR LISTING:', LISTING_ID);
  console.log('='.repeat(60));

  // Step 1: Get the pricing_list FK from the listing table
  console.log('\n>>> Step 1: Querying listing table for pricing_list FK...\n');

  const { data: listingData, error: listingError } = await supabase
    .from('listing')
    .select('_id, pricing_list, "Name"')
    .eq('_id', LISTING_ID)
    .single();

  if (listingError) {
    console.error('ERROR querying listing:', listingError);
    return;
  }

  if (!listingData) {
    console.log('No listing found with ID:', LISTING_ID);
    return;
  }

  console.log('LISTING FOUND:');
  console.log('  _id:', listingData._id);
  console.log('  Name:', listingData.Name || '(no name)');
  console.log('  pricing_list FK:', listingData.pricing_list || 'NULL');

  if (!listingData.pricing_list) {
    console.log('\n>>> RESULT: No pricing_list FK exists for this listing (value is NULL)');
    return;
  }

  // Step 2: Query the pricing_list table using the FK
  console.log('\n>>> Step 2: Querying pricing_list table with ID:', listingData.pricing_list);
  console.log();

  const { data: pricingData, error: pricingError } = await supabase
    .from('pricing_list')
    .select('*')
    .eq('_id', listingData.pricing_list)
    .single();

  if (pricingError) {
    console.error('ERROR querying pricing_list:', pricingError);
    return;
  }

  if (!pricingData) {
    console.log('No pricing_list record found with ID:', listingData.pricing_list);
    return;
  }

  console.log('='.repeat(60));
  console.log('PRICING_LIST RECORD (ALL FIELDS):');
  console.log('='.repeat(60));

  // Sort keys alphabetically for readability
  const sortedKeys = Object.keys(pricingData).sort();
  for (const key of sortedKeys) {
    const value = pricingData[key];
    const displayValue = value !== null && value !== undefined ?
      (typeof value === 'object' ? JSON.stringify(value) : value) :
      'NULL';
    console.log(`  ${key}: ${displayValue}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('QUERY COMPLETE');
  console.log('='.repeat(60));
}

runQuery().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
