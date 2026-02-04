import { useRef, useCallback } from 'react';

const SWIPE_THRESHOLD = 50; // pixels

export function useSwipeGesture({ onSwipeLeft, onSwipeRight }) {
  const touchStart = useRef(null);
  const touchEnd = useRef(null);

  const onTouchStart = useCallback((e) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;

    const distance = touchStart.current - touchEnd.current;
    const isSwipe = Math.abs(distance) > SWIPE_THRESHOLD;
    if (isSwipe) {
      if (distance > 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    }
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
