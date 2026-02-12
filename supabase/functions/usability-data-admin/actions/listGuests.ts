/**
 * List Guests Action Handler
 * Fetches usability tester guests with pagination and search
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ListGuestsPayload {
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

export async function handleListGuests(
  payload: ListGuestsPayload,
  supabase: SupabaseClient
) {
  const { limit = 50, offset = 0, search = '' } = payload;

  // Note: Fetch all usability testers, filter guests client-side
  // Column name with spaces causes issues in PostgREST filters
  let query = supabase
    .from('user')
    .select('id, email, first_name, last_name, updated_at, current_user_role', { count: 'exact' })
    .eq('is usability tester', true)
    .order('first_name', { ascending: true });

  // Apply search filter across name and email fields
  if (search) {
    const searchPattern = `%${search}%`;
    query = query.or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},email.ilike.${searchPattern}`);
  }

  // Apply pagination
  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error('[usability-data-admin] List guests error:', error);
    throw new Error(`Failed to fetch guests: ${error.message}`);
  }

  // Filter guests client-side (column name with spaces causes issues in PostgREST filters)
  const guestData = (data || []).filter((user: UserRecord) =>
    user.current_user_role?.toLowerCase().includes('guest')
  );
  const guests = guestData.map(formatUser);

  return {
    users: guests,
    total: count || 0,
    limit,
    offset,
  };
}
