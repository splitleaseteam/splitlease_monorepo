/**
 * PricingRow Component (V7 Design)
 *
 * Pricing breakdown and total earnings display:
 * - Left: breakdown formula "$165/night x 4 x 12 wks"
 * - Right: "Your Earnings" label + large total "$7,920"
 *
 * Shows strikethrough comparison when counteroffer terms differ from original.
 *
 * Part of the Host Proposals V7 redesign.
 */
import React from 'react';

/**
 * PricingRow displays the pricing information
 * Shows strikethrough comparison when counteroffer pricing differs from original
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

  // Host compensation values (what host actually earns, NOT guest prices)
  const hostNightlyCompensation = proposal?.['host compensation'] || proposal?.host_compensation || 0;
  const originalWeeks = proposal?.['Reservation Span (Weeks)'] || proposal?.reservation_span_weeks || 0;
  const hostTotalCompensation = proposal?.['Total Compensation (proposal - host)'] || proposal?.total_compensation || 0;
  let originalNights = proposal?.['Nights Selected (Nights list)'] || [];
  if (typeof originalNights === 'string') {
    try { originalNights = JSON.parse(originalNights); } catch { originalNights = []; }
  }
  const originalNightsPerWeek = originalNights.length;

  // HC values (host counteroffer)
  const hcNightlyRate = proposal?.['hc nightly price'];
  const hcWeeks = proposal?.['hc reservation span (weeks)'];
  const hcTotalPrice = proposal?.['hc total price'];
  let hcNights = proposal?.['hc nights selected'] || [];
  if (typeof hcNights === 'string') {
    try { hcNights = JSON.parse(hcNights); } catch { hcNights = []; }
  }
  const hcNightsPerWeek = hcNights.length > 0 ? hcNights.length : null;

  // Display values: prioritize HC values when counteroffer happened
  // When counteroffer exists, show HC values as current; otherwise use normalized or original
  const nightlyRate = (isCounteroffer && hcNightlyRate != null) ? hcNightlyRate : (proposal?.nightly_rate || proposal?.price_per_night || hostNightlyCompensation);
  const nightsSelected = (isCounteroffer && hcNights.length > 0) ? hcNights : (proposal?.nights_selected || proposal?.['Nights Selected (Nights list)'] || originalNights);
  const nightsPerWeek = nightsSelected.length;
  const weeks = (isCounteroffer && hcWeeks != null) ? hcWeeks : (proposal?.duration_weeks || proposal?.weeks || proposal?.total_weeks || originalWeeks);
  const totalEarnings = (isCounteroffer && hcTotalPrice != null) ? hcTotalPrice : (proposal?.total_price || proposal?.host_earnings || proposal?.total_amount || hostTotalCompensation);

  // Comparison flags - detect which values changed (comparing HC values to host compensation)
  const nightlyRateChanged = isCounteroffer && hcNightlyRate != null && hcNightlyRate !== hostNightlyCompensation;
  const weeksChanged = isCounteroffer && hcWeeks != null && hcWeeks !== originalWeeks;
  const nightsChanged = isCounteroffer && hcNightsPerWeek != null && hcNightsPerWeek !== originalNightsPerWeek;
  const totalChanged = isCounteroffer && hcTotalPrice != null && hcTotalPrice !== hostTotalCompensation;

  // Format the breakdown with strikethrough support
  const hasBreakdown = nightlyRate > 0 || nightsPerWeek > 0 || weeks > 0;

  // Format total
  const formattedTotal = `$${Number(totalEarnings).toLocaleString()}`;
  const formattedOriginalTotal = `$${Number(hostTotalCompensation).toLocaleString()}`;

  return (
    <div className="hp7-pricing-row">
      <div className="hp7-pricing-breakdown">
        {hasBreakdown ? (
          <>
            {/* Nightly rate */}
            {nightlyRate > 0 && (
              <>
                {nightlyRateChanged && (
                  <span className="hp7-strikethrough">${hostNightlyCompensation}/night</span>
                )}
                <span className={nightlyRateChanged ? 'hp7-changed-value' : ''}>
                  ${nightlyRate}/night
                </span>
              </>
            )}
            {nightlyRate > 0 && nightsPerWeek > 0 && <span>×</span>}

            {/* Nights per week */}
            {nightsPerWeek > 0 && (
              <>
                {nightsChanged && (
                  <span className="hp7-strikethrough">{originalNightsPerWeek}</span>
                )}
                <span className={nightsChanged ? 'hp7-changed-value' : ''}>
                  {nightsPerWeek}
                </span>
              </>
            )}
            {nightsPerWeek > 0 && weeks > 0 && <span>×</span>}

            {/* Weeks */}
            {weeks > 0 && (
              <>
                {weeksChanged && (
                  <span className="hp7-strikethrough">{originalWeeks} wks</span>
                )}
                <span className={weeksChanged ? 'hp7-changed-value' : ''}>
                  {weeks} wks
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
          {totalChanged && (
            <span className="hp7-strikethrough hp7-total-strikethrough">{formattedOriginalTotal}</span>
          )}
          <span className={totalChanged ? 'hp7-changed-value' : ''}>
            {formattedTotal}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PricingRow;
