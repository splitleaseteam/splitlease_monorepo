/**
 * ProgressTrackerV7 Component (V7 Design)
 *
 * Horizontal progress steps for ALL proposals (matches guest proposals page):
 * - Steps: Proposal submitted → Rental App Submitted → Edit/Review Proposal → Review Documents → Lease documents → Initial Payment
 * - Completed steps: purple dot + line
 * - Current step: green dot
 * - Future steps: gray dot + line
 * - Terminal (cancelled/rejected): red dot
 *
 * Part of the Host Proposals V7 redesign.
 */
import React from 'react';
import { getStatusConfig, isCompletedStatus } from '../../../logic/constants/proposalStatuses.js';

/**
 * Progress stages matching guest proposals page
 */
const PROGRESS_STAGES = ['Proposal submitted', 'Rental App Submitted', 'Edit/Review Proposal', 'Review Documents', 'Lease documents', 'Initial Payment'];

/**
 * Progress bar colors matching guest proposals
 */
const PROGRESS_COLORS = {
  purple: '#6D31C2',
  green: '#1F8E16',
  red: '#DB2E2E',
  gray: '#DEDEDE',
  labelGray: '#9CA3AF'
};

/**
 * Check if status is terminal (cancelled/rejected)
 * @param {string} statusId - The status ID
 * @returns {boolean} True if terminal
 */
function isTerminalStatus(statusId) {
  const terminalStatuses = [
    'rejected_by_host',
    'cancelled_by_guest',
    'cancelled_by_splitlease'
  ];
  return terminalStatuses.includes(statusId);
}

/**
 * Calculate stage color based on status
 * Matches guest proposals logic for visual consistency
 */
function getStageColor(stageIndex, status, usualOrder, isTerminal, proposal = {}) {
  if (isTerminal) return PROGRESS_COLORS.red;

  const normalizedStatus = typeof status === 'string' ? status.trim() : status;
  const hasRentalApp = proposal?.['rental application'] || proposal?.rental_application;

  // Stage 1: Submitted - Always purple (completed)
  if (stageIndex === 0) return PROGRESS_COLORS.purple;

  // Stage 2: Application
  if (stageIndex === 1) {
    if (normalizedStatus?.includes('Awaiting Rental Application') ||
        normalizedStatus?.includes('Pending')) {
      return PROGRESS_COLORS.green;
    }
    if (hasRentalApp || usualOrder >= 1) {
      return PROGRESS_COLORS.purple;
    }
    return PROGRESS_COLORS.gray;
  }

  // Stage 3: Host Review
  if (stageIndex === 2) {
    if (normalizedStatus === 'Host Review' ||
        normalizedStatus?.includes('host_review') ||
        normalizedStatus?.includes('Counteroffer')) {
      return PROGRESS_COLORS.green;
    }
    if (usualOrder >= 3) return PROGRESS_COLORS.purple;
    return PROGRESS_COLORS.gray;
  }

  // Stage 4: Accepted
  if (stageIndex === 3) {
    if (normalizedStatus?.includes('Documents Sent for Review') ||
        normalizedStatus?.includes('accepted')) {
      return PROGRESS_COLORS.green;
    }
    if (usualOrder >= 4) return PROGRESS_COLORS.purple;
    return PROGRESS_COLORS.gray;
  }

  // Stage 5: Signing
  if (stageIndex === 4) {
    if (normalizedStatus?.includes('Signatures') ||
        normalizedStatus?.includes('Signed')) {
      return PROGRESS_COLORS.green;
    }
    if (usualOrder >= 5) return PROGRESS_COLORS.purple;
    return PROGRESS_COLORS.gray;
  }

  // Stage 6: Active
  if (stageIndex === 5) {
    if (normalizedStatus?.includes('Awaiting Initial payment') ||
        normalizedStatus?.includes('Awaiting Initial Payment') ||
        normalizedStatus?.includes('payment')) {
      return PROGRESS_COLORS.green;
    }
    if (isCompletedStatus(normalizedStatus)) return PROGRESS_COLORS.purple;
    return PROGRESS_COLORS.gray;
  }

  return PROGRESS_COLORS.gray;
}

/**
 * ProgressTrackerV7 displays the proposal progress for all proposals
 * Now matches guest proposals page behavior (always visible)
 *
 * @param {Object} props
 * @param {Object} props.proposal - The proposal object
 */
export function ProgressTrackerV7({ proposal }) {
  // Get status from proposal (handle different field names)
  const rawStatus = proposal?.status || proposal?.Status;
  const statusId = typeof rawStatus === 'string'
    ? rawStatus
    : (rawStatus?.id || rawStatus?._id || '');

  // Get status config for usualOrder
  const statusConfig = getStatusConfig(statusId);
  const usualOrder = statusConfig?.usualOrder ?? 0;
  const isTerminal = isTerminalStatus(statusId);

  // Calculate current step for screen readers
  const currentStep = Math.min(usualOrder + 1, PROGRESS_STAGES.length);

  return (
    <div
      className="hp7-progress-row"
      role="progressbar"
      aria-label="Proposal progress"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={PROGRESS_STAGES.length}
      aria-valuetext={`Step ${currentStep} of ${PROGRESS_STAGES.length}: ${PROGRESS_STAGES[currentStep - 1] || PROGRESS_STAGES[0]}`}
    >
      {PROGRESS_STAGES.map((label, index) => {
        const stageColor = getStageColor(index, statusId, usualOrder, isTerminal, proposal);
        const isLast = index === PROGRESS_STAGES.length - 1;
        const isCompleted = index < usualOrder;
        const isCurrent = index === usualOrder;

        return (
          <div key={index} className="hp7-progress-step">
            <div
              className="hp7-progress-dot"
              style={{ backgroundColor: stageColor }}
              aria-hidden="true"
            />
            <span
              className="hp7-progress-label"
              style={{ color: stageColor !== PROGRESS_COLORS.gray ? stageColor : PROGRESS_COLORS.labelGray }}
              aria-label={`${label}${isCompleted ? ', completed' : isCurrent ? ', current step' : ''}`}
            >
              {label}
            </span>
            {!isLast && (
              <div
                className="hp7-progress-line"
                style={{ backgroundColor: stageColor === PROGRESS_COLORS.purple ? PROGRESS_COLORS.purple : PROGRESS_COLORS.gray }}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ProgressTrackerV7;
