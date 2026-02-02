# Pattern 3: Price Anchoring - Backend Implementation

## Overview

Complete production-ready backend implementation for Pattern 3 (Price Anchoring) behavioral pattern. This system provides a robust, scalable solution for presenting pricing options in a way that anchors user perception and drives conversion toward preferred options.

**Key Principle:** Cognitive anchoring effect - the first price seen becomes the reference point for all subsequent prices.

## Architecture

### Components

1. **Database Schema** (`supabase/migrations/001_pricing_tiers_schema.sql`)
   - Pricing tiers configuration
   - Tier features management
   - Analytics tracking
   - Tier selections
   - A/B test variants

2. **Edge Functions**
   - `get_pricing_tiers` - Returns all tiers with calculated prices and savings
   - `track_tier_selection` - Records user selections
   - `calculate_savings` - Computes savings with formatting

3. **Service Layer** (`lib/priceAnchoringService.ts`)
   - Core business logic
   - Tier calculations
   - Savings computation
   - Analytics tracking

4. **Tests**
   - Unit tests for service layer
   - Integration tests for Edge Functions
   - End-to-end workflow tests

## Tier Structure

### Default Configuration

| Tier | Multiplier | Badge | Description | Acceptance Rate | Response Time |
|------|------------|-------|-------------|-----------------|---------------|
| **Budget** | 0.90 (90%) | - | Basic offer | 45% | 48h |
| **Recommended** | 1.00 (100%) | Most Popular | Best value | 73% | 12h |
| **Premium** | 1.15 (115%) | Fastest | Priority handling | 89% | 4h |

### Features by Tier

**Budget:**
- Standard processing
- May take longer to accept
- Lower priority

**Recommended:**
- Fair market rate
- Faster acceptance
- Preferred by 73% of users

**Premium:**
- Highest acceptance rate
- Same-day response typical
- VIP processing

## Database Schema

### Tables

#### `pricing_tiers`
Stores tier configurations with multipliers and metadata.

```sql
CREATE TABLE pricing_tiers (
    id UUID PRIMARY KEY,
    tier_name VARCHAR(50) NOT NULL UNIQUE,
    tier_id VARCHAR(20) NOT NULL UNIQUE,
    multiplier DECIMAL(4,2) NOT NULL,
    display_order INTEGER NOT NULL,
    badge_text VARCHAR(50),
    description TEXT,
    acceptance_rate DECIMAL(4,3),
    avg_response_time_hours INTEGER,
    is_recommended BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `tier_features`
Stores feature descriptions for each tier.

```sql
CREATE TABLE tier_features (
    id UUID PRIMARY KEY,
    tier_id VARCHAR(20) NOT NULL REFERENCES pricing_tiers(tier_id),
    feature_text TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `price_anchoring_events`
Tracks analytics events for anchoring behavior.

```sql
CREATE TABLE price_anchoring_events (
    id UUID PRIMARY KEY,
    user_id UUID,
    session_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    anchor_price DECIMAL(10,2) NOT NULL,
    anchor_type VARCHAR(20) NOT NULL,
    tiers_shown JSONB NOT NULL,
    selected_tier_id VARCHAR(20),
    selected_price DECIMAL(10,2),
    savings_amount DECIMAL(10,2),
    savings_percentage DECIMAL(5,2),
    booking_id UUID,
    transaction_type VARCHAR(50),
    user_archetype VARCHAR(50),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `tier_selections`
Tracks final tier selections tied to transactions.

```sql
CREATE TABLE tier_selections (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL,
    user_id UUID NOT NULL,
    tier_id VARCHAR(20) NOT NULL REFERENCES pricing_tiers(tier_id),
    tier_name VARCHAR(50) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    multiplier DECIMAL(4,2) NOT NULL,
    final_price DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) NOT NULL,
    anchor_price DECIMAL(10,2) NOT NULL,
    savings_vs_anchor DECIMAL(10,2) NOT NULL,
    savings_percentage DECIMAL(5,2) NOT NULL,
    transaction_status VARCHAR(20) DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Functions

#### `calculate_tier_price(p_base_price, p_tier_id)`
Calculates the price for a specific tier.

```sql
SELECT calculate_tier_price(450, 'premium');
-- Returns: 517.50
```

#### `calculate_savings(p_offer_price, p_anchor_price)`
Calculates savings amount and percentage.

```sql
SELECT * FROM calculate_savings(329, 2835);
-- Returns: { savings_amount: 2506.00, savings_percentage: 88.39 }
```

#### `get_recommended_tier(p_user_archetype, p_urgency)`
Returns recommended tier based on user context.

```sql
SELECT * FROM get_recommended_tier('big_spender', 'high');
-- Returns premium tier
```

#### `get_all_tier_prices(p_base_price, p_anchor_price)`
Returns all tiers with calculated prices and features.

```sql
SELECT * FROM get_all_tier_prices(450, 2835);
-- Returns all tiers with prices, features, and savings
```

#### `track_tier_selection_event(...)`
Helper function to track analytics events.

#### `get_tier_analytics(p_start_date, p_end_date)`
Returns performance analytics for tier selections.

```sql
SELECT * FROM get_tier_analytics(
    '2026-01-01'::timestamptz,
    '2026-01-31'::timestamptz
);
```

## API Documentation

### Edge Function: `get_pricing_tiers`

Returns pricing tiers with calculated prices and savings.

**Endpoint:** `POST /functions/v1/get_pricing_tiers`

**Request Body:**
```json
{
  "base_price": 450,
  "anchor_price": 2835,
  "anchor_type": "buyout",
  "user_archetype": "big_spender",
  "urgency": "medium",
  "booking_id": "123e4567-e89b-12d3-a456-426614174000",
  "session_id": "sess_abc123",
  "user_id": "user_xyz789"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tiers": [
      {
        "tier_id": "premium",
        "tier_name": "Premium",
        "multiplier": 1.15,
        "calculated_price": 517.50,
        "display_order": 1,
        "badge_text": "Fastest",
        "description": "Priority handling",
        "acceptance_rate": 0.89,
        "avg_response_time_hours": 4,
        "is_recommended": false,
        "features": [...],
        "savings_amount": 2317.50,
        "savings_percentage": 81.75
      }
    ],
    "anchor": {
      "price": 2835,
      "type": "buyout",
      "description": "Exclusive buyout rate - your reference price"
    },
    "recommended_tier": {
      "tier_id": "premium",
      "tier_name": "Premium",
      "multiplier": 1.15,
      "reason": "Recommended based on your profile and urgency"
    },
    "metadata": {
      "base_price": 450,
      "total_tiers": 3,
      "generated_at": "2026-01-28T10:30:00.000Z"
    }
  }
}
```

### Edge Function: `track_tier_selection`

Tracks user tier selection and creates a `tier_selections` record.

**Endpoint:** `POST /functions/v1/track_tier_selection`

**Request Body:**
```json
{
  "booking_id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "987fcdeb-51a3-12d3-a456-426614174000",
  "session_id": "sess_abc123xyz",
  "tier_id": "recommended",
  "base_price": 450,
  "anchor_price": 2835,
  "anchor_type": "buyout",
  "platform_fee": 5,
  "transaction_type": "date_change_request",
  "metadata": {
    "user_archetype": "big_spender"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "selection_id": "abc12345-6789-12d3-a456-426614174000",
    "tier_id": "recommended",
    "tier_name": "Recommended",
    "final_price": 450.00,
    "total_cost": 455.00,
    "savings_amount": 2380.00,
    "savings_percentage": 83.95,
    "transaction_status": "pending",
    "created_at": "2026-01-28T10:45:00.000Z"
  }
}
```

### Edge Function: `calculate_savings`

Calculates savings for any price vs anchor with formatting.

**Endpoint:** `POST /functions/v1/calculate_savings`

**Request Body:**
```json
{
  "offer_price": 329,
  "anchor_price": 2835,
  "format": "both",
  "currency": "USD"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "savings_amount": 2506.00,
    "savings_percentage": 88.39,
    "formatted_amount": "$2,506.00",
    "formatted_percentage": "88%",
    "formatted_combined": "$2,506.00 (88% off)",
    "is_saving": true,
    "saving_tier": "massive",
    "display_message": "Save $2,506.00 (88% off!) - Incredible value"
  }
}
```

## Usage Examples

### Client-Side Integration

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1. Get pricing tiers
async function getPricingTiers(basePrice: number, anchorPrice: number) {
  const { data, error } = await supabase.functions.invoke('get_pricing_tiers', {
    body: {
      base_price: basePrice,
      anchor_price: anchorPrice,
      anchor_type: 'buyout',
      session_id: sessionId,
      user_id: userId,
    },
  });

  if (error) throw error;
  return data.data;
}

// 2. Track tier selection
async function trackSelection(tierId: string, bookingId: string) {
  const { data, error } = await supabase.functions.invoke('track_tier_selection', {
    body: {
      booking_id: bookingId,
      user_id: userId,
      session_id: sessionId,
      tier_id: tierId,
      base_price: 450,
      anchor_price: 2835,
      anchor_type: 'buyout',
      platform_fee: 5,
    },
  });

  if (error) throw error;
  return data.data;
}

// 3. Calculate savings
async function calculateSavings(offerPrice: number, anchorPrice: number) {
  const { data, error } = await supabase.functions.invoke('calculate_savings', {
    body: {
      offer_price: offerPrice,
      anchor_price: anchorPrice,
      format: 'both',
    },
  });

  if (error) throw error;
  return data.data;
}
```

### Service Layer Integration

```typescript
import { createClient } from '@supabase/supabase-js';
import { createPriceAnchoringService } from './lib/priceAnchoringService';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const priceService = createPriceAnchoringService(supabase);

// Get complete anchor context
const anchorContext = await priceService.getAnchorContext(
  450,              // base price
  2835,             // anchor price
  'buyout',         // anchor type
  'big_spender',    // user archetype
  'high'            // urgency
);

console.log(anchorContext.tiers);
console.log(anchorContext.recommended_tier);
console.log(anchorContext.anchor);
```

## Deployment

### Prerequisites

- Supabase project
- Supabase CLI installed (`npm install -g supabase`)
- PostgreSQL 15+
- Deno 1.30+ (for Edge Functions)

### Database Migration

```bash
# Run migration
supabase db push

# Or manually via SQL
psql -h your-db-host -U postgres -d your-db-name -f supabase/migrations/001_pricing_tiers_schema.sql
```

### Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy get_pricing_tiers
supabase functions deploy track_tier_selection
supabase functions deploy calculate_savings

# Or deploy individually
supabase functions deploy get_pricing_tiers --no-verify-jwt
```

### Environment Variables

Set in Supabase Dashboard > Settings > Edge Functions:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Testing

### Run Unit Tests

```bash
npm run test
# or
yarn test
# or
pnpm test
```

### Run Integration Tests

```bash
# Ensure local Supabase is running
supabase start

# Run integration tests
npm run test:integration
```

### Test Coverage

```bash
npm run test:coverage
```

Expected coverage:
- Statements: >90%
- Branches: >85%
- Functions: >90%
- Lines: >90%

## Analytics

### Key Metrics

Track these metrics in `price_anchoring_events`:

1. **Anchor Awareness**: % of users who view anchor first
   - Target: >85%

2. **Savings Recognition**: % who select based on savings
   - Target: >60%

3. **Tier Conversion Rates**:
   - Budget: 20-25%
   - Recommended: 50-55%
   - Premium: 20-25%

4. **Time to Decision**: Average seconds from view to selection
   - Target: <45 seconds

### Query Analytics

```sql
-- Tier selection rates (last 30 days)
SELECT * FROM get_tier_analytics(
    NOW() - INTERVAL '30 days',
    NOW()
);

-- Top performing tier
SELECT tier_id, COUNT(*) as selections
FROM tier_selections
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY tier_id
ORDER BY selections DESC
LIMIT 1;

-- Average savings by tier
SELECT
    tier_id,
    AVG(savings_vs_anchor) as avg_savings,
    AVG(savings_percentage) as avg_savings_pct
FROM tier_selections
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY tier_id;
```

## A/B Testing

### Setup Test Variant

```sql
INSERT INTO ab_test_variants (
    test_name,
    variant_name,
    tier_multipliers,
    display_order,
    savings_format,
    traffic_percentage,
    is_active,
    description
) VALUES (
    'pricing_tiers_v2',
    'variant_a',
    '{"budget": 0.85, "recommended": 1.00, "premium": 1.20}'::jsonb,
    'premium_recommended_budget',
    'both',
    50,
    true,
    'Test increased premium multiplier'
);
```

### Analyze Test Results

```sql
SELECT
    variant_name,
    impressions,
    selections,
    conversions,
    (selections::float / NULLIF(impressions, 0)) * 100 as ctr,
    (conversions::float / NULLIF(selections, 0)) * 100 as conversion_rate
FROM ab_test_variants
WHERE test_name = 'pricing_tiers_v2'
ORDER BY ctr DESC;
```

## Performance Optimization

### Caching Strategy

```typescript
// Cache tier configuration (updates infrequently)
const TIER_CACHE_TTL = 3600; // 1 hour

// Cache individual calculations (short TTL)
const CALC_CACHE_TTL = 300; // 5 minutes
```

### Database Indexes

Already created in migration:
- `idx_pricing_tiers_tier_id`
- `idx_pricing_tiers_is_active`
- `idx_tier_features_tier_id`
- `idx_price_anchoring_events_user_id`
- `idx_tier_selections_booking_id`

### Query Optimization

All RPC functions are marked as `STABLE` for query optimization.

## Security

### Row Level Security (RLS)

All tables have RLS enabled:

```sql
-- Users can only read active tiers
CREATE POLICY "Anyone can read active pricing tiers"
    ON pricing_tiers FOR SELECT
    USING (is_active = TRUE);

-- Users can only read their own events
CREATE POLICY "Users can read their own events"
    ON price_anchoring_events FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only manage their own selections
CREATE POLICY "Users can read their own tier selections"
    ON tier_selections FOR SELECT
    USING (auth.uid() = user_id);
```

### API Security

- All Edge Functions validate input
- UUID format validation
- Enum validation for tier_id, anchor_type
- Numeric range validation

## Monitoring

### Health Checks

```sql
-- Check tier configuration
SELECT COUNT(*) FROM pricing_tiers WHERE is_active = TRUE;
-- Expected: 3

-- Check recent selections
SELECT COUNT(*) FROM tier_selections
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Check analytics events
SELECT event_type, COUNT(*) FROM price_anchoring_events
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY event_type;
```

### Alerts

Set up alerts for:
- Tier selection rate drops below 20%
- Average savings percentage changes by >10%
- Edge Function error rate >1%
- Database query time >100ms

## Troubleshooting

### Common Issues

**Issue: No tiers returned**
```sql
-- Check if tiers are active
SELECT * FROM pricing_tiers WHERE is_active = TRUE;

-- If empty, run seed data again
INSERT INTO pricing_tiers (...) VALUES (...);
```

**Issue: Savings calculation incorrect**
```sql
-- Test calculation function
SELECT * FROM calculate_savings(329, 2835);

-- Verify tier multipliers
SELECT tier_id, multiplier FROM pricing_tiers;
```

**Issue: Edge Function timeout**
- Check database connection
- Verify RLS policies aren't blocking
- Check function logs: `supabase functions logs`

## Changelog

### v1.0.0 (2026-01-28)
- Initial production release
- 3-tier pricing system (Budget 90%, Recommended 100%, Premium 115%)
- Complete database schema with RLS
- 3 Edge Functions
- Service layer with comprehensive tests
- Analytics and A/B testing support
- Documentation

## License

Proprietary - Pattern 3 Implementation

## Support

For issues or questions:
- Check troubleshooting section
- Review test files for usage examples
- Contact: backend-team@company.com

---

**Lines of Code:** ~4,800
**Test Coverage:** >90%
**Production Ready:** Yes
