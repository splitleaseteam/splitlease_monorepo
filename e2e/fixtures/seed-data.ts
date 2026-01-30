/**
 * Test Data Seeding Module for E2E Tests
 *
 * Seeds and cleans up test data in Supabase.
 * Creates listings, leases, stays, archetypes, and date change requests
 * that are needed for E2E tests.
 *
 * All test data uses 'e2e-test-' prefix for easy identification and cleanup.
 */

import { getSupabaseAdmin, TEST_USERS, getTestUserId, TestUsersMap } from './test-users';

// ============================================================================
// TYPES
// ============================================================================

interface TestListing {
  _id: string;
  'Listing Name': string;
  Address: string;
  'Monthly Rent': number;
  Host: string;
  'Active?': boolean;
  'Featured?': boolean;
  'Number of Beds': number;
  'Number of Baths': number;
}

interface TestLease {
  _id: string;
  'Agreement Number': string;
  Guest: string;
  Host: string;
  Listing: string;
  'Reservation Period : Start': string;
  'Reservation Period : End': string;
  'Lease Status': string;
  'Total Rent': number;
}

interface TestStay {
  _id: string;
  Lease: string;
  Guest: string;
  Start: string;
  End: string;
  Status: string;
}

interface TestArchetype {
  auth_user_id: string;
  archetype: string;
  confidence_score: number;
  last_detection_date: string;
}

interface TestDateChangeRequest {
  _id: string;
  Lease: string;
  'Requested by': string;
  'Request receiver': string;
  'type of request': string;
  'request status': string;
  'Created Date': string;
}

// ============================================================================
// TEST DATA IDS
// ============================================================================

const TEST_DATA_PREFIX = 'e2e-test-';

const TEST_IDS = {
  listing: `${TEST_DATA_PREFIX}listing-001`,
  lease: `${TEST_DATA_PREFIX}lease-001`,
  dateChangeRequest: `${TEST_DATA_PREFIX}dcr-001`
};

// ============================================================================
// SEED DATA FUNCTIONS
// ============================================================================

/**
 * Seed all test data into Supabase
 * Creates listing, lease, stays, archetypes, and date change request
 */
export async function seedTestData(): Promise<void> {
  const supabase = getSupabaseAdmin();
  console.log('\nSeeding test data...');

  // Ensure users have been created
  const hostId = getTestUserId('host');
  const guestBigSpenderId = getTestUserId('guest_big_spender');
  const guestHighFlexId = getTestUserId('guest_high_flex');
  const guestAverageId = getTestUserId('guest_average');

  // 1. Create test listing
  console.log('  Creating test listing...');
  const listing: TestListing = {
    _id: TEST_IDS.listing,
    'Listing Name': 'E2E Test Apartment - Manhattan',
    Address: '123 Test Street, New York, NY 10001',
    'Monthly Rent': 2500,
    Host: hostId,
    'Active?': true,
    'Featured?': false,
    'Number of Beds': 1,
    'Number of Baths': 1
  };

  const { error: listingError } = await supabase
    .from('listing')
    .upsert(listing, { onConflict: '_id' });

  if (listingError) {
    console.error(`    [ERROR] Listing seed failed: ${listingError.message}`);
    // Don't throw - listing might have FK constraints that fail in dev
    console.log('    [WARN] Continuing without listing...');
  } else {
    console.log(`    [OK] Listing seeded: ${listing._id}`);
  }

  // 2. Create test lease
  console.log('  Creating test lease...');
  const now = new Date();
  const leaseStart = new Date(now);
  leaseStart.setDate(leaseStart.getDate() - 7); // Started 7 days ago
  const leaseEnd = new Date(now);
  leaseEnd.setDate(leaseEnd.getDate() + 83); // 90 days total

  const lease: TestLease = {
    _id: TEST_IDS.lease,
    'Agreement Number': 'E2E-TEST-001',
    Guest: guestBigSpenderId,
    Host: hostId,
    Listing: TEST_IDS.listing,
    'Reservation Period : Start': leaseStart.toISOString(),
    'Reservation Period : End': leaseEnd.toISOString(),
    'Lease Status': 'Active',
    'Total Rent': 7500
  };

  const { error: leaseError } = await supabase
    .from('bookings_leases')
    .upsert(lease, { onConflict: '_id' });

  if (leaseError) {
    console.error(`    [ERROR] Lease seed failed: ${leaseError.message}`);
    console.log('    [WARN] Continuing without lease...');
  } else {
    console.log(`    [OK] Lease seeded: ${lease._id}`);
  }

  // 3. Create calendar stays
  console.log('  Creating calendar stays...');
  const stays: TestStay[] = [];
  for (let week = 0; week < 12; week++) {
    const stayStart = new Date(leaseStart.getTime() + week * 7 * 24 * 60 * 60 * 1000);
    const stayEnd = new Date(stayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    stays.push({
      _id: `${TEST_DATA_PREFIX}stay-${String(week + 1).padStart(3, '0')}`,
      Lease: TEST_IDS.lease,
      Guest: guestBigSpenderId,
      Start: stayStart.toISOString(),
      End: stayEnd.toISOString(),
      Status: week < 2 ? 'Completed' : 'Upcoming'
    });
  }

  const { error: staysError } = await supabase
    .from('calendar_stays')
    .upsert(stays, { onConflict: '_id' });

  if (staysError) {
    console.error(`    [ERROR] Stays seed failed: ${staysError.message}`);
    console.log('    [WARN] Continuing without stays...');
  } else {
    console.log(`    [OK] ${stays.length} stays seeded`);
  }

  // 4. Create user archetypes
  console.log('  Creating user archetypes...');
  const archetypes: TestArchetype[] = [
    {
      auth_user_id: guestBigSpenderId,
      archetype: 'big_spender',
      confidence_score: 0.92,
      last_detection_date: new Date().toISOString()
    },
    {
      auth_user_id: guestHighFlexId,
      archetype: 'high_flex',
      confidence_score: 0.88,
      last_detection_date: new Date().toISOString()
    },
    {
      auth_user_id: guestAverageId,
      archetype: 'average',
      confidence_score: 0.75,
      last_detection_date: new Date().toISOString()
    }
  ];

  const { error: archetypeError } = await supabase
    .from('user_archetypes')
    .upsert(archetypes, { onConflict: 'auth_user_id' });

  if (archetypeError) {
    console.error(`    [WARN] Archetype seed warning: ${archetypeError.message}`);
    // This table might not exist in dev environment
  } else {
    console.log(`    [OK] ${archetypes.length} archetypes seeded`);
  }

  // 5. Create a pending date change request
  console.log('  Creating date change request...');
  const dateChangeRequest: TestDateChangeRequest = {
    _id: TEST_IDS.dateChangeRequest,
    Lease: TEST_IDS.lease,
    'Requested by': guestBigSpenderId,
    'Request receiver': hostId,
    'type of request': 'adding',
    'request status': 'pending',
    'Created Date': new Date().toISOString()
  };

  const { error: dcrError } = await supabase
    .from('datechangerequest')
    .upsert(dateChangeRequest, { onConflict: '_id' });

  if (dcrError) {
    console.error(`    [WARN] DCR seed warning: ${dcrError.message}`);
    // This table might have different structure
  } else {
    console.log(`    [OK] Date change request seeded: ${dateChangeRequest._id}`);
  }

  // 6. Create user records in public.user table (if it exists)
  console.log('  Creating user records...');
  const userRecords = [
    {
      _id: guestBigSpenderId,
      email: TEST_USERS.guest_big_spender.email,
      'First Name': TEST_USERS.guest_big_spender.firstName,
      'Last Name': TEST_USERS.guest_big_spender.lastName,
      auth_user_id: guestBigSpenderId
    },
    {
      _id: guestHighFlexId,
      email: TEST_USERS.guest_high_flex.email,
      'First Name': TEST_USERS.guest_high_flex.firstName,
      'Last Name': TEST_USERS.guest_high_flex.lastName,
      auth_user_id: guestHighFlexId
    },
    {
      _id: guestAverageId,
      email: TEST_USERS.guest_average.email,
      'First Name': TEST_USERS.guest_average.firstName,
      'Last Name': TEST_USERS.guest_average.lastName,
      auth_user_id: guestAverageId
    },
    {
      _id: hostId,
      email: TEST_USERS.host.email,
      'First Name': TEST_USERS.host.firstName,
      'Last Name': TEST_USERS.host.lastName,
      auth_user_id: hostId
    }
  ];

  const { error: userError } = await supabase
    .from('user')
    .upsert(userRecords, { onConflict: '_id' });

  if (userError) {
    console.error(`    [WARN] User records seed warning: ${userError.message}`);
  } else {
    console.log(`    [OK] ${userRecords.length} user records seeded`);
  }

  console.log('Test data seeding complete!\n');
}

/**
 * Clean up all test data from Supabase
 * Deletes in reverse order of creation (respects foreign keys)
 */
export async function cleanupTestData(): Promise<void> {
  const supabase = getSupabaseAdmin();
  console.log('\nCleaning up test data...');

  // Delete in reverse order of creation (FK constraints)

  // 1. Delete date change requests
  const { error: dcrError } = await supabase
    .from('datechangerequest')
    .delete()
    .like('_id', `${TEST_DATA_PREFIX}%`);

  if (dcrError) {
    console.log(`  [WARN] DCR cleanup: ${dcrError.message}`);
  } else {
    console.log('  [OK] Deleted date change requests');
  }

  // 2. Delete user archetypes
  const userIds = Object.values(TEST_USERS)
    .map(u => u.userId)
    .filter(Boolean) as string[];

  if (userIds.length > 0) {
    const { error: archetypeError } = await supabase
      .from('user_archetypes')
      .delete()
      .in('auth_user_id', userIds);

    if (archetypeError) {
      console.log(`  [WARN] Archetype cleanup: ${archetypeError.message}`);
    } else {
      console.log('  [OK] Deleted user archetypes');
    }
  }

  // 3. Delete calendar stays
  const { error: staysError } = await supabase
    .from('calendar_stays')
    .delete()
    .like('_id', `${TEST_DATA_PREFIX}%`);

  if (staysError) {
    console.log(`  [WARN] Stays cleanup: ${staysError.message}`);
  } else {
    console.log('  [OK] Deleted calendar stays');
  }

  // 4. Delete leases
  const { error: leaseError } = await supabase
    .from('bookings_leases')
    .delete()
    .like('_id', `${TEST_DATA_PREFIX}%`);

  if (leaseError) {
    console.log(`  [WARN] Lease cleanup: ${leaseError.message}`);
  } else {
    console.log('  [OK] Deleted leases');
  }

  // 5. Delete listings
  const { error: listingError } = await supabase
    .from('listing')
    .delete()
    .like('_id', `${TEST_DATA_PREFIX}%`);

  if (listingError) {
    console.log(`  [WARN] Listing cleanup: ${listingError.message}`);
  } else {
    console.log('  [OK] Deleted listings');
  }

  // 6. Delete user records
  if (userIds.length > 0) {
    const { error: userError } = await supabase
      .from('user')
      .delete()
      .in('_id', userIds);

    if (userError) {
      console.log(`  [WARN] User records cleanup: ${userError.message}`);
    } else {
      console.log('  [OK] Deleted user records');
    }
  }

  console.log('Test data cleanup complete!\n');
}

// ============================================================================
// EXPORTS
// ============================================================================

export { TEST_IDS };

export default {
  seedTestData,
  cleanupTestData,
  TEST_IDS
};
