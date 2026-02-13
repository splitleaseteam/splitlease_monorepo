/**
 * Lease Readiness Modal
 *
 * Shows a pre-flight check before document generation, displaying
 * which documents can be generated and what data is missing.
 *
 * @module islands/shared/LeaseReadinessModal
 */

import React from 'react';

/**
 * Status icon component
 */
function StatusIcon({ status }) {
  if (status === 'ready') {
    return <span style={{ color: '#22c55e', marginRight: '8px' }}>✓</span>;
  }
  if (status === 'blocked') {
    return <span style={{ color: '#ef4444', marginRight: '8px' }}>✗</span>;
  }
  if (status === 'warning') {
    return <span style={{ color: '#f59e0b', marginRight: '8px' }}>⚠</span>;
  }
  return null;
}

/**
 * Individual document readiness card
 */
function DocumentCard({ document, isSelected, onToggle, disabled }) {
  const cardStyle = {
    border: `2px solid ${document.canGenerate ? (isSelected ? '#3b82f6' : '#e5e7eb') : '#fecaca'}`,
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '8px',
    backgroundColor: document.canGenerate ? (isSelected ? '#eff6ff' : '#fff') : '#fef2f2',
    opacity: disabled ? 0.6 : 1,
    cursor: document.canGenerate && !disabled ? 'pointer' : 'not-allowed',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: document.blockingIssues.length > 0 ? '8px' : '0',
  };

  const titleStyle = {
    display: 'flex',
    alignItems: 'center',
    fontWeight: '600',
    fontSize: '14px',
  };

  const issueListStyle = {
    marginTop: '8px',
    paddingLeft: '24px',
    fontSize: '12px',
    color: '#6b7280',
  };

  const handleClick = () => {
    if (document.canGenerate && !disabled) {
      onToggle(document.documentType);
    }
  };

  return (
    <div style={cardStyle} onClick={handleClick}>
      <div style={headerStyle}>
        <div style={titleStyle}>
          <StatusIcon status={document.canGenerate ? 'ready' : 'blocked'} />
          {document.documentName}
        </div>
        {document.canGenerate && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggle(document.documentType)}
            disabled={disabled}
            style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
          />
        )}
      </div>

      {document.blockingIssues.length > 0 && (
        <div style={issueListStyle}>
          <div style={{ color: '#dc2626', fontWeight: '500', marginBottom: '4px' }}>
            Missing required data:
          </div>
          {document.blockingIssues.map((issue, idx) => (
            <div key={idx} style={{ marginBottom: '2px' }}>
              • {issue.label}
              {issue.suggestion && (
                <div style={{ marginLeft: '12px', color: '#9ca3af', fontSize: '11px' }}>
                  → {issue.suggestion}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {document.warningIssues.length > 0 && document.canGenerate && (
        <div style={issueListStyle}>
          <div style={{ color: '#d97706', fontWeight: '500', marginBottom: '4px' }}>
            Optional data missing:
          </div>
          {document.warningIssues.slice(0, 2).map((issue, idx) => (
            <div key={idx} style={{ marginBottom: '2px' }}>
              • {issue.label}
            </div>
          ))}
          {document.warningIssues.length > 2 && (
            <div style={{ color: '#9ca3af', fontSize: '11px' }}>
              +{document.warningIssues.length - 2} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Summary banner component
 */
function SummaryBanner({ summary, readyCount, totalCount }) {
  const bannerStyle = {
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const colors = {
    READY: { bg: '#dcfce7', text: '#166534', icon: '✓' },
    PARTIAL: { bg: '#fef3c7', text: '#92400e', icon: '⚠' },
    BLOCKED: { bg: '#fee2e2', text: '#991b1b', icon: '✗' },
  };

  const colorSet = colors[summary.status] || colors.BLOCKED;

  return (
    <div style={{ ...bannerStyle, backgroundColor: colorSet.bg, color: colorSet.text }}>
      <span style={{ fontSize: '20px' }}>{colorSet.icon}</span>
      <div>
        <div style={{ fontWeight: '600' }}>{summary.message}</div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          {readyCount} of {totalCount} documents ready
        </div>
      </div>
    </div>
  );
}

/**
 * Main Lease Readiness Modal
 */
export default function LeaseReadinessModal({
  isOpen,
  onClose,
  readinessReport,
  lease,
  onGenerate,
  isGenerating,
}) {
  const [selectedDocuments, setSelectedDocuments] = React.useState([]);

  // Initialize selected documents when modal opens
  React.useEffect(() => {
    if (isOpen && readinessReport) {
      setSelectedDocuments(readinessReport.documentsReady || []);
    }
  }, [isOpen, readinessReport]);

  if (!isOpen || !readinessReport) return null;

  const toggleDocument = (documentType) => {
    setSelectedDocuments(prev => {
      if (prev.includes(documentType)) {
        return prev.filter(d => d !== documentType);
      }
      return [...prev, documentType];
    });
  };

  const selectAll = () => {
    setSelectedDocuments(readinessReport.documentsReady || []);
  };

  const selectNone = () => {
    setSelectedDocuments([]);
  };

  const handleGenerate = () => {
    if (selectedDocuments.length > 0) {
      onGenerate(selectedDocuments);
    }
  };

  const agreementNumber = lease?.agreement_number || 'Unknown';

  // Modal overlay style
  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  // Modal container style
  const modalStyle = {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '85vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  };

  const headerStyle = {
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const bodyStyle = {
    padding: '16px 20px',
    overflowY: 'auto',
    flex: 1,
  };

  const footerStyle = {
    padding: '12px 20px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  };

  const buttonStyle = {
    padding: '10px 20px',
    borderRadius: '6px',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    fontSize: '14px',
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: selectedDocuments.length > 0 ? '#3b82f6' : '#9ca3af',
    color: '#fff',
    cursor: selectedDocuments.length > 0 && !isGenerating ? 'pointer' : 'not-allowed',
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f3f4f6',
    color: '#374151',
  };

  const linkButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '4px 8px',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Document Generation
            </h2>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              Agreement: {agreementNumber}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#9ca3af',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          <SummaryBanner
            summary={readinessReport.summary}
            readyCount={readinessReport.readyCount}
            totalCount={readinessReport.totalCount}
          />

          {/* Quick select buttons */}
          {readinessReport.documentsReady.length > 0 && (
            <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
              <button style={linkButtonStyle} onClick={selectAll}>
                Select all ready
              </button>
              <button style={linkButtonStyle} onClick={selectNone}>
                Select none
              </button>
            </div>
          )}

          {/* Document cards */}
          {readinessReport.documents.map(doc => (
            <DocumentCard
              key={doc.documentType}
              document={doc}
              isSelected={selectedDocuments.includes(doc.documentType)}
              onToggle={toggleDocument}
              disabled={isGenerating}
            />
          ))}

          {/* Blocking issues summary */}
          {readinessReport.allBlockingIssues.length > 0 && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#fef2f2',
              borderRadius: '8px',
              fontSize: '13px',
            }}>
              <div style={{ fontWeight: '600', color: '#991b1b', marginBottom: '8px' }}>
                To generate all documents, resolve these issues:
              </div>
              {readinessReport.allBlockingIssues.map((issue, idx) => (
                <div key={idx} style={{ marginBottom: '4px', color: '#7f1d1d' }}>
                  • {issue.label}
                  {issue.suggestion && (
                    <span style={{ color: '#9ca3af', marginLeft: '4px' }}>
                      — {issue.suggestion}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button style={secondaryButtonStyle} onClick={onClose} disabled={isGenerating}>
            Cancel
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              {selectedDocuments.length} selected
            </span>
            <button
              style={primaryButtonStyle}
              onClick={handleGenerate}
              disabled={selectedDocuments.length === 0 || isGenerating}
            >
              {isGenerating ? 'Generating...' : `Generate ${selectedDocuments.length > 0 ? `(${selectedDocuments.length})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
