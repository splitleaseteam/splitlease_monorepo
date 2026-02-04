import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import HostScheduleSelector from '../../../shared/HostScheduleSelector/HostScheduleSelector.jsx';
import InformationalText from '../../../shared/InformationalText';
import { logger } from '../../../../lib/logger';
import { formatCurrency } from '../../../../lib/formatters';
import LeaseStyleSelector from './PricingEditSection/LeaseStyleSelector';
import NightlyPricingForm from './PricingEditSection/NightlyPricingForm';
import WeeklyPricingForm from './PricingEditSection/WeeklyPricingForm';
import MonthlyPricingForm from './PricingEditSection/MonthlyPricingForm';

// Rental type options based on LeaseStyleSelector
const RENTAL_TYPES = [
  {
    id: 'Nightly',
    title: 'Nightly',
    description: 'Rent your space by the night. Best for hosts who want flexibility and higher potential income through short-term stays.',
    benefits: ['Maximized nightly rates', 'Flexible calendar management'],
  },
  {
    id: 'Weekly',
    title: 'Weekly (Split Lease)',
    description: 'Rent your space for specific weeks (e.g., Week 1 & 3 of every month). Best for hosts who use their space regularly but want to monetize it when away.',
    benefits: ['Consistent schedule', 'Predictable income from recurring guests'],
  },
  {
    id: 'Monthly',
    title: 'Monthly (Sublet)',
    description: 'Standard month-to-month lease (e.g., continuous stay from August to December). Best for hosts who want steady occupancy with minimal management.',
    benefits: ['Continuous occupancy with stable income', 'Set your monthly rate'],
  },
];

// Weekly pattern options
const WEEKLY_PATTERNS = [
  { value: '', label: 'Select a Weekly Pattern' },
  { value: '1', label: '1 week on, 1 week off' },
  { value: '2', label: '2 weeks on, 2 weeks off' },
  { value: '3', label: '1 week on, 3 weeks off' },
  { value: 'custom', label: 'Custom pattern' },
];

/**
 * PricingEditSection - Full editing panel for pricing and lease style
 * Based on Bubble.io "Pricing and Availability" section
 */
export default function PricingEditSection({
  listing,
  onClose,
  onSave,
  isOwner = true,
}) {
  // State for form fields
  const [selectedRentalType, setSelectedRentalType] = useState(listing?.leaseStyle || 'Nightly');
  const [damageDeposit, setDamageDeposit] = useState(listing?.damageDeposit || 500);
  const [maintenanceFee, setMaintenanceFee] = useState(listing?.maintenanceFee || 125);

  // Nightly specific state
  const [selectedNights, setSelectedNights] = useState(listing?.nightsAvailable || []);
  const [minNights, setMinNights] = useState(listing?.nightsPerWeekMin || 2);
  const [maxNights, setMaxNights] = useState(listing?.nightsPerWeekMax || 7);
  const [nightlyPricing, setNightlyPricing] = useState({
    2: listing?.weeklyCompensation?.[2] || 0,
    3: listing?.weeklyCompensation?.[3] || 0,
    4: listing?.weeklyCompensation?.[4] || 0,
    5: listing?.weeklyCompensation?.[5] || 0,
  });

  // Weekly specific state
  const [weeksOffered, setWeeksOffered] = useState(listing?.weeksOffered || '');
  const [weeklyRate, setWeeklyRate] = useState(listing?.weeklyHostRate || 0);

  // Monthly specific state
  const [monthlyRate, setMonthlyRate] = useState(listing?.monthlyHostRate || 0);
  const [monthlyAgreement, setMonthlyAgreement] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [activeInfoTooltip, setActiveInfoTooltip] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Track if any changes were made
  const hasChanges = useMemo(() => {
    if (selectedRentalType !== (listing?.leaseStyle || 'Nightly')) return true;

    // Check common fields
    if (damageDeposit !== (listing?.damageDeposit || 500)) return true;
    if (maintenanceFee !== (listing?.maintenanceFee || 125)) return true;

    // Check nightly-specific fields
    if (selectedRentalType === 'Nightly') {
      const originalNights = listing?.nightsAvailable || [];
      if (selectedNights.length !== originalNights.length) return true;
      if (!selectedNights.every((n) => originalNights.includes(n))) return true;
      if (minNights !== (listing?.nightsPerWeekMin || 2)) return true;
      if (maxNights !== (listing?.nightsPerWeekMax || 7)) return true;
      // Check pricing changes
      const originalComp = listing?.weeklyCompensation || {};
      if (nightlyPricing[2] !== (originalComp[2] || 0)) return true;
      if (nightlyPricing[3] !== (originalComp[3] || 0)) return true;
      if (nightlyPricing[4] !== (originalComp[4] || 0)) return true;
      if (nightlyPricing[5] !== (originalComp[5] || 0)) return true;
    }

    // Check weekly-specific fields
    if (selectedRentalType === 'Weekly') {
      if (weeklyRate !== (listing?.weeklyHostRate || 0)) return true;
      if (weeksOffered !== (listing?.weeksOffered || '')) return true;
    }

    // Check monthly-specific fields
    if (selectedRentalType === 'Monthly') {
      if (monthlyRate !== (listing?.monthlyHostRate || 0)) return true;
    }

    return false;
  }, [
    selectedRentalType,
    damageDeposit,
    maintenanceFee,
    selectedNights,
    minNights,
    maxNights,
    nightlyPricing,
    weeklyRate,
    weeksOffered,
    monthlyRate,
    listing,
  ]);

  // Refs for informational text tooltips
  const infoRefs = {
    pricingControls: useRef(null),
    damageDeposit: useRef(null),
    maintenanceFee: useRef(null),
    nightsPerWeek: useRef(null),
    weeklyComp: {
      2: useRef(null),
      3: useRef(null),
      4: useRef(null),
      5: useRef(null),
    },
    weeklyPricing: useRef(null),
    monthlyComp: useRef(null),
    monthlyAgreement: useRef(null),
  };

  // Informational text content
  const infoContent = {
    pricingControls: {
      title: 'Pricing Controls',
      content: 'Set your pricing preferences for your listing based on your chosen rental style. Your rates determine how much you earn when guests book.',
    },
    damageDeposit: {
      title: 'Damage Deposit',
      content: 'A refundable security deposit to cover potential damages during the stay. This protects your property and is returned to the guest if no damage occurs.',
      expandedContent: 'The minimum damage deposit is $500. This amount is held during the stay and refunded within 7 days after checkout, minus any deductions for damages.',
    },
    maintenanceFee: {
      title: 'Maintenance Fee',
      content: 'A recurring monthly fee to cover cleaning and maintenance costs between guest stays.',
      expandedContent: 'This fee helps ensure your property stays in top condition. It covers regular cleaning, minor repairs, and general upkeep.',
    },
    nightsPerWeek: {
      title: 'Nights Per Week',
      content: 'Set the minimum and maximum number of nights guests can book per week. This gives you control over your schedule while maximizing occupancy.',
    },
    weeklyComp2: {
      title: '2-Night Occupancy',
      content: 'Set the weekly rate you want to receive when guests book 2 nights per week.',
      expandedContent: 'Your nightly rate at 2 nights/week will be calculated by dividing your weekly compensation by 2.',
    },
    weeklyComp3: {
      title: '3-Night Occupancy',
      content: 'Set the weekly rate you want to receive when guests book 3 nights per week.',
      expandedContent: 'Your nightly rate at 3 nights/week will be calculated by dividing your weekly compensation by 3.',
    },
    weeklyComp4: {
      title: '4-Night Occupancy',
      content: 'Set the weekly rate you want to receive when guests book 4 nights per week.',
      expandedContent: 'Your nightly rate at 4 nights/week will be calculated by dividing your weekly compensation by 4.',
    },
    weeklyComp5: {
      title: '5-Night Occupancy',
      content: 'Set the weekly rate you want to receive when guests book 5 nights per week.',
      expandedContent: 'Your nightly rate at 5 nights/week will be calculated by dividing your weekly compensation by 5.',
    },
    weeklyPricing: {
      title: 'Weekly Rate',
      content: 'Set the weekly rate for your listing. This is the total amount you\'ll receive for each week a guest stays.',
    },
    monthlyComp: {
      title: 'Monthly Compensation',
      content: 'Set the monthly rate for your listing. This should be between $1,000 and $10,000.',
      expandedContent: 'Your monthly rate is the total you\'ll receive each month. Split Lease handles all guest payments and ensures consistent monthly income.',
    },
    monthlyAgreement: {
      title: 'Monthly Model Agreement',
      content: 'Our Split Lease Monthly model helps guests meet rent obligations through a subsidy. For financial stability, we may need to sublease unused nights.',
      expandedContent: 'If this arrangement isn\'t ideal for you, consider our Nightly or Weekly models which don\'t require this provision. These offer more flexibility in how your space is used.',
    },
  };

  // Handle info tooltip toggle
  const handleInfoClick = (tooltipId) => (e) => {
    e.stopPropagation();
    setActiveInfoTooltip(activeInfoTooltip === tooltipId ? null : tooltipId);
  };

  // Handle back button click - show confirmation if changes exist
  const handleBackClick = useCallback(() => {
    if (hasChanges) {
      setShowConfirmModal(true);
    } else {
      if (typeof onClose === 'function') {
        onClose();
      } else {
        logger.error('onClose is not a function:', onClose);
      }
    }
  }, [hasChanges, onClose]);

  // Handle night selection change
  const handleNightSelectionChange = useCallback((nights) => {
    setSelectedNights(nights);
  }, []);

  // Handle select all nights
  const handleSelectAllNights = useCallback(() => {
    setSelectedNights([
      'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
    ]);
  }, []);

  // Calculate nightly rate from weekly compensation
  const calculateNightlyRate = (weeklyComp, nightCount) => {
    if (!weeklyComp || nightCount === 0) return 0;
    return Math.round(weeklyComp / nightCount);
  };

  // Validate form based on rental type
  const isFormValid = useCallback(() => {
    if (!isOwner) return false;
    if (damageDeposit < 500) return false;

    switch (selectedRentalType) {
      case 'Nightly':
        if (selectedNights.length < 2) return false;
        if (selectedNights.length >= 2 && !nightlyPricing[2]) return false;
        if (selectedNights.length >= 3 && !nightlyPricing[3]) return false;
        if (selectedNights.length >= 4 && !nightlyPricing[4]) return false;
        if (selectedNights.length >= 5 && !nightlyPricing[5]) return false;
        return true;
      case 'Weekly':
        return weeksOffered !== '' && weeklyRate > 0;
      case 'Monthly':
        return (
          monthlyAgreement === 'agree' &&
          monthlyRate >= 1000 &&
          monthlyRate <= 10000
        );
      default:
        return false;
    }
  }, [
    isOwner, damageDeposit, selectedRentalType, selectedNights,
    nightlyPricing, weeksOffered, weeklyRate, monthlyAgreement, monthlyRate,
  ]);

  // Build a human-readable list of what changed
  const getChangeSummary = () => {
    const changes = [];
    const originalLeaseStyle = listing?.leaseStyle || 'Nightly';

    if (selectedRentalType !== originalLeaseStyle) {
      changes.push(`Lease style: ${originalLeaseStyle} → ${selectedRentalType}`);
    }

    if (damageDeposit !== (listing?.damageDeposit || 500)) {
      changes.push(`Damage deposit: $${listing?.damageDeposit || 500} → $${damageDeposit}`);
    }
    if (maintenanceFee !== (listing?.maintenanceFee || 125)) {
      changes.push(`Maintenance fee: $${listing?.maintenanceFee || 125} → $${maintenanceFee}`);
    }

    if (selectedRentalType === 'Nightly') {
      const originalNights = listing?.nightsAvailable || [];
      if (selectedNights.length !== originalNights.length ||
        !selectedNights.every((n) => originalNights.includes(n))) {
        changes.push(`Available nights updated (${selectedNights.length} nights)`);
      }
      const originalComp = listing?.weeklyCompensation || {};
      const pricingChanged = [2, 3, 4, 5].some(
        (n) => nightlyPricing[n] !== (originalComp[n] || 0)
      );
      if (pricingChanged) {
        changes.push('Nightly rates updated');
      }
    } else if (selectedRentalType === 'Weekly') {
      if (weeklyRate !== (listing?.weeklyHostRate || 0)) {
        changes.push(`Weekly rate: $${weeklyRate}/week`);
      }
      if (weeksOffered !== (listing?.weeksOffered || '')) {
        changes.push(`Weekly pattern updated`);
      }
    } else if (selectedRentalType === 'Monthly') {
      if (monthlyRate !== (listing?.monthlyHostRate || 0)) {
        changes.push(`Monthly rate: $${monthlyRate}/month`);
      }
    }

    return changes;
  };

  // Handle save
  const handleSave = async () => {
    if (!isFormValid()) return;

    setIsSaving(true);
    try {
      const changeSummary = getChangeSummary();
      const updates = {
        'rental type': selectedRentalType,
        'damage_deposit': damageDeposit,
        'cleaning_fee': maintenanceFee,
        'Minimum Nights': minNights,
        'Maximum Nights': maxNights,
      };

      if (selectedRentalType === 'Nightly') {
        const nightMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
        const dayIndices = selectedNights.map((n) => nightMap[n]).sort((a, b) => a - b);
        updates['Days Available (List of Days)'] = JSON.stringify(dayIndices);

        updates['nightly_rate_2_nights'] = calculateNightlyRate(nightlyPricing[2], 2);
        updates['nightly_rate_3_nights'] = calculateNightlyRate(nightlyPricing[3], 3);
        updates['nightly_rate_4_nights'] = calculateNightlyRate(nightlyPricing[4], 4);
        updates['nightly_rate_5_nights'] = calculateNightlyRate(nightlyPricing[5], 5);
        updates['nightly_rate_6_nights'] = calculateNightlyRate(nightlyPricing[5], 6);
        updates['nightly_rate_7_nights'] = calculateNightlyRate(nightlyPricing[5], 7);
      } else if (selectedRentalType === 'Weekly') {
        updates['Weeks offered'] = weeksOffered;
        updates['weekly_host_rate'] = weeklyRate;
      } else if (selectedRentalType === 'Monthly') {
        updates['monthly_host_rate'] = monthlyRate;
      }

      await onSave(updates);

      window.showToast?.({
        title: 'Pricing Updated!',
        content: changeSummary.length > 0 ? changeSummary.join(' • ') : 'Pricing settings saved',
        type: 'success'
      });

      onClose();
    } catch (error) {
      logger.error('Error saving pricing:', error);
      window.showToast?.({
        title: 'Save Failed',
        content: 'Failed to save pricing. Please try again.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pricing-edit-overlay">
      <div className="pricing-edit-container">
        {/* Header with back button */}
        <div className="pricing-edit-header">
          <button className="pricing-edit-back" onClick={handleBackClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Go Back</span>
          </button>
        </div>

        {/* Main content */}
        <div className="pricing-edit-content">
          <div className="pricing-edit-title-row">
            <div className="pricing-edit-title">
              <h2>Pricing Controls</h2>
              <button
                ref={infoRefs.pricingControls}
                className="pricing-edit-help"
                onClick={handleInfoClick('pricingControls')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>
            </div>
            <button
              className={`pricing-edit-save ${!isFormValid() ? 'pricing-edit-save--disabled' : ''}`}
              onClick={handleSave}
              disabled={!isFormValid() || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>

          <LeaseStyleSelector
            activeStyle={selectedRentalType.toLowerCase()}
            onSelect={(id) => {
              const formattedId = id.charAt(0).toUpperCase() + id.slice(1);
              setSelectedRentalType(formattedId);
            }}
          />

          <div className="pricing-edit-common-fields">
            <div className="pricing-edit-field">
              <label>
                Damage Deposit*
                <button ref={infoRefs.damageDeposit} className="pricing-edit-field__help" onClick={handleInfoClick('damageDeposit')}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </button>
              </label>
              <input
                type="number"
                value={damageDeposit}
                onChange={(e) => setDamageDeposit(Number(e.target.value))}
                min={500}
                disabled={!isOwner}
              />
            </div>

            <div className="pricing-edit-field">
              <label>
                Monthly Maintenance Fee
                <button ref={infoRefs.maintenanceFee} className="pricing-edit-field__help" onClick={handleInfoClick('maintenanceFee')}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </button>
              </label>
              <input
                type="number"
                value={maintenanceFee}
                onChange={(e) => setMaintenanceFee(Number(e.target.value))}
                disabled={!isOwner}
              />
            </div>
          </div>

          {selectedRentalType === 'Nightly' && (
            <NightlyPricingForm
              selectedNights={selectedNights}
              onNightSelectionChange={handleNightSelectionChange}
              onSelectAllNights={handleSelectAllNights}
              minNights={minNights}
              setMinNights={setMinNights}
              maxNights={maxNights}
              setMaxNights={setMaxNights}
              nightlyPricing={nightlyPricing}
              setNightlyPricing={setNightlyPricing}
              calculateNightlyRate={calculateNightlyRate}
              formatCurrency={formatCurrency}
              isOwner={isOwner}
              infoRefs={infoRefs}
              onInfoClick={handleInfoClick}
            />
          )}

          {selectedRentalType === 'Weekly' && (
            <WeeklyPricingForm
              weeksOffered={weeksOffered}
              setWeeksOffered={setWeeksOffered}
              weeklyRate={weeklyRate}
              setWeeklyRate={setWeeklyRate}
              isOwner={isOwner}
              infoRefs={infoRefs}
              onInfoClick={handleInfoClick}
            />
          )}

          {selectedRentalType === 'Monthly' && (
            <MonthlyPricingForm
              monthlyRate={monthlyRate}
              setMonthlyRate={setMonthlyRate}
              monthlyAgreement={monthlyAgreement}
              setMonthlyAgreement={setMonthlyAgreement}
              isOwner={isOwner}
              infoRefs={infoRefs}
              onInfoClick={handleInfoClick}
            />
          )}
        </div>
      </div>

      {activeInfoTooltip && (
        <InformationalText
          isOpen={true}
          title={
            typeof infoContent[activeInfoTooltip] === 'function'
              ? infoContent[activeInfoTooltip](activeInfoTooltip.slice(-1))
                .title
              : infoContent[activeInfoTooltip].title
          }
          content={
            typeof infoContent[activeInfoTooltip] === 'function'
              ? infoContent[activeInfoTooltip](activeInfoTooltip.slice(-1))
                .content
              : infoContent[activeInfoTooltip].content
          }
          expandedContent={
            typeof infoContent[activeInfoTooltip] === 'function'
              ? infoContent[activeInfoTooltip](activeInfoTooltip.slice(-1))
                .expandedContent
              : infoContent[activeInfoTooltip].expandedContent
          }
          showMoreAvailable={!!infoContent[activeInfoTooltip]?.expandedContent}
          onClose={() => setActiveInfoTooltip(null)}
          triggerRef={
            activeInfoTooltip === 'pricingControls' ? infoRefs.pricingControls :
              activeInfoTooltip === 'damageDeposit' ? infoRefs.damageDeposit :
                activeInfoTooltip === 'maintenanceFee' ? infoRefs.maintenanceFee :
                  activeInfoTooltip === 'nightsPerWeek' ? infoRefs.nightsPerWeek :
                    activeInfoTooltip.startsWith('weeklyComp') ? infoRefs.weeklyComp[activeInfoTooltip.slice(-1)] :
                      activeInfoTooltip === 'weeklyPricing' ? infoRefs.weeklyPricing :
                        activeInfoTooltip === 'monthlyComp' ? infoRefs.monthlyComp :
                          activeInfoTooltip === 'monthlyAgreement' ? infoRefs.monthlyAgreement :
                            null
          }
        />
      )}

      {showConfirmModal && (
        <div className="host-modal-backdrop" onClick={() => setShowConfirmModal(false)}>
          <div className="host-modal host-modal--small" onClick={(e) => e.stopPropagation()}>
            <div className="host-modal__header">
              <h3 className="host-modal__title">Discard Changes?</h3>
              <button className="host-modal__close" onClick={() => setShowConfirmModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="host-modal__content">
              <p className="host-confirm-modal__message">
                You have unsaved changes. Are you sure you want to leave without saving?
              </p>
              <div className="host-confirm-modal__actions">
                <button className="btn btn--secondary" onClick={() => setShowConfirmModal(false)}>
                  Keep Editing
                </button>
                <button className="btn btn--danger" onClick={onClose}>
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
