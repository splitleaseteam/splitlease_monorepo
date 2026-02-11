/**
 * EmptyState Component
 *
 * Displays a friendly message when a tab has no reviews.
 * Different icons and messages for each tab type.
 */

import { Clock, MessageSquare, CheckCircle, Star } from 'lucide-react';
import './EmptyState.css';

const EMPTY_STATE_CONFIG = {
  pending: {
    icon: Clock,
    title: "You're all caught up!",
    message: "No pending reviews at this time. Reviews are due within 14 days of checkout.",
    hint: "After completing a stay, you'll be able to review your host or guest here."
  },
  received: {
    icon: MessageSquare,
    title: 'No reviews yet',
    message: "Reviews from hosts and guests will appear here after your stays.",
    hint: "Once someone reviews you, you'll see their feedback here."
  },
  submitted: {
    icon: CheckCircle,
    title: 'No reviews submitted',
    message: "Your submitted reviews will appear here.",
    hint: "After reviewing a host or guest, your review will show up in this section."
  }
};

export default function EmptyState({
  type = 'pending',
  message,
  subMessage,
  hint
}) {
  const config = EMPTY_STATE_CONFIG[type] || EMPTY_STATE_CONFIG.pending;
  const Icon = config.icon;

  return (
    <div className="reviews-empty-state">
      <div className="reviews-empty-state__icon-wrapper">
        <Icon size={48} className="reviews-empty-state__icon" />
      </div>
      <h3 className="reviews-empty-state__title">
        {message || config.title}
      </h3>
      <p className="reviews-empty-state__message">
        {subMessage || config.message}
      </p>
      {(hint || config.hint) && (
        <p className="reviews-empty-state__hint">
          <Star size={14} />
          {hint || config.hint}
        </p>
      )}
    </div>
  );
}
