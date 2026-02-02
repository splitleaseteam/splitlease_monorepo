/**
 * Calendar State Hook for ScheduleDashboard
 * @module hooks/useCalendarState
 *
 * Manages night arrays, month navigation, and night selection state.
 * Extracted from useScheduleDashboardLogic.js for better separation of concerns.
 */

import { useState, useCallback } from 'react';

/**
 * Hook for managing calendar state in ScheduleDashboard
 * @returns {object} Calendar state and handlers
 */
export function useCalendarState() {
  // -------------------------------------------------------------------------
  // NIGHT ARRAYS (String arrays of date strings)
  // -------------------------------------------------------------------------
  const [userNights, setUserNights] = useState([]);
  const [roommateNights, setRoommateNights] = useState([]);
  const [pendingNights, setPendingNights] = useState([]);
  const [blockedNights, setBlockedNights] = useState([]);
  const [sharedNights, setSharedNights] = useState([]);

  // -------------------------------------------------------------------------
  // MONTH NAVIGATION STATE
  // -------------------------------------------------------------------------
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // -------------------------------------------------------------------------
  // NIGHT SELECTION STATE
  // -------------------------------------------------------------------------
  const [selectedNight, setSelectedNight] = useState(null);

  // -------------------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------------------

  /**
   * Change the currently displayed month
   * @param {Date} newMonth - The new month to display
   */
  const handleMonthChange = useCallback((newMonth) => {
    setCurrentMonth(newMonth);
  }, []);

  /**
   * Select a night (basic version, just sets the selected night)
   * @param {string} nightStr - The night string to select (e.g., "2024-01-15")
   */
  const handleSelectNight = useCallback((nightStr) => {
    setSelectedNight(nightStr);
  }, []);

  /**
   * Clear the current night selection
   */
  const clearSelection = useCallback(() => {
    setSelectedNight(null);
  }, []);

  // -------------------------------------------------------------------------
  // RETURN
  // -------------------------------------------------------------------------
  return {
    // Night Arrays
    userNights,
    roommateNights,
    pendingNights,
    blockedNights,
    sharedNights,

    // Month Navigation
    currentMonth,

    // Night Selection
    selectedNight,

    // Handlers
    handleMonthChange,
    handleSelectNight,
    clearSelection,

    // Direct setters (for cross-hook coordination)
    setUserNights,
    setRoommateNights,
    setPendingNights,
    setBlockedNights,
    setSharedNights,
    setCurrentMonth,
    setSelectedNight,
  };
}
