-- FORCE FIX: Drop and recreate thread_participant trigger with correct column names
-- This migration ensures the trigger uses normalized column names (host_user_id, guest_user_id)
-- instead of legacy Bubble column names ("-Host User", "-Guest User")

-- First, drop ALL possible triggers on thread table that might interfere
DROP TRIGGER IF EXISTS trigger_populate_thread_participant_junction ON public.thread;
DROP TRIGGER IF EXISTS populate_thread_participant_junction ON public.thread;
DROP TRIGGER IF EXISTS thread_participant_trigger ON public.thread;

-- Drop ALL possible function versions
DROP FUNCTION IF EXISTS public.populate_thread_participant_junction() CASCADE;

-- Create the corrected trigger function
CREATE OR REPLACE FUNCTION public.populate_thread_participant_junction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  -- Insert host user as participant (using CORRECT column name: host_user_id)
  IF NEW.host_user_id IS NOT NULL THEN
    INSERT INTO junctions.thread_participant (thread_id, user_id, role)
    VALUES (NEW._id, NEW.host_user_id, 'host')
    ON CONFLICT (thread_id, user_id) DO NOTHING;
  END IF;

  -- Insert guest user as participant (using CORRECT column name: guest_user_id)
  IF NEW.guest_user_id IS NOT NULL THEN
    INSERT INTO junctions.thread_participant (thread_id, user_id, role)
    VALUES (NEW._id, NEW.guest_user_id, 'guest')
    ON CONFLICT (thread_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$func$;

-- Create the trigger
CREATE TRIGGER trigger_populate_thread_participant_junction
  AFTER INSERT ON public.thread
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_thread_participant_junction();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.populate_thread_participant_junction() TO authenticated;
GRANT EXECUTE ON FUNCTION public.populate_thread_participant_junction() TO service_role;
