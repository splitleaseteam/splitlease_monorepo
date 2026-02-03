/**
 * HeroSection Component (Charles Eames Style)
 *
 * Displays the hero section with:
 * - "Your Next Stay" heading
 * - Big date display
 * - Listing name with stay count
 * - Action link to view stay details
 */

import { ChevronRight } from 'lucide-react';

/**
 * Format date for hero display (e.g., "Jan 28")
 */
function formatHeroDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get day of week name
 */
function getDayName(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

export default function HeroSection({
  nextStay,
  listingName,
  totalStays = 0,
  onViewDetails
}) {
  if (!nextStay) return null;

  const formattedDate = formatHeroDate(nextStay.checkIn);
  const dayName = getDayName(nextStay.checkIn);

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero__greeting">Your Next Stay</div>
      <h1 id="hero-heading" className="visually-hidden">Your next stay</h1>
      <div className="hero__date">{formattedDate}</div>
      <div className="hero__context">
        {listingName || 'Your rental'} – {totalStays} {totalStays === 1 ? 'stay' : 'stays'} starting {dayName}
      </div>
      <button
        className="hero__action"
        onClick={onViewDetails}
        type="button"
      >
        <span className="hero__action-text">View stay details and check-in info</span>
        <ChevronRight className="hero__action-icon" size={20} aria-hidden="true" />
      </button>
    </section>
  );
}
