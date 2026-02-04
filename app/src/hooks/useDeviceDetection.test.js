import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useIsMobile,
  useIsDesktop,
  useIsTablet,
  useIsSmallMobile,
  useIsTouchDevice,
  useDeviceType,
  useDeviceDetection,
  MOBILE_BREAKPOINT,
  TABLET_BREAKPOINT,
  SMALL_MOBILE_BREAKPOINT
} from './useDeviceDetection.js';

describe('useDeviceDetection Hooks', () => {
  let originalInnerWidth;
  let originalOntouchstart;
  let originalMaxTouchPoints;
  let resizeListeners;

  beforeEach(() => {
    // Save original values
    originalInnerWidth = window.innerWidth;
    originalOntouchstart = window.ontouchstart;
    originalMaxTouchPoints = navigator.maxTouchPoints;

    // Track resize listeners
    resizeListeners = [];
    const originalAddEventListener = window.addEventListener;
    const originalRemoveEventListener = window.removeEventListener;

    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'resize') {
        resizeListeners.push(handler);
      }
      return originalAddEventListener.call(window, event, handler);
    });

    vi.spyOn(window, 'removeEventListener').mockImplementation((event, handler) => {
      if (event === 'resize') {
        resizeListeners = resizeListeners.filter(h => h !== handler);
      }
      return originalRemoveEventListener.call(window, event, handler);
    });
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    });
    vi.restoreAllMocks();
  });

  // Helper to simulate resize
  const simulateResize = (width) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width
    });
    resizeListeners.forEach(handler => handler());
  };

  // ========================================
  // CONSTANTS TESTS
  // ========================================
  describe('Constants', () => {
    it('exports MOBILE_BREAKPOINT as 768', () => {
      expect(MOBILE_BREAKPOINT).toBe(768);
    });

    it('exports TABLET_BREAKPOINT as 1024', () => {
      expect(TABLET_BREAKPOINT).toBe(1024);
    });

    it('exports SMALL_MOBILE_BREAKPOINT as 480', () => {
      expect(SMALL_MOBILE_BREAKPOINT).toBe(480);
    });
  });

  // ========================================
  // useIsMobile TESTS
  // ========================================
  describe('useIsMobile', () => {
    it('returns true when window width is <= 768', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('returns true when window width is less than 768', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it('returns false when window width is > 768', () => {
      Object.defineProperty(window, 'innerWidth', { value: 769 });
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it('updates when window is resized', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);

      act(() => {
        simulateResize(500);
      });

      expect(result.current).toBe(true);
    });

    it('cleans up resize listener on unmount', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      const { unmount } = renderHook(() => useIsMobile());

      const listenerCountBefore = resizeListeners.length;
      unmount();

      expect(resizeListeners.length).toBeLessThan(listenerCountBefore);
    });
  });

  // ========================================
  // useIsDesktop TESTS
  // ========================================
  describe('useIsDesktop', () => {
    it('returns true when window width is > 768', () => {
      Object.defineProperty(window, 'innerWidth', { value: 769 });
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(true);
    });

    it('returns false when window width is <= 768', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(false);
    });

    it('returns false when window width is less than 768', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(false);
    });

    it('updates when window is resized', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      const { result } = renderHook(() => useIsDesktop());

      expect(result.current).toBe(false);

      act(() => {
        simulateResize(1024);
      });

      expect(result.current).toBe(true);
    });
  });

  // ========================================
  // useIsTablet TESTS
  // ========================================
  describe('useIsTablet', () => {
    it('returns true when window width is between 769 and 1024', () => {
      Object.defineProperty(window, 'innerWidth', { value: 900 });
      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(true);
    });

    it('returns true at exactly 1024', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(true);
    });

    it('returns false when window width is 768 (mobile)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(false);
    });

    it('returns false when window width is > 1024', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1025 });
      const { result } = renderHook(() => useIsTablet());
      expect(result.current).toBe(false);
    });

    it('updates when window is resized', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200 });
      const { result } = renderHook(() => useIsTablet());

      expect(result.current).toBe(false);

      act(() => {
        simulateResize(900);
      });

      expect(result.current).toBe(true);
    });
  });

  // ========================================
  // useIsSmallMobile TESTS
  // ========================================
  describe('useIsSmallMobile', () => {
    it('returns true when window width is <= 480', () => {
      Object.defineProperty(window, 'innerWidth', { value: 480 });
      const { result } = renderHook(() => useIsSmallMobile());
      expect(result.current).toBe(true);
    });

    it('returns true when window width is less than 480', () => {
      Object.defineProperty(window, 'innerWidth', { value: 320 });
      const { result } = renderHook(() => useIsSmallMobile());
      expect(result.current).toBe(true);
    });

    it('returns false when window width is > 480', () => {
      Object.defineProperty(window, 'innerWidth', { value: 481 });
      const { result } = renderHook(() => useIsSmallMobile());
      expect(result.current).toBe(false);
    });

    it('updates when window is resized', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600 });
      const { result } = renderHook(() => useIsSmallMobile());

      expect(result.current).toBe(false);

      act(() => {
        simulateResize(400);
      });

      expect(result.current).toBe(true);
    });
  });

  // ========================================
  // useIsTouchDevice TESTS
  // ========================================
  describe('useIsTouchDevice', () => {
    it('returns true when ontouchstart is in window', () => {
      Object.defineProperty(window, 'ontouchstart', {
        value: () => {},
        configurable: true
      });
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true
      });

      const { result } = renderHook(() => useIsTouchDevice());
      expect(result.current).toBe(true);
    });

    it('returns true when maxTouchPoints > 0', () => {
      delete window.ontouchstart;
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        configurable: true
      });

      const { result } = renderHook(() => useIsTouchDevice());
      expect(result.current).toBe(true);
    });

    it('returns false when no touch support', () => {
      delete window.ontouchstart;
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true
      });

      const { result } = renderHook(() => useIsTouchDevice());
      expect(result.current).toBe(false);
    });
  });

  // ========================================
  // useDeviceType TESTS
  // ========================================
  describe('useDeviceType', () => {
    it('returns "mobile" for mobile width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      const { result } = renderHook(() => useDeviceType());
      expect(result.current).toBe('mobile');
    });

    it('returns "tablet" for tablet width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 900 });
      const { result } = renderHook(() => useDeviceType());
      expect(result.current).toBe('tablet');
    });

    it('returns "desktop" for desktop width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200 });
      const { result } = renderHook(() => useDeviceType());
      expect(result.current).toBe('desktop');
    });

    it('updates when window is resized', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200 });
      const { result } = renderHook(() => useDeviceType());

      expect(result.current).toBe('desktop');

      act(() => {
        simulateResize(500);
      });

      expect(result.current).toBe('mobile');
    });
  });

  // ========================================
  // useDeviceDetection TESTS
  // ========================================
  describe('useDeviceDetection', () => {
    it('returns all device detection values', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current).toHaveProperty('isMobile');
      expect(result.current).toHaveProperty('isTablet');
      expect(result.current).toHaveProperty('isDesktop');
      expect(result.current).toHaveProperty('isSmallMobile');
      expect(result.current).toHaveProperty('isTouchDevice');
      expect(result.current).toHaveProperty('deviceType');
      expect(result.current).toHaveProperty('breakpoints');
    });

    it('returns correct values for mobile device', () => {
      Object.defineProperty(window, 'innerWidth', { value: 400 });
      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.isSmallMobile).toBe(true);
      expect(result.current.deviceType).toBe('small-mobile');
    });

    it('returns correct values for regular mobile device', () => {
      Object.defineProperty(window, 'innerWidth', { value: 600 });
      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
      expect(result.current.isSmallMobile).toBe(false);
      expect(result.current.deviceType).toBe('mobile');
    });

    it('returns correct values for tablet device', () => {
      Object.defineProperty(window, 'innerWidth', { value: 900 });
      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isSmallMobile).toBe(false);
      expect(result.current.deviceType).toBe('tablet');
    });

    it('returns correct values for desktop device', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200 });
      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isSmallMobile).toBe(false);
      expect(result.current.deviceType).toBe('desktop');
    });

    it('includes breakpoints object', () => {
      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.breakpoints).toEqual({
        mobile: 768,
        tablet: 1024,
        smallMobile: 480
      });
    });
  });

  // ========================================
  // BOUNDARY TESTS
  // ========================================
  describe('Boundary Values', () => {
    it('treats 768 as mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });

    it('treats 769 as desktop/tablet', () => {
      Object.defineProperty(window, 'innerWidth', { value: 769 });
      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.isTablet).toBe(true);
    });

    it('treats 1024 as tablet', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(true);
    });

    it('treats 1025 as desktop (not tablet)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1025 });
      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
    });

    it('treats 480 as small mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 480 });
      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.isSmallMobile).toBe(true);
      expect(result.current.isMobile).toBe(true);
    });

    it('treats 481 as not small mobile', () => {
      Object.defineProperty(window, 'innerWidth', { value: 481 });
      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.isSmallMobile).toBe(false);
      expect(result.current.isMobile).toBe(true);
    });
  });

  // ========================================
  // RESIZE EVENT HANDLING
  // ========================================
  describe('Resize Event Handling', () => {
    it('responds to multiple resize events', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.deviceType).toBe('mobile');

      act(() => {
        simulateResize(900);
      });
      expect(result.current.deviceType).toBe('tablet');

      act(() => {
        simulateResize(1200);
      });
      expect(result.current.deviceType).toBe('desktop');

      act(() => {
        simulateResize(400);
      });
      expect(result.current.deviceType).toBe('small-mobile');
    });
  });

  // ========================================
  // EDGE CASES
  // ========================================
  describe('Edge Cases', () => {
    it('handles very small widths', () => {
      Object.defineProperty(window, 'innerWidth', { value: 100 });
      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isSmallMobile).toBe(true);
      expect(result.current.deviceType).toBe('small-mobile');
    });

    it('handles very large widths', () => {
      Object.defineProperty(window, 'innerWidth', { value: 3840 }); // 4K
      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
      expect(result.current.deviceType).toBe('desktop');
    });

    it('handles zero width', () => {
      Object.defineProperty(window, 'innerWidth', { value: 0 });
      const { result } = renderHook(() => useDeviceDetection());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isSmallMobile).toBe(true);
    });
  });
});
