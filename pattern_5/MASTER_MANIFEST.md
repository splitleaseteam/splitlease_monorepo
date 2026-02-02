# Pattern 5: Fee Transparency - MASTER MANIFEST

This manifest provides a comprehensive map of all Pattern 5 work centralized within the `SL1` workspace for specialized agents and the final integration agent.

## Workspace Information
**Primary Workspace:** `SL1/Split Lease/`
**Work Directory:** `SL1/Split Lease/pattern_5/`

## Directory Structure (Adapted Blueprints)
All blueprints in `adapted_for_slceo/` have been verified for schema compatibility with the target project (e.g., using `bookings_leases` and `"Total Rent"` mapping).

```
SL1/Split Lease/pattern_5/
├── adapted_for_slceo/
│   ├── backend/
│   │   ├── migrations/
│   │   │   ├── 20260130000001_p5_add_user_archetype_fields.sql
│   │   │   ├── 20260130000002_p5_add_datechangerequest_fee_fields.sql
│   │   │   ├── 20260130000003_p5_add_fee_calculation_trigger.sql
│   │   │   ├── 20260130000004_p5_create_webhook_logs.sql
│   │   │   ├── 20260130000005_p5_backfill_user_archetypes.sql  ← NEW
│   │   │   └── 20260130000006_p5_backfill_datechangerequest_fees.sql  ← NEW
│   │   └── functions/
│   │       ├── process-date-change-fee/index.ts
│   │       ├── create-payment-intent/index.ts
│   │       ├── stripe-webhook/index.ts  ← ENHANCED (full refund handling)
│   │       └── admin-fee-dashboard/index.ts
│   └── frontend/
│       ├── components/
│       │   ├── FeeExplainer.jsx
│       │   ├── FeePriceDisplay.jsx
│       │   ├── PaymentStep.jsx
│       │   └── DateChangeRequestManager.jsx
│       ├── hooks/
│       │   └── useFeeCalculation.js
│       └── logic/
│           └── feeCalculations.js
├── backend/ (Original Pattern 5 Source)
├── frontend/ (Original Pattern 5 Source)
└── PROMPTS.md (Instructions for Specialized Agents)
```

## Agent Roles & Work Strategy

### 1. Claude Code (Backend Specialist)
- **Role:** Finalize and test the 1.5% split fee infrastructure.
- **Source:** Pull logic from `adapted_for_slceo/backend/`.
- **Environment:** Must work strictly within the `SL1` folder.

### 2. OpenCode (Frontend Specialist)
- **Role:** Integrate and polish the transparent fee UI.
- **Source:** Pull components from `adapted_for_slceo/frontend/`.
- **Environment:** Must work strictly within the `SL1` folder.

### 3. Final Integration Agent
- **Role:** Ensure all components from `SL1` are correctly synchronized and functional.
- **Constraint:** Use the blueprints in `adapted_for_slceo/` as the verified "Gold Standard".

## Security & Keys
- **Stripe:** Use `STRIPE_PUBLISHABLE_KEY` from `window.ENV`.
- **Supabase:** Ensure RLS policies in migrations are strictly followed.
- **Webhook:** `STRIPE_WEBHOOK_SECRET` required for signature verification.

## Migration Deployment Order (CRITICAL)

Run migrations in this exact order:

| Order | File | Description | Table Affected |
|-------|------|-------------|----------------|
| 1 | `20260130000001_p5_add_user_archetype_fields.sql` | Add archetype columns | `public.user` |
| 2 | `20260130000002_p5_add_datechangerequest_fee_fields.sql` | Add fee tracking columns | `public.datechangerequest` |
| 3 | `20260130000003_p5_add_fee_calculation_trigger.sql` | Auto-calculate fees | Trigger on `datechangerequest` |
| 4 | `20260130000004_p5_create_webhook_logs.sql` | Webhook event logging | `public.webhook_logs` |
| 5 | `20260130000005_p5_backfill_user_archetypes.sql` | Backfill historical archetypes | `public.user` |
| 6 | `20260130000006_p5_backfill_datechangerequest_fees.sql` | Backfill historical fees | `public.datechangerequest` |

## Bubble-Style Column Mapping

| Standard Name | Bubble-Style Name | Table |
|--------------|-------------------|-------|
| `leases` | `bookings_leases` | - |
| `monthly_rent` | `"Total Rent"` | `bookings_leases` |
| `user_id` | `"Tenant"` | various |

## Webhook Events Handled

| Event | Handler | Action |
|-------|---------|--------|
| `payment_intent.succeeded` | ✅ | Update `payment_status = 'paid'` |
| `payment_intent.payment_failed` | ✅ | Update `payment_status = 'failed'` |
| `payment_intent.canceled` | ✅ | Update `payment_status = 'unpaid'` |
| `charge.refunded` | ✅ | Update `payment_status = 'refunded'` (full) or keep `'paid'` (partial) |

## Test Coverage

| Test Suite | Tests | Location |
|------------|-------|----------|
| Fee Calculations | 20 | `backend/tests/fee-calculations.test.ts` |
| Database Triggers | 6 | `backend/tests/database-triggers.test.sql` |
| Edge Functions | 15 | `backend/tests/edge-functions.test.ts` |
| **Total** | **41** | - |

## Frontend Integration Status (COMPLETED)

### Integrated Components in Main App

| Component | Source | Target | Status |
|-----------|--------|--------|--------|
| `PaymentStep.jsx` | Blueprint | `app/src/islands/shared/PaymentStep.jsx` | ✅ Created |
| `PaymentStep.css` | N/A | `app/src/islands/shared/PaymentStep.css` | ✅ Created |
| `DateChangeRequestManager.jsx` | Existing | Updated with fee integration | ✅ Modified |
| `RequestDetails.jsx` | Existing | Updated with FeePriceDisplay | ✅ Modified |
| `DateChangeRequestManager.css` | Existing | Added payment styles | ✅ Modified |

### Integration Details

#### New User Flow (Pattern 5)
```
create → details (with fee display) → payment (Stripe) → success
```

#### Key Changes Made

1. **DateChangeRequestManager.jsx**
   - Added imports: `useFeeCalculation`, `FeePriceDisplay`, `PaymentStep`
   - Added `feeBreakdown` state from `useFeeCalculation` hook
   - Added `payment` view with Stripe integration
   - Added `handleProceedToPayment`, `handlePaymentSuccess`, `handlePaymentError`
   - Updated flow: details → payment → success

2. **RequestDetails.jsx**
   - Added `FeePriceDisplay` import
   - Added `feeBreakdown` and `isFeeCalculating` props
   - Displays fee breakdown before "Continue to Payment" button
   - Button text updated: "Submit Request" → "Continue to Payment"

3. **PaymentStep.jsx** (New)
   - Converted from styled-components to CSS
   - Fixed bug: `breakdown.totalPrice` → `feeBreakdown.totalPrice`
   - Integrated with Stripe Elements (@stripe/react-stripe-js)
   - 3D Secure authentication support
   - Connects to `create-payment-intent` edge function

4. **CSS Updates**
   - Added `.dcr-payment-container` styles
   - Added `.dcr-fee-section` styles
   - Added `.dcr-fee-loading` styles

### Environment Variables Required

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Stripe Test Cards

| Type | Card Number |
|------|-------------|
| Success | 4242 4242 4242 4242 |
| 3D Secure | 4000 0027 6000 3184 |
| Declined | 4000 0000 0000 0002 |

---
*Created by Antigravity - Advanced Agentic Coding Team*
*Updated: 2026-01-29 by Claude Code (Final Integration Agent)*
