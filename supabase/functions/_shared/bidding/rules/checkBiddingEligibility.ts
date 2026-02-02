import type { EligibilityResult, UserArchetype } from '../types.ts';

interface UserInfo {
  userId: string;
  archetype: UserArchetype;
}

/**
 * Check if competitive bidding should be enabled between two users.
 *
 * @rule Both users must be Big Spenders (archetype = 'big_spender').
 * @rule Target night must be within 30 days from now.
 * @rule Target night cannot be in the past.
 */
export function checkBiddingEligibility(
  requester: UserInfo,
  roommate: UserInfo,
  targetNight: Date | string
): EligibilityResult {
  // Rule 1: Both must be Big Spenders
  if (requester.archetype !== 'big_spender' || roommate.archetype !== 'big_spender') {
    return {
      eligible: false,
      reason: 'Both users must be Big Spenders to enable competitive bidding',
    };
  }

  // Parse target night if string
  const targetDate = targetNight instanceof Date ? targetNight : new Date(targetNight);
  const now = new Date();

  // Calculate days until target night
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntil = Math.floor((targetDate.getTime() - now.getTime()) / msPerDay);

  // Rule 2: Must be within reasonable timeframe (30 days)
  if (daysUntil > 30) {
    return {
      eligible: false,
      reason: 'Target night must be within 30 days',
    };
  }

  // Rule 3: Cannot be in the past
  if (daysUntil < 0) {
    return {
      eligible: false,
      reason: 'Target night is in the past',
    };
  }

  return { eligible: true };
}
