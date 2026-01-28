/**
 * canSubmitIdentityVerification
 *
 * Rule function to determine if a user can submit identity verification documents.
 *
 * Business Rules:
 * - Cannot submit if already verified (no need to re-verify)
 * - Can submit if never submitted before
 * - Can re-submit if previously submitted but not yet verified (e.g., rejected documents)
 *
 * @param {Object} user - User object with identity verification fields
 * @param {boolean} [user.identity_verified] - Whether user's identity has been verified
 * @returns {boolean} True if user can submit identity verification
 *
 * @example
 * if (canSubmitIdentityVerification(user)) {
 *   // Show "Verify Identity" button
 * }
 */
export function canSubmitIdentityVerification(user) {
  if (!user) {
    return false;
  }

  // Cannot submit if already verified
  if (user.identity_verified === true) {
    return false;
  }

  // Can submit if not verified (includes never submitted or previously rejected)
  return true;
}

/**
 * Determine the identity verification status for UI display
 *
 * @param {Object} user - User object with identity verification fields
 * @returns {'not_submitted' | 'pending' | 'verified'} Current verification status
 */
export function getIdentityVerificationStatus(user) {
  if (!user) {
    return 'not_submitted';
  }

  if (user.identity_verified === true) {
    return 'verified';
  }

  if (user.identity_submitted_at) {
    return 'pending';
  }

  return 'not_submitted';
}
