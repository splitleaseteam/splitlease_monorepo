/**
 * HeaderMessagingPanel Component
 *
 * Compact messaging dropdown panel for the header.
 * Follows the Hollow Component Pattern - delegates all logic to useHeaderMessagingPanelLogic.
 *
 * Features:
 * - Thread list view with contact info and last message preview
 * - Single thread view with message history and reply composer
 * - Real-time message updates via Supabase Realtime
 * - Typing indicators
 * - CTA button handling
 * - Click outside to close
 * - Escape key to close
 *
 * Reuses components from MessagingPage:
 * - ThreadCard (for thread list)
 * - MessageBubble (for messages)
 * - MessageInput (for reply composer)
 * - TypingIndicator (for typing state)
 */

import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useHeaderMessagingPanelLogic } from './useHeaderMessagingPanelLogic.js';
import ThreadCard from '../../pages/MessagingPage/components/ThreadCard.jsx';
import MessageBubble from '../../pages/MessagingPage/components/MessageBubble.jsx';
import MessageInput from '../../pages/MessagingPage/components/MessageInput.jsx';
import TypingIndicator from '../../pages/MessagingPage/components/TypingIndicator.jsx';
import CreateProposalFlow from '../CreateProposalFlow.jsx';
import './HeaderMessagingPanel.css';

/**
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the panel is open
 * @param {function} props.onClose - Callback to close the panel
 * @param {string} props.userId - User's ID
 * @param {string} props.userName - User's first name
 * @param {string} props.userAvatar - User's avatar URL
 * @param {function} [props.onUnreadCountChange] - Callback to refresh header unread count
 */
export default function HeaderMessagingPanel({
  isOpen,
  onClose,
  userId,
  userName,
  userAvatar,
  onUnreadCountChange,
}) {
  const panelRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Get all logic from the hook
  const {
    threads,
    selectedThread,
    messages,
    threadInfo,
    viewState,
    isLoading,
    isLoadingMessages,
    error,
    messageInput,
    isSending,
    isOtherUserTyping,
    typingUserName,
    // Modal state
    activeModal,
    proposalModalData,
    zatConfig,
    isSubmittingProposal,
    // Handlers
    handleThreadSelect,
    handleBackToList,
    handleMessageInputChange,
    handleSendMessage,
    handleRetry,
    handleCTAClick,
    getCTAButtonConfig,
    // Modal handlers
    handleCloseModal,
    handleProposalSubmit,
  } = useHeaderMessagingPanelLogic({
    isOpen,
    userId,
    userName,
    userAvatar,
    onClose,
    onUnreadCountChange,
  });

  // ============================================================================
  // CLICK OUTSIDE TO CLOSE
  // ============================================================================
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      // If a modal is active (like CreateProposalFlow), don't close the panel
      // This prevents edit button clicks inside the modal from closing everything
      if (activeModal) return;

      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Check if click is on the trigger button (messaging icon)
        if (e.target.closest('.header-messages-icon')) return;

        // CRITICAL: Check if click is inside the CreateProposalFlow modal
        // The modal is rendered outside the panel div but is logically part of this component
        // Use multiple selectors to catch all modal containers
        if (e.target.closest('.create-proposal-popup')) return;
        if (e.target.closest('.proposal-container')) return;

        onClose?.();
      }
    };

    // Delay to avoid closing from the click that opened it
    requestAnimationFrame(() => {
      document.addEventListener('click', handleClickOutside);
    });

    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen, onClose, activeModal]);

  // ============================================================================
  // ESCAPE KEY TO CLOSE
  // ============================================================================
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      // If a modal is active, let the modal handle its own escape key
      // Don't close the panel when user presses escape inside the modal
      if (activeModal) return;

      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, activeModal]);

  // ============================================================================
  // AUTO-SCROLL TO BOTTOM ON NEW MESSAGES
  // ============================================================================
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ============================================================================
  // DON'T RENDER IF NOT OPEN
  // ============================================================================
  if (!isOpen) return null;

  // ============================================================================
  // BUILD MESSAGE CONTEXT FOR CTA
  // ============================================================================
  const messageContext = {
    proposalId: threadInfo?.proposal_id,
    listingId: threadInfo?.listing_id,
    leaseId: threadInfo?.lease_id,
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <>
    <div
      className="header-messaging-panel"
      ref={panelRef}
      role="dialog"
      aria-label="Messages"
      aria-modal="true"
      onClick={(e) => {
        // Stop propagation to prevent parent handlers from interfering
        // This ensures clicks inside the panel don't trigger outside-click handlers
        e.stopPropagation();
      }}
    >
      {/* Header */}
      <div className="header-messaging-panel__header">
        {viewState === 'thread' && selectedThread ? (
          <>
            <button
              className="header-messaging-panel__back"
              onClick={handleBackToList}
              aria-label="Back to thread list"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="header-messaging-panel__contact">
              <img
                src={selectedThread.contact_avatar || '/assets/images/default-avatar.jpg'}
                alt=""
                className="header-messaging-panel__contact-avatar"
                onError={(e) => {
                  e.target.src = '/assets/images/default-avatar.jpg';
                }}
              />
              <div className="header-messaging-panel__contact-info">
                <span className="header-messaging-panel__contact-name">
                  {selectedThread.contact_name}
                </span>
                {selectedThread.property_name && (
                  <span className="header-messaging-panel__property">
                    {selectedThread.property_name}
                  </span>
                )}
              </div>
            </div>
          </>
        ) : (
          <h2 className="header-messaging-panel__title">Messages</h2>
        )}
        <button
          className="header-messaging-panel__close"
          onClick={onClose}
          aria-label="Close messages"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="header-messaging-panel__content">
        {/* Error State */}
        {error && (
          <div className="header-messaging-panel__error">
            <p>{error}</p>
            <button onClick={handleRetry}>Try Again</button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !error && (
          <div className="header-messaging-panel__loading">
            <div className="header-messaging-panel__spinner" />
            <p>Loading conversations...</p>
          </div>
        )}

        {/* Thread List View */}
        {!isLoading && !error && viewState === 'list' && (
          <div className="header-messaging-panel__thread-list">
            {threads.length === 0 ? (
              <div className="header-messaging-panel__empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p>No messages yet</p>
                <span>Start a conversation by contacting a host or guest</span>
              </div>
            ) : (
              threads.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  isSelected={false}
                  onClick={() => handleThreadSelect(thread)}
                />
              ))
            )}
          </div>
        )}

        {/* Single Thread View */}
        {!isLoading && !error && viewState === 'thread' && selectedThread && (
          <>
            {/* Messages */}
            <div className="header-messaging-panel__messages">
              {isLoadingMessages ? (
                <div className="header-messaging-panel__loading-messages">
                  <div className="header-messaging-panel__spinner" />
                </div>
              ) : messages.length === 0 ? (
                <div className="header-messaging-panel__no-messages">
                  <p>No messages in this conversation</p>
                  <span>Send a message to start the conversation</span>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      onCTAClick={handleCTAClick}
                      getCTAButtonConfig={getCTAButtonConfig}
                      messageContext={messageContext}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}

              {/* Typing Indicator */}
              {isOtherUserTyping && (
                <TypingIndicator userName={typingUserName} />
              )}
            </div>

            {/* Message Input */}
            <div className="header-messaging-panel__input">
              <MessageInput
                value={messageInput}
                onChange={handleMessageInputChange}
                onSend={handleSendMessage}
                disabled={isLoadingMessages}
                isSending={isSending}
              />
            </div>
          </>
        )}
      </div>

      {/* Footer Link to Full Page */}
      <div className="header-messaging-panel__footer">
        <a href="/messages" className="header-messaging-panel__view-all">
          View all messages
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>

    </div>

    {/* Create Proposal Modal - Rendered via Portal at document.body level
        This completely removes it from the header DOM hierarchy to prevent:
        1. Overflow issues from parent containers
        2. Click event propagation conflicts with panel's outside-click handler */}
    {activeModal === 'CreateProposalFlow' && proposalModalData && createPortal(
      <CreateProposalFlow
        listing={proposalModalData.listing}
        moveInDate={proposalModalData.moveInDate}
        daysSelected={proposalModalData.daysSelected}
        nightsSelected={proposalModalData.nightsSelected}
        reservationSpan={proposalModalData.reservationSpan}
        pricingBreakdown={proposalModalData.priceBreakdown}
        zatConfig={zatConfig}
        isFirstProposal={true}
        useFullFlow={true}
        onClose={handleCloseModal}
        onSubmit={handleProposalSubmit}
        isSubmitting={isSubmittingProposal}
      />,
      document.body
    )}
    </>
  );
}
