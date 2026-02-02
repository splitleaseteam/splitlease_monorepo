-- ============================================================================
-- PATTERN 5: FEE TRANSPARENCY - DATE CHANGE REQUEST FEE BACKFILL
-- ============================================================================
-- Migration: Backfill fee breakdown for existing date change requests
-- Version: 1.0
-- Date: 2026-01-29
-- Description: Calculates and populates fee_breakdown based on lease data
-- ============================================================================

-- Function to calculate fee breakdown for historical requests
CREATE OR REPLACE FUNCTION calculate_historical_fee_breakdown(
    p_base_price DECIMAL,
    p_transaction_type VARCHAR DEFAULT 'date_change'
)
RETURNS JSONB AS $$
DECLARE
    v_platform_fee DECIMAL;
    v_landlord_share DECIMAL;
    v_total_fee DECIMAL;
    v_total_price DECIMAL;
    v_effective_rate DECIMAL;
BEGIN
    -- Apply 1.5% split model (0.75% platform + 0.75% landlord)
    v_platform_fee := p_base_price * 0.0075;
    v_landlord_share := p_base_price * 0.0075;
    v_total_fee := v_platform_fee + v_landlord_share;
    v_total_price := p_base_price + v_total_fee;
    v_effective_rate := (v_total_fee / p_base_price) * 100;

    RETURN jsonb_build_object(
        'base_price', ROUND(p_base_price, 2),
        'platform_fee', ROUND(v_platform_fee, 2),
        'landlord_share', ROUND(v_landlord_share, 2),
        'tenant_share', ROUND(v_total_fee, 2),
        'total_fee', ROUND(v_total_fee, 2),
        'total_price', ROUND(v_total_price, 2),
        'effective_rate', ROUND(v_effective_rate, 2),
        'transaction_type', p_transaction_type,
        'calculated_at', NOW(),
        'fee_structure_version', '1.5_split_model_v1',
        'backfilled', true
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Backfill existing requests
DO $$
DECLARE
    v_request RECORD;
    v_monthly_rent DECIMAL;
    v_fee_breakdown JSONB;
    v_updated_count INTEGER := 0;
    v_skipped_count INTEGER := 0;
    v_total_requests INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_requests
    FROM public.datechangerequest
    WHERE fee_breakdown IS NULL;

    RAISE NOTICE 'Starting backfill of % date change request fee breakdowns...', v_total_requests;

    -- Loop through all requests without fee_breakdown
    FOR v_request IN
        SELECT dcr.id, dcr.lease_id, dcr.created_at, dcr.status
        FROM public.datechangerequest dcr
        WHERE dcr.fee_breakdown IS NULL
        ORDER BY dcr.created_at
    LOOP
        BEGIN
            -- Get monthly rent from associated lease
            SELECT monthly_rent INTO v_monthly_rent
            FROM public.leases
            WHERE id = v_request.lease_id;

            IF v_monthly_rent IS NULL OR v_monthly_rent <= 0 THEN
                RAISE NOTICE 'Skipping request % - invalid monthly rent (lease: %)',
                    v_request.id, v_request.lease_id;
                v_skipped_count := v_skipped_count + 1;
                CONTINUE;
            END IF;

            -- Calculate fee breakdown
            v_fee_breakdown := calculate_historical_fee_breakdown(
                v_monthly_rent,
                'date_change'
            );

            -- Update request with fee breakdown
            UPDATE public.datechangerequest
            SET
                transaction_type = 'date_change',
                fee_breakdown = v_fee_breakdown,
                base_price = v_monthly_rent,
                total_price = (v_fee_breakdown->>'total_price')::DECIMAL,
                fee_structure_version = '1.5_split_model_v1',
                -- Infer payment status from request status
                payment_status = CASE
                    WHEN status = 'approved' THEN 'paid'
                    WHEN status = 'rejected' THEN 'unpaid'
                    WHEN status = 'cancelled' THEN 'unpaid'
                    WHEN status = 'pending' THEN 'unpaid'
                    ELSE 'unpaid'
                END,
                payment_metadata = jsonb_build_object(
                    'backfilled', true,
                    'backfill_date', NOW(),
                    'inferred_from_status', true
                )
            WHERE id = v_request.id;

            v_updated_count := v_updated_count + 1;

            -- Progress update every 100 records
            IF v_updated_count % 100 = 0 THEN
                RAISE NOTICE 'Processed %/% requests... (%.1f%% complete)',
                    v_updated_count,
                    v_total_requests,
                    (v_updated_count::DECIMAL / v_total_requests * 100);
            END IF;

        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error processing request %: %', v_request.id, SQLERRM;
            v_skipped_count := v_skipped_count + 1;
        END;
    END LOOP;

    RAISE NOTICE 'Backfill complete: % requests updated, % skipped',
        v_updated_count, v_skipped_count;
END $$;

-- Create summary analytics
DO $$
DECLARE
    v_total_requests INTEGER;
    v_with_fees INTEGER;
    v_avg_base_price DECIMAL;
    v_avg_fee DECIMAL;
    v_total_platform_fees DECIMAL;
    v_total_landlord_share DECIMAL;
    v_min_fee DECIMAL;
    v_max_fee DECIMAL;
BEGIN
    SELECT
        COUNT(*),
        COUNT(fee_breakdown),
        AVG(base_price),
        AVG((fee_breakdown->>'total_fee')::DECIMAL),
        SUM((fee_breakdown->>'platform_fee')::DECIMAL),
        SUM((fee_breakdown->>'landlord_share')::DECIMAL),
        MIN((fee_breakdown->>'total_fee')::DECIMAL),
        MAX((fee_breakdown->>'total_fee')::DECIMAL)
    INTO
        v_total_requests,
        v_with_fees,
        v_avg_base_price,
        v_avg_fee,
        v_total_platform_fees,
        v_total_landlord_share,
        v_min_fee,
        v_max_fee
    FROM public.datechangerequest;

    RAISE NOTICE E'\n========================================';
    RAISE NOTICE 'FEE BACKFILL SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total requests: %', v_total_requests;
    RAISE NOTICE 'Requests with fee breakdown: %', v_with_fees;
    RAISE NOTICE 'Coverage: %%%', ROUND((v_with_fees::DECIMAL / NULLIF(v_total_requests, 0) * 100), 2);
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Average base price: $%', ROUND(COALESCE(v_avg_base_price, 0), 2);
    RAISE NOTICE 'Average fee: $%', ROUND(COALESCE(v_avg_fee, 0), 2);
    RAISE NOTICE 'Min fee: $%', ROUND(COALESCE(v_min_fee, 0), 2);
    RAISE NOTICE 'Max fee: $%', ROUND(COALESCE(v_max_fee, 0), 2);
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Total platform fees: $%', ROUND(COALESCE(v_total_platform_fees, 0), 2);
    RAISE NOTICE 'Total landlord share: $%', ROUND(COALESCE(v_total_landlord_share, 0), 2);
    RAISE NOTICE 'Total fees collected: $%', ROUND(COALESCE(v_total_platform_fees + v_total_landlord_share, 0), 2);
    RAISE NOTICE '========================================';
END $$;

-- Cleanup temporary function
DROP FUNCTION IF EXISTS calculate_historical_fee_breakdown(DECIMAL, VARCHAR);

-- Create index for better query performance on backfilled data
CREATE INDEX IF NOT EXISTS idx_dcr_backfilled_fees
ON public.datechangerequest ((fee_breakdown->>'backfilled'))
WHERE (fee_breakdown->>'backfilled')::BOOLEAN = true;

COMMENT ON INDEX idx_dcr_backfilled_fees IS 'Index for identifying backfilled fee breakdown records';

-- ============================================================================
-- END MIGRATION
-- ============================================================================
