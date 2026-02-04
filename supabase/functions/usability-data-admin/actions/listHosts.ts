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
  _id: string;
  email: string;
  "Name - First": string;
  "Name - Last": string;
  "Modified Date": string;
  "Type - User Current"?: string;
}

/**
 * Format database user record to tester object
 */
function formatUser(dbUser: UserRecord) {
  return {
    id: dbUser._id,
    email: dbUser.email || '',
    firstName: dbUser['Name - First'] || '',
    lastName: dbUser['Name - Last'] || '',
    fullName: `${dbUser['Name - First'] || ''} ${dbUser['Name - Last'] || ''}`.trim(),
    modifiedDate: dbUser['Modified Date'] || null,
  };
}

export async function handleListHosts(
  payload: ListHostsPayload,
  supabase: SupabaseClient
) {
  const { limit = 50, offset = 0, search = '' } = payload;

  // Note: Using raw filter to handle column with spaces properly
  let query = supabase
    .from('user')
    .select('_id, email, "Name - First", "Name - Last", "Modified Date", "Type - User Current"', { count: 'exact' })
    .eq('is usability tester', true)
    .order('"Name - First"', { ascending: true });

  // Apply search filter across name and email fields
  if (search) {
    const searchPattern = `%${search}%`;
    query = query.or(`"Name - First".ilike.${searchPattern},"Name - Last".ilike.${searchPattern},email.ilike.${searchPattern}`);
  }

  // Apply pagination
  const { data, error, _count } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error('[usability-data-admin] List hosts error:', error);
    throw new Error(`Failed to fetch hosts: ${error.message}`);
  }

  // Filter hosts client-side (column name with spaces causes issues in PostgREST filters)
  const hostData = (data || []).filter((user: UserRecord) =>
    user['Type - User Current']?.toLowerCase().includes('host')
  );
  const hosts = hostData.map(formatUser);

  return {
    users: hosts,
    total: count || 0,
    limit,
    offset,
  };
}
