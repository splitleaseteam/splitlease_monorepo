/**
 * Seed Host Leases Test Data
 *
 * Creates mock lease data for testing the host-leases page.
 * Target: splitlease-backend-dev project
 *
 * Run with: cd app && node ../scripts/seed-host-leases-test-data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from app/.env manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../app/.env');

// Parse .env file manually
function parseEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const env = {};
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
    return env;
  } catch (error) {
    console.error('Error reading .env file:', error.message);
    return {};
  }
}

const envVars = parseEnvFile(envPath);

// Supabase configuration (from app/.env)
const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables!');
  console.error('VITE_SUPABASE_URL:', SUPABASE_URL ? 'set' : 'missing');
  console.error('VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'set' : 'missing');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test data IDs (using unique test prefixes)
const TEST_PREFIX = 'test-hostleases-';
const TEST_IDS = {
  proposal: `${TEST_PREFIX}proposal-001`,
  lease: `${TEST_PREFIX}lease-001`,
  stays: {
    week1: `${TEST_PREFIX}stay-week1`,
    week2: `${TEST_PREFIX}stay-week2`,
    week3: `${TEST_PREFIX}stay-week3`,
    week4: `${TEST_PREFIX}stay-week4`,
  },
  payments: {
    payment1: `${TEST_PREFIX}payment-1`,
    payment2: `${TEST_PREFIX}payment-2`,
    payment3: `${TEST_PREFIX}payment-3`,
  },
  dateChangeRequest: `${TEST_PREFIX}dcr-001`,
};

// Calculate dates
const today = new Date();
const startDate = new Date(today);
startDate.setDate(today.getDate() - 14);
const endDate = new Date(today);
endDate.setDate(today.getDate() + 90);

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function findHostUser() {
  console.log('\n=== Step 1: Find Host User (rodtesthost@test.com) ===');

  const { data: hostUser, error } = await supabase
    .from('user')
    .select('_id, email, "Name - Full"')
    .eq('email', 'rodtesthost@test.com')
    .single();

  if (error) {
    console.error('Error finding host user:', error);
    throw new Error('Host user rodtesthost@test.com not found. Please create it first.');
  }

  console.log('Found host user:', hostUser._id, hostUser['Name - Full']);
  return hostUser._id;
}

async function findOrSelectGuestUser() {
  console.log('\n=== Step 2: Find Guest User ===');

  // First, try to find testguest@test.com
  let { data: guestUser, error } = await supabase
    .from('user')
    .select('_id, email, "Name - Full"')
    .eq('email', 'testguest@test.com')
    .maybeSingle();

  if (guestUser) {
    console.log('Found testguest@test.com:', guestUser._id);
    return guestUser._id;
  }

  // Fallback: find any test user that can serve as a guest
  const { data: testUsers, error: testError } = await supabase
    .from('user')
    .select('_id, email, "Name - Full"')
    .ilike('email', '%test%')
    .neq('email', 'rodtesthost@test.com')
    .limit(1);

  if (testError || !testUsers || testUsers.length === 0) {
    console.error('Error finding guest user:', testError);
    throw new Error('No test guest user found. Please create testguest@test.com.');
  }

  console.log('Using existing test user as guest:', testUsers[0].email, testUsers[0]._id);
  return testUsers[0]._id;
}

async function findHostListing(hostUserId) {
  console.log('\n=== Step 3: Find Host Listing ===');

  const { data: listings, error } = await supabase
    .from('listing')
    .select('_id, Name, "Host User", "rental type"')
    .eq('Host User', hostUserId)
    .limit(1);

  if (error || !listings || listings.length === 0) {
    console.error('Error finding host listing:', error);
    throw new Error('No listing found for host. Please create a listing first.');
  }

  console.log('Found listing:', listings[0]._id, listings[0].Name);
  return listings[0]._id;
}

async function createProposal(guestUserId, hostUserId, listingId) {
  console.log('\n=== Step 4: Create Proposal ===');

  // Check if proposal exists
  const { data: existingProposal, error: selectError } = await supabase
    .from('proposal')
    .select('_id, Status')
    .eq('_id', TEST_IDS.proposal)
    .maybeSingle();

  if (existingProposal) {
    console.log('Proposal already exists:', existingProposal._id);
    return existingProposal._id;
  }

  // Create proposal - using columns that exist based on types.ts schema
  const moveOutDate = new Date(startDate);
  moveOutDate.setDate(startDate.getDate() + 84); // 12 weeks from start

  const { data: newProposal, error: insertError } = await supabase
    .from('proposal')
    .insert({
      _id: TEST_IDS.proposal,
      Guest: guestUserId,
      'Host User': hostUserId,
      Listing: listingId,
      Status: 'Proposal or Counteroffer Accepted / Drafting Lease Documents',
      'Move in range start': formatDate(startDate),
      'Move in range end': formatDate(startDate),
      'Reservation Span (Weeks)': 12,
      'Reservation Span': '3_months',
      'nights per week (num)': 3,
      'check in day': 1, // Monday
      'check out day': 4, // Thursday
      'Days Selected': [1, 2, 3], // Mon, Tue, Wed
      'Nights Selected (Nights list)': [1, 2, 3], // Mon, Tue, Wed nights
      'proposal nightly price': 150,
      '4 week rent': 1800, // 3 nights * $150 * 4 weeks
      'Total Price for Reservation (guest)': 21600, // 12 weeks total
      'Total Compensation (proposal - host)': 16200, // 75% of total
      'cleaning fee': 100,
      'damage deposit': 500,
      'Order Ranking': 1,
      'Is Finalized': false,
      Deleted: false,
      'Created Date': new Date().toISOString(),
      'Modified Date': new Date().toISOString(),
      Comment: 'Test proposal for host-leases page testing'
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating proposal:', insertError);
    throw insertError;
  }

  console.log('Created proposal:', newProposal._id);
  return newProposal._id;
}

async function createLease(proposalId, guestUserId, hostUserId, listingId) {
  console.log('\n=== Step 5: Create Lease ===');

  // Check if lease exists
  const { data: existingLease, error: selectError } = await supabase
    .from('bookings_leases')
    .select('_id, "Agreement Number"')
    .eq('_id', TEST_IDS.lease)
    .maybeSingle();

  if (existingLease) {
    console.log('Lease already exists:', existingLease._id, existingLease['Agreement Number']);
    return existingLease._id;
  }

  // Create lease
  const { data: newLease, error: insertError } = await supabase
    .from('bookings_leases')
    .insert({
      _id: TEST_IDS.lease,
      'Agreement Number': 'TEST-HOSTLEASES-20260203-0001',
      Proposal: proposalId,
      Guest: guestUserId,
      Host: hostUserId,
      Listing: listingId,
      Participants: [guestUserId, hostUserId],
      'Reservation Period : Start': formatDate(startDate),
      'Reservation Period : End': formatDate(endDate),
      'Total Compensation': 16200,
      'Total Rent': 21600,
      'Lease Status': 'Active',
      'Lease signed?': true,
      'were documents generated?': true,
      'total week count': 12,
      'current week number': 3,
      'First Payment Date': formatDate(startDate),
      'Created Date': new Date().toISOString(),
      'Modified Date': new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating lease:', insertError);
    throw insertError;
  }

  console.log('Created lease:', newLease._id, 'Agreement:', newLease['Agreement Number']);
  return newLease._id;
}

async function createStays(leaseId, guestUserId, hostUserId, listingId) {
  console.log('\n=== Step 6: Create 4 Stays ===');

  const staysData = [
    {
      _id: TEST_IDS.stays.week1,
      weekNumber: 1,
      checkInOffset: -14,
      lastNightOffset: -12,
      status: 'Completed',
      reviewSubmitted: false,
    },
    {
      _id: TEST_IDS.stays.week2,
      weekNumber: 2,
      checkInOffset: -7,
      lastNightOffset: -5,
      status: 'Completed',
      reviewSubmitted: true,
    },
    {
      _id: TEST_IDS.stays.week3,
      weekNumber: 3,
      checkInOffset: 0,
      lastNightOffset: 2,
      status: 'In Progress',
      reviewSubmitted: false,
    },
    {
      _id: TEST_IDS.stays.week4,
      weekNumber: 4,
      checkInOffset: 7,
      lastNightOffset: 9,
      status: 'Upcoming',
      reviewSubmitted: false,
    },
  ];

  for (const stay of staysData) {
    // Check if stay exists
    const { data: existingStay, error: selectError } = await supabase
      .from('bookings_stays')
      .select('_id')
      .eq('_id', stay._id)
      .maybeSingle();

    if (existingStay) {
      console.log(`Stay week ${stay.weekNumber} already exists:`, existingStay._id);
      continue;
    }

    const checkInDate = new Date(today);
    checkInDate.setDate(today.getDate() + stay.checkInOffset);

    const lastNightDate = new Date(today);
    lastNightDate.setDate(today.getDate() + stay.lastNightOffset);

    const { data: newStay, error: insertError } = await supabase
      .from('bookings_stays')
      .insert({
        _id: stay._id,
        Lease: leaseId,
        'Week Number': stay.weekNumber,
        Guest: guestUserId,
        Host: hostUserId,
        listing: listingId,
        'Check In (night)': formatDate(checkInDate),
        'Last Night (night)': formatDate(lastNightDate),
        'Stay Status': stay.status,
        'Review Submitted by Host': stay.reviewSubmitted,
        'Created Date': new Date().toISOString(),
        'Modified Date': new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error(`Error creating stay week ${stay.weekNumber}:`, insertError);
      throw insertError;
    }

    console.log(`Created stay week ${stay.weekNumber}:`, newStay._id, `Status: ${stay.status}`);
  }
}

async function createPaymentRecords(leaseId) {
  console.log('\n=== Step 7: Create 3 Payment Records ===');

  const paymentsData = [
    {
      _id: TEST_IDS.payments.payment1,
      paymentNumber: 1,
      scheduledDateOffset: -14,
      actualDateOffset: -14,
      rentAmount: 1800,
      maintenanceFee: 50,
      damageDeposit: 500,
      totalAmount: 2350,
      isPaid: true,
    },
    {
      _id: TEST_IDS.payments.payment2,
      paymentNumber: 2,
      scheduledDateOffset: 0,
      actualDateOffset: 0,
      rentAmount: 1800,
      maintenanceFee: 50,
      damageDeposit: 0,
      totalAmount: 1850,
      isPaid: true,
    },
    {
      _id: TEST_IDS.payments.payment3,
      paymentNumber: 3,
      scheduledDateOffset: 28,
      actualDateOffset: null,
      rentAmount: 1800,
      maintenanceFee: 50,
      damageDeposit: 0,
      totalAmount: 1850,
      isPaid: false,
    },
  ];

  for (const payment of paymentsData) {
    // Check if payment exists
    const { data: existingPayment, error: selectError } = await supabase
      .from('paymentrecords')
      .select('_id')
      .eq('_id', payment._id)
      .maybeSingle();

    if (existingPayment) {
      console.log(`Payment ${payment.paymentNumber} already exists:`, existingPayment._id);
      continue;
    }

    const scheduledDate = new Date(today);
    scheduledDate.setDate(today.getDate() + payment.scheduledDateOffset);

    let actualDate = null;
    if (payment.actualDateOffset !== null) {
      const actualDateObj = new Date(today);
      actualDateObj.setDate(today.getDate() + payment.actualDateOffset);
      actualDate = formatDate(actualDateObj);
    }

    const { data: newPayment, error: insertError } = await supabase
      .from('paymentrecords')
      .insert({
        _id: payment._id,
        'Booking - Reservation': leaseId,
        'Payment #': payment.paymentNumber,
        'Scheduled Date': formatDate(scheduledDate),
        'Actual Date': actualDate,
        'Rent Amount': payment.rentAmount,
        'Maintenance Fee': payment.maintenanceFee,
        'Damage Deposit': payment.damageDeposit,
        'Total Amount': payment.totalAmount,
        'Is Paid': payment.isPaid,
        'Is Refunded': false,
        'Created Date': new Date().toISOString(),
        'Modified Date': new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error(`Error creating payment ${payment.paymentNumber}:`, insertError);
      throw insertError;
    }

    console.log(`Created payment ${payment.paymentNumber}: $${payment.totalAmount}`, payment.isPaid ? '(Paid)' : '(Pending)');
  }
}

async function createDateChangeRequest(leaseId, guestUserId, hostUserId) {
  console.log('\n=== Step 8: Create Date Change Request ===');

  // Check if DCR exists
  const { data: existingDCR, error: selectError } = await supabase
    .from('datechangerequest')
    .select('_id, status')
    .eq('_id', TEST_IDS.dateChangeRequest)
    .maybeSingle();

  if (existingDCR) {
    console.log('Date change request already exists:', existingDCR._id);
    return existingDCR._id;
  }

  const originalDate = new Date(today);
  originalDate.setDate(today.getDate() + 7);

  const requestedDate = new Date(today);
  requestedDate.setDate(today.getDate() + 8);

  const { data: newDCR, error: insertError } = await supabase
    .from('datechangerequest')
    .insert({
      _id: TEST_IDS.dateChangeRequest,
      Lease: leaseId,
      'Requested by': guestUserId,
      'Request receiver': hostUserId,
      'Stay Associated 1': TEST_IDS.stays.week4,
      status: 'pending',
      'Request Type': 'reschedule',
      'Original Date': formatDate(originalDate),
      'Requested Date': formatDate(requestedDate),
      'Price Adjustment': 0,
      'Created Date': new Date().toISOString(),
      'Modified Date': new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating date change request:', insertError);
    throw insertError;
  }

  console.log('Created date change request:', newDCR._id, 'Status: pending');
  return newDCR._id;
}

async function verifySeedData(hostUserId, guestUserId, listingId) {
  console.log('\n=== Verification ===');

  // Verify host user
  const { data: hostUser } = await supabase
    .from('user')
    .select('_id, email, "Name - Full"')
    .eq('_id', hostUserId)
    .single();
  console.log('Host User:', hostUser);

  // Verify guest user
  const { data: guestUser } = await supabase
    .from('user')
    .select('_id, email, "Name - Full"')
    .eq('_id', guestUserId)
    .single();
  console.log('Guest User:', guestUser);

  // Verify listing
  const { data: listing } = await supabase
    .from('listing')
    .select('_id, Name, "rental type"')
    .eq('_id', listingId)
    .single();
  console.log('Listing:', listing);

  // Verify lease
  const { data: lease } = await supabase
    .from('bookings_leases')
    .select('_id, "Agreement Number", "Lease Status", "total week count", "current week number"')
    .eq('_id', TEST_IDS.lease)
    .single();
  console.log('Lease:', lease);

  // Verify stays
  const { data: stays } = await supabase
    .from('bookings_stays')
    .select('_id, "Week Number", "Stay Status"')
    .eq('Lease', TEST_IDS.lease)
    .order('"Week Number"');
  console.log('Stays:', stays);

  // Verify payments
  const { data: payments } = await supabase
    .from('paymentrecords')
    .select('_id, "Payment #", "Total Amount", "Is Paid"')
    .eq('Booking - Reservation', TEST_IDS.lease)
    .order('"Payment #"');
  console.log('Payments:', payments);

  // Verify date change request
  const { data: dcr } = await supabase
    .from('datechangerequest')
    .select('_id, status, "Request Type"')
    .eq('_id', TEST_IDS.dateChangeRequest)
    .single();
  console.log('Date Change Request:', dcr);
}

async function main() {
  console.log('============================================================');
  console.log('SEED HOST LEASES TEST DATA');
  console.log('Target: splitlease-backend-dev');
  console.log('============================================================');
  console.log('Today:', formatDate(today));
  console.log('Start Date (14 days ago):', formatDate(startDate));
  console.log('End Date (90 days from now):', formatDate(endDate));
  console.log('\nTest IDs prefix:', TEST_PREFIX);

  try {
    // Step 1: Find host user
    const hostUserId = await findHostUser();

    // Step 2: Find guest user
    const guestUserId = await findOrSelectGuestUser();

    // Step 3: Find host listing
    const listingId = await findHostListing(hostUserId);

    // Step 4: Create proposal
    const proposalId = await createProposal(guestUserId, hostUserId, listingId);

    // Step 5: Create lease
    const leaseId = await createLease(proposalId, guestUserId, hostUserId, listingId);

    // Step 6: Create stays
    await createStays(leaseId, guestUserId, hostUserId, listingId);

    // Step 7: Create payment records
    await createPaymentRecords(leaseId);

    // Step 8: Create date change request
    await createDateChangeRequest(leaseId, guestUserId, hostUserId);

    // Verify all data
    await verifySeedData(hostUserId, guestUserId, listingId);

    console.log('\n============================================================');
    console.log('SEED COMPLETE!');
    console.log('============================================================');
    console.log('\nTest data created for host-leases page:');
    console.log('- Host User: rodtesthost@test.com');
    console.log('- Lease Agreement: TEST-HOSTLEASES-20260203-0001');
    console.log('- 4 Stays (Week 1-4: Completed, Completed, In Progress, Upcoming)');
    console.log('- 3 Payments ($2350 Paid, $1850 Paid, $1850 Pending)');
    console.log('- 1 Date Change Request (Pending for Week 4)');
    console.log('\nTest data IDs:');
    console.log('- Lease:', TEST_IDS.lease);
    console.log('- Proposal:', TEST_IDS.proposal);
    console.log('- Stays:', Object.values(TEST_IDS.stays).join(', '));
    console.log('- Payments:', Object.values(TEST_IDS.payments).join(', '));
    console.log('- Date Change Request:', TEST_IDS.dateChangeRequest);

  } catch (error) {
    console.error('\n============================================================');
    console.error('SEED FAILED!');
    console.error('============================================================');
    console.error(error);
    process.exit(1);
  }
}

main();
