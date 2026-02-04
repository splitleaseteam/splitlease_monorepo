/**
 * Seed Host Leases Test Data via Edge Functions
 *
 * This script creates mock lease data for testing the host-leases page
 * by calling Supabase Edge Functions which have service role access.
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
const GUEST_EMAIL = 'testguest@test.com';

// Test data IDs (prefixed for easy identification and cleanup)
const TEST_IDS = {
  listing: 'test-listing-hostleases-001',
  proposal: 'test-proposal-hostleases-001',
  lease: 'test-lease-hostleases-001',
  stay1: 'test-stay-week1-001',
  stay2: 'test-stay-week2-001',
  stay3: 'test-stay-week3-001',
  stay4: 'test-stay-week4-001',
  payment1: 'test-payment-1-001',
  payment2: 'test-payment-2-001',
  payment3: 'test-payment-3-001',
  dcr: 'test-dcr-week4-001',
};

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
      console.error(`  Error from ${functionName}/${action}:`, result);
      return { success: false, error: result.error || 'Unknown error' };
    }

    return { success: true, data: result.data || result };
  } catch (err) {
    console.error(`  Network error calling ${functionName}/${action}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Step 1: Find or verify host user exists
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
    console.error('Please create the host user first via Supabase dashboard or signup.');
    return null;
  }

  console.log(`  Found host: ${data._id} (${data['Name - Full']})`);
  return data;
}

/**
 * Step 2: Find or create guest user
 */
async function findOrCreateGuestUser() {
  console.log('\n=== Step 2: Find Guest User ===');

  // Try to find existing test guest
  let { data: guest, error } = await supabase
    .from('user')
    .select('_id, email, "Name - Full"')
    .eq('email', GUEST_EMAIL)
    .single();

  if (!guest) {
    // Find any existing test user
    const { data: anyGuest } = await supabase
      .from('user')
      .select('_id, email, "Name - Full"')
      .ilike('email', '%test%')
      .limit(1)
      .single();

    if (anyGuest) {
      console.log(`  Using existing test user: ${anyGuest.email} (${anyGuest._id})`);
      return anyGuest;
    }

    console.error('No test guest user found.');
    return null;
  }

  console.log(`  Found guest: ${guest._id} (${guest['Name - Full']})`);
  return guest;
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
 * Step 4: Create proposal using usability-data-admin
 */
async function createProposal(guestId, hostId, listingId) {
  console.log('\n=== Step 4: Create Proposal ===');

  // First check if proposal already exists
  const { data: existing } = await supabase
    .from('proposal')
    .select('_id')
    .eq('_id', TEST_IDS.proposal)
    .single();

  if (existing) {
    console.log(`  Proposal already exists: ${TEST_IDS.proposal}`);
    return { _id: TEST_IDS.proposal };
  }

  // Use the usability-data-admin Edge Function
  const result = await callEdgeFunction('usability-data-admin', 'createQuickProposal', {
    listingId,
    guestId,
    moveInDate: formatDate(daysAgo(14)),
    selectedDayIndices: [1, 2, 3], // Mon, Tue, Wed (0-indexed)
    reservationWeeks: 12,
    totalPrice: 21600, // 12 weeks * 3 nights * $150
    fourWeeksRent: 1800, // 3 nights * $150 * 4 weeks
    nightlyPrice: 150,
    notes: 'Test proposal for host-leases page testing',
  });

  if (result.success) {
    console.log(`  Created proposal: ${result.data.proposalId}`);

    // Update the proposal status to accepted
    const { error: updateError } = await supabase
      .from('proposal')
      .update({
        Status: 'Proposal or Counteroffer Accepted / Drafting Lease Documents',
        'Modified Date': new Date().toISOString(),
      })
      .eq('_id', result.data.proposalId);

    if (updateError) {
      console.error('  Warning: Could not update proposal status:', updateError.message);
    } else {
      console.log('  Updated proposal status to accepted');
    }

    return { _id: result.data.proposalId };
  }

  console.error('  Failed to create proposal:', result.error);
  return null;
}

/**
 * Step 5: Create lease directly (using leases-admin or direct insert)
 */
async function createLease(proposalId, guestId, hostId, listingId) {
  console.log('\n=== Step 5: Create Lease ===');

  // Check if lease already exists
  const { data: existing } = await supabase
    .from('bookings_leases')
    .select('_id')
    .eq('_id', TEST_IDS.lease)
    .single();

  if (existing) {
    console.log(`  Lease already exists: ${TEST_IDS.lease}`);
    return { _id: TEST_IDS.lease };
  }

  // Try using the lease Edge Function
  const result = await callEdgeFunction('lease', 'create', {
    proposalId,
    isCounteroffer: false,
    fourWeekRent: 1800,
    fourWeekCompensation: 1350,
  });

  if (result.success && result.data.leaseId) {
    console.log(`  Created lease via Edge Function: ${result.data.leaseId}`);
    return { _id: result.data.leaseId };
  }

  console.log('  Edge Function lease creation failed, attempting direct approach...');
  console.log('  Error:', result.error);

  // If Edge Function fails, we'll need to use a different approach
  // The lease Edge Function should work if the proposal exists
  return null;
}

/**
 * Step 6: Create stays using leases-admin
 */
async function createStays(leaseId, guestId, hostId, listingId) {
  console.log('\n=== Step 6: Create Stays ===');

  // First try using leases-admin createStays
  const result = await callEdgeFunction('leases-admin', 'createStays', {
    leaseId,
  });

  if (result.success) {
    console.log(`  Created ${result.data.created} stays via Edge Function`);
    return true;
  }

  console.error('  Failed to create stays:', result.error);
  return false;
}

/**
 * Step 7: Create payment records using leases-admin
 */
async function createPaymentRecords(leaseId) {
  console.log('\n=== Step 7: Create Payment Records ===');

  const payments = [
    {
      paymentNumber: 1,
      scheduledDate: formatDate(daysAgo(14)),
      actualDate: formatDate(daysAgo(14)),
      rent: 1800,
      maintenanceFee: 50,
      damageDeposit: 500,
      totalAmount: 2350,
      isPaid: true,
    },
    {
      paymentNumber: 2,
      scheduledDate: formatDate(today),
      actualDate: formatDate(today),
      rent: 1800,
      maintenanceFee: 50,
      damageDeposit: 0,
      totalAmount: 1850,
      isPaid: true,
    },
    {
      paymentNumber: 3,
      scheduledDate: formatDate(daysFromNow(28)),
      actualDate: null,
      rent: 1800,
      maintenanceFee: 50,
      damageDeposit: 0,
      totalAmount: 1850,
      isPaid: false,
    },
  ];

  let createdCount = 0;

  for (const payment of payments) {
    const result = await callEdgeFunction('leases-admin', 'createPaymentRecord', {
      leaseId,
      scheduledDate: payment.scheduledDate,
      actualDate: payment.actualDate,
      rent: payment.rent,
      maintenanceFee: payment.maintenanceFee,
      damageDeposit: payment.damageDeposit,
      totalAmount: payment.totalAmount,
      isPaid: payment.isPaid,
    });

    if (result.success) {
      console.log(`  Created payment ${payment.paymentNumber}: $${payment.totalAmount} (${payment.isPaid ? 'Paid' : 'Pending'})`);
      createdCount++;
    } else {
      console.error(`  Failed to create payment ${payment.paymentNumber}:`, result.error);
    }
  }

  return createdCount;
}

/**
 * Step 8: Create date change request
 */
async function createDateChangeRequest(leaseId, stayId, guestId, hostId) {
  console.log('\n=== Step 8: Create Date Change Request ===');

  // Try using date-change-request Edge Function
  const result = await callEdgeFunction('date-change-request', 'create', {
    leaseId,
    stayId,
    requestedById: guestId,
    receiverId: hostId,
    requestType: 'reschedule',
    originalDate: formatDate(daysFromNow(7)),
    requestedDate: formatDate(daysFromNow(8)),
  });

  if (result.success) {
    console.log(`  Created date change request: ${result.data._id || 'success'}`);
    return true;
  }

  console.error('  Failed to create date change request:', result.error);
  return false;
}

/**
 * Verify created data
 */
async function verifyData(leaseId) {
  console.log('\n=== Verification ===');

  // Check lease
  const { data: lease } = await supabase
    .from('bookings_leases')
    .select('_id, "Agreement Number", "Lease Status", "total week count"')
    .eq('_id', leaseId)
    .single();

  if (lease) {
    console.log(`  Lease: ${lease._id} (${lease['Agreement Number']}) - Status: ${lease['Lease Status']}`);
  } else {
    console.log('  Lease: NOT FOUND');
  }

  // Check stays
  const { data: stays } = await supabase
    .from('bookings_stays')
    .select('_id, "Week Number", "Stay Status"')
    .eq('Lease', leaseId)
    .order('Week Number');

  console.log(`  Stays: ${stays?.length || 0} found`);
  stays?.forEach(s => console.log(`    - Week ${s['Week Number']}: ${s['Stay Status']}`));

  // Check payments
  const { data: payments } = await supabase
    .from('paymentrecords')
    .select('_id, "Payment #", "Total Amount", "Is Paid"')
    .eq('Booking - Reservation', leaseId)
    .order('Payment #');

  console.log(`  Payments: ${payments?.length || 0} found`);
  payments?.forEach(p => console.log(`    - Payment ${p['Payment #']}: $${p['Total Amount']} (${p['Is Paid'] ? 'Paid' : 'Pending'})`));

  // Check date change requests
  const { data: dcrs } = await supabase
    .from('datechangerequest')
    .select('_id, status, "Request Type"')
    .eq('Lease', leaseId);

  console.log(`  Date Change Requests: ${dcrs?.length || 0} found`);
  dcrs?.forEach(d => console.log(`    - ${d['Request Type']}: ${d.status}`));
}

/**
 * Main execution
 */
async function main() {
  console.log('========================================');
  console.log('Seed Host Leases Test Data');
  console.log('========================================');
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Target Host: ${HOST_EMAIL}`);
  console.log(`Start Date: ${formatDate(daysAgo(14))}`);
  console.log(`End Date: ${formatDate(daysFromNow(90))}`);
  console.log('========================================');

  // Step 1: Find host
  const host = await findHostUser();
  if (!host) return;

  // Step 2: Find guest
  const guest = await findOrCreateGuestUser();
  if (!guest) return;

  // Step 3: Find listing
  const listing = await findHostListing(host._id);
  if (!listing) return;

  // Step 4: Create proposal
  const proposal = await createProposal(guest._id, host._id, listing._id);
  if (!proposal) {
    console.error('\nFailed to create proposal. Stopping.');
    return;
  }

  // Step 5: Create lease
  const lease = await createLease(proposal._id, guest._id, host._id, listing._id);
  if (!lease) {
    console.error('\nFailed to create lease. Stopping.');
    return;
  }

  // Step 6: Create stays (if not already created by lease creation)
  await createStays(lease._id, guest._id, host._id, listing._id);

  // Step 7: Create payment records
  await createPaymentRecords(lease._id);

  // Step 8: Try to create a date change request
  // We need a stay ID - get the week 4 stay
  const { data: week4Stay } = await supabase
    .from('bookings_stays')
    .select('_id')
    .eq('Lease', lease._id)
    .eq('Week Number', 4)
    .single();

  if (week4Stay) {
    await createDateChangeRequest(lease._id, week4Stay._id, guest._id, host._id);
  }

  // Verify
  await verifyData(lease._id);

  console.log('\n========================================');
  console.log('Test Data Seeding Complete');
  console.log('========================================');
  console.log(`Lease ID: ${lease._id}`);
  console.log(`Host: ${host['Name - Full']} (${HOST_EMAIL})`);
  console.log('========================================');
}

main().catch(console.error);
