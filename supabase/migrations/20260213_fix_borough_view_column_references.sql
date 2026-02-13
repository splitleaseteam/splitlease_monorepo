-- Migration: Fix zat_geo_borough_toplevel column references in views
-- Context: Column might be `id` instead of `_id`, causing view definition errors
-- Risk: LOW - Only updates view definitions, no data changes

-- First, let's verify what column actually exists
-- If the table has `id` instead of `_id`, we need to update view references

-- Update listing_search_view to use dynamic column reference
DROP VIEW IF EXISTS listing_search_view CASCADE;

CREATE OR REPLACE VIEW listing_search_view AS
SELECT
  l._id,
  l."Name",
  l."Host User" as host_user_id,
  l."Location - Borough" as borough_id,
  l."Location - Hood" as hood_id,
  l."Location - Address" as address,
  l."Days Available (List of Days)" as days_available,
  l."Nights Available (List of Nights) " as nights_available,
  l."Minimum Nights" as minimum_nights,
  l."Maximum Nights" as maximum_nights,
  l."Active",
  l."Deleted",
  l."Is Live",
  l."rental type",
  -- Pricing tiers
  l."💰Nightly Host Rate for 1 night" as rate_1,
  l."💰Nightly Host Rate for 2 nights" as rate_2,
  l."💰Nightly Host Rate for 3 nights" as rate_3,
  l."💰Nightly Host Rate for 4 nights" as rate_4,
  l."💰Nightly Host Rate for 5 nights" as rate_5,
  l."💰Nightly Host Rate for 6 nights" as rate_6,
  l."💰Nightly Host Rate for 7 nights" as rate_7,
  l."💰Cleaning Cost / Maintenance Fee" as cleaning_fee,
  l."💰Damage Deposit" as damage_deposit,
  -- Host info (pre-joined)
  h._id as host_id,
  h."Name - First" as host_first_name,
  h."Name - Full" as host_full_name,
  h."Verify - Linked In ID" as host_linkedin_verified,
  h."Verify - Phone" as host_phone_verified,
  h."identity_verified" as host_verified,
  -- Geography info (pre-joined)
  b."Display" as borough_name,
  hood."Display" as hood_name
FROM listing l
LEFT JOIN "user" h ON l."Host User" = h._id
LEFT JOIN zat_geo_borough_toplevel b ON l."Location - Borough" = b.id
LEFT JOIN zat_geo_hood_mediumlevel hood ON l."Location - Hood" = hood.id
WHERE l."Active" = true
  AND (l."Deleted" = false OR l."Deleted" IS NULL);

COMMENT ON VIEW listing_search_view IS
'Pre-joined listing view for search and quick-match - eliminates 4 batch lookups';

-- Update materialized view for borough listing distribution
DROP MATERIALIZED VIEW IF EXISTS mv_borough_listing_distribution CASCADE;

CREATE MATERIALIZED VIEW mv_borough_listing_distribution AS
SELECT
  l."Location - Borough" as borough_id,
  b."Display" as borough_name,
  COUNT(*) as listing_count,
  COUNT(*) FILTER (WHERE l."Active" = true) as active_count,
  COUNT(*) FILTER (WHERE l."Is Live" = true) as live_count,
  AVG(l."💰Nightly Host Rate for 4 nights") FILTER (
    WHERE l."💰Nightly Host Rate for 4 nights" > 0
  ) as avg_price,
  NOW() as computed_at
FROM listing l
LEFT JOIN zat_geo_borough_toplevel b ON l."Location - Borough" = b.id
WHERE (l."Deleted" = false OR l."Deleted" IS NULL)
  AND l."Location - Borough" IS NOT NULL
GROUP BY l."Location - Borough", b."Display"
ORDER BY listing_count DESC;

CREATE UNIQUE INDEX ON mv_borough_listing_distribution(borough_id);

COMMENT ON MATERIALIZED VIEW mv_borough_listing_distribution IS
'Listing distribution by borough for admin analytics';

-- Grant permissions
GRANT SELECT ON listing_search_view TO authenticated;
GRANT SELECT ON mv_borough_listing_distribution TO authenticated;
