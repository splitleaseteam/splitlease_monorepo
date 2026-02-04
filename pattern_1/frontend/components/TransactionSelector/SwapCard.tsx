/**
 * SwapCard Component - Pattern 1: Personalized Defaults
 *
 * Displays swap transaction option with fair exchange messaging.
 *
 * @module components/TransactionSelector/SwapCard
 */

import React from 'react';
import { formatCurrency, formatResponseTime, pluralize } from '../../utils/formatting';
import type { TransactionCardProps } from '../../types';
import styles from '../../styles/TransactionSelector.module.css';
import cardStyles from '../../styles/Cards.module.css';

/**
 * SwapCard Component
 *
 * Swap option card with:
 * - Free exchange messaging
 * - Requires user night indicator
 * - Potential matches count
 * - Reciprocity messaging
 * - Benefits list (expandable)
 *
 * @param props - Component props
 * @returns React element
 */
export const SwapCard: React.FC<TransactionCardProps> = ({
  option,
  isSelected,
  isExpanded,
  isPrimary,
  onSelect,
  onCollapse,
  index,
}) => {
  const cardClasses = [
    styles.transactionCard,
    cardStyles.swapCard,
    isSelected && styles.selected,
    isPrimary && styles.primaryRecommendation,
    isExpanded && styles.expanded,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cardClasses}
      onClick={onSelect}
      role="button"
      tabIndex={index}
      aria-selected={isSelected}
      aria-expanded={isExpanded}
      data-transaction-type="swap"
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Premium Badge */}
      {isPrimary && (
        <div className={styles.premiumBadge}>
          <span className={styles.badgeIcon}>🤝</span>
          <span className={styles.badgeText}>FAIR EXCHANGE</span>
        </div>
      )}

      {/* Card Header */}
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <span className={styles.icon}>🔄</span>
          <h3>Swap - Fair Exchange</h3>
        </div>
        {option.potentialMatches && option.potentialMatches > 0 && (
          <div className={styles.matchesBadge}>
            {option.potentialMatches} {pluralize(option.potentialMatches, 'match', 'matches')}
          </div>
        )}
      </div>

      {/* Price Display */}
      <div className={styles.priceDisplay}>
        <div className={`${styles.finalPrice} ${cardStyles.freePrice}`}>
          <span className={styles.freeBadge}>FREE</span>
        </div>
        <div className={styles.priceBreakdown}>
          Only {formatCurrency(option.platformFee)} platform fee
        </div>
      </div>

      {/* Quick Summary (Collapsed View) */}
      {!isExpanded && (
        <div className={styles.quickSummary}>
          <p className={styles.summaryText}>
            🤝 No-cost exchange • Offer one of your nights • Build goodwill
          </p>
          {option.requiresUserNight && (
            <p className={styles.requirementTag}>
              ⚠️ You must offer a night in exchange
            </p>
          )}
        </div>
      )}

      {/* Benefits Section (Expanded View) */}
      {isExpanded && (
        <div className={styles.benefitsSection}>
          <h4 className={styles.benefitsTitle}>What you get:</h4>
          <ul className={styles.benefitsList}>
            <li>
              <span className={styles.checkmark}>✓</span>
              Completely free exchange (only {formatCurrency(option.platformFee)} fee)
            </li>
            <li>
              <span className={styles.checkmark}>✓</span>
              Build reciprocity and goodwill with {option.roommate.name}
            </li>
            <li>
              <span className={styles.checkmark}>✓</span>
              Fair and balanced arrangement
            </li>
            {option.potentialMatches && option.potentialMatches > 0 && (
              <li>
                <span className={styles.checkmark}>✓</span>
                {option.potentialMatches} {pluralize(option.potentialMatches, 'potential match', 'potential matches')} found
              </li>
            )}
            <li>
              <span className={styles.checkmark}>✓</span>
              Strengthen your roommate relationship
            </li>
          </ul>

          {/* User Night Requirement */}
          {option.requiresUserNight && (
            <div className={styles.swapRequirement}>
              <strong>📅 Exchange Requirement</strong>
              <p>
                To complete a swap, you need to offer {option.roommate.name} one
                of your assigned nights in exchange. This ensures fairness for
                both parties.
              </p>
              {option.potentialMatches && option.potentialMatches > 0 && (
                <p className={styles.matchesDetail}>
                  We found {option.potentialMatches} {pluralize(option.potentialMatches, 'night', 'nights')} that{' '}
                  {option.potentialMatches === 1 ? 'matches' : 'match'} {option.roommate.name}'s availability.
                </p>
              )}
            </div>
          )}

          {/* Reciprocity Messaging */}
          <div className={styles.reciprocityMessage}>
            <h5>🤝 Building Reciprocity</h5>
            <p>
              Swaps build goodwill and make future requests easier. Users who
              participate in swaps are 2.3x more likely to have their requests
              accepted.
            </p>
          </div>

          {/* Social Proof */}
          {option.estimatedAcceptanceProbability > 0.5 && (
            <div className={styles.socialProof}>
              <span className={styles.quoteIcon}>💬</span>
              <p>
                "Love swaps! Fair for everyone and strengthens the roommate
                relationship. Win-win!"
              </p>
              <p className={styles.proofAttribution}>
                - User who swaps regularly
              </p>
            </div>
          )}

          {/* Response Time Estimate */}
          <div className={styles.responseEstimate}>
            <span className={styles.speedIcon}>⚡</span>
            <span>
              {option.roommate.name} typically responds in{' '}
              {formatResponseTime(option.roommate.avgResponseTimeHours)}
            </span>
          </div>

          {/* Acceptance Probability */}
          {option.estimatedAcceptanceProbability > 0 && (
            <div className={styles.acceptanceProbability}>
              <div className={styles.probabilityBar}>
                <div
                  className={styles.probabilityFill}
                  style={{
                    width: `${option.estimatedAcceptanceProbability * 100}%`,
                  }}
                />
              </div>
              <p className={styles.probabilityText}>
                {Math.round(option.estimatedAcceptanceProbability * 100)}%
                historical acceptance rate for swaps
              </p>
            </div>
          )}

          {/* Potential Matches Preview */}
          {option.potentialMatches && option.potentialMatches > 0 && (
            <div className={styles.matchesPreview}>
              <h5>Your Available Nights</h5>
              <p className={styles.matchesHint}>
                After selecting swap, you'll choose which of your nights to offer
                in exchange. We'll show you {option.roommate.name}'s preferences.
              </p>
            </div>
          )}

          {/* Reasoning (if provided) */}
          {option.reasoning && option.reasoning.length > 0 && (
            <div className={styles.reasoningSection}>
              <h5 className={styles.reasoningTitle}>Why we suggest this:</h5>
              <ul className={styles.reasoningList}>
                {option.reasoning.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Selection Checkmark */}
      {isSelected && (
        <div className={styles.selectionCheckmark}>
          <span className={styles.checkmark}>✓</span>
        </div>
      )}

      {/* Expand/Collapse Indicator */}
      <button
        className={styles.expandButton}
        onClick={(e) => {
          e.stopPropagation();
          isExpanded ? onCollapse() : onSelect();
        }}
        aria-label={isExpanded ? 'Show less' : 'Show more'}
      >
        {isExpanded ? '▲ Show less' : '▼ Show more'}
      </button>
    </div>
  );
};

export default SwapCard;
