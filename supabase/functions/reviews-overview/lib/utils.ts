/**
 * Reviews Overview Utility Functions
 */

const REVIEW_WINDOW_DAYS = 14;

/**
 * Calculate days remaining until review expiry.
 * Reviews expire 14 days after checkout date.
 *
 * @param checkOutDate - The checkout date string (ISO format)
 * @returns Number of days until expiry (negative if already expired)
 */
export function calculateDaysUntilExpiry(checkOutDate: string): number {
  if (!checkOutDate) return 0;

  const checkOut = new Date(checkOutDate);
  const now = new Date();
  const daysSinceCheckout = Math.floor(
    (now.getTime() - checkOut.getTime()) / (1000 * 60 * 60 * 24)
  );

  return REVIEW_WINDOW_DAYS - daysSinceCheckout;
}
