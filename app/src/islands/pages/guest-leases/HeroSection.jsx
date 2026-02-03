/**
 * HeroSection Component (Charles Eames Style)
 *
 * Displays the hero section with:
 * - Time-of-day greeting with host name
 * - Big date display for next stay
 * - Countdown context text
 * - Action link to view stay details
 */

import { ChevronRight } from 'lucide-react';

/**
 * Get time-of-day greeting
 * @returns {string} Greeting based on current hour
 */
function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Format date for hero display (e.g., "Feb 15")
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
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
 * Calculate days until a date
 * @param {Date|string} date - Target date
 * @returns {number} Days until date
 */
function getDaysUntil(date) {
  if (!date) return 0;
  const target = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function HeroSection({
  nextStay,
  hostName,
  listingName,
  onViewDetails
}) {
  // If no next stay, don't render the hero
  if (!nextStay) return null;

  const greeting = getTimeGreeting();
  const formattedDate = formatHeroDate(nextStay.checkIn);
  const daysUntil = getDaysUntil(nextStay.checkIn);

  // Build context message
  let contextMessage = '';
  if (daysUntil === 0) {
    contextMessage = `Your stay at ${listingName || 'your rental'} begins today`;
  } else if (daysUntil === 1) {
    contextMessage = `Your stay at ${listingName || 'your rental'} begins tomorrow`;
  } else if (daysUntil > 0) {
    contextMessage = `Your next stay at ${listingName || 'your rental'} begins in ${daysUntil} days`;
  } else {
    // Stay has already started
    contextMessage = `Your stay at ${listingName || 'your rental'} is in progress`;
  }

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero__greeting">
        {greeting} from <span className="hero__greeting-name">{hostName || 'your host'}</span>
      </div>
      <h1 id="hero-heading" className="visually-hidden">Your next stay</h1>
      <div className="hero__date">{formattedDate}</div>
      <div className="hero__context">{contextMessage}</div>
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
