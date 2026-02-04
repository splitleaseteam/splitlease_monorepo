# Fields For Lease Documents - Corrected Field Mapping Guide

**Created**: 2026-02-04
**Version**: 1.0
**Purpose**: Definitive source-of-truth mapping for populating "Fields For Lease Documents" prep step before API call to lease-documents edge function

---

## Overview

This document provides the **verified, corrected field mappings** based on actual Supabase schema analysis. The previous documentation contained field name discrepancies that have been corrected here.

### Critical Corrections Applied

| Documentation Error | Actual Value | Impact |
|--------------------|--------------|--------|
| `Move In Date` on `bookings_leases` | `hc move in date` on `proposal` | Query wrong table |
| `Move Out Date` on `bookings_leases` | `Move-out` on `proposal` | Query wrong table |
| `Payment Records Host-SL` | `Payment Records SL-Hosts` | Wrong column name |
| `Maintenance Fee` | `cleaning fee` | Wrong column name |
| Financial fields on lease | All on `proposal` table | Query wrong table |

---

## Data Source Tables

### Primary Tables

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCE ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  bookings_leases (Lease Record)                                             │
│  ├─ _id                          → Lease ID (primary key)                   │
│  ├─ Agreement Number             → Document identifier                      │
│  ├─ Reservation Period : Start   → Alternative start date (text)           │
│  ├─ Reservation Period : End     → Alternative end date (text)             │
│  ├─ Payment Records Guest-SL     → Array of guest payment IDs (jsonb)      │
│  ├─ Payment Records SL-Hosts     → Array of host payment IDs (jsonb)       │
│  ├─ Proposal                     → FK to proposal._id                       │
│  ├─ Listing                      → FK to listing._id                        │
│  ├─ Guest                        → FK to user._id                           │
│  └─ Host                         → FK to user._id                           │
│                                                                              │
│  proposal (Financial & Scheduling Data)                                      │
│  ├─ _id                          → Proposal ID (primary key)                │
│  ├─ hc move in date              → Move-in date (timestamptz) ◄── USE THIS │
│  ├─ Move-out                     → Move-out date (text)                     │
│  ├─ rental type                  → 'Monthly', 'Weekly', 'Nightly'           │
│  ├─ 4 week rent                  → Base rent for 4-week period              │
│  ├─ damage deposit               → Security deposit amount                  │
│  ├─ cleaning fee                 → Maintenance/cleaning fee ◄── NOT "Maintenance Fee"
│  ├─ Reservation Span             → Duration text                            │
│  ├─ Reservation Span (Weeks)     → Duration in weeks (integer)              │
│  ├─ week pattern                 → Week selection pattern                   │
│  └─ hc* variants                 → Host counter-offer values                │
│                                                                              │
│  paymentrecords (Payment Schedule)                                           │
│  ├─ _id                          → Payment record ID                        │
│  ├─ Booking - Reservation        → FK to bookings_leases._id                │
│  ├─ Payment #                    → Sequence number (1-13)                   │
│  ├─ Scheduled Date               → Payment due date                         │
│  ├─ Rent                         → Rent amount                              │
│  ├─ Maintenance Fee              → Fee amount (on payment record)           │
│  ├─ Total Paid by Guest          → Guest total (discriminator: guest)       │
│  ├─ Total Paid to Host           → Host payout (discriminator: host)        │
│  ├─ Damage Deposit               → Deposit (first guest payment only)       │
│  ├─ Payment from guest?          → true = guest record                      │
│  └─ Payment to Host?             → true = host record                       │
│                                                                              │
│  listing (Property Details)                                                  │
│  ├─ _id                          → Listing ID                               │
│  ├─ title                        → Property title                           │
│  ├─ address                      → Full address                             │
│  ├─ type of space                → Room type                                │
│  ├─ guests allowed               → Max occupancy                            │
│  ├─ host restrictions            → Array of restrictions                    │
│  └─ images                       → Property images                          │
│                                                                              │
│  user (People)                                                               │
│  ├─ _id                          → User ID                                  │
│  ├─ name                         → Full name                                │
│  ├─ email                        → Email address                            │
│  └─ phone                        → Phone number                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Field Population

### Step 1: Fetch Lease with Joined Data

```typescript
// Query lease with all related data in a single call
const { data: lease, error } = await supabase
  .from('bookings_leases')
  .select(`
    _id,
    "Agreement Number",
    "Reservation Period : Start",
    "Reservation Period : End",
    "Payment Records Guest-SL",
    "Payment Records SL-Hosts",
    Proposal,
    Listing,
    Guest,
    Host
  `)
  .eq('_id', leaseId)
  .single();

if (error) {
  console.error('❌ Lease fetch failed:', error.code, error.message, error.details, error.hint);
  throw new Error(`Failed to fetch lease: ${error.message}`);
}
```

### Step 2: Fetch Proposal (Financial & Scheduling Data)

**CRITICAL**: Most financial and scheduling fields are on the `proposal` table, NOT `bookings_leases`.

```typescript
const { data: proposal, error: proposalError } = await supabase
  .from('proposal')
  .select(`
    _id,
    "hc move in date",
    "Move-out",
    "rental type",
    "4 week rent",
    "damage deposit",
    "cleaning fee",
    "Reservation Span",
    "Reservation Span (Weeks)",
    "week pattern",
    "hc 4 week rent",
    "hc damage deposit",
    "hc cleaning fee"
  `)
  .eq('_id', lease.Proposal)
  .single();

if (proposalError) {
  console.error('❌ Proposal fetch failed:', proposalError.code, proposalError.message);
  throw new Error(`Failed to fetch proposal: ${proposalError.message}`);
}

// Determine which values to use (hc variants if counter-offer accepted)
const moveInDate = proposal['hc move in date'];
const moveOutDate = proposal['Move-out'];
const fourWeekRent = proposal['hc 4 week rent'] ?? proposal['4 week rent'];
const damageDeposit = proposal['hc damage deposit'] ?? proposal['damage deposit'];
const cleaningFee = proposal['hc cleaning fee'] ?? proposal['cleaning fee'];
const rentalType = proposal['rental type'];
const reservationSpanWeeks = proposal['Reservation Span (Weeks)'];
const weekPattern = proposal['week pattern'];
```

### Step 3: Fetch Listing Details

```typescript
const { data: listing, error: listingError } = await supabase
  .from('listing')
  .select(`
    _id,
    title,
    address,
    "type of space",
    "guests allowed",
    "host restrictions",
    images
  `)
  .eq('_id', lease.Listing)
  .single();

if (listingError) {
  console.error('❌ Listing fetch failed:', listingError.code, listingError.message);
  throw new Error(`Failed to fetch listing: ${listingError.message}`);
}
```

### Step 4: Fetch User Details (Guest & Host)

```typescript
// Fetch both users in parallel
const [guestResult, hostResult] = await Promise.all([
  supabase.from('user').select('_id, name, email, phone').eq('_id', lease.Guest).single(),
  supabase.from('user').select('_id, name, email, phone').eq('_id', lease.Host).single()
]);

const guest = guestResult.data;
const host = hostResult.data;

if (guestResult.error) {
  console.warn('⚠️ Guest fetch failed:', guestResult.error.message);
}
if (hostResult.error) {
  console.warn('⚠️ Host fetch failed:', hostResult.error.message);
}
```

### Step 5: Fetch Payment Records

#### Guest Payment Records

```typescript
const { data: guestPayments, error: guestPaymentsError } = await supabase
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
  .eq('Booking - Reservation', lease._id)
  .eq('Payment from guest?', true)
  .eq('Payment to Host?', false)
  .order('Payment #', { ascending: true })
  .limit(13);

if (guestPaymentsError) {
  console.error('❌ Guest payments fetch failed:', guestPaymentsError.message);
  throw new Error(`Failed to fetch guest payments: ${guestPaymentsError.message}`);
}

console.log(`✅ Fetched ${guestPayments.length} guest payment records`);
```

#### Host Payment Records

```typescript
const { data: hostPayments, error: hostPaymentsError } = await supabase
  .from('paymentrecords')
  .select(`
    _id,
    "Payment #",
    "Scheduled Date",
    "Rent",
    "Maintenance Fee",
    "Total Paid to Host"
  `)
  .eq('Booking - Reservation', lease._id)
  .eq('Payment to Host?', true)
  .eq('Payment from guest?', false)
  .order('Payment #', { ascending: true })
  .limit(13);

if (hostPaymentsError) {
  console.error('❌ Host payments fetch failed:', hostPaymentsError.message);
  throw new Error(`Failed to fetch host payments: ${hostPaymentsError.message}`);
}

console.log(`✅ Fetched ${hostPayments.length} host payment records`);
```

---

## Field Mapping Reference

### Common Fields (All Documents)

| Target Field | Source Table | Source Column | Transform |
|-------------|--------------|---------------|-----------|
| `Agreement Number` | bookings_leases | `Agreement Number` | Direct |
| `Guest Name` | user | `name` (via Guest FK) | Direct |
| `Host Name` | user | `name` (via Host FK) | Direct |
| `Guest Email` | user | `email` (via Guest FK) | Direct |
| `Host Email` | user | `email` (via Host FK) | Direct |
| `Guest Phone` | user | `phone` (via Guest FK) | Direct |
| `Host Phone` | user | `phone` (via Host FK) | Direct |
| `Address` | listing | `address` | Direct |
| `Listing Title` | listing | `title` | Direct |
| `Move In Date` | proposal | `hc move in date` | formatDate() |
| `Move Out Date` | proposal | `Move-out` | formatDate() |
| `Four Week Rent` | proposal | `hc 4 week rent` OR `4 week rent` | formatCurrency() |
| `Damage Deposit` | proposal | `hc damage deposit` OR `damage deposit` | formatCurrency() |
| `Maintenance Fee` | proposal | `hc cleaning fee` OR `cleaning fee` | formatCurrency() |
| `Rental Type` | proposal | `rental type` | Direct |
| `Number of Weeks` | proposal | `Reservation Span (Weeks)` | toString() |
| `Week Pattern` | proposal | `week pattern` | Direct |

### Guest Payment Fields (Steps 6)

| Target Field | Source | Transform |
|-------------|--------|-----------|
| `guest date 1` - `guest date 13` | paymentrecords.`Scheduled Date` | formatDate() MM/DD/YYYY |
| `guest rent 1` - `guest rent 13` | paymentrecords.`Rent` | formatCurrency() |
| `guest total 1` - `guest total 13` | paymentrecords.`Total Paid by Guest` | formatCurrency() |
| `Number of Payments (guest)` | guestPayments.length | toString() |

### Host Payment Fields (Step 7)

| Target Field | Source | Transform |
|-------------|--------|-----------|
| `host date 1` - `host date 13` | paymentrecords.`Scheduled Date` | formatDate() MM/DD/YYYY |
| `host rent 1` - `host rent 13` | paymentrecords.`Rent` | formatCurrency() |
| `host total 1` - `host total 13` | paymentrecords.`Total Paid to Host` | formatCurrency() |
| `Number of Payments (host)` | hostPayments.length | toString() |

---

## Format Helper Functions

```typescript
/**
 * Format ISO date to MM/DD/YYYY for document display
 */
function formatDate(isoDate: string | Date): string {
  const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Format number to currency string $X,XXX.XX
 */
function formatCurrency(amount: number | null | undefined): string {
  const value = amount ?? 0;
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Format house rules array to bulleted list
 */
function formatHouseRules(rules: string[] | null): string {
  if (!rules || rules.length === 0) {
    return 'No additional restrictions';
  }
  return rules.map(rule => `• ${rule}`).join('\n');
}
```

---

## Complete Field Population Function

```typescript
interface FieldsForLeaseDocuments {
  // Identifiers
  agreementNumber: string;
  leaseId: string;

  // People
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  hostName: string;
  hostEmail: string;
  hostPhone: string;

  // Listing
  address: string;
  listingTitle: string;
  listingDescription: string;
  typeOfSpace: string;
  guestsAllowed: number;
  hostRestrictions: string;
  images: string[];

  // Dates & Duration
  moveInDate: string;      // MM/DD/YYYY
  moveOutDate: string;     // MM/DD/YYYY
  numberOfWeeks: number;
  rentalType: string;
  weekPattern: string | null;

  // Financial
  fourWeekRent: string;    // $X,XXX.XX
  damageDeposit: string;   // $X,XXX.XX
  maintenanceFee: string;  // $X,XXX.XX

  // Guest Payments (1-13)
  guestPayments: Array<{
    date: string;          // MM/DD/YYYY
    rent: string;          // $X,XXX.XX
    total: string;         // $X,XXX.XX
  }>;
  numberOfGuestPayments: number;

  // Host Payments (1-13)
  hostPayments: Array<{
    date: string;          // MM/DD/YYYY
    rent: string;          // $X,XXX.XX
    total: string;         // $X,XXX.XX
  }>;
  numberOfHostPayments: number;

  // Calculated fields for documents
  firstPaymentTotal: string;
  lastPaymentRent: string;
  isProrated: boolean;
  penultimateWeekNumber: number;
}

async function populateFieldsForLeaseDocuments(
  supabase: SupabaseClient,
  leaseId: string
): Promise<FieldsForLeaseDocuments> {

  // Step 1: Fetch lease
  const { data: lease, error: leaseError } = await supabase
    .from('bookings_leases')
    .select(`
      _id,
      "Agreement Number",
      Proposal,
      Listing,
      Guest,
      Host
    `)
    .eq('_id', leaseId)
    .single();

  if (leaseError) throw new Error(`Lease fetch failed: ${leaseError.message}`);

  // Step 2: Fetch proposal (financial data)
  const { data: proposal, error: proposalError } = await supabase
    .from('proposal')
    .select(`
      "hc move in date",
      "Move-out",
      "rental type",
      "4 week rent",
      "hc 4 week rent",
      "damage deposit",
      "hc damage deposit",
      "cleaning fee",
      "hc cleaning fee",
      "Reservation Span (Weeks)",
      "week pattern"
    `)
    .eq('_id', lease.Proposal)
    .single();

  if (proposalError) throw new Error(`Proposal fetch failed: ${proposalError.message}`);

  // Step 3: Fetch listing
  const { data: listing, error: listingError } = await supabase
    .from('listing')
    .select(`
      title,
      address,
      description,
      "type of space",
      "guests allowed",
      "host restrictions",
      images
    `)
    .eq('_id', lease.Listing)
    .single();

  if (listingError) throw new Error(`Listing fetch failed: ${listingError.message}`);

  // Step 4: Fetch users
  const [guestResult, hostResult] = await Promise.all([
    supabase.from('user').select('name, email, phone').eq('_id', lease.Guest).single(),
    supabase.from('user').select('name, email, phone').eq('_id', lease.Host).single()
  ]);

  const guest = guestResult.data || { name: '', email: '', phone: '' };
  const host = hostResult.data || { name: '', email: '', phone: '' };

  // Step 5: Fetch payment records
  const [guestPaymentsResult, hostPaymentsResult] = await Promise.all([
    supabase
      .from('paymentrecords')
      .select(`"Payment #", "Scheduled Date", "Rent", "Total Paid by Guest", "Damage Deposit"`)
      .eq('Booking - Reservation', leaseId)
      .eq('Payment from guest?', true)
      .order('Payment #', { ascending: true })
      .limit(13),
    supabase
      .from('paymentrecords')
      .select(`"Payment #", "Scheduled Date", "Rent", "Total Paid to Host"`)
      .eq('Booking - Reservation', leaseId)
      .eq('Payment to Host?', true)
      .order('Payment #', { ascending: true })
      .limit(13)
  ]);

  const guestPayments = guestPaymentsResult.data || [];
  const hostPayments = hostPaymentsResult.data || [];

  // Determine values (use hc variants if available)
  const fourWeekRent = proposal['hc 4 week rent'] ?? proposal['4 week rent'] ?? 0;
  const damageDeposit = proposal['hc damage deposit'] ?? proposal['damage deposit'] ?? 0;
  const cleaningFee = proposal['hc cleaning fee'] ?? proposal['cleaning fee'] ?? 0;

  // Build result
  return {
    // Identifiers
    agreementNumber: lease['Agreement Number'] || '',
    leaseId: lease._id,

    // People
    guestName: guest.name || '',
    guestEmail: guest.email || '',
    guestPhone: guest.phone || '',
    hostName: host.name || '',
    hostEmail: host.email || '',
    hostPhone: host.phone || '',

    // Listing
    address: listing.address || '',
    listingTitle: listing.title || '',
    listingDescription: listing.description || '',
    typeOfSpace: listing['type of space'] || '',
    guestsAllowed: listing['guests allowed'] ?? 1,
    hostRestrictions: formatHouseRules(listing['host restrictions']),
    images: listing.images || [],

    // Dates & Duration
    moveInDate: formatDate(proposal['hc move in date']),
    moveOutDate: formatDate(proposal['Move-out']),
    numberOfWeeks: proposal['Reservation Span (Weeks)'] ?? 0,
    rentalType: proposal['rental type'] || 'Weekly',
    weekPattern: proposal['week pattern'] || null,

    // Financial
    fourWeekRent: formatCurrency(fourWeekRent),
    damageDeposit: formatCurrency(damageDeposit),
    maintenanceFee: formatCurrency(cleaningFee),

    // Guest Payments
    guestPayments: guestPayments.map(p => ({
      date: formatDate(p['Scheduled Date']),
      rent: formatCurrency(p['Rent']),
      total: formatCurrency(p['Total Paid by Guest'])
    })),
    numberOfGuestPayments: guestPayments.length,

    // Host Payments
    hostPayments: hostPayments.map(p => ({
      date: formatDate(p['Scheduled Date']),
      rent: formatCurrency(p['Rent']),
      total: formatCurrency(p['Total Paid to Host'])
    })),
    numberOfHostPayments: hostPayments.length,

    // Calculated fields
    firstPaymentTotal: formatCurrency(guestPayments[0]?.['Total Paid by Guest'] ?? 0),
    lastPaymentRent: formatCurrency(guestPayments[guestPayments.length - 1]?.['Rent'] ?? 0),
    isProrated: guestPayments.length > 1 &&
      (guestPayments[guestPayments.length - 1]?.['Rent'] ?? 0) < (guestPayments[0]?.['Rent'] ?? 0),
    penultimateWeekNumber: guestPayments.length - 1
  };
}
```

---

## Document-Specific Payload Builders

### Host Payout Schedule Form

```typescript
function buildHostPayoutPayload(fields: FieldsForLeaseDocuments): HostPayoutPayload {
  const payload: Record<string, string> = {
    'Agreement Number': fields.agreementNumber,
    'Host Name': fields.hostName,
    'Host Email': fields.hostEmail,
    'Host Phone': fields.hostPhone,
    'Address': fields.address,
    'Payout Number': `PAY-${fields.agreementNumber}`,
    'Maintenance Fee': fields.maintenanceFee,
  };

  // Map up to 13 host payments
  fields.hostPayments.forEach((payment, index) => {
    const num = index + 1;
    payload[`Date${num}`] = payment.date;
    payload[`Rent${num}`] = payment.rent;
    payload[`Total${num}`] = payment.total;
  });

  return payload as HostPayoutPayload;
}
```

### Supplemental Agreement

```typescript
function buildSupplementalPayload(fields: FieldsForLeaseDocuments): SupplementalPayload {
  return {
    'Agreement Number': fields.agreementNumber,
    'Check in Date': fields.moveInDate,
    'Check Out Date': fields.moveOutDate,
    'Number of weeks': fields.numberOfWeeks.toString(),
    'Guests Allowed': fields.guestsAllowed.toString(),
    'Host Name': fields.hostName,
    'Listing Title': fields.listingTitle,
    'Listing Description': fields.listingDescription,
    'Location': fields.address,
    'Type of Space': fields.typeOfSpace,
    'Space Details': fields.listingDescription,
    'Supplemental Number': `SUP-${fields.agreementNumber}`,
    'image1': fields.images[0] || '',
    'image2': fields.images[1] || '',
    'image3': fields.images[2] || '',
  };
}
```

### Credit Card Authorization Form

```typescript
function buildCreditCardAuthPayload(fields: FieldsForLeaseDocuments): CreditCardAuthPayload {
  return {
    'Agreement Number': fields.agreementNumber,
    'Host Name': fields.hostName,
    'Guest Name': fields.guestName,
    'Four Week Rent': fields.fourWeekRent,
    'Maintenance Fee': fields.maintenanceFee,
    'Damage Deposit': fields.damageDeposit,
    'Splitlease Credit': '0',
    'Last Payment Rent': fields.lastPaymentRent,
    'Weeks Number': fields.numberOfWeeks.toString(),
    'Listing Description': fields.listingDescription,
    'Penultimate Week Number': fields.penultimateWeekNumber.toString(),
    'Number of Payments': fields.numberOfGuestPayments.toString(),
    'Last Payment Weeks': '1', // Calculate based on prorating
    'Is Prorated': fields.isProrated,
  };
}
```

### Periodic Tenancy Agreement

```typescript
function buildPeriodicTenancyPayload(fields: FieldsForLeaseDocuments): PeriodicTenancyPayload {
  const payload: Record<string, string | boolean> = {
    'Agreement Number': fields.agreementNumber,
    'Host Name': fields.hostName,
    'Guest Name': fields.guestName,
    'Address': fields.address,
    'Check in Date': fields.moveInDate,
    'Check Out Date': fields.moveOutDate,
    'Number of weeks': fields.numberOfWeeks.toString(),
    'Four Week Rent': fields.fourWeekRent,
    'Maintenance Fee': fields.maintenanceFee,
    'Damage Deposit': fields.damageDeposit,
    'Extra Restrictions': fields.hostRestrictions,
    'Periodic Number': `PER-${fields.agreementNumber}`,
    'image1': fields.images[0] || '',
    'image2': fields.images[1] || '',
    'image3': fields.images[2] || '',
  };

  // Map guest payments
  fields.guestPayments.forEach((payment, index) => {
    const num = index + 1;
    payload[`guest date ${num}`] = payment.date;
    payload[`guest rent ${num}`] = payment.rent;
    payload[`guest total ${num}`] = payment.total;
  });

  // Map host payments
  fields.hostPayments.forEach((payment, index) => {
    const num = index + 1;
    payload[`host date ${num}`] = payment.date;
    payload[`host rent ${num}`] = payment.rent;
    payload[`host total ${num}`] = payment.total;
  });

  return payload as PeriodicTenancyPayload;
}
```

---

## Validation Checklist

Before calling the lease-documents edge function, validate:

- [ ] `Agreement Number` is not empty
- [ ] `moveInDate` is a valid date
- [ ] `moveOutDate` is after `moveInDate`
- [ ] At least one guest payment record exists
- [ ] At least one host payment record exists
- [ ] `fourWeekRent` is greater than 0
- [ ] Host and guest names are not empty

---

## Related Documentation

- [PAYMENT_RECORDS_COMPREHENSIVE_GUIDE.md](./PAYMENT_RECORDS_COMPREHENSIVE_GUIDE.md) - Complete payment calculation guide
- [HOST_PAYMENT_RECORDS_CALCULATION_GUIDE.md](./HOST_PAYMENT_RECORDS_CALCULATION_GUIDE.md) - Host payment specifics
- [guest-payment-records-mapping.md](./guest-payment-records-mapping.md) - Guest payment specifics

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-04 | 1.0 | Initial creation with corrected field mappings based on schema verification |

---

**Maintained by**: Engineering Team
**Last Updated**: 2026-02-04
