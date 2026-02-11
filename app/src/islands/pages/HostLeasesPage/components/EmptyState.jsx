/**
 * EmptyState Component
 *
 * Displays when there are no leases for the selected listing.
 */
import { FileText } from 'lucide-react';

/**
 * EmptyState shows a friendly message when no leases exist
 *
 * @param {Object} props
 * @param {string} props.listingName - Name of the selected listing (optional)
 */
export function EmptyState({ listingName }) {
  return (
    <div className="hl-empty-state">
      <div className="hl-empty-state-icon" aria-hidden="true">
        <FileText size={48} strokeWidth={1.5} />
      </div>
      <h2 className="hl-empty-state-title">No leases yet</h2>
      <p className="hl-empty-state-text">
        {listingName
          ? `There are no active leases for ${listingName}.`
          : 'You don\'t have any leases yet.'
        }
      </p>
      <p className="hl-empty-state-hint">
        Leases are created when a proposal is accepted and documents are signed.
      </p>
    </div>
  );
}

export default EmptyState;
