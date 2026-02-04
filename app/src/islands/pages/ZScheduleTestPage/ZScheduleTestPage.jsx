/**
 * Z-Schedule Test Page
 *
 * Internal testing dashboard for schedule selectors and pricing workflows.
 * Follows the Hollow Component Pattern - all logic in useZScheduleTestPageLogic hook.
 *
 * Route: /_internal/z-schedule-test
 * Auth: None (internal test page)
 */

import { useZScheduleTestPageLogic } from './useZScheduleTestPageLogic.js';
import HostScheduleSelector from '../../shared/HostScheduleSelector/HostScheduleSelector.jsx';
import SearchScheduleSelector from '../../shared/SearchScheduleSelector.jsx';
import ListingScheduleSelector from '../../shared/ListingScheduleSelector.jsx';
import ScheduleValidationMatrix from '../../shared/ScheduleValidationMatrix.jsx';
import './ZScheduleTestPage.css';

const WEEK_PATTERN_OPTIONS = [
  { value: 'every-week', label: 'Every Week' },
  { value: 'one-on-off', label: '1 Week On / 1 Off' },
  { value: 'two-on-off', label: '2 On / 2 Off' },
  { value: 'one-three-off', label: '1 On / 3 Off' }
];

function formatCurrency(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '$0';
  return `$${Math.round(value).toLocaleString()}`;
}

function formatList(items) {
  if (!items || items.length === 0) return 'None';
  return items.join(', ');
}

export default function ZScheduleTestPage() {
  const {
    listings,
    listingsLoading,
    listingsError,
    selectedListingId,
    selectedListing,
    scheduleListing,
    zatConfig,
    reservationSpan,
    weekPattern,
    limitToFiveNights,
    activeUserLabel,
    hostSelectedNights,
    hostContiguity,
    searchSelectedDays,
    searchCheckInOut,
    listingSelectedDays,
    listingScheduleState,
    listingPriceBreakdown,
    showOptionSets,
    handleListingChange,
    handleReservationSpanChange,
    handleWeekPatternChange,
    handleLimitToggle,
    handleUserChange,
    handleHostSelectionChange,
    handleSearchSelectionChange,
    handleListingSelectionChange,
    handleListingPriceChange,
    handleListingScheduleChange,
    toggleOptionSets,
    edgeCaseScenarios,
    selectedScenario,
    handleLoadScenario
  } = useZScheduleTestPageLogic();

  if (listingsLoading) {
    return (
      <div className="zst-state">
        <div className="zst-state-card">Loading schedule test data...</div>
      </div>
    );
  }

  if (listingsError) {
    return (
      <div className="zst-state">
        <div className="zst-state-card zst-state-card--error">{listingsError}</div>
      </div>
    );
  }

  return (
    <div className="zst-page">
      <header className="zst-header">
        <h1>Schedule Test | Admin</h1>
        <p>Validate schedule selectors, pricing spans, and listing availability.</p>
      </header>

      <div className="zst-container">
        <aside className="zst-sidebar">
          <div className="zst-card">
            <span className="zst-card-title">Test Context</span>
            <label className="zst-label" htmlFor="zst-listing-select">Listing</label>
            <select
              id="zst-listing-select"
              className="zst-select"
              value={selectedListingId || ''}
              onChange={(event) => handleListingChange(event.target.value)}
            >
              <option value="">Select listing</option>
              {listings.map((listing) => (
                <option key={listing._id} value={listing._id}>
                  {listing.Name || listing._id}
                </option>
              ))}
            </select>
            {selectedListing && (
              <div className="zst-meta">
                <p><span>Name</span>{selectedListing.Name || 'Untitled'}</p>
                <p><span>Rental Type</span>{selectedListing['rental type'] || 'Nightly'}</p>
                <p><span>Weeks Offered</span>{selectedListing['Weeks offered'] || 'Every week'}</p>
                <p><span>Min Nights</span>{selectedListing['Minimum Nights'] ?? 'n/a'}</p>
                <p><span>Max Nights</span>{selectedListing['Maximum Nights'] ?? 'n/a'}</p>
              </div>
            )}
          </div>

          <div className="zst-card">
            <span className="zst-card-title">Controls</span>
            <label className="zst-label" htmlFor="zst-reservation-span">Reservation Span (Weeks)</label>
            <input
              id="zst-reservation-span"
              className="zst-input"
              type="number"
              min="1"
              value={reservationSpan}
              onChange={(event) => handleReservationSpanChange(event.target.value)}
            />
            <label className="zst-label" htmlFor="zst-week-pattern">Guest Pattern</label>
            <select
              id="zst-week-pattern"
              className="zst-select"
              value={weekPattern}
              onChange={(event) => handleWeekPatternChange(event.target.value)}
            >
              {WEEK_PATTERN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label className="zst-toggle">
              <input
                type="checkbox"
                checked={limitToFiveNights}
                onChange={handleLimitToggle}
              />
              Limit Listing Selector to 5 Nights
            </label>
            <label className="zst-toggle">
              <input
                type="checkbox"
                checked={showOptionSets}
                onChange={toggleOptionSets}
              />
              Show Day/Night Option Sets
            </label>
          </div>

          <div className="zst-card">
            <span className="zst-card-title">User Context</span>
            <div className="zst-button-row">
              <button type="button" className={`zst-button ${activeUserLabel === 'Frederick' ? 'active' : ''}`} onClick={() => handleUserChange('Frederick')}>
                Log In as Frederick
              </button>
              <button type="button" className={`zst-button ${activeUserLabel === 'Sharath' ? 'active' : ''}`} onClick={() => handleUserChange('Sharath')}>
                Log In as Sharath
              </button>
            </div>
            <div className="zst-meta">
              <p><span>Active User</span>{activeUserLabel}</p>
            </div>
          </div>

          <div className="zst-card">
            <span className="zst-card-title">Price Configuration</span>
            {zatConfig ? (
              <div className="zst-meta">
                <p><span>Full Time Discount</span>{(zatConfig.fullTimeDiscount * 100).toFixed(1)}%</p>
                <p><span>Avg Days / Month</span>{zatConfig.avgDaysPerMonth}</p>
                <p><span>Weekly Markup</span>{(zatConfig.weeklyMarkup * 100).toFixed(1)}%</p>
                <p><span>Site Markup</span>{(zatConfig.overallSiteMarkup * 100).toFixed(1)}%</p>
              </div>
            ) : (
              <p className="zst-muted">Loading configuration...</p>
            )}
          </div>

          <div className="zst-card">
            <span className="zst-card-title">Edge Case Scenarios</span>
            <div className="zst-button-row">
              {edgeCaseScenarios.map(scenario => (
                <button
                  key={scenario.id}
                  type="button"
                  className={`zst-button ${selectedScenario?.id === scenario.id ? 'active' : ''}`}
                  onClick={() => handleLoadScenario(scenario.id)}
                >
                  {scenario.name}
                </button>
              ))}
            </div>
            {selectedScenario && (
              <div className="zst-meta">
                <p><span>Expected Valid</span>{selectedScenario.expectedValid ? 'Yes' : 'No'}</p>
                <p><span>Expected Nights</span>{selectedScenario.expectedNights ?? 'N/A'}</p>
                {selectedScenario.expectedError && (
                  <p><span>Expected Error</span>{selectedScenario.expectedError}</p>
                )}
              </div>
            )}
          </div>
        </aside>

        <section className="zst-main">
          <div className="zst-grid">
            <div className="zst-card">
              <span className="zst-card-title">Host Schedule Selector</span>
              <HostScheduleSelector
                listing={scheduleListing}
                onSelectionChange={handleHostSelectionChange}
                showAlertsOnLive={false}
                isLiveVersion={false}
              />
              <div className="zst-meta">
                <p><span>Selected Nights</span>{formatList(hostSelectedNights)}</p>
                <p><span>Contiguous</span>{hostContiguity ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div className="zst-card">
              <span className="zst-card-title">Search Schedule Selector</span>
              <SearchScheduleSelector
                updateUrl={false}
                weekPattern={weekPattern}
                onSelectionChange={handleSearchSelectionChange}
              />
              <div className="zst-meta">
                <p><span>Selected Days</span>{formatList(searchSelectedDays.map((day) => day.name))}</p>
                <p><span>Check In</span>{searchCheckInOut.checkIn?.name || 'n/a'}</p>
                <p><span>Check Out</span>{searchCheckInOut.checkOut?.name || 'n/a'}</p>
              </div>
            </div>

            <div className="zst-card">
              <span className="zst-card-title">Listing Schedule Selector</span>
              <ListingScheduleSelector
                listing={scheduleListing}
                reservationSpan={reservationSpan}
                limitToFiveNights={limitToFiveNights}
                zatConfig={zatConfig}
                onSelectionChange={handleListingSelectionChange}
                onPriceChange={handleListingPriceChange}
                onScheduleChange={handleListingScheduleChange}
              />
            </div>

            <div className="zst-card">
              <span className="zst-card-title">Triple-Check Validation Matrix</span>
              <p className="zst-description">
                Compares validation results across Golden Validator, Backend Workflow, and Frontend Validators.
              </p>
              {listingSelectedDays.length > 0 ? (
                <ScheduleValidationMatrix
                  selectedDayIndices={listingSelectedDays.map(d => d.dayOfWeek)}
                  listing={scheduleListing}
                />
              ) : (
                <p className="zst-muted">Select days above to see validation matrix</p>
              )}
            </div>
          </div>

          <div className="zst-debug">
            <div className="zst-card">
              <span className="zst-card-title">Listing Selector Output</span>
              <div className="zst-meta">
                <p><span>Selected Days</span>{formatList(listingSelectedDays.map((day) => day.name))}</p>
                <p><span>Check In Day</span>{listingScheduleState?.checkInDay?.name || 'n/a'}</p>
                <p><span>Check Out Day</span>{listingScheduleState?.checkOutDay?.name || 'n/a'}</p>
                <p><span>Selected Nights</span>{listingScheduleState?.selectedNights?.length ?? 0}</p>
                <p><span>Not Selected Days</span>{formatList((listingScheduleState?.notSelectedDays || []).map((day) => day.first3Letters))}</p>
              </div>
            </div>
            <div className="zst-card">
              <span className="zst-card-title">Pricing Outputs</span>
              <div className="zst-meta">
                <p><span>Nightly Price</span>{formatCurrency(listingPriceBreakdown?.pricePerNight || 0)}</p>
                <p><span>4 Week Rent</span>{formatCurrency(listingPriceBreakdown?.fourWeekRent || 0)}</p>
                <p><span>Total Reservation</span>{formatCurrency(listingPriceBreakdown?.reservationTotal || 0)}</p>
                <p><span>Initial Payment</span>{formatCurrency(listingPriceBreakdown?.initialPayment || 0)}</p>
                <p><span>Damage Deposit</span>{formatCurrency(listingPriceBreakdown?.damageDeposit || 0)}</p>
                <p><span>Cleaning Deposit</span>{formatCurrency(listingPriceBreakdown?.cleaningFee || 0)}</p>
              </div>
            </div>
            {showOptionSets && (
              <div className="zst-card">
                <span className="zst-card-title">Option Sets</span>
                <div className="zst-meta">
                  <p><span>Nights Option Set</span>Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday</p>
                  <p><span>Days Option Set</span>Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
