-- ============================================================================
-- PATTERN 5: FEE TRANSPARENCY - FEE CALCULATION TRIGGER (ADAPTED)
-- ============================================================================
-- Migration: Create trigger to automatically calculate fee breakdown on insert
-- Adapted for Split Lease: Tables 'bookings_leases' and 'datechangerequest'
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
    -- ADAPTED: table name is bookings_leases, column is "Total Rent"
    IF NEW.base_price IS NULL THEN
        SELECT "Total Rent" INTO v_monthly_rent
        FROM public.bookings_leases
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
