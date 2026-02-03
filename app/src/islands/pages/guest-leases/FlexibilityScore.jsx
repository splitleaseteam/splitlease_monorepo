/**
 * FlexibilityScore Component
 *
 * Simplified display of guest flexibility score.
 */

import { Award, Info } from 'lucide-react';
import './FlexibilityScore.css';

/**
 * Calculate flexibility score based on date change requests
 */
function calculateFlexibilityScore(dateChangeRequests = []) {
  if (dateChangeRequests.length === 0) {
    return { score: 100, label: 'Excellent' };
  }

  const accepted = dateChangeRequests.filter(r => r.requestStatus === 'accepted').length;
  const rejected = dateChangeRequests.filter(r => r.requestStatus === 'rejected').length;
  const total = accepted + rejected;

  if (total === 0) {
    return { score: 100, label: 'Excellent' };
  }

  const acceptanceRate = accepted / total;
  const score = Math.round(50 + (acceptanceRate * 50));

  let label = 'Good';
  if (score >= 90) label = 'Excellent';
  else if (score >= 70) label = 'Good';
  else if (score >= 50) label = 'Fair';
  else label = 'Needs Improvement';

  return { score, label };
}

function getScoreColor(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

export default function FlexibilityScore({
  dateChangeRequests = [],
  onSeeReputation
}) {
  const { score, label } = calculateFlexibilityScore(dateChangeRequests);
  const scoreColor = getScoreColor(score);

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
        <span className={`flexibility-score__badge flexibility-score__badge--${scoreColor}`}>
          {score} - {label}
        </span>
      </div>
    </div>
  );
}
