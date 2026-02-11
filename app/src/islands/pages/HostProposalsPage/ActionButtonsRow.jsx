/**
 * ActionButtonsRow Component (V7 Design)
 *
 * Context-sensitive action buttons based on proposal status:
 * - New: Accept (green), Modify (outline), Decline (danger)
 * - Guest Counter: Accept Counter, Counter Again, Decline
 * - Accepted: Remind Guest (primary), Schedule Meeting, Message
 * - Host Counter: Edit Counter, Message, Withdraw
 * - Declined: Remove only
 *
 * Part of the Host Proposals V7 redesign.
 */
import {
  Check,
  SlidersHorizontal,
  X,
  Repeat,
  Bell,
  Video,
  MessageCircle,
  Pencil,
  XCircle,
  Trash2
} from 'lucide-react';
import { PROPOSAL_STATUSES } from '../../../logic/constants/proposalStatuses.js';

/**
 * Get the status key from a proposal
 * @param {Object} proposal - The proposal object
 * @returns {string} The status key
 */
function getStatusKey(proposal) {
  const status = proposal?.status;
  if (!status) return '';
  if (typeof status === 'string') return status;
  return status.id || status._id || status.key || '';
}

/**
 * Check if proposal has guest counteroffer
 * @param {Object} proposal - The proposal object
 * @returns {boolean} True if has guest counteroffer
 */
function hasGuestCounteroffer(proposal) {
  if (proposal?.has_guest_counteroffer) return true;
  if (proposal?.guest_counteroffer) return true;
  const statusKey = getStatusKey(proposal);
  if (
    proposal?.last_modified_by === 'guest' &&
    (statusKey === 'host_review' || statusKey === 'proposal_submitted')
  ) {
    return true;
  }
  return false;
}

/**
 * Check if proposal is awaiting rental application submission from guest
 * @param {string} statusKey - The status key
 * @returns {boolean} True if awaiting rental app
 */
function isAwaitingRentalApp(statusKey) {
  return statusKey === PROPOSAL_STATUSES.PROPOSAL_SUBMITTED_AWAITING_RENTAL_APP.key ||
         statusKey === PROPOSAL_STATUSES.SUGGESTED_PROPOSAL_AWAITING_RENTAL_APP.key;
}

/**
 * ActionButtonsRow displays context-sensitive action buttons
 *
 * @param {Object} props
 * @param {Object} props.proposal - The proposal object
 * @param {Function} props.onAccept - Accept proposal callback
 * @param {Function} props.onModify - Modify/counter proposal callback
 * @param {Function} props.onDecline - Decline proposal callback
 * @param {Function} props.onRemindGuest - Remind guest callback
 * @param {Function} props.onMessage - Message guest callback
 * @param {Function} props.onScheduleMeeting - Schedule meeting callback
 * @param {Function} props.onEditCounter - Edit counteroffer callback
 * @param {Function} props.onWithdraw - Withdraw counteroffer callback
 * @param {Function} props.onRemove - Remove proposal callback
 * @param {Function} props.onRequestRentalApp - Request rental app reminder callback
 */
export function ActionButtonsRow({
  proposal,
  onAccept,
  onModify,
  onDecline,
  onRemindGuest,
  onMessage,
  onScheduleMeeting,
  onEditCounter,
  onWithdraw,
  onRemove,
  onRequestRentalApp
}) {
  const statusKey = getStatusKey(proposal);
  const isGuestCounter = hasGuestCounteroffer(proposal);

  // Guest Counteroffer - needs host response
  if (isGuestCounter) {
    return (
      <div className="hp7-actions-row">
        <button
          type="button"
          className="hp7-btn hp7-btn-success"
          onClick={onAccept}
        >
          <Check size={14} />
          Accept Counter
        </button>
        <button
          type="button"
          className="hp7-btn hp7-btn-outline"
          onClick={onModify}
        >
          <Repeat size={14} />
          Counter Again
        </button>
        <button
          type="button"
          className="hp7-btn hp7-btn-danger"
          onClick={onDecline}
        >
          <X size={14} />
          Decline
        </button>
      </div>
    );
  }

  // Awaiting Rental Application - host can accept, modify, or decline (post-BUG-001 fix)
  if (isAwaitingRentalApp(statusKey)) {
    return (
      <div className="hp7-actions-row">
        <button
          type="button"
          className="hp7-btn hp7-btn-success"
          onClick={onAccept}
        >
          <Check size={14} />
          Accept
        </button>
        <button
          type="button"
          className="hp7-btn hp7-btn-outline"
          onClick={onModify}
        >
          <SlidersHorizontal size={14} />
          Modify
        </button>
        <button
          type="button"
          className="hp7-btn hp7-btn-danger"
          onClick={onDecline}
        >
          <X size={14} />
          Decline
        </button>
        <button
          type="button"
          className="hp7-btn hp7-btn-ghost"
          onClick={onMessage}
        >
          <MessageCircle size={14} />
          Message
        </button>
      </div>
    );
  }

  // New proposal - needs review (match full Bubble status text)
  if (statusKey === 'proposal_submitted' ||
      statusKey === 'host_review' ||
      statusKey === PROPOSAL_STATUSES.HOST_REVIEW.key ||
      statusKey === PROPOSAL_STATUSES.RENTAL_APP_SUBMITTED.key) {
    return (
      <div className="hp7-actions-row">
        <button
          type="button"
          className="hp7-btn hp7-btn-success"
          onClick={onAccept}
        >
          <Check size={14} />
          Accept
        </button>
        <button
          type="button"
          className="hp7-btn hp7-btn-outline"
          onClick={onModify}
        >
          <SlidersHorizontal size={14} />
          Modify
        </button>
        <button
          type="button"
          className="hp7-btn hp7-btn-danger"
          onClick={onDecline}
        >
          <X size={14} />
          Decline
        </button>
      </div>
    );
  }

  // Host counteroffer - waiting for guest (match full Bubble status text)
  if (statusKey === 'host_counteroffer' ||
      statusKey === PROPOSAL_STATUSES.COUNTEROFFER_SUBMITTED_AWAITING_GUEST_REVIEW.key) {
    return (
      <div className="hp7-actions-row">
        <button
          type="button"
          className="hp7-btn hp7-btn-ghost"
          onClick={onEditCounter}
        >
          <Pencil size={14} />
          Edit Counter
        </button>
        <button
          type="button"
          className="hp7-btn hp7-btn-ghost"
          onClick={onMessage}
        >
          <MessageCircle size={14} />
          Message
        </button>
        <button
          type="button"
          className="hp7-btn hp7-btn-danger"
          onClick={onWithdraw}
        >
          <XCircle size={14} />
          Withdraw
        </button>
      </div>
    );
  }

  // Accepted - in progress (match full Bubble status text)
  if (statusKey === 'accepted' ||
      statusKey.startsWith('lease_') ||
      statusKey === PROPOSAL_STATUSES.PROPOSAL_OR_COUNTEROFFER_ACCEPTED.key ||
      statusKey.startsWith('Lease Documents ') ||
      statusKey === PROPOSAL_STATUSES.REVIEWING_DOCUMENTS.key) {
    return (
      <div className="hp7-actions-row">
        <button
          type="button"
          className="hp7-btn hp7-btn-primary"
          onClick={onRemindGuest}
        >
          <Bell size={14} />
          Remind Guest
        </button>
        <button
          type="button"
          className="hp7-btn hp7-btn-outline"
          onClick={onScheduleMeeting}
        >
          <Video size={14} />
          Schedule Meeting
        </button>
        <button
          type="button"
          className="hp7-btn hp7-btn-ghost"
          onClick={onMessage}
        >
          <MessageCircle size={14} />
          Message
        </button>
      </div>
    );
  }

  // Declined/Cancelled - remove only (match full Bubble status text)
  if (
    statusKey === 'rejected_by_host' ||
    statusKey === 'cancelled_by_guest' ||
    statusKey === 'cancelled_by_splitlease' ||
    statusKey === PROPOSAL_STATUSES.REJECTED_BY_HOST.key ||
    statusKey === PROPOSAL_STATUSES.CANCELLED_BY_GUEST.key ||
    statusKey === PROPOSAL_STATUSES.CANCELLED_BY_SPLITLEASE.key
  ) {
    return (
      <div className="hp7-actions-row">
        <button
          type="button"
          className="hp7-btn hp7-btn-ghost"
          onClick={onRemove}
        >
          <Trash2 size={14} />
          Remove
        </button>
      </div>
    );
  }

  // Active lease - message only (match full Bubble status text)
  if (statusKey === 'payment_submitted' ||
      statusKey === PROPOSAL_STATUSES.INITIAL_PAYMENT_SUBMITTED_LEASE_ACTIVATED.key) {
    return (
      <div className="hp7-actions-row">
        <button
          type="button"
          className="hp7-btn hp7-btn-primary"
          onClick={onMessage}
        >
          <MessageCircle size={14} />
          Message Guest
        </button>
      </div>
    );
  }

  // Default fallback
  return (
    <div className="hp7-actions-row">
      <button
        type="button"
        className="hp7-btn hp7-btn-ghost"
        onClick={onMessage}
      >
        <MessageCircle size={14} />
        Message
      </button>
    </div>
  );
}

export default ActionButtonsRow;
