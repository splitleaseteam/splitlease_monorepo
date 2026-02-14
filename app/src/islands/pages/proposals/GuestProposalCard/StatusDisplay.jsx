/**
 * Status Display Component
 *
 * Shows status-specific banner messages above the proposal card.
 * Banner is shown when usualOrder >= 3 OR status matches specific configurations.
 *
 * Based on Bubble documentation: Guest Proposals page Proposal Status Bar Conditionals
 */

import { PROPOSAL_STATUSES, shouldShowStatusBanner, getUsualOrder } from '../../../../logic/constants/proposalStatuses.js';

// ============================================================================
// STATUS BANNER CONFIGURATIONS
// ============================================================================

/**
 * Status banner configurations for different proposal states
 * Banner is shown when usualOrder >= 3 OR status is "Proposal Submitted by guest - Awaiting Rental Application"
 *
 * Cascading Override Pattern: If a status matches multiple configs, the more specific one wins.
 * Order of checks: specific status key lookup -> usualOrder-based defaults
 */
const STATUS_BANNERS = {
  // Specific status configurations (highest priority)
  [PROPOSAL_STATUSES.PROPOSAL_SUBMITTED_AWAITING_RENTAL_APP.key]: {
    text: 'Please complete your rental application.\nThe host will be able to act on your proposal only after your application is submitted.',
    bgColor: '#FBECEC',
    borderColor: '#CC0000',
    textColor: '#CC0000'
  },
  // Suggested proposals by Split Lease agent
  [PROPOSAL_STATUSES.SUGGESTED_PROPOSAL_AWAITING_RENTAL_APP.key]: {
    type: 'suggested',
    text: 'Suggested Proposal — Complete Your Application\nYou confirmed this suggestion. Please submit your rental application to proceed.',
    bgColor: '#F3E8FF',
    borderColor: '#4B0082',
    textColor: '#4B0082'
  },
  [PROPOSAL_STATUSES.SUGGESTED_PROPOSAL_PENDING_CONFIRMATION.key]: {
    type: 'suggested',
    text: '⚡ Pending Your Acceptance\nA Split Lease Agent suggested this listing for you. Review and confirm to proceed.',
    bgColor: '#FEF3C7',
    borderColor: '#D97706',
    textColor: '#92400E'
  },
  [PROPOSAL_STATUSES.RENTAL_APP_SUBMITTED.key]: {
    text: 'Application Submitted!\nAwaiting host review.',
    bgColor: '#EBF5FF',
    borderColor: '#3B82F6',
    textColor: '#1D4ED8'
  },
  [PROPOSAL_STATUSES.COUNTEROFFER_SUBMITTED_AWAITING_GUEST_REVIEW.key]: {
    text: 'Host has submitted a counteroffer.\nReview the new terms below.',
    bgColor: '#FEF3C7',
    borderColor: '#F59E0B',
    textColor: '#92400E'
  },
  // usualOrder >= 3: Accepted states - text varies based on counteroffer
  [PROPOSAL_STATUSES.PROPOSAL_OR_COUNTEROFFER_ACCEPTED.key]: {
    type: 'accepted',
    text: 'Proposal Accepted!\nSplit Lease is Drafting Lease Documents',
    // Alternative text when counteroffer: 'Host terms Accepted!\nLease Documents being prepared.'
    bgColor: '#E1FFE1',
    borderColor: '#1E561A',
    textColor: '#1BA54E'
  },
  [PROPOSAL_STATUSES.REVIEWING_DOCUMENTS.key]: {
    text: 'Documents Ready for Review',
    bgColor: '#EBF5FF',
    borderColor: '#3B82F6',
    textColor: '#1D4ED8'
  },
  [PROPOSAL_STATUSES.LEASE_DOCUMENTS_SENT_FOR_REVIEW.key]: {
    text: 'Lease Documents Draft prepared.\nPlease review and comment.',
    bgColor: '#E1FFE1',
    borderColor: '#1E561A',
    textColor: '#1BA54E'
  },
  [PROPOSAL_STATUSES.LEASE_DOCUMENTS_SENT_FOR_SIGNATURES.key]: {
    text: 'Check your email for legally submitted documents.',
    bgColor: '#E1FFE1',
    borderColor: '#1E561A',
    textColor: '#1BA54E'
  },
  [PROPOSAL_STATUSES.LEASE_DOCUMENTS_SIGNED_AWAITING_PAYMENT.key]: {
    text: 'Lease Documents signed.\nSubmit payment to activate your lease.',
    bgColor: '#E1FFE1',
    borderColor: '#1E561A',
    textColor: '#1BA54E'
  },
  // Legacy key format
  [PROPOSAL_STATUSES.LEASE_SIGNED_AWAITING_INITIAL_PAYMENT.key]: {
    text: 'Lease Signed!\nSubmit initial payment to activate.',
    bgColor: '#E1FFE1',
    borderColor: '#1E561A',
    textColor: '#1BA54E'
  },
  [PROPOSAL_STATUSES.INITIAL_PAYMENT_SUBMITTED_LEASE_ACTIVATED.key]: {
    text: 'Your lease agreement is now officially signed.\nFor details, please visit the lease section of your account.',
    bgColor: '#E1FFE1',
    borderColor: '#1E561A',
    textColor: '#1BA54E'
  },
  // Terminal states
  [PROPOSAL_STATUSES.CANCELLED_BY_SPLITLEASE.key]: {
    type: 'cancelled',
    bgColor: '#FBECEC',
    borderColor: '#D34337',
    textColor: '#CC0000'
  },
  [PROPOSAL_STATUSES.CANCELLED_BY_GUEST.key]: {
    type: 'cancelled_by_guest',
    bgColor: '#F3F4F6',
    borderColor: '#9CA3AF',
    textColor: '#6B7280'
  },
  [PROPOSAL_STATUSES.REJECTED_BY_HOST.key]: {
    type: 'rejected',
    bgColor: '#FBECEC',
    borderColor: '#D34337',
    textColor: '#CC0000'
  },
  [PROPOSAL_STATUSES.EXPIRED.key]: {
    text: 'This proposal has expired.',
    bgColor: '#F3F4F6',
    borderColor: '#9CA3AF',
    textColor: '#6B7280'
  }
};

/**
 * Default banner config based on usualOrder (fallback when no specific config)
 */
function getDefaultBannerConfig(status, usualOrder) {
  // Default blue banner for active statuses with usualOrder >= 3
  if (usualOrder >= 3 && usualOrder < 99) {
    return {
      text: status,
      bgColor: '#EBF5FF',
      borderColor: '#3B82F6',
      textColor: '#1D4ED8'
    };
  }
  return null;
}

/**
 * Get status icon for the banner
 */
function getStatusIcon(config) {
  if (config.type === 'cancelled' || config.type === 'rejected' || config.type === 'cancelled_by_guest') {
    return '✕';
  }
  if (config.type === 'accepted') {
    return '✓';
  }
  if (config.type === 'suggested') {
    return '💡';
  }
  // Default icons based on color
  if (config.bgColor === '#FBECEC' || config.borderColor === '#CC0000') {
    return '!';
  }
  if (config.bgColor === '#ecfdf5' || config.bgColor?.includes('ecfdf5')) {
    return '✓';
  }
  return 'i';
}

/**
 * Get banner variant class
 */
function getBannerVariant(config) {
  if (config.type === 'cancelled' || config.type === 'rejected' || config.type === 'cancelled_by_guest') {
    return 'cancelled';
  }
  if (config.type === 'accepted' || config.bgColor === '#ecfdf5') {
    return 'success';
  }
  if (config.bgColor === '#fef3c7') {
    return 'attention';
  }
  return '';
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function StatusDisplay({ status, cancelReason, isCounteroffer }) {
  // Normalize status for lookup (handle trailing spaces from Bubble)
  const normalizedStatus = typeof status === 'string' ? status.trim() : status;

  // Check if banner should be shown based on usualOrder >= 3 OR specific status
  if (!shouldShowStatusBanner(normalizedStatus)) return null;

  // Get specific config or fall back to default
  let config = STATUS_BANNERS[normalizedStatus];
  if (!config) {
    const usualOrder = getUsualOrder(normalizedStatus);
    config = getDefaultBannerConfig(normalizedStatus, usualOrder);
  }

  if (!config) return null;

  const displayText = config.text;
  let strongText = '';
  let detailText = '';

  // Handle different banner types
  switch (config.type) {
    case 'cancelled':
      // Hide banner entirely if no reason is provided for Split Lease cancellation
      if (!cancelReason) return null;
      strongText = 'Proposal Cancelled by Split Lease';
      detailText = `Reason: ${cancelReason}`;
      break;
    case 'cancelled_by_guest':
      strongText = 'Proposal Cancelled';
      detailText = cancelReason ? `Reason: ${cancelReason}` : 'You cancelled this proposal.';
      break;
    case 'rejected':
      strongText = 'Proposal Declined';
      detailText = cancelReason ? `Reason: ${cancelReason}` : 'This proposal was declined by the host.';
      break;
    case 'accepted':
      strongText = isCounteroffer ? 'Host terms Accepted' : 'Proposal Accepted';
      detailText = 'Lease Documents being prepared.';
      break;
    case 'suggested':
      strongText = 'Suggested Proposal';
      detailText = 'This proposal was suggested by a Split Lease Agent on your behalf.';
      break;
    default:
      // Parse text for strong/detail parts
      if (displayText && displayText.includes('\n')) {
        const parts = displayText.split('\n');
        strongText = parts[0];
        detailText = parts.slice(1).join(' ');
      } else {
        strongText = displayText || '';
      }
      break;
  }

  const icon = getStatusIcon(config);
  const variant = getBannerVariant(config);

  return (
    <div className={`status-banner ${variant}`}>
      <span className="status-icon">{icon}</span>
      <div className="status-text">
        <strong>{strongText}</strong>
        {detailText && ` — ${detailText}`}
      </div>
    </div>
  );
}
