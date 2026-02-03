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
    .from('bookings_leases')
    .select('*', { count: 'exact' })
    .order('Created Date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[leases-admin] List error:', error);
    throw new Error(`Failed to fetch leases: ${error.message}`);
  }

  const leases = _data || [];
  const leaseIds = leases.map((l: { _id: string }) => l._id);

  // Fetch related data separately
  const [guestIds, hostIds, listingIds] = leases.reduce(
    (acc: [string[], string[], string[]], lease: Record<string, unknown>) => {
      if (lease.Guest) acc[0].push(lease.Guest as string);
      if (lease.Host) acc[1].push(lease.Host as string);
      if (lease.Listing) acc[2].push(lease.Listing as string);
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
      .in('_id', guestIds);

    if (_guestsError) {
      console.error('[leases-admin] Fetch guests error:', _guestsError);
    } else {
      console.log(`[leases-admin] Fetched ${guests?.length || 0} guests for ${guestIds.length} IDs`);
      (guests || []).forEach((guest: Record<string, unknown>) => {
        guestsMap[guest._id as string] = guest;
      });
    }
  }

  // Fetch hosts
  const hostsMap: Record<string, unknown> = {};
  if (hostIds.length > 0) {
    const { data: hosts, error: hostsError } = await _supabase
      .from('user')
      .select('*')
      .in('_id', hostIds);

    if (hostsError) {
      console.error('[leases-admin] Fetch hosts error:', hostsError);
    } else {
      console.log(`[leases-admin] Fetched ${hosts?.length || 0} hosts for ${hostIds.length} IDs`);
      (hosts || []).forEach((host: Record<string, unknown>) => {
        hostsMap[host._id as string] = host;
      });
    }
  }

  // Fetch listings
  const listingsMap: Record<string, unknown> = {};
  if (listingIds.length > 0) {
    const { data: listings, error: listingsError } = await _supabase
      .from('Listing')
      .select('*')
      .in('_id', listingIds);

    if (listingsError) {
      console.error('[leases-admin] Fetch listings error:', listingsError);
    } else {
      console.log(`[leases-admin] Fetched ${listings?.length || 0} listings for ${listingIds.length} IDs`);
      (listings || []).forEach((listing: Record<string, unknown>) => {
        listingsMap[listing._id as string] = listing;
      });
    }
  }

  // Fetch stays
  let staysMap: Record<string, unknown[]> = {};
  if (leaseIds.length > 0) {
    const { data: stays } = await _supabase
      .from('bookings_stays')
      .select('*')
      .in('Lease', leaseIds);

    if (stays) {
      staysMap = stays.reduce((acc: Record<string, unknown[]>, stay: { Lease: string }) => {
        const leaseId = stay.Lease;
        if (!acc[leaseId]) acc[leaseId] = [];
        acc[leaseId].push(stay);
        return acc;
      }, {});
    }
  }

  // Attach all related data to leases
  const leasesWithData = leases.map((lease: Record<string, unknown>) => ({
    ...lease,
    guest: lease.Guest ? guestsMap[lease.Guest as string] : null,
    host: lease.Host ? hostsMap[lease.Host as string] : null,
    listing: lease.Listing ? listingsMap[lease.Listing as string] : null,
    stays: staysMap[lease._id as string] || [],
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
    .from('bookings_leases')
    .select('*')
    .eq('_id', leaseId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch lease: ${error.message}`);
  }

  if (!lease) {
    throw new Error('Lease not found');
  }

  // Fetch related data separately (Guest/Host have no FK constraints)
  let guestData = null;
  if (lease.Guest) {
    const { data } = await _supabase
      .from('user')
      .select('_id, "Name - Full", "Name - First", "Name - Last", email, "Profile Photo"')
      .eq('_id', lease.Guest)
      .single();
    guestData = data;
  }

  let hostData = null;
  if (lease.Host) {
    const { data } = await _supabase
      .from('user')
      .select('_id, "Name - Full", "Name - First", "Name - Last", email, "Profile Photo"')
      .eq('_id', lease.Host)
      .single();
    hostData = data;
  }

  let listingData = null;
  if (lease.Listing) {
    const { data } = await _supabase
      .from('listing')
      .select('_id, Name')
      .eq('_id', lease.Listing)
      .single();
    listingData = data;
  }

  let proposalData = null;
  if (lease.Proposal) {
    const { data } = await _supabase
      .from('proposal')
      .select('_id, "check in day", "check out day"')
      .eq('_id', lease.Proposal)
      .single();
    proposalData = data;
  }

  // Fetch stays
  const { data: stays } = await _supabase
    .from('bookings_stays')
    .select('*')
    .eq('Lease', leaseId);

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

  // Capitalize status for Bubble compatibility
  const bubbleStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  const { data: _data, error } = await _supabase
    .from('bookings_leases')
    .update({
      'Lease Status': bubbleStatus,
      'Modified Date': new Date().toISOString(),
    })
    .eq('_id', leaseId)
    .select()
    .single();

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

  const { data: _data, error } = await _supabase
    .from('bookings_leases')
    .update({
      'Lease Status': 'Cancelled',
      'Modified Date': new Date().toISOString(),
    })
    .eq('_id', leaseId)
    .select()
    .single();

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
    .from('bookings_leases')
    .select('_id, "Lease Status"')
    .eq('_id', leaseId)
    .single();

  if (fetchError || !lease) {
    throw new Error('Lease not found');
  }

  if (lease['Lease Status']?.toLowerCase() !== 'cancelled') {
    throw new Error('Only cancelled leases can be permanently deleted');
  }

  // Delete associated stays first
  const { error: staysError } = await _supabase
    .from('bookings_stays')
    .delete()
    .eq('Lease', leaseId);

  if (staysError) {
    console.error('[leases-admin] Failed to delete stays:', staysError);
    // Continue anyway - orphaned stays are acceptable
  }

  // Delete the lease
  const { error: deleteError } = await _supabase
    .from('bookings_leases')
    .delete()
    .eq('_id', leaseId);

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

  const bubbleStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  const { data: _data, error } = await _supabase
    .from('bookings_leases')
    .update({
      'Lease Status': bubbleStatus,
      'Modified Date': new Date().toISOString(),
    })
    .in('_id', leaseIds)
    .select();

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

  const { data: _data, error } = await _supabase
    .from('bookings_leases')
    .update({
      'Lease Status': 'Cancelled',
      'Modified Date': new Date().toISOString(),
    })
    .in('_id', leaseIds)
    .select();

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
  const { data: _data, error } = await _supabase
    .from('bookings_leases')
    .select('*')
    .in('_id', leaseIds);

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
      lease._id,
      lease['Agreement Number'] || '',
      lease['Lease Status'] || '',
      lease['Reservation Period : Start'] || '',
      lease['Reservation Period : End'] || '',
      lease['Total Rent'] || 0,
      lease['Paid to Date from Guest'] || 0,
      lease['Created Date'] || '',
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

  const { data: _data, error } = await __supabase.storage
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
    path: data.path,
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

  const { error } = await __supabase.storage
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

  const { data: _data, error } = await __supabase.storage
    .from('lease-documents')
    .list(`leases/${leaseId}`);

  if (error) {
    throw new Error(`Failed to list documents: ${error.message}`);
  }

  // Get public URLs for each document
  const documents = (data || []).map((file: { name: string; created_at: string; metadata?: { size: number } }) => {
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

  const { data: _data, error } = await _supabase
    .from('bookings_payment_records')
    .insert({
      _id: paymentId,
      'Booking - Reservation': leaseId,
      'Scheduled Date': recordData.scheduledDate || null,
      'Actual Date': recordData.actualDate || null,
      'Rent Amount': recordData.rent || 0,
      'Maintenance Fee': recordData.maintenanceFee || 0,
      'Damage Deposit': recordData.damageDeposit || 0,
      'Total Amount': recordData.totalAmount || 0,
      'Bank Transaction Number': recordData.bankTransactionNumber || null,
      'Is Paid': recordData.isPaid || false,
      'Created Date': new Date().toISOString(),
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
    'Modified Date': new Date().toISOString(),
  };

  if (updates.scheduledDate !== undefined) updateData['Scheduled Date'] = updates.scheduledDate;
  if (updates.actualDate !== undefined) updateData['Actual Date'] = updates.actualDate;
  if (updates.rent !== undefined) updateData['Rent Amount'] = updates.rent;
  if (updates.maintenanceFee !== undefined) updateData['Maintenance Fee'] = updates.maintenanceFee;
  if (updates.damageDeposit !== undefined) updateData['Damage Deposit'] = updates.damageDeposit;
  if (updates.totalAmount !== undefined) updateData['Total Amount'] = updates.totalAmount;
  if (updates.bankTransactionNumber !== undefined) updateData['Bank Transaction Number'] = updates.bankTransactionNumber;
  if (updates.isPaid !== undefined) updateData['Is Paid'] = updates.isPaid;
  if (updates.paymentDelayed !== undefined) updateData['Payment Delayed'] = updates.paymentDelayed;

  const { data: _data, error } = await _supabase
    .from('bookings_payment_records')
    .update(updateData)
    .eq('_id', paymentId)
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
    .from('bookings_payment_records')
    .delete()
    .eq('_id', paymentId);

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
    .from('bookings_leases')
    .select('_id, "Reservation Period : Start", "Reservation Period : End"')
    .eq('_id', leaseId)
    .single();

  if (leaseError || !lease) {
    throw new Error('Lease not found');
  }

  const startDate = lease['Reservation Period : Start'];
  const endDate = lease['Reservation Period : End'];

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
      _id: crypto.randomUUID(),
      Lease: leaseId,
      'Week Number': weekNumber,
      'Check In (night)': currentStart.toISOString(),
      'Check-out day': currentEnd.toISOString(),
      'Last Night (night)': new Date(currentEnd.getTime() - 86400000).toISOString(),
      'Stay Status': 'Upcoming',
      'Created Date': new Date().toISOString(),
      'Modified Date': new Date().toISOString(),
    });

    currentStart = new Date(currentEnd);
    weekNumber++;
  }

  if (stays.length > 0) {
    const { error: insertError } = await _supabase
      .from('bookings_stays')
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
    .from('bookings_stays')
    .delete()
    .eq('Lease', leaseId);

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

  // Get lease with proposal reference
  const { data: lease, error: leaseError } = await _supabase
    .from('bookings_leases')
    .select('_id, "Reservation Period : Start", "Reservation Period : End", Proposal')
    .eq('_id', leaseId)
    .single();

  if (leaseError || !lease) {
    throw new Error('Lease not found');
  }

  const startDate = lease['Reservation Period : Start'];
  const endDate = lease['Reservation Period : End'];
  const proposalId = lease.Proposal;

  if (!startDate || !endDate) {
    throw new Error('Lease does not have valid reservation dates');
  }

  // Get proposal schedule (check-in/check-out days define weekly pattern)
  let checkInDay = 0; // Default to Sunday
  let checkOutDay = 6; // Default to Saturday (full week)

  if (proposalId) {
    const { data: proposal } = await _supabase
      .from('proposal')
      .select('"check in day", "check out day"')
      .eq('_id', proposalId)
      .single();

    if (proposal) {
      checkInDay = parseInt(proposal['check in day']) || 0;
      checkOutDay = parseInt(proposal['check out day']) || 6;
    }
  }

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
    .from('bookings_leases')
    .update({
      'List of Booked Dates': bookedDates,
      'Modified Date': new Date().toISOString(),
    })
    .eq('_id', leaseId)
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
    .from('bookings_leases')
    .select('_id, Proposal')
    .eq('_id', leaseId)
    .single();

  // Clear lease booked dates
  const { error: leaseError } = await _supabase
    .from('bookings_leases')
    .update({
      'Booked Dates': [],
      'Booked Dates After Request': [],
      'Modified Date': new Date().toISOString(),
    })
    .eq('_id', leaseId);

  if (leaseError) {
    console.error('[leases-admin] Clear lease dates error:', leaseError);
    throw new Error(`Failed to clear lease dates: ${leaseError.message}`);
  }

  // Clear proposal booked dates if exists
  if (lease?.Proposal) {
    const { error: proposalError } = await _supabase
      .from('bookings_proposals')
      .update({
        'Booked Dates': [],
        'Modified Date': new Date().toISOString(),
      })
      .eq('_id', lease.Proposal);

    if (proposalError) {
      console.warn('[leases-admin] Clear proposal dates warning:', proposalError);
      // Don't fail the whole operation if proposal update fails
    }
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

  const { data: _data, error } = await _supabase
    .from('bookings_leases')
    .update({
      'Lease Status': 'Cancelled',
      'Cancellation Reason': reason || null,
      'Disagreeing Party': disagreeingParty || null,
      'Modified Date': new Date().toISOString(),
    })
    .eq('_id', leaseId)
    .select()
    .single();

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
    .eq('Lease', leaseId)
    .order('Created Date', { ascending: false });

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
      .map((cr: Record<string, unknown>) => cr['Requested by'] as string)
      .filter((id: string | undefined) => id)
  )];

  const usersMap: Record<string, unknown> = {};
  if (requestedByIds.length > 0) {
    const { data: users } = await _supabase
      .from('user')
      .select('_id, email, "First Name", "Last Name"')
      .in('_id', requestedByIds);

    if (users) {
      users.forEach((user: Record<string, unknown>) => {
        usersMap[user._id as string] = user;
      });
    }
  }

  // Attach user data to change requests
  return changeRequests.map((cr: Record<string, unknown>) => ({
    ...cr,
    requestedByUser: cr['Requested by'] ? usersMap[cr['Requested by'] as string] : null
  }));
}

console.log("[leases-admin] Edge Function ready");
