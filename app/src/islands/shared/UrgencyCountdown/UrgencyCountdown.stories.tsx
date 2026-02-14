/**
 * Pattern 2: Urgency Countdown - Storybook Stories
 *
 * Comprehensive stories demonstrating all components and variants
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { UrgencyCountdown, MinimalUrgencyCountdown, ProminentUrgencyCountdown } from './components/UrgencyCountdown';
import { CountdownTimer, CompactCountdownTimer, DetailedCountdownTimer } from './components/CountdownTimer';
import { PriceProgression, CompactPriceProgression, PriceProgressionTable, PriceProgressionChart } from './components/PriceProgression';
import { UrgencyIndicator, CompactUrgencyIndicator, UrgencyBadge, UrgencyProgressBar, UrgencyTimeline } from './components/UrgencyIndicator';
import { PriceIncreaseRate, CompactPriceIncreaseRate, DetailedPriceIncreaseRate } from './components/PriceIncreaseRate';
import { ActionPrompt, CompactActionPrompt, SplitActionPrompt, TimerActionPrompt } from './components/ActionPrompt';
import { addDays } from './utils/dateFormatting';
import { getUrgencyMetadata } from './utils/urgencyCalculations';

// ========================================
// MAIN URGENCY COUNTDOWN
// ========================================

const meta: Meta<typeof UrgencyCountdown> = {
  title: 'Pattern 2/UrgencyCountdown',
  component: UrgencyCountdown,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    urgencySteepness: {
      control: { type: 'range', min: 1.0, max: 3.0, step: 0.1 },
    },
    marketDemandMultiplier: {
      control: { type: 'range', min: 0.5, max: 2.0, step: 0.1 },
    },
    transactionType: {
      control: { type: 'select' },
      options: ['full_week', 'shared_night', 'alternating'],
    },
    variant: {
      control: { type: 'select' },
      options: ['standard', 'compact', 'prominent', 'minimal'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof UrgencyCountdown>;

export const LowUrgency: Story = {
  args: {
    targetDate: addDays(new Date(), 21),
    basePrice: 180,
    transactionType: 'full_week',
    variant: 'standard',
  },
  parameters: {
    docs: {
      description: {
        story: 'Low urgency state (14+ days out) with calm blue theme and no CTA.',
      },
    },
  },
};

export const MediumUrgency: Story = {
  args: {
    targetDate: addDays(new Date(), 10),
    basePrice: 180,
    transactionType: 'shared_night',
    variant: 'standard',
  },
  parameters: {
    docs: {
      description: {
        story: 'Medium urgency state (8-14 days) with amber theme and CTA shown.',
      },
    },
  },
};

export const HighUrgency: Story = {
  args: {
    targetDate: addDays(new Date(), 5),
    basePrice: 180,
    transactionType: 'alternating',
    variant: 'standard',
  },
  parameters: {
    docs: {
      description: {
        story: 'High urgency state (4-7 days) with orange theme and emphasized CTA.',
      },
    },
  },
};

export const CriticalUrgency: Story = {
  args: {
    targetDate: addDays(new Date(), 2),
    basePrice: 180,
    transactionType: 'full_week',
    variant: 'standard',
  },
  parameters: {
    docs: {
      description: {
        story: 'Critical urgency state (0-3 days) with red theme, pulsing animations, and urgent CTA.',
      },
    },
  },
};

export const CompactVariant: Story = {
  args: {
    targetDate: addDays(new Date(), 5),
    basePrice: 180,
    transactionType: 'full_week',
    variant: 'compact',
  },
};

export const ProminentVariant: Story = {
  args: {
    targetDate: addDays(new Date(), 5),
    basePrice: 180,
    transactionType: 'full_week',
    variant: 'prominent',
  },
};

export const MinimalVariant: Story = {
  args: {
    targetDate: addDays(new Date(), 5),
    basePrice: 180,
    transactionType: 'full_week',
    variant: 'minimal',
  },
};

export const WithBudgetWarning: Story = {
  args: {
    targetDate: addDays(new Date(), 2),
    basePrice: 180,
    transactionType: 'full_week',
    budgetContext: {
      maxBudget: 500,
      preferredBudget: 400,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows budget warning when price exceeds user\'s maximum budget.',
      },
    },
  },
};

export const HighMarketDemand: Story = {
  args: {
    targetDate: addDays(new Date(), 7),
    basePrice: 180,
    marketDemandMultiplier: 1.4,
    transactionType: 'full_week',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows effect of high market demand (1.4x multiplier) on pricing.',
      },
    },
  },
};

export const LowMarketDemand: Story = {
  args: {
    targetDate: addDays(new Date(), 7),
    basePrice: 180,
    marketDemandMultiplier: 0.7,
    transactionType: 'full_week',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows effect of low market demand (0.7x multiplier) on pricing.',
      },
    },
  },
};

// ========================================
// COUNTDOWN TIMER
// ========================================

export const CountdownTimerStories = {
  title: 'Pattern 2/CountdownTimer',
  component: CountdownTimer,
};

export const CountdownDefault: Story = {
  render: () => (
    <CountdownTimer
      targetDate={addDays(new Date(), 7)}
      urgencyLevel="high"
    />
  ),
};

export const CountdownCompact: Story = {
  render: () => (
    <CompactCountdownTimer
      targetDate={addDays(new Date(), 7)}
      urgencyLevel="high"
    />
  ),
};

export const CountdownDetailed: Story = {
  render: () => (
    <DetailedCountdownTimer
      targetDate={addDays(new Date(), 7)}
      urgencyLevel="high"
    />
  ),
};

export const CountdownCritical: Story = {
  render: () => (
    <CountdownTimer
      targetDate={addDays(new Date(), 1)}
      urgencyLevel="critical"
    />
  ),
};

// ========================================
// PRICE PROGRESSION
// ========================================

const sampleProjections = [
  {
    daysOut: 5,
    price: 972,
    multiplier: 5.4,
    increaseFromCurrent: 162,
    percentageIncrease: 20.0,
  },
  {
    daysOut: 3,
    price: 1152,
    multiplier: 6.4,
    increaseFromCurrent: 342,
    percentageIncrease: 42.2,
  },
  {
    daysOut: 1,
    price: 1584,
    multiplier: 8.8,
    increaseFromCurrent: 774,
    percentageIncrease: 95.6,
  },
];

export const ProgressionDefault: Story = {
  render: () => (
    <PriceProgression
      projections={sampleProjections}
      currentPrice={810}
      urgencyLevel="high"
    />
  ),
};

export const ProgressionCompact: Story = {
  render: () => (
    <CompactPriceProgression
      projections={sampleProjections}
      currentPrice={810}
      urgencyLevel="high"
    />
  ),
};

export const ProgressionTable: Story = {
  render: () => (
    <PriceProgressionTable
      projections={sampleProjections}
      currentPrice={810}
      urgencyLevel="high"
    />
  ),
};

export const ProgressionChart: Story = {
  render: () => (
    <PriceProgressionChart
      projections={sampleProjections}
      currentPrice={810}
      urgencyLevel="high"
    />
  ),
};

// ========================================
// URGENCY INDICATOR
// ========================================

export const IndicatorLow: Story = {
  render: () => (
    <UrgencyIndicator
      urgencyLevel="low"
      metadata={getUrgencyMetadata('low', 21)}
      daysUntil={21}
      showProgressBar={true}
    />
  ),
};

export const IndicatorMedium: Story = {
  render: () => (
    <UrgencyIndicator
      urgencyLevel="medium"
      metadata={getUrgencyMetadata('medium', 10)}
      daysUntil={10}
      showProgressBar={true}
    />
  ),
};

export const IndicatorHigh: Story = {
  render: () => (
    <UrgencyIndicator
      urgencyLevel="high"
      metadata={getUrgencyMetadata('high', 5)}
      daysUntil={5}
      showProgressBar={true}
    />
  ),
};

export const IndicatorCritical: Story = {
  render: () => (
    <UrgencyIndicator
      urgencyLevel="critical"
      metadata={getUrgencyMetadata('critical', 2)}
      daysUntil={2}
      showProgressBar={true}
    />
  ),
};

export const IndicatorCompact: Story = {
  render: () => (
    <CompactUrgencyIndicator
      urgencyLevel="high"
      metadata={getUrgencyMetadata('high', 5)}
      daysUntil={5}
    />
  ),
};

export const IndicatorBadge: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px' }}>
      <UrgencyBadge urgencyLevel="low" />
      <UrgencyBadge urgencyLevel="medium" />
      <UrgencyBadge urgencyLevel="high" />
      <UrgencyBadge urgencyLevel="critical" />
    </div>
  ),
};

export const IndicatorProgressBar: Story = {
  render: () => (
    <UrgencyProgressBar
      urgencyLevel="high"
      daysUntil={5}
      showLabel={true}
    />
  ),
};

export const IndicatorTimeline: Story = {
  render: () => (
    <UrgencyTimeline
      urgencyLevel="high"
      daysUntil={5}
    />
  ),
};

// ========================================
// PRICE INCREASE RATE
// ========================================

export const RateDefault: Story = {
  render: () => (
    <PriceIncreaseRate
      increaseRatePerDay={129}
      urgencyLevel="high"
      currentPrice={810}
      peakPrice={1584}
    />
  ),
};

export const RateCompact: Story = {
  render: () => (
    <CompactPriceIncreaseRate
      increaseRatePerDay={129}
      urgencyLevel="high"
    />
  ),
};

export const RateDetailed: Story = {
  render: () => (
    <DetailedPriceIncreaseRate
      increaseRatePerDay={129}
      urgencyLevel="high"
      currentPrice={810}
      peakPrice={1584}
    />
  ),
};

export const RateCritical: Story = {
  render: () => (
    <PriceIncreaseRate
      increaseRatePerDay={288}
      urgencyLevel="critical"
      currentPrice={1296}
      peakPrice={1584}
    />
  ),
};

// ========================================
// ACTION PROMPT
// ========================================

export const PromptLow: Story = {
  render: () => (
    <ActionPrompt
      currentPrice={396}
      urgencyLevel="low"
      onClick={() => console.log('Clicked')}
    />
  ),
};

export const PromptMedium: Story = {
  render: () => (
    <ActionPrompt
      currentPrice={648}
      urgencyLevel="medium"
      savings={504}
      onClick={() => console.log('Clicked')}
    />
  ),
};

export const PromptHigh: Story = {
  render: () => (
    <ActionPrompt
      currentPrice={810}
      urgencyLevel="high"
      savings={774}
      onClick={() => console.log('Clicked')}
    />
  ),
};

export const PromptCritical: Story = {
  render: () => (
    <ActionPrompt
      currentPrice={1296}
      urgencyLevel="critical"
      savings={288}
      onClick={() => console.log('Clicked')}
    />
  ),
};

export const PromptCompact: Story = {
  render: () => (
    <CompactActionPrompt
      currentPrice={810}
      urgencyLevel="high"
      onClick={() => console.log('Clicked')}
    />
  ),
};

export const PromptSplit: Story = {
  render: () => (
    <SplitActionPrompt
      currentPrice={810}
      urgencyLevel="high"
      savings={774}
      onClick={() => console.log('Primary clicked')}
      onSecondaryClick={() => console.log('Secondary clicked')}
    />
  ),
};

export const PromptWithTimer: Story = {
  render: () => (
    <TimerActionPrompt
      currentPrice={810}
      urgencyLevel="critical"
      savings={774}
      expiresAt={addDays(new Date(), 0.25)}
      onClick={() => console.log('Clicked')}
    />
  ),
};

export const PromptLoading: Story = {
  render: () => (
    <ActionPrompt
      currentPrice={810}
      urgencyLevel="high"
      onClick={() => console.log('Clicked')}
      loading={true}
    />
  ),
};

export const PromptDisabled: Story = {
  render: () => (
    <ActionPrompt
      currentPrice={810}
      urgencyLevel="high"
      onClick={() => console.log('Clicked')}
      disabled={true}
    />
  ),
};

// ========================================
// COMPLETE EXAMPLES
// ========================================

export const CompleteExample: Story = {
  render: () => {
    const [showAlert, setShowAlert] = React.useState(false);

    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <UrgencyCountdown
          targetDate={addDays(new Date(), 5)}
          basePrice={180}
          transactionType="buyout"
          variant="prominent"
          onPriceUpdate={(pricing) => {
            console.log('Price updated:', pricing);
          }}
          onUrgencyChange={(level) => {
            console.log('Urgency changed:', level);
          }}
          onActionClick={() => {
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
          }}
        />
        {showAlert && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: '#4CAF50',
            color: 'white',
            borderRadius: '8px',
            textAlign: 'center',
          }}>
            Booking initiated! 🎉
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete working example with all interactions enabled.',
      },
    },
  },
};

export const Playground: Story = {
  args: {
    targetDate: addDays(new Date(), 7),
    basePrice: 180,
    urgencySteepness: 2.0,
    marketDemandMultiplier: 1.0,
    transactionType: 'full_week',
    variant: 'standard',
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground to test different configurations.',
      },
    },
  },
};
