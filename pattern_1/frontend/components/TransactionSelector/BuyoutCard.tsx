/**
 * BuyoutCard Component - Pattern 1: Personalized Defaults
 *
 * Displays buyout transaction option with premium styling and detailed breakdown.
 *
 * @module components/TransactionSelector/BuyoutCard
 */

import React from 'react';
import { formatCurrency, formatResponseTime } from '../../utils/formatting';
import type { TransactionCardProps } from '../../types';
import styles from '../../styles/TransactionSelector.module.css';
import cardStyles from '../../styles/Cards.module.css';

/**
 * BuyoutCard Component
 *
 * Buyout option card with:
 * - Premium badge for recommended state
 * - Large price display
 * - Urgency premium indicator
 * - Roommate payment breakdown
 * - Benefits list (expandable)
 * - Social proof messaging
 * - Response time estimate
 *
 * @param props - Component props
 * @returns React element
 */
export const BuyoutCard: React.FC<TransactionCardProps> = ({
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
    cardStyles.buyoutCard,
    isSelected && styles.selected,
    isPrimary && styles.primaryRecommendation,
    isExpanded && styles.expanded,
  ]
    .filter(Boolean)
    .join(' ');

  const hasUrgencyPremium = option.urgencyMultiplier > 1.0;
  const urgencyPercentage = Math.round((option.urgencyMultiplier - 1) * 100);

  return (
    <div
      className={cardClasses}
      onClick={onSelect}
      role="button"
      tabIndex={index}
      aria-selected={isSelected}
      aria-expanded={isExpanded}
      data-transaction-type="buyout"
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
          <span className={styles.badgeIcon}>🏆</span>
          <span className={styles.badgeText}>RECOMMENDED FOR YOU</span>
        </div>
      )}

      {/* Card Header */}
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <span className={styles.icon}>🏆</span>
          <h3>Buyout - Exclusive Access</h3>
        </div>
        {option.estimatedAcceptanceProbability > 0.6 && (
          <div className={styles.confidenceIndicator}>
            {Math.round(option.estimatedAcceptanceProbability * 100)}% likely
            accepted
          </div>
        )}
      </div>

      {/* Price Display */}
      <div className={styles.priceDisplay}>
        <div className={styles.finalPrice}>
          <span className={styles.currency}>$</span>
          <span className={styles.amount}>
            {formatCurrency(option.totalCost, false)}
          </span>
        </div>
        <div className={styles.priceBreakdown}>
          {formatCurrency(option.price)} + {formatCurrency(option.platformFee)}{' '}
          fee
        </div>
        {hasUrgencyPremium && (
          <div className={styles.urgencyTag}>
            +{urgencyPercentage}% urgency premium
          </div>
        )}
      </div>

      {/* Quick Summary (Collapsed View) */}
      {!isExpanded && (
        <div className={styles.quickSummary}>
          <p className={styles.summaryText}>
            ✓ Guaranteed availability • Exclusive use • Immediate confirmation
          </p>
          {option.roommateReceives && (
            <p className={styles.roommateAmount}>
              {option.roommate.name} receives {formatCurrency(option.roommateReceives)}
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
              Guaranteed availability - no risk of rejection
            </li>
            <li>
              <span className={styles.checkmark}>✓</span>
              Exclusive use of the room (no shared space)
            </li>
            <li>
              <span className={styles.checkmark}>✓</span>
              Immediate confirmation when {option.roommate.name} accepts
            </li>
            {option.roommateReceives && (
              <li>
                <span className={styles.checkmark}>✓</span>
                {option.roommate.name} receives{' '}
                {formatCurrency(option.roommateReceives)}
              </li>
            )}
            <li>
              <span className={styles.checkmark}>✓</span>
              Your belongings remain secure in the room
            </li>
          </ul>

          {/* Urgency Notice */}
          {hasUrgencyPremium && option.urgencyMultiplier >= 1.25 && (
            <div className={styles.urgencyNotice}>
              <strong>⏰ Urgency Premium Applied</strong>
              <p>
                Due to {Math.round(option.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)} days notice,
                a {urgencyPercentage}% urgency adjustment has been applied. Book
                earlier to avoid this premium.
              </p>
            </div>
          )}

          {/* Social Proof */}
          {option.estimatedAcceptanceProbability > 0.7 && (
            <div className={styles.socialProof}>
              <span className={styles.quoteIcon}>💬</span>
              <p>
                "Worth every penny for last-minute work trips. Saved me from
                hotel costs!"
              </p>
              <p className={styles.proofAttribution}>
                - Similar user who chose buyout
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
                historical acceptance rate for buyouts
              </p>
            </div>
          )}

          {/* Reasoning (if provided) */}
          {option.reasoning && option.reasoning.length > 0 && (
            <div className={styles.reasoningSection}>
              <h5 className={styles.reasoningTitle}>Why we recommend this:</h5>
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

export default BuyoutCard;
