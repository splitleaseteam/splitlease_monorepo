import { describe, it, expect } from 'vitest';
import { isVerifiedHost, countHostVerifications } from '../isVerifiedHost.js';

describe('isVerifiedHost', () => {
  it('uses canonical snake_case verification fields', () => {
    const host = {
      linkedin_profile_id: 'abc',
      is_phone_verified: true,
      is_user_verified: false
    };

    expect(countHostVerifications({ host })).toBe(2);
    expect(isVerifiedHost({ host })).toBe(true);
    expect(isVerifiedHost({ host, minVerifications: 3 })).toBe(false);
  });
});
