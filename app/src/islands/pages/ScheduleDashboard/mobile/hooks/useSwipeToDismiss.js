/**
 * useSwipeToDismiss Hook
 *
 * Provides swipe-down-to-dismiss functionality for modals and sheets.
 * Returns a ref and touch handlers to attach to dismissible elements.
 */

import { useRef, useCallback } from 'react';

const DISMISS_THRESHOLD = 100; // pixels needed to trigger dismiss

/**
 * Hook for swipe-to-dismiss functionality
 * @param {function} onDismiss - Callback when swipe threshold is met
 * @param {Object} [options] - Configuration options
 * @param {number} [options.threshold=100] - Pixels to swipe before dismiss
 * @param {boolean} [options.enabled=true] - Whether swipe is enabled
 * @returns {Object} Ref and event handlers for the dismissible element
 */
export function useSwipeToDismiss(onDismiss, options = {}) {
  const { threshold = DISMISS_THRESHOLD, enabled = true } = options;

  const startY = useRef(null);
  const currentY = useRef(null);
  const elementRef = useRef(null);

  const onTouchStart = useCallback(
    (e) => {
      if (!enabled) return;
      startY.current = e.touches[0].clientY;
    },
    [enabled]
  );

  const onTouchMove = useCallback(
    (e) => {
      if (!enabled || !startY.current) return;

      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - startY.current;

      // Only allow downward drag
      if (deltaY > 0 && elementRef.current) {
        elementRef.current.style.transform = `translateY(${deltaY}px)`;
        elementRef.current.style.transition = 'none';

        // Add visual feedback for dismissal threshold
        const progress = Math.min(deltaY / threshold, 1);
        elementRef.current.style.opacity = String(1 - progress * 0.3);
      }
    },
    [enabled, threshold]
  );

  const onTouchEnd = useCallback(() => {
    if (!enabled || !startY.current || !currentY.current) {
      startY.current = null;
      currentY.current = null;
      return;
    }

    const deltaY = currentY.current - startY.current;

    if (deltaY > threshold) {
      // Dismiss
      onDismiss?.();
    } else if (elementRef.current) {
      // Snap back with animation
      elementRef.current.style.transform = '';
      elementRef.current.style.transition = '';
      elementRef.current.style.opacity = '';
    }

    startY.current = null;
    currentY.current = null;
  }, [enabled, threshold, onDismiss]);

  const onTouchCancel = useCallback(() => {
    if (elementRef.current) {
      elementRef.current.style.transform = '';
      elementRef.current.style.transition = '';
      elementRef.current.style.opacity = '';
    }
    startY.current = null;
    currentY.current = null;
  }, []);

  return {
    ref: elementRef,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel
    }
  };
}
