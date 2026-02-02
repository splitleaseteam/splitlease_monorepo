/**
 * Schedule Dashboard - Main Page Component
 *
 * Desktop-first dashboard for managing lease schedules with roommates.
 * Follows Hollow Component Pattern: All logic in useScheduleDashboardLogic hook.
 *
 * Layout (5 sections):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  HEADER: Lease Info Bar (Property, Roommate, Lease Period)             │
 * ├────────────────────────────────┬────────────────────────────────────────┤
 * │   Section 1: Calendar          │   Section 2: Roommate Profile         │
 * ├────────────────────────────────┼────────────────────────────────────────┤
 * │   Section 3: Buy Out Panel     │   Section 4: Chat Thread              │
 * ├────────────────────────────────┴────────────────────────────────────────┤
 * │   Section 5: Transaction History (Full Width)                          │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Route: /schedule/:leaseId
 */

import React from 'react';
import Header from '../../shared/Header.jsx';
import Footer from '../../shared/Footer.jsx';
import { useScheduleDashboardLogic } from './useScheduleDashboardLogic.js';
import LeaseInfoBar from './components/LeaseInfoBar.jsx';
import ScheduleCalendar from './components/ScheduleCalendar.jsx';
import RoommateProfileCard from './components/RoommateProfileCard.jsx';
import BuyOutPanel from './components/BuyOutPanel.jsx';
import ChatThread from './components/ChatThread.jsx';
import TransactionHistory from './components/TransactionHistory.jsx';

// ============================================================================
// LOADING STATE
// ============================================================================

function LoadingState() {
  return (
    <div className="schedule-loading" role="status" aria-live="polite">
      <div className="schedule-loading__spinner" aria-hidden="true"></div>
      <p>Loading schedule...</p>
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

function ErrorState({ error, onRetry }) {
  return (
    <div className="schedule-error" role="alert">
      <div className="schedule-error__icon" aria-hidden="true">!</div>
      <h2>Something went wrong</h2>
      <p className="schedule-error__message">{error}</p>
      <button className="schedule-error__retry" onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ScheduleDashboard() {
  const {
    // Loading & Error
    isLoading,
    error,
    isSubmitting,

    // Core Data
    lease,
    roommate,

    // Calendar (string dates)
    userNights,
    roommateNights,
    pendingNights,
    blockedNights,
    currentMonth,

    // Selection
    selectedNight,
    basePrice,

    // Notice-Based Buyout Pricing
    roommatePrices,
    selectedNightPricing,

    // Roommate Profile
    flexibilityScore,
    responsePatterns,
    netFlow,

    // Messaging
    messages,
    currentUserId,
    isSending,

    // Transaction History
    transactions,

    // Handlers
    handleSelectNight,
    handleBuyOut,
    handleSwapInstead,
    handleCancel,
    handleSendMessage,
    handleAcceptRequest,
    handleDeclineRequest,
    handleCounterRequest,
    handleCancelRequest,
    handleViewTransactionDetails,
    handleMonthChange,
    handleRefresh
  } = useScheduleDashboardLogic();

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  return (
    <>
      <Header />

      <main className="schedule-dashboard" role="main">
        {/* Loading State */}
        {isLoading && <LoadingState />}

        {/* Error State */}
        {!isLoading && error && (
          <ErrorState error={error} onRetry={handleRefresh} />
        )}

        {/* Dashboard Content */}
        {!isLoading && !error && (
          <>
            {/* Header: Lease Info Bar */}
            <LeaseInfoBar lease={lease} roommate={roommate} />

            {/* Main Grid */}
            <div className="schedule-dashboard__grid">
              {/* Row 1 */}
              <div className="schedule-dashboard__row">
                {/* Section 1: Calendar */}
                <section className="schedule-dashboard__section schedule-dashboard__calendar">
                  <ScheduleCalendar
                    userNights={userNights}
                    roommateNights={roommateNights}
                    pendingNights={pendingNights}
                    blockedNights={blockedNights}
                    currentMonth={currentMonth}
                    selectedNight={selectedNight}
                    onNightSelect={handleSelectNight}
                    onMonthChange={handleMonthChange}
                    roommatePrices={roommatePrices}
                  />
                </section>

                {/* Section 2: Roommate Profile */}
                <section className="schedule-dashboard__section schedule-dashboard__profile">
                  <RoommateProfileCard
                    roommate={roommate}
                    flexibilityScore={flexibilityScore}
                    responsePatterns={responsePatterns}
                    netFlow={netFlow}
                  />
                </section>
              </div>

              {/* Row 2 */}
              <div className="schedule-dashboard__row">
                {/* Section 3: Buy Out Panel */}
                <section className="schedule-dashboard__section schedule-dashboard__buyout">
                  <BuyOutPanel
                    selectedDate={selectedNight}
                    roommateName={roommate?.firstName}
                    basePrice={basePrice}
                    noticePricing={selectedNightPricing}
                    onBuyOut={handleBuyOut}
                    onSwapInstead={handleSwapInstead}
                    onCancel={handleCancel}
                    isSubmitting={isSubmitting}
                  />
                </section>

                {/* Section 4: Chat Thread */}
                <section className="schedule-dashboard__section schedule-dashboard__chat">
                  <ChatThread
                    messages={messages}
                    currentUserId={currentUserId}
                    roommateName={roommate?.firstName}
                    onSendMessage={handleSendMessage}
                    onAcceptRequest={handleAcceptRequest}
                    onDeclineRequest={handleDeclineRequest}
                    onCounterRequest={handleCounterRequest}
                    isSending={isSending}
                  />
                </section>
              </div>

              {/* Row 3: Full Width */}
              <div className="schedule-dashboard__row schedule-dashboard__row--full">
                {/* Section 5: Transaction History */}
                <section className="schedule-dashboard__section schedule-dashboard__history">
                  <TransactionHistory
                    transactions={transactions}
                    onCancelRequest={handleCancelRequest}
                    onViewDetails={handleViewTransactionDetails}
                  />
                </section>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </>
  );
}
