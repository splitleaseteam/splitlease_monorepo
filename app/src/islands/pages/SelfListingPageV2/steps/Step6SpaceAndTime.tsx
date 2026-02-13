/**
 * Step 6: Space & Time - property type, location, bedrooms, bathrooms
 */
import React from 'react';
import type { FormData, SpaceType } from '../types';

interface Step6Props {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  validationErrors: Record<string, boolean>;
  setValidationErrors: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  addressInputRef: React.RefObject<HTMLInputElement>;
  addressError: string | null;
  isAddressValid: boolean;
  handleAddressInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step6SpaceAndTime: React.FC<Step6Props> = ({
  formData,
  updateFormData,
  validationErrors,
  setValidationErrors,
  addressInputRef,
  addressError,
  isAddressValid,
  handleAddressInputChange,
  onNext,
  onBack,
}) => (
  <div className="section-card">
    <h2>The Space & Time</h2>

    <div className="form-group">
      <label>Type of Space<span className="required">*</span></label>
      <select
        id="typeOfSpace"
        value={formData.typeOfSpace}
        onChange={e => {
          updateFormData({ typeOfSpace: e.target.value as SpaceType });
          if (e.target.value && validationErrors.typeOfSpace) {
            setValidationErrors(prev => ({ ...prev, typeOfSpace: false }));
          }
        }}
        className={`${!formData.typeOfSpace ? 'input-placeholder' : ''} ${validationErrors.typeOfSpace ? 'input-error' : ''}`}
      >
        <option value="">Choose an option...</option>
        <option value="Private Room">Private Room</option>
        <option value="Entire Place">Entire Place</option>
        <option value="Shared Room">Shared Room</option>
      </select>
    </div>

    <div className="form-group">
      <label>Address<span className="required">*</span></label>
      <input
        id="address"
        ref={addressInputRef}
        type="text"
        value={formData.address.fullAddress}
        onChange={handleAddressInputChange}
        placeholder="Start typing your address..."
        className={addressError || validationErrors.address ? 'input-error' : isAddressValid ? 'input-valid' : ''}
      />
      {addressError && (
        <span className="error-message">{addressError}</span>
      )}
      {isAddressValid && formData.address.neighborhood && (
        <span className="address-info">
          {formData.address.city
            ? `${formData.address.neighborhood}, ${formData.address.city}`
            : formData.address.neighborhood}
        </span>
      )}
    </div>

    <div className="row">
      <div className="col">
        <div className="form-group">
          <label>Bedrooms</label>
          <select
            value={formData.bedrooms}
            onChange={e => updateFormData({ bedrooms: e.target.value })}
          >
            <option value="Studio">Studio</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4+</option>
          </select>
        </div>
      </div>
      <div className="col">
        <div className="form-group">
          <label>Bathrooms</label>
          <select
            value={formData.bathrooms}
            onChange={e => updateFormData({ bathrooms: e.target.value })}
          >
            <option value="1">1</option>
            <option value="1.5">1.5</option>
            <option value="2">2</option>
            <option value="Shared">Shared</option>
          </select>
        </div>
      </div>
    </div>

    <div className="btn-group">
      <button className="btn-next" onClick={onNext}>Continue</button>
      <button className="btn-back" onClick={onBack}>Back</button>
    </div>
  </div>
);
