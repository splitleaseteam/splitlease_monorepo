/**
 * DocumentsSection - Document upload, generation, and viewing
 *
 * Document Types:
 * 1. Draft 1: Periodic Tenancy Agreement (Guest and Host)
 * 2. Draft 2: Supplemental Agreement (Host only)
 * 3. Draft 3: Host Payout Schedule (Host only)
 * 4. Draft 4: Authorization for Credit Card Charges
 */
import { useState } from 'react';
import { FileText, Upload, Send, ExternalLink, Zap, Code, FileUp, Loader2 } from 'lucide-react';

const DOCUMENT_TYPES = [
  {
    key: 'periodicTenancy',
    label: 'Draft 1: Periodic Tenancy Agreement',
    description: 'Guest and Host agreement',
    field: 'periodicTenancyAgreement'
  },
  {
    key: 'supplemental',
    label: 'Draft 2: Supplemental Agreement',
    description: 'Host only',
    field: 'supplementalAgreement'
  },
  {
    key: 'payoutSchedule',
    label: 'Draft 3: Host Payout Schedule',
    description: 'Host only',
    field: 'hostPayoutSchedule'
  },
  {
    key: 'creditCard',
    label: 'Draft 4: Credit Card Authorization',
    description: 'Authorization form',
    field: 'creditCardAuthorizationForm'
  },
];

export default function DocumentsSection({
  lease,
  onUploadDocument,
  onGenerateDocs,
  onSendDocuments
}) {
  const [uploadingType, setUploadingType] = useState(null);

  const handleFileSelect = async (docType, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingType(docType.key);
    try {
      await onUploadDocument(docType.key, file);
    } finally {
      setUploadingType(null);
      event.target.value = '';
    }
  };

  return (
    <section className="mlpr-section mlpr-documents-section">
      <h2 className="mlpr-section-title">
        <FileText size={20} />
        Document Management
      </h2>

      {/* Document Cards Grid */}
      <div className="mlpr-documents-grid">
        {DOCUMENT_TYPES.map(docType => {
          const documentUrl = lease[docType.field];
          const hasDocument = !!documentUrl;

          return (
            <div key={docType.key} className="mlpr-card">
              <div className="mlpr-card-header">
                <FileText size={16} />
                <h4>{docType.label}</h4>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.75rem 0' }}>
                {docType.description}
              </p>

              {hasDocument ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="mlpr-status mlpr-status-active">Uploaded</span>
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mlpr-btn mlpr-btn-sm mlpr-btn-outline"
                  >
                    <ExternalLink size={14} />
                    View
                  </a>
                </div>
              ) : (
                <div>
                  <label className="mlpr-btn mlpr-btn-sm mlpr-btn-secondary" style={{ cursor: 'pointer' }}>
                    <Upload size={14} />
                    {uploadingType === docType.key ? 'Uploading...' : 'Upload'}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileSelect(docType, e)}
                      disabled={uploadingType !== null}
                    />
                  </label>
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                    Not uploaded
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Document Generation Panel */}
      <div className="mlpr-card" style={{ marginTop: '1rem' }}>
        <div className="mlpr-card-header">
          <Zap size={18} />
          <h4>Document Generation</h4>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1rem 0' }}>
          Generate documents automatically using external services
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="mlpr-btn mlpr-btn-secondary"
            onClick={() => onGenerateDocs('zapier')}
          >
            <Zap size={16} />
            Generate via Zapier
          </button>
          <button
            type="button"
            className="mlpr-btn mlpr-btn-secondary"
            onClick={() => onGenerateDocs('python')}
          >
            <Code size={16} />
            Generate via Python Script
          </button>
        </div>

        {lease.splitleaseCredit != null && lease.splitleaseCredit !== 0 && (
          <p style={{ fontSize: '0.75rem', color: '#7c3aed', margin: '0.75rem 0 0 0' }}>
            Split Lease Credit: ${lease.splitleaseCredit}
          </p>
        )}
      </div>

      {/* Send Documents Button */}
      <div style={{ marginTop: '1rem' }}>
        <button
          type="button"
          className="mlpr-btn mlpr-btn-primary"
          onClick={onSendDocuments}
        >
          <Send size={16} />
          Send Documents via HelloSign
        </button>
      </div>

      {/* Signed Documents Display */}
      {(lease.signedDocuments || []).length > 0 && (
        <div className="mlpr-card" style={{ marginTop: '1rem' }}>
          <div className="mlpr-card-header">
            <FileText size={18} />
            <h4>Signed Documents</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {lease.signedDocuments.map((doc, index) => (
              <a
                key={index}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#7c3aed',
                  textDecoration: 'none',
                  fontSize: '0.875rem'
                }}
              >
                <FileText size={14} />
                {doc.name || `Signed Document ${index + 1}`}
                <ExternalLink size={12} />
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
