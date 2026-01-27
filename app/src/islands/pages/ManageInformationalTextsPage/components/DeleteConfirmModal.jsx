/**
 * DeleteConfirmModal - Delete confirmation modal for Manage Informational Texts
 */
import '../ManageInformationalTextsPage.css';

export function DeleteConfirmModal({ onCancel, onConfirm, isDeleting }) {
  return (
    <div className="mit-modal-overlay">
      <div className="mit-modal">
        <h3 className="mit-modal-title">Delete Entry?</h3>
        <p className="mit-modal-text">
          This action cannot be undone. The informational text will be permanently deleted.
        </p>
        <div className="mit-modal-actions">
          <button
            onClick={onCancel}
            className="mit-btn-secondary"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="mit-btn-danger"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
