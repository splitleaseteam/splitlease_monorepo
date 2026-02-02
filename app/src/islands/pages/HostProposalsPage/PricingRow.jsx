/**
 * PricingRow Component (V7 Design)
 *
 * Pricing breakdown and total earnings display:
 * - Left: breakdown formula based on rental type (monthly, weekly, or nightly)
 * - Right: "Your Earnings" label + large total
 *
 * Shows compensation in the appropriate unit based on rental type:
 * - Monthly: "$4,500/mo × 5 months"
 * - Weekly: "$1,125/wk × 20 weeks"
 * - Nightly: "$375/night × 3 × 20 wks"
 *
 * Part of the Host Proposals V7 redesign.
 */
import React from 'react';

/**
 * PricingRow displays the pricing information
 * Shows host compensation based on rental type (monthly, weekly, or nightly)
 *
 * @param {Object} props
 * @param {Object} props.proposal - The proposal object
 * @param {boolean} props.isDeclined - Whether the proposal is declined (shows strikethrough)
 */
export function PricingRow({ proposal, isDeclined = false }) {
  // Check if counteroffer happened
  const isCounteroffer = proposal?.['counter offer happened'] ||
    proposal?.counterOfferHappened ||
    proposal?.counter_offer_happened;

  // Get rental type to determine how to display compensation
  const rentalType = (proposal?.['rental type'] || proposal?.rental_type || 'nightly').toLowerCase();
  const isMonthly = rentalType === 'monthly';
  const isWeekly = rentalType === 'weekly';

  // Calculate host compensation from GUEST price (hosts earn 85% of what guests pay)
  // The database "Total Compensation (proposal - host)" field can be incorrect,
  // so we calculate from guest nightly price which is the source of truth
  const guestNightlyPrice = proposal?.['proposal nightly price'] || proposal?.nightly_rate || 0;
  const HOST_SHARE_PERCENTAGE = 0.85; // Host receives 85% of guest price
  const hostNightlyRate = guestNightlyPrice * HOST_SHARE_PERCENTAGE;

  const originalWeeks = proposal?.['Reservation Span (Weeks)'] || proposal?.reservation_span_weeks || 0;
  const durationMonths = proposal?.['duration in months'] || Math.round(originalWeeks / 4);

  let originalNights = proposal?.['Nights Selected (Nights list)'] || [];
  if (typeof originalNights === 'string') {
    try { originalNights = JSON.parse(originalNights); } catch { originalNights = []; }
  }
  const originalNightsPerWeek = originalNights.length;

  // HC values (host counteroffer)
  const hcWeeks = proposal?.['hc reservation span (weeks)'];
  let hcNights = proposal?.['hc nights selected'] || [];
  if (typeof hcNights === 'string') {
    try { hcNights = JSON.parse(hcNights); } catch { hcNights = []; }
  }
  const hcNightsPerWeek = hcNights.length > 0 ? hcNights.length : null;

  // Display values
  const nightsSelected = (isCounteroffer && hcNights.length > 0) ? hcNights : (proposal?.nights_selected || proposal?.['Nights Selected (Nights list)'] || originalNights);
  const nightsPerWeek = nightsSelected.length;
  const weeks = (isCounteroffer && hcWeeks != null) ? hcWeeks : (proposal?.duration_weeks || proposal?.weeks || proposal?.total_weeks || originalWeeks);

  // Calculate host total from nightly rate (NOT from database field which can be incorrect)
  const totalNightsCount = nightsPerWeek * weeks;
  const hostTotalCompensation = Math.round(hostNightlyRate * totalNightsCount * 100) / 100;
  const totalEarnings = hostTotalCompensation;

  // Calculate rate display based on rental type
  // All rates are derived from the correct host nightly rate
  let rateValue = 0;
  let rateUnit = '';
  let periodCount = 0;
  let periodUnit = '';

  if (isMonthly) {
    // Monthly rental: calculate monthly compensation from host nightly rate
    const nightsPerMonth = nightsPerWeek * 4; // Approximate nights per month
    rateValue = Math.round(hostNightlyRate * nightsPerMonth);
    rateUnit = '/mo';
    periodCount = durationMonths;
    periodUnit = durationMonths === 1 ? 'month' : 'months';
  } else if (isWeekly) {
    // Weekly rental: calculate weekly compensation from host nightly rate
    rateValue = Math.round(hostNightlyRate * nightsPerWeek);
    rateUnit = '/wk';
    periodCount = weeks;
    periodUnit = weeks === 1 ? 'week' : 'weeks';
  } else {
    // Nightly rental: show per-night host compensation directly
    rateValue = Math.round(hostNightlyRate * 100) / 100;
    rateUnit = '/night';
    periodCount = weeks;
    periodUnit = 'wks';
  }

  // Comparison flags - detect which schedule terms changed (nights, weeks)
  const weeksChanged = isCounteroffer && hcWeeks != null && hcWeeks !== originalWeeks;
  const nightsChanged = isCounteroffer && hcNightsPerWeek != null && hcNightsPerWeek !== originalNightsPerWeek;

  // Format the breakdown with strikethrough support
  const hasBreakdown = rateValue > 0 || periodCount > 0;

  // Format total
  const formattedTotal = `$${Number(totalEarnings).toLocaleString()}`;

  return (
    <div className="hp7-pricing-row">
      <div className="hp7-pricing-breakdown">
        {hasBreakdown ? (
          <>
            {/* Rate (monthly, weekly, or nightly depending on rental type) */}
            {rateValue > 0 && (
              <span>${rateValue.toLocaleString()}{rateUnit}</span>
            )}

            {/* For nightly rentals, show nights per week */}
            {!isMonthly && !isWeekly && rateValue > 0 && nightsPerWeek > 0 && (
              <>
                <span>×</span>
                {nightsChanged && (
                  <span className="hp7-strikethrough">{originalNightsPerWeek}</span>
                )}
                <span className={nightsChanged ? 'hp7-changed-value' : ''}>
                  {nightsPerWeek}
                </span>
              </>
            )}

            {/* Period count (months, weeks) */}
            {periodCount > 0 && (
              <>
                <span>×</span>
                {weeksChanged && (
                  <span className="hp7-strikethrough">{isMonthly ? Math.round(originalWeeks / 4) : originalWeeks} {periodUnit}</span>
                )}
                <span className={weeksChanged ? 'hp7-changed-value' : ''}>
                  {periodCount} {periodUnit}
                </span>
              </>
            )}
          </>
        ) : (
          <span>Pricing details</span>
        )}
      </div>
      <div className="hp7-pricing-total-wrapper">
        <div className="hp7-pricing-total-label">
          {isDeclined ? 'Was Offered' : 'Your Earnings'}
        </div>
        <div className={`hp7-pricing-total${isDeclined ? ' declined' : ''}`}>
          {formattedTotal}
        </div>
      </div>
    </div>
  );
}

export default PricingRow;
