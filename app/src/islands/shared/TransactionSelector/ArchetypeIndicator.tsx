/**
 * ArchetypeIndicator Component - Pattern 1: Personalized Defaults
 *
 * Displays user archetype with icon, label, and confidence meter.
 *
 * @module components/TransactionSelector/ArchetypeIndicator
 */

import React, { useState } from 'react';
import type { ArchetypeType } from '../DateChangeRequestManager/types';
import { getArchetypeLabel, getArchetypeDescription } from '../DateChangeRequestManager/utils/archetypeLogic';
import { formatConfidence } from '../DateChangeRequestManager/utils/formatting';
import styles from './TransactionSelector.module.css';

/**
 * Component props
 */
export interface ArchetypeIndicatorProps {
  /** Archetype type */
  archetype: ArchetypeType;
  /** Confidence in classification (0-1) */
  confidence: number;
  /** Reason for classification */
  reason?: string;
  /** Whether to show full details */
  detailed?: boolean;
}

/**
 * Get icon for archetype
 *
 * @param archetype - Archetype type
 * @returns Emoji icon
 */
function getArchetypeIcon(archetype: ArchetypeType): string {
  const icons: Record<ArchetypeType, string> = {
    big_spender: '🏆',
    high_flexibility: '🤝',
    average_user: '👤',
  };
  return icons[archetype];
}

/**
 * Get color for archetype
 *
 * @param archetype - Archetype type
 * @returns CSS color class name
 */
function getArchetypeColor(archetype: ArchetypeType): string {
  const colors: Record<ArchetypeType, string> = {
    big_spender: 'gold',
    high_flexibility: 'green',
    average_user: 'blue',
  };
  return colors[archetype];
}

/**
 * ArchetypeIndicator Component
 *
 * Shows archetype with:
 * - Icon based on type
 * - Label and description
 * - Confidence meter
 * - "Why this?" expandable tooltip
 *
 * @param props - Component props
 * @returns React element
 */
export const ArchetypeIndicator: React.FC<ArchetypeIndicatorProps> = ({
  archetype,
  confidence,
  reason,
  detailed = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const icon = getArchetypeIcon(archetype);
  const label = getArchetypeLabel(archetype);
  const description = getArchetypeDescription(archetype);
  const color = getArchetypeColor(archetype);

  const indicatorClass = `${styles.archetypeIndicator} ${styles[`archetype-${color}`]}`;

  return (
    <div className={indicatorClass}>
      {/* Compact View */}
      <div className={styles.archetypeCompact}>
        <span className={styles.archetypeIcon}>{icon}</span>
        <div className={styles.archetypeInfo}>
          <span className={styles.archetypeLabel}>{label}</span>
          <span className={styles.archetypeConfidence}>
            {formatConfidence(confidence)} confidence
          </span>
        </div>
        {(detailed || reason) && (
          <button
            className={styles.archetypeWhyButton}
            onClick={() => setShowDetails(!showDetails)}
            aria-expanded={showDetails}
          >
            {showDetails ? '▲' : '▼'}
          </button>
        )}
      </div>

      {/* Confidence Meter */}
      <div className={styles.confidenceMeter}>
        <div
          className={styles.confidenceFill}
          style={{ width: `${confidence * 100}%` }}
        />
      </div>

      {/* Detailed View (Expandable) */}
      {showDetails && (
        <div className={styles.archetypeDetails}>
          <p className={styles.archetypeDescription}>{description}</p>
          {reason && (
            <div className={styles.archetypeReason}>
              <h5>Why we classified you this way:</h5>
              <p>{reason}</p>
            </div>
          )}
          <p className={styles.archetypeDisclaimer}>
            This helps us suggest the best option for you. You can choose any
            option regardless of your archetype.
          </p>
        </div>
      )}
    </div>
  );
};

export default ArchetypeIndicator;
