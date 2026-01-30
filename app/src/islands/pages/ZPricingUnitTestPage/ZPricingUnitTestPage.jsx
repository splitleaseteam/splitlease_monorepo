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
import Section10PricingListGrid from './components/Section10PricingListGrid.jsx';
import Section11WorkflowCheck from './components/Section11WorkflowCheck.jsx';
import Section12DataValidation from './components/Section12DataValidation.jsx';
import AdminHeader from '../../shared/AdminHeader/AdminHeader.jsx';
import './ZPricingUnitTestPage.css';

// ─────────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

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

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* ROW 1: Sections 1 & 2 */}
        {/* ═══════════════════════════════════════════════════════════ */}
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
                    ×
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
                {logic.filteredListings.map(listing => (
                  <option key={listing._id} value={listing._id}>
                    {listing.Name || listing._id}
                  </option>
                ))}
              </select>
            </div>

            {logic.selectedListing && (
              <div className="zput-listing-info">
                <p><strong>ID:</strong> {logic.selectedListing._id}</p>
                <p><strong>Name:</strong> {logic.selectedListing.Name}</p>
                <p><strong>Type:</strong> {logic.selectedListing['rental type'] || 'Not set'}</p>
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
                <span className="zput-hint">≈ {logic.monthsInSpan} months</span>
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

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* ROW 2: Sections 3, 4, 5 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="zput-row zput-row--three">
          {/* Section 3: Host Prices */}
          <div className="zput-card">
            <span className="zput-card-title">Section 3: Host Prices</span>

            <div className="zput-info-row">
              <span className="zput-info-label">Host Comp Style:</span>
              <span className="zput-info-value">{logic.hostRates.hostCompStyle || '-'}</span>
            </div>
            <div className="zput-info-row">
              <span className="zput-info-label">Weeks Offered:</span>
              <span className="zput-info-value">{logic.hostRates.weeksOffered}</span>
            </div>

            <div className="zput-divider"></div>

            <div className="zput-rates-grid">
              <div className="zput-rate-item">
                <span>2-Night Rate</span>
                <span>{formatCurrency(logic.hostRates.rate2Night)}</span>
              </div>
              <div className="zput-rate-item">
                <span>3-Night Rate</span>
                <span>{formatCurrency(logic.hostRates.rate3Night)}</span>
              </div>
              <div className="zput-rate-item">
                <span>4-Night Rate</span>
                <span>{formatCurrency(logic.hostRates.rate4Night)}</span>
              </div>
              <div className="zput-rate-item">
                <span>5-Night Rate</span>
                <span>{formatCurrency(logic.hostRates.rate5Night)}</span>
              </div>
              <div className="zput-rate-item">
                <span>Weekly Rate</span>
                <span>{formatCurrency(logic.hostRates.weeklyRate)}</span>
              </div>
              <div className="zput-rate-item">
                <span>Monthly Rate</span>
                <span>{formatCurrency(logic.hostRates.monthlyRate)}</span>
              </div>
            </div>

            <div className="zput-divider"></div>

            <div className="zput-info-row">
              <span className="zput-info-label">Damage Deposit:</span>
              <span className="zput-info-value">{formatCurrency(logic.hostRates.damageDeposit)}</span>
            </div>
            <div className="zput-info-row">
              <span className="zput-info-label">Cleaning Fee:</span>
              <span className="zput-info-value">{formatCurrency(logic.hostRates.cleaningDeposit)}</span>
            </div>
            <div className="zput-info-row">
              <span className="zput-info-label">Unit Markup:</span>
              <span className="zput-info-value">{formatPercentage(logic.hostRates.unitMarkup)}</span>
            </div>
          </div>

          {/* Section 4: Host Guidelines */}
          <div className="zput-card">
            <span className="zput-card-title">Section 4: Host Guidelines</span>

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

          {/* Section 5: Prorated Rates */}
          <div className="zput-card">
            <span className="zput-card-title">Section 5: Prorated Rates</span>

            <div className="zput-prorated-grid zput-prorated-grid--vertical">
              <div className="zput-prorated-panel" onClick={() => logic.handleProratedClick('Monthly')}>
                <h4>Monthly</h4>
                <div className="prorated-value">{formatCurrency(logic.pricingOutput.monthly.proratedNightlyRate)}</div>
                <div className="prorated-details">
                  <span>Avg Nightly: {formatCurrency(logic.pricingOutput.monthly.avgNightly)}</span>
                  <span>Avg Weekly: {formatCurrency(logic.pricingOutput.monthly.avgWeeklyPrice)}</span>
                </div>
              </div>

              <div className="zput-prorated-panel" onClick={() => logic.handleProratedClick('Weekly')}>
                <h4>Weekly</h4>
                <div className="prorated-value">{formatCurrency(logic.pricingOutput.weekly.proratedNightlyRate)}</div>
                <div className="prorated-details">
                  <span>Unused Disc: {formatPercentage(logic.pricingOutput.weekly.unusedNightsDiscount)}</span>
                </div>
              </div>

              <div className="zput-prorated-panel" onClick={() => logic.handleProratedClick('Nightly')}>
                <h4>Nightly</h4>
                <div className="prorated-value">{formatCurrency(logic.pricingOutput.nightly.withMarkup)}</div>
                <div className="prorated-details">
                  <span>Base: {formatCurrency(logic.pricingOutput.nightly.baseRate)}</span>
                  <span>Full-Time Disc: {formatPercentage(logic.pricingOutput.nightly.fullTimeDiscount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* ROW 3: Sections 8 & 9 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="zput-row">
          {/* Section 8: Reservation Span Info */}
          <div className="zput-card">
            <span className="zput-card-title">Section 8: Reservation Span</span>

            <div className="zput-span-info">
              <div className="span-item">
                <span className="span-label">Reservation Span:</span>
                <span className="span-value">{logic.reservationSpan} weeks</span>
              </div>
              <div className="span-item">
                <span className="span-label">Months in Span:</span>
                <span className="span-value">{logic.monthsInSpan}</span>
              </div>
              <div className="span-item">
                <span className="span-label">Selected Nights:</span>
                <span className="span-value">{logic.nightsCount} per week</span>
              </div>
              <div className="span-item">
                <span className="span-label">Guest Pattern:</span>
                <span className="span-value">
                  {logic.GUEST_PATTERN_OPTIONS.find(o => o.value === logic.guestPattern)?.label}
                </span>
              </div>
            </div>
          </div>

          {/* Section 9: ZAT Price Configuration */}
          <div className="zput-card">
            <span className="zput-card-title">Section 9: ZAT Config</span>

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

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* ROW 4: Section 10 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="zput-row">
          <Section10PricingListGrid
            pricingList={logic.pricingList}
            listing={logic.selectedListing}
            onUpdatePricingList={logic.handleUpdatePricingList}
            onUpdateStartingNightly={logic.handleUpdateStartingNightly}
            isUpdating={logic.isUpdating}
          />
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* ROW 5: Sections 11 & 12 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="zput-row">
          <Section11WorkflowCheck
            comparisonResults={logic.comparisonResults}
            onRunChecks={logic.handleRunChecks}
            isUpdating={logic.isUpdating}
          />

          <Section12DataValidation
            validationFlags={logic.validationFlags}
          />
        </div>
      </div>
    </>
  );
}
