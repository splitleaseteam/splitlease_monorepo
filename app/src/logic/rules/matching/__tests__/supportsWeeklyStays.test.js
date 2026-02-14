import { describe, it, expect } from 'vitest';
import { supportsWeeklyStays } from '../supportsWeeklyStays.js';

describe('supportsWeeklyStays', () => {
  it('returns true when listing has full-week availability and min nights <= 7', () => {
    expect(
      supportsWeeklyStays({
        listing: {
          minimum_nights_per_stay: 3,
          available_days_as_day_numbers_json: [0, 1, 2, 3, 4, 5, 6]
        }
      })
    ).toBe(true);
  });

  it('returns false when availability is not a full week', () => {
    expect(
      supportsWeeklyStays({
        listing: {
          minimum_nights_per_stay: 3,
          available_days_as_day_numbers_json: [1, 2, 3, 4, 5]
        }
      })
    ).toBe(false);
  });
});
