# Urgency Pricing Edge Function

Production-ready urgency pricing implementation for Split Lease behavioral economics.

## Overview

This Edge Function implements **Pattern 2: Urgency Countdown** with exponential pricing formula:

```
multiplier = exp(steepness × (1 - days_out/lookback_window))
```

**Steepness = 2.0** (from simulation)

## Architecture

- **Runtime**: Deno 2 (Supabase Edge Functions)
- **Pattern**: Functional Programming (FP) - pure functions, immutable data, fail-fast
- **Caching**: PostgreSQL-based (urgency_pricing_cache table)
- **Actions**: calculate, batch, calendar, events, stats, health

## API Endpoints

### POST /functions/v1/urgency-pricing

All requests use action-based routing:

```json
{
  "action": "action_name",
  "payload": { ... }
}
```

### Actions

#### 1. `calculate` - Single pricing calculation

**Payload**:
```json
{
  "action": "calculate",
  "payload": {
    "targetDate": "2026-02-15T00:00:00Z",
    "basePrice": 180,
    "urgencySteepness": 2.0,
    "marketDemandMultiplier": 1.0,
    "includeProjections": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "currentPrice": 810,
    "currentMultiplier": 4.5,
    "urgencyLevel": "HIGH",
    "daysUntilCheckIn": 7,
    "projections": [...],
    "peakPrice": 1584
  },
  "metadata": {
    "cacheHit": false,
    "calculationTimeMs": 12
  }
}
```

#### 2. `batch` - Multiple calculations in parallel

**Payload**:
```json
{
  "action": "batch",
  "payload": {
    "requests": [
      { "targetDate": "2026-02-15", "basePrice": 180 },
      { "targetDate": "2026-02-16", "basePrice": 180 }
    ]
  }
}
```

#### 3. `calendar` - Calendar view pricing

**Payload**:
```json
{
  "action": "calendar",
  "payload": {
    "basePrice": 180,
    "dates": ["2026-02-15", "2026-02-16", "2026-02-17"],
    "steepness": 2.0
  }
}
```

#### 4. `events` - Manage event multipliers (admin only)

**Sub-actions**: `add_event`, `remove_event`, `list_events`

**Add Event**:
```json
{
  "action": "events",
  "payload": {
    "action": "add_event",
    "eventId": "aws-reinvent-2026",
    "eventName": "AWS re:Invent 2026",
    "startDate": "2026-11-30",
    "endDate": "2026-12-04",
    "cities": ["las-vegas"],
    "multiplier": 3.5
  }
}
```

#### 5. `stats` - Cache statistics

**Payload**:
```json
{
  "action": "stats",
  "payload": {}
}
```

#### 6. `health` - Health check

**Payload**:
```json
{
  "action": "health",
  "payload": {}
}
```

## Urgency Levels

| Level | Days Out | Cache TTL | Example Multiplier (steepness=2.0) |
|-------|----------|-----------|-------------------------------------|
| CRITICAL | 0-3 | 5 minutes | 6.4x (3 days) → 8.8x (1 day) |
| HIGH | 3-7 | 15 minutes | 4.5x (7 days) → 6.4x (3 days) |
| MEDIUM | 7-14 | 1 hour | 3.2x (14 days) → 4.5x (7 days) |
| LOW | 14+ | 6 hours | 1.0x (90 days) → 3.2x (14 days) |

## Multiplier Examples (Steepness = 2.0)

| Days Out | Multiplier | Price ($180 base) |
|----------|------------|-------------------|
| 90 | 1.0x | $180 |
| 30 | 2.2x | $396 |
| 14 | 3.2x | $576 |
| 7 | 4.5x | $810 |
| 3 | 6.4x | $1,152 |
| 1 | 8.8x | $1,584 |

## Database Tables

### urgency_pricing_cache
Stores calculated pricing for cache and analytics

**Key columns**:
- `cache_key` (unique): `YYYY-MM-DD:basePrice:steepness:marketMultiplier`
- `expires_at`: UTC timestamp for TTL
- `urgency_level`: CRITICAL | HIGH | MEDIUM | LOW
- `projections`: JSONB array of future price projections

### event_multipliers
Stores event-based demand spikes

**Key columns**:
- `event_id` (unique): Event identifier
- `start_date`, `end_date`: Event date range
- `multiplier`: Demand spike factor (1.5-4.0)
- `cities`: TEXT[] array of affected cities

### urgency_pricing_config
System-wide configuration

**Key configs**:
- `default_urgency_steepness`: 2.0
- `default_lookback_window`: 90
- `day_of_week_multipliers_urban`: Weekday premium
- `seasonal_multipliers`: Month-specific demand

## Local Development

```bash
# Start local Supabase
supabase start

# Serve this function
supabase functions serve urgency-pricing

# Test endpoint
curl -X POST http://localhost:54321/functions/v1/urgency-pricing \
  -H "Content-Type: application/json" \
  -d @test-payloads.json
```

## Production Deployment

```bash
# Deploy function
supabase functions deploy urgency-pricing

# Test production
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/urgency-pricing \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"health","payload":{}}'
```

## Testing

See `test-payloads.json` for example requests.

**Verify steepness 2.0 formula**:
- 1 day out → ~8.8x multiplier
- 7 days out → ~4.5x multiplier
- 30 days out → ~2.2x multiplier

## Architecture Principles (FP)

1. **Pure functions in core** - No side effects in calculators
2. **Immutable data** - No `let` reassignment in business logic
3. **Fail fast** - No fallback logic, errors propagate immediately
4. **Side effects at boundaries** - I/O only in handlers and index.ts
5. **Database-backed caching** - No Redis (Deno runtime limitation)

## File Structure

```
urgency-pricing/
├── index.ts                  # Main router (FP orchestration)
├── deno.json                 # Import map
├── types/
│   └── urgency.types.ts      # Type definitions
├── core/
│   ├── urgencyCalculator.ts  # Exponential pricing formula
│   ├── marketDemandCalculator.ts  # Market demand multipliers
│   └── dateUtils.ts          # Date utilities
├── cache/
│   └── pricingCache.ts       # Database-backed cache
├── config/
│   └── config.ts             # Configuration loader
├── handlers/
│   ├── calculate.ts          # Single calculation
│   ├── batch.ts              # Batch processing
│   ├── calendar.ts           # Calendar view
│   ├── events.ts             # Event management
│   ├── stats.ts              # Statistics
│   └── health.ts             # Health check
└── README.md                 # This file
```

## Critical Notes

- **Steepness = 2.0 is non-negotiable** (from simulation)
- **No fallback logic** - Errors fail fast
- **UTC-based date calculations** - Prevents timezone bugs
- **Cache invalidation** - Event changes invalidate affected date ranges
- **Public pricing** - All calculations are public (no auth required)
- **Admin-only events** - Only admins can add/remove events

## Future Enhancements

- Real-time price updates via WebSockets
- A/B testing for steepness values
- ML-based demand forecasting
- Integration with proposal flow
- Price alerts for users

---

**Version**: 1.0.0
**Date**: 2026-01-29
**Pattern**: Pattern 2: Urgency Countdown
