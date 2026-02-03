/**
 * Seed Host Leases Test Data - Complete Version
 *
 * This script creates/updates mock lease data for testing the host-leases page.
 * Works with existing lease and fills in missing data.
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

  const { data: guest } = await supabase
    .from('user')
    .select('_id, email, "Name - Full", "Phone Number (as text)"')
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
 * Step 3: Find existing lease for host
 */
async function findExistingLease(hostId) {
  console.log('\n=== Step 3: Find Existing Lease ===');

  const { data, error } = await supabase
    .from('bookings_leases')
    .select('*')
    .eq('Host', hostId)
    .limit(1)
    .single();

  if (data) {
    console.log(`  Found lease: ${data._id} (${data['Agreement Number']})`);
    return data;
  }

  console.log('  No existing lease found');
  return null;
}

/**
 * Step 4: Update stays with proper statuses
 */
async function updateStayStatuses(leaseId) {
  console.log('\n=== Step 4: Update Stay Statuses ===');

  // Get all stays for the lease
  const { data: stays, error } = await supabase
    .from('bookings_stays')
    .select('_id, "Week Number", "Stay Status"')
    .eq('Lease', leaseId)
    .order('Week Number');

  if (!stays || stays.length === 0) {
    console.log('  No stays found');
    return;
  }

  console.log(`  Found ${stays.length} stays`);

  // Update stays based on week number:
  // Week 1-2: Completed
  // Week 3: In Progress
  // Week 4+: Upcoming
  for (const stay of stays) {
    const weekNum = stay['Week Number'];
    let newStatus;
    let checkIn;
    let lastNight;

    if (weekNum <= 2) {
      newStatus = 'Completed';
      checkIn = formatDate(daysAgo(14 - (weekNum - 1) * 7));
      lastNight = formatDate(daysAgo(12 - (weekNum - 1) * 7));
    } else if (weekNum === 3) {
      newStatus = 'In Progress';
      checkIn = formatDate(today);
      lastNight = formatDate(daysFromNow(2));
    } else {
      newStatus = 'Upcoming';
      checkIn = formatDate(daysFromNow((weekNum - 3) * 7));
      lastNight = formatDate(daysFromNow((weekNum - 3) * 7 + 2));
    }

    if (stay['Stay Status'] !== newStatus) {
      const { error: updateError } = await supabase
        .from('bookings_stays')
        .update({
          'Stay Status': newStatus,
          'Check In (night)': checkIn,
          'Last Night (night)': lastNight,
          'Modified Date': new Date().toISOString(),
        })
        .eq('_id', stay._id);

      if (updateError) {
        console.log(`  Week ${weekNum}: Failed to update - ${updateError.message}`);
      } else {
        console.log(`  Week ${weekNum}: ${newStatus}`);
      }
    } else {
      console.log(`  Week ${weekNum}: Already ${newStatus}`);
    }
  }
}

/**
 * Step 5: Create payment records via guest-payment-records Edge Function
 */
async function createPaymentRecords(leaseId, lease) {
  console.log('\n=== Step 5: Create Payment Records ===');

  // Check for existing payments
  const { data: existingPayments } = await supabase
    .from('paymentrecords')
    .select('_id, "Payment #"')
    .eq('Booking - Reservation', leaseId);

  if (existingPayments && existingPayments.length > 0) {
    console.log(`  Payments already exist: ${existingPayments.length} found`);
    return existingPayments;
  }

  // Use guest-payment-records Edge Function which uses the correct table name
  const result = await callEdgeFunction('guest-payment-records', 'generate', {
    leaseId,
    rentalType: 'Split Lease',
    moveInDate: formatDate(daysAgo(14)),
    reservationSpanWeeks: 12,
    reservationSpanMonths: 3,
    weekPattern: 'Every week',
    fourWeekRent: 1800,
    rentPerMonth: 1350,
    maintenanceFee: 50,
    damageDeposit: 500,
  });

  if (result.success) {
    console.log(`  Created payment records via Edge Function`);
    return result.data;
  }

  console.log(`  Edge Function failed: ${result.error}`);
  console.log('  Payment records will need to be created manually via SQL');
  return null;
}

/**
 * Step 6: Update lease status and current week
 */
async function updateLeaseStatus(leaseId) {
  console.log('\n=== Step 6: Update Lease Status ===');

  const { error } = await supabase
    .from('bookings_leases')
    .update({
      'Lease Status': 'Active',
      'Lease signed?': true,
      'were documents generated?': true,
      'current week number': 3,
      'total week count': 12,
      'Reservation Period : Start': formatDate(daysAgo(14)),
      'Reservation Period : End': formatDate(daysFromNow(90)),
      'Modified Date': new Date().toISOString(),
    })
    .eq('_id', leaseId);

  if (error) {
    console.log(`  Failed to update lease: ${error.message}`);
  } else {
    console.log('  Lease updated: Active, Week 3');
  }
}

/**
 * Step 7: Create date change request via Edge Function
 */
async function createDateChangeRequest(leaseId, guestId, hostId) {
  console.log('\n=== Step 7: Create Date Change Request ===');

  // Check for existing date change requests
  const { data: existingDCRs } = await supabase
    .from('datechangerequest')
    .select('_id')
    .eq('Lease', leaseId);

  if (existingDCRs && existingDCRs.length > 0) {
    console.log(`  Date change requests already exist: ${existingDCRs.length} found`);
    return existingDCRs;
  }

  // Get week 4 stay
  const { data: week4Stay } = await supabase
    .from('bookings_stays')
    .select('_id')
    .eq('Lease', leaseId)
    .eq('Week Number', 4)
    .single();

  if (!week4Stay) {
    console.log('  No week 4 stay found');
    return null;
  }

  // Create via Edge Function
  const result = await callEdgeFunction('date-change-request', 'create', {
    leaseId,
    stayId: week4Stay._id,
    requestedById: guestId,
    receiverId: hostId,
    requestType: 'reschedule',
    originalDate: formatDate(daysFromNow(7)),
    requestedDate: formatDate(daysFromNow(8)),
    priceAdjustment: 0,
  });

  if (result.success) {
    console.log('  Created date change request');
    return result.data;
  }

  console.log(`  Failed to create date change request: ${result.error}`);
  return null;
}

/**
 * Verify data
 */
async function verifyData(leaseId) {
  console.log('\n========================================');
  console.log('VERIFICATION');
  console.log('========================================');

  // Lease
  const { data: lease } = await supabase
    .from('bookings_leases')
    .select('_id, "Agreement Number", "Lease Status", "current week number", "total week count"')
    .eq('_id', leaseId)
    .single();

  if (lease) {
    console.log(`\nLease: ${lease['Agreement Number']}`);
    console.log(`  Status: ${lease['Lease Status']}`);
    console.log(`  Current Week: ${lease['current week number']} of ${lease['total week count']}`);
  }

  // Stays
  const { data: stays } = await supabase
    .from('bookings_stays')
    .select('_id, "Week Number", "Stay Status", "Check In (night)"')
    .eq('Lease', leaseId)
    .order('Week Number')
    .limit(6);

  console.log(`\nStays (first 6):`);
  stays?.forEach(s => {
    console.log(`  Week ${s['Week Number']}: ${s['Stay Status']} (${s['Check In (night)']})`);
  });

  // Payments
  const { data: payments } = await supabase
    .from('paymentrecords')
    .select('_id, "Payment #", "Total Amount", "Is Paid", "Scheduled Date"')
    .eq('Booking - Reservation', leaseId)
    .order('Payment #');

  console.log(`\nPayments: ${payments?.length || 0} total`);
  payments?.forEach(p => {
    console.log(`  #${p['Payment #']}: $${p['Total Amount']} - ${p['Is Paid'] ? 'Paid' : 'Pending'} (${p['Scheduled Date']})`);
  });

  // Date Change Requests
  const { data: dcrs } = await supabase
    .from('datechangerequest')
    .select('_id, status, "Request Type", "Original Date", "Requested Date"')
    .eq('Lease', leaseId);

  console.log(`\nDate Change Requests: ${dcrs?.length || 0}`);
  dcrs?.forEach(d => {
    console.log(`  ${d['Request Type']}: ${d.status} (${d['Original Date']} -> ${d['Requested Date']})`);
  });
}

/**
 * Main
 */
async function main() {
  console.log('========================================');
  console.log('Seed Host Leases Test Data - Complete');
  console.log('========================================');
  console.log(`Target: ${HOST_EMAIL}`);
  console.log(`Today: ${formatDate(today)}`);
  console.log('========================================');

  // Step 1: Find host
  const host = await findHostUser();
  if (!host) return;

  // Step 2: Find guest
  const guest = await findGuestUser();
  if (!guest) return;

  // Step 3: Find existing lease
  const lease = await findExistingLease(host._id);
  if (!lease) {
    console.log('\n========================================');
    console.log('No lease found. Please create one first:');
    console.log('1. Via UI: Guest creates proposal, host accepts');
    console.log('2. Via SQL: Run scripts/seed-host-leases-test-data.sql');
    console.log('========================================');
    return;
  }

  // Step 4: Update stay statuses
  await updateStayStatuses(lease._id);

  // Step 5: Create payment records
  await createPaymentRecords(lease._id, lease);

  // Step 6: Update lease status
  await updateLeaseStatus(lease._id);

  // Step 7: Create date change request
  await createDateChangeRequest(lease._id, guest._id, host._id);

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
