/**
 * Section 6: Data Validation Checks (renumbered from Section 7)
 *
 * Displays the 7 validation checks from Bubble's z-pricing-unit-test page:
 * 1. Price exists
 * 2. Rental type selected
 * 3. Appears in search
 * 4. Discounts are positive
 * 5. Unused nights not decreasing
 * 6. Min/Max makes sense
 * 7. All good (combined check)
 */

import PropTypes from 'prop-types';

export default function Section7DataValidation({ validationFlags }) {
  const checks = [
    { key: 'priceExists', label: 'Price Exists', description: 'Pricing list has valid prices' },
    { key: 'rentalTypeSelected', label: 'Rental Type Selected', description: 'Listing has a rental type' },
    { key: 'appearsInSearch', label: 'Appears in Search', description: 'Active, Complete, and Approved' },
    { key: 'discountsPositive', label: 'Discounts Positive', description: 'All unused nights discounts >= 0' },
    { key: 'unusedNightsNotDecreasing', label: 'Unused Nights Not Decreasing', description: 'Discounts decrease as nights increase' },
    { key: 'minMaxMakesSense', label: 'Min/Max Makes Sense', description: 'Min nights <= Max nights' }
  ];

  const passedCount = checks.filter(c => validationFlags[c.key]).length;
  const allGood = validationFlags.allGood;

  return (
    <div className="zput-card zput-section-6">
      <div className="zput-card-header">
        <span className="zput-card-title">Section 6: Data Validation Checks</span>
        <span className={`zput-check-counter ${allGood ? 'all-pass' : 'some-fail'}`}>
          {passedCount}/{checks.length} Passed
        </span>
      </div>

      <div className="zput-validation-grid">
        {checks.map(({ key, label, description }) => (
          <div
            key={key}
            className={`zput-validation-item ${validationFlags[key] ? 'pass' : 'fail'}`}
          >
            <div className="validation-header">
              <span className={`validation-badge ${validationFlags[key] ? 'yes' : 'no'}`}>
                {validationFlags[key] ? 'YES' : 'NO'}
              </span>
              <span className="validation-label">{label}</span>
            </div>
            <p className="validation-description">{description}</p>
          </div>
        ))}
      </div>

      <div className={`zput-allgood-banner ${allGood ? 'pass' : 'fail'}`}>
        <span className="allgood-icon">{allGood ? '✓' : '✗'}</span>
        <span className="allgood-label">
          {allGood ? 'Nightly Pricing All Good' : 'Some Checks Failed'}
        </span>
      </div>
    </div>
  );
}

Section7DataValidation.propTypes = {
  validationFlags: PropTypes.shape({
    priceExists: PropTypes.bool,
    rentalTypeSelected: PropTypes.bool,
    appearsInSearch: PropTypes.bool,
    discountsPositive: PropTypes.bool,
    unusedNightsNotDecreasing: PropTypes.bool,
    minMaxMakesSense: PropTypes.bool,
    allGood: PropTypes.bool
  }).isRequired
};
