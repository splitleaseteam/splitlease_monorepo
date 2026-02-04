/**
 * Bulk fix script to recalculate "4 week rent" for all proposals
 *
 * Formula: 4 week rent = proposal nightly price × nights per week (num) × 4
 *
 * Usage: node scripts/fix-4-week-rent.mjs
 */

import { createClient } from '@supabase/supabase-js';

// Dev project credentials
const SUPABASE_URL = 'https://qzsmhgyojmwvtjmnrdea.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6c21oZ3lvam13dnRqbW5yZGVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk1MTY0OSwiZXhwIjoyMDgzNTI3NjQ5fQ.DpqpCi_ySXoH9x-yNNfFEpqBPQiGpD65XZ991EY9KpM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('=== 4 Week Rent Bulk Fix Script ===\n');
  console.log('Target project: qzsmhgyojmwvtjmnrdea (splitlease-backend-dev)\n');

  // Step 1: Get diagnostic counts
  console.log('Step 1: Analyzing proposals...\n');

  // Note: Column names with spaces and special characters need quotes in select
  // but the .not() and .gt() filters use the column name without quotes
  const { data: proposals, error: fetchError } = await supabase
    .from('proposal')
    .select('_id, proposal nightly price, nights per week (num), 4 week rent');

  if (fetchError) {
    console.error('Error fetching proposals:', fetchError);
    process.exit(1);
  }

  console.log(`Total proposals with valid pricing data: ${proposals.length}\n`);

  // Calculate which are incorrect
  const incorrectProposals = proposals.filter(p => {
    const expectedRent = p['proposal nightly price'] * p['nights per week (num)'] * 4;
    const currentRent = p['4 week rent'];
    // Check if null or different (within floating point tolerance)
    return currentRent === null || Math.abs(currentRent - expectedRent) > 0.01;
  });

  console.log(`Proposals with incorrect "4 week rent": ${incorrectProposals.length}`);
  console.log(`Proposals already correct: ${proposals.length - incorrectProposals.length}\n`);

  if (incorrectProposals.length === 0) {
    console.log('No proposals need updating. All values are correct!');
    return;
  }

  // Show a sample of what will be changed
  console.log('Sample of changes to be made (first 5):');
  console.log('-'.repeat(80));
  incorrectProposals.slice(0, 5).forEach(p => {
    const expected = p['proposal nightly price'] * p['nights per week (num)'] * 4;
    console.log(`  ID: ${p._id}`);
    console.log(`    nightly price: ${p['proposal nightly price']}`);
    console.log(`    nights/week: ${p['nights per week (num)']}`);
    console.log(`    current "4 week rent": ${p['4 week rent']}`);
    console.log(`    expected "4 week rent": ${expected.toFixed(2)}`);
    console.log('');
  });

  // Step 2: Perform the bulk update
  console.log('\nStep 2: Performing bulk update...\n');

  let updatedCount = 0;
  let errorCount = 0;
  const batchSize = 50;

  for (let i = 0; i < incorrectProposals.length; i += batchSize) {
    const batch = incorrectProposals.slice(i, i + batchSize);

    for (const proposal of batch) {
      const newValue = proposal['proposal nightly price'] * proposal['nights per week (num)'] * 4;

      const { error: updateError } = await supabase
        .from('proposal')
        .update({ '4 week rent': newValue })
        .eq('_id', proposal._id);

      if (updateError) {
        console.error(`  Error updating ${proposal._id}:`, updateError.message);
        errorCount++;
      } else {
        updatedCount++;
      }
    }

    // Progress update
    console.log(`  Processed ${Math.min(i + batchSize, incorrectProposals.length)} / ${incorrectProposals.length}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('=== BULK FIX COMPLETE ===');
  console.log('='.repeat(50));
  console.log(`\nResults:`);
  console.log(`  Successfully updated: ${updatedCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Total processed: ${incorrectProposals.length}`);
}

main().catch(console.error);
