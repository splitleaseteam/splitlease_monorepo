/**
 * Section 11: Workflow vs Formula Check
 *
 * Compares pricing calculations from the workflow (ListingScheduleSelector)
 * against direct formula calculations to verify consistency.
 *
 * Displays match/mismatch status for each metric.
 */

import PropTypes from 'prop-types';

export default function Section11WorkflowCheck({
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

  return (
    <div className="zput-card zput-section-11">
      <div className="zput-card-header">
        <span className="zput-card-title">Section 11: Workflow vs Formula Check</span>
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
        <table className="zput-comparison-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Workflow Value</th>
              <th>Formula Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map(({ key, label }) => {
              const result = comparisonResults[key] || { workflow: 0, formula: 0, match: true };
              return (
                <tr key={key} className={result.match ? '' : 'mismatch-row'}>
                  <td className="metric-label">{label}</td>
                  <td className="metric-value">{formatCurrency(result.workflow)}</td>
                  <td className="metric-value">{formatCurrency(result.formula)}</td>
                  <td className="metric-status">
                    <span className={`status-badge ${result.match ? 'match' : 'mismatch'}`}>
                      {result.match ? '✓ Match' : '✗ Mismatch'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={`zput-overall-status ${allMatch ? 'all-good' : 'has-issues'}`}>
        {allMatch ? (
          <>
            <span className="status-icon">✓</span>
            <span>All calculations match</span>
          </>
        ) : (
          <>
            <span className="status-icon">⚠</span>
            <span>Some calculations differ - review highlighted rows</span>
          </>
        )}
      </div>
    </div>
  );
}

Section11WorkflowCheck.propTypes = {
  comparisonResults: PropTypes.shape({
    fourWeekRent: PropTypes.shape({
      workflow: PropTypes.number,
      formula: PropTypes.number,
      match: PropTypes.bool
    }),
    initialPayment: PropTypes.shape({
      workflow: PropTypes.number,
      formula: PropTypes.number,
      match: PropTypes.bool
    }),
    nightlyPrice: PropTypes.shape({
      workflow: PropTypes.number,
      formula: PropTypes.number,
      match: PropTypes.bool
    }),
    totalReservation: PropTypes.shape({
      workflow: PropTypes.number,
      formula: PropTypes.number,
      match: PropTypes.bool
    })
  }).isRequired,
  onRunChecks: PropTypes.func.isRequired,
  isUpdating: PropTypes.bool
};

Section11WorkflowCheck.defaultProps = {
  isUpdating: false
};
