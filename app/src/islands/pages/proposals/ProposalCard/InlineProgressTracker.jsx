/**
 * Inline Progress Tracker Component
 *
 * Horizontal timeline showing proposal progress through stages.
 * Each stage has a colored dot and label based on the current proposal status.
 *
 * Stages: Proposal Submitted -> Rental App -> Host Review -> Review Documents -> Lease Documents -> Initial Payment
 *
 * Color logic based on Bubble documentation: Guest Proposals page Progress Bar Status Conditionals
 */

import { PROPOSAL_STATUSES, isCompletedStatus } from '../../../../logic/constants/proposalStatuses.js';

// ============================================================================
// STAGE CONFIGURATION
// ============================================================================

const PROGRESS_STAGES = [
  { id: 1, label: 'Proposal Submitted' },
  { id: 2, label: 'Rental App Submitted' },
  { id: 3, label: 'Host Review' },
  { id: 4, label: 'Review Documents' },
  { id: 5, label: 'Lease Documents' },
  { id: 6, label: 'Initial Payment' }
];

/**
 * Color constants for progress tracker
 * Based on Bubble documentation: Guest Proposals page Progress Bar Status Conditionals
 */
const PROGRESS_COLORS = {
  purple: '#6D31C2',    // Completed stage
  green: '#1F8E16',     // Current/Active stage (action needed)
  red: '#DB2E2E',       // Cancelled/Rejected
  lightPurple: '#B6B7E9', // Pending/Waiting state
  gray: '#DEDEDE',      // Inactive/Future stage
  labelGray: '#9CA3AF'  // Inactive label color
};

// ============================================================================
// STAGE LABEL LOGIC
// ============================================================================

/**
 * Get dynamic stage labels based on status and rental app submission state
 * Labels change to reflect completion (e.g., "Host Review" -> "Host Review Complete")
 * Stage 2 shows "Submit Rental Application" when rental app not submitted
 *
 * @param {string} status - Proposal status
 * @param {Object} proposal - Proposal object to check rental application status
 */
export function getStageLabels(status, proposal = {}) {
  // Check if rental application is submitted by checking the proposal and user
  const hasRentalApp = proposal.rental_application || proposal?.user?.rental_application;

  const baseLabels = [
    'Proposal Submitted',
    hasRentalApp ? 'Rental App Submitted' : 'Submit Rental Application',
    'Host Review',
    'Review Documents',
    'Lease Documents',
    'Initial Payment'
  ];

  if (!status) return baseLabels;

  // Normalize status for comparison
  const normalizedStatus = typeof status === 'string' ? status.trim() : status;

  // Customize based on status
  if (normalizedStatus.includes('Accepted') || normalizedStatus.includes('Drafting')) {
    baseLabels[2] = 'Host Review Complete';
    baseLabels[3] = 'Drafting Lease Docs';
  }

  if (normalizedStatus.includes('Counteroffer')) {
    baseLabels[2] = 'Counteroffer Pending';
  }

  if (normalizedStatus.includes('Lease Documents Sent')) {
    baseLabels[2] = 'Host Review Complete';
    baseLabels[3] = 'Docs Reviewed';
  }

  if (normalizedStatus.includes('Payment Submitted') || normalizedStatus.includes('activated')) {
    baseLabels[2] = 'Host Review Complete';
    baseLabels[3] = 'Docs Reviewed';
    baseLabels[4] = 'Lease Signed';
  }

  return baseLabels;
}

// ============================================================================
// STAGE COLOR LOGIC
// ============================================================================

/**
 * Per-stage color calculation based on Bubble documentation
 * Each stage has specific conditions for being green (active), purple (completed), or red (terminal)
 *
 * @param {number} stageIndex - 0-indexed stage number
 * @param {string} status - Proposal status
 * @param {number} usualOrder - The usual order from status config
 * @param {boolean} isTerminal - Whether proposal is cancelled/rejected
 * @param {Object} proposal - Full proposal object for additional field checks
 * @returns {string} Hex color for the stage
 */
function getStageColor(stageIndex, status, usualOrder, isTerminal, proposal = {}) {
  // Terminal statuses: ALL stages turn red
  if (isTerminal) {
    return PROGRESS_COLORS.red;
  }

  const normalizedStatus = typeof status === 'string' ? status.trim() : status;
  const hasRentalApp = proposal.rental_application;
  const guestDocsFinalized = proposal.is_finalized;

  // Stage 1: Proposal Submitted - Always purple (completed) once proposal exists
  if (stageIndex === 0) {
    return PROGRESS_COLORS.purple;
  }

  // Stage 2: Rental App Submitted
  if (stageIndex === 1) {
    // Green when awaiting rental app - these statuses mean rental app is NOT yet submitted
    if (normalizedStatus === PROPOSAL_STATUSES.PROPOSAL_SUBMITTED_AWAITING_RENTAL_APP.key.trim() ||
        normalizedStatus === PROPOSAL_STATUSES.SUGGESTED_PROPOSAL_AWAITING_RENTAL_APP.key.trim() ||
        normalizedStatus === PROPOSAL_STATUSES.SUGGESTED_PROPOSAL_PENDING_CONFIRMATION.key.trim() ||
        normalizedStatus === PROPOSAL_STATUSES.PENDING.key.trim() ||
        normalizedStatus === PROPOSAL_STATUSES.PENDING_CONFIRMATION.key.trim()) {
      return PROGRESS_COLORS.green;
    }
    // Purple when rental app has been submitted (status moved past awaiting rental app)
    if (hasRentalApp ||
        normalizedStatus === PROPOSAL_STATUSES.RENTAL_APP_SUBMITTED.key.trim() ||
        normalizedStatus === PROPOSAL_STATUSES.HOST_REVIEW.key.trim() ||
        normalizedStatus.includes('Counteroffer') ||
        normalizedStatus.includes('Accepted') ||
        normalizedStatus.includes('Lease Documents') ||
        normalizedStatus.includes('Payment') ||
        normalizedStatus.includes('activated')) {
      return PROGRESS_COLORS.purple;
    }
    return PROGRESS_COLORS.gray;
  }

  // Stage 3: Host Review
  if (stageIndex === 2) {
    // Green when actively in host review with rental app submitted
    if (normalizedStatus === PROPOSAL_STATUSES.HOST_REVIEW.key.trim() && hasRentalApp) {
      return PROGRESS_COLORS.green;
    }
    // Green when counteroffer awaiting review
    if (normalizedStatus === PROPOSAL_STATUSES.COUNTEROFFER_SUBMITTED_AWAITING_GUEST_REVIEW.key.trim()) {
      return PROGRESS_COLORS.green;
    }
    // Purple when host review is complete (proposal accepted or further along)
    if (normalizedStatus.includes('Accepted') ||
        normalizedStatus.includes('Drafting') ||
        normalizedStatus.includes('Lease Documents') ||
        normalizedStatus.includes('Payment') ||
        normalizedStatus.includes('activated')) {
      return PROGRESS_COLORS.purple;
    }
    // Gray for all other cases (including awaiting rental app)
    return PROGRESS_COLORS.gray;
  }

  // Stage 4: Review Documents
  if (stageIndex === 3) {
    // Green when lease documents sent for review
    if (normalizedStatus === PROPOSAL_STATUSES.LEASE_DOCUMENTS_SENT_FOR_REVIEW.key.trim()) {
      return PROGRESS_COLORS.green;
    }
    // Light purple when guest documents review finalized (waiting state)
    if (guestDocsFinalized) {
      return PROGRESS_COLORS.lightPurple;
    }
    // Purple when past this stage
    if (usualOrder >= 5) {
      return PROGRESS_COLORS.purple;
    }
    return PROGRESS_COLORS.gray;
  }

  // Stage 5: Lease Documents
  if (stageIndex === 4) {
    // Green when sent for signatures
    if (normalizedStatus === PROPOSAL_STATUSES.LEASE_DOCUMENTS_SENT_FOR_SIGNATURES.key.trim()) {
      return PROGRESS_COLORS.green;
    }
    // Purple when past this stage
    if (usualOrder >= 6) {
      return PROGRESS_COLORS.purple;
    }
    return PROGRESS_COLORS.gray;
  }

  // Stage 6: Initial Payment
  if (stageIndex === 5) {
    // Green when awaiting initial payment
    if (normalizedStatus === PROPOSAL_STATUSES.LEASE_DOCUMENTS_SIGNED_AWAITING_PAYMENT.key.trim() ||
        normalizedStatus === PROPOSAL_STATUSES.LEASE_SIGNED_AWAITING_INITIAL_PAYMENT.key.trim()) {
      return PROGRESS_COLORS.green;
    }
    // Purple when lease activated
    if (isCompletedStatus(normalizedStatus)) {
      return PROGRESS_COLORS.purple;
    }
    return PROGRESS_COLORS.gray;
  }

  return PROGRESS_COLORS.gray;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function InlineProgressTracker({ status, usualOrder = 0, isTerminal = false, stageLabels = null, proposal = {} }) {
  const labels = stageLabels || PROGRESS_STAGES.map(s => s.label);

  return (
    <div className="progress-row">
      {PROGRESS_STAGES.map((stage, index) => {
        const stageColor = getStageColor(index, status, usualOrder, isTerminal, proposal);
        const prevStageColor = index > 0 ? getStageColor(index - 1, status, usualOrder, isTerminal, proposal) : null;
        const isCurrent = stageColor === PROGRESS_COLORS.current;
        const isCompleted = stageColor === PROGRESS_COLORS.completed;
        const isCancelled = stageColor === PROGRESS_COLORS.cancelled;

        // Connector color: completed (primary purple) ONLY if previous dot is completed
        const _connectorColor = prevStageColor === PROGRESS_COLORS.completed
          ? PROGRESS_COLORS.completed
          : prevStageColor === PROGRESS_COLORS.cancelled
            ? PROGRESS_COLORS.cancelled
            : PROGRESS_COLORS.future;

        // Determine step state class
        let stepClass = 'progress-step';
        if (isCompleted) stepClass += ' completed';
        if (isCurrent) stepClass += ' current';
        if (isCancelled) stepClass += ' cancelled';

        const labelColor = stageColor !== PROGRESS_COLORS.future ? stageColor : PROGRESS_COLORS.labelGray;

        return (
          <div key={stage.id} className={stepClass}>
            <div
              className="progress-dot"
              style={{
                backgroundColor: stageColor,
                ...(isCurrent && { boxShadow: '0 0 0 4px rgba(109, 49, 194, 0.15)' })
              }}
            />
            <span className="progress-label" style={{ color: labelColor }}>
              {labels[index] || stage.label}
            </span>
            {/* Connector line after label (except last) */}
            {index < PROGRESS_STAGES.length - 1 && (
              <div
                className="progress-line"
                style={{ backgroundColor: isCompleted ? PROGRESS_COLORS.completed : PROGRESS_COLORS.future }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
