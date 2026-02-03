-- ============================================================================
-- Mock Lease Data Script for Host Leases Page Testing
-- Generated: 2026-02-03
-- Target User: rodtesthost@test.com
-- Target Database: splitlease-backend-dev
-- ============================================================================

-- This script creates:
-- 1. Finds/uses user rodtesthost@test.com as the host
-- 2. Finds/creates a listing for the host
-- 3. Creates a guest user (or uses existing test guest)
-- 4. Creates a lease with:
--    - Start date: 2 weeks ago
--    - End date: 3 months from now
--    - Status: active
-- 5. Creates stays (past, current, upcoming)
-- 6. Creates payment records
-- 7. Creates a date change request

-- ============================================================================
-- STEP 1: Find Host User ID
-- ============================================================================
-- First, let's query to find the user ID

DO $$
DECLARE
    v_host_user_id TEXT;
    v_guest_user_id TEXT;
    v_listing_id TEXT;
    v_lease_id TEXT;
    v_proposal_id TEXT;
    v_stay_1_id TEXT;
    v_stay_2_id TEXT;
    v_stay_3_id TEXT;
    v_stay_4_id TEXT;
    v_payment_1_id TEXT;
    v_payment_2_id TEXT;
    v_payment_3_id TEXT;
    v_dcr_id TEXT;
    v_start_date DATE := CURRENT_DATE - INTERVAL '14 days';
    v_end_date DATE := CURRENT_DATE + INTERVAL '3 months';
    v_now TIMESTAMP := NOW();
BEGIN
    -- Find host user
    SELECT _id INTO v_host_user_id
    FROM "user"
    WHERE email = 'rodtesthost@test.com'
    LIMIT 1;

    IF v_host_user_id IS NULL THEN
        RAISE NOTICE 'Host user rodtesthost@test.com not found!';
        -- Create the host user if not exists
        v_host_user_id := 'test_host_' || to_char(v_now, 'YYYYMMDDHH24MISS');

        INSERT INTO "user" (
            _id,
            email,
            "Name - First",
            "Name - Last",
            "Name - Full",
            "User Type",
            "Created Date",
            "Modified Date"
        ) VALUES (
            v_host_user_id,
            'rodtesthost@test.com',
            'Rod',
            'TestHost',
            'Rod TestHost',
            'Host',
            v_now,
            v_now
        );

        RAISE NOTICE 'Created host user: %', v_host_user_id;
    ELSE
        RAISE NOTICE 'Found host user: %', v_host_user_id;
    END IF;

    -- Find or create a guest user for testing
    SELECT _id INTO v_guest_user_id
    FROM "user"
    WHERE email = 'testguest@test.com'
    LIMIT 1;

    IF v_guest_user_id IS NULL THEN
        v_guest_user_id := 'test_guest_' || to_char(v_now, 'YYYYMMDDHH24MISS');

        INSERT INTO "user" (
            _id,
            email,
            "Name - First",
            "Name - Last",
            "Name - Full",
            "User Type",
            "Phone Number",
            "user verified?",
            "Created Date",
            "Modified Date"
        ) VALUES (
            v_guest_user_id,
            'testguest@test.com',
            'Test',
            'Guest',
            'Test Guest',
            'Guest',
            '555-123-4567',
            true,
            v_now,
            v_now
        );

        RAISE NOTICE 'Created guest user: %', v_guest_user_id;
    ELSE
        RAISE NOTICE 'Found guest user: %', v_guest_user_id;
    END IF;

    -- Find a listing for the host
    SELECT _id INTO v_listing_id
    FROM listing
    WHERE ("Host User" = v_host_user_id OR "Created By" = v_host_user_id)
    AND "Deleted" = false
    LIMIT 1;

    IF v_listing_id IS NULL THEN
        -- Create a listing for the host
        v_listing_id := 'test_listing_' || to_char(v_now, 'YYYYMMDDHH24MISS');

        INSERT INTO listing (
            _id,
            "Name",
            "Host User",
            "Created By",
            "Complete",
            "Deleted",
            "Location - Borough",
            "Location - City",
            "Location - State",
            "Features - Qty Bedrooms",
            "Features - Qty Bathrooms",
            "rental type",
            "Standarized Minimum Nightly Price (Filter)",
            "Created Date",
            "Modified Date"
        ) VALUES (
            v_listing_id,
            'Test Apartment for Host Leases Page',
            v_host_user_id,
            v_host_user_id,
            true,
            false,
            'Manhattan',
            'New York',
            'NY',
            2,
            1,
            'Split Lease',
            150.00,
            v_now,
            v_now
        );

        RAISE NOTICE 'Created listing: %', v_listing_id;
    ELSE
        RAISE NOTICE 'Found listing: %', v_listing_id;
    END IF;

    -- Create a proposal (needed for the lease)
    v_proposal_id := 'test_proposal_' || to_char(v_now, 'YYYYMMDDHH24MISS');

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
        "damage deposit",
        "cleaning fee",
        "maintenance fee",
        "Days Selected",
        "4 week rent",
        "4 week compensation",
        "Created Date",
        "Modified Date"
    ) VALUES (
        v_proposal_id,
        v_guest_user_id,
        v_host_user_id,
        v_listing_id,
        'Proposal or Counteroffer Accepted / Drafting Lease Documents',
        'Split Lease',
        v_start_date,
        v_start_date + INTERVAL '7 days',
        12,
        3,
        3,
        150.00,
        500.00,
        100.00,
        50.00,
        ARRAY[1, 2, 3]::INTEGER[],  -- Mon, Tue, Wed (JS 0-based convention)
        1800.00,
        1620.00,
        v_now,
        v_now
    );

    RAISE NOTICE 'Created proposal: %', v_proposal_id;

    -- Create the lease
    v_lease_id := 'test_lease_' || to_char(v_now, 'YYYYMMDDHH24MISS');

    INSERT INTO bookings_leases (
        _id,
        "Agreement Number",
        "Proposal",
        "Guest",
        "Host",
        "Listing",
        "Participants",
        "First Payment Date",
        "Reservation Period : Start",
        "Reservation Period : End",
        "Total Compensation",
        "Total Rent",
        "Lease Status",
        "Lease signed?",
        "were documents generated?",
        "total week count",
        "current week number",
        "Paid to Date from Guest",
        "Created Date",
        "Modified Date"
    ) VALUES (
        v_lease_id,
        'TEST-' || to_char(v_now, 'YYYYMMDD') || '-0001',
        v_proposal_id,
        v_guest_user_id,
        v_host_user_id,
        v_listing_id,
        ARRAY[v_guest_user_id, v_host_user_id],
        v_start_date,
        v_start_date,
        v_end_date,
        4860.00,  -- 3 months of compensation
        5400.00,  -- 3 months of rent
        'Active',
        true,
        true,
        12,
        3,  -- Currently in week 3
        1800.00,  -- Paid 1 month so far
        v_now,
        v_now
    );

    RAISE NOTICE 'Created lease: %', v_lease_id;

    -- Create stays
    -- Stay 1: Past (completed) - Week 1
    v_stay_1_id := 'test_stay_1_' || to_char(v_now, 'YYYYMMDDHH24MISS');

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
        "Dates - List of dates in this period",
        "Created Date",
        "Modified Date"
    ) VALUES (
        v_stay_1_id,
        v_lease_id,
        1,
        v_guest_user_id,
        v_host_user_id,
        v_listing_id,
        v_start_date,
        v_start_date + INTERVAL '2 days',
        'Completed',
        ARRAY[
            to_char(v_start_date, 'YYYY-MM-DD'),
            to_char(v_start_date + INTERVAL '1 day', 'YYYY-MM-DD'),
            to_char(v_start_date + INTERVAL '2 days', 'YYYY-MM-DD')
        ],
        v_now,
        v_now
    );

    -- Stay 2: Past (completed) - Week 2
    v_stay_2_id := 'test_stay_2_' || to_char(v_now, 'YYYYMMDDHH24MISS');

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
        "Dates - List of dates in this period",
        "Created Date",
        "Modified Date"
    ) VALUES (
        v_stay_2_id,
        v_lease_id,
        2,
        v_guest_user_id,
        v_host_user_id,
        v_listing_id,
        v_start_date + INTERVAL '7 days',
        v_start_date + INTERVAL '9 days',
        'Completed',
        ARRAY[
            to_char(v_start_date + INTERVAL '7 days', 'YYYY-MM-DD'),
            to_char(v_start_date + INTERVAL '8 days', 'YYYY-MM-DD'),
            to_char(v_start_date + INTERVAL '9 days', 'YYYY-MM-DD')
        ],
        v_now,
        v_now
    );

    -- Stay 3: Current - Week 3 (with review already submitted)
    v_stay_3_id := 'test_stay_3_' || to_char(v_now, 'YYYYMMDDHH24MISS');

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
        "Dates - List of dates in this period",
        "Review Submitted by Host",
        "Created Date",
        "Modified Date"
    ) VALUES (
        v_stay_3_id,
        v_lease_id,
        3,
        v_guest_user_id,
        v_host_user_id,
        v_listing_id,
        CURRENT_DATE - INTERVAL '1 day',
        CURRENT_DATE + INTERVAL '1 day',
        'In Progress',
        ARRAY[
            to_char(CURRENT_DATE - INTERVAL '1 day', 'YYYY-MM-DD'),
            to_char(CURRENT_DATE, 'YYYY-MM-DD'),
            to_char(CURRENT_DATE + INTERVAL '1 day', 'YYYY-MM-DD')
        ],
        NULL,  -- No review yet - can be tested
        v_now,
        v_now
    );

    -- Stay 4: Upcoming - Week 4
    v_stay_4_id := 'test_stay_4_' || to_char(v_now, 'YYYYMMDDHH24MISS');

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
        "Dates - List of dates in this period",
        "Created Date",
        "Modified Date"
    ) VALUES (
        v_stay_4_id,
        v_lease_id,
        4,
        v_guest_user_id,
        v_host_user_id,
        v_listing_id,
        CURRENT_DATE + INTERVAL '7 days',
        CURRENT_DATE + INTERVAL '9 days',
        'Upcoming',
        ARRAY[
            to_char(CURRENT_DATE + INTERVAL '7 days', 'YYYY-MM-DD'),
            to_char(CURRENT_DATE + INTERVAL '8 days', 'YYYY-MM-DD'),
            to_char(CURRENT_DATE + INTERVAL '9 days', 'YYYY-MM-DD')
        ],
        v_now,
        v_now
    );

    RAISE NOTICE 'Created 4 stays: %, %, %, %', v_stay_1_id, v_stay_2_id, v_stay_3_id, v_stay_4_id;

    -- Create payment records
    -- Payment 1: Paid (first month + deposit)
    v_payment_1_id := 'test_payment_1_' || to_char(v_now, 'YYYYMMDDHH24MISS');

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
        "Bank Transaction Number",
        "Created Date",
        "Modified Date"
    ) VALUES (
        v_payment_1_id,
        v_lease_id,
        1,
        v_start_date,
        v_start_date,
        1800.00,
        50.00,
        500.00,
        2350.00,
        true,
        false,
        'TXN-TEST-001',
        v_now,
        v_now
    );

    -- Payment 2: Paid (second month)
    v_payment_2_id := 'test_payment_2_' || to_char(v_now, 'YYYYMMDDHH24MISS');

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
        "Bank Transaction Number",
        "Created Date",
        "Modified Date"
    ) VALUES (
        v_payment_2_id,
        v_lease_id,
        2,
        v_start_date + INTERVAL '28 days',
        v_start_date + INTERVAL '28 days',
        1800.00,
        50.00,
        0.00,
        1850.00,
        true,
        false,
        'TXN-TEST-002',
        v_now,
        v_now
    );

    -- Payment 3: Upcoming (third month - not paid yet)
    v_payment_3_id := 'test_payment_3_' || to_char(v_now, 'YYYYMMDDHH24MISS');

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
    ) VALUES (
        v_payment_3_id,
        v_lease_id,
        3,
        v_start_date + INTERVAL '56 days',
        NULL,
        1800.00,
        50.00,
        0.00,
        1850.00,
        false,
        false,
        v_now,
        v_now
    );

    RAISE NOTICE 'Created 3 payment records: %, %, %', v_payment_1_id, v_payment_2_id, v_payment_3_id;

    -- Update lease with payment record IDs
    UPDATE bookings_leases
    SET "Payment Records Guest-SL" = ARRAY[v_payment_1_id, v_payment_2_id, v_payment_3_id],
        "List of Stays" = ARRAY[v_stay_1_id, v_stay_2_id, v_stay_3_id, v_stay_4_id]
    WHERE _id = v_lease_id;

    -- Create a date change request (pending approval)
    v_dcr_id := 'test_dcr_' || to_char(v_now, 'YYYYMMDDHH24MISS');

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
        "visible to guest",
        "Created Date",
        "Modified Date"
    ) VALUES (
        v_dcr_id,
        v_lease_id,
        v_guest_user_id,
        v_host_user_id,
        v_stay_4_id,
        'Pending',
        'reschedule',
        to_char(CURRENT_DATE + INTERVAL '7 days', 'YYYY-MM-DD'),
        to_char(CURRENT_DATE + INTERVAL '14 days', 'YYYY-MM-DD'),
        0.00,
        true,
        v_now,
        v_now
    );

    RAISE NOTICE 'Created date change request: %', v_dcr_id;

    -- Output summary
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'MOCK DATA CREATION COMPLETE';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Host User ID: %', v_host_user_id;
    RAISE NOTICE 'Guest User ID: %', v_guest_user_id;
    RAISE NOTICE 'Listing ID: %', v_listing_id;
    RAISE NOTICE 'Proposal ID: %', v_proposal_id;
    RAISE NOTICE 'Lease ID: %', v_lease_id;
    RAISE NOTICE 'Lease Agreement Number: TEST-%-%', to_char(v_now, 'YYYYMMDD'), '0001';
    RAISE NOTICE 'Stay IDs: %, %, %, %', v_stay_1_id, v_stay_2_id, v_stay_3_id, v_stay_4_id;
    RAISE NOTICE 'Payment IDs: %, %, %', v_payment_1_id, v_payment_2_id, v_payment_3_id;
    RAISE NOTICE 'Date Change Request ID: %', v_dcr_id;
    RAISE NOTICE '';
    RAISE NOTICE 'You can now test the host-leases page at:';
    RAISE NOTICE '/host-leases (login as rodtesthost@test.com)';
    RAISE NOTICE '============================================';

END $$;
