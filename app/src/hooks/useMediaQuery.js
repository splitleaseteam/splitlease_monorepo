import { useState, useEffect } from 'react';

/**
 * useMediaQuery - Primitive hook for responsive breakpoint detection.
 *
 * Uses window.matchMedia for efficient, event-driven viewport tracking
 * instead of repeated resize listeners. All device detection hooks
 * (useIsMobile, useIsDesktop, etc.) should build on this primitive.
 *
 * @param {string} query - CSS media query string (e.g., '(max-width: 768px)')
 * @param {boolean} [defaultValue=false] - Default value for SSR or when window is unavailable.
 * @returns {boolean} Whether the media query currently matches.
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 */
export function useMediaQuery(query, defaultValue = false) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return defaultValue;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);

    // Sync state in case it changed between render and effect
    setMatches(mediaQuery.matches);

    const handler = (event) => setMatches(event.matches);

    // Modern API (addEventListener) with fallback (addListener)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}

export default useMediaQuery;
