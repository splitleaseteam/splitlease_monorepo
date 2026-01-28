import { useMemo } from 'react';
import { runScheduleMultiCheck } from '../../lib/scheduleSelector/multiCheckScheduleValidator.js';
import './ScheduleValidationMatrix.css';

/**
 * Visual comparison matrix showing results from all schedule validators.
 * Displays Golden Validator, Backend Workflow, and optional Frontend Validator.
 *
 * This component runs all validators against the current selection and displays
 * their results in a side-by-side matrix format. When validators disagree,
 * it highlights the discrepancy to help identify which validator needs updating.
 *
 * @param {Object} props
 * @param {number[]} props.selectedDayIndices - Array of selected day indices (0-6)
 * @param {Object} props.listing - Listing configuration with minimumNights, maximumNights, daysAvailable
 */
export default function ScheduleValidationMatrix({ selectedDayIndices, listing }) {
  const multiCheckResult = useMemo(() => {
    if (!selectedDayIndices || selectedDayIndices.length === 0) return null;

    return runScheduleMultiCheck({
      selectedDayIndices,
      listing: {
        minimumNights: listing?.minimumNights || 2,
        maximumNights: listing?.maximumNights || 7,
        daysAvailable: listing?.daysAvailable || [0,1,2,3,4,5,6]
      }
    });
  }, [selectedDayIndices, listing]);

  if (!multiCheckResult) {
    return <p className="svm-empty">No selection to validate</p>;
  }

  const { goldenValid, backendValid, nightsCount } = multiCheckResult.summary;
  const allAgree = multiCheckResult.allAgree;

  return (
    <div className="schedule-validation-matrix">
      <div className="svm-header">
        <div className="svm-status">
          {allAgree ? (
            <span className="svm-badge svm-badge--success">All Validators Agree</span>
          ) : (
            <span className="svm-badge svm-badge--error">DISCREPANCY DETECTED</span>
          )}
        </div>
        <div className="svm-summary">
          <span>Nights: {nightsCount}</span>
          <span>Recommendation: {multiCheckResult.recommendation}</span>
        </div>
      </div>

      <table className="svm-table">
        <thead>
          <tr>
            <th>Validator</th>
            <th>Valid</th>
            <th>Errors</th>
            <th>Nights</th>
            <th>Contiguous</th>
          </tr>
        </thead>
        <tbody>
          {multiCheckResult.checks.map((check, idx) => (
            <tr key={idx} className={check.valid ? 'svm-row--valid' : 'svm-row--invalid'}>
              <td className="svm-source">{check.source.replace(/_/g, ' ')}</td>
              <td>
                {check.valid ? (
                  <span className="svm-icon svm-icon--success">Pass</span>
                ) : (
                  <span className="svm-icon svm-icon--error">Fail</span>
                )}
              </td>
              <td className="svm-errors">
                {check.errors.length > 0 ? (
                  <ul>
                    {check.errors.slice(0, 3).map((err, i) => (
                      <li key={i} title={err.message}>
                        {err.rule} <span className="svm-severity">({err.severity})</span>
                      </li>
                    ))}
                    {check.errors.length > 3 && (
                      <li className="svm-more">+{check.errors.length - 3} more</li>
                    )}
                  </ul>
                ) : (
                  <span className="svm-none">-</span>
                )}
              </td>
              <td>{check.metadata?.nightsCount ?? '-'}</td>
              <td>
                {check.metadata?.isContiguous !== undefined
                  ? (check.metadata.isContiguous ? 'Yes' : 'No')
                  : '-'
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!allAgree && (
        <div className="svm-warning">
          <strong>Discrepancy Alert:</strong> Validators disagree. Review validation rules and update accordingly.
        </div>
      )}
    </div>
  );
}
