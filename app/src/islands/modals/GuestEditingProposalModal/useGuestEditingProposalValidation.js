/**
 * useGuestEditingProposalValidation - Hook for form state, parsing, and computed values
 *
 * Extracts form initialization, state management, event handlers, and
 * computed derived state from the main GuestEditingProposalModal component.
 */

import { useState, useCallback, useMemo, useEffect } from 'react'
import { DAYS_OF_WEEK, RESERVATION_SPAN_OPTIONS } from './constants.js'
import { PROPOSAL_STATUSES, getUsualOrder } from '../../../logic/constants/proposalStatuses.js'
import { executeCancelProposal } from '../../../logic/workflows/proposals/cancelProposalWorkflow.js'

// ============================================================================
// PARSING HELPERS
// ============================================================================

function parseDaysSelected(proposal) {
  let days = proposal?.guest_selected_days_numbers_json || proposal?.host_proposed_selected_days_json || []
  if (typeof days === 'string') {
    try { days = JSON.parse(days) } catch (e) { console.error('[useGuestEditingProposalValidation] Failed to parse JSON:', days, e); days = [] }
  }
  if (!Array.isArray(days) || days.length === 0) return [1, 2, 3, 4, 5] // Default Mon-Fri

  // Convert to day indices (0=Sun, 1=Mon, etc.)
  return days.map(d => {
    if (typeof d === 'number') return d
    if (typeof d === 'string') {
      const trimmed = d.trim()
      const numericValue = parseInt(trimmed, 10)
      if (!isNaN(numericValue) && String(numericValue) === trimmed) return numericValue
      // Map day names to indices
      const dayNameMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 }
      return dayNameMap[trimmed] ?? -1
    }
    return -1
  }).filter(d => d >= 0 && d <= 6)
}

function parseDayFromProposal(dayValue, fallbackIndex = 1) {
  if (dayValue === null || dayValue === undefined || dayValue === '') {
    const fallback = DAYS_OF_WEEK[fallbackIndex]
    return { display: fallback.name, dayIndex: fallback.dayIndex, first3Letters: fallback.shortName }
  }

  // Handle numeric value (number or numeric string like "5")
  const numericValue = typeof dayValue === 'number' ? dayValue : parseInt(String(dayValue).trim(), 10)
  if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 6) {
    const dayObj = DAYS_OF_WEEK[numericValue]
    return { display: dayObj.name, dayIndex: dayObj.dayIndex, first3Letters: dayObj.shortName }
  }

  // Handle day name string (e.g., "Friday", "Tuesday")
  const dayObj = DAYS_OF_WEEK.find(d => d.name === dayValue || d.shortName === dayValue)
  if (dayObj) {
    return { display: dayObj.name, dayIndex: dayObj.dayIndex, first3Letters: dayObj.shortName }
  }

  // Fallback if not found
  const fallback = DAYS_OF_WEEK[fallbackIndex]
  return { display: fallback.name, dayIndex: fallback.dayIndex, first3Letters: fallback.shortName }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export default function useGuestEditingProposalValidation({
  proposal,
  user,
  initialView = 'pristine',
  pricePerNight = 0,
  totalPriceForReservation = 0,
  priceRentPer4Weeks = 0,
  onClose,
  onProposalUpdate,
  onProposalCancel,
  onAlert
}) {
  // View state machine: 'pristine' | 'editing' | 'general' | 'cancel'
  const [view, setView] = useState(initialView)

  // Check if proposal is in a state where editing is not allowed
  const proposalStatusText = proposal?.proposal_workflow_status?.trim();
  const isAcceptedOrDrafting = proposalStatusText === PROPOSAL_STATUSES.PROPOSAL_OR_COUNTEROFFER_ACCEPTED.key ||
    proposalStatusText?.includes('Accepted') ||
    proposalStatusText?.includes('Drafting');

  // Debug log to verify initial view state
  console.log('[GuestEditingProposalModal] initialView:', initialView, '| current view:', view, '| isAcceptedOrDrafting:', isAcceptedOrDrafting)

  // Form state for editing
  const [formState, setFormState] = useState(() => {
    const daysSelected = parseDaysSelected(proposal)
    const nightsCount = proposal?.nights_per_week_count || daysSelected.length - 1 || 4

    // Parse check-in and check-out days from proposal data
    const checkInDayValue = proposal?.checkin_day_of_week_number
    const checkOutDayValue = proposal?.checkout_day_of_week_number

    return {
      moveInDate: proposal?.host_proposed_move_in_date ? new Date(proposal.host_proposed_move_in_date) :
                  proposal?.move_in_range_start_date ? new Date(proposal.move_in_range_start_date) :
                  new Date(),
      flexibleMoveInRange: proposal?.moveInRangeText || '',
      reservationSpan: RESERVATION_SPAN_OPTIONS.find(s => s.weeks === proposal?.reservation_span_in_weeks) || RESERVATION_SPAN_OPTIONS[1],
      numberOfWeeks: proposal?.reservation_span_in_weeks || 4,
      selectedDays: daysSelected,
      selectedNights: daysSelected.slice(0, nightsCount), // Nights are a subset of selected days
      checkInDay: parseDayFromProposal(checkInDayValue, 1),   // Default to Monday (index 1)
      checkOutDay: parseDayFromProposal(checkOutDayValue, 5)  // Default to Friday (index 5)
    }
  })

  // House rules visibility
  const [isHouseRulesVisible, setIsHouseRulesVisible] = useState(false)

  // Open for first time flag for initial state setup
  const [openForFirstTime, setOpenForFirstTime] = useState(true)

  // Proposal status check (>= 3 means accepted/completed)
  const proposalStatus = getUsualOrder(proposal?.proposal_workflow_status)
  const isStatusAccepted = proposalStatus >= 3

  // Computed visibility conditions from Bubble conditionals
  const showMainView = view !== 'cancel'
  const showEditingPortion = view === 'editing'
  const showBreakdownDetails = view === 'general' || view === 'pristine'
  const showButtons = view === 'editing' || view === 'general' || view === 'pristine' || isStatusAccepted
  const isPristine = view === 'pristine'

  // Handle initial state setup when proposal changes
  useEffect(() => {
    if (proposal && openForFirstTime) {
      const moveInDateValue = proposal?.host_proposed_move_in_date || proposal?.move_in_range_start_date
      const weeksValue = proposal?.reservation_span_in_weeks || 4
      const daysSelected = parseDaysSelected(proposal)
      const nightsCount = proposal?.nights_per_week_count || daysSelected.length - 1 || 4

      // Parse check-in and check-out days from proposal data
      const checkInDayValue = proposal?.checkin_day_of_week_number
      const checkOutDayValue = proposal?.checkout_day_of_week_number

      setFormState(prev => ({
        ...prev,
        moveInDate: moveInDateValue ? new Date(moveInDateValue) : new Date(),
        numberOfWeeks: weeksValue,
        reservationSpan: RESERVATION_SPAN_OPTIONS.find(s => s.weeks === weeksValue) || RESERVATION_SPAN_OPTIONS[1],
        selectedDays: daysSelected,
        selectedNights: daysSelected.slice(0, nightsCount),
        checkInDay: parseDayFromProposal(checkInDayValue, 1),
        checkOutDay: parseDayFromProposal(checkOutDayValue, 5)
      }))
      setOpenForFirstTime(false)
    }
  }, [proposal, openForFirstTime])

  // Create reservation span object for price breakdown
  const reservationSpan = useMemo(() => {
    const span = formState.reservationSpan
    return {
      weeks: span?.weeks || formState.numberOfWeeks,
      months: span?.months || Math.floor(formState.numberOfWeeks / 4),
      weeksInThisPeriod: formState.numberOfWeeks,
      display: span?.display || `${formState.numberOfWeeks} weeks`,
      type: span?.type || 'weeks'
    }
  }, [formState.reservationSpan, formState.numberOfWeeks])

  // Handle close - reset to pristine state for next opening
  const handleClose = useCallback(() => {
    setView('pristine')
    onClose?.()
  }, [onClose])

  // Handle back button - go back one step in the state machine
  const handleBack = useCallback(() => {
    if (view === 'editing') {
      setView('pristine')
    } else {
      handleClose()
    }
  }, [view, handleClose])

  // Handle "Edit Proposal" button click from pristine state
  const handleStartEditing = useCallback(() => {
    setView('editing')
  }, [])

  // Handle form field changes
  const handleMoveInDateChange = useCallback((e) => {
    const date = new Date(e.target.value)
    setFormState(prev => ({ ...prev, moveInDate: date }))
  }, [])

  const handleFlexibleMoveInChange = useCallback((e) => {
    setFormState(prev => ({ ...prev, flexibleMoveInRange: e.target.value }))
  }, [])

  const handleReservationSpanChange = useCallback((e) => {
    const spanId = e.target.value
    const span = RESERVATION_SPAN_OPTIONS.find(s => s.id === spanId)
    setFormState(prev => ({
      ...prev,
      reservationSpan: span || null,
      numberOfWeeks: span?.type === 'other' ? prev.numberOfWeeks : (span?.weeks || prev.numberOfWeeks)
    }))
  }, [])

  const handleNumberOfWeeksChange = useCallback((e) => {
    const weeks = parseInt(e.target.value) || 0
    setFormState(prev => ({ ...prev, numberOfWeeks: weeks }))
  }, [])

  const handleDaysChange = useCallback((days) => {
    setFormState(prev => ({ ...prev, selectedDays: days }))
  }, [])

  const handleNightsChange = useCallback((nights) => {
    setFormState(prev => ({ ...prev, selectedNights: nights }))
  }, [])

  const handleCheckInChange = useCallback((day) => {
    setFormState(prev => ({ ...prev, checkInDay: day }))
  }, [])

  const handleCheckOutChange = useCallback((day) => {
    setFormState(prev => ({ ...prev, checkOutDay: day }))
  }, [])

  // Handle house rules click
  const handleHouseRulesClick = useCallback(() => {
    setIsHouseRulesVisible(prev => !prev)
  }, [])

  // Handle display new terms button - transitions from editing to general (review) state
  const handleDisplayNewTerms = useCallback(() => {
    setView('general')
    onAlert?.({
      text: 'New terms calculated',
      alertType: 'information',
      showOnLive: true
    })
  }, [onAlert])

  // Handle submit proposal edits
  const handleSubmitProposalEdits = useCallback(() => {
    if (!proposal) return

    const payload = {
      proposal: proposal,
      nightsSelected: formState.selectedNights,
      daysSelected: formState.selectedDays,
      checkIn: formState.checkInDay,
      checkOut: formState.checkOutDay,
      reservationSpan: formState.reservationSpan || RESERVATION_SPAN_OPTIONS[0],
      numberOfWeeks: formState.numberOfWeeks,
      moveInDate: formState.moveInDate,
      fourWeekRent: priceRentPer4Weeks,
      nightlyPrice: pricePerNight,
      totalPrice: totalPriceForReservation
    }

    onProposalUpdate?.(payload)

    onAlert?.({
      text: 'Proposal updated successfully',
      alertType: 'success',
      showOnLive: true
    })

    handleClose()
  }, [
    proposal,
    formState,
    priceRentPer4Weeks,
    pricePerNight,
    totalPriceForReservation,
    onProposalUpdate,
    onAlert,
    handleClose
  ])

  // Handle cancel edits button - return to pristine state (discard edits)
  const handleCancelEdits = useCallback(() => {
    setView('pristine')
  }, [])

  // Handle initiate cancel proposal
  const handleInitiateCancelProposal = useCallback(() => {
    setView('cancel')
  }, [])

  // Handle cancel proposal confirmation
  const handleConfirmCancel = useCallback(async (reason) => {
    // Get proposal ID from the proposal object
    const proposalId = proposal?.id;

    if (!proposalId) {
      onAlert?.({
        text: 'Unable to cancel: proposal ID not found',
        alertType: 'error',
        showOnLive: true
      });
      return;
    }

    try {
      // Execute the cancellation in Supabase
      await executeCancelProposal(proposalId, reason || undefined);

      // Notify parent component
      onProposalCancel?.(reason);

      // Show success message
      onAlert?.({
        text: 'Proposal cancelled successfully',
        alertType: 'success',
        showOnLive: true
      });

      // Close the modal
      handleClose();
    } catch (error) {
      console.error('[GuestEditingProposalModal] Error cancelling proposal:', error);
      onAlert?.({
        text: `Failed to cancel proposal: ${error.message}`,
        alertType: 'error',
        showOnLive: true
      });
    }
  }, [proposal, onProposalCancel, onAlert, handleClose])

  // Handle cancel modal dismiss
  const handleDismissCancel = useCallback(() => {
    setView('general')
  }, [])

  // Get user context for price breakdown
  const userContext = useMemo(() => ({
    watching: {
      type: user?.type || 'guest',
      typeUserSignup: user?.typeUserSignup || 'A Guest (I would like to rent a space)'
    },
    type: 'guest'
  }), [user])

  // Get house rules from proposal or listing
  const houseRulesToDisplay = useMemo(() => {
    return proposal?.host_proposed_house_rules_json ||
           proposal?.house_rules_reference_ids_json ||
           []
  }, [proposal])

  return {
    // View state
    view,
    isAcceptedOrDrafting,
    showMainView,
    showEditingPortion,
    showBreakdownDetails,
    showButtons,
    isPristine,

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
    handleInitiateCancelProposal,
    handleConfirmCancel,
    handleDismissCancel
  }
}
