import { describe, it, expect } from 'vitest';
import { isDurationMatch } from '../isDurationMatch.js';

describe('isDurationMatch', () => {
  it('matches when difference is within tolerance', () => {
    expect(
      isDurationMatch({
        listing: { minimum_nights_per_stay: 4 },
        proposal: { nightsPerWeek: 5 }
      })
    ).toBe(true);
  });

  it('returns false for invalid or out-of-range proposal duration', () => {
    expect(
      isDurationMatch({
        listing: { minimum_nights_per_stay: 2 },
        proposal: { nightsPerWeek: 6 }
      })
    ).toBe(false);

    expect(
      isDurationMatch({
        listing: { minimum_nights_per_stay: 2 },
        proposal: { nightsPerWeek: 0 }
      })
    ).toBe(false);
  });
});
