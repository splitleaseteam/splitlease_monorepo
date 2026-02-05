-- ============================================================================
-- PATTERN 5: FEE TRANSPARENCY - DATABASE TRIGGER TESTS
-- ============================================================================
-- Test Suite: Comprehensive database trigger and function tests
-- Version: 1.0
-- Date: 2026-01-28
-- ============================================================================

-- Enable test output
\set QUIET off

BEGIN;

-- ============================================================================
-- TEST 1: Auto-calculate fees on INSERT
-- ============================================================================
DO $$
DECLARE
    v_test_lease_id UUID;
    v_test_user_id UUID;
    v_test_request_id UUID;
    v_fee_breakdown JSONB;
    v_total_price DECIMAL;
BEGIN
    RAISE NOTICE E'\n========================================';
    RAISE NOTICE 'TEST 1: Auto-calculate fees on INSERT';
    RAISE NOTICE '========================================';

    -- Create test lease with $2000 monthly rent
    INSERT INTO public.leases (id, monthly_rent, landlord_id)
    VALUES (gen_random_uuid(), 2000, gen_random_uuid())
    RETURNING id INTO v_test_lease_id;

    -- Create test user
    INSERT INTO public.user (id, email, role)
    VALUES (gen_random_uuid(), 'test@example.com', 'tenant')
    RETURNING id INTO v_test_user_id;

    -- Insert date change request WITHOUT fee_breakdown
    INSERT INTO public.datechangerequest (
        id,
        lease_id,
        user_id,
        requested_date,
        status
    ) VALUES (
        gen_random_uuid(),
        v_test_lease_id,
        v_test_user_id,
        CURRENT_DATE + INTERVAL '30 days',
        'pending'
    ) RETURNING id, fee_breakdown, total_price
    INTO v_test_request_id, v_fee_breakdown, v_total_price;

    -- Verify fee_breakdown was auto-calculated
    ASSERT v_fee_breakdown IS NOT NULL, 'Fee breakdown should be auto-calculated';
    ASSERT (v_fee_breakdown->>'base_price')::DECIMAL = 2000, 'Base price should be 2000';
    ASSERT (v_fee_breakdown->>'platform_fee')::DECIMAL = 15, 'Platform fee should be 15 (0.75% of 2000)';
    ASSERT (v_fee_breakdown->>'landlord_share')::DECIMAL = 15, 'Landlord share should be 15 (0.75% of 2000)';
    ASSERT (v_fee_breakdown->>'total_fee')::DECIMAL = 30, 'Total fee should be 30 (1.5% of 2000)';
    ASSERT v_total_price = 2030, 'Total price should be 2030';

    RAISE NOTICE '✅ Test 1 PASSED: Fees auto-calculated correctly';

    -- Cleanup
    DELETE FROM public.datechangerequest WHERE id = v_test_request_id;
    DELETE FROM public.user WHERE id = v_test_user_id;
    DELETE FROM public.leases WHERE id = v_test_lease_id;
END $$;

-- ============================================================================
-- TEST 2: Fee recalculation on base_price UPDATE
-- ============================================================================
DO $$
DECLARE
    v_test_lease_id UUID;
    v_test_user_id UUID;
    v_test_request_id UUID;
    v_old_total_fee DECIMAL;
    v_new_total_fee DECIMAL;
BEGIN
    RAISE NOTICE E'\n========================================';
    RAISE NOTICE 'TEST 2: Fee recalculation on UPDATE';
    RAISE NOTICE '========================================';

    -- Create test data
    INSERT INTO public.leases (id, monthly_rent, landlord_id)
    VALUES (gen_random_uuid(), 1000, gen_random_uuid())
    RETURNING id INTO v_test_lease_id;

    INSERT INTO public.user (id, email, role)
    VALUES (gen_random_uuid(), 'test2@example.com', 'tenant')
    RETURNING id INTO v_test_user_id;

    INSERT INTO public.datechangerequest (
        id, lease_id, user_id, requested_date, status
    ) VALUES (
        gen_random_uuid(), v_test_lease_id, v_test_user_id,
        CURRENT_DATE + INTERVAL '30 days', 'pending'
    ) RETURNING id INTO v_test_request_id;

    -- Get original fee
    SELECT (fee_breakdown->>'total_fee')::DECIMAL INTO v_old_total_fee
    FROM public.datechangerequest WHERE id = v_test_request_id;

    RAISE NOTICE 'Original total fee: $%', v_old_total_fee;

    -- Update base_price (should trigger recalculation)
    UPDATE public.datechangerequest
    SET base_price = 3000
    WHERE id = v_test_request_id;

    -- Get new fee
    SELECT (fee_breakdown->>'total_fee')::DECIMAL INTO v_new_total_fee
    FROM public.datechangerequest WHERE id = v_test_request_id;

    RAISE NOTICE 'New total fee: $%', v_new_total_fee;

    -- Verify recalculation
    ASSERT v_new_total_fee = 45, 'Total fee should be 45 (1.5% of 3000)';
    ASSERT v_new_total_fee != v_old_total_fee, 'Fee should have changed';

    RAISE NOTICE '✅ Test 2 PASSED: Fees recalculated on base_price update';

    -- Cleanup
    DELETE FROM public.datechangerequest WHERE id = v_test_request_id;
    DELETE FROM public.user WHERE id = v_test_user_id;
    DELETE FROM public.leases WHERE id = v_test_lease_id;
END $$;

-- ============================================================================
-- TEST 3: Fee breakdown structure validation
-- ============================================================================
DO $$
DECLARE
    v_test_lease_id UUID;
    v_test_user_id UUID;
    v_test_request_id UUID;
    v_fee_breakdown JSONB;
BEGIN
    RAISE NOTICE E'\n========================================';
    RAISE NOTICE 'TEST 3: Fee breakdown structure';
    RAISE NOTICE '========================================';

    -- Create test data
    INSERT INTO public.leases (id, monthly_rent, landlord_id)
    VALUES (gen_random_uuid(), 1500, gen_random_uuid())
    RETURNING id INTO v_test_lease_id;

    INSERT INTO public.user (id, email, role)
    VALUES (gen_random_uuid(), 'test3@example.com', 'tenant')
    RETURNING id INTO v_test_user_id;

    INSERT INTO public.datechangerequest (
        id, lease_id, user_id, requested_date, status
    ) VALUES (
        gen_random_uuid(), v_test_lease_id, v_test_user_id,
        CURRENT_DATE + INTERVAL '30 days', 'pending'
    ) RETURNING id, fee_breakdown INTO v_test_request_id, v_fee_breakdown;

    -- Verify all required fields exist
    ASSERT v_fee_breakdown ? 'base_price', 'Missing base_price';
    ASSERT v_fee_breakdown ? 'platform_fee', 'Missing platform_fee';
    ASSERT v_fee_breakdown ? 'landlord_share', 'Missing landlord_share';
    ASSERT v_fee_breakdown ? 'tenant_share', 'Missing tenant_share';
    ASSERT v_fee_breakdown ? 'total_fee', 'Missing total_fee';
    ASSERT v_fee_breakdown ? 'total_price', 'Missing total_price';
    ASSERT v_fee_breakdown ? 'effective_rate', 'Missing effective_rate';
    ASSERT v_fee_breakdown ? 'transaction_type', 'Missing transaction_type';
    ASSERT v_fee_breakdown ? 'calculated_at', 'Missing calculated_at';
    ASSERT v_fee_breakdown ? 'fee_structure_version', 'Missing fee_structure_version';
    ASSERT v_fee_breakdown ? 'auto_calculated', 'Missing auto_calculated flag';

    -- Verify fee structure version
    ASSERT v_fee_breakdown->>'fee_structure_version' = '1.5_split_model_v1',
        'Incorrect fee structure version';

    RAISE NOTICE '✅ Test 3 PASSED: Fee breakdown structure is correct';

    -- Cleanup
    DELETE FROM public.datechangerequest WHERE id = v_test_request_id;
    DELETE FROM public.user WHERE id = v_test_user_id;
    DELETE FROM public.leases WHERE id = v_test_lease_id;
END $$;

-- ============================================================================
-- TEST 4: 1.5% split model accuracy
-- ============================================================================
DO $$
DECLARE
    v_test_amounts DECIMAL[] := ARRAY[100, 500, 1000, 2000, 5000, 10000];
    v_amount DECIMAL;
    v_test_lease_id UUID;
    v_test_user_id UUID;
    v_test_request_id UUID;
    v_fee_breakdown JSONB;
    v_platform_fee DECIMAL;
    v_landlord_share DECIMAL;
    v_total_fee DECIMAL;
    v_effective_rate DECIMAL;
BEGIN
    RAISE NOTICE E'\n========================================';
    RAISE NOTICE 'TEST 4: 1.5%% split model accuracy';
    RAISE NOTICE '========================================';

    -- Create test user
    INSERT INTO public.user (id, email, role)
    VALUES (gen_random_uuid(), 'test4@example.com', 'tenant')
    RETURNING id INTO v_test_user_id;

    FOREACH v_amount IN ARRAY v_test_amounts
    LOOP
        -- Create lease
        INSERT INTO public.leases (id, monthly_rent, landlord_id)
        VALUES (gen_random_uuid(), v_amount, gen_random_uuid())
        RETURNING id INTO v_test_lease_id;

        -- Create request
        INSERT INTO public.datechangerequest (
            id, lease_id, user_id, requested_date, status
        ) VALUES (
            gen_random_uuid(), v_test_lease_id, v_test_user_id,
            CURRENT_DATE + INTERVAL '30 days', 'pending'
        ) RETURNING id, fee_breakdown INTO v_test_request_id, v_fee_breakdown;

        -- Extract values
        v_platform_fee := (v_fee_breakdown->>'platform_fee')::DECIMAL;
        v_landlord_share := (v_fee_breakdown->>'landlord_share')::DECIMAL;
        v_total_fee := (v_fee_breakdown->>'total_fee')::DECIMAL;
        v_effective_rate := (v_fee_breakdown->>'effective_rate')::DECIMAL;

        -- Verify calculations
        ASSERT ROUND(v_platform_fee, 2) = ROUND(v_amount * 0.0075, 2),
            FORMAT('Platform fee incorrect for amount %s', v_amount);
        ASSERT ROUND(v_landlord_share, 2) = ROUND(v_amount * 0.0075, 2),
            FORMAT('Landlord share incorrect for amount %s', v_amount);
        ASSERT v_platform_fee = v_landlord_share,
            FORMAT('Platform and landlord should be equal for amount %s', v_amount);
        ASSERT v_effective_rate = 1.5,
            FORMAT('Effective rate should be 1.5%% for amount %s', v_amount);

        RAISE NOTICE 'Amount: $% → Fee: $% (Rate: %%)', v_amount, v_total_fee, v_effective_rate;

        -- Cleanup
        DELETE FROM public.datechangerequest WHERE id = v_test_request_id;
        DELETE FROM public.leases WHERE id = v_test_lease_id;
    END LOOP;

    RAISE NOTICE '✅ Test 4 PASSED: 1.5%% split model is accurate';

    -- Cleanup user
    DELETE FROM public.user WHERE id = v_test_user_id;
END $$;

-- ============================================================================
-- TEST 5: Analytics views
-- ============================================================================
DO $$
DECLARE
    v_analytics_count INTEGER;
BEGIN
    RAISE NOTICE E'\n========================================';
    RAISE NOTICE 'TEST 5: Analytics views';
    RAISE NOTICE '========================================';

    -- Test datechangerequest_fee_analytics view
    SELECT COUNT(*) INTO v_analytics_count
    FROM public.datechangerequest_fee_analytics;

    RAISE NOTICE 'Fee analytics view returned % rows', v_analytics_count;

    -- Verify view has all required columns
    PERFORM id, user_id, lease_id, transaction_type, base_price, total_price,
            platform_fee, landlord_share, tenant_share, total_fee, effective_rate,
            payment_status, status, created_at
    FROM public.datechangerequest_fee_analytics
    LIMIT 1;

    RAISE NOTICE '✅ Test 5 PASSED: Analytics views working';
END $$;

-- ============================================================================
-- TEST 6: Payment status constraints
-- ============================================================================
DO $$
DECLARE
    v_test_lease_id UUID;
    v_test_user_id UUID;
    v_test_request_id UUID;
BEGIN
    RAISE NOTICE E'\n========================================';
    RAISE NOTICE 'TEST 6: Payment status constraints';
    RAISE NOTICE '========================================';

    -- Create test data
    INSERT INTO public.leases (id, monthly_rent, landlord_id)
    VALUES (gen_random_uuid(), 1000, gen_random_uuid())
    RETURNING id INTO v_test_lease_id;

    INSERT INTO public.user (id, email, role)
    VALUES (gen_random_uuid(), 'test6@example.com', 'tenant')
    RETURNING id INTO v_test_user_id;

    INSERT INTO public.datechangerequest (
        id, lease_id, user_id, requested_date, status
    ) VALUES (
        gen_random_uuid(), v_test_lease_id, v_test_user_id,
        CURRENT_DATE + INTERVAL '30 days', 'pending'
    ) RETURNING id INTO v_test_request_id;

    -- Test valid payment statuses
    UPDATE public.datechangerequest SET payment_status = 'unpaid' WHERE id = v_test_request_id;
    UPDATE public.datechangerequest SET payment_status = 'pending' WHERE id = v_test_request_id;
    UPDATE public.datechangerequest SET payment_status = 'paid' WHERE id = v_test_request_id;
    UPDATE public.datechangerequest SET payment_status = 'refunded' WHERE id = v_test_request_id;
    UPDATE public.datechangerequest SET payment_status = 'failed' WHERE id = v_test_request_id;

    RAISE NOTICE '✅ Test 6 PASSED: Valid payment statuses accepted';

    -- Cleanup
    DELETE FROM public.datechangerequest WHERE id = v_test_request_id;
    DELETE FROM public.user WHERE id = v_test_user_id;
    DELETE FROM public.leases WHERE id = v_test_lease_id;

EXCEPTION WHEN check_violation THEN
    RAISE NOTICE '❌ Test 6 FAILED: Check constraint violation';
    ROLLBACK;
END $$;

-- ============================================================================
-- TEST SUMMARY
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE E'\n========================================';
    RAISE NOTICE 'ALL DATABASE TESTS COMPLETED';
    RAISE NOTICE '========================================';
END $$;

ROLLBACK;

-- ============================================================================
-- END TEST SUITE
-- ============================================================================
