-- ============================================================================
-- Migration: Create get_host_listings RPC Function
-- Generated: 2026-01-30
-- Updated: 2026-01-31 - Changed from RETURNS SETOF to RETURNS TABLE
--                       to explicitly type pricing_list as text
-- Purpose: Provide an RPC function to fetch listings for a host user
-- Issue: pricing_list contains Bubble IDs (text), not JSON data
-- ============================================================================

-- Drop existing function if it exists (to support re-running migration)
DROP FUNCTION IF EXISTS get_host_listings(TEXT);

-- ============================================================================
-- FUNCTION: get_host_listings
-- Returns all listings where the user is either the Host User or Created By
-- Uses RETURNS TABLE to explicitly control column types
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_host_listings(host_user_id text)
RETURNS TABLE(
  id text,
  _id text,
  "Name" text,
  "Created By" text,
  "Host User" text,
  "Complete" boolean,
  "Location - Borough" text,
  "Location - City" text,
  "Location - State" text,
  "Location - Address" jsonb,
  "Features - Photos" jsonb,
  rental_type text,
  min_nightly numeric,
  rate_2_nights numeric,
  rate_3_nights numeric,
  rate_4_nights numeric,
  rate_5_nights numeric,
  rate_7_nights numeric,
  weekly_rate numeric,
  monthly_rate numeric,
  cleaning_fee numeric,
  damage_deposit numeric,
  pricing_list text,  -- CRITICAL: Must be text, not jsonb (contains Bubble IDs)
  source text,
  bedrooms numeric,
  bathrooms numeric,
  hood text
)
LANGUAGE plpgsql
STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    l._id::TEXT as id,
    l._id,
    l."Name",
    l."Created By",
    l."Host User",
    l."Complete",
    l."Location - Borough",
    l."Location - City",
    l."Location - State",
    l."Location - Address",
    l."Features - Photos",
    l."rental type" as rental_type,
    l."Standarized Minimum Nightly Price (Filter)"::NUMERIC as min_nightly,
    l.nightly_rate_2_nights::NUMERIC as rate_2_nights,
    l.nightly_rate_3_nights::NUMERIC as rate_3_nights,
    l.nightly_rate_4_nights::NUMERIC as rate_4_nights,
    l.nightly_rate_5_nights::NUMERIC as rate_5_nights,
    l.nightly_rate_7_nights::NUMERIC as rate_7_nights,
    l.weekly_host_rate::NUMERIC as weekly_rate,
    l.monthly_host_rate::NUMERIC as monthly_rate,
    l.cleaning_fee::NUMERIC as cleaning_fee,
    l.damage_deposit::NUMERIC as damage_deposit,
    l.pricing_list,  -- Returns as text, no cast needed
    'listing'::TEXT as source,
    l."Features - Qty Bedrooms"::NUMERIC as bedrooms,
    l."Features - Qty Bathrooms"::NUMERIC as bathrooms,
    l."Location - Hood" as hood
  FROM listing l
  WHERE (l."Host User" = host_user_id OR l."Created By" = host_user_id)
    AND l."Deleted" = false;
END;
$function$;

-- Add helpful comment for documentation
COMMENT ON FUNCTION get_host_listings IS
'Returns all listings for a host user. Finds listings where "Host User" = host_user_id OR "Created By" = host_user_id. Excludes deleted listings. Uses RETURNS TABLE with explicit types to prevent pricing_list jsonb cast errors.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_host_listings(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_host_listings(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_host_listings(TEXT) TO service_role;
