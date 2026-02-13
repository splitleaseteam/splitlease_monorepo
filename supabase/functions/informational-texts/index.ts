/**
 * informational-texts Edge Function
 * CRUD operations for informational text content management
 *
 * Actions:
 * - list: Get all entries (paginated)
 * - get: Get single entry by ID
 * - create: Insert new entry
 * - update: Update existing entry (partial updates)
 * - delete: Hard delete entry
 */

import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

console.log("[informational-texts] Edge Function initializing...");

Deno.serve(async (req: Request) => {
  try {
    console.log(`[informational-texts] Request: ${req.method}`);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Parse request
    const body = await req.json();
    const action = body.action || 'unknown';
    const payload = body.payload || {};

    console.log(`[informational-texts] Action: ${action}`);

    // Validate action
    const validActions = ['list', 'get', 'create', 'update', 'delete'];

    if (!validActions.includes(action)) {
      return errorResponse(`Invalid action: ${action}`, 400);
    }

    // Get Supabase config
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Authenticate user (OPTIONAL for internal pages)
    // NOTE: Authentication is now optional - internal pages can access without auth
    const user = await authenticateFromHeaders(req.headers, supabaseUrl, supabaseAnonKey);

    if (user) {
      console.log(`[informational-texts] Authenticated user: ${user.email} (${user.id})`);
    } else {
      console.log('[informational-texts] No auth header - proceeding as internal page request');
    }

    // Create service client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let result: unknown;

    switch (action) {
      case 'list':
        result = await handleList(payload, supabase);
        break;

      case 'get':
        result = await handleGet(payload, supabase);
        break;

      case 'create':
        result = await handleCreate(payload, supabase, user);
        break;

      case 'update':
        result = await handleUpdate(payload, supabase);
        break;

      case 'delete':
        result = await handleDelete(payload, supabase);
        break;

      default:
        throw new Error(`Unhandled action: ${action}`);
    }

    console.log('[informational-texts] Action completed successfully');

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[informational-texts] Error:', error);
    return errorResponse((error as Error).message, 500);
  }
});

// ===== HELPER FUNCTIONS =====

function errorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function authenticateFromHeaders(
  headers: Headers,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<{ id: string; email: string } | null> {
  const authHeader = headers.get('Authorization');
  if (!authHeader) return null;

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) return null;

  return { id: user.id, email: user.email ?? '' };
}

/**
 * Generate a unique ID for new entries
 * Format: text_YYYYMMDD_HHMMSS_XXX (matches existing Bubble-style IDs)
 */
function generateId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toISOString().slice(11, 19).replace(/:/g, '');
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `text_${date}_${time}_${random}`;
}

// ===== ACTION HANDLERS =====

/**
 * List all informational texts with optional pagination
 */
async function handleList(
  payload: { limit?: number; offset?: number; search?: string },
  supabase: SupabaseClient
) {
  const { limit = 100, offset = 0, search } = payload;

  let query = supabase
    .from('informationaltexts')
    .select('*', { count: 'exact' })
    .order('original_created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Optional search by tag title
  if (search && search.trim()) {
    query = query.ilike('information_tag_title', `%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[informational-texts] List error:', error);
    throw new Error(`Failed to fetch entries: ${error.message}`);
  }

  return { entries: data || [], total: count || 0, limit, offset };
}

/**
 * Get a single informational text by ID
 */
async function handleGet(
  payload: { id: string },
  supabase: SupabaseClient
) {
  const { id } = payload;

  if (!id) {
    throw new Error('id is required');
  }

  const { data, error } = await supabase
    .from('informationaltexts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Entry not found');
    }
    throw new Error(`Failed to fetch entry: ${error.message}`);
  }

  return data;
}

/**
 * Create a new informational text entry
 */
async function handleCreate(
  payload: {
    information_tag_title: string;
    desktop_copy: string;
    desktop_copy_legacy?: string;
    mobile_copy?: string;
    ipad_copy?: string;
    show_more_available?: boolean;
    link?: boolean;
  },
  supabase: SupabaseClient,
  user: { id: string; email: string }
) {
  const { information_tag_title, desktop_copy, desktop_copy_legacy, mobile_copy, ipad_copy, show_more_available, link } = payload;

  // Validate required fields
  if (!information_tag_title || !information_tag_title.trim()) {
    throw new Error('information_tag_title is required');
  }
  if (!desktop_copy || !desktop_copy.trim()) {
    throw new Error('desktop_copy is required');
  }

  // Check for duplicate tag title
  const { data: existing } = await supabase
    .from('informationaltexts')
    .select('id')
    .eq('information_tag_title', information_tag_title.trim())
    .maybeSingle();

  if (existing) {
    throw new Error(`Entry with tag title "${information_tag_title}" already exists`);
  }

  const now = new Date().toISOString();
  const newEntry = {
    'id': generateId(),
    information_tag_title: information_tag_title.trim(),
    desktop_copy,
    desktop_copy_legacy: desktop_copy_legacy || null,
    mobile_copy: mobile_copy || null,
    ipad_copy: ipad_copy || null,
    show_more_available: show_more_available || false,
    link: link || false,
    created_by: user.email,
    original_created_at: now,
    original_updated_at: now,
    'created_at': now,
    'updated_at': now,
  };

  const { data, error } = await supabase
    .from('informationaltexts')
    .insert(newEntry)
    .select()
    .single();

  if (error) {
    console.error('[informational-texts] Create error:', error);
    throw new Error(`Failed to create entry: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing informational text entry (partial update)
 */
async function handleUpdate(
  payload: {
    id: string;
    information_tag_title?: string;
    desktop_copy?: string;
    desktop_copy_legacy?: string;
    mobile_copy?: string;
    ipad_copy?: string;
    show_more_available?: boolean;
    link?: boolean;
  },
  supabase: SupabaseClient
) {
  const { id, information_tag_title, desktop_copy, desktop_copy_legacy, mobile_copy, ipad_copy, show_more_available, link } = payload;

  if (!id) {
    throw new Error('id is required');
  }

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {
    original_updated_at: new Date().toISOString(),
    'updated_at': new Date().toISOString(),
  };

  if (information_tag_title !== undefined) {
    if (!information_tag_title.trim()) {
      throw new Error('information_tag_title cannot be empty');
    }
    // Check for duplicate if changing tag title
    const { data: existing } = await supabase
      .from('informationaltexts')
      .select('id')
      .eq('information_tag_title', information_tag_title.trim())
      .neq('id', id)
      .maybeSingle();

    if (existing) {
      throw new Error(`Entry with tag title "${information_tag_title}" already exists`);
    }
    updateData.information_tag_title = information_tag_title.trim();
  }

  if (desktop_copy !== undefined) {
    if (!desktop_copy.trim()) {
      throw new Error('desktop_copy cannot be empty');
    }
    updateData.desktop_copy = desktop_copy;
  }

  if (desktop_copy_legacy !== undefined) {
    updateData.desktop_copy_legacy = desktop_copy_legacy || null;
  }

  if (mobile_copy !== undefined) {
    updateData.mobile_copy = mobile_copy || null;
  }

  if (ipad_copy !== undefined) {
    updateData.ipad_copy = ipad_copy || null;
  }

  if (show_more_available !== undefined) {
    updateData.show_more_available = show_more_available;
  }

  if (link !== undefined) {
    updateData.link = link;
  }

  const { data, error } = await supabase
    .from('informationaltexts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Entry not found');
    }
    console.error('[informational-texts] Update error:', error);
    throw new Error(`Failed to update entry: ${error.message}`);
  }

  return data;
}

/**
 * Delete an informational text entry (hard delete)
 */
async function handleDelete(
  payload: { id: string },
  supabase: SupabaseClient
) {
  const { id } = payload;

  if (!id) {
    throw new Error('id is required');
  }

  // Verify entry exists
  const { data: existing, error: fetchError } = await supabase
    .from('informationaltexts')
    .select('id, information_tag_title')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    throw new Error('Entry not found');
  }

  const { error: deleteError } = await supabase
    .from('informationaltexts')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('[informational-texts] Delete error:', deleteError);
    throw new Error(`Failed to delete entry: ${deleteError.message}`);
  }

  return { deleted: true, id, information_tag_title: existing.information_tag_title };
}

console.log("[informational-texts] Edge Function ready");
