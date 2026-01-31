/**
 * Admin Query Auth - Query auth.users table for debugging
 * Split Lease - Edge Function
 *
 * TEMPORARY FUNCTION - Remove after debugging
 *
 * This function allows querying auth.users to check user_metadata
 * for debugging purposes only.
 *
 * Security:
 * - NO authentication (temporarily, for debugging)
 * - Uses service role key to bypass RLS
 * - Should be removed after debugging complete
 */

import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';

console.log('[admin-query-auth] Edge Function started');

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[admin-query-auth] ========== NEW REQUEST ==========');
    console.log('[admin-query-auth] Method:', req.method);
    console.log('[admin-query-auth] URL:', req.url);

    // Parse request
    const { action, payload } = await req.json();

    console.log('[admin-query-auth] Action:', action);
    console.log('[admin-query-auth] Payload:', JSON.stringify(payload, null, 2));

    // Get Supabase config
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Create Supabase client with service role key (unused but kept for potential future use)
    const _supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    if (action === 'get_user_by_email') {
      const { email } = payload;

      if (!email) {
        throw new Error('Email is required');
      }

      console.log('[admin-query-auth] Querying auth.users for email:', email);

      // Query auth.users using admin API via direct REST call
      // The Supabase client's auth.admin methods require specific setup
      const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'GET',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[admin-query-auth] Error listing users:', errorData);
        throw new Error(errorData.message || 'Failed to list users');
      }

      const data = await response.json();
      const users = data.users || [];

      // Find user by email
      const user = users.find((u: any) => u.email === email);

      if (!user) {
        console.log('[admin-query-auth] User not found with email:', email);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'User not found',
            email: email
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[admin-query-auth] User found:', user.id);
      console.log('[admin-query-auth] User metadata:', JSON.stringify(user.user_metadata, null, 2));

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: user.id,
            email: user.email,
            email_confirmed: user.email_confirmed_at !== null,
            created_at: user.created_at,
            updated_at: user.updated_at,
            user_metadata: user.user_metadata,
            app_metadata: user.app_metadata,
            has_user_id_in_metadata: user.user_metadata?.user_id !== undefined,
            user_id_value: user.user_metadata?.user_id || null
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unknown action',
          supported_actions: ['get_user_by_email']
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[admin-query-auth] ========== ERROR ==========');
    console.error('[admin-query-auth] Error:', error);
    console.error('[admin-query-auth] Stack:', (error as Error).stack);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Import the Supabase client
import { createClient as createSupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

function createClient(supabaseUrl: string, supabaseKey: string) {
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
