/**
 * Section 5: Pricing List Grid
 *
 * Displays a 7-row table showing all pricing arrays from the pricing_list database.
 * Each row represents 1-7 nights with columns for host compensation, unused nights,
 * discounts, markups, multipliers, and final nightly prices.
 */

import PropTypes from 'prop-types';

export default function Section5PricingListGrid({
  pricingList,
  listing,
  onUpdatePricingList,
  onUpdateStartingNightly,
  isUpdating
}) {
  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '-';
    return `$${Number(value).toFixed(2)}`;
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '-';
    return `${(Number(value) * 100).toFixed(1)}%`;
  };

  // Build rows from pricing list arrays (indices 0-6 represent 1-7 nights)
  const rows = [];
  for (let i = 0; i < 7; i++) {
    const nightCount = i + 1;
    rows.push({
      nightCount,
      hostCompensation: pricingList?.hostCompensation?.[i],
      unusedNights: 7 - nightCount,
      unusedNightsDiscount: pricingList?.unusedNightsDiscount?.[i],
      combinedMarkup: pricingList?.combinedMarkup,
      multiplier: pricingList?.markupAndDiscountMultiplier?.[i],
      fullTimeDiscount: nightCount === 7 ? pricingList?.fullTimeDiscount : null,
      nightlyPrice: pricingList?.nightlyPrice?.[i]
    });
  }

  return (
    <div className="zput-card zput-section-5">
      <div className="zput-card-header">
        <span className="zput-card-title">Section 5: Pricing List Grid</span>
        <div className="zput-card-actions">
          <button
            type="button"
            className="zput-btn zput-btn-primary"
            onClick={onUpdatePricingList}
            disabled={!listing || isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Run Price List'}
          </button>
          <button
            type="button"
            className="zput-btn zput-btn-secondary"
            onClick={onUpdateStartingNightly}
            disabled={!listing || isUpdating}
          >
            Run Starting Nightly
          </button>
        </div>
      </div>

      {!pricingList ? (
        <div className="zput-empty-state">
          {listing ? 'No pricing list found for this listing' : 'Select a listing to view pricing data'}
        </div>
      ) : (
        <div className="zput-table-wrapper">
          <table className="zput-pricing-table">
            <thead>
              <tr>
                <th>Nights</th>
                <th>Host Comp</th>
                <th>Unused Nights</th>
                <th>Unused Discount</th>
                <th>Combined Markup</th>
                <th>Multiplier</th>
                <th>Full-Time Disc</th>
                <th>Nightly Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.nightCount} className={row.nightCount === 7 ? 'highlight-row' : ''}>
                  <td className="night-count">{row.nightCount}</td>
                  <td>{formatCurrency(row.hostCompensation)}</td>
                  <td>{row.unusedNights}</td>
                  <td>{formatPercent(row.unusedNightsDiscount)}</td>
                  <td>{formatPercent(row.combinedMarkup)}</td>
                  <td>{row.multiplier?.toFixed(3) ?? '-'}</td>
                  <td>{row.fullTimeDiscount !== null ? formatPercent(row.fullTimeDiscount) : '-'}</td>
                  <td className="nightly-price">{formatCurrency(row.nightlyPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pricingList && (
        <div className="zput-pricing-summary">
          <div className="summary-item">
            <span className="summary-label">Starting Nightly:</span>
            <span className="summary-value">{formatCurrency(pricingList.startingNightlyPrice)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Slope:</span>
            <span className="summary-value">{pricingList.slope?.toFixed(4) ?? '-'}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Rental Type:</span>
            <span className="summary-value">{listing?.['rental type'] || pricingList.rentalType || '-'}</span>
          </div>
        </div>
      )}
    </div>
  );
}

Section5PricingListGrid.propTypes = {
  pricingList: PropTypes.shape({
    hostCompensation: PropTypes.array,
    unusedNightsDiscount: PropTypes.array,
    combinedMarkup: PropTypes.number,
    markupAndDiscountMultiplier: PropTypes.array,
    fullTimeDiscount: PropTypes.number,
    nightlyPrice: PropTypes.array,
    startingNightlyPrice: PropTypes.number,
    slope: PropTypes.number,
    rentalType: PropTypes.string
  }),
  listing: PropTypes.object,
  onUpdatePricingList: PropTypes.func.isRequired,
  onUpdateStartingNightly: PropTypes.func.isRequired,
  isUpdating: PropTypes.bool
};

Section5PricingListGrid.defaultProps = {
  pricingList: null,
  listing: null,
  isUpdating: false
};
