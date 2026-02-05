/**
 * Roommate Profile Card Component
 *
 * Displays roommate info:
 * - Avatar and name
 * - Flexibility Score (1-10 gauge) with comparison to user's score
 * - Info icon to open detailed breakdown modal
 * - Response patterns
 * - Net Flow Tracker
 */

import React from 'react';
import PropTypes from 'prop-types';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function FlexibilityGauge({ score, userScore, roommateName, userName, onInfoClick }) {
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
      {/* Header with Info Icon */}
      <div className="flexibility-gauge__header">
        <div
          className="flexibility-gauge__label-wrapper"
          onClick={onInfoClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onInfoClick?.();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="View flexibility score breakdown"
        >
          <span className="flexibility-gauge__label">Flexibility Score</span>
          <span className="flexibility-gauge__info-icon" aria-hidden="true">
            &#9432;
          </span>
        </div>
        <span className="flexibility-gauge__score">{score}/10</span>
      </div>

      {/* Roommate's Score Bar */}
      <div className="flexibility-gauge__bar">
        <div
          className="flexibility-gauge__fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="flexibility-gauge__text">
        {roommateName ? `${roommateName}: ` : ''}{getScoreLabel(score)}
      </span>

      {/* User's Score Row */}
      {userScore !== undefined && (
        <div className="flexibility-gauge__my-score">
          <span className="flexibility-gauge__my-score-label">{userName ? `${userName}'s Score:` : 'My Score:'}</span>
          <span className="flexibility-gauge__my-score-value">{userScore}/10</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RoommateProfileCard({
  roommate,
  flexibilityScore,
  userFlexibilityScore,
  userName,
  responsePatterns,
  onFlexibilityInfoClick
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
          <span className="roommate-profile-card__score">{flexibilityScore}/10</span>
        </div>
      </div>

      {/* Flexibility Score */}
      <FlexibilityGauge
        score={flexibilityScore}
        userScore={userFlexibilityScore}
        roommateName={roommate.firstName}
        userName={userName}
        onInfoClick={onFlexibilityInfoClick}
      />

      {/* Response Patterns */}
      <div className="roommate-profile-card__patterns">
        <span className="roommate-profile-card__pattern-icon" aria-hidden="true">
          &#x23F1;
        </span>
        <span className="roommate-profile-card__pattern-text">
          {responsePatterns}
        </span>
      </div>

    </div>
  );
}

RoommateProfileCard.propTypes = {
  roommate: PropTypes.shape({
    _id: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    avatarUrl: PropTypes.string,
    email: PropTypes.string
  }),
  flexibilityScore: PropTypes.number,
  userFlexibilityScore: PropTypes.number,
  userName: PropTypes.string,
  responsePatterns: PropTypes.string,
  onFlexibilityInfoClick: PropTypes.func
};
