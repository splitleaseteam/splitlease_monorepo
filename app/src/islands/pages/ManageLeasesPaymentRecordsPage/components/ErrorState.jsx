/**
 * ErrorState - Full-page error display with retry option
 */
export default function ErrorState({ error, onRetry }) {
  return (
    <div className="mlpr-error-state">
      <svg
        className="mlpr-error-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round" />
        <line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round" />
      </svg>
      <p className="mlpr-error-message">{error}</p>
      {onRetry && (
        <button className="mlpr-btn mlpr-btn-primary" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}
