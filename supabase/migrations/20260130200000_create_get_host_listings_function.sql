-- ============================================================================
-- Migration: Create get_host_listings RPC Function
-- Generated: 2026-01-30
-- Purpose: Provide an RPC function to fetch listings for a host user
-- Issue: PostgREST has issues with .or() filters on columns with special
--        characters (like "Host User" and "Created By")
-- ============================================================================

-- Drop existing function if it exists (to support re-running migration)
DROP FUNCTION IF EXISTS get_host_listings(TEXT);

-- ============================================================================
-- FUNCTION: get_host_listings
-- Returns all listings where the user is either the Host User or Created By
-- This handles the column name special characters that break PostgREST .or()
-- ============================================================================

CREATE OR REPLACE FUNCTION get_host_listings(host_user_id TEXT)
RETURNS SETOF listing
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM listing
  WHERE
    (
      "Host User" = host_user_id
      OR "Created By" = host_user_id
    )
    AND (
      "Deleted" IS NULL
      OR "Deleted" = false
    )
  ORDER BY "Created Date" DESC NULLS LAST;
END;
$$;

-- Add helpful comment for documentation
COMMENT ON FUNCTION get_host_listings IS
'Returns all listings for a host user. Finds listings where "Host User" = host_user_id OR "Created By" = host_user_id. Excludes deleted listings. Used by HostProposalsPage and lease handlers.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_host_listings(TEXT) TO authenticated;

-- Grant execute permission to anon for public access scenarios
GRANT EXECUTE ON FUNCTION get_host_listings(TEXT) TO anon;

-- Grant execute permission to service_role for Edge Functions
GRANT EXECUTE ON FUNCTION get_host_listings(TEXT) TO service_role;
