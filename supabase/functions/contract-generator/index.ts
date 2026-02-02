// Contract Generator Edge Function
// Generates DOCX documents and uploads to Google Drive

import { createClient } from 'supabase';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Import action handlers
import { handleGenerateCreditCardAuth } from './actions/generateCreditCardAuth.ts';
import { handleGenerateCreditCardAuthNonProrated } from './actions/generateCreditCardAuthNonProrated.ts';
import { handleGenerateHostPayout } from './actions/generateHostPayout.ts';
import { handleGeneratePeriodicTenancy } from './actions/generatePeriodicTenancy.ts';
import { handleGenerateSupplemental } from './actions/generateSupplemental.ts';
import { handleListTemplates } from './actions/listTemplates.ts';
import { handleGetTemplateSchema } from './actions/getTemplateSchema.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body = await req.json();
    const action = body.action || 'unknown';
    const payload = body.payload || {};

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let result;

    // Route to appropriate action handler
    switch (action) {
      case 'generate_credit_card_auth':
        result = await handleGenerateCreditCardAuth(payload, supabase);
        break;

      case 'generate_credit_card_auth_nonprorated':
        result = await handleGenerateCreditCardAuthNonProrated(payload, supabase);
        break;

      case 'generate_host_payout':
        result = await handleGenerateHostPayout(payload, supabase);
        break;

      case 'generate_periodic_tenancy':
        result = await handleGeneratePeriodicTenancy(payload, supabase);
        break;

      case 'generate_supplemental':
        result = await handleGenerateSupplemental(payload, supabase);
        break;

      case 'list_templates':
        result = await handleListTemplates();
        break;

      case 'get_template_schema':
        result = await handleGetTemplateSchema(payload.action || '');
        break;

      default:
        result = {
          success: false,
          error: {
            code: 'UNKNOWN_ACTION',
            message: `Unknown action: ${action}`
          }
        };
    }

    // Return response
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: result.success ? 200 : 400
    });

  } catch (error) {
    console.error('Contract generator error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
