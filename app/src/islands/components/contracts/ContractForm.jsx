// Contract Form Component - Reusable form wrapper for contract generation

import { useState } from 'react';

export function ContractForm({ schema, onSubmit, isLoading, error }) {
  const [formData, setFormData] = useState(() =>
    schema.fields.reduce((acc, field) => ({
      ...acc,
      [field.name]: ''
    }), {})
  );

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderField = (field) => {
    const value = formData[field.name];
    const fieldId = `field-${field.name}`;

    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.name} className="form-field">
            <label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            {field.description && <p className="field-description">{field.description}</p>}
            <textarea
              id={fieldId}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
            />
          </div>
        );

      case 'currency':
        return (
          <div key={field.name} className="form-field">
            <label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            {field.description && <p className="field-description">{field.description}</p>}
            <div className="currency-input">
              <span>$</span>
              <input
                id={fieldId}
                type="text"
                value={value}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder?.replace('$', '')}
                required={field.required}
              />
            </div>
          </div>
        );

      case 'date':
        return (
          <div key={field.name} className="form-field">
            <label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            {field.description && <p className="field-description">{field.description}</p>}
            <input
              id={fieldId}
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder || 'MM/DD/YY'}
              required={field.required}
              pattern="\d{2}/\d{2}/\d{2}"
            />
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="form-field">
            <label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            {field.description && <p className="field-description">{field.description}</p>}
            <input
              id={fieldId}
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        );

      case 'array':
        return (
          <div key={field.name} className="form-field">
            <label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            {field.description && <p className="field-description">{field.description}</p>}
            <textarea
              id={fieldId}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder="Enter as JSON array"
              required={field.required}
              rows={3}
            />
          </div>
        );

      default: // text
        return (
          <div key={field.name} className="form-field">
            <label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            {field.description && <p className="field-description">{field.description}</p>}
            <input
              id={fieldId}
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="contract-form">
      <h2>{schema.name}</h2>
      {schema.description && <p className="form-description">{schema.description}</p>}

      {schema.fields.map(renderField)}

      {error && <div className="form-error">{error}</div>}

      <button type="submit" disabled={isLoading} className="submit-button">
        {isLoading ? 'Generating...' : 'Generate Document'}
      </button>
    </form>
  );
}
