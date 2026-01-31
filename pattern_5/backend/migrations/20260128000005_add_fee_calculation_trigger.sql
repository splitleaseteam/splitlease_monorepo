-- ============================================================================
-- PATTERN 5: FEE TRANSPARENCY - FEE CALCULATION TRIGGER
-- ============================================================================
-- Migration: Create trigger to automatically calculate fee breakdown on insert
-- Version: 1.0
-- Date: 2026-01-28
-- Description: Auto-populates fee_breakdown for new datechangerequest records
-- ============================================================================

-- Function to calculate and populate fee breakdown
CREATE OR REPLACE FUNCTION auto_calculate_fee_breakdown()
RETURNS TRIGGER AS $$
DECLARE
    v_monthly_rent DECIMAL;
    v_platform_fee DECIMAL;
    v_landlord_share DECIMAL;
    v_total_fee DECIMAL;
    v_total_price DECIMAL;
    v_effective_rate DECIMAL;
    v_platform_rate CONSTANT DECIMAL := 0.0075;  -- 0.75%
    v_landlord_rate CONSTANT DECIMAL := 0.0075;  -- 0.75%
BEGIN
    -- Only calculate if fee_breakdown is not already set
    IF NEW.fee_breakdown IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Get base price from lease if not provided
    IF NEW.base_price IS NULL THEN
        SELECT monthly_rent INTO v_monthly_rent
        FROM public.leases
        WHERE id = NEW.lease_id;

        IF v_monthly_rent IS NULL OR v_monthly_rent <= 0 THEN
            -- Don't block insert, but log warning
            RAISE WARNING 'Cannot calculate fees: invalid monthly rent for lease %. Fee calculation skipped.', NEW.lease_id;
            RETURN NEW;
        END IF;

        NEW.base_price := v_monthly_rent;
    ELSE
        v_monthly_rent := NEW.base_price;
    END IF;

    -- Calculate fees using 1.5% split model
    v_platform_fee := v_monthly_rent * v_platform_rate;      -- 0.75%
    v_landlord_share := v_monthly_rent * v_landlord_rate;    -- 0.75%
    v_total_fee := v_platform_fee + v_landlord_share;         -- 1.5%
    v_total_price := v_monthly_rent + v_total_fee;
    v_effective_rate := (v_total_fee / v_monthly_rent) * 100;

    -- Populate fee_breakdown JSONB
    NEW.fee_breakdown := jsonb_build_object(
        'base_price', ROUND(v_monthly_rent, 2),
        'platform_fee', ROUND(v_platform_fee, 2),
        'landlord_share', ROUND(v_landlord_share, 2),
        'tenant_share', ROUND(v_total_fee, 2),
        'total_fee', ROUND(v_total_fee, 2),
        'total_price', ROUND(v_total_price, 2),
        'effective_rate', ROUND(v_effective_rate, 2),
        'platform_rate', v_platform_rate,
        'landlord_rate', v_landlord_rate,
        'transaction_type', COALESCE(NEW.transaction_type, 'date_change'),
        'calculated_at', NOW(),
        'fee_structure_version', '1.5_split_model_v1',
        'auto_calculated', true
    );

    -- Populate total_price field
    NEW.total_price := ROUND(v_total_price, 2);

    -- Set fee structure version if not already set
    IF NEW.fee_structure_version IS NULL THEN
        NEW.fee_structure_version := '1.5_split_model_v1';
    END IF;

    -- Set default transaction type if not provided
    IF NEW.transaction_type IS NULL THEN
        NEW.transaction_type := 'date_change';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on INSERT
DROP TRIGGER IF EXISTS trigger_auto_calculate_fee_breakdown ON public.datechangerequest;
CREATE TRIGGER trigger_auto_calculate_fee_breakdown
    BEFORE INSERT ON public.datechangerequest
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_fee_breakdown();

-- Create trigger on UPDATE (only if base_price changes)
DROP TRIGGER IF EXISTS trigger_recalculate_fee_breakdown_on_update ON public.datechangerequest;
CREATE TRIGGER trigger_recalculate_fee_breakdown_on_update
    BEFORE UPDATE OF base_price ON public.datechangerequest
    FOR EACH ROW
    WHEN (OLD.base_price IS DISTINCT FROM NEW.base_price)
    EXECUTE FUNCTION auto_calculate_fee_breakdown();

-- Function to recalculate fees for an existing request
CREATE OR REPLACE FUNCTION recalculate_fee_breakdown(p_request_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    UPDATE public.datechangerequest
    SET fee_breakdown = NULL  -- This will trigger recalculation
    WHERE id = p_request_id
    RETURNING fee_breakdown INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to bulk recalculate fees
CREATE OR REPLACE FUNCTION bulk_recalculate_fees(
    p_transaction_type VARCHAR DEFAULT NULL,
    p_payment_status VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 1000
)
RETURNS TABLE (
    request_id UUID,
    old_total_fee DECIMAL,
    new_total_fee DECIMAL,
    difference DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH updates AS (
        UPDATE public.datechangerequest
        SET fee_breakdown = NULL
        WHERE id IN (
            SELECT id
            FROM public.datechangerequest
            WHERE (p_transaction_type IS NULL OR transaction_type = p_transaction_type)
              AND (p_payment_status IS NULL OR payment_status = p_payment_status)
              AND fee_breakdown IS NOT NULL
            LIMIT p_limit
        )
        RETURNING
            id,
            (fee_breakdown->>'total_fee')::DECIMAL as old_fee,
            (fee_breakdown->>'total_fee')::DECIMAL as new_fee
    )
    SELECT
        id,
        old_fee,
        new_fee,
        new_fee - old_fee
    FROM updates;
END;
$$ LANGUAGE plpgsql;

-- Add documentation
COMMENT ON FUNCTION auto_calculate_fee_breakdown() IS
    'Automatically calculates and populates fee_breakdown JSONB field for datechangerequest records using 1.5% split model (0.75% platform + 0.75% landlord)';

COMMENT ON TRIGGER trigger_auto_calculate_fee_breakdown ON public.datechangerequest IS
    'Auto-calculates fee breakdown on INSERT if not provided';

COMMENT ON TRIGGER trigger_recalculate_fee_breakdown_on_update ON public.datechangerequest IS
    'Recalculates fee breakdown when base_price is updated';

COMMENT ON FUNCTION recalculate_fee_breakdown(UUID) IS
    'Manually recalculate fee breakdown for a specific request';

COMMENT ON FUNCTION bulk_recalculate_fees(VARCHAR, VARCHAR, INTEGER) IS
    'Bulk recalculate fees for multiple requests matching criteria';

-- Test the trigger
DO $$
DECLARE
    v_test_result TEXT;
BEGIN
    RAISE NOTICE E'\n========================================';
    RAISE NOTICE 'FEE CALCULATION TRIGGER INSTALLED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Trigger: trigger_auto_calculate_fee_breakdown';
    RAISE NOTICE 'Function: auto_calculate_fee_breakdown()';
    RAISE NOTICE 'Fee Model: 1.5%% split (0.75%% platform + 0.75%% landlord)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All new datechangerequest records will automatically';
    RAISE NOTICE 'have fee_breakdown calculated on insert.';
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- END MIGRATION
-- ============================================================================
