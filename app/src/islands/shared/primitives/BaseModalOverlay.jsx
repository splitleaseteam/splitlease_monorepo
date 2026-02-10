/**
 * BaseModalOverlay - Reusable modal overlay/backdrop component
 *
 * Extracts the common overlay pattern from all modals: backdrop, click-outside-to-close,
 * escape key dismiss, and body scroll lock.
 *
 * @example
 * <BaseModalOverlay isOpen={showModal} onClose={() => setShowModal(false)}>
 *   <div className="my-modal-content">...</div>
 * </BaseModalOverlay>
 */

import React, { useEffect, useCallback } from 'react';

const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'var(--overlay-dark, rgba(0, 0, 0, 0.7))',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 'var(--z-modal, 10000)',
  animation: 'baseModalFadeIn 0.2s ease-in-out',
};

/**
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls visibility
 * @param {Function} props.onClose - Called when modal should close
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} [props.className] - Additional class for the overlay
 * @param {boolean} [props.closeOnBackdropClick=true] - Close on backdrop click
 * @param {boolean} [props.closeOnEscape=true] - Close on Escape key
 */
export function BaseModalOverlay({
  isOpen, onClose, children, className,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}) {
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape' && closeOnEscape) onClose();
  }, [onClose, closeOnEscape]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleEscape]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) onClose();
  };

  return (
    <div
      style={overlayStyle}
      className={className}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      {children}
      <style>{`
        @keyframes baseModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default BaseModalOverlay;
