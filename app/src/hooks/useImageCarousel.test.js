import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageCarousel } from './useImageCarousel.js';

describe('useImageCarousel Hook', () => {
  // ========================================
  // INITIAL STATE TESTS
  // ========================================
  describe('Initial State', () => {
    it('starts at index 0', () => {
      const images = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      expect(result.current.currentImageIndex).toBe(0);
    });

    it('returns hasImages as true when images array is not empty', () => {
      const images = ['image1.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      expect(result.current.hasImages).toBe(true);
    });

    it('returns hasImages as false when images array is empty', () => {
      const images = [];
      const { result } = renderHook(() => useImageCarousel(images));

      expect(result.current.hasImages).toBe(false);
    });

    it('returns hasImages as falsy when images is undefined', () => {
      const { result } = renderHook(() => useImageCarousel(undefined));

      // The hook returns undefined && undefined.length > 0 which is undefined (falsy)
      expect(result.current.hasImages).toBeFalsy();
    });

    it('returns hasImages as falsy when images is null', () => {
      const { result } = renderHook(() => useImageCarousel(null));

      // The hook returns null && null.length > 0 which is null (falsy)
      expect(result.current.hasImages).toBeFalsy();
    });

    it('returns hasMultipleImages as true when images array has more than one item', () => {
      const images = ['image1.jpg', 'image2.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      expect(result.current.hasMultipleImages).toBe(true);
    });

    it('returns hasMultipleImages as false when images array has one item', () => {
      const images = ['image1.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      expect(result.current.hasMultipleImages).toBe(false);
    });

    it('returns hasMultipleImages as false when images array is empty', () => {
      const images = [];
      const { result } = renderHook(() => useImageCarousel(images));

      expect(result.current.hasMultipleImages).toBe(false);
    });
  });

  // ========================================
  // NEXT IMAGE NAVIGATION TESTS
  // ========================================
  describe('handleNextImage', () => {
    it('advances to the next image', () => {
      const images = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      act(() => {
        result.current.handleNextImage(mockEvent);
      });

      expect(result.current.currentImageIndex).toBe(1);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('wraps around to first image when at the end', () => {
      const images = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      // Navigate to end
      act(() => {
        result.current.handleNextImage(mockEvent);
        result.current.handleNextImage(mockEvent);
        result.current.handleNextImage(mockEvent); // Should wrap to 0
      });

      expect(result.current.currentImageIndex).toBe(0);
    });

    it('does nothing when there is only one image', () => {
      const images = ['image1.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      act(() => {
        result.current.handleNextImage(mockEvent);
      });

      expect(result.current.currentImageIndex).toBe(0);
    });

    it('does nothing when images array is empty', () => {
      const images = [];
      const { result } = renderHook(() => useImageCarousel(images));

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      act(() => {
        result.current.handleNextImage(mockEvent);
      });

      expect(result.current.currentImageIndex).toBe(0);
    });

    it('does nothing when images is undefined', () => {
      const { result } = renderHook(() => useImageCarousel(undefined));

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      act(() => {
        result.current.handleNextImage(mockEvent);
      });

      expect(result.current.currentImageIndex).toBe(0);
    });
  });

  // ========================================
  // PREVIOUS IMAGE NAVIGATION TESTS
  // ========================================
  describe('handlePrevImage', () => {
    it('goes to the previous image', () => {
      const images = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      // First advance
      act(() => {
        result.current.handleNextImage(mockEvent);
      });

      // Then go back
      act(() => {
        result.current.handlePrevImage(mockEvent);
      });

      expect(result.current.currentImageIndex).toBe(0);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('wraps around to last image when at the beginning', () => {
      const images = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      act(() => {
        result.current.handlePrevImage(mockEvent);
      });

      expect(result.current.currentImageIndex).toBe(2); // Last index
    });

    it('does nothing when there is only one image', () => {
      const images = ['image1.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      act(() => {
        result.current.handlePrevImage(mockEvent);
      });

      expect(result.current.currentImageIndex).toBe(0);
    });

    it('does nothing when images array is empty', () => {
      const images = [];
      const { result } = renderHook(() => useImageCarousel(images));

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      act(() => {
        result.current.handlePrevImage(mockEvent);
      });

      expect(result.current.currentImageIndex).toBe(0);
    });
  });

  // ========================================
  // DIRECT INDEX SET TESTS
  // ========================================
  describe('setCurrentImageIndex', () => {
    it('allows direct setting of image index', () => {
      const images = ['image1.jpg', 'image2.jpg', 'image3.jpg', 'image4.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      act(() => {
        result.current.setCurrentImageIndex(2);
      });

      expect(result.current.currentImageIndex).toBe(2);
    });

    it('accepts a function updater', () => {
      const images = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      act(() => {
        result.current.setCurrentImageIndex((prev) => prev + 1);
      });

      expect(result.current.currentImageIndex).toBe(1);
    });
  });

  // ========================================
  // COMPLEX NAVIGATION SCENARIOS
  // ========================================
  describe('Complex Navigation', () => {
    it('handles multiple forward navigations', () => {
      const images = ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg', 'e.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      act(() => {
        result.current.handleNextImage(mockEvent); // 1
        result.current.handleNextImage(mockEvent); // 2
        result.current.handleNextImage(mockEvent); // 3
      });

      expect(result.current.currentImageIndex).toBe(3);
    });

    it('handles multiple backward navigations', () => {
      const images = ['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg', 'e.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      act(() => {
        result.current.handlePrevImage(mockEvent); // 4 (last)
        result.current.handlePrevImage(mockEvent); // 3
        result.current.handlePrevImage(mockEvent); // 2
      });

      expect(result.current.currentImageIndex).toBe(2);
    });

    it('handles mixed forward and backward navigation', () => {
      const images = ['a.jpg', 'b.jpg', 'c.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      act(() => {
        result.current.handleNextImage(mockEvent); // 1
        result.current.handleNextImage(mockEvent); // 2
        result.current.handlePrevImage(mockEvent); // 1
        result.current.handlePrevImage(mockEvent); // 0
        result.current.handlePrevImage(mockEvent); // 2 (wrap)
      });

      expect(result.current.currentImageIndex).toBe(2);
    });

    it('handles wrap-around in both directions', () => {
      const images = ['a.jpg', 'b.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      // Forward wrap
      act(() => {
        result.current.handleNextImage(mockEvent); // 1
        result.current.handleNextImage(mockEvent); // 0 (wrap)
      });
      expect(result.current.currentImageIndex).toBe(0);

      // Backward wrap
      act(() => {
        result.current.handlePrevImage(mockEvent); // 1 (wrap)
      });
      expect(result.current.currentImageIndex).toBe(1);
    });
  });

  // ========================================
  // HOOK UPDATES TESTS
  // ========================================
  describe('Hook Updates', () => {
    it('updates hasMultipleImages when images change', () => {
      const { result, rerender } = renderHook(
        ({ images }) => useImageCarousel(images),
        { initialProps: { images: ['a.jpg'] } }
      );

      expect(result.current.hasMultipleImages).toBe(false);

      rerender({ images: ['a.jpg', 'b.jpg'] });

      expect(result.current.hasMultipleImages).toBe(true);
    });

    it('updates hasImages when images change', () => {
      const { result, rerender } = renderHook(
        ({ images }) => useImageCarousel(images),
        { initialProps: { images: [] } }
      );

      expect(result.current.hasImages).toBe(false);

      rerender({ images: ['a.jpg'] });

      expect(result.current.hasImages).toBe(true);
    });

    it('maintains current index when images change but index is still valid', () => {
      const { result, rerender } = renderHook(
        ({ images }) => useImageCarousel(images),
        { initialProps: { images: ['a.jpg', 'b.jpg', 'c.jpg'] } }
      );

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      act(() => {
        result.current.handleNextImage(mockEvent); // index = 1
      });

      rerender({ images: ['x.jpg', 'y.jpg', 'z.jpg', 'w.jpg'] });

      // Index should still be 1
      expect(result.current.currentImageIndex).toBe(1);
    });
  });

  // ========================================
  // EVENT HANDLING TESTS
  // ========================================
  describe('Event Handling', () => {
    it('calls preventDefault on next image event', () => {
      const images = ['a.jpg', 'b.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      act(() => {
        result.current.handleNextImage(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
    });

    it('calls stopPropagation on next image event', () => {
      const images = ['a.jpg', 'b.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      act(() => {
        result.current.handleNextImage(mockEvent);
      });

      expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
    });

    it('calls preventDefault on prev image event', () => {
      const images = ['a.jpg', 'b.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      act(() => {
        result.current.handlePrevImage(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
    });

    it('calls stopPropagation on prev image event', () => {
      const images = ['a.jpg', 'b.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      act(() => {
        result.current.handlePrevImage(mockEvent);
      });

      expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
    });
  });

  // ========================================
  // EDGE CASES
  // ========================================
  describe('Edge Cases', () => {
    it('handles images array with 2 elements correctly', () => {
      const images = ['a.jpg', 'b.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      expect(result.current.hasMultipleImages).toBe(true);

      act(() => {
        result.current.handleNextImage(mockEvent);
      });
      expect(result.current.currentImageIndex).toBe(1);

      act(() => {
        result.current.handleNextImage(mockEvent);
      });
      expect(result.current.currentImageIndex).toBe(0);
    });

    it('handles very large images array', () => {
      const images = Array.from({ length: 100 }, (_, i) => `image${i}.jpg`);
      const { result } = renderHook(() => useImageCarousel(images));

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      };

      // Navigate to end
      act(() => {
        result.current.setCurrentImageIndex(99);
      });

      act(() => {
        result.current.handleNextImage(mockEvent);
      });

      expect(result.current.currentImageIndex).toBe(0);
    });

    it('returns stable function references', () => {
      const images = ['a.jpg', 'b.jpg'];
      const { result, rerender } = renderHook(() => useImageCarousel(images));

      const firstHandleNext = result.current.handleNextImage;
      const firstHandlePrev = result.current.handlePrevImage;

      rerender();

      // Functions should be stable (useCallback)
      expect(result.current.handleNextImage).toBe(firstHandleNext);
      expect(result.current.handlePrevImage).toBe(firstHandlePrev);
    });
  });

  // ========================================
  // RETURN VALUE STRUCTURE
  // ========================================
  describe('Return Value Structure', () => {
    it('returns all expected properties', () => {
      const images = ['a.jpg', 'b.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      expect(result.current).toHaveProperty('currentImageIndex');
      expect(result.current).toHaveProperty('hasImages');
      expect(result.current).toHaveProperty('hasMultipleImages');
      expect(result.current).toHaveProperty('handlePrevImage');
      expect(result.current).toHaveProperty('handleNextImage');
      expect(result.current).toHaveProperty('setCurrentImageIndex');
    });

    it('returns correct types for all properties', () => {
      const images = ['a.jpg', 'b.jpg'];
      const { result } = renderHook(() => useImageCarousel(images));

      expect(typeof result.current.currentImageIndex).toBe('number');
      expect(typeof result.current.hasImages).toBe('boolean');
      expect(typeof result.current.hasMultipleImages).toBe('boolean');
      expect(typeof result.current.handlePrevImage).toBe('function');
      expect(typeof result.current.handleNextImage).toBe('function');
      expect(typeof result.current.setCurrentImageIndex).toBe('function');
    });
  });
});
