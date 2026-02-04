# Host Payout Schedule Form - API Documentation

**Created**: 2026-02-04
**Version**: 1.0
**Document Type**: `host_payout_schedule`
**Purpose**: Comprehensive API reference for generating Host Payout Schedule Form documents

---

## Table of Contents

- [Overview](#overview)
- [API Request Schema](#api-request-schema)
- [Field Reference](#field-reference)
  - [Identification Fields](#identification-fields)
  - [Host Contact Fields](#host-contact-fields)
  - [Payment Schedule Fields](#payment-schedule-fields)
  - [Summary Fields](#summary-fields)
- [Data Source Tracing](#data-source-tracing)
- [TypeScript Interface](#typescript-interface)
- [Example Payloads](#example-payloads)
- [Validation Rules](#validation-rules)
- [Edge Function Integration](#edge-function-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

The **Host Payout Schedule Form** is one of four lease documents generated during the booking finalization process. It provides hosts with a complete schedule of their expected payouts throughout the lease period.

### Document Purpose

- Shows the host their payment schedule (up to 13 payment cycles)
- Details rent amounts, maintenance fees, and total payouts per period
- Serves as a financial reference document for the host
- Generated with unique `Payout Number` for tracking (format: `AGR-XXXXX-PSF`)

### Document Generation Context

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    HOST PAYOUT SCHEDULE FORM FLOW                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Step 2: Create Fields For Lease Documents                              │
│     └─ Creates record with host contact info + property details         │
│                                                                          │
│  Step 7: Populate Host Payment Records                                  │
│     └─ Fills host date 1-13, host rent 1-13, host total 1-13           │
│                                                                          │
│  Step 8: Call lease-documents Edge Function                             │
│     └─ Passes host_payout_schedule payload                              │
│     └─ Returns generated DOCX + Google Drive URL                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Business Rules

| Rule | Description |
|------|-------------|
| **First Payment Date** | Move-in date + 2 days (host receives payment AFTER guest moves in) |
| **Service Fee** | 10% deducted from guest rent before host payout |
| **Payment Intervals** | Monthly: 31 days, Weekly/Nightly: 28 days (4 weeks) |
| **Maximum Payments** | 13 payment cycles supported |
| **Maintenance Fee** | Fixed amount per payment period (not deducted from host) |

---

## API Request Schema

### Complete JSON Structure

```json
{
  "Address": "string",
  "Agreement Number": "string",
  "Date1": "string | null",
  "Date2": "string | null",
  "Date3": "string | null",
  "Date4": "string | null",
  "Date5": "string | null",
  "Date6": "string | null",
  "Date7": "string | null",
  "Date8": "string | null",
  "Date9": "string | null",
  "Date10": "string | null",
  "Date11": "string | null",
  "Date12": "string | null",
  "Date13": "string | null",
  "Host Email": "string",
  "Host Name": "string",
  "Host Phone": "string",
  "Maintenance Fee": "number",
  "Payout Number": "string",
  "Rent1": "number | null",
  "Rent2": "number | null",
  "Rent3": "number | null",
  "Rent4": "number | null",
  "Rent5": "number | null",
  "Rent6": "number | null",
  "Rent7": "number | null",
  "Rent8": "number | null",
  "Rent9": "number | null",
  "Rent10": "number | null",
  "Rent11": "number | null",
  "Rent12": "number | null",
  "Rent13": "number | null",
  "Total1": "number | null",
  "Total2": "number | null",
  "Total3": "number | null",
  "Total4": "number | null",
  "Total5": "number | null",
  "Total6": "number | null",
  "Total7": "number | null",
  "Total8": "number | null",
  "Total9": "number | null",
  "Total10": "number | null",
  "Total11": "number | null",
  "Total12": "number | null",
  "Total13": "number | null",
  "TotalHostPayments": "number"
}
```

### Bubble.io Source Mapping

```json
{
  "Address": "Result of step 2 (Create a new Fiel...)'s Address of the Property",
  "Agreement Number": "Result of step 2 (Create a new Fiel...)'s Agreement number",
  "Date1": "Result of step 2 (Create a new Fiel...)'s host date 1",
  "Date2": "Result of step 2 (Create a new Fiel...)'s host date 2",
  "Date3": "Result of step 2 (Create a new Fiel...)'s host date 3",
  "Date4": "Result of step 2 (Create a new Fiel...)'s host date 4",
  "Date5": "Result of step 2 (Create a new Fiel...)'s host date 5",
  "Date6": "Result of step 2 (Create a new Fiel...)'s host date 6",
  "Date7": "Result of step 2 (Create a new Fiel...)'s host date 7",
  "Date8": "Result of step 2 (Create a new Fiel...)'s host date 8",
  "Date9": "Result of step 2 (Create a new Fiel...)'s host date 9",
  "Date10": "Result of step 2 (Create a new Fiel...)'s host date 10",
  "Date11": "Result of step 2 (Create a new Fiel...)'s host date 11",
  "Date12": "Result of step 2 (Create a new Fiel...)'s host date 12",
  "Date13": "Result of step 2 (Create a new Fiel...)'s host date 13",
  "Host Email": "Result of step 2 (Create a new Fiel...)'s Host email",
  "Host Name": "Result of step 2 (Create a new Fiel...)'s Host name",
  "Host Phone": "Result of step 2 (Create a new Fiel...)'s Host number",
  "Maintenance Fee": "Result of step 2 (Create a new Fiel...)'s Maintenance fee:converted to number",
  "Payout Number": "Result of step 2 (Create a new Fiel...)'s Host Payout Schedule Number",
  "Rent1": "Result of step 2 (Create a new Fiel...)'s host rent 1:converted to number",
  "Rent2": "Result of step 2 (Create a new Fiel...)'s host rent 2:converted to number",
  "Rent3": "Result of step 2 (Create a new Fiel...)'s host rent 3:converted to number",
  "Rent4": "Result of step 2 (Create a new Fiel...)'s host rent 4:converted to number",
  "Rent5": "Result of step 2 (Create a new Fiel...)'s host rent 5:converted to number",
  "Rent6": "Result of step 2 (Create a new Fiel...)'s host rent 6:converted to number",
  "Rent7": "Result of step 2 (Create a new Fiel...)'s host rent 7:converted to number",
  "Rent8": "Result of step 2 (Create a new Fiel...)'s host rent 8:converted to number",
  "Rent9": "Result of step 2 (Create a new Fiel...)'s host rent 9:converted to number",
  "Rent10": "Result of step 2 (Create a new Fiel...)'s host rent 10:converted to number",
  "Rent11": "Result of step 2 (Create a new Fiel...)'s host rent 11:converted to number",
  "Rent12": "Result of step 2 (Create a new Fiel...)'s host rent 12:converted to number",
  "Rent13": "Result of step 2 (Create a new Fiel...)'s host rent 13:converted to number",
  "Total1": "Result of step 2 (Create a new Fiel...)'s host total 1:converted to number",
  "Total2": "Result of step 2 (Create a new Fiel...)'s host total 2:converted to number",
  "Total3": "Result of step 2 (Create a new Fiel...)'s host total 3:converted to number",
  "Total4": "Result of step 2 (Create a new Fiel...)'s host total 4:converted to number",
  "Total5": "Result of step 2 (Create a new Fiel...)'s host total 5:converted to number",
  "Total6": "Result of step 2 (Create a new Fiel...)'s host total 6:converted to number",
  "Total7": "Result of step 2 (Create a new Fiel...)'s host total 7:converted to number",
  "Total8": "Result of step 2 (Create a new Fiel...)'s host total 8:converted to number",
  "Total9": "Result of step 2 (Create a new Fiel...)'s host total 9:converted to number",
  "Total10": "Result of step 2 (Create a new Fiel...)'s host total 10:converted to number",
  "Total11": "Result of step 2 (Create a new Fiel...)'s host total 11:converted to number",
  "Total12": "Result of step 2 (Create a new Fiel...)'s host total 12:converted to number",
  "Total13": "Result of step 2 (Create a new Fiel...)'s host total 13:converted to number",
  "TotalHostPayments": "Result of step 2 (Create a new Fiel...)'s Total Host Compensation"
}
```

---

## Field Reference

### Identification Fields

| API Field | Type | Required | Source Field | Description |
|-----------|------|----------|--------------|-------------|
| `Address` | string | Yes | `Address of the Property` | Full street address of the rental property |
| `Agreement Number` | string | Yes | `Agreement number` | Unique lease identifier (e.g., "AGR-12345") |
| `Payout Number` | string | Yes | `Host Payout Schedule Number` | Document identifier (format: `{Agreement Number}-PSF`) |

**Payout Number Format**:
```
AGR-12345-PSF
 │    │     │
 │    │     └─ "PSF" = Payout Schedule Form
 │    └─────── Unique agreement ID
 └──────────── Agreement prefix
```

---

### Host Contact Fields

| API Field | Type | Required | Source Field | Description |
|-----------|------|----------|--------------|-------------|
| `Host Name` | string | Yes | `Host name` | Host's full name |
| `Host Email` | string | Yes | `Host email` | Host's email address |
| `Host Phone` | string | Yes | `Host number` | Host's phone number (formatted as text) |

**Data Origin Chain**:
```
Reservation → Proposal → Host - Account → User
                                           ├─ Name - Full → Host Name
                                           ├─ email → Host Email
                                           └─ Phone Number → Host Phone
```

---

### Payment Schedule Fields

#### Date Fields (Date1 - Date13)

| API Field | Type | Source Field | Format | Description |
|-----------|------|--------------|--------|-------------|
| `Date1` | string | `host date 1` | `mm/dd/yyyy` | First payment date |
| `Date2` | string | `host date 2` | `mm/dd/yyyy` | Second payment date |
| `Date3` | string | `host date 3` | `mm/dd/yyyy` | Third payment date |
| ... | ... | ... | ... | ... |
| `Date13` | string | `host date 13` | `mm/dd/yyyy` | Thirteenth payment date |

**Date Calculation Logic**:
```javascript
// First host payment: Move-in date + 2 days
const firstPaymentDate = new Date(moveInDate);
firstPaymentDate.setDate(moveInDate.getDate() + 2);

// Subsequent payments based on rental type:
// - Monthly: +31 days
// - Weekly/Nightly: +28 days (4 weeks)
```

---

#### Rent Fields (Rent1 - Rent13)

| API Field | Type | Source Field | Conversion | Description |
|-----------|------|--------------|------------|-------------|
| `Rent1` | number | `host rent 1` | `:converted to number` | Rent for period 1 (after 10% service fee) |
| `Rent2` | number | `host rent 2` | `:converted to number` | Rent for period 2 |
| ... | ... | ... | ... | ... |
| `Rent13` | number | `host rent 13` | `:converted to number` | Rent for period 13 |

**Rent Calculation**:
```javascript
// Host rent = Guest rent - 10% service fee
const hostRent = guestRent * 0.90;

// For prorated last payment (depends on week pattern):
const lastHostRent = lastGuestRent * 0.90;
```

> **Important**: The `:converted to number` suffix in Bubble.io indicates the source field is stored as a currency-formatted string (e.g., "1,028.58") and must be converted to a numeric value for the API payload.

---

#### Total Fields (Total1 - Total13)

| API Field | Type | Source Field | Conversion | Description |
|-----------|------|--------------|------------|-------------|
| `Total1` | number | `host total 1` | `:converted to number` | Total payout for period 1 |
| `Total2` | number | `host total 2` | `:converted to number` | Total payout for period 2 |
| ... | ... | ... | ... | ... |
| `Total13` | number | `host total 13` | `:converted to number` | Total payout for period 13 |

**Total Calculation**:
```javascript
// Total host payout = Rent (after service fee) + Maintenance fee
const totalHostPayout = hostRent + maintenanceFee;
```

---

### Summary Fields

| API Field | Type | Required | Source Field | Conversion | Description |
|-----------|------|----------|--------------|------------|-------------|
| `Maintenance Fee` | number | Yes | `Maintenance fee` | `:converted to number` | Per-period maintenance/cleaning fee |
| `TotalHostPayments` | number | Yes | `Total Host Compensation` | Direct | Sum of all host payouts |

**Total Host Compensation Formula**:
```javascript
// Sum of all Total fields
const totalHostCompensation = totals.reduce((sum, total) => sum + total, 0);

// Alternative: From proposal
const totalHostCompensation = proposal['hc total host compensation'];
```

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
│  listing                                                                     │
│    └─ Location - Address ──────────► Address of the Property ──► Address    │
│                                                                              │
│  bookings_leases                                                             │
│    └─ Agreement Number ────────────► Agreement number ──► Agreement Number   │
│    └─ Agreement Number + "-PSF" ───► Host Payout Schedule Number ──► Payout │
│                                                                              │
│  user (via proposal.Host - Account)                                          │
│    ├─ Name - Full ─────────────────► Host name ──► Host Name                 │
│    ├─ email ───────────────────────► Host email ──► Host Email               │
│    └─ Phone Number ────────────────► Host number ──► Host Phone              │
│                                                                              │
│  paymentrecords (WHERE Payment to Host? = true)                              │
│    ├─ Scheduled Date ──────────────► host date {n} ──► Date{n}               │
│    ├─ Rent (after 10% fee) ────────► host rent {n} ──► Rent{n}               │
│    └─ Total Paid to Host ──────────► host total {n} ──► Total{n}             │
│                                                                              │
│  proposal                                                                    │
│    ├─ hc cleaning fee ─────────────► Maintenance fee ──► Maintenance Fee     │
│    └─ hc total host compensation ──► Total Host Compensation ──► TotalHost   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 7: Populate Host Payment Records

This step in the Bubble.io workflow fetches host payment records and populates the Fields For Lease Documents:

```javascript
/**
 * Step 7: Make changes to Fields For Lease Documents... HOST RECORDS
 *
 * INPUT: Lease record from Step 2 result
 * OUTPUT: Updates Fields For Lease Documents with host payment data
 */

// Get lease from Step 2 result
const lease = this.result_of_step_2;
const leaseId = lease._id;

// Query host payment records from Supabase
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
  .order('Payment #', { ascending: true })
  .limit(13);

if (error) {
  throw new Error(`Failed to fetch host payments: ${error.message}`);
}

// Build update object for Fields For Lease Documents
const hostFields = {};

hostPayments.forEach((payment) => {
  const paymentNum = payment['Payment #'];

  // Format date as mm/dd/yyyy
  const scheduledDate = new Date(payment['Scheduled Date']);
  const mm = String(scheduledDate.getMonth() + 1).padStart(2, '0');
  const dd = String(scheduledDate.getDate()).padStart(2, '0');
  const yyyy = scheduledDate.getFullYear();
  const formattedDate = `${mm}/${dd}/${yyyy}`;

  // Map to document fields (stored as formatted currency strings)
  hostFields[`host date ${paymentNum}`] = formattedDate;
  hostFields[`host rent ${paymentNum}`] = payment.Rent.toFixed(2);
  hostFields[`host total ${paymentNum}`] = payment['Total Paid to Host'].toFixed(2);
});

// Set number of payments
hostFields['Number of Payments (host)'] = hostPayments.length;

return hostFields;
```

---

## TypeScript Interface

### Request Payload Interface

```typescript
/**
 * Host Payout Schedule Form API Request Payload
 * Document Type: host_payout_schedule
 */
export interface HostPayoutSchedulePayload {
  // Identification
  Address: string;
  'Agreement Number': string;
  'Payout Number': string;

  // Host Contact
  'Host Name': string;
  'Host Email': string;
  'Host Phone': string;

  // Payment Schedule - Dates (up to 13)
  Date1?: string | null;
  Date2?: string | null;
  Date3?: string | null;
  Date4?: string | null;
  Date5?: string | null;
  Date6?: string | null;
  Date7?: string | null;
  Date8?: string | null;
  Date9?: string | null;
  Date10?: string | null;
  Date11?: string | null;
  Date12?: string | null;
  Date13?: string | null;

  // Payment Schedule - Rent (up to 13)
  Rent1?: number | null;
  Rent2?: number | null;
  Rent3?: number | null;
  Rent4?: number | null;
  Rent5?: number | null;
  Rent6?: number | null;
  Rent7?: number | null;
  Rent8?: number | null;
  Rent9?: number | null;
  Rent10?: number | null;
  Rent11?: number | null;
  Rent12?: number | null;
  Rent13?: number | null;

  // Payment Schedule - Totals (up to 13)
  Total1?: number | null;
  Total2?: number | null;
  Total3?: number | null;
  Total4?: number | null;
  Total5?: number | null;
  Total6?: number | null;
  Total7?: number | null;
  Total8?: number | null;
  Total9?: number | null;
  Total10?: number | null;
  Total11?: number | null;
  Total12?: number | null;
  Total13?: number | null;

  // Summary
  'Maintenance Fee': number;
  TotalHostPayments: number;
}

/**
 * Fields For Lease Documents - Host Payment Fields
 * Intermediate data structure populated by Step 7
 */
export interface FieldsForLeaseDocumentsHostPayments {
  // Host dates (formatted as mm/dd/yyyy strings)
  'host date 1'?: string;
  'host date 2'?: string;
  'host date 3'?: string;
  'host date 4'?: string;
  'host date 5'?: string;
  'host date 6'?: string;
  'host date 7'?: string;
  'host date 8'?: string;
  'host date 9'?: string;
  'host date 10'?: string;
  'host date 11'?: string;
  'host date 12'?: string;
  'host date 13'?: string;

  // Host rent amounts (formatted as currency strings like "1,028.58")
  'host rent 1'?: string;
  'host rent 2'?: string;
  'host rent 3'?: string;
  'host rent 4'?: string;
  'host rent 5'?: string;
  'host rent 6'?: string;
  'host rent 7'?: string;
  'host rent 8'?: string;
  'host rent 9'?: string;
  'host rent 10'?: string;
  'host rent 11'?: string;
  'host rent 12'?: string;
  'host rent 13'?: string;

  // Host total payouts (formatted as currency strings)
  'host total 1'?: string;
  'host total 2'?: string;
  'host total 3'?: string;
  'host total 4'?: string;
  'host total 5'?: string;
  'host total 6'?: string;
  'host total 7'?: string;
  'host total 8'?: string;
  'host total 9'?: string;
  'host total 10'?: string;
  'host total 11'?: string;
  'host total 12'?: string;
  'host total 13'?: string;

  // Metadata
  'Number of Payments (host)': number;
}
```

### Builder Function

```typescript
/**
 * Build Host Payout Schedule payload from Fields For Lease Documents
 */
function buildHostPayoutSchedulePayload(
  fields: FieldsForLeaseDocuments
): HostPayoutSchedulePayload {
  // Helper to convert currency string to number
  const toNumber = (value: string | undefined): number | null => {
    if (!value) return null;
    // Remove commas and parse
    return parseFloat(value.replace(/,/g, ''));
  };

  return {
    // Identification
    Address: fields['Address of the Property'],
    'Agreement Number': fields['Agreement number'],
    'Payout Number': fields['Host Payout Schedule Number'],

    // Host Contact
    'Host Name': fields['Host name'],
    'Host Email': fields['Host email'],
    'Host Phone': fields['Host number'],

    // Dates
    Date1: fields['host date 1'] || null,
    Date2: fields['host date 2'] || null,
    Date3: fields['host date 3'] || null,
    Date4: fields['host date 4'] || null,
    Date5: fields['host date 5'] || null,
    Date6: fields['host date 6'] || null,
    Date7: fields['host date 7'] || null,
    Date8: fields['host date 8'] || null,
    Date9: fields['host date 9'] || null,
    Date10: fields['host date 10'] || null,
    Date11: fields['host date 11'] || null,
    Date12: fields['host date 12'] || null,
    Date13: fields['host date 13'] || null,

    // Rent (converted from currency strings)
    Rent1: toNumber(fields['host rent 1']),
    Rent2: toNumber(fields['host rent 2']),
    Rent3: toNumber(fields['host rent 3']),
    Rent4: toNumber(fields['host rent 4']),
    Rent5: toNumber(fields['host rent 5']),
    Rent6: toNumber(fields['host rent 6']),
    Rent7: toNumber(fields['host rent 7']),
    Rent8: toNumber(fields['host rent 8']),
    Rent9: toNumber(fields['host rent 9']),
    Rent10: toNumber(fields['host rent 10']),
    Rent11: toNumber(fields['host rent 11']),
    Rent12: toNumber(fields['host rent 12']),
    Rent13: toNumber(fields['host rent 13']),

    // Totals (converted from currency strings)
    Total1: toNumber(fields['host total 1']),
    Total2: toNumber(fields['host total 2']),
    Total3: toNumber(fields['host total 3']),
    Total4: toNumber(fields['host total 4']),
    Total5: toNumber(fields['host total 5']),
    Total6: toNumber(fields['host total 6']),
    Total7: toNumber(fields['host total 7']),
    Total8: toNumber(fields['host total 8']),
    Total9: toNumber(fields['host total 9']),
    Total10: toNumber(fields['host total 10']),
    Total11: toNumber(fields['host total 11']),
    Total12: toNumber(fields['host total 12']),
    Total13: toNumber(fields['host total 13']),

    // Summary
    'Maintenance Fee': toNumber(fields['Maintenance fee']) || 0,
    TotalHostPayments: toNumber(fields['Total Host Compensation']) || 0,
  };
}
```

---

## Example Payloads

### Example 1: 3-Month Lease (Monthly Rental)

```json
{
  "Address": "123 Main Street, Apt 4B, New York, NY 10001",
  "Agreement Number": "AGR-78542",
  "Date1": "02/17/2026",
  "Date2": "03/20/2026",
  "Date3": "04/20/2026",
  "Date4": null,
  "Date5": null,
  "Date6": null,
  "Date7": null,
  "Date8": null,
  "Date9": null,
  "Date10": null,
  "Date11": null,
  "Date12": null,
  "Date13": null,
  "Host Email": "john.host@email.com",
  "Host Name": "John Smith",
  "Host Phone": "+1 (555) 123-4567",
  "Maintenance Fee": 150.00,
  "Payout Number": "AGR-78542-PSF",
  "Rent1": 2700.00,
  "Rent2": 2700.00,
  "Rent3": 2700.00,
  "Rent4": null,
  "Rent5": null,
  "Rent6": null,
  "Rent7": null,
  "Rent8": null,
  "Rent9": null,
  "Rent10": null,
  "Rent11": null,
  "Rent12": null,
  "Rent13": null,
  "Total1": 2850.00,
  "Total2": 2850.00,
  "Total3": 2850.00,
  "Total4": null,
  "Total5": null,
  "Total6": null,
  "Total7": null,
  "Total8": null,
  "Total9": null,
  "Total10": null,
  "Total11": null,
  "Total12": null,
  "Total13": null,
  "TotalHostPayments": 8550.00
}
```

**Calculation Breakdown**:
- Guest Rent: $3,000/month
- Host Rent: $3,000 × 0.90 = $2,700/month (10% service fee deducted)
- Host Total: $2,700 + $150 = $2,850/month
- Total Host Compensation: $2,850 × 3 = $8,550

---

### Example 2: 10-Week Lease (Weekly - Every Week Pattern)

```json
{
  "Address": "456 Park Avenue, Suite 12, New York, NY 10022",
  "Agreement Number": "AGR-91203",
  "Date1": "02/17/2026",
  "Date2": "03/17/2026",
  "Date3": "04/14/2026",
  "Date4": null,
  "Date5": null,
  "Date6": null,
  "Date7": null,
  "Date8": null,
  "Date9": null,
  "Date10": null,
  "Date11": null,
  "Date12": null,
  "Date13": null,
  "Host Email": "sarah.host@email.com",
  "Host Name": "Sarah Johnson",
  "Host Phone": "+1 (555) 987-6543",
  "Maintenance Fee": 100.00,
  "Payout Number": "AGR-91203-PSF",
  "Rent1": 1800.00,
  "Rent2": 1800.00,
  "Rent3": 900.00,
  "Rent4": null,
  "Rent5": null,
  "Rent6": null,
  "Rent7": null,
  "Rent8": null,
  "Rent9": null,
  "Rent10": null,
  "Rent11": null,
  "Rent12": null,
  "Rent13": null,
  "Total1": 1900.00,
  "Total2": 1900.00,
  "Total3": 1000.00,
  "Total4": null,
  "Total5": null,
  "Total6": null,
  "Total7": null,
  "Total8": null,
  "Total9": null,
  "Total10": null,
  "Total11": null,
  "Total12": null,
  "Total13": null,
  "TotalHostPayments": 4800.00
}
```

**Calculation Breakdown**:
- 10 weeks = 3 payment cycles (4 + 4 + 2 weeks)
- Guest 4-Week Rent: $2,000
- Host 4-Week Rent: $2,000 × 0.90 = $1,800
- Last Payment (2 weeks): $1,800 × (2/4) = $900 (prorated)
- Total Host Compensation: $1,900 + $1,900 + $1,000 = $4,800

---

## Validation Rules

### Required Fields

| Field | Rule |
|-------|------|
| `Address` | Non-empty string |
| `Agreement Number` | Non-empty string, format `AGR-{digits}` |
| `Payout Number` | Non-empty string, format `{Agreement Number}-PSF` |
| `Host Name` | Non-empty string |
| `Host Email` | Valid email format |
| `Host Phone` | Non-empty string |
| `Maintenance Fee` | Number ≥ 0 |
| `TotalHostPayments` | Number > 0 |
| At least one `Date{n}` | At least one payment date required |

### Conditional Validation

```typescript
function validateHostPayoutSchedulePayload(
  payload: HostPayoutSchedulePayload
): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!payload.Address) errors.push('Address is required');
  if (!payload['Agreement Number']) errors.push('Agreement Number is required');
  if (!payload['Payout Number']) errors.push('Payout Number is required');
  if (!payload['Host Name']) errors.push('Host Name is required');
  if (!payload['Host Email']) errors.push('Host Email is required');
  if (!payload['Host Phone']) errors.push('Host Phone is required');

  // Payout Number format validation
  const expectedPayoutNumber = `${payload['Agreement Number']}-PSF`;
  if (payload['Payout Number'] !== expectedPayoutNumber) {
    errors.push(`Payout Number should be ${expectedPayoutNumber}`);
  }

  // At least one payment required
  const hasPayment = [
    payload.Date1, payload.Date2, payload.Date3, payload.Date4,
    payload.Date5, payload.Date6, payload.Date7, payload.Date8,
    payload.Date9, payload.Date10, payload.Date11, payload.Date12,
    payload.Date13
  ].some(date => date !== null && date !== undefined);

  if (!hasPayment) {
    errors.push('At least one payment date is required');
  }

  // Date-Rent-Total consistency
  for (let i = 1; i <= 13; i++) {
    const date = payload[`Date${i}` as keyof HostPayoutSchedulePayload];
    const rent = payload[`Rent${i}` as keyof HostPayoutSchedulePayload];
    const total = payload[`Total${i}` as keyof HostPayoutSchedulePayload];

    if (date && (!rent || !total)) {
      errors.push(`Date${i} is set but Rent${i} or Total${i} is missing`);
    }
    if ((rent || total) && !date) {
      errors.push(`Rent${i} or Total${i} is set but Date${i} is missing`);
    }
  }

  // Total validation
  if (payload['Maintenance Fee'] < 0) {
    errors.push('Maintenance Fee cannot be negative');
  }
  if (payload.TotalHostPayments <= 0) {
    errors.push('TotalHostPayments must be greater than 0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

---

## Edge Function Integration

### Calling the lease-documents Edge Function

```typescript
/**
 * Generate Host Payout Schedule Form via Edge Function
 */
async function generateHostPayoutScheduleForm(
  leaseId: string,
  fields: FieldsForLeaseDocuments,
  supabase: SupabaseClient
): Promise<DocumentGenerationResult> {
  // Build the payload
  const payload = buildHostPayoutSchedulePayload(fields);

  // Call the edge function
  const { data, error } = await supabase.functions.invoke('lease-documents', {
    body: {
      action: 'generate',
      payload: {
        documentType: 'host_payout_schedule',
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

### Edge Function Request Format

```json
{
  "action": "generate",
  "payload": {
    "documentType": "host_payout_schedule",
    "leaseId": "abc123",
    "data": {
      "Address": "123 Main Street...",
      "Agreement Number": "AGR-78542",
      "...": "..."
    }
  }
}
```

### Edge Function Response Format

```json
{
  "success": true,
  "filename": "AGR-78542-PSF-Host-Payout-Schedule.docx",
  "driveUrl": "https://drive.google.com/file/d/...",
  "storageUrl": "https://xxx.supabase.co/storage/v1/object/public/documents/..."
}
```

---

## Troubleshooting

### Issue: Payment dates not populating

**Symptom**: `Date1` through `Date13` are all null.

**Cause**: Host payment records have not been generated for this lease.

**Solution**:
1. Check if `host-payment-records` edge function was called
2. Verify `Payment Records Host-SL` field on the lease is populated
3. Query paymentrecords table directly:
```sql
SELECT * FROM paymentrecords
WHERE "Booking - Reservation" = '{leaseId}'
AND "Payment to Host?" = true;
```

---

### Issue: Rent values showing incorrect amounts

**Symptom**: Host rent is same as guest rent (missing 10% deduction).

**Cause**: Payment records were calculated incorrectly.

**Solution**:
1. Verify the `host-payment-records` edge function applies 10% service fee
2. Check the calculation: `hostRent = guestRent * 0.90`
3. If records exist but are wrong, regenerate with:
```typescript
await supabase.functions.invoke('host-payment-records', {
  body: { action: 'regenerate', payload: { leaseId } }
});
```

---

### Issue: Currency conversion errors

**Symptom**: `Rent1` shows `NaN` or incorrect values.

**Cause**: The `:converted to number` operation failed on a malformed currency string.

**Solution**:
1. Check the source field format (should be "1,028.58", not "$1,028.58")
2. Ensure the conversion strips commas before parsing:
```javascript
const toNumber = (str) => parseFloat(str.replace(/,/g, ''));
```

---

### Issue: Payout Number mismatch

**Symptom**: Validation fails on Payout Number format.

**Cause**: Step 2 didn't properly concatenate Agreement Number with "-PSF".

**Solution**:
1. Verify Step 2 sets: `Host Payout Schedule Number = Agreement Number + "-PSF"`
2. Check for extra spaces or characters in the concatenation

---

## Related Documentation

- [PAYMENT_RECORDS_COMPREHENSIVE_GUIDE.md](./PAYMENT_RECORDS_COMPREHENSIVE_GUIDE.md) - Complete payment records reference
- [HOST_PAYMENT_RECORDS_CALCULATION_GUIDE.md](./HOST_PAYMENT_RECORDS_CALCULATION_GUIDE.md) - Host payment calculation logic
- [Edge Functions README](../edge-functions/README.md) - Edge function API reference

---

**License**: Proprietary - Split Lease LLC
