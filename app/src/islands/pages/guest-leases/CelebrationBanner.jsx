/**
 * CelebrationBanner Component (Charles Eames Style)
 *
 * Displays contextual celebration/notification banners like:
 * - "Your stay begins tomorrow!"
 * - "Check-in complete - enjoy your stay!"
 * - Payment confirmed notifications
 */

import { CheckCircle, X } from 'lucide-react';

export default function CelebrationBanner({
  title,
  message,
  onDismiss,
  isVisible = true
}) {
  if (!isVisible || (!title && !message)) return null;

  return (
    <div className="celebration-banner" role="alert">
      <CheckCircle
        className="celebration-banner__icon"
        size={24}
        aria-hidden="true"
      />
      <div className="celebration-banner__content">
        {title && <div className="celebration-banner__title">{title}</div>}
        {message && <div className="celebration-banner__message">{message}</div>}
      </div>
      {onDismiss && (
        <button
          className="celebration-banner__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss"
          type="button"
        >
          <X size={20} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
