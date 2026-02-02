-- Drop the existing trigger first (if it exists)
DROP TRIGGER IF EXISTS trigger_populate_thread_participant_junction ON public.thread;

-- Drop the existing function (if it exists)
DROP FUNCTION IF EXISTS public.populate_thread_participant_junction();

-- Create the corrected trigger function
CREATE OR REPLACE FUNCTION public.populate_thread_participant_junction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert host user as participant (if host_user_id is not null)
  IF NEW.host_user_id IS NOT NULL THEN
    INSERT INTO junctions.thread_participant (thread_id, user_id, role)
    VALUES (NEW._id, NEW.host_user_id, 'host')
    ON CONFLICT (thread_id, user_id) DO NOTHING;
  END IF;

  -- Insert guest user as participant (if guest_user_id is not null)
  IF NEW.guest_user_id IS NOT NULL THEN
    INSERT INTO junctions.thread_participant (thread_id, user_id, role)
    VALUES (NEW._id, NEW.guest_user_id, 'guest')
    ON CONFLICT (thread_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on thread table
CREATE TRIGGER trigger_populate_thread_participant_junction
  AFTER INSERT ON public.thread
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_thread_participant_junction();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.populate_thread_participant_junction() TO authenticated;
GRANT EXECUTE ON FUNCTION public.populate_thread_participant_junction() TO service_role;
