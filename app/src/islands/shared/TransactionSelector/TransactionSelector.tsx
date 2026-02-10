/**
 * TransactionSelector Component - Pattern 1: Personalized Defaults
 *
 * Main container for transaction selection UI with personalized recommendations.
 * Displays full_week, shared_night, and alternating options as cards with visual hierarchy based on archetype.
 *
 * @module components/TransactionSelector
 */

import React, { useEffect, useState } from 'react';
import { usePersonalizedDefaults } from '../DateChangeRequestManager/hooks/usePersonalizedDefaults';
import { BuyoutCard } from './BuyoutCard';
import { CrashCard } from './CrashCard';
import { SwapCard } from './SwapCard';
import { RecommendationBadge } from './RecommendationBadge';
import { formatDate } from '../DateChangeRequestManager/utils/formatting';
import type {
  TransactionSelectorProps,
  TransactionType,
} from '../DateChangeRequestManager/types';
import styles from './TransactionSelector.module.css';

/**
 * Loading state component
 */
const LoadingState: React.FC = () => (
  <div className={styles.loadingContainer}>
    <div className={styles.spinner} />
    <p>Loading personalized recommendations...</p>
  </div>
);

/**
 * Error state component
 */
const ErrorState: React.FC<{ error: Error; onRetry: () => void }> = ({
  error,
  onRetry,
}) => (
  <div className={styles.errorContainer}>
    <p className={styles.errorMessage}>
      Failed to load recommendations: {error.message}
    </p>
    <button onClick={onRetry} className={styles.retryButton}>
      Try Again
    </button>
  </div>
);

/**
 * TransactionSelector - Main component
 *
 * Displays personalized transaction options with visual hierarchy.
 * Auto-selects primary recommendation on mount.
 *
 * @param props - Component props
 * @returns React element
 */
export const TransactionSelector: React.FC<TransactionSelectorProps> = ({
  userId,
  targetDate,
  roommateId,
  onTransactionSelected,
  onCancel,
  initialSelection,
  onSelectionChange,
  showActions = true,
  selectedType,
  onSelect,
  recommendation,
}) => {
  // Fetch personalized recommendations
  const {
    primaryOption,
    sortedOptions,
    reasoning,
    loading,
    error,
    refetch,
    archetypeType,
    archetypeConfidence,
  } = usePersonalizedDefaults({
    userId,
    targetDate,
    roommateId,
  });

  // Local UI state
  const [selectedOption, setSelectedOption] = useState<TransactionType | null>(
    initialSelection || null
  );
  const effectiveSelected = selectedType ?? selectedOption;
  const [expandedCard, setExpandedCard] = useState<TransactionType | null>(
    null
  );
  const [selectionStartTime] = useState<number>(Date.now());

  // Auto-select primary recommendation on mount
  useEffect(() => {
    const recommendedType = recommendation ?? primaryOption;
    if (!recommendedType || effectiveSelected || initialSelection || selectedType) {
      return;
    }

    setSelectedOption(recommendedType);
    setExpandedCard(recommendedType);
    if (onSelect) {
      onSelect(recommendedType);
    }
    if (onSelectionChange) {
      onSelectionChange(recommendedType);
    }
  }, [
    recommendation,
    primaryOption,
    effectiveSelected,
    initialSelection,
    selectedType,
    onSelect,
    onSelectionChange,
  ]);

  // Handle card selection
  const handleSelect = (type: TransactionType) => {
    // Log option change if switching from previous selection
    if (effectiveSelected && effectiveSelected !== type) {
      logAnalyticsEvent('Transaction Option Changed', {
        userId,
        from: effectiveSelected,
        to: type,
      });
    }

    if (!selectedType) {
      setSelectedOption(type);
    }
    setExpandedCard(type);
    if (onSelect) {
      onSelect(type);
    }
    if (onSelectionChange) {
      onSelectionChange(type);
    }
  };

  // Handle card collapse
  const handleCollapse = (type: TransactionType) => {
    if (expandedCard === type) {
      setExpandedCard(null);
    }
  };

  // Handle continue button click
  const handleContinue = () => {
    if (!effectiveSelected || !sortedOptions || !onTransactionSelected) return;

    const selected = sortedOptions.find((opt) => opt.type === effectiveSelected);
    if (!selected) return;

    // Calculate time to decision
    const timeToDecisionSeconds = Math.round((Date.now() - selectionStartTime) / 1000);

    // Log analytics event
    logAnalyticsEvent('Transaction Option Selected', {
      userId,
      selectedOption: effectiveSelected,
      wasRecommended: selected.recommended,
      timeToDecisionSeconds,
    });

    onTransactionSelected(selected);
  };

  // Render loading state
  if (loading) {
    return <LoadingState />;
  }

  // Render error state
  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  // Render null if no options loaded
  if (!sortedOptions || sortedOptions.length === 0) {
    return null;
  }

  return (
    <div className={styles.transactionSelector}>
      {/* Header */}
      <header className={styles.selectorHeader}>
        <h2>Change Your Date</h2>
        <p className={styles.targetDate}>
          You want: {formatDate(targetDate, 'long')}
        </p>

        {/* Recommendation Badge */}
        {(recommendation ?? primaryOption) && reasoning.length > 0 && (
          <RecommendationBadge
            primaryOption={recommendation ?? primaryOption}
            reasoning={reasoning}
          />
        )}

        {/* Archetype Debug Info (remove in production) */}
        {archetypeType && archetypeConfidence && (
          <p className={styles.archetypeInfo}>
            Detected: {archetypeType} ({Math.round(archetypeConfidence * 100)}%
            confident)
          </p>
        )}
      </header>

      {/* Option Cards */}
      <div className={styles.optionCards}>
        {sortedOptions.map((option, index) => {
          const isSelected = effectiveSelected === option.type;
          const isExpanded = expandedCard === option.type;
          const isPrimary = option.recommended;

          // Select appropriate card component
          let CardComponent:
            | typeof BuyoutCard
            | typeof CrashCard
            | typeof SwapCard;

          if (option.type === 'full_week') {
            CardComponent = BuyoutCard;
          } else if (option.type === 'shared_night') {
            CardComponent = CrashCard;
          } else {
            CardComponent = SwapCard;
          }

          return (
            <CardComponent
              key={option.type}
              option={option}
              isSelected={isSelected}
              isExpanded={isExpanded}
              isPrimary={isPrimary}
              onSelect={() => handleSelect(option.type)}
              onCollapse={() => handleCollapse(option.type)}
              index={index}
            />
          );
        })}
      </div>

      {/* Action Footer */}
      {showActions && (
        <div className={styles.actionFooter}>
          <button className={styles.btnSecondary} onClick={onCancel}>
            Cancel
          </button>
          <button
            className={styles.btnPrimary}
            disabled={!effectiveSelected}
            onClick={handleContinue}
          >
            Continue with {effectiveSelected?.replace('_', ' ') || '...'}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Log analytics event
 */
function logAnalyticsEvent(eventName: string, properties: unknown): void {
  console.log('[Analytics]', eventName, properties);
}

export default TransactionSelector;
