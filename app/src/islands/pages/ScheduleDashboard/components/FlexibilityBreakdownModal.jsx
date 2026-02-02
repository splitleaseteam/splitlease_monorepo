/**
 * Flexibility Breakdown Modal Component
 *
 * Displays a detailed comparison of flexibility scores between
 * the current user and their roommate, including:
 * - Visual score comparison (side-by-side bars)
 * - Breakdown of driving factors (response time, approval rate, etc.)
 * - Helpful summary text
 */

import React from 'react';
import PropTypes from 'prop-types';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get score label based on numeric score
 */
function getScoreLabel(score) {
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Very Flexible';
  if (score >= 5) return 'Flexible';
  if (score >= 3) return 'Moderate';
  return 'Less Flexible';
}

/**
 * Get percentile text (mock implementation)
 */
function getPercentileText(score) {
  if (score >= 9) return 'Top 5% of flexible roommates!';
  if (score >= 8) return 'Top 10% of flexible roommates!';
  if (score >= 7) return 'Top 25% of flexible roommates!';
  if (score >= 5) return 'Average flexibility level';
  return 'Below average flexibility';
}

/**
 * Compare two metric values and determine which is better
 * @returns 'better' | 'worse' | 'equal'
 */
function compareMetrics(userValue, roommateValue, lowerIsBetter = false) {
  const userNum = parseFloat(userValue) || 0;
  const roommateNum = parseFloat(roommateValue) || 0;

  if (lowerIsBetter) {
    if (userNum < roommateNum) return 'better';
    if (userNum > roommateNum) return 'worse';
    return 'equal';
  }

  if (userNum > roommateNum) return 'better';
  if (userNum < roommateNum) return 'worse';
  return 'equal';
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Score Comparison Bar
 */
function ScoreBar({ label, score, maxScore = 10, isUser = false }) {
  const percentage = (score / maxScore) * 100;

  return (
    <div className={`flexibility-modal__score-bar ${isUser ? 'flexibility-modal__score-bar--user' : ''}`}>
      <div className="flexibility-modal__score-bar-header">
        <span className="flexibility-modal__score-bar-label">{label}</span>
        <span className="flexibility-modal__score-bar-value">{score}/{maxScore}</span>
      </div>
      <div className="flexibility-modal__score-bar-track">
        <div
          className="flexibility-modal__score-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="flexibility-modal__score-bar-text">{getScoreLabel(score)}</span>
    </div>
  );
}

/**
 * Metric Comparison Row
 */
function MetricRow({ label, userValue, roommateValue, lowerIsBetter = false }) {
  const comparison = compareMetrics(userValue, roommateValue, lowerIsBetter);

  return (
    <div className="flexibility-modal__metric-row">
      <span className="flexibility-modal__metric-label">{label}</span>
      <span className={`flexibility-modal__metric-value flexibility-modal__metric-value--${comparison}`}>
        {userValue}
        {comparison === 'better' && <span className="flexibility-modal__metric-icon">&#x2713;</span>}
        {comparison === 'worse' && <span className="flexibility-modal__metric-icon flexibility-modal__metric-icon--warn">&#x26A0;</span>}
      </span>
      <span className="flexibility-modal__metric-vs">vs</span>
      <span className="flexibility-modal__metric-value flexibility-modal__metric-value--roommate">
        {roommateValue}
      </span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FlexibilityBreakdownModal({
  isOpen,
  onClose,
  userScore,
  roommateScore,
  roommateName = 'Roommate',
  flexibilityMetrics
}) {
  if (!isOpen) return null;

  const userMetrics = flexibilityMetrics?.user || {};
  const roommateMetrics = flexibilityMetrics?.roommate || {};

  return (
    <div className="flexibility-modal__overlay" onClick={onClose}>
      <div
        className="flexibility-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="flexibility-modal-title"
      >
        {/* Header */}
        <div className="flexibility-modal__header">
          <h2 id="flexibility-modal-title" className="flexibility-modal__title">
            Flexibility Score Breakdown
          </h2>
          <button
            type="button"
            className="flexibility-modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flexibility-modal__body">
          {/* Section 1: Score Comparison */}
          <div className="flexibility-modal__section">
            <h3 className="flexibility-modal__section-title">Score Comparison</h3>

            <div className="flexibility-modal__scores">
              <ScoreBar
                label="You"
                score={userScore}
                isUser={true}
              />
              <ScoreBar
                label={roommateName}
                score={roommateScore}
              />
            </div>

            <p className="flexibility-modal__summary">
              {userScore >= roommateScore
                ? getPercentileText(userScore)
                : `${roommateName} has a slightly higher flexibility score.`
              }
            </p>
          </div>

          {/* Section 2: The Drivers */}
          <div className="flexibility-modal__section">
            <h3 className="flexibility-modal__section-title">What Drives These Scores?</h3>

            <div className="flexibility-modal__metrics">
              <div className="flexibility-modal__metrics-header">
                <span></span>
                <span className="flexibility-modal__metrics-header-you">You</span>
                <span></span>
                <span className="flexibility-modal__metrics-header-roommate">{roommateName}</span>
              </div>

              <MetricRow
                label="Response Time"
                userValue={userMetrics.responseTime || 'N/A'}
                roommateValue={roommateMetrics.responseTime || 'N/A'}
                lowerIsBetter={true}
              />

              <MetricRow
                label="Approval Rate"
                userValue={userMetrics.approvalRate || 'N/A'}
                roommateValue={roommateMetrics.approvalRate || 'N/A'}
              />

              <MetricRow
                label="Nights Offered"
                userValue={userMetrics.nightsOffered?.toString() || '0'}
                roommateValue={roommateMetrics.nightsOffered?.toString() || '0'}
              />

              <MetricRow
                label="Cancellations"
                userValue={userMetrics.cancellations?.toString() || '0'}
                roommateValue={roommateMetrics.cancellations?.toString() || '0'}
                lowerIsBetter={true}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flexibility-modal__footer">
          <button
            type="button"
            className="flexibility-modal__btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

FlexibilityBreakdownModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userScore: PropTypes.number,
  roommateScore: PropTypes.number,
  roommateName: PropTypes.string,
  flexibilityMetrics: PropTypes.shape({
    user: PropTypes.shape({
      responseTime: PropTypes.string,
      approvalRate: PropTypes.string,
      nightsOffered: PropTypes.number,
      cancellations: PropTypes.number
    }),
    roommate: PropTypes.shape({
      responseTime: PropTypes.string,
      approvalRate: PropTypes.string,
      nightsOffered: PropTypes.number,
      cancellations: PropTypes.number
    })
  })
};
