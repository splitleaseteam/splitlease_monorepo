-- ============================================================================
-- Migration: Materialized Views for Aggregations
-- Generated: 2026-01-28
-- Purpose: Create materialized views for common dashboard aggregations
-- ============================================================================

-- ============================================================================
-- MATERIALIZED VIEW: sync_queue_stats
-- Pre-computed statistics for sync queue dashboard
-- Refresh: Every 5 minutes via cron or on-demand
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_sync_queue_stats AS
WITH hourly_stats AS (
  SELECT
    table_name,
    status,
    COUNT(*) as count,
    date_trunc('hour', created_at) as hour_bucket
  FROM sync_queue
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY table_name, status, date_trunc('hour', created_at)
),
current_counts AS (
  SELECT
    table_name,
    status,
    COUNT(*) as count
  FROM sync_queue
  GROUP BY table_name, status
)
SELECT
  COALESCE(cc.table_name, hs.table_name) as table_name,
  COALESCE(cc.status, hs.status) as status,
  COALESCE(cc.count, 0) as current_count,
  COALESCE(
    SUM(CASE WHEN hs.status = 'completed' THEN hs.count ELSE 0 END),
    0
  ) as completed_last_24h,
  COALESCE(
    SUM(CASE WHEN hs.status = 'failed' THEN hs.count ELSE 0 END),
    0
  ) as failed_last_24h,
  NOW() as computed_at
FROM current_counts cc
FULL OUTER JOIN hourly_stats hs ON cc.table_name = hs.table_name AND cc.status = hs.status
GROUP BY COALESCE(cc.table_name, hs.table_name), COALESCE(cc.status, hs.status), cc.count;

CREATE UNIQUE INDEX ON mv_sync_queue_stats(table_name, status);

COMMENT ON MATERIALIZED VIEW mv_sync_queue_stats IS
'Pre-computed sync queue statistics - refresh every 5 minutes';

-- ============================================================================
-- MATERIALIZED VIEW: proposal_status_summary
-- Dashboard widget for proposal status distribution
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_proposal_status_summary AS
SELECT
  "Status" as status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE "Created Date" >= NOW() - INTERVAL '7 days') as created_last_7_days,
  COUNT(*) FILTER (WHERE "Created Date" >= NOW() - INTERVAL '30 days') as created_last_30_days,
  NOW() as computed_at
FROM proposal
WHERE "Deleted" = false OR "Deleted" IS NULL
GROUP BY "Status"
ORDER BY count DESC;

CREATE UNIQUE INDEX ON mv_proposal_status_summary(status);

COMMENT ON MATERIALIZED VIEW mv_proposal_status_summary IS
'Proposal status distribution for dashboard widgets';

-- ============================================================================
-- MATERIALIZED VIEW: listing_statistics
-- Overview statistics for listings
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_listing_statistics AS
SELECT
  COUNT(*) FILTER (WHERE "Active" = true) as active_listings,
  COUNT(*) FILTER (WHERE "Is Live" = true) as live_listings,
  COUNT(*) FILTER (WHERE "Active" = true AND "Location - Borough" IS NOT NULL) as listings_with_borough,
  COUNT(DISTINCT "Host User") as unique_hosts,
  COUNT(*) FILTER (WHERE "Created Date" >= NOW() - INTERVAL '7 days') as created_last_7_days,
  COUNT(*) FILTER (WHERE "Created Date" >= NOW() - INTERVAL '30 days') as created_last_30_days,
  AVG("💰Nightly Host Rate for 4 nights") FILTER (WHERE "💰Nightly Host Rate for 4 nights" > 0) as avg_nightly_rate,
  NOW() as computed_at
FROM listing
WHERE "Deleted" = false OR "Deleted" IS NULL;

COMMENT ON MATERIALIZED VIEW mv_listing_statistics IS
'Aggregate listing statistics for admin dashboard';

-- ============================================================================
-- MATERIALIZED VIEW: user_activity_summary
-- User engagement metrics
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_activity_summary AS
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE "Type - User Current" LIKE '%Host%') as host_users,
  COUNT(*) FILTER (WHERE "Type - User Current" LIKE '%Guest%') as guest_users,
  COUNT(*) FILTER (WHERE "Created Date" >= NOW() - INTERVAL '7 days') as new_users_7_days,
  COUNT(*) FILTER (WHERE "Created Date" >= NOW() - INTERVAL '30 days') as new_users_30_days,
  COUNT(*) FILTER (WHERE "identity_verified" = true) as verified_users,
  COUNT(*) FILTER (WHERE admin = true) as admin_users,
  NOW() as computed_at
FROM "user";

COMMENT ON MATERIALIZED VIEW mv_user_activity_summary IS
'User activity summary for admin dashboard';

-- ============================================================================
-- MATERIALIZED VIEW: messaging_activity
-- Message and thread activity metrics
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_messaging_activity AS
WITH thread_activity AS (
  SELECT
    COUNT(*) as total_threads,
    COUNT(*) FILTER (WHERE "Created Date" >= NOW() - INTERVAL '7 days') as threads_7_days,
    COUNT(*) FILTER (WHERE "Created Date" >= NOW() - INTERVAL '30 days') as threads_30_days
  FROM thread
),
message_activity AS (
  SELECT
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE "Created Date" >= NOW() - INTERVAL '7 days') as messages_7_days,
    COUNT(*) FILTER (WHERE "Created Date" >= NOW() - INTERVAL '30 days') as messages_30_days,
    COUNT(*) FILTER (WHERE "is Split Bot" = true) as splitbot_messages
  FROM _message
),
unread_stats AS (
  SELECT
    COUNT(*) as messages_with_unread
  FROM _message
  WHERE "Unread Users" IS NOT NULL
    AND jsonb_array_length("Unread Users") > 0
)
SELECT
  ta.total_threads,
  ta.threads_7_days,
  ta.threads_30_days,
  ma.total_messages,
  ma.messages_7_days,
  ma.messages_30_days,
  ma.splitbot_messages,
  us.messages_with_unread,
  NOW() as computed_at
FROM thread_activity ta
CROSS JOIN message_activity ma
CROSS JOIN unread_stats us;

COMMENT ON MATERIALIZED VIEW mv_messaging_activity IS
'Messaging activity metrics for admin dashboard';

-- ============================================================================
-- MATERIALIZED VIEW: emergency_report_summary
-- Emergency report statistics
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_emergency_report_summary AS
SELECT
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7_days,
  NOW() as computed_at
FROM emergency_report
WHERE is_hidden = false OR is_hidden IS NULL
GROUP BY status
ORDER BY count DESC;

CREATE UNIQUE INDEX ON mv_emergency_report_summary(status);

COMMENT ON MATERIALIZED VIEW mv_emergency_report_summary IS
'Emergency report status summary for admin dashboard';

-- ============================================================================
-- MATERIALIZED VIEW: borough_listing_distribution
-- Geographic distribution of listings
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_borough_listing_distribution AS
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
LEFT JOIN zat_geo_borough_toplevel b ON l."Location - Borough" = b._id
WHERE (l."Deleted" = false OR l."Deleted" IS NULL)
  AND l."Location - Borough" IS NOT NULL
GROUP BY l."Location - Borough", b."Display"
ORDER BY listing_count DESC;

CREATE UNIQUE INDEX ON mv_borough_listing_distribution(borough_id);

COMMENT ON MATERIALIZED VIEW mv_borough_listing_distribution IS
'Listing distribution by borough for admin analytics';

-- ============================================================================
-- FUNCTION: refresh_all_materialized_views
-- Utility function to refresh all materialized views
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS TABLE(view_name TEXT, refresh_time INTERVAL)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_time TIMESTAMPTZ;
  end_time TIMESTAMPTZ;
BEGIN
  -- Refresh sync queue stats
  start_time := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sync_queue_stats;
  end_time := clock_timestamp();
  view_name := 'mv_sync_queue_stats';
  refresh_time := end_time - start_time;
  RETURN NEXT;

  -- Refresh proposal status summary
  start_time := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_proposal_status_summary;
  end_time := clock_timestamp();
  view_name := 'mv_proposal_status_summary';
  refresh_time := end_time - start_time;
  RETURN NEXT;

  -- Refresh listing statistics
  start_time := clock_timestamp();
  REFRESH MATERIALIZED VIEW mv_listing_statistics;
  end_time := clock_timestamp();
  view_name := 'mv_listing_statistics';
  refresh_time := end_time - start_time;
  RETURN NEXT;

  -- Refresh user activity
  start_time := clock_timestamp();
  REFRESH MATERIALIZED VIEW mv_user_activity_summary;
  end_time := clock_timestamp();
  view_name := 'mv_user_activity_summary';
  refresh_time := end_time - start_time;
  RETURN NEXT;

  -- Refresh messaging activity
  start_time := clock_timestamp();
  REFRESH MATERIALIZED VIEW mv_messaging_activity;
  end_time := clock_timestamp();
  view_name := 'mv_messaging_activity';
  refresh_time := end_time - start_time;
  RETURN NEXT;

  -- Refresh emergency report summary
  start_time := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_emergency_report_summary;
  end_time := clock_timestamp();
  view_name := 'mv_emergency_report_summary';
  refresh_time := end_time - start_time;
  RETURN NEXT;

  -- Refresh borough distribution
  start_time := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_borough_listing_distribution;
  end_time := clock_timestamp();
  view_name := 'mv_borough_listing_distribution';
  refresh_time := end_time - start_time;
  RETURN NEXT;
END;
$$;

COMMENT ON FUNCTION refresh_all_materialized_views IS
'Refreshes all materialized views and returns timing information';

-- ============================================================================
-- CRON SCHEDULING (requires pg_cron extension)
-- Uncomment if pg_cron is available
-- ============================================================================

-- Schedule materialized view refresh every 15 minutes
-- SELECT cron.schedule(
--   'refresh-materialized-views',
--   '*/15 * * * *',
--   $$SELECT refresh_all_materialized_views();$$
-- );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON mv_sync_queue_stats TO authenticated;
GRANT SELECT ON mv_proposal_status_summary TO authenticated;
GRANT SELECT ON mv_listing_statistics TO authenticated;
GRANT SELECT ON mv_user_activity_summary TO authenticated;
GRANT SELECT ON mv_messaging_activity TO authenticated;
GRANT SELECT ON mv_emergency_report_summary TO authenticated;
GRANT SELECT ON mv_borough_listing_distribution TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_materialized_views TO service_role;
