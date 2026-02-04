/**
 * Create Mock Lease Data Script
 *
 * Creates test data for the host-leases page for user rodtesthost@test.com
 * Run with: node scripts/create-mock-lease-data.mjs
 */

import { createClient } from '@supabase/supabase-js';

// Supabase client configuration - using dev environment
const SUPABASE_URL = 'https://qcfifybkaddcoimjroca.supabase.co';
// Require service role key from environment (needed to bypass RLS for admin operations)
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('');
  console.error('To run this script:');
  console.error('1. Go to https://supabase.com/dashboard/project/qcfifybkaddcoimjroca/settings/api');
  console.error('2. Copy the "service_role" key (under "Project API keys")');
  console.error('3. Run: $env:SUPABASE_SERVICE_ROLE_KEY="your_key"; node scripts/create-mock-lease-data.mjs');
  console.error('');
  process.exit(1);
}

console.log('Using SUPABASE_SERVICE_ROLE_KEY from environment');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to generate unique IDs
function generateId(prefix) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

// Format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Add days to a date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Creating Mock Lease Data for Host Leases Page');
  console.log('Target: rodtesthost@test.com');
  console.log('Database: splitlease-backend-dev');
  console.log('='.repeat(60));
  console.log('');

  const now = new Date();
  const startDate = addDays(now, -14); // 2 weeks ago
  const endDate = addDays(now, 90); // 3 months from now

  // Step 1: Find or create host user
  console.log('[Step 1] Finding host user...');

  let { data: hostUser, error: hostError } = await supabase
    .from('user')
    .select('_id, email, "Name - First", "Name - Last"')
    .eq('email', 'rodtesthost@test.com')
    .single();

  if (hostError && hostError.code !== 'PGRST116') {
    console.error('Error finding host:', hostError);
    process.exit(1);
  }

  let hostUserId;
  if (!hostUser) {
    console.log('  Host user not found, creating...');
    hostUserId = generateId('host');

    const { error: createError } = await supabase
      .from('user')
      .insert({
        _id: hostUserId,
        email: 'rodtesthost@test.com',
        'Name - First': 'Rod',
        'Name - Last': 'TestHost',
        'Name - Full': 'Rod TestHost',
        'User Type': 'Host',
        'Created Date': now.toISOString(),
        'Modified Date': now.toISOString(),
      });

    if (createError) {
      console.error('Error creating host:', createError);
      process.exit(1);
    }
    console.log(`  Created host user: ${hostUserId}`);
  } else {
    hostUserId = hostUser._id;
    console.log(`  Found host user: ${hostUserId}`);
  }

  // Step 2: Find or create guest user
  console.log('[Step 2] Finding guest user...');

  let { data: guestUser, error: guestError } = await supabase
    .from('user')
    .select('_id, email')
    .eq('email', 'testguest@test.com')
    .single();

  if (guestError && guestError.code !== 'PGRST116') {
    console.error('Error finding guest:', guestError);
    process.exit(1);
  }

  let guestUserId;
  if (!guestUser) {
    console.log('  Guest user not found, creating...');
    guestUserId = generateId('guest');

    const { error: createError } = await supabase
      .from('user')
      .insert({
        _id: guestUserId,
        email: 'testguest@test.com',
        'Name - First': 'Test',
        'Name - Last': 'Guest',
        'Name - Full': 'Test Guest',
        'User Type': 'Guest',
        'Phone Number': '555-123-4567',
        'user verified?': true,
        'Created Date': now.toISOString(),
        'Modified Date': now.toISOString(),
      });

    if (createError) {
      console.error('Error creating guest:', createError);
      process.exit(1);
    }
    console.log(`  Created guest user: ${guestUserId}`);
  } else {
    guestUserId = guestUser._id;
    console.log(`  Found guest user: ${guestUserId}`);
  }

  // Step 3: Find or create listing
  console.log('[Step 3] Finding listing for host...');

  let { data: listings, error: listingError } = await supabase
    .from('listing')
    .select('_id, Name')
    .or(`"Host User".eq.${hostUserId},"Created By".eq.${hostUserId}`)
    .eq('Deleted', false)
    .limit(1);

  if (listingError) {
    console.error('Error finding listing:', listingError);
    process.exit(1);
  }

  let listingId;
  if (!listings || listings.length === 0) {
    console.log('  No listing found, creating...');
    listingId = generateId('listing');

    const { error: createError } = await supabase
      .from('listing')
      .insert({
        _id: listingId,
        Name: 'Test Apartment for Host Leases Page',
        'Host User': hostUserId,
        'Created By': hostUserId,
        Complete: true,
        Deleted: false,
        'Location - Borough': 'Manhattan',
        'Location - City': 'New York',
        'Location - State': 'NY',
        'Features - Qty Bedrooms': 2,
        'Features - Qty Bathrooms': 1,
        'rental type': 'Split Lease',
        'Standarized Minimum Nightly Price (Filter)': 150.00,
        'Created Date': now.toISOString(),
        'Modified Date': now.toISOString(),
      });

    if (createError) {
      console.error('Error creating listing:', createError);
      process.exit(1);
    }
    console.log(`  Created listing: ${listingId}`);
  } else {
    listingId = listings[0]._id;
    console.log(`  Found listing: ${listingId} (${listings[0].Name})`);
  }

  // Step 4: Create proposal
  console.log('[Step 4] Creating proposal...');
  const proposalId = generateId('proposal');

  const { error: proposalError } = await supabase
    .from('proposal')
    .insert({
      _id: proposalId,
      Guest: guestUserId,
      'Host User': hostUserId,
      Listing: listingId,
      Status: 'Proposal or Counteroffer Accepted / Drafting Lease Documents',
      'rental type': 'Split Lease',
      'Move in range start': formatDate(startDate),
      'Move in range end': formatDate(addDays(startDate, 7)),
      'Reservation Span (Weeks)': 12,
      'duration in months': 3,
      'nights per week (num)': 3,
      'proposal nightly price': 150.00,
      'damage deposit': 500.00,
      'cleaning fee': 100.00,
      'maintenance fee': 50.00,
      'Days Selected': [1, 2, 3], // Mon, Tue, Wed
      '4 week rent': 1800.00,
      '4 week compensation': 1620.00,
      'Created Date': now.toISOString(),
      'Modified Date': now.toISOString(),
    });

  if (proposalError) {
    console.error('Error creating proposal:', proposalError);
    process.exit(1);
  }
  console.log(`  Created proposal: ${proposalId}`);

  // Step 5: Create lease
  console.log('[Step 5] Creating lease...');
  const leaseId = generateId('lease');
  const agreementNumber = `TEST-${formatDate(now).replace(/-/g, '')}-0001`;

  const { error: leaseError } = await supabase
    .from('bookings_leases')
    .insert({
      _id: leaseId,
      'Agreement Number': agreementNumber,
      Proposal: proposalId,
      Guest: guestUserId,
      Host: hostUserId,
      Listing: listingId,
      Participants: [guestUserId, hostUserId],
      'First Payment Date': formatDate(startDate),
      'Reservation Period : Start': formatDate(startDate),
      'Reservation Period : End': formatDate(endDate),
      'Total Compensation': 4860.00,
      'Total Rent': 5400.00,
      'Lease Status': 'Active',
      'Lease signed?': true,
      'were documents generated?': true,
      'total week count': 12,
      'current week number': 3,
      'Paid to Date from Guest': 1800.00,
      'Created Date': now.toISOString(),
      'Modified Date': now.toISOString(),
    });

  if (leaseError) {
    console.error('Error creating lease:', leaseError);
    process.exit(1);
  }
  console.log(`  Created lease: ${leaseId}`);
  console.log(`  Agreement Number: ${agreementNumber}`);

  // Step 6: Create stays
  console.log('[Step 6] Creating stays...');
  const stayIds = [];

  const staysData = [
    {
      weekNumber: 1,
      status: 'Completed',
      checkIn: startDate,
      lastNight: addDays(startDate, 2),
    },
    {
      weekNumber: 2,
      status: 'Completed',
      checkIn: addDays(startDate, 7),
      lastNight: addDays(startDate, 9),
    },
    {
      weekNumber: 3,
      status: 'In Progress',
      checkIn: addDays(now, -1),
      lastNight: addDays(now, 1),
    },
    {
      weekNumber: 4,
      status: 'Upcoming',
      checkIn: addDays(now, 7),
      lastNight: addDays(now, 9),
    },
  ];

  for (const stay of staysData) {
    const stayId = generateId(`stay_${stay.weekNumber}`);
    stayIds.push(stayId);

    const dates = [
      formatDate(stay.checkIn),
      formatDate(addDays(stay.checkIn, 1)),
      formatDate(stay.lastNight),
    ];

    const { error: stayError } = await supabase
      .from('bookings_stays')
      .insert({
        _id: stayId,
        Lease: leaseId,
        'Week Number': stay.weekNumber,
        Guest: guestUserId,
        Host: hostUserId,
        listing: listingId,
        'Check In (night)': formatDate(stay.checkIn),
        'Last Night (night)': formatDate(stay.lastNight),
        'Stay Status': stay.status,
        'Dates - List of dates in this period': dates,
        'Created Date': now.toISOString(),
        'Modified Date': now.toISOString(),
      });

    if (stayError) {
      console.error(`Error creating stay ${stay.weekNumber}:`, stayError);
      process.exit(1);
    }
    console.log(`  Created stay ${stay.weekNumber} (${stay.status}): ${stayId}`);
  }

  // Step 7: Create payment records
  console.log('[Step 7] Creating payment records...');
  const paymentIds = [];

  const paymentsData = [
    {
      number: 1,
      scheduledDate: startDate,
      actualDate: startDate,
      rent: 1800.00,
      maintenance: 50.00,
      deposit: 500.00,
      total: 2350.00,
      isPaid: true,
      txn: 'TXN-TEST-001',
    },
    {
      number: 2,
      scheduledDate: addDays(startDate, 28),
      actualDate: addDays(startDate, 28),
      rent: 1800.00,
      maintenance: 50.00,
      deposit: 0,
      total: 1850.00,
      isPaid: true,
      txn: 'TXN-TEST-002',
    },
    {
      number: 3,
      scheduledDate: addDays(startDate, 56),
      actualDate: null,
      rent: 1800.00,
      maintenance: 50.00,
      deposit: 0,
      total: 1850.00,
      isPaid: false,
      txn: null,
    },
  ];

  for (const payment of paymentsData) {
    const paymentId = generateId(`payment_${payment.number}`);
    paymentIds.push(paymentId);

    const paymentRecord = {
      _id: paymentId,
      'Booking - Reservation': leaseId,
      'Payment #': payment.number,
      'Scheduled Date': formatDate(payment.scheduledDate),
      'Rent Amount': payment.rent,
      'Maintenance Fee': payment.maintenance,
      'Damage Deposit': payment.deposit,
      'Total Amount': payment.total,
      'Is Paid': payment.isPaid,
      'Is Refunded': false,
      'Created Date': now.toISOString(),
      'Modified Date': now.toISOString(),
    };

    if (payment.actualDate) {
      paymentRecord['Actual Date'] = formatDate(payment.actualDate);
    }
    if (payment.txn) {
      paymentRecord['Bank Transaction Number'] = payment.txn;
    }

    const { error: paymentError } = await supabase
      .from('paymentrecords')
      .insert(paymentRecord);

    if (paymentError) {
      console.error(`Error creating payment ${payment.number}:`, paymentError);
      process.exit(1);
    }
    console.log(`  Created payment ${payment.number} (${payment.isPaid ? 'Paid' : 'Pending'}): ${paymentId}`);
  }

  // Step 8: Create date change request
  console.log('[Step 8] Creating date change request...');
  const dcrId = generateId('dcr');

  const { error: dcrError } = await supabase
    .from('datechangerequest')
    .insert({
      _id: dcrId,
      Lease: leaseId,
      'Requested by': guestUserId,
      'Request receiver': hostUserId,
      'Stay Associated 1': stayIds[3], // Week 4 stay
      status: 'Pending',
      'Request Type': 'reschedule',
      'Original Date': formatDate(addDays(now, 7)),
      'Requested Date': formatDate(addDays(now, 14)),
      'Price Adjustment': 0.00,
      'visible to guest': true,
      'Created Date': now.toISOString(),
      'Modified Date': now.toISOString(),
    });

  if (dcrError) {
    console.error('Error creating date change request:', dcrError);
    process.exit(1);
  }
  console.log(`  Created date change request: ${dcrId}`);

  // Step 9: Update lease with stay and payment IDs
  console.log('[Step 9] Updating lease with related records...');

  const { error: updateError } = await supabase
    .from('bookings_leases')
    .update({
      'List of Stays': stayIds,
      'Payment Records Guest-SL': paymentIds,
    })
    .eq('_id', leaseId);

  if (updateError) {
    console.error('Error updating lease:', updateError);
    process.exit(1);
  }
  console.log('  Lease updated with stay and payment record IDs');

  // Summary
  console.log('');
  console.log('='.repeat(60));
  console.log('MOCK DATA CREATION COMPLETE');
  console.log('='.repeat(60));
  console.log('');
  console.log('Summary:');
  console.log(`  Host User ID:       ${hostUserId}`);
  console.log(`  Guest User ID:      ${guestUserId}`);
  console.log(`  Listing ID:         ${listingId}`);
  console.log(`  Proposal ID:        ${proposalId}`);
  console.log(`  Lease ID:           ${leaseId}`);
  console.log(`  Agreement Number:   ${agreementNumber}`);
  console.log(`  Stay IDs:           ${stayIds.join(', ')}`);
  console.log(`  Payment IDs:        ${paymentIds.join(', ')}`);
  console.log(`  Date Change Req ID: ${dcrId}`);
  console.log('');
  console.log('Lease Details:');
  console.log(`  Start Date:         ${formatDate(startDate)}`);
  console.log(`  End Date:           ${formatDate(endDate)}`);
  console.log(`  Total Weeks:        12`);
  console.log(`  Current Week:       3`);
  console.log(`  Status:             Active`);
  console.log('');
  console.log('Stays:');
  console.log('  Week 1: Completed');
  console.log('  Week 2: Completed');
  console.log('  Week 3: In Progress (current)');
  console.log('  Week 4: Upcoming (has pending date change request)');
  console.log('');
  console.log('Payments:');
  console.log('  Payment 1: Paid ($2,350.00 - includes deposit)');
  console.log('  Payment 2: Paid ($1,850.00)');
  console.log('  Payment 3: Pending ($1,850.00)');
  console.log('');
  console.log('Test the host-leases page by logging in as:');
  console.log('  Email: rodtesthost@test.com');
  console.log('  URL:   /host-leases');
  console.log('='.repeat(60));
}

main().catch(console.error);
