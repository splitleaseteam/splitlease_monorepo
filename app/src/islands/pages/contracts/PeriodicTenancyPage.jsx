// Periodic Tenancy Agreement Page

import { useState, useEffect } from 'react';
import { useContractGenerator } from '../../../hooks/useContractGenerator.js';
import { ContractForm } from '../../components/contracts/ContractForm.jsx';
import { ContractDownload } from '../../components/contracts/ContractDownload.jsx';
import { ContractPreview } from '../../components/contracts/ContractPreview.jsx';

const ACTION = 'generate_periodic_tenancy';

export default function PeriodicTenancyPage() {
  const { loadSchema, generate, isLoading, error, result, clearError, clearResult } = useContractGenerator();
  const [schema, setSchema] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  useEffect(() => {
    loadSchema(ACTION).then(setSchema);
  }, [loadSchema]);

  const handleSubmit = async (formData) => {
    setSubmittedData(formData);
    clearError();
    clearResult();
    await generate(ACTION, formData);
  };

  if (!schema) {
    return <div className="loading">Loading form schema...</div>;
  }

  return (
    <div className="page contract-page">
      <div className="page-header">
        <h1>Periodic Tenancy Agreement</h1>
        <p>Generate a full periodic tenancy agreement with image support</p>
      </div>

      {!result ? (
        <>
          <ContractForm
            schema={schema}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
          {submittedData && (
            <ContractPreview
              formData={submittedData}
              schema={schema}
            />
          )}
        </>
      ) : (
        <ContractDownload result={result} />
      )}

      {result && (
        <button
          onClick={() => {
            clearResult();
            setSubmittedData(null);
          }}
          className="reset-button"
        >
          Generate Another Document
        </button>
      )}
    </div>
  );
}
