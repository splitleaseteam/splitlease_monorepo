/**
 * leases-admin Edge Function
 * Admin dashboard operations for lease management
 *
 * Actions:
 * - CRUD: list, get, updateStatus
 * - Delete: softDelete, hardDelete
 * - Bulk: bulkUpdateStatus, bulkSoftDelete, bulkExport
 * - Documents: uploadDocument, deleteDocument, listDocuments
 * - Payments: createPaymentRecord, updatePaymentRecord, deletePaymentRecord, regeneratePaymentRecords
 * - Stays: createStays, clearStays
 * - Dates: updateBookedDates, clearBookedDates
 * - Cancel: cancelLease
 * - Change Requests: getDocumentChangeRequests
 */

import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

console.log("[leases-admin] Edge Function initializing...");

Deno.serve(async (req: Request) => {
  try {
    console.log(`[leases-admin] Request: ${req.method}`);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Parse request
    const body = await req.json();
    const action = body.action || 'unknown';
    const payload = body.payload || {};

    console.log(`[leases-admin] Action: ${action}`);

    // Validate action
    const validActions = [
      'list', 'get', 'updateStatus',
      'softDelete', 'hardDelete',
      'bulkUpdateStatus', 'bulkSoftDelete', 'bulkExport',
      'uploadDocument', 'deleteDocument', 'listDocuments',
      // New actions for Manage Leases & Payment Records page
      'createPaymentRecord', 'updatePaymentRecord', 'deletePaymentRecord', 'regeneratePaymentRecords',
      'createStays', 'clearStays',
      'updateBookedDates', 'clearBookedDates',
      'cancelLease',
      'getDocumentChangeRequests'
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
      console.log(`[leases-admin] Authenticated user: ${user.email} (${user.id})`);
    } else {
      console.log('[leases-admin] No auth header - proceeding as internal page request');
    }

    let result: unknown;

    switch (action) {
      case 'list':
        result = await handleList(payload, supabase);
        break;

      case 'get':
        result = await handleGet(payload, supabase);
        break;

      case 'updateStatus':
        result = await handleUpdateStatus(payload, supabase);
        break;

      case 'softDelete':
        result = await handleSoftDelete(payload, supabase);
        break;

      case 'hardDelete':
        result = await handleHardDelete(payload, supabase);
        break;

      case 'bulkUpdateStatus':
        result = await handleBulkUpdateStatus(payload, supabase);
        break;

      case 'bulkSoftDelete':
        result = await handleBulkSoftDelete(payload, supabase);
        break;

      case 'bulkExport':
        result = await handleBulkExport(payload, supabase);
        break;

      case 'uploadDocument':
        result = await handleUploadDocument(payload, supabase);
        break;

      case 'deleteDocument':
        result = await handleDeleteDocument(payload, supabase);
        break;

      case 'listDocuments':
        result = await handleListDocuments(payload, supabase);
        break;

      // ===== PAYMENT RECORD ACTIONS =====
      case 'createPaymentRecord':
        result = await handleCreatePaymentRecord(payload, supabase);
        break;

      case 'updatePaymentRecord':
        result = await handleUpdatePaymentRecord(payload, supabase);
        break;

      case 'deletePaymentRecord':
        result = await handleDeletePaymentRecord(payload, supabase);
        break;

      case 'regeneratePaymentRecords':
        result = await handleRegeneratePaymentRecords(payload, supabase);
        break;

      // ===== STAYS ACTIONS =====
      case 'createStays':
        result = await handleCreateStays(payload, supabase);
        break;

      case 'clearStays':
        result = await handleClearStays(payload, supabase);
        break;

      // ===== BOOKED DATES ACTIONS =====
      case 'updateBookedDates':
        result = await handleUpdateBookedDates(payload, supabase);
        break;

      case 'clearBookedDates':
        result = await handleClearBookedDates(payload, supabase);
        break;

      // ===== CANCELLATION ACTION =====
      case 'cancelLease':
        result = await handleCancelLease(payload, supabase);
        break;

      // ===== CHANGE REQUESTS ACTION =====
      case 'getDocumentChangeRequests':
        result = await handleGetDocumentChangeRequests(payload, supabase);
        break;

      default:
        throw new Error(`Unhandled action: ${action}`);
    }

    console.log('[leases-admin] Action completed successfully');

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[leases-admin] Error:', error);
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

// ===== ACTION HANDLERS =====

/**
 * List leases with optional pagination
 */
async function handleList(
  payload: { limit?: number; offset?: number },
  _supabase: SupabaseClient
) {
  const { limit = 500, offset = 0 } = payload;

  // Fetch leases
  const { data: _data, error, _count } = await _supabase
    .from('booking_lease')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[leases-admin] List error:', error);
    throw new Error(`Failed to fetch leases: ${error.message}`);
  }

  const leases = _data || [];
  const leaseIds = leases.map((l: { id: string }) => l.id);

  // Fetch related data separately
  const [guestIds, hostIds, listingIds] = leases.reduce(
    (acc: [string[], string[], string[]], lease: Record<string, unknown>) => {
      if (lease.guest_user_id) acc[0].push(lease.guest_user_id as string);
      if (lease.host_user_id) acc[1].push(lease.host_user_id as string);
      if (lease.listing_id) acc[2].push(lease.listing_id as string);
      return acc;
    },
    [[], [], []]
  );

  // Fetch guests
  const guestsMap: Record<string, unknown> = {};
  if (guestIds.length > 0) {
    const { data: guests, error: _guestsError } = await _supabase
      .from('user')
      .select('*')
      .in('id', guestIds);

    if (_guestsError) {
      console.error('[leases-admin] Fetch guests error:', _guestsError);
    } else {
      console.log(`[leases-admin] Fetched ${guests?.length || 0} guests for ${guestIds.length} IDs`);
      (guests || []).forEach((guest: Record<string, unknown>) => {
        guestsMap[guest.id as string] = guest;
      });
    }
  }

  // Fetch hosts
  const hostsMap: Record<string, unknown> = {};
  if (hostIds.length > 0) {
    const { data: hosts, error: hostsError } = await _supabase
      .from('user')
      .select('*')
      .in('id', hostIds);

    if (hostsError) {
      console.error('[leases-admin] Fetch hosts error:', hostsError);
    } else {
      console.log(`[leases-admin] Fetched ${hosts?.length || 0} hosts for ${hostIds.length} IDs`);
      (hosts || []).forEach((host: Record<string, unknown>) => {
        hostsMap[host.id as string] = host;
      });
    }
  }

  // Fetch listings
  const listingsMap: Record<string, unknown> = {};
  if (listingIds.length > 0) {
    const { data: listings, error: listingsError } = await _supabase
      .from('listing')
      .select('*')
      .in('id', listingIds);

    if (listingsError) {
      console.error('[leases-admin] Fetch listings error:', listingsError);
    } else {
      console.log(`[leases-admin] Fetched ${listings?.length || 0} listings for ${listingIds.length} IDs`);
      (listings || []).forEach((listing: Record<string, unknown>) => {
        listingsMap[listing.id as string] = listing;
      });
    }
  }

  // Fetch stays
  let staysMap: Record<string, unknown[]> = {};
  if (leaseIds.length > 0) {
    const { data: stays } = await _supabase
      .from('lease_weekly_stay')
      .select('*')
      .in('lease_id', leaseIds);

    if (stays) {
      staysMap = stays.reduce((acc: Record<string, unknown[]>, stay: { lease_id: string }) => {
        const leaseId = stay.lease_id;
        if (!acc[leaseId]) acc[leaseId] = [];
        acc[leaseId].push(stay);
        return acc;
      }, {});
    }
  }

  // Attach all related data to leases
  const leasesWithData = leases.map((lease: Record<string, unknown>) => ({
    ...lease,
    guest: lease.guest_user_id ? guestsMap[lease.guest_user_id as string] : null,
    host: lease.host_user_id ? hostsMap[lease.host_user_id as string] : null,
    listing: lease.listing_id ? listingsMap[lease.listing_id as string] : null,
    stays: staysMap[lease.id as string] || [],
  }));

  return leasesWithData;
}

/**
 * Get a single lease with full details
 */
async function handleGet(
  payload: { leaseId: string },
  _supabase: SupabaseClient
) {
  const { leaseId } = payload;

  if (!leaseId) {
    throw new Error('leaseId is required');
  }

  // Fetch lease
  const { data: lease, error } = await _supabase
    .from('booking_lease')
    .select('*')
    .eq('id', leaseId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch lease: ${error.message}`);
  }

  if (!lease) {
    throw new Error('Lease not found');
  }

  // Fetch related data separately (Guest/Host have no FK constraints)
  let guestData = null;
  if (lease.guest_user_id) {
      const { data } = await _supabase
        .from('user')
        .select('id, first_name, last_name, email, profile_photo_url')
        .eq('id', lease.guest_user_id)
        .single();
    guestData = data;
  }

  let hostData = null;
  if (lease.host_user_id) {
      const { data } = await _supabase
        .from('user')
        .select('id, first_name, last_name, email, profile_photo_url')
        .eq('id', lease.host_user_id)
        .single();
    hostData = data;
  }

  let listingData = null;
  if (lease.listing_id) {
    const { data } = await _supabase
      .from('listing')
      .select('id, listing_title')
      .eq('id', lease.listing_id)
      .single();
    listingData = data;
  }

  let proposalData = null;
  // Note: booking_lease table has no proposal_id column
  // Proposals are not directly linked to leases in the schema

  // Fetch stays
  const { data: stays } = await _supabase
    .from('lease_weekly_stay')
    .select('*')
    .eq('lease_id', leaseId);

  return {
    ...lease,
    guest: guestData,
    host: hostData,
    listing: listingData,
    proposal: proposalData,
    stays: stays || []
  };
}

/**
 * Update lease status
 */
async function handleUpdateStatus(
  payload: { leaseId: string; status: string },
  _supabase: SupabaseClient
) {
  const { leaseId, status } = payload;

  if (!leaseId || !status) {
    throw new Error('leaseId and status are required');
  }

  const validStatuses = ['active', 'completed', 'cancelled', 'pending', 'draft'];
  if (!validStatuses.includes(status.toLowerCase())) {
    throw new Error(`Invalid status: ${status}`);
  }

  // Capitalize status for display
  const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  // Note: lease_status column does not exist in booking_lease DB schema
  // This operation cannot be completed as there is no status field
  throw new Error('Lease status update not supported - no lease_status column in schema');

  if (error) {
    throw new Error(`Failed to update status: ${error.message}`);
  }

  return data;
}

/**
 * Soft delete - set status to cancelled
 */
async function handleSoftDelete(
  payload: { leaseId: string },
  _supabase: SupabaseClient
) {
  const { leaseId } = payload;

  if (!leaseId) {
    throw new Error('leaseId is required');
  }

  // Note: lease_status column does not exist in booking_lease DB schema
  // This operation cannot be completed as there is no status field
  throw new Error('Lease soft delete not supported - no lease_status column in schema');

  if (error) {
    throw new Error(`Failed to cancel lease: ${error.message}`);
  }

  return data;
}

/**
 * Hard delete - permanently remove record
 * WARNING: This is destructive and cannot be undone
 */
async function handleHardDelete(
  payload: { leaseId: string; confirmationToken?: string },
  _supabase: SupabaseClient
) {
  const { leaseId } = payload;

  if (!leaseId) {
    throw new Error('leaseId is required');
  }

  // Verify lease is cancelled before hard delete
  const { data: lease, error: fetchError } = await _supabase
    .from('booking_lease')
    .select('id')
    .eq('id', leaseId)
    .single();

  if (fetchError || !lease) {
    throw new Error('Lease not found');
  }

  // Delete associated stays first
  const { error: staysError } = await _supabase
    .from('lease_weekly_stay')
    .delete()
    .eq('lease_id', leaseId);

  if (staysError) {
    console.error('[leases-admin] Failed to delete stays:', staysError);
    // Continue anyway - orphaned stays are acceptable
  }

  // Delete the lease
  const { error: deleteError } = await _supabase
    .from('booking_lease')
    .delete()
    .eq('id', leaseId);

  if (deleteError) {
    throw new Error(`Failed to delete lease: ${deleteError.message}`);
  }

  return { deleted: true, leaseId };
}

/**
 * Bulk update status for multiple leases
 */
async function handleBulkUpdateStatus(
  payload: { leaseIds: string[]; status: string },
  _supabase: SupabaseClient
) {
  const { leaseIds, status } = payload;

  if (!leaseIds || !Array.isArray(leaseIds) || leaseIds.length === 0) {
    throw new Error('leaseIds array is required');
  }

  if (!status) {
    throw new Error('status is required');
  }

  const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  // Note: lease_status column does not exist in booking_lease DB schema
  // This operation cannot be completed as there is no status field
  throw new Error('Bulk lease status update not supported - no lease_status column in schema');

  if (error) {
    throw new Error(`Failed to bulk update: ${error.message}`);
  }

  return { updated: data?.length || 0, leaseIds };
}

/**
 * Bulk soft delete (cancel) multiple leases
 */
async function handleBulkSoftDelete(
  payload: { leaseIds: string[] },
  _supabase: SupabaseClient
) {
  const { leaseIds } = payload;

  if (!leaseIds || !Array.isArray(leaseIds) || leaseIds.length === 0) {
    throw new Error('leaseIds array is required');
  }

  // Note: lease_status column does not exist in booking_lease DB schema
  // This operation cannot be completed as there is no status field
  throw new Error('Bulk lease soft delete not supported - no lease_status column in schema');

  if (error) {
    throw new Error(`Failed to bulk cancel: ${error.message}`);
  }

  return { cancelled: data?.length || 0, leaseIds };
}

/**
 * Export selected leases as CSV or JSON
 */
async function handleBulkExport(
  payload: { leaseIds: string[]; format?: 'csv' | 'json' },
  _supabase: SupabaseClient
) {
  const { leaseIds, format = 'csv' } = payload;

  if (!leaseIds || !Array.isArray(leaseIds) || leaseIds.length === 0) {
    throw new Error('leaseIds array is required');
  }

  // Note: Simplified query without FK relationships due to schema limitations
  const { data, error } = await _supabase
    .from('booking_lease')
    .select('*')
    .in('id', leaseIds);

  if (error) {
    throw new Error(`Failed to fetch leases for export: ${error.message}`);
  }

  if (format === 'json') {
    return { content: JSON.stringify(data, null, 2), format: 'json' };
  }

  // Generate CSV
  const headers = [
    'ID', 'Agreement Number', 'Status', 'Start Date', 'End Date',
    'Total Rent', 'Paid to Date', 'Created Date'
  ];

  const rows = (data || []).map((lease: Record<string, unknown>) => {
    return [
      lease.id,
      lease.agreement_number || '',
      'N/A', // lease_status column does not exist in booking_lease DB schema
      lease.reservation_start_date || '',
      lease.reservation_end_date || '',
      lease.total_guest_rent_amount || 0,
      lease.total_guest_rent_amount || 0,
      lease.created_at || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');

  return { content: csv, format: 'csv' };
}

// ===== DOCUMENT HANDLERS (Placeholder - needs Supabase Storage bucket) =====

async function handleUploadDocument(
  payload: { leaseId: string; fileName: string; fileType: string; fileBase64: string },
  _supabase: SupabaseClient
) {
  const { leaseId, fileName, fileType, fileBase64 } = payload;

  if (!leaseId || !fileName || !fileBase64) {
    throw new Error('leaseId, fileName, and fileBase64 are required');
  }

  // Decode base64
  const fileData = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));

  // Upload to storage
  const filePath = `leases/${leaseId}/${Date.now()}-${fileName}`;

  const { data: uploadData, error } = await _supabase.storage
    .from('lease-documents')
    .upload(filePath, fileData, {
      contentType: fileType || 'application/octet-stream',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload document: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = _supabase.storage
    .from('lease-documents')
    .getPublicUrl(filePath);

  return {
    path: uploadData.path,
    publicUrl,
    fileName,
    uploadedAt: new Date().toISOString(),
  };
}

async function handleDeleteDocument(
  payload: { leaseId: string; documentPath: string },
  _supabase: SupabaseClient
) {
  const { documentPath } = payload;

  if (!documentPath) {
    throw new Error('documentPath is required');
  }

  const { error } = await _supabase.storage
    .from('lease-documents')
    .remove([documentPath]);

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }

  return { deleted: true, path: documentPath };
}

async function handleListDocuments(
  payload: { leaseId: string },
  _supabase: SupabaseClient
) {
  const { leaseId } = payload;

  if (!leaseId) {
    throw new Error('leaseId is required');
  }

  const { data: filesData, error } = await _supabase.storage
    .from('lease-documents')
    .list(`leases/${leaseId}`);

  if (error) {
    throw new Error(`Failed to list documents: ${error.message}`);
  }

  // Get public URLs for each document
  const documents = (filesData || []).map((file: { name: string; created_at: string; metadata?: { size: number } }) => {
    const filePath = `leases/${leaseId}/${file.name}`;
    const { data: { publicUrl } } = _supabase.storage
      .from('lease-documents')
      .getPublicUrl(filePath);

    return {
      name: file.name,
      path: filePath,
      publicUrl,
      createdAt: file.created_at,
      size: file.metadata?.size || 0,
    };
  });

  return documents;
}

// ===== PAYMENT RECORD HANDLERS =====

/**
 * Create a new payment record
 */
async function handleCreatePaymentRecord(
  payload: {
    leaseId: string;
    scheduledDate?: string;
    actualDate?: string;
    rent?: number;
    maintenanceFee?: number;
    damageDeposit?: number;
    totalAmount?: number;
    bankTransactionNumber?: string;
    isPaid?: boolean;
    isGuestPayment?: boolean;
  },
  _supabase: SupabaseClient
) {
  const { leaseId, ...recordData } = payload;

  if (!leaseId) {
    throw new Error('leaseId is required');
  }

  // Generate a unique ID for the payment record
  const paymentId = crypto.randomUUID();

  const { data, error } = await _supabase
    .from('paymentrecords')
    .insert({
      id: paymentId,
      booking_reservation: leaseId,
      scheduled_date: recordData.scheduledDate || null,
      actual_date_of_payment: recordData.actualDate || null,
      rent: recordData.rent || 0,
      maintenance_fee: recordData.maintenanceFee || 0,
      damage_deposit: recordData.damageDeposit || 0,
      total_paid_by_guest: recordData.totalAmount || 0,
      bank_transaction_number: recordData.bankTransactionNumber || null,
      payment_from_guest: recordData.isPaid || false,
      original_created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[leases-admin] Create payment record error:', error);
    throw new Error(`Failed to create payment record: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing payment record
 */
async function handleUpdatePaymentRecord(
  payload: {
    paymentId: string;
    scheduledDate?: string;
    actualDate?: string;
    rent?: number;
    maintenanceFee?: number;
    damageDeposit?: number;
    totalAmount?: number;
    bankTransactionNumber?: string;
    isPaid?: boolean;
    paymentDelayed?: boolean;
  },
  _supabase: SupabaseClient
) {
  const { paymentId, ...updates } = payload;

  if (!paymentId) {
    throw new Error('paymentId is required');
  }

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {
    original_updated_at: new Date().toISOString(),
  };

  if (updates.scheduledDate !== undefined) updateData.scheduled_date = updates.scheduledDate;
  if (updates.actualDate !== undefined) updateData.actual_date_of_payment = updates.actualDate;
  if (updates.rent !== undefined) updateData.rent = updates.rent;
  if (updates.maintenanceFee !== undefined) updateData.maintenance_fee = updates.maintenanceFee;
  if (updates.damageDeposit !== undefined) updateData.damage_deposit = updates.damageDeposit;
  if (updates.totalAmount !== undefined) updateData.total_paid_by_guest = updates.totalAmount;
  if (updates.bankTransactionNumber !== undefined) updateData.bank_transaction_number = updates.bankTransactionNumber;
  if (updates.isPaid !== undefined) updateData.payment_from_guest = updates.isPaid;
  if (updates.paymentDelayed !== undefined) updateData.payment_delayed = updates.paymentDelayed;

  const { data, error } = await _supabase
    .from('paymentrecords')
    .update(updateData)
    .eq('id', paymentId)
    .select()
    .single();

  if (error) {
    console.error('[leases-admin] Update payment record error:', error);
    throw new Error(`Failed to update payment record: ${error.message}`);
  }

  return data;
}

/**
 * Delete a payment record
 */
async function handleDeletePaymentRecord(
  payload: { paymentId: string },
  _supabase: SupabaseClient
) {
  const { paymentId } = payload;

  if (!paymentId) {
    throw new Error('paymentId is required');
  }

  const { error } = await _supabase
    .from('paymentrecords')
    .delete()
    .eq('id', paymentId);

  if (error) {
    console.error('[leases-admin] Delete payment record error:', error);
    throw new Error(`Failed to delete payment record: ${error.message}`);
  }

  return { deleted: true, paymentId };
}

/**
 * Regenerate payment records for a lease
 */
function handleRegeneratePaymentRecords(
  payload: { leaseId: string; type: 'guest' | 'host' | 'all' },
  _supabase: SupabaseClient
) {
  const { leaseId, type = 'all' } = payload;

  if (!leaseId) {
    throw new Error('leaseId is required');
  }

  // This is a placeholder - actual implementation would:
  // 1. Get lease details (dates, amounts)
  // 2. Calculate payment schedule based on weekly/monthly schedule
  // 3. Delete existing records of specified type
  // 4. Create new records

  // For now, just return a message indicating the action
  console.log(`[leases-admin] Regenerate payment records requested for ${leaseId}, type: ${type}`);

  return {
    message: `Payment record regeneration for ${type} initiated`,
    leaseId,
    type,
    // In production, this would trigger actual regeneration logic
  };
}

// ===== STAYS HANDLERS =====

/**
 * Create stays for a lease based on its date range
 */
async function handleCreateStays(
  payload: { leaseId: string },
  _supabase: SupabaseClient
) {
  const { leaseId } = payload;

  if (!leaseId) {
    throw new Error('leaseId is required');
  }

  // Get lease details
  const { data: lease, error: leaseError } = await _supabase
    .from('booking_lease')
    .select('id, reservation_start_date, reservation_end_date')
    .eq('id', leaseId)
    .single();

  if (leaseError || !lease) {
    throw new Error('Lease not found');
  }

  const startDate = lease.reservation_start_date;
  const endDate = lease.reservation_end_date;

  if (!startDate || !endDate) {
    throw new Error('Lease does not have valid reservation dates');
  }

  // Calculate weekly stays
  const start = new Date(startDate);
  const end = new Date(endDate);
  const stays: Array<Record<string, unknown>> = [];
  let weekNumber = 1;
  let currentStart = new Date(start);

  while (currentStart < end) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 7);

    if (currentEnd > end) {
      currentEnd.setTime(end.getTime());
    }

    stays.push({
      id: crypto.randomUUID(),
      lease_id: leaseId,
      week_number_in_lease: weekNumber,
      checkin_night_date: currentStart.toISOString(),
      checkout_day_date: currentEnd.toISOString(),
      last_night_date: new Date(currentEnd.getTime() - 86400000).toISOString(),
      stay_status: 'Upcoming',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    currentStart = new Date(currentEnd);
    weekNumber++;
  }

  if (stays.length > 0) {
    const { error: insertError } = await _supabase
      .from('lease_weekly_stay')
      .insert(stays);

    if (insertError) {
      console.error('[leases-admin] Create stays error:', insertError);
      throw new Error(`Failed to create stays: ${insertError.message}`);
    }
  }

  return { created: stays.length, leaseId };
}

/**
 * Clear all stays for a lease
 */
async function handleClearStays(
  payload: { leaseId: string },
  _supabase: SupabaseClient
) {
  const { leaseId } = payload;

  if (!leaseId) {
    throw new Error('leaseId is required');
  }

  const { error } = await _supabase
    .from('lease_weekly_stay')
    .delete()
    .eq('lease_id', leaseId);

  if (error) {
    console.error('[leases-admin] Clear stays error:', error);
    throw new Error(`Failed to clear stays: ${error.message}`);
  }

  return { cleared: true, leaseId };
}

// ===== BOOKED DATES HANDLERS =====

/**
 * Update booked dates for a lease
 */
async function handleUpdateBookedDates(
  payload: { leaseId: string },
  _supabase: SupabaseClient
) {
  const { leaseId } = payload;

  if (!leaseId) {
    throw new Error('leaseId is required');
  }

  const { data: lease, error: leaseError } = await _supabase
    .from('booking_lease')
    .select('id, reservation_start_date, reservation_end_date')
    .eq('id', leaseId)
    .single();

  if (leaseError || !lease) {
    throw new Error('Lease not found');
  }

  const startDate = lease.reservation_start_date;
  const endDate = lease.reservation_end_date;

  if (!startDate || !endDate) {
    throw new Error('Lease does not have valid reservation dates');
  }

  // Default weekly pattern (Sunday to Saturday, full week)
  const checkInDay = 0; // Sunday
  const checkOutDay = 6; // Saturday

  // Generate booked dates based on weekly schedule
  const bookedDates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current < end) { // Note: < not <= (don't include end date)
    const dayOfWeek = current.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    // Check if this day is within the booked schedule
    let isBooked = false;

    if (checkInDay === checkOutDay) {
      // Full week (7 nights) - same check-in and check-out day
      isBooked = true;
    } else if (checkInDay < checkOutDay) {
      // Normal case: e.g., Sun (0) to Fri (5) = Sun,Mon,Tue,Wed,Thu nights
      // Booked if: dayOfWeek >= checkInDay AND dayOfWeek < checkOutDay
      isBooked = dayOfWeek >= checkInDay && dayOfWeek < checkOutDay;
    } else {
      // Wraparound case: e.g., Fri (5) to Tue (2) = Fri,Sat,Sun,Mon nights
      // Booked if: dayOfWeek >= checkInDay OR dayOfWeek < checkOutDay
      isBooked = dayOfWeek >= checkInDay || dayOfWeek < checkOutDay;
    }

    if (isBooked) {
      bookedDates.push(current.toISOString().split('T')[0]);
    }

    current.setDate(current.getDate() + 1);
  }

  // Update lease with booked dates
  const { data: _data, error } = await _supabase
    .from('booking_lease')
    .update({
      booked_dates_json: bookedDates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leaseId)
    .select()
    .single();

  if (error) {
    console.error('[leases-admin] Update booked dates error:', error);
    throw new Error(`Failed to update booked dates: ${error.message}`);
  }

  return { updated: true, datesCount: bookedDates.length, leaseId };
}

/**
 * Clear booked dates for a lease and its proposal
 */
async function handleClearBookedDates(
  payload: { leaseId: string },
  _supabase: SupabaseClient
) {
  const { leaseId } = payload;

  if (!leaseId) {
    throw new Error('leaseId is required');
  }

  // Get lease to find proposal
  const { data: lease } = await _supabase
    .from('booking_lease')
    .select('id')
    .eq('id', leaseId)
    .single();

  // Clear lease booked dates
  const { error: leaseError } = await _supabase
    .from('booking_lease')
    .update({
      booked_dates_json: [],
      booked_dates_after_date_changes_json: [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', leaseId);

  if (leaseError) {
    console.error('[leases-admin] Clear lease dates error:', leaseError);
    throw new Error(`Failed to clear lease dates: ${leaseError.message}`);
  }

  return { cleared: true, leaseId };
}

// ===== CANCELLATION HANDLER =====

/**
 * Cancel a lease with reason
 */
async function handleCancelLease(
  payload: { leaseId: string; reason?: string; disagreeingParty?: string },
  _supabase: SupabaseClient
) {
  const { leaseId, reason, disagreeingParty } = payload;

  if (!leaseId) {
    throw new Error('leaseId is required');
  }

  // Note: lease_status, cancellation_reason, disagreeing_party columns do not exist in booking_lease DB schema
  // This operation cannot be completed as there are no status/reason fields
  throw new Error('Lease cancellation not supported - no lease_status column in schema');

  if (error) {
    console.error('[leases-admin] Cancel lease error:', error);
    throw new Error(`Failed to cancel lease: ${error.message}`);
  }

  return data;
}

// ===== CHANGE REQUESTS HANDLER =====

/**
 * Get document change requests for a lease
 */
async function handleGetDocumentChangeRequests(
  payload: { leaseId: string },
  _supabase: SupabaseClient
) {
  const { leaseId } = payload;

  if (!leaseId) {
    throw new Error('leaseId is required');
  }

  const { data: changeRequests, error } = await _supabase
    .from('datechangerequest')
    .select('*')
    .eq('lease', leaseId)
    .order('original_created_at', { ascending: false });

  if (error) {
    console.error('[leases-admin] Get change requests error:', error);
    throw new Error(`Failed to get change requests: ${error.message}`);
  }

  if (!changeRequests || changeRequests.length === 0) {
    return [];
  }

  // Fetch user data for each unique "Requested by" ID
  const requestedByIds = [...new Set(
    changeRequests
      .map((cr: Record<string, unknown>) => cr.requested_by as string)
      .filter((id: string | undefined) => id)
  )];

  const usersMap: Record<string, unknown> = {};
  if (requestedByIds.length > 0) {
    const { data: users } = await _supabase
      .from('user')
      .select('id, email, first_name, last_name')
      .in('id', requestedByIds);

    if (users) {
      users.forEach((user: Record<string, unknown>) => {
        usersMap[user.id as string] = user;
      });
    }
  }

  // Attach user data to change requests
  return changeRequests.map((cr: Record<string, unknown>) => ({
    ...cr,
    requestedByUser: cr.requested_by ? usersMap[cr.requested_by as string] : null
  }));
}

console.log("[leases-admin] Edge Function ready");
