/**
 * UI State Hook for ScheduleDashboard
 * @module hooks/useUIState
 *
 * Manages drawer states, modal states, dashboard mode, and active selections.
 * Extracted from useScheduleDashboardLogic.js for better separation of concerns.
 */

import { useState, useCallback } from 'react';

/**
 * Hook for managing UI state in ScheduleDashboard
 * @returns {object} UI state and handlers
 */
export function useUIState() {
  // -------------------------------------------------------------------------
  // DRAWER STATES (Independent for Buy Out and Chat)
  // -------------------------------------------------------------------------
  const [isBuyOutOpen, setIsBuyOutOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // -------------------------------------------------------------------------
  // MODAL STATES
  // -------------------------------------------------------------------------
  const [isFlexibilityModalOpen, setIsFlexibilityModalOpen] = useState(false);
  const [isBuyoutSettingsOpen, setIsBuyoutSettingsOpen] = useState(false);

  // -------------------------------------------------------------------------
  // DASHBOARD MODE STATE
  // -------------------------------------------------------------------------
  const [dashboardMode, setDashboardMode] = useState('date_changes'); // 'date_changes' | 'pricing_settings'

  // -------------------------------------------------------------------------
  // ACTIVE TRANSACTION STATE (for calendar -> history linking)
  // -------------------------------------------------------------------------
  const [activeTransactionId, setActiveTransactionId] = useState(null);

  // -------------------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------------------

  /**
   * Toggle Buy Out drawer
   */
  const handleToggleBuyOut = useCallback(() => {
    setIsBuyOutOpen(prev => !prev);
  }, []);

  /**
   * Open Buy Out drawer (used when night is selected)
   */
  const openBuyOut = useCallback(() => {
    setIsBuyOutOpen(true);
  }, []);

  /**
   * Close Buy Out drawer
   */
  const closeBuyOut = useCallback(() => {
    setIsBuyOutOpen(false);
  }, []);

  /**
   * Toggle Chat drawer
   */
  const handleToggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  /**
   * Open Flexibility Breakdown Modal
   */
  const handleOpenFlexibilityModal = useCallback(() => {
    setIsFlexibilityModalOpen(true);
  }, []);

  /**
   * Close Flexibility Breakdown Modal
   */
  const handleCloseFlexibilityModal = useCallback(() => {
    setIsFlexibilityModalOpen(false);
  }, []);

  /**
   * Toggle Buyout Settings drawer
   */
  const handleToggleBuyoutSettings = useCallback(() => {
    setIsBuyoutSettingsOpen(prev => !prev);
  }, []);

  /**
   * Switch dashboard mode between date_changes and pricing_settings
   */
  const handleSwitchMode = useCallback((mode) => {
    if (mode === 'date_changes' || mode === 'pricing_settings') {
      setDashboardMode(mode);
      // Scroll to top when switching modes
      setTimeout(() => window.scrollTo(0, 0), 0);
    }
  }, []);

  /**
   * Select a transaction (for highlighting in calendar/history)
   */
  const handleSelectTransaction = useCallback((transactionId) => {
    setActiveTransactionId(transactionId);
  }, []);

  /**
   * Clear active transaction selection
   */
  const handleClearActiveTransaction = useCallback(() => {
    setActiveTransactionId(null);
  }, []);

  // -------------------------------------------------------------------------
  // RETURN
  // -------------------------------------------------------------------------
  return {
    // Drawer States
    isBuyOutOpen,
    isChatOpen,
    isBuyoutSettingsOpen,

    // Modal States
    isFlexibilityModalOpen,

    // Dashboard Mode
    dashboardMode,

    // Active Transaction
    activeTransactionId,

    // Drawer Handlers
    handleToggleBuyOut,
    openBuyOut,
    closeBuyOut,
    handleToggleChat,

    // Modal Handlers
    handleOpenFlexibilityModal,
    handleCloseFlexibilityModal,
    handleToggleBuyoutSettings,

    // Mode Handlers
    handleSwitchMode,

    // Transaction Handlers
    handleSelectTransaction,
    handleClearActiveTransaction,

    // Direct setters (for cross-domain coordination)
    setIsBuyOutOpen,
    setActiveTransactionId,
  };
}
