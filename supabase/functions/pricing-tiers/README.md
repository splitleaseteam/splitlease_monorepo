# Pricing Tiers Edge Function

Dynamic pricing tier generation using price anchoring behavioral economics (Pattern 3). Returns budget, recommended, and premium tiers with anchor savings calculations.

## Overview

This Edge Function implements **Pattern 3: Price Anchoring** with three pricing tiers:

| Tier | Multiplier | Badge | Description |
|------|-----------|-------|-------------|
| Budget | 0.9x | - | Basic offer - may take longer to accept |
| Recommended | 1.0x | Most Popular | Best value - preferred by 73% of users |
| Premium | 1.15x | Fastest | Priority handling - highest acceptance rate |

## Architecture

- **Runtime**: Deno 2 (Supabase Edge Functions)
- **Pattern**: Functional Programming (FP) - pure functions, immutable data, fail-fast
- **Auth**: Public (all actions accessible without authentication)
- **Actions**: calculate, select

## API Endpoints

### POST /functions/v1/pricing-tiers

All requests use action-based routing:

```json
{
  "action": "action_name",
  "payload": { ... }
}
```

### Actions

#### 1. `calculate` - Calculate pricing tiers from base price

**Payload**:
```json
{
  "action": "calculate",
  "payload": {
    "basePriceCents": 18000,
    "currentBuyoutPriceCents": 25000,
    "urgencyMultiplier": 1.0
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "tiers": [
      {
        "tierId": "budget",
        "tierName": "Budget",
        "priceCents": 16200,
        "multiplier": 0.9,
        "savingsCents": 8800,
        "savingsPercentage": 35.2,
        "badgeText": null,
        "description": "Basic offer - may take longer to accept"
      },
      {
        "tierId": "recommended",
        "tierName": "Recommended",
        "priceCents": 18000,
        "multiplier": 1.0,
        "savingsCents": 7000,
        "savingsPercentage": 28.0,
        "badgeText": "Most Popular",
        "description": "Best value - preferred by 73% of users"
      },
      {
        "tierId": "premium",
        "tierName": "Premium",
        "priceCents": 20700,
        "multiplier": 1.15,
        "savingsCents": 4300,
        "savingsPercentage": 17.2,
        "badgeText": "Fastest",
        "description": "Priority handling - highest acceptance rate"
      }
    ],
    "anchorPriceCents": 25000,
    "recommendedTierId": "recommended"
  }
}
```

#### 2. `select` - Record user's tier selection

**Payload**:
```json
{
  "action": "select",
  "payload": {
    "selectedTier": "recommended",
    "basePriceCents": 18000,
    "userId": "user-123",
    "leaseId": "lease-456",
    "currentBuyoutPriceCents": 25000,
    "urgencyMultiplier": 1.0,
    "dateChangeRequestId": "dcr-789",
    "tiersViewed": ["budget", "recommended", "premium"],
    "timeToSelectionMs": 4500
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "selectionId": "sel-abc123",
    "selectedTier": "recommended",
    "tierPriceCents": 18000,
    "anchorSavingsCents": 7000,
    "recordedAt": "2026-02-12T10:30:00.000Z"
  }
}
```

## Dependencies

- `_shared/errors.ts` - ValidationError
- `_shared/functional/result.ts` - Result type (ok/err)
- `_shared/functional/orchestration.ts` - FP request parsing, action routing
- `_shared/functional/errorLog.ts` - Immutable error log
- `_shared/slack.ts` - Error reporting to Slack

## Local Development

```bash
# Start local Supabase
supabase start

# Serve this function
supabase functions serve pricing-tiers

# Test calculate
curl -X POST http://localhost:54321/functions/v1/pricing-tiers \
  -H "Content-Type: application/json" \
  -d '{"action":"calculate","payload":{"basePriceCents":18000}}'
```

## File Structure

```
pricing-tiers/
├── index.ts              # Main router (FP orchestration)
├── handlers/
│   ├── calculate.ts      # Tier calculation handler
│   └── select.ts         # Tier selection recording handler
└── lib/
    ├── types.ts           # Type definitions
    ├── validators.ts      # Input validation
    └── calculations.ts    # Pure pricing calculation functions
```

## Critical Notes

- **All actions are public** - No authentication required
- **No fallback logic** - Errors fail fast
- **Pure calculation functions** - Same inputs always produce same output
- **Anchor price logic** - Uses buyout price as anchor if higher than base, otherwise uses base price
- **Urgency-aware recommendations** - When urgencyMultiplier >= 1.5, premium tier is recommended
- **Selection tracking** - Records analytics data (tiersViewed, timeToSelectionMs)

---

**Version**: 1.0.0
**Date**: 2026-02-12
**Pattern**: Pattern 3: Price Anchoring
