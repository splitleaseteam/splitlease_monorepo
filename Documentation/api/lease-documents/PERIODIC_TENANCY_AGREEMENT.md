# Periodic Tenancy Agreement - API Documentation

**Created**: 2026-02-04
**Version**: 1.0
**Document Type**: `periodic_tenancy`
**Purpose**: Comprehensive API reference for generating Periodic Tenancy Agreement documents

---

## Table of Contents

- [Overview](#overview)
- [API Request Schema](#api-request-schema)
- [Field Reference](#field-reference)
  - [Identification Fields](#identification-fields)
  - [Date & Duration Fields](#date--duration-fields)
  - [Party Information Fields](#party-information-fields)
  - [Property Details Fields](#property-details-fields)
  - [Cross-Reference Fields](#cross-reference-fields)
  - [Policy & Rules Fields](#policy--rules-fields)
- [Data Source Tracing](#data-source-tracing)
- [JSON-Safe Formatting](#json-safe-formatting)
- [TypeScript Interface](#typescript-interface)
- [Example Payloads](#example-payloads)
- [Validation Rules](#validation-rules)
- [Edge Function Integration](#edge-function-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

The **Periodic Tenancy Agreement** is the primary legal contract between the guest and host for a Split Lease rental. It documents all essential terms including property details, duration, parties involved, and house rules.

### Document Purpose

- Establishes the legal rental agreement between guest and host
- Documents property location, type, and detailed specifications
- Records check-in/check-out dates and weekly schedule
- Lists house rules and cancellation policies
- Cross-references other lease documents (Supplemental, Authorization, Payout Schedule)

### Document Generation Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PERIODIC TENANCY AGREEMENT FLOW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Step 2: Create Fields For Lease Documents                                  │
│     └─ Populates all property, party, and duration fields                   │
│                                                                              │
│  Step 14: Call PythonAnywhere Service - *Periodic Tenancy Agreement         │
│     └─ Passes periodic_tenancy payload (from Arbitrary text fields)         │
│     └─ Conditional: Only when returned_an_error is no                       │
│                                                                              │
│  Step 15: Trigger Alerts general SUCCESS periodic tenancy                   │
│     └─ Only when Step 14 returned_an_error is no                            │
│                                                                              │
│  Step 16: Trigger Alerts general ERROR periodic tenancy                     │
│     └─ Only when Step 14 returned_an_error is yes                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Characteristics

| Aspect | Description |
|--------|-------------|
| **Document Type** | Legal rental agreement |
| **Primary Focus** | Property details, terms, and parties |
| **Payment Data** | None (payments are in Host Payout Schedule and Credit Card Auth) |
| **Images** | None in this document (images are in Supplemental Agreement) |
| **Cross-References** | Links to 3 other documents via document numbers |

---

## API Request Schema

### Complete JSON Structure

```json
{
  "Agreement Number": "string",
  "Check in Date": "string",
  "Check Out Date": "string",
  "Check In Day": "string",
  "Check Out Day": "string",
  "Number of weeks": "string",
  "Guests Allowed": "string",
  "Host name": "string",
  "Guest name": "string",
  "Supplemental Number": "string",
  "Authorization Card Number": "string",
  "Host Payout Schedule Number": "string",
  "Extra Requests on Cancellation Policy": "string",
  "Damage Deposit": "string",
  "Location": "string",
  "Type of Space": "string",
  "Listing Title": "string",
  "Listing Description": "string",
  "Space Details": "string",
  "House Rules": "string"
}
```

### Bubble.io Source Mapping

```json
{
  "Agreement Number": "Result of step 2 (Create a new Fiel...)'s Agreement number:formatted as JSON-safe",
  "Check in Date": "Result of step 2 (Create a new Fiel...)'s check in date:formatted as JSON-safe",
  "Check Out Date": "Result of step 2 (Create a new Fiel...)'s check out date:formatted as JSON-safe",
  "Check In Day": "Result of step 2 (Create a new Fiel...)'s check in weekly:formatted as JSON-safe",
  "Check Out Day": "Result of step 2 (Create a new Fiel...)'s last night weekly:formatted as JSON-safe",
  "Number of weeks": "Result of step 2 (Create a new Fiel...)'s Number of weeks",
  "Guests Allowed": "Result of step 2 (Create a new Fiel...)'s Guest allowed",
  "Host name": "Result of step 2 (Create a new Fiel...)'s Host name:formatted as JSON-safe",
  "Guest name": "Result of step 2 (Create a new Fiel...)'s Guest name:formatted as JSON-safe",
  "Supplemental Number": "Result of step 2 (Create a new Fiel...)'s Supplemental Number:formatted as JSON-safe",
  "Authorization Card Number": "Result of step 2 (Create a new Fiel...)'s Authorization Card Number:formatted as JSON-safe",
  "Host Payout Schedule Number": "Result of step 2 (Create a new Fiel...)'s Host Payout Schedule Number:formatted as JSON-safe",
  "Extra Requests on Cancellation Policy": "Result of step 2 (Create a new Fiel...)'s Extra Requests on Cancellation Policy:formatted as JSON-safe",
  "Damage Deposit": "Result of step 2 (Create a new Fiel...)'s Damage Deposit",
  "Location": "Result of step 2 (Create a new Fiel...)'s Location:formatted as JSON-safe",
  "Type of Space": "Result of step 2 (Create a new Fiel...)'s Type of Space:formatted as JSON-safe",
  "Listing Title": "Result of step 2 (Create a new Fiel...)'s Listing Name:formatted as JSON-safe",
  "Listing Description": "Result of step 2 (Create a new Fiel...)'s Listing Description:formatted as JSON-safe",
  "Space Details": "Result of step 2 (Create a new Fiel...)'s Details of Space:formatted as JSON-safe",
  "House Rules": "Result of step 2 (Create a new Fiel...)'s house rules set list:join with ', ':formatted as JSON-safe"
}
```

---

## Field Reference

### Identification Fields

| API Field | Type | JSON-Safe | Source Field | Description |
|-----------|------|-----------|--------------|-------------|
| `Agreement Number` | string | Yes | `Agreement number` | Unique lease identifier (e.g., "AGR-12345") |

**Agreement Number Format**:
```
AGR-12345
 │    │
 │    └─ Unique numeric ID
 └────── Agreement prefix
```

---

### Date & Duration Fields

| API Field | Type | JSON-Safe | Source Field | Format | Description |
|-----------|------|-----------|--------------|--------|-------------|
| `Check in Date` | string | Yes | `check in date` | `mm/dd/yy` | Lease start date |
| `Check Out Date` | string | Yes | `check out date` | `mm/dd/yy` | Lease end date |
| `Check In Day` | string | Yes | `check in weekly` | Day name | Weekly check-in day (e.g., "Monday") |
| `Check Out Day` | string | Yes | `last night weekly` | Day name | Last night of each week (e.g., "Friday") |
| `Number of weeks` | string | No | `Number of weeks` | Integer | Total reservation span in weeks |

**Date Calculation Origin**:
```javascript
// Check in Date
checkInDate = reservation.reservationPeriod.start.formatted('mm/dd/yy');

// Check Out Date
checkOutDate = reservation.reservationPeriod.end.formatted('mm/dd/yy');

// Check In Day (weekly pattern)
checkInDay = proposal.hcCheckInDay.display; // e.g., "Monday"

// Last Night Weekly
lastNightWeekly = proposal.hcNightsSelected.lastItem.display; // e.g., "Friday"

// Number of weeks
numberOfWeeks = proposal.hcReservationSpanWeeks; // e.g., 8
```

---

### Party Information Fields

| API Field | Type | JSON-Safe | Source Field | Description |
|-----------|------|-----------|--------------|-------------|
| `Host name` | string | Yes | `Host name` | Host's full legal name |
| `Guest name` | string | Yes | `Guest name` | Guest's full legal name |
| `Guests Allowed` | string | No | `Guest allowed` | Maximum number of guests permitted |

**Data Origin Chain**:
```
Host name:
  Reservation → Proposal → Host - Account → User → Name - Full

Guest name:
  Reservation → Guest → Name - Full

Guests Allowed:
  Reservation → Listing → Features - Qty Guests
```

---

### Property Details Fields

| API Field | Type | JSON-Safe | Source Field | Description |
|-----------|------|-----------|--------------|-------------|
| `Location` | string | Yes | `Location` | Custom location text (arbitrary) |
| `Type of Space` | string | Yes | `Type of Space` | Space type description (Boolean Formatted) |
| `Listing Title` | string | Yes | `Listing Name` | Property name/title |
| `Listing Description` | string | Yes | `Listing Description` | Full property description |
| `Space Details` | string | Yes | `Details of Space` | Room details (Boolean Formatted) |

#### Type of Space - Boolean Formatting Logic

The `Type of Space` field is constructed using Bubble.io Boolean Formatting:

```javascript
// Bubble.io Boolean Formatting pattern
let typeOfSpace = '';

// Condition: Type of Space's Label is not empty
if (listing.features.typeOfSpace?.label) {
  typeOfSpace += listing.features.typeOfSpace.label + ', ';
}

// Condition: SQFT Area is not empty
if (listing.features.sqftArea) {
  typeOfSpace += `(${listing.features.sqftArea.toLocaleString()} SQFT) - `;
}

// Condition: Qty Guests is not empty
if (listing.features.qtyGuests) {
  typeOfSpace += `${listing.features.qtyGuests} guest(s) max`;
}

// Example output: "Studio, (450 SQFT) - 2 guest(s) max"
```

#### Space Details - Boolean Formatting Logic

The `Space Details` (mapped from `Details of Space`) field uses nested Boolean Formatting:

```javascript
let spaceDetails = '';

// Condition: Qty Bedrooms is 0
if (listing.features.qtyBedrooms === 0) {
  spaceDetails += 'Studio';
}
// Condition: Qty Bedrooms > 1
else if (listing.features.qtyBedrooms > 1) {
  spaceDetails += `${listing.features.qtyBedrooms} Bedroom(s) - `;
}

// Condition: Qty Beds is not empty
if (listing.features.qtyBeds) {
  spaceDetails += `${listing.features.qtyBeds} bed`;
  // Condition: Qty Beds > 1
  if (listing.features.qtyBeds > 1) {
    spaceDetails += '(s)';
  }
  spaceDetails += ' - ';
}

// Condition: Qty Bathrooms >= 1
if (listing.features.qtyBathrooms >= 1) {
  spaceDetails += `${listing.features.qtyBathrooms} bathroom(s)`;
}

// Append Kitchen Type
if (listing.kitchenType?.display) {
  spaceDetails += ` - ${listing.kitchenType.display}`;
}

// Example outputs:
// "Studio - 1 bed - 1 bathroom(s) - Full Kitchen"
// "2 Bedroom(s) - 3 bed(s) - 2 bathroom(s) - Kitchenette"
```

---

### Cross-Reference Fields

These fields link the Periodic Tenancy Agreement to other lease documents:

| API Field | Type | JSON-Safe | Source Field | Format | Description |
|-----------|------|-----------|--------------|--------|-------------|
| `Supplemental Number` | string | Yes | `Supplemental Number` | `{AGR}-SUPL` | Links to Supplemental Agreement |
| `Authorization Card Number` | string | Yes | `Authorization Card Number` | `{AGR}-ARCCC-G1` | Links to Credit Card Authorization |
| `Host Payout Schedule Number` | string | Yes | `Host Payout Schedule Number` | `{AGR}-PSF` | Links to Host Payout Schedule |

**Document Number Formats**:
```
Agreement Number:           AGR-12345
Supplemental Number:        AGR-12345-SUPL
Authorization Card Number:  AGR-12345-ARCCC-G1
Host Payout Schedule:       AGR-12345-PSF
```

---

### Policy & Rules Fields

| API Field | Type | JSON-Safe | Source Field | Description |
|-----------|------|-----------|--------------|-------------|
| `Extra Requests on Cancellation Policy` | string | Yes | `Extra Requests on Cancellation Policy` | Host-specific restrictions/guidelines |
| `Damage Deposit` | string | No | `Damage Deposit` | Refundable damage deposit amount |
| `House Rules` | string | Yes | `house rules set list:join with ', '` | Comma-separated list of house rules |

**House Rules Transformation**:
```javascript
// Source: Array of rule objects
const houseRulesList = proposal.hcHouseRules; // [{Name: "No Smoking"}, {Name: "No Pets"}, ...]

// Transform: Extract names and join
const houseRulesString = houseRulesList
  .map(rule => rule.Name)
  .join(', ');

// Output: "No Smoking, No Pets, Quiet Hours 10pm-8am"
// Then apply :formatted as JSON-safe for escaping
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
│  bookings_leases                                                             │
│    └─ Agreement Number ────────────► Agreement number ──► Agreement Number   │
│    └─ Reservation Period: Start ───► check in date ──► Check in Date        │
│    └─ Reservation Period: End ─────► check out date ──► Check Out Date      │
│                                                                              │
│  proposal                                                                    │
│    ├─ hc check in day ─────────────► check in weekly ──► Check In Day       │
│    ├─ hc nights selected (last) ───► last night weekly ──► Check Out Day    │
│    ├─ hc reservation span (weeks) ─► Number of weeks ──► Number of weeks    │
│    ├─ hc damage deposit ───────────► Damage Deposit ──► Damage Deposit      │
│    └─ hc house rules ──────────────► house rules set list ──► House Rules   │
│                                                                              │
│  listing                                                                     │
│    ├─ Name ────────────────────────► Listing Name ──► Listing Title         │
│    ├─ Description ─────────────────► Listing Description ──► Listing Desc   │
│    ├─ Features - Qty Guests ───────► Guest allowed ──► Guests Allowed       │
│    ├─ (Boolean Formatted) ─────────► Type of Space ──► Type of Space        │
│    ├─ (Boolean Formatted) ─────────► Details of Space ──► Space Details     │
│    └─ host restrictions.Guidelines ► Extra Requests... ──► Extra Requests   │
│                                                                              │
│  user (Host)                                                                 │
│    └─ Name - Full ─────────────────► Host name ──► Host name                 │
│                                                                              │
│  user (Guest)                                                                │
│    └─ Name - Full ─────────────────► Guest name ──► Guest name               │
│                                                                              │
│  COMPUTED (in Step 2)                                                        │
│    ├─ Agreement Number + "-SUPL" ──► Supplemental Number                     │
│    ├─ Agreement Number + "-ARCCC-G1" ► Authorization Card Number             │
│    ├─ Agreement Number + "-PSF" ───► Host Payout Schedule Number             │
│    └─ Arbitrary text ──────────────► Location                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## JSON-Safe Formatting

### What is `:formatted as JSON-safe`?

Bubble.io's `:formatted as JSON-safe` operator escapes special characters that would break JSON parsing:

| Character | Escaped As | Example |
|-----------|-----------|---------|
| `"` (double quote) | `\"` | `John "Jack" Doe` → `John \"Jack\" Doe` |
| `\` (backslash) | `\\` | `C:\path` → `C:\\path` |
| Newline | `\n` | Multi-line text → Single line with `\n` |
| Tab | `\t` | Tabbed text → `\t` |
| Carriage return | `\r` | CRLF line endings → `\r\n` |

### Fields WITHOUT JSON-Safe Formatting

Three fields do NOT use `:formatted as JSON-safe`:

| Field | Reason |
|-------|--------|
| `Number of weeks` | Integer value, no special characters possible |
| `Guests Allowed` | Integer value, no special characters possible |
| `Damage Deposit` | Currency string (e.g., "1,500.00"), already safe |

### TypeScript Helper for JSON-Safe

```typescript
/**
 * Escape a string for JSON-safe output
 * Replicates Bubble.io's :formatted as JSON-safe operator
 */
function formatAsJsonSafe(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  return value
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/"/g, '\\"')     // Escape double quotes
    .replace(/\n/g, '\\n')    // Escape newlines
    .replace(/\r/g, '\\r')    // Escape carriage returns
    .replace(/\t/g, '\\t');   // Escape tabs
}
```

---

## TypeScript Interface

### Request Payload Interface

```typescript
/**
 * Periodic Tenancy Agreement API Request Payload
 * Document Type: periodic_tenancy
 */
export interface PeriodicTenancyPayload {
  // Identification
  'Agreement Number': string;

  // Dates & Duration
  'Check in Date': string;
  'Check Out Date': string;
  'Check In Day': string;
  'Check Out Day': string;
  'Number of weeks': string;

  // Parties
  'Host name': string;
  'Guest name': string;
  'Guests Allowed': string;

  // Property Details
  'Location': string;
  'Type of Space': string;
  'Listing Title': string;
  'Listing Description': string;
  'Space Details': string;

  // Cross-References
  'Supplemental Number': string;
  'Authorization Card Number': string;
  'Host Payout Schedule Number': string;

  // Policies & Rules
  'Extra Requests on Cancellation Policy': string;
  'Damage Deposit': string;
  'House Rules': string;
}

/**
 * Fields For Lease Documents - Periodic Tenancy relevant fields
 */
export interface FieldsForLeaseDocumentsPeriodicTenancy {
  // Identification
  'Agreement number': string;

  // Dates
  'check in date': string;
  'check out date': string;
  'check in weekly': string;
  'last night weekly': string;

  // Duration
  'Number of weeks': number;

  // Parties
  'Host name': string;
  'Guest name': string;
  'Guest allowed': number;

  // Property
  'Location': string;
  'Type of Space': string;
  'Listing Name': string;
  'Listing Description': string;
  'Details of Space': string;

  // Cross-references
  'Supplemental Number': string;
  'Authorization Card Number': string;
  'Host Payout Schedule Number': string;

  // Policies
  'Extra Requests on Cancellation Policy': string;
  'Damage Deposit': string;
  'house rules set list': string[];
}
```

### Builder Function

```typescript
/**
 * Build Periodic Tenancy Agreement payload from Fields For Lease Documents
 */
function buildPeriodicTenancyPayload(
  fields: FieldsForLeaseDocumentsPeriodicTenancy
): PeriodicTenancyPayload {
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

    // Dates & Duration
    'Check in Date': jsonSafe(fields['check in date']),
    'Check Out Date': jsonSafe(fields['check out date']),
    'Check In Day': jsonSafe(fields['check in weekly']),
    'Check Out Day': jsonSafe(fields['last night weekly']),
    'Number of weeks': String(fields['Number of weeks']), // No JSON-safe needed

    // Parties
    'Host name': jsonSafe(fields['Host name']),
    'Guest name': jsonSafe(fields['Guest name']),
    'Guests Allowed': String(fields['Guest allowed']), // No JSON-safe needed

    // Property Details
    'Location': jsonSafe(fields['Location']),
    'Type of Space': jsonSafe(fields['Type of Space']),
    'Listing Title': jsonSafe(fields['Listing Name']),
    'Listing Description': jsonSafe(fields['Listing Description']),
    'Space Details': jsonSafe(fields['Details of Space']),

    // Cross-References
    'Supplemental Number': jsonSafe(fields['Supplemental Number']),
    'Authorization Card Number': jsonSafe(fields['Authorization Card Number']),
    'Host Payout Schedule Number': jsonSafe(fields['Host Payout Schedule Number']),

    // Policies & Rules
    'Extra Requests on Cancellation Policy': jsonSafe(fields['Extra Requests on Cancellation Policy']),
    'Damage Deposit': fields['Damage Deposit'], // No JSON-safe needed (currency string)
    'House Rules': jsonSafe(fields['house rules set list'].join(', ')),
  };
}
```

---

## Example Payloads

### Example 1: Weekly Rental - Studio Apartment

```json
{
  "Agreement Number": "AGR-78542",
  "Check in Date": "02/15/26",
  "Check Out Date": "04/12/26",
  "Check In Day": "Monday",
  "Check Out Day": "Friday",
  "Number of weeks": "8",
  "Guests Allowed": "2",
  "Host name": "John Smith",
  "Guest name": "Sarah Johnson",
  "Supplemental Number": "AGR-78542-SUPL",
  "Authorization Card Number": "AGR-78542-ARCCC-G1",
  "Host Payout Schedule Number": "AGR-78542-PSF",
  "Extra Requests on Cancellation Policy": "Please provide 48 hours notice for any changes to arrival time.",
  "Damage Deposit": "500.00",
  "Location": "Midtown Manhattan, New York",
  "Type of Space": "Studio, (450 SQFT) - 2 guest(s) max",
  "Listing Title": "Cozy Midtown Studio - Perfect for Business Travel",
  "Listing Description": "A beautifully furnished studio in the heart of Manhattan. Walking distance to Times Square, Penn Station, and countless restaurants. Ideal for business travelers seeking comfort and convenience.",
  "Space Details": "Studio - 1 bed - 1 bathroom(s) - Full Kitchen",
  "House Rules": "No Smoking, No Pets, Quiet Hours 10pm-8am, No Parties"
}
```

### Example 2: Monthly Rental - 2 Bedroom with Special Characters

```json
{
  "Agreement Number": "AGR-91203",
  "Check in Date": "03/01/26",
  "Check Out Date": "05/31/26",
  "Check In Day": "Saturday",
  "Check Out Day": "Friday",
  "Number of weeks": "13",
  "Guests Allowed": "4",
  "Host name": "Maria O'Connor",
  "Guest name": "James \"Jimmy\" Williams",
  "Supplemental Number": "AGR-91203-SUPL",
  "Authorization Card Number": "AGR-91203-ARCCC-G1",
  "Host Payout Schedule Number": "AGR-91203-PSF",
  "Extra Requests on Cancellation Policy": "Cancellation requires 30 days notice.\\nEarly termination fee: 1 month rent.",
  "Damage Deposit": "1,500.00",
  "Location": "Upper West Side, New York",
  "Type of Space": "Apartment, (950 SQFT) - 4 guest(s) max",
  "Listing Title": "Spacious 2BR Upper West Side - Near Central Park",
  "Listing Description": "Stunning 2-bedroom apartment with park views.\\n\\nFeatures:\\n- Modern kitchen\\n- In-unit laundry\\n- Doorman building",
  "Space Details": "2 Bedroom(s) - 3 bed(s) - 2 bathroom(s) - Full Kitchen",
  "House Rules": "No Smoking, Pets Allowed (with deposit), Respect neighbors' quiet hours"
}
```

**Note**: The second example demonstrates JSON-safe escaping:
- `O'Connor` - apostrophe is safe, no escaping needed
- `"Jimmy"` → `\"Jimmy\"` - double quotes escaped
- Newlines in description → `\\n` - escaped for JSON

---

## Validation Rules

### Required Fields

| Field | Rule |
|-------|------|
| `Agreement Number` | Non-empty, format `AGR-{digits}` |
| `Check in Date` | Non-empty, format `mm/dd/yy` |
| `Check Out Date` | Non-empty, format `mm/dd/yy`, must be after Check in Date |
| `Host name` | Non-empty string |
| `Guest name` | Non-empty string |
| `Number of weeks` | Positive integer as string |
| `Guests Allowed` | Positive integer as string |
| `Listing Title` | Non-empty string |

### Cross-Reference Validation

```typescript
function validateCrossReferences(payload: PeriodicTenancyPayload): string[] {
  const errors: string[] = [];
  const agreementNumber = payload['Agreement Number'];

  // Validate Supplemental Number format
  const expectedSuppl = `${agreementNumber}-SUPL`;
  if (payload['Supplemental Number'] !== expectedSuppl) {
    errors.push(`Supplemental Number should be ${expectedSuppl}`);
  }

  // Validate Authorization Card Number format
  const expectedAuth = `${agreementNumber}-ARCCC-G1`;
  if (payload['Authorization Card Number'] !== expectedAuth) {
    errors.push(`Authorization Card Number should be ${expectedAuth}`);
  }

  // Validate Host Payout Schedule Number format
  const expectedPSF = `${agreementNumber}-PSF`;
  if (payload['Host Payout Schedule Number'] !== expectedPSF) {
    errors.push(`Host Payout Schedule Number should be ${expectedPSF}`);
  }

  return errors;
}
```

### Complete Validation Function

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validatePeriodicTenancyPayload(
  payload: PeriodicTenancyPayload
): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!payload['Agreement Number']) {
    errors.push('Agreement Number is required');
  }
  if (!payload['Check in Date']) {
    errors.push('Check in Date is required');
  }
  if (!payload['Check Out Date']) {
    errors.push('Check Out Date is required');
  }
  if (!payload['Host name']) {
    errors.push('Host name is required');
  }
  if (!payload['Guest name']) {
    errors.push('Guest name is required');
  }
  if (!payload['Number of weeks'] || parseInt(payload['Number of weeks']) <= 0) {
    errors.push('Number of weeks must be a positive integer');
  }
  if (!payload['Guests Allowed'] || parseInt(payload['Guests Allowed']) <= 0) {
    errors.push('Guests Allowed must be a positive integer');
  }
  if (!payload['Listing Title']) {
    errors.push('Listing Title is required');
  }

  // Date validation
  if (payload['Check in Date'] && payload['Check Out Date']) {
    const checkIn = parseDate(payload['Check in Date']);
    const checkOut = parseDate(payload['Check Out Date']);
    if (checkOut <= checkIn) {
      errors.push('Check Out Date must be after Check in Date');
    }
  }

  // Cross-reference validation
  errors.push(...validateCrossReferences(payload));

  return {
    valid: errors.length === 0,
    errors,
  };
}

function parseDate(dateStr: string): Date {
  // Parse mm/dd/yy format
  const [mm, dd, yy] = dateStr.split('/');
  const year = parseInt(yy) + 2000; // Assume 21st century
  return new Date(year, parseInt(mm) - 1, parseInt(dd));
}
```

---

## Edge Function Integration

### Calling the lease-documents Edge Function

```typescript
/**
 * Generate Periodic Tenancy Agreement via Edge Function
 */
async function generatePeriodicTenancyAgreement(
  leaseId: string,
  fields: FieldsForLeaseDocumentsPeriodicTenancy,
  supabase: SupabaseClient
): Promise<DocumentGenerationResult> {
  // Build the payload
  const payload = buildPeriodicTenancyPayload(fields);

  // Validate before sending
  const validation = validatePeriodicTenancyPayload(payload);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }

  // Call the edge function
  const { data, error } = await supabase.functions.invoke('lease-documents', {
    body: {
      action: 'generate',
      payload: {
        documentType: 'periodic_tenancy',
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
    "documentType": "periodic_tenancy",
    "leaseId": "abc123",
    "data": {
      "Agreement Number": "AGR-78542",
      "Check in Date": "02/15/26",
      "...": "..."
    }
  }
}
```

### Edge Function Response Format

```json
{
  "success": true,
  "filename": "AGR-78542-Periodic-Tenancy-Agreement.docx",
  "driveUrl": "https://drive.google.com/file/d/...",
  "storageUrl": "https://xxx.supabase.co/storage/v1/object/public/documents/..."
}
```

---

## Troubleshooting

### Issue: JSON parsing errors in API call

**Symptom**: API returns "Invalid JSON" or parsing error.

**Cause**: Special characters in text fields not properly escaped.

**Solution**:
1. Ensure all text fields use `:formatted as JSON-safe` in Bubble.io
2. Check for unescaped quotes in Host name, Guest name, or descriptions
3. Verify newlines in Listing Description are properly escaped

```javascript
// Debug: Log the payload before sending
console.log('Payload:', JSON.stringify(payload, null, 2));
```

---

### Issue: Cross-reference numbers don't match

**Symptom**: Supplemental Number, Authorization Card Number, or Host Payout Schedule Number have incorrect format.

**Cause**: Step 2 didn't properly concatenate Agreement Number with suffixes.

**Solution**:
1. Verify Step 2 calculations:
   - `Supplemental Number = Agreement Number + "-SUPL"`
   - `Authorization Card Number = Agreement Number + "-ARCCC-G1"`
   - `Host Payout Schedule Number = Agreement Number + "-PSF"`
2. Check for leading/trailing spaces in Agreement Number

---

### Issue: House Rules showing as empty or malformed

**Symptom**: House Rules field is empty or shows "[object Object]".

**Cause**: The house rules array wasn't properly joined or the wrong property was accessed.

**Solution**:
1. Verify the source: `house rules set list:join with ', '`
2. Ensure each rule object's `Name` property is being accessed
3. Check that the array isn't empty before joining

```javascript
// Correct pattern
const houseRules = fields['house rules set list']
  .map(rule => rule.Name || rule)
  .filter(Boolean)
  .join(', ');
```

---

### Issue: Type of Space or Space Details showing incomplete

**Symptom**: Fields like "Studio, " with trailing comma, or missing bathroom count.

**Cause**: Boolean Formatting conditions not all evaluated, or source data missing.

**Solution**:
1. Check listing features data:
   - `typeOfSpace.label`
   - `sqftArea`
   - `qtyGuests`
   - `qtyBedrooms`
   - `qtyBeds`
   - `qtyBathrooms`
   - `kitchenType.display`
2. Verify Step 2's Boolean Formatting logic handles all conditions

---

### Issue: Date format mismatch

**Symptom**: Dates showing in wrong format (e.g., "2026-02-15" instead of "02/15/26").

**Cause**: Date formatting in Step 2 not using correct Bubble.io format.

**Solution**:
1. Ensure dates are formatted as: `Reservation Period: Start:formatted as 2/04/26`
2. The format string `2/04/26` produces `mm/dd/yy` output
3. Verify the Fields For Lease Documents stores the formatted string, not the raw date

---

## Related Documentation

- [PAYMENT_RECORDS_COMPREHENSIVE_GUIDE.md](./PAYMENT_RECORDS_COMPREHENSIVE_GUIDE.md) - Complete workflow reference
- [HOST_PAYOUT_SCHEDULE_FORM.md](./HOST_PAYOUT_SCHEDULE_FORM.md) - Host payout document
- [Edge Functions README](../edge-functions/README.md) - Edge function API reference

---

**License**: Proprietary - Split Lease LLC
