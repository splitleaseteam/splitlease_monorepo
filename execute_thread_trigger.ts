#!/usr/bin/env -S deno run --allow-env --allow-net

// This script executes SQL directly on the Supabase database
// using the PostgreSQL protocol via the supabase-js library

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Error: Missing environment variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  console.error(`SUPABASE_URL: ${supabaseUrl ? "set" : "NOT SET"}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? "set" : "NOT SET"}`);
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sqlStatements = [
  // Statement 1: Drop existing trigger
  `DROP TRIGGER IF EXISTS trigger_populate_thread_participant_junction ON public.thread;`,

  // Statement 2: Drop existing function
  `DROP FUNCTION IF EXISTS public.populate_thread_participant_junction();`,

  // Statement 3: Create function
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

  // Statement 4: Create trigger
  `CREATE TRIGGER trigger_populate_thread_participant_junction
  AFTER INSERT ON public.thread
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_thread_participant_junction();`,
];

console.log("Executing SQL statements via Supabase PostgreSQL...\n");

for (let i = 0; i < sqlStatements.length; i++) {
  const statement = sqlStatements[i];
  console.log(`\n[${i + 1}/${sqlStatements.length}] Executing:`);
  console.log(statement.substring(0, 80) + (statement.length > 80 ? "..." : ""));

  try {
    const { error } = await supabase.rpc("exec_raw_sql", { sql: statement });
    if (error) {
      console.error(`❌ Error:`, error.message);
      throw error;
    }
    console.log(`✓ Success`);
  } catch (err) {
    console.error(`❌ Failed: ${err.message}`);
    Deno.exit(1);
  }
}

console.log("\n✓ All SQL statements executed successfully!");
