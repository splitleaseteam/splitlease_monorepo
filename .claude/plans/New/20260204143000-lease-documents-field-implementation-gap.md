# Lease Documents - Field Implementation Gap Analysis

**Created**: 2026-02-04
**Purpose**: Field-by-field comparison of TestContractsPage sample payloads vs current `handleGenerateAllDocs` implementation
**Action Required**: Fix field mappings in `useManageLeasesPageLogic.js`

---

## Executive Summary

The current `handleGenerateAllDocs` function (lines 521-656 in `useManageLeasesPageLogic.js`) has **significant field gaps** compared to the sample payloads in `TestContractsPage.jsx`. Many fields are either:
- **Hardcoded** with placeholder values (e.g., `damageDeposit = 500`, `maintenanceFee = 0`)
- **Empty strings** when real data is available in the database
- **Not fetched** from related tables (proposal, paymentrecords, listing)

---

## Document 1: Host Payout Schedule (`hostPayout`)

### Fields Currently Sent vs Sample Payload

| Field | Sample Value | Current Implementation | Status | Fix Required |
|-------|-------------|----------------------|--------|--------------|
| `Agreement Number` | `"AGR-TEST-001"` | `agreementNumber` from lease | ✅ OK | None |
| `Host Name` | `"John Test Host"` | `hostName` from lease.host | ✅ OK | None |
| `Host Email` | `"testhost@example.com"` | `hostEmail` from lease.host | ✅ OK | None |
| `Host Phone` | `"555-123-4567"` | `hostPhone` from lease.host | ✅ OK | None |
| `Address` | `"123 Main St, New York, NY 10001"` | `listingAddress` from lease.listing | ✅ OK | None |
| `Payout Number` | `"PAY-TEST-001"` | `${agreementNumber}-PO` | ✅ OK | None |
| `Maintenance Fee` | `"$100"` | **HARDCODED as `"0.00"`** | ❌ WRONG | Fetch from `paymentrecords.Maintenance Fee` |
| `Date1` | `"2024-01-15"` | Only first date from `lease.startDate` | ⚠️ PARTIAL | Fetch all 13 from `paymentrecords` |
| `Date2-13` | Payment schedule dates | **NOT SENT** | ❌ MISSING | Fetch from `paymentrecords.Scheduled Date` |
| `Rent1` | `"$1000"` | Calculated as `fourWeekRent/4` | ⚠️ PARTIAL | Fetch from `paymentrecords.Rent` |
| `Rent2-13` | Monthly rent amounts | **NOT SENT** | ❌ MISSING | Fetch from `paymentrecords.Rent` |
| `Total1-13` | `"$1100"` (Rent+Maintenance) | Only `Total1` calculated | ❌ MISSING | Calculate from `Rent + Maintenance Fee` |
| `TotalHostPayments` | `"$14300"` | **NOT SENT** | ❌ MISSING | Sum all `paymentrecords.Total Paid to Host` |

### Database Source for Missing Fields

```sql
-- Fetch payment records for a lease
SELECT
  "Payment #" as payment_number,
  "Scheduled Date" as payment_date,
  "Rent" as rent_amount,
  "Maintenance Fee" as maintenance_fee,
  "Total Paid to Host" as total_to_host
FROM paymentrecords
WHERE "Booking - Reservation" = :lease_id
ORDER BY "Payment #" ASC;
```

---

## Document 2: Supplemental Agreement (`supplemental`)

### Fields Currently Sent vs Sample Payload

| Field | Sample Value | Current Implementation | Status | Fix Required |
|-------|-------------|----------------------|--------|--------------|
| `Agreement Number` | `"AGR-TEST-003"` | From lease | ✅ OK | None |
| `Check in Date` | `"01/15/24"` | Formatted from `lease.startDate` | ✅ OK | None |
| `Check Out Date` | `"04/15/24"` | Formatted from `lease.endDate` | ✅ OK | None |
| `Number of weeks` | `13` | From `lease.totalWeekCount` | ✅ OK | None |
| `Guests Allowed` | `2` | **HARDCODED as `'1'`** | ❌ WRONG | Fetch from `listing."Features - Qty Guests"` |
| `Host Name` | `"John Test Host"` | From lease.host | ✅ OK | None |
| `Supplemental Number` | `"SUP-TEST-002"` | `${agreementNumber}-SA` | ✅ OK | None |
| `Location` | `"Brooklyn, New York"` | From lease.listing.address | ✅ OK | None |
| `Type of Space` | `"Entire Apartment"` | **EMPTY STRING** | ❌ MISSING | Fetch from `listing."Features - Type of Space"` |
| `Listing Title` | `"Modern 2BR Apartment..."` | From lease.listing.name | ✅ OK | None |
| `Listing Description` | Full property description | **EMPTY STRING** | ❌ MISSING | Fetch from `listing."Description"` |
| `Space Details` | `"2 Bedrooms, 1 Bathroom"` | **EMPTY STRING** | ❌ MISSING | Build from `listing."Features - Qty Bedrooms"` + `"Features - Qty Bathrooms"` |
| `image1` | URL | Fetched from listing photos | ✅ OK | None |
| `image2` | URL | Fetched from listing photos | ✅ OK | None |
| `image3` | URL | Fetched from listing photos | ✅ OK | None |

### Database Source for Missing Fields

```sql
-- Fetch listing details for supplemental
SELECT
  "Description",
  "Features - Type of Space" as type_of_space,
  "Features - Qty Guests" as guests_allowed,
  "Features - Qty Bedrooms" as bedrooms,
  "Features - Qty Bathrooms" as bathrooms,
  "Features - House Rules" as house_rules
FROM "Listing"
WHERE "_id" = :listing_id;
```

---

## Document 3: Periodic Tenancy Agreement (`periodicTenancy`)

### Fields Currently Sent vs Sample Payload

| Field | Sample Value | Current Implementation | Status | Fix Required |
|-------|-------------|----------------------|--------|--------------|
| `Agreement Number` | `"AGR-TEST-002"` | From lease | ✅ OK | None |
| `Check in Date` | `"01/15/24"` | Formatted | ✅ OK | None |
| `Check Out Date` | `"04/15/24"` | Formatted | ✅ OK | None |
| `Check In Day` | `"Monday"` | Calculated from date | ✅ OK | None |
| `Check Out Day` | `"Monday"` | Calculated from date | ✅ OK | None |
| `Number of weeks` | `13` | From lease | ✅ OK | None |
| `Guests Allowed` | `2` | **HARDCODED as `'1'`** | ❌ WRONG | Fetch from `listing."Features - Qty Guests"` |
| `Host name` | `"John Test Host"` | From lease.host | ✅ OK | None |
| `Guest name` | `"Jane Test Guest"` | From lease.guest | ✅ OK | None |
| `Supplemental Number` | `"SUP-TEST-001"` | Calculated | ✅ OK | None |
| `Authorization Card Number` | `"AUTH-TEST-001"` | Calculated | ✅ OK | None |
| `Host Payout Schedule Number` | `"PAY-TEST-001"` | Calculated | ✅ OK | None |
| `Extra Requests on Cancellation Policy` | Custom text | **EMPTY STRING** | ⚠️ OPTIONAL | Fetch from `listing."Cancellation Policy - Additional Restrictions"` OR `bookings_leases."Cancellation Policy"` |
| `Damage Deposit` | `"$500"` | **HARDCODED as `500`** | ❌ WRONG | Fetch from `listing.damage_deposit` OR `proposal."damage deposit"` |
| `Location` | `"Manhattan, New York"` | From lease.listing | ✅ OK | None |
| `Type of Space` | `"Private Room"` | **EMPTY STRING** | ❌ MISSING | Fetch from `listing."Features - Type of Space"` |
| `House Rules` | `["No smoking", ...]` | **EMPTY ARRAY** | ❌ MISSING | Fetch from `listing."Features - House Rules"` (JSONB) |
| `Listing Title` | `"Cozy Private Room..."` | From lease.listing.name | ✅ OK | None |
| `Listing Description` | Full description | **EMPTY STRING** | ❌ MISSING | Fetch from `listing."Description"` |
| `Capacity` | `"1 Bedroom"` | **NOT SENT** | ❌ MISSING | Build from `listing."Features - Qty Bedrooms"` |
| `Amenity In Unit` | `["Wi-Fi", ...]` | **NOT SENT** | ❌ MISSING | Fetch from `listing."Features - Amenities In-Unit"` (JSONB) |
| `Amenity Building` | `["Elevator", ...]` | **NOT SENT** | ❌ MISSING | Fetch from `listing."Features - Amenities In-Building"` (JSONB) |
| `Space Details` | `"Private"` | **EMPTY STRING** | ❌ MISSING | Build from listing features |
| `image1-3` | URLs | Fetched | ✅ OK | None |

---

## Document 4: Credit Card Authorization (`creditCardAuth`)

### Fields Currently Sent vs Sample Payload

| Field | Sample Value | Current Implementation | Status | Fix Required |
|-------|-------------|----------------------|--------|--------------|
| `Agreement Number` | `"AGR-TEST-004"` | From lease | ✅ OK | None |
| `Host Name` | `"John Test Host"` | From lease.host | ✅ OK | None |
| `Guest Name` | `"Jane Test Guest"` | From lease.guest | ✅ OK | None |
| `Weeks Number` | `"16"` | From lease.totalWeekCount | ✅ OK | None |
| `Listing Description` | Full description | **USING listingTitle** | ⚠️ WRONG | Fetch from `listing."Description"` |
| `Number of Payments` | `"4"` | Calculated `Math.ceil(weeks/4)` | ✅ OK | None |
| `Four Week Rent` | `"2000.00"` | Calculated from totalRent | ⚠️ VERIFY | Should come from `proposal."4 week rent"` |
| `Damage Deposit` | `"1000.00"` | **HARDCODED as `500`** | ❌ WRONG | Fetch from `listing.damage_deposit` OR `proposal."damage deposit"` |
| `Maintenance Fee` | `"50.00"` | **HARDCODED as `0`** | ❌ WRONG | Fetch from `paymentrecords."Maintenance Fee"` OR `listing.cleaning_fee` |
| `Total First Payment` | `"3050.00"` | **NOT SENT** | ❌ MISSING | Calculate: `Four Week Rent + Damage Deposit + Maintenance Fee` |
| `Penultimate Week Number` | `"15"` | Calculated | ✅ OK | None |
| `Total Second Payment` | `"2050.00"` | **NOT SENT** | ❌ MISSING | Calculate: `Four Week Rent + Maintenance Fee` |
| `Last Payment Rent` | `"500.00"` | Calculated | ⚠️ VERIFY | Check proration logic |
| `Splitlease Credit` | `"100.00"` | **HARDCODED as `'0.00'`** | ❌ WRONG | Fetch from booking or calculate |
| `Last Payment Weeks` | `4` | Calculated | ✅ OK | None |
| `Is Prorated` | `true/false` | Calculated | ✅ OK | None |

### Database Source for Missing Fields

```sql
-- Fetch proposal financial data
SELECT
  "4 week rent" as four_week_rent,
  "damage deposit" as damage_deposit,
  "cleaning fee" as cleaning_fee,
  "Total Price for Reservation (guest)" as total_price
FROM proposal
WHERE "_id" = :proposal_id;

-- Fetch listing financial defaults
SELECT
  "damage_deposit",
  "cleaning_fee" as maintenance_fee
FROM "Listing"
WHERE "_id" = :listing_id;
```

---

## Required Changes to `useManageLeasesPageLogic.js`

### 1. Add New Data Fetching Functions

```javascript
/**
 * Fetch proposal data for financial fields
 */
async function fetchProposalData(proposalId) {
  if (!proposalId) return null;

  const { data } = await supabase
    .from('proposal')
    .select(`
      "4 week rent",
      "damage deposit",
      "cleaning fee",
      "Total Price for Reservation (guest)"
    `)
    .eq('_id', proposalId)
    .single();

  return data;
}

/**
 * Fetch listing details for document fields
 */
async function fetchListingDetails(listingId) {
  if (!listingId) return null;

  const { data } = await supabase
    .from('Listing')
    .select(`
      "Description",
      "Features - Type of Space",
      "Features - Qty Guests",
      "Features - Qty Bedrooms",
      "Features - Qty Bathrooms",
      "Features - House Rules",
      "Features - Amenities In-Unit",
      "Features - Amenities In-Building",
      "damage_deposit",
      "cleaning_fee",
      "Cancellation Policy - Additional Restrictions"
    `)
    .eq('_id', listingId)
    .single();

  return data;
}

/**
 * Fetch payment records for Date1-13/Rent1-13
 */
async function fetchPaymentRecords(leaseId) {
  if (!leaseId) return [];

  const { data } = await supabase
    .from('paymentrecords')
    .select(`
      "Payment #",
      "Scheduled Date",
      "Rent",
      "Maintenance Fee",
      "Total Paid to Host"
    `)
    .eq('Booking - Reservation', leaseId)
    .order('Payment #', { ascending: true });

  return data || [];
}
```

### 2. Update `handleGenerateAllDocs` Function

1. **Add fetches at the beginning:**
   ```javascript
   const proposalId = lease.proposal?._id || lease.proposalId;
   const proposalData = await fetchProposalData(proposalId);
   const listingDetails = await fetchListingDetails(listingId);
   const paymentRecords = await fetchPaymentRecords(lease.id);
   ```

2. **Replace hardcoded values:**
   ```javascript
   const damageDeposit = proposalData?.['damage deposit'] || listingDetails?.damage_deposit || 500;
   const maintenanceFee = paymentRecords[0]?.['Maintenance Fee'] || listingDetails?.cleaning_fee || 0;
   const fourWeekRent = proposalData?.['4 week rent'] || (lease.totalRent / totalWeeks * 4);
   const guestsAllowed = listingDetails?.['Features - Qty Guests'] || 1;
   const typeOfSpace = listingDetails?.['Features - Type of Space'] || '';
   const listingDescription = listingDetails?.['Description'] || '';
   const houseRules = listingDetails?.['Features - House Rules'] || [];
   ```

3. **Build Date1-13/Rent1-13 from payment records:**
   ```javascript
   const dateRentFields = {};
   paymentRecords.forEach((record, idx) => {
     const num = record['Payment #'] || idx + 1;
     dateRentFields[`Date${num}`] = formatDateForDoc(record['Scheduled Date']);
     dateRentFields[`Rent${num}`] = formatCurrency(record['Rent']);
     dateRentFields[`Total${num}`] = formatCurrency(
       (record['Rent'] || 0) + (record['Maintenance Fee'] || 0)
     );
   });
   ```

---

## Fields Requiring User Input / Business Decision

| Field | Question |
|-------|----------|
| `Splitlease Credit` | Where should this value come from? Is it stored in `bookings_leases` or calculated? |
| `Total First Payment` / `Total Second Payment` | Should these be calculated or fetched from payment records? |
| `Maintenance Fee` | Is this the same as `cleaning_fee`? Or separate field? |

---

## Files to Modify

1. **`app/src/islands/pages/ManageLeasesPaymentRecordsPage/useManageLeasesPageLogic.js`**
   - Add `fetchProposalData()`, `fetchListingDetails()`, `fetchPaymentRecords()` functions
   - Update `handleGenerateAllDocs()` to use real data instead of hardcoded values

2. **Potentially extend `adaptLeaseFromSupabase.js`**
   - Include proposal financial fields in lease fetch
   - Include additional listing fields

---

## Summary of Gaps

| Category | Count | Description |
|----------|-------|-------------|
| ❌ Hardcoded Wrong | 6 | Fields with placeholder values that should come from DB |
| ❌ Missing | 14 | Fields not sent at all but required |
| ⚠️ Partial/Verify | 5 | Fields with questionable calculations |
| ✅ Correct | 25 | Fields properly implemented |

**Priority**: Fix the ❌ fields first, then verify the ⚠️ fields.

---

**Document Version**: 1.0
**Author**: Claude Code Analysis
