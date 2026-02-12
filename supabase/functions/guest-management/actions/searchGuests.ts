/**
 * Search Guests Action
 *
 * Search guests by name, email, or phone number.
 * Returns matching users with basic profile info.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface SearchGuestsPayload {
  query?: string;
  searchType?: 'name' | 'email' | 'phone' | 'all';
  limit?: number;
}

interface GuestResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profilePhoto?: string;
  userType: string;
  createdAt: string;
}

export async function handleSearchGuests(
  payload: SearchGuestsPayload,
  supabase: SupabaseClient
): Promise<GuestResult[]> {
  const { query = '', searchType = 'all', limit = 20 } = payload;

  console.log(`[searchGuests] Searching for: "${query}" (type: ${searchType})`);

  if (!query || query.trim().length < 2) {
    // Return recent guests if no query
    const { data, error } = await supabase
      .from('user')
      .select('id, first_name, last_name, email, phone_number, profile_photo_url, created_at')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[searchGuests] Error fetching recent guests:', error);
      throw new Error(`Failed to fetch guests: ${error.message}`);
    }

    return (data || []).map(mapUserToGuest);
  }

  // Build search query based on type
  let queryBuilder = supabase
    .from('user')
    .select('id, first_name, last_name, email, phone_number, profile_photo_url, created_at');

  const searchTerm = `%${query.trim()}%`;

  switch (searchType) {
    case 'name':
      queryBuilder = queryBuilder.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`);
      break;
    case 'email':
      queryBuilder = queryBuilder.ilike('email', searchTerm);
      break;
    case 'phone':
      queryBuilder = queryBuilder.ilike('phone_number', searchTerm);
      break;
    case 'all':
    default:
      queryBuilder = queryBuilder.or(
        `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone_number.ilike.${searchTerm}`
      );
      break;
  }

  const { data, error } = await queryBuilder.limit(limit);

  if (error) {
    console.error('[searchGuests] Search error:', error);
    throw new Error(`Search failed: ${error.message}`);
  }

  console.log(`[searchGuests] Found ${data?.length || 0} results`);

  return (data || []).map(mapUserToGuest);
}

/**
 * Map database user record to guest result format
 */
function mapUserToGuest(user: Record<string, unknown>): GuestResult {
  return {
    id: user.id as string,
    firstName: (user.first_name as string) || '',
    lastName: (user.last_name as string) || '',
    email: (user.email as string) || '',
    phoneNumber: (user.phone_number as string) || '',
    profilePhoto: user.profile_photo_url as string | undefined,
    userType: 'guest',
    createdAt: (user.created_at as string) || new Date().toISOString()
  };
}
