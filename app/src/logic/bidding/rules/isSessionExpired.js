/**
 * Check if a bidding session has expired.
 *
 * @intent Determine if the session's expiration time has passed.
 * @rule A session is expired if current time is past expiresAt.
 * @rule A session without expiresAt is never considered expired by time.
 *
 * @param {object} params - Named parameters.
 * @param {object} params.session - The bidding session to check.
 * @returns {boolean} True if session has expired.
 *
 * @example
 * isSessionExpired({ session: { expiresAt: '2026-01-01T00:00:00Z' } })
 * // => true (if current date is after 2026-01-01)
 *
 * isSessionExpired({ session: { expiresAt: null } })
 * // => false (no expiration set)
 */
export function isSessionExpired({ session }) {
  // No expiration set means not expired by time
  if (!session.expiresAt) {
    return false;
  }

  const expiresAt = new Date(session.expiresAt);
  const now = new Date();

  return now > expiresAt;
}
