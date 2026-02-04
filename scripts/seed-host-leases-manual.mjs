/**
 * Seed Host Leases Test Data - Manual Approach
 *
 * This script creates mock lease data for testing the host-leases page
 * by working around Edge Function limitations.
 *
 * Target: splitlease-backend-dev (qcfifybkaddcoimjroca)
 * User: rodtesthost@test.com
 *
 * Created: 2026-02-03
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse .env file manually
function parseEnvFile(envPath) {
  const env = {};
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex).trim();
          const value = trimmed.substring(eqIndex + 1).trim();
          env[key] = value;
        }
      }
    });
  } catch (err) {
    console.error('Error reading .env file:', err.message);
  }
  return env;
}

// Load environment
const envPath = path.join(__dirname, '..', 'app', '.env');
const env = parseEnvFile(envPath);

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Date helpers
const today = new Date();
const formatDate = (date) => date.toISOString().split('T')[0];

const daysAgo = (days) => {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return d;
};

const daysFromNow = (days) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d;
};

// Configuration
const HOST_EMAIL = 'rodtesthost@test.com';

/**
 * Call an Edge Function
 */
async function callEdgeFunction(functionName, action, payload) {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;

  console.log(`  Calling ${functionName}/${action}...`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ action, payload }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || JSON.stringify(result) };
    }

    return { success: true, data: result.data || result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Step 1: Find host user
 */
async function findHostUser() {
  console.log('\n=== Step 1: Find Host User ===');

  const { data, error } = await supabase
    .from('user')
    .select('_id, email, "Name - Full"')
    .eq('email', HOST_EMAIL)
    .single();

  if (error || !data) {
    console.error('Host user not found:', HOST_EMAIL);
    return null;
  }

  console.log(`  Found host: ${data._id} (${data['Name - Full']})`);
  return data;
}

/**
 * Step 2: Find guest user
 */
async function findGuestUser() {
  console.log('\n=== Step 2: Find Guest User ===');

  // Find any existing test user
  const { data: guest } = await supabase
    .from('user')
    .select('_id, email, "Name - Full"')
    .ilike('email', '%test%')
    .limit(1)
    .single();

  if (guest) {
    console.log(`  Found guest: ${guest._id} (${guest['Name - Full']})`);
    return guest;
  }

  console.error('No test guest user found');
  return null;
}

/**
 * Step 3: Find host's listing
 */
async function findHostListing(hostId) {
  console.log('\n=== Step 3: Find Host Listing ===');

  const { data, error } = await supabase
    .from('listing')
    .select('_id, Name, "Host User"')
    .eq('Host User', hostId)
    .limit(1)
    .single();

  if (error || !data) {
    console.error('No listing found for host');
    return null;
  }

  console.log(`  Found listing: ${data._id} (${data.Name})`);
  return data;
}

/**
 * Step 4: Find existing proposal or check for one
 */
async function findExistingProposal(guestId, listingId) {
  console.log('\n=== Step 4: Find Existing Proposal ===');

  const { data, error } = await supabase
    .from('proposal')
    .select('_id, Status, Guest, Listing, "Host User"')
    .eq('Listing', listingId)
    .eq('Guest', guestId)
    .limit(1)
    .single();

  if (data) {
    console.log(`  Found existing proposal: ${data._id} (Status: ${data.Status})`);
    return data;
  }

  // Try to find any proposal for the listing
  const { data: anyProposal } = await supabase
    .from('proposal')
    .select('_id, Status, Guest, Listing, "Host User"')
    .eq('Listing', listingId)
    .limit(1)
    .single();

  if (anyProposal) {
    console.log(`  Found any proposal for listing: ${anyProposal._id}`);
    return anyProposal;
  }

  console.log('  No existing proposal found');
  return null;
}

/**
 * Step 5: Find existing lease for the host
 */
async function findExistingLease(hostId) {
  console.log('\n=== Step 5: Find Existing Lease ===');

  const { data, error } = await supabase
    .from('bookings_leases')
    .select('_id, "Agreement Number", "Lease Status", Guest, Host, Listing')
    .eq('Host', hostId)
    .limit(1)
    .single();

  if (data) {
    console.log(`  Found existing lease: ${data._id} (${data['Agreement Number']})`);
    return data;
  }

  console.log('  No existing lease found');
  return null;
}

/**
 * Step 6: Create stays using leases-admin if we have a lease
 */
async function createStaysForLease(leaseId) {
  console.log('\n=== Step 6: Create Stays ===');

  // First check if stays already exist
  const { data: existingStays } = await supabase
    .from('bookings_stays')
    .select('_id, "Week Number"')
    .eq('Lease', leaseId);

  if (existingStays && existingStays.length > 0) {
    console.log(`  Stays already exist: ${existingStays.length} found`);
    return existingStays;
  }

  const result = await callEdgeFunction('leases-admin', 'createStays', {
    leaseId,
  });

  if (result.success) {
    console.log(`  Created ${result.data.created} stays`);
    return result.data;
  }

  console.error('  Failed to create stays:', result.error);
  return null;
}

/**
 * Step 7: Create payment records if we have a lease
 */
async function createPaymentRecordsForLease(leaseId) {
  console.log('\n=== Step 7: Create Payment Records ===');

  // First check if payments already exist
  const { data: existingPayments } = await supabase
    .from('paymentrecords')
    .select('_id, "Payment #"')
    .eq('Booking - Reservation', leaseId);

  if (existingPayments && existingPayments.length > 0) {
    console.log(`  Payments already exist: ${existingPayments.length} found`);
    return existingPayments;
  }

  const payments = [
    {
      scheduledDate: formatDate(daysAgo(14)),
      actualDate: formatDate(daysAgo(14)),
      rent: 1800,
      maintenanceFee: 50,
      damageDeposit: 500,
      totalAmount: 2350,
      isPaid: true,
    },
    {
      scheduledDate: formatDate(today),
      actualDate: formatDate(today),
      rent: 1800,
      maintenanceFee: 50,
      damageDeposit: 0,
      totalAmount: 1850,
      isPaid: true,
    },
    {
      scheduledDate: formatDate(daysFromNow(28)),
      rent: 1800,
      maintenanceFee: 50,
      damageDeposit: 0,
      totalAmount: 1850,
      isPaid: false,
    },
  ];

  let created = 0;
  for (const payment of payments) {
    const result = await callEdgeFunction('leases-admin', 'createPaymentRecord', {
      leaseId,
      ...payment,
    });

    if (result.success) {
      created++;
    } else {
      console.error(`  Payment creation failed:`, result.error);
    }
  }

  console.log(`  Created ${created} payment records`);
  return created;
}

/**
 * Verify data
 */
async function verifyData(hostId) {
  console.log('\n=== Verification ===');

  // Find lease for host
  const { data: lease } = await supabase
    .from('bookings_leases')
    .select('_id, "Agreement Number", "Lease Status", Guest, Host, Listing')
    .eq('Host', hostId)
    .limit(1)
    .single();

  if (lease) {
    console.log(`\nLease: ${lease._id}`);
    console.log(`  Agreement: ${lease['Agreement Number']}`);
    console.log(`  Status: ${lease['Lease Status']}`);

    // Check stays
    const { data: stays } = await supabase
      .from('bookings_stays')
      .select('_id, "Week Number", "Stay Status"')
      .eq('Lease', lease._id)
      .order('Week Number');

    console.log(`\nStays: ${stays?.length || 0}`);
    stays?.forEach(s => console.log(`  - Week ${s['Week Number']}: ${s['Stay Status']}`));

    // Check payments
    const { data: payments } = await supabase
      .from('paymentrecords')
      .select('_id, "Payment #", "Total Amount", "Is Paid"')
      .eq('Booking - Reservation', lease._id)
      .order('Payment #');

    console.log(`\nPayments: ${payments?.length || 0}`);
    payments?.forEach(p => console.log(`  - #${p['Payment #']}: $${p['Total Amount']} (${p['Is Paid'] ? 'Paid' : 'Pending'})`));

    // Check date change requests
    const { data: dcrs } = await supabase
      .from('datechangerequest')
      .select('_id, status, "Request Type"')
      .eq('Lease', lease._id);

    console.log(`\nDate Change Requests: ${dcrs?.length || 0}`);
    dcrs?.forEach(d => console.log(`  - ${d['Request Type']}: ${d.status}`));

    return lease._id;
  } else {
    console.log('\nNo lease found for host');
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('========================================');
  console.log('Seed Host Leases Test Data (Manual)');
  console.log('========================================');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Target Host: ${HOST_EMAIL}`);
  console.log('========================================');

  // Step 1: Find host
  const host = await findHostUser();
  if (!host) {
    console.error('\nHost not found. Cannot proceed.');
    return;
  }

  // Step 2: Find guest
  const guest = await findGuestUser();

  // Step 3: Find listing
  const listing = await findHostListing(host._id);

  // Step 4: Check for existing proposal
  if (guest && listing) {
    const proposal = await findExistingProposal(guest._id, listing._id);
    if (proposal) {
      console.log('\nExisting proposal found, can use lease Edge Function');
    }
  }

  // Step 5: Check for existing lease
  const existingLease = await findExistingLease(host._id);

  if (existingLease) {
    console.log('\n--- Working with existing lease ---');

    // Step 6: Create stays if needed
    await createStaysForLease(existingLease._id);

    // Step 7: Create payment records if needed
    await createPaymentRecordsForLease(existingLease._id);

    // Verify
    await verifyData(host._id);
  } else {
    console.log('\n========================================');
    console.log('MANUAL STEPS REQUIRED');
    console.log('========================================');
    console.log('No existing lease found for the host.');
    console.log('');
    console.log('To create test data, you need to either:');
    console.log('');
    console.log('1. Create a lease via the UI:');
    console.log('   - Log in as the test guest');
    console.log('   - Create a proposal for the host\'s listing');
    console.log('   - Log in as the host and accept the proposal');
    console.log('');
    console.log('2. Run the SQL script directly in Supabase SQL Editor:');
    console.log('   - Go to: https://supabase.com/dashboard/project/qcfifybkaddcoimjroca/sql');
    console.log('   - Copy and run the contents of:');
    console.log('     scripts/seed-host-leases-test-data.sql');
    console.log('');
    console.log('3. Deploy and use the fixed Edge Function:');
    console.log('   - Run: supabase login');
    console.log('   - Run: supabase functions deploy usability-data-admin');
    console.log('   - Then run this script again');
    console.log('');
    console.log('========================================');
  }

  console.log('\n========================================');
  console.log('Complete');
  console.log('========================================');
}

main().catch(console.error);
