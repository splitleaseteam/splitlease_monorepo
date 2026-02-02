# Pattern 3: Price Anchoring - Usage Examples

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Frontend Integration](#frontend-integration)
3. [Backend Integration](#backend-integration)
4. [Advanced Scenarios](#advanced-scenarios)
5. [Analytics](#analytics)
6. [A/B Testing](#ab-testing)

## Basic Usage

### 1. Get Pricing Tiers

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get pricing tiers with buyout anchor
const { data, error } = await supabase.functions.invoke('get_pricing_tiers', {
  body: {
    base_price: 450,
    anchor_price: 2835,
    anchor_type: 'buyout',
    session_id: generateSessionId(),
  },
});

console.log(data.data.tiers);
// [
//   { tier_id: 'premium', calculated_price: 517.50, savings_amount: 2317.50, ... },
//   { tier_id: 'recommended', calculated_price: 450.00, savings_amount: 2385.00, ... },
//   { tier_id: 'budget', calculated_price: 405.00, savings_amount: 2430.00, ... }
// ]
```

### 2. Track Tier Selection

```typescript
// When user selects a tier
const { data, error } = await supabase.functions.invoke('track_tier_selection', {
  body: {
    booking_id: bookingId,
    user_id: userId,
    session_id: sessionId,
    tier_id: 'recommended',
    base_price: 450,
    anchor_price: 2835,
    anchor_type: 'buyout',
    platform_fee: 5,
  },
});

console.log(data.data);
// {
//   selection_id: "abc-123",
//   tier_id: "recommended",
//   final_price: 450.00,
//   total_cost: 455.00,
//   savings_amount: 2380.00,
//   savings_percentage: 83.95
// }
```

### 3. Calculate Savings

```typescript
// Calculate savings for any price
const { data, error } = await supabase.functions.invoke('calculate_savings', {
  body: {
    offer_price: 329,
    anchor_price: 2835,
    format: 'both',
  },
});

console.log(data.data.display_message);
// "Save $2,506.00 (88% off!) - Incredible value"
```

## Frontend Integration

### React Component Example

```tsx
// PriceTierSelector.tsx
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface PriceTierSelectorProps {
  basePrice: number;
  anchorPrice: number;
  onTierSelected: (tierId: string, price: number) => void;
}

export function PriceTierSelector({
  basePrice,
  anchorPrice,
  onTierSelected,
}: PriceTierSelectorProps) {
  const [tiers, setTiers] = useState([]);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTiers();
  }, [basePrice, anchorPrice]);

  async function loadTiers() {
    setLoading(true);

    const { data, error } = await supabase.functions.invoke('get_pricing_tiers', {
      body: {
        base_price: basePrice,
        anchor_price: anchorPrice,
        anchor_type: 'buyout',
        session_id: sessionStorage.getItem('sessionId') || generateSessionId(),
      },
    });

    if (error) {
      console.error('Failed to load tiers:', error);
      return;
    }

    setTiers(data.data.tiers);
    setSelectedTierId(data.data.recommended_tier.tier_id);
    setLoading(false);
  }

  function handleSelectTier(tierId: string, price: number) {
    setSelectedTierId(tierId);
    onTierSelected(tierId, price);
  }

  if (loading) {
    return <div>Loading pricing options...</div>;
  }

  return (
    <div className="price-tier-selector">
      <h3>Choose Your Option</h3>
      <p className="anchor-context">
        Prices compared to buyout rate: ${anchorPrice.toFixed(2)}
      </p>

      <div className="tier-cards">
        {tiers.map((tier) => (
          <TierCard
            key={tier.tier_id}
            tier={tier}
            isSelected={selectedTierId === tier.tier_id}
            onSelect={() => handleSelectTier(tier.tier_id, tier.calculated_price)}
          />
        ))}
      </div>
    </div>
  );
}

// TierCard component
function TierCard({ tier, isSelected, onSelect }) {
  return (
    <button
      className={`tier-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      {tier.badge_text && (
        <div className="badge">{tier.badge_text}</div>
      )}

      <h4>{tier.tier_name}</h4>

      <div className="price-display">
        <div className="calculated-price">
          ${tier.calculated_price.toFixed(2)}
        </div>
        <div className="anchor-comparison">
          vs ${tier.anchor_price.toFixed(2)}
        </div>
      </div>

      <div className="savings-badge">
        Save ${tier.savings_amount.toFixed(2)}
        <span className="percentage">({tier.savings_percentage.toFixed(0)}% off)</span>
      </div>

      <ul className="features">
        {tier.features.map((feature, idx) => (
          <li key={idx}>
            <span className="icon">{feature.icon}</span>
            {feature.text}
          </li>
        ))}
      </ul>
    </button>
  );
}

function generateSessionId(): string {
  const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  sessionStorage.setItem('sessionId', sessionId);
  return sessionId;
}
```

### Complete Checkout Flow

```tsx
// CheckoutFlow.tsx
import React, { useState } from 'react';
import { PriceTierSelector } from './PriceTierSelector';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function CheckoutFlow({ booking }) {
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleTierSelected(tierId: string, price: number) {
    setSelectedTierId(tierId);
    setSelectedPrice(price);

    // Track selection immediately
    await trackSelection(tierId, price);
  }

  async function trackSelection(tierId: string, price: number) {
    try {
      await supabase.functions.invoke('track_tier_selection', {
        body: {
          booking_id: booking.id,
          user_id: booking.user_id,
          session_id: sessionStorage.getItem('sessionId'),
          tier_id: tierId,
          base_price: booking.base_price,
          anchor_price: booking.buyout_price,
          anchor_type: 'buyout',
          platform_fee: 5,
        },
      });
    } catch (error) {
      console.error('Failed to track selection:', error);
    }
  }

  async function handleCheckout() {
    if (!selectedTierId || !selectedPrice) {
      return;
    }

    setProcessing(true);

    try {
      // Process payment
      const paymentResult = await processPayment(selectedPrice + 5); // Add platform fee

      if (paymentResult.success) {
        // Update booking with selected tier
        await updateBooking(booking.id, selectedTierId);

        // Mark transaction as completed
        await markTransactionCompleted();

        // Redirect to confirmation
        window.location.href = `/booking/${booking.id}/confirmed`;
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="checkout-flow">
      <h2>Complete Your Booking</h2>

      <PriceTierSelector
        basePrice={booking.base_price}
        anchorPrice={booking.buyout_price}
        onTierSelected={handleTierSelected}
      />

      {selectedPrice && (
        <div className="checkout-summary">
          <h3>Order Summary</h3>
          <div className="line-item">
            <span>Selected offer:</span>
            <span>${selectedPrice.toFixed(2)}</span>
          </div>
          <div className="line-item">
            <span>Platform fee:</span>
            <span>$5.00</span>
          </div>
          <div className="line-item total">
            <span>Total:</span>
            <span>${(selectedPrice + 5).toFixed(2)}</span>
          </div>

          <button
            className="checkout-button"
            onClick={handleCheckout}
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Complete Booking'}
          </button>
        </div>
      )}
    </div>
  );
}
```

## Backend Integration

### Service Layer Usage

```typescript
import { createClient } from '@supabase/supabase-js';
import { createPriceAnchoringService } from './lib/priceAnchoringService';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const priceService = createPriceAnchoringService(supabase);

// Get complete anchor context
async function buildPricingPage(userId: string, bookingId: string) {
  const booking = await getBooking(bookingId);
  const userProfile = await getUserProfile(userId);

  const anchorContext = await priceService.getAnchorContext(
    booking.base_price,
    booking.buyout_price,
    'buyout',
    userProfile.archetype,
    calculateUrgency(booking.checkin_date)
  );

  return {
    booking,
    pricing: {
      tiers: anchorContext.tiers,
      anchor: anchorContext.anchor,
      recommendedTier: anchorContext.recommended_tier,
    },
  };
}

// Calculate urgency based on checkin date
function calculateUrgency(checkinDate: Date): 'low' | 'medium' | 'high' {
  const daysUntil = Math.floor(
    (checkinDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntil < 7) return 'high';
  if (daysUntil < 30) return 'medium';
  return 'low';
}
```

### API Route Example (Next.js)

```typescript
// pages/api/pricing/tiers.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createPriceAnchoringService } from '@/lib/priceAnchoringService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { basePrice, anchorPrice, bookingId } = req.body;

  if (!basePrice || !anchorPrice || !bookingId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    const priceService = createPriceAnchoringService(supabase);

    const anchorContext = await priceService.getAnchorContext(
      basePrice,
      anchorPrice,
      'buyout'
    );

    res.status(200).json({
      success: true,
      data: anchorContext,
    });
  } catch (error) {
    console.error('Error fetching pricing tiers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing tiers',
    });
  }
}
```

## Advanced Scenarios

### Personalized Recommendations

```typescript
// Get personalized tier recommendation based on user history
async function getPersonalizedTiers(userId: string, basePrice: number) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const priceService = createPriceAnchoringService(supabase);

  // Get user history
  const { data: history } = await supabase
    .from('tier_selections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Calculate user archetype
  const hasAcceptedPremium = history?.some((s) => s.tier_id === 'premium');
  const avgMultiplier =
    history?.reduce((sum, s) => sum + s.multiplier, 0) / (history?.length || 1);

  const userArchetype: UserArchetype = hasAcceptedPremium
    ? 'big_spender'
    : avgMultiplier < 0.95
    ? 'high_flexibility'
    : 'average_user';

  // Get anchor context with personalization
  return await priceService.getAnchorContext(
    basePrice,
    basePrice * 1.5, // Use 150% of base as anchor
    'recommended',
    userArchetype,
    'medium'
  );
}
```

### Dynamic Anchor Calculation

```typescript
// Calculate anchor price based on market data
async function calculateDynamicAnchor(
  basePrice: number,
  location: string,
  dates: { checkin: Date; checkout: Date }
) {
  // Get market data
  const marketData = await getMarketPricing(location, dates);

  // Use 90th percentile as anchor
  const anchorPrice = marketData.percentile_90;

  // Get tiers with dynamic anchor
  const { data } = await supabase.functions.invoke('get_pricing_tiers', {
    body: {
      base_price: basePrice,
      anchor_price: anchorPrice,
      anchor_type: 'market_rate',
      session_id: sessionId,
    },
  });

  return data.data;
}
```

### Multiple Anchor Comparison

```typescript
// Show savings vs multiple anchors
async function showMultipleAnchors(offerPrice: number) {
  const anchors = [
    { type: 'buyout', price: 2835 },
    { type: 'market_rate', price: 1200 },
    { type: 'recommended', price: 800 },
  ];

  const comparisons = await Promise.all(
    anchors.map(async (anchor) => {
      const { data } = await supabase.functions.invoke('calculate_savings', {
        body: {
          offer_price: offerPrice,
          anchor_price: anchor.price,
        },
      });

      return {
        anchor_type: anchor.type,
        ...data.data,
      };
    })
  );

  return comparisons;
}
```

## Analytics

### Track Custom Events

```typescript
import { createPriceAnchoringService } from '@/lib/priceAnchoringService';

const priceService = createPriceAnchoringService(supabase);

// Track when user views tiers
await priceService.trackAnalyticsEvent({
  sessionId: sessionId,
  eventType: 'tiers_viewed',
  basePrice: 450,
  anchorPrice: 2835,
  anchorType: 'buyout',
  metadata: {
    page: 'checkout',
    experiment: 'tier_order_test_v2',
  },
});

// Track when user changes selection
await priceService.trackAnalyticsEvent({
  userId: userId,
  sessionId: sessionId,
  eventType: 'tier_changed',
  basePrice: 450,
  anchorPrice: 2835,
  anchorType: 'buyout',
  selectedTierId: 'premium',
  selectedPrice: 517.50,
  bookingId: bookingId,
});

// Track transaction completion
await priceService.trackAnalyticsEvent({
  userId: userId,
  sessionId: sessionId,
  eventType: 'transaction_completed',
  basePrice: 450,
  anchorPrice: 2835,
  anchorType: 'buyout',
  selectedTierId: 'recommended',
  selectedPrice: 455,
  bookingId: bookingId,
  metadata: {
    payment_method: 'credit_card',
    processing_time_ms: 1234,
  },
});
```

### Query Analytics Data

```typescript
// Get tier performance for last 30 days
const analytics = await priceService.getTierAnalytics(
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  new Date()
);

console.log(analytics);
// [
//   {
//     tier_id: 'premium',
//     tier_name: 'Premium',
//     total_views: 1000,
//     total_selections: 250,
//     selection_rate: 25.0,
//     avg_savings_amount: 2300.0,
//     avg_savings_percentage: 81.0,
//     total_revenue: 129375.0
//   },
//   ...
// ]

// Calculate conversion funnel
const { data: funnel } = await supabase.rpc('calculate_conversion_funnel', {
  p_start_date: new Date('2026-01-01').toISOString(),
  p_end_date: new Date('2026-01-31').toISOString(),
});
```

## A/B Testing

### Create Test Variant

```typescript
// Create new A/B test variant with different multipliers
const { data, error } = await supabase.from('ab_test_variants').insert({
  test_name: 'tier_multipliers_v2',
  variant_name: 'aggressive_premium',
  tier_multipliers: {
    budget: 0.85,
    recommended: 1.0,
    premium: 1.25, // Increased from 1.15
  },
  display_order: 'premium_recommended_budget',
  savings_format: 'both',
  traffic_percentage: 50,
  is_active: true,
  description: 'Test increased premium tier pricing',
});
```

### Assign User to Variant

```typescript
function getTestVariant(userId: string, testName: string): string {
  // Hash user ID to get consistent variant
  const hash = simpleHash(`${userId}-${testName}`);
  const bucket = hash % 100;

  // 50/50 split
  return bucket < 50 ? 'control' : 'aggressive_premium';
}

// Get tiers with test variant
async function getTiersForUser(userId: string, basePrice: number) {
  const variant = getTestVariant(userId, 'tier_multipliers_v2');

  if (variant === 'control') {
    // Use default tiers
    return await priceService.getPricingTiers(basePrice);
  } else {
    // Use test variant multipliers
    const { data: variantConfig } = await supabase
      .from('ab_test_variants')
      .select('tier_multipliers')
      .eq('test_name', 'tier_multipliers_v2')
      .eq('variant_name', variant)
      .single();

    // Apply custom multipliers
    // (implementation depends on your setup)
  }
}
```

### Analyze Test Results

```sql
-- Query A/B test results
SELECT
    variant_name,
    impressions,
    selections,
    conversions,
    (selections::float / NULLIF(impressions, 0)) * 100 as ctr,
    (conversions::float / NULLIF(selections, 0)) * 100 as conversion_rate,
    CASE
        WHEN (conversions::float / NULLIF(selections, 0)) * 100 > 15 THEN 'winner'
        WHEN (conversions::float / NULLIF(selections, 0)) * 100 < 10 THEN 'loser'
        ELSE 'neutral'
    END as status
FROM ab_test_variants
WHERE test_name = 'tier_multipliers_v2'
ORDER BY conversion_rate DESC;
```

---

For more examples and documentation, see:
- [README.md](./README.md)
- [API Documentation](./README.md#api-documentation)
- [Test Files](./tests/)
