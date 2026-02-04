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

// Multiple listing IDs for comprehensive testing
const TEST_IDS = {
  listings: {
    manhattan: `${TEST_DATA_PREFIX}listing-manhattan-001`,
    brooklyn: `${TEST_DATA_PREFIX}listing-brooklyn-001`,
    queens: `${TEST_DATA_PREFIX}listing-queens-001`,
    weeknight: `${TEST_DATA_PREFIX}listing-weeknight-001`,
    weekend: `${TEST_DATA_PREFIX}listing-weekend-001`,
    bidding: `${TEST_DATA_PREFIX}listing-bidding-001`, // For Pattern 4
    featured: `${TEST_DATA_PREFIX}listing-featured-001`,
    budget: `${TEST_DATA_PREFIX}listing-budget-001`
  },
  leases: {
    bigSpender: `${TEST_DATA_PREFIX}lease-big-spender-001`,
    highFlex: `${TEST_DATA_PREFIX}lease-high-flex-001`,
    average: `${TEST_DATA_PREFIX}lease-average-001`
  },
  proposals: {
    pending: `${TEST_DATA_PREFIX}proposal-pending-001`,
    accepted: `${TEST_DATA_PREFIX}proposal-accepted-001`,
    declined: `${TEST_DATA_PREFIX}proposal-declined-001`
  },
  dateChangeRequest: `${TEST_DATA_PREFIX}dcr-001`,
  bidding: {
    session: `${TEST_DATA_PREFIX}bid-session-001`,
    bid1: `${TEST_DATA_PREFIX}bid-001`,
    bid2: `${TEST_DATA_PREFIX}bid-002`
  }
};

// ============================================================================
// SEED DATA FUNCTIONS
// ============================================================================

/**
 * Seed all test data into Supabase
 * Creates multiple listings, leases, stays, proposals, archetypes, and test scenarios
 */
export async function seedTestData(): Promise<void> {
  const supabase = getSupabaseAdmin();
  console.log('\nSeeding comprehensive test data...');

  // Ensure users have been created
  const hostId = getTestUserId('host');
  const guestBigSpenderId = getTestUserId('guest_big_spender');
  const guestHighFlexId = getTestUserId('guest_high_flex');
  const guestAverageId = getTestUserId('guest_average');
  const adminId = getTestUserId('admin');

  // =========================================================================
  // 1. CREATE MULTIPLE TEST LISTINGS
  // =========================================================================
  console.log('  Creating test listings...');

  const listings: TestListing[] = [
    // Manhattan listing - Premium weeknight
    {
      _id: TEST_IDS.listings.manhattan,
      'Listing Name': 'Luxury 1BR in Midtown Manhattan',
      Address: '250 W 50th Street, New York, NY 10019',
      'Monthly Rent': 3500,
      Host: hostId,
      'Active?': true,
      'Featured?': true,
      'Number of Beds': 1,
      'Number of Baths': 1
    },
    // Brooklyn listing - Mid-range weeknight
    {
      _id: TEST_IDS.listings.brooklyn,
      'Listing Name': 'Spacious 2BR in Williamsburg',
      Address: '150 Bedford Ave, Brooklyn, NY 11211',
      'Monthly Rent': 2800,
      Host: hostId,
      'Active?': true,
      'Featured?': false,
      'Number of Beds': 2,
      'Number of Baths': 1
    },
    // Queens listing - Budget-friendly
    {
      _id: TEST_IDS.listings.queens,
      'Listing Name': 'Modern Studio in Long Island City',
      Address: '44-02 23rd Street, Queens, NY 11101',
      'Monthly Rent': 2000,
      Host: hostId,
      'Active?': true,
      'Featured?': false,
      'Number of Beds': 0,
      'Number of Baths': 1
    },
    // Weeknight-only listing
    {
      _id: TEST_IDS.listings.weeknight,
      'Listing Name': 'Weeknight Split Lease - Perfect for Commuters',
      Address: '100 Wall Street, New York, NY 10005',
      'Monthly Rent': 2500,
      Host: hostId,
      'Active?': true,
      'Featured?': false,
      'Number of Beds': 1,
      'Number of Baths': 1
    },
    // Weekend listing
    {
      _id: TEST_IDS.listings.weekend,
      'Listing Name': 'Weekend Getaway in Chelsea',
      Address: '200 8th Avenue, New York, NY 10011',
      'Monthly Rent': 2200,
      Host: hostId,
      'Active?': true,
      'Featured?': false,
      'Number of Beds': 1,
      'Number of Baths': 1
    },
    // Bidding scenario listing (Pattern 4)
    {
      _id: TEST_IDS.listings.bidding,
      'Listing Name': 'Prime SoHo Loft - High Demand',
      Address: '75 Spring Street, New York, NY 10012',
      'Monthly Rent': 4000,
      Host: hostId,
      'Active?': true,
      'Featured?': true,
      'Number of Beds': 2,
      'Number of Baths': 2
    },
    // Featured listing
    {
      _id: TEST_IDS.listings.featured,
      'Listing Name': 'Featured Penthouse with Terrace',
      Address: '432 Park Avenue, New York, NY 10022',
      'Monthly Rent': 5000,
      Host: hostId,
      'Active?': true,
      'Featured?': true,
      'Number of Beds': 3,
      'Number of Baths': 2
    },
    // Budget listing
    {
      _id: TEST_IDS.listings.budget,
      'Listing Name': 'Budget-Friendly Studio in Harlem',
      Address: '2280 Frederick Douglass Blvd, New York, NY 10027',
      'Monthly Rent': 1500,
      Host: hostId,
      'Active?': true,
      'Featured?': false,
      'Number of Beds': 0,
      'Number of Baths': 1
    }
  ];

  const { error: listingError } = await supabase
    .from('listing')
    .upsert(listings, { onConflict: '_id' });

  if (listingError) {
    console.error(`    [ERROR] Listing seed failed: ${listingError.message}`);
    console.error(`    [ERROR] Details:`, listingError);
    console.log('    [WARN] Continuing without listings...');
  } else {
    console.log(`    [OK] ${listings.length} listings seeded`);
  }

  // =========================================================================
  // 2. CREATE LEASES FOR ALL GUEST ARCHETYPES
  // =========================================================================
  console.log('  Creating test leases for all guest archetypes...');
  const now = new Date();

  const leases: TestLease[] = [
    // Big Spender lease (for Pattern 1 tests)
    {
      _id: TEST_IDS.leases.bigSpender,
      'Agreement Number': 'E2E-BIG-SPENDER-001',
      Guest: guestBigSpenderId,
      Host: hostId,
      Listing: TEST_IDS.listings.manhattan,
      'Reservation Period : Start': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      'Reservation Period : End': new Date(now.getTime() + 83 * 24 * 60 * 60 * 1000).toISOString(),
      'Lease Status': 'Active',
      'Total Rent': 10500
    },
    // High Flex lease (for Pattern 1 tests)
    {
      _id: TEST_IDS.leases.highFlex,
      'Agreement Number': 'E2E-HIGH-FLEX-001',
      Guest: guestHighFlexId,
      Host: hostId,
      Listing: TEST_IDS.listings.brooklyn,
      'Reservation Period : Start': new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      'Reservation Period : End': new Date(now.getTime() + 76 * 24 * 60 * 60 * 1000).toISOString(),
      'Lease Status': 'Active',
      'Total Rent': 8400
    },
    // Average User lease (for Pattern 1 tests)
    {
      _id: TEST_IDS.leases.average,
      'Agreement Number': 'E2E-AVERAGE-001',
      Guest: guestAverageId,
      Host: hostId,
      Listing: TEST_IDS.listings.queens,
      'Reservation Period : Start': new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      'Reservation Period : End': new Date(now.getTime() + 69 * 24 * 60 * 60 * 1000).toISOString(),
      'Lease Status': 'Active',
      'Total Rent': 6000
    }
  ];

  const { error: leaseError } = await supabase
    .from('bookings_leases')
    .upsert(leases, { onConflict: '_id' });

  if (leaseError) {
    console.error(`    [ERROR] Lease seed failed: ${leaseError.message}`);
    console.error(`    [ERROR] Details:`, leaseError);
    console.log('    [WARN] Continuing without leases...');
  } else {
    console.log(`    [OK] ${leases.length} leases seeded`);
  }

  // =========================================================================
  // 3. CREATE CALENDAR STAYS FOR ALL LEASES
  // =========================================================================
  console.log('  Creating calendar stays for all leases...');
  const stays: TestStay[] = [];

  // Helper function to create stays for a lease
  const createStaysForLease = (leaseId: string, guestId: string, startDate: Date, prefix: string) => {
    for (let week = 0; week < 12; week++) {
      const stayStart = new Date(startDate.getTime() + week * 7 * 24 * 60 * 60 * 1000);
      const stayEnd = new Date(stayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      stays.push({
        _id: `${TEST_DATA_PREFIX}stay-${prefix}-${String(week + 1).padStart(3, '0')}`,
        Lease: leaseId,
        Guest: guestId,
        Start: stayStart.toISOString(),
        End: stayEnd.toISOString(),
        Status: week < 2 ? 'Completed' : 'Upcoming'
      });
    }
  };

  // Create stays for each lease
  createStaysForLease(
    TEST_IDS.leases.bigSpender,
    guestBigSpenderId,
    new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    'big-spender'
  );
  createStaysForLease(
    TEST_IDS.leases.highFlex,
    guestHighFlexId,
    new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    'high-flex'
  );
  createStaysForLease(
    TEST_IDS.leases.average,
    guestAverageId,
    new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
    'average'
  );

  const { error: staysError } = await supabase
    .from('calendar_stays')
    .upsert(stays, { onConflict: '_id' });

  if (staysError) {
    console.error(`    [ERROR] Stays seed failed: ${staysError.message}`);
    console.error(`    [ERROR] Details:`, staysError);
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

  // =========================================================================
  // 5. CREATE DATE CHANGE REQUEST
  // =========================================================================
  console.log('  Creating date change request...');
  const dateChangeRequest: TestDateChangeRequest = {
    _id: TEST_IDS.dateChangeRequest,
    Lease: TEST_IDS.leases.bigSpender, // Use the Big Spender's lease
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
  } else {
    console.log(`    [OK] Date change request seeded`);
  }

  // =========================================================================
  // 6. CREATE TEST PROPOSALS (for booking/messaging tests)
  // =========================================================================
  console.log('  Creating test proposals...');

  // Note: Using any type for proposals as the exact schema may vary
  const proposals: any[] = [
    // Pending proposal - for guest to review
    {
      _id: TEST_IDS.proposals.pending,
      'Guest ID': guestBigSpenderId,
      'Listing ID': TEST_IDS.listings.weeknight,
      'Host ID': hostId,
      'Proposal Status': 'host_review',
      'Move In Date': new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      'Days Selected': JSON.stringify([1, 2, 3, 4, 5]), // Mon-Fri
      'Reservation Span (weeks)': 13,
      'Price Per Night': 200,
      'Total Price': 13000,
      'Created Date': new Date().toISOString()
    },
    // Accepted proposal
    {
      _id: TEST_IDS.proposals.accepted,
      'Guest ID': guestHighFlexId,
      'Listing ID': TEST_IDS.listings.weekend,
      'Host ID': hostId,
      'Proposal Status': 'accepted',
      'Move In Date': new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      'Days Selected': JSON.stringify([5, 6, 0, 1]), // Fri-Mon
      'Reservation Span (weeks)': 13,
      'Price Per Night': 175,
      'Total Price': 9100,
      'Created Date': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    // Declined proposal
    {
      _id: TEST_IDS.proposals.declined,
      'Guest ID': guestAverageId,
      'Listing ID': TEST_IDS.listings.budget,
      'Host ID': hostId,
      'Proposal Status': 'declined',
      'Move In Date': new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      'Days Selected': JSON.stringify([1, 2, 3]), // Mon-Wed
      'Reservation Span (weeks)': 13,
      'Price Per Night': 120,
      'Total Price': 4680,
      'Created Date': new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const { error: proposalError } = await supabase
    .from('proposals')
    .upsert(proposals, { onConflict: '_id' });

  if (proposalError) {
    console.error(`    [WARN] Proposal seed warning: ${proposalError.message}`);
    console.error(`    [WARN] Proposals table may not exist or have different schema`);
  } else {
    console.log(`    [OK] ${proposals.length} proposals seeded`);
  }

  // =========================================================================
  // 7. CREATE USER RECORDS
  // =========================================================================
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
    },
    {
      _id: adminId,
      email: TEST_USERS.admin.email,
      'First Name': TEST_USERS.admin.firstName,
      'Last Name': TEST_USERS.admin.lastName,
      auth_user_id: adminId
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
  console.log('\nCleaning up comprehensive test data...');

  // Delete in reverse order of creation (FK constraints)

  // 1. Delete proposals
  const { error: proposalError } = await supabase
    .from('proposals')
    .delete()
    .like('_id', `${TEST_DATA_PREFIX}%`);

  if (proposalError) {
    console.log(`  [WARN] Proposal cleanup: ${proposalError.message}`);
  } else {
    console.log('  [OK] Deleted proposals');
  }

  // 2. Delete date change requests
  const { error: dcrError } = await supabase
    .from('datechangerequest')
    .delete()
    .like('_id', `${TEST_DATA_PREFIX}%`);

  if (dcrError) {
    console.log(`  [WARN] DCR cleanup: ${dcrError.message}`);
  } else {
    console.log('  [OK] Deleted date change requests');
  }

  // 3. Delete user archetypes
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

  // 4. Delete calendar stays
  const { error: staysError } = await supabase
    .from('calendar_stays')
    .delete()
    .like('_id', `${TEST_DATA_PREFIX}%`);

  if (staysError) {
    console.log(`  [WARN] Stays cleanup: ${staysError.message}`);
  } else {
    console.log('  [OK] Deleted calendar stays');
  }

  // 5. Delete leases
  const { error: leaseError } = await supabase
    .from('bookings_leases')
    .delete()
    .like('_id', `${TEST_DATA_PREFIX}%`);

  if (leaseError) {
    console.log(`  [WARN] Lease cleanup: ${leaseError.message}`);
  } else {
    console.log('  [OK] Deleted leases');
  }

  // 6. Delete listings
  const { error: listingError } = await supabase
    .from('listing')
    .delete()
    .like('_id', `${TEST_DATA_PREFIX}%`);

  if (listingError) {
    console.log(`  [WARN] Listing cleanup: ${listingError.message}`);
  } else {
    console.log('  [OK] Deleted listings');
  }

  // 7. Delete user records
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
