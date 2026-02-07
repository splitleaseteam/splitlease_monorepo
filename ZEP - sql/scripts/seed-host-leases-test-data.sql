-- ============================================================================
-- TEST DATA FOR HOST-LEASES PAGE
-- Target: splitlease-backend-dev (qcfifybkaddcoimjroca)
-- Created: 2026-02-03
--
-- This script creates mock lease data for testing the host-leases page.
-- User: rodtesthost@test.com
-- ============================================================================

-- Calculate dates (relative to today)
-- Start date: 14 days ago
-- End date: 90 days from today
-- Current week: 3

-- ============================================================================
-- STEP 1: FIND OR CREATE HOST USER (rodtesthost@test.com)
-- ============================================================================

-- First, check if the user exists and insert if not
INSERT INTO "user" (
  _id,
  email,
  "Name - Full",
  "Name - First",
  "Name - Last",
  "user type",
  "user verified?",
  "Created Date",
  "Modified Date"
)
SELECT
  'test-host-rodtesthost-001',
  'rodtesthost@test.com',
  'Rod TestHost',
  'Rod',
  'TestHost',
  'Host',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "user" WHERE email = 'rodtesthost@test.com'
);

-- Get or set host user ID
DO $$
DECLARE
  v_host_id TEXT;
BEGIN
  SELECT _id INTO v_host_id FROM "user" WHERE email = 'rodtesthost@test.com' LIMIT 1;
  IF v_host_id IS NULL THEN
    v_host_id := 'test-host-rodtesthost-001';
  END IF;
  RAISE NOTICE 'Host user ID: %', v_host_id;
END $$;

-- ============================================================================
-- STEP 2: FIND OR CREATE GUEST USER (testguest@test.com)
-- ============================================================================

INSERT INTO "user" (
  _id,
  email,
  "Name - Full",
  "Name - First",
  "Name - Last",
  "user type",
  "Phone Number",
  "user verified?",
  "Created Date",
  "Modified Date"
)
SELECT
  'test-guest-testguest-001',
  'testguest@test.com',
  'Test Guest',
  'Test',
  'Guest',
  'Guest',
  '555-123-4567',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "user" WHERE email = 'testguest@test.com'
);

-- ============================================================================
-- STEP 3: FIND OR CREATE HOST ACCOUNT
-- ============================================================================

INSERT INTO host_account (
  _id,
  "user",
  email,
  "Created Date",
  "Modified Date"
)
SELECT
  'test-host-account-001',
  (SELECT _id FROM "user" WHERE email = 'rodtesthost@test.com' LIMIT 1),
  'rodtesthost@test.com',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM host_account WHERE email = 'rodtesthost@test.com'
);

-- ============================================================================
-- STEP 4: CREATE LISTING FOR HOST
-- ============================================================================

INSERT INTO listing (
  _id,
  "Name",
  "Host User",
  "host",
  "Borough",
  "Neighborhood",
  "Features - Qty Bedrooms",
  "Features - Qty Bathrooms",
  "rental type",
  "Starting nightly price",
  "Active?",
  "Approved?",
  "Complete",
  "Created Date",
  "Modified Date"
)
SELECT
  'test-listing-hostleases-001',
  'Test Apartment for Host Leases Page',
  (SELECT _id FROM "user" WHERE email = 'rodtesthost@test.com' LIMIT 1),
  (SELECT _id FROM host_account WHERE email = 'rodtesthost@test.com' LIMIT 1),
  'Manhattan',
  'Midtown',
  2,
  1,
  'Split Lease',
  150,
  true,
  true,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM listing WHERE _id = 'test-listing-hostleases-001'
);

-- ============================================================================
-- STEP 5: CREATE PROPOSAL
-- ============================================================================

INSERT INTO proposal (
  _id,
  "Guest",
  "Host User",
  "Listing",
  "Status",
  "rental type",
  "Move in range start",
  "Move in range end",
  "Reservation Span (Weeks)",
  "duration in months",
  "nights per week (num)",
  "proposal nightly price",
  "Days Selected",
  "4 week rent",
  "4 week compensation",
  "damage deposit",
  "cleaning fee",
  "maintenance fee",
  "counter offer happened",
  "Created Date",
  "Modified Date"
)
SELECT
  'test-proposal-hostleases-001',
  (SELECT _id FROM "user" WHERE email = 'testguest@test.com' LIMIT 1),
  (SELECT _id FROM "user" WHERE email = 'rodtesthost@test.com' LIMIT 1),
  'test-listing-hostleases-001',
  'Proposal or Counteroffer Accepted / Drafting Lease Documents',
  'Split Lease',
  (CURRENT_DATE - INTERVAL '14 days')::DATE,
  (CURRENT_DATE + INTERVAL '90 days')::DATE,
  12,
  3,
  3,
  150,
  ARRAY[1, 2, 3],  -- Mon, Tue, Wed (0-indexed)
  1800,  -- 3 nights * $150 * 4 weeks
  1350,  -- Host compensation
  500,
  100,
  50,
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM proposal WHERE _id = 'test-proposal-hostleases-001'
);

-- ============================================================================
-- STEP 6: CREATE ACTIVE LEASE
-- ============================================================================

INSERT INTO bookings_leases (
  _id,
  "Agreement Number",
  "Proposal",
  "Guest",
  "Host",
  "Listing",
  "Participants",
  "Reservation Period : Start",
  "Reservation Period : End",
  "Total Compensation",
  "Total Rent",
  "Lease Status",
  "Lease signed?",
  "were documents generated?",
  "total week count",
  "current week number",
  "First Payment Date",
  "Created Date",
  "Modified Date"
)
SELECT
  'test-lease-hostleases-001',
  'TEST-HOSTLEASES-20260203-0001',
  'test-proposal-hostleases-001',
  (SELECT _id FROM "user" WHERE email = 'testguest@test.com' LIMIT 1),
  (SELECT _id FROM "user" WHERE email = 'rodtesthost@test.com' LIMIT 1),
  'test-listing-hostleases-001',
  ARRAY[
    (SELECT _id FROM "user" WHERE email = 'testguest@test.com' LIMIT 1),
    (SELECT _id FROM "user" WHERE email = 'rodtesthost@test.com' LIMIT 1)
  ],
  (CURRENT_DATE - INTERVAL '14 days')::DATE,
  (CURRENT_DATE + INTERVAL '90 days')::DATE,
  16200,  -- Total compensation (12 weeks * 3 nights * $150 * 0.75)
  21600,  -- Total rent (12 weeks * 3 nights * $150)
  'Active',
  true,
  true,
  12,
  3,
  (CURRENT_DATE - INTERVAL '14 days')::DATE,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM bookings_leases WHERE _id = 'test-lease-hostleases-001'
);

-- ============================================================================
-- STEP 7: CREATE 4 STAYS (Week 1-4)
-- ============================================================================

-- Week 1 (Completed) - 14-7 days ago
INSERT INTO bookings_stays (
  _id,
  "Lease",
  "Week Number",
  "Guest",
  "Host",
  "listing",
  "Check In (night)",
  "Last Night (night)",
  "Stay Status",
  "Review Submitted by Host",
  "Created Date",
  "Modified Date"
)
SELECT
  'test-stay-week1-001',
  'test-lease-hostleases-001',
  1,
  (SELECT _id FROM "user" WHERE email = 'testguest@test.com' LIMIT 1),
  (SELECT _id FROM "user" WHERE email = 'rodtesthost@test.com' LIMIT 1),
  'test-listing-hostleases-001',
  (CURRENT_DATE - INTERVAL '14 days')::DATE,
  (CURRENT_DATE - INTERVAL '12 days')::DATE,
  'Completed',
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM bookings_stays WHERE _id = 'test-stay-week1-001'
);

-- Week 2 (Completed) - 7-0 days ago
INSERT INTO bookings_stays (
  _id,
  "Lease",
  "Week Number",
  "Guest",
  "Host",
  "listing",
  "Check In (night)",
  "Last Night (night)",
  "Stay Status",
  "Review Submitted by Host",
  "Created Date",
  "Modified Date"
)
SELECT
  'test-stay-week2-001',
  'test-lease-hostleases-001',
  2,
  (SELECT _id FROM "user" WHERE email = 'testguest@test.com' LIMIT 1),
  (SELECT _id FROM "user" WHERE email = 'rodtesthost@test.com' LIMIT 1),
  'test-listing-hostleases-001',
  (CURRENT_DATE - INTERVAL '7 days')::DATE,
  (CURRENT_DATE - INTERVAL '5 days')::DATE,
  'Completed',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM bookings_stays WHERE _id = 'test-stay-week2-001'
);

-- Week 3 (In Progress) - Current week
INSERT INTO bookings_stays (
  _id,
  "Lease",
  "Week Number",
  "Guest",
  "Host",
  "listing",
  "Check In (night)",
  "Last Night (night)",
  "Stay Status",
  "Review Submitted by Host",
  "Created Date",
  "Modified Date"
)
SELECT
  'test-stay-week3-001',
  'test-lease-hostleases-001',
  3,
  (SELECT _id FROM "user" WHERE email = 'testguest@test.com' LIMIT 1),
  (SELECT _id FROM "user" WHERE email = 'rodtesthost@test.com' LIMIT 1),
  'test-listing-hostleases-001',
  CURRENT_DATE,
  (CURRENT_DATE + INTERVAL '2 days')::DATE,
  'In Progress',
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM bookings_stays WHERE _id = 'test-stay-week3-001'
);

-- Week 4 (Upcoming) - Next week
INSERT INTO bookings_stays (
  _id,
  "Lease",
  "Week Number",
  "Guest",
  "Host",
  "listing",
  "Check In (night)",
  "Last Night (night)",
  "Stay Status",
  "Review Submitted by Host",
  "Created Date",
  "Modified Date"
)
SELECT
  'test-stay-week4-001',
  'test-lease-hostleases-001',
  4,
  (SELECT _id FROM "user" WHERE email = 'testguest@test.com' LIMIT 1),
  (SELECT _id FROM "user" WHERE email = 'rodtesthost@test.com' LIMIT 1),
  'test-listing-hostleases-001',
  (CURRENT_DATE + INTERVAL '7 days')::DATE,
  (CURRENT_DATE + INTERVAL '9 days')::DATE,
  'Upcoming',
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM bookings_stays WHERE _id = 'test-stay-week4-001'
);

-- ============================================================================
-- STEP 8: CREATE 3 PAYMENT RECORDS
-- ============================================================================

-- Payment 1: $2350 (First payment with deposit) - PAID
INSERT INTO paymentrecords (
  _id,
  "Booking - Reservation",
  "Payment #",
  "Scheduled Date",
  "Actual Date",
  "Rent Amount",
  "Maintenance Fee",
  "Damage Deposit",
  "Total Amount",
  "Is Paid",
  "Is Refunded",
  "Created Date",
  "Modified Date"
)
SELECT
  'test-payment-1-001',
  'test-lease-hostleases-001',
  1,
  (CURRENT_DATE - INTERVAL '14 days')::DATE,
  (CURRENT_DATE - INTERVAL '14 days')::DATE,
  1800,  -- 4-week rent
  50,    -- Maintenance fee
  500,   -- Damage deposit (first payment only)
  2350,  -- Total
  true,
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM paymentrecords WHERE _id = 'test-payment-1-001'
);

-- Payment 2: $1850 - PAID
INSERT INTO paymentrecords (
  _id,
  "Booking - Reservation",
  "Payment #",
  "Scheduled Date",
  "Actual Date",
  "Rent Amount",
  "Maintenance Fee",
  "Damage Deposit",
  "Total Amount",
  "Is Paid",
  "Is Refunded",
  "Created Date",
  "Modified Date"
)
SELECT
  'test-payment-2-001',
  'test-lease-hostleases-001',
  2,
  CURRENT_DATE::DATE,
  CURRENT_DATE::DATE,
  1800,
  50,
  0,
  1850,
  true,
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM paymentrecords WHERE _id = 'test-payment-2-001'
);

-- Payment 3: $1850 - PENDING
INSERT INTO paymentrecords (
  _id,
  "Booking - Reservation",
  "Payment #",
  "Scheduled Date",
  "Actual Date",
  "Rent Amount",
  "Maintenance Fee",
  "Damage Deposit",
  "Total Amount",
  "Is Paid",
  "Is Refunded",
  "Created Date",
  "Modified Date"
)
SELECT
  'test-payment-3-001',
  'test-lease-hostleases-001',
  3,
  (CURRENT_DATE + INTERVAL '28 days')::DATE,
  NULL,
  1800,
  50,
  0,
  1850,
  false,
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM paymentrecords WHERE _id = 'test-payment-3-001'
);

-- ============================================================================
-- STEP 9: CREATE DATE CHANGE REQUEST (Pending for Week 4)
-- ============================================================================

INSERT INTO datechangerequest (
  _id,
  "Lease",
  "Requested by",
  "Request receiver",
  "Stay Associated 1",
  "status",
  "Request Type",
  "Original Date",
  "Requested Date",
  "Price Adjustment",
  "Created Date",
  "Modified Date"
)
SELECT
  'test-dcr-week4-001',
  'test-lease-hostleases-001',
  (SELECT _id FROM "user" WHERE email = 'testguest@test.com' LIMIT 1),
  (SELECT _id FROM "user" WHERE email = 'rodtesthost@test.com' LIMIT 1),
  'test-stay-week4-001',
  'pending',
  'reschedule',
  (CURRENT_DATE + INTERVAL '7 days')::DATE,
  (CURRENT_DATE + INTERVAL '8 days')::DATE,
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM datechangerequest WHERE _id = 'test-dcr-week4-001'
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify host user
SELECT '_id', email, "Name - Full" FROM "user" WHERE email = 'rodtesthost@test.com';

-- Verify guest user
SELECT '_id', email, "Name - Full", "Phone Number" FROM "user" WHERE email = 'testguest@test.com';

-- Verify listing
SELECT '_id', "Name", "Borough", "rental type" FROM listing WHERE _id = 'test-listing-hostleases-001';

-- Verify proposal
SELECT '_id', "Status", "Reservation Span (Weeks)" FROM proposal WHERE _id = 'test-proposal-hostleases-001';

-- Verify lease
SELECT '_id', "Agreement Number", "Lease Status", "total week count", "current week number"
FROM bookings_leases WHERE _id = 'test-lease-hostleases-001';

-- Verify stays
SELECT '_id', "Week Number", "Stay Status", "Check In (night)", "Last Night (night)"
FROM bookings_stays WHERE "Lease" = 'test-lease-hostleases-001' ORDER BY "Week Number";

-- Verify payments
SELECT '_id', "Payment #", "Total Amount", "Is Paid"
FROM paymentrecords WHERE "Booking - Reservation" = 'test-lease-hostleases-001' ORDER BY "Payment #";

-- Verify date change request
SELECT '_id', "status", "Request Type", "Original Date", "Requested Date"
FROM datechangerequest WHERE _id = 'test-dcr-week4-001';

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
