/**
 * Section 4: Workflow vs Formula vs Pricing List Check (renumbered from Section 6)
 *
 * Compares pricing calculations from three sources:
 * 1. Workflow: Values from ListingScheduleSelector callback
 * 2. Formula: Direct calculation using priceCalculations.js
 * 3. Pricing List: Values derived from pricing_list database arrays
 *
 * Displays match/mismatch status for each metric across all three sources.
 */

import PropTypes from 'prop-types';

export default function Section6WorkflowCheck({
  comparisonResults,
  onRunChecks,
  isUpdating
}) {
  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '$0.00';
    return `$${Number(value).toFixed(2)}`;
  };

  const metrics = [
    { key: 'fourWeekRent', label: '4-Week Rent' },
    { key: 'initialPayment', label: 'Initial Payment' },
    { key: 'nightlyPrice', label: 'Nightly Price' },
    { key: 'totalReservation', label: 'Total Reservation' }
  ];

  const allMatch = metrics.every(m => comparisonResults[m.key]?.match);
  const allMatchPricingList = metrics.every(m => comparisonResults[m.key]?.matchPricingList);

  return (
    <div className="zput-card zput-section-4">
      <div className="zput-card-header">
        <span className="zput-card-title">Section 4: Workflow vs Formula vs Pricing List</span>
        <button
          type="button"
          className="zput-btn zput-btn-primary"
          onClick={onRunChecks}
          disabled={isUpdating}
        >
          Run Checks
        </button>
      </div>

      <div className="zput-comparison-table-wrapper">
        <table className="zput-comparison-table zput-comparison-table--three-col">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Workflow</th>
              <th>Formula</th>
              <th>Pricing List</th>
              <th>W=F</th>
              <th>W=PL</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map(({ key, label }) => {
              const result = comparisonResults[key] || {
                workflow: 0,
                formula: 0,
                pricingList: 0,
                match: true,
                matchPricingList: true
              };
              const hasAnyMismatch = !result.match || !result.matchPricingList;
              return (
                <tr key={key} className={hasAnyMismatch ? 'mismatch-row' : ''}>
                  <td className="metric-label">{label}</td>
                  <td className="metric-value">{formatCurrency(result.workflow)}</td>
                  <td className="metric-value">{formatCurrency(result.formula)}</td>
                  <td className="metric-value metric-value--pricing-list">{formatCurrency(result.pricingList)}</td>
                  <td className="metric-status">
                    <span className={`status-badge status-badge--compact ${result.match ? 'match' : 'mismatch'}`}>
                      {result.match ? '✓' : '✗'}
                    </span>
                  </td>
                  <td className="metric-status">
                    <span className={`status-badge status-badge--compact ${result.matchPricingList ? 'match' : 'mismatch'}`}>
                      {result.matchPricingList ? '✓' : '✗'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={`zput-overall-status ${allMatch && allMatchPricingList ? 'all-good' : 'has-issues'}`}>
        {allMatch && allMatchPricingList ? (
          <>
            <span className="status-icon">✓</span>
            <span>All calculations match across all sources</span>
          </>
        ) : (
          <>
            <span className="status-icon">⚠</span>
            <span>
              {!allMatch && !allMatchPricingList
                ? 'Formula & Pricing List mismatches detected'
                : !allMatch
                  ? 'Formula mismatch - review highlighted rows'
                  : 'Pricing List mismatch - review highlighted rows'}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

Section6WorkflowCheck.propTypes = {
  comparisonResults: PropTypes.shape({
    fourWeekRent: PropTypes.shape({
      workflow: PropTypes.number,
      formula: PropTypes.number,
      pricingList: PropTypes.number,
      match: PropTypes.bool,
      matchPricingList: PropTypes.bool
    }),
    initialPayment: PropTypes.shape({
      workflow: PropTypes.number,
      formula: PropTypes.number,
      pricingList: PropTypes.number,
      match: PropTypes.bool,
      matchPricingList: PropTypes.bool
    }),
    nightlyPrice: PropTypes.shape({
      workflow: PropTypes.number,
      formula: PropTypes.number,
      pricingList: PropTypes.number,
      match: PropTypes.bool,
      matchPricingList: PropTypes.bool
    }),
    totalReservation: PropTypes.shape({
      workflow: PropTypes.number,
      formula: PropTypes.number,
      pricingList: PropTypes.number,
      match: PropTypes.bool,
      matchPricingList: PropTypes.bool
    })
  }).isRequired,
  onRunChecks: PropTypes.func.isRequired,
  isUpdating: PropTypes.bool
};

Section6WorkflowCheck.defaultProps = {
  isUpdating: false
};
