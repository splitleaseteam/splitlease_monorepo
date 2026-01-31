-- ============================================================================
-- PATTERN 5: FEE TRANSPARENCY - DATABASE HELPER FUNCTIONS
-- ============================================================================
-- Utility functions for fee analytics and reporting
-- Version: 1.0
-- Date: 2026-01-28
-- ============================================================================

-- ============================================================================
-- FUNCTION: Get fee revenue time series
-- ============================================================================
CREATE OR REPLACE FUNCTION get_fee_revenue_timeseries(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    p_interval TEXT DEFAULT 'day' -- 'day', 'week', 'month'
)
RETURNS TABLE (
    period_start TIMESTAMP WITH TIME ZONE,
    transaction_count BIGINT,
    total_revenue DECIMAL,
    total_platform_fees DECIMAL,
    total_landlord_share DECIMAL,
    total_fees_collected DECIMAL,
    avg_transaction_value DECIMAL,
    avg_fee_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE_TRUNC(p_interval, payment_processed_at) as period_start,
        COUNT(*)::BIGINT as transaction_count,
        SUM(base_price)::DECIMAL as total_revenue,
        SUM((fee_breakdown->>'platform_fee')::DECIMAL)::DECIMAL as total_platform_fees,
        SUM((fee_breakdown->>'landlord_share')::DECIMAL)::DECIMAL as total_landlord_share,
        SUM((fee_breakdown->>'total_fee')::DECIMAL)::DECIMAL as total_fees_collected,
        AVG(base_price)::DECIMAL as avg_transaction_value,
        AVG((fee_breakdown->>'total_fee')::DECIMAL)::DECIMAL as avg_fee_amount
    FROM public.datechangerequest
    WHERE payment_status = 'paid'
      AND fee_breakdown IS NOT NULL
      AND payment_processed_at >= p_start_date
      AND payment_processed_at <= p_end_date
    GROUP BY DATE_TRUNC(p_interval, payment_processed_at)
    ORDER BY period_start DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_fee_revenue_timeseries IS
    'Returns fee revenue metrics grouped by time period (day/week/month)';

-- ============================================================================
-- FUNCTION: Calculate user lifetime value
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_user_lifetime_value(p_user_id UUID)
RETURNS TABLE (
    total_transactions BIGINT,
    total_spent DECIMAL,
    total_fees_paid DECIMAL,
    avg_transaction_value DECIMAL,
    first_transaction_date TIMESTAMP WITH TIME ZONE,
    last_transaction_date TIMESTAMP WITH TIME ZONE,
    user_archetype VARCHAR(50),
    lifetime_days INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_transactions,
        SUM(base_price)::DECIMAL as total_spent,
        SUM((fee_breakdown->>'total_fee')::DECIMAL)::DECIMAL as total_fees_paid,
        AVG(base_price)::DECIMAL as avg_transaction_value,
        MIN(created_at) as first_transaction_date,
        MAX(created_at) as last_transaction_date,
        (SELECT archetype FROM public.user WHERE id = p_user_id) as user_archetype,
        EXTRACT(DAY FROM (MAX(created_at) - MIN(created_at)))::INTEGER as lifetime_days
    FROM public.datechangerequest
    WHERE user_id = p_user_id
      AND payment_status = 'paid'
      AND fee_breakdown IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_user_lifetime_value IS
    'Calculate total lifetime value and metrics for a specific user';

-- ============================================================================
-- FUNCTION: Get fee comparison by archetype
-- ============================================================================
CREATE OR REPLACE FUNCTION get_fee_metrics_by_archetype()
RETURNS TABLE (
    archetype VARCHAR(50),
    user_count BIGINT,
    avg_flexibility_score DECIMAL,
    avg_spending_score DECIMAL,
    total_transactions BIGINT,
    avg_fee_paid DECIMAL,
    total_fees_paid DECIMAL,
    avg_transaction_value DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.archetype,
        COUNT(DISTINCT u.id)::BIGINT as user_count,
        AVG(u.flexibility_score)::DECIMAL as avg_flexibility_score,
        AVG(u.spending_score)::DECIMAL as avg_spending_score,
        COUNT(dcr.id)::BIGINT as total_transactions,
        AVG((dcr.fee_breakdown->>'total_fee')::DECIMAL)::DECIMAL as avg_fee_paid,
        SUM((dcr.fee_breakdown->>'total_fee')::DECIMAL)::DECIMAL as total_fees_paid,
        AVG(dcr.base_price)::DECIMAL as avg_transaction_value
    FROM public.user u
    LEFT JOIN public.datechangerequest dcr ON u.id = dcr.user_id
        AND dcr.payment_status = 'paid'
        AND dcr.fee_breakdown IS NOT NULL
    WHERE u.archetype IS NOT NULL
    GROUP BY u.archetype
    ORDER BY total_transactions DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_fee_metrics_by_archetype IS
    'Compare fee metrics across different user archetypes';

-- ============================================================================
-- FUNCTION: Detect fee anomalies
-- ============================================================================
CREATE OR REPLACE FUNCTION detect_fee_anomalies(
    p_threshold_percentage DECIMAL DEFAULT 0.1 -- 10% deviation
)
RETURNS TABLE (
    request_id UUID,
    base_price DECIMAL,
    expected_fee DECIMAL,
    actual_fee DECIMAL,
    deviation_percentage DECIMAL,
    fee_breakdown JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dcr.id as request_id,
        dcr.base_price,
        ROUND(dcr.base_price * 0.015, 2) as expected_fee,
        (dcr.fee_breakdown->>'total_fee')::DECIMAL as actual_fee,
        ROUND(
            ABS((dcr.fee_breakdown->>'total_fee')::DECIMAL - (dcr.base_price * 0.015)) /
            (dcr.base_price * 0.015) * 100,
            2
        ) as deviation_percentage,
        dcr.fee_breakdown,
        dcr.created_at
    FROM public.datechangerequest dcr
    WHERE dcr.fee_breakdown IS NOT NULL
      AND ABS(
          (dcr.fee_breakdown->>'total_fee')::DECIMAL - (dcr.base_price * 0.015)
      ) / (dcr.base_price * 0.015) > p_threshold_percentage
    ORDER BY deviation_percentage DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION detect_fee_anomalies IS
    'Detect transactions where fee calculation deviates from expected 1.5%';

-- ============================================================================
-- FUNCTION: Get payment success rate
-- ============================================================================
CREATE OR REPLACE FUNCTION get_payment_success_rate(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    payment_status VARCHAR(50),
    count BIGINT,
    percentage DECIMAL,
    total_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH status_counts AS (
        SELECT
            dcr.payment_status,
            COUNT(*)::BIGINT as count,
            SUM(dcr.total_price)::DECIMAL as total_amount
        FROM public.datechangerequest dcr
        WHERE dcr.created_at >= p_start_date
          AND dcr.created_at <= p_end_date
          AND dcr.payment_status IS NOT NULL
        GROUP BY dcr.payment_status
    ),
    total_count AS (
        SELECT SUM(count) as total FROM status_counts
    )
    SELECT
        sc.payment_status,
        sc.count,
        ROUND((sc.count::DECIMAL / tc.total * 100), 2) as percentage,
        sc.total_amount
    FROM status_counts sc
    CROSS JOIN total_count tc
    ORDER BY sc.count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_payment_success_rate IS
    'Calculate payment success rates by status within a date range';

-- ============================================================================
-- FUNCTION: Bulk update payment status
-- ============================================================================
CREATE OR REPLACE FUNCTION bulk_update_payment_status(
    p_request_ids UUID[],
    p_new_status VARCHAR(50),
    p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
    request_id UUID,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    UPDATE public.datechangerequest
    SET
        payment_status = p_new_status,
        payment_metadata = COALESCE(payment_metadata, '{}'::jsonb) ||
            jsonb_build_object(
                'bulk_update', true,
                'bulk_update_reason', COALESCE(p_reason, 'Manual bulk update'),
                'bulk_updated_at', NOW()
            ),
        updated_at = NOW()
    WHERE id = ANY(p_request_ids)
    RETURNING
        id as request_id,
        payment_status as old_status,
        p_new_status as new_status,
        updated_at;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION bulk_update_payment_status IS
    'Bulk update payment status for multiple requests';

-- ============================================================================
-- FUNCTION: Export fee data for reporting
-- ============================================================================
CREATE OR REPLACE FUNCTION export_fee_data_csv(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    request_id UUID,
    user_email TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE,
    transaction_type VARCHAR(50),
    base_amount DECIMAL,
    platform_fee DECIMAL,
    landlord_share DECIMAL,
    total_fee DECIMAL,
    total_paid DECIMAL,
    payment_status VARCHAR(50),
    payment_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dcr.id as request_id,
        u.email as user_email,
        dcr.created_at as transaction_date,
        dcr.transaction_type,
        dcr.base_price as base_amount,
        (dcr.fee_breakdown->>'platform_fee')::DECIMAL as platform_fee,
        (dcr.fee_breakdown->>'landlord_share')::DECIMAL as landlord_share,
        (dcr.fee_breakdown->>'total_fee')::DECIMAL as total_fee,
        dcr.total_price as total_paid,
        dcr.payment_status,
        dcr.payment_processed_at as payment_date
    FROM public.datechangerequest dcr
    LEFT JOIN public.user u ON dcr.user_id = u.id
    WHERE dcr.created_at >= p_start_date
      AND dcr.created_at <= p_end_date
      AND dcr.fee_breakdown IS NOT NULL
    ORDER BY dcr.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION export_fee_data_csv IS
    'Export fee data in CSV-friendly format for reporting and analysis';

-- ============================================================================
-- FUNCTION: Calculate platform revenue projection
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_revenue_projection(
    p_days_ahead INTEGER DEFAULT 30
)
RETURNS TABLE (
    projection_date DATE,
    projected_transactions INTEGER,
    projected_revenue DECIMAL,
    projected_platform_fees DECIMAL,
    confidence_level TEXT
) AS $$
DECLARE
    v_avg_daily_transactions DECIMAL;
    v_avg_daily_revenue DECIMAL;
    v_avg_daily_fees DECIMAL;
BEGIN
    -- Calculate averages from last 30 days
    SELECT
        AVG(daily_count),
        AVG(daily_revenue),
        AVG(daily_fees)
    INTO
        v_avg_daily_transactions,
        v_avg_daily_revenue,
        v_avg_daily_fees
    FROM (
        SELECT
            DATE(created_at) as day,
            COUNT(*) as daily_count,
            SUM(base_price) as daily_revenue,
            SUM((fee_breakdown->>'platform_fee')::DECIMAL) as daily_fees
        FROM public.datechangerequest
        WHERE created_at >= NOW() - INTERVAL '30 days'
          AND payment_status = 'paid'
          AND fee_breakdown IS NOT NULL
        GROUP BY DATE(created_at)
    ) daily_stats;

    -- Generate projections
    RETURN QUERY
    SELECT
        CURRENT_DATE + i as projection_date,
        ROUND(v_avg_daily_transactions)::INTEGER as projected_transactions,
        ROUND(v_avg_daily_revenue, 2) as projected_revenue,
        ROUND(v_avg_daily_fees, 2) as projected_platform_fees,
        CASE
            WHEN i <= 7 THEN 'High'
            WHEN i <= 14 THEN 'Medium'
            ELSE 'Low'
        END as confidence_level
    FROM generate_series(1, p_days_ahead) as i;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_revenue_projection IS
    'Project future revenue based on historical averages';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_fee_revenue_timeseries TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_user_lifetime_value TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_success_rate TO authenticated;
GRANT EXECUTE ON FUNCTION export_fee_data_csv TO authenticated;

-- Admin-only functions
GRANT EXECUTE ON FUNCTION get_fee_metrics_by_archetype TO authenticated;
GRANT EXECUTE ON FUNCTION detect_fee_anomalies TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_payment_status TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_revenue_projection TO authenticated;

-- ============================================================================
-- END HELPER FUNCTIONS
-- ============================================================================
