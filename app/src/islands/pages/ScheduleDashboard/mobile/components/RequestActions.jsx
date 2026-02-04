/**
 * RequestActions Component
 *
 * Accept/Decline/Counter action buttons for request messages.
 */

import React, { useState, useCallback } from 'react';

/**
 * Action buttons for request messages
 * @param {Object} props
 * @param {string} props.requestId - ID of the request
 * @param {function} props.onAccept - Callback when Accept is clicked
 * @param {function} props.onDecline - Callback when Decline is clicked
 * @param {function} props.onCounter - Callback when Counter is clicked
 */
export default function RequestActions({
  requestId,
  onAccept,
  onDecline,
  onCounter
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState(null);

  const handleAction = useCallback(async (action, handler) => {
    if (isProcessing || !handler) return;

    setIsProcessing(true);
    setProcessingAction(action);

    try {
      await handler(requestId);
    } catch (error) {
      console.error(`Failed to ${action} request:`, error);
    } finally {
      setIsProcessing(false);
      setProcessingAction(null);
    }
  }, [isProcessing, requestId]);

  return (
    <div className="request-actions">
      <button
        className="request-actions__btn request-actions__btn--accept"
        onClick={() => handleAction('accept', onAccept)}
        disabled={isProcessing}
        aria-label="Accept request"
      >
        {processingAction === 'accept' ? (
          <span className="request-actions__spinner" />
        ) : (
          'Accept'
        )}
      </button>
      <button
        className="request-actions__btn request-actions__btn--counter"
        onClick={() => handleAction('counter', onCounter)}
        disabled={isProcessing}
        aria-label="Counter offer"
      >
        {processingAction === 'counter' ? (
          <span className="request-actions__spinner" />
        ) : (
          'Counter'
        )}
      </button>
      <button
        className="request-actions__btn request-actions__btn--decline"
        onClick={() => handleAction('decline', onDecline)}
        disabled={isProcessing}
        aria-label="Decline request"
      >
        {processingAction === 'decline' ? (
          <span className="request-actions__spinner" />
        ) : (
          'Decline'
        )}
      </button>
    </div>
  );
}
