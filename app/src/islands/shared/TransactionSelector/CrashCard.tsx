/**
 * CrashCard Component - Pattern 1: Personalized Defaults
 *
 * Displays crash transaction option with balanced pricing and shared space details.
 *
 * @module components/TransactionSelector/CrashCard
 */

import React from 'react';
import { formatCurrency, formatResponseTime, formatSavings } from '../DateChangeRequestManager/utils/formatting';
import type { TransactionCardProps } from '../DateChangeRequestManager/types';
import styles from './TransactionSelector.module.css';
import cardStyles from './Cards.module.css';

/**
 * CrashCard Component
 *
 * Crash option card with:
 * - Mid-range pricing display
 * - Savings vs buyout indicator
 * - Shared space disclaimer
 * - Benefits list (expandable)
 * - Cost-benefit messaging
 *
 * @param props - Component props
 * @returns React element
 */
export const CrashCard: React.FC<TransactionCardProps> = ({
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
    cardStyles.crashCard,
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
      data-transaction-type="crash"
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
          <span className={styles.badgeIcon}>⭐</span>
          <span className={styles.badgeText}>BEST VALUE</span>
        </div>
      )}

      {/* Card Header */}
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <span className={styles.icon}>🛋️</span>
          <h3>Crash - Shared Space</h3>
        </div>
        {option.savingsVsBuyout && option.savingsVsBuyout > 0 && (
          <div className={styles.savingsBadge}>
            {formatSavings(option.savingsVsBuyout)} vs Buyout
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
      </div>

      {/* Quick Summary (Collapsed View) */}
      {!isExpanded && (
        <div className={styles.quickSummary}>
          <p className={styles.summaryText}>
            ⚖️ Balanced cost & certainty • Share the room • Your stuff stays
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
              Affordable option (~20% of buyout cost)
            </li>
            <li>
              <span className={styles.checkmark}>✓</span>
              Share the room with {option.roommate.name} for one night
            </li>
            <li>
              <span className={styles.checkmark}>✓</span>
              Your belongings remain in the room
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
              Good acceptance rate for reasonable requests
            </li>
          </ul>

          {/* Shared Space Disclaimer */}
          <div className={styles.sharedSpaceNotice}>
            <strong>📋 Shared Space Details</strong>
            <p>
              You'll share the room with {option.roommate.name} for this night.
              Both of you will have sleeping space, and your belongings stay
              secure in the room. This is a great middle-ground option.
            </p>
          </div>

          {/* Cost-Benefit Messaging */}
          {option.savingsVsBuyout && option.savingsVsBuyout > 0 && (
            <div className={styles.costBenefit}>
              <h5>💰 Cost Savings</h5>
              <p>
                Save {formatCurrency(option.savingsVsBuyout)} compared to buyout
                while still getting access to the room. Perfect for short trips
                or budget-conscious travelers.
              </p>
            </div>
          )}

          {/* Social Proof */}
          {option.estimatedAcceptanceProbability > 0.6 && (
            <div className={styles.socialProof}>
              <span className={styles.quoteIcon}>💬</span>
              <p>
                "Great option when I needed the room but didn't want to pay full
                buyout. Shared space worked perfectly!"
              </p>
              <p className={styles.proofAttribution}>
                - User who chose crash
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
                historical acceptance rate for crashes
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

export default CrashCard;
