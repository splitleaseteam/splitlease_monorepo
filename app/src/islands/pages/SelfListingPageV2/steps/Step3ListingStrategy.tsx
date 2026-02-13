/**
 * Step 3: Listing Strategy - nightly/weekly/monthly with conditional content
 */
import React from 'react';
import { HostScheduleSelector } from '../../../shared/HostScheduleSelector/HostScheduleSelector.jsx';
import type { FormData, NightId } from '../types';
import { WEEKLY_PATTERNS } from '../types';

interface Step3Props {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  validationErrors: Record<string, boolean>;
  setValidationErrors: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleNightSelectionChange: (nights: NightId[]) => void;
  getScheduleText: () => { text: string; error: boolean };
  handleInfoClick: (tooltipId: string) => (e: React.MouseEvent) => void;
  leaseStyleNightlyInfoRef: React.RefObject<HTMLButtonElement>;
  leaseStyleWeeklyInfoRef: React.RefObject<HTMLButtonElement>;
  leaseStyleMonthlyInfoRef: React.RefObject<HTMLButtonElement>;
  onNext: () => void;
  onBack: () => void;
}

export const Step3ListingStrategy: React.FC<Step3Props> = ({
  formData,
  updateFormData,
  validationErrors,
  setValidationErrors,
  handleNightSelectionChange,
  getScheduleText,
  handleInfoClick,
  leaseStyleNightlyInfoRef,
  leaseStyleWeeklyInfoRef,
  leaseStyleMonthlyInfoRef,
  onNext,
  onBack,
}) => {
  const scheduleInfo = getScheduleText();

  return (
    <div className="section-card">
      <h2>Listing Strategy</h2>

      <div className="form-group">
        <label>Lease Style</label>
        <div className="lease-options-columns">
          {(['nightly', 'weekly', 'monthly'] as const).map(style => {
            const infoRef = style === 'nightly' ? leaseStyleNightlyInfoRef
              : style === 'weekly' ? leaseStyleWeeklyInfoRef
              : leaseStyleMonthlyInfoRef;
            const tooltipId = `leaseStyle${style.charAt(0).toUpperCase() + style.slice(1)}`;

            return (
              <div
                key={style}
                className={`privacy-card ${formData.leaseStyle === style ? 'selected' : ''}`}
                onClick={() => updateFormData({ leaseStyle: style })}
              >
                <div className="privacy-radio"></div>
                <div className="privacy-content">
                  <h3 className="lease-style-header">
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                    <button
                      ref={infoRef}
                      type="button"
                      className="info-help-btn"
                      onClick={handleInfoClick(tooltipId)}
                      aria-label={`Learn more about ${style} rental`}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </button>
                  </h3>
                  <p>
                    {style === 'nightly' && 'Rent by the night with flexible availability'}
                    {style === 'weekly' && 'Rent in weekly patterns'}
                    {style === 'monthly' && 'Traditional month-to-month rental'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nightly - Night Selector */}
      {formData.leaseStyle === 'nightly' && (
        <div
          id="nightSelector"
          className={`conditional-section visible ${validationErrors.nightSelector ? 'validation-error' : ''}`}
        >
          <label>Available Nights (Tap to select)</label>
          <div className="host-schedule-selector-wrapper">
            <HostScheduleSelector
              selectedNights={formData.selectedNights}
              onSelectionChange={handleNightSelectionChange}
              isClickable={true}
              className="v2-schedule-selector"
            />
          </div>
          <div
            className="schedule-text"
            style={{ color: scheduleInfo.error ? 'red' : 'var(--v2-primary)' }}
          >
            {scheduleInfo.text}
          </div>
        </div>
      )}

      {/* Weekly - Pattern Selector */}
      {formData.leaseStyle === 'weekly' && (
        <div className="conditional-section visible">
          <label>Select Weekly Pattern</label>
          <select
            value={formData.weeklyPattern}
            onChange={e => updateFormData({ weeklyPattern: e.target.value })}
          >
            {WEEKLY_PATTERNS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Monthly - Agreement */}
      {formData.leaseStyle === 'monthly' && (
        <div
          id="monthlyAgreement"
          className={`conditional-section visible ${validationErrors.monthlyAgreement ? 'validation-error' : ''}`}
        >
          <label>Monthly Lease Agreement</label>
          <p className="agreement-desc">
            With the 'Monthly' model, you receive a fixed monthly rate regardless of how many
            nights your guest uses. Split Lease may sublease unused nights to short-term guests,
            maximizing occupancy. If you'd rather not have additional guests in your space,
            our other models may suit you better.
          </p>
          <div className="agreement-option">
            <label className="agreement-label">
              <input
                type="radio"
                name="monthlyAgreement"
                checked={formData.monthlyAgreement}
                onChange={() => {
                  updateFormData({ monthlyAgreement: true });
                  if (validationErrors.monthlyAgreement) {
                    setValidationErrors(prev => ({ ...prev, monthlyAgreement: false }));
                  }
                }}
              />
              <span className="agreement-text">I agree to the monthly sublease terms</span>
            </label>
          </div>
          <div className="agreement-option">
            <label className="agreement-label">
              <input
                type="radio"
                name="monthlyAgreement"
                checked={!formData.monthlyAgreement}
                onChange={() => updateFormData({ monthlyAgreement: false })}
              />
              <span className="agreement-text">No, I will select a different rental style</span>
            </label>
          </div>
        </div>
      )}

      <div className="btn-group">
        <button className="btn-next" onClick={onNext}>Continue</button>
        <button className="btn-back" onClick={onBack}>Back</button>
      </div>
    </div>
  );
};
