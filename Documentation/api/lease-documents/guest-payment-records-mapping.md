# Guest Payment Records Mapping for Lease Documents

**Created**: 2026-02-04
**Version**: 1.0
**Purpose**: Document the process of calculating and mapping Supabase guest payment records to lease document payloads

---

## Overview

This guide explains how to query Supabase guest payment records and format them for the `lease-documents` edge function, specifically for generating the **Periodic Tenancy Agreement** and **Credit Card Authorization Form**.

---

## Supabase Database Schema

### Table: `paymentrecords`

Guest payment records are stored in the `paymentrecords` table with the following relevant fields:

| Field | Type | Description |
|-------|------|-------------|
| `_id` | text (PK) | Bubble-compatible ID |
| `Booking - Reservation` | text (FK) | Reference to lease ID |
| `Payment #` | integer | Payment sequence number (1-indexed) |
| `Scheduled Date` | timestamp | ISO date when payment is due |
| `Rent` | numeric | Rent amount for this period |
| `Maintenance Fee` | numeric | Maintenance/cleaning fee |
| `Total Paid by Guest` | numeric | Total payment amount |
| `Damage Deposit` | numeric | Damage deposit (first payment only) |
| `Payment from guest?` | boolean | Always `true` for guest records |
| `source_calculation` | text | 'supabase-edge-function' or 'bubble' |
| `Created Date` | timestamp | Record creation timestamp |
| `Modified Date` | timestamp | Last modification timestamp |

---

## Guest Payment Calculation Logic

### Key Business Rules

1. **First Payment Timing**: 3 days **BEFORE** move-in date
2. **Payment Intervals**:
   - Monthly rentals: 31-day intervals
   - Weekly/Nightly rentals: 28-day (4-week) intervals
3. **Damage Deposit**: Added to **first payment only**
4. **Total Rent**: Sum of all payments **MINUS** damage deposit (deposit is refundable)

### Payment Schedule Calculation

```typescript
// From supabase/functions/guest-payment-records/lib/calculations.ts

interface PaymentScheduleResult {
  paymentDates: string[];        // mm-dd-yyyy format
  rentList: number[];            // Rent amounts
  totalRentList: number[];       // Total amounts (rent + maintenance + deposit)
  totalReservationPrice: number; // Sum minus damage deposit
  numberOfPaymentCycles: number; // Number of payments
}

// First payment is 3 days BEFORE move-in
const firstPaymentDate = subtractDays(moveInDate, 3);

// Subsequent payments
const paymentInterval = rentalType === 'Monthly' ? 31 : 28; // days
```

### Prorating Last Payment

For partial periods, the last payment is prorated based on:

| Rental Type | Prorating Logic |
|-------------|-----------------|
| **Monthly** | `baseRent × (fractionalMonth)` |
| **Nightly** | `baseRent × (remainingWeeks / 4)` |
| **Weekly** | Depends on week pattern (see below) |

#### Week Pattern Prorating

| Week Pattern | 1 Week Remaining | 2 Weeks | 3 Weeks |
|--------------|------------------|---------|---------|
| Every week | baseRent × 0.25 | baseRent × 0.50 | baseRent × 0.75 |
| One week on, one week off | baseRent × 0.50 | baseRent × 0.50 | baseRent × 1.00 |
| Two weeks on, two weeks off | baseRent × 0.50 | baseRent × 1.00 | baseRent × 1.00 |
| One week on, three weeks off | baseRent × 1.00 | baseRent × 1.00 | baseRent × 1.00 |

---

## Querying Guest Payment Records from Supabase

### SQL Query

```sql
-- Fetch guest payment records for a specific lease, ordered by payment number
SELECT
  _id,
  "Payment #",
  "Scheduled Date",
  "Rent",
  "Maintenance Fee",
  "Total Paid by Guest",
  "Damage Deposit"
FROM paymentrecords
WHERE "Booking - Reservation" = '<lease_id>'
  AND "Payment from guest?" = true
ORDER BY "Payment #" ASC
LIMIT 13;  -- Maximum 13 payments for lease documents
```

### TypeScript/JavaScript Example

```typescript
const { data: guestPayments, error } = await supabase
  .from('paymentrecords')
  .select(`
    _id,
    "Payment #",
    "Scheduled Date",
    "Rent",
    "Maintenance Fee",
    "Total Paid by Guest",
    "Damage Deposit"
  `)
  .eq('Booking - Reservation', leaseId)
  .eq('Payment from guest?', true)
  .order('Payment #', { ascending: true })
  .limit(13);

if (error) {
  throw new Error(`Failed to fetch guest payment records: ${error.message}`);
}
```

---

## Mapping to Lease Document Payload

### Credit Card Authorization Form

The Credit Card Authorization Form expects the following fields:

```typescript
interface CreditCardAuthPayload {
  'Agreement Number': string;
  'Host Name': string;
  'Guest Name': string;
  'Four Week Rent': string;
  'Maintenance Fee': string;
  'Damage Deposit': string;
  'Splitlease Credit': string;
  'Last Payment Rent': string;
  'Weeks Number': string;
  'Listing Description': string;
  'Penultimate Week Number': string;
  'Number of Payments': string;
  'Last Payment Weeks': string;
  'Is Prorated'?: boolean;
}
```

#### Mapping Logic

```typescript
// Calculate fields from payment records
const numberOfPayments = guestPayments.length;
const firstPayment = guestPayments[0];
const lastPayment = guestPayments[numberOfPayments - 1];
const penultimatePayment = guestPayments[numberOfPayments - 2];

const creditCardAuthPayload: CreditCardAuthPayload = {
  'Agreement Number': lease.agreementNumber,
  'Host Name': lease.hostName,
  'Guest Name': lease.guestName,

  // From first payment
  'Four Week Rent': formatCurrency(firstPayment.Rent),
  'Maintenance Fee': formatCurrency(firstPayment['Maintenance Fee']),
  'Damage Deposit': formatCurrency(firstPayment['Damage Deposit'] || 0),

  // Splitlease Credit (usually 0, or fetch from lease if applicable)
  'Splitlease Credit': '0',

  // From last payment
  'Last Payment Rent': formatCurrency(lastPayment.Rent),

  // Metadata
  'Weeks Number': calculateWeeksNumber(lease.moveInDate, lease.moveOutDate),
  'Listing Description': lease.listingDescription,
  'Penultimate Week Number': calculateWeekNumber(penultimatePayment['Scheduled Date']),
  'Number of Payments': numberOfPayments.toString(),
  'Last Payment Weeks': calculateRemainingWeeks(lastPayment).toString(),

  // Check if last payment is prorated (less than full rent)
  'Is Prorated': lastPayment.Rent < firstPayment.Rent,
};
```

### Periodic Tenancy Agreement

The Periodic Tenancy Agreement uses the Credit Card Authorization Number, which references the above document.

---

## Step-by-Step Integration Guide

### Step 1: Fetch Lease Data

```typescript
const { data: lease, error: leaseError } = await supabase
  .from('bookings_leases')
  .select(`
    _id,
    "Agreement Number",
    "Move In Date",
    "Move Out Date",
    "Listing",
    "Guest",
    "Host",
    "Payment Records Guest-SL",
    "Total Rent",
    "rental type",
    "week pattern",
    "Reservation Span (weeks)",
    "Reservation Span (months)",
    "4 week rent",
    "rent per month",
    "Maintenance Fee",
    "Damage Deposit"
  `)
  .eq('_id', leaseId)
  .single();
```

### Step 2: Generate Payment Records (if not exists)

```typescript
// Check if payment records already exist
if (!lease['Payment Records Guest-SL'] || lease['Payment Records Guest-SL'].length === 0) {
  // Call guest-payment-records edge function to generate
  const { data: generateResult, error: generateError } = await supabase.functions.invoke(
    'guest-payment-records',
    {
      body: {
        action: 'generate',
        payload: {
          leaseId: lease._id,
          rentalType: lease['rental type'],
          moveInDate: lease['Move In Date'],
          reservationSpanWeeks: lease['Reservation Span (weeks)'],
          reservationSpanMonths: lease['Reservation Span (months)'],
          weekPattern: lease['week pattern'],
          fourWeekRent: lease['4 week rent'],
          rentPerMonth: lease['rent per month'],
          maintenanceFee: lease['Maintenance Fee'],
          damageDeposit: lease['Damage Deposit'],
        },
      },
    }
  );

  if (generateError) {
    throw new Error(`Failed to generate payment records: ${generateError.message}`);
  }

  console.log(`Generated ${generateResult.recordCount} payment records`);
}
```

### Step 3: Fetch Guest Payment Records

```typescript
const { data: guestPayments, error: paymentError } = await supabase
  .from('paymentrecords')
  .select('*')
  .eq('Booking - Reservation', leaseId)
  .eq('Payment from guest?', true)
  .order('Payment #', { ascending: true })
  .limit(13);

if (paymentError) {
  throw new Error(`Failed to fetch guest payments: ${paymentError.message}`);
}

console.log(`Found ${guestPayments.length} guest payment records`);
```

### Step 4: Format for Lease Document Payload

```typescript
// Helper function to format date as mm/dd/yyyy for display
function formatDateForDisplay(isoDate: string): string {
  const date = new Date(isoDate);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

// Helper function to format currency
function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

// Build Credit Card Authorization payload
const creditCardAuthPayload = {
  'Agreement Number': lease['Agreement Number'],
  'Host Name': hostName,
  'Guest Name': guestName,
  'Four Week Rent': formatCurrency(guestPayments[0]?.Rent || 0),
  'Maintenance Fee': formatCurrency(guestPayments[0]?.['Maintenance Fee'] || 0),
  'Damage Deposit': formatCurrency(guestPayments[0]?.['Damage Deposit'] || 0),
  'Splitlease Credit': '0', // Fetch from proposal if applicable
  'Last Payment Rent': formatCurrency(guestPayments[guestPayments.length - 1]?.Rent || 0),
  'Weeks Number': calculateWeeks(lease['Move In Date'], lease['Move Out Date']).toString(),
  'Listing Description': listingDescription,
  'Penultimate Week Number': (guestPayments.length - 1).toString(),
  'Number of Payments': guestPayments.length.toString(),
  'Last Payment Weeks': '1', // Calculate based on prorating logic
  'Is Prorated': guestPayments.length > 1 &&
    guestPayments[guestPayments.length - 1].Rent < guestPayments[0].Rent,
};
```

### Step 5: Call Lease-Documents Edge Function

```typescript
const { data: docResult, error: docError } = await supabase.functions.invoke(
  'lease-documents',
  {
    body: {
      action: 'generate_credit_card_auth',
      payload: creditCardAuthPayload,
    },
  }
);

if (docError) {
  throw new Error(`Failed to generate document: ${docError.message}`);
}

console.log(`Document generated: ${docResult.filename}`);
console.log(`Google Drive URL: ${docResult.driveUrl}`);
```

---

## Complete Example: Bubble.io Workflow Integration

### Context

The Bubble.io workflow creates a **Fields For Lease Documents** record in Step 2, which is then populated with payment data in subsequent steps. **Step 2's result references the lease table (Bookings - Leases)**, not the Fields For Lease Documents record.

### Workflow Structure

```
Step 1: Make changes to Bookings - Leases...
  └─ Triggers document generation process

Step 2: Create a new Fields For Lease Documents...
  └─ Creates empty document fields record
  └─ Result: The LEASE record (Bookings - Leases)

Step 3: Create a new Fields For Lease Documents...
  └─ Only when Current date/time is empty

Step 4: Trigger Python Fields for Document Creation
  └─ Triggers external service

Step 5: Make changes to Fields For Lease Documents when EXTRA RESTRICTIONS is empty
  └─ References: D: Choose Reservation's value's Listing's host restrictions

Step 6: Make changes to Fields For Lease Documents GUEST RECORDS
  └─ References: D: Choose Reservation's value's Payment Records Guest-SL
  └─ Populates guest payment fields (guest date 1-13, guest rent 1-13, etc.)

Step 7: Make changes to Fields For Lease Documents... HOST RECORDS
  └─ References: D: Choose Reservation's value's Payment Records Host-SL
  └─ Populates host payment fields
```

### Step 6: Make changes to Fields For Lease Documents GUEST RECORDS

This step queries the **lease table's Payment Records Guest-SL** field, which contains an array of payment record IDs. It then fetches each payment record from Supabase and maps the data to the Fields For Lease Documents fields.

```javascript
// INPUT: Result of Step 2 (the Lease record from Bookings - Leases)
const lease = this.result_of_step_2; // This is the Bookings - Leases record
const leaseId = lease._id;

// Reference to the Lease's payment records field
const paymentRecordIds = lease['Payment Records Guest-SL']; // Array of payment record IDs

// STEP 1: Fetch guest payment records from Supabase using the IDs
const guestPayments = await supabase
  .from('paymentrecords')
  .select('*')
  .in('_id', paymentRecordIds)
  .eq('Payment from guest?', true)
  .order('Payment #', { ascending: true })
  .limit(13);

// STEP 2: Map to Bubble fields (Fields For Lease Documents data type)
const guestFields = {};

guestPayments.forEach((payment, index) => {
  const paymentNum = index + 1;

  // Format date as mm/dd/yyyy
  const scheduledDate = new Date(payment['Scheduled Date']);
  const formattedDate = `${String(scheduledDate.getMonth() + 1).padStart(2, '0')}/${String(scheduledDate.getDate()).padStart(2, '0')}/${scheduledDate.getFullYear()}`;

  // Assign to numbered fields
  guestFields[`guest date ${paymentNum}`] = formattedDate;
  guestFields[`guest rent ${paymentNum}`] = payment.Rent.toFixed(2);
  guestFields[`guest total ${paymentNum}`] = payment['Total Paid by Guest'].toFixed(2);
});

// STEP 3: Calculate number of payments
guestFields['Number of Payments (guest)'] = guestPayments.length;

// STEP 4: Return fields to update the Fields For Lease Documents thing
return guestFields;
```

### Alternative: Direct Supabase Query (Recommended)

Instead of using the `Payment Records Guest-SL` array, query directly by lease ID:

```javascript
// INPUT: Result of Step 2 (the Lease record)
const lease = this.result_of_step_2;
const leaseId = lease._id;

// Query payment records directly by lease ID
const { data: guestPayments, error } = await supabase
  .from('paymentrecords')
  .select(`
    "Payment #",
    "Scheduled Date",
    "Rent",
    "Maintenance Fee",
    "Total Paid by Guest",
    "Damage Deposit"
  `)
  .eq('Booking - Reservation', leaseId)
  .eq('Payment from guest?', true)
  .order('Payment #', { ascending: true })
  .limit(13);

if (error) {
  throw new Error(`Failed to fetch guest payments: ${error.message}`);
}

// Map to Fields For Lease Documents fields
const guestFields = {};

guestPayments.forEach((payment) => {
  const paymentNum = payment['Payment #'];

  // Format date as mm/dd/yyyy
  const scheduledDate = new Date(payment['Scheduled Date']);
  const mm = String(scheduledDate.getMonth() + 1).padStart(2, '0');
  const dd = String(scheduledDate.getDate()).padStart(2, '0');
  const yyyy = scheduledDate.getFullYear();
  const formattedDate = `${mm}/${dd}/${yyyy}`;

  // Map to document fields
  guestFields[`guest date ${paymentNum}`] = formattedDate;
  guestFields[`guest rent ${paymentNum}`] = payment.Rent.toFixed(2);
  guestFields[`guest total ${paymentNum}`] = payment['Total Paid by Guest'].toFixed(2);
});

// Calculate total number of payments
guestFields['Number of Payments (guest)'] = guestPayments.length;

return guestFields;
```

---

## Troubleshooting

### Issue: Payment records not found

**Cause**: Payment records have not been generated for this lease.

**Solution**: Call `guest-payment-records` edge function with `generate` action first.

```typescript
await supabase.functions.invoke('guest-payment-records', {
  body: {
    action: 'generate',
    payload: { leaseId, /* ... other fields */ }
  }
});
```

### Issue: Incorrect prorating

**Cause**: Week pattern not correctly specified or reservation span weeks incorrect.

**Solution**: Verify `week pattern` and `Reservation Span (weeks)` fields in the lease match the expected values.

### Issue: Date format mismatch

**Cause**: Supabase returns ISO timestamps, but lease documents expect mm/dd/yyyy.

**Solution**: Use `formatDateForDisplay()` helper function to convert.

```typescript
function formatDateForDisplay(isoDate: string): string {
  const date = new Date(isoDate);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}
```

---

## Related Documentation

- [Guest Payment Records Edge Function](../edge-functions/guest-payment-records.md)
- [Host Payment Records Edge Function](../edge-functions/host-payment-records.md)
- [Lease Documents Edge Function](../edge-functions/lease-documents.md)
- [Periodic Tenancy Agreement Template](../../.claude/Documentation/Backend\(EDGE%20-%20Functions\)/LEASE_DOCUMENTS.md)

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-04 | 1.0 | Initial documentation created |

---

**Maintained by**: Engineering Team
**Last Updated**: 2026-02-04
