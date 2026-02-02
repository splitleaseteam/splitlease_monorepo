/**
 * TransactionSelector Component - Pattern 1: Personalized Defaults
 *
 * Main container for transaction selection UI with personalized recommendations.
 * Displays buyout, crash, and swap options as cards with visual hierarchy based on archetype.
 *
 * @module components/TransactionSelector
 */

import React, { useEffect, useState } from 'react';
import { usePersonalizedDefaults } from '../../hooks/usePersonalizedDefaults';
import { BuyoutCard } from './BuyoutCard';
import { CrashCard } from './CrashCard';
import { SwapCard } from './SwapCard';
import { RecommendationBadge } from './RecommendationBadge';
import { formatDate } from '../../utils/formatting';
import type {
  TransactionSelectorProps,
  TransactionType,
  TransactionOption,
} from '../../types';
import styles from '../../styles/TransactionSelector.module.css';

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
  const [expandedCard, setExpandedCard] = useState<TransactionType | null>(
    null
  );
  const [selectionStartTime] = useState<number>(Date.now());

  // Auto-select primary recommendation on mount
  useEffect(() => {
    if (primaryOption && !selectedOption && !initialSelection) {
      setSelectedOption(primaryOption);
      setExpandedCard(primaryOption);
    }
  }, [primaryOption, selectedOption, initialSelection]);

  // Handle card selection
  const handleSelect = (type: TransactionType) => {
    // Log option change if switching from previous selection
    if (selectedOption && selectedOption !== type) {
      logAnalyticsEvent('Transaction Option Changed', {
        userId,
        from: selectedOption,
        to: type,
      });
    }

    setSelectedOption(type);
    setExpandedCard(type);
  };

  // Handle card collapse
  const handleCollapse = (type: TransactionType) => {
    if (expandedCard === type) {
      setExpandedCard(null);
    }
  };

  // Handle continue button click
  const handleContinue = () => {
    if (!selectedOption || !sortedOptions) return;

    const selected = sortedOptions.find((opt) => opt.type === selectedOption);
    if (!selected) return;

    // Calculate time to decision
    const timeToDecisionSeconds = Math.round((Date.now() - selectionStartTime) / 1000);

    // Log analytics event
    logAnalyticsEvent('Transaction Option Selected', {
      userId,
      selectedOption,
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

  // Find individual options
  const buyoutOption = sortedOptions.find((opt) => opt.type === 'buyout');
  const crashOption = sortedOptions.find((opt) => opt.type === 'crash');
  const swapOption = sortedOptions.find((opt) => opt.type === 'swap');

  return (
    <div className={styles.transactionSelector}>
      {/* Header */}
      <header className={styles.selectorHeader}>
        <h2>Change Your Date</h2>
        <p className={styles.targetDate}>
          You want: {formatDate(targetDate, 'long')}
        </p>

        {/* Recommendation Badge */}
        {primaryOption && reasoning.length > 0 && (
          <RecommendationBadge
            primaryOption={primaryOption}
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
          const isSelected = selectedOption === option.type;
          const isExpanded = expandedCard === option.type;
          const isPrimary = option.recommended;

          // Select appropriate card component
          let CardComponent:
            | typeof BuyoutCard
            | typeof CrashCard
            | typeof SwapCard;

          if (option.type === 'buyout') {
            CardComponent = BuyoutCard;
          } else if (option.type === 'crash') {
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
      <div className={styles.actionFooter}>
        <button className={styles.btnSecondary} onClick={onCancel}>
          Cancel
        </button>
        <button
          className={styles.btnPrimary}
          disabled={!selectedOption}
          onClick={handleContinue}
        >
          Continue with {selectedOption?.replace('_', ' ') || '...'}
        </button>
      </div>
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
