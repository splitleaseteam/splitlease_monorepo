function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
}

function formatShortDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

export default function SwapSheet({
  requestedNight,
  userNights,
  selectedOfferNight,
  onSelectOffer,
  onSubmit,
  onCancel,
  isSubmitting
}) {
  return (
    <div className="request-sheet">
      <div className="request-sheet__date">
        <span className="request-sheet__label">You Want</span>
        <span className="request-sheet__value">{formatDate(requestedNight)}</span>
      </div>
      <div className="request-sheet__swap-picker">
        <span className="request-sheet__label">Offer in Exchange</span>
        <div className="request-sheet__nights-grid">
          {userNights.map((night) => (
            <button
              key={night}
              className={`night-chip ${selectedOfferNight === night ? 'night-chip--selected' : ''}`}
              onClick={() => onSelectOffer(night)}
              type="button"
            >
              {formatShortDate(night)}
            </button>
          ))}
        </div>
      </div>
      <div className="request-sheet__actions">
        <button
          className="request-sheet__btn request-sheet__btn--secondary"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="request-sheet__btn request-sheet__btn--primary"
          onClick={onSubmit}
          disabled={!selectedOfferNight || isSubmitting}
          type="button"
        >
          {isSubmitting ? 'Sending...' : 'Propose Swap'}
        </button>
      </div>
    </div>
  );
}
