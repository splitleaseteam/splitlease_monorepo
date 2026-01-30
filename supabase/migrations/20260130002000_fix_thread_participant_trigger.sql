-- Fix thread_participant junction trigger to use correct column names
-- Previous trigger used legacy Bubble column names ("-Host User", "-Guest User")
-- instead of the correct Supabase column names (host_user_id, guest_user_id)

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_populate_thread_participant_junction ON public.thread;
DROP FUNCTION IF EXISTS public.populate_thread_participant_junction();

-- Create the corrected trigger function
CREATE OR REPLACE FUNCTION public.populate_thread_participant_junction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  IF NEW.host_user_id IS NOT NULL THEN
    INSERT INTO junctions.thread_participant (thread_id, user_id, role)
    VALUES (NEW._id, NEW.host_user_id, 'host')
    ON CONFLICT (thread_id, user_id) DO NOTHING;
  END IF;
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
