/**
 * Z-Pricing Unit Test Page
 *
 * Internal test page for pricing engine validation.
 * Follows the Hollow Component Pattern - ALL logic in useZPricingUnitTestPageLogic hook.
 *
 * Route: /_internal/z-pricing-unit-test
 * Auth: None (internal test page)
 */

import { useZPricingUnitTestPageLogic } from './useZPricingUnitTestPageLogic.js';
import './ZPricingUnitTestPage.css';

// Loading component
function LoadingSpinner() {
  return (
    <div className="zput-loading">
      <div className="zput-spinner"></div>
      <span>Loading...</span>
    </div>
  );
}

// Error component
function ErrorMessage({ message }) {
  return (
    <div className="zput-error">
      {message}
    </div>
  );
}

// Day toggle button
function DayToggleButton({ day, index, isActive, onClick }) {
  return (
    <button
      type="button"
      className={`zput-day-btn ${isActive ? 'active' : ''}`}
      onClick={() => onClick(index)}
      title={day}
    >
      {day.charAt(0)}
    </button>
  );
}

// Scorecard check item
function ScorecardItem({ label, isValid }) {
  return (
    <div className="zput-check-item">
      <span className={`zput-check-badge ${isValid ? 'yes' : 'no'}`}>
        {isValid ? 'YES' : 'NO'}
      </span>
      <span className="zput-check-label">{label}</span>
    </div>
  );
}

// Format currency
function formatCurrency(value) {
  if (typeof value !== 'number' || isNaN(value)) return '$0.00';
  return `$${value.toFixed(2)}`;
}

// Format percentage
function formatPercentage(value) {
  if (typeof value !== 'number' || isNaN(value)) return '0%';
  return `${(value * 100).toFixed(1)}%`;
}

export default function ZPricingUnitTestPage() {
  const {
    // Configuration constants
    DAY_NAMES,
    DAY_FULL_NAMES,
    WEEKS_COUNT_OPTIONS,

    // ZAT config
    zatConfig,

    // Listings
    listings,
    listingsLoading,
    listingsError,
    searchTerm,

    // Selected listing
    selectedListing,
    selectedListingLoading,

    // Configuration
    reservationConfig,
    guestPattern,
    hostRates,
    nightsCount,

    // Outputs
    pricingOutput,
    scorecard,

    // Handlers
    handleSearchChange,
    handleListingSelect,
    handleWeeksCountChange,
    handleDayToggle,
    handleGuestPatternChange,
    handleHostRateChange,
    handleReset
  } = useZPricingUnitTestPageLogic();

  return (
    <div className="zput-page">
      {/* Header */}
      <header className="zput-header">
        <h1>Z-Pricing Unit Test</h1>
        <p>Internal pricing engine testing and validation tool</p>
      </header>

      <div className="zput-container">
        {/* Column 1: Listing Selector */}
        <div className="zput-column zput-column-listing">
          <div className="zput-panel">
            <h2 className="zput-panel-header">Listing Selector</h2>

            {/* Search Input */}
            <div className="zput-form-group">
              <label className="zput-label">Search Listings</label>
              <input
                type="text"
                className="zput-input"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            {/* Listing Dropdown */}
            <div className="zput-form-group">
              <label className="zput-label">Select Listing</label>
              {listingsLoading ? (
                <LoadingSpinner />
              ) : listingsError ? (
                <ErrorMessage message={listingsError} />
              ) : (
                <select
                  className="zput-select"
                  value={selectedListing?._id || ''}
                  onChange={(e) => handleListingSelect(e.target.value)}
                >
                  <option value="">-- Select a listing --</option>
                  {listings.map(listing => (
                    <option key={listing._id} value={listing._id}>
                      {listing.Name || listing._id}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Selected Listing Info */}
            {selectedListing && (
              <div className="zput-form-group">
                <p className="zput-info-text">
                  ID: {selectedListing._id}<br />
                  Status: {selectedListing.Active ? 'Active' : 'Inactive'}
                  {selectedListing.Complete ? ', Complete' : ''}
                  {selectedListing.Approved ? ', Approved' : ''}
                </p>
              </div>
            )}

            {/* Reset Button */}
            <button
              type="button"
              className="zput-btn zput-btn-secondary"
              onClick={handleReset}
              style={{ width: '100%', marginTop: '16px' }}
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Column 2: Configuration */}
        <div className="zput-column zput-column-config">
          {/* Reservation Span Configuration */}
          <div className="zput-panel">
            <h2 className="zput-panel-header">Reservation Span Configuration</h2>

            <div className="zput-form-group">
              <label className="zput-label">Weeks Count</label>
              <select
                className="zput-select"
                value={reservationConfig.weeksCount}
                onChange={(e) => handleWeeksCountChange(e.target.value)}
              >
                {WEEKS_COUNT_OPTIONS.map(weeks => (
                  <option key={weeks} value={weeks}>{weeks} week{weeks > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div className="zput-form-group">
              <label className="zput-label">Day Pattern</label>
              <div className="zput-day-toggles">
                {DAY_NAMES.map((day, index) => (
                  <DayToggleButton
                    key={index}
                    day={DAY_FULL_NAMES[index]}
                    index={index}
                    isActive={reservationConfig.selectedDays.includes(index)}
                    onClick={handleDayToggle}
                  />
                ))}
              </div>
              <p className="zput-info-text">
                Selected: {nightsCount} night{nightsCount !== 1 ? 's' : ''} per week
              </p>
            </div>
          </div>

          {/* Guest Desired Pattern */}
          <div className="zput-panel">
            <h2 className="zput-panel-header">Guest Desired Pattern</h2>

            <div className="zput-inline-row">
              <div className="zput-inline-field">
                <label className="zput-label">Check-in Day</label>
                <select
                  className="zput-select"
                  value={guestPattern.checkInDay}
                  onChange={(e) => handleGuestPatternChange('checkInDay', parseInt(e.target.value))}
                >
                  {DAY_FULL_NAMES.map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>
              </div>
              <div className="zput-inline-field">
                <label className="zput-label">Nights</label>
                <input
                  type="number"
                  className="zput-input"
                  min="1"
                  max="7"
                  value={guestPattern.nights}
                  onChange={(e) => handleGuestPatternChange('nights', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>

          {/* Host Prices Input Section */}
          <div className="zput-panel">
            <h2 className="zput-panel-header">Host Prices Input</h2>

            <div className="zput-form-group">
              <label className="zput-label">Host Comp Style</label>
              <input
                type="text"
                className="zput-input"
                value={hostRates.hostCompStyle}
                onChange={(e) => handleHostRateChange('hostCompStyle', e.target.value)}
              />
            </div>

            <div className="zput-form-group">
              <label className="zput-label">Weeks Offered</label>
              <input
                type="text"
                className="zput-input"
                value={hostRates.weeksOffered}
                readOnly
              />
            </div>

            <h3 className="zput-panel-subheader">Nightly Host Rates</h3>
            <div className="zput-rates-grid">
              <div className="zput-rate-item">
                <span className="zput-rate-label">2-Night Rate</span>
                <input
                  type="number"
                  className="zput-rate-input"
                  value={hostRates.rate2Night || ''}
                  onChange={(e) => handleHostRateChange('rate2Night', e.target.value)}
                  placeholder="$0.00"
                />
              </div>
              <div className="zput-rate-item">
                <span className="zput-rate-label">3-Night Rate</span>
                <input
                  type="number"
                  className="zput-rate-input"
                  value={hostRates.rate3Night || ''}
                  onChange={(e) => handleHostRateChange('rate3Night', e.target.value)}
                  placeholder="$0.00"
                />
              </div>
              <div className="zput-rate-item">
                <span className="zput-rate-label">4-Night Rate</span>
                <input
                  type="number"
                  className="zput-rate-input"
                  value={hostRates.rate4Night || ''}
                  onChange={(e) => handleHostRateChange('rate4Night', e.target.value)}
                  placeholder="$0.00"
                />
              </div>
              <div className="zput-rate-item">
                <span className="zput-rate-label">5-Night Rate</span>
                <input
                  type="number"
                  className="zput-rate-input"
                  value={hostRates.rate5Night || ''}
                  onChange={(e) => handleHostRateChange('rate5Night', e.target.value)}
                  placeholder="$0.00"
                />
              </div>
            </div>

            <h3 className="zput-panel-subheader">Weekly and Monthly Rates</h3>
            <div className="zput-rates-grid">
              <div className="zput-rate-item">
                <span className="zput-rate-label">Weekly Host Rate</span>
                <input
                  type="number"
                  className="zput-rate-input"
                  value={hostRates.weeklyRate || ''}
                  onChange={(e) => handleHostRateChange('weeklyRate', e.target.value)}
                  placeholder="$0.00"
                />
              </div>
              <div className="zput-rate-item">
                <span className="zput-rate-label">Monthly Host Rate</span>
                <input
                  type="number"
                  className="zput-rate-input"
                  value={hostRates.monthlyRate || ''}
                  onChange={(e) => handleHostRateChange('monthlyRate', e.target.value)}
                  placeholder="$0.00"
                />
              </div>
            </div>

            <h3 className="zput-panel-subheader">Deposits</h3>
            <div className="zput-rates-grid">
              <div className="zput-rate-item">
                <span className="zput-rate-label">Damage Deposit</span>
                <input
                  type="number"
                  className="zput-rate-input"
                  value={hostRates.damageDeposit || ''}
                  onChange={(e) => handleHostRateChange('damageDeposit', e.target.value)}
                  placeholder="$0.00"
                />
              </div>
              <div className="zput-rate-item">
                <span className="zput-rate-label">Cleaning Deposit</span>
                <input
                  type="number"
                  className="zput-rate-input"
                  value={hostRates.cleaningDeposit || ''}
                  onChange={(e) => handleHostRateChange('cleaningDeposit', e.target.value)}
                  placeholder="$0.00"
                />
              </div>
            </div>

            <div className="zput-form-group" style={{ marginTop: '16px' }}>
              <label className="zput-label">Unit Markup</label>
              <input
                type="number"
                className="zput-input zput-input-small"
                step="0.01"
                value={hostRates.unitMarkup || ''}
                onChange={(e) => handleHostRateChange('unitMarkup', e.target.value)}
                placeholder="0.00"
              />
              <span className="zput-info-text">(e.g., 0.05 = 5%)</span>
            </div>
          </div>
        </div>

        {/* Column 3: Output */}
        <div className="zput-column zput-column-output">
          {/* Pricing Calculations Output */}
          <div className="zput-panel">
            <h2 className="zput-panel-header">Pricing Calculations Output</h2>

            {selectedListingLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="zput-output-grid">
                {/* Monthly Panel */}
                <div className="zput-output-panel">
                  <div className="zput-output-title">Monthly</div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">Prorated Nightly Rate</span>
                    <span className="zput-output-value highlight">
                      {formatCurrency(pricingOutput.monthly.proratedNightlyRate)}
                    </span>
                  </div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">Site Markup</span>
                    <span className="zput-output-value">
                      {formatPercentage(pricingOutput.monthly.markupAndDiscounts.siteMarkup)}
                    </span>
                  </div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">Unit Markup</span>
                    <span className="zput-output-value">
                      {formatPercentage(pricingOutput.monthly.markupAndDiscounts.unitMarkup)}
                    </span>
                  </div>
                </div>

                {/* Weekly Panel */}
                <div className="zput-output-panel">
                  <div className="zput-output-title">Weekly</div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">Prorated Nightly Rate</span>
                    <span className="zput-output-value highlight">
                      {formatCurrency(pricingOutput.weekly.proratedNightlyRate)}
                    </span>
                  </div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">Site Markup</span>
                    <span className="zput-output-value">
                      {formatPercentage(pricingOutput.weekly.markupAndDiscounts.siteMarkup)}
                    </span>
                  </div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">Unused Nights Discount</span>
                    <span className="zput-output-value">
                      {formatPercentage(pricingOutput.weekly.markupAndDiscounts.unusedNightsDiscount)}
                    </span>
                  </div>
                </div>

                {/* Nightly Panel */}
                <div className="zput-output-panel">
                  <div className="zput-output-title">Nightly</div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">Base Rate</span>
                    <span className="zput-output-value">
                      {formatCurrency(pricingOutput.nightly.baseRate)}
                    </span>
                  </div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">With Markup</span>
                    <span className="zput-output-value highlight">
                      {formatCurrency(pricingOutput.nightly.markupAndDiscounts.total)}
                    </span>
                  </div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">Site Markup</span>
                    <span className="zput-output-value">
                      {formatPercentage(pricingOutput.nightly.markupAndDiscounts.siteMarkup)}
                    </span>
                  </div>
                  <div className="zput-output-row">
                    <span className="zput-output-label">Full-Time Discount</span>
                    <span className="zput-output-value">
                      {formatPercentage(pricingOutput.nightly.markupAndDiscounts.fullTimeDiscount)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Data Check Scorecard */}
          <div className="zput-panel zput-scorecard">
            <h2 className="zput-panel-header">Data Check Scorecard</h2>

            <div className="zput-scorecard-grid">
              <ScorecardItem label="Price Exists" isValid={scorecard.priceExists} />
              <ScorecardItem label="Rental Type Selected" isValid={scorecard.rentalTypeSelected} />
              <ScorecardItem label="Appears in Search" isValid={scorecard.appearsInSearch} />
              <ScorecardItem label="Discounts Positive" isValid={scorecard.discountsPositive} />
              <ScorecardItem label="Min Nights Valid" isValid={scorecard.minNightsValid} />
              <ScorecardItem label="Max Nights Valid" isValid={scorecard.maxNightsValid} />
              <ScorecardItem label="Nightly Pricing Valid" isValid={scorecard.nightlyPricingValid} />
            </div>

            {/* Global Config Display */}
            {zatConfig && (
              <div style={{ marginTop: '16px', padding: '12px', background: '#F9FAFB', borderRadius: '6px' }}>
                <p className="zput-info-text" style={{ margin: 0 }}>
                  <strong>Global Config:</strong> Site Markup: {formatPercentage(zatConfig.overallSiteMarkup)},
                  Full-Time Discount: {formatPercentage(zatConfig.fullTimeDiscount)},
                  Unused Nights Multiplier: {formatPercentage(zatConfig.unusedNightsDiscountMultiplier)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
