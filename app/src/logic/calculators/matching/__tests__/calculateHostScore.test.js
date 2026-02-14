import { describe, it, expect } from 'vitest';
import { calculateHostScore } from '../calculateHostScore.js';

describe('calculateHostScore', () => {
  it('returns 5/3/1/0 based on verification count', () => {
    expect(
      calculateHostScore({
        hostData: {
          linkedin_profile_id: 'abc',
          is_phone_verified: true,
          is_user_verified: true
        }
      })
    ).toBe(5);

    expect(
      calculateHostScore({
        hostData: {
          linkedin_profile_id: 'abc',
          is_phone_verified: true,
          is_user_verified: false
        }
      })
    ).toBe(3);

    expect(calculateHostScore({ hostData: { is_user_verified: true } })).toBe(1);
    expect(calculateHostScore({ hostData: {} })).toBe(0);
  });
});
