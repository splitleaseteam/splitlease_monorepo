/**
 * ProfileStrengthMeter.jsx
 *
 * Visual progress bar showing profile completion percentage.
 * Only shown in editor view.
 */

import { Info } from 'lucide-react';

export default function ProfileStrengthMeter({
  percentage = 0,
  onClick,
  onInfoClick
}) {
  // Ensure percentage is within bounds
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const isClickable = typeof onClick === 'function';
  const isInfoClickable = typeof onInfoClick === 'function';

  return (
    <div
      className={`profile-strength-section${isClickable ? ' profile-strength-section--clickable' : ''}`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      } : undefined}
    >
      <div className="profile-strength-label">
        <span>Profile Strength</span>
        {isInfoClickable && (
          <button
            type="button"
            className="profile-strength-info-btn"
            onClick={(event) => {
              event.stopPropagation();
              onInfoClick();
            }}
            aria-label="Toggle verification details"
          >
            <Info size={14} />
          </button>
        )}
      </div>
      <div className="profile-strength-bar">
        <div className="profile-strength-track">
          <div
            className="profile-strength-fill"
            style={{ width: `${clampedPercentage}%` }}
          />
        </div>
        <span className="profile-strength-percentage">{clampedPercentage}%</span>
      </div>
    </div>
  );
}
