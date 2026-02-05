/**
 * Co-Tenant Profile Card Component
 *
 * Displays co-tenant info:
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

function FlexibilityGauge({ score, userScore, coTenantName, userName, onInfoClick }) {
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

      {/* Co-Tenant's Score Bar */}
      <div className="flexibility-gauge__bar">
        <div
          className="flexibility-gauge__fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="flexibility-gauge__text">
        {coTenantName ? `${coTenantName}: ` : ''}{getScoreLabel(score)}
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

/**
 * CoTenantProfileCard - Displays co-tenant profile information
 *
 * Note: Props use 'roommate' naming for backward compatibility with
 * existing data structures. UI displays "Co-tenant" terminology.
 */
export default function CoTenantProfileCard({
  roommate, // Keep prop name for backward compatibility
  flexibilityScore,
  userFlexibilityScore,
  userName,
  responsePatterns,
  onFlexibilityInfoClick
}) {
  if (!roommate) {
    return (
      <div className="cotenant-profile-card cotenant-profile-card--loading">
        <div className="cotenant-profile-card__skeleton" />
      </div>
    );
  }

  // Generate initials for avatar fallback
  const initials = `${roommate.firstName?.[0] || ''}${roommate.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="cotenant-profile-card">
      {/* Avatar and Name */}
      <div className="cotenant-profile-card__header">
        <div className="cotenant-profile-card__avatar">
          {roommate.avatarUrl ? (
            <img
              src={roommate.avatarUrl}
              alt={`${roommate.firstName}'s profile`}
            />
          ) : (
            <span className="cotenant-profile-card__initials">{initials}</span>
          )}
        </div>
        <div className="cotenant-profile-card__info">
          <span className="cotenant-profile-card__name">
            {roommate.firstName} {roommate.lastName}
          </span>
          <span className="cotenant-profile-card__score">{flexibilityScore}/10</span>
        </div>
      </div>

      {/* Flexibility Score */}
      <FlexibilityGauge
        score={flexibilityScore}
        userScore={userFlexibilityScore}
        coTenantName={roommate.firstName}
        userName={userName}
        onInfoClick={onFlexibilityInfoClick}
      />

      {/* Response Patterns */}
      <div className="cotenant-profile-card__patterns">
        <span className="cotenant-profile-card__pattern-icon" aria-hidden="true">
          &#x23F1;
        </span>
        <span className="cotenant-profile-card__pattern-text">
          {responsePatterns}
        </span>
      </div>

    </div>
  );
}

CoTenantProfileCard.propTypes = {
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
