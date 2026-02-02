/**
 * Lease Documents Edge Function
 * Split Lease - Supabase Edge Functions
 *
 * Generates DOCX lease documents and uploads them to Google Drive.
 * Migrated from PythonAnywhere Flask API.
 *
 * Actions:
 * - generate_host_payout: Generate Host Payout Schedule Form
 * - generate_supplemental: Generate Supplemental Agreement
 * - generate_periodic_tenancy: Generate Periodic Tenancy Agreement
 * - generate_credit_card_auth: Generate Credit Card Authorization Form
 * - generate_all: Generate all 4 documents for a lease
 *
 * Request Format:
 * POST /functions/v1/lease-documents
 * {
 *   "action": "generate_host_payout" | "generate_supplemental" | etc.,
 *   "payload": { ... document-specific fields ... }
 * }
 *
 * Response Format:
 * {
 *   "success": true,
 *   "data": {
 *     "filename": "host_payout_schedule-AGR-12345.docx",
 *     "driveUrl": "https://drive.google.com/...",
 *     "fileId": "abc123"
 *   }
 * }
 *
 * Environment Variables Required:
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL: Google Service Account email
 * - GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: Google Service Account private key
 * - GOOGLE_DRIVE_FOLDER_ID: Target folder ID in Google Drive
 * - SLACK_ERROR_WEBHOOK: (Optional) Slack webhook for error notifications
 * - SLACK_SUCCESS_WEBHOOK: (Optional) Slack webhook for success notifications
 *
 * Templates are stored in Supabase Storage bucket 'document-templates'.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  formatErrorResponse,
  getStatusCodeFromError,
  ValidationError,
} from '../_shared/errors.ts';
import { handleGenerateHostPayout } from './handlers/generateHostPayout.ts';
import { handleGenerateSupplemental } from './handlers/generateSupplemental.ts';
import { handleGeneratePeriodicTenancy } from './handlers/generatePeriodicTenancy.ts';
import { handleGenerateCreditCardAuth } from './handlers/generateCreditCardAuth.ts';
import { handleGenerateAll } from './handlers/generateAll.ts';
import type { UserContext, DocumentResult, GenerateAllResult } from './lib/types.ts';

// Handler function type - matches the signature of all document generation handlers
type HandlerFn = (
  payload: unknown,
  user: UserContext | null,
  supabase: SupabaseClient
) => Promise<DocumentResult | GenerateAllResult>;

// ================================================
// CONFIGURATION
// ================================================

const ALLOWED_ACTIONS = [
  'generate_host_payout',
  'generate_supplemental',
  'generate_periodic_tenancy',
  'generate_credit_card_auth',
  'generate_all',
] as const;

type Action = (typeof ALLOWED_ACTIONS)[number];

// Actions that don't require authentication (called by internal systems)
const PUBLIC_ACTIONS = new Set<Action>([
  'generate_host_payout',
  'generate_supplemental',
  'generate_periodic_tenancy',
  'generate_credit_card_auth',
  'generate_all',
]);

// Handler registry
const handlers: Readonly<Record<Action, HandlerFn>> = {
  generate_host_payout: handleGenerateHostPayout,
  generate_supplemental: handleGenerateSupplemental,
  generate_periodic_tenancy: handleGeneratePeriodicTenancy,
  generate_credit_card_auth: handleGenerateCreditCardAuth,
  generate_all: handleGenerateAll,
};

// ================================================
// MAIN ENTRY POINT
// ================================================

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // ================================================
    // PARSE REQUEST
    // ================================================

    let body: { action?: string; payload?: Record<string, unknown> };
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('Invalid JSON body');
    }

    const { action, payload } = body;

    if (!action || typeof action !== 'string') {
      throw new ValidationError('action is required');
    }

    if (!ALLOWED_ACTIONS.includes(action as Action)) {
      throw new ValidationError(
        `Invalid action: ${action}. Allowed actions: ${ALLOWED_ACTIONS.join(', ')}`
      );
    }

    const typedAction = action as Action;
    console.log(`[lease-documents] Action: ${typedAction}`);

    // ================================================
    // AUTHENTICATION (optional for public actions)
    // ================================================

    let user: UserContext | null = null;

    if (!PUBLIC_ACTIONS.has(typedAction)) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new ValidationError('Authorization header required');
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const {
        data: { user: authUser },
        error: authError,
      } = await authClient.auth.getUser();

      if (authError || !authUser) {
        throw new ValidationError('Invalid or expired token');
      }

      user = {
        id: authUser.id,
        email: authUser.email || '',
      };
    }

    // ================================================
    // CREATE SERVICE CLIENT
    // ================================================

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // ================================================
    // ROUTE TO HANDLER
    // ================================================

    const handler = handlers[typedAction];
    const result = await handler(payload || {}, user, supabase);

    // ================================================
    // SUCCESS RESPONSE
    // ================================================

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // ================================================
    // ERROR RESPONSE
    // ================================================

    const status = getStatusCodeFromError(error as Error);
    const errorMessage = formatErrorResponse(error as Error);

    console.error(`[lease-documents] Error:`, error);

    return new Response(JSON.stringify(errorMessage), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
