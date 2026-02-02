/**
 * Roommate Profile Card Component
 *
 * Displays roommate info:
 * - Avatar and name
 * - Flexibility Score (1-10 gauge)
 * - Response patterns
 * - Net Flow Tracker
 */

import React from 'react';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function FlexibilityGauge({ score }) {
  // Score is 1-10
  const percentage = (score / 10) * 100;

  const getScoreLabel = (s) => {
    if (s >= 8) return 'Very Flexible';
    if (s >= 6) return 'Flexible';
    if (s >= 4) return 'Moderate';
    return 'Less Flexible';
  };

  return (
    <div className="flexibility-gauge">
      <div className="flexibility-gauge__header">
        <span className="flexibility-gauge__label">Flexibility Score</span>
        <span className="flexibility-gauge__score">{score}/10</span>
      </div>
      <div className="flexibility-gauge__bar">
        <div
          className="flexibility-gauge__fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="flexibility-gauge__text">{getScoreLabel(score)}</span>
    </div>
  );
}

function NetFlowTracker({ netFlow }) {
  if (!netFlow) return null;

  const { amount, direction, formatted } = netFlow;

  const getFlowLabel = () => {
    if (direction === 'positive') return "They've paid you more";
    if (direction === 'negative') return "You've paid them more";
    return 'Even exchange';
  };

  return (
    <div className={`net-flow-tracker net-flow-tracker--${direction}`}>
      <span className="net-flow-tracker__label">This Month</span>
      <span className="net-flow-tracker__amount">{formatted}</span>
      <span className="net-flow-tracker__description">{getFlowLabel()}</span>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RoommateProfileCard({
  roommate,
  flexibilityScore,
  responsePatterns,
  netFlow
}) {
  if (!roommate) {
    return (
      <div className="roommate-profile-card roommate-profile-card--loading">
        <div className="roommate-profile-card__skeleton" />
      </div>
    );
  }

  // Generate initials for avatar fallback
  const initials = `${roommate.firstName?.[0] || ''}${roommate.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="roommate-profile-card">
      <h3 className="roommate-profile-card__heading">Your Roommate</h3>

      {/* Avatar and Name */}
      <div className="roommate-profile-card__header">
        <div className="roommate-profile-card__avatar">
          {roommate.avatarUrl ? (
            <img
              src={roommate.avatarUrl}
              alt={`${roommate.firstName}'s profile`}
            />
          ) : (
            <span className="roommate-profile-card__initials">{initials}</span>
          )}
        </div>
        <div className="roommate-profile-card__info">
          <span className="roommate-profile-card__name">
            {roommate.firstName} {roommate.lastName}
          </span>
          <span className="roommate-profile-card__role">Co-tenant</span>
        </div>
      </div>

      {/* Flexibility Score */}
      <FlexibilityGauge score={flexibilityScore} />

      {/* Response Patterns */}
      <div className="roommate-profile-card__patterns">
        <span className="roommate-profile-card__pattern-icon" aria-hidden="true">
          &#x23F1;
        </span>
        <span className="roommate-profile-card__pattern-text">
          {responsePatterns}
        </span>
      </div>

      {/* Net Flow */}
      <NetFlowTracker netFlow={netFlow} />
    </div>
  );
}
