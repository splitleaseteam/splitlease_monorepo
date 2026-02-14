import { describe, it, expect } from 'vitest';
import { calculateMatchScore } from '../calculateMatchScore.js';

describe('calculateMatchScore', () => {
  it('returns score, breakdown, and max score', () => {
    const result = calculateMatchScore({
      candidateListing: {
        boroughName: 'Manhattan',
        nightly_rate_for_4_night_stay: 100,
        available_days_as_day_numbers_json: [0, 1, 2, 3, 4, 5, 6],
        minimum_nights_per_stay: 4
      },
      proposal: {
        nightlyPrice: 98,
        nightsPerWeek: 4,
        daysSelected: [1, 2, 3, 4],
        listing: { boroughName: 'Manhattan' }
      },
      hostData: {
        linkedin_profile_id: 'abc',
        is_phone_verified: true,
        is_user_verified: true
      }
    });

    expect(result.totalScore).toBeGreaterThan(0);
    expect(result.breakdown).toHaveProperty('boroughMatch');
    expect(result.breakdown).toHaveProperty('hostVerified');
    expect(result.maxPossibleScore).toBe(95);
  });
});
