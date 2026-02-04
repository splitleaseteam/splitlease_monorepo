# Split Lease - Behavioral Economics Platform

> **Master Documentation for 5-Pattern Persuasion Architecture**
> Complete guide to implementation, deployment, and optimization

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [The 5 Patterns](#the-5-patterns)
4. [Quick Start Guide](#quick-start-guide)
5. [Pattern Integration](#pattern-integration)
6. [Deployment Guide](#deployment-guide)
7. [API Reference](#api-reference)
8. [Component Library](#component-library)
9. [Database Schema](#database-schema)
10. [Testing Strategy](#testing-strategy)
11. [Monitoring & Analytics](#monitoring--analytics)
12. [Troubleshooting](#troubleshooting)
13. [Performance Optimization](#performance-optimization)
14. [Security Considerations](#security-considerations)

---

## Executive Summary

### What This System Does

Split Lease implements **5 behavioral economics patterns** that together create a powerful persuasion architecture for date change requests in the roommate rental marketplace:

| Pattern | Impact | Mechanism |
|---------|--------|-----------|
| **Pattern 1: Personalized Defaults** | +204% revenue | Archetype-based price anchoring (Big Spender, High Flex, Average) |
| **Pattern 2: Urgency Countdown** | +230% revenue | Exponential pricing (2.0 steepness) based on time to check-in |
| **Pattern 3: Price Anchoring** | Drives conversion | Always show buyout first (highest price) to make crash/swap feel like wins |
| **Pattern 4: BS+BS Competition** | +25% on conflicts | When both roommates are Big Spenders, enable bidding with 25% loser compensation |
| **Pattern 5: Fee Transparency** | 76-79% success | 1.5% split fee (0.75% platform + 0.75% landlord) with full breakdown |

### Revenue Impact

Based on simulation data:
- **Combined revenue increase:** +458% compared to flat pricing
- **Success rate:** 76-79% (maintained despite high urgency pricing)
- **Big Spender transactions:** $2,835 average (vs $180 base price = 15.75x multiplier)

### Technology Stack

- **Frontend:** React 18 + Tailwind CSS (Islands Architecture)
- **Backend:** Supabase Edge Functions (Deno)
- **Database:** PostgreSQL with JSONB for flexible schemas
- **Real-time:** WebSocket for bidding notifications
- **Analytics:** Segment + Mixpanel integration
- **Payment:** Stripe integration (1.5% fee model)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Pattern 1   │  │   Pattern 2   │  │   Pattern 3   │          │
│  │ Personalized  │  │   Urgency     │  │    Price      │          │
│  │   Defaults    │  │  Countdown    │  │  Anchoring    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                    │
│  ┌──────▼──────────────────▼──────────────────▼────────┐        │
│  │         DateChangeRequestManager (Orchestrator)       │        │
│  └───────────────────────┬───────────────────────────────┘        │
└────────────────────────┼──────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API SERVICE LAYER                            │
│  ┌───────────────────────────────────────────────────────┐      │
│  │          DateChangeRequestService                      │      │
│  │  • getArchetypeSuggestion()                           │      │
│  │  • getUrgencyMultiplier()                             │      │
│  │  • getPricingTiers()                                  │      │
│  │  • validateBSBSEligibility()                          │      │
│  │  • createRequest()                                    │      │
│  └──────────────────────────┬────────────────────────────┘      │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE EDGE FUNCTIONS                        │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ date-change      │  │ calculate-       │                    │
│  │ -request         │  │ urgency          │                    │
│  │                  │  │                  │                    │
│  │ Actions:         │  │ Utilities:       │                    │
│  │ • create         │  │ • detectArch.    │                    │
│  │ • get_pricing    │  │ • calcUrgency    │                    │
│  │ • accept/decline │  │ • genTiers       │                    │
│  └────────┬─────────┘  └────────┬─────────┘                    │
└───────────┼────────────────────┼──────────────────────────────────┘
            │                    │
            ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER (PostgreSQL)                   │
│  ┌─────────────────────┐  ┌──────────────────────┐             │
│  │ date_change_requests │  │   users              │             │
│  │ • archetype          │  │ • archetype          │             │
│  │ • urgency_multiplier │  │ • flexibility_score  │             │
│  │ • urgency_band       │  │ • spending_score     │             │
│  │ • selected_tier      │  │ • archetype_metadata │             │
│  │ • tier_price         │  │                      │             │
│  │ • pricing_snapshot   │  │                      │             │
│  │ • urgency_snapshot   │  │                      │             │
│  │ • fee_breakdown      │  │                      │             │
│  └─────────────────────┘  └──────────────────────┘             │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow: Complete Request Lifecycle

```
1. USER INITIATES REQUEST
   └─> DateChangeRequestManager loads
       ├─> Detects archetype (Pattern 1)
       ├─> Calculates urgency (Pattern 2)
       ├─> Generates pricing tiers (Pattern 3)
       └─> Checks BS+BS eligibility (Pattern 4)

2. USER VIEWS OPTIONS
   └─> PriceTierSelector renders
       ├─> Buyout shown first (anchor)
       ├─> Crash shown second (savings badge)
       ├─> Swap shown third (best value badge)
       └─> Fee transparency (Pattern 5) displayed

3. USER SELECTS OPTION
   └─> Edge Function: date-change-request/create
       ├─> Validates request
       ├─> Calculates final pricing
       ├─> Stores pricing snapshot
       ├─> Stores urgency snapshot
       └─> Stores fee breakdown

4. NOTIFICATION SENT
   └─> If BS+BS detected
       ├─> WebSocket notification to both users
       └─> Competitive bidding UI enabled

5. ACCEPTANCE/COUNTER-OFFER
   └─> Seller reviews with competitive indicators
       ├─> Shows "2 others interested" (Pattern 4)
       ├─> Shows urgency countdown
       ├─> Counter-offer option available
       └─> Fee breakdown shown (Pattern 5)

6. TRANSACTION COMPLETE
   └─> Analytics tracked
       ├─> Archetype effectiveness
       ├─> Urgency conversion
       ├─> Tier selection
       ├─> Fee acceptance
       └─> Overall revenue impact
```

---

## The 5 Patterns

### Pattern 1: Personalized Defaults

**Business Goal:** Optimize conversion by defaulting to user-specific optimal price

**Technical Implementation:**

```typescript
// Archetype Detection Algorithm
interface UserArchetype {
  archetypeType: 'big_spender' | 'high_flexibility' | 'average_user';
  confidence: number;
  signals: ArchetypeSignals;
}

// Detection Rules (Heuristic-based)
function detectArchetype(userId, transactionHistory): UserArchetype {
  // Rule 1: Big Spender = 3+ transactions at 110%+ of base price
  // Rule 2: High Flex = 5+ date change requests
  // Rule 3: Average = default

  // Returns archetype with confidence score
}

// Default Price Calculation
const ARCHETYPE_DEFAULTS = {
  BIG_SPENDER: 120,  // 120% of base
  HIGH_FLEX: 90,     // 90% of base
  AVERAGE: 100,      // 100% of base
};
```

**Database Schema:**

```sql
ALTER TABLE users ADD COLUMN archetype VARCHAR(50);
ALTER TABLE users ADD COLUMN flexibility_score INTEGER;
ALTER TABLE users ADD COLUMN spending_score INTEGER;
ALTER TABLE users ADD COLUMN archetype_metadata JSONB;
```

**Key Files:**
- `src/logic/rules/users/detectUserArchetype.js`
- `src/logic/calculators/pricing/calculateArchetypeDefault.js`

---

### Pattern 2: Urgency Countdown

**Business Goal:** Drive urgency through transparent time-based pricing

**Technical Implementation:**

```typescript
// Urgency Calculation (Linear Model)
interface UrgencyData {
  multiplier: number;    // 1.0 - 3.0x
  band: 'green' | 'yellow' | 'orange' | 'red';
  daysUntil: number;
  requiresAcknowledgment: boolean;
}

// Thresholds
const URGENCY_THRESHOLDS = {
  CRITICAL: { days: 3, multiplier: 1.5 },   // Red
  HIGH: { days: 7, multiplier: 1.25 },       // Orange
  MEDIUM: { days: 14, multiplier: 1.1 },     // Yellow
  LOW: { days: 15+, multiplier: 1.0 },       // Green
};

// Calculation
function calculateUrgency(checkInDate): UrgencyData {
  const daysUntil = differenceInDays(checkInDate, now());

  if (daysUntil <= 3) return { multiplier: 1.5, band: 'red' };
  if (daysUntil <= 7) return { multiplier: 1.25, band: 'orange' };
  if (daysUntil <= 14) return { multiplier: 1.1, band: 'yellow' };
  return { multiplier: 1.0, band: 'green' };
}
```

**UI Components:**
- `UrgencyBanner.jsx` - Visual countdown with color-coded urgency
- Pricing display shows: "Your Selection: $324 + Urgency Adjustment: +$81 (25%)"

**Database Schema:**

```sql
ALTER TABLE date_change_requests ADD COLUMN urgency_multiplier DECIMAL(3,2);
ALTER TABLE date_change_requests ADD COLUMN urgency_band VARCHAR(20);
ALTER TABLE date_change_requests ADD COLUMN urgency_snapshot JSONB;
```

---

### Pattern 3: Price Anchoring

**Business Goal:** Make lower-priced options feel like great value

**Technical Implementation:**

```typescript
// Always display in descending price order
const DISPLAY_ORDER = ['buyout', 'crash', 'swap'];

// Buyout shown first (highest price) = anchor
// Crash shown second with savings badge: "Save $2,511 (89% off!)"
// Swap shown third with best value: "Save $2,835 (100% off!)"

interface PricingTier {
  type: 'buyout' | 'crash' | 'swap';
  price: number;
  savingsVsAnchor: number;
  savingsPercentage: number;
  priority: 1 | 2 | 3;
}
```

**Visual Hierarchy:**

```css
/* Buyout (Anchor) - Largest, gold border */
.option-buyout {
  height: 200px;
  border: 3px solid #FFD700;
  font-size: 36px;
}

/* Crash - Medium, with savings badge */
.option-crash .savings-badge {
  background: #4CAF50;
  content: "Save $2,511";
}

/* Swap - Highlighted as best value */
.option-swap::after {
  content: 'BEST VALUE';
  background: #4CAF50;
}
```

**Key Files:**
- `src/components/DateChangeRequest/PriceTierSelector.jsx`
- `src/utils/priceAnchoring.js`

---

### Pattern 4: BS+BS Competition

**Business Goal:** Create competitive dynamics when both roommates are Big Spenders

**Technical Implementation:**

```typescript
// Trigger Conditions
function shouldEnableCompetitiveBidding(user1, user2, targetNight) {
  return (
    user1.archetype === 'big_spender' &&
    user2.archetype === 'big_spender' &&
    bothWantSameNight(user1, user2, targetNight) &&
    daysUntil(targetNight) <= 30
  );
}

// Bidding Rules
const BIDDING_RULES = {
  minimumIncrement: 0.10,    // 10% of current bid
  maxRounds: 3,
  roundDuration: 3600,        // 1 hour
  loserCompensation: 0.25,    // 25% of winning bid
};

// WebSocket Events
socket.on('bid:placed', (bid) => {
  // Update UI with new high bid
  // Show "2 others interested"
  // Display countdown timer
});
```

**Competitive Indicators:**
- "⚡ 2 others are viewing this"
- "🔴 3 recent offers in last 24h"
- "⏰ 18h to respond"
- "Your offer rank: 2nd"

**Database Schema:**

```sql
CREATE TABLE offer_activity (
  id UUID PRIMARY KEY,
  request_id UUID,
  activity_type VARCHAR(20), -- 'view', 'offer', 'counter'
  user_id UUID,
  metadata JSONB,
  created_at TIMESTAMP
);
```

**Key Files:**
- `src/components/DateChangeRequest/CompetitiveIndicator.jsx`
- `src/components/DateChangeRequest/CounterOfferForm.jsx`
- `src/hooks/useBiddingState.js`

---

### Pattern 5: Fee Transparency

**Business Goal:** Build trust through transparent 1.5% fee breakdown

**Technical Implementation:**

```typescript
// Fee Structure (1.5% split model)
const FEE_RATES = {
  PLATFORM_RATE: 0.0075,   // 0.75%
  LANDLORD_RATE: 0.0075,   // 0.75%
  TOTAL_RATE: 0.015,       // 1.5%
};

interface FeeBreakdown {
  basePrice: number;
  platformFee: number;       // 0.75%
  landlordShare: number;     // 0.75%
  totalFee: number;          // 1.5%
  totalPrice: number;
  savingsVsTraditional: number;  // vs 17% markup
}

function calculateFeeBreakdown(basePrice): FeeBreakdown {
  const platformFee = basePrice * 0.0075;
  const landlordShare = basePrice * 0.0075;
  const totalFee = platformFee + landlordShare;

  return {
    basePrice,
    platformFee,
    landlordShare,
    totalFee,
    totalPrice: basePrice + totalFee,
    savingsVsTraditional: (basePrice * 0.17) - totalFee,
  };
}
```

**UI Display:**

```
Price Breakdown:
  Base rent:          $1,000.00
  Platform fee (0.75%):   $7.50
  Landlord share (0.75%): $7.50
  ─────────────────────────────
  Total:              $1,015.00

✓ You save $155 vs traditional 17% markup
```

**Database Schema:**

```sql
ALTER TABLE date_change_requests ADD COLUMN fee_breakdown JSONB;
ALTER TABLE date_change_requests ADD COLUMN base_price DECIMAL(10,2);
ALTER TABLE date_change_requests ADD COLUMN total_price DECIMAL(10,2);
ALTER TABLE date_change_requests ADD COLUMN fee_structure_version VARCHAR(50);
```

**Key Files:**
- `src/components/PriceDisplay.jsx`
- `src/utils/feeCalculations.js`
- `supabase/functions/process-date-change-fee/index.ts`

---

## Quick Start Guide

### Prerequisites

- **Node.js:** 18+ (with npm)
- **Supabase CLI:** Latest version
- **Git:** For version control
- **PostgreSQL:** 14+ (via Supabase)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/your-org/split-lease.git
cd split-lease

# 2. Install dependencies
npm install

# 3. Set up Supabase
npx supabase login
npx supabase init

# 4. Link to your Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# 5. Run database migrations
npx supabase db push

# 6. Deploy Edge Functions
npx supabase functions deploy date-change-request
npx supabase functions deploy calculate-urgency

# 7. Set environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase URL and keys

# 8. Start development server
npm run dev
```

### First Request Test

```bash
# Test archetype detection
curl -X POST http://localhost:3000/api/archetype \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id"}'

# Test urgency calculation
curl -X POST http://localhost:3000/api/urgency \
  -H "Content-Type: application/json" \
  -d '{"targetDate": "2026-02-15"}'

# Test full request flow
curl -X POST http://localhost:3000/api/date-change-request \
  -H "Content-Type: application/json" \
  -d '{
    "leaseId": "test-lease-id",
    "userId": "test-user-id",
    "targetDate": "2026-02-15",
    "selectedTier": "recommended"
  }'
```

---

## Pattern Integration

### How All 5 Patterns Work Together

**Step-by-Step Request Flow:**

```javascript
// 1. User opens date change form
const DateChangeFlow = () => {
  const [archetype, setArchetype] = useState(null);
  const [urgency, setUrgency] = useState(null);
  const [pricingTiers, setPricingTiers] = useState([]);

  // PATTERN 1: Detect archetype on mount
  useEffect(() => {
    detectArchetypeForUser(userId).then(setArchetype);
  }, [userId]);

  // PATTERN 2: Calculate urgency when date selected
  useEffect(() => {
    if (targetDate) {
      calculateUrgency(targetDate).then(setUrgency);
    }
  }, [targetDate]);

  // PATTERN 3: Generate pricing tiers with anchoring
  useEffect(() => {
    if (archetype && urgency) {
      generatePricingTiers(archetype, urgency).then(tiers => {
        setPricingTiers(tiers);
        // Pre-select recommended tier based on archetype
        const recommended = tiers.find(t => t.recommended);
        setSelectedTier(recommended.id);
      });
    }
  }, [archetype, urgency]);

  // PATTERN 4: Check BS+BS competition (if applicable)
  useEffect(() => {
    if (archetype?.type === 'big_spender') {
      checkBSBSEligibility(leaseId).then(setCompetitive);
    }
  }, [archetype]);

  // PATTERN 5: Calculate fee breakdown
  const feeBreakdown = calculateFeeBreakdown(
    selectedTier?.price || 0,
    'date_change'
  );

  return (
    <div>
      {/* Urgency Banner (Pattern 2) */}
      <UrgencyBanner urgency={urgency} />

      {/* Archetype Indicator (Pattern 1) */}
      <ArchetypeCard archetype={archetype} />

      {/* Price Tier Selector (Pattern 3) */}
      <PriceTierSelector
        tiers={pricingTiers}
        selected={selectedTier}
        onSelect={setSelectedTier}
      />

      {/* Fee Breakdown (Pattern 5) */}
      <PriceDisplay feeBreakdown={feeBreakdown} />

      {/* Competitive Bidding (Pattern 4 - conditional) */}
      {competitive && (
        <CompetitiveBidding requestId={requestId} />
      )}
    </div>
  );
};
```

### Pattern Dependencies

```
Pattern 1 (Archetype)
    ↓ (feeds into)
Pattern 2 (Urgency) + Pattern 3 (Pricing Tiers)
    ↓ (combined with)
Pattern 4 (BS+BS Competition - conditional)
    ↓ (all incorporate)
Pattern 5 (Fee Transparency)
```

---

## Deployment Guide

### Environment Setup

**Required Environment Variables:**

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Feature Flags
ENABLE_PATTERN_1_ARCHETYPES=true
ENABLE_PATTERN_2_URGENCY=true
ENABLE_PATTERN_3_ANCHORING=true
ENABLE_PATTERN_4_BSBS=true
ENABLE_PATTERN_5_FEE_TRANSPARENCY=true

# Analytics
SEGMENT_WRITE_KEY=your_segment_key
MIXPANEL_TOKEN=your_mixpanel_token

# Payment
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

### Database Migration Steps

```bash
# 1. Backup production database
npx supabase db dump > backup-$(date +%Y%m%d).sql

# 2. Run migrations in order
npx supabase migration up 20260128000001  # User archetype fields
npx supabase migration up 20260128000002  # DateChangeRequest fee fields
npx supabase migration up 20260128000003  # User archetype backfill
npx supabase migration up 20260128000004  # Fee breakdown backfill
npx supabase migration up 20260128000005  # Fee calculation trigger

# 3. Verify data integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users WHERE archetype IS NOT NULL;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM date_change_requests WHERE fee_breakdown IS NOT NULL;"
```

### Edge Function Deployment

```bash
# Deploy all functions
npx supabase functions deploy date-change-request
npx supabase functions deploy calculate-urgency
npx supabase functions deploy process-date-change-fee

# Verify deployment
npx supabase functions list

# Test deployed functions
curl -i --location --request POST \
  'https://your-project.supabase.co/functions/v1/date-change-request' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"action":"get_archetype_suggestion","userId":"test"}'
```

### Frontend Deployment

```bash
# Build production assets
npm run build

# Deploy to Vercel/Netlify
npm run deploy

# Or manual deployment
npm run build
rsync -avz dist/ user@server:/var/www/html/
```

### Zero-Downtime Deployment Strategy

```bash
# 1. Deploy new Edge Functions (versioned)
npx supabase functions deploy date-change-request-v2

# 2. Update database with backward-compatible migrations
npx supabase migration up

# 3. Deploy frontend with feature flags
ENABLE_NEW_PATTERNS=false npm run deploy

# 4. Gradually enable features (10% → 50% → 100%)
# Via feature flag service or environment variables

# 5. Monitor error rates and performance
# If issues detected, immediately disable via feature flags

# 6. Once stable, remove old Edge Function versions
npx supabase functions delete date-change-request-v1
```

---

## API Reference

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete reference.

**Quick Reference:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/archetype/{userId}` | GET | Get user archetype |
| `/api/urgency` | POST | Calculate urgency multiplier |
| `/api/pricing-tiers` | POST | Generate pricing tiers |
| `/api/date-change-request` | POST | Create date change request |
| `/api/date-change-request/{id}` | GET | Get request details |
| `/api/date-change-request/{id}/accept` | POST | Accept request |
| `/api/date-change-request/{id}/counter` | POST | Send counter-offer |

---

## Testing Strategy

See [TESTING.md](./TESTING.md) for complete test suite.

**Test Coverage Targets:**

- Unit tests: >90%
- Integration tests: >80%
- E2E tests: 3 critical user flows
- Performance tests: All patterns
- Load tests: 1000 concurrent users

**Quick Test Run:**

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests with coverage
npm run test:coverage
```

---

## Monitoring & Analytics

### Key Metrics to Track

**Pattern 1 (Archetype):**
- Archetype distribution (Big Spender %, High Flex %, Average %)
- Default acceptance rate by archetype
- Time to decision by archetype

**Pattern 2 (Urgency):**
- Urgency band distribution
- Conversion rate by urgency level
- Revenue per urgency band

**Pattern 3 (Anchoring):**
- Tier selection distribution (Buyout %, Crash %, Swap %)
- Savings recognition rate
- Anchor effectiveness score

**Pattern 4 (BS+BS):**
- BS+BS trigger rate
- Average rounds per bidding session
- Loser satisfaction (survey)

**Pattern 5 (Fee Transparency):**
- Fee acceptance rate
- Fee complaint rate
- Fee comprehension (survey)

### Analytics Events

```javascript
// Track pattern effectiveness
analytics.track('Pattern1_ArchetypeDetected', {
  userId,
  archetype: 'big_spender',
  confidence: 0.87,
  signals: { ... }
});

analytics.track('Pattern2_UrgencyCalculated', {
  daysUntil: 7,
  multiplier: 1.25,
  band: 'orange'
});

analytics.track('Pattern3_TierSelected', {
  tier: 'buyout',
  savingsVsAnchor: 2511,
  wasRecommended: true
});

analytics.track('Pattern4_CompetitiveBidding', {
  sessionId,
  winningBid: 3800,
  loserCompensation: 950
});

analytics.track('Pattern5_FeeAccepted', {
  feeAmount: 43,
  totalPrice: 2878,
  userComplaint: false
});
```

---

## Troubleshooting

### Common Issues

**Issue: Archetype not detected**

```bash
# Check if user has transaction history
SELECT COUNT(*) FROM date_change_requests WHERE user_id = 'YOUR_USER_ID';

# If count = 0, archetype will default to 'average_user'
# This is expected behavior for new users

# Manually trigger archetype calculation
curl -X POST https://your-project.supabase.co/functions/v1/calculate-user-archetype \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"userId":"YOUR_USER_ID"}'
```

**Issue: Urgency multiplier not applied**

```javascript
// Check calculation
const urgency = calculateUrgency({ checkInDate: '2026-02-15' });
console.log(urgency);

// Expected output:
// { multiplier: 1.25, band: 'orange', daysUntil: 7, ... }

// If multiplier = 1.0, check date is in future
// If still 1.0, check URGENCY_THRESHOLDS configuration
```

**Issue: Fee breakdown not saving**

```sql
-- Check if trigger is enabled
SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_calculate_fee_breakdown';

-- If missing, recreate trigger
CREATE TRIGGER trigger_auto_calculate_fee_breakdown
  BEFORE INSERT ON public.datechangerequest
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_fee_breakdown();
```

**Issue: BS+BS competition not triggering**

```typescript
// Debug eligibility check
const eligible = validateBothSidesBothSidesEligibility(lease, userId);
console.log(eligible);

// Check conditions:
// 1. Both users have archetype = 'big_spender'
// 2. Both want same night
// 3. Within 30 days of target date
// 4. Multiple parties in lease
```

---

## Performance Optimization

### Caching Strategy

```javascript
// Redis cache for archetype results (24h TTL)
const archetypeKey = `archetype:${userId}`;
const cached = await redis.get(archetypeKey);

if (cached) {
  return JSON.parse(cached);
}

const archetype = await detectArchetype(userId);
await redis.setex(archetypeKey, 86400, JSON.stringify(archetype));

return archetype;
```

### Database Indexes

```sql
-- Critical indexes for performance
CREATE INDEX idx_dcr_user_archetype ON date_change_requests(user_id, archetype);
CREATE INDEX idx_dcr_urgency_band ON date_change_requests(urgency_band);
CREATE INDEX idx_user_archetype_scores ON users(archetype, flexibility_score, spending_score);
CREATE INDEX idx_dcr_fee_breakdown ON date_change_requests USING GIN (fee_breakdown);
```

### Edge Function Optimization

```typescript
// Bundle imports to reduce cold start time
import { detectArchetype, calculateUrgency, generateTiers } from './utils/all.ts';

// Reuse Supabase client across invocations
let cachedSupabaseClient;

function getSupabaseClient() {
  if (!cachedSupabaseClient) {
    cachedSupabaseClient = createClient(url, key);
  }
  return cachedSupabaseClient;
}
```

---

## Security Considerations

### Row Level Security (RLS)

```sql
-- Users can only view their own archetype
CREATE POLICY "Users view own archetype"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);

-- Users can only create requests for their own leases
CREATE POLICY "Users create own requests"
  ON date_change_requests FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT auth_id FROM users WHERE id = user_id
    )
  );
```

### Input Validation

```typescript
// Always validate inputs in Edge Functions
function validateCreateRequest(params) {
  const errors = [];

  if (!params.leaseId || !isUUID(params.leaseId)) {
    errors.push('Invalid leaseId');
  }

  if (!params.targetDate || !isValidDate(params.targetDate)) {
    errors.push('Invalid targetDate');
  }

  if (params.selectedTier && !VALID_TIERS.includes(params.selectedTier)) {
    errors.push('Invalid tier');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }
}
```

### Rate Limiting

```typescript
// Implement rate limiting for Edge Functions
const rateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 10,  // 10 requests per minute per user
});

serve(async (req) => {
  const userId = await getUserIdFromAuth(req);

  if (!await rateLimiter.check(userId)) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // Process request...
});
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License

MIT License - See [LICENSE](./LICENSE) for details.

---

## Support

- **Documentation:** https://docs.splitlease.com
- **Issues:** https://github.com/your-org/split-lease/issues
- **Slack:** #split-lease-dev
- **Email:** dev@splitlease.com

---

**Last Updated:** 2026-01-28
**Version:** 1.0.0
**Authors:** Split Lease Engineering Team
