/**
 * Perspective switching hook for Schedule Dashboard
 * Reads ?as= query param to determine which user's perspective to show
 *
 * Usage:
 *   /schedule/lease-123           -> Default (Alex's perspective)
 *   /schedule/lease-123?as=sarah  -> Sarah's perspective (co-tenant view)
 *
 * This works in both dev mode (`bun run dev`) and preview mode (`bun run preview`)
 */
import { useMemo } from 'react';

// Map of allowed perspective switches
const PERSPECTIVE_MAP = {
  'sarah': 'user-456',      // Sarah Chen
  'user-456': 'user-456',   // Direct ID also works
  'alex': 'current-user',   // Alex Morgan (explicit)
  'current-user': 'current-user',
  // Add more as needed for additional co-tenants
};

/**
 * Returns the user ID for the current perspective
 * @returns {string} 'current-user' (Alex) or 'user-456' (Sarah)
 */
export function usePerspective() {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return 'current-user';
    }

    const params = new URLSearchParams(window.location.search);
    const asParam = params.get('as')?.toLowerCase();

    console.log('[usePerspective] URL param ?as=', asParam);

    if (asParam && PERSPECTIVE_MAP[asParam]) {
      const userId = PERSPECTIVE_MAP[asParam];
      console.log('[usePerspective] Returning perspective:', userId === 'user-456' ? 'Sarah' : 'Alex');
      return userId;
    }

    console.log('[usePerspective] Returning default perspective: Alex');
    return 'current-user';
  }, []);
}
