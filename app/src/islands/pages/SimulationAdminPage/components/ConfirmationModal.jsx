import './ConfirmationModal.css';

export default function ConfirmationModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  isProcessing,
}) {
  return (
    <div
      className="confirmation-modal__backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      <div className="confirmation-modal">
        <div className="confirmation-modal__header">
          <h3 id="confirmation-modal-title" className="confirmation-modal__title">
            {title}
          </h3>
        </div>
        <div className="confirmation-modal__body">
          <p className="confirmation-modal__message">{message}</p>
        </div>
        <div className="confirmation-modal__footer">
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="confirmation-modal__button"
          >
            {isProcessing ? 'Processing...' : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="confirmation-modal__button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
