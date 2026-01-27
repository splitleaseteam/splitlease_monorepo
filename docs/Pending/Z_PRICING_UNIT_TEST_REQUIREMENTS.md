# Z-PRICING-UNIT-TEST PAGE
## Comprehensive Requirements Document

---

## 2. PAGE OVERVIEW & PURPOSE

**PAGE NAME:** z-pricing-unit-test  
**PAGE TITLE:** Unit Schedule Selector  
**NAMING INTENTION:** The "z-" prefix typically indicates testing/utility pages that are not part of the main user flow. "pricing-unit-test" clearly indicates this is for testing pricing unit calculations.

### PRIMARY PURPOSE:
This page serves as a comprehensive testing and validation tool for the Split Lease pricing engine. It allows administrators/developers to:
1. Select any listing in the system  
2. Test different reservation patterns and durations  
3. Calculate pricing across three rental types: Monthly, Weekly, and Nightly  
4. Validate markups, discounts, and host compensation  
5. Compare workflow-generated prices against formula-based calculations  
6. Identify data inconsistencies or pricing errors

### USER INTENT & USE CASES:
- QA testing before deploying pricing changes  
- Debugging pricing calculation discrepancies  
- Validating new listings' pricing configurations  
- Testing edge cases in reservation spans  
- Ensuring consistency between different calculation methods

---

## 3. PAGE CONFIGURATION

**DIMENSIONS:**
- Width: 1500px (fixed-width)  
- Height: 4279px (very long scrollable page)  
- Preset: Custom  
- Fixed-width: Yes

**PAGE SETTINGS:**
- Native app: Yes  
- Mobile version: Not configured  
- Type of content: Default  
- Time zone: User's current timezone  
- Background: #FFFFFF (white)  
- Opacity: 100%

---

## 4. MAIN FUNCTIONAL AREAS

The page is divided into THREE PRIMARY INPUT/CONTROL SECTIONS (numbered 1, 2, 3 on the UI):

### SECTION 1: LISTING SELECTOR
- **Location:** Top-left  
- **Purpose:** Select the listing to test  
- **Elements:** Search input, Dropdown ("Choose a Listing..."), Display for unique ID

### SECTION 2: RESERVATION SPAN CONFIGURATION
- **Location:** Middle-left  
- **Purpose:** Set the reservation duration pattern  
- **Elements:** Dropdown ("Reservation span (weeks)"), Input field, Button "Set", Weekly pattern selector (S, M, T, W, T, F, S)

### SECTION 3: GUEST DESIRED PATTERN
- **Location:** Bottom-left  
- **Purpose:** Set guest preferences/requirements

### RIGHT SIDE: OUTPUT & VALIDATION PANELS

**HOST PRICES INPUT SECTION:** Host Comp Style, Weeks Offered, 2-5 night Host Rates, Weekly/Monthly Host Rate, Damage Deposit, Cleaning Deposit, Nights available

**PRICING CALCULATIONS OUTPUT:**
- **MONTHLY:** Prorated Nightly Rate, Markup and Discounts
- **WEEKLY:** Prorated Nightly Rate, Markup and Discounts  
- **NIGHTLY:** Night price multiplier, Markup and Discounts

**DATA CHECK SCORECARD:** Validation checks with YES/NO indicators for Price exists, Rental type selected, Appears in Search, Discounts are positive, Min/Max Nights validation, Nightly Pricing checks

---

## 6. WORKFLOWS (16 Total)

Key workflows include:
1. Data check - selected nightly price based on selector
2. 4 week rent calculation formula
3. B: Run Price List - Triggers backend workflow to save pricing
4. Button Run Checks - Runs validation checks
5. Button Set required pattern - Configures guest pattern
6. Markup and Discounts workflows for different rental models
7. Prorated Nightly Price calculations (monthly/weekly)

---

## 10. PRICING CALCULATION ALGORITHMS

### PRORATED NIGHTLY RATE CALCULATION:

**For MONTHLY Rentals:**
1. Base: Monthly Host Rate / Average days per month (31)
2. Apply markup: Result * (1 + Overall Site Markup + SL Unit Markup)

**For WEEKLY Rentals:**
1. Base: Weekly Host Rate / 7
2. Calculate unused nights discount
3. Apply nightly discount rate for weekly model

**MARKUPS MULTIPLIER:** Overall Site Markup (17%) + SL Unit Markup + Additional conditional markups

---

## 13. MIGRATION RECOMMENDATIONS

**MIGRATION COMPLEXITY:** Very High  
**ESTIMATED EFFORT:** 4-6 weeks for complete migration
