/**
 * BottomSheet Component
 *
 * Reusable bottom sheet modal for mobile interactions.
 * Slides up from bottom with backdrop, supports multiple heights.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Bottom sheet modal component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether sheet is visible
 * @param {function} props.onClose - Callback to close sheet
 * @param {string} [props.title] - Optional header title
 * @param {React.ReactNode} props.children - Sheet content
 * @param {'auto' | 'half' | 'full'} [props.height='auto'] - Sheet height mode
 * @param {boolean} [props.showHandle=true] - Show drag handle indicator
 * @param {boolean} [props.closeOnBackdrop=true] - Close when clicking backdrop
 */
export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  height = 'auto',
  showHandle = true,
  closeOnBackdrop = true
}) {
  const sheetRef = useRef(null);
  const startY = useRef(null);
  const currentY = useRef(null);
  const backdropTouchStarted = useRef(false);
  const closeTimer = useRef(null);

  // Animation guard: keep mounted during close animation (300ms)
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  // Interaction lock: prevent immediate close after open (fixes touch bleed-through)
  const [isInteractable, setIsInteractable] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      setIsInteractable(false);
      backdropTouchStarted.current = false;
      // Allow interactions after animation completes (increased to 500ms for safety)
      const interactionTimer = setTimeout(() => {
        setIsInteractable(true);
      }, 500);
      return () => clearTimeout(interactionTimer);
    } else if (shouldRender) {
      // Start closing animation
      setIsClosing(true);
      setIsInteractable(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 300); // Match CSS animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    };
  }, []);

  // Close on backdrop click (only when interactable)
  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget && isInteractable) {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
      closeTimer.current = setTimeout(() => {
        onClose?.();
      }, 150);
    }
  };

  // Close on Escape key and lock body scroll
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Swipe to dismiss handlers
  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!startY.current) return;
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    // Only allow downward drag
    if (deltaY > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      sheetRef.current.style.transition = 'none';
    }
  };

  const handleTouchEnd = () => {
    if (!startY.current || !currentY.current) {
      startY.current = null;
      currentY.current = null;
      return;
    }

    const deltaY = currentY.current - startY.current;
    const DISMISS_THRESHOLD = 100;

    // Only allow dismiss when interactable (prevents touch bleed-through on open)
    if (deltaY > DISMISS_THRESHOLD && isInteractable) {
      onClose?.();
    } else if (sheetRef.current) {
      // Snap back
      sheetRef.current.style.transform = '';
      sheetRef.current.style.transition = '';
    }

    startY.current = null;
    currentY.current = null;
  };

  if (!shouldRender) return null;

  // Prevent clicks on sheet content from bubbling to backdrop
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  const sheetContent = (
    <div
      className={`bottom-sheet-backdrop ${isOpen ? 'bottom-sheet-backdrop--open' : ''} ${isClosing ? 'bottom-sheet-backdrop--closing' : ''}`}
      onClick={(e) => {
        // Only handle click if touch started on backdrop (prevents bleed-through from day cell)
        // For mouse clicks (non-touch), backdropTouchStarted will be false but we still want to allow close
        const isTouchDevice = 'ontouchstart' in window;
        if (!isTouchDevice || backdropTouchStarted.current) {
          handleBackdropClick(e);
        }
        backdropTouchStarted.current = false;
      }}
      onTouchStart={(e) => {
        // Track that touch started on the backdrop itself
        if (e.target === e.currentTarget && isInteractable) {
          backdropTouchStarted.current = true;
        }
      }}
      onTouchEnd={(e) => {
        // Prevent touch events from triggering backdrop close during animation
        if (!isInteractable) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      style={{ pointerEvents: isInteractable ? 'auto' : 'none' }}
      aria-hidden={!isOpen}
    >
      <div
        ref={sheetRef}
        className={`bottom-sheet bottom-sheet--${height} ${isClosing ? 'bottom-sheet--closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
        onClick={handleContentClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ pointerEvents: 'auto' }}
      >
        {showHandle && (
          <div className="bottom-sheet__handle-container">
            <div className="bottom-sheet__handle" />
          </div>
        )}

        {title && (
          <div className="bottom-sheet__header">
            <h2 id="sheet-title" className="bottom-sheet__title">
              {title}
            </h2>
            <button
              className="bottom-sheet__close"
              onClick={onClose}
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        )}

        <div className="bottom-sheet__content">{children}</div>
      </div>
    </div>
  );

  // Portal to document body for proper stacking
  return createPortal(sheetContent, document.body);
}
