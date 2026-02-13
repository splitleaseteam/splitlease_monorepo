/**
 * Proposal Card Component
 *
 * Displays detailed information about a selected proposal in a two-column layout:
 * - Left column: Listing details, schedule, duration, move-in info
 * - Right column: Listing photo with host overlay
 * - Bottom: Pricing bar and progress tracker
 *
 * Design matches the MyProposals page layout.
 *
 * Dynamic UI Features:
 * - Status banner for accepted/counteroffer/cancelled states
 * - Dynamic progress tracker stage and colors based on status
 * - Action buttons change based on proposal status
 * - Warning icon when some nights become unavailable
 */

import { useState, useMemo } from 'react';
import { formatDate } from '../../../../lib/proposals/dataTransformers.js';
import { getStatusConfig, isTerminalStatus, isCompletedStatus } from '../../../../logic/constants/proposalStatuses.js';
import { shouldHideVirtualMeetingButton } from '../../../../lib/proposals/statusButtonConfig.js';
import { navigateToMessaging } from '../../../../logic/workflows/proposals/navigationWorkflow.js';
import { getListingUrlWithProposalContext } from '../../../../lib/navigation.js';
import HostProfileModal from '../../../modals/HostProfileModal.jsx';
import FullscreenProposalMapModal from '../../../modals/FullscreenProposalMapModal.jsx';
import NegotiationSummarySection from '../NegotiationSummarySection.jsx';
import StatusDisplay from './StatusDisplay.jsx';
import ProposalInfoGrid from './ProposalInfoGrid.jsx';
import ProposalActions from './ProposalActions.jsx';
import InlineProgressTracker, { getStageLabels } from './InlineProgressTracker.jsx';
import {
  getAllDaysWithSelection,
  getCheckInOutRange,
  parseDaysSelectedForContext,
  getEffectiveReservationSpan
} from './proposalCardHelpers.js';

export default function ProposalCard({ proposal, statusConfig, buttonConfig, allProposals = [], onProposalSelect, onProposalDeleted }) {
  // ============================================================================
  // ALL HOOKS MUST BE DECLARED FIRST (React Rules of Hooks)
  // ============================================================================

  // House rules toggle state
  const [showHouseRules, setShowHouseRules] = useState(false);
  // Host profile modal state
  const [showHostProfileModal, setShowHostProfileModal] = useState(false);
  // Map modal state
  const [showMapModal, setShowMapModal] = useState(false);

  // VM button configuration - memoized based on virtualMeeting state
  const virtualMeeting = proposal?.virtualMeeting;
  const currentUserId = proposal?.guest_user_id;
  const status = proposal?.proposal_workflow_status;

  const vmConfig = useMemo(() => {
    // Conditional 7-8: Check status-based hiding first
    if (!status || shouldHideVirtualMeetingButton(status)) {
      return { visible: false };
    }

    // No VM exists - request new meeting
    if (!virtualMeeting) {
      return {
        visible: true,
        view: 'request',
        disabled: false,
        label: 'Request Virtual Meeting',
        className: 'btn-vm-request'
      };
    }

    // Conditional 6: VM declined - can request alternative times
    if (virtualMeeting.meeting_declined === true) {
      return {
        visible: true,
        view: 'request',
        disabled: false,
        label: 'Virtual Meeting Declined',
        className: 'btn-vm-declined',
        style: { color: '#DB2E2E', fontWeight: 'bold' }
      };
    }

    // Conditional 5: Meeting confirmed by Split Lease - show details
    if (virtualMeeting.booked_date && virtualMeeting.confirmedbysplitlease === true) {
      return {
        visible: true,
        view: 'details',
        disabled: false,
        label: 'Meeting confirmed',
        className: 'btn-vm-confirmed'
      };
    }

    // Conditional 4: Meeting accepted but awaiting SL confirmation
    if (virtualMeeting.booked_date && !virtualMeeting.confirmedbysplitlease) {
      return {
        visible: true,
        view: 'details',
        disabled: true,
        label: 'Virtual Meeting Accepted',
        className: 'btn-vm-accepted'
      };
    }

    // Conditional 2: Current user requested - waiting for response
    if (virtualMeeting.requested_by === currentUserId) {
      return {
        visible: true,
        view: null,
        disabled: true,
        label: 'Virtual Meeting Requested',
        className: 'btn-vm-requested'
      };
    }

    // Conditional 1: Other party requested - respond
    if (virtualMeeting.requested_by && virtualMeeting.requested_by !== currentUserId) {
      return {
        visible: true,
        view: 'respond',
        disabled: false,
        label: 'Respond to Virtual Meeting Request',
        className: 'btn-vm-respond'
      };
    }

    // Default fallback - can request new meeting
    return {
      visible: true,
      view: 'request',
      disabled: false,
      label: 'Request Virtual Meeting',
      className: 'btn-vm-request'
    };
  }, [virtualMeeting, currentUserId, status]);

  // ============================================================================
  // EARLY RETURN (after all hooks)
  // ============================================================================
  if (!proposal) {
    return null;
  }

  const listing = proposal.listing;
  const host = listing?.host;

  // Extract data
  const listingName = listing?.listing_title || 'Listing';
  const location = [listing?.hoodName, listing?.boroughName]
    .filter(Boolean)
    .join(', ') || 'New York';

  const photoUrl = listing?.featuredPhotoUrl ||
    (listing?.photos_with_urls_captions_and_sort_order_json?.[0]) ||
    null;

  const hostName = host?.first_name || 'Host';

  // Schedule info
  // Handle double-encoded JSONB: may come as a JSON string that needs parsing
  let daysSelected = proposal.guest_selected_days_numbers_json || [];
  if (typeof daysSelected === 'string') {
    try {
      daysSelected = JSON.parse(daysSelected);
    } catch (_e) {
      console.warn('ProposalCard: Failed to parse guest_selected_days_numbers_json:', _e);
      daysSelected = [];
    }
  }
  const allDays = getAllDaysWithSelection(daysSelected);
  const nightsPerWeek = proposal.nights_per_week_count || daysSelected.length;
  const reservationWeeks = proposal.reservation_span_in_weeks || proposal.host_proposed_reservation_span_weeks || 4;
  const checkInOutRange = getCheckInOutRange(proposal);

  // Pricing
  const isCounteroffer = proposal.has_host_counter_offer;
  const nightlyPrice = isCounteroffer
    ? proposal.host_proposed_nightly_price
    : proposal.calculated_nightly_price;
  const totalPrice = isCounteroffer
    ? proposal.host_proposed_total_guest_price
    : proposal.total_reservation_price_for_guest;
  // Original price (before counteroffer) for strikethrough display
  const originalTotalPrice = isCounteroffer
    ? proposal.total_reservation_price_for_guest
    : null;
  const cleaningFee = proposal.cleaning_fee_amount || 0;

  // Move-in/move-out dates
  const moveInStart = proposal.move_in_range_start_date;
  const anticipatedMoveIn = formatDate(moveInStart);

  // Check-in/out times
  const checkInTime = listing?.checkin_time_of_day || '2:00 pm';
  const checkOutTime = listing?.checkout_time_of_day || '11:00 am';

  // House rules - use resolved names from query layer (stored on proposal, not listing)
  const houseRules = proposal.houseRules || [];
  const hasHouseRules = Array.isArray(houseRules) && houseRules.length > 0;

  // Negotiation summaries
  const negotiationSummaries = proposal?.negotiationSummaries || [];

  // Status and progress - derive dynamically from statusConfig
  const currentStatusConfig = statusConfig || getStatusConfig(status);
  const isTerminal = isTerminalStatus(status);
  const isCompleted = isCompletedStatus(status);
  const stageLabels = getStageLabels(status, proposal);

  // Warning: some nights unavailable
  const someNightsUnavailable = proposal.some_nights_unavailable;

  // Cancel reason (for cancelled proposals)
  const cancelReason = proposal.reason_for_cancellation;

  // Calculate days summary for display
  const selectedDaysCount = daysSelected.length;

  return (
    <div className="proposal-card-wrapper">
      {/* Detail Section Container */}
      <div className="detail-section">
        {/* Status Banner - shows for accepted/counteroffer/cancelled states */}
        <StatusDisplay status={status} cancelReason={cancelReason} isCounteroffer={isCounteroffer} />

        {/* Detail Header */}
        <div className="detail-header">
          {photoUrl ? (
            <img src={photoUrl} className="detail-image" alt="" />
          ) : (
            <div className="detail-image" style={{ backgroundColor: 'var(--gp-border-light)' }} />
          )}
          <div className="detail-title-area">
            <div className="detail-title">{listingName}</div>
            <div className="detail-location">{location}</div>
          </div>
          <div className="detail-host">
            <div className="host-name">{hostName}</div>
            <div className="host-label">Host</div>
          </div>
        </div>

        {/* Quick Links Row */}
        <div className="links-row">
          <a
            href={getListingUrlWithProposalContext(listing?.id, {
              daysSelected: parseDaysSelectedForContext(proposal),
              reservationSpan: getEffectiveReservationSpan(proposal),
              moveInDate: proposal.move_in_range_start_date
            })}
            className="link-item"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Listing
          </a>
          <button
            className="link-item"
            onClick={() => setShowMapModal(true)}
          >
            Map
          </button>
          <button
            className="link-item"
            onClick={() => navigateToMessaging(host?.id, proposal.id)}
          >
            Message Host
          </button>
          <button
            className="link-item"
            onClick={() => setShowHostProfileModal(true)}
          >
            Host Profile
          </button>
          {hasHouseRules && (
            <button
              className="link-item"
              onClick={() => setShowHouseRules(!showHouseRules)}
            >
              {showHouseRules ? 'Hide Rules' : 'House Rules'}
            </button>
          )}
        </div>

        {/* House Rules Grid - conditionally shown */}
        {showHouseRules && hasHouseRules && (
          <div className="house-rules-grid" style={{ padding: '16px 24px', borderBottom: '1px solid var(--gp-border-light)' }}>
            {houseRules.map((rule, index) => (
              <div key={index} className="house-rule-badge">
                {rule}
              </div>
            ))}
          </div>
        )}

        {/* Negotiation Summary Section */}
        {negotiationSummaries.length > 0 && (
          <div style={{ padding: '0 24px' }}>
            <NegotiationSummarySection summaries={negotiationSummaries} />
          </div>
        )}

        {/* Info Grid, Days Row, Pricing Row */}
        <ProposalInfoGrid
          anticipatedMoveIn={anticipatedMoveIn}
          reservationWeeks={reservationWeeks}
          checkInOutRange={checkInOutRange}
          nightsPerWeek={nightsPerWeek}
          allDays={allDays}
          selectedDaysCount={selectedDaysCount}
          someNightsUnavailable={someNightsUnavailable}
          checkInTime={checkInTime}
          checkOutTime={checkOutTime}
          nightlyPrice={nightlyPrice}
          totalPrice={totalPrice}
          originalTotalPrice={originalTotalPrice}
          cleaningFee={cleaningFee}
        />

        {/* Progress Tracker */}
        <InlineProgressTracker
          status={status}
          usualOrder={currentStatusConfig?.usualOrder || 0}
          stageLabels={stageLabels}
          isTerminal={isTerminal}
          proposal={proposal}
        />

        {/* Actions Row + Action Modals */}
        <ProposalActions
          proposal={proposal}
          listing={listing}
          buttonConfig={buttonConfig}
          vmConfig={vmConfig}
          isTerminal={isTerminal}
          isCompleted={isCompleted}
          nightlyPrice={nightlyPrice}
          totalPrice={totalPrice}
          nightsPerWeek={nightsPerWeek}
          currentUserId={currentUserId}
          onProposalDeleted={onProposalDeleted}
        />
      </div>

      {/* Host Profile Modal */}
      {showHostProfileModal && (
        <HostProfileModal
          host={host}
          listing={listing}
          onClose={() => setShowHostProfileModal(false)}
        />
      )}

      {/* Fullscreen Proposal Map Modal */}
      <FullscreenProposalMapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        proposals={allProposals}
        currentProposalId={proposal.id}
        onProposalSelect={onProposalSelect}
      />
    </div>
  );
}
