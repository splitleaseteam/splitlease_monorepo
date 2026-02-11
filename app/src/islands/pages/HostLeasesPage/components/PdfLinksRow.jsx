/**
 * PdfLinksRow Component
 *
 * Displays PDF document links for lease documents:
 * - Lease Contract
 * - Supplemental Agreement
 * - Payout Schedule
 * - Periodic Tenancy Agreement
 */
import { FileText, ExternalLink, Calendar, DollarSign, FileCheck } from 'lucide-react';

/**
 * PdfLinksRow displays document links
 *
 * @param {Object} props
 * @param {string} props.contract - Contract PDF URL
 * @param {string} props.supplementalAgreement - Supplemental agreement PDF URL
 * @param {string} props.hostPayoutSchedule - Host payout schedule PDF URL
 * @param {string} props.periodicTenancyAgreement - Periodic tenancy agreement PDF URL
 * @param {Function} props.onOpenDocument - Handler to open document
 */
export function PdfLinksRow({
  contract,
  supplementalAgreement,
  hostPayoutSchedule,
  periodicTenancyAgreement,
  onOpenDocument
}) {
  const documents = [
    {
      key: 'contract',
      label: 'Lease Contract',
      url: contract,
      icon: FileText,
      title: 'View lease contract'
    },
    {
      key: 'supplemental',
      label: 'Supplemental Agreement',
      url: supplementalAgreement,
      icon: FileCheck,
      title: 'View supplemental agreement'
    },
    {
      key: 'payoutSchedule',
      label: 'Payout Schedule',
      url: hostPayoutSchedule,
      icon: DollarSign,
      title: 'View host payout schedule'
    },
    {
      key: 'periodicTenancy',
      label: 'Periodic Tenancy',
      url: periodicTenancyAgreement,
      icon: Calendar,
      title: 'View periodic tenancy agreement'
    }
  ];

  // Filter to only documents that exist or show all as clickable (shows "not available" toast)
  const hasAnyDocument = documents.some(doc => !!doc.url);

  return (
    <div className="hl-pdf-links-row">
      <div className="hl-pdf-links-title">
        <FileText size={16} />
        <span>Documents</span>
      </div>
      <div className="hl-pdf-links">
        {documents.map(({ key, label, url, icon: Icon, title }) => (
          <button
            key={key}
            type="button"
            className={`hl-pdf-link${url ? '' : ' hl-pdf-link-disabled'}`}
            onClick={() => onOpenDocument?.(key)}
            title={url ? title : `${label} not available`}
            aria-label={url ? title : `${label} not available`}
          >
            <Icon size={14} />
            {label}
            <ExternalLink size={12} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default PdfLinksRow;
