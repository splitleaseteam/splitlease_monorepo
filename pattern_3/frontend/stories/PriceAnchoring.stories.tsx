/**
 * PATTERN 3: PRICE ANCHORING - STORYBOOK STORIES
 * Complete Storybook stories for all components
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { SavingsBadge } from '../components/SavingsBadge';
import { PriceDisplay } from '../components/PriceDisplay';
import { PriceTierCard } from '../components/PriceTierCard';
import { PriceTierSelector } from '../components/PriceTierSelector';
import { AnchorCard } from '../components/AnchorCard';
import { ComparisonCard } from '../components/ComparisonCard';
import { PriceComparisonChart } from '../components/PriceComparisonChart';
import { PriceAnchoringStack } from '../components/PriceAnchoringStack';
import { DateChangeRequestForm } from '../components/DateChangeRequestForm';
import { DateChangeRequestManager } from '../components/DateChangeRequestManager';
import { PRICE_TIERS } from '../utils';
import '../styles/PriceAnchoring.css';

// ============================================================================
// SAVINGS BADGE STORIES
// ============================================================================

const SavingsBadgeMeta: Meta<typeof SavingsBadge> = {
  title: 'Pattern 3/Components/SavingsBadge',
  component: SavingsBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default SavingsBadgeMeta;

type SavingsBadgeStory = StoryObj<typeof SavingsBadge>;

export const Default: SavingsBadgeStory = {
  args: {
    savingsAmount: 2511,
    savingsPercentage: 88.6,
    size: 'medium',
    variant: 'default',
  },
};

export const SmallSize: SavingsBadgeStory = {
  args: {
    savingsAmount: 100,
    savingsPercentage: 20,
    size: 'small',
  },
};

export const LargeSize: SavingsBadgeStory = {
  args: {
    savingsAmount: 2511,
    savingsPercentage: 88.6,
    size: 'large',
  },
};

export const HugeSavings: SavingsBadgeStory = {
  args: {
    savingsAmount: 2873,
    savingsPercentage: 99.8,
    size: 'large',
    variant: 'prominent',
  },
};

export const Animated: SavingsBadgeStory = {
  args: {
    savingsAmount: 2511,
    savingsPercentage: 88.6,
    size: 'large',
    animated: true,
  },
};

// ============================================================================
// PRICE DISPLAY STORIES
// ============================================================================

export const PriceDisplayStories: Meta<typeof PriceDisplay> = {
  title: 'Pattern 3/Components/PriceDisplay',
  component: PriceDisplay,
  parameters: {
    layout: 'centered',
  },
};

export const SimplePriceDisplay: StoryObj<typeof PriceDisplay> = {
  args: {
    price: 324,
    label: 'Your Offer',
  },
};

export const PriceWithAnchor: StoryObj<typeof PriceDisplay> = {
  args: {
    price: 324,
    anchorPrice: 2835,
    showSavings: true,
    showOriginalPrice: true,
  },
};

export const LargePriceDisplay: StoryObj<typeof PriceDisplay> = {
  args: {
    price: 324,
    size: 'lg',
    label: 'Total Cost',
  },
};

export const EmphasizedPrice: StoryObj<typeof PriceDisplay> = {
  args: {
    price: 324,
    variant: 'emphasized',
    size: 'xl',
  },
};

// ============================================================================
// PRICE TIER CARD STORIES
// ============================================================================

export const PriceTierCardStories: Meta<typeof PriceTierCard> = {
  title: 'Pattern 3/Components/PriceTierCard',
  component: PriceTierCard,
  parameters: {
    layout: 'centered',
  },
};

const CheckIcon = () => <span>✓</span>;
const StarIcon = () => <span>⭐</span>;
const BoltIcon = () => <span>⚡</span>;

export const BudgetTier: StoryObj<typeof PriceTierCard> = {
  args: {
    tier: { ...PRICE_TIERS.budget, icon: CheckIcon },
    price: 405,
    basePrice: 450,
    isSelected: false,
    onSelect: () => console.log('Budget selected'),
  },
};

export const RecommendedTier: StoryObj<typeof PriceTierCard> = {
  args: {
    tier: { ...PRICE_TIERS.recommended, icon: StarIcon },
    price: 450,
    basePrice: 450,
    isSelected: true,
    savings: {
      amount: 50,
      percentage: 10,
      formattedAmount: '$50.00',
      formattedPercentage: '10%',
      tier: 'modest',
    },
    onSelect: () => console.log('Recommended selected'),
  },
};

export const PremiumTier: StoryObj<typeof PriceTierCard> = {
  args: {
    tier: { ...PRICE_TIERS.premium, icon: BoltIcon },
    price: 517.5,
    basePrice: 450,
    isSelected: false,
    onSelect: () => console.log('Premium selected'),
  },
};

// ============================================================================
// PRICE TIER SELECTOR STORIES
// ============================================================================

export const PriceTierSelectorStories: Meta<typeof PriceTierSelector> = {
  title: 'Pattern 3/Components/PriceTierSelector',
  component: PriceTierSelector,
  parameters: {
    layout: 'padded',
  },
};

export const DefaultSelector: StoryObj<typeof PriceTierSelector> = {
  args: {
    basePrice: 450,
    onPriceChange: (price, tier) => console.log(`Selected ${tier}: $${price}`),
    defaultTier: 'recommended',
  },
};

export const WithSavingsContext: StoryObj<typeof PriceTierSelector> = {
  args: {
    basePrice: 450,
    savingsContext: {
      originalPrice: 500,
      guestSaved: 50,
      sellerEarned: 450,
    },
    onPriceChange: (price, tier) => console.log(`Selected ${tier}: $${price}`),
  },
};

export const WithCustomOption: StoryObj<typeof PriceTierSelector> = {
  args: {
    basePrice: 450,
    showCustomOption: true,
    minPrice: 360,
    maxPrice: 585,
    onPriceChange: (price, tier) => console.log(`Selected ${tier}: $${price}`),
  },
};

// ============================================================================
// ANCHOR CARD STORIES
// ============================================================================

export const AnchorCardStories: Meta<typeof AnchorCard> = {
  title: 'Pattern 3/Components/AnchorCard',
  component: AnchorCard,
  parameters: {
    layout: 'centered',
  },
};

export const BuyoutAnchor: StoryObj<typeof AnchorCard> = {
  args: {
    option: {
      optionType: 'buyout',
      price: 2835,
      platformFee: 43,
      totalCost: 2878,
      savingsVsAnchor: 0,
      savingsPercentage: 0,
      rank: 1,
      isAnchor: true,
    },
    isSelected: false,
    onSelect: () => console.log('Buyout selected'),
  },
};

export const SelectedBuyout: StoryObj<typeof AnchorCard> = {
  args: {
    option: {
      optionType: 'buyout',
      price: 2835,
      platformFee: 43,
      totalCost: 2878,
      savingsVsAnchor: 0,
      savingsPercentage: 0,
      rank: 1,
      isAnchor: true,
    },
    isSelected: true,
    onSelect: () => console.log('Buyout selected'),
  },
};

// ============================================================================
// COMPARISON CARD STORIES
// ============================================================================

export const ComparisonCardStories: Meta<typeof ComparisonCard> = {
  title: 'Pattern 3/Components/ComparisonCard',
  component: ComparisonCard,
  parameters: {
    layout: 'centered',
  },
};

const mockAnchor = {
  anchorType: 'buyout' as const,
  anchorPrice: 2878,
  source: 'Exclusive buyout rate',
  confidence: 1.0,
};

export const CrashOption: StoryObj<typeof ComparisonCard> = {
  args: {
    option: {
      optionType: 'crash',
      price: 324,
      platformFee: 5,
      totalCost: 329,
      savingsVsAnchor: 2549,
      savingsPercentage: 88.6,
      rank: 2,
      isAnchor: false,
    },
    anchor: mockAnchor,
    isSelected: false,
    onSelect: () => console.log('Crash selected'),
    rank: 2,
  },
};

export const SwapOption: StoryObj<typeof ComparisonCard> = {
  args: {
    option: {
      optionType: 'swap',
      price: 0,
      platformFee: 5,
      totalCost: 5,
      savingsVsAnchor: 2873,
      savingsPercentage: 99.8,
      rank: 3,
      isAnchor: false,
    },
    anchor: mockAnchor,
    isSelected: true,
    onSelect: () => console.log('Swap selected'),
    rank: 3,
  },
};

// ============================================================================
// PRICE COMPARISON CHART STORIES
// ============================================================================

export const PriceComparisonChartStories: Meta<typeof PriceComparisonChart> = {
  title: 'Pattern 3/Components/PriceComparisonChart',
  component: PriceComparisonChart,
  parameters: {
    layout: 'padded',
  },
};

const mockOptions = [
  {
    optionType: 'buyout' as const,
    price: 2835,
    platformFee: 43,
    totalCost: 2878,
    savingsVsAnchor: 0,
    savingsPercentage: 0,
    rank: 1 as const,
    isAnchor: true,
  },
  {
    optionType: 'crash' as const,
    price: 324,
    platformFee: 5,
    totalCost: 329,
    savingsVsAnchor: 2549,
    savingsPercentage: 88.6,
    rank: 2 as const,
    isAnchor: false,
  },
  {
    optionType: 'swap' as const,
    price: 0,
    platformFee: 5,
    totalCost: 5,
    savingsVsAnchor: 2873,
    savingsPercentage: 99.8,
    rank: 3 as const,
    isAnchor: false,
  },
];

export const DefaultChart: StoryObj<typeof PriceComparisonChart> = {
  args: {
    options: mockOptions,
    anchor: mockAnchor,
  },
};

export const WithSelection: StoryObj<typeof PriceComparisonChart> = {
  args: {
    options: mockOptions,
    anchor: mockAnchor,
    selectedOption: 'crash',
  },
};

// ============================================================================
// PRICE ANCHORING STACK STORIES
// ============================================================================

export const PriceAnchoringStackStories: Meta<typeof PriceAnchoringStack> = {
  title: 'Pattern 3/Components/PriceAnchoringStack',
  component: PriceAnchoringStack,
  parameters: {
    layout: 'fullscreen',
  },
};

export const CompleteStack: StoryObj<typeof PriceAnchoringStack> = {
  args: {
    buyoutPrice: 2835,
    crashPrice: 324,
    swapPrice: 0,
    platformFees: {
      buyout: 43,
      crash: 5,
      swap: 5,
    },
    onOptionSelected: (option) => console.log('Option selected:', option),
  },
};

// ============================================================================
// DATE CHANGE REQUEST FORM STORIES
// ============================================================================

export const DateChangeRequestFormStories: Meta<typeof DateChangeRequestForm> = {
  title: 'Pattern 3/Integration/DateChangeRequestForm',
  component: DateChangeRequestForm,
  parameters: {
    layout: 'fullscreen',
  },
};

const mockBooking = {
  id: 'booking_123',
  price: 450,
  startDate: new Date('2026-10-15'),
  endDate: new Date('2026-10-20'),
  guestName: 'John Doe',
  propertyName: 'Cozy Downtown Apartment',
};

const mockUserProfile = {
  id: 'user_123',
  name: 'John Doe',
  email: 'john@example.com',
  budgetPreference: 'moderate' as const,
  offerHistory: {
    totalOffers: 5,
    acceptedOffers: 3,
    avgTierSelected: 'recommended' as const,
    hasAcceptedPremium: false,
  },
};

export const DefaultForm: StoryObj<typeof DateChangeRequestForm> = {
  args: {
    originalBooking: mockBooking,
    onSubmit: (data) => console.log('Form submitted:', data),
  },
};

export const WithUserProfile: StoryObj<typeof DateChangeRequestForm> = {
  args: {
    originalBooking: mockBooking,
    userProfile: mockUserProfile,
    onSubmit: (data) => console.log('Form submitted:', data),
    onCancel: () => console.log('Form cancelled'),
  },
};

// ============================================================================
// DATE CHANGE REQUEST MANAGER STORIES
// ============================================================================

export const DateChangeRequestManagerStories: Meta<typeof DateChangeRequestManager> = {
  title: 'Pattern 3/Integration/DateChangeRequestManager',
  component: DateChangeRequestManager,
  parameters: {
    layout: 'fullscreen',
  },
};

export const BuyerView: StoryObj<typeof DateChangeRequestManager> = {
  args: {
    bookingId: 'booking_123',
    userType: 'buyer',
    userProfile: mockUserProfile,
    onRequestSubmitted: (data) => console.log('Request submitted:', data),
  },
};

// ============================================================================
// COMPLETE PATTERN DEMO
// ============================================================================

export const CompletePatternDemo = () => {
  const [selectedOption, setSelectedOption] = React.useState<any>(null);

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '40px', textAlign: 'center' }}>
        Pattern 3: Price Anchoring Complete Demo
      </h1>

      <PriceAnchoringStack
        buyoutPrice={2835}
        crashPrice={324}
        swapPrice={0}
        platformFees={{
          buyout: 43,
          crash: 5,
          swap: 5,
        }}
        onOptionSelected={setSelectedOption}
      />

      {selectedOption && (
        <div
          style={{
            marginTop: '40px',
            padding: '20px',
            background: '#F9FAFB',
            borderRadius: '12px',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
            Selected Option Details:
          </h3>
          <pre style={{ fontSize: '12px', overflowX: 'auto' }}>
            {JSON.stringify(selectedOption, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

CompletePatternDemo.parameters = {
  layout: 'fullscreen',
};
