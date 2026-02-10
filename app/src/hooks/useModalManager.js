import { useState, useCallback, useRef } from 'react';

/**
 * useModalManager - Centralized modal state management hook.
 *
 * Replaces the repeated pattern of multiple useState(false) + useState(null) pairs per modal.
 *
 * BEFORE:
 *   const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
 *   const [reviewTargetStay, setReviewTargetStay] = useState(null);
 *   const [isDateChangeModalOpen, setIsDateChangeModalOpen] = useState(false);
 *   const [selectedDateChangeRequest, setSelectedDateChangeRequest] = useState(null);
 *   // + 4 handler functions (open/close for each)
 *
 * AFTER:
 *   const modals = useModalManager();
 *   modals.open('review', { stay });
 *   modals.open('dateChange', { request });
 *   // In JSX: isOpen={modals.isOpen('review')} onClose={() => modals.close('review')}
 *
 * @param {Object} [options]
 * @param {boolean} [options.allowMultiple=false] - When false (default), opening a modal
 *   closes any currently open modal. When true, modals are independent.
 * @returns {{ open, close, closeAll, toggle, isOpen, getData, openModal }}
 */
export function useModalManager(options = {}) {
  const { allowMultiple = false } = options;

  // State shape: { [modalName]: { open: boolean, data: any } }
  const [modals, setModals] = useState({});

  // Track current modal name for single-modal mode (ref avoids stale closures)
  const currentModalRef = useRef(null);

  /**
   * Open a modal by name with an optional data payload.
   * @param {string} name - Modal identifier (e.g. 'review', 'confirmCancel')
   * @param {*} [data=null] - Payload accessible via getData(name)
   */
  const open = useCallback((name, data = null) => {
    setModals(prev => {
      const next = allowMultiple ? { ...prev } : {};
      next[name] = { open: true, data };
      return next;
    });
    currentModalRef.current = name;
  }, [allowMultiple]);

  /**
   * Close a specific modal and clear its data.
   * @param {string} name - Modal identifier to close
   */
  const close = useCallback((name) => {
    setModals(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    if (currentModalRef.current === name) {
      currentModalRef.current = null;
    }
  }, []);

  /** Close all open modals and clear all data. */
  const closeAll = useCallback(() => {
    setModals({});
    currentModalRef.current = null;
  }, []);

  /**
   * Toggle a modal. If opening, accepts an optional data payload.
   * @param {string} name - Modal identifier
   * @param {*} [data=null] - Data payload (only used when opening)
   */
  const toggle = useCallback((name, data = null) => {
    setModals(prev => {
      const isCurrentlyOpen = prev[name]?.open === true;
      if (isCurrentlyOpen) {
        const next = { ...prev };
        delete next[name];
        if (currentModalRef.current === name) {
          currentModalRef.current = null;
        }
        return next;
      }
      const next = allowMultiple ? { ...prev } : {};
      next[name] = { open: true, data };
      currentModalRef.current = name;
      return next;
    });
  }, [allowMultiple]);

  /** @param {string} name - Modal identifier @returns {boolean} */
  const isOpen = useCallback((name) => {
    return modals[name]?.open === true;
  }, [modals]);

  /** @param {string} name - Modal identifier @returns {*} data payload or null */
  const getData = useCallback((name) => {
    return modals[name]?.data ?? null;
  }, [modals]);

  return {
    open,
    close,
    closeAll,
    toggle,
    isOpen,
    getData,
    /** The name of the most recently opened modal, or null. */
    openModal: currentModalRef.current,
  };
}

export default useModalManager;
