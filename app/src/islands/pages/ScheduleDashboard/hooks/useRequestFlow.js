/**
 * Request Flow Hook for ScheduleDashboard
 * @module hooks/useRequestFlow
 *
 * Manages request type state, swap mode, counter offer mode, and submission state.
 * Extracted from useScheduleDashboardLogic.js for better separation of concerns.
 */

import { useState, useCallback } from 'react';

/**
 * Hook for managing request flow state in ScheduleDashboard
 * @returns {object} Request flow state and handlers
 */
export function useRequestFlow() {
  // -------------------------------------------------------------------------
  // REQUEST TYPE STATE
  // -------------------------------------------------------------------------
  const [requestType, setRequestType] = useState('full_week'); // 'full_week' | 'share' | 'alternating'
  const [defaultRequestType, setDefaultRequestType] = useState('full_week'); // 'full_week' | 'share'

  // -------------------------------------------------------------------------
  // SWAP MODE STATE
  // -------------------------------------------------------------------------
  const [isSwapMode, setIsSwapMode] = useState(false);
  const [swapOfferNight, setSwapOfferNight] = useState(null); // string or null - user's night to offer

  // -------------------------------------------------------------------------
  // COUNTER OFFER MODE STATE
  // -------------------------------------------------------------------------
  const [isCounterMode, setIsCounterMode] = useState(false);
  const [counteringRequestId, setCounteringRequestId] = useState(null); // string or null
  const [counterOriginalNight, setCounterOriginalNight] = useState(null); // string or null
  const [counterTargetNight, setCounterTargetNight] = useState(null); // string or null

  // -------------------------------------------------------------------------
  // SUBMISSION STATE
  // -------------------------------------------------------------------------
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------------------

  /**
   * Change the request type if valid
   * @param {string} type - The request type ('full_week', 'share', or 'alternating')
   */
  const handleRequestTypeChange = useCallback((type) => {
    if (type === 'full_week' || type === 'share' || type === 'alternating') {
      setRequestType(type);
    }
  }, []);

  /**
   * Enter swap mode - sets isSwapMode to true and requestType to 'alternating'
   */
  const handleSwapInstead = useCallback(() => {
    setIsSwapMode(true);
    setRequestType('alternating');
  }, []);

  /**
   * Cancel swap mode - resets swap-related state and returns to default request type
   */
  const handleCancelSwapMode = useCallback(() => {
    setIsSwapMode(false);
    setSwapOfferNight(null);
    setRequestType(defaultRequestType);
  }, [defaultRequestType]);

  /**
   * Select a night to offer in swap mode
   * @param {string} nightStr - The night string to offer for swap
   */
  const handleSelectSwapOffer = useCallback((nightStr) => {
    setSwapOfferNight(nightStr);
  }, []);

  /**
   * Enter counter offer mode for a specific request
   * @param {string} requestId - The ID of the request being countered
   * @param {string} originalNight - The original night from the request
   */
  const enterCounterMode = useCallback((requestId, originalNight) => {
    setIsCounterMode(true);
    setCounteringRequestId(requestId);
    setCounterOriginalNight(originalNight);
  }, []);

  /**
   * Select a target night for the counter offer
   * @param {string} nightStr - The night string to counter with
   */
  const handleSelectCounterNight = useCallback((nightStr) => {
    setCounterTargetNight(nightStr);
  }, []);

  /**
   * Cancel counter offer mode - resets all counter-related state
   */
  const handleCancelCounterMode = useCallback(() => {
    setIsCounterMode(false);
    setCounteringRequestId(null);
    setCounterOriginalNight(null);
    setCounterTargetNight(null);
  }, []);

  /**
   * Reset all request flow state to initial values
   */
  const resetRequestFlow = useCallback(() => {
    setRequestType('full_week');
    setDefaultRequestType('full_week');
    setIsSwapMode(false);
    setSwapOfferNight(null);
    setIsCounterMode(false);
    setCounteringRequestId(null);
    setCounterOriginalNight(null);
    setCounterTargetNight(null);
    setIsSubmitting(false);
  }, []);

  // -------------------------------------------------------------------------
  // RETURN
  // -------------------------------------------------------------------------
  return {
    // Request Type State
    requestType,
    defaultRequestType,

    // Swap Mode State
    isSwapMode,
    swapOfferNight,

    // Counter Mode State
    isCounterMode,
    counteringRequestId,
    counterOriginalNight,
    counterTargetNight,

    // Submission State
    isSubmitting,

    // Request Type Handlers
    handleRequestTypeChange,

    // Swap Mode Handlers
    handleSwapInstead,
    handleCancelSwapMode,
    handleSelectSwapOffer,

    // Counter Mode Handlers
    enterCounterMode,
    handleSelectCounterNight,
    handleCancelCounterMode,

    // Reset Handler
    resetRequestFlow,

    // Direct setters (for cross-hook coordination)
    setRequestType,
    setDefaultRequestType,
    setIsSwapMode,
    setSwapOfferNight,
    setIsCounterMode,
    setCounteringRequestId,
    setCounterOriginalNight,
    setCounterTargetNight,
    setIsSubmitting,
  };
}
