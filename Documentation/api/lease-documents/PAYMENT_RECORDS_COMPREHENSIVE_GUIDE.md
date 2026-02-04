# Complete Payment Records Mapping Guide for Lease Documents

**Created**: 2026-02-04
**Version**: 1.1
**Purpose**: Comprehensive guide for calculating, fetching, and mapping both guest and host payment records from Supabase to lease document payloads

---

## Table of Contents

- [Overview](#overview)
- [Supabase Database Schema](#supabase-database-schema)
- [Guest Payment Records](#guest-payment-records)
- [Host Payment Records](#host-payment-records)
- [Key Differences: Guest vs Host](#key-differences-guest-vs-host)
- [Lease Document Payload Mapping](#lease-document-payload-mapping)
- [Complete Workflow Integration](#complete-workflow-integration)
  - [Step 2: Create Fields For Lease Documents](#step-2-implementation-create-fields-for-lease-documents)
  - [Step 6: Guest Payment Records](#step-6-implementation-guest-payment-records)
  - [Step 7: Host Payment Records](#step-7-implementation-host-payment-records)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

---

## Overview

This guide provides a complete reference for integrating Supabase payment records with the `lease-documents` Edge Function. It covers both guest and host payment records, their calculation logic, database structure, and mapping to all four lease document types:

1. **Host Payout Schedule Form**
2. **Supplemental Agreement**
3. **Periodic Tenancy Agreement**
4. **Credit Card Authorization Form**

### Document Generation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LEASE DOCUMENT GENERATION FLOW                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Lease Created/Accepted                                              │
│  2. Generate Payment Records (if not exist)                             │
│      ├─ guest-payment-records edge function                             │
│      └─ host-payment-records edge function                              │
│  3. Fetch Payment Records from Supabase                                 │
│      ├─ Query by lease ID                                               │
│      └─ Order by Payment #                                              │
│  4. Map to Document Payloads                                            │
│      ├─ Host Payout Schedule ← Host records                             │
│      ├─ Supplemental Agreement ← Listing data + images                  │
│      ├─ Periodic Tenancy ← Guest/Host + images                          │
│      └─ Credit Card Auth ← Guest records + metadata                     │
│  5. Call lease-documents Edge Function                                  │
│  6. Upload to Google Drive + Supabase Storage                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Supabase Database Schema

### Table: `paymentrecords`

All payment records (both guest and host) are stored in a single table with discriminator fields.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | text (PK) | Bubble-compatible ID |
| `Booking - Reservation` | text (FK) | Reference to lease ID (`bookings_leases._id`) |
| `Payment #` | integer | Payment sequence number (1-indexed) |
| `Scheduled Date` | timestamp | ISO date when payment is due |
| `Rent` | numeric | Rent amount for this period |
| `Maintenance Fee` | numeric | Maintenance/cleaning fee |
| `Total Paid by Guest` | numeric | **Guest records only** - Total payment amount |
| `Total Paid to Host` | numeric | **Host records only** - Net payout to host |
| `Damage Deposit` | numeric | Damage deposit (first guest payment only) |
| `Payment from guest?` | boolean | `true` for guest records, `false` for host records |
| `Payment to Host?` | boolean | `true` for host records, `false` for guest records |
| `source_calculation` | text | 'supabase-edge-function' or 'bubble' |
| `Created By` | text (FK) | User who created the record |
| `Created Date` | timestamp | Record creation timestamp |
| `Modified Date` | timestamp | Last modification timestamp |

### Table: `bookings_leases`

Leases maintain references to their payment records.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | text (PK) | Lease ID |
| `Agreement Number` | text | Unique agreement identifier (e.g., "AGR-12345") |
| `Payment Records Guest-SL` | text[] | Array of guest payment record IDs |
| `Payment Records Host-SL` | text[] | Array of host payment record IDs |
| `Total Rent` | numeric | Total reservation price (sum of guest payments minus deposit) |
| `Move In Date` | timestamp | Lease start date |
| `Move Out Date` | timestamp | Lease end date |
| `rental type` | text | 'Monthly', 'Weekly', or 'Nightly' |
| `week pattern` | text | Week selection pattern for weekly rentals |
| `4 week rent` | numeric | Rent for 4-week period (Weekly/Nightly) |
| `rent per month` | numeric | Rent per month (Monthly rentals) |
| `Maintenance Fee` | numeric | Cleaning/maintenance fee per period |
| `Damage Deposit` | numeric | Refundable security deposit |

---

## Guest Payment Records

### Business Rules

| Aspect | Value |
|--------|-------|
| **First Payment Due** | **3 days BEFORE move-in** |
| **Payment Intervals** | Monthly: 31 days, Weekly/Nightly: 28 days |
| **Damage Deposit** | Added to first payment only |
| **Service Fee** | Included in total (not shown separately) |
| **Total Rent** | Sum of payments MINUS damage deposit (deposit is refundable) |

### Calculation Logic

```typescript
// First payment date
const firstPaymentDate = subtractDays(moveInDate, 3);

// Payment intervals
const paymentInterval = rentalType === 'Monthly' ? 31 : 28; // days

// Number of payments
const numberOfPayments = rentalType === 'Monthly'
  ? Math.ceil(reservationSpanMonths)
  : Math.ceil(reservationSpanWeeks / 4);

// Last payment prorating
const lastPaymentRent = calculateProration({
  rentalType,
  baseRent,
  remainingWeeks: reservationSpanWeeks % 4,
  weekPattern,
  reservationSpanMonths: reservationSpanMonths % 1
});
```

### Prorating Logic - Guest Payments

#### Monthly Rentals

```typescript
// If reservation span is 3.5 months
const fullMonthPayments = Math.floor(3.5); // 3 payments at full rent
const fractionalMonth = 3.5 - 3; // 0.5
const lastPaymentRent = monthlyRent * fractionalMonth; // 50% of monthly rent
```

#### Weekly/Nightly Rentals

| Week Pattern | 1 Week Remaining | 2 Weeks | 3 Weeks |
|--------------|------------------|---------|---------|
| **Every week** | 25% of base | 50% of base | 75% of base |
| **One week on, one week off** | 50% of base | 50% of base | 100% of base |
| **Two weeks on, two weeks off** | 50% of base | 100% of base | 100% of base |
| **One week on, three weeks off** | 100% of base | 100% of base | 100% of base |

### SQL Query - Guest Payment Records

```sql
-- Fetch guest payment records for a lease
SELECT
  _id,
  "Payment #",
  "Scheduled Date",
  "Rent",
  "Maintenance Fee",
  "Total Paid by Guest",
  "Damage Deposit",
  "Created Date"
FROM paymentrecords
WHERE "Booking - Reservation" = '<lease_id>'
  AND "Payment from guest?" = true
  AND "Payment to Host?" = false
ORDER BY "Payment #" ASC
LIMIT 13;
```

### TypeScript - Guest Payment Records

```typescript
interface GuestPaymentRecord {
  _id: string;
  'Payment #': number;
  'Scheduled Date': string; // ISO timestamp
  'Rent': number;
  'Maintenance Fee': number;
  'Total Paid by Guest': number;
  'Damage Deposit'?: number; // Only on first payment
}

async function fetchGuestPaymentRecords(
  supabase: SupabaseClient,
  leaseId: string
): Promise<GuestPaymentRecord[]> {
  const { data, error } = await supabase
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
    .eq('Payment to Host?', false)
    .order('Payment #', { ascending: true })
    .limit(13);

  if (error) {
    throw new Error(`Failed to fetch guest payments: ${error.message}`);
  }

  return data as GuestPaymentRecord[];
}
```

---

## Host Payment Records

### Business Rules

| Aspect | Value |
|--------|-------|
| **First Payment Due** | **2 days AFTER move-in** |
| **Payment Intervals** | Monthly: 31 days, Weekly/Nightly: 28 days |
| **Service Fee** | Deducted from rent (platform takes 10%) |
| **Damage Deposit** | N/A (host doesn't pay deposit) |
| **Total Payout** | Sum of net payments to host |

### Calculation Logic

```typescript
// First payment date (2 days AFTER move-in)
const firstPaymentDate = addDays(moveInDate, 2);

// Host receives rent minus service fee
const serviceFeeRate = 0.10; // 10%
const hostPayment = rentAmount * (1 - serviceFeeRate);

// Number of payments (same as guest)
const numberOfPayments = rentalType === 'Monthly'
  ? Math.ceil(reservationSpanMonths)
  : Math.ceil(reservationSpanWeeks / 4);
```

### Prorating Logic - Host Payments

Host prorating follows the same logic as guest payments, but applied to the net amount after service fee deduction.

```typescript
// Calculate net rent after service fee
const netRent = grossRent * 0.90; // 90% goes to host

// Apply same prorating logic as guest
const proratedNetRent = netRent * proratingFactor;
```

### SQL Query - Host Payment Records

```sql
-- Fetch host payment records for a lease
SELECT
  _id,
  "Payment #",
  "Scheduled Date",
  "Rent",
  "Maintenance Fee",
  "Total Paid to Host",
  "Created Date"
FROM paymentrecords
WHERE "Booking - Reservation" = '<lease_id>'
  AND "Payment to Host?" = true
  AND "Payment from guest?" = false
ORDER BY "Payment #" ASC
LIMIT 13;
```

### TypeScript - Host Payment Records

```typescript
interface HostPaymentRecord {
  _id: string;
  'Payment #': number;
  'Scheduled Date': string; // ISO timestamp
  'Rent': number;
  'Maintenance Fee': number;
  'Total Paid to Host': number;
}

async function fetchHostPaymentRecords(
  supabase: SupabaseClient,
  leaseId: string
): Promise<HostPaymentRecord[]> {
  const { data, error } = await supabase
    .from('paymentrecords')
    .select(`
      _id,
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
    throw new Error(`Failed to fetch host payments: ${error.message}`);
  }

  return data as HostPaymentRecord[];
}
```

---

## Key Differences: Guest vs Host

### Side-by-Side Comparison

| Aspect | Guest Payment Records | Host Payment Records |
|--------|----------------------|---------------------|
| **First Payment Timing** | 3 days BEFORE move-in | 2 days AFTER move-in |
| **Damage Deposit** | Included in first payment | N/A (not applicable) |
| **Service Fee** | Guest pays (included in total) | Deducted from host payout |
| **Total Field** | `Total Paid by Guest` | `Total Paid to Host` |
| **Discriminator** | `Payment from guest? = true` | `Payment to Host? = true` |
| **Amount Calculation** | Rent + Maintenance + Deposit (first) | (Rent - Service Fee) |
| **Purpose** | What guest pays to platform | What platform pays to host |

### Example Calculation

```typescript
// Given:
const fourWeekRent = 2000;
const maintenanceFee = 100;
const damageDeposit = 500;
const serviceFeeRate = 0.10;

// Guest First Payment
const guestFirstPayment = fourWeekRent + maintenanceFee + damageDeposit;
// = 2000 + 100 + 500 = $2,600

// Guest Subsequent Payments
const guestSubsequentPayment = fourWeekRent + maintenanceFee;
// = 2000 + 100 = $2,100

// Host First Payment (2 days after move-in)
const hostFirstPayment = fourWeekRent * (1 - serviceFeeRate);
// = 2000 * 0.90 = $1,800

// Host Subsequent Payments
const hostSubsequentPayment = fourWeekRent * (1 - serviceFeeRate);
// = 2000 * 0.90 = $1,800

// Platform Revenue (per payment cycle)
const platformRevenue = fourWeekRent * serviceFeeRate + maintenanceFee;
// = 2000 * 0.10 + 100 = $300
```

---

## Lease Document Payload Mapping

### 1. Host Payout Schedule Form

**Uses**: Host payment records
**Template**: `host_payout/hostpayoutscheduleform.docx`

#### Required Fields

```typescript
interface HostPayoutPayload {
  'Agreement Number': string;
  'Host Name': string;
  'Host Email': string;
  'Host Phone': string;
  'Address': string;
  'Payout Number': string;
  'Maintenance Fee': string;
  // Up to 13 payment entries
  'Date1'?: string;   // mm/dd/yyyy
  'Rent1'?: string;   // $X,XXX.XX
  'Total1'?: string;  // $X,XXX.XX
  // ... Date2-13, Rent2-13, Total2-13
}
```

#### Mapping Logic

```typescript
async function mapHostPayoutPayload(
  lease: Lease,
  hostPayments: HostPaymentRecord[]
): Promise<HostPayoutPayload> {
  const payload: HostPayoutPayload = {
    'Agreement Number': lease['Agreement Number'],
    'Host Name': lease.Host?.name || '',
    'Host Email': lease.Host?.email || '',
    'Host Phone': lease.Host?.phone || '',
    'Address': lease.Listing?.address || '',
    'Payout Number': `PAY-${lease['Agreement Number']}`,
    'Maintenance Fee': formatCurrency(hostPayments[0]?.['Maintenance Fee'] || 0),
  };

  // Map up to 13 payments
  hostPayments.slice(0, 13).forEach((payment, index) => {
    const num = index + 1;
    const scheduledDate = new Date(payment['Scheduled Date']);

    payload[`Date${num}`] = formatDate(scheduledDate); // mm/dd/yyyy
    payload[`Rent${num}`] = formatCurrency(payment.Rent);
    payload[`Total${num}`] = formatCurrency(payment['Total Paid to Host']);
  });

  return payload;
}

// Helper functions
function formatDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
```

---

### 2. Supplemental Agreement

**Uses**: Listing data + images (no payment records)
**Template**: `supplemental/supplementalagreement.docx`

#### Required Fields

```typescript
interface SupplementalPayload {
  'Agreement Number': string;
  'Check in Date': string;
  'Check Out Date': string;
  'Number of weeks': string;
  'Guests Allowed': string;
  'Host Name': string;
  'Listing Title': string;
  'Listing Description': string;
  'Location': string;
  'Type of Space': string;
  'Space Details': string;
  'Supplemental Number': string;
  'image1'?: string; // URL or base64
  'image2'?: string;
  'image3'?: string;
}
```

#### Mapping Logic

```typescript
async function mapSupplementalPayload(
  lease: Lease,
  listing: Listing
): Promise<SupplementalPayload> {
  // Calculate number of weeks
  const moveIn = new Date(lease['Move In Date']);
  const moveOut = new Date(lease['Move Out Date']);
  const diffTime = Math.abs(moveOut.getTime() - moveIn.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const numberOfWeeks = Math.ceil(diffDays / 7);

  return {
    'Agreement Number': lease['Agreement Number'],
    'Check in Date': formatDate(moveIn),
    'Check Out Date': formatDate(moveOut),
    'Number of weeks': numberOfWeeks.toString(),
    'Guests Allowed': listing['guests allowed']?.toString() || '1',
    'Host Name': lease.Host?.name || '',
    'Listing Title': listing.title || '',
    'Listing Description': listing.description || '',
    'Location': listing.address || '',
    'Type of Space': listing['type of space'] || '',
    'Space Details': listing['space details'] || '',
    'Supplemental Number': `SUP-${lease['Agreement Number']}`,
    'image1': listing.photos?.[0] || '',
    'image2': listing.photos?.[1] || '',
    'image3': listing.photos?.[2] || '',
  };
}
```

---

### 3. Periodic Tenancy Agreement

**Uses**: Lease data + listing data + images + cross-references
**Template**: `periodic_tenancy/periodictenancyagreement.docx`

#### Required Fields

```typescript
interface PeriodicTenancyPayload {
  'Agreement Number': string;
  'Check in Date': string;
  'Check Out Date': string;
  'Check In Day': string;        // "Monday", "Tuesday", etc.
  'Check Out Day': string;
  'Number of weeks': string;
  'Guests Allowed': string;
  'Host name': string;            // lowercase 'name'
  'Guest name': string;           // lowercase 'name'
  'Supplemental Number': string;
  'Authorization Card Number': string;
  'Host Payout Schedule Number': string;
  'Extra Requests on Cancellation Policy'?: string;
  'Damage Deposit': string;
  'Listing Title': string;
  'Listing Description': string;
  'Location': string;
  'Type of Space': string;
  'Space Details': string;
  'House Rules'?: string | string[];
  'image1'?: string;
  'image2'?: string;
  'image3'?: string;
}
```

#### Mapping Logic

```typescript
async function mapPeriodicTenancyPayload(
  lease: Lease,
  listing: Listing,
  guestPayments: GuestPaymentRecord[]
): Promise<PeriodicTenancyPayload> {
  const moveIn = new Date(lease['Move In Date']);
  const moveOut = new Date(lease['Move Out Date']);

  // Get day names
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const checkInDay = dayNames[moveIn.getDay()];
  const checkOutDay = dayNames[moveOut.getDay()];

  // Calculate weeks
  const diffDays = Math.ceil((moveOut.getTime() - moveIn.getTime()) / (1000 * 60 * 60 * 24));
  const numberOfWeeks = Math.ceil(diffDays / 7);

  return {
    'Agreement Number': lease['Agreement Number'],
    'Check in Date': formatDate(moveIn),
    'Check Out Date': formatDate(moveOut),
    'Check In Day': checkInDay,
    'Check Out Day': checkOutDay,
    'Number of weeks': numberOfWeeks.toString(),
    'Guests Allowed': listing['guests allowed']?.toString() || '1',
    'Host name': lease.Host?.name || '',
    'Guest name': lease.Guest?.name || '',
    'Supplemental Number': `SUP-${lease['Agreement Number']}`,
    'Authorization Card Number': `AUTH-${lease['Agreement Number']}`,
    'Host Payout Schedule Number': `PAY-${lease['Agreement Number']}`,
    'Extra Requests on Cancellation Policy': lease['cancellation policy extras'] || 'N/A',
    'Damage Deposit': formatCurrency(guestPayments[0]?.['Damage Deposit'] || 0),
    'Listing Title': listing.title || '',
    'Listing Description': listing.description || '',
    'Location': listing.address || '',
    'Type of Space': listing['type of space'] || '',
    'Space Details': listing['space details'] || '',
    'House Rules': listing['house rules'] || [],
    'image1': listing.photos?.[0] || '',
    'image2': listing.photos?.[1] || '',
    'image3': listing.photos?.[2] || '',
  };
}
```

---

### 4. Credit Card Authorization Form

**Uses**: Guest payment records + metadata
**Template**: `credit_card_auth/recurringcreditcardauthorization[prorated].docx`

#### Required Fields

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
async function mapCreditCardAuthPayload(
  lease: Lease,
  listing: Listing,
  guestPayments: GuestPaymentRecord[]
): Promise<CreditCardAuthPayload> {
  const firstPayment = guestPayments[0];
  const lastPayment = guestPayments[guestPayments.length - 1];
  const penultimatePayment = guestPayments[guestPayments.length - 2];

  // Calculate total weeks
  const moveIn = new Date(lease['Move In Date']);
  const moveOut = new Date(lease['Move Out Date']);
  const diffDays = Math.ceil((moveOut.getTime() - moveIn.getTime()) / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.ceil(diffDays / 7);

  // Check if prorated (last payment < full rent)
  const isProrated = lastPayment.Rent < firstPayment.Rent;

  // Calculate remaining weeks for last payment
  const fullFourWeekCycles = Math.floor(totalWeeks / 4);
  const remainingWeeks = totalWeeks - (fullFourWeekCycles * 4);

  return {
    'Agreement Number': lease['Agreement Number'],
    'Host Name': lease.Host?.name || '',
    'Guest Name': lease.Guest?.name || '',
    'Four Week Rent': formatCurrency(firstPayment.Rent),
    'Maintenance Fee': formatCurrency(firstPayment['Maintenance Fee']),
    'Damage Deposit': formatCurrency(firstPayment['Damage Deposit'] || 0),
    'Splitlease Credit': formatCurrency(0), // Fetch from proposal if applicable
    'Last Payment Rent': formatCurrency(lastPayment.Rent),
    'Weeks Number': totalWeeks.toString(),
    'Listing Description': listing.description || '',
    'Penultimate Week Number': penultimatePayment
      ? (guestPayments.length - 1).toString()
      : '0',
    'Number of Payments': guestPayments.length.toString(),
    'Last Payment Weeks': remainingWeeks > 0 ? remainingWeeks.toString() : '4',
    'Is Prorated': isProrated,
  };
}
```

---

## Complete Workflow Integration

### Bubble.io Workflow: Generate Lease Documents

This section provides the complete implementation for Steps 6 and 7 of the Bubble.io workflow.

#### Workflow Structure

```
Step 1: Make changes to Bookings - Leases
  └─ Set status to "Generating Documents"

Step 2: Create a new Fields For Lease Documents
  └─ Creates document fields record
  └─ Result: The LEASE record (Bookings - Leases)

Step 3: Create a new Fields For Lease Documents (conditional)
  └─ Only when Current date/time is empty

Step 4: Trigger Python Fields for Document Creation
  └─ Triggers external service

Step 5: Make changes to Fields For Lease Documents (EXTRA RESTRICTIONS)
  └─ References: D: Choose Reservation's Listing's host restrictions
  └─ Only when field is empty

Step 6: Make changes to Fields For Lease Documents (GUEST RECORDS) ← FOCUS
  └─ References: D: Choose Reservation's Payment Records Guest-SL
  └─ Populates: guest date 1-13, guest rent 1-13, guest total 1-13

Step 7: Make changes to Fields For Lease Documents (HOST RECORDS) ← FOCUS
  └─ References: D: Choose Reservation's Payment Records Host-SL
  └─ Populates: Date1-13, Rent1-13, Total1-13

Step 8: PythonAnywhere Service - *Host Payout Schedule Form
  └─ Calls lease-documents edge function

Step 9: Make changes to Bookings - Leases
  └─ Set status to "Documents Generated"
```

---

### Step 2 Implementation: Create Fields For Lease Documents

Step 2 creates the `Fields For Lease Documents` record and populates it with data from the reservation, proposal, listing, and user accounts. This is the foundational step before payment records are added in Steps 6 and 7.

> **Important**: Step 2's result (`this.result_of_step_2`) returns the **Lease record** (`Bookings - Leases`), NOT the newly created Fields For Lease Documents record. This is a critical distinction for subsequent steps.

#### Field Mappings

| Field | Data Source | Notes |
|-------|-------------|-------|
| **Address of the Property** | `D: Choose Reservation's value's Listing's Location - Address` | Full street address |
| **Agreement number** | `D: Choose Reservation's value's Agreement Number` | e.g., "AGR-12345" |
| **Cancellation Policy** | `D: Choose Reservation's value's Cancellation Policy's Display` | Human-readable policy |
| **check in weekly** | `D: Choose Reservation's value's Proposal's hc check in day's Display` | Day of week |
| **check in date** | `D: Choose Reservation's value's Reservation Period: Start:formatted as 2/04/26` | Start date |
| **last night weekly** | `D: Choose Reservation's value's Proposal's hc nights selected:last item's Display` | Last night of week |
| **check out date** | `D: Choose Reservation's value's Reservation Period: End:formatted as 2/04/26` | End date |
| **Extra Requests on Cancellation Policy** | `D: Choose Reservation's value's Listing's host restrictions's Guidelines` | Host restrictions |
| **Guest email** | `D: Choose Reservation's value's Guest's email` | Guest contact |
| **Guest name** | `D: Choose Reservation's value's Guest's Name - Full` | Full name |
| **Guest number** | `D: Choose Reservation's value's Guest's Phone Number (as text)` | Phone |
| **Host email** | `D: Choose Reservation's value's Proposal's Host - Account's User's email` | Host contact |
| **Host name** | `D: Choose Reservation's value's Proposal's Host - Account's User's Name - Full` | Full name |
| **Host number** | `D: Choose Reservation's value's Proposal's Host - Account's User's Phone Number (as text)` | Phone |
| **house rules set list** | `D: Choose Reservation's value's Proposal's hc house rules:each item's Name` | Array of rules |
| **Listing type** | `D: Choose Reservation's value's Listing's rental type's Display` | Monthly/Weekly/Nightly |
| **Nights Selected set list** | `D: Choose Reservation's value's Proposal's hc nights selected` | Array of night indices |
| **Number of nights per week** | `D: Choose Reservation's value's Proposal's hc nights selected:count` | Count |
| **Number of weeks** | `D: Choose Reservation's value's Proposal's hc reservation span (weeks)` | Duration |
| **Damage Deposit** | `D: Choose Reservation's value's Proposal's hc damage deposit:formatted as 1,028.58` | Currency formatted |
| **Host Compensation** | `D: Choose Reservation's value's Proposal's hc host compensation (per period):formatted as 1,028.58` | Per-period payout |
| **4 week rent** | `D: Choose Reservation's value's Proposal's 4 week rent:formatted as 1,028.58` | 4-week rate |
| **Price per night** | `D: Choose Reservation's value's Proposal's hc nightly price:formatted as 1,028.58` | Nightly rate |
| **Total Host Compensation** | `D: Choose Reservation's value's Proposal's hc total host compensation:formatted as 1,028.58` | Full payout |
| **Authorization Card Number** | `D: Choose Reservation's value's Agreement Number append -ARCCC-G1` | Auth form ID |
| **Host Payout Schedule Number** | `D: Choose Reservation's value's Agreement Number append -PSF` | Payout form ID |
| **Supplemental Number** | `D: Choose Reservation's value's Agreement Number append -SUPL` | Supplemental form ID |
| **Due date for payment** | `Click` | Clickable trigger |
| **Guest allowed** | `D: Choose Reservation's value's Listing's Features - Qty Guests` | Max guests |
| **Listing Description** | `D: Choose Reservation's value's Listing's Description` | Full description |
| **Number of Payments (host)** | `D: Choose Reservation's value's Total Amount of Payments` | Payment count |
| **Listing Amenities Building set list** | `D: Choose Reservation's value's Listing's Features - Amenities In-Building:each item's Name` | Building amenities |
| **Listing Amenities InUnit set list** | `D: Choose Reservation's value's Listing's Features - Amenities In-Unit merged with Amenities In-Building` | Combined amenities |
| **Location** | `Arbitrary text` | Custom location text |
| **Image1** | `D: Choose Reservation's value's Listing's Features - Photos:first item's Photo` | Primary photo |
| **Image2** | `D: Choose Reservation's value's Listing's Features - Photos:item #2's Photo` | Second photo |
| **Image3** | `D: Choose Reservation's value's Listing's Features - Photos:item #3's Photo` | Third photo |
| **Listing Name** | `D: Choose Reservation's value's Listing's Name` | Property name |

---

#### Boolean Formatting Patterns

Bubble.io uses Boolean Formatting to conditionally output text based on field values. The pattern is:
- **Condition**: A boolean expression (e.g., "value is not empty", "value > 0")
- **Formatting for yes**: Text output when condition is true
- **Formatting for no**: Text output when condition is false (often empty)

##### Type of Space Field

Builds a comma-separated description of the space type:

| Condition | Yes Format | No Format |
|-----------|------------|-----------|
| `Type of Space's Label is not empty` | `{Type of Space's Label append , }` | (empty) |
| `SQFT Area is not empty` | `({SQFT Area:formatted as 1028.58} SQFT) -` | (empty) |
| `Qty Guests is not empty` | `{Qty Guests} guest(s) max` | (empty) |

**Example Output**: `"Studio, (450 SQFT) - 2 guest(s) max"`

##### Splitlease Credit Field

Handles the case where Splitlease Credits may be empty:

| Condition | Yes Format | No Format |
|-----------|------------|-----------|
| `IN: Splitlease Credits's value is empty` | `0` | `{IN: Splitlease Credits's value}` |

**Logic**: If credits are empty, display `0`; otherwise display the actual value (then converted to number).

##### Details of Space Field

Builds a detailed room description with multiple nested conditions:

| Condition | Yes Format | No Format |
|-----------|------------|-----------|
| `Qty Bedrooms is 0` | `Studio` | (empty) |
| `Qty Bedrooms > 1` | `{Qty Bedrooms}:formatted as text append Bedroom(s) -` | (empty) |
| `Qty Beds is not empty` | `{Qty Beds} bed` | (empty) |
| `Qty Beds > 1` | `(s) -` | (empty) |
| `Qty Bathrooms ≥ 1` | `{Qty Bathrooms}:formatted as 1028.58 append bathroom(s)` | (empty) |
| `Kitchen Type's Display` | (appended at end) | (empty) |

**Example Outputs**:
- Studio: `"Studio - 1 bed - 1 bathroom(s) - Full Kitchen"`
- Multi-bedroom: `"2 Bedroom(s) - 3 bed(s) - 2 bathroom(s) - Kitchenette"`

---

#### TypeScript Implementation: Step 2 Logic

```typescript
/**
 * Build Fields For Lease Documents from a reservation
 * Replicates Bubble.io Step 2 logic
 */
interface FieldsForLeaseDocuments {
  // Identification
  'Address of the Property': string;
  'Agreement number': string;
  'Authorization Card Number': string;
  'Host Payout Schedule Number': string;
  'Supplemental Number': string;

  // Dates
  'check in date': string;
  'check out date': string;
  'check in weekly': string;
  'last night weekly': string;

  // Guest Info
  'Guest email': string;
  'Guest name': string;
  'Guest number': string;

  // Host Info
  'Host email': string;
  'Host name': string;
  'Host number': string;

  // Listing Details
  'Listing type': string;
  'Listing Name': string;
  'Listing Description': string;
  'Type of Space': string;
  'Details of Space': string;
  'Guest allowed': number;

  // Financials (currency formatted as strings)
  'Damage Deposit': string;
  'Host Compensation': string;
  '4 week rent': string;
  'Price per night': string;
  'Total Host Compensation': string;
  'Splitlease Credit': number;

  // Duration
  'Number of weeks': number;
  'Number of nights per week': number;
  'Number of Payments (host)': number;

  // Lists
  'Nights Selected set list': number[];
  'house rules set list': string[];
  'Listing Amenities Building set list': string[];
  'Listing Amenities InUnit set list': string[];

  // Images
  'Image1': string;
  'Image2': string;
  'Image3': string;

  // Policies
  'Cancellation Policy': string;
  'Extra Requests on Cancellation Policy': string;
}

function buildFieldsForLeaseDocuments(
  reservation: Reservation,
  proposal: Proposal,
  listing: Listing,
  guest: User,
  host: User,
  splitleaseCredits: number | null
): FieldsForLeaseDocuments {
  // Format currency helper
  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Format date helper
  const formatDate = (date: Date): string => {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
  };

  // Build Type of Space with Boolean Formatting logic
  const buildTypeOfSpace = (): string => {
    const parts: string[] = [];

    // Type of Space Label
    if (listing.features.typeOfSpace?.label) {
      parts.push(`${listing.features.typeOfSpace.label},`);
    }

    // SQFT Area
    if (listing.features.sqftArea) {
      parts.push(`(${formatCurrency(listing.features.sqftArea)} SQFT) -`);
    }

    // Qty Guests
    if (listing.features.qtyGuests) {
      parts.push(`${listing.features.qtyGuests} guest(s) max`);
    }

    return parts.join(' ');
  };

  // Build Details of Space with Boolean Formatting logic
  const buildDetailsOfSpace = (): string => {
    const parts: string[] = [];

    // Bedrooms (0 = Studio)
    if (listing.features.qtyBedrooms === 0) {
      parts.push('Studio');
    } else if (listing.features.qtyBedrooms > 1) {
      parts.push(`${listing.features.qtyBedrooms} Bedroom(s) -`);
    }

    // Beds
    if (listing.features.qtyBeds) {
      const bedText = listing.features.qtyBeds > 1
        ? `${listing.features.qtyBeds} bed(s) -`
        : `${listing.features.qtyBeds} bed -`;
      parts.push(bedText);
    }

    // Bathrooms
    if (listing.features.qtyBathrooms >= 1) {
      parts.push(`${formatCurrency(listing.features.qtyBathrooms)} bathroom(s)`);
    }

    // Kitchen Type
    if (listing.kitchenType?.display) {
      parts.push(`- ${listing.kitchenType.display}`);
    }

    return parts.join(' ');
  };

  return {
    // Identification
    'Address of the Property': listing.location?.address || '',
    'Agreement number': reservation.agreementNumber || '',
    'Authorization Card Number': `${reservation.agreementNumber}-ARCCC-G1`,
    'Host Payout Schedule Number': `${reservation.agreementNumber}-PSF`,
    'Supplemental Number': `${reservation.agreementNumber}-SUPL`,

    // Dates
    'check in date': formatDate(new Date(reservation.reservationPeriod.start)),
    'check out date': formatDate(new Date(reservation.reservationPeriod.end)),
    'check in weekly': proposal.hcCheckInDay?.display || '',
    'last night weekly': proposal.hcNightsSelected?.slice(-1)[0]?.display || '',

    // Guest Info
    'Guest email': guest.email || '',
    'Guest name': guest.nameFull || '',
    'Guest number': guest.phoneNumber || '',

    // Host Info
    'Host email': host.email || '',
    'Host name': host.nameFull || '',
    'Host number': host.phoneNumber || '',

    // Listing Details
    'Listing type': listing.rentalType?.display || '',
    'Listing Name': listing.name || '',
    'Listing Description': listing.description || '',
    'Type of Space': buildTypeOfSpace(),
    'Details of Space': buildDetailsOfSpace(),
    'Guest allowed': listing.features.qtyGuests || 0,

    // Financials
    'Damage Deposit': formatCurrency(proposal.hcDamageDeposit || 0),
    'Host Compensation': formatCurrency(proposal.hcHostCompensationPerPeriod || 0),
    '4 week rent': formatCurrency(proposal.fourWeekRent || 0),
    'Price per night': formatCurrency(proposal.hcNightlyPrice || 0),
    'Total Host Compensation': formatCurrency(proposal.hcTotalHostCompensation || 0),
    'Splitlease Credit': splitleaseCredits ?? 0,

    // Duration
    'Number of weeks': proposal.hcReservationSpanWeeks || 0,
    'Number of nights per week': proposal.hcNightsSelected?.length || 0,
    'Number of Payments (host)': reservation.totalAmountOfPayments || 0,

    // Lists
    'Nights Selected set list': proposal.hcNightsSelected?.map(n => n.index) || [],
    'house rules set list': proposal.hcHouseRules?.map(r => r.name) || [],
    'Listing Amenities Building set list': listing.features.amenitiesInBuilding?.map(a => a.name) || [],
    'Listing Amenities InUnit set list': [
      ...(listing.features.amenitiesInUnit?.map(a => a.name) || []),
      ...(listing.features.amenitiesInBuilding?.map(a => a.name) || [])
    ],

    // Images
    'Image1': listing.features.photos?.[0]?.photo || '',
    'Image2': listing.features.photos?.[1]?.photo || '',
    'Image3': listing.features.photos?.[2]?.photo || '',

    // Policies
    'Cancellation Policy': reservation.cancellationPolicy?.display || '',
    'Extra Requests on Cancellation Policy': listing.hostRestrictions?.guidelines || '',
  };
}
```

---

### Step 6 Implementation: Guest Payment Records

```javascript
/**
 * Bubble.io Workflow Step 6: Make changes to Fields For Lease Documents GUEST RECORDS
 *
 * INPUT: Result of Step 2 (the Lease record from Bookings - Leases)
 * OUTPUT: Object with guest payment fields to update
 */

// Get the lease from Step 2's result
const lease = this.result_of_step_2; // Bookings - Leases record
const leaseId = lease._id;

// Initialize Supabase client (assuming it's available in Bubble)
const supabase = window.supabaseClient || createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

// Query guest payment records directly by lease ID
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
  .eq('Payment to Host?', false)
  .order('Payment #', { ascending: true })
  .limit(13);

if (error) {
  console.error('Failed to fetch guest payments:', error);
  throw new Error(`Failed to fetch guest payments: ${error.message}`);
}

console.log(`Fetched ${guestPayments.length} guest payment records`);

// Initialize fields object
const guestFields = {};

// Map each payment to numbered fields
guestPayments.forEach((payment) => {
  const paymentNum = payment['Payment #'];

  // Format date as mm/dd/yyyy
  const scheduledDate = new Date(payment['Scheduled Date']);
  const mm = String(scheduledDate.getMonth() + 1).padStart(2, '0');
  const dd = String(scheduledDate.getDate()).padStart(2, '0');
  const yyyy = scheduledDate.getFullYear();
  const formattedDate = `${mm}/${dd}/${yyyy}`;

  // Format currency as $X,XXX.XX
  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Assign to numbered fields (e.g., "guest date 1", "guest rent 1", etc.)
  guestFields[`guest date ${paymentNum}`] = formattedDate;
  guestFields[`guest rent ${paymentNum}`] = formatCurrency(payment.Rent);
  guestFields[`guest total ${paymentNum}`] = formatCurrency(payment['Total Paid by Guest']);
});

// Add metadata fields
guestFields['Number of Payments (guest)'] = guestPayments.length;

// Return the fields to update the Fields For Lease Documents record
return guestFields;
```

---

### Step 7 Implementation: Host Payment Records

```javascript
/**
 * Bubble.io Workflow Step 7: Make changes to Fields For Lease Documents HOST RECORDS
 *
 * INPUT: Result of Step 2 (the Lease record from Bookings - Leases)
 * OUTPUT: Object with host payment fields to update
 */

// Get the lease from Step 2's result
const lease = this.result_of_step_2; // Bookings - Leases record
const leaseId = lease._id;

// Initialize Supabase client
const supabase = window.supabaseClient || createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

// Query host payment records directly by lease ID
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
  throw new Error(`Failed to fetch host payments: ${error.message}`);
}

console.log(`Fetched ${hostPayments.length} host payment records`);

// Initialize fields object
const hostFields = {};

// Map each payment to numbered fields
hostPayments.forEach((payment) => {
  const paymentNum = payment['Payment #'];

  // Format date as mm/dd/yyyy
  const scheduledDate = new Date(payment['Scheduled Date']);
  const mm = String(scheduledDate.getMonth() + 1).padStart(2, '0');
  const dd = String(scheduledDate.getDate()).padStart(2, '0');
  const yyyy = scheduledDate.getFullYear();
  const formattedDate = `${mm}/${dd}/${yyyy}`;

  // Format currency as $X,XXX.XX
  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Assign to numbered fields (matching Python payload format)
  // Note: Host fields use capital letters (Date1, Rent1, Total1)
  hostFields[`Date${paymentNum}`] = formattedDate;
  hostFields[`Rent${paymentNum}`] = formatCurrency(payment.Rent);
  hostFields[`Total${paymentNum}`] = formatCurrency(payment['Total Paid to Host']);
});

// Add metadata fields
hostFields['Payout Number'] = `PAY-${lease['Agreement Number']}`;
hostFields['Maintenance Fee'] = hostPayments.length > 0
  ? formatCurrency(hostPayments[0]['Maintenance Fee'])
  : '$0.00';

// Return the fields to update the Fields For Lease Documents record
return hostFields;
```

---

### Complete Edge Function Call Example

After populating the Fields For Lease Documents record, call the lease-documents edge function:

```javascript
/**
 * Generate all 4 lease documents
 * This would be Step 8 in the Bubble.io workflow
 */

async function generateAllLeaseDocuments(lease, documentFields) {
  const supabase = createClient('https://your-project.supabase.co', 'your-anon-key');

  // Build the complete payload
  const payload = {
    hostPayout: {
      'Agreement Number': lease['Agreement Number'],
      'Host Name': lease.Host?.name || '',
      'Host Email': lease.Host?.email || '',
      'Host Phone': lease.Host?.phone || '',
      'Address': lease.Listing?.address || '',
      'Payout Number': documentFields['Payout Number'],
      'Maintenance Fee': documentFields['Maintenance Fee'],
      // Copy Date1-13, Rent1-13, Total1-13 from documentFields
      ...Object.fromEntries(
        Object.entries(documentFields)
          .filter(([key]) => key.match(/^(Date|Rent|Total)\d+$/))
      )
    },

    supplemental: {
      'Agreement Number': lease['Agreement Number'],
      'Check in Date': formatDate(new Date(lease['Move In Date'])),
      'Check Out Date': formatDate(new Date(lease['Move Out Date'])),
      'Number of weeks': calculateWeeks(lease['Move In Date'], lease['Move Out Date']).toString(),
      'Guests Allowed': lease.Listing?.['guests allowed']?.toString() || '1',
      'Host Name': lease.Host?.name || '',
      'Listing Title': lease.Listing?.title || '',
      'Listing Description': lease.Listing?.description || '',
      'Location': lease.Listing?.address || '',
      'Type of Space': lease.Listing?.['type of space'] || '',
      'Space Details': lease.Listing?.['space details'] || '',
      'Supplemental Number': `SUP-${lease['Agreement Number']}`,
      'image1': lease.Listing?.photos?.[0] || '',
      'image2': lease.Listing?.photos?.[1] || '',
      'image3': lease.Listing?.photos?.[2] || '',
    },

    periodicTenancy: {
      'Agreement Number': lease['Agreement Number'],
      'Check in Date': formatDate(new Date(lease['Move In Date'])),
      'Check Out Date': formatDate(new Date(lease['Move Out Date'])),
      'Check In Day': getDayName(new Date(lease['Move In Date'])),
      'Check Out Day': getDayName(new Date(lease['Move Out Date'])),
      'Number of weeks': calculateWeeks(lease['Move In Date'], lease['Move Out Date']).toString(),
      'Guests Allowed': lease.Listing?.['guests allowed']?.toString() || '1',
      'Host name': lease.Host?.name || '',
      'Guest name': lease.Guest?.name || '',
      'Supplemental Number': `SUP-${lease['Agreement Number']}`,
      'Authorization Card Number': `AUTH-${lease['Agreement Number']}`,
      'Host Payout Schedule Number': documentFields['Payout Number'],
      'Extra Requests on Cancellation Policy': documentFields['Extra Requests on Cancellation Policy'] || 'N/A',
      'Damage Deposit': documentFields['guest total 1']?.replace(/[^0-9.-]/g, '') || '0',
      'Listing Title': lease.Listing?.title || '',
      'Listing Description': lease.Listing?.description || '',
      'Location': lease.Listing?.address || '',
      'Type of Space': lease.Listing?.['type of space'] || '',
      'Space Details': lease.Listing?.['space details'] || '',
      'House Rules': lease.Listing?.['house rules'] || [],
      'image1': lease.Listing?.photos?.[0] || '',
      'image2': lease.Listing?.photos?.[1] || '',
      'image3': lease.Listing?.photos?.[2] || '',
    },

    creditCardAuth: {
      'Agreement Number': lease['Agreement Number'],
      'Host Name': lease.Host?.name || '',
      'Guest Name': lease.Guest?.name || '',
      'Four Week Rent': documentFields['guest rent 1'] || '$0.00',
      'Maintenance Fee': documentFields['Maintenance Fee'] || '$0.00',
      'Damage Deposit': extractAmount(documentFields['guest total 1']) -
                        extractAmount(documentFields['guest rent 1']) -
                        extractAmount(documentFields['Maintenance Fee']),
      'Splitlease Credit': '0',
      'Last Payment Rent': documentFields[`guest rent ${documentFields['Number of Payments (guest)']}`] || '$0.00',
      'Weeks Number': calculateWeeks(lease['Move In Date'], lease['Move Out Date']).toString(),
      'Listing Description': lease.Listing?.description || '',
      'Penultimate Week Number': (documentFields['Number of Payments (guest)'] - 1).toString(),
      'Number of Payments': documentFields['Number of Payments (guest)'].toString(),
      'Last Payment Weeks': calculateRemainingWeeks(lease).toString(),
      'Is Prorated': isLastPaymentProrated(documentFields),
    },
  };

  // Call the edge function
  const { data, error } = await supabase.functions.invoke('lease-documents', {
    body: {
      action: 'generate_all',
      payload: payload
    }
  });

  if (error) {
    throw new Error(`Failed to generate documents: ${error.message}`);
  }

  console.log('All documents generated successfully:', data);
  return data;
}

// Helper functions
function formatDate(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function getDayName(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

function calculateWeeks(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 7);
}

function extractAmount(currencyString) {
  return parseFloat(currencyString.replace(/[^0-9.-]/g, '')) || 0;
}

function isLastPaymentProrated(documentFields) {
  const numPayments = documentFields['Number of Payments (guest)'];
  const firstRent = extractAmount(documentFields['guest rent 1']);
  const lastRent = extractAmount(documentFields[`guest rent ${numPayments}`]);
  return lastRent < firstRent;
}

function calculateRemainingWeeks(lease) {
  const totalWeeks = calculateWeeks(lease['Move In Date'], lease['Move Out Date']);
  return totalWeeks % 4 || 4;
}
```

---

## Troubleshooting

### Issue: Payment records not found

**Symptoms**:
- Empty payment arrays
- Error: "No payment records found for lease"

**Cause**: Payment records have not been generated yet.

**Solution**:
```typescript
// Check if payment records exist
const { data: lease } = await supabase
  .from('bookings_leases')
  .select('_id, "Payment Records Guest-SL", "Payment Records Host-SL"')
  .eq('_id', leaseId)
  .single();

// Generate if missing
if (!lease['Payment Records Guest-SL'] || lease['Payment Records Guest-SL'].length === 0) {
  await supabase.functions.invoke('guest-payment-records', {
    body: {
      action: 'generate',
      payload: { leaseId, /* ... other fields */ }
    }
  });
}

if (!lease['Payment Records Host-SL'] || lease['Payment Records Host-SL'].length === 0) {
  await supabase.functions.invoke('host-payment-records', {
    body: {
      action: 'generate',
      payload: { leaseId, /* ... other fields */ }
    }
  });
}
```

---

### Issue: Incorrect prorating calculation

**Symptoms**:
- Last payment is full rent when it should be prorated
- Or vice versa

**Cause**: Incorrect `reservationSpanWeeks` or `reservationSpanMonths` value.

**Solution**: Verify the lease data:
```typescript
const totalWeeks = calculateWeeks(lease['Move In Date'], lease['Move Out Date']);
const expectedFullCycles = Math.floor(totalWeeks / 4);
const expectedRemainder = totalWeeks % 4;

console.log(`Total weeks: ${totalWeeks}`);
console.log(`Full 4-week cycles: ${expectedFullCycles}`);
console.log(`Remaining weeks: ${expectedRemainder}`);

// Last payment should be prorated if expectedRemainder > 0
```

---

### Issue: Date format mismatch

**Symptoms**:
- Dates showing as "Invalid Date" or ISO timestamps in documents

**Cause**: Supabase returns ISO timestamps, but documents expect mm/dd/yyyy.

**Solution**: Always use the formatting helper:
```typescript
function formatDateForDocument(isoDate: string): string {
  const date = new Date(isoDate);

  // Validate date
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${isoDate}`);
  }

  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();

  return `${mm}/${dd}/${yyyy}`;
}
```

---

### Issue: Currency formatting inconsistencies

**Symptoms**:
- Amounts showing as "2000" instead of "$2,000.00"
- Missing dollar signs or decimal places

**Cause**: Direct number-to-string conversion without formatting.

**Solution**: Use consistent currency formatter:
```typescript
function formatCurrency(amount: number): string {
  // Validate input
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0.00';
  }

  // Format with locale
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

// Examples:
formatCurrency(2000);     // "$2,000.00"
formatCurrency(150.5);    // "$150.50"
formatCurrency(0);        // "$0.00"
```

---

### Issue: Missing maintenance fee in calculations

**Symptoms**:
- Payment totals don't include maintenance fee
- Documents show $0.00 for maintenance

**Cause**: Maintenance fee field not fetched or incorrectly accessed.

**Solution**:
```typescript
// Ensure maintenance fee is fetched
const { data: guestPayments } = await supabase
  .from('paymentrecords')
  .select('*, "Maintenance Fee"') // Explicitly include
  .eq('Booking - Reservation', leaseId)
  .eq('Payment from guest?', true);

// Access with correct casing (space-separated)
const maintenanceFee = guestPayments[0]['Maintenance Fee'];
```

---

### Issue: Damage deposit appearing in all payments

**Symptoms**:
- Every guest payment includes damage deposit
- Total is inflated

**Cause**: Damage deposit logic not checking payment number.

**Solution**:
```typescript
guestPayments.forEach((payment, index) => {
  let total = payment.Rent + payment['Maintenance Fee'];

  // Add damage deposit ONLY to first payment
  if (index === 0 && payment['Damage Deposit']) {
    total += payment['Damage Deposit'];
  }

  // Store total
  payment['Total Paid by Guest'] = total;
});
```

---

## API Reference

### Edge Functions

| Function | Endpoint | Purpose |
|----------|----------|---------|
| **guest-payment-records** | `POST /functions/v1/guest-payment-records` | Generate guest payment schedule |
| **host-payment-records** | `POST /functions/v1/host-payment-records` | Generate host payment schedule |
| **lease-documents** | `POST /functions/v1/lease-documents` | Generate lease documents (DOCX) |

### Key Data Types

```typescript
// Guest Payment Record
interface GuestPaymentRecord {
  _id: string;
  'Booking - Reservation': string;
  'Payment #': number;
  'Scheduled Date': string;
  'Rent': number;
  'Maintenance Fee': number;
  'Total Paid by Guest': number;
  'Damage Deposit'?: number;
  'Payment from guest?': true;
  'Payment to Host?': false;
}

// Host Payment Record
interface HostPaymentRecord {
  _id: string;
  'Booking - Reservation': string;
  'Payment #': number;
  'Scheduled Date': string;
  'Rent': number;
  'Maintenance Fee': number;
  'Total Paid to Host': number;
  'Payment from guest?': false;
  'Payment to Host?': true;
}

// Lease
interface Lease {
  _id: string;
  'Agreement Number': string;
  'Payment Records Guest-SL': string[];
  'Payment Records Host-SL': string[];
  'Move In Date': string;
  'Move Out Date': string;
  'rental type': 'Monthly' | 'Weekly' | 'Nightly';
  'week pattern': string;
  '4 week rent'?: number;
  'rent per month'?: number;
  'Maintenance Fee': number;
  'Damage Deposit': number;
}
```

---

## Related Documentation

- [Guest Payment Records Edge Function](../Backend(EDGE%20-%20Functions)/GUEST_PAYMENT_RECORDS.md)
- [Host Payment Records Edge Function](../Backend(EDGE%20-%20Functions)/HOST_PAYMENT_RECORDS.md)
- [Lease Documents Edge Function - Individual Guide](./guest-payment-records-mapping.md)
- [Database Schema Reference](../Database/DATABASE_TABLES_DETAILED.md)

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-04 | 1.0 | Initial comprehensive guide created |

---

**Maintained by**: Engineering Team
**Last Updated**: 2026-02-04
**Review Cycle**: Quarterly
