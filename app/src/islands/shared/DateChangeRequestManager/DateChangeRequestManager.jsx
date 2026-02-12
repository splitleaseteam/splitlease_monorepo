/**
 * Date Change Request Manager - Main Component
 * Manages 5 different views for date change request workflows:
 * 1. Create Request - Select dates and request type (calendar view)
 * 2. Request Details - Set price/message and review fee breakdown
 * 3. Payment - Secure payment processing via Stripe
 * 4. Request Management - Accept/decline interface (receiver only)
 * 5. Success Message - Post-submission feedback
 *
 * Pattern 5: Fee Transparency Integration
 * - 1.5% split model (0.75% platform + 0.75% landlord)
 * - Transparent fee display with FeePriceDisplay component
 * - Secure payment via PaymentStep component
 */

import { useState, useEffect } from 'react';
import dateChangeRequestService from './dateChangeRequestService.js';
import DateChangeRequestCalendar from './DateChangeRequestCalendar.jsx';
import RequestTypeSelector from './RequestTypeSelector.jsx';
import RequestDetails from './RequestDetails.jsx';
import RequestManagement from './RequestManagement.jsx';
import ThrottlingWarning from './ThrottlingWarning.jsx';
import ThrottlingWarningPopup from './ThrottlingWarningPopup.jsx';
import ThrottlingBlockPopup from './ThrottlingBlockPopup.jsx';
import SuccessMessage from './SuccessMessage.jsx';
import './DateChangeRequestManager.css';
import UrgencyCountdown from '../UrgencyCountdown/components/UrgencyCountdown';
import '../UrgencyCountdown/styles/UrgencyCountdown.css';
import analyticsService from '../../../services/analyticsService';

// Pattern 5: Fee Transparency imports
import { useFeeCalculation } from '../../../logic/hooks/useFeeCalculation';
import FeePriceDisplay from '../FeePriceDisplay';
import PaymentStep from '../PaymentStep';

/**
 * ViewState type: 'create' | 'details' | 'payment' | 'manage' | 'success' | ''
 *
 * @param {Object} props
 * @param {Object} props.lease - Lease object containing booking info
 * @param {Object} props.currentUser - Current user object
 * @param {string} [props.initialView='create'] - Initial view state
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} [props.onSuccess] - Optional callback when operation succeeds
 * @param {Object} [props.requestToManage] - Specific request to manage (for manage view)
 * @param {number} [props.baseNightlyPrice] - Base nightly price for percentage calculations
 */
export default function DateChangeRequestManager({
  lease,
  currentUser,
  initialView = 'create',
  onClose,
  onSuccess,
  requestToManage = null,
  baseNightlyPrice = 150,
}) {
  // State management
  const [view, setView] = useState(initialView);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Request creation state
  const [requestType, setRequestType] = useState('adding'); // Default to 'adding'
  const [dateToAdd, setDateToAdd] = useState(null);
  const [dateToRemove, setDateToRemove] = useState(null);
  const [message, setMessage] = useState('');
  const [pricePercentage, setPricePercentage] = useState(100); // 50-150%
  const [selectedTier, setSelectedTier] = useState('recommended');

  // Roommate data
  const [roommateDates, setRoommateDates] = useState([]);
  const [isRequestTypeExpanded, setIsRequestTypeExpanded] = useState(false);

  // Throttling state
  const [throttleStatus, setThrottleStatus] = useState(null);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [showBlockPopup, setShowBlockPopup] = useState(false);
  const [otherParticipantName, setOtherParticipantName] = useState('');

  // Existing requests state
  const [existingRequests, setExistingRequests] = useState([]);

  // Pattern 5: Fee transparency state
  const [pendingRequestId, setPendingRequestId] = useState(null);

  // Get monthly rent for fee calculation (use lease's Total Rent or calculate from nightly)
  const monthlyRent = lease?.['Total Rent'] || (baseNightlyPrice * 30);

  // Pattern 5: Fee calculation hook
  const { feeBreakdown, isCalculating: isFeeCalculating, error: feeError } = useFeeCalculation(
    monthlyRent,
    'date_change'
  );

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Fetch throttle status, existing requests, and roommate dates on mount
  useEffect(() => {
    const userId = currentUser?.id;
    const leaseId = lease?.id;
    const listingId = lease?.Listing || lease?.listingId;

    if (userId && leaseId) {
      fetchThrottleStatus(userId);
      fetchExistingRequests(leaseId);
    }

    if (listingId && leaseId) {
      fetchRoommateDates(listingId, leaseId);
    }
  }, [currentUser, lease]);

  /**
   * Fetch roommate's booked dates
   */
  const fetchRoommateDates = async (listingId, currentLeaseId) => {
    const result = await dateChangeRequestService.getRoommateBookedDates(listingId, currentLeaseId);
    if (result.status === 'success') {
      setRoommateDates(result.data || []);
    }
  };

  /**
   * Fetch enhanced throttle status for current user on this lease
   */
  const fetchThrottleStatus = async (userId) => {
    const leaseId = lease?.id;
    if (!leaseId) return;

    const result = await dateChangeRequestService.getEnhancedThrottleStatus(leaseId, userId);
    if (result.status === 'success') {
      setThrottleStatus(result.data);
      setOtherParticipantName(result.data?.otherParticipantName || 'the other party');

      // If user is blocked, show the block popup immediately
      if (result.data?.isBlocked || result.data?.throttleLevel === 'hard_block') {
        setShowBlockPopup(true);
      }
    }
  };

  /**
   * Fetch existing date change requests for this lease
   */
  const fetchExistingRequests = async (leaseId) => {
    const result = await dateChangeRequestService.getAll(leaseId);
    if (result.status === 'success') {
      setExistingRequests(result.data || []);
    }
  };

  /**
   * Get user ID (handle different field names)
   */
  const getUserId = () => {
    return currentUser?.id || currentUser?.userId;
  };

  /**
   * Determine if current user is the host
   */
  const isHost = () => {
    const userId = getUserId();
    const hostId = lease?.hostId || lease?.['Host'];
    return userId === hostId;
  };

  /**
   * Get the receiver ID (opposite of requester)
   */
  const getReceiverId = () => {
    const hostId = lease?.hostId || lease?.['Host'];
    const guestId = lease?.guestId || lease?.['Guest'];
    return isHost() ? guestId : hostId;
  };

  /**
   * Calculate proposed price based on percentage
   */
  const calculateProposedPrice = () => {
    return (baseNightlyPrice * pricePercentage) / 100;
  };

  /**
   * Validate request before submission
   */
  const validateRequest = () => {
    if (!requestType) {
      return 'Please select a request type';
    }

    if (requestType === 'adding' && !dateToAdd) {
      return 'Please select a date to add';
    }

    if (requestType === 'removing' && !dateToRemove) {
      return 'Please select a date to remove';
    }

    if (requestType === 'swapping' && (!dateToAdd || !dateToRemove)) {
      return 'Please select both dates for swap';
    }

    if (throttleStatus?.isThrottled) {
      return 'You have reached the request limit. Please try again later.';
    }

    return null;
  };

  /**
   * Handle proceeding to details view
   * Checks throttle status and shows appropriate popup if needed
   */
  const handleProceedToDetails = () => {
    const validationError = validateRequest();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check throttle status before proceeding
    if (throttleStatus?.throttleLevel === 'hard_block' || throttleStatus?.isBlocked) {
      setShowBlockPopup(true);
      return;
    }

    // Show soft warning if at 5+ requests and user hasn't dismissed warnings
    if (throttleStatus?.showWarning) {
      setShowWarningPopup(true);
      return;
    }

    // No throttle issues, proceed to details
    setView('details');
  };

  /**
   * Handle continuing after soft warning popup
   * @param {boolean} dontShowAgain - Whether user checked "Don't show again"
   */
  const handleContinueAfterWarning = async (dontShowAgain) => {
    setShowWarningPopup(false);

    // Save preference if checkbox was checked
    if (dontShowAgain) {
      const userId = getUserId();
      const leaseId = lease?.id;
      if (userId && leaseId) {
        await dateChangeRequestService.updateWarningPreference(leaseId, userId, true);
      }
    }

    // Proceed to details view
    setView('details');
  };

  /**
   * Handle closing the warning popup (cancel)
   */
  const handleWarningCancel = () => {
    setShowWarningPopup(false);
  };

  /**
   * Handle closing the block popup
   */
  const handleBlockClose = () => {
    setShowBlockPopup(false);
    onClose(); // Close the entire modal since user is blocked
  };

  /**
   * Handle proceeding to payment (Pattern 5: Fee Transparency)
   * Creates request in pending state and moves to payment view
   */
  const handleProceedToPayment = async () => {
    const validationError = validateRequest();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create request in pending_payment status
      const result = await dateChangeRequestService.create({
        leaseId: lease.id,
        typeOfRequest: requestType,
        dateAdded: dateToAdd,
        dateRemoved: dateToRemove,
        message: message,
        priceRate: calculateProposedPrice(),
        percentageOfRegular: pricePercentage,
        requestedById: getUserId(),
        receiverId: getReceiverId(),
        status: 'pending_payment', // Pattern 5: New status for payment flow
        fee_breakdown: feeBreakdown, // Pattern 5: Store fee breakdown
      });

      if (result.status === 'success') {
        const requestId = result.data?.id;
        setPendingRequestId(requestId);

        // Track request creation (before payment)
        analyticsService.trackRequestSubmitted({
          id: requestId,
          selectedTier: selectedTier,
          feeBreakdown: feeBreakdown,
          transactionType: requestType,
          isBSBS: false,
          paymentStatus: 'pending'
        });

        // Move to payment view
        setView('payment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle payment success (Pattern 5: Fee Transparency)
   */
  const handlePaymentSuccess = async (paymentData) => {
    setSuccess('Payment successful! Request submitted.');

    // Track payment completion
    analyticsService.trackRequestSubmitted({
      id: pendingRequestId,
      selectedTier: selectedTier,
      feeBreakdown: feeBreakdown,
      transactionType: requestType,
      isBSBS: false,
      paymentStatus: 'completed',
      paymentIntentId: paymentData?.paymentIntentId
    });

    setView('success');
    if (onSuccess) {
      onSuccess({
        requestId: pendingRequestId,
        paymentData,
        feeBreakdown
      });
    }
  };

  /**
   * Handle payment error (Pattern 5: Fee Transparency)
   */
  const handlePaymentError = (err) => {
    setError(err?.message || 'Payment failed. Please try again.');
    // Stay on payment view so user can retry
  };

  /**
   * Handle going back from payment view
   */
  const handleBackFromPayment = () => {
    setView('details');
  };

  /**
   * Handle submitting a new date change request (legacy - for requests without payment)
   */
  const handleSubmitRequest = async () => {
    const validationError = validateRequest();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await dateChangeRequestService.create({
        leaseId: lease.id,
        typeOfRequest: requestType,
        dateAdded: dateToAdd,
        dateRemoved: dateToRemove,
        message: message,
        priceRate: calculateProposedPrice(),
        percentageOfRegular: pricePercentage,
        requestedById: getUserId(),
        receiverId: getReceiverId(),
        fee_breakdown: feeBreakdown, // Pattern 5: Include fee breakdown
      });

      if (result.status === 'success') {
        setSuccess('Request submitted successfully!');
        setView('success');

        // Track final submission
        analyticsService.trackRequestSubmitted({
          id: result.data?.id,
          selectedTier: selectedTier,
          feeBreakdown: feeBreakdown || { totalPrice: calculateProposedPrice() },
          transactionType: requestType,
          isBSBS: false
        });

        if (onSuccess) onSuccess(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle accepting a request (for receiver)
   */
  const handleAcceptRequest = async (responseMessage) => {
    if (!requestToManage) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await dateChangeRequestService.accept(
        requestToManage.id,
        responseMessage
      );

      if (result.status === 'success') {
        setSuccess('Request accepted!');
        setView('success');
        if (onSuccess) onSuccess(result.data);
      } else {
        throw new Error(result.message || 'Failed to accept request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept request');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle declining a request (for receiver)
   */
  const handleDeclineRequest = async (reason) => {
    if (!requestToManage) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await dateChangeRequestService.decline(
        requestToManage.id,
        reason
      );

      if (result.status === 'success') {
        setSuccess('Request declined');
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess(result.data);
        }, 1500);
      } else {
        throw new Error(result.message || 'Failed to decline request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline request');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle date selection from calendar
   */
  const handleDateSelect = (date, selectionType) => {
    if (selectionType === 'add') {
      setDateToAdd(date);
    } else if (selectionType === 'remove') {
      setDateToRemove(date);
    }
  };

  /**
   * Handle going back from details view
   */
  const handleBack = () => {
    if (view === 'details') {
      setView('create');
    }
  };

  /**
   * Reset form state
   */
  const resetForm = () => {
    setRequestType(null);
    setDateToAdd(null);
    setDateToRemove(null);
    setMessage('');
    setPricePercentage(100);
    setView('create');
  };

  /**
   * Handle success modal close
   */
  const handleSuccessClose = () => {
    onClose();
  };

  /**
   * Handle price updates from the urgency countdown component
   */
  const handleUrgencyPriceUpdate = (newPrice) => {
    if (baseNightlyPrice > 0) {
      const newPercentage = Math.round((newPrice / baseNightlyPrice) * 100);
      setPricePercentage(newPercentage);
    }
  };

  // Get booked dates from lease
  const bookedDates = lease?.bookedDates || lease?.['List of Booked Dates'] || [];
  const reservationStart = lease?.reservationStart || lease?.['Reservation Period : Start'];
  const reservationEnd = lease?.reservationEnd || lease?.['Reservation Period : End'];

  // Don't render if no view is set
  if (!view) {
    return null;
  }

  return (
    <div className="dcr-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dcr-container">
        {/* Close Button */}
        <button className="dcr-close-btn" onClick={onClose} aria-label="Close">
          &times;
        </button>

        {/* Global Error/Success Messages */}
        {error && <div className="dcr-error">{error}</div>}
        {success && <div className="dcr-success">{success}</div>}

        {/* Throttling Warning */}
        {throttleStatus && view !== 'success' && view !== 'manage' && (
          <ThrottlingWarning
            requestCount={throttleStatus.requestCount}
            limit={throttleStatus.limit}
            isThrottled={throttleStatus.isThrottled}
          />
        )}

        {/* Create Request View */}
        {view === 'create' && (
          <div className="dcr-create-container">
            <h2 className="dcr-title">
              {requestType === 'adding'
                ? 'Request Extra Nights'
                : requestType === 'removing'
                ? 'Offer a Night'
                : 'Swap Nights'}
            </h2>
            <p className="dcr-description">
              {requestType === 'adding'
                ? 'Select nights adjacent to your stay to request them from your roommate.'
                : requestType === 'removing'
                ? 'Select a night you want to offer back to your roommate.'
                : 'Select a night to give up and a night to receive.'}
            </p>

            {dateToAdd && requestType === 'adding' && (
              <UrgencyCountdown
                targetDate={dateToAdd}
                basePrice={baseNightlyPrice}
                urgencySteepness={2.0}
                variant="prominent"
                onUrgencyChange={() => {
                  /* A/B testing hook */
                }}
                onPriceUpdate={handleUrgencyPriceUpdate}
              />
            )}

            <DateChangeRequestCalendar
              bookedDates={bookedDates}
              roommateDates={roommateDates}
              reservationStart={reservationStart}
              reservationEnd={reservationEnd}
              requestType={requestType}
              dateToAdd={dateToAdd}
              dateToRemove={dateToRemove}
              onDateSelect={handleDateSelect}
              existingRequests={existingRequests}
              disabled={isLoading}
            />

            {/* Collapsible Request Type Selector */}
            <div className="dcr-secondary-actions">
              <button
                className="dcr-secondary-actions-toggle"
                onClick={() => setIsRequestTypeExpanded(!isRequestTypeExpanded)}
                aria-expanded={isRequestTypeExpanded}
              >
                {isRequestTypeExpanded ? '▲ Hide other options' : '▾ Offer or Swap a Night'}
              </button>

              {isRequestTypeExpanded && (
                <div className="dcr-secondary-options">
                  <RequestTypeSelector
                    selectedType={requestType}
                    onTypeSelect={(type) => {
                      setRequestType(type);
                      // Don't auto-collapse, let user explore
                    }}
                    disabled={isLoading}
                    variant="compact"
                  />
                </div>
              )}
            </div>

            <div className="dcr-button-group">
              <button
                className="dcr-button-primary"
                onClick={handleProceedToDetails}
                disabled={
                  isLoading ||
                  throttleStatus?.isBlocked ||
                  (requestType === 'adding' && !dateToAdd) ||
                  (requestType === 'removing' && !dateToRemove) ||
                  (requestType === 'swapping' && (!dateToAdd || !dateToRemove))
                }
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Request Details View */}
        {view === 'details' && (
          <RequestDetails
            requestType={requestType}
            dateToAdd={dateToAdd}
            dateToRemove={dateToRemove}
            message={message}
            onMessageChange={setMessage}
            pricePercentage={pricePercentage}
            onPriceChange={setPricePercentage}
            selectedTier={selectedTier}
            onTierChange={setSelectedTier}
            baseNightlyPrice={baseNightlyPrice}
            onBack={handleBack}
            onSubmit={handleProceedToPayment}
            isLoading={isLoading}
            feeBreakdown={feeBreakdown}
            isFeeCalculating={isFeeCalculating}
          />
        )}

        {/* Payment View - Pattern 5: Fee Transparency */}
        {view === 'payment' && feeBreakdown && (
          <div className="dcr-payment-container">
            <div className="dcr-details-header">
              <button className="dcr-back-btn" onClick={handleBackFromPayment} aria-label="Go back">
                ←
              </button>
              <h2 className="dcr-title">Complete Payment</h2>
            </div>

            {/* Fee Display Summary */}
            <FeePriceDisplay
              basePrice={monthlyRent}
              transactionType="date_change"
            />

            {/* Stripe Payment Form */}
            <PaymentStep
              feeBreakdown={feeBreakdown}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              onBack={handleBackFromPayment}
              transactionType="date_change"
              leaseId={lease?.id}
              userId={getUserId()}
              metadata={{
                requestId: pendingRequestId,
                requestType,
                dateToAdd: dateToAdd?.toISOString?.() || dateToAdd,
                dateToRemove: dateToRemove?.toISOString?.() || dateToRemove,
              }}
            />
          </div>
        )}

        {/* Request Management View (for receiver) */}
        {view === 'manage' && requestToManage && (
          <RequestManagement
            request={requestToManage}
            currentUser={currentUser}
            onAccept={handleAcceptRequest}
            onDecline={handleDeclineRequest}
            isLoading={isLoading}
          />
        )}

        {/* Success Message View */}
        {view === 'success' && (
          <SuccessMessage
            requestType={requestType}
            isAcceptance={initialView === 'manage'}
            onClose={handleSuccessClose}
          />
        )}
      </div>

      {/* Throttling Warning Popup (Soft Warning at 5+ requests) */}
      <ThrottlingWarningPopup
        isOpen={showWarningPopup}
        onClose={handleWarningCancel}
        onContinue={handleContinueAfterWarning}
        otherParticipantName={otherParticipantName}
      />

      {/* Throttling Block Popup (Hard Block at 10+ requests) */}
      <ThrottlingBlockPopup
        isOpen={showBlockPopup}
        onClose={handleBlockClose}
        otherParticipantName={otherParticipantName}
      />
    </div>
  );
}
