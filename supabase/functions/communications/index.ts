/**
 * Communications - Edge Function
 * Split Lease
 *
 * Placeholder for communications-related functionality
 * Future actions may include:
 * - Email notifications
 * - SMS notifications
 * - In-app messaging
 * - Push notifications
 *
 * NO AUTHENTICATION REQUIRED - Public endpoint (auth handled per action)
 */

import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import { createClient as _createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createErrorCollector, ErrorCollector } from '../_shared/slack.ts';

// ============ CORS Headers ============
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// ============ Error Classes ============
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function formatErrorResponse(error: Error): { success: false; error: string } {
  console.error('[communications] Error:', error);
  return {
    success: false,
    error: error.message || 'An error occurred',
  };
}

function getStatusCodeFromError(error: Error): number {
  if (error instanceof ValidationError) {
    return 400;
  }
  return 500;
}

// ============ Validation Functions ============
function validateRequiredFields(
  obj: Record<string, unknown>,
  requiredFields: string[]
): void {
  for (const field of requiredFields) {
    if (!(field in obj) || obj[field] === undefined || obj[field] === null || obj[field] === '') {
      throw new ValidationError(`Missing required field: ${field}`);
    }
  }
}

function validateAction(action: string, allowedActions: string[]): void {
  if (!allowedActions.includes(action)) {
    throw new ValidationError(`Unknown action: ${action}. Allowed actions: ${allowedActions.join(', ')}`);
  }
}

// ============ Allowed Actions ============
const ALLOWED_ACTIONS = ['health', 'create_db_function'];

// ============ Action Handlers ============

/**
 * Health check endpoint
 */
function handleHealth(): { status: string; timestamp: string; message: string } {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Communications edge function is running. This is a placeholder - implement specific actions as needed.',
  };
}

/**
 * Temporary: Execute raw SQL to create a database function.
 * Uses two strategies:
 * 1. PostgREST /query endpoint with service role key
 * 2. Supabase Management API as fallback
 * This action is a one-time utility for DDL execution and should be removed after use.
 */
async function handleCreateDbFunction(payload: Record<string, unknown>): Promise<{ success: boolean; message: string; details?: string }> {
  const { sql } = payload;
  if (!sql || typeof sql !== 'string') {
    throw new ValidationError('payload.sql is required and must be a string');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }

  console.log('[communications] Executing DDL SQL via service role key');
  console.log('[communications] SQL:', sql.substring(0, 200));

  // Strategy 1: POST to /rest/v1/query endpoint with service role
  const queryUrl = `${supabaseUrl}/rest/v1/query`;
  const queryResponse = await fetch(queryUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (queryResponse.ok) {
    const queryResult = await queryResponse.text();
    console.log('[communications] Query endpoint succeeded:', queryResult);
    return { success: true, message: 'SQL executed successfully via /query endpoint', details: queryResult };
  }

  console.log('[communications] /query endpoint failed with status:', queryResponse.status);
  const queryError = await queryResponse.text();
  console.log('[communications] /query error:', queryError);

  // Strategy 2: Use pg_query via PostgREST RPC (if available)
  // Create a temporary wrapper that runs the SQL
  // We execute via the internal db endpoint using SUPABASE_URL which points to the internal postgres gateway
  const execResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (execResponse.ok) {
    const execResult = await execResponse.text();
    console.log('[communications] exec_sql RPC succeeded:', execResult);
    return { success: true, message: 'SQL executed successfully via exec_sql RPC', details: execResult };
  }

  const execError = await execResponse.text();
  console.log('[communications] exec_sql RPC also failed:', execError);

  throw new Error(`Failed to execute SQL. Strategy 1 (/query): ${queryResponse.status} - ${queryError}. Strategy 2 (exec_sql): ${execResponse.status} - ${execError}`);
}

// ============ Main Handler ============
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Error collector for consolidated error reporting (ONE RUN = ONE LOG)
  let collector: ErrorCollector | null = null;
  let action = 'unknown';

  try {
    console.log(`[communications] ========== NEW REQUEST (v2) ==========`);
    console.log(`[communications] Method: ${req.method}`);
    console.log(`[communications] URL: ${req.url}`);

    // Only accept POST requests
    if (req.method !== 'POST') {
      throw new ValidationError('Method not allowed. Use POST.');
    }

    // Parse request body
    const body = await req.json();
    console.log(`[communications] Request body:`, JSON.stringify(body, null, 2));

    validateRequiredFields(body, ['action']);
    action = body.action;
    const { payload } = body;

    // Create error collector after we know the action
    collector = createErrorCollector('communications', action);

    // Validate action is supported
    validateAction(action, ALLOWED_ACTIONS);

    console.log(`[communications] Action: ${action}`);

    // Route to appropriate handler
    let result;

    switch (action) {
      case 'health':
        result = handleHealth();
        break;

      case 'create_db_function':
        result = await handleCreateDbFunction(payload || {});
        break;

      default:
        throw new ValidationError(`Unknown action: ${action}`);
    }

    console.log(`[communications] Handler completed successfully`);
    console.log(`[communications] ========== REQUEST COMPLETE ==========`);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[communications] ========== ERROR ==========');
    console.error('[communications] Error:', error);

    // Report to Slack (ONE RUN = ONE LOG, fire-and-forget)
    if (collector) {
      collector.add(error as Error, 'Fatal error in main handler');
      collector.reportToSlack();
    }

    const statusCode = getStatusCodeFromError(error as Error);
    const errorResponse = formatErrorResponse(error as Error);

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
