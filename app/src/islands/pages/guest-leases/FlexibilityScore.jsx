/**
 * FlexibilityScore Component
 *
 * Displays the guest's flexibility score and reputation information.
 * Score is based on date change request history.
 */

import { Award, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import './FlexibilityScore.css';

/**
 * Calculate flexibility score based on date change requests
 * This is a simplified implementation - actual logic may be more complex
 */
function calculateFlexibilityScore(dateChangeRequests = []) {
  if (dateChangeRequests.length === 0) {
    return { score: 100, trend: 'neutral', label: 'Excellent' };
  }

  // Count accepted vs rejected requests
  const accepted = dateChangeRequests.filter(r => r.requestStatus === 'accepted').length;
  const rejected = dateChangeRequests.filter(r => r.requestStatus === 'rejected').length;
  const total = accepted + rejected;

  if (total === 0) {
    return { score: 100, trend: 'neutral', label: 'Excellent' };
  }

  // Simple score calculation: base 100, lose points for rejections
  const acceptanceRate = accepted / total;
  const score = Math.round(50 + (acceptanceRate * 50));

  let trend = 'neutral';
  let label = 'Good';

  if (score >= 90) {
    label = 'Excellent';
    trend = 'up';
  } else if (score >= 70) {
    label = 'Good';
    trend = 'neutral';
  } else if (score >= 50) {
    label = 'Fair';
    trend = 'down';
  } else {
    label = 'Needs Improvement';
    trend = 'down';
  }

  return { score, trend, label };
}

/**
 * Get score color based on value
 */
function getScoreColor(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

export default function FlexibilityScore({
  lease,
  dateChangeRequests = [],
  currentUserId,
  onSeeReputation
}) {
  const { score, trend, label } = calculateFlexibilityScore(dateChangeRequests);
  const scoreColor = getScoreColor(score);

  // Get reputation score from lease if available
  const reputationScore = lease?.guestReputationScore || null;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="flexibility-score">
      <div className="flexibility-score__header">
        <h3 className="flexibility-score__title">
          <Award size={18} />
          Flexibility Score
        </h3>
        <button
          className="flexibility-score__info-btn"
          onClick={onSeeReputation}
          aria-label="Learn more about flexibility score"
        >
          <Info size={16} />
        </button>
      </div>

      <div className="flexibility-score__content">
        {/* Score Display */}
        <div className={`flexibility-score__gauge flexibility-score__gauge--${scoreColor}`}>
          <div className="flexibility-score__score-value">
            {score}
          </div>
          <div className="flexibility-score__score-label">
            {label}
          </div>
        </div>

        {/* Trend Indicator */}
        <div className={`flexibility-score__trend flexibility-score__trend--${trend}`}>
          <TrendIcon size={16} />
          <span>
            {trend === 'up' && 'Improving'}
            {trend === 'down' && 'Declining'}
            {trend === 'neutral' && 'Stable'}
          </span>
        </div>

        {/* Stats */}
        <div className="flexibility-score__stats">
          <div className="flexibility-score__stat">
            <span className="flexibility-score__stat-value">
              {dateChangeRequests.filter(r => r.requestStatus === 'accepted').length}
            </span>
            <span className="flexibility-score__stat-label">Approved</span>
          </div>
          <div className="flexibility-score__stat">
            <span className="flexibility-score__stat-value">
              {dateChangeRequests.filter(r => r.requestStatus === 'rejected').length}
            </span>
            <span className="flexibility-score__stat-label">Declined</span>
          </div>
          <div className="flexibility-score__stat">
            <span className="flexibility-score__stat-value">
              {dateChangeRequests.filter(r => r.requestStatus === 'waiting_for_answer').length}
            </span>
            <span className="flexibility-score__stat-label">Pending</span>
          </div>
        </div>

        {/* Reputation Score (if available) */}
        {reputationScore !== null && (
          <div className="flexibility-score__reputation">
            <span className="flexibility-score__reputation-label">
              Overall Reputation:
            </span>
            <span className="flexibility-score__reputation-value">
              {reputationScore}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
