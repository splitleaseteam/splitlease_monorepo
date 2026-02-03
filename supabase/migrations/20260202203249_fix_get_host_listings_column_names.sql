-- ============================================================================
-- Migration: Fix get_host_listings column names
-- Generated: 2026-02-02
-- Purpose: Fix column names to use actual snake_case columns instead of emoji columns
-- Issue: Previous version referenced non-existent emoji columns like "💰Nightly Host Rate for 2 nights"
--        Actual columns are: nightly_rate_2_nights, weekly_host_rate, etc.
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS get_host_listings(TEXT);

-- Recreate with correct column names
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
  pricing_list text,
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
    l.pricing_list,
    'listing'::TEXT as source,
    l."Features - Qty Bedrooms"::NUMERIC as bedrooms,
    l."Features - Qty Bathrooms"::NUMERIC as bathrooms,
    l."Location - Hood" as hood
  FROM listing l
  WHERE (l."Host User" = host_user_id OR l."Created By" = host_user_id)
    AND l."Deleted" = false;
END;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_host_listings(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_host_listings(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_host_listings(TEXT) TO service_role;

-- Add documentation
COMMENT ON FUNCTION get_host_listings IS
'Returns all listings for a host user. Uses RETURNS TABLE with explicit types. Fixed 2026-02-02 to use correct snake_case column names.';
