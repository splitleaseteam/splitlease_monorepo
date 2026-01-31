-- =====================================================
-- PATTERN 3: PRICE ANCHORING - DATABASE SCHEMA
-- =====================================================
-- Migration: 001_pricing_tiers_schema
-- Description: Creates tables and functions for price anchoring
-- Author: Claude Code
-- Date: 2026-01-28
-- =====================================================

-- =====================================================
-- TABLE: pricing_tiers
-- =====================================================
-- Stores pricing tier configurations (Budget, Recommended, Premium)
-- =====================================================

CREATE TABLE IF NOT EXISTS pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name VARCHAR(50) NOT NULL UNIQUE,
    tier_id VARCHAR(20) NOT NULL UNIQUE,
    multiplier DECIMAL(4,2) NOT NULL,
    display_order INTEGER NOT NULL,
    badge_text VARCHAR(50),
    description TEXT,
    acceptance_rate DECIMAL(4,3),
    avg_response_time_hours INTEGER,
    is_recommended BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_multiplier CHECK (multiplier > 0 AND multiplier <= 2.0),
    CONSTRAINT valid_acceptance_rate CHECK (acceptance_rate >= 0 AND acceptance_rate <= 1),
    CONSTRAINT valid_response_time CHECK (avg_response_time_hours > 0)
);

-- Create indexes
CREATE INDEX idx_pricing_tiers_tier_id ON pricing_tiers(tier_id);
CREATE INDEX idx_pricing_tiers_is_active ON pricing_tiers(is_active);
CREATE INDEX idx_pricing_tiers_display_order ON pricing_tiers(display_order);

-- Add RLS policies
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active pricing tiers"
    ON pricing_tiers FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Only admins can modify pricing tiers"
    ON pricing_tiers FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- TABLE: tier_features
-- =====================================================
-- Stores feature descriptions for each tier
-- =====================================================

CREATE TABLE IF NOT EXISTS tier_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_id VARCHAR(20) NOT NULL REFERENCES pricing_tiers(tier_id) ON DELETE CASCADE,
    feature_text TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_tier_feature_order UNIQUE (tier_id, display_order)
);

-- Create indexes
CREATE INDEX idx_tier_features_tier_id ON tier_features(tier_id);
CREATE INDEX idx_tier_features_display_order ON tier_features(display_order);

-- Add RLS policies
ALTER TABLE tier_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active tier features"
    ON tier_features FOR SELECT
    USING (is_active = TRUE);

-- =====================================================
-- TABLE: price_anchoring_events
-- =====================================================
-- Tracks when users view pricing tiers (analytics)
-- =====================================================

CREATE TABLE IF NOT EXISTS price_anchoring_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,

    -- Pricing context
    base_price DECIMAL(10,2) NOT NULL,
    anchor_price DECIMAL(10,2) NOT NULL,
    anchor_type VARCHAR(20) NOT NULL,

    -- Tier information
    tiers_shown JSONB NOT NULL,
    selected_tier_id VARCHAR(20),
    selected_price DECIMAL(10,2),

    -- Savings calculations
    savings_amount DECIMAL(10,2),
    savings_percentage DECIMAL(5,2),

    -- Context
    booking_id UUID,
    transaction_type VARCHAR(50),
    user_archetype VARCHAR(50),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_event_type CHECK (
        event_type IN (
            'tiers_viewed',
            'tier_selected',
            'tier_changed',
            'custom_price_entered',
            'transaction_completed',
            'transaction_abandoned'
        )
    ),
    CONSTRAINT valid_anchor_type CHECK (
        anchor_type IN ('buyout', 'market_rate', 'recommended', 'custom')
    ),
    CONSTRAINT valid_savings CHECK (savings_percentage >= 0 AND savings_percentage <= 100)
);

-- Create indexes for analytics queries
CREATE INDEX idx_price_anchoring_events_user_id ON price_anchoring_events(user_id);
CREATE INDEX idx_price_anchoring_events_session_id ON price_anchoring_events(session_id);
CREATE INDEX idx_price_anchoring_events_event_type ON price_anchoring_events(event_type);
CREATE INDEX idx_price_anchoring_events_created_at ON price_anchoring_events(created_at DESC);
CREATE INDEX idx_price_anchoring_events_selected_tier ON price_anchoring_events(selected_tier_id);
CREATE INDEX idx_price_anchoring_events_booking_id ON price_anchoring_events(booking_id);

-- Add RLS policies
ALTER TABLE price_anchoring_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own events"
    ON price_anchoring_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert events (for anonymous users)"
    ON price_anchoring_events FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can read all events"
    ON price_anchoring_events FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- TABLE: tier_selections
-- =====================================================
-- Tracks final tier selections tied to transactions
-- =====================================================

CREATE TABLE IF NOT EXISTS tier_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL,
    user_id UUID NOT NULL,

    -- Selected tier
    tier_id VARCHAR(20) NOT NULL REFERENCES pricing_tiers(tier_id),
    tier_name VARCHAR(50) NOT NULL,

    -- Pricing details
    base_price DECIMAL(10,2) NOT NULL,
    multiplier DECIMAL(4,2) NOT NULL,
    final_price DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) NOT NULL,

    -- Anchor context
    anchor_price DECIMAL(10,2) NOT NULL,
    savings_vs_anchor DECIMAL(10,2) NOT NULL,
    savings_percentage DECIMAL(5,2) NOT NULL,

    -- Transaction outcome
    transaction_status VARCHAR(20) DEFAULT 'pending',
    completed_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_transaction_status CHECK (
        transaction_status IN (
            'pending',
            'completed',
            'cancelled',
            'expired'
        )
    ),
    CONSTRAINT valid_prices CHECK (
        final_price >= 0 AND
        total_cost >= 0 AND
        savings_vs_anchor >= 0
    )
);

-- Create indexes
CREATE INDEX idx_tier_selections_booking_id ON tier_selections(booking_id);
CREATE INDEX idx_tier_selections_user_id ON tier_selections(user_id);
CREATE INDEX idx_tier_selections_tier_id ON tier_selections(tier_id);
CREATE INDEX idx_tier_selections_created_at ON tier_selections(created_at DESC);
CREATE INDEX idx_tier_selections_status ON tier_selections(transaction_status);

-- Add RLS policies
ALTER TABLE tier_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own tier selections"
    ON tier_selections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tier selections"
    ON tier_selections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tier selections"
    ON tier_selections FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: ab_test_variants
-- =====================================================
-- A/B test configurations for price anchoring
-- =====================================================

CREATE TABLE IF NOT EXISTS ab_test_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_name VARCHAR(100) NOT NULL,
    variant_name VARCHAR(50) NOT NULL,

    -- Configuration
    tier_multipliers JSONB NOT NULL,
    display_order VARCHAR(50) NOT NULL,
    savings_format VARCHAR(20) NOT NULL,

    -- Traffic allocation
    traffic_percentage INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,

    -- Results
    impressions INTEGER DEFAULT 0,
    selections INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,

    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_test_variant UNIQUE (test_name, variant_name),
    CONSTRAINT valid_traffic_percentage CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
    CONSTRAINT valid_savings_format CHECK (
        savings_format IN ('absolute', 'percentage', 'both')
    )
);

-- Create indexes
CREATE INDEX idx_ab_test_variants_test_name ON ab_test_variants(test_name);
CREATE INDEX idx_ab_test_variants_is_active ON ab_test_variants(is_active);

-- =====================================================
-- SEED DATA: Default Pricing Tiers
-- =====================================================

INSERT INTO pricing_tiers (
    tier_name,
    tier_id,
    multiplier,
    display_order,
    badge_text,
    description,
    acceptance_rate,
    avg_response_time_hours,
    is_recommended
) VALUES
    (
        'Budget',
        'budget',
        0.90,
        3,
        NULL,
        'Basic offer',
        0.45,
        48,
        FALSE
    ),
    (
        'Recommended',
        'recommended',
        1.00,
        2,
        'Most Popular',
        'Best value',
        0.73,
        12,
        TRUE
    ),
    (
        'Premium',
        'premium',
        1.15,
        1,
        'Fastest',
        'Priority handling',
        0.89,
        4,
        FALSE
    )
ON CONFLICT (tier_id) DO NOTHING;

-- =====================================================
-- SEED DATA: Tier Features
-- =====================================================

INSERT INTO tier_features (tier_id, feature_text, display_order, icon) VALUES
    -- Budget tier features
    ('budget', 'Standard processing', 1, 'check'),
    ('budget', 'May take longer to accept', 2, 'clock'),
    ('budget', 'Lower priority', 3, 'info'),

    -- Recommended tier features
    ('recommended', 'Fair market rate', 1, 'star'),
    ('recommended', 'Faster acceptance', 2, 'zap'),
    ('recommended', 'Preferred by 73% of users', 3, 'users'),

    -- Premium tier features
    ('premium', 'Highest acceptance rate', 1, 'trophy'),
    ('premium', 'Same-day response typical', 2, 'bolt'),
    ('premium', 'VIP processing', 3, 'crown')
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNCTION: calculate_tier_price
-- =====================================================
-- Calculates the price for a specific tier given a base price
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_tier_price(
    p_base_price DECIMAL,
    p_tier_id VARCHAR
)
RETURNS DECIMAL AS $$
DECLARE
    v_multiplier DECIMAL;
    v_final_price DECIMAL;
BEGIN
    -- Get multiplier for tier
    SELECT multiplier INTO v_multiplier
    FROM pricing_tiers
    WHERE tier_id = p_tier_id AND is_active = TRUE;

    IF v_multiplier IS NULL THEN
        RAISE EXCEPTION 'Invalid or inactive tier_id: %', p_tier_id;
    END IF;

    -- Calculate price
    v_final_price := p_base_price * v_multiplier;

    RETURN ROUND(v_final_price, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNCTION: calculate_savings
-- =====================================================
-- Calculates savings amount and percentage vs anchor
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_savings(
    p_offer_price DECIMAL,
    p_anchor_price DECIMAL
)
RETURNS TABLE(
    savings_amount DECIMAL,
    savings_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (p_anchor_price - p_offer_price) AS savings_amount,
        CASE
            WHEN p_anchor_price > 0 THEN
                ROUND(((p_anchor_price - p_offer_price) / p_anchor_price) * 100, 2)
            ELSE
                0.00
        END AS savings_percentage;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNCTION: get_recommended_tier
-- =====================================================
-- Returns recommended tier based on user context
-- =====================================================

CREATE OR REPLACE FUNCTION get_recommended_tier(
    p_user_archetype VARCHAR DEFAULT 'average_user',
    p_urgency VARCHAR DEFAULT 'medium'
)
RETURNS TABLE(
    tier_id VARCHAR,
    tier_name VARCHAR,
    multiplier DECIMAL,
    reason TEXT
) AS $$
BEGIN
    -- Big spenders or high urgency -> Premium
    IF p_user_archetype = 'big_spender' OR p_urgency = 'high' THEN
        RETURN QUERY
        SELECT
            pt.tier_id,
            pt.tier_name,
            pt.multiplier,
            'Recommended based on your profile and urgency'::TEXT AS reason
        FROM pricing_tiers pt
        WHERE pt.tier_id = 'premium' AND pt.is_active = TRUE;
        RETURN;
    END IF;

    -- High flexibility -> Budget
    IF p_user_archetype = 'high_flexibility' THEN
        RETURN QUERY
        SELECT
            pt.tier_id,
            pt.tier_name,
            pt.multiplier,
            'Recommended for maximum flexibility'::TEXT AS reason
        FROM pricing_tiers pt
        WHERE pt.tier_id = 'budget' AND pt.is_active = TRUE;
        RETURN;
    END IF;

    -- Default -> Recommended tier
    RETURN QUERY
    SELECT
        pt.tier_id,
        pt.tier_name,
        pt.multiplier,
        'Most popular choice among users'::TEXT AS reason
    FROM pricing_tiers pt
    WHERE pt.is_recommended = TRUE AND pt.is_active = TRUE
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNCTION: get_all_tier_prices
-- =====================================================
-- Returns all tiers with calculated prices
-- =====================================================

CREATE OR REPLACE FUNCTION get_all_tier_prices(
    p_base_price DECIMAL,
    p_anchor_price DECIMAL DEFAULT NULL
)
RETURNS TABLE(
    tier_id VARCHAR,
    tier_name VARCHAR,
    multiplier DECIMAL,
    calculated_price DECIMAL,
    display_order INTEGER,
    badge_text VARCHAR,
    description TEXT,
    acceptance_rate DECIMAL,
    avg_response_time_hours INTEGER,
    is_recommended BOOLEAN,
    features JSONB,
    savings_amount DECIMAL,
    savings_percentage DECIMAL
) AS $$
DECLARE
    v_anchor_price DECIMAL;
BEGIN
    -- Use provided anchor or default to base price
    v_anchor_price := COALESCE(p_anchor_price, p_base_price);

    RETURN QUERY
    SELECT
        pt.tier_id,
        pt.tier_name,
        pt.multiplier,
        ROUND(p_base_price * pt.multiplier, 2) AS calculated_price,
        pt.display_order,
        pt.badge_text,
        pt.description,
        pt.acceptance_rate,
        pt.avg_response_time_hours,
        pt.is_recommended,
        -- Aggregate features
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'text', tf.feature_text,
                    'icon', tf.icon,
                    'order', tf.display_order
                )
                ORDER BY tf.display_order
            )
            FROM tier_features tf
            WHERE tf.tier_id = pt.tier_id AND tf.is_active = TRUE
        ) AS features,
        -- Calculate savings
        (v_anchor_price - ROUND(p_base_price * pt.multiplier, 2)) AS savings_amount,
        CASE
            WHEN v_anchor_price > 0 THEN
                ROUND(((v_anchor_price - ROUND(p_base_price * pt.multiplier, 2)) / v_anchor_price) * 100, 2)
            ELSE
                0.00
        END AS savings_percentage
    FROM pricing_tiers pt
    WHERE pt.is_active = TRUE
    ORDER BY pt.display_order;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNCTION: track_tier_selection_event
-- =====================================================
-- Helper function to track tier selection events
-- =====================================================

CREATE OR REPLACE FUNCTION track_tier_selection_event(
    p_user_id UUID,
    p_session_id UUID,
    p_event_type VARCHAR,
    p_base_price DECIMAL,
    p_anchor_price DECIMAL,
    p_anchor_type VARCHAR,
    p_tiers_shown JSONB,
    p_selected_tier_id VARCHAR DEFAULT NULL,
    p_selected_price DECIMAL DEFAULT NULL,
    p_booking_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
    v_savings_amount DECIMAL;
    v_savings_percentage DECIMAL;
BEGIN
    -- Calculate savings if tier selected
    IF p_selected_price IS NOT NULL THEN
        SELECT * INTO v_savings_amount, v_savings_percentage
        FROM calculate_savings(p_selected_price, p_anchor_price);
    END IF;

    -- Insert event
    INSERT INTO price_anchoring_events (
        user_id,
        session_id,
        event_type,
        base_price,
        anchor_price,
        anchor_type,
        tiers_shown,
        selected_tier_id,
        selected_price,
        savings_amount,
        savings_percentage,
        booking_id,
        metadata
    ) VALUES (
        p_user_id,
        p_session_id,
        p_event_type,
        p_base_price,
        p_anchor_price,
        p_anchor_type,
        p_tiers_shown,
        p_selected_tier_id,
        p_selected_price,
        v_savings_amount,
        v_savings_percentage,
        p_booking_id,
        p_metadata
    ) RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: get_tier_analytics
-- =====================================================
-- Returns analytics for tier selection performance
-- =====================================================

CREATE OR REPLACE FUNCTION get_tier_analytics(
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(
    tier_id VARCHAR,
    tier_name VARCHAR,
    total_views INTEGER,
    total_selections INTEGER,
    selection_rate DECIMAL,
    avg_savings_amount DECIMAL,
    avg_savings_percentage DECIMAL,
    total_revenue DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pt.tier_id,
        pt.tier_name,
        COUNT(DISTINCT CASE WHEN pae.event_type = 'tiers_viewed' THEN pae.id END)::INTEGER AS total_views,
        COUNT(DISTINCT CASE WHEN pae.event_type = 'tier_selected' THEN pae.id END)::INTEGER AS total_selections,
        CASE
            WHEN COUNT(DISTINCT CASE WHEN pae.event_type = 'tiers_viewed' THEN pae.id END) > 0 THEN
                ROUND(
                    (COUNT(DISTINCT CASE WHEN pae.event_type = 'tier_selected' THEN pae.id END)::DECIMAL /
                     COUNT(DISTINCT CASE WHEN pae.event_type = 'tiers_viewed' THEN pae.id END)::DECIMAL) * 100,
                    2
                )
            ELSE
                0.00
        END AS selection_rate,
        ROUND(AVG(CASE WHEN pae.event_type = 'tier_selected' THEN pae.savings_amount END), 2) AS avg_savings_amount,
        ROUND(AVG(CASE WHEN pae.event_type = 'tier_selected' THEN pae.savings_percentage END), 2) AS avg_savings_percentage,
        ROUND(SUM(CASE WHEN pae.event_type = 'tier_selected' THEN pae.selected_price END), 2) AS total_revenue
    FROM pricing_tiers pt
    LEFT JOIN price_anchoring_events pae ON pae.selected_tier_id = pt.tier_id
        AND pae.created_at >= p_start_date
        AND pae.created_at <= p_end_date
    WHERE pt.is_active = TRUE
    GROUP BY pt.tier_id, pt.tier_name, pt.display_order
    ORDER BY pt.display_order;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- TRIGGER: update_updated_at
-- =====================================================
-- Automatically updates updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pricing_tiers_updated_at
    BEFORE UPDATE ON pricing_tiers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tier_selections_updated_at
    BEFORE UPDATE ON tier_selections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_test_variants_updated_at
    BEFORE UPDATE ON ab_test_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE pricing_tiers IS 'Price tier configurations (Budget 90%, Recommended 100%, Premium 115%)';
COMMENT ON TABLE tier_features IS 'Feature descriptions for each pricing tier';
COMMENT ON TABLE price_anchoring_events IS 'Analytics events for price anchoring behavior';
COMMENT ON TABLE tier_selections IS 'Final tier selections tied to transactions';
COMMENT ON TABLE ab_test_variants IS 'A/B test configurations for price anchoring experiments';

COMMENT ON FUNCTION calculate_tier_price IS 'Calculates final price for a tier given base price';
COMMENT ON FUNCTION calculate_savings IS 'Calculates savings amount and percentage vs anchor price';
COMMENT ON FUNCTION get_recommended_tier IS 'Returns recommended tier based on user context';
COMMENT ON FUNCTION get_all_tier_prices IS 'Returns all tiers with calculated prices and features';
COMMENT ON FUNCTION track_tier_selection_event IS 'Helper to track price anchoring analytics events';
COMMENT ON FUNCTION get_tier_analytics IS 'Returns performance analytics for tier selections';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
