# Lease Documents API - Field Gap Analysis

**Created**: 2026-02-04
**Purpose**: Identify all fields required by the `lease-documents` edge function and map data sources
**Context**: ManageLeasesPaymentRecordsPage → Generate Documents button

---

## Overview

The `lease-documents` edge function expects a `generate_all` payload with 4 sub-objects:
- `hostPayout` - Host Payout Schedule Form
- `supplemental` - Supplemental Agreement
- `periodicTenancy` - Periodic Tenancy Agreement
- `creditCardAuth` - Credit Card Authorization Form

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ | Field available in `selectedLease` (already adapted) |
| ⚠️ | Field requires additional fetch or calculation |
| ❌ | Field source unknown or missing |
| 🔢 | Calculated/derived field |

---

## 1. Host Payout Schedule (`hostPayout`)

| API Field | Required | Status | Source Table | Source Column | Frontend Path | Notes |
|-----------|----------|--------|--------------|---------------|---------------|-------|
| `Agreement Number` | ✅ Yes | ✅ | `bookings_leases` | `Agreement Number` | `selectedLease.agreementNumber` | |
| `Host Name` | ✅ Yes | ✅ | `user` | `first name` + `last name` | `selectedLease.host.firstName` + `lastName` | Joined via `Host` FK |
| `Host Email` | ✅ Yes | ✅ | `user` | `email` | `selectedLease.host.email` | |
| `Host Phone` | ✅ Yes | ⚠️ | `user` | `Phone Number` | `selectedLease.host.phone` | May be null |
| `Address` | ✅ Yes | ⚠️ | `listing` | `address` OR `Location` | `selectedLease.listing.address` | Not always populated |
| `Payout Number` | ✅ Yes | 🔢 | Generated | `{agreementNumber}-PO` | — | Calculated |
| `Maintenance Fee` | ✅ Yes | ❌ | `proposal` OR `listing` | `maintenanceFee` | **NOT AVAILABLE** | Hardcoded as `0` |
| `Date1-13` | Optional | ⚠️ | `host_payment_records` | `Payment Date` | **NOT FETCHED** | Need to fetch payment records |
| `Rent1-13` | Optional | ⚠️ | `host_payment_records` | `Amount` | **NOT FETCHED** | Need to fetch payment records |
| `Total1-13` | Optional | 🔢 | Calculated | `Rent + MaintenanceFee` | — | Calculated |

### Gaps for Host Payout:
1. **`Maintenance Fee`** - Not available in `selectedLease`. Source unclear.
2. **Payment Records (`Date1-13`, `Rent1-13`)** - Not currently fetched. Need to query `host_payment_records` table.

---

## 2. Supplemental Agreement (`supplemental`)

| API Field | Required | Status | Source Table | Source Column | Frontend Path | Notes |
|-----------|----------|--------|--------------|---------------|---------------|-------|
| `Agreement Number` | ✅ Yes | ✅ | `bookings_leases` | `Agreement Number` | `selectedLease.agreementNumber` | |
| `Check in Date` | ✅ Yes | ✅ | `bookings_leases` | `Reservation Period : Start` | `selectedLease.startDate` | Format: MM/DD/YY |
| `Check Out Date` | ✅ Yes | ✅ | `bookings_leases` | `Reservation Period : End` | `selectedLease.endDate` | Format: MM/DD/YY |
| `Number of weeks` | ✅ Yes | ✅ | `bookings_leases` | `total week count` | `selectedLease.totalWeekCount` | |
| `Guests Allowed` | ✅ Yes | ❌ | `listing` | `Guests Allowed` | **NOT AVAILABLE** | Hardcoded as `'1'` |
| `Host Name` | ✅ Yes | ✅ | `user` | `first name` + `last name` | `selectedLease.host.fullName` | |
| `Listing Title` | ✅ Yes | ✅ | `listing` | `Name` OR `Title` | `selectedLease.listing.name` | |
| `Listing Description` | ✅ Yes | ❌ | `listing` | `Description` | **NOT FETCHED** | Not in adapter |
| `Location` | ✅ Yes | ⚠️ | `listing` | `Location` | `selectedLease.listing.address` | May need `Location` field |
| `Type of Space` | ✅ Yes | ❌ | `listing` | `Type of Space` | **NOT FETCHED** | Not in adapter |
| `Space Details` | ✅ Yes | ❌ | `listing` | `Space Details` | **NOT FETCHED** | Not in adapter |
| `Supplemental Number` | ✅ Yes | 🔢 | Generated | `{agreementNumber}-SA` | — | Calculated |
| `image1` | Optional | ❌ | `listing` | `image1` | **NOT FETCHED** | Not in adapter |
| `image2` | Optional | ❌ | `listing` | `image2` | **NOT FETCHED** | Not in adapter |
| `image3` | Optional | ❌ | `listing` | `image3` | **NOT FETCHED** | Not in adapter |

### Gaps for Supplemental:
1. **`Guests Allowed`** - Not fetched from listing
2. **`Listing Description`** - Not in listing adapter
3. **`Type of Space`** - Not in listing adapter
4. **`Space Details`** - Not in listing adapter
5. **`image1-3`** - Not in listing adapter

---

## 3. Periodic Tenancy Agreement (`periodicTenancy`)

| API Field | Required | Status | Source Table | Source Column | Frontend Path | Notes |
|-----------|----------|--------|--------------|---------------|---------------|-------|
| `Agreement Number` | ✅ Yes | ✅ | `bookings_leases` | `Agreement Number` | `selectedLease.agreementNumber` | |
| `Check in Date` | ✅ Yes | ✅ | `bookings_leases` | `Reservation Period : Start` | `selectedLease.startDate` | Format: MM/DD/YY |
| `Check Out Date` | ✅ Yes | ✅ | `bookings_leases` | `Reservation Period : End` | `selectedLease.endDate` | Format: MM/DD/YY |
| `Check In Day` | ✅ Yes | 🔢 | Derived | `getDayName(startDate)` | — | Calculated from date |
| `Check Out Day` | ✅ Yes | 🔢 | Derived | `getDayName(endDate)` | — | Calculated from date |
| `Number of weeks` | ✅ Yes | ✅ | `bookings_leases` | `total week count` | `selectedLease.totalWeekCount` | |
| `Guests Allowed` | ✅ Yes | ❌ | `listing` | `Guests Allowed` | **NOT AVAILABLE** | Hardcoded as `'1'` |
| `Host name` | ✅ Yes | ✅ | `user` | `first name` + `last name` | `selectedLease.host.fullName` | Note: lowercase 'n' |
| `Guest name` | ✅ Yes | ✅ | `user` | `first name` + `last name` | `selectedLease.guest.fullName` | Note: lowercase 'n' |
| `Supplemental Number` | ✅ Yes | 🔢 | Generated | `{agreementNumber}-SA` | — | Calculated |
| `Authorization Card Number` | ✅ Yes | 🔢 | Generated | `{agreementNumber}-CC` | — | Calculated |
| `Host Payout Schedule Number` | ✅ Yes | 🔢 | Generated | `{agreementNumber}-PO` | — | Calculated |
| `Extra Requests on Cancellation Policy` | Optional | ⚠️ | `bookings_leases` | `Cancellation Policy` | `selectedLease.cancellationPolicy` | May need formatting |
| `Damage Deposit` | ✅ Yes | ❌ | `proposal` | `damageDeposit` | **NOT AVAILABLE** | Hardcoded as `500` |
| `Listing Title` | ✅ Yes | ✅ | `listing` | `Name` | `selectedLease.listing.name` | |
| `Listing Description` | ✅ Yes | ❌ | `listing` | `Description` | **NOT FETCHED** | |
| `Location` | ✅ Yes | ⚠️ | `listing` | `Location` | `selectedLease.listing.address` | |
| `Type of Space` | ✅ Yes | ❌ | `listing` | `Type of Space` | **NOT FETCHED** | |
| `Space Details` | ✅ Yes | ❌ | `listing` | `Space Details` | **NOT FETCHED** | |
| `House Rules` | Optional | ❌ | `listing` | `House Rules` | **NOT FETCHED** | Array of strings |
| `image1-3` | Optional | ❌ | `listing` | `image1`, `image2`, `image3` | **NOT FETCHED** | |

### Gaps for Periodic Tenancy:
1. **`Damage Deposit`** - Not available, hardcoded as `500`
2. **`Guests Allowed`** - Not fetched
3. **`Listing Description`** - Not in adapter
4. **`Type of Space`** - Not in adapter
5. **`Space Details`** - Not in adapter
6. **`House Rules`** - Not in adapter
7. **`image1-3`** - Not in adapter

---

## 4. Credit Card Authorization (`creditCardAuth`)

| API Field | Required | Status | Source Table | Source Column | Frontend Path | Notes |
|-----------|----------|--------|--------------|---------------|---------------|-------|
| `Agreement Number` | ✅ Yes | ✅ | `bookings_leases` | `Agreement Number` | `selectedLease.agreementNumber` | |
| `Host Name` | ✅ Yes | ✅ | `user` | `first name` + `last name` | `selectedLease.host.fullName` | |
| `Guest Name` | ✅ Yes | ✅ | `user` | `first name` + `last name` | `selectedLease.guest.fullName` | |
| `Four Week Rent` | ✅ Yes | ❌ | `proposal` | `fourWeekRent` | **NOT AVAILABLE** | Calculated from totalRent |
| `Maintenance Fee` | ✅ Yes | ❌ | `proposal` | `maintenanceFee` | **NOT AVAILABLE** | Hardcoded as `0` |
| `Damage Deposit` | ✅ Yes | ❌ | `proposal` | `damageDeposit` | **NOT AVAILABLE** | Hardcoded as `500` |
| `Splitlease Credit` | ✅ Yes | ❌ | `proposal` OR `lease` | `splitleaseCredit` | **NOT AVAILABLE** | Hardcoded as `'0.00'` |
| `Last Payment Rent` | ✅ Yes | 🔢 | Calculated | Based on proration | — | Calculated |
| `Weeks Number` | ✅ Yes | ✅ | `bookings_leases` | `total week count` | `selectedLease.totalWeekCount` | |
| `Listing Description` | ✅ Yes | ❌ | `listing` | `Description` | **NOT FETCHED** | Using listing name instead |
| `Penultimate Week Number` | ✅ Yes | 🔢 | Calculated | `(numberOfPayments - 1) * 4` | — | Calculated |
| `Number of Payments` | ✅ Yes | 🔢 | Calculated | `Math.ceil(weeks / 4)` | — | Calculated |
| `Last Payment Weeks` | ✅ Yes | 🔢 | Calculated | `weeks % 4 || 4` | — | Calculated |
| `Is Prorated` | Optional | 🔢 | Calculated | `weeks % 4 !== 0` | — | Calculated |

### Gaps for Credit Card Auth:
1. **`Four Week Rent`** - Should come from proposal, currently calculated incorrectly
2. **`Maintenance Fee`** - Not available
3. **`Damage Deposit`** - Not available, hardcoded
4. **`Splitlease Credit`** - Not available
5. **`Listing Description`** - Not fetched

---

## Summary: Missing Data Sources

### Critical Gaps (Required Fields)

| Field | Used In | Expected Source | Current Status |
|-------|---------|-----------------|----------------|
| `Maintenance Fee` | Host Payout, Credit Card | `proposal.maintenanceFee` | ❌ Hardcoded as `0` |
| `Damage Deposit` | Periodic Tenancy, Credit Card | `proposal.damageDeposit` | ❌ Hardcoded as `500` |
| `Four Week Rent` | Credit Card | `proposal.fourWeekRent` | ❌ Calculated from totalRent (may be wrong) |
| `Splitlease Credit` | Credit Card | `proposal.splitleaseCredit` OR `bookings_leases` | ❌ Hardcoded as `0` |
| `Guests Allowed` | Supplemental, Periodic | `listing.Guests Allowed` | ❌ Hardcoded as `'1'` |
| `Listing Description` | All except Host Payout | `listing.Description` | ❌ Not in adapter |
| `Type of Space` | Supplemental, Periodic | `listing.Type of Space` | ❌ Not in adapter |
| `Space Details` | Supplemental, Periodic | `listing.Space Details` | ❌ Not in adapter |

### Optional but Recommended

| Field | Used In | Expected Source | Current Status |
|-------|---------|-----------------|----------------|
| `House Rules` | Periodic Tenancy | `listing.House Rules` | ❌ Not in adapter |
| `image1-3` | Supplemental, Periodic | `listing.image1/2/3` | ❌ Not in adapter |
| `Date1-13, Rent1-13` | Host Payout | `host_payment_records` | ⚠️ Not fetched |
| `Extra Requests on Cancellation Policy` | Periodic Tenancy | `bookings_leases.Cancellation Policy` | ⚠️ Available but may need formatting |

---

## Recommended Actions

### 1. Extend `adaptListingFromSupabase` (or fetch separately)

Add these fields to the listing adapter or create a separate fetch:

```javascript
// Fields to add to listing fetch
const listingFields = `
  _id, Name, Title, Description, Location,
  "Type of Space", "Space Details", "House Rules",
  "Guests Allowed", address, image1, image2, image3
`;
```

### 2. Fetch Proposal Data

The proposal contains critical financial fields:

```javascript
// Proposal fields needed
const proposalFields = `
  _id, fourWeekRent, maintenanceFee, damageDeposit, splitleaseCredit
`;

// Query via lease.Proposal FK
const { data: proposal } = await supabase
  .from('proposal')
  .select(proposalFields)
  .eq('_id', lease.proposalId)
  .single();
```

### 3. Fetch Host Payment Records

For the Host Payout Schedule payment dates:

```javascript
// Payment records for the lease
const { data: paymentRecords } = await supabase
  .from('host_payment_records')
  .select('"Payment Date", Amount')
  .eq('Lease', leaseId)
  .order('Payment Date', { ascending: true });
```

### 4. Update `handleGenerateAllDocs` Function

The function at `useManageLeasesPageLogic.js:476` needs to:

1. Fetch additional proposal data (or include in lease fetch)
2. Fetch additional listing fields
3. Fetch payment records for host payout
4. Remove hardcoded values and use real data

---

## Database Tables Reference

| Table | Purpose | Key Fields Needed |
|-------|---------|-------------------|
| `bookings_leases` | Core lease data | `Agreement Number`, dates, `total week count`, `Cancellation Policy` |
| `user` | Host/Guest info | `first name`, `last name`, `email`, `Phone Number` |
| `listing` | Property details | `Name`, `Description`, `Location`, `Type of Space`, `Space Details`, `House Rules`, `Guests Allowed`, `image1-3` |
| `proposal` | Financial terms | `fourWeekRent`, `maintenanceFee`, `damageDeposit`, `splitleaseCredit` |
| `host_payment_records` | Payment schedule | `Payment Date`, `Amount`, `Lease` (FK) |

---

## Files to Modify

1. **`app/src/logic/processors/leases/adaptLeaseFromSupabase.js`** - Extend listing adapter or add proposal fields
2. **`app/src/islands/pages/ManageLeasesPaymentRecordsPage/useManageLeasesPageLogic.js`** - Update `handleGenerateAllDocs` function
3. **Potentially**: Create new fetchers for proposal and payment records data

---

**Document Version**: 1.0
**Author**: Claude Code Analysis
