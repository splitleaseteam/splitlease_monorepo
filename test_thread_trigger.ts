import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = "https://qcfifybkaddcoimjroca.supabase.co";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseServiceKey) {
  console.error("Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set");
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test if the trigger function exists
const { data, error } = await supabase.rpc("check_trigger_exists");

if (error) {
  console.log("Trigger check RPC failed (may not exist):", error.message);
  console.log("\nAttempting direct SQL execution...");

  // Try to execute the SQL directly via raw queries
  const testQuery = `SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_populate_thread_participant_junction'
  );`;

  console.log("Note: Cannot directly execute raw SQL from TypeScript via supabase-js");
  console.log("The migration system must be used or manual database access required.");
} else {
  console.log("Trigger check result:", data);
}
