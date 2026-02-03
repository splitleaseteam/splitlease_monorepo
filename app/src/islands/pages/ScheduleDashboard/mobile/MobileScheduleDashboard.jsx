/**
 * MobileScheduleDashboard - Mobile Entry Point
 *
 * Mobile-first dashboard for managing lease schedules.
 * Uses the same useScheduleDashboardLogic hook as desktop.
 * Tab-based navigation with bottom nav bar.
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │  MobileHeader (compact)         │
 * ├─────────────────────────────────┤
 * │                                 │
 * │  Content Area (based on tab)   │
 * │  - Calendar: Schedule view      │
 * │  - Chat: Messaging thread       │
 * │  - History: Transactions        │
 * │  - Settings: Pricing config     │
 * │                                 │
 * ├─────────────────────────────────┤
 * │  BottomNav (fixed)              │
 * └─────────────────────────────────┘
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useScheduleDashboardLogic } from '../useScheduleDashboardLogic.js';
import { MobileHeader } from './components/MobileHeader.jsx';
import { BottomNav } from './components/BottomNav.jsx';
import MobileCalendar from './components/MobileCalendar.jsx';
import { format } from 'date-fns';
import MobileChatView from './components/MobileChatView.jsx';
import MobileTransactionList from './components/MobileTransactionList.jsx';
import MobileSettingsView from './components/MobileSettingsView.jsx';
import BottomSheet from './components/BottomSheet.jsx';
import BuyOutSheet from './components/sheets/BuyOutSheet.jsx';
import ShareSheet from './components/sheets/ShareSheet.jsx';
import SwapSheet from './components/sheets/SwapSheet.jsx';
import { useBottomSheet } from './hooks/useBottomSheet.js';
import Toast, { useToast } from '../../../shared/Toast.jsx';

// ============================================================================
// LOADING STATE
// ============================================================================

function MobileLoadingState() {
  return (
    <div className="mobile-loading" role="status" aria-live="polite">
      <div className="mobile-loading__spinner" aria-hidden="true"></div>
      <p>Loading schedule...</p>
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

function MobileErrorState({ error, onRetry }) {
  return (
    <div className="mobile-error" role="alert">
      <div className="mobile-error__icon" aria-hidden="true">!</div>
      <h2>Something went wrong</h2>
      <p className="mobile-error__message">{error}</p>
      <button className="mobile-error__retry" onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}

// ============================================================================
// CALENDAR VIEW (Phase 2)
// ============================================================================

function CalendarView({
  userNights,
  roommateNights,
  pendingNights,
  priceOverlays,
  selectedDay,
  roommateName,
  onSelectDay,
  onCloseDay,
  onAction
}) {
  return (
    <div className="mobile-view mobile-view--calendar">
      <MobileCalendar
        userNights={userNights}
        roommateNights={roommateNights}
        pendingNights={pendingNights}
        priceOverlays={priceOverlays}
        selectedDay={selectedDay}
        roommateName={roommateName}
        onSelectDay={onSelectDay}
        onCloseDay={onCloseDay}
        onAction={onAction}
      />
    </div>
  );
}

// ============================================================================
// CHAT VIEW (Phase 4)
// ============================================================================

function ChatView({
  messages,
  currentUserId,
  roommate,
  onSend,
  onAccept,
  onDecline,
  onCounter
}) {
  return (
    <div className="mobile-view mobile-view--chat">
      <MobileChatView
        messages={messages}
        currentUserId={currentUserId}
        roommate={roommate}
        onSendMessage={onSend}
        onAccept={onAccept}
        onDecline={onDecline}
        onCounter={onCounter}
      />
    </div>
  );
}

// ============================================================================
// HISTORY VIEW (Phase 5)
// ============================================================================

function HistoryView({ transactions, currentUserId, onAccept, onDecline, onCancel }) {
  return (
    <div className="mobile-view mobile-view--history">
      <MobileTransactionList
        transactions={transactions}
        currentUserId={currentUserId}
        onAccept={onAccept}
        onDecline={onDecline}
        onCancel={onCancel}
      />
    </div>
  );
}

// ============================================================================
// SETTINGS VIEW (Phase 6)
// ============================================================================

function SettingsView({
  pricingSettings,
  sharingWillingness,
  onSavePricing,
  onSaveSharing
}) {
  return (
    <div className="mobile-view mobile-view--settings">
      <MobileSettingsView
        pricingSettings={pricingSettings}
        sharingWillingness={sharingWillingness}
        onSavePricing={onSavePricing}
        onSaveSharing={onSaveSharing}
      />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MobileScheduleDashboard() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedDay, setSelectedDay] = useState(null);
  const sheet = useBottomSheet(false);
  const { toasts, showToast, removeToast } = useToast();

  const {
    // Loading & Error
    isLoading,
    error,

    // Core Data
    lease,
    roommate,
    currentUserId,

    // Calendar Data
    userNights,
    roommateNights,
    pendingNights,
    selectedNight,
    priceOverlays,
    basePrice,
    swapOfferNight,

    // Chat Data
    messages,

    // Transactions
    transactions,

    // Pricing Strategy
    pricingStrategy,

    // Handlers
    handleRefresh,
    handleSelectNight,
    handleSendMessage,
    handleBuyOut,
    handleShareRequest,
    handleSelectSwapOffer,
    handleSubmitSwapRequest,
    handleSwapInstead,
    handleCancelSwapMode,
    handleAcceptRequest,
    handleDeclineRequest,
    handleCounterRequest,
    handleCancelRequest,
    handleSavePricingStrategy,
    isSubmitting
  } = useScheduleDashboardLogic();

  const sheetDate = sheet.sheetData?.date || null;
  const sheetDateStr = sheetDate ? format(sheetDate, 'yyyy-MM-dd') : null;

  const handleCalendarAction = (action, date) => {
    if (!date) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    if (action === 'buyout' || action === 'share' || action === 'swap') {
      handleSelectNight(dateStr);
      if (action === 'swap') {
        handleSwapInstead();
      }
      sheet.openSheet(action, { date });
    } else if (action === 'view') {
      setActiveTab('transactions');
    }
  };

  // -------------------------------------------------------------------------
  // SETTINGS DATA TRANSFORMATION
  // -------------------------------------------------------------------------

  // Convert pricingStrategy to format expected by MobileSettingsView
  const pricingSettings = useMemo(() => ({
    basePrice: pricingStrategy?.baseRate || 100,
    shortNoticeMultiplier: pricingStrategy?.noticeMultipliers?.short || 1.5,
    soonMultiplier: pricingStrategy?.noticeMultipliers?.soon || 1.25
  }), [pricingStrategy]);

  // Convert sharingWillingness string to percentage (0-100)
  const sharingWillingness = useMemo(() => {
    const mapping = {
      'never': 0,
      'rarely': 20,
      'sometimes': 40,
      'standard': 50,
      'often': 70,
      'always': 100
    };
    return mapping[pricingStrategy?.sharingWillingness] ?? 50;
  }, [pricingStrategy]);

  // Handler to save pricing settings (converts back to hook format)
  const handleSavePricing = useCallback((settings) => {
    handleSavePricingStrategy?.({
      ...pricingStrategy,
      baseRate: settings.basePrice,
      noticeMultipliers: {
        ...pricingStrategy?.noticeMultipliers,
        short: settings.shortNoticeMultiplier,
        soon: settings.soonMultiplier
      }
    });
  }, [pricingStrategy, handleSavePricingStrategy]);

  // Handler to save sharing willingness (converts percentage back to string)
  const handleSaveSharing = useCallback((percentage) => {
    let willingness = 'standard';
    if (percentage <= 10) willingness = 'never';
    else if (percentage <= 30) willingness = 'rarely';
    else if (percentage <= 45) willingness = 'sometimes';
    else if (percentage <= 60) willingness = 'standard';
    else if (percentage <= 80) willingness = 'often';
    else willingness = 'always';

    handleSavePricingStrategy?.({
      ...pricingStrategy,
      sharingWillingness: willingness
    });
  }, [pricingStrategy, handleSavePricingStrategy]);

  // -------------------------------------------------------------------------
  // TAB CONTENT RENDERER
  // -------------------------------------------------------------------------

  function renderContent() {
    switch (activeTab) {
      case 'calendar':
        return (
          <CalendarView
            userNights={userNights}
            roommateNights={roommateNights}
            pendingNights={pendingNights}
            priceOverlays={priceOverlays}
            selectedDay={selectedDay}
            roommateName={roommate?.firstName || 'Roommate'}
            onSelectDay={setSelectedDay}
            onCloseDay={() => setSelectedDay(null)}
            onAction={handleCalendarAction}
          />
        );
      case 'chat':
        return (
          <ChatView
            messages={messages}
            currentUserId={currentUserId}
            roommate={roommate}
            onSend={handleSendMessage}
            onAccept={handleAcceptRequest}
            onDecline={handleDeclineRequest}
            onCounter={handleCounterRequest}
          />
        );
      case 'transactions':
        return (
          <HistoryView
            transactions={transactions}
            currentUserId={currentUserId}
            onAccept={handleAcceptRequest}
            onDecline={handleDeclineRequest}
            onCancel={handleCancelRequest}
          />
        );
      case 'settings':
        return (
          <SettingsView
            pricingSettings={pricingSettings}
            sharingWillingness={sharingWillingness}
            onSavePricing={handleSavePricing}
            onSaveSharing={handleSaveSharing}
          />
        );
      default:
        return (
          <CalendarView
            userNights={userNights}
            roommateNights={roommateNights}
            pendingNights={pendingNights}
            priceOverlays={priceOverlays}
            selectedDay={selectedDay}
            roommateName={roommate?.firstName || 'Roommate'}
            onSelectDay={setSelectedDay}
            onCloseDay={() => setSelectedDay(null)}
            onAction={handleCalendarAction}
          />
        );
    }
  }

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  return (
    <div className="mobile-schedule-dashboard">
      <MobileHeader
        activeTab={activeTab}
        userName={roommate?.firstName}
        listingAddress={lease?.propertyAddress}
      />

      <main className="mobile-schedule-dashboard__content" role="main">
        {/* Loading State */}
        {isLoading && <MobileLoadingState />}

        {/* Error State */}
        {!isLoading && error && (
          <MobileErrorState error={error} onRetry={handleRefresh} />
        )}

        {/* Tab Content */}
        {!isLoading && !error && renderContent()}
      </main>

      <BottomSheet
        isOpen={sheet.isOpen}
        onClose={() => {
          sheet.closeSheet();
          handleCancelSwapMode();
        }}
        title={sheet.sheetType === 'buyout' ? 'Request Buyout' : sheet.sheetType === 'share' ? 'Offer Share' : sheet.sheetType === 'swap' ? 'Propose Swap' : ''}
      >
        {sheet.sheetType === 'buyout' && sheetDateStr && (
          <BuyOutSheet
            selectedNight={sheetDateStr}
            suggestedPrice={basePrice}
            isSubmitting={isSubmitting}
            onCancel={() => {
              sheet.closeSheet();
              handleCancelSwapMode();
            }}
            onSubmit={async (price, message) => {
              try {
                await handleBuyOut(message, price, price);
                sheet.closeSheet();
                showToast({
                  title: 'Request sent',
                  content: 'Your buyout request has been sent.',
                  type: 'success'
                });
              } catch (err) {
                showToast({
                  title: 'Request failed',
                  content: err?.message || 'Failed to send request.',
                  type: 'error'
                });
              }
            }}
          />
        )}
        {sheet.sheetType === 'share' && sheetDateStr && (
          <ShareSheet
            selectedNight={sheetDateStr}
            suggestedPrice={basePrice}
            isSubmitting={isSubmitting}
            onCancel={() => {
              sheet.closeSheet();
              handleCancelSwapMode();
            }}
            onSubmit={async (price, message) => {
              try {
                await handleShareRequest(message, price);
                sheet.closeSheet();
                showToast({
                  title: 'Request sent',
                  content: 'Your share request has been sent.',
                  type: 'success'
                });
              } catch (err) {
                showToast({
                  title: 'Request failed',
                  content: err?.message || 'Failed to send request.',
                  type: 'error'
                });
              }
            }}
          />
        )}
        {sheet.sheetType === 'swap' && sheetDateStr && (
          <SwapSheet
            requestedNight={sheetDateStr}
            userNights={userNights}
            selectedOfferNight={swapOfferNight}
            onSelectOffer={handleSelectSwapOffer}
            onCancel={() => {
              sheet.closeSheet();
              handleCancelSwapMode();
            }}
            onSubmit={async () => {
              try {
                await handleSubmitSwapRequest('');
                sheet.closeSheet();
                handleCancelSwapMode();
                showToast({
                  title: 'Swap sent',
                  content: 'Your swap request has been sent.',
                  type: 'success'
                });
              } catch (err) {
                showToast({
                  title: 'Swap failed',
                  content: err?.message || 'Failed to propose swap.',
                  type: 'error'
                });
              }
            }}
            isSubmitting={isSubmitting}
          />
        )}
      </BottomSheet>

      {toasts && toasts.length > 0 && (
        <Toast toasts={toasts} onRemove={removeToast} />
      )}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
