/**
 * Proposal Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * DIAGNOSTIC VERSION 2: Minimal core + lazy imports
 */

import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import { createClients, authenticateRequest, corsHeaders } from '../_shared/supabaseClient.ts';

console.log("[proposal] Edge Function initializing...");

Deno.serve(async (req: Request) => {
  try {
    console.log(`[proposal] ${req.method} request received`);

    // Handle CORS preflight FIRST
    if (req.method === 'OPTIONS') {
      console.log(`[proposal] CORS preflight - returning 200`);
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Parse request body
    const body = await req.json();
    const action = body.action || 'unknown';
    const payload = body.payload || {};

    console.log(`[proposal] Action: ${action}`);

    // Validate action
    const validActions = [
      'create', 'update', 'get', 'suggest', 'create_suggested', 'create_mockup', 'get_prefill_data',
      // Usability test simulation actions
      'createTestProposal', 'createTestRentalApplication', 'acceptProposal', 'createCounteroffer', 'acceptCounteroffer'
    ];
    if (!validActions.includes(action)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid action: ${action}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create clients via shared factory
    const { admin: supabase, config } = createClients();

    let result: unknown;

    // Dynamic imports - load only the handler needed
    // This avoids boot-time loading of all handlers
    switch (action) {
      case 'create': {
        console.log('[proposal] Loading create handler...');
        const { handleCreate } = await import("./actions/create.ts");
        console.log('[proposal] Create handler loaded');

        // SECURITY: Require authentication for proposal creation
        const authResult = await authenticateRequest(req.headers, config);
        if (!authResult.ok) {
          return new Response(
            JSON.stringify({ success: false, error: 'Authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const user = authResult.value!;

        console.log(`[proposal:create] Authenticated user: ${user.id}`);
        result = await handleCreate(payload, user, supabase);
        break;
      }

      case 'update': {
        console.log('[proposal] Loading update handler...');
        const { handleUpdate } = await import("./actions/update.ts");
        console.log('[proposal] Update handler loaded');

        // Optional authentication - soft headers pattern for internal admin pages
        const authResult = await authenticateRequest(req.headers, config, undefined, { optional: true });
        const user = authResult.ok ? authResult.value : null;
        if (user) {
          console.log(`[proposal:update] Authenticated user: ${user.email} (${user.id})`);
        } else {
          console.log('[proposal:update] No auth - proceeding as internal page request');
        }
        result = await handleUpdate(payload, user, supabase);
        break;
      }

      case 'get': {
        console.log('[proposal] Loading get handler...');
        const { handleGet } = await import("./actions/get.ts");
        console.log('[proposal] Get handler loaded');

        result = await handleGet(payload, supabase);
        break;
      }

      case 'suggest': {
        console.log('[proposal] Loading suggest handler...');
        const { handleSuggest } = await import("./actions/suggest.ts");
        console.log('[proposal] Suggest handler loaded');

        // Authentication required
        const authResult = await authenticateRequest(req.headers, config);
        if (!authResult.ok) {
          return new Response(
            JSON.stringify({ success: false, error: 'Authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const user = authResult.value!;
        result = await handleSuggest(payload, user, supabase);
        break;
      }

      case 'create_suggested': {
        console.log('[proposal] Loading create_suggested handler...');
        const { handleCreateSuggested } = await import("./actions/create_suggested.ts");
        console.log('[proposal] Create_suggested handler loaded');

        // No authentication required - internal tool only
        // Access control is handled by route protection (/_internal/* paths)
        result = await handleCreateSuggested(payload, supabase);
        break;
      }

      case 'create_mockup': {
        console.log('[proposal] Loading create_mockup handler...');
        const { handleCreateMockup } = await import("./actions/create_mockup.ts");
        console.log('[proposal] Create_mockup handler loaded');

        // No authentication required - internal service call only
        // Access control via service role key from listing edge function
        result = await handleCreateMockup(payload, supabase);
        break;
      }

      case 'get_prefill_data': {
        console.log('[proposal] Loading get_prefill_data handler...');
        const { handleGetPrefillData } = await import("./actions/get_prefill_data.ts");
        console.log('[proposal] Get_prefill_data handler loaded');

        // No authentication required - internal tool only
        // Service role bypasses RLS so hosts can query other users' proposals
        result = await handleGetPrefillData(payload, supabase);
        break;
      }

      // ========================================================================
      // USABILITY TEST SIMULATION ACTIONS
      // These actions support the guest-side usability simulation flow
      // ========================================================================

      case 'createTestProposal': {
        console.log('[proposal] Loading createTestProposal handler...');
        const { handleCreateTestProposal } = await import("./actions/create_test_proposal.ts");
        console.log('[proposal] createTestProposal handler loaded');

        // Authentication required - must be logged in as the tester
        const authResult = await authenticateRequest(req.headers, config);
        if (!authResult.ok) {
          return new Response(
            JSON.stringify({ success: false, error: 'Authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await handleCreateTestProposal(payload, supabase);
        break;
      }

      case 'createTestRentalApplication': {
        console.log('[proposal] Loading createTestRentalApplication handler...');
        const { handleCreateTestRentalApplication } = await import("./actions/create_test_rental_application.ts");
        console.log('[proposal] createTestRentalApplication handler loaded');

        // Authentication required
        const authResult = await authenticateRequest(req.headers, config);
        if (!authResult.ok) {
          return new Response(
            JSON.stringify({ success: false, error: 'Authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await handleCreateTestRentalApplication(payload, supabase);
        break;
      }

      case 'acceptProposal': {
        console.log('[proposal] Loading acceptProposal handler...');
        const { handleAcceptProposal } = await import("./actions/accept_proposal.ts");
        console.log('[proposal] acceptProposal handler loaded');

        // Authentication required
        const authResult = await authenticateRequest(req.headers, config);
        if (!authResult.ok) {
          return new Response(
            JSON.stringify({ success: false, error: 'Authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await handleAcceptProposal(payload, supabase);
        break;
      }

      case 'createCounteroffer': {
        console.log('[proposal] Loading createCounteroffer handler...');
        const { handleCreateCounteroffer } = await import("./actions/create_counteroffer.ts");
        console.log('[proposal] createCounteroffer handler loaded');

        // Authentication required
        const authResult = await authenticateRequest(req.headers, config);
        if (!authResult.ok) {
          return new Response(
            JSON.stringify({ success: false, error: 'Authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = await handleCreateCounteroffer(payload, supabase);
        break;
      }

      case 'acceptCounteroffer': {
        console.log('[proposal] Loading acceptCounteroffer handler...');
        const { handleAcceptCounteroffer } = await import("./actions/accept_counteroffer.ts");
        console.log('[proposal] acceptCounteroffer handler loaded');

        // Optional authentication - soft headers pattern for legacy token users
        // Service role key bypasses RLS, so auth is for logging/audit purposes only
        const authResult = await authenticateRequest(req.headers, config, undefined, { optional: true });
        const user = authResult.ok ? authResult.value : null;
        if (user) {
          console.log(`[proposal:acceptCounteroffer] Authenticated user: ${user.email} (${user.id})`);
        } else {
          console.log('[proposal:acceptCounteroffer] No Supabase auth - proceeding with legacy token user');
        }
        result = await handleAcceptCounteroffer(payload, supabase);
        break;
      }

      default:
        throw new Error(`Unhandled action: ${action}`);
    }

    console.log('[proposal] Handler completed successfully');

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[proposal] Error:', error);

    const statusCode = (error as { name?: string }).name === 'ValidationError' ? 400 :
                       (error as { name?: string }).name === 'AuthenticationError' ? 401 : 500;

    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

console.log("[proposal] Edge Function ready");
