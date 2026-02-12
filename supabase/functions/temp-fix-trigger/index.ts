import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const fixTriggerSQL = `
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
    VALUES (NEW.id, NEW.host_user_id, 'host')
    ON CONFLICT (thread_id, user_id) DO NOTHING;
  END IF;
  IF NEW.guest_user_id IS NOT NULL THEN
    INSERT INTO junctions.thread_participant (thread_id, user_id, role)
    VALUES (NEW.id, NEW.guest_user_id, 'guest')
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
`;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    console.log('[temp-fix-trigger] Executing trigger fix SQL...');

    // Execute the SQL using rpc (requires a SQL execution function in the database)
    // Since we can't directly execute DDL through the JS client,
    // we need to use the postgres connection

    // Alternative: Use pg directly via Deno
    const _dbUrl = Deno.env.get('SUPABASE_DB_URL') ||
      `postgresql://postgres:${supabaseServiceKey}@db.${supabaseUrl.replace('https://', '').replace('.supabase.co', '')}.supabase.co:5432/postgres`;

    // For now, let's try a different approach - check if the trigger already exists correctly
    const { data: _triggerCheck, error: _checkError } = await supabase
      .from('thread')
      .select('*')
      .limit(0);

    // Return the SQL that needs to be executed manually
    return new Response(
      JSON.stringify({
        message: 'This Edge Function cannot execute DDL directly. Please run the following SQL in the Supabase Dashboard SQL Editor:',
        sql: fixTriggerSQL,
        dashboard_url: `${supabaseUrl.replace('.supabase.co', '')}/project/qzsmhgyojmwvtjmnrdea/sql`,
        instructions: [
          '1. Go to Supabase Dashboard',
          '2. Open SQL Editor',
          '3. Paste the SQL above',
          '4. Click "Run"'
        ]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[temp-fix-trigger] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
