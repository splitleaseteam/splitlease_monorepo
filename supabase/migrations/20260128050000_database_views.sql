-- ============================================================================
-- Migration: Database Views for Query Optimization
-- Generated: 2026-01-28
-- Purpose: Create views to replace N+1 query patterns with efficient JOINs
-- ============================================================================

-- ============================================================================
-- VIEW: thread_summary
-- Replaces: 4 sequential queries in messages/handlers/getThreads.ts
-- ============================================================================

CREATE OR REPLACE VIEW thread_summary AS
SELECT
  t._id,
  t.host_user_id,
  t.guest_user_id,
  t."Listing" as listing_id,
  t."Proposal" as proposal_id,
  t."~Last Message" as last_message_preview,
  t."Modified Date" as modified_date,
  t."Created Date" as created_date,
  -- Listing info
  l."Name" as listing_name,
  -- Host info
  h._id as host_id,
  COALESCE(h."Name - First", '') as host_first_name,
  COALESCE(h."Name - Last", '') as host_last_name,
  TRIM(COALESCE(h."Name - First", '') || ' ' || COALESCE(h."Name - Last", '')) as host_full_name,
  h."Profile Photo" as host_avatar,
  h.email as host_email,
  -- Guest info
  g._id as guest_id,
  COALESCE(g."Name - First", '') as guest_first_name,
  COALESCE(g."Name - Last", '') as guest_last_name,
  TRIM(COALESCE(g."Name - First", '') || ' ' || COALESCE(g."Name - Last", '')) as guest_full_name,
  g."Profile Photo" as guest_avatar,
  g.email as guest_email
FROM thread t
LEFT JOIN listing l ON t."Listing" = l._id
LEFT JOIN "user" h ON t.host_user_id = h._id
LEFT JOIN "user" g ON t.guest_user_id = g._id;

COMMENT ON VIEW thread_summary IS
'Optimized view for getThreads handler - replaces 4 N+1 queries with single JOIN';

-- ============================================================================
-- VIEW: proposal_detail
-- Replaces: 4 sequential queries in proposal/actions/get.ts
-- ============================================================================

CREATE OR REPLACE VIEW proposal_detail AS
SELECT
  p.*,
  -- Listing info
  l._id as listing_id,
  l."Name" as listing_name,
  l."Location - Address" as listing_address,
  l."Location - Borough" as listing_borough,
  l."Location - Hood" as listing_hood,
  l."rental type" as listing_rental_type,
  l."Features - House Rules" as listing_house_rules,
  -- Guest info
  g._id as guest_id,
  g."Name - Full" as guest_full_name,
  g."Name - First" as guest_first_name,
  g."Name - Last" as guest_last_name,
  g.email as guest_email,
  g."Profile Photo" as guest_avatar,
  g."Phone number" as guest_phone,
  -- Host info
  h._id as host_id,
  h."Name - Full" as host_full_name,
  h."Name - First" as host_first_name,
  h."Name - Last" as host_last_name,
  h.email as host_email_fetched,
  h."Profile Photo" as host_avatar,
  h."Phone number" as host_phone
FROM proposal p
LEFT JOIN listing l ON p."Listing" = l._id
LEFT JOIN "user" g ON p."Guest" = g._id
LEFT JOIN "user" h ON p."Host User" = h._id;

COMMENT ON VIEW proposal_detail IS
'Optimized view for proposal get handler - replaces 4 N+1 queries with single JOIN';

-- ============================================================================
-- VIEW: message_thread_context
-- Supports: messages/handlers/getMessages.ts context lookup
-- ============================================================================

CREATE OR REPLACE VIEW message_thread_context AS
SELECT
  t._id as thread_id,
  t.host_user_id,
  t.guest_user_id,
  t."Listing" as listing_id,
  t."Proposal" as proposal_id,
  -- Listing info
  l."Name" as listing_name,
  -- Host contact info
  TRIM(COALESCE(h."Name - First", '') || ' ' || COALESCE(h."Name - Last", '')) as host_name,
  h."Profile Photo" as host_avatar,
  -- Guest contact info
  TRIM(COALESCE(g."Name - First", '') || ' ' || COALESCE(g."Name - Last", '')) as guest_name,
  g."Profile Photo" as guest_avatar,
  -- Proposal status
  p."Status" as proposal_status
FROM thread t
LEFT JOIN listing l ON t."Listing" = l._id
LEFT JOIN "user" h ON t.host_user_id = h._id
LEFT JOIN "user" g ON t.guest_user_id = g._id
LEFT JOIN proposal p ON t."Proposal" = p._id;

COMMENT ON VIEW message_thread_context IS
'Provides thread context for message display without N+1 queries';

-- ============================================================================
-- VIEW: emergency_report_enriched
-- Replaces: 4 batch queries in emergency/handlers/getAll.ts
-- ============================================================================

CREATE OR REPLACE VIEW emergency_report_enriched AS
SELECT
  e.*,
  -- Proposal info
  p._id as proposal_id,
  p."Agreement #" as agreement_number,
  p."Move in range start" as move_in,
  p."Move-out" as move_out,
  -- Listing info (via proposal)
  l._id as listing_id,
  l."Name" as listing_name,
  l."Street address" as listing_street,
  l."City/Town" as listing_city,
  -- Reporter info
  reporter._id as reporter_id,
  reporter.email as reporter_email,
  reporter."Name - First" as reporter_first_name,
  reporter."Name - Last" as reporter_last_name,
  reporter."Phone number" as reporter_phone,
  -- Assignee info
  assignee._id as assignee_id,
  assignee.email as assignee_email,
  assignee."Name - First" as assignee_first_name,
  assignee."Name - Last" as assignee_last_name,
  assignee."Phone number" as assignee_phone
FROM emergency_report e
LEFT JOIN proposal p ON e.proposal_id = p._id
LEFT JOIN listing l ON p."Listing" = l._id
LEFT JOIN "user" reporter ON e.reported_by_user_id = reporter._id
LEFT JOIN "user" assignee ON e.assigned_to_user_id = assignee._id;

COMMENT ON VIEW emergency_report_enriched IS
'Optimized view for emergency dashboard - replaces 4 N+1 batch queries';

-- ============================================================================
-- VIEW: listing_search_view
-- Supports: quick-match and search functionality
-- ============================================================================

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
LEFT JOIN zat_geo_borough_toplevel b ON l."Location - Borough" = b._id
LEFT JOIN zat_geo_hood_mediumlevel hood ON l."Location - Hood" = hood._id
WHERE l."Active" = true
  AND (l."Deleted" = false OR l."Deleted" IS NULL);

COMMENT ON VIEW listing_search_view IS
'Pre-joined listing view for search and quick-match - eliminates 4 batch lookups';

-- ============================================================================
-- VIEW: user_thread_summary
-- For efficient "my threads" lookup with unread counts
-- ============================================================================

CREATE OR REPLACE VIEW user_thread_summary AS
WITH unread_counts AS (
  SELECT
    thread_id,
    COUNT(*) as unread_count
  FROM _message
  WHERE "Unread Users" IS NOT NULL
    AND jsonb_array_length("Unread Users") > 0
  GROUP BY thread_id
)
SELECT
  t._id as thread_id,
  t.host_user_id,
  t.guest_user_id,
  t."Modified Date" as modified_date,
  t."~Last Message" as last_message_preview,
  l."Name" as listing_name,
  COALESCE(uc.unread_count, 0) as total_unread_count
FROM thread t
LEFT JOIN listing l ON t."Listing" = l._id
LEFT JOIN unread_counts uc ON t._id = uc.thread_id;

COMMENT ON VIEW user_thread_summary IS
'Thread summary with pre-computed unread counts';

-- ============================================================================
-- FUNCTION: get_thread_with_unread_for_user
-- Efficient single query for user's threads with their unread count
-- ============================================================================

CREATE OR REPLACE FUNCTION get_threads_for_user(
  p_user_id TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  thread_id TEXT,
  host_user_id TEXT,
  guest_user_id TEXT,
  listing_name TEXT,
  last_message_preview TEXT,
  modified_date TIMESTAMPTZ,
  contact_name TEXT,
  contact_avatar TEXT,
  unread_count BIGINT,
  is_host BOOLEAN
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t._id as thread_id,
    t.host_user_id,
    t.guest_user_id,
    l."Name" as listing_name,
    t."~Last Message" as last_message_preview,
    t."Modified Date" as modified_date,
    CASE
      WHEN t.host_user_id = p_user_id THEN
        TRIM(COALESCE(g."Name - First", '') || ' ' || COALESCE(g."Name - Last", ''))
      ELSE
        TRIM(COALESCE(h."Name - First", '') || ' ' || COALESCE(h."Name - Last", ''))
    END as contact_name,
    CASE
      WHEN t.host_user_id = p_user_id THEN g."Profile Photo"
      ELSE h."Profile Photo"
    END as contact_avatar,
    (
      SELECT COUNT(*)
      FROM _message m
      WHERE m.thread_id = t._id
        AND m."Unread Users" @> jsonb_build_array(p_user_id)
    ) as unread_count,
    (t.host_user_id = p_user_id) as is_host
  FROM thread t
  LEFT JOIN listing l ON t."Listing" = l._id
  LEFT JOIN "user" h ON t.host_user_id = h._id
  LEFT JOIN "user" g ON t.guest_user_id = g._id
  WHERE t.host_user_id = p_user_id
     OR t.guest_user_id = p_user_id
  ORDER BY t."Modified Date" DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION get_threads_for_user IS
'Efficient function to get threads with unread counts for a specific user';

-- ============================================================================
-- FUNCTION: get_proposal_with_relations
-- Single query for proposal with all related data
-- ============================================================================

CREATE OR REPLACE FUNCTION get_proposal_with_relations(p_proposal_id TEXT)
RETURNS TABLE(
  proposal_data JSONB,
  listing_data JSONB,
  guest_data JSONB,
  host_data JSONB
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_jsonb(p.*) as proposal_data,
    jsonb_build_object(
      '_id', l._id,
      'Name', l."Name",
      'Location - Address', l."Location - Address"
    ) as listing_data,
    jsonb_build_object(
      '_id', g._id,
      'Name - Full', g."Name - Full",
      'email', g.email
    ) as guest_data,
    jsonb_build_object(
      '_id', h._id,
      'Name - Full', h."Name - Full",
      'email', h.email
    ) as host_data
  FROM proposal p
  LEFT JOIN listing l ON p."Listing" = l._id
  LEFT JOIN "user" g ON p."Guest" = g._id
  LEFT JOIN "user" h ON p."Host User" = h._id
  WHERE p._id = p_proposal_id;
END;
$$;

COMMENT ON FUNCTION get_proposal_with_relations IS
'Single query replacement for N+1 pattern in proposal/actions/get.ts';

-- ============================================================================
-- GRANT PERMISSIONS
-- Allow authenticated users to access views (RLS still applies to base tables)
-- ============================================================================

GRANT SELECT ON thread_summary TO authenticated;
GRANT SELECT ON proposal_detail TO authenticated;
GRANT SELECT ON message_thread_context TO authenticated;
GRANT SELECT ON emergency_report_enriched TO authenticated;
GRANT SELECT ON listing_search_view TO authenticated;
GRANT SELECT ON user_thread_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_threads_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION get_proposal_with_relations TO authenticated;
