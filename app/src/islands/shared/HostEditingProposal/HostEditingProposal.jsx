/**
 * HostEditingProposal - Host interface for reviewing, editing, and counteroffering proposals
 *
 * Features:
 * - 3-state view machine: 'pristine' | 'editing' | 'general'
 * - Review proposal terms from guests (pristine view)
 * - Edit/counteroffer proposal terms (editing view)
 * - Real-time price breakdown preview (general view)
 * - Accept proposal as-is or with modifications
 * - Reject proposals with optional reason
 *
 * View States & Flow:
 * - 'pristine': Initial readonly view showing proposal summary
 * - 'editing': User is actively editing fields
 * - 'general': Review changes with price breakdown before submit
 *
 * State Transitions:
 * pristine -> editing (click "Edit Proposal")
 * editing -> pristine (click "Cancel Edits")
 * editing -> general (click "Update Proposal")
 * general -> closed (click "Submit Edits" or "Accept As-Is")
 */

import { useState, useEffect, useCallback } from 'react'
import {
  PROPOSAL_STATUSES,
  RESERVATION_SPANS,
  formatDate,
  findReservationSpanByWeeks
} from './types'
import {
  parseProposalData,
  extractNightsSelected,
  extractReservationSpanWeeks,
  extractCheckInDay,
  extractCheckOutDay,
  getProposalDate,
  getProposalValue,
  extractHouseRules,
  formatDateDisplay
} from './parseProposalData'
import { ReservationPriceBreakdown } from './ReservationPriceBreakdown'
import { ScheduleSelector } from './ScheduleSelector'
import { DateInput, ReservationSpanDropdown, NumberInput, HouseRulesMultiSelect } from './FormInputs'
import EndProposalModal from '../../modals/EndProposalModal.jsx'
import './HostEditingProposal.css'

/**
 * HostEditingProposal Component
 *
 * @param {Object} props
 * @param {Object} props.proposal - The proposal data
 * @param {Array} props.availableHouseRules - List of available house rules
 * @param {boolean} props.isInternalUsage - Flag for internal usage mode
 * @param {boolean} props.initialShowReject - If true, open directly to the reject modal
 * @param {function} props.onAcceptAsIs - Callback when proposal is accepted without changes
 * @param {function} props.onCounteroffer - Callback when counteroffer is submitted
 * @param {function} props.onReject - Callback when proposal is rejected
 * @param {function} props.onCancel - Callback when editing is cancelled
 * @param {function} props.onAlert - Callback to display notifications
 */
export function HostEditingProposal({
  proposal,
  availableHouseRules = [],
  isInternalUsage = false,
  initialShowReject = false,
  mode = 'edit', // 'edit' (default) or 'accept' for acceptance confirmation flow
  isAccepting = false, // Loading state for acceptance confirmation
  onAcceptAsIs,
  onCounteroffer,
  onReject,
  onCancel,
  onAlert,
  onConfirmAcceptance // Callback for accept mode confirmation
}) {
  // 3-state view machine: 'pristine' | 'editing' | 'general'
  const [view, setView] = useState('pristine')
  const [isFirstOpen, setIsFirstOpen] = useState(true)
  const [proceedButtonLocked, setProceedButtonLocked] = useState(false)

  // Get guest and listing info
  const guest = proposal?.guest || {}
  const listing = proposal?.listing || {}
  const guestName = guest?.first_name || 'Guest'
  const listingTitle = listing?.listing_title || 'Listing'

  // Form state - holds edited values
  const [editedMoveInDate, setEditedMoveInDate] = useState(() =>
    getProposalDate(proposal, 'move_in_range_start_date')
  )
  const [editedReservationSpan, setEditedReservationSpan] = useState(() => {
    const weeks = extractReservationSpanWeeks(proposal)
    const span = findReservationSpanByWeeks(weeks)
    if (!span) {
      return RESERVATION_SPANS.find(s => s.value === 'other')
    }
    return span
  })
  const [editedWeeks, setEditedWeeks] = useState(() =>
    extractReservationSpanWeeks(proposal)
  )
  const [editedCheckInDay, setEditedCheckInDay] = useState(() =>
    extractCheckInDay(proposal)
  )
  const [editedCheckOutDay, setEditedCheckOutDay] = useState(() =>
    extractCheckOutDay(proposal)
  )
  const [editedNightsSelected, setEditedNightsSelected] = useState(() =>
    extractNightsSelected(proposal)
  )
  const [editedDaysSelected, setEditedDaysSelected] = useState(() =>
    proposal?.guest_selected_days_numbers_json || ['Monday', 'Tuesday', 'Wednesday', 'Thursday']
  )
  const [editedHouseRules, setEditedHouseRules] = useState([])
  const [houseRulesInitialized, setHouseRulesInitialized] = useState(false)

  // Initialize house rules when availableHouseRules becomes available
  useEffect(() => {
    if (availableHouseRules.length > 0 && !houseRulesInitialized) {
      const normalizedRules = extractHouseRules(proposal, listing, availableHouseRules)
      setEditedHouseRules(normalizedRules)
      setHouseRulesInitialized(true)
    }
  }, [availableHouseRules, houseRulesInitialized, proposal, listing])

  // Popup states
  const [showConfirmPopup, setShowConfirmPopup] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(initialShowReject)

  // Initialize values based on proposal status (for counteroffer values)
  useEffect(() => {
    if (isFirstOpen && proposal) {
      const status = proposal?.proposal_workflow_status
      const statusInfo = PROPOSAL_STATUSES[status] || { usualOrder: 0 }
      const useCounterOfferValues = statusInfo.usualOrder >= 3

      if (useCounterOfferValues) {
        const hcMoveInDate = proposal?.host_proposed_move_in_date
        if (hcMoveInDate) {
          setEditedMoveInDate(new Date(hcMoveInDate))
        }

        const hcReservationSpan = proposal?.host_proposed_reservation_span_weeks
        if (hcReservationSpan) {
          setEditedReservationSpan(hcReservationSpan)
        }

        const hcWeeks = proposal?.host_proposed_reservation_span_weeks
        if (hcWeeks) {
          setEditedWeeks(hcWeeks)
        }

        const hcCheckInDay = proposal?.host_proposed_checkin_day
        if (hcCheckInDay != null) {
          setEditedCheckInDay(hcCheckInDay)
        }

        const hcCheckOutDay = proposal?.host_proposed_checkout_day
        if (hcCheckOutDay != null) {
          setEditedCheckOutDay(hcCheckOutDay)
        }

        const hcNightsSelected = proposal?.host_proposed_selected_nights_json
        if (hcNightsSelected) {
          setEditedNightsSelected(hcNightsSelected)
        }

        const hcDaysSelected = proposal?.host_proposed_selected_days_json
        if (hcDaysSelected) {
          setEditedDaysSelected(hcDaysSelected)
        }

        const hcHouseRules = proposal?.host_proposed_house_rules_json
        if (hcHouseRules) {
          setEditedHouseRules(hcHouseRules)
        }
      }

      setIsFirstOpen(false)
    }
  }, [proposal, isFirstOpen])

  // Check if any values have changed - simplified version
  const hasChanges = useCallback(() => {
    const original = parseProposalData(proposal, listing, availableHouseRules)

    const dateChanged = formatDate(original.moveInDate, 'short') !== formatDate(editedMoveInDate, 'short')
    const weeksChanged = original.reservationSpanWeeks !== editedWeeks
    const scheduleChanged = original.checkInDay !== editedCheckInDay ||
                           original.checkOutDay !== editedCheckOutDay

    // Only compare house rules if initialized
    let rulesChanged = false
    if (houseRulesInitialized && original.houseRules.length > 0) {
      const originalRuleIds = new Set(original.houseRules.map(r => r.id))
      const editedRuleIds = new Set(editedHouseRules.map(r => r.id))
      rulesChanged = originalRuleIds.size !== editedRuleIds.size ||
                    [...originalRuleIds].some(id => !editedRuleIds.has(id))
    }

    return dateChanged || weeksChanged || scheduleChanged || rulesChanged
  }, [proposal, listing, availableHouseRules, editedMoveInDate, editedWeeks, editedCheckInDay, editedCheckOutDay, editedHouseRules, houseRulesInitialized])

  // Calculate host compensation using four_week_host_compensation as the source of truth
  // The database total_compensation_for_host field can be incorrect
  const originalNightsPerWeek = extractNightsSelected(proposal).length
  const originalWeeksValue = extractReservationSpanWeeks(proposal)
  const originalTotalNights = originalNightsPerWeek * originalWeeksValue

  // Use four_week_host_compensation from proposal - this is calculated from the pricing_list
  const host4WeekCompensation = getProposalValue(proposal, 'four_week_host_compensation', 0)

  // Derive nightly host rate from 4 week compensation
  const nightlyCompensation = originalNightsPerWeek > 0
    ? host4WeekCompensation / (4 * originalNightsPerWeek)
    : 0

  // Calculate compensation for edited values
  const nightsPerWeek = editedNightsSelected.length
  const totalNights = nightsPerWeek * editedWeeks
  const totalCompensation = nightlyCompensation * totalNights
  const compensationPer4Weeks = editedWeeks > 0 ? (totalCompensation / editedWeeks) * 4 : 0

  // Original compensation values for comparison
  const originalFourWeekPeriods = originalWeeksValue / 4
  const originalTotalCompensation = host4WeekCompensation * originalFourWeekPeriods
  const originalCompensationPer4Weeks = host4WeekCompensation

  // Get original values for comparison display
  const originalValues = parseProposalData(proposal, listing, availableHouseRules)

  // Handlers
  const handleStartEditing = () => {
    setView('editing')
  }

  const handleCancelEdits = () => {
    setView('pristine')
  }

  const handleScheduleChange = (data) => {
    setEditedCheckInDay(data.checkInDay)
    setEditedCheckOutDay(data.checkOutDay)
    setEditedNightsSelected(data.nightsSelected)
    setEditedDaysSelected(data.daysSelected)
  }

  // Update Proposal button takes user to review (general) view
  const handleUpdateProposal = () => {
    setView('general')
  }

  const handleConfirmProceed = async () => {
    if (proceedButtonLocked) return
    setProceedButtonLocked(true)

    try {
      if (!hasChanges()) {
        // Accept as-is
        if (onAcceptAsIs) {
          await onAcceptAsIs(proposal)
        }
        onAlert?.({
          type: 'information',
          title: 'Proposal Accepted!',
          content: 'The proposal has been accepted as-is.'
        })
      } else {
        // Counteroffer
        if (onCounteroffer) {
          await onCounteroffer({
            proposal,
            numberOfWeeks: editedWeeks,
            reservationSpan: editedReservationSpan,
            checkIn: editedCheckInDay,
            checkOut: editedCheckOutDay,
            nightsSelected: editedNightsSelected,
            daysSelected: editedDaysSelected,
            newHouseRules: editedHouseRules,
            moveInDate: editedMoveInDate
          })
        }
        onAlert?.({
          type: 'information',
          title: 'Modifications submitted!',
          content: 'Awaiting Guest Review.'
        })
      }

      setShowConfirmPopup(false)
      setView('pristine')
      onCancel?.()
    } catch (_error) {
      onAlert?.({
        type: 'error',
        title: 'Error',
        content: 'Failed to process your request. Please try again.'
      })
    } finally {
      setProceedButtonLocked(false)
    }
  }

  const handleReject = async (reasonText) => {
    if (onReject) {
      try {
        await onReject(proposal, reasonText)
        onAlert?.({
          type: 'information',
          title: 'Proposal Rejected',
          content: 'The proposal has been rejected.'
        })
        setShowRejectModal(false)
        onCancel?.()
      } catch (_error) {
        onAlert?.({
          type: 'error',
          title: 'Error',
          content: 'Failed to reject proposal. Please try again.'
        })
      }
    }
  }

  const handleClose = () => {
    setView('pristine')
    setIsFirstOpen(true)
    onCancel?.()
  }

  // Handle edit button click from breakdown - goes to editing view
  const handleEditField = () => {
    setView('editing')
  }

  // Render header based on view state
  const renderHeader = () => {
    // Accept mode header - readonly acceptance confirmation view
    if (mode === 'accept') {
      return (
        <div className="hep-header hep-header--accept">
          <div className="hep-header-left">
            <div className="hep-header-icon hep-header-icon--success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22,4 12,14.01 9,11.01"/>
              </svg>
            </div>
            <div>
              <div className="hep-header-title">Accept Proposal</div>
              <div className="hep-header-subtitle">Review terms from {guestName}</div>
            </div>
          </div>
          <button
            type="button"
            className="hep-header-close"
            onClick={handleClose}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )
    }

    if (view === 'pristine') {
      // Pristine header: Document icon + "Review Proposal" title
      return (
        <div className="hep-header">
          <div className="hep-header-left">
            <div className="hep-header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div>
              <div className="hep-header-title">Review Proposal</div>
              <div className="hep-header-subtitle">From {guestName} for {listingTitle}</div>
            </div>
          </div>
          <button
            type="button"
            className="hep-header-close"
            onClick={handleClose}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )
    }

    if (view === 'editing') {
      // Editing header: Document icon + "Edit Proposal" title
      return (
        <div className="hep-header">
          <div className="hep-header-left">
            <div className="hep-header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div>
              <div className="hep-header-title">Edit Proposal</div>
              <div className="hep-header-subtitle">{listingTitle}</div>
            </div>
          </div>
          <button
            type="button"
            className="hep-header-close"
            onClick={handleClose}
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )
    }

    // General header: Document icon + "Review Changes" title
    return (
      <div className="hep-header">
        <div className="hep-header-left">
          <div className="hep-header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <div className="hep-header-title">Review Changes</div>
            <div className="hep-header-subtitle">{listingTitle}</div>
          </div>
        </div>
        <button
          type="button"
          className="hep-header-close"
          onClick={handleClose}
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    )
  }

  // Render footer based on view state
  const renderFooter = () => {
    // Accept mode footer - Cancel + Confirm Acceptance buttons
    if (mode === 'accept') {
      return (
        <div className="hep-footer hep-footer--accept">
          <button
            type="button"
            className="hep-btn hep-btn-secondary"
            onClick={handleClose}
            disabled={isAccepting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="hep-btn hep-btn-success"
            onClick={() => onConfirmAcceptance?.(proposal)}
            disabled={isAccepting}
          >
            {isAccepting ? 'Accepting...' : 'Confirm Acceptance'}
          </button>
        </div>
      )
    }

    if (view === 'pristine') {
      // Pristine: "Cancel" (secondary) + "Edit Proposal" (primary) - side by side
      return (
        <div className="hep-footer">
          <button
            type="button"
            className="hep-btn hep-btn-secondary"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="hep-btn hep-btn-primary"
            onClick={handleStartEditing}
          >
            Edit Proposal
          </button>
        </div>
      )
    }

    if (view === 'editing') {
      // Editing: "Cancel Edits" (secondary) + "Update Proposal" (primary)
      return (
        <div className="hep-footer">
          <button
            type="button"
            className="hep-btn hep-btn-secondary"
            onClick={handleCancelEdits}
          >
            Cancel Edits
          </button>
          <button
            type="button"
            className="hep-btn hep-btn-primary"
            onClick={handleUpdateProposal}
          >
            Update Proposal
          </button>
        </div>
      )
    }

    // General (review): "Cancel Edits" (secondary) + "Submit" (success)
    return (
      <div className="hep-footer">
        <button
          type="button"
          className="hep-btn hep-btn-secondary"
          onClick={handleCancelEdits}
        >
          Cancel Edits
        </button>
        <button
          type="button"
          className="hep-btn hep-btn-success"
          onClick={handleConfirmProceed}
          disabled={proceedButtonLocked}
        >
          Submit
        </button>
      </div>
    )
  }

  // Render pristine view (readonly details)
  const renderPristineView = () => (
    <div className="hep-pristine-view">
      <div className="hep-detail-row">
        <span className="hep-detail-label">Move-in</span>
        <span className="hep-detail-value">{formatDateDisplay(originalValues.moveInDate, 'full')}</span>
      </div>
      <div className="hep-detail-row">
        <span className="hep-detail-label">Check-in</span>
        <span className="hep-detail-value">{originalValues.checkInDay}</span>
      </div>
      <div className="hep-detail-row">
        <span className="hep-detail-label">Check-out</span>
        <span className="hep-detail-value">{originalValues.checkOutDay}</span>
      </div>
      <div className="hep-detail-row">
        <span className="hep-detail-label">Reservation Length</span>
        <span className="hep-detail-value">{originalValues.reservationSpanWeeks} weeks</span>
      </div>
      <div className="hep-detail-row">
        <span className="hep-detail-label">Weekly Pattern</span>
        <span className="hep-detail-value">
          {originalValues.checkInDay?.substring(0, 3)} - {originalValues.checkOutDay?.substring(0, 3)} ({originalValues.nightsSelected.length} nights/week)
        </span>
      </div>
      <div className="hep-detail-row">
        <span className="hep-detail-label">House Rules</span>
        <span className="hep-detail-value">{originalValues.houseRules.length} rules</span>
      </div>

      {/* Compensation Breakdown */}
      <div className="hep-pricing-section">
        <div className="hep-pricing-title">Compensation Breakdown</div>
        <div className="hep-pricing-row">
          <span className="hep-pricing-label">Compensation /night</span>
          <span className="hep-pricing-value">${nightlyCompensation.toFixed(2)}</span>
        </div>
        <div className="hep-pricing-row">
          <span className="hep-pricing-label">Nights reserved</span>
          <span className="hep-pricing-value">x {originalTotalNights}</span>
        </div>
        <div className="hep-pricing-row hep-pricing-row--total">
          <span className="hep-pricing-label">Total Compensation</span>
          <span className="hep-pricing-value">${originalTotalCompensation.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )

  // Render editing view (form fields)
  const renderEditingView = () => (
    <div className="hep-editing-view">
      {/* Schedule Selector */}
      <div className="hep-form-section">
        <label className="hep-form-label">Schedule Selection</label>
        <ScheduleSelector
          initialNightsSelected={editedNightsSelected}
          availableNights={listing?.nightsAvailable}
          onChange={handleScheduleChange}
          disabled={isInternalUsage || listing?.rentalType === 'Weekly'}
        />
      </div>

      {/* Move-in Date */}
      <div className="hep-form-section">
        <label className="hep-form-label">Move-in Date</label>
        <DateInput
          value={editedMoveInDate}
          onChange={setEditedMoveInDate}
          placeholder="Move-in"
          minDate={new Date()}
        />
      </div>

      {/* Reservation Span */}
      <div className="hep-form-section">
        <label className="hep-form-label">Reservation Span</label>
        <ReservationSpanDropdown
          value={editedReservationSpan}
          onChange={(span) => {
            setEditedReservationSpan(span)
            if (span.value !== 'other') {
              setEditedWeeks(span.weeks)
            }
          }}
          options={RESERVATION_SPANS}
          placeholder="Select reservation span"
        />
        {editedReservationSpan?.value === 'other' && (
          <div className="hep-form-section hep-form-section--inline">
            <label className="hep-form-label"># of weeks</label>
            <NumberInput
              value={editedWeeks}
              onChange={setEditedWeeks}
              placeholder="Enter # Weeks"
              min={1}
              max={52}
            />
          </div>
        )}
      </div>

      {/* House Rules */}
      <div className="hep-form-section">
        <label className="hep-form-label">House Rules</label>
        <HouseRulesMultiSelect
          value={editedHouseRules}
          onChange={setEditedHouseRules}
          options={availableHouseRules}
          placeholder="Choose some options..."
        />
      </div>
    </div>
  )

  // If initialShowReject is true, render only the EndProposalModal
  if (initialShowReject && showRejectModal) {
    return (
      <EndProposalModal
        isOpen={showRejectModal}
        proposal={proposal}
        userType="host"
        confirmButtonLabel="Reject Proposal"
        onClose={() => {
          setShowRejectModal(false)
          onCancel?.()
        }}
        onConfirm={handleReject}
      />
    )
  }

  return (
    <div className="hep-container">
      {/* Mobile Grab Handle */}
      <div className="hep-grab-handle" aria-hidden="true" />

      {/* Header */}
      {renderHeader()}

      {/* Scrollable Body */}
      <div className="hep-body">
        {mode === 'accept' && (
          <div className="hep-accept-view">
            <div className="hep-accept-message">
              <p>By accepting this proposal, a lease will be created and both parties will be notified. Lease documents will be ready within 48 hours.</p>
            </div>
            {renderPristineView()}
          </div>
        )}

        {mode !== 'accept' && view === 'pristine' && renderPristineView()}

        {view === 'editing' && renderEditingView()}

        {view === 'general' && (
          <>
            <button
              type="button"
              className="hep-back-link"
              onClick={() => setView('editing')}
              aria-label="Back to editing"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18L9 12L15 6"/>
              </svg>
              Back to editing
            </button>
            <ReservationPriceBreakdown
              moveInDate={editedMoveInDate}
              checkInDay={editedCheckInDay}
              checkOutDay={editedCheckOutDay}
              reservationSpan={editedReservationSpan}
              weeksReservationSpan={editedWeeks}
              houseRules={editedHouseRules}
              nightsSelected={editedNightsSelected}
              nightlyCompensation={nightlyCompensation}
              totalCompensation={totalCompensation}
              hostCompensationPer4Weeks={compensationPer4Weeks}
              originalTotalCompensation={originalTotalCompensation}
              originalCompensationPer4Weeks={originalCompensationPer4Weeks}
              isVisible={true}
              originalValues={originalValues}
              onEditField={handleEditField}
            />
          </>
        )}
      </div>

      {/* Footer */}
      {renderFooter()}

      {/* Reject Proposal Modal */}
      <EndProposalModal
        isOpen={showRejectModal}
        proposal={proposal}
        userType="host"
        confirmButtonLabel="Reject Proposal"
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
      />

      {/* Confirmation Popup */}
      {showConfirmPopup && (
        <div className="hep-popup-overlay">
          <div className="hep-popup">
            <h3 className="hep-popup-title">
              {hasChanges() ? 'Confirm Counteroffer' : 'Accept Proposal'}
            </h3>
            <p className="hep-popup-content">
              {hasChanges()
                ? 'You have made changes to the proposal terms. This will send a counteroffer to the guest for their review.'
                : 'You are accepting the proposal as-is without any modifications.'}
            </p>
            <div className="hep-popup-actions">
              <button
                type="button"
                className="hep-btn hep-btn-secondary"
                onClick={() => setShowConfirmPopup(false)}
              >
                No, Go Back
              </button>
              <button
                type="button"
                className="hep-btn hep-btn-primary"
                onClick={handleConfirmProceed}
                disabled={proceedButtonLocked}
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
