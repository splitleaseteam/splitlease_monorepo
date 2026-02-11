/**
 * Dashboard Mode Toggle Component
 *
 * Two-option pill toggle for switching between:
 * - Date Changes mode (Calendar, Buy Out, Chat, Transaction History)
 * - Pricing Settings mode (Visualization, Formula Controls)
 *
 * Location: Under the co-tenant profile card in the right column
 */

import PropTypes from 'prop-types';

// ============================================================================
// CONSTANTS
// ============================================================================

const MODES = {
  DATE_CHANGES: 'date_changes',
  PRICING_SETTINGS: 'pricing_settings'
};

const MODE_LABELS = {
  [MODES.DATE_CHANGES]: 'Date Changes',
  [MODES.PRICING_SETTINGS]: 'Pricing Settings'
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DashboardModeToggle({
  currentMode = MODES.DATE_CHANGES,
  onModeChange
}) {
  const handleClick = (mode) => {
    if (mode !== currentMode && onModeChange) {
      onModeChange(mode);
    }
  };

  const handleKeyDown = (e, mode) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(mode);
    }
  };

  return (
    <div className="dashboard-mode-toggle" role="tablist" aria-label="Dashboard view mode">
      <button
        type="button"
        role="tab"
        className={`dashboard-mode-toggle__btn ${currentMode === MODES.DATE_CHANGES ? 'dashboard-mode-toggle__btn--active' : ''}`}
        onClick={() => handleClick(MODES.DATE_CHANGES)}
        onKeyDown={(e) => handleKeyDown(e, MODES.DATE_CHANGES)}
        aria-selected={currentMode === MODES.DATE_CHANGES}
        aria-controls="dashboard-date-changes-panel"
        tabIndex={currentMode === MODES.DATE_CHANGES ? 0 : -1}
      >
        <span className="dashboard-mode-toggle__icon" aria-hidden="true">
          &#x1F4C5;
        </span>
        <span className="dashboard-mode-toggle__label">
          {MODE_LABELS[MODES.DATE_CHANGES]}
        </span>
      </button>

      <button
        type="button"
        role="tab"
        className={`dashboard-mode-toggle__btn ${currentMode === MODES.PRICING_SETTINGS ? 'dashboard-mode-toggle__btn--active' : ''}`}
        onClick={() => handleClick(MODES.PRICING_SETTINGS)}
        onKeyDown={(e) => handleKeyDown(e, MODES.PRICING_SETTINGS)}
        aria-selected={currentMode === MODES.PRICING_SETTINGS}
        aria-controls="dashboard-pricing-settings-panel"
        tabIndex={currentMode === MODES.PRICING_SETTINGS ? 0 : -1}
      >
        <span className="dashboard-mode-toggle__icon" aria-hidden="true">
          &#x2699;
        </span>
        <span className="dashboard-mode-toggle__label">
          {MODE_LABELS[MODES.PRICING_SETTINGS]}
        </span>
      </button>
    </div>
  );
}

DashboardModeToggle.propTypes = {
  currentMode: PropTypes.oneOf([MODES.DATE_CHANGES, MODES.PRICING_SETTINGS]),
  onModeChange: PropTypes.func
};

// Export constants for use in other components
export { MODES, MODE_LABELS };
