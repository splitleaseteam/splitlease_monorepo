/**
 * List Users Handler - Search and list users for magic link generation
 * Split Lease - magic-login-links
 *
 * Flow:
 * 1. Accept optional search text and limit parameters
 * 2. Query public.user table with optional filtering
 * 3. Return user list with essential fields for display
 *
 * @param supabaseUrl - Supabase project URL
 * @param supabaseServiceKey - Supabase service role key for admin operations
 * @param payload - Request payload {searchText?, limit?}
 * @returns {users: Array<{id, email, firstName, lastName, phone, userType, profilePhoto}>}
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ApiError } from '../../_shared/errors.ts';

interface ListUsersPayload {
  searchText?: string;
  limit?: number;
}

interface UserRecord {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  current_user_role: string | null;
  profile_photo_url: string | null;
}

interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  userType: string;
  profilePhoto: string;
}

export async function handleListUsers(
  supabaseUrl: string,
  supabaseServiceKey: string,
  payload: ListUsersPayload
): Promise<{ users: UserListItem[] }> {
  console.log('[list-users] ========== LIST USERS ==========');

  const { searchText, limit = 50 } = payload;

  console.log(`[list-users] Search text: ${searchText || '(none)'}`);
  console.log(`[list-users] Limit: ${limit}`);

  // Initialize Supabase admin client
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Build query with optional search filtering
    let query = supabaseAdmin
      .from('user')
      .select('id, email, first_name, last_name, phone_number, current_user_role, profile_photo_url')
      .order('first_name', { ascending: true })
      .limit(limit);

    // Apply search filter if provided
    if (searchText && searchText.trim().length > 0) {
      const searchPattern = `%${searchText.trim()}%`;
      query = query.or(
        `email.ilike.${searchPattern},first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},phone_number.ilike.${searchPattern}`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('[list-users] Query error:', error.message);
      throw new ApiError(
        `Failed to list users: ${error.message}`,
        500
      );
    }

    console.log(`[list-users] Found ${data?.length || 0} users`);

    // Transform database records to API response format
    const users: UserListItem[] = (data as UserRecord[] || []).map(user => ({
      id: user.id,
      email: user.email || '',
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      phone: user.phone_number || '',
      userType: user.current_user_role || '',
      profilePhoto: user.profile_photo_url || '',
    }));

    return { users };

  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }

    console.error('[list-users] ========== ERROR ==========');
    console.error('[list-users] Error:', error);

    throw new ApiError(
      `Failed to list users: ${error.message}`,
      500,
      error
    );
  }
}
