-- ============================================================================
-- Migration: Remove All pg_cron Jobs
-- Purpose: Disable all scheduled cron jobs in the database
-- Created: 2026-01-24
-- ============================================================================

-- Unschedule all known cron jobs
-- Using DO block to handle cases where jobs may not exist

DO $$
DECLARE
  job_names TEXT[] := ARRAY[
    'process-bubble-sync-queue',
    'cleanup-sync-queue',
    'workflow-orchestrator-backup',
    'workflow-dlq-cleanup',
    'restore-throttle-abilities'
  ];
  job_name TEXT;
BEGIN
  FOREACH job_name IN ARRAY job_names
  LOOP
    BEGIN
      PERFORM cron.unschedule(job_name);
      RAISE NOTICE 'Unscheduled cron job: %', job_name;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Job % not found or already removed: %', job_name, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- Verify no cron jobs remain
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count FROM cron.job;
  RAISE NOTICE 'Remaining cron jobs: %', remaining_count;
END;
$$;

-- ============================================================================
-- Note: The associated functions are NOT removed, only the scheduled jobs.
-- Functions can still be called manually if needed:
--   - trigger_bubble_sync_queue()
--   - cleanup_old_queue_items()
--   - trigger_workflow_cron()
--   - move_failed_workflows_to_dlq()
--   - restore_expired_throttle_blocks()
-- ============================================================================
