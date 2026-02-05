import { supabase } from '../supabase.js';
import { adaptDateChangeRequestFromSupabase } from '../../logic/processors/leases/adaptLeaseFromSupabase.js';
import { calculateBuyoutPricesForDates } from '../../logic/calculators/buyout/index.js';

function getCounterpartyFromLease(lease, currentUserId) {
  if (!lease) return null;
  if (typeof lease.getCounterparty === 'function') {
    return lease.getCounterparty(currentUserId);
  }

  if (lease.leaseType === 'co_tenant') {
    return lease.host?._id === currentUserId ? lease.guest : lease.host;
  }

  return lease.guest?._id === currentUserId ? lease.host : lease.guest;
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
    return ['buyout', 'swap', 'share'];
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
    Lease: lease?._id,
    'Requested by': currentUserId,
    'Request receiver': counterparty?._id,
    'Request Type': requestType,
    'Original Date': JSON.stringify(originalDates || []),
    'Requested Date': JSON.stringify(newDates || []),
    'Reason': reason,
    'Status': 'pending',
    'Created Date': new Date().toISOString(),
    'visible to guest': true,
    'Price Adjustment': calculatePriceAdjustment(lease, newDates),
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
  const { data, error } = await supabase
    .from('datechangerequest')
    .select('*, requestedByUser:User(*)')
    .eq('Lease', leaseId)
    .order('Created Date', { ascending: false });

  if (error) throw error;
  return (data || []).map(adaptDateChangeRequestFromSupabase);
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
    .update({ status })
    .eq('_id', requestId)
    .select()
    .single();

  if (error) throw error;
  return adaptDateChangeRequestFromSupabase(data);
}
