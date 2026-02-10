/**
 * Device Detection Hooks
 * Split Lease - Frontend
 *
 * Provides centralized device/viewport detection for responsive behavior.
 * All hooks build on the useMediaQuery primitive for efficient,
 * event-driven breakpoint tracking (matchMedia instead of resize listeners).
 *
 * Usage:
 *   import { useIsMobile, useIsDesktop } from '../hooks/useDeviceDetection';
 *
 *   function MyComponent() {
 *     const isMobile = useIsMobile();
 *     if (isMobile) return <MobileLayout />;
 *     return <DesktopLayout />;
 *   }
 */

import { useState, useEffect } from 'react';
import { useMediaQuery } from './useMediaQuery.js';

// Standard breakpoints
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;
const SMALL_MOBILE_BREAKPOINT = 480;

/**
 * Hook to detect if current viewport is mobile-sized
 * @returns {boolean} True if viewport width <= 768px
 */
export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT}px)`);
}

/**
 * Hook to detect if current viewport is desktop-sized
 * @returns {boolean} True if viewport width > 768px
 */
export function useIsDesktop() {
  return useMediaQuery(`(min-width: ${MOBILE_BREAKPOINT + 1}px)`, true);
}

/**
 * Hook to detect if current viewport is tablet-sized (769px to 1024px)
 * @returns {boolean} True if viewport width is in tablet range
 */
export function useIsTablet() {
  return useMediaQuery(`(min-width: ${MOBILE_BREAKPOINT + 1}px) and (max-width: ${TABLET_BREAKPOINT}px)`);
}

/**
 * Hook to detect if current viewport is small mobile-sized
 * @returns {boolean} True if viewport width <= 480px
 */
export function useIsSmallMobile() {
  return useMediaQuery(`(max-width: ${SMALL_MOBILE_BREAKPOINT}px)`);
}

/**
 * Hook to detect if device has touch capability
 * @returns {boolean} True if device supports touch
 */
export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouchDevice;
}

/**
 * Hook returning device type string
 * @returns {'mobile' | 'tablet' | 'desktop'} Current device type
 */
export function useDeviceType() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}

/**
 * Hook providing all device detection values at once
 * @returns {Object} Object with isMobile, isTablet, isDesktop, deviceType, etc.
 */
export function useDeviceDetection() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const isSmallMobile = useIsSmallMobile();
  const isTouchDevice = useIsTouchDevice();

  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmallMobile,
    isTouchDevice,
    deviceType: isMobile ? (isSmallMobile ? 'small-mobile' : 'mobile') : isTablet ? 'tablet' : 'desktop',
    breakpoints: {
      mobile: MOBILE_BREAKPOINT,
      tablet: TABLET_BREAKPOINT,
      smallMobile: SMALL_MOBILE_BREAKPOINT
    }
  };
}

// Export constants for direct use
export { MOBILE_BREAKPOINT, TABLET_BREAKPOINT, SMALL_MOBILE_BREAKPOINT };
