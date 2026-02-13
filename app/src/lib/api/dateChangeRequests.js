import { supabase } from '../supabase.js';
import { adaptDateChangeRequestFromSupabase } from '../../logic/processors/leases/adaptLeaseFromSupabase.js';
import { calculateBuyoutPricesForDates } from '../../logic/calculators/buyout/index.js';

function getCounterpartyFromLease(lease, currentUserId) {
  if (!lease) return null;
  if (typeof lease.getCounterparty === 'function') {
    return lease.getCounterparty(currentUserId);
  }

  if (lease.leaseType === 'co_tenant') {
    return lease.host?.id === currentUserId ? lease.guest : lease.host;
  }

  return lease.guest?.id === currentUserId ? lease.host : lease.guest;
}

function calculatePriceAdjustment(lease, dates) {
  if (lease?.leaseType !== 'co_tenant') return 0;
  if (!Array.isArray(dates) || dates.length === 0) return 0;

  const baseRate = Number(lease?.nightlyRate) || 0;
  if (!baseRate) return 0;

  const priceMap = calculateBuyoutPricesForDates(baseRate, dates);
  let totalSuggested = 0;
  for (const price of priceMap.values()) {
    totalSuggested += price;
  }
  const baseTotal = baseRate * dates.length;
  return Math.round(totalSuggested - baseTotal);
}

async function transferNightOwnership(requestId) {
  throw new Error(`transferNightOwnership not implemented for request ${requestId}`);
}

async function updateGuestBooking(requestId) {
  throw new Error(`updateGuestBooking not implemented for request ${requestId}`);
}

export function getAvailableRequestTypes(lease, userRole) {
  if (lease?.leaseType === 'co_tenant') {
    return ['full_week', 'alternating', 'share'];
  }

  if (userRole === 'guest') {
    return ['date_change', 'cancellation'];
  }

  return ['offer_dates', 'block_dates'];
}

export function buildDateChangePayload(params) {
  const {
    lease,
    currentUserId,
    requestType,
    originalDates,
    newDates,
    reason,
  } = params;

  const counterparty = getCounterpartyFromLease(lease, currentUserId);

  return {
    lease: lease?.id,
    requested_by: currentUserId,
    request_receiver: counterparty?.id,
    type_of_request: requestType,
    list_of_old_dates_in_the_stay: JSON.stringify(originalDates || []),
    list_of_new_dates_in_the_stay: JSON.stringify(newDates || []),
    message_from_requested_by: reason,
    request_status: 'pending',
    original_created_at: new Date().toISOString(),
    visible_to_the_guest: true,
    price_rate_of_the_night: calculatePriceAdjustment(lease, newDates),
  };
}

export async function handleDateChangeResponse(requestId, action, lease) {
  const isCoTenant = lease?.leaseType === 'co_tenant';

  if (action === 'approve') {
    await updateDateChangeRequestStatus(requestId, 'approved');

    if (isCoTenant) {
      await transferNightOwnership(requestId);
    } else {
      await updateGuestBooking(requestId);
    }
  }

  if (action === 'decline') {
    await updateDateChangeRequestStatus(requestId, 'declined');
  }
}

export async function fetchDateChangeRequestsForLease(leaseId) {
  // Step 1: Fetch date change requests without join (FK may not be defined)
  const { data, error } = await supabase
    .from('datechangerequest')
    .select('*')
    .eq('lease', leaseId)
    .order('original_created_at', { ascending: false });

  if (error) throw error;

  // Step 2: Fetch requestedBy users separately
  const requests = data || [];
  for (const request of requests) {
    if (request.requested_by) {
      const { data: user } = await supabase
        .from('user')
        .select('*')
        .eq('id', request.requested_by)
        .single();
      request.requestedByUser = user;
    }
  }

  return requests.map(adaptDateChangeRequestFromSupabase);
}

export async function createDateChangeRequest(payload) {
  const { data, error } = await supabase
    .from('datechangerequest')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return adaptDateChangeRequestFromSupabase(data);
}

export async function updateDateChangeRequestStatus(requestId, status) {
  const { data, error } = await supabase
    .from('datechangerequest')
    .update({ request_status: status })
    .eq('id', requestId)
    .select()
    .single();

  if (error) throw error;
  return adaptDateChangeRequestFromSupabase(data);
}
