-- ============================================================================
-- UPDATE TEST DATA FOR HOST-LEASES PAGE
-- Target: splitlease-backend-dev (qcfifybkaddcoimjroca)
-- Created: 2026-02-03
--
-- Run this script in Supabase SQL Editor to complete the test data setup.
-- Assumes a lease already exists for host: rodtesthost@test.com
-- ============================================================================

-- Get the lease ID for rodtesthost
DO $$
DECLARE
  v_host_id TEXT;
  v_lease_id TEXT;
  v_guest_id TEXT;
BEGIN
  -- Find the host
  SELECT _id INTO v_host_id FROM "user" WHERE email = 'rodtesthost@test.com' LIMIT 1;
  IF v_host_id IS NULL THEN
    RAISE EXCEPTION 'Host user not found: rodtesthost@test.com';
  END IF;
  RAISE NOTICE 'Host ID: %', v_host_id;

  -- Find the lease
  SELECT _id, "Guest" INTO v_lease_id, v_guest_id
  FROM bookings_leases
  WHERE "Host" = v_host_id
  LIMIT 1;

  IF v_lease_id IS NULL THEN
    RAISE EXCEPTION 'No lease found for host';
  END IF;
  RAISE NOTICE 'Lease ID: %', v_lease_id;
  RAISE NOTICE 'Guest ID: %', v_guest_id;
END $$;

-- ============================================================================
-- Step 1: Update Lease Status
-- ============================================================================
UPDATE bookings_leases
SET
  "Lease Status" = 'Active',
  "Lease signed?" = true,
  "were documents generated?" = true,
  "current week number" = 3,
  "total week count" = 12,
  "Reservation Period : Start" = CURRENT_DATE - INTERVAL '14 days',
  "Reservation Period : End" = CURRENT_DATE + INTERVAL '90 days',
  "Modified Date" = NOW()
WHERE "Host" = (SELECT _id FROM "user" WHERE email = 'rodtesthost@test.com' LIMIT 1);

-- ============================================================================
-- Step 2: Update Stay Statuses
-- ============================================================================

-- Get the lease ID
WITH lease AS (
  SELECT bl._id AS lease_id
  FROM bookings_leases bl
  JOIN "user" u ON bl."Host" = u._id
  WHERE u.email = 'rodtesthost@test.com'
  LIMIT 1
)
-- Update Week 1: Completed (14-12 days ago)
UPDATE bookings_stays
SET
  "Stay Status" = 'Completed',
  "Check In (night)" = (CURRENT_DATE - INTERVAL '14 days')::DATE,
  "Last Night (night)" = (CURRENT_DATE - INTERVAL '12 days')::DATE,
  "Review Submitted by Host" = false,
  "Modified Date" = NOW()
WHERE "Lease" = (SELECT lease_id FROM lease)
  AND "Week Number" = 1;

WITH lease AS (
  SELECT bl._id AS lease_id
  FROM bookings_leases bl
  JOIN "user" u ON bl."Host" = u._id
  WHERE u.email = 'rodtesthost@test.com'
  LIMIT 1
)
-- Update Week 2: Completed (7-5 days ago)
UPDATE bookings_stays
SET
  "Stay Status" = 'Completed',
  "Check In (night)" = (CURRENT_DATE - INTERVAL '7 days')::DATE,
  "Last Night (night)" = (CURRENT_DATE - INTERVAL '5 days')::DATE,
  "Review Submitted by Host" = true,
  "Modified Date" = NOW()
WHERE "Lease" = (SELECT lease_id FROM lease)
  AND "Week Number" = 2;

WITH lease AS (
  SELECT bl._id AS lease_id
  FROM bookings_leases bl
  JOIN "user" u ON bl."Host" = u._id
  WHERE u.email = 'rodtesthost@test.com'
  LIMIT 1
)
-- Update Week 3: In Progress (current week)
UPDATE bookings_stays
SET
  "Stay Status" = 'In Progress',
  "Check In (night)" = CURRENT_DATE,
  "Last Night (night)" = (CURRENT_DATE + INTERVAL '2 days')::DATE,
  "Review Submitted by Host" = false,
  "Modified Date" = NOW()
WHERE "Lease" = (SELECT lease_id FROM lease)
  AND "Week Number" = 3;

WITH lease AS (
  SELECT bl._id AS lease_id
  FROM bookings_leases bl
  JOIN "user" u ON bl."Host" = u._id
  WHERE u.email = 'rodtesthost@test.com'
  LIMIT 1
)
-- Update Week 4+: Upcoming
UPDATE bookings_stays
SET
  "Stay Status" = 'Upcoming',
  "Check In (night)" = (CURRENT_DATE + INTERVAL '7 days' + (("Week Number" - 4) * INTERVAL '7 days'))::DATE,
  "Last Night (night)" = (CURRENT_DATE + INTERVAL '9 days' + (("Week Number" - 4) * INTERVAL '7 days'))::DATE,
  "Review Submitted by Host" = false,
  "Modified Date" = NOW()
WHERE "Lease" = (SELECT lease_id FROM lease)
  AND "Week Number" >= 4;

-- ============================================================================
-- Step 3: Create Payment Records
-- ============================================================================

-- Delete existing payments for this lease first (if any)
DELETE FROM paymentrecords
WHERE "Booking - Reservation" = (
  SELECT bl._id
  FROM bookings_leases bl
  JOIN "user" u ON bl."Host" = u._id
  WHERE u.email = 'rodtesthost@test.com'
  LIMIT 1
);

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
  'test-payment-1-' || gen_random_uuid()::TEXT,
  bl._id,
  1,
  (CURRENT_DATE - INTERVAL '14 days')::DATE,
  (CURRENT_DATE - INTERVAL '14 days')::DATE,
  1800,
  50,
  500,
  2350,
  true,
  false,
  NOW(),
  NOW()
FROM bookings_leases bl
JOIN "user" u ON bl."Host" = u._id
WHERE u.email = 'rodtesthost@test.com'
LIMIT 1;

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
  'test-payment-2-' || gen_random_uuid()::TEXT,
  bl._id,
  2,
  CURRENT_DATE,
  CURRENT_DATE,
  1800,
  50,
  0,
  1850,
  true,
  false,
  NOW(),
  NOW()
FROM bookings_leases bl
JOIN "user" u ON bl."Host" = u._id
WHERE u.email = 'rodtesthost@test.com'
LIMIT 1;

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
  'test-payment-3-' || gen_random_uuid()::TEXT,
  bl._id,
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
FROM bookings_leases bl
JOIN "user" u ON bl."Host" = u._id
WHERE u.email = 'rodtesthost@test.com'
LIMIT 1;

-- ============================================================================
-- Step 4: Create Date Change Request (Pending for Week 4)
-- ============================================================================

-- Delete existing DCRs for this lease first
DELETE FROM datechangerequest
WHERE "Lease" = (
  SELECT bl._id
  FROM bookings_leases bl
  JOIN "user" u ON bl."Host" = u._id
  WHERE u.email = 'rodtesthost@test.com'
  LIMIT 1
);

-- Create pending date change request
INSERT INTO datechangerequest (
  _id,
  "Lease",
  "Requested by",
  "Request receiver",
  "Stay Associated 1",
  "status",
  "request status",
  "type of request",
  "Original Date",
  "Requested Date",
  "Price Adjustment",
  "Created Date",
  "Modified Date"
)
SELECT
  'test-dcr-' || gen_random_uuid()::TEXT,
  bl._id,
  bl."Guest",
  bl."Host",
  (SELECT _id FROM bookings_stays WHERE "Lease" = bl._id AND "Week Number" = 4 LIMIT 1),
  'pending',
  'waiting_for_answer',
  'swapping',
  (CURRENT_DATE + INTERVAL '7 days')::DATE,
  (CURRENT_DATE + INTERVAL '8 days')::DATE,
  0,
  NOW(),
  NOW()
FROM bookings_leases bl
JOIN "user" u ON bl."Host" = u._id
WHERE u.email = 'rodtesthost@test.com'
LIMIT 1;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show lease
SELECT
  bl._id AS "Lease ID",
  bl."Agreement Number",
  bl."Lease Status",
  bl."current week number" AS "Current Week",
  bl."total week count" AS "Total Weeks",
  bl."Reservation Period : Start" AS "Start Date",
  bl."Reservation Period : End" AS "End Date"
FROM bookings_leases bl
JOIN "user" u ON bl."Host" = u._id
WHERE u.email = 'rodtesthost@test.com'
LIMIT 1;

-- Show stays
SELECT
  bs."Week Number",
  bs."Stay Status",
  bs."Check In (night)",
  bs."Last Night (night)",
  bs."Review Submitted by Host"
FROM bookings_stays bs
JOIN bookings_leases bl ON bs."Lease" = bl._id
JOIN "user" u ON bl."Host" = u._id
WHERE u.email = 'rodtesthost@test.com'
ORDER BY bs."Week Number"
LIMIT 6;

-- Show payments
SELECT
  pr."Payment #",
  pr."Total Amount",
  pr."Is Paid",
  pr."Scheduled Date",
  pr."Actual Date"
FROM paymentrecords pr
JOIN bookings_leases bl ON pr."Booking - Reservation" = bl._id
JOIN "user" u ON bl."Host" = u._id
WHERE u.email = 'rodtesthost@test.com'
ORDER BY pr."Payment #";

-- Show date change requests
SELECT
  dcr.status,
  dcr."request status",
  dcr."type of request",
  dcr."Original Date",
  dcr."Requested Date"
FROM datechangerequest dcr
JOIN bookings_leases bl ON dcr."Lease" = bl._id
JOIN "user" u ON bl."Host" = u._id
WHERE u.email = 'rodtesthost@test.com';

-- ============================================================================
-- END
-- ============================================================================
