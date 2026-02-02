/**
 * Perspective switching hook for Schedule Dashboard
 * Reads ?as= query param to determine which user's perspective to show
 *
 * Usage:
 *   /schedule/lease-123           -> Default (current user perspective)
 *   /schedule/lease-123?as=sarah  -> Sarah's perspective (co-tenant view)
 */
import { useMemo } from 'react';

// Map of allowed perspective switches
const PERSPECTIVE_MAP = {
  'sarah': 'user-456',      // Sarah Chen
  'user-456': 'user-456',   // Direct ID also works
  // Add more as needed for additional roommates
};

/**
 * Returns the user ID for the current perspective
 * @returns {string} 'current-user' or a specific user ID like 'user-456'
 */
export function usePerspective() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const asParam = params.get('as')?.toLowerCase();

    if (asParam && PERSPECTIVE_MAP[asParam]) {
      return PERSPECTIVE_MAP[asParam];
    }

    return 'current-user';
  }, []);
}
