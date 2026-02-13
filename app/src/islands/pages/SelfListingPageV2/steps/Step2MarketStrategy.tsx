/**
 * Step 2: Market Strategy - private (concierge) or public (marketplace)
 */
import React from 'react';
import type { FormData } from '../types';

interface Step2Props {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2MarketStrategy: React.FC<Step2Props> = ({
  formData,
  updateFormData,
  onNext,
  onBack,
}) => (
  <div className="section-card">
    <h2>Market Strategy</h2>
    <div className="form-group">
      <label>How should we market it?</label>
      <div className="privacy-options">
        <div
          className={`privacy-card ${formData.marketStrategy === 'private' ? 'selected' : ''}`}
          onClick={() => updateFormData({ marketStrategy: 'private' })}
        >
          <div className="privacy-radio"></div>
          <div className="privacy-content">
            <h3>Private Network (Concierge)</h3>
            <p>We search for a guest for you. Address remains hidden until vetting is complete.</p>
          </div>
        </div>
        <div
          className={`privacy-card ${formData.marketStrategy === 'public' ? 'selected' : ''}`}
          onClick={() => updateFormData({ marketStrategy: 'public' })}
        >
          <div className="privacy-radio"></div>
          <div className="privacy-content">
            <h3>Public Marketplace</h3>
            <p>Standard listing. Visible to all users immediately.</p>
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
