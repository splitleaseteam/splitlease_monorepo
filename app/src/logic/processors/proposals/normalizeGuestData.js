/**
 * Normalize guest data from Bubble format to V7 component format
 *
 * @intent Transform Bubble-format field names to camelCase for V7 components
 * @rule Determines verification status from multiple Bubble fields
 * @rule Returns null for null/undefined input
 *
 * @param {Object} guest - Raw guest from database
 * @returns {Object|null} Normalized guest or null
 */
export function normalizeGuestData(guest) {
  if (!guest) return null;

  // Determine verification status from database fields
  // is_user_verified is the main verification flag
  // selfie_with_id_photo_url indicates ID verification was completed
  // linkedin_profile_id indicates work/LinkedIn verification
  const isUserVerified = guest.is_user_verified || guest.is_verified || guest.id_verified || false;
  const hasIdVerification = !!(guest.selfie_with_id_photo_url || guest.id_verified);
  const hasWorkVerification = !!(guest.linkedin_profile_id || guest.work_verified);

  return {
    ...guest,
    // Add normalized aliases for V7 components
    name: guest.full_name || guest.name || (guest.first_name && guest.last_name ? `${guest.first_name} ${guest.last_name}` : null) || 'Guest',
    full_name: guest.full_name || guest.name || (guest.first_name && guest.last_name ? `${guest.first_name} ${guest.last_name}` : null) || 'Guest',
    first_name: guest.first_name || guest.firstName || 'Guest',
    profilePhoto: guest.profile_photo_url || guest.profilePhoto || guest.profile_photo || null,
    avatar: guest.profile_photo_url || guest.profilePhoto || guest.avatar || null,
    bio: guest.bio_text || guest.Bio || guest.bio || guest.about || null,
    id_verified: hasIdVerification || isUserVerified,
    work_verified: hasWorkVerification,
    is_verified: isUserVerified,
    review_count: guest.review_count || 0,
    created_at: guest.original_created_at || guest.created_at || null
  };
}
