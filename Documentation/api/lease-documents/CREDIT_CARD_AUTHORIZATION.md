# Credit Card Authorization Form - API Documentation

**Created**: 2026-02-04
**Version**: 1.0
**Document Type**: `credit_card_authorization` (two variants: prorated / non-prorated)
**Purpose**: Comprehensive API reference for generating Recurring Credit Card Authorization documents

---

## Table of Contents

- [Overview](#overview)
- [Conditional Variants](#conditional-variants)
- [API Request Schema](#api-request-schema)
- [Field Reference](#field-reference)
  - [Identification Fields](#identification-fields)
  - [Party Information Fields](#party-information-fields)
  - [Duration Fields](#duration-fields)
  - [Payment Fields](#payment-fields)
  - [Proration Fields](#proration-fields)
- [Data Source Tracing](#data-source-tracing)
- [Proration Logic Integration](#proration-logic-integration)
- [TypeScript Interface](#typescript-interface)
- [Example Payloads](#example-payloads)
- [Validation Rules](#validation-rules)
- [Edge Function Integration](#edge-function-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

The **Credit Card Authorization Form** authorizes Split Lease to charge the guest's credit card for recurring rental payments. It documents the payment schedule, amounts, and any proration for partial periods.

### Document Purpose

- Authorizes recurring credit card charges for the lease duration
- Documents the payment schedule (number of payments, amounts)
- Shows first payment total (including damage deposit)
- Details last payment proration when applicable
- Includes Splitlease Credit deductions if applicable

### Key Characteristics

| Aspect | Description |
|--------|-------------|
| **Document Type** | Financial authorization |
| **Primary Focus** | Payment amounts and schedule |
| **Conditional Generation** | Two variants based on `Prorated?` field |
| **Payment Data** | Derived from guest payment records + proration calculation |
| **Cross-References** | Links to Agreement Number |

---

## Conditional Variants

The Credit Card Authorization document has **two workflow paths** based on whether the lease has prorated payments:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CREDIT CARD AUTHORIZATION FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Step 2: Create Fields For Lease Documents                                  │
│     └─ Sets "Prorated?" field based on Last Payment Calculation             │
│                                                                              │
│                         ┌──────────────────────┐                            │
│                         │  Check: Prorated?    │                            │
│                         └──────────────────────┘                            │
│                                   │                                          │
│               ┌───────────────────┴───────────────────┐                     │
│               │                                       │                     │
│               ▼                                       ▼                     │
│  ┌─────────────────────────────┐     ┌─────────────────────────────┐       │
│  │ Step 17: Non-Prorated       │     │ Step 20: Prorated           │       │
│  │ Only when Prorated? is NO   │     │ Only when Prorated? is YES  │       │
│  └─────────────────────────────┘     └─────────────────────────────┘       │
│               │                                       │                     │
│               ▼                                       ▼                     │
│  ┌─────────────────────────────┐     ┌─────────────────────────────┐       │
│  │ Step 18: SUCCESS alert      │     │ Step 21: SUCCESS alert      │       │
│  │ Step 19: ERROR alert        │     │ Step 22: ERROR alert        │       │
│  └─────────────────────────────┘     └─────────────────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Variant Comparison

| Aspect | Non-Prorated (Step 17) | Prorated (Step 20) |
|--------|------------------------|---------------------|
| **Condition** | `Prorated? is no` | `Prorated? is yes` |
| **Last Payment** | Same as regular payments | Reduced based on week pattern |
| **Last Payment Weeks** | Full 4 weeks | Partial (1-3 weeks) |
| **Use Case** | Lease spans full 4-week cycles | Lease has partial final cycle |

### When is a Lease Prorated?

The `Prorated?` field is set by the **Last Payment Calculation** workflow based on the week pattern:

| Week Pattern | Proration Condition | Prorated? |
|--------------|---------------------|-----------|
| **Every week** | `weeks % 4 != 0` | Yes if partial weeks remain |
| **One week on, one week off** | `weeks % 4 <= 2` | Yes if ≤2 weeks remain |
| **Two weeks on, two weeks off** | `weeks % 4 == 1` | Yes only if exactly 1 week remains |
| **One week on, three weeks off** | Never | Always `"no"` |

---

## API Request Schema

### Complete JSON Structure

Both variants use the **same schema** - the difference is in the calculated field values:

```json
{
  "Agreement Number": "string",
  "Host Name": "string",
  "Guest Name": "string",
  "Weeks Number": "string",
  "Listing Description": "string",
  "Number of Payments": "string",
  "Four Week Rent": "string",
  "Damage Deposit": "string",
  "Maintenance Fee": "string",
  "Total First Payment": "string",
  "Penultimate Week Number": "string",
  "Last Payment Rent": "string",
  "Splitlease Credit": "string",
  "Last Payment Weeks": "string"
}
```

### Bubble.io Source Mapping

```json
{
  "Agreement Number": "Result of step 2 (Create a new Fiel...)'s Agreement number:formatted as JSON-safe",
  "Host Name": "Result of step 2 (Create a new Fiel...)'s Host name:formatted as JSON-safe",
  "Guest Name": "Result of step 2 (Create a new Fiel...)'s Guest name:formatted as JSON-safe",
  "Weeks Number": "Result of step 2 (Create a new Fiel...)'s Number of weeks:formatted as JSON-safe",
  "Listing Description": "Result of step 2 (Create a new Fiel...)'s Listing Description:formatted as JSON-safe",
  "Number of Payments": "Result of step 2 (Create a new Fiel...)'s Number of Payments (guest):formatted as JSON-safe",
  "Four Week Rent": "Result of step 2 (Create a new Fiel...)'s 4 week rent:formatted as JSON-safe",
  "Damage Deposit": "Result of step 2 (Create a new Fiel...)'s Damage Deposit:formatted as JSON-safe",
  "Maintenance Fee": "Result of step 2 (Create a new Fiel...)'s Maintenance fee:formatted as JSON-safe",
  "Total First Payment": "Result of step 2 (Create a new Fiel...)'s Total First Payment:formatted as JSON-safe",
  "Penultimate Week Number": "Result of step 2 (Create a new Fiel...)'s Penultimate Week Number:formatted as JSON-safe",
  "Last Payment Rent": "Result of step 2 (Create a new Fiel...)'s Last Payment Rent:formatted as JSON-safe",
  "Splitlease Credit": "Result of step 2 (Create a new Fiel...)'s Splitlease Credit:formatted as JSON-safe",
  "Last Payment Weeks": "Result of step 2 (Create a new Fiel...)'s Last Payment Weeks:formatted as JSON-safe"
}
```

---

## Field Reference

### Identification Fields

| API Field | Type | JSON-Safe | Source Field | Description |
|-----------|------|-----------|--------------|-------------|
| `Agreement Number` | string | Yes | `Agreement number` | Unique lease identifier (e.g., "AGR-12345") |

---

### Party Information Fields

| API Field | Type | JSON-Safe | Source Field | Description |
|-----------|------|-----------|--------------|-------------|
| `Host Name` | string | Yes | `Host name` | Host's full legal name |
| `Guest Name` | string | Yes | `Guest name` | Guest's full legal name (cardholder) |

---

### Duration Fields

| API Field | Type | JSON-Safe | Source Field | Description |
|-----------|------|-----------|--------------|-------------|
| `Weeks Number` | string | Yes | `Number of weeks` | Total reservation span in weeks |
| `Listing Description` | string | Yes | `Listing Description` | Property description |
| `Number of Payments` | string | Yes | `Number of Payments (guest)` | Total number of payment cycles |

**Number of Payments Calculation**:
```javascript
// For Weekly/Nightly rentals
const numberOfPayments = Math.ceil(reservationSpanWeeks / 4);

// For Monthly rentals
const numberOfPayments = Math.ceil(reservationSpanMonths);
```

---

### Payment Fields

| API Field | Type | JSON-Safe | Source Field | Description |
|-----------|------|-----------|--------------|-------------|
| `Four Week Rent` | string | Yes | `4 week rent` | Regular rent per 4-week period |
| `Damage Deposit` | string | Yes | `Damage Deposit` | Refundable damage deposit |
| `Maintenance Fee` | string | Yes | `Maintenance fee` | Per-period cleaning/maintenance fee |
| `Total First Payment` | string | Yes | `Total First Payment` | First payment total (rent + maintenance + deposit) |
| `Splitlease Credit` | string | Yes | `Splitlease Credit` | Credit/discount amount applied |

**Total First Payment Calculation**:
```javascript
// First guest payment includes:
// - Rent for first period
// - Maintenance fee
// - Damage deposit (refundable)
const totalFirstPayment = fourWeekRent + maintenanceFee + damageDeposit;
```

---

### Proration Fields

These fields are critical for the prorated variant and come from the **Last Payment Calculation** workflow:

| API Field | Type | JSON-Safe | Source Field | Description |
|-----------|------|-----------|--------------|-------------|
| `Penultimate Week Number` | string | Yes | `Penultimate Week Number` | Number of the second-to-last payment |
| `Last Payment Rent` | string | Yes | `Last Payment Rent` | Rent amount for final payment (may be reduced) |
| `Last Payment Weeks` | string | Yes | `Last Payment Weeks` | Number of weeks in final payment period |

**Penultimate Week Number Calculation**:
```javascript
// The payment number before the last one
const penultimateWeekNumber = numberOfPayments - 1;
```

**Last Payment Values by Week Pattern**:

| Week Pattern | Proration Condition | Last Payment Weeks | Last Payment Rent |
|--------------|---------------------|--------------------|--------------------|
| **Every week** | `weeks % 4 != 0` | `weeks % 4` (1-3) | `(weeks % 4) / 4 * fourWeekRent` |
| **One week on, one week off** | `weeks % 4 <= 2` | `weeks % 4` (0-2) | `fourWeekRent / 2` |
| **Two weeks on, two weeks off** | `weeks % 4 < 2` | `weeks % 4` (0-1) | `fourWeekRent / 2` |
| **One week on, three weeks off** | Never | `4` | `fourWeekRent` |

---

## Data Source Tracing

### Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA SOURCE HIERARCHY                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SUPABASE TABLES                    FIELDS FOR LEASE DOCUMENTS               │
│  ─────────────────                  ──────────────────────────               │
│                                                                              │
│  bookings_leases                                                             │
│    └─ Agreement Number ────────────► Agreement number ──► Agreement Number   │
│                                                                              │
│  user (Host via proposal)                                                    │
│    └─ Name - Full ─────────────────► Host name ──► Host Name                 │
│                                                                              │
│  user (Guest)                                                                │
│    └─ Name - Full ─────────────────► Guest name ──► Guest Name               │
│                                                                              │
│  proposal                                                                    │
│    ├─ hc reservation span (weeks) ─► Number of weeks ──► Weeks Number        │
│    ├─ hc 4 week rent ──────────────► 4 week rent ──► Four Week Rent          │
│    ├─ hc damage deposit ───────────► Damage Deposit ──► Damage Deposit       │
│    └─ hc cleaning fee ─────────────► Maintenance fee ──► Maintenance Fee     │
│                                                                              │
│  listing                                                                     │
│    └─ Description ─────────────────► Listing Description ──► Listing Desc    │
│                                                                              │
│  COMPUTED (from payment records)                                             │
│    └─ Count of guest payments ─────► Number of Payments (guest) ──► Number   │
│                                                                              │
│  COMPUTED (from calculation)                                                 │
│    ├─ rent + maint + deposit ──────► Total First Payment                     │
│    └─ numberOfPayments - 1 ────────► Penultimate Week Number                 │
│                                                                              │
│  LAST PAYMENT CALCULATION WORKFLOW                                           │
│    ├─ lastPaymentWeeks ────────────► Last Payment Weeks                      │
│    ├─ lastPaymentRent ─────────────► Last Payment Rent                       │
│    └─ prorated ────────────────────► Prorated? (determines variant)          │
│                                                                              │
│  EXTERNAL/INPUT                                                              │
│    └─ User's credit balance ───────► Splitlease Credit                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Proration Logic Integration

### How Proration Fields Are Populated

The `Last Payment Weeks`, `Last Payment Rent`, and `Prorated?` fields are populated by the **Last Payment Calculation** workflow (documented in PAYMENT_RECORDS_COMPREHENSIVE_GUIDE.md).

```typescript
/**
 * Last Payment Calculation
 * Sets fields for Credit Card Authorization
 */

type WeekPattern =
  | 'Every week'
  | 'One week on, one week off'
  | 'Two weeks on, two weeks off'
  | 'One week on, three weeks off';

interface LastPaymentResult {
  lastPaymentWeeks: number;
  lastPaymentRent: number;
  prorated: boolean | string;
}

function calculateLastPayment(
  weekPattern: WeekPattern,
  reservationSpanWeeks: number,
  fourWeekRent: number
): LastPaymentResult {
  const remainingWeeks = reservationSpanWeeks % 4;

  switch (weekPattern) {
    case 'Every week':
      return {
        lastPaymentWeeks: remainingWeeks === 0 ? 4 : remainingWeeks,
        lastPaymentRent: (remainingWeeks === 0 ? 4 : remainingWeeks) * (fourWeekRent / 4),
        prorated: remainingWeeks !== 0,
      };

    case 'One week on, one week off':
      return {
        lastPaymentWeeks: remainingWeeks <= 2 ? remainingWeeks : 4,
        lastPaymentRent: remainingWeeks <= 2 ? fourWeekRent / 2 : fourWeekRent,
        prorated: remainingWeeks <= 2,
      };

    case 'Two weeks on, two weeks off':
      return {
        lastPaymentWeeks: remainingWeeks < 2 ? remainingWeeks : 4,
        lastPaymentRent: remainingWeeks < 2 ? fourWeekRent / 2 : fourWeekRent,
        prorated: remainingWeeks === 1,
      };

    case 'One week on, three weeks off':
      return {
        lastPaymentWeeks: 4,
        lastPaymentRent: fourWeekRent,
        prorated: 'no', // String literal
      };
  }
}
```

### Conditional Document Generation

```typescript
// In Bubble.io workflow, after Last Payment Calculation

if (fieldsForLeaseDocuments['Prorated?'] === false ||
    fieldsForLeaseDocuments['Prorated?'] === 'no') {
  // Step 17: Generate Non-Prorated Credit Card Authorization
  await generateCreditCardAuth('non_prorated', payload);
} else {
  // Step 20: Generate Prorated Credit Card Authorization
  await generateCreditCardAuth('prorated', payload);
}
```

---

## TypeScript Interface

### Request Payload Interface

```typescript
/**
 * Credit Card Authorization API Request Payload
 * Document Type: credit_card_authorization
 * Used for both prorated and non-prorated variants
 */
export interface CreditCardAuthorizationPayload {
  // Identification
  'Agreement Number': string;

  // Parties
  'Host Name': string;
  'Guest Name': string;

  // Duration
  'Weeks Number': string;
  'Listing Description': string;
  'Number of Payments': string;

  // Payment Amounts
  'Four Week Rent': string;
  'Damage Deposit': string;
  'Maintenance Fee': string;
  'Total First Payment': string;
  'Splitlease Credit': string;

  // Proration Fields
  'Penultimate Week Number': string;
  'Last Payment Rent': string;
  'Last Payment Weeks': string;
}

/**
 * Fields For Lease Documents - Credit Card Auth relevant fields
 */
export interface FieldsForLeaseDocumentsCreditCardAuth {
  // Identification
  'Agreement number': string;

  // Parties
  'Host name': string;
  'Guest name': string;

  // Duration
  'Number of weeks': number;
  'Listing Description': string;
  'Number of Payments (guest)': number;

  // Payment Amounts
  '4 week rent': string;  // Currency formatted
  'Damage Deposit': string;  // Currency formatted
  'Maintenance fee': string;  // Currency formatted
  'Total First Payment': string;  // Currency formatted
  'Splitlease Credit': number;

  // Proration Fields (from Last Payment Calculation)
  'Penultimate Week Number': number;
  'Last Payment Rent': string;  // Currency formatted
  'Last Payment Weeks': number;
  'Prorated?': boolean | string;  // Determines which variant to call
}
```

### Builder Function

```typescript
/**
 * Build Credit Card Authorization payload from Fields For Lease Documents
 */
function buildCreditCardAuthPayload(
  fields: FieldsForLeaseDocumentsCreditCardAuth
): CreditCardAuthorizationPayload {
  // Helper for JSON-safe formatting
  const jsonSafe = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  };

  return {
    // Identification
    'Agreement Number': jsonSafe(fields['Agreement number']),

    // Parties
    'Host Name': jsonSafe(fields['Host name']),
    'Guest Name': jsonSafe(fields['Guest name']),

    // Duration
    'Weeks Number': jsonSafe(fields['Number of weeks']),
    'Listing Description': jsonSafe(fields['Listing Description']),
    'Number of Payments': jsonSafe(fields['Number of Payments (guest)']),

    // Payment Amounts
    'Four Week Rent': jsonSafe(fields['4 week rent']),
    'Damage Deposit': jsonSafe(fields['Damage Deposit']),
    'Maintenance Fee': jsonSafe(fields['Maintenance fee']),
    'Total First Payment': jsonSafe(fields['Total First Payment']),
    'Splitlease Credit': jsonSafe(fields['Splitlease Credit']),

    // Proration Fields
    'Penultimate Week Number': jsonSafe(fields['Penultimate Week Number']),
    'Last Payment Rent': jsonSafe(fields['Last Payment Rent']),
    'Last Payment Weeks': jsonSafe(fields['Last Payment Weeks']),
  };
}

/**
 * Determine which variant to generate based on Prorated? field
 */
function getCreditCardAuthVariant(
  fields: FieldsForLeaseDocumentsCreditCardAuth
): 'prorated' | 'non_prorated' {
  const prorated = fields['Prorated?'];

  // Handle both boolean and string values
  if (prorated === false || prorated === 'no' || prorated === '') {
    return 'non_prorated';
  }
  return 'prorated';
}
```

---

## Example Payloads

### Example 1: Non-Prorated (8-Week Lease, Every Week Pattern)

**Condition**: `Prorated? is no` (8 weeks = 2 full 4-week cycles)

```json
{
  "Agreement Number": "AGR-78542",
  "Host Name": "John Smith",
  "Guest Name": "Sarah Johnson",
  "Weeks Number": "8",
  "Listing Description": "Cozy Midtown Studio - Perfect for Business Travel. A beautifully furnished studio in the heart of Manhattan.",
  "Number of Payments": "2",
  "Four Week Rent": "2,000.00",
  "Damage Deposit": "500.00",
  "Maintenance Fee": "150.00",
  "Total First Payment": "2,650.00",
  "Penultimate Week Number": "1",
  "Last Payment Rent": "2,000.00",
  "Splitlease Credit": "0",
  "Last Payment Weeks": "4"
}
```

**Calculation Breakdown**:
- 8 weeks ÷ 4 = 2 payments (no remainder)
- Not prorated (8 % 4 = 0)
- Total First Payment: $2,000 + $150 + $500 = $2,650
- Last Payment Rent: Full $2,000 (same as regular payment)
- Last Payment Weeks: Full 4 weeks

---

### Example 2: Prorated (10-Week Lease, Every Week Pattern)

**Condition**: `Prorated? is yes` (10 weeks = 2 full cycles + 2 week partial)

```json
{
  "Agreement Number": "AGR-91203",
  "Host Name": "Maria O'Connor",
  "Guest Name": "James Williams",
  "Weeks Number": "10",
  "Listing Description": "Spacious 2BR Upper West Side - Near Central Park. Stunning 2-bedroom apartment with park views.",
  "Number of Payments": "3",
  "Four Week Rent": "2,000.00",
  "Damage Deposit": "1,000.00",
  "Maintenance Fee": "200.00",
  "Total First Payment": "3,200.00",
  "Penultimate Week Number": "2",
  "Last Payment Rent": "1,000.00",
  "Splitlease Credit": "50",
  "Last Payment Weeks": "2"
}
```

**Calculation Breakdown**:
- 10 weeks ÷ 4 = 3 payments (2 remainder)
- Prorated (10 % 4 = 2)
- Total First Payment: $2,000 + $200 + $1,000 = $3,200
- Last Payment Rent: 2/4 × $2,000 = $1,000 (prorated)
- Last Payment Weeks: 2 weeks (partial cycle)
- Splitlease Credit: $50 discount applied

---

### Example 3: Non-Prorated (One Week On, Three Weeks Off Pattern)

**Condition**: `Prorated? is no` (This pattern NEVER prorates)

```json
{
  "Agreement Number": "AGR-45678",
  "Host Name": "David Chen",
  "Guest Name": "Emily Brown",
  "Weeks Number": "11",
  "Listing Description": "Executive Suite Downtown - Weekly Stay. Perfect for consultants visiting the city one week per month.",
  "Number of Payments": "3",
  "Four Week Rent": "1,500.00",
  "Damage Deposit": "400.00",
  "Maintenance Fee": "100.00",
  "Total First Payment": "2,000.00",
  "Penultimate Week Number": "2",
  "Last Payment Rent": "1,500.00",
  "Splitlease Credit": "0",
  "Last Payment Weeks": "4"
}
```

**Calculation Breakdown**:
- 11 weeks (pattern: one week on, three weeks off)
- NEVER prorated for this pattern
- Last Payment Rent: Full $1,500 (always full rent)
- Last Payment Weeks: 4 (always full cycle)

---

### Example 4: Prorated (9-Week Lease, One Week On, One Week Off Pattern)

**Condition**: `Prorated? is yes` (9 % 4 = 1, which is ≤ 2)

```json
{
  "Agreement Number": "AGR-33221",
  "Host Name": "Lisa Park",
  "Guest Name": "Michael Davis",
  "Weeks Number": "9",
  "Listing Description": "Modern Loft Brooklyn - Flexible Schedule. Ideal for alternating week stays.",
  "Number of Payments": "3",
  "Four Week Rent": "1,800.00",
  "Damage Deposit": "600.00",
  "Maintenance Fee": "125.00",
  "Total First Payment": "2,525.00",
  "Penultimate Week Number": "2",
  "Last Payment Rent": "900.00",
  "Splitlease Credit": "25",
  "Last Payment Weeks": "1"
}
```

**Calculation Breakdown**:
- 9 weeks, pattern: one week on, one week off
- 9 % 4 = 1, condition (≤ 2) is true → Prorated
- Last Payment Rent: $1,800 / 2 = $900 (half rent for ≤2 remaining weeks)
- Last Payment Weeks: 1

---

## Validation Rules

### Required Fields

| Field | Rule |
|-------|------|
| `Agreement Number` | Non-empty, format `AGR-{digits}` |
| `Host Name` | Non-empty string |
| `Guest Name` | Non-empty string (cardholder name) |
| `Weeks Number` | Positive integer as string |
| `Number of Payments` | Positive integer as string |
| `Four Week Rent` | Currency formatted, > 0 |
| `Damage Deposit` | Currency formatted, ≥ 0 |
| `Total First Payment` | Currency formatted, > 0 |
| `Last Payment Rent` | Currency formatted, > 0 |
| `Last Payment Weeks` | Integer 1-4 as string |

### Validation Function

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateCreditCardAuthPayload(
  payload: CreditCardAuthorizationPayload,
  variant: 'prorated' | 'non_prorated'
): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!payload['Agreement Number']) {
    errors.push('Agreement Number is required');
  }
  if (!payload['Host Name']) {
    errors.push('Host Name is required');
  }
  if (!payload['Guest Name']) {
    errors.push('Guest Name is required (cardholder name)');
  }
  if (!payload['Weeks Number'] || parseInt(payload['Weeks Number']) <= 0) {
    errors.push('Weeks Number must be a positive integer');
  }
  if (!payload['Number of Payments'] || parseInt(payload['Number of Payments']) <= 0) {
    errors.push('Number of Payments must be a positive integer');
  }

  // Payment validation
  const fourWeekRent = parseCurrency(payload['Four Week Rent']);
  if (fourWeekRent <= 0) {
    errors.push('Four Week Rent must be greater than 0');
  }

  const damageDeposit = parseCurrency(payload['Damage Deposit']);
  if (damageDeposit < 0) {
    errors.push('Damage Deposit cannot be negative');
  }

  const totalFirstPayment = parseCurrency(payload['Total First Payment']);
  if (totalFirstPayment <= 0) {
    errors.push('Total First Payment must be greater than 0');
  }

  // Proration field validation
  const lastPaymentWeeks = parseInt(payload['Last Payment Weeks']);
  if (lastPaymentWeeks < 1 || lastPaymentWeeks > 4) {
    errors.push('Last Payment Weeks must be between 1 and 4');
  }

  const lastPaymentRent = parseCurrency(payload['Last Payment Rent']);
  if (lastPaymentRent <= 0) {
    errors.push('Last Payment Rent must be greater than 0');
  }

  // Variant-specific validation
  if (variant === 'non_prorated') {
    // For non-prorated, last payment should equal regular payment
    if (lastPaymentRent !== fourWeekRent) {
      errors.push('Non-prorated: Last Payment Rent should equal Four Week Rent');
    }
    if (lastPaymentWeeks !== 4) {
      errors.push('Non-prorated: Last Payment Weeks should be 4');
    }
  } else {
    // For prorated, last payment should be less than or equal to regular
    if (lastPaymentRent > fourWeekRent) {
      errors.push('Prorated: Last Payment Rent should not exceed Four Week Rent');
    }
  }

  // Logical consistency
  const numberOfPayments = parseInt(payload['Number of Payments']);
  const penultimate = parseInt(payload['Penultimate Week Number']);
  if (penultimate !== numberOfPayments - 1) {
    errors.push(`Penultimate Week Number should be ${numberOfPayments - 1}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function parseCurrency(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace(/,/g, ''));
}
```

---

## Edge Function Integration

### Calling the lease-documents Edge Function

```typescript
/**
 * Generate Credit Card Authorization via Edge Function
 */
async function generateCreditCardAuthorization(
  leaseId: string,
  fields: FieldsForLeaseDocumentsCreditCardAuth,
  supabase: SupabaseClient
): Promise<DocumentGenerationResult> {
  // Determine variant based on Prorated? field
  const variant = getCreditCardAuthVariant(fields);

  // Build the payload
  const payload = buildCreditCardAuthPayload(fields);

  // Validate before sending
  const validation = validateCreditCardAuthPayload(payload, variant);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Call the edge function with variant-specific document type
  const documentType = variant === 'prorated'
    ? 'credit_card_authorization_prorated'
    : 'credit_card_authorization';

  const { data, error } = await supabase.functions.invoke('lease-documents', {
    body: {
      action: 'generate',
      payload: {
        documentType,
        leaseId,
        data: payload,
      },
    },
  });

  if (error) {
    throw new Error(`Document generation failed: ${error.message}`);
  }

  return {
    filename: data.filename,
    driveUrl: data.driveUrl,
    storageUrl: data.storageUrl,
  };
}
```

### Bubble.io Workflow Integration

```javascript
// Step 17: Non-Prorated (Only when Prorated? is no)
if (result_of_step_2['Prorated?'] === false || result_of_step_2['Prorated?'] === 'no') {
  const payload = buildCreditCardAuthPayload(result_of_step_2);
  await callPythonAnywhereService('*Create Recurring Credit Card Authorisation Non Prorated', payload);
}

// Step 20: Prorated (Only when Prorated? is yes)
if (result_of_step_2['Prorated?'] === true || result_of_step_2['Prorated?'] === 'yes') {
  const payload = buildCreditCardAuthPayload(result_of_step_2);
  await callPythonAnywhereService('*Create Recurring Credit Card Authorisation Prorated', payload);
}
```

---

## Troubleshooting

### Issue: Wrong variant being generated

**Symptom**: Non-prorated document generated when it should be prorated (or vice versa).

**Cause**: `Prorated?` field not correctly set by Last Payment Calculation workflow.

**Solution**:
1. Verify the Last Payment Calculation workflow ran before document generation
2. Check the week pattern and reservation span:
```javascript
// Debug: Check proration condition
const weekPattern = proposal['hc weeks schedule'];
const weeks = proposal['hc reservation span (weeks)'];
const remainder = weeks % 4;
console.log(`Pattern: ${weekPattern}, Weeks: ${weeks}, Remainder: ${remainder}`);

// Check what Prorated? should be
const expectedProrated = calculateLastPayment(weekPattern, weeks, rent).prorated;
console.log(`Expected Prorated?: ${expectedProrated}`);
```

---

### Issue: Last Payment Rent showing full amount when it should be prorated

**Symptom**: Prorated variant called but Last Payment Rent equals Four Week Rent.

**Cause**: Last Payment Calculation workflow didn't update the field correctly.

**Solution**:
1. Verify the Last Payment Rent calculation:
   - Every week: `(weeks % 4) / 4 * fourWeekRent`
   - One on/off: `fourWeekRent / 2` if `weeks % 4 <= 2`
   - Two on/off: `fourWeekRent / 2` if `weeks % 4 < 2`
2. Check for rounding issues in currency formatting

---

### Issue: Total First Payment incorrect

**Symptom**: Total First Payment doesn't match expected calculation.

**Cause**: One of the component values (rent, maintenance, deposit) is incorrect.

**Solution**:
1. Verify the formula: `Total First Payment = Four Week Rent + Maintenance Fee + Damage Deposit`
2. Check each component field:
```javascript
console.log(`Four Week Rent: ${fields['4 week rent']}`);
console.log(`Maintenance Fee: ${fields['Maintenance fee']}`);
console.log(`Damage Deposit: ${fields['Damage Deposit']}`);
console.log(`Expected Total: ${parseFloat(fourWeekRent) + parseFloat(maintenanceFee) + parseFloat(damageDeposit)}`);
console.log(`Actual Total: ${fields['Total First Payment']}`);
```

---

### Issue: Penultimate Week Number is wrong

**Symptom**: Penultimate Week Number doesn't equal (Number of Payments - 1).

**Cause**: Field calculation error or Number of Payments incorrect.

**Solution**:
1. Verify Number of Payments calculation: `Math.ceil(reservationSpanWeeks / 4)`
2. Penultimate should always be: `Number of Payments - 1`
3. For 1 payment, penultimate is 0 (edge case)

---

### Issue: Splitlease Credit showing as empty or undefined

**Symptom**: Splitlease Credit field is empty when it should have a value.

**Cause**: The Splitlease Credit field uses Boolean Formatting to default to 0 when empty.

**Solution**:
1. Check the Boolean Formatting logic in Step 2:
   - If `Splitlease Credits's value is empty` → Output `0`
   - Else → Output the actual value
2. Ensure the credit value is fetched from the user's account

---

## Related Documentation

- [PAYMENT_RECORDS_COMPREHENSIVE_GUIDE.md](./PAYMENT_RECORDS_COMPREHENSIVE_GUIDE.md) - Complete workflow including Last Payment Calculation
- [HOST_PAYOUT_SCHEDULE_FORM.md](./HOST_PAYOUT_SCHEDULE_FORM.md) - Host payment document
- [PERIODIC_TENANCY_AGREEMENT.md](./PERIODIC_TENANCY_AGREEMENT.md) - Main lease agreement
- [Edge Functions README](../edge-functions/README.md) - Edge function API reference

---

**License**: Proprietary - Split Lease LLC
