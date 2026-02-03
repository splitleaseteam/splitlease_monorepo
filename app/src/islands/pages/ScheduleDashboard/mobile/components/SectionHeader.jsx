/**
 * SectionHeader Component
 *
 * Back navigation header for settings sections.
 */

import React from 'react';

/**
 * Section header with back button
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {function} props.onBack - Callback when back is clicked
 * @param {React.ReactNode} [props.action] - Optional action element on the right
 */
export default function SectionHeader({ title, onBack, action }) {
  return (
    <div className="section-header">
      <button
        className="section-header__back"
        onClick={onBack}
        aria-label="Go back to settings menu"
      >
        <span className="section-header__back-icon" aria-hidden="true">
          ←
        </span>
        <span className="section-header__back-text">Back</span>
      </button>
      <h2 className="section-header__title">{title}</h2>
      {action && (
        <div className="section-header__action">
          {action}
        </div>
      )}
    </div>
  );
}
