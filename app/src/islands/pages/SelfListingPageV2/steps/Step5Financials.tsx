/**
 * Step 5: Financials - rent, utilities, deposit, cleaning (weekly/monthly only)
 */
import React from 'react';
import type { FormData } from '../types';

interface Step5Props {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  validationErrors: Record<string, boolean>;
  setValidationErrors: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleInfoClick: (tooltipId: string) => (e: React.MouseEvent) => void;
  desiredRentInfoRef: React.RefObject<HTMLButtonElement>;
  securityDepositInfoRef: React.RefObject<HTMLButtonElement>;
  cleaningFeeInfoRef: React.RefObject<HTMLButtonElement>;
  onNext: () => void;
  onBack: () => void;
}

export const Step5Financials: React.FC<Step5Props> = ({
  formData,
  updateFormData,
  validationErrors,
  setValidationErrors,
  handleInfoClick,
  desiredRentInfoRef,
  securityDepositInfoRef,
  cleaningFeeInfoRef,
  onNext,
  onBack,
}) => {
  const frequencyLabel = formData.leaseStyle === 'weekly' ? 'Week' : 'Month';

  return (
    <div className="section-card">
      <h2>Financials</h2>

      <div className="form-group">
        <label className="label-with-info">
          Desired Rent (Per {frequencyLabel})
          <button
            ref={desiredRentInfoRef}
            type="button"
            className="info-help-btn"
            onClick={handleInfoClick('desiredRent')}
            aria-label="Learn more about desired rent"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
        </label>
        <div className="input-with-prefix">
          <span className="prefix">$</span>
          <input
            id="price"
            type="number"
            value={formData.price || ''}
            onChange={e => {
              const value = parseInt(e.target.value) || 0;
              updateFormData({ price: value });
              if (value > 0 && validationErrors.price) {
                setValidationErrors(prev => ({ ...prev, price: false }));
              }
            }}
            placeholder={formData.leaseStyle === 'weekly' ? '500' : '2000'}
            className={validationErrors.price ? 'input-error' : ''}
          />
        </div>
      </div>

      <div className="row">
        <div className="col">
          <div className="form-group">
            <label className="label-with-info">
              Security Deposit
              <button
                ref={securityDepositInfoRef}
                type="button"
                className="info-help-btn"
                onClick={handleInfoClick('securityDeposit')}
                aria-label="Learn more about security deposit"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>
            </label>
            <div className="input-with-prefix">
              <span className="prefix">$</span>
              <input
                type="number"
                value={formData.securityDeposit || ''}
                onChange={e => updateFormData({ securityDeposit: parseInt(e.target.value) || 0 })}
                placeholder="1000"
              />
            </div>
          </div>
        </div>
        <div className="col">
          <div className="form-group">
            <label className="label-with-info">
              Cleaning Fee
              <button
                ref={cleaningFeeInfoRef}
                type="button"
                className="info-help-btn"
                onClick={handleInfoClick('cleaningFee')}
                aria-label="Learn more about cleaning fee"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>
            </label>
            <div className="input-with-prefix">
              <span className="prefix">$</span>
              <input
                type="number"
                value={formData.cleaningFee || ''}
                onChange={e => updateFormData({ cleaningFee: parseInt(e.target.value) || 0 })}
                placeholder="150"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="btn-group">
        <button className="btn-next" onClick={onNext}>Continue</button>
        <button className="btn-back" onClick={onBack}>Back</button>
      </div>
    </div>
  );
};
