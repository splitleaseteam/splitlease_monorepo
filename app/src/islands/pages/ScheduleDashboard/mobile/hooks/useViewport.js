/**
 * Viewport Detection Hook
 *
 * Detects current viewport size and returns classification.
 * Used for responsive rendering decisions.
 */

import { useState, useEffect } from 'react';

const BREAKPOINTS = {
  mobile: 767,
  tablet: 1024
};

/**
 * Get current viewport classification based on window width
 * @returns {'mobile' | 'tablet' | 'desktop'}
 */
function getViewport() {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  if (width <= BREAKPOINTS.mobile) return 'mobile';
  if (width <= BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
}

/**
 * Hook to track viewport size changes
 * @returns {'mobile' | 'tablet' | 'desktop'} Current viewport classification
 */
export function useViewport() {
  const [viewport, setViewport] = useState(getViewport);

  useEffect(() => {
    const handleResize = () => setViewport(getViewport());

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
}

export { BREAKPOINTS };
