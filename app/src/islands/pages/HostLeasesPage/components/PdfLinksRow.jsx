/**
 * PdfLinksRow Component
 *
 * Displays PDF document links for contract and supplemental agreement.
 */
import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';

/**
 * PdfLinksRow displays document links
 *
 * @param {Object} props
 * @param {string} props.contract - Contract PDF URL
 * @param {string} props.supplementalAgreement - Supplemental agreement PDF URL
 * @param {Function} props.onOpenDocument - Handler to open document
 */
export function PdfLinksRow({ contract, supplementalAgreement, onOpenDocument }) {
  const hasContract = !!contract;
  const hasSupplemental = !!supplementalAgreement;

  if (!hasContract && !hasSupplemental) {
    return null;
  }

  return (
    <div className="hl-pdf-links-row">
      <div className="hl-pdf-links-title">
        <FileText size={16} />
        <span>Documents</span>
      </div>
      <div className="hl-pdf-links">
        {hasContract && (
          <button
            type="button"
            className="hl-pdf-link"
            onClick={() => onOpenDocument?.('contract')}
            title="View lease contract"
          >
            <FileText size={14} />
            Lease Contract
            <ExternalLink size={12} />
          </button>
        )}
        {hasSupplemental && (
          <button
            type="button"
            className="hl-pdf-link"
            onClick={() => onOpenDocument?.('supplemental')}
            title="View supplemental agreement"
          >
            <FileText size={14} />
            Supplemental Agreement
            <ExternalLink size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

export default PdfLinksRow;
