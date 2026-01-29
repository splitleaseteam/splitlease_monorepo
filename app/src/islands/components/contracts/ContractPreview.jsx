// Contract Preview Component - Optional preview before generation

import { useState } from 'react';

export function ContractPreview({ formData, schema }) {
  const [showPreview, setShowPreview] = useState(false);

  if (!showPreview) {
    return (
      <button
        type="button"
        onClick={() => setShowPreview(true)}
        className="preview-button"
      >
        Preview Data
      </button>
    );
  }

  return (
    <div className="contract-preview">
      <div className="preview-header">
        <h4>Data Preview</h4>
        <button
          type="button"
          onClick={() => setShowPreview(false)}
          className="close-button"
        >
          ×
        </button>
      </div>

      <dl className="preview-data">
        {schema.fields.map(field => {
          const value = formData[field.name];
          return (
            <div key={field.name} className="preview-item">
              <dt>{field.label}:</dt>
              <dd>{value || <em className="empty">empty</em>}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
