/**
 * LoadingState - Full-page loading indicator
 */
export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="mlpr-loading-state">
      <div className="mlpr-loading-spinner" />
      <p className="mlpr-loading-message">{message}</p>
    </div>
  );
}
