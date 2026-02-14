/**
 * List Hosts Action Handler
 * Fetches usability tester hosts with pagination and search
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ListHostsPayload {
  search?: string;
  limit?: number;
  offset?: number;
}

interface UserRecord {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  updated_at: string;
  current_user_role?: string;
}

/**
 * Format database user record to tester object
 */
function formatUser(dbUser: UserRecord) {
  return {
    id: dbUser.id,
    email: dbUser.email || '',
    firstName: dbUser.first_name || '',
    lastName: dbUser.last_name || '',
    fullName: `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim(),
    modifiedDate: dbUser.updated_at || null,
  };
}

export async function handleListHosts(
  payload: ListHostsPayload,
  supabase: SupabaseClient
) {
  const { limit = 50, offset = 0, search = '' } = payload;

  let query = supabase
    .from('user')
    .select('id, email, first_name, last_name, updated_at, current_user_role', { count: 'exact' })
    .eq(is_usability_tester, true)
    .order('first_name', { ascending: true });

  // Apply search filter across name and email fields
  if (search) {
    const searchPattern = `%${search}%`;
    query = query.or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},email.ilike.${searchPattern}`);
  }

  // Apply pagination
  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error('[usability-data-admin] List hosts error:', error);
    throw new Error(`Failed to fetch hosts: ${error.message}`);
  }

  // Filter hosts client-side (column name with spaces causes issues in PostgREST filters)
  const hostData = (data || []).filter((user: UserRecord) =>
    user.current_user_role?.toLowerCase().includes('host')
  );
  const hosts = hostData.map(formatUser);

  return {
    users: hosts,
    total: count || 0,
    limit,
    offset,
  };
}
