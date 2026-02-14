/**
 * Shared authentication helper for bidding Edge Functions.
 *
 * Extracts the JWT from the Authorization header, verifies it via
 * Supabase Auth, and looks up the application user by email.
 *
 * Used by: submit-bid, withdraw-bid, set-auto-bid
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Authenticate a user from request headers.
 *
 * @param headers - The request headers (must include Authorization bearer token).
 * @param supabaseUrl - The Supabase project URL.
 * @param supabaseAnonKey - The Supabase anon key (used to create a per-request client).
 * @param functionName - The calling function name, used for log prefixes.
 * @returns The authenticated user's application ID and email, or null if auth fails.
 */
export async function authenticateFromHeaders(
  headers: Headers,
  supabaseUrl: string,
  supabaseAnonKey: string,
  functionName: string = 'bidding'
): Promise<{ id: string; email: string } | null> {
  const authHeader = headers.get('Authorization');
  if (!authHeader) {
    console.log(`[${functionName}:auth] No Authorization header`);
    return null;
  }

  try {
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error } = await authClient.auth.getUser();
    if (error || !user) {
      console.error(`[${functionName}:auth] getUser failed:`, error?.message);
      return null;
    }

    // Lookup application user ID by email
    const { data: appUser, error: appUserError } = await authClient
      .from('user')
      .select('id')
      .eq('email', user.email?.toLowerCase())
      .maybeSingle();

    if (appUserError || !appUser) {
      console.error(`[${functionName}:auth] User lookup failed:`, appUserError?.message);
      return null;
    }

    return { id: appUser.id, email: user.email ?? '' };
  } catch (err) {
    console.error(`[${functionName}:auth] Exception:`, (err as Error).message);
    return null;
  }
}
