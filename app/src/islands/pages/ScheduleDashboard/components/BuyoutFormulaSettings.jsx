/**
 * Buyout Formula Settings - Request-Type-Aware Pricing Model
 *
 * Light-themed UI matching the dashboard with three intuitive tiers:
 * 1. Notice Period: How much does short notice affect pricing?
 * 2. Sharing Willingness: How willing are you to share? (Share requests only)
 * 3. Edge Preference: Which days are easier to sacrifice? (Buyout requests only)
 *
 * Pricing Formulas:
 * - Buyout: BaseRate × NoticeMultiplier × EdgeMultiplier
 * - Share:  BaseRate × NoticeMultiplier × SharingMultiplier
 * - Swap:   $0 (free exchange)
 *
 * Layout: 2-column grid with Notice Period (left) and stacked tiers (right)
 */

import PropTypes from 'prop-types';

// ============================================================================
// CONSTANTS
// ============================================================================

const SHARING_WILLINGNESS_OPTIONS = [
  {
    key: 'accommodating',
    multiplier: 0.5,
    label: 'Happy to Share',
    percentage: '50%',
    description: 'They pay at least half but you get priority arrangements'
  },
  {
    key: 'standard',
    multiplier: 1.0,
    label: 'Willing to Share',
    percentage: '100%',
    description: 'Your night is free, but you still get priority'
  },
  {
    key: 'reluctant',
    multiplier: 1.5,
    label: 'Only if You Really Need It',
    percentage: '150%',
    description: 'Premium for inconvenience'
  }
];

const NOTICE_TIERS = [
  { key: 'flexible', label: 'Far Off', period: '30+ days' },
  { key: 'standard', label: 'Standard', period: '14-30 days' },
  { key: 'inconvenient', label: 'Soon', period: '7-14 days' },
  { key: 'disruptive', label: 'Short Notice', period: '< 7 days' },
  { key: 'emergency', label: 'Emergency', period: '< 48 hours' }
];

const EDGE_PREFERENCES = [
  { key: 'start_cheaper', label: 'Arrive Later', subLabel: 'When requested, I can sometimes arrive later', description: 'Mon/Tue cheaper' },
  { key: 'neutral', label: 'No Preference', subLabel: '', description: 'Flat pricing' },
  { key: 'end_cheaper', label: 'Leave Earlier', subLabel: 'When requested, I can sometimes leave earlier', description: 'Thu/Fri cheaper' }
];

// ============================================================================
// TIER 2: SHARING WILLINGNESS (Only applies to Share requests)
// ============================================================================

function SharingWillingnessTier({ sharingWillingness, onChange }) {
  return (
    <div className="pricing-tier">
      <div className="pricing-tier__header">
        <span className="pricing-tier__number">02</span>
        <h4 className="pricing-tier__title">Sharing Willingness</h4>
        <span className="pricing-tier__subtitle">(Only applies to Share requests)</span>
      </div>

      <div className="pricing-tier__cards">
        {SHARING_WILLINGNESS_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`cost-card ${sharingWillingness === option.key ? 'cost-card--selected' : ''}`}
            onClick={() => onChange('sharingWillingness', option.key)}
          >
            <div className="cost-card__info">
              <span className="cost-card__label">{option.label}</span>
              <span className="cost-card__percentage">{option.percentage}</span>
              <span className="cost-card__desc">{option.description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// TIER 2: NOTICE PERIOD (Individual Tier Sliders)
// ============================================================================

function NoticeAdjustmentTier({ noticeMultipliers, onChange }) {
  const handleMultiplierChange = (tierKey, value) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.min(10, Math.max(1, parsed));
    onChange('noticeMultipliers', {
      ...noticeMultipliers,
      [tierKey]: Number(clamped.toFixed(1))
    });
  };

  return (
    <div className="pricing-tier">
      <div className="pricing-tier__header">
        <span className="pricing-tier__number">01</span>
        <h4 className="pricing-tier__title">Notice Period</h4>
      </div>


      <div className="notice-multipliers">
        {NOTICE_TIERS.map((tier) => (
          <div key={tier.key} className="notice-multipliers__row">
            <div className="notice-multipliers__label">
              <span className="notice-multipliers__name">{tier.label}</span>
              <span className="notice-multipliers__period">{tier.period}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.1"
              value={noticeMultipliers[tier.key] ?? 1.0}
              onChange={(e) => handleMultiplierChange(tier.key, e.target.value)}
              className="notice-multipliers__slider"
            />
            <span className="notice-multipliers__value">
              {(noticeMultipliers[tier.key] ?? 1.0).toFixed(1)}x
            </span>
          </div>
        ))}
      </div>


    </div>
  );
}

// ============================================================================
// TIER 3: EDGE PREFERENCE
// ============================================================================

function EdgePreferenceTier({ edgePreference, onChange }) {
  return (
    <div className="pricing-tier">
      <div className="pricing-tier__header">
        <span className="pricing-tier__number">03</span>
        <h4 className="pricing-tier__title">Arrival or Departure Easier?</h4>
        <span className="pricing-tier__subtitle">(Only applies to Buyout requests)</span>
      </div>


      <div className="edge-segmented">
        {EDGE_PREFERENCES.map((pref) => (
          <button
            key={pref.key}
            type="button"
            className={`edge-segment ${edgePreference === pref.key ? 'edge-segment--selected' : ''}`}
            onClick={() => onChange('edgePreference', pref.key)}
          >
            <div className="edge-segment__content">
              <span className="edge-segment__label">{pref.label}</span>
              {pref.subLabel && <span className="edge-segment__sub-label">{pref.subLabel}</span>}
            </div>
          </button>
        ))}
      </div>

      <p className="pricing-tier__hint">
        {edgePreference === 'start_cheaper' && 'Mon/Tue will be cheaper, Thu/Fri more expensive.'}
        {edgePreference === 'end_cheaper' && 'Thu/Fri will be cheaper, Mon/Tue more expensive.'}
        {edgePreference === 'neutral' && ''}
      </p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BuyoutFormulaSettings({
  pricingStrategy,
  onStrategyChange,
  onSave,
  onReset,
  isSaving = false
}) {
  return (
    <div className="pricing-settings">
      {/* Header */}
      <div className="pricing-settings__header">
        <div>
          <h3 className="pricing-settings__title">Set Your Suggested Pricing</h3>
          <p className="pricing-settings__subtitle">Suggest pricing for your co-tenants buyout requests</p>
        </div>
        <div className="pricing-settings__actions">
          <button
            type="button"
            className="pricing-btn pricing-btn--secondary"
            onClick={onReset}
            disabled={isSaving}
          >
            Reset
          </button>
          <button
            type="button"
            className="pricing-btn pricing-btn--primary"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <p className="pricing-settings__explainer">
        These prices will be shown as suggestions to your co-tenant. They can choose to offer a different amount.
      </p>

      {/* 2-Column Layout: Notice Period (wide) | Stacked (Cost + Edge) */}
      <div className="pricing-settings__content">
        {/* Left: Notice Period (wider) */}
        <NoticeAdjustmentTier
          noticeMultipliers={pricingStrategy.noticeMultipliers}
          onChange={onStrategyChange}
        />

        {/* Right: Stacked vertically */}
        <div className="pricing-settings__right-stack">
          <SharingWillingnessTier
            sharingWillingness={pricingStrategy.sharingWillingness}
            onChange={onStrategyChange}
          />

          <EdgePreferenceTier
            edgePreference={pricingStrategy.edgePreference}
            onChange={onStrategyChange}
          />
        </div>
      </div>

    </div >
  );
}

BuyoutFormulaSettings.propTypes = {
  pricingStrategy: PropTypes.shape({
    baseRate: PropTypes.number,
    noticeMultipliers: PropTypes.shape({
      flexible: PropTypes.number,
      standard: PropTypes.number,
      inconvenient: PropTypes.number,
      disruptive: PropTypes.number,
      emergency: PropTypes.number
    }),
    edgePreference: PropTypes.oneOf(['start_cheaper', 'neutral', 'end_cheaper']),
    sharingWillingness: PropTypes.oneOf(['accommodating', 'standard', 'reluctant'])
  }).isRequired,
  onStrategyChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  isSaving: PropTypes.bool
};
