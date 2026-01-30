-- ============================================================================
-- Migration: Performance Indexes
-- Generated: 2026-01-28
-- Purpose: Add missing indexes identified from Edge Function query analysis
-- ============================================================================

-- ============================================================================
-- PROPOSAL TABLE INDEXES
-- These support the most heavily-queried table across Edge Functions
-- ============================================================================

-- Index for guest lookup (proposal creation duplicate check, suggest)
CREATE INDEX IF NOT EXISTS idx_proposal_guest
ON proposal("Guest");

-- Index for listing lookup (proposal creation, suggest)
CREATE INDEX IF NOT EXISTS idx_proposal_listing
ON proposal("Listing");

-- Index for host user lookup (proposal creation, get)
CREATE INDEX IF NOT EXISTS idx_proposal_host_user
ON proposal("Host User");

-- Index for status filtering (suggest, accept, status transitions)
CREATE INDEX IF NOT EXISTS idx_proposal_status
ON proposal("Status");

-- Composite index for duplicate check (Guest + Listing + Deleted)
-- This supports the critical duplicate proposal check in create.ts
CREATE INDEX IF NOT EXISTS idx_proposal_guest_listing_deleted
ON proposal("Guest", "Listing", "Deleted");

-- Composite index for active proposals by status
CREATE INDEX IF NOT EXISTS idx_proposal_status_deleted
ON proposal("Status", "Deleted")
WHERE "Deleted" = false;

-- ============================================================================
-- THREAD TABLE INDEXES
-- These support messaging functionality which is high-traffic
-- ============================================================================

-- Index for host user threads (getThreads query)
CREATE INDEX IF NOT EXISTS idx_thread_host_user
ON thread(host_user_id);

-- Index for guest user threads (getThreads query)
CREATE INDEX IF NOT EXISTS idx_thread_guest_user
ON thread(guest_user_id);

-- Index for listing lookup in threads (findThread)
CREATE INDEX IF NOT EXISTS idx_thread_listing
ON thread("Listing");

-- Index for proposal lookup in threads (findThread)
CREATE INDEX IF NOT EXISTS idx_thread_proposal
ON thread("Proposal");

-- Composite index for sorted host threads
CREATE INDEX IF NOT EXISTS idx_thread_host_modified
ON thread(host_user_id, "Modified Date" DESC NULLS LAST);

-- Composite index for sorted guest threads
CREATE INDEX IF NOT EXISTS idx_thread_guest_modified
ON thread(guest_user_id, "Modified Date" DESC NULLS LAST);

-- ============================================================================
-- _MESSAGE TABLE INDEXES
-- Messages table is one of the largest, needs efficient access patterns
-- ============================================================================

-- Index for thread message lookup (getMessages)
CREATE INDEX IF NOT EXISTS idx_message_thread
ON _message(thread_id);

-- Composite index for paginated messages by thread
CREATE INDEX IF NOT EXISTS idx_message_thread_created
ON _message(thread_id, "Created Date" ASC);

-- GIN index for unread users array contains queries
-- This supports the unread count functionality
CREATE INDEX IF NOT EXISTS idx_message_unread_users
ON _message USING GIN("Unread Users");

-- Index for visibility filtering
CREATE INDEX IF NOT EXISTS idx_message_visible_host
ON _message(thread_id, "is Visible to Host")
WHERE "is Visible to Host" = true;

CREATE INDEX IF NOT EXISTS idx_message_visible_guest
ON _message(thread_id, "is Visible to Guest")
WHERE "is Visible to Guest" = true;

-- ============================================================================
-- LISTING TABLE INDEXES
-- Listings are queried in search, suggest, and proposal flows
-- ============================================================================

-- Index for host user lookup
CREATE INDEX IF NOT EXISTS idx_listing_host_user
ON listing("Host User");

-- Index for active listings
CREATE INDEX IF NOT EXISTS idx_listing_active
ON listing("Active")
WHERE "Active" = true;

-- Index for deleted status
CREATE INDEX IF NOT EXISTS idx_listing_deleted
ON listing("Deleted")
WHERE "Deleted" = false OR "Deleted" IS NULL;

-- Index for borough filtering (search, quick-match)
CREATE INDEX IF NOT EXISTS idx_listing_borough
ON listing("Location - Borough");

-- Composite index for active listing search
CREATE INDEX IF NOT EXISTS idx_listing_active_deleted_borough
ON listing("Active", "Deleted", "Location - Borough")
WHERE "Active" = true AND ("Deleted" = false OR "Deleted" IS NULL);

-- Index for Is Live status
CREATE INDEX IF NOT EXISTS idx_listing_is_live
ON listing("Is Live")
WHERE "Is Live" = true;

-- ============================================================================
-- USER TABLE INDEXES
-- Users are looked up in almost every authenticated request
-- ============================================================================

-- Index for email lookup (authentication, legacy auth)
CREATE INDEX IF NOT EXISTS idx_user_email
ON "user"(lower(email));

-- Index for auth_user_id (Supabase Auth UUID mapping)
CREATE INDEX IF NOT EXISTS idx_user_auth_user_id
ON "user"(auth_user_id);

-- Index for admin status check
CREATE INDEX IF NOT EXISTS idx_user_admin
ON "user"(admin)
WHERE admin = true;

-- ============================================================================
-- SYNC_QUEUE TABLE INDEXES
-- Queue processing needs efficient status-based queries
-- ============================================================================

-- Index for pending items (primary queue processing query)
CREATE INDEX IF NOT EXISTS idx_sync_queue_status
ON sync_queue(status);

-- Composite index for queue processing order
CREATE INDEX IF NOT EXISTS idx_sync_queue_status_created
ON sync_queue(status, created_at ASC);

-- Index for retry items
CREATE INDEX IF NOT EXISTS idx_sync_queue_failed_retry
ON sync_queue(status, next_retry_at)
WHERE status = 'failed' AND next_retry_at IS NOT NULL;

-- Index for table name filtering
CREATE INDEX IF NOT EXISTS idx_sync_queue_table
ON sync_queue(table_name);

-- ============================================================================
-- JUNCTION TABLE INDEXES
-- These support M:M relationship lookups
-- ============================================================================

-- user_proposal junction
CREATE INDEX IF NOT EXISTS idx_user_proposal_user
ON user_proposal(user_id);

CREATE INDEX IF NOT EXISTS idx_user_proposal_proposal
ON user_proposal(proposal_id);

CREATE INDEX IF NOT EXISTS idx_user_proposal_role
ON user_proposal(user_id, role);

-- user_listing_favorite junction
CREATE INDEX IF NOT EXISTS idx_user_listing_favorite_user
ON user_listing_favorite(user_id);

CREATE INDEX IF NOT EXISTS idx_user_listing_favorite_listing
ON user_listing_favorite(listing_id);

-- thread_message junction (if exists)
CREATE INDEX IF NOT EXISTS idx_thread_message_thread
ON thread_message(thread_id);

CREATE INDEX IF NOT EXISTS idx_thread_message_message
ON thread_message(message_id);

-- thread_participant junction (if exists)
CREATE INDEX IF NOT EXISTS idx_thread_participant_thread
ON thread_participant(thread_id);

CREATE INDEX IF NOT EXISTS idx_thread_participant_user
ON thread_participant(user_id);

-- ============================================================================
-- OTHER TABLE INDEXES
-- ============================================================================

-- emergency_report indexes
CREATE INDEX IF NOT EXISTS idx_emergency_report_status
ON emergency_report(status);

CREATE INDEX IF NOT EXISTS idx_emergency_report_created
ON emergency_report(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_emergency_report_assigned
ON emergency_report(assigned_to_user_id);

-- notification_preferences indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user
ON notification_preferences(user_id);

-- visit indexes
CREATE INDEX IF NOT EXISTS idx_visit_listing
ON visit(listing_id);

CREATE INDEX IF NOT EXISTS idx_visit_guest
ON visit(guest_id);

-- housemanual indexes
CREATE INDEX IF NOT EXISTS idx_housemanual_listing
ON housemanual(listing_id);

-- negotiationsummary indexes
CREATE INDEX IF NOT EXISTS idx_negotiationsummary_proposal
ON negotiationsummary("Proposal associated");

CREATE INDEX IF NOT EXISTS idx_negotiationsummary_to_account
ON negotiationsummary("To Account");

-- os_messaging_cta indexes (CTA lookup table)
CREATE INDEX IF NOT EXISTS idx_os_messaging_cta_status_role
ON os_messaging_cta("Proposal Status", role);

-- zat_geo tables (lookup tables for location data)
CREATE INDEX IF NOT EXISTS idx_geo_borough_display
ON zat_geo_borough_toplevel("Display");

CREATE INDEX IF NOT EXISTS idx_geo_hood_display
ON zat_geo_hood_mediumlevel("Display");

CREATE INDEX IF NOT EXISTS idx_geo_hood_borough
ON zat_geo_hood_mediumlevel(borough_id);

-- ============================================================================
-- ANALYZE TABLES
-- Update statistics after creating indexes
-- ============================================================================

ANALYZE proposal;
ANALYZE thread;
ANALYZE _message;
ANALYZE listing;
ANALYZE "user";
ANALYZE sync_queue;
ANALYZE user_proposal;
ANALYZE user_listing_favorite;
ANALYZE emergency_report;
ANALYZE visit;
ANALYZE housemanual;
ANALYZE negotiationsummary;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_proposal_guest_listing_deleted IS
'Supports duplicate proposal check in proposal/actions/create.ts';

COMMENT ON INDEX idx_thread_host_modified IS
'Supports sorted thread list in messages/handlers/getThreads.ts';

COMMENT ON INDEX idx_message_thread_created IS
'Supports paginated message fetch in messages/handlers/getMessages.ts';

COMMENT ON INDEX idx_sync_queue_status_created IS
'Supports queue processing in bubble_sync/handlers/processQueue.ts';
