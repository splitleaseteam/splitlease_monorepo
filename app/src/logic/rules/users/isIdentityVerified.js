/**
 * isIdentityVerified
 *
 * Rule function to check if a user has completed identity verification.
 *
 * @param {Object} user - User object with identity verification fields
 * @param {boolean} [user.identity_verified] - Whether user's identity has been verified
 * @returns {boolean} True if user has been identity verified
 *
 * @example
 * const verified = isIdentityVerified(user);
 * if (verified) {
 *   // Show verified badge
 * }
 */
export function isIdentityVerified(user) {
  if (!user) {
    return false;
  }

  return user.identity_verified === true;
}

/**
 * Check if identity verification has been submitted but not yet verified
 *
 * @param {Object} user - User object with identity verification fields
 * @returns {boolean} True if verification is pending review
 */
export function isIdentityVerificationPending(user) {
  if (!user) {
    return false;
  }

  const hasSubmitted = user.identity_submitted_at !== null && user.identity_submitted_at !== undefined;
  const notVerified = user.identity_verified !== true;

  return hasSubmitted && notVerified;
}
