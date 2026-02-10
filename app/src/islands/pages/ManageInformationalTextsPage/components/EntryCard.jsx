/**
 * EntryCard - Individual entry card for Manage Informational Texts
 */
import '../ManageInformationalTextsPage.css';

export function EntryCard({ entry, onEdit, onDelete }) {
  return (
    <div className="mit-entry-card">
      <div className="mit-entry-header">
        <span className="mit-entry-tag">{entry.tagTitle}</span>
        <div className="mit-entry-actions">
          <button
            onClick={() => onEdit(entry)}
            className="mit-btn-small"
            title="Edit"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(entry._id)}
            className="mit-btn-danger-small"
            title="Delete"
          >
            Delete
          </button>
        </div>
      </div>
      <p className="mit-entry-preview">
        {entry.desktop?.substring(0, 100)}
        {entry.desktop?.length > 100 ? '...' : ''}
      </p>
      <div className="mit-entry-meta">
        {entry.showMore && <span className="mit-badge">Show More</span>}
        {entry.hasLink && <span className="mit-badge">Has Link</span>}
        <span className="mit-meta-text">
          Updated: {new Date(entry.modifiedDate || entry.original_updated_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
