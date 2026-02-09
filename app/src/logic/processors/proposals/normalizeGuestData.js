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
  // "Selfie with ID" indicates ID verification was completed
  // "Verify - Linked In ID" indicates work/LinkedIn verification
  const isUserVerified = guest.is_user_verified || guest.is_verified || guest.id_verified || false;
  const hasIdVerification = !!(guest['Selfie with ID'] || guest.id_verified);
  const hasWorkVerification = !!(guest['Verify - Linked In ID'] || guest.work_verified);
  // Note: 'Selfie with ID', 'Verify - Linked In ID' are Bubble-format fields
  // that may still exist on guest objects embedded in proposals. New user table columns use
  // is_user_verified, id_verified, work_verified respectively.

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
    created_at: guest.bubble_created_at || guest.created_at || null
  };
}
