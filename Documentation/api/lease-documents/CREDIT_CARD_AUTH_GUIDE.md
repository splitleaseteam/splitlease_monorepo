# Recurring Credit Card Authorization - API Guide

**Document Type**: Credit Card Authorization (Prorated & Non-Prorated)
**Edge Function**: `lease-documents`
**Action**: `generateCreditCardAuth`
**Handler**: `generateCreditCardAuth.ts`
**Templates**:
- Prorated: `recurringcreditcardauthorizationprorated.docx`
- Non-Prorated: `recurringcreditcardauthorization.docx`

**Last Updated**: 2026-02-04
**Version**: 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Business Context](#business-context)
3. [Prorated vs Non-Prorated Logic](#prorated-vs-non-prorated-logic)
4. [API Reference](#api-reference)
5. [Field Reference](#field-reference)
6. [Payment Calculations](#payment-calculations)
7. [Implementation Guide](#implementation-guide)
8. [Validation Rules](#validation-rules)
9. [Testing & Examples](#testing--examples)
10. [Troubleshooting](#troubleshooting)
11. [Related Documentation](#related-documentation)

---

## Overview

The **Recurring Credit Card Authorization** document is a legal form that authorizes Split Lease to charge the guest's credit card on a recurring basis for rent payments throughout the lease period. This document comes in **two variants**:

1. **Prorated**: Used when the last payment is less than the first payment (partial final period)
2. **Non-Prorated**: Used when all payments are the same amount (standard recurring payments)

### Document Purpose

- **Legal Authorization**: Guest authorizes recurring credit card charges
- **Payment Schedule**: Defines the payment structure (first, subsequent, last payments)
- **Financial Transparency**: Shows breakdown of rent, fees, deposits, and credits
- **Compliance**: Meets NYC rental payment authorization requirements

### Document Lifecycle

```
Guest Payment Records → isProrated Calculation → Template Selection → Document Generation → Google Drive Upload
                                                                                          ↓
                                                                                  Supabase Storage (Fallback)
```

---

## Business Context

### When This Document Is Generated

The Credit Card Authorization document is generated during the **lease creation process** after:

1. ✅ Guest accepts a proposal
2. ✅ All lease terms are finalized (check-in, check-out, rent, fees)
3. ✅ Guest payment records are calculated and stored
4. ✅ `Fields For Lease Documents` preparation step completes in Bubble workflow

### Business Rules

| Rule | Description |
|------|-------------|
| **Required for All Leases** | Every lease MUST have a Credit Card Authorization |
| **One Document Per Lease** | Each lease gets exactly one authorization (prorated OR non-prorated) |
| **Template Auto-Selection** | System automatically selects template based on `Is Prorated` flag |
| **Payment Schedule Reflection** | Document MUST match the actual payment schedule from guest payment records |
| **Currency Precision** | All amounts rounded down to 2 decimal places (e.g., $1028.589 → $1028.58) |

### Conditional Triggers

The Credit Card Authorization is triggered from the Bubble.io workflow:

**Workflow Step**: `PythonAnywhere Service - *Create Recurring Credit Card Authorization Prorated`

**Conditional**: `Only when Result of step 2 (Create a new Fields For Lease Documents)'s Prorated? is yes`

This means:
- **Prorated Template**: Called when `fields.isProrated === true`
- **Non-Prorated Template**: Called when `fields.isProrated === false`

---

## Prorated vs Non-Prorated Logic

### What Is "Prorated"?

A lease is **prorated** when the guest's final payment is less than their initial payments. This typically occurs when:

- Guest moves in mid-month (partial first month)
- Guest moves out mid-month (partial last month)
- Lease duration doesn't align with full payment periods

### Calculation Logic

The `isProrated` flag is calculated from guest payment records:

```typescript
isProrated = (guestPayments.length > 1) &&
             (lastPayment.Rent < firstPayment.Rent)
```

**Conditions**:
1. **Multiple Payments**: At least 2 payment records exist
2. **Last < First**: The last payment's rent amount is less than the first payment's rent amount

### Examples

#### Prorated Scenario

```typescript
// Guest Payment Records
[
  { Rent: 1000.00 },  // First payment
  { Rent: 1000.00 },  // Middle payment
  { Rent: 1000.00 },  // Middle payment
  { Rent: 400.00 }    // Last payment (partial month)
]

// Result
isProrated = true  // Because 400.00 < 1000.00
Template: recurringcreditcardauthorizationprorated.docx
```

#### Non-Prorated Scenario

```typescript
// Guest Payment Records
[
  { Rent: 1000.00 },  // First payment
  { Rent: 1000.00 },  // Middle payment
  { Rent: 1000.00 },  // Last payment
]

// Result
isProrated = false  // Because 1000.00 === 1000.00
Template: recurringcreditcardauthorization.docx
```

### Template Differences

| Field/Section | Prorated Template | Non-Prorated Template |
|---------------|-------------------|----------------------|
| **Last Payment Calculation** | Shows prorated amount (e.g., $400.00) | Shows full amount (same as recurring) |
| **Payment Schedule Language** | "...and a final payment of $XXX for the last [X] week(s)" | "...recurring payments of $XXX" |
| **Number of Payments** | Explicitly shows total payment count | May not emphasize count |
| **Last Payment Weeks** | Shows partial weeks (e.g., "1 week") | Not applicable |

---

## API Reference

### Endpoint

```
POST https://splitlease-backend.supabase.co/functions/v1/lease-documents
```

### Request Headers

```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <access_token>",
  "apikey": "<supabase_anon_key>"
}
```

### Request Body

```typescript
{
  "action": "generateCreditCardAuth",
  "payload": {
    "Agreement Number": string,      // REQUIRED: Lease agreement number
    "Host Name": string,              // Host's full name
    "Guest Name": string,             // Guest's full name
    "Four Week Rent": string,         // 4-week rent amount (e.g., "1028.58")
    "Maintenance Fee": string,        // Maintenance fee per payment (e.g., "50.00")
    "Damage Deposit": string,         // One-time damage deposit (e.g., "500.00")
    "Splitlease Credit": string,      // Credit applied to last payment (e.g., "0")
    "Last Payment Rent": string,      // Rent amount for final payment (e.g., "400.00")
    "Weeks Number": string,           // Total weeks in lease (e.g., "12")
    "Listing Description": string,    // Property description
    "Penultimate Week Number": string, // Week number before last (e.g., "11")
    "Number of Payments": string,     // Total number of payments (e.g., "4")
    "Last Payment Weeks": string,     // Weeks covered by last payment (e.g., "1")
    "Is Prorated": boolean            // true = prorated, false = non-prorated
  }
}
```

### Response Format

#### Success Response (200 OK)

```json
{
  "success": true,
  "filename": "recurring_credit_card_auth-prorated-AG-123456.docx",
  "driveUrl": "https://drive.google.com/file/d/abc123/view",
  "drive_url": "https://drive.google.com/file/d/abc123/view",
  "web_view_link": "https://drive.google.com/file/d/abc123/view",
  "fileId": "abc123",
  "file_id": "abc123",
  "returned_error": "no"
}
```

#### Error Response (400/500)

```json
{
  "success": false,
  "error": "Agreement Number is required",
  "returned_error": "yes"
}
```

---

## Field Reference

### Input Fields (13 Required + 1 Flag)

| Field Name | Type | Source | Required | Example | Description |
|------------|------|--------|----------|---------|-------------|
| `Agreement Number` | string | `bookings_leases."Agreement Number"` | ✅ Yes | `"AG-123456"` | Unique lease identifier |
| `Host Name` | string | `users.name` (host) | No | `"John Smith"` | Host's full legal name |
| `Guest Name` | string | `users.name` (guest) | No | `"Jane Doe"` | Guest's full legal name |
| `Four Week Rent` | string | `guest_payment_records.Rent` (first) | No | `"1028.58"` | Standard 4-week rent amount |
| `Maintenance Fee` | string | `guest_payment_records."Total Paid by Guest" - Rent` | No | `"50.00"` | Recurring maintenance fee |
| `Damage Deposit` | string | `proposals."Damage Deposit"` | No | `"500.00"` | One-time refundable deposit |
| `Splitlease Credit` | string | Calculated | No | `"0"` | Credit applied to last payment |
| `Last Payment Rent` | string | `guest_payment_records.Rent` (last) | No | `"400.00"` | Final payment rent amount |
| `Weeks Number` | string | `proposals."Number of Weeks"` | No | `"12"` | Total lease duration in weeks |
| `Listing Description` | string | `listings."Description of listing"` | No | `"Cozy studio in Manhattan"` | Property description |
| `Penultimate Week Number` | string | Calculated: `numberOfGuestPayments - 1` | No | `"11"` | Week before final payment |
| `Number of Payments` | string | `guest_payment_records.count()` | No | `"4"` | Total number of payments |
| `Last Payment Weeks` | string | Calculated based on prorating | No | `"1"` | Weeks covered by last payment |
| `Is Prorated` | boolean | Calculated: `lastRent < firstRent` | No | `true` | Template selection flag |

### Payment Calculation Fields (Auto-Generated)

These fields are **calculated by the Edge Function** and do NOT need to be provided in the payload:

| Field | Formula | Example |
|-------|---------|---------|
| `totalFirstPayment` | `fourWeekRent + maintenanceFee + damageDeposit` | `$1578.58` |
| `totalSecondPayment` | `fourWeekRent + maintenanceFee` | `$1078.58` |
| `totalLastPayment` | `lastPaymentRent + maintenanceFee - splitleaseCredit` | `$450.00` |

### Template Variable Mapping

The Edge Function transforms input fields (space-separated keys) into template variables (snake_case):

| Input Field (API) | Template Variable (docxtpl) | Type | Example |
|-------------------|----------------------------|------|---------|
| `Agreement Number` | `agreement_number` | string | `"AG-123456"` |
| `Host Name` | `host_name` | string | `"John Smith"` |
| `Guest Name` | `guest_name` | string | `"Jane Doe"` |
| `Four Week Rent` | `fourweekrent` | currency | `"1,028.58"` |
| `Maintenance Fee` | `maintenancefee` | currency | `"50.00"` |
| `Damage Deposit` | `damagedeposit` | currency | `"500.00"` |
| `Splitlease Credit` | `slcredit` | currency | `"0.00"` |
| `Last Payment Rent` | `lastpaymentrent` | currency | `"400.00"` |
| `Weeks Number` | `weeks_number` | string | `"12"` |
| `Listing Description` | `ListingDescription` | string | `"Cozy studio"` |
| `Penultimate Week Number` | `penultimateweeknumber` | string | `"11"` |
| `Number of Payments` | `numberofpayments` | string | `"4"` |
| `Last Payment Weeks` | `lastpaymentweeks` | string | `"1"` |
| *(calculated)* | `totalfirstpayment` | currency | `"1,578.58"` |
| *(calculated)* | `totalsecondpayment` | currency | `"1,078.58"` |
| *(calculated)* | `lastpaymenttotal` | currency | `"450.00"` |

---

## Payment Calculations

### Calculation Logic

The Edge Function performs the following calculations for all currency fields:

```typescript
interface PaymentCalculationInput {
  fourWeekRent: string;
  maintenanceFee: string;
  damageDeposit: string;
  splitleaseCredit: string;
  lastPaymentRent: string;
}

interface PaymentCalculationResult {
  fourWeekRent: number;
  maintenanceFee: number;
  damageDeposit: number;
  splitleaseCredit: number;
  lastPaymentRent: number;
  totalFirstPayment: number;
  totalSecondPayment: number;
  totalLastPayment: number;
}
```

### Step-by-Step Process

#### 1. Parse Currency Strings

All input amounts are parsed from strings (e.g., `"1,028.58"`, `"1028.58"`, `"$1028.58"`) to numbers:

```typescript
function parseCurrency(value: string): number | null {
  // Remove currency symbols, commas, spaces
  const cleaned = value.replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}
```

**Examples**:
- `"1,028.58"` → `1028.58`
- `"$500"` → `500`
- `"50.00"` → `50`

#### 2. Round Down to 2 Decimal Places

All parsed amounts are rounded down (floor) to 2 decimal places:

```typescript
function roundDown(value: number): number {
  return Math.floor(value * 100) / 100;
}
```

**Examples**:
- `1028.589` → `1028.58` (NOT `1028.59`)
- `500.001` → `500.00`
- `49.999` → `49.99`

#### 3. Calculate Payment Totals

Using the rounded amounts, calculate the three payment totals:

```typescript
// First Payment: Rent + Maintenance + Deposit
totalFirstPayment = roundDown(
  roundedFourWeekRent + roundedMaintenanceFee + roundedDamageDeposit
);

// Second Payment (and all middle payments): Rent + Maintenance
totalSecondPayment = roundDown(
  roundedFourWeekRent + roundedMaintenanceFee
);

// Last Payment: Last Rent + Maintenance - Credit
totalLastPayment = roundDown(
  roundedLastPaymentRent + roundedMaintenanceFee - roundedSplitleaseCredit
);
```

### Calculation Examples

#### Example 1: Prorated Lease (4 payments)

**Input**:
```json
{
  "Four Week Rent": "1028.58",
  "Maintenance Fee": "50.00",
  "Damage Deposit": "500.00",
  "Splitlease Credit": "0",
  "Last Payment Rent": "400.00"
}
```

**Calculations**:
```typescript
// Parse and round
fourWeekRent = 1028.58
maintenanceFee = 50.00
damageDeposit = 500.00
splitleaseCredit = 0.00
lastPaymentRent = 400.00

// Calculate totals
totalFirstPayment = roundDown(1028.58 + 50.00 + 500.00) = 1578.58
totalSecondPayment = roundDown(1028.58 + 50.00) = 1078.58
totalLastPayment = roundDown(400.00 + 50.00 - 0.00) = 450.00
```

**Payment Schedule**:
1. **Payment 1 (First)**: $1,578.58 (rent + fee + deposit)
2. **Payment 2**: $1,078.58 (rent + fee)
3. **Payment 3**: $1,078.58 (rent + fee)
4. **Payment 4 (Last)**: $450.00 (prorated rent + fee)

#### Example 2: Non-Prorated Lease (3 payments)

**Input**:
```json
{
  "Four Week Rent": "1200.00",
  "Maintenance Fee": "75.00",
  "Damage Deposit": "600.00",
  "Splitlease Credit": "0",
  "Last Payment Rent": "1200.00"
}
```

**Calculations**:
```typescript
// Parse and round
fourWeekRent = 1200.00
maintenanceFee = 75.00
damageDeposit = 600.00
splitleaseCredit = 0.00
lastPaymentRent = 1200.00  // Same as first!

// Calculate totals
totalFirstPayment = roundDown(1200.00 + 75.00 + 600.00) = 1875.00
totalSecondPayment = roundDown(1200.00 + 75.00) = 1275.00
totalLastPayment = roundDown(1200.00 + 75.00 - 0.00) = 1275.00  // Same as second
```

**Payment Schedule**:
1. **Payment 1 (First)**: $1,875.00 (rent + fee + deposit)
2. **Payment 2**: $1,275.00 (rent + fee)
3. **Payment 3 (Last)**: $1,275.00 (rent + fee) ← **Same amount, non-prorated**

### Currency Formatting for Template

After calculations, all amounts are formatted for the Word template:

```typescript
function formatCurrencyRaw(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
```

**Examples**:
- `1578.58` → `"1,578.58"`
- `450` → `"450.00"`
- `1078.58` → `"1,078.58"`

---

## Implementation Guide

### Step 1: Determine Prorated Status

Before calling the API, determine if the lease is prorated:

```typescript
// From Guest Payment Records
const guestPayments = await fetchGuestPaymentRecords(leaseId);

const isProrated = (guestPayments.length > 1) &&
  (guestPayments[guestPayments.length - 1].Rent < guestPayments[0].Rent);

console.log(`Lease is ${isProrated ? 'PRORATED' : 'NON-PRORATED'}`);
```

### Step 2: Prepare Payload from Database

Use the `Fields For Lease Documents` data to build the payload:

```typescript
async function buildCreditCardAuthPayload(
  fields: FieldsForLeaseDocuments
): Promise<CreditCardAuthPayload> {
  return {
    'Agreement Number': fields.agreementNumber,
    'Host Name': fields.hostName,
    'Guest Name': fields.guestName,
    'Four Week Rent': fields.fourWeekRent,
    'Maintenance Fee': fields.maintenanceFee,
    'Damage Deposit': fields.damageDeposit,
    'Splitlease Credit': '0',  // Usually 0, calculate from proposal if applicable
    'Last Payment Rent': fields.lastPaymentRent,
    'Weeks Number': fields.numberOfWeeks.toString(),
    'Listing Description': fields.listingDescription,
    'Penultimate Week Number': fields.penultimateWeekNumber.toString(),
    'Number of Payments': fields.numberOfGuestPayments.toString(),
    'Last Payment Weeks': '1',  // Calculate based on prorating logic
    'Is Prorated': fields.isProrated,
  };
}
```

### Step 3: Call the Edge Function

```typescript
import { supabase } from './lib/supabase';

async function generateCreditCardAuth(
  payload: CreditCardAuthPayload
): Promise<DocumentResult> {
  const { data, error } = await supabase.functions.invoke('lease-documents', {
    body: {
      action: 'generateCreditCardAuth',
      payload,
    },
  });

  if (error) {
    throw new Error(`Failed to generate Credit Card Auth: ${error.message}`);
  }

  return data;
}
```

### Step 4: Handle Response

```typescript
try {
  const result = await generateCreditCardAuth(payload);

  if (result.success) {
    console.log('✅ Credit Card Authorization generated');
    console.log(`📄 Filename: ${result.filename}`);
    console.log(`🔗 View: ${result.driveUrl || result.drive_url}`);
    console.log(`🆔 File ID: ${result.fileId || result.file_id}`);

    // Template type check
    if (result.filename.includes('prorated')) {
      console.log('📋 Template: PRORATED');
    } else {
      console.log('📋 Template: NON-PRORATED');
    }
  } else {
    console.error('❌ Generation failed:', result.error);
  }
} catch (error) {
  console.error('❌ API call failed:', error.message);
}
```

### Step 5: Store Document References

After successful generation, store the document metadata:

```typescript
// Update the lease record with document references
const { error: updateError } = await supabase
  .from('bookings_leases')
  .update({
    'Credit Card Auth Document': result.driveUrl,
    'Credit Card Auth File ID': result.fileId,
    'Credit Card Auth Template': payload['Is Prorated'] ? 'prorated' : 'non-prorated',
  })
  .eq('_id', leaseId);

if (updateError) {
  console.error('Failed to store document reference:', updateError);
}
```

### Step 6: Verify Upload

The Edge Function uses a fail-safe upload pattern:

1. **Primary**: Upload to Google Drive
2. **Fallback**: Upload to Supabase Storage (if Drive fails)
3. **Error**: Both uploads fail → returns error

Check which upload succeeded:

```typescript
if (result.driveUrl && result.driveUrl.includes('drive.google.com')) {
  console.log('✅ Uploaded to Google Drive');
} else if (result.driveUrl && result.driveUrl.includes('supabase.co')) {
  console.log('⚠️ Uploaded to Supabase Storage (Drive failed)');
  // Consider retrying Drive upload or notifying admin
}
```

### Step 7: Bubble.io Workflow Integration

In Bubble.io, the workflow triggers the API call conditionally:

**Step**: `PythonAnywhere Service - *Create Recurring Credit Card Authorization Prorated`

**Body (JSON object)**:
```json
{
  "Agreement Number": "Result of step 2 (Create a new Fields For Lease Documents)'s Agreement number",
  "Host Name": "Result of step 2 (Create a new Fields For Lease Documents)'s Host Name:formatted as JSON-safe",
  "Guest Name": "Result of step 2 (Create a new Fields For Lease Documents)'s Guest Name:formatted as JSON-safe",
  "Weeks Number": "Result of step 2 (Create a new Fields For Lease Documents)'s Weeks Number:formatted as JSON-safe",
  "Listing Description": "Result of step 2 (Create a new Fields For Lease Documents)'s Listing Description:formatted as JSON-safe",
  "Number of Payments": "Result of step 2 (Create a new Fields For Lease Documents)'s Number of Payments (guest):formatted as 1028.58",
  "Four Week Rent": "Result of step 2 (Create a new Fields For Lease Documents)'s Four Week Rent:formatted as JSON-safe",
  "Damage Deposit": "Result of step 2 (Create a new Fields For Lease Documents)'s Damage Deposit:formatted as JSON-safe",
  "Maintenance Fee": "Result of step 2 (Create a new Fields For Lease Documents)'s Maintenance Fee:formatted as JSON-safe",
  "Penultimate Week Number": "Result of step 2 (Create a new Fields For Lease Documents)'s Penultimate Week Number:formatted as JSON-safe",
  "Last Payment Rent": "Result of step 2 (Create a new Fields For Lease Documents)'s Last Payment Rent:formatted as JSON-safe",
  "Splitlease Credit": "Result of step 2 (Create a new Fields For Lease Documents)'s Splitlease Credit:formatted as JSON-safe",
  "Last Payment Weeks": "Result of step 2 (Create a new Fields For Lease Documents)'s Last Payment Weeks:formatted as 1028.58"
}
```

**Conditional Trigger**:
```
Only when Result of step 2 (Create a new Fields For Lease Documents)'s Prorated? is yes
```

This means Bubble dynamically populates all fields from the "Fields For Lease Documents" preparation step and only triggers this workflow when `isProrated === true`.

---

## Validation Rules

### Pre-Call Validation (Client-Side)

Before calling the API, validate the following:

```typescript
function validateCreditCardAuthPayload(payload: CreditCardAuthPayload): string[] {
  const errors: string[] = [];

  // Required field
  if (!payload['Agreement Number']) {
    errors.push('Agreement Number is required');
  }

  // Currency validation
  const currencyFields = [
    'Four Week Rent',
    'Maintenance Fee',
    'Damage Deposit',
    'Splitlease Credit',
    'Last Payment Rent',
  ];

  currencyFields.forEach((field) => {
    const value = payload[field as keyof CreditCardAuthPayload];
    if (value && typeof value === 'string') {
      const cleaned = value.replace(/[$,\s]/g, '');
      if (isNaN(parseFloat(cleaned))) {
        errors.push(`${field} must be a valid currency amount`);
      }
    }
  });

  // Logical validation
  if (payload['Is Prorated'] !== undefined && typeof payload['Is Prorated'] !== 'boolean') {
    errors.push('Is Prorated must be a boolean');
  }

  return errors;
}
```

### Runtime Validation (Edge Function)

The Edge Function validates the payload before processing:

```typescript
// validators.ts
export function validateCreditCardAuthPayload(payload: unknown): CreditCardAuthPayload {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Payload is required and must be an object');
  }

  const p = payload as Record<string, unknown>;

  // Only Agreement Number is strictly required
  if (!p['Agreement Number']) {
    throw new ValidationError('Agreement Number is required');
  }

  // Validate currency field
  if (p['Four Week Rent']) {
    try {
      const cleanValue = String(p['Four Week Rent']).replace(',', '');
      if (isNaN(parseFloat(cleanValue))) {
        throw new ValidationError(
          `Invalid currency value for Four Week Rent: ${p['Four Week Rent']}`
        );
      }
    } catch {
      throw new ValidationError(
        `Invalid currency value for Four Week Rent: ${p['Four Week Rent']}`
      );
    }
  }

  // Parse Is Prorated (boolean or string)
  let isProrated: boolean | undefined;
  if (p['Is Prorated'] !== undefined) {
    if (typeof p['Is Prorated'] === 'boolean') {
      isProrated = p['Is Prorated'];
    } else if (typeof p['Is Prorated'] === 'string') {
      isProrated = p['Is Prorated'].toLowerCase() === 'true';
    }
  }

  return {
    'Agreement Number': requireString(p['Agreement Number'], 'Agreement Number'),
    'Host Name': optionalString(p['Host Name']),
    'Guest Name': optionalString(p['Guest Name']),
    'Four Week Rent': optionalString(p['Four Week Rent']),
    'Maintenance Fee': optionalString(p['Maintenance Fee']),
    'Damage Deposit': optionalString(p['Damage Deposit']),
    'Splitlease Credit': optionalString(p['Splitlease Credit']),
    'Last Payment Rent': optionalString(p['Last Payment Rent']),
    'Weeks Number': optionalString(p['Weeks Number']),
    'Listing Description': optionalString(p['Listing Description']),
    'Penultimate Week Number': optionalString(p['Penultimate Week Number']),
    'Number of Payments': optionalString(p['Number of Payments']),
    'Last Payment Weeks': optionalString(p['Last Payment Weeks']),
    'Is Prorated': isProrated,
  };
}
```

### Validation Error Handling

```typescript
try {
  const result = await generateCreditCardAuth(payload);
} catch (error) {
  if (error.name === 'ValidationError') {
    // Handle validation errors (400)
    console.error('Validation failed:', error.message);
    // Show user-friendly error message
  } else {
    // Handle other errors (500)
    console.error('Server error:', error.message);
    // Show generic error message
  }
}
```

---

## Testing & Examples

### Test Case 1: Minimal Prorated (Required Fields Only)

**Scenario**: Lease with only Agreement Number and `Is Prorated` set to `true`.

**Input**:
```json
{
  "action": "generateCreditCardAuth",
  "payload": {
    "Agreement Number": "AG-TEST-001",
    "Is Prorated": true
  }
}
```

**Expected Output**:
```json
{
  "success": true,
  "filename": "recurring_credit_card_auth-prorated-AG-TEST-001.docx",
  "driveUrl": "https://drive.google.com/file/d/.../view",
  "fileId": "...",
  "returned_error": "no"
}
```

**Document**: Prorated template with empty/default values for all optional fields.

---

### Test Case 2: Complete Prorated Lease

**Scenario**: Full 12-week prorated lease with 4 payments.

**Input**:
```json
{
  "action": "generateCreditCardAuth",
  "payload": {
    "Agreement Number": "AG-123456",
    "Host Name": "John Smith",
    "Guest Name": "Jane Doe",
    "Four Week Rent": "1028.58",
    "Maintenance Fee": "50.00",
    "Damage Deposit": "500.00",
    "Splitlease Credit": "0",
    "Last Payment Rent": "400.00",
    "Weeks Number": "12",
    "Listing Description": "Cozy studio apartment in Manhattan with exposed brick, hardwood floors, and modern kitchen. Walking distance to subway.",
    "Penultimate Week Number": "11",
    "Number of Payments": "4",
    "Last Payment Weeks": "1",
    "Is Prorated": true
  }
}
```

**Expected Calculated Values**:
```typescript
totalFirstPayment: 1578.58  // 1028.58 + 50.00 + 500.00
totalSecondPayment: 1078.58  // 1028.58 + 50.00
totalLastPayment: 450.00     // 400.00 + 50.00 - 0
```

**Expected Output**:
```json
{
  "success": true,
  "filename": "recurring_credit_card_auth-prorated-AG-123456.docx",
  "driveUrl": "https://drive.google.com/file/d/abc123/view",
  "drive_url": "https://drive.google.com/file/d/abc123/view",
  "web_view_link": "https://drive.google.com/file/d/abc123/view",
  "fileId": "abc123",
  "file_id": "abc123",
  "returned_error": "no"
}
```

**Document Verification**:
- ✅ Template: `recurringcreditcardauthorizationprorated.docx`
- ✅ Agreement Number: `AG-123456`
- ✅ Host Name: `John Smith`
- ✅ Guest Name: `Jane Doe`
- ✅ First Payment: `$1,578.58`
- ✅ Recurring Payments (2nd-3rd): `$1,078.58`
- ✅ Last Payment: `$450.00`
- ✅ Total Payments: `4`

---

### Test Case 3: Complete Non-Prorated Lease

**Scenario**: Full 12-week non-prorated lease with 3 payments (same amount).

**Input**:
```json
{
  "action": "generateCreditCardAuth",
  "payload": {
    "Agreement Number": "AG-789012",
    "Host Name": "Alice Johnson",
    "Guest Name": "Bob Williams",
    "Four Week Rent": "1200.00",
    "Maintenance Fee": "75.00",
    "Damage Deposit": "600.00",
    "Splitlease Credit": "0",
    "Last Payment Rent": "1200.00",
    "Weeks Number": "12",
    "Listing Description": "Modern 1-bedroom apartment in Brooklyn with balcony, dishwasher, and in-unit laundry.",
    "Penultimate Week Number": "2",
    "Number of Payments": "3",
    "Last Payment Weeks": "4",
    "Is Prorated": false
  }
}
```

**Expected Calculated Values**:
```typescript
totalFirstPayment: 1875.00  // 1200.00 + 75.00 + 600.00
totalSecondPayment: 1275.00  // 1200.00 + 75.00
totalLastPayment: 1275.00    // 1200.00 + 75.00 - 0 (SAME AS SECOND)
```

**Expected Output**:
```json
{
  "success": true,
  "filename": "recurring_credit_card_auth-nonprorated-AG-789012.docx",
  "driveUrl": "https://drive.google.com/file/d/xyz789/view",
  "drive_url": "https://drive.google.com/file/d/xyz789/view",
  "web_view_link": "https://drive.google.com/file/d/xyz789/view",
  "fileId": "xyz789",
  "file_id": "xyz789",
  "returned_error": "no"
}
```

**Document Verification**:
- ✅ Template: `recurringcreditcardauthorization.docx` (non-prorated)
- ✅ Agreement Number: `AG-789012`
- ✅ Host Name: `Alice Johnson`
- ✅ Guest Name: `Bob Williams`
- ✅ First Payment: `$1,875.00`
- ✅ Recurring Payments (2nd-3rd): `$1,275.00` (SAME AMOUNT)
- ✅ Total Payments: `3`

---

### Test Case 4: Currency Rounding Validation

**Scenario**: Verify proper rounding down of currency values.

**Input**:
```json
{
  "action": "generateCreditCardAuth",
  "payload": {
    "Agreement Number": "AG-ROUND-001",
    "Four Week Rent": "1028.589",
    "Maintenance Fee": "50.001",
    "Damage Deposit": "500.999",
    "Splitlease Credit": "0",
    "Last Payment Rent": "400.555",
    "Is Prorated": true
  }
}
```

**Expected Calculations**:
```typescript
// Parse and round DOWN
fourWeekRent = 1028.58  // NOT 1028.59
maintenanceFee = 50.00  // NOT 50.01
damageDeposit = 500.99  // NOT 501.00
lastPaymentRent = 400.55  // NOT 400.56

// Calculate totals
totalFirstPayment = roundDown(1028.58 + 50.00 + 500.99) = 1579.57
totalSecondPayment = roundDown(1028.58 + 50.00) = 1078.58
totalLastPayment = roundDown(400.55 + 50.00 - 0) = 450.55
```

**Template Output**:
- ✅ First Payment: `$1,579.57` (not `$1,579.58`)
- ✅ Second Payment: `$1,078.58`
- ✅ Last Payment: `$450.55` (not `$450.56`)

---

### Test Case 5: Missing Required Field

**Scenario**: Payload missing `Agreement Number`.

**Input**:
```json
{
  "action": "generateCreditCardAuth",
  "payload": {
    "Host Name": "John Doe",
    "Is Prorated": true
  }
}
```

**Expected Output**:
```json
{
  "success": false,
  "error": "Agreement Number is required",
  "returned_error": "yes"
}
```

---

### Test Case 6: Invalid Currency Value

**Scenario**: Invalid currency format for `Four Week Rent`.

**Input**:
```json
{
  "action": "generateCreditCardAuth",
  "payload": {
    "Agreement Number": "AG-INVALID-001",
    "Four Week Rent": "invalid-amount",
    "Is Prorated": false
  }
}
```

**Expected Output**:
```json
{
  "success": false,
  "error": "Invalid currency value for Four Week Rent: invalid-amount",
  "returned_error": "yes"
}
```

---

## Troubleshooting

### Issue 1: Wrong Template Selected

**Symptom**: Prorated lease gets non-prorated template (or vice versa).

**Possible Causes**:
1. `Is Prorated` field not set correctly in payload
2. Guest payment records calculation error
3. Last payment rent incorrectly calculated

**Debug Steps**:
```typescript
// 1. Verify guest payment records
const guestPayments = await fetchGuestPaymentRecords(leaseId);
console.log('Guest Payments:', guestPayments);

// 2. Verify isProrated calculation
const firstRent = guestPayments[0]?.Rent || 0;
const lastRent = guestPayments[guestPayments.length - 1]?.Rent || 0;
const isProrated = guestPayments.length > 1 && lastRent < firstRent;
console.log(`First Rent: ${firstRent}, Last Rent: ${lastRent}, Is Prorated: ${isProrated}`);

// 3. Check payload
console.log('Payload Is Prorated:', payload['Is Prorated']);
```

**Solution**:
- Ensure `Is Prorated` field matches the actual payment schedule
- Recalculate guest payment records if incorrect

---

### Issue 2: Payment Calculations Incorrect

**Symptom**: Template shows wrong payment amounts.

**Possible Causes**:
1. Currency parsing error (invalid format)
2. Rounding logic not applied
3. Missing or incorrect input values

**Debug Steps**:
```typescript
// 1. Log all input values
console.log('Four Week Rent:', payload['Four Week Rent']);
console.log('Maintenance Fee:', payload['Maintenance Fee']);
console.log('Damage Deposit:', payload['Damage Deposit']);
console.log('Splitlease Credit:', payload['Splitlease Credit']);
console.log('Last Payment Rent:', payload['Last Payment Rent']);

// 2. Manually calculate expected values
const fourWeekRent = parseCurrency(payload['Four Week Rent']);
const maintenanceFee = parseCurrency(payload['Maintenance Fee']);
const damageDeposit = parseCurrency(payload['Damage Deposit']);
const expectedFirst = roundDown(fourWeekRent + maintenanceFee + damageDeposit);
console.log('Expected First Payment:', expectedFirst);

// 3. Compare with Edge Function result
console.log('Actual First Payment (from template):', actualFirst);
```

**Solution**:
- Verify all currency inputs use valid formats (`"1028.58"`, `"1,028.58"`, or `"$1028.58"`)
- Check that rounding is applied correctly (floor, not round)

---

### Issue 3: Document Upload Fails

**Symptom**: Both Google Drive and Supabase Storage uploads fail.

**Possible Causes**:
1. Google Drive credentials invalid
2. Supabase Storage bucket permissions incorrect
3. Document generation error (template rendering)

**Debug Steps**:
```typescript
// 1. Check Edge Function logs
supabase functions logs lease-documents

// 2. Look for specific errors
// Google Drive error example:
[generateCreditCardAuth] Drive upload failed: Invalid credentials

// Supabase Storage error example:
[generateCreditCardAuth] Supabase upload failed: Bucket not found

// 3. Test uploads independently
const testDoc = Buffer.from('test content');
await uploadToGoogleDrive(testDoc, 'test.docx');
await uploadToSupabaseStorage(supabase, testDoc, 'test.docx', 'test_bucket');
```

**Solution**:
- **Google Drive**: Verify service account credentials and folder permissions
- **Supabase Storage**: Verify bucket exists and RLS policies allow uploads
- **Template Rendering**: Check template file exists in Supabase Storage

---

### Issue 4: Filename Incorrect

**Symptom**: Generated filename doesn't match expected format.

**Expected Format**:
- Prorated: `recurring_credit_card_auth-prorated-{Agreement Number}.docx`
- Non-Prorated: `recurring_credit_card_auth-nonprorated-{Agreement Number}.docx`

**Possible Causes**:
1. `Is Prorated` field not set
2. Agreement Number contains invalid characters

**Debug Steps**:
```typescript
// 1. Check Is Prorated value
console.log('Is Prorated:', payload['Is Prorated']);

// 2. Check Agreement Number
console.log('Agreement Number:', payload['Agreement Number']);

// 3. Verify filename construction
const proratedSuffix = payload['Is Prorated'] ? 'prorated' : 'nonprorated';
const expectedFilename = `recurring_credit_card_auth-${proratedSuffix}-${payload['Agreement Number']}.docx`;
console.log('Expected Filename:', expectedFilename);
```

**Solution**:
- Ensure `Is Prorated` is set to `true` or `false` (boolean, not string)
- Sanitize Agreement Number if it contains special characters

---

### Issue 5: Empty or Missing Template Variables

**Symptom**: Word document shows placeholder text (e.g., `{{ agreement_number }}`) instead of actual values.

**Possible Causes**:
1. Template variable name mismatch
2. Field value is empty string or null
3. Template file corrupted

**Debug Steps**:
```typescript
// 1. Log template data before rendering
const templateData = prepareTemplateData(validatedPayload, payments);
console.log('Template Data:', JSON.stringify(templateData, null, 2));

// 2. Check for empty values
Object.entries(templateData).forEach(([key, value]) => {
  if (!value || value === '') {
    console.warn(`Empty value for template variable: ${key}`);
  }
});

// 3. Verify template file
// Download and inspect template .docx file
// Check that placeholder names match prepareTemplateData output keys
```

**Solution**:
- Verify all template variable names match the keys in `prepareTemplateData`
- Provide default values for optional fields (e.g., `''` instead of `null`)
- Re-upload template file if corrupted

---

### Issue 6: Bubble Workflow Not Triggering

**Symptom**: Bubble workflow doesn't call the Edge Function.

**Possible Causes**:
1. Conditional `Prorated? is yes` not met
2. Previous workflow step failed
3. API endpoint URL incorrect

**Debug Steps**:
```typescript
// 1. Check conditional in Bubble
// Step: "Create Recurring Credit Card Authorization Prorated"
// Conditional: "Only when Result of step 2 (Create a new Fields For Lease Documents)'s Prorated? is yes"

// Verify the condition:
console.log('Fields For Lease Documents Prorated?:', fields.isProrated);

// 2. Check if step 2 completed successfully
console.log('Step 2 (Fields For Lease Documents) Status:', step2Status);

// 3. Verify API endpoint
console.log('API URL:', bubbleApiUrl);
// Should be: https://splitlease-backend.supabase.co/functions/v1/lease-documents
```

**Solution**:
- Ensure `fields.isProrated` is correctly calculated
- Verify previous workflow step completed without errors
- Update API endpoint URL if incorrect

---

## Related Documentation

### Core Documentation

- **[FIELDS_FOR_LEASE_DOCUMENTS_MAPPING.md](./FIELDS_FOR_LEASE_DOCUMENTS_MAPPING.md)**: Database field mappings for all lease documents
- **[PAYMENT_RECORDS_COMPREHENSIVE_GUIDE.md](./PAYMENT_RECORDS_COMPREHENSIVE_GUIDE.md)**: Guest payment records structure and calculations
- **[SUPPLEMENTAL_AGREEMENT_GUIDE.md](./SUPPLEMENTAL_AGREEMENT_GUIDE.md)**: Supplemental Agreement document generation

### Implementation Files

- **Handler**: `supabase/functions/lease-documents/handlers/generateCreditCardAuth.ts`
- **Types**: `supabase/functions/lease-documents/lib/types.ts`
- **Validators**: `supabase/functions/lease-documents/lib/validators.ts`
- **Calculations**: `supabase/functions/lease-documents/lib/calculations.ts`
- **Template Renderer**: `supabase/functions/lease-documents/lib/templateRenderer.ts`

### Related Edge Functions

- **lease-documents**: Main lease document generation function
- **guest-payment-records**: Guest payment record management
- **host-payment-records**: Host payment record management

### External Resources

- **Python API (Legacy)**: PythonAnywhere API compatibility reference
- **Bubble.io Workflow**: "Fields For Lease Documents" preparation step
- **Google Drive API**: Document upload and storage
- **Supabase Storage**: Fallback document storage

---

**End of Credit Card Authorization Guide**

For questions or issues, contact the engineering team on Slack: `#engineering-internal`
