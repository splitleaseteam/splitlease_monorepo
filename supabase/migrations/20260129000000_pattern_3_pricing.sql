-- Migration: Pattern 3 - Price Anchoring
-- Split Lease Platform
-- Date: 2026-01-29
--
-- Adds pricing tier tracking to date change requests for the Price Anchoring pattern.
-- Users can select budget, recommended, or premium pricing tiers.

-- ============================================================================
-- ADD SELECTED_TIER COLUMN TO DATE CHANGE REQUESTS
-- ============================================================================
-- Tracks which pricing tier the user selected when submitting a date change request

ALTER TABLE datechangerequest
ADD COLUMN IF NOT EXISTS selected_tier TEXT
  CHECK (selected_tier IN ('budget', 'recommended', 'premium'))
  DEFAULT 'recommended';

-- Add tier price snapshot (in cents) to preserve pricing at request time
ALTER TABLE datechangerequest
ADD COLUMN IF NOT EXISTS tier_price_cents INTEGER;

-- Add anchor savings amount (savings vs current buyout price)
ALTER TABLE datechangerequest
ADD COLUMN IF NOT EXISTS anchor_savings_cents INTEGER;

-- ============================================================================
-- PRICING TIERS AUDIT TABLE
-- ============================================================================
-- Tracks pricing tier selections for analytics and A/B testing

CREATE TABLE IF NOT EXISTS pricing_tier_selection (
  _id TEXT PRIMARY KEY DEFAULT generate_bubble_id(),

  -- References
  date_change_request_id TEXT REFERENCES datechangerequest(_id),
  user_id TEXT REFERENCES "user"(_id),
  lease_id TEXT REFERENCES bookings_leases(_id),

  -- Tier Data
  selected_tier TEXT NOT NULL CHECK (selected_tier IN ('budget', 'recommended', 'premium')),
  base_price_cents INTEGER NOT NULL,
  tier_price_cents INTEGER NOT NULL,
  tier_multiplier NUMERIC(4,2) NOT NULL,
  anchor_savings_cents INTEGER,

  -- Context
  current_buyout_price_cents INTEGER,
  urgency_multiplier NUMERIC(4,2),

  -- Analytics
  tiers_viewed TEXT[], -- Array of tier IDs user viewed before selecting
  time_to_selection_ms INTEGER, -- Time spent viewing tiers

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Bubble Sync Fields
  bubble_id TEXT,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  bubble_sync_error TEXT
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_pricing_tier_selection_user ON pricing_tier_selection(user_id);
CREATE INDEX IF NOT EXISTS idx_pricing_tier_selection_lease ON pricing_tier_selection(lease_id);
CREATE INDEX IF NOT EXISTS idx_pricing_tier_selection_tier ON pricing_tier_selection(selected_tier);
CREATE INDEX IF NOT EXISTS idx_pricing_tier_selection_created ON pricing_tier_selection(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE pricing_tier_selection ENABLE ROW LEVEL SECURITY;

-- Users can read their own tier selections
CREATE POLICY "Users can read their own tier selections"
  ON pricing_tier_selection FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can insert their own tier selections
CREATE POLICY "Users can insert their own tier selections"
  ON pricing_tier_selection FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN datechangerequest.selected_tier IS 'Pricing tier selected: budget (0.9x), recommended (1.0x), or premium (1.15x)';
COMMENT ON COLUMN datechangerequest.tier_price_cents IS 'Price snapshot in cents at time of request';
COMMENT ON COLUMN datechangerequest.anchor_savings_cents IS 'Savings vs current buyout price in cents';
COMMENT ON TABLE pricing_tier_selection IS 'Audit log for pricing tier selections (Pattern 3: Price Anchoring)';
