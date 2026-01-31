-- Migration: Fix message trigger column names
-- Date: 2026-01-31
-- Issue: Triggers reference old Bubble-style column names that no longer exist
--
-- Column name mapping:
--   OLD: "Associated Thread/Conversation" → NEW: thread_id
--   OLD: "-Originator User"               → NEW: originator_user_id
--   OLD: "-Host User"                     → NEW: host_user_id
--   OLD: "-Guest User"                    → NEW: guest_user_id

-- ============================================
-- FIX 1: broadcast_new_message trigger function
-- ============================================
CREATE OR REPLACE FUNCTION public.broadcast_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  thread_record RECORD;
  sender_record RECORD;
  channel_name TEXT;
  broadcast_payload JSONB;
BEGIN
  -- Get thread info for channel name
  -- FIXED: Use new column names (host_user_id, guest_user_id)
  SELECT _id, host_user_id, guest_user_id, "Listing"
  INTO thread_record
  FROM public.thread
  WHERE _id = NEW.thread_id;  -- FIXED: was "Associated Thread/Conversation"

  -- Get sender info
  -- FIXED: Use originator_user_id instead of "-Originator User"
  SELECT _id, "Name - First", "Name - Last", "Profile Photo"
  INTO sender_record
  FROM public."user"
  WHERE _id = NEW.originator_user_id;  -- FIXED: was "-Originator User"

  -- Build channel name
  channel_name := 'thread-' || NEW.thread_id;  -- FIXED: was "Associated Thread/Conversation"

  -- Build broadcast payload
  broadcast_payload := jsonb_build_object(
    'type', 'new_message',
    'message', jsonb_build_object(
      '_id', NEW._id,
      'thread_id', NEW.thread_id,  -- FIXED: was "Associated Thread/Conversation"
      'message_body', NEW."Message Body",
      'sender_id', NEW.originator_user_id,  -- FIXED: was "-Originator User"
      'sender_name', COALESCE(sender_record."Name - First", '') || ' ' || COALESCE(sender_record."Name - Last", ''),
      'sender_avatar', sender_record."Profile Photo",
      'is_split_bot', COALESCE(NEW."is Split Bot", false),
      'created_at', NEW."Created Date",
      'call_to_action', NEW."Call to Action",
      'split_bot_warning', NEW."Split Bot Warning"
    ),
    'host_user', thread_record.host_user_id,  -- FIXED: was "-Host User"
    'guest_user', thread_record.guest_user_id  -- FIXED: was "-Guest User"
  );

  -- Broadcast to thread-specific channel using realtime.send
  PERFORM realtime.send(
    broadcast_payload,
    'new_message',
    channel_name,
    false
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'broadcast_new_message failed: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- ============================================
-- FIX 2: update_thread_on_message trigger function
-- ============================================
CREATE OR REPLACE FUNCTION public.update_thread_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Update thread's last message info
  -- FIXED: Use thread_id instead of "Associated Thread/Conversation"
  UPDATE public.thread
  SET
    "~Last Message" = LEFT(NEW."Message Body", 100),
    "~Date Last Message" = NEW."Created Date",
    "Modified Date" = NOW(),
    updated_at = NOW()
  WHERE _id = NEW.thread_id;  -- FIXED: was "Associated Thread/Conversation"

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'update_thread_on_message failed: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- ============================================
-- Verify triggers are still attached
-- ============================================
-- The triggers should already exist on the _message table:
-- - trigger_broadcast_new_message
-- - trigger_update_thread_on_message
-- If they don't exist, recreate them:

DO $$
BEGIN
  -- Check if broadcast trigger exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trigger_broadcast_new_message'
    AND event_object_table = '_message'
  ) THEN
    CREATE TRIGGER trigger_broadcast_new_message
      AFTER INSERT ON public._message
      FOR EACH ROW
      EXECUTE FUNCTION public.broadcast_new_message();
    RAISE NOTICE 'Created trigger_broadcast_new_message';
  END IF;

  -- Check if update thread trigger exists, create if not
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trigger_update_thread_on_message'
    AND event_object_table = '_message'
  ) THEN
    CREATE TRIGGER trigger_update_thread_on_message
      AFTER INSERT ON public._message
      FOR EACH ROW
      EXECUTE FUNCTION public.update_thread_on_message();
    RAISE NOTICE 'Created trigger_update_thread_on_message';
  END IF;
END
$$;

-- ============================================
-- FIX 3: populate_thread_message_junction trigger function
-- Issue: msg_type variable declared as text but assigned enum values
-- ============================================
CREATE OR REPLACE FUNCTION public.populate_thread_message_junction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  msg_type junctions.thread_message_type;  -- FIXED: was text, now proper enum type
BEGIN
  -- Determine message type based on sender role
  IF NEW."is Split Bot" = true THEN
    msg_type := 'splitbot'::junctions.thread_message_type;
  ELSIF NEW.originator_user_id = NEW.host_user_id THEN
    msg_type := 'host_sent'::junctions.thread_message_type;
  ELSIF NEW.originator_user_id = NEW.guest_user_id THEN
    msg_type := 'guest_sent'::junctions.thread_message_type;
  ELSE
    msg_type := 'guest_sent'::junctions.thread_message_type; -- Default fallback
  END IF;

  -- Insert into junction table
  INSERT INTO junctions.thread_message (
    thread_id,
    message_id,
    message_type,
    created_at
  ) VALUES (
    NEW.thread_id,
    NEW._id,
    msg_type,
    COALESCE(NEW."Created Date", NOW())
  )
  ON CONFLICT (thread_id, message_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'populate_thread_message_junction failed: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Log completion
DO $$ BEGIN RAISE NOTICE 'Migration complete: Fixed all three message trigger functions'; END $$;
