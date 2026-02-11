import HostScheduleSelector from '../../../shared/HostScheduleSelector/HostScheduleSelector.jsx';
import NightlyPricingLegend from './NightlyPricingLegend';
import { useListingDashboard } from '../context/ListingDashboardContext';
import { formatCurrency } from '../../../../lib/formatters';

// Weekly pattern labels for display
const WEEKLY_PATTERN_LABELS = {
  '1': '1 week on, 1 week off',
  '2': '2 weeks on, 2 weeks off',
  '3': '1 week on, 3 weeks off',
  'custom': 'Custom pattern',
};

export default function PricingSection({ compact = false }) {
  const { listing, handleEditSection } = useListingDashboard();
  const weeklyComp = listing?.weeklyCompensation || {};
  const nightsAvailable = listing?.nightsAvailable || [];
  const isNightly = (listing?.leaseStyle || 'Nightly').toLowerCase() === 'nightly';
  const isMonthly = (listing?.leaseStyle || '').toLowerCase() === 'monthly';
  const isWeekly = (listing?.leaseStyle || '').toLowerCase() === 'weekly';

  const compactRows = [
    {
      label: 'Lease style',
      value: listing?.leaseStyle || 'Nightly',
    },
    isWeekly && listing?.weeksOffered
      ? {
          label: 'Weekly pattern',
          value: WEEKLY_PATTERN_LABELS[listing.weeksOffered] || listing.weeksOffered,
        }
      : null,
    isMonthly
      ? {
          label: 'Monthly host rate',
          value: `${formatCurrency(listing?.monthlyHostRate || 0)}/month`,
          tooltip: 'Amount paid to you after platform fees',
        }
      : null,
    isWeekly
      ? {
          label: 'Weekly host rate',
          value: `${formatCurrency(listing?.weeklyHostRate || 0)}/week`,
          tooltip: 'Amount paid to you after platform fees',
        }
      : null,
    isNightly
      ? {
          label: 'Nights available',
          value: `${nightsAvailable.length}/7`,
        }
      : null,
    {
      label: 'Damage deposit',
      value: formatCurrency(listing?.damageDeposit || 0),
      tooltip: 'One-time refundable deposit collected at check-in',
    },
    {
      label: 'Maintenance fee',
      value: formatCurrency(listing?.maintenanceFee || 0),
      tooltip: 'Recurring fee for cleaning and property upkeep',
    },
  ].filter(Boolean);

  return (
    <div id="pricing" className={compact ? 'listing-dashboard-pricing listing-dashboard-pricing--compact' : 'listing-dashboard-section'}>
      {!compact && (
        <div className="listing-dashboard-section__header">
          <h2 className="listing-dashboard-section__title">Pricing and Lease Style</h2>
          <button className="listing-dashboard-section__edit" onClick={() => handleEditSection('pricing')}>
            edit
          </button>
        </div>
      )}

      {compact ? (
        <div className="listing-dashboard-pricing__compact-list" aria-label="Pricing summary">
          {compactRows.map((row) => (
            <div key={row.label} className="listing-dashboard-pricing__compact-row">
              <span className="listing-dashboard-pricing__compact-label">{row.label}</span>
              <span className="listing-dashboard-pricing__compact-value" data-tooltip={row.tooltip}>{row.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="listing-dashboard-pricing">
        {/* Left Column - Lease Style Info */}
        <div className="listing-dashboard-pricing__left">
          <div className="listing-dashboard-pricing__info">
            <p>
              <strong>Selected Lease Style:</strong> {listing?.leaseStyle || 'Nightly'}
            </p>
            {/* Show Weekly Pattern for Weekly style */}
            {isWeekly && listing?.weeksOffered && (
              <p>
                <strong>Weekly Pattern:</strong>{' '}
                {WEEKLY_PATTERN_LABELS[listing.weeksOffered] || listing.weeksOffered}
              </p>
            )}
          </div>

          {/* Host Schedule Selector - Display Only (only for nightly) */}
          {isNightly && (
            <div className="listing-dashboard-pricing__days">
              <p className="listing-dashboard-pricing__days-label">Nights / Week</p>
              <HostScheduleSelector
                listing={{ nightsAvailable }}
                selectedNights={nightsAvailable}
                isClickable={false}
                mode="preview"
              />
              <div className="listing-dashboard-pricing__legend">
                <span className="listing-dashboard-pricing__legend-dot listing-dashboard-pricing__legend-dot--available" />
                <span>
                  {nightsAvailable.length === 7 ? 'All nights available' : `${nightsAvailable.length} nights available`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Pricing Info */}
        <div className="listing-dashboard-pricing__right">
          {/* Monthly pricing shows just the monthly host rate */}
          {isMonthly ? (
            <div className="listing-dashboard-pricing__monthly-rate">
              <p className="listing-dashboard-pricing__monthly-rate-label">Monthly Host Rate</p>
              <p
                className="listing-dashboard-pricing__monthly-rate-value"
                data-tooltip="Amount paid to you after platform fees"
              >
                {formatCurrency(listing?.monthlyHostRate || 0)}
                <span className="listing-dashboard-pricing__monthly-rate-period">/month</span>
              </p>
            </div>
          ) : isWeekly ? (
            <div className="listing-dashboard-pricing__weekly-rate">
              <p className="listing-dashboard-pricing__weekly-rate-label">Weekly Host Rate</p>
              <p
                className="listing-dashboard-pricing__weekly-rate-value"
                data-tooltip="Amount paid to you after platform fees"
              >
                {formatCurrency(listing?.weeklyHostRate || 0)}
                <span className="listing-dashboard-pricing__weekly-rate-period">/week</span>
              </p>
            </div>
          ) : isNightly ? (
            <NightlyPricingLegend
              weeklyCompensation={weeklyComp}
              nightsPerWeekMin={listing?.nightsPerWeekMin || 2}
              nightsPerWeekMax={listing?.nightsPerWeekMax || 7}
            />
          ) : null}

          <div className="listing-dashboard-pricing__fees">
            <p><strong>Additional Charges</strong></p>
            <p data-tooltip="One-time refundable deposit collected at check-in">
              Damage Deposit: {formatCurrency(listing?.damageDeposit || 0)}
            </p>
            <p data-tooltip="Recurring fee for cleaning and property upkeep">
              Maintenance Fee: {formatCurrency(listing?.maintenanceFee || 0)}
            </p>
          </div>
        </div>
          </div>

          <div className="listing-dashboard-section__footer">
            <button className="listing-dashboard-section__edit-bottom" onClick={() => handleEditSection('pricing')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Pricing & Lease Style
            </button>
          </div>
        </>
      )}
    </div>
  );
}
