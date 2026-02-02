-- ============================================================================
-- PATTERN 5: FEE TRANSPARENCY - USER ARCHETYPE BACKFILL
-- ============================================================================
-- Migration: Backfill archetype data based on historical behavior
-- Version: 1.0
-- Date: 2026-01-28
-- Description: Calculates initial archetype values for existing users
-- ============================================================================

-- Temporary function to calculate archetype scores
CREATE OR REPLACE FUNCTION calculate_user_archetype_scores(p_user_id UUID)
RETURNS TABLE (
    flexibility_score INTEGER,
    spending_score INTEGER,
    archetype VARCHAR(50)
) AS $$
DECLARE
    v_flexibility INTEGER := 50;  -- Default middle score
    v_spending INTEGER := 50;     -- Default middle score
    v_archetype VARCHAR(50);
    v_request_count INTEGER;
    v_approved_count INTEGER;
    v_avg_response_time_hours NUMERIC;
    v_avg_fee_paid NUMERIC;
    v_total_transactions INTEGER;
BEGIN
    -- Calculate flexibility score based on past behavior
    -- Users who make more requests and respond quickly are more flexible

    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'approved'),
        EXTRACT(EPOCH FROM AVG(
            CASE
                WHEN reviewed_at IS NOT NULL
                THEN reviewed_at - created_at
                ELSE NULL
            END
        )) / 3600.0
    INTO v_request_count, v_approved_count, v_avg_response_time_hours
    FROM public.datechangerequest
    WHERE user_id = p_user_id;

    -- Calculate spending score based on fee acceptance
    SELECT
        AVG((fee_breakdown->>'total_fee')::DECIMAL),
        COUNT(*)
    INTO v_avg_fee_paid, v_total_transactions
    FROM public.datechangerequest
    WHERE user_id = p_user_id
      AND fee_breakdown IS NOT NULL
      AND payment_status = 'paid';

    -- Flexibility calculation
    -- More requests = more flexible
    IF v_request_count > 10 THEN
        v_flexibility := LEAST(100, 70 + (v_request_count - 10) * 3);
    ELSIF v_request_count > 5 THEN
        v_flexibility := 60 + (v_request_count - 5) * 2;
    ELSIF v_request_count > 2 THEN
        v_flexibility := 50 + (v_request_count - 2) * 3;
    ELSIF v_request_count > 0 THEN
        v_flexibility := 40 + v_request_count * 5;
    END IF;

    -- Quick responders are more flexible
    IF v_avg_response_time_hours IS NOT NULL THEN
        IF v_avg_response_time_hours < 6 THEN
            v_flexibility := LEAST(100, v_flexibility + 15);
        ELSIF v_avg_response_time_hours < 24 THEN
            v_flexibility := LEAST(100, v_flexibility + 10);
        ELSIF v_avg_response_time_hours > 168 THEN  -- > 1 week
            v_flexibility := GREATEST(0, v_flexibility - 10);
        END IF;
    END IF;

    -- High approval rate = more flexible
    IF v_request_count > 0 THEN
        v_flexibility := LEAST(100, v_flexibility + ((v_approved_count * 100 / v_request_count) / 5));
    END IF;

    -- Spending score calculation
    -- Based on average fees paid and transaction frequency
    IF v_avg_fee_paid IS NOT NULL THEN
        -- Higher fees accepted = higher spending score
        IF v_avg_fee_paid > 100 THEN
            v_spending := 80 + LEAST(20, FLOOR(v_avg_fee_paid / 50));
        ELSIF v_avg_fee_paid > 50 THEN
            v_spending := 60 + FLOOR((v_avg_fee_paid - 50) / 2);
        ELSIF v_avg_fee_paid > 20 THEN
            v_spending := 50 + FLOOR((v_avg_fee_paid - 20) / 3);
        ELSE
            v_spending := 40 + FLOOR(v_avg_fee_paid / 2);
        END IF;
    END IF;

    -- More transactions = willing to spend
    IF v_total_transactions > 10 THEN
        v_spending := LEAST(100, v_spending + 15);
    ELSIF v_total_transactions > 5 THEN
        v_spending := LEAST(100, v_spending + 10);
    ELSIF v_total_transactions > 2 THEN
        v_spending := LEAST(100, v_spending + 5);
    END IF;

    -- Ensure scores are within bounds
    v_flexibility := LEAST(100, GREATEST(0, v_flexibility));
    v_spending := LEAST(100, GREATEST(0, v_spending));

    -- Determine archetype based on scores
    IF v_flexibility >= 70 AND v_spending >= 70 THEN
        v_archetype := 'premium_convenience';
    ELSIF v_flexibility >= 70 AND v_spending < 50 THEN
        v_archetype := 'flexibility_seeker';
    ELSIF v_flexibility < 50 AND v_spending < 50 THEN
        v_archetype := 'budget_conscious';
    ELSIF v_flexibility < 50 AND v_spending >= 70 THEN
        v_archetype := 'high_value_hunter';
    ELSE
        v_archetype := 'balanced_renter';
    END IF;

    RETURN QUERY SELECT v_flexibility, v_spending, v_archetype;
END;
$$ LANGUAGE plpgsql;

-- Backfill existing users with archetype data
DO $$
DECLARE
    v_user RECORD;
    v_scores RECORD;
    v_updated_count INTEGER := 0;
    v_skipped_count INTEGER := 0;
    v_data_points INTEGER;
BEGIN
    RAISE NOTICE 'Starting user archetype backfill...';

    -- Loop through all users without archetype
    FOR v_user IN
        SELECT id FROM public.user
        WHERE archetype IS NULL AND is_active = TRUE
        ORDER BY created_at
    LOOP
        BEGIN
            -- Calculate scores for this user
            SELECT * INTO v_scores
            FROM calculate_user_archetype_scores(v_user.id);

            -- Count data points used
            SELECT COUNT(*) INTO v_data_points
            FROM public.datechangerequest
            WHERE user_id = v_user.id;

            -- Update user with calculated archetype
            UPDATE public.user
            SET
                archetype = v_scores.archetype,
                flexibility_score = v_scores.flexibility_score,
                spending_score = v_scores.spending_score,
                archetype_calculated_at = NOW(),
                archetype_metadata = jsonb_build_object(
                    'calculation_method', 'historical_backfill',
                    'data_points_used', v_data_points,
                    'request_count', (
                        SELECT COUNT(*) FROM public.datechangerequest
                        WHERE user_id = v_user.id
                    ),
                    'paid_transactions', (
                        SELECT COUNT(*) FROM public.datechangerequest
                        WHERE user_id = v_user.id AND payment_status = 'paid'
                    ),
                    'backfilled_at', NOW(),
                    'algorithm_version', 'v1.0'
                )
            WHERE id = v_user.id;

            v_updated_count := v_updated_count + 1;

            -- Progress notification every 100 users
            IF v_updated_count % 100 = 0 THEN
                RAISE NOTICE 'Processed % users...', v_updated_count;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error processing user %: %', v_user.id, SQLERRM;
            v_skipped_count := v_skipped_count + 1;
        END;
    END LOOP;

    RAISE NOTICE 'Backfill complete: % users updated, % skipped',
        v_updated_count, v_skipped_count;
END $$;

-- Drop temporary function
DROP FUNCTION IF EXISTS calculate_user_archetype_scores(UUID);

-- Create summary report
DO $$
DECLARE
    v_report TEXT;
    v_total_users INTEGER;
    v_with_archetype INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_users FROM public.user WHERE is_active = TRUE;
    SELECT COUNT(*) INTO v_with_archetype FROM public.user WHERE archetype IS NOT NULL;

    RAISE NOTICE E'\n========================================';
    RAISE NOTICE 'ARCHETYPE BACKFILL SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total active users: %', v_total_users;
    RAISE NOTICE 'Users with archetype: %', v_with_archetype;
    RAISE NOTICE 'Coverage: %%%', ROUND((v_with_archetype::DECIMAL / NULLIF(v_total_users, 0) * 100), 2);
    RAISE NOTICE '========================================';

    SELECT string_agg(
        format('  %s: %s users (avg flex: %s, avg spend: %s)',
            RPAD(archetype, 25),
            LPAD(user_count::TEXT, 5),
            LPAD(ROUND(avg_flexibility_score, 1)::TEXT, 5),
            LPAD(ROUND(avg_spending_score, 1)::TEXT, 5)
        ),
        E'\n'
        ORDER BY user_count DESC
    ) INTO v_report
    FROM public.user_archetype_summary;

    RAISE NOTICE E'\nARCHETYPE DISTRIBUTION:';
    RAISE NOTICE E'%', v_report;
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- END MIGRATION
-- ============================================================================
