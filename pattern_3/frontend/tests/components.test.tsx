/**
 * PATTERN 3: PRICE ANCHORING - COMPONENT TESTS
 * React component unit tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { SavingsBadge } from '../components/SavingsBadge';
import { PriceDisplay } from '../components/PriceDisplay';
import { PriceTierCard } from '../components/PriceTierCard';
import { PriceTierSelector } from '../components/PriceTierSelector';
import { PRICE_TIERS } from '../utils';

describe('SavingsBadge Component', () => {
  test('renders with correct savings amount', () => {
    render(<SavingsBadge savingsAmount={2511} savingsPercentage={88.6} />);
    expect(screen.getByText(/Save \$2511/)).toBeInTheDocument();
    expect(screen.getByText(/89% off/)).toBeInTheDocument();
  });

  test('does not render when savings is zero', () => {
    const { container } = render(<SavingsBadge savingsAmount={0} savingsPercentage={0} />);
    expect(container.firstChild).toBeNull();
  });

  test('applies correct size class', () => {
    const { container } = render(
      <SavingsBadge savingsAmount={100} savingsPercentage={20} size="large" />
    );
    expect(container.querySelector('.savings-badge--large')).toBeInTheDocument();
  });

  test('applies huge savings animation for >80% savings', () => {
    const { container } = render(
      <SavingsBadge savingsAmount={2511} savingsPercentage={90} />
    );
    expect(container.querySelector('.savings-badge--huge')).toBeInTheDocument();
  });
});

describe('PriceDisplay Component', () => {
  test('renders price correctly', () => {
    render(<PriceDisplay price={324} />);
    expect(screen.getByText('$324.00')).toBeInTheDocument();
  });

  test('renders label when provided', () => {
    render(<PriceDisplay price={324} label="Your Offer" />);
    expect(screen.getByText('Your Offer')).toBeInTheDocument();
  });

  test('shows original price when anchor provided', () => {
    render(<PriceDisplay price={324} anchorPrice={2835} showOriginalPrice />);
    expect(screen.getByText('$2835.00')).toBeInTheDocument();
  });

  test('shows savings badge when savings exist', () => {
    render(<PriceDisplay price={324} anchorPrice={2835} showSavings />);
    expect(screen.getByText(/Save \$/)).toBeInTheDocument();
  });

  test('applies correct size class', () => {
    const { container } = render(<PriceDisplay price={324} size="lg" />);
    expect(container.querySelector('.text-4xl')).toBeInTheDocument();
  });
});

describe('PriceTierCard Component', () => {
  const mockTier = {
    ...PRICE_TIERS.recommended,
    icon: '⭐',
  };

  const mockSavings = {
    amount: 100,
    percentage: 20,
    formattedAmount: '$100.00',
    formattedPercentage: '20%',
    tier: 'good' as const,
  };

  test('renders tier information', () => {
    render(
      <PriceTierCard
        tier={mockTier}
        price={450}
        basePrice={450}
        isSelected={false}
        onSelect={() => {}}
      />
    );

    expect(screen.getByText('Recommended')).toBeInTheDocument();
    expect(screen.getByText('$450.00')).toBeInTheDocument();
  });

  test('shows badge when tier has one', () => {
    render(
      <PriceTierCard
        tier={mockTier}
        price={450}
        basePrice={450}
        isSelected={false}
        onSelect={() => {}}
      />
    );

    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  test('shows savings when provided', () => {
    render(
      <PriceTierCard
        tier={mockTier}
        price={450}
        basePrice={450}
        savings={mockSavings}
        isSelected={false}
        onSelect={() => {}}
      />
    );

    expect(screen.getByText(/Save \$100/)).toBeInTheDocument();
  });

  test('calls onSelect when clicked', () => {
    const handleSelect = jest.fn();

    render(
      <PriceTierCard
        tier={mockTier}
        price={450}
        basePrice={450}
        isSelected={false}
        onSelect={handleSelect}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleSelect).toHaveBeenCalledTimes(1);
  });

  test('shows selected indicator when selected', () => {
    const { container } = render(
      <PriceTierCard
        tier={mockTier}
        price={450}
        basePrice={450}
        isSelected={true}
        onSelect={() => {}}
      />
    );

    expect(container.querySelector('.price-tier-card__selected')).toBeInTheDocument();
  });

  test('is disabled when disabled prop is true', () => {
    const handleSelect = jest.fn();

    render(
      <PriceTierCard
        tier={mockTier}
        price={450}
        basePrice={450}
        isSelected={false}
        onSelect={handleSelect}
        disabled
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(button);
    expect(handleSelect).not.toHaveBeenCalled();
  });

  test('shows acceptance rate and response time', () => {
    render(
      <PriceTierCard
        tier={mockTier}
        price={450}
        basePrice={450}
        isSelected={false}
        onSelect={() => {}}
      />
    );

    expect(screen.getByText(/73%/)).toBeInTheDocument();
    expect(screen.getByText(/12h/)).toBeInTheDocument();
  });
});

describe('PriceTierSelector Component', () => {
  test('renders all tier cards', () => {
    render(
      <PriceTierSelector
        basePrice={450}
        onPriceChange={() => {}}
      />
    );

    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Recommended')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  test('shows custom price option when enabled', () => {
    render(
      <PriceTierSelector
        basePrice={450}
        onPriceChange={() => {}}
        showCustomOption
      />
    );

    expect(screen.getByText('Or enter custom amount')).toBeInTheDocument();
  });

  test('calls onPriceChange when tier is selected', async () => {
    const handlePriceChange = jest.fn();

    render(
      <PriceTierSelector
        basePrice={450}
        onPriceChange={handlePriceChange}
      />
    );

    const budgetCard = screen.getAllByRole('button')[0];
    fireEvent.click(budgetCard);

    await waitFor(() => {
      expect(handlePriceChange).toHaveBeenCalledWith(405, 'budget');
    });
  });

  test('displays base price in header', () => {
    render(
      <PriceTierSelector
        basePrice={450}
        onPriceChange={() => {}}
      />
    );

    expect(screen.getByText(/\$450\.00/)).toBeInTheDocument();
  });

  test('shows savings context when provided', () => {
    render(
      <PriceTierSelector
        basePrice={450}
        onPriceChange={() => {}}
        savingsContext={{ originalPrice: 500 }}
      />
    );

    // Savings badges should be visible
    const savingsBadges = screen.getAllByText(/Save/);
    expect(savingsBadges.length).toBeGreaterThan(0);
  });

  test('custom price input validates min/max', () => {
    const { container } = render(
      <PriceTierSelector
        basePrice={450}
        onPriceChange={() => {}}
        showCustomOption
        minPrice={360}
        maxPrice={585}
      />
    );

    const details = container.querySelector('details');
    if (details) {
      fireEvent.click(details);

      const input = container.querySelector('input[type="number"]');
      expect(input).toHaveAttribute('min', '360');
      expect(input).toHaveAttribute('max', '585');
    }
  });
});

describe('Integration Tests', () => {
  test('complete price selection flow', async () => {
    const handlePriceChange = jest.fn();

    render(
      <PriceTierSelector
        basePrice={450}
        onPriceChange={handlePriceChange}
        savingsContext={{ originalPrice: 500 }}
      />
    );

    // Select premium tier
    const premiumCard = screen.getByText('Premium').closest('[role="button"]');
    if (premiumCard) {
      fireEvent.click(premiumCard);
    }

    await waitFor(() => {
      expect(handlePriceChange).toHaveBeenCalledWith(517.5, 'premium');
    });
  });
});
