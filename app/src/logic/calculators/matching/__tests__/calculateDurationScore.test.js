import { describe, it, expect } from 'vitest';
import { calculateDurationScore } from '../calculateDurationScore.js';

describe('calculateDurationScore', () => {
  it('returns full duration weight when match is within tolerance', () => {
    const score = calculateDurationScore({
      candidateListing: { minimum_nights_per_stay: 4 },
      proposal: { nightsPerWeek: 5 }
    });

    expect(score).toBe(10);
  });

  it('returns 0 when outside tolerance or inputs missing', () => {
    expect(
      calculateDurationScore({
        candidateListing: { minimum_nights_per_stay: 2 },
        proposal: { nightsPerWeek: 6 }
      })
    ).toBe(0);

    expect(calculateDurationScore({ candidateListing: null, proposal: { nightsPerWeek: 4 } })).toBe(0);
  });
});
