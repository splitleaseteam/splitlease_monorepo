# Functional Programming Audit Report

**Total Violations:** 761

## Summary by Severity

- 🔴 **High:** 532
- 🟡 **Medium:** 229
- 🟢 **Low:** 0

## Summary by Principle

- **DECLARATIVE STYLE:** 145 violations
- **EFFECTS AT EDGES:** 5 violations
- **ERRORS AS VALUES:** 216 violations
- **IMMUTABILITY:** 395 violations

---

## DECLARATIVE STYLE

**145 violations**

### 🔴 routes.config.js:924

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const route of routes) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\auth.js:571

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
while (verifyAttempts < maxVerifyAttempts) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\auth.js:794

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
while (verifyAttempts < maxVerifyAttempts) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\availabilityValidation.js:38

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\availabilityValidation.js:65

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = minNotSelected; i <= maxNotSelected; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\availabilityValidation.js:106

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\ctaConfig.js:218

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const cta of data) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\ctaConfig.js:263

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const [key, value] of Object.entries(context)) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\listingService.js:791

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const day of dayOrder) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\listingService.js:1007

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const [key, value] of Object.entries(formData)) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\listingService.js:1101

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const [day, isSelected] of Object.entries(availableNights)) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\listingService.js:1265

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const dayNum of daysArray) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\photoUpload.js:28

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let offset = 0; offset < byteCharacters.length; offset += 512) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\photoUpload.js:32

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < slice.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\photoUpload.js:164

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < photos.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\proposalService.js:37

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < sortedJsDays.length - 1; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\secureStorage.js:235

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < localStorage.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\supabaseUtils.js:145

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const photo of photos) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\supabaseUtils.js:225

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const [key, amenity] of Object.entries(amenitiesMap)) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\workflowClient.js:139

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
while (Date.now() - startTime < timeout) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 __tests__\integration\booking-flow.test.js:113

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 __tests__\integration\booking-flow.test.js:133

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 __tests__\regression\REG-001-fk-constraint-violation.test.js:31

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const [key, value] of Object.entries(formData)) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\rules\experienceSurvey\isStepComplete.js:23

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const field of stepConfig.fields) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\rules\pricingList\canCalculatePricing.js:47

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const field of rateFields) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\rules\pricingList\isPricingListValid.js:50

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const field of arrayFields) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\rules\pricingList\isPricingListValid.js:54

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const name of possibleNames) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\rules\pricingList\shouldRecalculatePricing.js:57

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const { field, index } of rateFieldMapping) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\rules\scheduling\isScheduleContiguous.js:64

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\rules\scheduling\isScheduleContiguous.js:95

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = minNotSelected; i <= maxNotSelected; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\rules\simulation\canProgressToStep.js:87

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const stepId of stepOrder) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\processors\houseManual\adaptHouseManualForViewer.js:96

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const section of sections) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\processors\houseManual\adaptHouseManualForViewer.js:102

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const [groupName, categories] of Object.entries(SECTION_CATEGORIES)) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\calculators\availability\calculateAvailableSlots.js:46

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let hour = startHour; hour < endHour; hour++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\calculators\availability\calculateAvailableSlots.js:167

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < 7; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\calculators\payments\calculateGuestPaymentSchedule.js:144

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < numberOfPaymentCycles; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\calculators\payments\calculateGuestPaymentSchedule.js:213

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < numberOfPaymentCycles; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\calculators\payments\calculateHostPaymentSchedule.js:143

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < numberOfPaymentCycles; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\calculators\payments\calculateHostPaymentSchedule.js:218

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < numberOfPaymentCycles; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\calculators\pricingList\calculateMarkupAndDiscountMultipliersArray.js:70

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let nightIndex = 0; nightIndex < PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH; nightIndex++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\calculators\pricingList\calculateNightlyPricesArray.js:61

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\calculators\pricingList\calculateSlope.js:46

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < nightlyPrices.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\calculators\pricingList\calculateUnusedNightsDiscountArray.js:49

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let nightIndex = 0; nightIndex < maxNights; nightIndex++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\calculators\scheduling\calculateCheckInOutDays.js:59

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 logic\calculators\scheduling\calculateCheckInOutFromDays.js:27

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i < sortedDays.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\auth\login.js:130

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
while (verifyAttempts < maxVerifyAttempts) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\auth\signup.js:184

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
while (verifyAttempts < maxVerifyAttempts) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\scheduleSelector\dayHelpers.js:112

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < sortedDays.length - 1; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\scheduleSelector\nightCalculations.js:14

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < sorted.length - 1; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\scheduleSelector\nightCalculations.js:50

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < dayNumbers.length - 1; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\scheduleSelector\validators.js:101

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = minNotSelected; i <= maxNotSelected; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 lib\scheduleSelector\validators.js:114

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < dayNumbers.length - 1; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\AIRoomRedesign\fileUtils.js:123

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < byteCharacters.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\DateChangeRequestManager\dateUtils.js:41

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < startingDayOfWeek; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\DateChangeRequestManager\dateUtils.js:46

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let day = 1; day <= daysInMonth; day++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\EditListingDetails\useEditListingDetailsLogic.js:517

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const [key, value] of Object.entries(formData)) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\EditListingDetails\useEditListingDetailsLogic.js:845

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < files.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\HostEditingProposal\types.js:149

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < sorted.length - 1; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\HostEditingProposal\types.js:181

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < sorted.length - 1; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\HostScheduleSelector\utils.js:29

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i < numbers.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\HostScheduleSelector\utils.js:59

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = startIdx; i <= endIdx; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\HostScheduleSelector\utils.js:64

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = startIdx; i >= endIdx; i--) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\RentalApplicationWizardModal\useRentalApplicationWizardLogic.js:257

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i < startStep; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\RentalApplicationWizardModal\useRentalApplicationWizardLogic.js:576

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let step = 1; step <= TOTAL_STEPS; step++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\ScheduleCohost\cohostService.js:40

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < totalDays; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\ScheduleCohost\cohostService.js:61

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let hour = startHour; hour < endHour; hour++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\ScheduleCohost\cohostService.js:62

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let minutes = 0; minutes < 60; minutes += intervalMinutes) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\SignUpTrialHost\validation.js:113

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const field of fields) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\VirtualMeetingManager\dateUtils.js:71

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let hour = startHour; hour < endHour; hour++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\VirtualMeetingManager\dateUtils.js:72

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let minute = 0; minute < 60; minute += interval) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\VirtualMeetingManager\dateUtils.js:95

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < startingDayOfWeek; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\VirtualMeetingManager\dateUtils.js:100

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let day = 1; day <= daysInMonth; day++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\VirtualMeetingManager\virtualMeetingService.js:312

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let attempt = 0; attempt < maxRetries; attempt++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\VisitReviewerHouseManual\visitReviewerService.js:222

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const field of ratingFields) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\guest-leases\useGuestLeasesPageLogic.js:390

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const photo of photos) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\HostExperienceReviewPage\useHostExperienceReviewPageLogic.js:161

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const field of stepConfig.fields) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\HostProposalsPage\types.js:253

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
while (current !== checkOutIndex) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\HostProposalsPage\types.js:351

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\HostProposalsPage\types.js:423

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i < sortedNights.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\HostProposalsPage\types.js:549

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const proposal of proposals) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\ListingsOverviewPage\api.js:342

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const id of listingIds) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\ModifyListingsPage\useModifyListingsPageLogic.js:404

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const [key, value] of Object.entries(listing)) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\ProposalManagePage\useProposalManagePageLogic.js:91

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < ids.length; i += batchSize) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\QuickPricePage\useQuickPricePageLogic.js:343

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const [frontendKey, dbKey] of Object.entries(fieldMap)) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\QuickPricePage\useQuickPricePageLogic.js:376

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const [frontendKey] of Object.entries(fieldMap)) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\ZUnitPaymentRecordsJsPage\useZUnitPaymentRecordsJsPageLogic.js:576

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < startDayOfWeek; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\ZUnitPaymentRecordsJsPage\useZUnitPaymentRecordsJsPageLogic.js:584

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let day = 1; day <= daysInMonth; day++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\SimulationHostsideDemoPage\constants\simulationSteps.js:92

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < currentStepNumber && i < STEP_ORDER.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\SimulationGuestsideDemoPage\constants\simulationSteps.js:144

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < currentIndex; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\ListingDashboardPage\hooks\useListingData.js:497

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const [key, value] of Object.entries(updates)) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\ListingDashboardPage\hooks\usePhotoManagement.js:44

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < newPhotos.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\ListingDashboardPage\hooks\usePhotoManagement.js:79

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < newPhotos.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\FAQPage.jsx:77

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const [tabName, dbCategory] of Object.entries(categoryMapping)) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\ListWithUsPage.jsx:26

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i < 7; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\PreviewSplitLeasePage.jsx:882

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const [key, value] of Object.entries(updates)) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\CreateProposalFlowV2.jsx:265

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < dayNumbers.length - 1; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\SearchScheduleSelector.jsx:377

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i < sortedDays.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\SearchScheduleSelector.jsx:399

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i < sortedUnselected.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\SearchScheduleSelector.jsx:500

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < dayCount; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\SearchScheduleSelector.jsx:611

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < sortedDays.length - 1; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\AiSignupMarketReport\AiSignupMarketReport.jsx:46

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const pattern of namePatterns) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\AiSignupMarketReport\AiSignupMarketReport.jsx:110

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const pattern of standardPhonePatterns) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\AiSignupMarketReport\AiSignupMarketReport.jsx:122

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const pattern of explicitPhonePatterns) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\AiSignupMarketReport\AiSignupMarketReport.jsx:1011

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const topic of FREEFORM_TOPICS) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\CreateProposalFlowV2Components\DaysSelectionSection.jsx:72

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < sorted.length - 1; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\CustomDatePicker\CustomDatePicker.jsx:149

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < firstDay; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\shared\CustomDatePicker\CustomDatePicker.jsx:154

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let day = 1; day <= daysInMonth; day++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\FavoriteListingsPage\FavoriteListingsPage.jsx:784

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < sortedJsDays.length - 1; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\proposals\CounterofferSummarySection.jsx:33

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
while ((match = bbcodeRegex.exec(text)) !== null) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\proposals\ExpandableProposalCard.jsx:168

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\proposals\ExpandableProposalCard.jsx:246

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\proposals\ProposalCard.jsx:153

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\ViewSplitLeasePage_LEGACY\ViewSplitLeasePage.jsx:1087

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < sortedJsDays.length - 1; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\ZUnitPaymentRecordsJsPage\ZUnitPaymentRecordsJsPage.jsx:258

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let y = currentYear - 5; y <= currentYear + 5; y++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\ZPricingUnitTestPage\components\Section10PricingListGrid.jsx:32

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < 7; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\ManageLeasesPaymentRecordsPage\components\CalendarSection\MonthCalendar.jsx:31

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < 42; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\ListingDashboardPage\components\AvailabilitySection.jsx:46

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
while (current <= end) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\ListingDashboardPage\components\AvailabilitySection.jsx:108

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = startPadding - 1; i >= 0; i--) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\ListingDashboardPage\components\AvailabilitySection.jsx:120

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i <= daysInMonth; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\ListingDashboardPage\components\AvailabilitySection.jsx:134

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i <= remaining; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\ListingDashboardPage\components\NightlyPricingLegend.jsx:26

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = nightsPerWeekMin; i <= nightsPerWeekMax; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\FavoriteListingsPage\components\SplitScheduleSelector.jsx:49

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
while (current < checkOut) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\CoHostRequestsPage\components\Pagination.jsx:24

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i <= totalPages; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\CoHostRequestsPage\components\Pagination.jsx:49

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = start; i <= end; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\AccountProfilePage\components\cards\ListingsCard.jsx:30

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const photo of sortedPhotos) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\SelfListingPageV2\SelfListingPageV2.tsx:527

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i < 7; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\SelfListingPageV2\SelfListingPageV2.tsx:535

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < numNights && i < prices.length; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\ViewSplitLeasePage\ViewSplitLeasePage.tsx:698

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < sortedJsDays.length - 1; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\SelfListingPage\components\NightlyPriceSlider.tsx:70

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 1; i < N; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\SelfListingPage\sections\Section5Rules.tsx:103

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
while (current <= end) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\SelfListingPage\sections\Section5Rules.tsx:141

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let i = 0; i < startingDayOfWeek; i++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🔴 islands\pages\SelfListingPage\sections\Section5Rules.tsx:146

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (let d = 1; d <= daysInMonth; d++) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🟡 routes.config.js:885

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const alias of route.aliases) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🟡 routes.config.js:908

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const route of routes) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🟡 lib\sanitize.js:252

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const [key, record] of rateLimitMap.entries()) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🟡 logic\rules\scheduling\isScheduleContiguous.js:46

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const day of selectedDayIndices) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🟡 logic\calculators\scheduling\calculateCheckInOutDays.js:42

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const day of selectedDays) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🟡 logic\calculators\scheduling\calculateNextAvailableCheckIn.js:38

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const day of selectedDayIndices) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🟡 logic\calculators\scheduling\calculateNightsFromDays.js:28

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const day of selectedDays) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🟡 islands\pages\HostOverviewPage\useHostOverviewPageLogic.js:47

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const { pattern, name } of boroughPatterns) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🟡 islands\pages\ModifyListingsPage\useModifyListingsPageLogic.js:541

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const [key, value] of Object.entries(listing)) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🟡 islands\shared\GoogleMap.jsx:861

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
logger.debug('⚠️ GoogleMap: No all listings to create grey markers for (showAllListings:', showAllListings, ', listings.length:', listings?.length, ')');
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🟡 islands\shared\AiSignupMarketReport\AiSignupMarketReport.jsx:995

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const [topic, pattern] of Object.entries(topicPatterns)) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🟡 islands\pages\proposals\ExpandableProposalCard.jsx:541

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const entry of entries) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

### 🟡 islands\pages\ModifyListingsPage\sections\PhotosSection.jsx:46

**Type:** Imperative Loop

**Description:** Imperative loop found (consider map/filter/reduce)

**Current Code:**
```javascript
for (const file of files) {
```

**Suggested Fix:**
Replace with map/filter/reduce or other declarative array methods

**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

---

## EFFECTS AT EDGES

**5 violations**

### 🔴 logic\rules\proposals\proposalRules.js:306

**Type:** Io In Core

**Description:** I/O operation found in core business logic

**Current Code:**
```javascript
console.warn('[getCancellationReasonOptions] Cache empty, using fallback values');
```

**Suggested Fix:**
Move I/O to workflow/handler layer. Pass data as parameters instead.

**Rationale:** Pure business logic (calculators/rules/processors) should not perform I/O. This makes testing harder and violates Functional Core principle.

---

### 🔴 logic\processors\listing\extractListingCoordinates.js:49

**Type:** Io In Core

**Description:** I/O operation found in core business logic

**Current Code:**
```javascript
console.error(
```

**Suggested Fix:**
Move I/O to workflow/handler layer. Pass data as parameters instead.

**Rationale:** Pure business logic (calculators/rules/processors) should not perform I/O. This makes testing harder and violates Functional Core principle.

---

### 🔴 logic\processors\listing\extractListingCoordinates.js:65

**Type:** Io In Core

**Description:** I/O operation found in core business logic

**Current Code:**
```javascript
console.error('❌ extractListingCoordinates: Failed to parse Location - Address:', {
```

**Suggested Fix:**
Move I/O to workflow/handler layer. Pass data as parameters instead.

**Rationale:** Pure business logic (calculators/rules/processors) should not perform I/O. This makes testing harder and violates Functional Core principle.

---

### 🔴 logic\processors\listing\extractListingCoordinates.js:99

**Type:** Io In Core

**Description:** I/O operation found in core business logic

**Current Code:**
```javascript
console.warn('⚠️ extractListingCoordinates: No valid coordinates found for listing:', {
```

**Suggested Fix:**
Move I/O to workflow/handler layer. Pass data as parameters instead.

**Rationale:** Pure business logic (calculators/rules/processors) should not perform I/O. This makes testing harder and violates Functional Core principle.

---

### 🔴 logic\processors\simulation\selectProposalByScheduleType.js:57

**Type:** Io In Core

**Description:** I/O operation found in core business logic

**Current Code:**
```javascript
console.warn(`[selectProposalByScheduleType] Unknown schedule type: ${scheduleType}`);
```

**Suggested Fix:**
Move I/O to workflow/handler layer. Pass data as parameters instead.

**Rationale:** Pure business logic (calculators/rules/processors) should not perform I/O. This makes testing harder and violates Functional Core principle.

---

## ERRORS AS VALUES

**216 violations**

### 🟡 lib\bubbleAPI.js:44

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Listing name is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\bubbleAPI.js:44

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Listing name is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\bubbleAPI.js:88

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Listing ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\bubbleAPI.js:88

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Listing ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\bubbleAPI.js:135

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Listing ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\bubbleAPI.js:135

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Listing ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\bubbleAPI.js:139

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('At least one photo is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\bubbleAPI.js:139

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('At least one photo is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\bubbleAPI.js:190

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Listing ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\bubbleAPI.js:190

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Listing ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\bubbleAPI.js:194

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('User email is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\bubbleAPI.js:194

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('User email is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\bubbleAPI.js:198

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Listing data is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\bubbleAPI.js:198

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Listing data is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\guestRelationshipsApi.js:30

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Authentication required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\guestRelationshipsApi.js:30

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Authentication required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\listingService.js:250

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('User ID is required to create a listing');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\listingService.js:250

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('User ID is required to create a listing');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\listingService.js:815

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Listing ID is required for update');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\listingService.js:815

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Listing ID is required for update');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\listingService.js:1028

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Listing ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\listingService.js:1028

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Listing ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\photoUpload.js:112

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error(`Invalid photo format for photo ${index + 1}`);
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\photoUpload.js:112

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error(`Invalid photo format for photo ${index + 1}`);
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\slackService.js:30

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('All fields are required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\slackService.js:30

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('All fields are required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\supabase.js:7

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\supabase.js:7

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\validators\pricingValidators.js:10

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be a non-negative number, got ${typeof value}: ${value}`);
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\validators\pricingValidators.js:10

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be a non-negative number, got ${typeof value}: ${value}`);
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\validators\pricingValidators.js:23

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be a positive integer, got ${typeof value}: ${value}`);
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\validators\pricingValidators.js:23

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be a positive integer, got ${typeof value}: ${value}`);
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\validators\pricingValidators.js:36

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be a number, got ${typeof value}`);
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\validators\pricingValidators.js:36

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be a number, got ${typeof value}`);
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\validators\pricingValidators.js:49

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be positive, got ${value}`);
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\validators\pricingValidators.js:49

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be positive, got ${value}`);
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\validators\pricingValidators.js:64

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be between ${min}-${max} nights, got ${value}`);
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\validators\pricingValidators.js:64

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be between ${min}-${max} nights, got ${value}`);
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\booking\acceptProposalWorkflow.js:34

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('acceptProposalWorkflow: supabase client is required')
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\booking\acceptProposalWorkflow.js:34

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('acceptProposalWorkflow: supabase client is required')
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\booking\acceptProposalWorkflow.js:38

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('acceptProposalWorkflow: proposal with id is required')
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\booking\acceptProposalWorkflow.js:38

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('acceptProposalWorkflow: proposal with id is required')
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\booking\acceptProposalWorkflow.js:42

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('acceptProposalWorkflow: canAcceptProposal rule function is required')
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\booking\acceptProposalWorkflow.js:42

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('acceptProposalWorkflow: canAcceptProposal rule function is required')
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\booking\loadProposalDetailsWorkflow.js:49

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('loadProposalDetailsWorkflow: rawProposal is required')
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\booking\loadProposalDetailsWorkflow.js:49

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('loadProposalDetailsWorkflow: rawProposal is required')
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\booking\loadProposalDetailsWorkflow.js:53

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('loadProposalDetailsWorkflow: supabase client is required')
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\booking\loadProposalDetailsWorkflow.js:53

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('loadProposalDetailsWorkflow: supabase client is required')
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\pricingList\initializePricingListWorkflow.js:36

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('initializePricingListWorkflow: listingId is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\pricingList\initializePricingListWorkflow.js:36

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('initializePricingListWorkflow: listingId is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\pricingList\recalculatePricingListWorkflow.js:45

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('recalculatePricingListWorkflow: listing is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\pricingList\recalculatePricingListWorkflow.js:45

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('recalculatePricingListWorkflow: listing is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\pricingList\recalculatePricingListWorkflow.js:49

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('recalculatePricingListWorkflow: listingId is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\pricingList\recalculatePricingListWorkflow.js:49

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('recalculatePricingListWorkflow: listingId is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\cancelProposalWorkflow.js:97

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Proposal ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\cancelProposalWorkflow.js:97

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Proposal ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\cancelProposalWorkflow.js:154

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Proposal ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\cancelProposalWorkflow.js:154

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Proposal ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\counterofferWorkflow.js:31

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Proposal ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\counterofferWorkflow.js:31

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Proposal ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\counterofferWorkflow.js:112

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Proposal ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\counterofferWorkflow.js:112

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Proposal ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\counterofferWorkflow.js:149

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Proposal is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\counterofferWorkflow.js:149

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Proposal is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\virtualMeetingWorkflow.js:26

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Proposal ID and Guest ID are required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\virtualMeetingWorkflow.js:26

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Proposal ID and Guest ID are required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\virtualMeetingWorkflow.js:81

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Existing VM ID, Proposal ID, and Guest ID are required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\virtualMeetingWorkflow.js:81

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Existing VM ID, Proposal ID, and Guest ID are required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\virtualMeetingWorkflow.js:109

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Virtual meeting ID and booked date are required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\virtualMeetingWorkflow.js:109

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Virtual meeting ID and booked date are required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\virtualMeetingWorkflow.js:142

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Virtual meeting ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\virtualMeetingWorkflow.js:142

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Virtual meeting ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\virtualMeetingWorkflow.js:175

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Virtual meeting ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\proposals\virtualMeetingWorkflow.js:175

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Virtual meeting ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\reviews\submitReviewWorkflow.js:53

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Stay ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\reviews\submitReviewWorkflow.js:53

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Stay ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\reviews\submitReviewWorkflow.js:57

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Review type is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\workflows\reviews\submitReviewWorkflow.js:57

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Review type is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\rules\houseManual\isManualExpired.js:72

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Invalid creation date');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\rules\houseManual\isManualExpired.js:72

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Invalid creation date');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\rules\pricingList\canCalculatePricing.js:34

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('canCalculatePricing: listing is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\rules\pricingList\canCalculatePricing.js:34

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('canCalculatePricing: listing is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\rules\pricingList\shouldRecalculatePricing.js:31

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('shouldRecalculatePricing: listing is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\rules\pricingList\shouldRecalculatePricing.js:31

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('shouldRecalculatePricing: listing is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\rules\proposals\determineProposalStage.js:29

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('determineProposalStage: proposalStatus is required and must be a string')
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\rules\proposals\determineProposalStage.js:29

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('determineProposalStage: proposalStatus is required and must be a string')
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\rules\search\hasListingPhotos.js:23

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('hasListingPhotos: listing cannot be null or undefined')
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\rules\search\hasListingPhotos.js:23

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('hasListingPhotos: listing cannot be null or undefined')
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\rules\users\shouldShowFullName.js:24

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('shouldShowFullName requires a valid firstName');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\rules\users\shouldShowFullName.js:24

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('shouldShowFullName requires a valid firstName');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\rules\users\shouldShowFullName.js:29

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('shouldShowFullName requires isMobile to be a boolean');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\rules\users\shouldShowFullName.js:29

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('shouldShowFullName requires isMobile to be a boolean');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\display\formatHostName.js:33

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('formatHostName: fullName cannot be empty or whitespace')
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\display\formatHostName.js:33

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('formatHostName: fullName cannot be empty or whitespace')
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\matching\adaptCandidateListing.js:37

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('adaptCandidateListing: rawListing is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\matching\adaptCandidateListing.js:37

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('adaptCandidateListing: rawListing is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\matching\adaptProposalForMatching.js:31

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('adaptProposalForMatching: rawProposal is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\matching\adaptProposalForMatching.js:31

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('adaptProposalForMatching: rawProposal is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\matching\formatMatchResult.js:65

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('formatMatchResult: listing is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\matching\formatMatchResult.js:65

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('formatMatchResult: listing is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\matching\formatMatchResult.js:69

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('formatMatchResult: scores is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\matching\formatMatchResult.js:69

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('formatMatchResult: scores is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\pricingList\adaptPricingListForSupabase.js:35

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('adaptPricingListForSupabase: pricingList is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\pricingList\adaptPricingListForSupabase.js:35

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('adaptPricingListForSupabase: pricingList is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\pricingList\adaptPricingListFromSupabase.js:37

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('adaptPricingListFromSupabase: rawPricingList is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\pricingList\adaptPricingListFromSupabase.js:37

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('adaptPricingListFromSupabase: rawPricingList is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\pricingList\extractHostRatesFromListing.js:38

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('extractHostRatesFromListing: listing is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\pricingList\extractHostRatesFromListing.js:38

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('extractHostRatesFromListing: listing is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\pricingList\formatPricingListForDisplay.js:35

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('formatPricingListForDisplay: pricingList is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\pricingList\formatPricingListForDisplay.js:35

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('formatPricingListForDisplay: pricingList is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\proposal\processProposalData.js:39

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processProposalData: rawProposal cannot be null or undefined')
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\proposal\processProposalData.js:39

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processProposalData: rawProposal cannot be null or undefined')
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\proposals\processProposalData.js:26

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processListingData: Listing data is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\proposals\processProposalData.js:26

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processListingData: Listing data is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\proposals\processProposalData.js:62

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processHostData: Host data is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\proposals\processProposalData.js:62

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processHostData: Host data is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\proposals\processProposalData.js:88

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processVirtualMeetingData: Virtual meeting data is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\proposals\processProposalData.js:88

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processVirtualMeetingData: Virtual meeting data is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\proposals\processProposalData.js:115

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processProposalData: Proposal data is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\proposals\processProposalData.js:115

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processProposalData: Proposal data is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\proposals\processProposalData.js:119

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processProposalData: Proposal ID (_id) is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\proposals\processProposalData.js:119

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processProposalData: Proposal ID (_id) is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\proposals\processProposalData.js:258

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('getEffectiveTerms: Proposal is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\proposals\processProposalData.js:258

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('getEffectiveTerms: Proposal is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\reviews\reviewAdapter.js:45

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('adaptReviewForSubmission: missing required IDs');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\reviews\reviewAdapter.js:45

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('adaptReviewForSubmission: missing required IDs');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\user\processUserData.js:25

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processUserData: User data is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\user\processUserData.js:25

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processUserData: User data is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\user\processUserData.js:29

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processUserData: User ID (_id) is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\user\processUserData.js:29

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processUserData: User ID (_id) is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\user\processUserDisplayName.js:27

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processUserDisplayName requires a valid firstName. Cannot display user without name.');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\user\processUserDisplayName.js:27

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processUserDisplayName requires a valid firstName. Cannot display user without name.');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\user\processUserInitials.js:25

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processUserInitials requires a valid firstName. Cannot generate initials without user name.');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\processors\user\processUserInitials.js:25

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('processUserInitials requires a valid firstName. Cannot generate initials without user name.');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateGuestPaymentSchedule.js:50

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('moveInDate is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateGuestPaymentSchedule.js:50

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('moveInDate is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateGuestPaymentSchedule.js:75

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error(`Invalid date format: ${dateStr}`);
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateGuestPaymentSchedule.js:75

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error(`Invalid date format: ${dateStr}`);
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateGuestPaymentSchedule.js:100

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('reservationSpanMonths is required for Monthly rental type');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateGuestPaymentSchedule.js:100

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('reservationSpanMonths is required for Monthly rental type');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateGuestPaymentSchedule.js:109

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('reservationSpanWeeks is required for Nightly and Weekly rental types');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateGuestPaymentSchedule.js:109

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('reservationSpanWeeks is required for Nightly and Weekly rental types');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateGuestPaymentSchedule.js:289

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error("rentalType is required and must be one of: 'Nightly', 'Weekly', 'Monthly'");
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateGuestPaymentSchedule.js:289

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error("rentalType is required and must be one of: 'Nightly', 'Weekly', 'Monthly'");
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateGuestPaymentSchedule.js:301

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('fourWeekRent is required for Nightly and Weekly rental types and must be a positive number');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateGuestPaymentSchedule.js:301

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('fourWeekRent is required for Nightly and Weekly rental types and must be a positive number');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateGuestPaymentSchedule.js:305

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('rentPerMonth is required for Monthly rental type and must be a positive number');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateGuestPaymentSchedule.js:305

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('rentPerMonth is required for Monthly rental type and must be a positive number');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateGuestPaymentSchedule.js:310

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('maintenanceFee must be a number');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateGuestPaymentSchedule.js:310

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('maintenanceFee must be a number');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateHostPaymentSchedule.js:49

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('moveInDate is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateHostPaymentSchedule.js:49

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('moveInDate is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateHostPaymentSchedule.js:74

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error(`Invalid date format: ${dateStr}`);
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateHostPaymentSchedule.js:74

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error(`Invalid date format: ${dateStr}`);
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateHostPaymentSchedule.js:99

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('reservationSpanMonths is required for Monthly rental type');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateHostPaymentSchedule.js:99

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('reservationSpanMonths is required for Monthly rental type');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateHostPaymentSchedule.js:108

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('reservationSpanWeeks is required for Nightly and Weekly rental types');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateHostPaymentSchedule.js:108

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('reservationSpanWeeks is required for Nightly and Weekly rental types');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateHostPaymentSchedule.js:286

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error("rentalType is required and must be one of: 'Nightly', 'Weekly', 'Monthly'");
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateHostPaymentSchedule.js:286

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error("rentalType is required and must be one of: 'Nightly', 'Weekly', 'Monthly'");
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateHostPaymentSchedule.js:298

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('fourWeekRent is required for Nightly and Weekly rental types and must be a positive number');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateHostPaymentSchedule.js:298

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('fourWeekRent is required for Nightly and Weekly rental types and must be a positive number');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateHostPaymentSchedule.js:302

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('rentPerMonth is required for Monthly rental type and must be a positive number');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateHostPaymentSchedule.js:302

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('rentPerMonth is required for Monthly rental type and must be a positive number');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateHostPaymentSchedule.js:307

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('maintenanceFee must be a number');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\payments\calculateHostPaymentSchedule.js:307

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('maintenanceFee must be a number');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\pricingList\calculateProratedNightlyRate.js:37

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('calculateProratedNightlyRate: weeklyHostRate required for Weekly rental');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\pricingList\calculateProratedNightlyRate.js:37

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('calculateProratedNightlyRate: weeklyHostRate required for Weekly rental');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\pricingList\calculateProratedNightlyRate.js:44

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('calculateProratedNightlyRate: monthlyHostRate required for Monthly rental');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\pricingList\calculateProratedNightlyRate.js:44

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('calculateProratedNightlyRate: monthlyHostRate required for Monthly rental');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\pricingList\calculateProratedNightlyRate.js:47

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('calculateProratedNightlyRate: avgDaysPerMonth must be positive');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\pricingList\calculateProratedNightlyRate.js:47

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('calculateProratedNightlyRate: avgDaysPerMonth must be positive');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\pricingList\calculateProratedNightlyRate.js:56

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('calculateProratedNightlyRate: nightlyRates must be array with at least 4 elements');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\pricingList\calculateProratedNightlyRate.js:56

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('calculateProratedNightlyRate: nightlyRates must be array with at least 4 elements');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\reminders\calculateNextSendTime.js:21

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('calculateNextSendTime: scheduledDateTime is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\reminders\calculateNextSendTime.js:21

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('calculateNextSendTime: scheduledDateTime is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\reminders\calculateNextSendTime.js:29

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('calculateNextSendTime: invalid scheduledDateTime format');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\reminders\calculateNextSendTime.js:29

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('calculateNextSendTime: invalid scheduledDateTime format');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\scheduling\calculateCheckInOutFromDays.js:16

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('calculateCheckInOutFromDays: selectedDays must contain at least 2 days');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 logic\calculators\scheduling\calculateCheckInOutFromDays.js:16

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('calculateCheckInOutFromDays: selectedDays must contain at least 2 days');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\api\guestLeases.js:30

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Authentication required. Please log in.');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 lib\api\guestLeases.js:30

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Authentication required. Please log in.');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\pages\useRentalApplicationPageLogic.js:885

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('You must be logged in to submit a rental application.');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\pages\useRentalApplicationPageLogic.js:885

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('You must be logged in to submit a rental application.');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\QRCodeDashboard\qrCodeDashboardService.js:102

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('House manual ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\QRCodeDashboard\qrCodeDashboardService.js:102

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('House manual ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\QRCodeDashboard\qrCodeDashboardService.js:139

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('House manual ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\QRCodeDashboard\qrCodeDashboardService.js:139

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('House manual ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\QRCodeDashboard\qrCodeDashboardService.js:176

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('QR code data and house manual ID are required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\QRCodeDashboard\qrCodeDashboardService.js:176

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('QR code data and house manual ID are required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\QRCodeDashboard\qrCodeDashboardService.js:216

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('QR code ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\QRCodeDashboard\qrCodeDashboardService.js:216

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('QR code ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\QRCodeDashboard\qrCodeDashboardService.js:264

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('QR code ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\QRCodeDashboard\qrCodeDashboardService.js:264

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('QR code ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\QRCodeDashboard\qrCodeDashboardService.js:297

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('At least one QR code ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\QRCodeDashboard\qrCodeDashboardService.js:297

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('At least one QR code ID is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\RentalApplicationWizardModal\useRentalApplicationWizardLogic.js:863

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('You must be logged in to submit.');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\RentalApplicationWizardModal\useRentalApplicationWizardLogic.js:863

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('You must be logged in to submit.');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\UsabilityPopup\useUsabilityPopupLogic.js:146

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Invalid phone number format');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\UsabilityPopup\useUsabilityPopupLogic.js:146

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Invalid phone number format');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\VisitReviewerHouseManual\visitReviewerService.js:100

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error(responseData?.error || 'Invalid access token');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\VisitReviewerHouseManual\visitReviewerService.js:100

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error(responseData?.error || 'Invalid access token');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\pages\CreateSuggestedProposalPage\suggestedProposalService.js:407

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('AI returned invalid JSON response');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\pages\CreateSuggestedProposalPage\suggestedProposalService.js:407

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('AI returned invalid JSON response');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\pages\HostLeasesPage\useHostLeasesPageLogic.js:421

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Authentication required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\pages\HostLeasesPage\useHostLeasesPageLogic.js:421

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Authentication required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\pages\SearchPage.jsx:704

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Authentication required. Please log in again.');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\pages\SearchPage.jsx:704

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Authentication required. Please log in again.');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\AiSignupMarketReport\AiSignupMarketReport.jsx:576

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Email is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\AiSignupMarketReport\AiSignupMarketReport.jsx:576

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Email is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\AiSignupMarketReport\AiSignupMarketReport.jsx:581

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Market research description is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\shared\AiSignupMarketReport\AiSignupMarketReport.jsx:581

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Market research description is required');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\pages\ListingDashboardPage\context\ListingDashboardContext.jsx:18

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('useListingDashboard must be used within ListingDashboardProvider');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\pages\ListingDashboardPage\context\ListingDashboardContext.jsx:18

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('useListingDashboard must be used within ListingDashboardProvider');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\pages\ViewSplitLeasePage\useViewSplitLeaseLogic.ts:462

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Authentication required. Please log in again.');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

### 🟡 islands\pages\ViewSplitLeasePage\useViewSplitLeaseLogic.ts:462

**Type:** Exception For Flow

**Description:** Exception used for validation/expected errors

**Current Code:**
```javascript
throw new Error('Authentication required. Please log in again.');
```

**Suggested Fix:**
Return Result<T, E> type: return err('validation message') instead of throw

**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

---

## IMMUTABILITY

**395 violations**

### 🔴 routes.config.js:847

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
excludedFromFunctions.push('/guest-proposals', '/guest-proposals/*');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 data\helpCenterData.js:280

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
results.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 hooks\useDeviceDetection.test.js:35

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
resizeListeners.push(handler);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\aiService.js:106

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
return [...amenities].sort((a, b) => {
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 lib\availabilityValidation.js:31

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sorted = [...selectedDays].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 lib\availabilityValidation.js:66

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
expectedNotSelected.push(i);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\availabilityValidation.js:97

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sorted = [...selectedDays].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 lib\availabilityValidation.js:166

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
result.errors.push('Please select at least one day');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\availabilityValidation.js:175

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
result.errors.push('Please check for contiguous nights to continue with your proposal');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\availabilityValidation.js:181

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
result.warnings.push(`Host prefers at least ${listing['Minimum Nights']} nights per week`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\availabilityValidation.js:186

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
result.warnings.push(`Host prefers at most ${listing['Maximum Nights']} nights per week`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\availabilityValidation.js:199

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
result.errors.push('Some selected days are not available for this listing');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\availabilityValidation.js:271

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
result.errors.push('Please select a move-in date');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\availabilityValidation.js:280

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
result.errors.push('Move-in date cannot be in the past');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\availabilityValidation.js:287

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
result.errors.push('Move-in date is outside available range');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\availabilityValidation.js:294

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
result.errors.push('Selected move-in date is not available');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\availabilityValidation.js:305

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
result.errors.push(`Move-in date must be on a ${DAY_NAMES[checkInDay]} based on your selected schedule`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\dataLookups.js:563

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
policies.push({ id, display: policy.display });
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\dataLookups.js:575

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
options.push({ id, label: parking.label });
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\dataLookups.js:605

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
reasons.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\dataLookups.js:611

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
return reasons.sort((a, b) => a.displayOrder - b.displayOrder);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 lib\dataLookups.js:622

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
reasons.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\dataLookups.js:628

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
return reasons.sort((a, b) => a.displayOrder - b.displayOrder);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 lib\emergencyService.js:162

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
const fileExt = file.name.split('.').pop();
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\hotjar.js:18

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\listingDataFetcher.js:200

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
sortedPhotos = sortedPhotos.sort((a, b) => {
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 lib\listingService.js:339

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
currentListings.push(listingId);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\listingService.js:793

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
result.push(dayNameMapping[day]);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\listingService.js:1103

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
result.push(dayMapping[day]);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\listingService.js:1107

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
return result.sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 lib\photoUpload.js:36

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
byteArrays.push(new Uint8Array(byteNumbers));
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\photoUpload.js:86

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
extension = photo.file.name.split('.').pop().toLowerCase() || 'jpg';
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\photoUpload.js:170

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
uploadedPhotos.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\photoUpload.js:184

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
uploadedPhotos.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\proposalService.js:25

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sortedJsDays = [...daysInJsFormat].sort((a, b) => a - b)
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 lib\secureStorage.js:238

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
keysToRemove.push(key);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\supabaseUtils.js:156

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
photoUrls.push(photoUrl);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\supabaseUtils.js:170

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
photoUrls.push(photoUrl);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\supabaseUtils.js:177

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
photoUrls.push(url);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\supabaseUtils.js:227

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
amenities.push(amenity);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\supabaseUtils.js:236

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
amenities.push(amenitiesMap['kitchen']);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\supabaseUtils.js:241

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
amenities.sort((a, b) => a.priority - b.priority);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 __tests__\integration\booking-flow.test.js:109

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sorted = [...selectedDays].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 __tests__\integration\booking-flow.test.js:252

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (!proposal.listingId) errors.push('Listing ID is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 __tests__\integration\booking-flow.test.js:253

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (!proposal.userId) errors.push('User ID is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 __tests__\integration\booking-flow.test.js:255

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('At least one day must be selected');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 __tests__\integration\booking-flow.test.js:257

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (!proposal.moveInDate) errors.push('Move-in date is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 __tests__\integration\booking-flow.test.js:259

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Valid price is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\workflows\proposals\counterofferWorkflow.js:180

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\workflows\proposals\counterofferWorkflow.js:189

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\workflows\proposals\counterofferWorkflow.js:198

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\workflows\proposals\counterofferWorkflow.js:207

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\workflows\proposals\counterofferWorkflow.js:216

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\workflows\reviews\submitReviewWorkflow.js:108

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Please rate at least one category');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\workflows\reviews\submitReviewWorkflow.js:115

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('All ratings must be between 1 and 5 stars');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\workflows\reviews\submitReviewWorkflow.js:121

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Please provide at least one rating');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\workflows\users\identityVerificationWorkflow.js:82

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
const extension = file.name.split('.').pop() || 'jpg';
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\rules\scheduling\isScheduleContiguous.js:55

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sorted = [...selectedDayIndices].sort((a, b) => a - b)
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 logic\rules\scheduling\isScheduleContiguous.js:96

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
expectedNotSelected.push(i)
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\processors\houseManual\adaptHouseManualForViewer.js:49

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
sections.sort((a, b) => a.order - b.order);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 logic\processors\houseManual\adaptHouseManualForViewer.js:109

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
grouped[assignedGroup].push(section);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\processors\leases\sortLeases.js:15

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
sortedLeases.sort((a, b) => {
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 logic\processors\meetings\filterMeetings.js:100

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
return Array.from(hostMap.values()).sort((a, b) =>
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 logic\processors\meetings\filterMeetings.js:129

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
return Array.from(guestMap.values()).sort((a, b) =>
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 logic\processors\meetings\filterMeetings.js:294

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
return [...meetings].sort((a, b) => {
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 logic\processors\meetings\filterMeetings.js:339

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
groups[status].push(meeting);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\processors\simulation\selectProposalByScheduleType.js:107

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
return [...proposals].sort((a, b) => {
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 logic\calculators\availability\calculateAvailableSlots.js:47

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
slots.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\calculators\availability\calculateAvailableSlots.js:172

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
days.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\calculators\payments\calculateGuestPaymentSchedule.js:145

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
paymentDates.push(formatDate(currentDate));
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\calculators\payments\calculateGuestPaymentSchedule.js:229

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
rentList.push(cycleRent);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\calculators\payments\calculateHostPaymentSchedule.js:144

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
paymentDates.push(formatDate(currentDate));
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\calculators\payments\calculateHostPaymentSchedule.js:236

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
rentList.push(cycleRent);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\calculators\pricingList\calculateMarkupAndDiscountMultipliersArray.js:80

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
multipliersArray.push(roundToFourDecimals(multiplier));
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\calculators\pricingList\calculateNightlyPricesArray.js:67

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
pricesArray.push(null);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\calculators\pricingList\calculateNightlyPricesArray.js:73

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
pricesArray.push(null);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\calculators\pricingList\calculateNightlyPricesArray.js:79

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
pricesArray.push(roundToTwoDecimals(nightlyPrice));
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\calculators\pricingList\calculateUnusedNightsDiscountArray.js:58

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
discountArray.push(roundToFourDecimals(discount));
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 logic\calculators\scheduling\calculateCheckInOutDays.js:50

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sorted = [...selectedDays].sort((a, b) => a - b)
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 logic\calculators\scheduling\calculateCheckInOutFromDays.js:19

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sortedDays = [...selectedDays].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 logic\calculators\scheduling\calculateNextAvailableCheckIn.js:56

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sortedDays = [...selectedDayIndices].sort((a, b) => a - b)
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 logic\calculators\scheduling\isContiguousSelection.js:13

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sorted = [...selectedDays].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 lib\api\identityVerificationService.js:90

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
const extension = file.name.split('.').pop() || 'jpg';
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\proposals\userProposalQueries.js:228

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
listingsNeedingPhotoFetch.push(listing._id);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\proposals\userProposalQueries.js:490

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
summaryMap.get(proposalId).push(summary);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\scheduleSelector\dayHelpers.js:44

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
return [...days].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 lib\scheduleSelector\dayHelpers.js:113

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
nights.push(createNight(sortedDays[i].dayOfWeek));
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\scheduleSelector\nightCalculations.js:15

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
nights.push(createNight(sorted[i].dayOfWeek));
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 lib\scheduleSelector\validators.js:102

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
expectedNotSelected.push(i);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\useEmailSmsUnitPageLogic.js:229

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
emails.push('');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\useSearchPageLogic.js:178

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (neighborhoodName) locationParts.push(neighborhoodName)
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\useSearchPageLogic.js:179

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (boroughName) locationParts.push(boroughName)
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\DateChangeRequestManager\dateUtils.js:42

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
days.push(null);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\DateChangeRequestManager\dateUtils.js:47

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\EditListingDetails\useEditListingDetailsLogic.js:249

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (city) parts.push(city);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\EditListingDetails\useEditListingDetailsLogic.js:250

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (state) parts.push(state);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\EditListingDetails\useEditListingDetailsLogic.js:251

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (zip) parts.push(zip);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\EditListingDetails\useEditListingDetailsLogic.js:849

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
uploadedUrls.push(result.url);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\HostEditingProposal\types.js:141

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sorted = [...selectedNights].sort((a, b) => a - b)
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\shared\HostEditingProposal\types.js:173

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sorted = [...selectedNights].sort((a, b) => a - b)
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\shared\HostEditingProposal\types.js:240

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
checkInDays.push(checkOutDay)
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\HostScheduleSelector\utils.js:25

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
.sort((a, b) => a - b)
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\shared\HostScheduleSelector\utils.js:31

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
gaps.push(i)
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\HostScheduleSelector\utils.js:60

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
sequence.push(getNightByDayIndex(i).id)
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\HostScheduleSelector\utils.js:65

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
sequence.push(getNightByDayIndex(i).id)
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\HostScheduleSelector\utils.js:133

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
return [...nights].sort((a, b) => {
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\shared\NotificationSettingsIsland\notificationCategories.js:122

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
arr.push(channel);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\RentalApplicationWizardModal\useRentalApplicationWizardLogic.js:258

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
stepsToVisit.push(i);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\RentalApplicationWizardModal\useRentalApplicationWizardLogic.js:578

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
newCompleted.push(step);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\ScheduleCohost\cohostService.js:43

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
days.push(date);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\ScheduleCohost\cohostService.js:66

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
slots.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\SuggestedProposals\suggestedProposalService.js:92

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
summaryMap[proposalId].push(summary);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\SuggestedProposals\suggestedProposalService.js:318

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
summaryMap[proposalId].push(summary);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\VirtualMeetingManager\dateUtils.js:75

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
slots.push(slotTime);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\VirtualMeetingManager\dateUtils.js:96

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
days.push(null);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\VirtualMeetingManager\dateUtils.js:101

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\AccountProfilePage\useAccountProfilePageLogic.js:132

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
actions.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\AccountProfilePage\useAccountProfilePageLogic.js:142

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
actions.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\AccountProfilePage\useAccountProfilePageLogic.js:153

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
actions.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\AccountProfilePage\useAccountProfilePageLogic.js:161

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
actions.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\AccountProfilePage\useAccountProfilePageLogic.js:169

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
actions.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\AccountProfilePage\useAccountProfilePageLogic.js:177

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
actions.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\AccountProfilePage\useAccountProfilePageLogic.js:185

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
actions.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\AccountProfilePage\useAccountProfilePageLogic.js:193

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
actions.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\AccountProfilePage\useAccountProfilePageLogic.js:924

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
: [...currentDays, dayIndex].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\AccountProfilePage\useAccountProfilePageLogic.js:1530

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\AdminThreadsPage\useAdminThreadsPageLogic.js:259

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
return result.sort((a, b) => {
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\CreateDocumentPage\useCreateDocumentPageLogic.js:99

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
window.$crisp.push(["do", "chat:hide"]);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\CreateSuggestedProposalPage\useCreateSuggestedProposalLogic.js:250

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Please select a listing');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\CreateSuggestedProposalPage\useCreateSuggestedProposalLogic.js:254

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Please select and confirm a guest');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\CreateSuggestedProposalPage\useCreateSuggestedProposalLogic.js:259

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Fill out reservation span OR move-in date to proceed');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\CreateSuggestedProposalPage\useCreateSuggestedProposalLogic.js:263

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Please select at least 3 days');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\CreateSuggestedProposalPage\useCreateSuggestedProposalLogic.js:269

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Number of weeks must be between 6 and 52');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\CreateSuggestedProposalPage\useCreateSuggestedProposalLogic.js:274

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Price calculation is invalid');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\CreateSuggestedProposalPage\useCreateSuggestedProposalLogic.js:613

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
return [...prev, dayIndex].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\FavoriteListingsPage\formatters.js:66

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
parts.push('1 bedroom');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\FavoriteListingsPage\formatters.js:70

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
parts.push(`${bedrooms} bedrooms`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\FavoriteListingsPage\formatters.js:76

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
parts.push(bathroomDisplay);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\FavoriteListingsPage\formatters.js:81

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
parts.push(kitchenType);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\FavoriteListingsPage\formatters.js:115

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (borough) parts.push(borough);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\FavoriteListingsPage\formatters.js:116

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (hood) parts.push(hood);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\FavoriteListingsPage\formatters.js:117

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (city) parts.push(city);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\guest-leases\useGuestLeasesPageLogic.js:404

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
photoUrls.push(urlData.publicUrl);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\HostOverviewPage\useHostOverviewPageLogic.js:155

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
fetchPromises.push(
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\HostOverviewPage\useHostOverviewPageLogic.js:184

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
fetchPromises.push(
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\HostOverviewPage\useHostOverviewPageLogic.js:201

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
fetchPromises.push(
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\HostProposalsPage\formatters.js:105

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sorted = [...nights].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\HostProposalsPage\formatters.js:192

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
credentialParts.push('ID and work verified');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\HostProposalsPage\formatters.js:194

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
credentialParts.push('ID verified');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\HostProposalsPage\formatters.js:196

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
credentialParts.push('work verified');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\HostProposalsPage\formatters.js:199

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
credentialParts.push(`with ${reviewCount} positive review${reviewCount > 1 ? 's' : ''}`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\HostProposalsPage\types.js:254

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
activeDays.push(dayNames[current]);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\HostProposalsPage\types.js:342

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sorted = [...dayIndices].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\HostProposalsPage\types.js:411

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
.sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\HostProposalsPage\types.js:554

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
result.actionNeeded.push(proposal);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\HostProposalsPage\types.js:560

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
result.actionNeeded.push(proposal);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\HostProposalsPage\types.js:562

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
result.inProgress.push(proposal);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\HostProposalsPage\types.js:564

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
result.closed.push(proposal);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\HostProposalsPage\types.js:567

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
result.inProgress.push(proposal);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\HostProposalsPage\useHostProposalsPageLogic.js:387

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sortedListings = [...listingsResult].sort((a, b) => {
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\HostProposalsPage\useHostProposalsPageLogic.js:645

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
summaryMap[proposalId].push(summary);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingsOverviewPage\api.js:351

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
results.push({ id, success: false, error: fetchError.message });
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingsOverviewPage\api.js:373

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
results.push({ id, success: false, error: updateError.message });
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingsOverviewPage\api.js:375

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
results.push({ id, success: true, newNightly, new3Night });
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\MessagingPage\useCTAHandler.js:65

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
window.$crisp.push(['do', 'chat:open']);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ProposalManagePage\useProposalManagePageLogic.js:92

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
batches.push(ids.slice(i, i + batchSize));
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\proposals\displayUtils.js:308

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sorted = [...parsed].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\proposals\useGuestProposalsPageLogic.js:401

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
suggested.push(proposal);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\proposals\useGuestProposalsPageLogic.js:403

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
userCreated.push(proposal);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\proposals\useGuestProposalsPageLogic.js:424

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
suggested: suggested.sort(sortProposals),
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\proposals\useGuestProposalsPageLogic.js:425

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
userCreated: userCreated.sort(sortProposals)
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\UsabilityDataManagementPage\useUsabilityDataManagementPageLogic.js:215

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
window.$crisp.push(["do", "chat:hide"]);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\UsabilityDataManagementPage\useUsabilityDataManagementPageLogic.js:292

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
return [...prev, dayIndex].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\ZEmailsUnitPage\useZEmailsUnitPageLogic.js:116

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
emails.push('');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ZUnitPaymentRecordsJsPage\useZUnitPaymentRecordsJsPageLogic.js:226

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
guestNative.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ZUnitPaymentRecordsJsPage\useZUnitPaymentRecordsJsPageLogic.js:265

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
hostNative.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ZUnitPaymentRecordsJsPage\useZUnitPaymentRecordsJsPageLogic.js:577

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
days.push({ day: null, isBooked: false, isPaymentDay: false });
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ZUnitPaymentRecordsJsPage\useZUnitPaymentRecordsJsPageLogic.js:592

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
days.push({ day, date, isBooked, isPaymentDay: false });
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SimulationHostsideDemoPage\constants\simulationSteps.js:93

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
completed.push(STEP_ORDER[i]);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SimulationGuestsideDemoPage\constants\simulationSteps.js:147

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
completed.push(`C${selectedPath}`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SimulationGuestsideDemoPage\constants\simulationSteps.js:149

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
completed.push(step);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SimulationGuestsideDemoPage\constants\simulationSteps.js:155

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
completed.push(`D${selectedPath}`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SimulationGuestsideDemoPage\constants\simulationSteps.js:158

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
completed.push(`E${selectedPath}`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\hooks\usePhotoManagement.js:26

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
newPhotos.unshift(selectedPhoto);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\PricingEditSection\usePricingLogic.js:204

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push(`Lease style: ${originalLeaseStyle} → ${selectedRentalType}`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\PricingEditSection\usePricingLogic.js:209

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push(`Damage deposit: $${listing?.damageDeposit || 500} → $${damageDeposit}`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\PricingEditSection\usePricingLogic.js:212

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push(`Maintenance fee: $${listing?.maintenanceFee || 125} → $${maintenanceFee}`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\PricingEditSection\usePricingLogic.js:220

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push(`Available nights updated (${selectedNights.length} nights)`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\PricingEditSection\usePricingLogic.js:224

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push(`Nights range: ${minNights}-${maxNights}`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\PricingEditSection\usePricingLogic.js:232

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push('Nightly rates updated');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\PricingEditSection\usePricingLogic.js:236

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push(`Weekly rate: $${weeklyRate}/week`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\PricingEditSection\usePricingLogic.js:245

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push(`Weekly pattern: ${patternLabels[weeksOffered] || weeksOffered}`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\PricingEditSection\usePricingLogic.js:249

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push(`Monthly rate: $${monthlyRate}/month`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\modals\FullscreenProposalMapModal.jsx:361

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
markersRef.current.push(marker);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\FAQPage.jsx:79

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
grouped[tabName].push(faq);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\FAQPage.jsx:356

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
faqsBySubCategory[subCat].push(faq);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\HomePage.jsx:422

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
legacyPhotoIds.push(firstPhoto);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListWithUsPage.jsx:27

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
prices.push(Math.ceil(prices[i - 1] * clampedDecay));
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SearchPage.jsx:387

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
tags.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SearchPage.jsx:403

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
tags.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SearchPage.jsx:418

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
tags.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SearchPage.jsx:432

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
tags.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SearchPage.jsx:562

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
roots.push(rootDesktop);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SearchPage.jsx:568

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
roots.push(rootMobile);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\WhySplitLeasePage.jsx:130

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
legacyPhotoIds.push(firstPhoto);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\CreateProposalFlowV2.jsx:255

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sorted = [...dayObjs].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\shared\ExternalReviews.jsx:60

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
acc[review.platform].push(review);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\GoogleMap.jsx:363

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
photoIds.push(...photosField);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\GoogleMap.jsx:368

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
photoIds.push(...parsed);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\GoogleMap.jsx:713

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
skippedInvalidCoordinates.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\GoogleMap.jsx:749

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
markersRef.current.push(marker);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\GoogleMap.jsx:811

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
skippedInvalidCoordinates.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\GoogleMap.jsx:844

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
markersRef.current.push(marker);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\SearchScheduleSelector.jsx:373

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sortedDays = [...daysArray].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\shared\SearchScheduleSelector.jsx:398

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sortedUnselected = [...unselectedDays].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\shared\SearchScheduleSelector.jsx:600

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sortedDays = [...selectedDaysArray].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\shared\SearchScheduleSelector.jsx:639

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
checkoutDayIndex = sortedDays.filter(day => day < gapStart).pop();
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\SearchScheduleSelector.jsx:671

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const selectedDaysArray = Array.from(selectedDays).sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\shared\AiSignupMarketReport\AiSignupMarketReport.jsx:1014

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
detectedTopics.push(topic.id);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\AITools\AudioRecorder.jsx:168

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
chunksRef.current.push(e.data);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\CreateProposalFlowV2Components\DaysSelectionSection.jsx:63

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sorted = [...dayNumbers].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\shared\CustomDatePicker\CustomDatePicker.jsx:150

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
days.push(<div key={`empty-${i}`} className="custom-date-picker__day custom-date-picker__day--empty" />);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\CustomDatePicker\CustomDatePicker.jsx:166

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
days.push(
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\DateChangeRequestManager\DateChangeRequestCalendar.jsx:156

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
classes.push(`dcr-date-${status}`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\DateChangeRequestManager\DateChangeRequestCalendar.jsx:159

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
classes.push('dcr-date-past');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\DateChangeRequestManager\DateChangeRequestCalendar.jsx:163

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
classes.push('dcr-date-selectable');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\HostEditingProposal\ScheduleSelector.jsx:119

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (isSelected) classes.push('hss-selected')
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\HostEditingProposal\ScheduleSelector.jsx:120

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (!isAvailable) classes.push('hss-unavailable')
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\HostEditingProposal\ScheduleSelector.jsx:121

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (disabled) classes.push('hss-disabled')
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\HostScheduleSelector\HostScheduleSelector.jsx:248

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
classes.push('hss-selected')
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\HostScheduleSelector\HostScheduleSelector.jsx:252

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
classes.push('hss-non-contiguous')
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\HostScheduleSelector\HostScheduleSelector.jsx:258

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
classes.push('hss-unavailable')
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\HostScheduleSelector\HostScheduleSelector.jsx:263

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
classes.push('hss-disabled')
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\HostScheduleSelector\HostScheduleSelector.jsx:301

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
classes.push('hss-preview-mode')
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\HostScheduleSelector\HostScheduleSelector.jsx:303

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
classes.push('hss-step-by-step-mode')
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\HostScheduleSelector\HostScheduleSelector.jsx:305

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
classes.push('hss-proposal-mode')
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\HostScheduleSelector\HostScheduleSelector.jsx:309

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
classes.push(className)
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\HostScheduleSelector\SimpleHostScheduleSelector.jsx:117

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const newSelection = [...selectedNights, nightId].sort((a, b) => {
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\shared\HostScheduleSelector\SimpleHostScheduleSelector.jsx:145

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
classes.push('shss-selected')
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\HostScheduleSelector\SimpleHostScheduleSelector.jsx:149

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
classes.push('shss-disabled')
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\LoggedInAvatar\LoggedInAvatar.jsx:205

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
items.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\LoggedInAvatar\LoggedInAvatar.jsx:217

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
items.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\LoggedInAvatar\LoggedInAvatar.jsx:240

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
items.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\LoggedInAvatar\LoggedInAvatar.jsx:252

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
items.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\LoggedInAvatar\LoggedInAvatar.jsx:266

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
items.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\LoggedInAvatar\LoggedInAvatar.jsx:280

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
items.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\LoggedInAvatar\LoggedInAvatar.jsx:294

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
items.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\LoggedInAvatar\LoggedInAvatar.jsx:306

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
items.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\LoggedInAvatar\LoggedInAvatar.jsx:318

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
items.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\LoggedInAvatar\LoggedInAvatar.jsx:330

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
items.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\LoggedInAvatar\LoggedInAvatar.jsx:340

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
items.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\ScheduleCohost\ScheduleCohost.jsx:729

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (isOtherMonth) classNames.push('schedule-cohost-calendar-day--other');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\ScheduleCohost\ScheduleCohost.jsx:730

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (isPast) classNames.push('schedule-cohost-calendar-day--past');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\ScheduleCohost\ScheduleCohost.jsx:731

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (isActive) classNames.push('schedule-cohost-calendar-day--selected');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\ScheduleCohost\ScheduleCohost.jsx:732

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (hasSlots) classNames.push('schedule-cohost-calendar-day--has-slots');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\ScheduleCohost\ScheduleCohost.jsx:733

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (isTodayDate) classNames.push('schedule-cohost-calendar-day--today');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\VirtualMeetingManager\BookTimeSlot.jsx:168

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
classes.push('vm-date-button-active');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\VirtualMeetingManager\BookTimeSlot.jsx:172

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
classes.push('vm-date-button-has-slots');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\shared\QRCodeDashboard\components\QRCodeForm.jsx:106

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
acc[uc.category].push(uc);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\FavoriteListingsPage\FavoriteListingsPage.jsx:329

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (neighborhoodName) locationParts.push(neighborhoodName);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\FavoriteListingsPage\FavoriteListingsPage.jsx:330

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (boroughName) locationParts.push(boroughName);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\FavoriteListingsPage\FavoriteListingsPage.jsx:772

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sortedJsDays = [...daysInJsFormat].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\guest-leases\StaysTable.jsx:52

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
buttons.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\guest-leases\StaysTable.jsx:62

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
buttons.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\guest-leases\StaysTable.jsx:72

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
buttons.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\guest-leases\StaysTable.jsx:83

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
buttons.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\proposals\CounterofferSummarySection.jsx:36

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
elements.push(text.slice(lastIndex, match.index));
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\proposals\CounterofferSummarySection.jsx:41

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
elements.push(<strong key={keyIndex++}>{match[1]}</strong>);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\proposals\CounterofferSummarySection.jsx:44

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
elements.push(
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\proposals\CounterofferSummarySection.jsx:56

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
elements.push(text.slice(lastIndex));
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\proposals\ExpandableProposalCard.jsx:159

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sorted = [...dayIndices].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\proposals\ExpandableProposalCard.jsx:238

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sorted = [...dayIndices].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\proposals\ExpandableProposalCard.jsx:610

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
JSON.stringify([...hcDaysSelected].sort()) !== JSON.stringify([...originalDaysSelected].sort());
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\proposals\MatchReasonCard.jsx:46

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
reasons.push({ tag: 'Schedule', description: 'Fits your preferred days' });
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\proposals\MatchReasonCard.jsx:52

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
reasons.push({ tag: 'Duration', description: 'Long-term stay available' });
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\proposals\MatchReasonCard.jsx:58

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
reasons.push({ tag: 'Budget', description: 'Within your price range' });
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\proposals\MatchReasonCard.jsx:63

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
reasons.push({ tag: 'Location', description: `${listing.hoodName || listing.boroughName}` });
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\proposals\MatchReasonCard.jsx:68

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
reasons.push({ tag: 'Pet OK', description: 'Allows pets' });
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\proposals\MatchReasonCard.jsx:73

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
reasons.push({ tag: 'Match', description: 'Recommended based on your preferences' });
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\proposals\ProposalCard.jsx:144

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sorted = [...dayIndices].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\ViewSplitLeasePage_LEGACY\ViewSplitLeasePage.jsx:590

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sortedDays = [...selectedDayNumbers].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\ViewSplitLeasePage_LEGACY\ViewSplitLeasePage.jsx:1075

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sortedJsDays = [...daysInJsFormat].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\ZUnitChatgptModelsPage\ZUnitChatgptModelsPage.jsx:83

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
const buttonLabel = customButtonLabel || (isImageTest ? 'Test gpt-4.1-mini Image Parse' : `Test ${title.split(' ').pop()}`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ZUnitPaymentRecordsJsPage\ZUnitPaymentRecordsJsPage.jsx:259

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
yearOptions.push(y);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ZPricingUnitTestPage\components\Section10PricingListGrid.jsx:34

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
rows.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ModifyListingsPage\sections\LeaseStylesSection.jsx:41

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
newDays = [...currentDays, dayIndex].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\ModifyListingsPage\sections\PhotosSection.jsx:78

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
updatedPhotos.sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0));
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\ModifyListingsPage\sections\RulesSection.jsx:39

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
onUpdate({ 'Dates - Blocked': [...currentBlocked, newBlockedDate].sort() });
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\ModifyListingsPage\shared\FormCheckboxGroup.jsx:44

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
acc[category].push(option);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ManageLeasesPaymentRecordsPage\components\CalendarSection\CalendarDay.jsx:16

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (isOtherMonth) classNames.push('other-month');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ManageLeasesPaymentRecordsPage\components\CalendarSection\CalendarDay.jsx:17

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (isToday) classNames.push('today');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ManageLeasesPaymentRecordsPage\components\CalendarSection\CalendarDay.jsx:18

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (isBooked) classNames.push('booked');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ManageLeasesPaymentRecordsPage\components\CalendarSection\CalendarDay.jsx:19

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (isBookedAfterRequest && !isBooked) classNames.push('booked-after-request');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ManageLeasesPaymentRecordsPage\components\CalendarSection\CalendarDay.jsx:20

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (isInLeaseRange && !isBooked && !isBookedAfterRequest) classNames.push('in-lease-range');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ManageLeasesPaymentRecordsPage\components\CalendarSection\MonthCalendar.jsx:34

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
days.push(date);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\AvailabilitySection.jsx:47

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
dates.push(formatDateKey(current));
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\AvailabilitySection.jsx:111

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
days.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\AvailabilitySection.jsx:122

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
days.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\AvailabilitySection.jsx:136

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
days.push({
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\AvailabilitySection.jsx:244

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
.sort();
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\ListingDashboardPage\components\AvailabilitySection.jsx:255

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
.sort()
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\ListingDashboardPage\components\AvailabilitySection.jsx:256

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
.reverse(); // Most recent past dates first
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\ListingDashboardPage\components\NightlyPricingLegend.jsx:27

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
nightsRange.push(i);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\PricingEditSection.jsx:277

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push(`Lease style: ${originalLeaseStyle} → ${selectedRentalType}`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\PricingEditSection.jsx:281

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push(`Damage deposit: $${listing?.damageDeposit || 500} → $${damageDeposit}`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\PricingEditSection.jsx:284

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push(`Maintenance fee: $${listing?.maintenanceFee || 125} → $${maintenanceFee}`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\PricingEditSection.jsx:291

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push(`Available nights updated (${selectedNights.length} nights)`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\PricingEditSection.jsx:298

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push('Nightly rates updated');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\PricingEditSection.jsx:302

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push(`Weekly rate: $${weeklyRate}/week`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\PricingEditSection.jsx:305

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push(`Weekly pattern updated`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\PricingEditSection.jsx:309

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
changes.push(`Monthly rate: $${monthlyRate}/month`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ListingDashboardPage\components\PricingEditSection.jsx:333

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const dayIndices = selectedNights.map((n) => nightMap[n]).sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\ListingDashboardPage\components\PricingEditSection\index.jsx:107

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const dayIndices = selectedNights.map((n) => nightMap[n]).sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\FavoriteListingsPage\components\MapView.jsx:83

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
bounds.push(position);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\FavoriteListingsPage\components\MapView.jsx:126

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
markersRef.current.push(marker);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\FavoriteListingsPage\components\SplitScheduleSelector.jsx:50

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
days.push(current.getDay());
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\FavoriteListingsPage\components\SplitScheduleSelector.jsx:55

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const uniqueDays = Array.from(new Set(days)).sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\FavoriteListingsPage\components\SplitScheduleSelector.jsx:77

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
newSelectedDays = [...selectedDays, dayIndex].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\CreateSuggestedProposalPage\components\ValidationPanel.jsx:12

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sortedDays = [...selectedDays].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\CoHostRequestsPage\components\Pagination.jsx:25

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
pages.push(i);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\CoHostRequestsPage\components\Pagination.jsx:29

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
pages.push(1);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\CoHostRequestsPage\components\Pagination.jsx:45

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
pages.push('...');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\CoHostRequestsPage\components\Pagination.jsx:50

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
pages.push(i);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\CoHostRequestsPage\components\Pagination.jsx:55

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
pages.push('...');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\CoHostRequestsPage\components\Pagination.jsx:59

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
pages.push(totalPages);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\AccountProfilePage\components\cards\ListingsCard.jsx:23

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sortedPhotos = [...photos].sort((a, b) => {
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\AccountProfilePage\components\cards\ScheduleCommuteCard.jsx:35

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
.sort((a, b) => a - b)
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\ViewSplitLeasePage\useViewSplitLeaseLogic.ts:90

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sortedDays = [...dayNumbers].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:198

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
this.state.data.completedSections = Array.from(completedSections).sort();
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:254

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
this.state.errors.push('Failed to save draft');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:364

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
this.state.errors.push(error);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:387

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Listing name is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:390

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Type of space is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:393

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Type of kitchen is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:396

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Type of parking is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:399

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Valid NYC address is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:404

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('At least one amenity inside unit is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:407

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Description of lodging is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:412

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Rental type is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:417

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('At least one available night must be selected');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:421

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Weekly pattern is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:426

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Damage deposit must be at least $500');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:429

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Monthly compensation is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:432

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Weekly compensation is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:438

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Nightly pricing is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:443

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Cancellation policy is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:446

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Check-in time is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:449

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Check-out time is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\listingLocalStore.ts:454

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push(`At least ${data.photos.minRequired} photos are required`);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\prepareListingSubmission.ts:94

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (nights.sunday) result.push('sunday');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\prepareListingSubmission.ts:95

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (nights.monday) result.push('monday');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\prepareListingSubmission.ts:96

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (nights.tuesday) result.push('tuesday');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\prepareListingSubmission.ts:97

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (nights.wednesday) result.push('wednesday');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\prepareListingSubmission.ts:98

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (nights.thursday) result.push('thursday');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\prepareListingSubmission.ts:99

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (nights.friday) result.push('friday');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\prepareListingSubmission.ts:100

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (nights.saturday) result.push('saturday');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\prepareListingSubmission.ts:274

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (!payload.Name) errors.push('Name is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\prepareListingSubmission.ts:275

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (!payload['Type of Space']) errors.push('Type of Space is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\prepareListingSubmission.ts:276

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (!payload.Address) errors.push('Address is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\prepareListingSubmission.ts:277

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
if (!payload['Rental Type']) errors.push('Rental Type is required');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\prepareListingSubmission.ts:281

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Monthly Compensation is required for Monthly rentals');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\prepareListingSubmission.ts:284

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Weekly Compensation is required for Weekly rentals');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\prepareListingSubmission.ts:287

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Nightly pricing is required for Nightly rentals');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\store\prepareListingSubmission.ts:292

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errors.push('Damage Deposit must be at least $500');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPageV2\SelfListingPageV2.tsx:528

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
prices.push(Math.ceil(prices[i - 1] * clampedDecay));
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\ViewSplitLeasePage\ViewSplitLeasePage.tsx:214

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sortedDays = [...selectedDayNumbers].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\ViewSplitLeasePage\ViewSplitLeasePage.tsx:686

**Type:** Mutating Method

**Description:** Using mutating array sort/reverse

**Current Code:**
```javascript
const sortedJsDays = [...daysInJsFormat].sort((a, b) => a - b);
```

**Suggested Fix:**
Use toSorted() or toReversed(), or [...arr].sort()

**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

---

### 🔴 islands\pages\SelfListingPage\components\NightlyPriceSlider.tsx:71

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
prices.push(roundUp(prices[i - 1] * decay));
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section1SpaceSnapshot.tsx:286

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('listingName');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section1SpaceSnapshot.tsx:289

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('listingName');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section1SpaceSnapshot.tsx:294

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('typeOfSpace');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section1SpaceSnapshot.tsx:299

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('bedrooms');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section1SpaceSnapshot.tsx:304

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('typeOfKitchen');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section1SpaceSnapshot.tsx:309

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('typeOfParking');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section1SpaceSnapshot.tsx:314

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('bathrooms');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section1SpaceSnapshot.tsx:320

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('fullAddress');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section1SpaceSnapshot.tsx:324

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('fullAddress');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section1SpaceSnapshot.tsx:329

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('state');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section2Features.tsx:207

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('amenitiesInsideUnit');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section2Features.tsx:212

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('descriptionOfLodging');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section3LeaseStyles.tsx:133

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('weeklyPattern');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section3LeaseStyles.tsx:138

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('subsidyAgreement');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section4Pricing.tsx:50

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('monthlyCompensation');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section4Pricing.tsx:55

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('weeklyCompensation');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section4Pricing.tsx:60

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('nightlyPricing');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section4Pricing.tsx:67

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('damageDeposit');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section5Rules.tsx:104

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
dates.push(new Date(current));
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section5Rules.tsx:142

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
days.push(null);
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section5Rules.tsx:147

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
days.push(new Date(year, month, d));
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section5Rules.tsx:178

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('cancellationPolicy');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section5Rules.tsx:183

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('idealMinDuration');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section5Rules.tsx:188

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('idealMaxDuration');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section5Rules.tsx:194

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('idealMaxDuration');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section6Photos.tsx:48

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

### 🔴 islands\pages\SelfListingPage\sections\Section6Photos.tsx:266

**Type:** Mutating Method

**Description:** Using mutating array method

**Current Code:**
```javascript
errorOrder.push('photos');
```

**Suggested Fix:**
Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)

**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

---

