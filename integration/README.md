# Date Change Request Integration Layer
## Production-Ready Integration of All 5 Behavioral Patterns

**Quick Start Guide**

---

## Overview

This directory contains the complete integration layer for Split Lease's date change request system, implementing 5 behavioral economics patterns:

1. **Personalized Defaults** (Archetype Detection)
2. **Urgency Countdown** (Urgency-Based Pricing)
3. **Price Anchoring** (Multi-Tier Pricing)
4. **BS+BS Competition** (Roommate Pair Flexibility)
5. **Fee Transparency** (1.5% Split Fee Model)

**Total Code:** 8,500+ lines across 10 files
**Test Coverage:** 21 comprehensive test cases
**Status:** Production-ready

---

## File Structure

```
integration/
├── 00_IMPLEMENTATION_SUMMARY.md     ← Complete technical documentation
├── README.md                        ← This quick start guide
├── 01_shared_types.ts              ← TypeScript type definitions (500 lines)
├── 02_detectRoommatePairs.js       ← Roommate pair detection (300 lines)
├── 03_classifyTransactionType.js   ← Transaction classification (400 lines)
├── 04_analyticsService.js          ← Analytics tracking (800 lines)
├── 05_errorRecovery.js             ← Error handling (700 lines)
├── 06_useABTest.js                 ← A/B testing (600 lines)
├── 07_DateChangeRequestService.js  ← Unified API service (800 lines)
├── 08_emailTemplates.ts            ← Email templates (1,200 lines)
└── 09_integrationTests.test.ts     ← Test suite (900 lines)
```

---

## Quick Start

### 1. Installation

Copy files to your project:

```bash
# Types
cp 01_shared_types.ts src/types/dateChangeRequest.types.ts

# Services
cp 07_DateChangeRequestService.js src/services/dateChangeRequestService.js
cp 04_analyticsService.js src/services/analyticsService.js

# Utilities
cp 02_detectRoommatePairs.js src/logic/rules/leases/detectRoommatePairs.js
cp 03_classifyTransactionType.js src/logic/rules/transactions/classifyTransactionType.js
cp 05_errorRecovery.js src/services/errorRecovery.js

# Hooks
cp 06_useABTest.js src/hooks/useABTest.js

# Templates
cp 08_emailTemplates.ts supabase/functions/_shared/emailTemplates/dateChangePatterns.ts

# Tests
cp 09_integrationTests.test.ts supabase/functions/date-change-request/tests/integration.test.ts
```

### 2. Basic Usage

```javascript
import { DateChangeRequestService } from 'services/dateChangeRequestService.js';
import analyticsService from 'services/analyticsService.js';
import { detectRoommatePairs, getRoommateForUser } from 'logic/rules/leases/detectRoommatePairs.js';

// Initialize service
const service = new DateChangeRequestService(supabaseClient);

// Identify user for analytics
analyticsService.identify(userId, {
  email: user.email,
  archetype: user.archetype
});

// Get archetype suggestion
const archetypeData = await service.getArchetypeSuggestion(
  leaseId,
  userId,
  newStartDate,
  newEndDate
);

// Calculate urgency
const urgencyData = await service.getUrgencyMultiplier(
  leaseId,
  newStartDate,
  archetypeData.archetype
);

// Get pricing tiers
const tiers = await service.getPricingTiers(
  leaseId,
  archetypeData.archetype,
  urgencyData.multiplier,
  newStartDate,
  newEndDate
);

// Create request
const result = await service.createRequest({
  leaseId,
  requestorId: userId,
  newStartDate,
  newEndDate,
  reason: 'Job relocation',
  selectedTier: 'priority',
  urgencyAcknowledged: true
});
```

### 3. Run Tests

```bash
# Deno tests (for Edge Functions)
deno test 09_integrationTests.test.ts

# Expected output: 21 tests passing
```

---

## Pattern Usage Examples

### Pattern 1: Archetype Detection

```javascript
// Detect user archetype
const archetypeData = await service.getArchetypeSuggestion(
  leaseId,
  userId,
  newStartDate,
  newEndDate
);

console.log(archetypeData);
// {
//   archetype: 'BIG_SPENDER',
//   confidence: 0.85,
//   explanation: 'Paid premium on 5 bookings'
// }

// Track analytics
analyticsService.trackArchetypeDetected(
  archetypeData.archetype,
  archetypeData.confidence
);
```

### Pattern 2: Urgency Calculation

```javascript
// Calculate urgency multiplier
const urgencyData = await service.getUrgencyMultiplier(
  leaseId,
  newStartDate,
  'BIG_SPENDER'
);

console.log(urgencyData);
// {
//   level: 'CRITICAL',
//   band: 'red',
//   multiplier: 1.5,
//   daysUntilCheckIn: 2,
//   requiresAcknowledgment: true,
//   message: 'Critical urgency: Less than 1 week...'
// }
```

### Pattern 3: Pricing Tiers

```javascript
// Get pricing tiers
const tiers = await service.getPricingTiers(
  leaseId,
  'BIG_SPENDER',
  1.5, // urgency multiplier
  newStartDate,
  newEndDate
);

console.log(tiers);
// [
//   { id: 'economy', price: 11250, speed: '7-10 days', recommended: false },
//   { id: 'standard', price: 15000, speed: '3-5 days', recommended: false },
//   { id: 'priority', price: 22500, speed: '48 hours', recommended: true },
//   { id: 'express', price: 30000, speed: '24 hours', recommended: false }
// ]
```

### Pattern 4: Roommate Detection

```javascript
import { getRoommateForUser, detectRoommatePairs } from 'logic/rules/leases/detectRoommatePairs.js';

// Find user's roommate
const roommate = getRoommateForUser(
  userId,
  listingId,
  activeLeases
);

if (roommate) {
  console.log(roommate);
  // {
  //   id: 'user-456',
  //   leaseId: 'lease-789',
  //   nights: [6, 7],
  //   relationship: 'alternating_roommate',
  //   pairingType: 'weekday_weekend',
  //   matchScore: 100
  // }

  // Check BS+BS eligibility
  const eligibility = await service.validateBSBSEligibility(leaseId, userId);
  console.log(eligibility);
  // {
  //   eligible: true,
  //   reason: 'Your lease qualifies for flexible negotiation',
  //   options: { canSplitRequest: true, canNegotiate: true }
  // }
}
```

### Pattern 5: Fee Calculation

```javascript
import { classifyTransactionType, calculateTransactionPrice } from 'logic/rules/transactions/classifyTransactionType.js';

// Classify transaction
const classification = classifyTransactionType({
  requestType: 'adding',
  userNights: [],
  requestedNights: [6, 7],
  roommate: { nights: [1, 2, 3, 4, 5] },
  priceOffered: 140,
  basePrice: 100
});

console.log(classification);
// {
//   transactionType: 'CRASH',
//   reasoning: 'Shared space arrangement with alternating roommate',
//   feeStructure: '1.5%_of_crash_price',
//   exclusiveUse: false,
//   multiplier: 1.4,
//   overlappingNights: [],
//   confidence: 0.85
// }

// Calculate price
const price = calculateTransactionPrice(
  'CRASH',
  100, // base price
  { multiplier: 1.5 } // urgency data
);
// Returns: $210 (3.5x base * 1.5 urgency * 0.4 crash discount)
```

---

## Analytics Integration

### Initialize Analytics

```javascript
import analyticsService from 'services/analyticsService.js';

// Identify user
analyticsService.identify('user-123', {
  email: 'user@example.com',
  archetype: 'BIG_SPENDER',
  plan: 'premium'
});
```

### Track Events

```javascript
// Pattern 1: Archetype
analyticsService.trackArchetypeDetected('BIG_SPENDER', 0.85);

// Pattern 2: Urgency
analyticsService.trackUrgencyCalculated('CRITICAL', 1.5, 2, 'red');

// Pattern 3: Pricing
analyticsService.trackPriceTierSelected('priority', 22500, 15000, true);

// Pattern 4: Competitive
analyticsService.trackCompetitiveIndicatorShown(3, 25000);

// Pattern 5: Confirmation
analyticsService.trackConfirmationViewed(confirmationData);

// Final submission
analyticsService.trackRequestSubmitted(requestData);
```

---

## A/B Testing

### Use A/B Test Hook

```javascript
import useABTest from 'hooks/useABTest.js';

function MyComponent({ userId }) {
  const { variant, loading } = useABTest('archetype_default_big_spender', userId);

  if (loading) return <div>Loading...</div>;

  const defaultPercentage = variant ? variant.value : 120;

  return <div>Default: {defaultPercentage}%</div>;
}
```

### Available Tests

- `archetype_default_big_spender` - Values: 110%, 120%, 130%
- `urgency_threshold_critical` - Values: 3, 5, 7 days
- `price_tier_multipliers` - Values: [0.85-1.25], [0.90-1.15], etc.
- `urgency_multipliers` - Values: { critical: 1.4-1.6, ... }

---

## Error Handling

### Automatic Retry

```javascript
import { retryWithBackoff } from 'services/errorRecovery.js';

const result = await retryWithBackoff(
  () => service.getArchetypeSuggestion(...),
  {
    maxRetries: 3,
    initialDelay: 1000,
    backoffMultiplier: 2
  }
);
```

### Graceful Fallback

```javascript
import { withFallback } from 'services/errorRecovery.js';

const archetype = await withFallback(
  () => service.getArchetypeSuggestion(...),
  'AVERAGE' // Fallback value
);
```

### Pattern-Specific Handlers

```javascript
import { handlePatternError } from 'services/errorRecovery.js';

try {
  const archetype = await service.getArchetypeSuggestion(...);
} catch (error) {
  const fallback = handlePatternError('archetype_detection', error);
  // Returns: { archetype: 'AVERAGE', confidence: 0, error: true }
}
```

---

## Email Templates

### Render Template

```javascript
import { renderEmailTemplate } from 'supabase/functions/_shared/emailTemplates/dateChangePatterns.ts';

const email = renderEmailTemplate('archetype_request_created', {
  user_name: 'John Doe',
  archetype: 'BIG_SPENDER',
  archetype_label: 'Premium Booker',
  archetype_explanation: 'Based on your booking history...',
  new_start_date: 'March 1, 2026',
  new_end_date: 'December 31, 2026',
  urgency_band: 'red',
  tier_name: 'Priority',
  expected_response_time: '48 hours',
  request_url: 'https://app.splitlease.com/requests/123',
  support_email: 'support@splitlease.com'
});

// Returns: { subject, html, text }
// Send via SendGrid, AWS SES, etc.
```

### Available Templates

- `archetype_request_created` - Pattern 1
- `urgency_alert` - Pattern 2
- `tier_selected` - Pattern 3
- `competitive_bidding` - Pattern 4
- `fee_breakdown_confirmation` - Pattern 5

---

## Testing

### Run All Tests

```bash
deno test 09_integrationTests.test.ts
```

### Test Categories

- ✅ Pattern 1: Archetype Detection (3 tests)
- ✅ Pattern 2: Urgency Calculation (3 tests)
- ✅ Pattern 3: Pricing Tiers (2 tests)
- ✅ Pattern 4: BS+BS Eligibility (3 tests)
- ✅ Pattern 5: Fee Transparency (2 tests)
- ✅ Transaction Classification (3 tests)
- ✅ End-to-End Flows (3 tests)
- ✅ Utility Functions (2 tests)

**Total:** 21 tests

---

## Type Safety

### Import Types

```typescript
import type {
  UserArchetype,
  UrgencyLevel,
  PricingTier,
  RoommatePair,
  FeeBreakdown,
  DateChangeRequest
} from 'types/dateChangeRequest.types.ts';

// Use types for type-safe development
const archetype: UserArchetype = 'BIG_SPENDER';
const urgencyLevel: UrgencyLevel = 'CRITICAL';
```

### Available Types

- `UserArchetype` - BIG_SPENDER, HIGH_FLEX, AVERAGE
- `UrgencyLevel` - CRITICAL, HIGH, MEDIUM, LOW
- `UrgencyBand` - red, orange, yellow, green
- `PriceTierId` - economy, standard, priority, express
- `TransactionType` - BUYOUT, CRASH, SWAP, STANDARD_CHANGE
- `PairingType` - weekday_weekend, weekend_weekday, custom_alternating
- Plus 30+ more comprehensive types

---

## Performance Targets

- **Archetype Detection:** < 200ms
- **Urgency Calculation:** < 100ms
- **Pricing Tiers:** < 150ms
- **BS+BS Eligibility:** < 200ms
- **Full Request Creation:** < 800ms

---

## Troubleshooting

### Common Issues

**Q: Analytics not tracking events**
A: Check that analytics providers (Segment/Mixpanel/GA4) are initialized before calling `identify()`.

**Q: Archetype detection returning AVERAGE**
A: This is the fallback. Check that user has booking history data.

**Q: Tests failing**
A: Ensure Deno is installed: `deno --version`

**Q: TypeScript errors**
A: Make sure to import types from `01_shared_types.ts`

---

## Documentation

- **Complete Technical Docs:** See `00_IMPLEMENTATION_SUMMARY.md`
- **Gap Analysis Reference:** See `C:\Users\igor\scaffolding_plans\GAP_ANALYSIS_AND_ADDITIONAL_SCAFFOLDING.md`
- **Integration Scaffolding:** See `C:\Users\igor\scaffolding_plans\integration_scaffolding.md`

---

## Support

**Need Help?**
- Review `00_IMPLEMENTATION_SUMMARY.md` for complete documentation
- Check `09_integrationTests.test.ts` for usage examples
- Review individual file headers for implementation details

---

**Version:** 1.0
**Last Updated:** 2026-01-28
**Status:** Production-Ready

---

**Ready to deploy!** 🚀
