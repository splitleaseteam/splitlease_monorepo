/**
 * GuestEditingProposalModal - Complete popup for guest proposal editing
 *
 * Based on Bubble.io reusable element with view state machine
 * Implements 4-view state machine: 'pristine' | 'editing' | 'general' | 'cancel'
 *
 * View States & Flow:
 * - 'pristine': Initial state when modal opens → "Close" + "Edit Proposal"
 * - 'editing': User is actively editing fields → "Cancel edits" + "Display New Terms"
 * - 'general': User reviewed new terms, ready to submit → "Close" + "Submit Proposal Edits"
 * - 'cancel': Cancel proposal modal is shown (handled by separate EndProposalModal)
 *
 * State Transitions:
 * pristine → editing (click "Edit Proposal")
 * editing → pristine (click "Cancel edits")
 * editing → general (click "Display New Terms")
 * general → closed (click "Close" or "Submit Proposal Edits")
 *
 * Features:
 * - Day/Night selector for schedule editing
 * - Move-in date and flexible range input
 * - Reservation span dropdown with custom weeks
 * - Price breakdown display
 * - Responsive design with mobile support
 */

import EndProposalModal from '../EndProposalModal.jsx'
import ModalHeader from './ModalHeader.jsx'
import EditingFormSection from './EditingFormSection.jsx'
import PristineDocumentView from './PristineDocumentView.jsx'
import ReservationPriceBreakdown from './ReservationPriceBreakdown.jsx'
import ModalButtons from './ModalButtons.jsx'
import useGuestEditingProposalValidation from './useGuestEditingProposalValidation.js'
import '../GuestEditingProposalModal.css'

export default function GuestEditingProposalModal({
  proposal,
  listing,
  user,
  initialView = 'pristine',
  isVisible = true,
  isInternalUsage = false,
  pageWidth = 1200,
  onClose,
  onProposalUpdate,
  onProposalCancel,
  onAlert,
  pricePerNight = 0,
  totalPriceForReservation = 0,
  priceRentPer4Weeks = 0
}) {
  const {
    // View state
    view,
    isAcceptedOrDrafting,
    showMainView,
    showEditingPortion,
    showButtons,

    // Form state
    formState,
    reservationSpan,
    isHouseRulesVisible,

    // Derived data
    userContext,
    houseRulesToDisplay,

    // Handlers
    handleClose,
    handleBack,
    handleStartEditing,
    handleMoveInDateChange,
    handleFlexibleMoveInChange,
    handleReservationSpanChange,
    handleNumberOfWeeksChange,
    handleDaysChange,
    handleNightsChange,
    handleCheckInChange,
    handleCheckOutChange,
    handleHouseRulesClick,
    handleDisplayNewTerms,
    handleSubmitProposalEdits,
    handleCancelEdits,
    handleConfirmCancel,
    handleDismissCancel
  } = useGuestEditingProposalValidation({
    proposal,
    listing,
    user,
    initialView,
    pricePerNight,
    totalPriceForReservation,
    priceRentPer4Weeks,
    onClose,
    onProposalUpdate,
    onProposalCancel,
    onAlert
  })

  // Responsive checks
  const isSmallScreen = pageWidth < 900

  // Computed: showButtons needs isInternalUsage from props
  const shouldShowButtons = showButtons || isInternalUsage

  // Don't render if not visible
  if (!isVisible) {
    return null
  }

  return (
    <div
      className="guest-editing-proposal-modal-overlay"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gep-modal-title"
    >
      <div
        className="guest-editing-proposal"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Main view for editing and reviewing */}
        {showMainView && (
          <div className={`gep-main-view ${view === 'editing' ? 'gep-main-view--editing' : ''}`}>
            {/* Header */}
            <ModalHeader
              view={view}
              listing={listing}
              proposal={proposal}
              onBack={handleBack}
              onClose={handleClose}
            />

            {/* Guest comment section */}
            {proposal?.guestCommentToEditSuggestedProposal && (
              <div className="gep-guest-comment">
                <p className="gep-guest-comment-text">
                  Guest&apos;s comment to update suggested proposal: {proposal.guestCommentToEditSuggestedProposal}
                </p>
              </div>
            )}

            {/* Editing portion - conditionally visible */}
            {showEditingPortion && (
              <EditingFormSection
                formState={formState}
                isSmallScreen={isSmallScreen}
                onDaysChange={handleDaysChange}
                onNightsChange={handleNightsChange}
                onCheckInChange={handleCheckInChange}
                onCheckOutChange={handleCheckOutChange}
                onMoveInDateChange={handleMoveInDateChange}
                onFlexibleMoveInChange={handleFlexibleMoveInChange}
                onReservationSpanChange={handleReservationSpanChange}
                onNumberOfWeeksChange={handleNumberOfWeeksChange}
              />
            )}

            {/* Pristine document view - matches mockup exactly */}
            {view === 'pristine' && (
              <PristineDocumentView
                formState={formState}
                listing={listing}
                reservationSpan={reservationSpan}
                houseRulesToDisplay={houseRulesToDisplay}
                pricePerNight={pricePerNight}
                totalPriceForReservation={totalPriceForReservation}
                priceRentPer4Weeks={priceRentPer4Weeks}
              />
            )}

            {/* General breakdown details - for general view only */}
            {view === 'general' && (
              <div className="gep-breakdown-details">
                <ReservationPriceBreakdown
                  listing={listing}
                  proposal={proposal}
                  moveInDate={formState.moveInDate}
                  checkInDay={formState.checkInDay}
                  checkOutDay={formState.checkOutDay}
                  reservationSpan={reservationSpan}
                  weeksReservationSpanNumber={formState.numberOfWeeks}
                  nightsSelected={formState.selectedNights}
                  houseRulesToDisplay={houseRulesToDisplay}
                  pricePerNight={pricePerNight || proposal?.calculated_nightly_price || 0}
                  totalPriceForReservation={totalPriceForReservation || proposal?.total_reservation_price_for_guest || 0}
                  priceRentPer4Weeks={priceRentPer4Weeks || 0}
                  user={userContext}
                  isVisible={true}
                  isHouseRulesVisible={isHouseRulesVisible}
                  onHouseRulesClick={handleHouseRulesClick}
                  pageWidth={pageWidth}
                />
              </div>
            )}

          </div>
        )}

        {/* Buttons section - OUTSIDE gep-main-view so they stay pinned at bottom */}
        {showMainView && shouldShowButtons && (
          <ModalButtons
            view={view}
            isAcceptedOrDrafting={isAcceptedOrDrafting}
            onClose={handleClose}
            onStartEditing={handleStartEditing}
            onCancelEdits={handleCancelEdits}
            onDisplayNewTerms={handleDisplayNewTerms}
            onSubmitProposalEdits={handleSubmitProposalEdits}
          />
        )}

        {/* Cancel proposal modal */}
        <EndProposalModal
          isOpen={view === 'cancel'}
          proposal={proposal}
          listing={listing}
          userType="guest"
          onClose={handleDismissCancel}
          onConfirm={handleConfirmCancel}
        />
      </div>
    </div>
  )
}
