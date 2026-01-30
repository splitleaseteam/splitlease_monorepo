import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sqlStatements = [
  `DROP TRIGGER IF EXISTS trigger_populate_thread_participant_junction ON public.thread;`,
  `DROP FUNCTION IF EXISTS public.populate_thread_participant_junction();`,
  `CREATE OR REPLACE FUNCTION public.populate_thread_participant_junction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;`,
  `CREATE TRIGGER trigger_populate_thread_participant_junction
  AFTER INSERT ON public.thread
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_thread_participant_junction();`,
];

console.log("Executing SQL statements...\n");

for (let i = 0; i < sqlStatements.length; i++) {
  const statement = sqlStatements[i];
  console.log(`Executing statement ${i + 1}/${sqlStatements.length}:`);
  console.log(statement.substring(0, 100) + "...\n");

  const { error } = await supabase.rpc("execute_sql", {
    query: statement,
  });

  if (error) {
    console.error(`Error executing statement ${i + 1}:`, error);
    Deno.exit(1);
  }

  console.log(`✓ Statement ${i + 1} executed successfully\n`);
}

console.log("All statements executed successfully!");
