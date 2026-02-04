-- ============================================================================
-- Migration: Add scalar pricing fields to existing pricing_list table
-- Created: 2026-01-28
-- Purpose: Extend pricing_list with missing scalar fields from Bubble system
-- ============================================================================

-- Add scalar pricing fields to existing pricing_list table
ALTER TABLE pricing_list
  ADD COLUMN IF NOT EXISTS "Unit Markup" DECIMAL(5,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "Overall Site Markup" DECIMAL(5,4) DEFAULT 0.17,
  ADD COLUMN IF NOT EXISTS "Combined Markup" DECIMAL(5,4) DEFAULT 0.17,
  ADD COLUMN IF NOT EXISTS "Full Time Discount" DECIMAL(5,4) DEFAULT 0.13,
  ADD COLUMN IF NOT EXISTS "Starting Nightly Price" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "Slope" DECIMAL(10,4),
  ADD COLUMN IF NOT EXISTS "Weekly Price Adjust" DECIMAL(10,4);

-- Add metadata fields if missing
ALTER TABLE pricing_list
  ADD COLUMN IF NOT EXISTS "rental type" VARCHAR(20) DEFAULT 'Nightly',
  ADD COLUMN IF NOT EXISTS "Number Selected Nights" JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "Modified Date" TIMESTAMPTZ DEFAULT NOW();

-- Add index for price-based searches
CREATE INDEX IF NOT EXISTS idx_pricing_list_starting_price
  ON pricing_list("Starting Nightly Price");

-- Add index for listing lookup
CREATE INDEX IF NOT EXISTS idx_pricing_list_listing
  ON pricing_list(listing);

-- Comment
COMMENT ON TABLE pricing_list IS 'Pre-calculated pricing arrays and scalars for listings (extends Bubble pricing_list)';

-- Column comments for documentation
COMMENT ON COLUMN pricing_list."Unit Markup" IS 'Individual listing markup percentage (0-1)';
COMMENT ON COLUMN pricing_list."Overall Site Markup" IS 'Site-wide markup percentage, default 0.17 (17%)';
COMMENT ON COLUMN pricing_list."Combined Markup" IS 'Unit Markup + Overall Site Markup combined';
COMMENT ON COLUMN pricing_list."Full Time Discount" IS 'Discount for 7-night stays, default 0.13 (13%)';
COMMENT ON COLUMN pricing_list."Starting Nightly Price" IS 'Minimum nightly price across all tiers (for search/display)';
COMMENT ON COLUMN pricing_list."Slope" IS 'Price decay rate: (price[0] - price[6]) / 6';
COMMENT ON COLUMN pricing_list."Weekly Price Adjust" IS 'Weekly adjustment factor for price calculations';
COMMENT ON COLUMN pricing_list."rental type" IS 'Rental type: Nightly, Monthly, etc.';
COMMENT ON COLUMN pricing_list."Number Selected Nights" IS 'Array of selected night counts for this pricing';
COMMENT ON COLUMN pricing_list."Modified Date" IS 'Last modification timestamp';
