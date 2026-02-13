/**
 * Process raw user data from Supabase into a clean, validated user object.
 *
 * @intent Transform raw user rows from Supabase into consistent, UI-ready format.
 * @rule NO FALLBACK - Throws explicit errors for missing critical fields.
 *
 * @param {object} rawUser - Raw user object from Supabase.
 * @returns {object} Clean, validated user object.
 *
 * @throws {Error} If rawUser is null/undefined.
 * @throws {Error} If critical id field is missing.
 *
 * @example
 * const user = processUserData({
 *   id: '123',
 *   first_name: 'Jane',
 *   last_name: 'Doe',
 *   profile_photo_url: 'https://...',
 *   bio_text: 'Software engineer...',
 *   'user verified?': true
 * })
 */
export function processUserData(rawUser) {
  if (!rawUser) {
    throw new Error('processUserData: User data is required');
  }

  if (!rawUser.id) {
    throw new Error('processUserData: User ID (id) is required');
  }

  return {
    id: rawUser.id,
    firstName: rawUser.first_name || null,
    lastName: rawUser.last_name || null,
    fullName: rawUser.first_name && rawUser.last_name
      ? `${rawUser.first_name} ${rawUser.last_name}`
      : null,
    profilePhoto: rawUser.profile_photo_url || null,
    bio: rawUser.bio_text || null,
    linkedInVerified: !!rawUser.linkedin_profile_id,
    phoneVerified: !!rawUser.is_phone_verified,
    userVerified: !!rawUser.is_user_verified,
    proposalsList: rawUser.listings_json || []
  };
}
