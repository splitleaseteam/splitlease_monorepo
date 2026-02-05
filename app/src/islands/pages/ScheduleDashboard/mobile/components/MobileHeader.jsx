/**
 * MobileHeader Component
 *
 * Compact header for mobile ScheduleDashboard.
 * Shows current view title and user context.
 */

import React from 'react';
import { NAV_ITEMS } from './BottomNav';

/**
 * Get display title for active tab
 * @param {string} tabId - Active tab id
 * @returns {string} Display title
 */
function getTabTitle(tabId) {
  const item = NAV_ITEMS.find((nav) => nav.id === tabId);
  return item ? item.label : 'Schedule';
}

/**
 * Mobile header with title and context
 * @param {Object} props
 * @param {string} props.activeTab - Currently active tab id
 * @param {string} [props.userName] - User's display name (optional)
 * @param {string} [props.listingAddress] - Listing address for context (optional)
 * @param {number} [props.roommateFlexibilityScore] - Roommate's flexibility score (1-10)
 * @param {function} [props.onOpenFlexibilityModal] - Handler to open flexibility modal
 */
export function MobileHeader({
  activeTab,
  userName,
  listingAddress,
  roommateFlexibilityScore,
  onOpenFlexibilityModal
}) {
  const title = getTabTitle(activeTab);

  return (
    <header className="mobile-header">
      <div className="mobile-header__content">
        <h1 className="mobile-header__title">{title}</h1>
        {listingAddress && (
          <p className="mobile-header__subtitle">{listingAddress}</p>
        )}
      </div>
      {userName && (
        <button
          type="button"
          className="mobile-header__user"
          onClick={onOpenFlexibilityModal}
          aria-label={`View ${userName}'s flexibility score: ${roommateFlexibilityScore}/10`}
        >
          <span className="mobile-header__avatar" aria-hidden="true">
            {userName.charAt(0).toUpperCase()}
          </span>
          {typeof roommateFlexibilityScore === 'number' && (
            <span className="mobile-header__flex-badge" aria-hidden="true">
              {roommateFlexibilityScore}
            </span>
          )}
        </button>
      )}
    </header>
  );
}
