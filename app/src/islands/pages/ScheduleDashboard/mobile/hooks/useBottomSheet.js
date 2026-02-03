/**
 * useBottomSheet Hook
 *
 * Manages bottom sheet state including open/close and sheet type.
 * Provides callbacks for opening specific sheet types.
 */

import { useState, useCallback } from 'react';

/**
 * Hook for managing bottom sheet state
 * @param {boolean} [initialOpen=false] - Initial open state
 * @returns {Object} Sheet state and control functions
 */
export function useBottomSheet(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [sheetType, setSheetType] = useState(null);
  const [sheetData, setSheetData] = useState(null);

  /**
   * Open the sheet with a specific type and optional data
   * @param {string} type - The type of sheet to open
   * @param {*} [data] - Optional data to pass to the sheet
   */
  const openSheet = useCallback((type, data = null) => {
    setSheetType(type);
    setSheetData(data);
    setIsOpen(true);
  }, []);

  /**
   * Close the sheet with animation delay for cleanup
   */
  const closeSheet = useCallback(() => {
    setIsOpen(false);
    // Delay clearing type/data for exit animation
    setTimeout(() => {
      setSheetType(null);
      setSheetData(null);
    }, 300);
  }, []);

  /**
   * Toggle sheet open/closed
   * @param {string} [type] - Optional type when opening
   * @param {*} [data] - Optional data when opening
   */
  const toggleSheet = useCallback((type, data) => {
    if (isOpen) {
      closeSheet();
    } else {
      openSheet(type, data);
    }
  }, [isOpen, openSheet, closeSheet]);

  return {
    isOpen,
    sheetType,
    sheetData,
    openSheet,
    closeSheet,
    toggleSheet
  };
}
