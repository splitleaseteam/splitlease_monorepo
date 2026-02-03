import { useState } from 'react';

export default function BuyOutSheet({
  selectedNight,
  suggestedPrice,
  onSubmit,
  onCancel,
  isSubmitting
}) {
  const [price, setPrice] = useState(suggestedPrice || 0);
  const [message, setMessage] = useState('');
  const formattedDate = new Date(selectedNight).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="request-sheet">
      <div className="request-sheet__date">
        <span className="request-sheet__label">Requesting</span>
        <span className="request-sheet__value">{formattedDate}</span>
      </div>
      <div className="request-sheet__price">
        <label className="request-sheet__label">Your Offer</label>
        <div className="request-sheet__input-group">
          <span className="request-sheet__currency">$</span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="request-sheet__input"
            min="0"
            step="0.01"
          />
        </div>
        {suggestedPrice && (
          <span className="request-sheet__hint">
            Suggested: ${suggestedPrice.toFixed(2)}
          </span>
        )}
      </div>
      <div className="request-sheet__message">
        <label className="request-sheet__label">Message (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a note..."
          className="request-sheet__textarea"
          rows={2}
        />
      </div>
      <div className="request-sheet__actions">
        <button
          className="request-sheet__btn request-sheet__btn--secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          className="request-sheet__btn request-sheet__btn--primary"
          onClick={() => onSubmit(price, message)}
          disabled={isSubmitting || price <= 0}
        >
          {isSubmitting ? 'Sending...' : 'Send Request'}
        </button>
      </div>
    </div>
  );
}
