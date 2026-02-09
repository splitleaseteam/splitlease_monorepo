/**
 * Z-Pricing Unit Test Page (v2.0)
 *
 * Internal pricing validation dashboard matching Bubble's z-pricing-unit-test page.
 * Compares workflow calculations against direct formulas and database-stored pricing lists.
 *
 * Route: /_internal/z-pricing-unit-test
 * Auth: None (internal test page)
 *
 * Follows Hollow Component Pattern - ALL logic in useZPricingUnitTestPageLogic.
 *
 * @see .claude/plans/New/20260127-z-pricing-unit-test-page-implementation.md
 */

import { useZPricingUnitTestPageLogic } from './useZPricingUnitTestPageLogic.js';
import ListingScheduleSelector from '../../shared/ListingScheduleSelector.jsx';
import Section5PricingListGrid from './components/Section5PricingListGrid.jsx';
import Section6WorkflowCheck from './components/Section6WorkflowCheck.jsx';
import Section7DataValidation from './components/Section7DataValidation.jsx';
import AdminHeader from '../../shared/AdminHeader/AdminHeader.jsx';
import './ZPricingUnitTestPage.css';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// HELPER COMPONENTS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function LoadingSpinner() {
  return (
    <div className="zput-loading">
      <div className="zput-spinner"></div>
      <span>Loading...</span>
    </div>
  );
}

function AlertBanner({ message }) {
  if (!message) return null;
  return (
    <div className="zput-alert">
      {message}
    </div>
  );
}

function formatCurrency(value) {
  if (typeof value !== 'number' || isNaN(value)) return '$0.00';
  return `$${value.toFixed(2)}`;
}

function formatPercentage(value) {
  if (typeof value !== 'number' || isNaN(value)) return '0%';
  return `${(value * 100).toFixed(1)}%`;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MAIN COMPONENT
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ZPricingUnitTestPage() {
  const logic = useZPricingUnitTestPageLogic();

  // Loading state
  if (logic.listingsLoading && logic.zatConfigLoading) {
    return (
      <div className="zput-page zput-page--loading">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (logic.listingsError) {
    return (
      <div className="zput-page zput-page--error">
        <div className="zput-error-card">
          <h2>Error Loading Data</h2>
          <p>{logic.listingsError}</p>
          <button onClick={() => window.location.reload()} className="zput-btn zput-btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Admin Header */}
      <AdminHeader />

      <div className="zput-page">
        {/* Alert Banner */}
        <AlertBanner message={logic.alertMessage} />

        {/* Page Header */}
        <header className="zput-header">
          <h1>Unit.Schedule.Selector | Pricing Unit Test</h1>
          <p>Compare pricing calculations from workflows, database, and direct formulas.</p>
        </header>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* ROW 1: Sections 1 & 2 */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="zput-row">
          {/* Section 1: Listing Search and Selection */}
          <div className="zput-card zput-card--narrow">
            <span className="zput-card-title">Section 1: Listing Search</span>

            <div className="zput-form-group">
              <label className="zput-label">Search (ID, email, name)</label>
              <div className="zput-search-row">
                <input
                  type="text"
                  className="zput-input"
                  placeholder="Search listings..."
                  value={logic.searchQuery}
                  onChange={(e) => logic.setSearchQuery(e.target.value)}
                />
                {logic.searchQuery && (
                  <button
                    type="button"
                    className="zput-btn-icon"
                    onClick={logic.handleClearSearch}
                    title="Clear search"
                  >
                    Ã—
                  </button>
                )}
              </div>
            </div>

            <div className="zput-form-group">
              <label className="zput-label">Select Listing</label>
              <select
                className="zput-select"
                value={logic.selectedListingId}
                onChange={(e) => logic.handleListingChange(e.target.value)}
              >
                <option value="">-- Select a listing --</option>
                {logic.filteredListings.map(listing => {
                  const name = listing.listing_title || listing._id;
                  const rentalType = listing.rental_type || listing.rentalType || '?';
                  const pattern = listing.weeks_offered_schedule_text || listing.weeksOffered || 'Every week';
                  const email = listing['Host email'] || '-';
                  return (
                    <option key={listing._id} value={listing._id}>
                      {name} | {rentalType} | {pattern} | {email}
                    </option>
                  );
                })}
              </select>
            </div>

            {logic.selectedListing && (
              <div className="zput-listing-info">
                <p><strong>ID:</strong> {logic.selectedListing._id}</p>
                <p><strong>Name:</strong> {logic.selectedListing.listing_title}</p>
                <p><strong>Type:</strong> {logic.selectedListing.rental_type || 'Not set'}</p>
              </div>
            )}

            <button
              type="button"
              className="zput-btn zput-btn-secondary zput-btn-full"
              onClick={logic.handleReset}
            >
              Reset All
            </button>
          </div>

          {/* Section 2: Schedule Selector (Compact) */}
          <div className="zput-card zput-card--wide">
            <span className="zput-card-title">Section 2: Schedule Selector</span>

            <div className="zput-config-row">
              <div className="zput-config-field">
                <label className="zput-label">Reservation Span (Weeks)</label>
                <input
                  type="number"
                  className="zput-input zput-input-sm"
                  min="1"
                  max="52"
                  value={logic.reservationSpan}
                  onChange={(e) => logic.handleSetReservationSpan(e.target.value)}
                />
                <span className="zput-hint">â‰ˆ {logic.monthsInSpan} months</span>
              </div>
              <div className="zput-config-field">
                <label className="zput-label">Guest Pattern</label>
                <select
                  className="zput-select"
                  value={logic.guestPattern}
                  onChange={(e) => logic.handleSetPattern(e.target.value)}
                >
                  {logic.GUEST_PATTERN_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {logic.scheduleListing ? (
              <div className="zput-schedule-wrapper zput-schedule-wrapper--compact">
                <ListingScheduleSelector
                  listing={logic.scheduleListing}
                  reservationSpan={logic.reservationSpan}
                  zatConfig={logic.zatConfig}
                  onSelectionChange={logic.handleSelectionChange}
                  onPriceChange={logic.handlePriceChange}
                  showPricing={false}
                />
              </div>
            ) : (
              <div className="zput-empty-state">
                Select a listing to use the schedule selector
              </div>
            )}
          </div>
        </div>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* ROW 2: Section 3 (Combined Host + Prorated) | Section 4 (Workflow Check) */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="zput-row">
          {/* Section 3: Host Prices + Prorated (Combined) */}
          <div className="zput-card zput-card--wide">
            <span className="zput-card-title">Section 3: Host Prices & Prorated Rates</span>

            <div className="zput-host-prorated-combined">
              {/* Left: Host Prices */}
              <div className="zput-host-prices-compact">
                <div className="zput-info-row-inline">
                  <span className="zput-info-label">Style:</span>
                  <span className="zput-info-value">{logic.hostRates.hostCompStyle || '-'}</span>
                  <span className="zput-info-label">Weeks:</span>
                  <span className="zput-info-value">{logic.hostRates.weeksOffered}</span>
                </div>

                <div className="zput-rates-grid zput-rates-grid--compact">
                  <div className="zput-rate-item">
                    <span>2-Night</span>
                    <span>{formatCurrency(logic.hostRates.rate2Night)}</span>
                  </div>
                  <div className="zput-rate-item">
                    <span>3-Night</span>
                    <span>{formatCurrency(logic.hostRates.rate3Night)}</span>
                  </div>
                  <div className="zput-rate-item">
                    <span>4-Night</span>
                    <span>{formatCurrency(logic.hostRates.rate4Night)}</span>
                  </div>
                  <div className="zput-rate-item">
                    <span>5-Night</span>
                    <span>{formatCurrency(logic.hostRates.rate5Night)}</span>
                  </div>
                  <div className="zput-rate-item">
                    <span>Weekly</span>
                    <span>{formatCurrency(logic.hostRates.weeklyRate)}</span>
                  </div>
                  <div className="zput-rate-item">
                    <span>Monthly</span>
                    <span>{formatCurrency(logic.hostRates.monthlyRate)}</span>
                  </div>
                </div>

                <div className="zput-fees-inline">
                  <span>Deposit: {formatCurrency(logic.hostRates.damageDeposit)}</span>
                  <span>Cleaning: {formatCurrency(logic.hostRates.cleaningDeposit)}</span>
                  <span>Markup: {formatPercentage(logic.hostRates.unitMarkup)}</span>
                </div>
              </div>

              <div className="zput-vertical-divider"></div>

              {/* Right: Prorated Rates */}
              <div className="zput-prorated-compact">
                <div className="zput-span-info zput-span-info--inline">
                  <div className="span-item">
                    <span className="span-label">Span:</span>
                    <span className="span-value">{logic.reservationSpan}wks</span>
                  </div>
                  <div className="span-item">
                    <span className="span-label">Nights:</span>
                    <span className="span-value">{logic.nightsCount}/wk</span>
                  </div>
                </div>

                <div className="zput-prorated-grid zput-prorated-grid--horizontal">
                  <div className="zput-prorated-panel zput-prorated-panel--small" onClick={() => logic.handleProratedClick('Monthly')}>
                    <h4>Monthly (Prorated/Night)</h4>
                    <div className="prorated-value">{formatCurrency(logic.pricingOutput.monthly.proratedNightlyRate)}</div>
                  </div>
                  <div className="zput-prorated-panel zput-prorated-panel--small" onClick={() => logic.handleProratedClick('Weekly')}>
                    <h4>Weekly (Prorated/Night)</h4>
                    <div className="prorated-value">{formatCurrency(logic.pricingOutput.weekly.proratedNightlyRate)}</div>
                  </div>
                  <div className="zput-prorated-panel zput-prorated-panel--small" onClick={() => logic.handleProratedClick('Nightly')}>
                    <h4>Nightly (With Markup)</h4>
                    <div className="prorated-value">{formatCurrency(logic.pricingOutput.nightly.withMarkup)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Workflow vs Formula Check (moved up) */}
          <Section6WorkflowCheck
            comparisonResults={logic.comparisonResults}
            onRunChecks={logic.handleRunChecks}
            isUpdating={logic.isUpdating}
          />
        </div>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* ROW 3: Section 5 (Pricing List Grid - full width) */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="zput-row zput-row--full">
          <Section5PricingListGrid
            pricingList={logic.pricingList}
            listing={logic.selectedListing}
            onUpdatePricingList={logic.handleUpdatePricingList}
            onUpdateStartingNightly={logic.handleUpdateStartingNightly}
            isUpdating={logic.isUpdating}
          />
        </div>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        {/* ROW 4: Section 6 (Validation) | Section 7 (Guidelines) | Section 8 (ZAT Config) */}
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="zput-row zput-row--three-col">
          <Section7DataValidation
            validationFlags={logic.validationFlags}
          />

          {/* Section 7: Host Guidelines */}
          <div className="zput-card">
            <span className="zput-card-title">Section 7: Host Guidelines</span>

            <div className="zput-guidelines-grid">
              <div className="zput-guideline-item">
                <span className="guideline-label">Min Nights</span>
                <span className="guideline-value">{logic.hostRates.minNights ?? '-'}</span>
              </div>
              <div className="zput-guideline-item">
                <span className="guideline-label">Max Nights</span>
                <span className="guideline-value">{logic.hostRates.maxNights ?? '-'}</span>
              </div>
              <div className="zput-guideline-item">
                <span className="guideline-label">Min Weeks</span>
                <span className="guideline-value">{logic.hostRates.minWeeks ?? '-'}</span>
              </div>
              <div className="zput-guideline-item">
                <span className="guideline-label">Max Weeks</span>
                <span className="guideline-value">{logic.hostRates.maxWeeks ?? '-'}</span>
              </div>
            </div>
          </div>

          {/* Section 8: ZAT Price Configuration */}
          <div className="zput-card">
            <span className="zput-card-title">Section 8: ZAT Config</span>

            {logic.zatConfig ? (
              <div className="zput-config-list">
                <div className="zput-info-row">
                  <span className="zput-info-label">Site Markup:</span>
                  <span className="zput-info-value">{formatPercentage(logic.zatConfig.overallSiteMarkup)}</span>
                </div>
                <div className="zput-info-row">
                  <span className="zput-info-label">Full-Time Discount:</span>
                  <span className="zput-info-value">{formatPercentage(logic.zatConfig.fullTimeDiscount)}</span>
                </div>
                <div className="zput-info-row">
                  <span className="zput-info-label">Unused Nights Mult:</span>
                  <span className="zput-info-value">{formatPercentage(logic.zatConfig.unusedNightsDiscountMultiplier)}</span>
                </div>
                <div className="zput-info-row">
                  <span className="zput-info-label">Avg Days/Month:</span>
                  <span className="zput-info-value">{logic.zatConfig.avgDaysPerMonth}</span>
                </div>
              </div>
            ) : (
              <p className="zput-empty-text">Loading config...</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
