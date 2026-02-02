-- ============================================================
-- Daily Counter Table for Date-Based Agreement Numbers
-- Split Lease - Migration
-- Created: 2026-01-29
-- ============================================================
-- Purpose: Track sequential lease counter per calendar day
-- Format: Agreement numbers like 20260129-0001, 20260129-0002, etc.
-- ============================================================

-- Create the daily_counter table
CREATE TABLE IF NOT EXISTS daily_counter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counter_date DATE NOT NULL UNIQUE,
  last_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE daily_counter IS 'Tracks daily sequential counter for agreement number generation. Resets each day.';
COMMENT ON COLUMN daily_counter.counter_date IS 'The calendar date (YYYY-MM-DD) for this counter';
COMMENT ON COLUMN daily_counter.last_number IS 'The last assigned number for this date (increments with each lease)';

-- Index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_daily_counter_date ON daily_counter(counter_date);

-- Enable RLS (service role only - internal use)
ALTER TABLE daily_counter ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only service role can access
CREATE POLICY "Service role full access" ON daily_counter
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- Atomic Increment Function
-- Prevents race conditions when multiple leases created simultaneously
-- ============================================================
CREATE OR REPLACE FUNCTION increment_daily_counter(target_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number INTEGER;
BEGIN
  -- Atomic UPSERT: Insert new row with 1, or increment existing
  -- Returns the new counter value
  INSERT INTO daily_counter (counter_date, last_number, created_at, modified_at)
  VALUES (target_date, 1, NOW(), NOW())
  ON CONFLICT (counter_date)
  DO UPDATE SET
    last_number = daily_counter.last_number + 1,
    modified_at = NOW()
  RETURNING last_number INTO new_number;

  RETURN new_number;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION increment_daily_counter(DATE) IS 'Atomically increments and returns the daily counter for agreement number generation';

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION increment_daily_counter(DATE) TO service_role;

-- ============================================================
-- Helper Function: Get current counter without incrementing
-- Useful for debugging/monitoring
-- ============================================================
CREATE OR REPLACE FUNCTION get_daily_counter(target_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_number INTEGER;
BEGIN
  SELECT last_number INTO current_number
  FROM daily_counter
  WHERE counter_date = target_date;

  -- Return 0 if no counter exists for this date yet
  RETURN COALESCE(current_number, 0);
END;
$$;

COMMENT ON FUNCTION get_daily_counter(DATE) IS 'Returns current counter value for a date without incrementing (for monitoring)';
GRANT EXECUTE ON FUNCTION get_daily_counter(DATE) TO service_role;
