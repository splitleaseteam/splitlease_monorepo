-- Fix get_host_listings function to include bedrooms, bathrooms, and hood columns
DROP FUNCTION IF EXISTS get_host_listings(TEXT);

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
    l."💰Nightly Host Rate for 2 nights"::NUMERIC as rate_2_nights,
    l."💰Nightly Host Rate for 3 nights"::NUMERIC as rate_3_nights,
    l."💰Nightly Host Rate for 4 nights"::NUMERIC as rate_4_nights,
    l."💰Nightly Host Rate for 5 nights"::NUMERIC as rate_5_nights,
    l."💰Nightly Host Rate for 7 nights"::NUMERIC as rate_7_nights,
    l."💰Weekly Host Rate"::NUMERIC as weekly_rate,
    l."💰Monthly Host Rate"::NUMERIC as monthly_rate,
    l."💰Cleaning Cost / Maintenance Fee"::NUMERIC as cleaning_fee,
    l."💰Damage Deposit"::NUMERIC as damage_deposit,
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

GRANT EXECUTE ON FUNCTION get_host_listings(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_host_listings(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_host_listings(TEXT) TO service_role;
