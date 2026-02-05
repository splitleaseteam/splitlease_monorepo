import { supabase } from '../supabase.js';
import { adaptDateChangeRequestFromSupabase } from '../../logic/processors/leases/adaptLeaseFromSupabase.js';

export async function fetchDateChangeRequestsForLease(leaseId) {
  const { data, error } = await supabase
    .from('date_change_requests')
    .select('*, requestedByUser:User(*)')
    .eq('Lease', leaseId)
    .order('Created Date', { ascending: false });

  if (error) throw error;
  return (data || []).map(adaptDateChangeRequestFromSupabase);
}

export async function createDateChangeRequest(payload) {
  const { data, error } = await supabase
    .from('date_change_requests')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return adaptDateChangeRequestFromSupabase(data);
}

export async function updateDateChangeRequestStatus(requestId, status) {
  const { data, error } = await supabase
    .from('date_change_requests')
    .update({ status })
    .eq('_id', requestId)
    .select()
    .single();

  if (error) throw error;
  return adaptDateChangeRequestFromSupabase(data);
}
