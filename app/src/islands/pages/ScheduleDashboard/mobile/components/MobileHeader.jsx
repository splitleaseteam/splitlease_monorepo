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
 */
export function MobileHeader({ activeTab, userName, listingAddress }) {
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
        <div className="mobile-header__user">
          <span className="mobile-header__avatar" aria-hidden="true">
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </header>
  );
}
