/**
 * pricing-admin Edge Function
 * Admin dashboard operations for listing price management
 *
 * Actions:
 * - list: Paginated listing fetch with filters (rental type, borough, neighborhood, host, date range)
 * - get: Single listing with all pricing fields
 * - updatePrice: Update specific pricing fields (single listing)
 * - bulkUpdate: Batch price updates with transaction
 * - setOverride: Set/clear price override
 * - toggleActive: Activate/deactivate listing
 * - getConfig: Fetch global pricing configuration (read-only)
 * - export: Export selected listings as CSV/JSON
 */

import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

console.log("[pricing-admin] Edge Function initializing...");

// ===== TYPES =====

interface ListPayload {
  limit?: number;
  offset?: number;
  filters?: {
    rentalType?: string;
    borough?: string;
    neighborhood?: string;
    hostEmail?: string;
    nameSearch?: string;
    activeOnly?: boolean;
    dateRange?: {
      start?: string;
      end?: string;
    };
  };
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UpdatePricePayload {
  listingId: string;
  fields: Record<string, number | null>;
}

interface BulkUpdatePayload {
  listingIds: string[];
  fields: Record<string, number | null>;
}

interface SetOverridePayload {
  listingId: string;
  priceOverride: number | null;
}

interface ToggleActivePayload {
  listingId: string;
  active: boolean;
}

interface ExportPayload {
  listingIds: string[];
  format?: 'csv' | 'json';
}

// ===== MAIN HANDLER =====

Deno.serve(async (req: Request) => {
  try {
    console.log(`[pricing-admin] Request: ${req.method}`);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Parse request
    const body = await req.json();
    const action = body.action || 'unknown';
    const payload = body.payload || {};

    console.log(`[pricing-admin] Action: ${action}`);

    // Validate action
    const validActions = [
      'list', 'get', 'updatePrice', 'bulkUpdate',
      'setOverride', 'toggleActive', 'getConfig', 'export'
    ];

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
      console.log(`[pricing-admin] Authenticated user: ${user.email} (${user.id})`);
    } else {
      console.log('[pricing-admin] No auth header - proceeding as internal page request');
    }

    // Create service client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // NOTE: Admin role check removed to allow any authenticated user access for testing
    // Original code checked: const isAdmin = await checkAdminRole(supabase, user.id);
    // To re-enable admin-only access, uncomment the check below:
    // const isAdmin = await checkAdminRole(supabase, user.id);
    // if (!isAdmin) {
    //   return errorResponse('Admin access required', 403);
    // }

    let result: unknown;

    switch (action) {
      case 'list':
        result = await handleList(payload as ListPayload, supabase);
        break;

      case 'get':
        result = await handleGet(payload as { listingId: string }, supabase);
        break;

      case 'updatePrice':
        result = await handleUpdatePrice(payload as UpdatePricePayload, supabase, user.id);
        break;

      case 'bulkUpdate':
        result = await handleBulkUpdate(payload as BulkUpdatePayload, supabase, user.id);
        break;

      case 'setOverride':
        result = await handleSetOverride(payload as SetOverridePayload, supabase, user.id);
        break;

      case 'toggleActive':
        result = await handleToggleActive(payload as ToggleActivePayload, supabase, user.id);
        break;

      case 'getConfig':
        result = await handleGetConfig();
        break;

      case 'export':
        result = await handleExport(payload as ExportPayload, supabase);
        break;

      default:
        throw new Error(`Unhandled action: ${action}`);
    }

    console.log('[pricing-admin] Action completed successfully');

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[pricing-admin] Error:', error);
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

async function _checkAdminRole(supabase: SupabaseClient, authUserId: string): Promise<boolean> {
  // Look up the user record by auth_user_id to check admin toggle
  const { data, error } = await supabase
    .from('user')
    .select('is_admin')
    .eq('auth_user_id', authUserId)
    .single();

  if (error) {
    console.error('[pricing-admin] Admin check error:', error);
    return false;
  }

  return data?.is_admin === true;
}

// ===== ACTION HANDLERS =====

/**
 * List listings with optional filters and pagination
 */
async function handleList(
  payload: ListPayload,
  supabase: SupabaseClient
) {
  const {
    limit = 50,
    offset = 0,
    filters = {},
    sortField = 'Created Date',
    sortOrder = 'desc'
  } = payload;

  // Build query with pricing-related fields (no FK-based joins - fetch host separately)
  // Column names match actual database schema
  let query = supabase
    .from('listing')
    .select(`
      id,
      "Name",
      "Active",
      "rental type",
      "Location - Borough",
      "Location - Hood",
      "unit_markup",
      "weekly_host_rate",
      "monthly_host_rate",
      "nightly_rate_2_nights",
      "nightly_rate_3_nights",
      "nightly_rate_4_nights",
      "nightly_rate_5_nights",
      "nightly_rate_6_nights",
      "nightly_rate_7_nights",
      "cleaning_fee",
      "damage_deposit",
      "price_override",
      "extra_charges",
      "Created Date",
      "Modified Date",
      host_user_id
    `, { count: 'exact' });

  // Apply filters (using actual database column names)
  if (filters.rentalType) {
    query = query.eq('rental type', filters.rentalType);
  }
  if (filters.borough) {
    query = query.eq('Location - Borough', filters.borough);
  }
  if (filters.neighborhood) {
    query = query.ilike('Location - Hood', `%${filters.neighborhood}%`);
  }
  if (filters.nameSearch) {
    query = query.ilike('Name', `%${filters.nameSearch}%`);
  }
  if (filters.activeOnly) {
    query = query.eq('Active', true);
  }
  if (filters.dateRange?.start) {
    query = query.gte('"Created Date"', filters.dateRange.start);
  }
  if (filters.dateRange?.end) {
    query = query.lte('"Created Date"', filters.dateRange.end);
  }

  // Apply sorting (using actual database column names)
  const validSortFields = [
    'Created Date', 'Modified Date', 'Name',
    'price_override', 'weekly_host_rate'
  ];
  const sortBy = validSortFields.includes(sortField) ? sortField : 'Created Date';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: listings, error, count } = await query;

  if (error) {
    console.error('[pricing-admin] List error:', error);
    throw new Error(`Failed to fetch listings: ${error.message}`);
  }

  if (!listings || listings.length === 0) {
    return { listings: [], total: count || 0, limit, offset };
  }

  // Collect unique host IDs for separate query
  const hostIds = new Set<string>();
  for (const listing of listings) {
    if (listing.host_user_id) hostIds.add(listing.host_user_id);
  }

  // Fetch hosts in parallel
  const hostsMap = new Map<string, unknown>();
  if (hostIds.size > 0) {
    const { data: hosts } = await supabase
      .from("users")
      .select("id, email, name_first, name_last")
      .in("id", Array.from(hostIds));

    if (hosts) {
      for (const host of hosts) {
        hostsMap.set(host.id, host);
      }
    }
  }

  // Enrich listings with host data
  const enrichedListings = listings.map((listing) => ({
    ...listing,
    host: listing.host_user_id ? hostsMap.get(listing.host_user_id) || null : null,
  }));

  return {
    listings: enrichedListings,
    total: count || 0,
    limit,
    offset,
  };
}

/**
 * Get a single listing with all pricing details
 */
async function handleGet(
  payload: { listingId: string },
  supabase: SupabaseClient
) {
  const { listingId } = payload;

  if (!listingId) {
    throw new Error('listingId is required');
  }

  // Fetch listing without embedded select (no FK relationship)
  const { data: listing, error } = await supabase
    .from('listing')
    .select('*')
    .eq('id', listingId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch listing: ${error.message}`);
  }

  // Fetch host separately if exists
  let host = null;
  if (listing?.host_user_id) {
    const { data: hostData } = await supabase
      .from("users")
      .select("id, email, name_first, name_last, phone_number")
      .eq("id", listing.host_user_id)
      .single();
    host = hostData;
  }

  return { ...listing, host };
}

/**
 * Update pricing fields for a single listing
 * CRITICAL: Only sends changed fields to avoid FK constraint violations
 */
async function handleUpdatePrice(
  payload: UpdatePricePayload,
  supabase: SupabaseClient,
  _userId: string
) {
  const { listingId, fields } = payload;

  if (!listingId) {
    throw new Error('listingId is required');
  }

  if (!fields || Object.keys(fields).length === 0) {
    throw new Error('At least one field to update is required');
  }

  // Validate field names - only allow pricing-related fields
  const allowedFields = [
    'unit_markup',
    'weekly_host_rate',
    'monthly_host_rate',
    'nightly_rate_2_nights',
    'nightly_rate_3_nights',
    'nightly_rate_4_nights',
    'nightly_rate_5_nights',
    'nightly_rate_6_nights',
    'nightly_rate_7_nights',
    'cleaning_fee',
    'damage_deposit',
    'price_override',
    'extra_charges',
  ];

  const updateFields: Record<string, number | null> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (!allowedFields.includes(key)) {
      throw new Error(`Field not allowed: ${key}`);
    }
    updateFields[key] = value;
  }

  // Add modified timestamp
  const updateData = {
    ...updateFields,
    'Modified Date': new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('listing')
    .update(updateData)
    .eq('id', listingId)
    .select()
    .single();

  if (error) {
    console.error('[pricing-admin] Update error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`Failed to update listing: ${error.message}`);
  }

  return data;
}

/**
 * Bulk update pricing fields for multiple listings
 */
async function handleBulkUpdate(
  payload: BulkUpdatePayload,
  supabase: SupabaseClient,
  _userId: string
) {
  const { listingIds, fields } = payload;

  if (!listingIds || !Array.isArray(listingIds) || listingIds.length === 0) {
    throw new Error('listingIds array is required');
  }

  if (!fields || Object.keys(fields).length === 0) {
    throw new Error('At least one field to update is required');
  }

  // Validate field names
  const allowedFields = [
    'unit_markup',
    'weekly_host_rate',
    'monthly_host_rate',
    'nightly_rate_2_nights',
    'nightly_rate_3_nights',
    'nightly_rate_4_nights',
    'nightly_rate_5_nights',
    'nightly_rate_6_nights',
    'nightly_rate_7_nights',
    'cleaning_fee',
    'damage_deposit',
    'price_override',
    'extra_charges',
  ];

  const updateFields: Record<string, number | null> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (!allowedFields.includes(key)) {
      throw new Error(`Field not allowed: ${key}`);
    }
    updateFields[key] = value;
  }

  const updateData = {
    ...updateFields,
    'Modified Date': new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('listing')
    .update(updateData)
    .in('id', listingIds)
    .select();

  if (error) {
    console.error('[pricing-admin] Bulk update error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`Failed to bulk update: ${error.message}`);
  }

  return { updated: data?.length || 0, listingIds };
}

/**
 * Set or clear price override for a listing
 */
async function handleSetOverride(
  payload: SetOverridePayload,
  supabase: SupabaseClient,
  _userId: string
) {
  const { listingId, priceOverride } = payload;

  if (!listingId) {
    throw new Error('listingId is required');
  }

  // priceOverride can be null (to clear) or a positive number
  if (priceOverride !== null && (typeof priceOverride !== 'number' || priceOverride < 0)) {
    throw new Error('priceOverride must be null or a positive number');
  }

  const { data, error } = await supabase
    .from('listing')
    .update({
      'price_override': priceOverride,
      'Modified Date': new Date().toISOString(),
    })
    .eq('id', listingId)
    .select()
    .single();

  if (error) {
    console.error('[pricing-admin] Set override error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`Failed to set price override: ${error.message}`);
  }

  return data;
}

/**
 * Toggle listing active status
 */
async function handleToggleActive(
  payload: ToggleActivePayload,
  supabase: SupabaseClient,
  _userId: string
) {
  const { listingId, active } = payload;

  if (!listingId) {
    throw new Error('listingId is required');
  }

  if (typeof active !== 'boolean') {
    throw new Error('active must be a boolean');
  }

  const { data, error } = await supabase
    .from('listing')
    .update({
      '✅Active': active,
      'Modified Date': new Date().toISOString(),
    })
    .eq('id', listingId)
    .select()
    .single();

  if (error) {
    console.error('[pricing-admin] Toggle active error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`Failed to toggle active status: ${error.message}`);
  }

  return data;
}

/**
 * Get global pricing configuration (read-only)
 * Returns hardcoded values from pricingConstants.js
 */
function handleGetConfig() {
  // These match the values in app/src/logic/constants/pricingConstants.js
  return {
    siteMarkupRate: 0.17,
    fullTimeDiscountRate: 0.13,
    fullTimeNightsThreshold: 7,
    minNights: 2,
    maxNights: 7,
    billingCycleWeeks: 4,
    // Note: These are read-only. To change, update pricingConstants.js
    isReadOnly: true,
  };
}

/**
 * Export selected listings as CSV or JSON
 */
async function handleExport(
  payload: ExportPayload,
  supabase: SupabaseClient
) {
  const { listingIds, format = 'csv' } = payload;

  if (!listingIds || !Array.isArray(listingIds) || listingIds.length === 0) {
    throw new Error('listingIds array is required');
  }

  const { data, error } = await supabase
    .from('listing')
    .select(`
      id,
      "🏷Name",
      "✅Active",
      "🏠Rental Type",
      "📍Borough",
      "📍Neighborhood",
      "unit_markup",
      "weekly_host_rate",
      "monthly_host_rate",
      "nightly_rate_2_nights",
      "nightly_rate_3_nights",
      "nightly_rate_4_nights",
      "nightly_rate_5_nights",
      "nightly_rate_6_nights",
      "nightly_rate_7_nights",
      "cleaning_fee",
      "damage_deposit",
      "price_override",
      "extra_charges",
      "Created Date",
      host:👤Host(email, "First Name", "Last Name")
    `)
    .in('id', listingIds);

  if (error) {
    throw new Error(`Failed to fetch listings for export: ${error.message}`);
  }

  if (format === 'json') {
    return { content: JSON.stringify(data, null, 2), format: 'json' };
  }

  // Generate CSV
  const headers = [
    'ID', 'Name', 'Active', 'Rental Type', 'Borough', 'Neighborhood',
    'Unit Markup', 'Weekly Host Rate', 'Monthly Host Rate',
    'Nightly Rate (2)', 'Nightly Rate (3)', 'Nightly Rate (4)',
    'Nightly Rate (5)', 'Nightly Rate (6)', 'Nightly Rate (7)',
    'Cleaning Cost', 'Damage Deposit', 'Price Override', 'Extra Charges',
    'Host Email', 'Host Name', 'Created Date'
  ];

  const rows = (data || []).map((listing: Record<string, unknown>) => {
    const host = listing.host as Record<string, string> | null;

    return [
      listing.id,
      listing['🏷Name'] || '',
      listing['✅Active'] ? 'Yes' : 'No',
      listing['🏠Rental Type'] || '',
      listing['📍Borough'] || '',
      listing['📍Neighborhood'] || '',
      listing['unit_markup'] ?? '',
      listing['weekly_host_rate'] ?? '',
      listing['monthly_host_rate'] ?? '',
      listing['nightly_rate_2_nights'] ?? '',
      listing['nightly_rate_3_nights'] ?? '',
      listing['nightly_rate_4_nights'] ?? '',
      listing['nightly_rate_5_nights'] ?? '',
      listing['nightly_rate_6_nights'] ?? '',
      listing['nightly_rate_7_nights'] ?? '',
      listing['cleaning_fee'] ?? '',
      listing['damage_deposit'] ?? '',
      listing['price_override'] ?? '',
      listing['extra_charges'] ?? '',
      host?.email || '',
      `${host?.['First Name'] || ''} ${host?.['Last Name'] || ''}`.trim(),
      listing['Created Date'] || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');

  return { content: csv, format: 'csv' };
}

console.log("[pricing-admin] Edge Function ready");
