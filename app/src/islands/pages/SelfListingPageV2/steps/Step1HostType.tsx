/**
 * Step 1: Host Type - resident, liveout, coliving, agent
 */
import React from 'react';
import type { FormData } from '../types';
import { HOST_TYPES } from '../types';

interface Step1Props {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  onNext: () => void;
}

export const Step1HostType: React.FC<Step1Props> = ({
  formData,
  updateFormData,
  onNext,
}) => (
  <div className="section-card">
    <h2>Who are you?</h2>
    <div className="form-group">
      <label>Select your host type</label>
      <div className="privacy-options">
        {HOST_TYPES.map(type => (
          <div
            key={type.id}
            className={`privacy-card ${formData.hostType === type.id ? 'selected' : ''}`}
            onClick={() => updateFormData({ hostType: type.id as FormData['hostType'] })}
          >
            <div className="privacy-radio"></div>
            <div className="privacy-content">
              <p>{type.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="btn-group">
      <button className="btn-next" onClick={onNext}>Continue</button>
    </div>
  </div>
);
