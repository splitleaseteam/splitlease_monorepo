/**
 * Test Data Factory
 *
 * Generates realistic test data for E2E tests.
 * Provides consistent, reproducible test data across all test scenarios.
 *
 * Day Indexing: Uses 0-based days (0=Sunday through 6=Saturday)
 * as per Split Lease conventions.
 */

import { faker } from '@faker-js/faker';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TestUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: 'guest' | 'host' | 'admin';
  profilePhoto?: string;
  isVerified?: boolean;
}

export interface TestListing {
  id: string;
  name: string;
  description: string;
  address: string;
  borough: string;
  neighborhood: string;
  bedrooms: number;
  bathrooms: number;
  pricePerNight: number;
  pricePerFourWeeks: number;
  daysAvailable: number[]; // 0-based day indices
  photos: string[];
  amenities: string[];
  hostId: string;
  isActive: boolean;
  isComplete: boolean;
}

export interface TestProposal {
  id: string;
  guestId: string;
  listingId: string;
  hostId: string;
  status: ProposalStatus;
  moveInDate: string;
  daysSelected: number[]; // 0-based day indices
  reservationSpanWeeks: number;
  pricePerNight: number;
  totalPrice: number;
  needForSpace?: string;
  aboutMe?: string;
  specialNeeds?: string;
  createdAt: string;
}

export type ProposalStatus =
  | 'host_review'
  | 'guest_review'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'expired'
  | 'counteroffer_pending';

export interface TestThread {
  id: string;
  proposalId: string;
  guestId: string;
  hostId: string;
  messages: TestMessage[];
  createdAt: string;
  lastMessageAt: string;
}

export interface TestMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderType: 'guest' | 'host' | 'system';
  content: string;
  createdAt: string;
  isRead: boolean;
}

// ============================================================================
// NYC GEOGRAPHY DATA
// ============================================================================

export const NYC_BOROUGHS = [
  'Manhattan',
  'Brooklyn',
  'Queens',
  'Bronx',
  'Staten Island'
] as const;

export const NYC_NEIGHBORHOODS: Record<string, string[]> = {
  Manhattan: [
    'Upper East Side',
    'Upper West Side',
    'Midtown',
    'Chelsea',
    'SoHo',
    'Tribeca',
    'Financial District',
    'Greenwich Village',
    'East Village',
    'Harlem'
  ],
  Brooklyn: [
    'Williamsburg',
    'DUMBO',
    'Park Slope',
    'Brooklyn Heights',
    'Bushwick',
    'Bed-Stuy',
    'Crown Heights',
    'Greenpoint',
    'Cobble Hill',
    'Fort Greene'
  ],
  Queens: [
    'Astoria',
    'Long Island City',
    'Flushing',
    'Jackson Heights',
    'Forest Hills',
    'Sunnyside',
    'Ridgewood',
    'Jamaica',
    'Corona',
    'Elmhurst'
  ],
  Bronx: [
    'Riverdale',
    'Fordham',
    'Kingsbridge',
    'Pelham Bay',
    'Morris Park',
    'Mott Haven',
    'Hunts Point',
    'Tremont'
  ],
  'Staten Island': [
    'St. George',
    'New Brighton',
    'Tompkinsville',
    'Stapleton',
    'Great Kills',
    'Tottenville'
  ]
};

export const AMENITIES = [
  'WiFi',
  'Air Conditioning',
  'Heating',
  'Washer/Dryer',
  'Dishwasher',
  'Parking',
  'Gym',
  'Doorman',
  'Elevator',
  'Pet Friendly',
  'Rooftop Access',
  'Balcony',
  'Storage',
  'Bike Storage',
  'Pool'
];

// ============================================================================
// FACTORIES
// ============================================================================

/**
 * Creates a test user with realistic data
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  const firstName = overrides.firstName || faker.person.firstName();
  const lastName = overrides.lastName || faker.person.lastName();
  const email =
    overrides.email ||
    faker.internet.email({ firstName, lastName }).toLowerCase();

  return {
    id: overrides.id || faker.string.alphanumeric(17),
    email,
    password: overrides.password || 'TestPassword123!',
    firstName,
    lastName,
    phone: overrides.phone || faker.phone.number('###-###-####'),
    userType: overrides.userType || 'guest',
    profilePhoto: overrides.profilePhoto || faker.image.avatar(),
    isVerified: overrides.isVerified ?? faker.datatype.boolean()
  };
}

/**
 * Creates a test guest user
 */
export function createTestGuest(overrides: Partial<TestUser> = {}): TestUser {
  return createTestUser({ ...overrides, userType: 'guest' });
}

/**
 * Creates a test host user
 */
export function createTestHost(overrides: Partial<TestUser> = {}): TestUser {
  return createTestUser({ ...overrides, userType: 'host' });
}

/**
 * Creates a test admin user
 */
export function createTestAdmin(overrides: Partial<TestUser> = {}): TestUser {
  return createTestUser({
    ...overrides,
    userType: 'admin',
    email: overrides.email || 'admin@splitlease.com',
    isVerified: true
  });
}

/**
 * Creates a test listing with realistic NYC data
 */
export function createTestListing(
  overrides: Partial<TestListing> = {}
): TestListing {
  const borough =
    overrides.borough ||
    faker.helpers.arrayElement(NYC_BOROUGHS as unknown as string[]);
  const neighborhood =
    overrides.neighborhood ||
    faker.helpers.arrayElement(NYC_NEIGHBORHOODS[borough] || ['Downtown']);

  const bedrooms = overrides.bedrooms ?? faker.number.int({ min: 0, max: 4 });
  const basePrice = bedrooms === 0 ? 150 : 200 + bedrooms * 75;

  return {
    id: overrides.id || faker.string.alphanumeric(17),
    name:
      overrides.name ||
      `${bedrooms === 0 ? 'Studio' : `${bedrooms} Bedroom`} in ${neighborhood}`,
    description:
      overrides.description ||
      faker.lorem.paragraphs(2, '\n\n') +
        '\n\nPerfect for hybrid workers looking for a split lease arrangement.',
    address:
      overrides.address ||
      `${faker.number.int({ min: 1, max: 999 })} ${faker.location.street()}, ${borough}, NY`,
    borough,
    neighborhood,
    bedrooms,
    bathrooms: overrides.bathrooms ?? faker.number.int({ min: 1, max: 3 }),
    pricePerNight:
      overrides.pricePerNight ??
      faker.number.int({ min: basePrice, max: basePrice + 100 }),
    pricePerFourWeeks:
      overrides.pricePerFourWeeks ??
      faker.number.int({ min: basePrice * 20, max: basePrice * 25 }),
    daysAvailable: overrides.daysAvailable || [1, 2, 3, 4, 5], // Mon-Fri default
    photos:
      overrides.photos ||
      Array.from({ length: 5 }, () =>
        faker.image.urlLoremFlickr({ category: 'apartment' })
      ),
    amenities:
      overrides.amenities ||
      faker.helpers.arrayElements(AMENITIES, faker.number.int({ min: 3, max: 8 })),
    hostId: overrides.hostId || faker.string.alphanumeric(17),
    isActive: overrides.isActive ?? true,
    isComplete: overrides.isComplete ?? true
  };
}

/**
 * Creates a weeknight listing (Mon-Fri availability)
 */
export function createWeeknightListing(
  overrides: Partial<TestListing> = {}
): TestListing {
  return createTestListing({
    ...overrides,
    daysAvailable: [1, 2, 3, 4, 5], // Monday through Friday
    name: overrides.name || 'Weeknight Split Lease - Perfect for Commuters'
  });
}

/**
 * Creates a weekend listing (Fri-Mon availability)
 */
export function createWeekendListing(
  overrides: Partial<TestListing> = {}
): TestListing {
  return createTestListing({
    ...overrides,
    daysAvailable: [5, 6, 0, 1], // Friday through Monday
    name: overrides.name || 'Weekend Split Lease - Great for City Getaways'
  });
}

/**
 * Creates a test proposal
 */
export function createTestProposal(
  overrides: Partial<TestProposal> = {}
): TestProposal {
  const daysSelected = overrides.daysSelected || [1, 2, 3, 4, 5];
  const nightsPerWeek = daysSelected.length - 1;
  const reservationSpanWeeks = overrides.reservationSpanWeeks || 13;
  const pricePerNight = overrides.pricePerNight || 200;

  // Calculate 2 weeks from now for default move-in date
  const moveInDate = new Date();
  moveInDate.setDate(moveInDate.getDate() + 14);

  return {
    id: overrides.id || faker.string.alphanumeric(17),
    guestId: overrides.guestId || faker.string.alphanumeric(17),
    listingId: overrides.listingId || faker.string.alphanumeric(17),
    hostId: overrides.hostId || faker.string.alphanumeric(17),
    status: overrides.status || 'host_review',
    moveInDate: overrides.moveInDate || moveInDate.toISOString().split('T')[0],
    daysSelected,
    reservationSpanWeeks,
    pricePerNight,
    totalPrice:
      overrides.totalPrice || pricePerNight * nightsPerWeek * reservationSpanWeeks,
    needForSpace: overrides.needForSpace || 'Hybrid work arrangement',
    aboutMe: overrides.aboutMe || faker.lorem.paragraph(),
    specialNeeds: overrides.specialNeeds,
    createdAt: overrides.createdAt || new Date().toISOString()
  };
}

/**
 * Creates a proposal with specific status
 */
export function createProposalWithStatus(
  status: ProposalStatus,
  overrides: Partial<TestProposal> = {}
): TestProposal {
  return createTestProposal({ ...overrides, status });
}

/**
 * Creates a test message thread
 */
export function createTestThread(
  overrides: Partial<TestThread> = {}
): TestThread {
  const threadId = overrides.id || faker.string.alphanumeric(17);
  const guestId = overrides.guestId || faker.string.alphanumeric(17);
  const hostId = overrides.hostId || faker.string.alphanumeric(17);
  const createdAt = overrides.createdAt || new Date().toISOString();

  return {
    id: threadId,
    proposalId: overrides.proposalId || faker.string.alphanumeric(17),
    guestId,
    hostId,
    messages:
      overrides.messages ||
      createTestMessages(threadId, guestId, hostId, faker.number.int({ min: 1, max: 10 })),
    createdAt,
    lastMessageAt: overrides.lastMessageAt || createdAt
  };
}

/**
 * Creates an array of test messages
 */
export function createTestMessages(
  threadId: string,
  guestId: string,
  hostId: string,
  count: number = 5
): TestMessage[] {
  const messages: TestMessage[] = [];
  let currentDate = new Date();
  currentDate.setHours(currentDate.getHours() - count);

  for (let i = 0; i < count; i++) {
    const senderType = i % 2 === 0 ? 'guest' : 'host';
    messages.push({
      id: faker.string.alphanumeric(17),
      threadId,
      senderId: senderType === 'guest' ? guestId : hostId,
      senderType,
      content: faker.lorem.sentences({ min: 1, max: 3 }),
      createdAt: currentDate.toISOString(),
      isRead: i < count - 1 // Last message is unread
    });
    currentDate.setMinutes(currentDate.getMinutes() + faker.number.int({ min: 5, max: 120 }));
  }

  return messages;
}

// ============================================================================
// SCENARIO FACTORIES
// ============================================================================

/**
 * Creates a complete booking scenario with user, listing, and proposal
 */
export function createBookingScenario() {
  const host = createTestHost();
  const guest = createTestGuest();
  const listing = createTestListing({ hostId: host.id });
  const proposal = createTestProposal({
    guestId: guest.id,
    listingId: listing.id,
    hostId: host.id
  });

  return { host, guest, listing, proposal };
}

/**
 * Creates a messaging scenario with thread and messages
 */
export function createMessagingScenario() {
  const { host, guest, listing, proposal } = createBookingScenario();
  const thread = createTestThread({
    proposalId: proposal.id,
    guestId: guest.id,
    hostId: host.id
  });

  return { host, guest, listing, proposal, thread };
}

/**
 * Creates multiple listings for search testing
 */
export function createSearchScenario(listingCount: number = 10) {
  const host = createTestHost();
  const listings = Array.from({ length: listingCount }, () =>
    createTestListing({ hostId: host.id })
  );

  // Ensure variety in boroughs
  const boroughs = [...NYC_BOROUGHS];
  listings.forEach((listing, index) => {
    if (index < boroughs.length) {
      listing.borough = boroughs[index];
      listing.neighborhood = faker.helpers.arrayElement(
        NYC_NEIGHBORHOODS[listing.borough] || ['Downtown']
      );
    }
  });

  return { host, listings };
}

/**
 * Creates an admin scenario with threads and users
 */
export function createAdminScenario() {
  const admin = createTestAdmin();
  const scenarios = Array.from({ length: 5 }, () => createMessagingScenario());

  return {
    admin,
    scenarios
  };
}

// ============================================================================
// SEED DATA
// ============================================================================

/**
 * Pre-defined test users for consistent testing
 */
export const SEED_USERS = {
  guest: createTestGuest({
    id: 'test-guest-001',
    email: 'testguest@example.com',
    firstName: 'Test',
    lastName: 'Guest',
    isVerified: true
  }),
  host: createTestHost({
    id: 'test-host-001',
    email: 'testhost@example.com',
    firstName: 'Test',
    lastName: 'Host',
    isVerified: true
  }),
  admin: createTestAdmin({
    id: 'test-admin-001',
    email: 'testadmin@splitlease.com',
    firstName: 'Test',
    lastName: 'Admin'
  }),
  unverifiedGuest: createTestGuest({
    id: 'test-guest-unverified',
    email: 'unverified@example.com',
    firstName: 'Unverified',
    lastName: 'User',
    isVerified: false
  })
};

/**
 * Pre-defined test listings for consistent testing
 */
export const SEED_LISTINGS = {
  manhattan: createTestListing({
    id: 'test-listing-manhattan',
    borough: 'Manhattan',
    neighborhood: 'Midtown',
    bedrooms: 1,
    name: 'Cozy 1BR in Midtown Manhattan',
    hostId: SEED_USERS.host.id
  }),
  brooklyn: createTestListing({
    id: 'test-listing-brooklyn',
    borough: 'Brooklyn',
    neighborhood: 'Williamsburg',
    bedrooms: 2,
    name: 'Spacious 2BR in Williamsburg',
    hostId: SEED_USERS.host.id
  }),
  studio: createTestListing({
    id: 'test-listing-studio',
    borough: 'Queens',
    neighborhood: 'Long Island City',
    bedrooms: 0,
    name: 'Modern Studio in LIC',
    hostId: SEED_USERS.host.id
  }),
  weekendOnly: createWeekendListing({
    id: 'test-listing-weekend',
    hostId: SEED_USERS.host.id
  }),
  weeknightOnly: createWeeknightListing({
    id: 'test-listing-weeknight',
    hostId: SEED_USERS.host.id
  })
};

export default {
  createTestUser,
  createTestGuest,
  createTestHost,
  createTestAdmin,
  createTestListing,
  createWeeknightListing,
  createWeekendListing,
  createTestProposal,
  createProposalWithStatus,
  createTestThread,
  createTestMessages,
  createBookingScenario,
  createMessagingScenario,
  createSearchScenario,
  createAdminScenario,
  SEED_USERS,
  SEED_LISTINGS,
  NYC_BOROUGHS,
  NYC_NEIGHBORHOODS,
  AMENITIES
};
