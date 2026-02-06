-- Migration: Create count_user_threads function
-- Purpose: Count message threads where a user is either the host or guest
-- Used by: LoggedInAvatar component to show/hide the message icon in the header

CREATE OR REPLACE FUNCTION public.count_user_threads(user_id text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer
  FROM thread t
  WHERE t.host_user_id = user_id
     OR t.guest_user_id = user_id;
$$;

-- Grant execute permission to authenticated users and anon (for public API access)
GRANT EXECUTE ON FUNCTION public.count_user_threads(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_user_threads(text) TO anon;
GRANT EXECUTE ON FUNCTION public.count_user_threads(text) TO service_role;

COMMENT ON FUNCTION public.count_user_threads(text) IS
'Counts the number of message threads where the given user is a participant (as host or guest).
Used by the header messaging icon to determine visibility.';
