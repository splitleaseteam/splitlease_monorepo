-- ============================================================================
-- Remove All Cron Jobs
-- Split Lease - Cron Job Cleanup
-- Created: 2026-01-24
--
-- This migration removes ALL pg_cron jobs from the database.
-- It reverses the following migrations:
-- - 20251210_queue_processing_cron.sql (bubble sync queue processing)
-- - 20260109_throttle_restore_cron.sql (throttle ability restoration)
-- - 20251213_workflow_cron_backup.sql (workflow orchestrator backup)
-- ============================================================================

-- ============================================================================
-- UNSCHEDULE: Bubble Sync Queue Cron Jobs
-- ============================================================================

-- Remove queue processing job (every minute)
SELECT cron.unschedule('process-bubble-sync-queue')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-bubble-sync-queue'
);

-- Remove cleanup job (daily at 3 AM)
SELECT cron.unschedule('cleanup-sync-queue')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-sync-queue'
);

-- Log removal
DO $$
BEGIN
  RAISE LOG 'Cron jobs removed: process-bubble-sync-queue, cleanup-sync-queue';
END $$;

-- ============================================================================
-- UNSCHEDULE: Throttle Restore Cron Job
-- ============================================================================

-- Remove throttle restore job (every hour)
SELECT cron.unschedule('restore-throttle-abilities')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'restore-throttle-abilities'
);

-- Log removal
DO $$
BEGIN
  RAISE LOG 'Cron job removed: restore-throttle-abilities';
END $$;

-- ============================================================================
-- UNSCHEDULE: Workflow Orchestrator Cron Jobs
-- ============================================================================

-- Remove workflow orchestrator backup job (every 30 seconds)
SELECT cron.unschedule('workflow-orchestrator-backup')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'workflow-orchestrator-backup'
);

-- Remove workflow DLQ cleanup job (every 5 minutes)
SELECT cron.unschedule('workflow-dlq-cleanup')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'workflow-dlq-cleanup'
);

-- Log removal
DO $$
BEGIN
  RAISE LOG 'Cron jobs removed: workflow-orchestrator-backup, workflow-dlq-cleanup';
END $$;

-- ============================================================================
-- DROP FUNCTIONS (Optional - removes unused functions)
-- ============================================================================

-- Drop bubble sync functions
DROP FUNCTION IF EXISTS trigger_bubble_sync_queue() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_queue_items() CASCADE;
DROP FUNCTION IF EXISTS notify_new_queue_item() CASCADE;

-- Drop throttle restore function
DROP FUNCTION IF EXISTS restore_expired_throttle_blocks() CASCADE;

-- Drop workflow cron functions
DROP FUNCTION IF EXISTS trigger_workflow_cron() CASCADE;
DROP FUNCTION IF EXISTS move_failed_workflows_to_dlq() CASCADE;

-- ============================================================================
-- DROP TRIGGERS (Optional - removes triggers associated with cron)
-- ============================================================================

-- Drop sync_queue insert trigger
DROP TRIGGER IF EXISTS sync_queue_insert_trigger ON sync_queue;

-- ============================================================================
-- DROP VIEW (Optional - removes monitoring view)
-- ============================================================================

-- Drop sync queue status view
DROP VIEW IF EXISTS sync_queue_status;

-- ============================================================================
-- CONFIRMATION
-- ============================================================================

DO $$
BEGIN
  RAISE LOG '============================================================';
  RAISE LOG 'ALL CRON JOBS REMOVED SUCCESSFULLY';
  RAISE LOG '============================================================';
  RAISE LOG 'Removed cron jobs:';
  RAISE LOG '  - process-bubble-sync-queue (was: every minute)';
  RAISE LOG '  - cleanup-sync-queue (was: daily at 3 AM)';
  RAISE LOG '  - restore-throttle-abilities (was: every hour)';
  RAISE LOG '  - workflow-orchestrator-backup (was: every 30 seconds)';
  RAISE LOG '  - workflow-dlq-cleanup (was: every 5 minutes)';
  RAISE LOG '============================================================';
  RAISE LOG 'Dropped functions:';
  RAISE LOG '  - trigger_bubble_sync_queue()';
  RAISE LOG '  - cleanup_old_queue_items()';
  RAISE LOG '  - notify_new_queue_item()';
  RAISE LOG '  - restore_expired_throttle_blocks()';
  RAISE LOG '  - trigger_workflow_cron()';
  RAISE LOG '  - move_failed_workflows_to_dlq()';
  RAISE LOG '============================================================';
END $$;
