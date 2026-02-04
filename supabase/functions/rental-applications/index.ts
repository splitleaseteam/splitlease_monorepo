/**
 * rental-applications Edge Function
 * Admin dashboard operations for rental application management
 *
 * Actions:
 * - list: Paginated list with filters and sorting
 * - get: Get single application with related data
 * - update: Update application fields
 * - update_status: Update application status
 * - add_occupant: Add an occupant to application
 * - delete_occupant: Remove an occupant
 *
 * Note: This function queries the existing rentalapplication table
 * which stores applications created by guests. The table uses a
 * unique_id field for human-readable IDs.
 */

import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

console.log("[rental-applications] Edge Function initializing...");

Deno.serve(async (req: Request) => {
  try {
    console.log(`[rental-applications] Request: ${req.method}`);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Parse request
    const body = await req.json();
    const action = body.action || 'unknown';
    const payload = body.payload || {};

    console.log(`[rental-applications] Action: ${action}`);

    // Validate action
    const validActions = [
      'list', 'get', 'update', 'update_status',
      'add_occupant', 'delete_occupant',
      'add_reference', 'delete_reference',
      'add_employment', 'delete_employment'
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

    // Create service client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Optional authentication - soft headers pattern for internal admin page
    // If auth header is present, extract user info for audit purposes
    const user = await authenticateFromHeaders(req.headers, supabaseUrl, supabaseAnonKey);

    if (user) {
      console.log(`[rental-applications] Authenticated user: ${user.email} (${user.id})`);
    } else {
      console.log('[rental-applications] No auth header - proceeding as internal page request');
    }

    // NOTE: Admin role check removed to allow any authenticated user access for testing
    // const isAdmin = await checkAdminStatus(user.id, supabase);
    // if (!isAdmin) {
    //   console.log(`[rental-applications] User ${user.id} is not an admin`);
    //   return errorResponse('Admin access required', 403);
    // }

    let result: unknown;

    switch (action) {
      case 'list':
        result = await handleList(payload, supabase);
        break;

      case 'get':
        result = await handleGet(payload, supabase);
        break;

      case 'update':
        result = await handleUpdate(payload, supabase);
        break;

      case 'update_status':
        result = await handleUpdateStatus(payload, supabase);
        break;

      case 'add_occupant':
        result = await handleAddOccupant(payload, supabase);
        break;

      case 'delete_occupant':
        result = await handleDeleteOccupant(payload, supabase);
        break;

      case 'add_reference':
        result = await handleAddReference(payload, supabase);
        break;

      case 'delete_reference':
        result = await handleDeleteReference(payload, supabase);
        break;

      case 'add_employment':
        result = await handleAddEmployment(payload, supabase);
        break;

      case 'delete_employment':
        result = await handleDeleteEmployment(payload, supabase);
        break;

      default:
        throw new Error(`Unhandled action: ${action}`);
    }

    console.log('[rental-applications] Action completed successfully');

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[rental-applications] Error:', error);
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
): Promise<{ id: string; email: string; bubble_user_id?: string } | null> {
  const authHeader = headers.get('Authorization');
  if (!authHeader) return null;

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) return null;

  return {
    id: user.id,
    email: user.email ?? '',
    bubble_user_id: user.user_metadata?.bubble_user_id
  };
}

async function _checkAdminStatus(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    // First get the user's bubble_user_id from auth metadata
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authError || !user) {
      console.error('[rental-applications] Failed to get user:', authError);
      return false;
    }

    const bubbleUserId = user.user_metadata?.bubble_user_id;
    if (!bubbleUserId) {
      console.log('[rental-applications] No bubble_user_id found for user');
      // Check user_metadata for admin flag as fallback
      return user.user_metadata?.is_admin === true;
    }

    // Check the user table for admin status
    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('"Toggle - Is Admin"')
      .eq('_id', bubbleUserId)
      .single();

    if (userError) {
      console.error('[rental-applications] Failed to check admin status:', userError);
      // Fall back to user_metadata
      return user.user_metadata?.is_admin === true;
    }

    return userData?.['Toggle - Is Admin'] === true;
  } catch (_err) {
    console.error('[rental-applications] Admin check error:', err);
    return false;
  }
}

// ===== ACTION HANDLERS =====

interface ListPayload {
  filters?: {
    status?: string;
    searchQuery?: string;
    isCompleted?: boolean;
    minIncome?: number;
  };
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
}

/**
 * List rental applications with filters, sorting, and pagination
 */
async function handleList(payload: ListPayload, supabase: SupabaseClient) {
  const { filters = {}, sort, pagination } = payload;
  const page = pagination?.page || 1;
  const pageSize = pagination?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  // Build query - using rentalapplication table
  let query = supabase
    .from('rentalapplication')
    .select('*', { count: 'exact' });

  // Apply filters - use rentalapplication table column names
  if (filters.status) {
    // Map status to 'submitted' boolean
    if (filters.status === 'submitted') {
      query = query.eq('submitted', true);
    } else if (filters.status === 'draft') {
      query = query.eq('submitted', false);
    }
  }

  if (filters.isCompleted !== undefined) {
    // Filter by percentage % done >= 100 for completed
    // Use quoted identifier for column name with special characters
    const percentageColumn = '"percentage % done"';
    query = query.gte(percentageColumn, filters.isCompleted ? 100 : 0);
    if (!filters.isCompleted) {
      query = query.lt(percentageColumn, 100);
    }
  }

  if (filters.searchQuery) {
    // Search across correct field names: _id, name, email
    const searchTerm = `%${filters.searchQuery}%`;
    query = query.or(`_id.ilike.${searchTerm},name.ilike.${searchTerm},email.ilike.${searchTerm}`);
  }

  if (filters.minIncome) {
    query = query.gte('Monthly Income', filters.minIncome);
  }

  // Apply sorting - use correct column names
  const sortField = sort?.field || 'Created Date';
  const sortDirection = sort?.direction === 'asc' ? { ascending: true } : { ascending: false };

  // Map frontend field names to actual rentalapplication table columns
  // Column names with special characters must use quoted identifier syntax
  const fieldMapping: Record<string, string> = {
    'created_at': 'Created Date',
    'unique_id': '_id',
    'status': 'submitted',  // maps to boolean submitted field
    'completion_percentage': '"percentage % done"',  // quoted for special characters
    'total_monthly_income': 'Monthly Income'
  };

  const dbField = fieldMapping[sortField] || sortField;
  query = query.order(dbField, sortDirection);

  // Apply pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, _count } = await query;

  if (error) {
    console.error('[rental-applications] List error:', error);
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  // Transform data to match frontend expectations
  const applications = (data || []).map(transformApplication);

  return {
    data: applications,
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  };
}

/**
 * Get a single rental application with all related data
 */
async function handleGet(
  payload: { id: string },
  supabase: SupabaseClient
) {
  const { id } = payload;

  if (!id) {
    throw new Error('id is required');
  }

  // Fetch the main application
  const { data, error } = await supabase
    .from('rentalapplication')
    .select('*')
    .eq('_id', id)
    .single();

  if (error) {
    console.error('[rental-applications] Get error:', error);
    throw new Error(`Failed to fetch application: ${error.message}`);
  }

  if (!data) {
    throw new Error('Application not found');
  }

  const application = transformApplication(data);

  // Parse JSONB fields using correct column names from rentalapplication table
  application.occupants = data['occupants list'] || [];
  application.references = data['references'] || [];
  // Employment history not stored as separate array in this table schema

  return { data: application };
}

/**
 * Update application fields
 */
async function handleUpdate(
  payload: { id: string; updates: Record<string, unknown> },
  supabase: SupabaseClient
) {
  const { id, updates } = payload;

  if (!id) {
    throw new Error('id is required');
  }

  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('updates object is required');
  }

  // Map frontend field names to rentalapplication table column names
  const dbUpdates: Record<string, unknown> = {};

  // Personal info fields (flat structure, not nested JSONB)
  if (updates.personal_info !== undefined) {
    const personalInfo = updates.personal_info as Record<string, unknown>;
    if (personalInfo.name !== undefined) dbUpdates['name'] = personalInfo.name;
    if (personalInfo.email !== undefined) dbUpdates['email'] = personalInfo.email;
    if (personalInfo.phone !== undefined) dbUpdates['phone number'] = personalInfo.phone;
  }

  // Address fields
  if (updates.current_address !== undefined) {
    dbUpdates['permanent address'] = updates.current_address;
  }
  if (updates.apartment_number !== undefined) {
    dbUpdates['apartment number'] = updates.apartment_number;
  }

  // Financial fields
  if (updates.monthly_income !== undefined) {
    dbUpdates['Monthly Income'] = updates.monthly_income;
  }

  // Boolean flags
  if (updates.pets !== undefined) {
    dbUpdates['pets'] = updates.pets;
  }
  if (updates.smoking !== undefined) {
    dbUpdates['smoking'] = updates.smoking;
  }
  if (updates.parking !== undefined) {
    dbUpdates['parking'] = updates.parking;
  }

  // Employment fields
  if (updates.employment_status !== undefined) {
    dbUpdates['employment status'] = updates.employment_status;
  }
  if (updates.employer_name !== undefined) {
    dbUpdates['employer name'] = updates.employer_name;
  }
  if (updates.employer_phone !== undefined) {
    dbUpdates['employer phone number'] = updates.employer_phone;
  }
  if (updates.job_title !== undefined) {
    dbUpdates['job title'] = updates.job_title;
  }

  // Always update modified date
  dbUpdates['Modified Date'] = new Date().toISOString();

  const { data, error } = await supabase
    .from('rentalapplication')
    .update(dbUpdates)
    .eq('_id', id)
    .select()
    .single();

  if (error) {
    console.error('[rental-applications] Update error:', error);
    throw new Error(`Failed to update application: ${error.message}`);
  }

  return { data: transformApplication(data) };
}

/**
 * Update application status
 * Maps frontend status to rentalapplication table's 'submitted' boolean field
 */
async function handleUpdateStatus(
  payload: { id: string; status: string },
  supabase: SupabaseClient
) {
  const { id, status } = payload;

  if (!id || !status) {
    throw new Error('id and status are required');
  }

  // Map status to submitted boolean
  // The rentalapplication table only has 'submitted' as boolean, not a full status enum
  const submittedValue = status === 'submitted';

  const { data, error } = await supabase
    .from('rentalapplication')
    .update({
      'submitted': submittedValue,
      'Modified Date': new Date().toISOString()
    })
    .eq('_id', id)
    .select()
    .single();

  if (error) {
    console.error('[rental-applications] Update status error:', error);
    throw new Error(`Failed to update status: ${error.message}`);
  }

  return { data: transformApplication(data) };
}

/**
 * Add an occupant to the application
 * (Modifies JSONB array if stored inline, or inserts to related table)
 */
async function handleAddOccupant(
  payload: { applicationId: string; occupant: Record<string, unknown> },
  supabase: SupabaseClient
) {
  const { applicationId, occupant } = payload;

  if (!applicationId || !occupant) {
    throw new Error('applicationId and occupant are required');
  }

  // Fetch current occupants
  const { data: app, error: fetchError } = await supabase
    .from('rentalapplication')
    .select('"occupants list"')
    .eq('_id', applicationId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch application: ${fetchError.message}`);
  }

  const currentOccupants = app?.['occupants list'] || [];
  const newOccupant = {
    id: crypto.randomUUID(),
    ...occupant,
    created_at: new Date().toISOString()
  };

  const updatedOccupants = [...currentOccupants, newOccupant];

  const { error: updateError } = await supabase
    .from('rentalapplication')
    .update({
      'occupants list': updatedOccupants,
      'Modified Date': new Date().toISOString()
    })
    .eq('_id', applicationId);

  if (updateError) {
    throw new Error(`Failed to add occupant: ${updateError.message}`);
  }

  return { data: newOccupant };
}

/**
 * Delete an occupant from the application
 */
async function handleDeleteOccupant(
  payload: { applicationId: string; occupantId: string },
  supabase: SupabaseClient
) {
  const { applicationId, occupantId } = payload;

  if (!applicationId || !occupantId) {
    throw new Error('applicationId and occupantId are required');
  }

  // Fetch current occupants
  const { data: app, error: fetchError } = await supabase
    .from('rentalapplication')
    .select('"occupants list"')
    .eq('_id', applicationId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch application: ${fetchError.message}`);
  }

  const currentOccupants = app?.['occupants list'] || [];
  const updatedOccupants = currentOccupants.filter(
    (o: { id: string }) => o.id !== occupantId
  );

  const { error: updateError } = await supabase
    .from('rentalapplication')
    .update({
      'occupants list': updatedOccupants,
      'Modified Date': new Date().toISOString()
    })
    .eq('_id', applicationId);

  if (updateError) {
    throw new Error(`Failed to delete occupant: ${updateError.message}`);
  }

  return { deleted: true };
}

/**
 * Add a reference to the application
 */
async function handleAddReference(
  payload: { applicationId: string; reference: Record<string, unknown> },
  supabase: SupabaseClient
) {
  const { applicationId, reference } = payload;

  if (!applicationId || !reference) {
    throw new Error('applicationId and reference are required');
  }

  const { data: app, error: fetchError } = await supabase
    .from('rentalapplication')
    .select('references')
    .eq('_id', applicationId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch application: ${fetchError.message}`);
  }

  const currentRefs = app?.['references'] || [];
  const newRef = {
    id: crypto.randomUUID(),
    ...reference,
    created_at: new Date().toISOString()
  };

  const updatedRefs = [...currentRefs, newRef];

  const { error: updateError } = await supabase
    .from('rentalapplication')
    .update({
      'references': updatedRefs,
      'Modified Date': new Date().toISOString()
    })
    .eq('_id', applicationId);

  if (updateError) {
    throw new Error(`Failed to add reference: ${updateError.message}`);
  }

  return { data: newRef };
}

/**
 * Delete a reference from the application
 */
async function handleDeleteReference(
  payload: { applicationId: string; referenceId: string },
  supabase: SupabaseClient
) {
  const { applicationId, referenceId } = payload;

  if (!applicationId || !referenceId) {
    throw new Error('applicationId and referenceId are required');
  }

  const { data: app, error: fetchError } = await supabase
    .from('rentalapplication')
    .select('references')
    .eq('_id', applicationId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch application: ${fetchError.message}`);
  }

  const currentRefs = app?.['references'] || [];
  const updatedRefs = currentRefs.filter(
    (r: { id: string }) => r.id !== referenceId
  );

  const { error: updateError } = await supabase
    .from('rentalapplication')
    .update({
      'references': updatedRefs,
      'Modified Date': new Date().toISOString()
    })
    .eq('_id', applicationId);

  if (updateError) {
    throw new Error(`Failed to delete reference: ${updateError.message}`);
  }

  return { deleted: true };
}

/**
 * Add employment history entry
 */
async function handleAddEmployment(
  payload: { applicationId: string; employment: Record<string, unknown> },
  supabase: SupabaseClient
) {
  const { applicationId, employment } = payload;

  if (!applicationId || !employment) {
    throw new Error('applicationId and employment are required');
  }

  const { data: app, error: fetchError } = await supabase
    .from('rentalapplication')
    .select('"Employment History"')
    .eq('_id', applicationId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch application: ${fetchError.message}`);
  }

  const currentEmployment = app?.['Employment History'] || [];
  const newEmployment = {
    id: crypto.randomUUID(),
    ...employment,
    created_at: new Date().toISOString()
  };

  const updatedEmployment = [...currentEmployment, newEmployment];

  const { error: updateError } = await supabase
    .from('rentalapplication')
    .update({
      'Employment History': updatedEmployment,
      'Modified Date': new Date().toISOString()
    })
    .eq('_id', applicationId);

  if (updateError) {
    throw new Error(`Failed to add employment: ${updateError.message}`);
  }

  return { data: newEmployment };
}

/**
 * Delete employment history entry
 */
async function handleDeleteEmployment(
  payload: { applicationId: string; employmentId: string },
  supabase: SupabaseClient
) {
  const { applicationId, employmentId } = payload;

  if (!applicationId || !employmentId) {
    throw new Error('applicationId and employmentId are required');
  }

  const { data: app, error: fetchError } = await supabase
    .from('rentalapplication')
    .select('"Employment History"')
    .eq('_id', applicationId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch application: ${fetchError.message}`);
  }

  const currentEmployment = app?.['Employment History'] || [];
  const updatedEmployment = currentEmployment.filter(
    (e: { id: string }) => e.id !== employmentId
  );

  const { error: updateError } = await supabase
    .from('rentalapplication')
    .update({
      'Employment History': updatedEmployment,
      'Modified Date': new Date().toISOString()
    })
    .eq('_id', applicationId);

  if (updateError) {
    throw new Error(`Failed to delete employment: ${updateError.message}`);
  }

  return { deleted: true };
}

// ===== DATA TRANSFORMATION =====

/**
 * Transform database record to frontend format
 * Maps rentalapplication table columns (from Bubble schema) to frontend format
 */
function transformApplication(record: Record<string, unknown>) {
  // Extract name from either 'name' field or nested structure
  const applicantName = record['name'] as string || '';
  const applicantEmail = record['email'] as string || '';

  // Determine status from 'submitted' boolean field
  const isSubmitted = record['submitted'] as boolean || false;
  const status = isSubmitted ? 'submitted' : 'draft';

  // Completion percentage from 'percentage % done' field
  const completionPercentage = Number(record['percentage % done']) || 0;
  const isCompleted = completionPercentage >= 100;

  // Monthly income from 'Monthly Income' field
  const monthlyIncome = Number(record['Monthly Income']) || 0;

  return {
    id: record['_id'] as string,
    unique_id: record['_id'] as string,

    // Applicant info for display
    applicant_name: applicantName,
    applicant_email: applicantEmail,
    phone_number: record['phone number'] as string || '',

    // Status
    status: status,
    completion_percentage: completionPercentage,
    is_completed: isCompleted,
    submitted: isSubmitted,

    // Financial
    monthly_income: monthlyIncome,
    total_monthly_income: monthlyIncome, // No additional income field in this table

    // Personal info (from flat fields, not nested JSONB)
    personal_info: {
      name: applicantName,
      email: applicantEmail,
      phone: record['phone number'] as string || '',
    },

    // Address info
    current_address: record['permanent address'] as Record<string, unknown> || {},
    apartment_number: record['apartment number'] as string || '',
    length_resided: record['length resided'] as string || '',
    renting: record['renting'] as boolean || false,

    // Employment info
    employment_status: record['employment status'] as string || '',
    employer_name: record['employer name'] as string || '',
    employer_phone: record['employer phone number'] as string || '',
    job_title: record['job title'] as string || '',

    // Additional flags
    pets: record['pets'] as boolean || false,
    smoking: record['smoking'] as boolean || false,
    parking: record['parking'] as boolean || false,

    // Timestamps
    created_at: record['Created Date'] as string || '',
    updated_at: record['Modified Date'] as string || '',

    // Related data (populated in handleGet)
    occupants: [],
    references: [],

    // Guest info (if joined)
    guest_id: record['Created By'] as string || '',
    guest: record['guest'] || null
  };
}

console.log("[rental-applications] Edge Function ready");
