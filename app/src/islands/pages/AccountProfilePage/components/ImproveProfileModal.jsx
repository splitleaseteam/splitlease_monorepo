/**
 * ImproveProfileModal.jsx
 *
 * Modal for showing profile improvement suggestions.
 */

import React from 'react';
import { X } from 'lucide-react';
import NextActionCard from './shared/NextActionCard.jsx';

export default function ImproveProfileModal({
  isOpen,
  nextActions = [],
  onActionClick,
  onClose
}) {
  if (!isOpen) return null;

  const handleActionClick = (actionId) => {
    onActionClick?.(actionId);
  };

  return (
    <div className="referral-modal-overlay" onClick={onClose}>
      <div
        className="referral-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Improve your profile"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="referral-modal-header">
          <h2>Improve Your Profile</h2>
          <button
            type="button"
            className="referral-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {nextActions.length > 0 ? (
          <div className="next-action-cards">
            {nextActions.map(action => (
              <NextActionCard
                key={action.id}
                text={action.text}
                points={action.points}
                icon={action.icon}
                onClick={() => handleActionClick(action.id)}
              />
            ))}
          </div>
        ) : (
          <p className="referral-modal-subtitle">You're all set. No new suggestions right now.</p>
        )}
      </div>
    </div>
  );
}
