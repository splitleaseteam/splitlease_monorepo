import React from 'react';

export const LEASE_STYLES = [
  {
    id: 'nightly',
    title: 'Nightly',
    description: 'Rent your space by the night. Best for hosts who want flexibility and higher potential income through short-term stays.',
    benefits: ['Maximized nightly rates', 'Flexible calendar management'],
  },
  {
    id: 'weekly',
    title: 'Weekly (Split Lease)',
    description: 'Rent your space for specific weeks (e.g., Week 1 & 3 of every month). Best for hosts who use their space regularly but want to monetize it when away.',
    benefits: ['Consistent schedule', 'Predictable income from recurring guests'],
  },
  {
    id: 'monthly',
    title: 'Monthly (Sublet)',
    description: 'Standard month-to-month lease (e.g., continuous stay from August to December). Best for hosts who want steady occupancy with minimal management.',
    benefits: ['Continuous occupancy with stable income', 'Set your monthly rate'],
  },
];

/**
 * Lease style selector component
 */
const LeaseStyleSelector = React.memo(function LeaseStyleSelector({ activeStyle, onSelect, disabled = false }) {
  return (
    <div className="pricing-edit__styles">
      <h3 className="pricing-edit__subtitle">Select your Lease Style</h3>
      <div className="pricing-edit__style-grid" role="radiogroup" aria-label="Lease style">
        {LEASE_STYLES.map((style) => (
          <div
            key={style.id}
            className={`pricing-edit__style-card ${activeStyle === style.id ? 'pricing-edit__style-card--active' : ''} ${disabled ? 'pricing-edit__style-card--disabled' : ''}`}
            onClick={() => !disabled && onSelect(style.id)}
            role="radio"
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
              if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onSelect(style.id);
              }
            }}
            aria-checked={activeStyle === style.id}
            aria-disabled={disabled}
          >
            <div className="pricing-edit__style-header">
              <div className="pricing-edit__style-radio">
                {activeStyle === style.id && <div className="pricing-edit__style-radio-inner" />}
              </div>
              <h4 className="pricing-edit__style-title">{style.title}</h4>
            </div>
            <p className="pricing-edit__style-description">{style.description}</p>
            <ul className="pricing-edit__style-benefits">
              {style.benefits.map((benefit, index) => (
                <li key={index} className="pricing-edit__style-benefit">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
});

export default LeaseStyleSelector;
