# Host Payment Records Calculation Guide for Lease Documents

**Created**: 2026-02-04
**Version**: 1.0
**Purpose**: Complete reference for calculating, fetching, formatting, and mapping host payment records from Supabase to lease document payloads

---

## Table of Contents

1. [Overview](#overview)
2. [Workflow Context](#workflow-context)
3. [Database Schema](#database-schema)
4. [Business Rules](#business-rules)
5. [Implementation Guide](#implementation-guide)
6. [Code Examples](#code-examples)
7. [Field Mapping Reference](#field-mapping-reference)
8. [Validation & Testing](#validation--testing)
9. [Troubleshooting](#troubleshooting)
10. [API Reference](#api-reference)
11. [Related Documentation](#related-documentation)

---

## Overview

### Purpose

This guide provides the complete implementation for **Step 7: Host Payment Records** in the lease document generation workflow. Host payment records represent the payout schedule from Split Lease platform to property hosts, detailing when and how much hosts receive for each payment period.

### What This Step Does

1. **Fetches** host payment records from Supabase `paymentrecords` table
2. **Formats** dates (MM/DD/YY) and currency amounts ($X,XXX.XX)
3. **Maps** up to 13 payment entries to numbered fields (Date1-13, Rent1-13, Total1-13)
4. **Prepares** metadata fields (Payout Number, Maintenance Fee, Number of Payments)
5. **Returns** structured data for document generation

### Affected Documents

This step populates fields for the **Host Payout Schedule Form** (`hostpayoutscheduleform.docx`), which is one of four lease documents generated:

1. ✅ **Host Payout Schedule** ← Uses this data
2. Supplemental Agreement
3. Periodic Tenancy Agreement
4. Credit Card Authorization Form

---

## Workflow Context

### Complete Lease Document Generation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LEASE DOCUMENT GENERATION WORKFLOW                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Step 1: Trigger Event (Lease Acceptance)                              │
│  Step 2: Fetch/Create Lease Record                                     │
│          └─ Result: bookings_leases record                             │
│                                                                          │
│  Step 3: Create Document Fields Record (conditional)                   │
│          └─ Only when Current date/time is empty                       │
│                                                                          │
│  Step 4: Trigger Python Fields for Document Creation                   │
│                                                                          │
│  Step 5: Populate Extra Restrictions (conditional)                     │
│          └─ Only when host restrictions field is empty                 │
│                                                                          │
│  Step 6: Populate GUEST Payment Records                                │
│          ├─ Query: paymentrecords WHERE Payment from guest? = true     │
│          └─ Fields: guest date 1-13, guest rent 1-13, guest total 1-13 │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Step 7: Populate HOST Payment Records ◄── YOU ARE HERE          │  │
│  │         ├─ Query: paymentrecords WHERE Payment to Host? = true  │  │
│  │         └─ Fields: host date 1-13, host rent 1-13, host total   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Step 8: Call lease-documents Edge Function                            │
│          ├─ Action: generate_all                                       │
│          ├─ Payload: All fields from Steps 6 & 7                       │
│          └─ Result: 4 DOCX files uploaded to Google Drive             │
│                                                                          │
│  Step 9: Update Lease Status                                           │
│          └─ Set: "Documents Generated"                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Input/Output

| Aspect | Details |
|--------|---------|
| **Input** | Lease record from Step 2 (`bookings_leases` table) |
| **Process** | Query `paymentrecords` → Format → Map to fields |
| **Output** | Object with 39+ fields for document generation |

---

## Database Schema

### Table: `paymentrecords`

The `paymentrecords` table stores both guest and host payment schedules in a single table with discriminator columns.

#### Schema Definition

```sql
CREATE TABLE paymentrecords (
  _id                     text PRIMARY KEY,           -- Bubble-compatible ID
  "Booking - Reservation" text NOT NULL,              -- FK to bookings_leases._id
  "Payment #"             integer NOT NULL,           -- Payment sequence (1, 2, 3, ...)
  "Scheduled Date"        timestamptz NOT NULL,       -- When payment is due
  "Rent"                  numeric(10,2),              -- Rent amount for period
  "Maintenance Fee"       numeric(10,2),              -- Cleaning/maintenance fee
  "Total Paid by Guest"   numeric(10,2),              -- Guest total (guest records only)
  "Total Paid to Host"    numeric(10,2),              -- Host payout (host records only)
  "Damage Deposit"        numeric(10,2),              -- Security deposit (guest #1 only)
  "Payment from guest?"   boolean DEFAULT false,      -- Guest record discriminator
  "Payment to Host?"      boolean DEFAULT false,      -- Host record discriminator
  "source_calculation"    text,                       -- 'supabase-edge-function' or 'bubble'
  "Created By"            text,                       -- User who created
  "Created Date"          timestamptz DEFAULT now(),
  "Modified Date"         timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_payment_records_lease ON paymentrecords("Booking - Reservation");
CREATE INDEX idx_payment_records_guest ON paymentrecords("Payment from guest?") WHERE "Payment from guest?" = true;
CREATE INDEX idx_payment_records_host ON paymentrecords("Payment to Host?") WHERE "Payment to Host?" = true;
```

#### Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `_id` | text | NO | Primary key (Bubble format: `{timestamp}x{random}`) |
| `Booking - Reservation` | text | NO | Foreign key to `bookings_leases._id` |
| `Payment #` | integer | NO | Payment sequence number (1-indexed, up to 13) |
| `Scheduled Date` | timestamptz | NO | ISO 8601 timestamp when payment is due |
| `Rent` | numeric(10,2) | YES | Rent amount for this payment period |
| `Maintenance Fee` | numeric(10,2) | YES | Cleaning/maintenance fee per period |
| `Total Paid by Guest` | numeric(10,2) | YES | **Guest records only** - Gross payment amount |
| `Total Paid to Host` | numeric(10,2) | YES | **Host records only** - Net payout to host |
| `Damage Deposit` | numeric(10,2) | YES | Security deposit (first guest payment only) |
| `Payment from guest?` | boolean | NO | `true` = guest record, `false` = host record |
| `Payment to Host?` | boolean | NO | `true` = host record, `false` = guest record |
| `source_calculation` | text | YES | Origin: 'supabase-edge-function' or 'bubble' |
| `Created By` | text | YES | User ID who created the record |
| `Created Date` | timestamptz | NO | Record creation timestamp |
| `Modified Date` | timestamptz | NO | Last modification timestamp |

#### Record Discriminators

| Record Type | `Payment from guest?` | `Payment to Host?` | Total Field Used |
|-------------|----------------------|-------------------|------------------|
| **Guest Payment** | `true` | `false` | `Total Paid by Guest` |
| **Host Payment** | `false` | `true` | `Total Paid to Host` |

---

### Table: `bookings_leases`

Leases maintain references to their payment record arrays.

#### Relevant Fields

```sql
SELECT
  _id,                              -- Lease ID
  "Agreement Number",               -- e.g., "AGR-12345"
  "Payment Records Guest-SL",       -- text[] - Array of guest payment IDs
  "Payment Records Host-SL",        -- text[] - Array of host payment IDs
  "Move In Date",                   -- Start date
  "Move Out Date",                  -- End date
  "rental type",                    -- 'Monthly', 'Weekly', or 'Nightly'
  "4 week rent",                    -- Rent for 4-week period
  "rent per month",                 -- Monthly rent (if Monthly type)
  "Maintenance Fee",                -- Cleaning/maintenance fee
  "Damage Deposit",                 -- Security deposit amount
  "Total Rent"                      -- Total reservation cost
FROM bookings_leases;
```

---

## Business Rules

### Host Payment Schedule

| Rule | Value | Notes |
|------|-------|-------|
| **First Payment Date** | **Move-in + 2 days** | Host receives first payout 2 days AFTER guest moves in |
| **Payment Intervals** | 28 days (Weekly/Nightly)<br>31 days (Monthly) | Consistent intervals based on rental type |
| **Service Fee** | 10% deducted from gross rent | Host receives 90% of gross rent |
| **Maintenance Fee** | Goes to platform, NOT host | Host payout = rent only (no maintenance fee) |
| **Damage Deposit** | N/A for host payments | Hosts don't receive or pay deposit |
| **Number of Payments** | Up to 13 payments | Max 13 payment entries (52 weeks / 4 = 13) |
| **Prorating** | Same logic as guest payments | Last payment prorated if < 4 weeks remaining |

### Calculation Examples

#### Example 1: Full 4-Week Rent Cycle

```
Guest pays:    $2,000.00 (gross rent)
Service fee:   $  200.00 (10%)
Host receives: $1,800.00 (net payout)

Maintenance fee: $100.00 → Goes to platform, NOT included in host payout
```

#### Example 2: 13-Week Lease (3 full cycles + 1 week)

```
Total weeks: 13
Full 4-week cycles: 3
Remaining weeks: 1

Payments:
  Payment #1: $1,800.00 (full 4-week rent × 0.90)
  Payment #2: $1,800.00 (full 4-week rent × 0.90)
  Payment #3: $1,800.00 (full 4-week rent × 0.90)
  Payment #4: $  450.00 (prorated: 1/4 of 4-week rent × 0.90)

Total host payout: $5,850.00
```

---

## Implementation Guide

### Step-by-Step Process

#### 1. Prerequisites Check

Before executing Step 7, verify:

```typescript
// Ensure lease exists and has required fields
const lease = this.result_of_step_2;

if (!lease || !lease._id) {
  throw new Error('Lease record not found or missing ID');
}

if (!lease['Agreement Number']) {
  throw new Error('Agreement Number is required');
}

// Check if payment records exist
if (!lease['Payment Records Host-SL'] || lease['Payment Records Host-SL'].length === 0) {
  console.warn('⚠️ Host payment records not found - may need generation');
}
```

#### 2. Initialize Supabase Client

```typescript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
```

#### 3. Query Host Payment Records

```typescript
const { data: hostPayments, error } = await supabase
  .from('paymentrecords')
  .select(`
    "Payment #",
    "Scheduled Date",
    "Rent",
    "Maintenance Fee",
    "Total Paid to Host"
  `)
  .eq('Booking - Reservation', lease._id)
  .eq('Payment to Host?', true)      // HOST records only
  .eq('Payment from guest?', false)   // NOT guest records
  .order('Payment #', { ascending: true })
  .limit(13);

if (error) {
  console.error('❌ Failed to fetch host payments:', error);
  throw new Error(`Database query failed: ${error.message}`);
}

console.log(`✅ Fetched ${hostPayments.length} host payment records`);
```

#### 4. Format Data

```typescript
/**
 * Format ISO date to MM/DD/YY
 */
function formatDate(isoDate) {
  const date = new Date(isoDate);

  // Validate
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${isoDate}`);
  }

  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2); // Last 2 digits

  return `${mm}/${dd}/${yy}`;
}

/**
 * Format number to currency ($X,XXX.XX)
 */
function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '$0.00';
  }

  return `$${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}
```

#### 5. Map to Document Fields

```typescript
const hostFields = {};

// Map each payment to numbered fields
hostPayments.forEach((payment) => {
  const paymentNum = payment['Payment #'];

  // Date field: "host date 1", "host date 2", etc.
  hostFields[`host date ${paymentNum}`] = formatDate(payment['Scheduled Date']);

  // Rent field: "host rent 1", "host rent 2", etc.
  hostFields[`host rent ${paymentNum}`] = formatCurrency(payment['Rent']);

  // Total field: "host total 1", "host total 2", etc.
  hostFields[`host total ${paymentNum}`] = formatCurrency(payment['Total Paid to Host']);
});
```

#### 6. Add Metadata Fields

```typescript
// Number of payments
hostFields['Number of Payments (host)'] = hostPayments.length;

// Payout number (format: PAY-{Agreement Number})
hostFields['Payout Number'] = `PAY-${lease['Agreement Number']}`;

// Maintenance fee (from first payment)
hostFields['Maintenance Fee'] = hostPayments.length > 0
  ? formatCurrency(hostPayments[0]['Maintenance Fee'])
  : '$0.00';
```

#### 7. Return Result

```typescript
console.log(`✅ Host fields prepared: ${Object.keys(hostFields).length} fields`);
return hostFields;
```

---

## Code Examples

### Complete Implementation (TypeScript)

```typescript
/**
 * Step 7: Populate Host Payment Records for Lease Documents
 *
 * @param {Object} lease - Lease record from Step 2 (bookings_leases)
 * @returns {Object} Host payment fields for document generation
 */
async function populateHostPaymentRecords(lease) {
  console.log('═'.repeat(70));
  console.log('STEP 7: POPULATE HOST PAYMENT RECORDS');
  console.log('═'.repeat(70));

  // ============================================
  // 1. VALIDATE INPUT
  // ============================================

  if (!lease || !lease._id) {
    throw new Error('Invalid lease: missing ID');
  }

  if (!lease['Agreement Number']) {
    throw new Error('Invalid lease: missing Agreement Number');
  }

  const leaseId = lease._id;
  const agreementNumber = lease['Agreement Number'];

  console.log(`Lease ID: ${leaseId}`);
  console.log(`Agreement Number: ${agreementNumber}`);

  // ============================================
  // 2. INITIALIZE SUPABASE CLIENT
  // ============================================

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  // ============================================
  // 3. QUERY HOST PAYMENT RECORDS
  // ============================================

  console.log('Querying host payment records...');

  const { data: hostPayments, error } = await supabase
    .from('paymentrecords')
    .select(`
      _id,
      "Payment #",
      "Scheduled Date",
      "Rent",
      "Maintenance Fee",
      "Total Paid to Host",
      "Created Date"
    `)
    .eq('Booking - Reservation', leaseId)
    .eq('Payment to Host?', true)
    .eq('Payment from guest?', false)
    .order('Payment #', { ascending: true })
    .limit(13);

  if (error) {
    console.error('❌ Database query failed:', error);
    throw new Error(`Failed to fetch host payments: ${error.message}`);
  }

  if (!hostPayments || hostPayments.length === 0) {
    console.warn('⚠️ No host payment records found');
    console.warn('You may need to run host-payment-records edge function first');
    throw new Error('No host payment records found for lease');
  }

  console.log(`✅ Fetched ${hostPayments.length} host payment records`);

  // Log first payment for verification
  console.log('First payment preview:', {
    paymentNum: hostPayments[0]['Payment #'],
    scheduledDate: hostPayments[0]['Scheduled Date'],
    rent: hostPayments[0]['Rent'],
    total: hostPayments[0]['Total Paid to Host']
  });

  // ============================================
  // 4. FORMAT HELPERS
  // ============================================

  function formatDate(isoDate) {
    const date = new Date(isoDate);

    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${isoDate}`);
    }

    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);

    return `${mm}/${dd}/${yy}`;
  }

  function formatCurrency(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '$0.00';
    }

    return `$${Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  // ============================================
  // 5. MAP TO DOCUMENT FIELDS
  // ============================================

  console.log('Mapping payment records to document fields...');

  const hostFields = {};

  // Map each payment to numbered fields
  hostPayments.forEach((payment, index) => {
    const paymentNum = payment['Payment #'];

    // Validate payment number
    if (!paymentNum || paymentNum < 1 || paymentNum > 13) {
      console.warn(`⚠️ Invalid payment number: ${paymentNum} at index ${index}`);
      return;
    }

    try {
      // Format and assign fields
      hostFields[`host date ${paymentNum}`] = formatDate(payment['Scheduled Date']);
      hostFields[`host rent ${paymentNum}`] = formatCurrency(payment['Rent']);
      hostFields[`host total ${paymentNum}`] = formatCurrency(payment['Total Paid to Host']);

      console.log(`  Payment #${paymentNum}: ${hostFields[`host date ${paymentNum}`]} | ${hostFields[`host rent ${paymentNum}`]} | ${hostFields[`host total ${paymentNum}`]}`);
    } catch (err) {
      console.error(`❌ Failed to format payment #${paymentNum}:`, err.message);
      throw err;
    }
  });

  // ============================================
  // 6. ADD METADATA FIELDS
  // ============================================

  console.log('Adding metadata fields...');

  // Number of payments
  hostFields['Number of Payments (host)'] = hostPayments.length;
  console.log(`  Number of Payments (host): ${hostFields['Number of Payments (host)']}`);

  // Payout number
  hostFields['Payout Number'] = `PAY-${agreementNumber}`;
  console.log(`  Payout Number: ${hostFields['Payout Number']}`);

  // Maintenance fee (from first payment)
  hostFields['Maintenance Fee'] = hostPayments.length > 0
    ? formatCurrency(hostPayments[0]['Maintenance Fee'])
    : '$0.00';
  console.log(`  Maintenance Fee: ${hostFields['Maintenance Fee']}`);

  // ============================================
  // 7. RETURN RESULT
  // ============================================

  console.log('═'.repeat(70));
  console.log(`✅ HOST FIELDS PREPARED: ${Object.keys(hostFields).length} fields`);
  console.log('═'.repeat(70));

  return hostFields;
}

// ============================================
// EXPORT
// ============================================

module.exports = { populateHostPaymentRecords };
```

---

### Complete Implementation (JavaScript - Bubble.io/Make.com)

```javascript
/**
 * Bubble.io / Make.com Workflow Step 7
 * Make changes to Fields For Lease Documents... HOST RECORDS
 */

// ============================================
// INPUT: Result of Step 2 (the Lease)
// ============================================

const lease = this.result_of_step_2; // bookings_leases record
const leaseId = lease._id;
const agreementNumber = lease['Agreement Number'];

console.log(`Processing lease: ${agreementNumber}`);

// ============================================
// SUPABASE CLIENT SETUP
// ============================================

const supabase = window.supabaseClient || createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

// ============================================
// QUERY HOST PAYMENT RECORDS
// ============================================

const { data: hostPayments, error } = await supabase
  .from('paymentrecords')
  .select(`
    "Payment #",
    "Scheduled Date",
    "Rent",
    "Maintenance Fee",
    "Total Paid to Host"
  `)
  .eq('Booking - Reservation', leaseId)
  .eq('Payment to Host?', true)
  .eq('Payment from guest?', false)
  .order('Payment #', { ascending: true })
  .limit(13);

if (error) {
  console.error('Failed to fetch host payments:', error);
  throw new Error(`Database query failed: ${error.message}`);
}

console.log(`Fetched ${hostPayments.length} host payment records`);

// ============================================
// FORMATTING FUNCTIONS
// ============================================

const formatDate = (isoDate) => {
  const date = new Date(isoDate);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
};

const formatCurrency = (amount) => {
  if (!amount) return '$0.00';
  return `$${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// ============================================
// MAP TO FIELDS
// ============================================

const hostFields = {};

// Map each payment
hostPayments.forEach((payment) => {
  const num = payment['Payment #'];

  hostFields[`host date ${num}`] = formatDate(payment['Scheduled Date']);
  hostFields[`host rent ${num}`] = formatCurrency(payment['Rent']);
  hostFields[`host total ${num}`] = formatCurrency(payment['Total Paid to Host']);
});

// Add metadata
hostFields['Number of Payments (host)'] = hostPayments.length;
hostFields['Payout Number'] = `PAY-${agreementNumber}`;
hostFields['Maintenance Fee'] = formatCurrency(hostPayments[0]?.['Maintenance Fee']);

// ============================================
// RETURN FOR UPDATE
// ============================================

console.log(`Prepared ${Object.keys(hostFields).length} fields`);
return hostFields;
```

---

## Field Mapping Reference

### Output Field Structure

The `populateHostPaymentRecords` function returns an object with the following fields:

#### Payment Entry Fields (Repeated 1-13 times)

| Field Name Pattern | Example Value | Source Column | Format |
|-------------------|---------------|---------------|--------|
| `host date {N}` | `"02/06/26"` | `Scheduled Date` | MM/DD/YY |
| `host rent {N}` | `"$1,028.58"` | `Rent` | $X,XXX.XX |
| `host total {N}` | `"$1,028.58"` | `Total Paid to Host` | $X,XXX.XX |

Where `{N}` = 1, 2, 3, ..., 13 (based on `Payment #`)

#### Metadata Fields

| Field Name | Example Value | Source | Description |
|------------|---------------|--------|-------------|
| `Number of Payments (host)` | `13` | Count of records | Total number of host payments |
| `Payout Number` | `"PAY-AGR-12345"` | Derived | Format: `PAY-{Agreement Number}` |
| `Maintenance Fee` | `"$100.00"` | First payment record | Maintenance fee amount |

### Complete Output Example

```json
{
  "host date 1": "02/06/26",
  "host rent 1": "$1,800.00",
  "host total 1": "$1,800.00",

  "host date 2": "03/06/26",
  "host rent 2": "$1,800.00",
  "host total 2": "$1,800.00",

  "host date 3": "04/03/26",
  "host rent 3": "$1,800.00",
  "host total 3": "$1,800.00",

  "host date 4": "05/01/26",
  "host rent 4": "$1,800.00",
  "host total 4": "$1,800.00",

  "host date 5": "05/29/26",
  "host rent 5": "$1,800.00",
  "host total 5": "$1,800.00",

  "host date 6": "06/26/26",
  "host rent 6": "$1,800.00",
  "host total 6": "$1,800.00",

  "host date 7": "07/24/26",
  "host rent 7": "$1,800.00",
  "host total 7": "$1,800.00",

  "host date 8": "08/21/26",
  "host rent 8": "$1,800.00",
  "host total 8": "$1,800.00",

  "host date 9": "09/18/26",
  "host rent 9": "$1,800.00",
  "host total 9": "$1,800.00",

  "host date 10": "10/16/26",
  "host rent 10": "$1,800.00",
  "host total 10": "$1,800.00",

  "host date 11": "11/13/26",
  "host rent 11": "$1,800.00",
  "host total 11": "$1,800.00",

  "host date 12": "12/11/26",
  "host rent 12": "$1,800.00",
  "host total 12": "$1,800.00",

  "host date 13": "01/08/27",
  "host rent 13": "$450.00",
  "host total 13": "$450.00",

  "Number of Payments (host)": 13,
  "Payout Number": "PAY-AGR-12345",
  "Maintenance Fee": "$100.00"
}
```

---

## Validation & Testing

### Pre-Execution Validation

```typescript
/**
 * Validate lease data before querying payment records
 */
function validateLease(lease) {
  const errors = [];

  // Required fields
  if (!lease._id) {
    errors.push('Lease is missing _id');
  }

  if (!lease['Agreement Number']) {
    errors.push('Lease is missing Agreement Number');
  }

  if (!lease['Move In Date']) {
    errors.push('Lease is missing Move In Date');
  }

  if (!lease['Move Out Date']) {
    errors.push('Lease is missing Move Out Date');
  }

  // Optional but helpful warnings
  if (!lease['Payment Records Host-SL'] || lease['Payment Records Host-SL'].length === 0) {
    console.warn('⚠️ Lease has no host payment record references');
  }

  if (errors.length > 0) {
    throw new Error(`Lease validation failed:\n${errors.join('\n')}`);
  }

  return true;
}
```

### Post-Execution Validation

```typescript
/**
 * Validate output fields
 */
function validateHostFields(hostFields, expectedPayments) {
  const errors = [];

  // Check metadata fields
  if (!hostFields['Number of Payments (host)']) {
    errors.push('Missing field: Number of Payments (host)');
  }

  if (!hostFields['Payout Number']) {
    errors.push('Missing field: Payout Number');
  }

  if (!hostFields['Maintenance Fee']) {
    errors.push('Missing field: Maintenance Fee');
  }

  // Check payment entries
  for (let i = 1; i <= expectedPayments; i++) {
    if (!hostFields[`host date ${i}`]) {
      errors.push(`Missing field: host date ${i}`);
    }

    if (!hostFields[`host rent ${i}`]) {
      errors.push(`Missing field: host rent ${i}`);
    }

    if (!hostFields[`host total ${i}`]) {
      errors.push(`Missing field: host total ${i}`);
    }
  }

  // Validate formats
  for (let i = 1; i <= expectedPayments; i++) {
    const date = hostFields[`host date ${i}`];
    if (date && !/^\d{2}\/\d{2}\/\d{2}$/.test(date)) {
      errors.push(`Invalid date format for host date ${i}: ${date} (expected MM/DD/YY)`);
    }

    const rent = hostFields[`host rent ${i}`];
    if (rent && !/^\$[\d,]+\.\d{2}$/.test(rent)) {
      errors.push(`Invalid currency format for host rent ${i}: ${rent} (expected $X,XXX.XX)`);
    }

    const total = hostFields[`host total ${i}`];
    if (total && !/^\$[\d,]+\.\d{2}$/.test(total)) {
      errors.push(`Invalid currency format for host total ${i}: ${total} (expected $X,XXX.XX)`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Host fields validation failed:\n${errors.join('\n')}`);
  }

  return true;
}
```

### Test Cases

```typescript
describe('Host Payment Records Calculation', () => {

  test('Should fetch 13 payment records for 52-week lease', async () => {
    const lease = {
      _id: '1234567890x123',
      'Agreement Number': 'AGR-TEST-001',
      'Move In Date': '2026-02-04',
      'Move Out Date': '2027-02-03'
    };

    const result = await populateHostPaymentRecords(lease);

    expect(result['Number of Payments (host)']).toBe(13);
    expect(result['host date 1']).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
    expect(result['host rent 1']).toMatch(/^\$[\d,]+\.\d{2}$/);
  });

  test('Should format dates as MM/DD/YY', async () => {
    const lease = mockLease();
    const result = await populateHostPaymentRecords(lease);

    expect(result['host date 1']).toBe('02/06/26');
  });

  test('Should format currency with commas and decimals', async () => {
    const lease = mockLease();
    const result = await populateHostPaymentRecords(lease);

    expect(result['host rent 1']).toBe('$1,800.00');
  });

  test('Should handle prorated last payment', async () => {
    const lease = mockLease({ weeks: 13 }); // 13 weeks = 3 full + 1 prorated
    const result = await populateHostPaymentRecords(lease);

    expect(result['Number of Payments (host)']).toBe(4);

    // Last payment should be 1/4 of full rent
    const fullRent = parseFloat(result['host rent 1'].replace(/[$,]/g, ''));
    const lastRent = parseFloat(result['host rent 4'].replace(/[$,]/g, ''));

    expect(lastRent).toBeCloseTo(fullRent / 4, 2);
  });

  test('Should throw error if no payment records found', async () => {
    const lease = mockLease({ hasPayments: false });

    await expect(populateHostPaymentRecords(lease)).rejects.toThrow(
      'No host payment records found for lease'
    );
  });

});
```

---

## Troubleshooting

### Issue 1: No Payment Records Found

**Symptoms**:
```
Error: No host payment records found for lease
```

**Cause**: Payment records have not been generated for this lease yet.

**Solution**:
```typescript
// Check if payment records exist
const { data: lease } = await supabase
  .from('bookings_leases')
  .select('_id, "Payment Records Host-SL"')
  .eq('_id', leaseId)
  .single();

if (!lease['Payment Records Host-SL'] || lease['Payment Records Host-SL'].length === 0) {
  console.log('Generating host payment records...');

  // Call host-payment-records edge function
  const { data, error } = await supabase.functions.invoke('host-payment-records', {
    body: {
      action: 'generate',
      payload: {
        leaseId: lease._id,
        moveInDate: lease['Move In Date'],
        moveOutDate: lease['Move Out Date'],
        rentalType: lease['rental type'],
        fourWeekRent: lease['4 week rent'],
        maintenanceFee: lease['Maintenance Fee']
      }
    }
  });

  if (error) {
    throw new Error(`Failed to generate host payments: ${error.message}`);
  }

  console.log('✅ Host payment records generated');

  // Re-run Step 7
}
```

---

### Issue 2: Incorrect Date Format

**Symptoms**:
```
host date 1: "2026-02-06T00:00:00.000Z" (ISO format instead of MM/DD/YY)
```

**Cause**: `formatDate` function not being applied or implemented incorrectly.

**Solution**:
```typescript
function formatDate(isoDate) {
  const date = new Date(isoDate);

  // Validate
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${isoDate}`);
  }

  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2); // ← CRITICAL: Use slice(-2)

  return `${mm}/${dd}/${yy}`;
}

// Test
console.log(formatDate('2026-02-06T00:00:00.000Z')); // Should output: "02/06/26"
```

---

### Issue 3: Missing Currency Formatting

**Symptoms**:
```
host rent 1: "1800" (no dollar sign or decimals)
```

**Cause**: Direct number-to-string conversion without `formatCurrency` function.

**Solution**:
```typescript
function formatCurrency(amount) {
  // Handle null/undefined/NaN
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '$0.00';
  }

  // Convert to number and format
  return `$${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

// Test cases
console.log(formatCurrency(1800));      // "$1,800.00"
console.log(formatCurrency(1028.58));   // "$1,028.58"
console.log(formatCurrency(0));         // "$0.00"
console.log(formatCurrency(null));      // "$0.00"
```

---

### Issue 4: Payments Out of Order

**Symptoms**:
```
host date 1: "03/06/26"
host date 2: "02/06/26"  ← Wrong order
host date 3: "04/03/26"
```

**Cause**: Missing or incorrect `.order()` clause in Supabase query.

**Solution**:
```typescript
const { data: hostPayments, error } = await supabase
  .from('paymentrecords')
  .select('...')
  .eq('Booking - Reservation', leaseId)
  .eq('Payment to Host?', true)
  .eq('Payment from guest?', false)
  .order('Payment #', { ascending: true }) // ← CRITICAL: Order by Payment #
  .limit(13);
```

---

### Issue 5: Wrong Record Type Fetched

**Symptoms**:
```
Error: Payment records have "Total Paid by Guest" but should have "Total Paid to Host"
```

**Cause**: Fetched guest records instead of host records (discriminator filters wrong).

**Solution**:
```typescript
// ❌ WRONG - Fetches GUEST records
const { data } = await supabase
  .from('paymentrecords')
  .select('...')
  .eq('Payment from guest?', true)  // ← WRONG discriminator
  .eq('Payment to Host?', false);

// ✅ CORRECT - Fetches HOST records
const { data } = await supabase
  .from('paymentrecords')
  .select('...')
  .eq('Payment to Host?', true)      // ← Correct: host records
  .eq('Payment from guest?', false);  // ← Correct: not guest records
```

---

### Issue 6: Prorating Calculation Incorrect

**Symptoms**:
```
host rent 13: "$1,800.00" (should be prorated to $450.00 for 1 week)
```

**Cause**: Payment records were generated with incorrect prorating logic.

**Solution**: This is an upstream issue. Payment records must be regenerated:

```typescript
// Delete existing host payment records
await supabase
  .from('paymentrecords')
  .delete()
  .eq('Booking - Reservation', leaseId)
  .eq('Payment to Host?', true);

// Regenerate with correct logic
await supabase.functions.invoke('host-payment-records', {
  body: {
    action: 'generate',
    payload: { /* lease data */ }
  }
});
```

---

## API Reference

### Function Signature

```typescript
async function populateHostPaymentRecords(
  lease: BookingsLeases
): Promise<HostPaymentFields>
```

### Input Type

```typescript
interface BookingsLeases {
  _id: string;                      // Required
  'Agreement Number': string;       // Required
  'Move In Date': string;           // Required (ISO timestamp)
  'Move Out Date': string;          // Required (ISO timestamp)
  'Payment Records Host-SL'?: string[]; // Optional (array of payment IDs)
  'rental type'?: string;           // Optional ('Monthly' | 'Weekly' | 'Nightly')
  '4 week rent'?: number;           // Optional
  'Maintenance Fee'?: number;       // Optional
}
```

### Output Type

```typescript
interface HostPaymentFields {
  // Payment entries (up to 13)
  'host date 1'?: string;           // MM/DD/YY
  'host rent 1'?: string;           // $X,XXX.XX
  'host total 1'?: string;          // $X,XXX.XX
  'host date 2'?: string;
  'host rent 2'?: string;
  'host total 2'?: string;
  // ... up to 13

  // Metadata
  'Number of Payments (host)': number;
  'Payout Number': string;          // "PAY-{Agreement Number}"
  'Maintenance Fee': string;        // $X,XXX.XX
}
```

### Helper Functions

```typescript
/**
 * Format ISO 8601 date to MM/DD/YY
 */
function formatDate(isoDate: string): string;

/**
 * Format number to currency ($X,XXX.XX)
 */
function formatCurrency(amount: number): string;
```

---

## Related Documentation

### Primary References

- [Complete Payment Records Mapping Guide](./PAYMENT_RECORDS_COMPREHENSIVE_GUIDE.md) - Comprehensive guide covering both guest and host records
- [Guest Payment Records Mapping](./guest-payment-records-mapping.md) - Guest payment records (Step 6)
- [Lease Documents Edge Function](../../Backend(EDGE%20-%20Functions)/LEASE_DOCUMENTS.md) - Edge function API reference

### Database References

- [Database Tables Reference](../../Database/DATABASE_TABLES_DETAILED.md) - Complete schema documentation
- [Database Relations](../../Database/DATABASE_RELATIONS.md) - Foreign key relationships

### Edge Function References

- [Host Payment Records Edge Function](../../Backend(EDGE%20-%20Functions)/HOST_PAYMENT_RECORDS.md) - Generation logic
- [Lease Documents Edge Function](../../Backend(EDGE%20-%20Functions)/LEASE_DOCUMENTS.md) - Document generation

---

## Appendix

### Common Payment Record Queries

```sql
-- Get all host payment records for a lease
SELECT * FROM paymentrecords
WHERE "Booking - Reservation" = '<lease_id>'
  AND "Payment to Host?" = true
ORDER BY "Payment #" ASC;

-- Get first host payment date
SELECT "Scheduled Date" FROM paymentrecords
WHERE "Booking - Reservation" = '<lease_id>'
  AND "Payment to Host?" = true
  AND "Payment #" = 1;

-- Calculate total host payout
SELECT SUM("Total Paid to Host") AS total_host_payout
FROM paymentrecords
WHERE "Booking - Reservation" = '<lease_id>'
  AND "Payment to Host?" = true;

-- Count host payment records
SELECT COUNT(*) AS num_payments
FROM paymentrecords
WHERE "Booking - Reservation" = '<lease_id>'
  AND "Payment to Host?" = true;
```

### Date Formatting Edge Cases

```typescript
// Handle timezone issues
function formatDateSafe(isoDate) {
  // Parse as UTC to avoid timezone shifts
  const date = new Date(isoDate);

  // Get UTC values
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const yy = String(date.getUTCFullYear()).slice(-2);

  return `${mm}/${dd}/${yy}`;
}
```

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-04 | 1.0 | Initial comprehensive guide created |

---

**Maintained by**: Engineering Team
**Last Updated**: 2026-02-04
**Review Cycle**: Quarterly
**Status**: Active
