-- Fix message table trigger column names
-- Similar to thread_participant trigger fix, but for _message table triggers
-- The trigger may be referencing legacy Bubble column names (-Host User, -Guest User)
-- instead of the correct normalized column names (host_user_id, guest_user_id)

-- Drop any existing trigger on _message that might use wrong column names
DROP TRIGGER IF EXISTS trigger_populate_thread_message_junction ON public._message;
DROP FUNCTION IF EXISTS public.populate_thread_message_junction();

-- Create the corrected trigger function
-- This populates the junctions.thread_message table when a message is inserted
CREATE OR REPLACE FUNCTION public.populate_thread_message_junction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  msg_type text;
BEGIN
  -- Determine message type based on sender and visibility
  IF NEW."is Split Bot" = true THEN
    IF NEW."is Visible to Host" = true AND NEW."is Visible to Guest" = false THEN
      msg_type := 'slbot_to_host';
    ELSIF NEW."is Visible to Guest" = true AND NEW."is Visible to Host" = false THEN
      msg_type := 'slbot_to_guest';
    ELSE
      msg_type := 'all';
    END IF;
  ELSIF NEW.originator_user_id = NEW.host_user_id THEN
    msg_type := 'host_sent';
  ELSIF NEW.originator_user_id = NEW.guest_user_id THEN
    msg_type := 'guest_sent';
  ELSE
    msg_type := 'all';
  END IF;

  -- Insert into junction table
  INSERT INTO junctions.thread_message (thread_id, message_id, message_type)
  VALUES (NEW.thread_id, NEW._id, msg_type)
  ON CONFLICT (thread_id, message_id) DO NOTHING;

  RETURN NEW;
END;
$func$;

-- Create the trigger
CREATE TRIGGER trigger_populate_thread_message_junction
  AFTER INSERT ON public._message
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_thread_message_junction();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.populate_thread_message_junction() TO authenticated;
GRANT EXECUTE ON FUNCTION public.populate_thread_message_junction() TO service_role;
