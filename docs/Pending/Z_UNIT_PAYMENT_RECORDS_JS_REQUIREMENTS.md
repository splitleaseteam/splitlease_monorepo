# PAYMENT RECORDS PAGE - COMPREHENSIVE REQUIREMENTS DOCUMENT
**Bubble to Code Migration Specification**
**Page: z-unit-payment-records-js**

---

## 1. PAGE OVERVIEW & PURPOSE

**PAGE NAME:** z-unit-payment-records-js

**PRIMARY FUNCTION:**
This page serves as a comprehensive payment management dashboard for lease agreements in the Split Lease application. It enables administrators to view, manage, and regenerate payment schedules for both guests (tenants) and hosts (property owners).

**KEY CAPABILITIES:**
- Select and view lease/reservation details
- Display guest payment schedules (JavaScript-calculated and Bubble native)
- Display host payout schedules (JavaScript-calculated and native)
- Manually regenerate payment records via server-side JavaScript
- View reservation calendar with booking status
- Track payment record statuses, amounts, and bank transaction details

---

## 2. DATA MODEL & RELATIONSHIPS

### PRIMARY DATA TYPES:

**1. Bookings - Leases** (Main entity)
- Agreement Number, Listing, Proposal, Reservation Dates, Payment Records lists

**2. Payment Records**
- Scheduled Date, Actual Date, Rent amount, Maintenance Fee, Damage Deposit, Total, Bank Transaction Number, Receipt Status

**3. Proposal**
- hc weeks schedule, hc reservation span (weeks), hc rights selected, rental type

---

## 7. WORKFLOWS & EVENT HANDLERS

**TOTAL WORKFLOWS: 11 workflows on this page**

### Key Workflows:
1. **"Recreate ALL Host payment records Serverscript JS"** - Deletes existing, schedules backend API workflow
2. **"Recreate ALL Guest payment records Serverscript JS"** - Similar for guest records
3. **"Choose Reservation" value changed** - Updates page data source
4. **Calendar Navigation** - Month/year navigation
5. **Payment Record Editing** - Opens editor for modifications

---

## 9. BUSINESS LOGIC & CALCULATIONS

### 9.3 DUAL CALCULATION APPROACH
The page shows BOTH JavaScript-calculated and Bubble native-calculated payment schedules for:
- Validation: Compare JS vs native calculations
- Migration: Transition from Bubble to custom code
- Debugging: Identify calculation discrepancies
- Testing: Verify accuracy before deploying changes
