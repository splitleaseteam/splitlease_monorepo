-- R22 Agent 4: Add indexes on unindexed foreign key columns
-- These FKs were flagged by Supabase performance advisor

-- booking_lease FKs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_lease_created_by ON public.booking_lease (created_by_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_lease_listing ON public.booking_lease (listing_id);

-- message_thread FKs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_thread_created_by ON public.message_thread (created_by_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_thread_listing ON public.message_thread (listing_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_thread_proposal ON public.message_thread (proposal_id);

-- thread_message FKs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thread_message_created_by ON public.thread_message (created_by_user_id);
