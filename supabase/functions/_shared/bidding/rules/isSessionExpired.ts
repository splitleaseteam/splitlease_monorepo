import type { BiddingSession } from '../types.ts';

/**
 * Check if a bidding session has expired.
 *
 * @rule A session is expired if current time is past expiresAt.
 * @rule A session without expiresAt is never considered expired by time.
 */
export function isSessionExpired(session: BiddingSession): boolean {
  if (!session.expiresAt) {
    return false;
  }

  const expiresAt = session.expiresAt instanceof Date
    ? session.expiresAt
    : new Date(session.expiresAt);
  const now = new Date();

  return now > expiresAt;
}
