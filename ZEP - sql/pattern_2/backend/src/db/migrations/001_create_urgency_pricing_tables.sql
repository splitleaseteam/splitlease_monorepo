-- =====================================================
-- Pattern 2: Urgency Countdown - Database Migrations
-- =====================================================
--
-- Creates tables for storing urgency pricing data
-- Includes:
-- - urgency_pricing_cache (historical pricing records)
-- - market_demand_multipliers (market demand configuration)
-- - event_multipliers (event-based demand spikes)
-- - urgency_pricing_config (system configuration)
--
-- Version: 1.0.0
-- Date: 2026-01-28
-- =====================================================

-- =====================================================
-- Table: urgency_pricing_cache
-- Purpose: Store calculated urgency pricing for analytics and auditing
-- =====================================================

CREATE TABLE IF NOT EXISTS urgency_pricing_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Date information
    target_date TIMESTAMP WITH TIME ZONE NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Time metrics
    days_until_checkin INTEGER NOT NULL CHECK (days_until_checkin >= 0),
    hours_until_checkin INTEGER NOT NULL CHECK (hours_until_checkin >= 0),

    -- Pricing data
    current_price DECIMAL(10, 2) NOT NULL CHECK (current_price >= 0),
    current_multiplier DECIMAL(6, 2) NOT NULL CHECK (current_multiplier >= 1.0),
    base_price DECIMAL(10, 2) NOT NULL CHECK (base_price > 0),
    market_adjusted_base DECIMAL(10, 2) NOT NULL CHECK (market_adjusted_base >= 0),
    urgency_premium DECIMAL(10, 2) NOT NULL,

    -- Urgency classification
    urgency_level VARCHAR(20) NOT NULL CHECK (urgency_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

    -- Rate metrics
    increase_rate_per_day DECIMAL(10, 2) NOT NULL,
    increase_rate_per_hour DECIMAL(10, 2) NOT NULL,
    peak_price DECIMAL(10, 2) NOT NULL CHECK (peak_price >= 0),

    -- Calculation parameters
    urgency_steepness DECIMAL(4, 2) NOT NULL CHECK (urgency_steepness > 0),
    market_demand_multiplier DECIMAL(6, 2) NOT NULL CHECK (market_demand_multiplier > 0),
    lookback_window INTEGER DEFAULT 90 CHECK (lookback_window > 0),

    -- Transaction context (optional)
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('buyout', 'crash', 'swap')),

    -- Price projections (stored as JSON)
    projections JSONB,

    -- Cache metadata
    cache_key VARCHAR(255) NOT NULL,
    cache_hit_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Indexes for common queries
    CONSTRAINT unique_cache_key UNIQUE (cache_key)
);

-- Index for date-based queries
CREATE INDEX idx_urgency_pricing_target_date ON urgency_pricing_cache(target_date);

-- Index for urgency level queries
CREATE INDEX idx_urgency_pricing_level ON urgency_pricing_cache(urgency_level);

-- Index for analytics queries (calculated_at)
CREATE INDEX idx_urgency_pricing_calculated_at ON urgency_pricing_cache(calculated_at);

-- Index for cache lookup
CREATE INDEX idx_urgency_pricing_cache_key ON urgency_pricing_cache(cache_key);

-- Index for expiration cleanup
CREATE INDEX idx_urgency_pricing_expires_at ON urgency_pricing_cache(expires_at) WHERE expires_at > NOW();

-- Composite index for common query patterns
CREATE INDEX idx_urgency_pricing_date_level ON urgency_pricing_cache(target_date, urgency_level);


-- =====================================================
-- Table: market_demand_multipliers
-- Purpose: Store market demand configuration by date
-- =====================================================

CREATE TABLE IF NOT EXISTS market_demand_multipliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Date and location
    date DATE NOT NULL,
    city VARCHAR(100) NOT NULL,

    -- Multiplier breakdown
    base_multiplier DECIMAL(4, 2) NOT NULL DEFAULT 1.0 CHECK (base_multiplier > 0),
    day_of_week_multiplier DECIMAL(4, 2) NOT NULL DEFAULT 1.0 CHECK (day_of_week_multiplier > 0),
    seasonal_multiplier DECIMAL(4, 2) NOT NULL DEFAULT 1.0 CHECK (seasonal_multiplier > 0),
    event_multiplier DECIMAL(4, 2) NOT NULL DEFAULT 1.0 CHECK (event_multiplier >= 1.0),

    -- Total multiplier (computed)
    total_multiplier DECIMAL(6, 2) NOT NULL CHECK (total_multiplier > 0),

    -- Metadata
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Unique constraint per date/city
    CONSTRAINT unique_demand_date_city UNIQUE (date, city)
);

-- Index for date-based queries
CREATE INDEX idx_market_demand_date ON market_demand_multipliers(date);

-- Index for city-based queries
CREATE INDEX idx_market_demand_city ON market_demand_multipliers(city);

-- Index for high-demand dates
CREATE INDEX idx_market_demand_high ON market_demand_multipliers(total_multiplier DESC) WHERE total_multiplier > 2.0;


-- =====================================================
-- Table: event_multipliers
-- Purpose: Store event-based demand spikes
-- =====================================================

CREATE TABLE IF NOT EXISTS event_multipliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Event identification
    event_id VARCHAR(255) NOT NULL UNIQUE,
    event_name VARCHAR(255) NOT NULL,

    -- Event timing
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Demand multiplier
    multiplier DECIMAL(4, 2) NOT NULL CHECK (multiplier >= 1.0),

    -- Event classification
    impact_level VARCHAR(20) CHECK (impact_level IN ('high', 'medium', 'low')),

    -- Affected locations
    cities TEXT[] NOT NULL,

    -- Event description
    description TEXT,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Validation
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Index for event ID lookup
CREATE INDEX idx_event_multipliers_event_id ON event_multipliers(event_id);

-- Index for date range queries
CREATE INDEX idx_event_multipliers_dates ON event_multipliers(start_date, end_date);

-- Index for active events
CREATE INDEX idx_event_multipliers_active ON event_multipliers(is_active) WHERE is_active = TRUE;

-- GIN index for city array queries
CREATE INDEX idx_event_multipliers_cities ON event_multipliers USING GIN (cities);


-- =====================================================
-- Table: urgency_pricing_config
-- Purpose: Store system-wide urgency pricing configuration
-- =====================================================

CREATE TABLE IF NOT EXISTS urgency_pricing_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Configuration key
    config_key VARCHAR(100) NOT NULL UNIQUE,

    -- Configuration value (stored as JSON for flexibility)
    config_value JSONB NOT NULL,

    -- Description
    description TEXT,

    -- Version control
    version INTEGER NOT NULL DEFAULT 1,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Index for config key lookup
CREATE INDEX idx_urgency_config_key ON urgency_pricing_config(config_key);

-- Index for active configs
CREATE INDEX idx_urgency_config_active ON urgency_pricing_config(is_active) WHERE is_active = TRUE;


-- =====================================================
-- Insert default configuration
-- =====================================================

INSERT INTO urgency_pricing_config (config_key, config_value, description) VALUES
(
    'default_urgency_steepness',
    '2.0',
    'Default urgency steepness parameter (from simulation)'
),
(
    'default_lookback_window',
    '90',
    'Default lookback window in days'
),
(
    'urgency_thresholds',
    '{"critical": 3, "high": 7, "medium": 14}',
    'Urgency level thresholds in days'
),
(
    'cache_ttl_seconds',
    '{"CRITICAL": 300, "HIGH": 900, "MEDIUM": 3600, "LOW": 21600}',
    'Cache TTL by urgency level (seconds)'
),
(
    'update_intervals_ms',
    '{"CRITICAL": 60000, "HIGH": 900000, "MEDIUM": 3600000, "LOW": 21600000}',
    'Update intervals by urgency level (milliseconds)'
),
(
    'day_of_week_multipliers_urban',
    '{"monday": 1.25, "tuesday": 1.25, "wednesday": 1.25, "thursday": 1.25, "friday": 1.10, "saturday": 0.80, "sunday": 0.80}',
    'Urban day-of-week multipliers (weekday premium)'
),
(
    'day_of_week_multipliers_resort',
    '{"monday": 0.70, "tuesday": 0.70, "wednesday": 0.70, "thursday": 0.70, "friday": 1.00, "saturday": 1.40, "sunday": 1.40}',
    'Resort day-of-week multipliers (weekend premium)'
),
(
    'seasonal_multipliers',
    '{"0": 0.9, "1": 0.9, "2": 1.0, "3": 1.1, "4": 1.1, "5": 1.2, "6": 1.2, "7": 1.2, "8": 1.1, "9": 1.1, "10": 1.0, "11": 1.3}',
    'Seasonal multipliers by month (0=January, 11=December)'
)
ON CONFLICT (config_key) DO NOTHING;


-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for urgency_pricing_cache
CREATE TRIGGER update_urgency_pricing_cache_updated_at
    BEFORE UPDATE ON urgency_pricing_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for market_demand_multipliers
CREATE TRIGGER update_market_demand_updated_at
    BEFORE UPDATE ON market_demand_multipliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for event_multipliers
CREATE TRIGGER update_event_multipliers_updated_at
    BEFORE UPDATE ON event_multipliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for urgency_pricing_config
CREATE TRIGGER update_urgency_config_updated_at
    BEFORE UPDATE ON urgency_pricing_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- Cleanup function for expired cache entries
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_urgency_pricing()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM urgency_pricing_cache
    WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create index for cleanup function
CREATE INDEX IF NOT EXISTS idx_urgency_pricing_cleanup
ON urgency_pricing_cache(expires_at)
WHERE expires_at < NOW();


-- =====================================================
-- Views for analytics
-- =====================================================

-- View: Active pricing by urgency level
CREATE OR REPLACE VIEW active_urgency_pricing_by_level AS
SELECT
    urgency_level,
    COUNT(*) as count,
    AVG(current_price) as avg_price,
    MIN(current_price) as min_price,
    MAX(current_price) as max_price,
    AVG(current_multiplier) as avg_multiplier,
    AVG(days_until_checkin) as avg_days_out
FROM urgency_pricing_cache
WHERE expires_at > NOW()
GROUP BY urgency_level;

-- View: High-demand dates
CREATE OR REPLACE VIEW high_demand_dates AS
SELECT
    date,
    city,
    total_multiplier,
    event_multiplier,
    day_of_week_multiplier,
    seasonal_multiplier
FROM market_demand_multipliers
WHERE total_multiplier > 1.5
ORDER BY total_multiplier DESC, date;

-- View: Active events
CREATE OR REPLACE VIEW active_events AS
SELECT
    event_id,
    event_name,
    start_date,
    end_date,
    multiplier,
    impact_level,
    cities
FROM event_multipliers
WHERE is_active = TRUE
  AND end_date >= NOW()
ORDER BY start_date;


-- =====================================================
-- Grants (adjust based on your user roles)
-- =====================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON urgency_pricing_cache TO urgency_api_user;
-- GRANT SELECT, INSERT, UPDATE ON market_demand_multipliers TO urgency_api_user;
-- GRANT SELECT, INSERT, UPDATE ON event_multipliers TO urgency_api_user;
-- GRANT SELECT ON urgency_pricing_config TO urgency_api_user;

-- GRANT EXECUTE ON FUNCTION cleanup_expired_urgency_pricing() TO urgency_cleanup_job;


-- =====================================================
-- End of migration
-- =====================================================
