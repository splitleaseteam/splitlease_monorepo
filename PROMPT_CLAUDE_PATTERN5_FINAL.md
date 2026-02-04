# Pattern 5: Fee Transparency - Final Integration (Claude)

## Context
You are completing the Pattern 5 (Fee Transparency) implementation in the `SL1` workspace. The frontend components have been partially integrated by another agent. Your task is to finish the integration, connect the backend, and ensure everything works end-to-end.

## Work Directory
`c:\Users\Split Lease\My Drive (splitleaseteam@gmail.com)\_Agent Context and Tools\SL1\Split Lease`

## What's Already Done ✅

### Frontend Components (Completed)
1. **Fee Calculation Logic** - `app/src/logic/calculators/feeCalculations.js`
   - 1.5% split model implementation
   - Savings calculation vs. competitors
   
2. **useFeeCalculation Hook** - `app/src/logic/hooks/useFeeCalculation.js`
   - React hook for fee management
   
3. **FeePriceDisplay Component** - `app/src/islands/shared/FeePriceDisplay.jsx` + `.css`
   - Transparent pricing breakdown display
   - Expandable fee details
   
4. **FeeExplainer Modal** - `app/src/islands/shared/FeeExplainer.jsx` + `.css`
   - Educational modal explaining fees

### Backend Blueprints (Ready to Deploy)
All migration and edge function blueprints are in:
`pattern_5/adapted_for_slceo/backend/`

## Your Tasks 🎯

### 1. Complete PaymentStep Component
**Blueprint:** `pattern_5/adapted_for_slceo/frontend/components/PaymentStep.jsx`

- [ ] Copy PaymentStep.jsx to `app/src/islands/shared/PaymentStep.jsx`
- [ ] Adapt styling to use CSS instead of styled-components
- [ ] Integrate Stripe Elements (@stripe/react-stripe-js)
- [ ] Handle 3D Secure authentication
- [ ] Connect to `create-payment-intent` edge function
- [ ] Test payment flow with Stripe test cards

### 2. Integrate Fee Transparency into DateChangeRequestManager
**Current File:** `app/src/islands/shared/DateChangeRequestManager/DateChangeRequestManager.jsx`

**Required Changes:**
- [ ] Import `useFeeCalculation` hook
- [ ] Import `FeePriceDisplay` component  
- [ ] Import `PaymentStep` component
- [ ] Add fee calculation state based on monthly rent
- [ ] Insert FeePriceDisplay in RequestDetails view (before submit)
- [ ] Add new "Payment" step to the flow
- [ ] Update step progression: create → details → **review fees** → **payment** → success
- [ ] Pass fee breakdown data to PaymentStep
- [ ] Update request submission to include fee_breakdown in database

**Integration Point Example:**
```javascript
// In RequestDetails view, after message/price inputs:
import { useFeeCalculation } from '../../logic/hooks/useFeeCalculation';
import FeePriceDisplay from '../FeePriceDisplay';

// Inside component:
const monthlyRent = lease?.['Total Rent'] || baseNightlyPrice;
const { feeBreakdown } = useFeeCalculation(monthlyRent, 'date_change');

// In render:
<FeePriceDisplay 
  basePrice={monthlyRent} 
  transactionType="date_change"
/>
```

### 3. Backend Deployment
**Location:** `pattern_5/adapted_for_slceo/backend/`

#### Migrations (Deploy in Order):
- [ ] `20260130000001_p5_add_user_archetype_fields.sql`
- [ ] `20260130000002_p5_add_datechangerequest_fee_fields.sql`
- [ ] `20260130000003_p5_add_fee_calculation_trigger.sql`
- [ ] `20260130000004_p5_create_webhook_logs.sql`

**Note:** Schema uses `bookings_leases` table with `"Total Rent"` column (Bubble-style).

#### Edge Functions (Deploy to Supabase):
- [ ] `process-date-change-fee/index.ts`
- [ ] `create-payment-intent/index.ts`
- [ ] `stripe-webhook/index.ts`
- [ ] `admin-fee-dashboard/index.ts`

**Environment Variables Required:**
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Stripe Configuration
- [ ] Configure Stripe webhook endpoint: `https://[your-project].supabase.co/functions/v1/stripe-webhook`
- [ ] Enable webhook events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- [ ] Test webhook signature verification

### 5. Testing Checklist
- [ ] Unit test: Fee calculation accuracy (1.5% split model)
- [ ] Unit test: Minimum fee enforcement ($5 minimum)
- [ ] Integration test: Create date change request → view fees → submit
- [ ] Integration test: Payment intent creation
- [ ] Integration test: 3D Secure flow
- [ ] E2E test: Full date change request with payment
- [ ] E2E test: Webhook handling (payment success/failure)
- [ ] Manual test: Multiple transaction types

### 6. Documentation
- [ ] Update `MASTER_MANIFEST.md` with completion status
- [ ] Document Stripe webhook configuration steps
- [ ] Add troubleshooting guide for common payment issues

## Key Technical Notes

1. **Bubble-Style Columns:** Remember to use `"Total Rent"` (with quotes) when querying `bookings_leases`
2. **User ID Mapping:** Functions handle both `_id` and `id` for user identification
3. **Fee Structure Version:** Always use `'1.5_split_model_v1'` for tracking
4. **Stripe Test Cards:**
   - Success: 4242 4242 4242 4242
   - 3D Secure: 4000 0027 6000 3184

## Reference Materials
- **Master Manifest:** `pattern_5/MASTER_MANIFEST.md`
- **Agent Prompts:** `pattern_5/PROMPTS.md` (has your backend section)
- **Blueprints:** `pattern_5/adapted_for_slceo/`

## Success Criteria
When complete, a user should be able to:
1. Initiate a date change request
2. See transparent fee breakdown (1.5% split)
3. Understand what the fee covers (via explainer)
4. Complete payment via Stripe
5. See confirmation and webhook updates

## Motto
Think deeply. Test exhaustively. The fee transparency must be flawless and build trust with users.

---
**Work within:** `SL1/Split Lease/` directory
**Report progress to:** MASTER_MANIFEST.md
