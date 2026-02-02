# Date Change Email Notifications - Implementation Plan

> **STATUS**: Ready for implementation
> **ESTIMATED COMPLEXITY**: Medium-High (16 templates, cron job, calculations)
> **RELATED DOCUMENT**: `date-change-emails-adapted-requirements.md`

---

## Overview

This plan implements email notifications for date change requests, covering 16 distinct email scenarios across request creation, acceptance, decline, and expiry reminders.

---

## Phase 1: Template Creation (Bubble)

> **Owner**: Bubble Admin / Content Team
> **Dependencies**: None
> **Estimated Time**: 3-4 hours

### 1.1 Create 16 SendGrid Templates

Create the following templates in Bubble's `reference_table.zat_email_html_template_eg_sendbasicemailwf_` table:

| Template ID Suggestion | Scenario | Key Variables |
|------------------------|----------|---------------|
| `DCR_HOST_REMIND_WAITING` | 4.1 Host reminder – Host requested | guest_name, original_dates, proposed_dates, price_adjustment |
| `DCR_HOST_REMIND_RESPOND` | 4.2 Host reminder – Guest requested | guest_name, original_dates, proposed_dates, price_adjustment |
| `DCR_GUEST_REMIND_RESPOND` | 4.3 Guest reminder – Host requested | host_name, original_dates, proposed_dates, price_adjustment |
| `DCR_GUEST_REMIND_WAITING` | 4.4 Guest reminder – Guest requested | host_name, original_dates, proposed_dates, price_adjustment |
| `DCR_HOST_ADD_OFFER_SENT` | 5.1 Host to host – Add offer sent | guest_name, dates_to_add, additional_cost, property_display |
| `DCR_GUEST_ADD_OFFER` | 5.2 Host to guest – Offer to add | host_name, dates_to_add, additional_cost, property_display, host_message |
| `DCR_HOST_REMOVE_SENT` | 6.1 Host to host – Remove request sent | guest_name, dates_to_remove, refund_amount, property_display, host_message |
| `DCR_GUEST_REMOVE_REQ` | 6.2 Host to guest – Remove date request | host_name, dates_to_remove, refund_amount, property_display, host_message |
| `DCR_HOST_SWAP_SENT` | 7.1 Host to host – Swap request sent | guest_name, date_to_add, date_to_remove, price_adjustment, property_display, host_message |
| `DCR_GUEST_SWAP_REQ` | 7.2 Host to guest – Swap request | host_name, date_to_add, date_to_remove, price_adjustment, property_display, host_message |
| `DCR_GUEST_ADD_SENT` | 8.1 Guest to guest – Add request sent | host_name, dates_to_add, additional_cost, property_display |
| `DCR_GUEST_REMOVE_SENT` | 8.2 Guest to guest – Remove request sent | host_name, dates_to_remove, refund_amount, property_display, guest_message |
| `DCR_HOST_REMOVE_ACTION` | 8.3 Guest to host – Remove date action | guest_name, dates_to_remove, booking_reduction, property_display, guest_message |
| `DCR_HOST_SWAP_ACTION` | 8.4 Guest to host – Swap date action | guest_name, date_to_add, date_to_remove, price_adjustment, property_display, guest_message |
| `DCR_GUEST_SWAP_SENT` | 8.5 Guest to guest – Swap request sent | host_name, date_to_add, date_to_remove, price_adjustment, property_display |
| `DCR_GUEST_ADD_ACCEPTED` | 9.1 Guest accepted host's add request | host_name, date_added, final_cost, you_saved, property_display |
| `DCR_HOST_REMOVE_ACCEPTED` | 9.2 Guest accepted host's remove request | guest_name, date_removed, booking_reduction, property_display |
| `DCR_GUEST_ADD_DECLINED` | 10.1 Host declined guest's add request | host_name, date_to_add, property_display, host_message |
| `DCR_HOST_ADD_DECLINED` | 10.2 Host declined guest's add request | guest_name, date_to_add, property_display |

**Template Structure** (use existing BASIC_EMAIL template as base):
```html
<!-- SendGrid Template HTML Structure -->
<div class="email-container">
  <preheader>$$preheadertext$$</preheader>
  <h1>$$title$$</h1>
  <div class="banner">
    <p>$$bannertext1$$</p>
    <p>$$bannertext2$$</p>
    <p>$$bannertext3$$</p>
    <p>$$bannertext4$$</p>
    <p>$$bannertext5$$</p>
  </div>
  <div class="body">$$bodytext$$</div>
  <a href="$$buttonurl$$">$$buttontext$$</a>
  <div class="footer">$$footermessage$$</div>
</div>
```

**Output**: Record all 18 template IDs (note: 18 templates, not 16 - added 2 more for acceptance/decline scenarios)

---

## Phase 2: Utility Functions

> **Owner**: Backend Developer
> **Dependencies**: None
> **Estimated Time**: 2-3 hours

### 2.1 Create Date Formatting Utilities

**File**: `supabase/functions/date-change-request/lib/dateFormatters.ts`

```typescript
/**
 * Format a single date for display in emails
 * Example: "Friday, January 30, 2026"
 */
export function formatEmailDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a date range for display in emails
 * Example: "Jan 1-5, 2026" or "Jan 1 - Feb 3, 2026"
 */
export function formatDateRange(checkIn: string, checkOut: string): string {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  const startFormat = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  const endFormat = end.toLocaleDateString('en-US', {
    month: start.getMonth() === end.getMonth() ? undefined : 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return `${startFormat}${endFormat ? ' - ' + endFormat : ''}, ${start.getFullYear()}`;
}

/**
 * Format multiple dates for display
 * Example: "Jan 5, 2026" or "Jan 5-7, 2026"
 */
export function formatMultipleDates(dates: string[]): string {
  if (dates.length === 0) return '';
  if (dates.length === 1) return formatEmailDate(dates[0]);

  // Sort and check if consecutive
  const sorted = dates.map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
  // TODO: Implement consecutive date detection
  return dates.map(formatEmailDate).join(', ');
}
```

### 2.2 Create Price Calculation Utilities

**File**: `supabase/functions/date-change-request/lib/priceCalculations.ts`

```typescript
/**
 * Calculate price adjustment for display
 * Returns: "No Change", "+$50.00", or "-$120.00"
 */
export function calculatePriceAdjustment(
  originalPrice: number | null,
  newPrice: number | null
): string {
  if (!originalPrice || !newPrice) return 'No Change';
  const diff = newPrice - originalPrice;
  if (Math.abs(diff) < 0.01) return 'No Change';
  return `${diff >= 0 ? '+' : ''}$${diff.toFixed(2)}`;
}

/**
 * Format price for display
 * Returns: "$50.00"
 */
export function formatPrice(price: number | null): string {
  if (!price) return '$0.00';
  return `$${price.toFixed(2)}`;
}

/**
 * Calculate savings percentage and amount
 */
export function calculateSavings(
  price: number | null,
  percentageOfRegular: number | null
): { amount: string; percentage: string } {
  if (!price || !percentageOfRegular) {
    return { amount: '$0.00', percentage: '0%' };
  }

  const regularPrice = price / (percentageOfRegular / 100);
  const savings = regularPrice - price;

  return {
    amount: formatPrice(savings),
    percentage: `${Math.round(percentageOfRegular)}%`
  };
}
```

### 2.3 Create Property Display Builder

**File**: `supabase/functions/date-change-request/lib/propertyDisplay.ts`

```typescript
/**
 * Build property display string from listing data
 * Returns: "123 Main St" or "Beautiful Cozy Apartment (123 Main St)"
 */
export function buildPropertyDisplay(
  name: string | null,
  address: string | null
): string {
  if (address && name) {
    return `${name} (${address})`;
  }
  return address || name || 'Property';
}
```

---

## Phase 3: Update Notification Content Generator

> **Owner**: Backend Developer
> **Dependencies**: Phase 2 (utility functions)
> **Estimated Time**: 3-4 hours

### 3.1 Expand `notificationContent.ts`

**File**: `supabase/functions/date-change-request/lib/notificationContent.ts`

**Changes**:
1. Import new utility functions
2. Add template ID mapping for all 16 scenarios
3. Expand `generateNotificationContent()` to handle:
   - Banner text generation (5 banner fields)
   - Warning labels for expiry notices
   - Conditional message inclusion
4. Add price calculation logic

**New Function Signatures**:

```typescript
export interface EmailTemplateVariables {
  subject: string;
  preheadertext?: string;  // Warning label
  title: string;
  bodytext: string;
  bannertext1?: string;
  bannertext2?: string;
  bannertext3?: string;
  bannertext4?: string;
  bannertext5?: string;
  buttontext: string;
  buttonurl: string;
  footermessage?: string;
}

export function generateEmailTemplateVariables(
  context: NotificationContext,
  recipientRole: 'guest' | 'host',
  isRequester: boolean,
  leaseData: LeaseQueryResult,
  listingData: ListingQueryResult
): EmailTemplateVariables;
```

---

## Phase 4: Reminder Cron Job

> **Owner**: Backend Developer
> **Dependencies**: Phase 3 (notification content)
> **Estimated Time**: 2-3 hours

### 4.1 Create Reminder Cron Edge Function

**File**: `supabase/functions/date-change-reminder-cron/index.ts`

**Functionality**:
1. Query `datechangerequest` table for requests expiring in 1.5-2.5 hours
2. For each request:
   - Check if reminder already sent (add `reminder_sent` boolean to schema? OR use audit table)
   - Determine which reminder to send (4 scenarios based on initiator + status)
   - Call `sendDateChangeRequestNotifications()` with `REMINDER` event
3. Log results to Slack

**Trigger**: External cron job (e.g., GitHub Actions, EasyCron) calling the Edge Function every 15 minutes

**Alternative**: Use Supabase pg_cron if enabled:

```sql
-- Run every 15 minutes
SELECT cron.schedule(
  'date-change-reminder-job',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://[PROJECT].supabase.co/functions/v1/date-change-reminder-cron',
    headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
```

### 4.2 Add Reminder Event Type

**File**: `supabase/functions/date-change-request/lib/types.ts`

```typescript
export type NotificationEvent =
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRING_SOON';  // NEW
```

---

## Phase 5: Integration and Testing

> **Owner**: Full Stack Developer
> **Dependencies**: Phase 1-4
> **Estimated Time**: 4-5 hours

### 5.1 Update Notifications Handler

**File**: `supabase/functions/date-change-request/handlers/notifications.ts`

**Changes**:
1. Import new template ID mappings
2. Update `sendEmailNotification()` to use new `generateEmailTemplateVariables()`
3. Add logic to fetch listing data for property display
4. Integrate price calculations

### 5.2 Update Accept/Decline Handlers

**Files**:
- `supabase/functions/date-change-request/handlers/accept.ts`
- `supabase/functions/date-change-request/handlers/decline.ts`

**Changes**: Ensure acceptance/decline notifications use correct template IDs

### 5.3 Testing Checklist

**Unit Tests**:
- [ ] Date formatting functions (single, range, multiple)
- [ ] Price calculation functions (adjustment, format, savings)
- [ ] Property display builder
- [ ] Template variable generation for all 16 scenarios

**Integration Tests**:
- [ ] Email sending with real SendGrid templates
- [ ] Notification preference checks (on/off)
- [ ] Magic link generation and audit
- [ ] Slack BCC delivery

**E2E Tests**:
- [ ] Host-initiated add date (2 emails)
- [ ] Host-initiated remove date (2 emails)
- [ ] Host-initiated swap date (2 emails)
- [ ] Guest-initiated add date (2 emails)
- [ ] Guest-initiated remove date (2 emails)
- [ ] Guest-initiated swap date (2 emails)
- [ ] Acceptance emails (2 scenarios)
- [ ] Decline emails (2 scenarios)
- [ ] Reminder emails (4 scenarios)

**Cron Job Tests**:
- [ ] Query for expiring requests
- [ ] Send reminder notifications
- [ ] Idempotency (don't send twice)

---

## Phase 6: Deployment

> **Owner**: DevOps
> **Dependencies**: Phase 5 (testing complete)
> **Estimated Time**: 1-2 hours

### 6.1 Deployment Checklist

- [ ] Deploy Edge Function changes to dev environment
- [ ] Create SendGrid templates in dev Bubble
- [ ] Test all 16 email scenarios in dev
- [ ] Deploy reminder cron job to dev
- [ ] Monitor for 24 hours
- [ ] Deploy to production

### 6.2 Monitoring

Add Slack alerts for:
- Failed email sends
- Cron job failures
- Template not found errors
- Missing user data

---

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `supabase/functions/date-change-request/lib/dateFormatters.ts` | Date formatting utilities |
| `supabase/functions/date-change-request/lib/priceCalculations.ts` | Price calculation utilities |
| `supabase/functions/date-change-request/lib/propertyDisplay.ts` | Property display builder |
| `supabase/functions/date-change-reminder-cron/index.ts` | Reminder cron job |
| `supabase/functions/date-change-reminder-cron/deno.json` | Deno config for cron |

### Modified Files

| File | Changes |
|------|---------|
| `supabase/functions/date-change-request/lib/types.ts` | Add EXPIRING_SOON event, EmailTemplateVariables interface |
| `supabase/functions/date-change-request/lib/notificationContent.ts` | Expand to 16 scenarios, add banner generation |
| `supabase/functions/date-change-request/handlers/notifications.ts` | Integrate new utilities, fetch listing data |
| `supabase/functions/_shared/emailUtils.ts` | Add template ID constants (optional, can keep in date-change module) |

### Database Changes

**No schema changes required** - existing tables have all necessary fields.

---

## Implementation Order

```
Phase 2 (Utilities) ──────┐
                         │
Phase 3 (Content) ────────┤──→ Phase 5 (Integration) ──→ Phase 6 (Deploy)
                         │
Phase 1 (Templates) ──────┘

Phase 4 (Cron) ──────────────────────┘ (can be done in parallel)
```

**Critical Path**: Phase 2 → Phase 3 → Phase 5 → Phase 6
**Parallel Work**: Phase 1 (Bubble team), Phase 4 (after Phase 3)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Template IDs incorrect | Create template ID mapping file, validate before deploy |
| Cron job sends duplicates | Add `reminder_sent_at` timestamp to `datechangerequest` table |
| Price calculation errors | Unit tests for all edge cases (null, zero, negative) |
| Missing listing data | Fallback to lease address if listing not found |
| Email sends fail | Fire-and-forget pattern (already in place) |
| User preferences not respected | Reuse existing `getNotificationPreferences()` function |

---

## Success Criteria

1. All 16 email scenarios send correctly with proper variables
2. Reminder cron job runs every 15 minutes without duplicates
3. Users can opt out via `reservation_updates_email` preference
4. Prices and dates format correctly for all locales
5. Zero failures in production for 30 days

---

## Open Questions

1. **Reminder tracking**: Should we add `reminder_sent_at` to `datechangerequest` table?
   - **Recommendation**: Yes, prevents duplicate reminders

2. **Cron implementation**: Use pg_cron or external service?
   - **Recommendation**: External service (GitHub Actions cron) for simpler debugging

3. **Template ownership**: Who creates the 18 SendGrid templates in Bubble?
   - **Recommendation**: Content team with developer review for variable names

4. **Accept/Decline scenarios**: Requirements only cover 2 scenarios (guest accepts host's add/remove)
   - **Question**: What about host accepts guest's requests?
   - **Recommendation**: Clarify with product team, add to templates if needed

---

**END OF IMPLEMENTATION PLAN**
