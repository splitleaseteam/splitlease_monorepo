/**
 * Schedule Dashboard - Main Page Component
 *
 * Desktop-first dashboard for managing lease schedules with roommates.
 * Follows Hollow Component Pattern: All logic in useScheduleDashboardLogic hook.
 *
 * Layout (Asymmetric 2.5:1 Grid):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  HEADER: Lease Info Bar (Property, Roommate, Lease Period)             │
 * ├───────────────────────────────────────────────────┬─────────────────────┤
 * │   Calendar (2-Month Side-by-Side View)            │  Roommate Profile   │
 * │   [Jan 2025]  [Feb 2025]                          │  Splitting With     │
 * ├───────────────────────────────────────────────────┤                     │
 * │   Buy Out Panel (Collapsible Drawer)              │                     │
 * │   [Compact Horizontal Layout]                     ├─────────────────────┤
 * ├───────────────────────────────────────────────────┤  Chat Thread        │
 * │   Transaction History                             │  (Always Visible)   │
 * │   [Full Table with Filters]                       │  [Tall Sidebar]     │
 * └───────────────────────────────────────────────────┴─────────────────────┘
 *
 * Route: /schedule/:leaseId
 */

import React from 'react';
import Footer from '../../shared/Footer.jsx';
import { useScheduleDashboardLogic } from './useScheduleDashboardLogic.js';
import ScheduleCalendar from './components/ScheduleCalendar.jsx';
import RoommateProfileCard from './components/RoommateProfileCard.jsx';
import BuyOutPanel from './components/BuyOutPanel.jsx';
import ChatThread from './components/ChatThread.jsx';
import TransactionHistory from './components/TransactionHistory.jsx';
import FlexibilityBreakdownModal from './components/FlexibilityBreakdownModal.jsx';
import DashboardModeToggle from './components/DashboardModeToggle.jsx';
import BuyoutFormulaSettings from './components/BuyoutFormulaSettings.jsx';
import BuyoutPriceVisualization from './components/BuyoutPriceVisualization.jsx';
import ReservationHeader from './components/ReservationHeader.jsx';

// ============================================================================
// HELPERS
// ============================================================================

function formatHeaderDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString.includes('T') ? dateString : `${dateString}T12:00:00`);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric'
  });
}

function getDrawerLabel(dateString, requestType, isSwapMode) {
  if (!dateString) return 'Create a Request';
  const formattedDate = formatHeaderDate(dateString);
  if (isSwapMode) return `Swapping ${formattedDate}`;
  if (requestType === 'share') return `Sharing ${formattedDate}`;
  return `Buying Out ${formattedDate}`;
}

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
    counterOriginalNight,
    counterTargetNight,
    basePrice,

    // Swap Mode
    isSwapMode,
    swapOfferNight,
    isCounterMode,

    // Request Type (Buyout vs Share vs Swap)
    requestType,
    defaultRequestType,

    // Shared Nights (co-occupancy)
    sharedNights,

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
    transactionsByDate,
    activeTransactionId,

    // Drawer States
    isBuyOutOpen,
    isChatOpen,

    // Modal States
    isFlexibilityModalOpen,

    // Dashboard Mode
    dashboardMode,

    // Flexibility Data
    userFlexibilityScore,
    flexibilityMetrics,

    // Pricing Strategy (3-Tier Model)
    pricingStrategy,
    isSavingPreferences,
    priceOverlays,
    roommatePriceOverlays,
    computedExamples,

    // Perspective (Dev Scaffolding)
    isSwappedPerspective,
    currentUserData,

    // Handlers
    handleSelectNight,
    handleBuyOut,
    handleShareRequest,
    handleRequestTypeChange,
    handleSwapInstead,
    handleSelectSwapOffer,
    handleSubmitSwapRequest,
    handleCancelSwapMode,
    handleSelectCounterNight,
    handleSubmitCounter,
    handleCancelCounterMode,
    handleCancel,
    handleSendMessage,
    handleAcceptRequest,
    handleDeclineRequest,
    handleCounterRequest,
    handleCancelRequest,
    handleViewTransactionDetails,
    handleSelectTransaction,
    handleClearActiveTransaction,
    handleMonthChange,
    handleRefresh,
    handleToggleBuyOut,
    handleToggleChat,
    handleOpenFlexibilityModal,
    handleCloseFlexibilityModal,
    handlePricingStrategyChange,
    handleSavePricingStrategy,
    handleResetPricingStrategy,
    handleSwitchMode
  } = useScheduleDashboardLogic();

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------

  return (
    <>
      {/* Reservation-specific header (replaces regular Header on this page) */}
      {!isLoading && !error && lease && (
        <ReservationHeader
          lease={lease}
          roommate={roommate}
          onBack={() => window.location.assign('/guest-leases')}
        />
      )}

      {/* Dev-only perspective indicator */}
      {import.meta.env.MODE === 'development' && isSwappedPerspective && (
        <div className="schedule-dashboard__perspective-banner">
          <span role="img" aria-label="eye">👁️</span> Viewing as: <strong>{currentUserData?.firstName} {currentUserData?.lastName}</strong>
          <a href={window.location.pathname}>Switch back to your view</a>
        </div>
      )}

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
            {/* Main Grid (LeaseInfoBar removed - ReservationHeader replaces it) */}
            <div className="schedule-dashboard__grid">
              {/* Asymmetric Two-Column Layout (2.5:1) */}
              <div className="schedule-dashboard__columns">
                {/* Left Column: Mode-Specific Content */}
                <div className="schedule-dashboard__column schedule-dashboard__column--left">
                  {/* Date Changes Mode: Calendar + Buy Out + Transaction History */}
                  {dashboardMode === 'date_changes' && (
                    <>
                      {/* Calendar Card */}
                      <section
                        className={`schedule-dashboard__section schedule-dashboard__calendar ${isBuyOutOpen ? 'schedule-dashboard__section--drawer-open' : ''}`}
                        id="dashboard-date-changes-panel"
                        role="tabpanel"
                        aria-labelledby="date-changes-tab"
                      >
                        <ScheduleCalendar
                          userNights={userNights}
                          roommateNights={roommateNights}
                          pendingNights={pendingNights}
                          blockedNights={blockedNights}
                          sharedNights={sharedNights}
                          currentMonth={currentMonth}
                          selectedNight={selectedNight}
                          onNightSelect={handleSelectNight}
                          onMonthChange={handleMonthChange}
                          transactionsByDate={transactionsByDate}
                          onSelectTransaction={handleSelectTransaction}
                          roommatePriceOverlays={roommatePriceOverlays}
                          roommateName={roommate?.firstName}
                        />
                      </section>

                      {/* Buy Out Drawer Handle (Summary Bar) */}
                      <div
                        className={`schedule-dashboard__drawer-handle ${isBuyOutOpen ? 'schedule-dashboard__drawer-handle--open' : ''}`}
                        onClick={handleToggleBuyOut}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleToggleBuyOut();
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isBuyOutOpen}
                        aria-controls="buyout-drawer"
                      >
                        <span className="schedule-dashboard__drawer-handle-text">
                          {getDrawerLabel(selectedNight, requestType, isSwapMode)}
                        </span>
                        <span className="schedule-dashboard__drawer-chevron">
                          {isBuyOutOpen ? '\u25B2' : '\u25BC'}
                        </span>
                      </div>

                      {/* Buy Out Drawer Content */}
                      <div
                        id="buyout-drawer"
                        className={`schedule-dashboard__drawer ${isBuyOutOpen ? 'schedule-dashboard__drawer--open' : ''}`}
                        aria-hidden={!isBuyOutOpen}
                      >
                        <section className="schedule-dashboard__section schedule-dashboard__buyout">
                          <BuyOutPanel
                            selectedDate={isCounterMode ? counterOriginalNight : selectedNight}
                            roommateName={roommate?.firstName}
                            basePrice={basePrice}
                            onBuyOut={handleBuyOut}
                            onShareRequest={handleShareRequest}
                            onSwapInstead={handleSwapInstead}
                            onCancel={handleCancel}
                            isSubmitting={isSubmitting}
                            compact
                            // Flexibility Score props (for "Guidance via Friction")
                            myFlexibilityScore={userFlexibilityScore}
                            roommateFlexibilityScore={flexibilityScore}
                            // Request Type props
                            requestType={requestType}
                            onRequestTypeChange={handleRequestTypeChange}
                            // Swap Mode props
                            isSwapMode={isSwapMode}
                            isCounterMode={isCounterMode}
                            swapOfferNight={swapOfferNight}
                            userNights={userNights}
                            roommateNights={roommateNights}
                            counterOriginalNight={counterOriginalNight}
                            counterTargetNight={counterTargetNight}
                            onSelectSwapOffer={handleSelectSwapOffer}
                            onSubmitSwapRequest={handleSubmitSwapRequest}
                            onCancelSwapMode={handleCancelSwapMode}
                            onSelectCounterNight={handleSelectCounterNight}
                            onSubmitCounterRequest={handleSubmitCounter}
                            onCancelCounterMode={handleCancelCounterMode}
                          />
                        </section>
                      </div>

                      {/* Transaction History */}
                      <section className="schedule-dashboard__section schedule-dashboard__history">
                        <TransactionHistory
                          transactions={transactions}
                          netFlow={netFlow}
                          onCancelRequest={handleCancelRequest}
                          onAcceptRequest={handleAcceptRequest}
                          onDeclineRequest={handleDeclineRequest}
                          onCounterRequest={handleCounterRequest}
                          onViewDetails={handleViewTransactionDetails}
                          activeTransactionId={activeTransactionId}
                          onClearActiveTransaction={handleClearActiveTransaction}
                        />
                      </section>
                    </>
                  )}

                  {/* Pricing Settings Mode: Calendar with Price Overlays */}
                  {dashboardMode === 'pricing_settings' && (
                    <>
                      {/* Calendar with suggested price overlays on user's nights */}
                      <section
                        className="schedule-dashboard__section schedule-dashboard__calendar schedule-dashboard__calendar--pricing"
                        id="dashboard-pricing-settings-panel"
                        role="tabpanel"
                        aria-labelledby="pricing-settings-tab"
                      >
                        <ScheduleCalendar
                          userNights={userNights}
                          roommateNights={roommateNights}
                          pendingNights={pendingNights}
                          blockedNights={blockedNights}
                          sharedNights={sharedNights}
                          currentMonth={currentMonth}
                          selectedNight={null}
                          onNightSelect={null}
                          onMonthChange={handleMonthChange}
                          priceOverlays={priceOverlays}
                        />
                      </section>
                    </>
                  )}
                </div>

                {/* Right Column: Profile + Mode Toggle + Mode-Specific Content */}
                <div className="schedule-dashboard__column schedule-dashboard__column--right">
                  {/* Profile Card - Always Visible */}
                  <section className="schedule-dashboard__section schedule-dashboard__profile">
                    <RoommateProfileCard
                      roommate={roommate}
                      flexibilityScore={flexibilityScore}
                      userFlexibilityScore={userFlexibilityScore}
                      userName={currentUserData?.firstName}
                      responsePatterns={responsePatterns}
                      netFlow={netFlow}
                      onFlexibilityInfoClick={handleOpenFlexibilityModal}
                    />
                  </section>

                  {/* Mode Toggle - Always Visible Under Profile */}
                  <section className="schedule-dashboard__section schedule-dashboard__mode-toggle">
                    <DashboardModeToggle
                      currentMode={dashboardMode}
                      onModeChange={handleSwitchMode}
                    />
                  </section>

                  {/* Date Changes Mode: Chat Thread */}
                  {dashboardMode === 'date_changes' && (
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
                        activeTransactionId={activeTransactionId}
                        onClearActiveTransaction={handleClearActiveTransaction}
                      />
                    </section>
                  )}

                  {/* Pricing Settings Mode: Right column is empty (controls shown wide below calendar) */}

                  {/* Mode Toggle - Duplicate at Bottom for Easy Access */}
                  <section className="schedule-dashboard__section schedule-dashboard__mode-toggle schedule-dashboard__mode-toggle--bottom">
                    <DashboardModeToggle
                      currentMode={dashboardMode}
                      onModeChange={handleSwitchMode}
                    />
                  </section>
                </div>
              </div>

              {/* Pricing Controls - Full Width (Outside Columns Grid) */}
              {dashboardMode === 'pricing_settings' && (
                <section className="schedule-dashboard__section schedule-dashboard__pricing-controls">
                  <BuyoutFormulaSettings
                    pricingStrategy={pricingStrategy}
                    onStrategyChange={handlePricingStrategyChange}
                    onSave={handleSavePricingStrategy}
                    onReset={handleResetPricingStrategy}
                    isSaving={isSavingPreferences}
                  />
                </section>
              )}
            </div>
          </>
        )}

        {/* Flexibility Breakdown Modal */}
        <FlexibilityBreakdownModal
          isOpen={isFlexibilityModalOpen}
          onClose={handleCloseFlexibilityModal}
          userScore={userFlexibilityScore}
          roommateScore={flexibilityScore}
          roommateName={roommate?.firstName}
          userName={currentUserData?.firstName}
          flexibilityMetrics={flexibilityMetrics}
        />
      </main>

      <Footer />
    </>
  );
}
