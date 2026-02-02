/**
 * RecommendationBadge Component - Pattern 1: Personalized Defaults
 *
 * Displays why a particular option is recommended with reasoning.
 *
 * @module components/TransactionSelector/RecommendationBadge
 */

import React, { useState } from 'react';
import type { RecommendationBadgeProps, TransactionType } from '../../types';
import styles from '../../styles/TransactionSelector.module.css';

/**
 * Get human-readable transaction label
 *
 * @param type - Transaction type
 * @returns Label string
 */
function getTransactionLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    buyout: 'Buyout',
    crash: 'Crash',
    swap: 'Swap',
  };
  return labels[type];
}

/**
 * Get icon for transaction type
 *
 * @param type - Transaction type
 * @returns Emoji icon
 */
function getTransactionIcon(type: TransactionType): string {
  const icons: Record<TransactionType, string> = {
    buyout: '🏆',
    crash: '🛋️',
    swap: '🔄',
  };
  return icons[type];
}

/**
 * RecommendationBadge Component
 *
 * Shows recommendation with:
 * - Transaction type icon and label
 * - "Why?" button to expand reasoning
 * - Collapsible reasoning list
 * - Archetype-based messaging
 *
 * @param props - Component props
 * @returns React element
 */
export const RecommendationBadge: React.FC<RecommendationBadgeProps> = ({
  primaryOption,
  reasoning,
  expanded: controlledExpanded,
}) => {
  const [isExpanded, setIsExpanded] = useState(controlledExpanded ?? false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const transactionLabel = getTransactionLabel(primaryOption);
  const transactionIcon = getTransactionIcon(primaryOption);

  return (
    <div className={styles.recommendationBadge}>
      {/* Badge Header */}
      <div className={styles.badgeHeader}>
        <div className={styles.badgeTitle}>
          <span className={styles.lightbulbIcon}>💡</span>
          <span className={styles.badgeTitleText}>
            We recommend <strong>{transactionIcon} {transactionLabel}</strong> for
            you
          </span>
        </div>
        <button
          className={styles.whyButton}
          onClick={handleToggle}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Hide reasoning' : 'Show reasoning'}
        >
          {isExpanded ? 'Hide' : 'Why?'}
        </button>
      </div>

      {/* Reasoning List (Collapsible) */}
      {isExpanded && reasoning.length > 0 && (
        <div className={styles.reasoningContent}>
          <h4 className={styles.reasoningHeading}>
            Based on your booking patterns:
          </h4>
          <ul className={styles.reasoningBullets}>
            {reasoning.map((reason, index) => (
              <li key={index} className={styles.reasoningItem}>
                <span className={styles.bulletIcon}>•</span>
                <span className={styles.reasoningText}>{reason}</span>
              </li>
            ))}
          </ul>
          <p className={styles.reasoningFooter}>
            You can still choose any option that works best for your situation.
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendationBadge;
