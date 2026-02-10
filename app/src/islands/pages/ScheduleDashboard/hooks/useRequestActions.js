import { useCallback } from 'react';
import { calculatePaymentBreakdown } from '../../../../logic/calculators/feeCalculations.js';

/**
 * @param {Object} params
 * @param {Object} params.scheduleState - Schedule state with nights/actions.
 * @param {Object} params.request - Request flow state/actions.
 * @param {string} params.currentUserId - Current user id.
 * @param {Object} params.coTenant - Co-tenant data.
 * @param {Object} [params.roommate] - @deprecated Use coTenant instead.
 * @param {number|null} params.basePrice - Base price for selected night.
 * @param {string|null} params.selectedNight - Selected night string.
 * @param {Function} params.setSelectedNight - Setter for selected night.
 * @param {Function} params.isNightLocked - Returns true if night is locked.
 * @param {Function} params.setCounterRequestData - Setter for counter request data.
 */
export function useRequestActions({
  scheduleState,
  request,
  currentUserId,
  coTenant,
  roommate, // @deprecated - use coTenant
  basePrice,
  selectedNight,
  setSelectedNight,
  isNightLocked,
  setCounterRequestData
}) {
  // Support both new and deprecated param names
  const resolvedCoTenant = coTenant || roommate;
  /**
   * Handle buy out request.
   * @param {number} totalPrice - Total price including fees.
   * @param {number} baseAmountOverride - Optional base price override.
   */
  const handleBuyOut = useCallback(async (totalPrice, baseAmountOverride) => {
    if (!selectedNight || request.isSubmitting) return;

    if (!scheduleState.roommateNights.includes(selectedNight)) {
      throw new Error("You don't own this night.");
    }

    if (isNightLocked(selectedNight)) {
      throw new Error('This night is part of another pending request.');
    }

    try {
      request.setIsSubmitting(true);

      const nightDate = new Date(selectedNight + 'T12:00:00');
      const formattedNightDate = nightDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const finalAmount = totalPrice || basePrice || 0;
      const baseAmount = Number.isFinite(baseAmountOverride) ? baseAmountOverride : (basePrice || finalAmount || 0);
      const paymentBreakdown = calculatePaymentBreakdown('full_week', baseAmount || 0);

      const newTransaction = {
        id: `txn-${Date.now()}`,
        date: new Date(),
        type: 'full_week',
        nights: [nightDate],
        amount: finalAmount,
        payerId: currentUserId,
        payeeId: resolvedCoTenant?._id,
        status: 'pending'
      };

      const requestMessage = {
        id: `msg-${Date.now()}`,
        senderId: currentUserId,
        text: `Requested to buy out ${formattedNightDate}`,
        timestamp: new Date(),
        type: 'request',
        status: 'pending',
        requestData: {
          type: 'full_week',
          nights: [nightDate],
          amount: paymentBreakdown.requestorPays || finalAmount,
          offeredPrice: baseAmount,
          suggestedPrice: basePrice || 0,
          requestorPays: paymentBreakdown.requestorPays,
          recipientReceives: paymentBreakdown.recipientReceives,
          baseAmount,
          transactionId: newTransaction.id
        }
      };

      scheduleState.actions.createTransactionRequest({
        transaction: newTransaction,
        requestMessage,
        pendingNights: [selectedNight]
      });

      setSelectedNight(null);
      return true;
    } catch (err) {
      console.error('Failed to create buyout request:', err);
      throw err;
    } finally {
      request.setIsSubmitting(false);
    }
  }, [
    selectedNight,
    request.isSubmitting,
    scheduleState.roommateNights,
    scheduleState.actions,
    isNightLocked,
    currentUserId,
    resolvedCoTenant,
    basePrice,
    request,
    setSelectedNight
  ]);

  /**
   * Handle share request - request to co-occupy a night with co-tenant.
   * @param {number} totalPrice - Total price including fees.
   */
  const handleShareRequest = useCallback(async (totalPrice) => {
    if (!selectedNight || request.isSubmitting) return;

    if (!scheduleState.roommateNights.includes(selectedNight)) {
      throw new Error("You don't own this night.");
    }

    if (isNightLocked(selectedNight)) {
      throw new Error('This night is part of another pending request.');
    }

    try {
      request.setIsSubmitting(true);

      const nightDate = new Date(selectedNight + 'T12:00:00');
      const formattedNightDate = nightDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const finalAmount = totalPrice || basePrice || 0;
      const baseAmount = basePrice || finalAmount || 0;
      const paymentBreakdown = calculatePaymentBreakdown('share', baseAmount || 0);

      const newTransaction = {
        id: `txn-${Date.now()}`,
        date: new Date(),
        type: 'share',
        nights: [nightDate],
        amount: finalAmount,
        payerId: currentUserId,
        payeeId: resolvedCoTenant?._id,
        status: 'pending'
      };

      const requestMessage = {
        id: `msg-${Date.now()}`,
        senderId: currentUserId,
        text: `Requested to share ${formattedNightDate}`,
        timestamp: new Date(),
        type: 'request',
        status: 'pending',
        requestData: {
          type: 'share',
          nights: [nightDate],
          amount: paymentBreakdown.requestorPays || finalAmount,
          offeredPrice: baseAmount,
          suggestedPrice: basePrice || 0,
          requestorPays: paymentBreakdown.requestorPays,
          recipientReceives: paymentBreakdown.recipientReceives,
          baseAmount,
          transactionId: newTransaction.id
        }
      };

      scheduleState.actions.createTransactionRequest({
        transaction: newTransaction,
        requestMessage,
        pendingNights: [selectedNight]
      });

      setSelectedNight(null);
      return true;
    } catch (err) {
      console.error('Failed to create share request:', err);
      throw err;
    } finally {
      request.setIsSubmitting(false);
    }
  }, [
    selectedNight,
    request.isSubmitting,
    scheduleState.roommateNights,
    scheduleState.actions,
    isNightLocked,
    currentUserId,
    resolvedCoTenant,
    basePrice,
    request,
    setSelectedNight
  ]);

  /**
   * Handle request type change.
   * @param {string} newType - 'full_week' | 'share' | 'alternating'
   */
  const handleRequestTypeChange = useCallback((newType) => {
    if (newType === 'alternating' && !selectedNight) return;
    request.setRequestType(newType);
    if (newType === 'alternating') {
      request.setIsSwapMode(true);
      request.setSwapOfferNight(null);
    }
  }, [request, selectedNight]);

  const handleSwapInstead = useCallback(() => {
    if (!selectedNight) return;
    request.setIsSwapMode(true);
    request.setIsCounterMode(false);
    console.log('Entering swap mode for:', selectedNight);
  }, [selectedNight, request]);

  /**
   * Handle selecting a night to offer in swap.
   */
  const handleSelectSwapOffer = useCallback((nightString) => {
    if (scheduleState.userNights.includes(nightString) && !scheduleState.pendingNights.includes(nightString)) {
      if (isNightLocked(nightString)) {
        throw new Error('This night is part of another pending request.');
      }
      request.setSwapOfferNight(nightString);
    }
  }, [scheduleState.userNights, scheduleState.pendingNights, isNightLocked, request]);

  const handleSelectCounterNight = useCallback((nightString) => {
    if (scheduleState.roommateNights.includes(nightString) && !scheduleState.pendingNights.includes(nightString)) {
      request.setCounterTargetNight(nightString);
    }
  }, [scheduleState.roommateNights, scheduleState.pendingNights, request]);

  /**
   * Handle submitting a swap request.
   */
  const handleSubmitSwapRequest = useCallback(async () => {
    if (!selectedNight || !request.swapOfferNight || request.isSubmitting) return;

    if (!scheduleState.roommateNights.includes(selectedNight)) {
      throw new Error("You don't own this night.");
    }

    if (!scheduleState.userNights.includes(request.swapOfferNight)) {
      throw new Error("You don't own this night.");
    }

    if (isNightLocked(selectedNight) || isNightLocked(request.swapOfferNight)) {
      throw new Error('This night is part of another pending request.');
    }

    try {
      request.setIsSubmitting(true);

      const requestedDate = new Date(selectedNight + 'T12:00:00');
      const offeredDate = new Date(request.swapOfferNight + 'T12:00:00');

      const formattedRequested = requestedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const formattedOffered = offeredDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      const newTransaction = {
        id: `txn-${Date.now()}`,
        date: new Date(),
        type: 'alternating',
        nights: [requestedDate, offeredDate],
        amount: 0,
        payerId: currentUserId,
        payeeId: resolvedCoTenant?._id,
        status: 'pending'
      };

      const requestMessage = {
        id: `msg-${Date.now()}`,
        senderId: currentUserId,
        text: `Offered to swap ${formattedOffered} for ${formattedRequested}`,
        timestamp: new Date(),
        type: 'request',
        status: 'pending',
        requestData: {
          type: 'alternating',
          nights: [requestedDate, offeredDate],
          transactionId: newTransaction.id
        }
      };

      scheduleState.actions.createTransactionRequest({
        transaction: newTransaction,
        requestMessage,
        pendingNights: [selectedNight, request.swapOfferNight]
      });

      setSelectedNight(null);
      request.setSwapOfferNight(null);
      request.setIsSwapMode(false);

      return true;
    } catch (err) {
      console.error('Failed to create swap request:', err);
      throw err;
    } finally {
      request.setIsSubmitting(false);
    }
  }, [
    selectedNight,
    request.swapOfferNight,
    request.isSubmitting,
    scheduleState.roommateNights,
    scheduleState.userNights,
    scheduleState.actions,
    isNightLocked,
    currentUserId,
    resolvedCoTenant,
    request,
    setSelectedNight
  ]);

  /**
   * Handle canceling swap mode - return to buyout mode.
   */
  const handleCancelSwapMode = useCallback(() => {
    request.setIsSwapMode(false);
    request.setSwapOfferNight(null);
  }, [request]);

  const handleCancelCounterMode = useCallback(() => {
    request.setIsCounterMode(false);
    request.setCounteringRequestId(null);
    request.setCounterOriginalNight(null);
    request.setCounterTargetNight(null);
    request.setCounterType(null);
    request.setCounterPrice(null);
    setCounterRequestData(null);
  }, [request, setCounterRequestData]);

  /**
   * Handle cancel selection.
   */
  const handleCancel = useCallback(() => {
    setSelectedNight(null);
    request.setSwapOfferNight(null);
    request.setIsSwapMode(false);
    request.setIsCounterMode(false);
    request.setCounteringRequestId(null);
    request.setCounterOriginalNight(null);
    request.setCounterTargetNight(null);
    request.setCounterType(null);
    request.setCounterPrice(null);
    setCounterRequestData(null);
  }, [request, setSelectedNight, setCounterRequestData]);

  return {
    handleBuyOut,
    handleShareRequest,
    handleRequestTypeChange,
    handleSwapInstead,
    handleSelectSwapOffer,
    handleSelectCounterNight,
    handleSubmitSwapRequest,
    handleCancelSwapMode,
    handleCancelCounterMode,
    handleCancel
  };
}
