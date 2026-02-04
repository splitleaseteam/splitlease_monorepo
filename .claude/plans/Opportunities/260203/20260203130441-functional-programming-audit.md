# Functional Programming Opportunity Report
**Generated:** 20260203130441
**Codebase:** Split Lease

## Executive Summary
- Files audited: 241
- Total violations: 949
- High priority: 680
- Medium priority: 269
- Low priority: 0

## Summary by Principle

| Principle | Violations | Priority |
|-----------|------------|----------|
| IMMUTABILITY | 486 | High |
| EFFECTS AT EDGES | 11 | High |
| DECLARATIVE STYLE | 198 | High |
| ERRORS AS VALUES | 254 | Medium |

## Detailed Findings

### IMMUTABILITY

#### 🔴 __tests__/integration/booking-flow.test.js:109
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sorted = [...selectedDays].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 __tests__/integration/booking-flow.test.js:248
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (!proposal.listingId) errors.push('Listing ID is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 __tests__/integration/booking-flow.test.js:249
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (!proposal.userId) errors.push('User ID is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 __tests__/integration/booking-flow.test.js:251
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('At least one day must be selected');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 __tests__/integration/booking-flow.test.js:253
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (!proposal.moveInDate) errors.push('Move-in date is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 __tests__/integration/booking-flow.test.js:255
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Valid price is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 data/helpCenterData.js:280
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
results.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 hooks/useBiddingRealtime.js:203
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const updatedHistory = [...prevSession.biddingHistory, newBid].sort(
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 hooks/useDeviceDetection.test.js:35
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
resizeListeners.push(handler);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/modals/FullscreenProposalMapModal.jsx:361
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
markersRef.current.push(marker);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/AccountProfilePage/components/cards/ListingsCard.jsx:23
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedPhotos = [...photos].sort((a, b) => {
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/AccountProfilePage/components/cards/ScheduleCommuteCard.jsx:35
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
.sort((a, b) => a - b)
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/AccountProfilePage/useAccountProfilePageLogic.js:132
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
actions.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/AccountProfilePage/useAccountProfilePageLogic.js:142
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
actions.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/AccountProfilePage/useAccountProfilePageLogic.js:153
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
actions.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/AccountProfilePage/useAccountProfilePageLogic.js:161
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
actions.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/AccountProfilePage/useAccountProfilePageLogic.js:169
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
actions.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/AccountProfilePage/useAccountProfilePageLogic.js:177
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
actions.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/AccountProfilePage/useAccountProfilePageLogic.js:185
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
actions.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/AccountProfilePage/useAccountProfilePageLogic.js:193
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
actions.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/AccountProfilePage/useAccountProfilePageLogic.js:924
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
: [...currentDays, dayIndex].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/AccountProfilePage/useAccountProfilePageLogic.js:1530
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/AdminThreadsPage/useAdminThreadsPageLogic.js:259
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
return result.sort((a, b) => {
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/CoHostRequestsPage/components/Pagination.jsx:25
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
pages.push(i);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/CoHostRequestsPage/components/Pagination.jsx:29
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
pages.push(1);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/CoHostRequestsPage/components/Pagination.jsx:45
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
pages.push('...');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/CoHostRequestsPage/components/Pagination.jsx:50
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
pages.push(i);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/CoHostRequestsPage/components/Pagination.jsx:55
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
pages.push('...');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/CoHostRequestsPage/components/Pagination.jsx:59
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
pages.push(totalPages);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/CreateDocumentPage/useCreateDocumentPageLogic.js:99
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
window.$crisp.push(["do", "chat:hide"]);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/CreateSuggestedProposalPage/components/ValidationPanel.jsx:12
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedDays = [...selectedDays].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/CreateSuggestedProposalPage/useCreateSuggestedProposalLogic.js:250
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Please select a listing');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/CreateSuggestedProposalPage/useCreateSuggestedProposalLogic.js:254
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Please select and confirm a guest');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/CreateSuggestedProposalPage/useCreateSuggestedProposalLogic.js:259
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Fill out reservation span OR move-in date to proceed');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/CreateSuggestedProposalPage/useCreateSuggestedProposalLogic.js:263
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Please select at least 3 days');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/CreateSuggestedProposalPage/useCreateSuggestedProposalLogic.js:269
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Number of weeks must be between 6 and 52');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/CreateSuggestedProposalPage/useCreateSuggestedProposalLogic.js:274
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Price calculation is invalid');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/CreateSuggestedProposalPage/useCreateSuggestedProposalLogic.js:613
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
return [...prev, dayIndex].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/FAQPage.jsx:79
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
grouped[tabName].push(faq);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/FAQPage.jsx:356
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
faqsBySubCategory[subCat].push(faq);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/FavoriteListingsPage/FavoriteListingsPage.jsx:329
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (neighborhoodName) locationParts.push(neighborhoodName);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/FavoriteListingsPage/FavoriteListingsPage.jsx:330
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (boroughName) locationParts.push(boroughName);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/FavoriteListingsPage/FavoriteListingsPage.jsx:774
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedJsDays = [...daysInJsFormat].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/FavoriteListingsPage/components/MapView.jsx:83
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
bounds.push(position);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/FavoriteListingsPage/components/MapView.jsx:126
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
markersRef.current.push(marker);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/FavoriteListingsPage/components/SplitScheduleSelector.jsx:50
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push(current.getDay());
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/FavoriteListingsPage/components/SplitScheduleSelector.jsx:55
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const uniqueDays = Array.from(new Set(days)).sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/FavoriteListingsPage/components/SplitScheduleSelector.jsx:77
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
newSelectedDays = [...selectedDays, dayIndex].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/FavoriteListingsPage/formatters.js:66
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
parts.push('1 bedroom');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/FavoriteListingsPage/formatters.js:70
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
parts.push(`${bedrooms} bedrooms`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/FavoriteListingsPage/formatters.js:76
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
parts.push(bathroomDisplay);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/FavoriteListingsPage/formatters.js:81
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
parts.push(kitchenType);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/FavoriteListingsPage/formatters.js:115
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (borough) parts.push(borough);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/FavoriteListingsPage/formatters.js:116
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (hood) parts.push(hood);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/FavoriteListingsPage/formatters.js:117
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (city) parts.push(city);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/HomePage.jsx:422
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
legacyPhotoIds.push(firstPhoto);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/HostOverviewPage/useHostOverviewPageLogic.js:155
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
fetchPromises.push(
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/HostOverviewPage/useHostOverviewPageLogic.js:184
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
fetchPromises.push(
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/HostOverviewPage/useHostOverviewPageLogic.js:201
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
fetchPromises.push(
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/HostProposalsPage/formatters.js:105
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sorted = [...nights].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/HostProposalsPage/formatters.js:245
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
credentialParts.push('ID and work verified');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/HostProposalsPage/formatters.js:247
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
credentialParts.push('ID verified');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/HostProposalsPage/formatters.js:249
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
credentialParts.push('work verified');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/HostProposalsPage/formatters.js:252
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
credentialParts.push(`with ${reviewCount} positive review${reviewCount > 1 ? 's' : ''}`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/HostProposalsPage/types.js:254
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
activeDays.push(dayNames[current]);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/HostProposalsPage/types.js:342
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sorted = [...dayIndices].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/HostProposalsPage/types.js:411
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
.sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/HostProposalsPage/types.js:554
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
result.actionNeeded.push(proposal);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/HostProposalsPage/types.js:560
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
result.actionNeeded.push(proposal);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/HostProposalsPage/types.js:562
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
result.inProgress.push(proposal);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/HostProposalsPage/types.js:564
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
result.closed.push(proposal);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/HostProposalsPage/types.js:567
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
result.inProgress.push(proposal);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/HostProposalsPage/useHostProposalsPageLogic.js:395
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedListings = [...listingsResult].sort((a, b) => {
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/HostProposalsPage/useHostProposalsPageLogic.js:654
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
summaryMap[proposalId].push(summary);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListWithUsPage.jsx:27
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
prices.push(Math.ceil(prices[i - 1] * clampedDecay));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx:47
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
dates.push(formatDateKey(current));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx:111
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx:122
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx:136
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx:244
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
.sort();
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx:255
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
.sort()
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx:256
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
.reverse(); // Most recent past dates first
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/ListingDashboardPage/components/NightlyPricingLegend.jsx:27
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
nightsRange.push(i);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/PricingEditSection.jsx:277
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push(`Lease style: ${originalLeaseStyle} → ${selectedRentalType}`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/PricingEditSection.jsx:281
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push(`Damage deposit: $${listing?.damageDeposit || 500} → $${damageDeposit}`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/PricingEditSection.jsx:284
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push(`Maintenance fee: $${listing?.maintenanceFee || 125} → $${maintenanceFee}`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/PricingEditSection.jsx:291
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push(`Available nights updated (${selectedNights.length} nights)`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/PricingEditSection.jsx:298
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push('Nightly rates updated');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/PricingEditSection.jsx:302
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push(`Weekly rate: $${weeklyRate}/week`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/PricingEditSection.jsx:305
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push(`Weekly pattern updated`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/PricingEditSection.jsx:309
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push(`Monthly rate: $${monthlyRate}/month`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/PricingEditSection.jsx:333
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const dayIndices = selectedNights.map((n) => nightMap[n]).sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/ListingDashboardPage/components/PricingEditSection/index.jsx:107
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const dayIndices = selectedNights.map((n) => nightMap[n]).sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/ListingDashboardPage/components/PricingEditSection/usePricingLogic.js:204
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push(`Lease style: ${originalLeaseStyle} → ${selectedRentalType}`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/PricingEditSection/usePricingLogic.js:209
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push(`Damage deposit: $${listing?.damageDeposit || 500} → $${damageDeposit}`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/PricingEditSection/usePricingLogic.js:212
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push(`Maintenance fee: $${listing?.maintenanceFee || 125} → $${maintenanceFee}`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/PricingEditSection/usePricingLogic.js:220
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push(`Available nights updated (${selectedNights.length} nights)`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/PricingEditSection/usePricingLogic.js:224
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push(`Nights range: ${minNights}-${maxNights}`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/PricingEditSection/usePricingLogic.js:232
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push('Nightly rates updated');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/PricingEditSection/usePricingLogic.js:236
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push(`Weekly rate: $${weeklyRate}/week`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/PricingEditSection/usePricingLogic.js:245
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push(`Weekly pattern: ${patternLabels[weeksOffered] || weeksOffered}`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/components/PricingEditSection/usePricingLogic.js:249
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push(`Monthly rate: $${monthlyRate}/month`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingDashboardPage/hooks/usePhotoManagement.js:26
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
newPhotos.unshift(selectedPhoto);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingsOverviewPage/api.js:351
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
results.push({ id, success: false, error: fetchError.message });
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingsOverviewPage/api.js:373
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
results.push({ id, success: false, error: updateError.message });
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ListingsOverviewPage/api.js:375
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
results.push({ id, success: true, newNightly, new3Night });
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ManageLeasesPaymentRecordsPage/components/CalendarSection/CalendarDay.jsx:16
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (isOtherMonth) classNames.push('other-month');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ManageLeasesPaymentRecordsPage/components/CalendarSection/CalendarDay.jsx:17
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (isToday) classNames.push('today');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ManageLeasesPaymentRecordsPage/components/CalendarSection/CalendarDay.jsx:18
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (isBooked) classNames.push('booked');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ManageLeasesPaymentRecordsPage/components/CalendarSection/CalendarDay.jsx:19
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (isBookedAfterRequest && !isBooked) classNames.push('booked-after-request');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ManageLeasesPaymentRecordsPage/components/CalendarSection/CalendarDay.jsx:20
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (isInLeaseRange && !isBooked && !isBookedAfterRequest) classNames.push('in-lease-range');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ManageLeasesPaymentRecordsPage/components/CalendarSection/MonthCalendar.jsx:34
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push(date);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/MessagingPage/useCTAHandler.js:65
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
window.$crisp.push(['do', 'chat:open']);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/MessagingPage/useMessagingPageLogic.js:1119
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedJsDays = [...daysInJsFormat].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/ModifyListingsPage/sections/LeaseStylesSection.jsx:41
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
newDays = [...currentDays, dayIndex].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/ModifyListingsPage/sections/PhotosSection.jsx:78
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
updatedPhotos.sort((a, b) => (a.SortOrder || 0) - (b.SortOrder || 0));
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/ModifyListingsPage/sections/RulesSection.jsx:39
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
onUpdate({ 'Dates - Blocked': [...currentBlocked, newBlockedDate].sort() });
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/ModifyListingsPage/shared/FormCheckboxGroup.jsx:44
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
acc[category].push(option);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ProposalManagePage/useProposalManagePageLogic.js:92
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
batches.push(ids.slice(i, i + batchSize));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ScheduleDashboard/components/ScheduleCalendar.jsx:103
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push(null);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ScheduleDashboard/components/ScheduleCalendar.jsx:108
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push(new Date(year, month, day));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ScheduleDashboard/components/ScheduleCalendar.jsx:125
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const userDates = userNights.map(d => parseDate(d)).sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/ScheduleDashboard/components/ScheduleCalendar.jsx:359
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
weeks.push(calendarDays.slice(i, i + 7));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ScheduleDashboard/components/TransactionHistory.jsx:294
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedTransactions = [...filteredTransactions].sort((a, b) => {
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/ScheduleDashboard/state/validators.js:54
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
nextOwnership[payerId].push(nightString);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ScheduleDashboard/state/validators.js:66
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
nextOwnership[payeeId].push(nightString);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ScheduleDashboard/state/validators.js:71
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
nextOwnership[payerId].push(nightString);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ScheduleDashboard/useScheduleDashboardLogic.js:270
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
factors.push(`Notice ${noticeMultiplier}x (${noticeThreshold})`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ScheduleDashboard/useScheduleDashboardLogic.js:276
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
factors.push(`Edge ${edgeMultiplier}x`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ScheduleDashboard/useScheduleDashboardLogic.js:282
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
prices.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ScheduleDashboard/useScheduleDashboardLogic.js:425
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
allPrices.push(Math.round(baseCost * nm * em));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SearchPage.jsx:387
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
tags.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SearchPage.jsx:403
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
tags.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SearchPage.jsx:418
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
tags.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SearchPage.jsx:432
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
tags.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SearchPage.jsx:562
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
roots.push(rootDesktop);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SearchPage.jsx:568
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
roots.push(rootMobile);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/components/NightlyPriceSlider.tsx:71
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
prices.push(roundUp(prices[i - 1] * decay));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section1SpaceSnapshot.tsx:286
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('listingName');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section1SpaceSnapshot.tsx:289
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('listingName');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section1SpaceSnapshot.tsx:294
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('typeOfSpace');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section1SpaceSnapshot.tsx:299
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('bedrooms');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section1SpaceSnapshot.tsx:304
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('typeOfKitchen');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section1SpaceSnapshot.tsx:309
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('typeOfParking');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section1SpaceSnapshot.tsx:314
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('bathrooms');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section1SpaceSnapshot.tsx:320
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('fullAddress');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section1SpaceSnapshot.tsx:324
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('fullAddress');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section1SpaceSnapshot.tsx:329
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('state');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section2Features.tsx:207
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('amenitiesInsideUnit');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section2Features.tsx:212
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('descriptionOfLodging');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section3LeaseStyles.tsx:133
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('weeklyPattern');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section3LeaseStyles.tsx:138
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('subsidyAgreement');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section4Pricing.tsx:50
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('monthlyCompensation');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section4Pricing.tsx:55
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('weeklyCompensation');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section4Pricing.tsx:60
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('nightlyPricing');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section4Pricing.tsx:67
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('damageDeposit');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section5Rules.tsx:104
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
dates.push(new Date(current));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section5Rules.tsx:142
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push(null);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section5Rules.tsx:147
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push(new Date(year, month, d));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section5Rules.tsx:178
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('cancellationPolicy');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section5Rules.tsx:183
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('idealMinDuration');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section5Rules.tsx:188
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('idealMaxDuration');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section5Rules.tsx:194
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('idealMaxDuration');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section6Photos.tsx:48
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/sections/Section6Photos.tsx:266
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errorOrder.push('photos');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:198
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
this.state.data.completedSections = Array.from(completedSections).sort();
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:254
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
this.state.errors.push('Failed to save draft');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:364
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
this.state.errors.push(error);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:387
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Listing name is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:390
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Type of space is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:393
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Type of kitchen is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:396
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Type of parking is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:399
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Valid NYC address is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:404
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('At least one amenity inside unit is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:407
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Description of lodging is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:412
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Rental type is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:417
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('At least one available night must be selected');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:421
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Weekly pattern is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:426
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Damage deposit must be at least $500');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:429
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Monthly compensation is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:432
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Weekly compensation is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:438
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Nightly pricing is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:443
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Cancellation policy is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:446
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Check-in time is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:449
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Check-out time is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/listingLocalStore.ts:454
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push(`At least ${data.photos.minRequired} photos are required`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/prepareListingSubmission.ts:94
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (nights.sunday) result.push('sunday');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/prepareListingSubmission.ts:95
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (nights.monday) result.push('monday');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/prepareListingSubmission.ts:96
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (nights.tuesday) result.push('tuesday');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/prepareListingSubmission.ts:97
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (nights.wednesday) result.push('wednesday');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/prepareListingSubmission.ts:98
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (nights.thursday) result.push('thursday');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/prepareListingSubmission.ts:99
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (nights.friday) result.push('friday');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/prepareListingSubmission.ts:100
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (nights.saturday) result.push('saturday');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/prepareListingSubmission.ts:274
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (!payload.Name) errors.push('Name is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/prepareListingSubmission.ts:275
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (!payload['Type of Space']) errors.push('Type of Space is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/prepareListingSubmission.ts:276
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (!payload.Address) errors.push('Address is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/prepareListingSubmission.ts:277
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (!payload['Rental Type']) errors.push('Rental Type is required');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/prepareListingSubmission.ts:281
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Monthly Compensation is required for Monthly rentals');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/prepareListingSubmission.ts:284
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Weekly Compensation is required for Weekly rentals');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/prepareListingSubmission.ts:287
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Nightly pricing is required for Nightly rentals');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPage/store/prepareListingSubmission.ts:292
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Damage Deposit must be at least $500');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SelfListingPageV2/SelfListingPageV2.tsx:543
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
prices.push(Math.ceil(prices[i - 1] * clampedDecay));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SimulationGuestsideDemoPage/constants/simulationSteps.js:147
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
completed.push(`C${selectedPath}`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SimulationGuestsideDemoPage/constants/simulationSteps.js:149
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
completed.push(step);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SimulationGuestsideDemoPage/constants/simulationSteps.js:155
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
completed.push(`D${selectedPath}`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SimulationGuestsideDemoPage/constants/simulationSteps.js:158
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
completed.push(`E${selectedPath}`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/SimulationHostsideDemoPage/constants/simulationSteps.js:93
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
completed.push(STEP_ORDER[i]);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/UsabilityDataManagementPage/useUsabilityDataManagementPageLogic.js:215
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
window.$crisp.push(["do", "chat:hide"]);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/UsabilityDataManagementPage/useUsabilityDataManagementPageLogic.js:292
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
return [...prev, dayIndex].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/ViewSplitLeasePage/ViewSplitLeasePage.tsx:214
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedDays = [...selectedDayNumbers].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/ViewSplitLeasePage/ViewSplitLeasePage.tsx:690
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedJsDays = [...daysInJsFormat].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/ViewSplitLeasePage/useViewSplitLeaseLogic.ts:90
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedDays = [...dayNumbers].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/ViewSplitLeasePage_LEGACY/ViewSplitLeasePage.jsx:590
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedDays = [...selectedDayNumbers].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/ViewSplitLeasePage_LEGACY/ViewSplitLeasePage.jsx:1075
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedJsDays = [...daysInJsFormat].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/WhySplitLeasePage.jsx:130
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
legacyPhotoIds.push(firstPhoto);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ZEmailsUnitPage/useZEmailsUnitPageLogic.js:116
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
emails.push('');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ZPricingUnitTestPage/components/Section5PricingListGrid.jsx:32
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
rows.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ZUnitChatgptModelsPage/ZUnitChatgptModelsPage.jsx:83
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const buttonLabel = customButtonLabel || (isImageTest ? 'Test gpt-4.1-mini Image Parse' : `Test ${title.split(' ').pop()}`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ZUnitPaymentRecordsJsPage/ZUnitPaymentRecordsJsPage.jsx:259
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
yearOptions.push(y);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ZUnitPaymentRecordsJsPage/useZUnitPaymentRecordsJsPageLogic.js:226
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
guestNative.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ZUnitPaymentRecordsJsPage/useZUnitPaymentRecordsJsPageLogic.js:265
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
hostNative.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ZUnitPaymentRecordsJsPage/useZUnitPaymentRecordsJsPageLogic.js:577
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push({ day: null, isBooked: false, isPaymentDay: false });
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/ZUnitPaymentRecordsJsPage/useZUnitPaymentRecordsJsPageLogic.js:592
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push({ day, date, isBooked, isPaymentDay: false });
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/guest-leases/StaysTable.jsx:52
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
buttons.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/guest-leases/StaysTable.jsx:62
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
buttons.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/guest-leases/StaysTable.jsx:72
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
buttons.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/guest-leases/StaysTable.jsx:83
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
buttons.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/guest-leases/useGuestLeasesPageLogic.js:407
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
photoUrls.push(urlData.publicUrl);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/proposals/CounterofferSummarySection.jsx:36
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
elements.push(text.slice(lastIndex, match.index));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/proposals/CounterofferSummarySection.jsx:41
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
elements.push(<strong key={keyIndex++}>{match[1]}</strong>);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/proposals/CounterofferSummarySection.jsx:44
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
elements.push(
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/proposals/CounterofferSummarySection.jsx:56
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
elements.push(text.slice(lastIndex));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/proposals/ExpandableProposalCard.jsx:160
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sorted = [...dayIndices].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/proposals/ExpandableProposalCard.jsx:239
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sorted = [...dayIndices].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/proposals/ExpandableProposalCard.jsx:614
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
JSON.stringify([...hcDaysSelected].sort()) !== JSON.stringify([...originalDaysSelected].sort());
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/proposals/LeaseCalendarSection.jsx:70
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push(date);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/proposals/LeaseCalendarSection.jsx:129
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (isOtherMonth) classNames.push('lcs-day--other-month');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/proposals/LeaseCalendarSection.jsx:130
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (isToday) classNames.push('lcs-day--today');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/proposals/LeaseCalendarSection.jsx:131
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (isBooked) classNames.push('lcs-day--booked');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/proposals/LeaseCalendarSection.jsx:132
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (isPast && !isBooked) classNames.push('lcs-day--past');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/proposals/MatchReasonCard.jsx:46
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
reasons.push({ tag: 'Schedule', description: 'Fits your preferred days' });
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/proposals/MatchReasonCard.jsx:52
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
reasons.push({ tag: 'Duration', description: 'Long-term stay available' });
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/proposals/MatchReasonCard.jsx:58
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
reasons.push({ tag: 'Budget', description: 'Within your price range' });
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/proposals/MatchReasonCard.jsx:63
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
reasons.push({ tag: 'Location', description: `${listing.hoodName || listing.boroughName}` });
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/proposals/MatchReasonCard.jsx:68
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
reasons.push({ tag: 'Pet OK', description: 'Allows pets' });
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/proposals/MatchReasonCard.jsx:73
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
reasons.push({ tag: 'Match', description: 'Recommended based on your preferences' });
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/proposals/ProposalCard.jsx:144
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sorted = [...dayIndices].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/proposals/displayUtils.js:309
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sorted = [...parsed].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/proposals/leaseDataHelpers.js:151
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
allDates.push(normalized);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/proposals/leaseDataHelpers.js:157
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
return [...new Set(allDates)].sort();
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/proposals/useGuestProposalsPageLogic.js:414
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
suggested.push(proposal);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/proposals/useGuestProposalsPageLogic.js:416
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
userCreated.push(proposal);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/proposals/useGuestProposalsPageLogic.js:437
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
suggested: suggested.sort(sortProposals),
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/proposals/useGuestProposalsPageLogic.js:438
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
userCreated: userCreated.sort(sortProposals)
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/pages/useEmailSmsUnitPageLogic.js:229
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
emails.push('');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/useSearchPageLogic.js:179
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (neighborhoodName) locationParts.push(neighborhoodName)
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/pages/useSearchPageLogic.js:180
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (boroughName) locationParts.push(boroughName)
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/AITools/AudioRecorder.jsx:168
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
chunksRef.current.push(e.data);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/AiSignupMarketReport/AiSignupMarketReport.jsx:1004
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
detectedTopics.push(topic.id);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/BiddingInterface/BiddingHistory.jsx:65
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedBids = [...history].sort((a, b) =>
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/shared/CreateProposalFlowV2.jsx:255
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sorted = [...dayObjs].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/shared/CreateProposalFlowV2Components/DaysSelectionSection.jsx:63
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sorted = [...dayNumbers].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/shared/CustomDatePicker/CustomDatePicker.jsx:150
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push(<div key={`empty-${i}`} className="custom-date-picker__day custom-date-picker__day--empty" />);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/CustomDatePicker/CustomDatePicker.jsx:166
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push(
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/DateChangeRequestManager/DateChangeRequestCalendar.jsx:190
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
classes.push('dcr-date-adjacent');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/DateChangeRequestManager/DateChangeRequestCalendar.jsx:192
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
classes.push(`dcr-date-${status}`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/DateChangeRequestManager/DateChangeRequestCalendar.jsx:196
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
classes.push('dcr-date-past');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/DateChangeRequestManager/DateChangeRequestCalendar.jsx:200
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
classes.push('dcr-date-selectable');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/DateChangeRequestManager/dateUtils.js:42
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push(null);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/DateChangeRequestManager/dateUtils.js:47
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/DateChangeRequestManager/utils/archetypeLogic.ts:44
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const scores = Object.values(normalized).sort((a, b) => b - a);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/shared/DateChangeRequestManager/utils/archetypeLogic.ts:216
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
reasons.push(`Average transaction value of $${(signals.avgTransactionValue / 100).toFixed(0)}`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/DateChangeRequestManager/utils/archetypeLogic.ts:219
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
reasons.push('High willingness to pay for convenience');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/DateChangeRequestManager/utils/archetypeLogic.ts:222
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
reasons.push('Selective about accepting proposals');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/DateChangeRequestManager/utils/archetypeLogic.ts:225
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
reasons.push(`Prefer buyouts (${(signals.buyoutPreference * 100).toFixed(0)}% of time)`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/DateChangeRequestManager/utils/archetypeLogic.ts:229
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
reasons.push(`High flexibility score (${signals.flexibilityScore}/100)`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/DateChangeRequestManager/utils/archetypeLogic.ts:232
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
reasons.push(`Accommodated others ${signals.accommodationHistory} times`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/DateChangeRequestManager/utils/archetypeLogic.ts:235
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
reasons.push(`Prefer swaps (${(signals.swapPreference * 100).toFixed(0)}% of time)`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/DateChangeRequestManager/utils/archetypeLogic.ts:238
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
reasons.push('Gives more than receives');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/DateChangeRequestManager/utils/archetypeLogic.ts:241
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
reasons.push('Balanced preferences across all transaction types');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/EditListingDetails/useEditListingDetailsLogic.js:249
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (city) parts.push(city);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/EditListingDetails/useEditListingDetailsLogic.js:250
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (state) parts.push(state);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/EditListingDetails/useEditListingDetailsLogic.js:251
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (zip) parts.push(zip);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/EditListingDetails/useEditListingDetailsLogic.js:849
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
uploadedUrls.push(result.url);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/ExternalReviews.jsx:60
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
acc[review.platform].push(review);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/ExternalReviews.stories.jsx:140
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
acc[review.platform].push(review);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/GoogleMap.jsx:379
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
photoIds.push(...photosField);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/GoogleMap.jsx:384
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
photoIds.push(...parsed);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/GoogleMap.jsx:729
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
skippedInvalidCoordinates.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/GoogleMap.jsx:765
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
markersRef.current.push(marker);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/GoogleMap.jsx:827
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
skippedInvalidCoordinates.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/GoogleMap.jsx:860
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
markersRef.current.push(marker);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js:212
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedJsDays = [...daysInJsFormat].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/shared/HostEditingProposal/ScheduleSelector.jsx:119
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (isSelected) classes.push('hss-selected')
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/HostEditingProposal/ScheduleSelector.jsx:120
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (!isAvailable) classes.push('hss-unavailable')
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/HostEditingProposal/ScheduleSelector.jsx:121
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (disabled) classes.push('hss-disabled')
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/HostEditingProposal/types.js:141
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sorted = [...selectedNights].sort((a, b) => a - b)
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/shared/HostEditingProposal/types.js:173
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sorted = [...selectedNights].sort((a, b) => a - b)
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/shared/HostEditingProposal/types.js:240
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
checkInDays.push(checkOutDay)
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/HostScheduleSelector/HostScheduleSelector.jsx:248
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
classes.push('hss-selected')
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/HostScheduleSelector/HostScheduleSelector.jsx:252
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
classes.push('hss-non-contiguous')
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/HostScheduleSelector/HostScheduleSelector.jsx:258
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
classes.push('hss-unavailable')
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/HostScheduleSelector/HostScheduleSelector.jsx:263
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
classes.push('hss-disabled')
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/HostScheduleSelector/HostScheduleSelector.jsx:301
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
classes.push('hss-preview-mode')
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/HostScheduleSelector/HostScheduleSelector.jsx:303
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
classes.push('hss-step-by-step-mode')
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/HostScheduleSelector/HostScheduleSelector.jsx:305
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
classes.push('hss-proposal-mode')
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/HostScheduleSelector/HostScheduleSelector.jsx:309
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
classes.push(className)
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/HostScheduleSelector/SimpleHostScheduleSelector.jsx:117
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const newSelection = [...selectedNights, nightId].sort((a, b) => {
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/shared/HostScheduleSelector/SimpleHostScheduleSelector.jsx:145
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
classes.push('shss-selected')
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/HostScheduleSelector/SimpleHostScheduleSelector.jsx:149
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
classes.push('shss-disabled')
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/HostScheduleSelector/utils.js:25
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
.sort((a, b) => a - b)
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/shared/HostScheduleSelector/utils.js:31
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
gaps.push(i)
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/HostScheduleSelector/utils.js:60
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
sequence.push(getNightByDayIndex(i).id)
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/HostScheduleSelector/utils.js:65
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
sequence.push(getNightByDayIndex(i).id)
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/HostScheduleSelector/utils.js:133
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
return [...nights].sort((a, b) => {
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/shared/LoggedInAvatar/LoggedInAvatar.jsx:209
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
items.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/LoggedInAvatar/LoggedInAvatar.jsx:221
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
items.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/LoggedInAvatar/LoggedInAvatar.jsx:244
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
items.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/LoggedInAvatar/LoggedInAvatar.jsx:256
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
items.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/LoggedInAvatar/LoggedInAvatar.jsx:270
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
items.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/LoggedInAvatar/LoggedInAvatar.jsx:284
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
items.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/LoggedInAvatar/LoggedInAvatar.jsx:298
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
items.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/LoggedInAvatar/LoggedInAvatar.jsx:310
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
items.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/LoggedInAvatar/LoggedInAvatar.jsx:322
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
items.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/LoggedInAvatar/LoggedInAvatar.jsx:334
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
items.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/LoggedInAvatar/LoggedInAvatar.jsx:344
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
items.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/NotificationSettingsIsland/notificationCategories.js:122
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
arr.push(channel);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/QRCodeDashboard/components/QRCodeForm.jsx:106
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
acc[uc.category].push(uc);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/RentalApplicationWizardModal/useRentalApplicationWizardLogic.js:258
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
stepsToVisit.push(i);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/RentalApplicationWizardModal/useRentalApplicationWizardLogic.js:578
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
newCompleted.push(step);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/ScheduleCohost/ScheduleCohost.jsx:729
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (isOtherMonth) classNames.push('schedule-cohost-calendar-day--other');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/ScheduleCohost/ScheduleCohost.jsx:730
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (isPast) classNames.push('schedule-cohost-calendar-day--past');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/ScheduleCohost/ScheduleCohost.jsx:731
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (isActive) classNames.push('schedule-cohost-calendar-day--selected');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/ScheduleCohost/ScheduleCohost.jsx:732
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (hasSlots) classNames.push('schedule-cohost-calendar-day--has-slots');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/ScheduleCohost/ScheduleCohost.jsx:733
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (isTodayDate) classNames.push('schedule-cohost-calendar-day--today');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/ScheduleCohost/cohostService.js:43
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push(date);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/ScheduleCohost/cohostService.js:66
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
slots.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/SearchScheduleSelector.jsx:373
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedDays = [...daysArray].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/shared/SearchScheduleSelector.jsx:398
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedUnselected = [...unselectedDays].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/shared/SearchScheduleSelector.jsx:600
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedDays = [...selectedDaysArray].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/shared/SearchScheduleSelector.jsx:639
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
checkoutDayIndex = sortedDays.filter(day => day < gapStart).pop();
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/SearchScheduleSelector.jsx:671
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const selectedDaysArray = Array.from(selectedDays).sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/shared/SuggestedProposals/suggestedProposalService.js:92
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
summaryMap[proposalId].push(summary);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/SuggestedProposals/suggestedProposalService.js:318
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
summaryMap[proposalId].push(summary);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:57
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
.sort((a, b) => b - a);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:220
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (daysUntil > 14) projections.push(14);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:221
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (daysUntil > 7) projections.push(7);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:222
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
if (daysUntil > 3) projections.push(3);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:223
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
projections.push(1);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:273
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
projections.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:411
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
alerts.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:420
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
alerts.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:429
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
alerts.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:439
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
alerts.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:449
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
alerts.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/VirtualMeetingManager/BookTimeSlot.jsx:168
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
classes.push('vm-date-button-active');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/VirtualMeetingManager/BookTimeSlot.jsx:172
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
classes.push('vm-date-button-has-slots');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/VirtualMeetingManager/dateUtils.js:75
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
slots.push(slotTime);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/VirtualMeetingManager/dateUtils.js:96
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push(null);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 islands/shared/VirtualMeetingManager/dateUtils.js:101
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/aiService.js:106
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
return [...amenities].sort((a, b) => {
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 lib/api/identityVerificationService.js:90
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const extension = file.name.split('.').pop() || 'jpg';
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/availabilityValidation.js:31
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sorted = [...selectedDays].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 lib/availabilityValidation.js:66
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
expectedNotSelected.push(i);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/availabilityValidation.js:97
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sorted = [...selectedDays].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 lib/availabilityValidation.js:166
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
result.errors.push('Please select at least one day');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/availabilityValidation.js:175
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
result.errors.push('Please check for contiguous nights to continue with your proposal');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/availabilityValidation.js:181
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
result.warnings.push(`Host prefers at least ${listing['Minimum Nights']} nights per week`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/availabilityValidation.js:186
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
result.warnings.push(`Host prefers at most ${listing['Maximum Nights']} nights per week`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/availabilityValidation.js:199
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
result.errors.push('Some selected days are not available for this listing');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/availabilityValidation.js:271
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
result.errors.push('Please select a move-in date');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/availabilityValidation.js:280
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
result.errors.push('Move-in date cannot be in the past');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/availabilityValidation.js:287
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
result.errors.push('Move-in date is outside available range');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/availabilityValidation.js:294
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
result.errors.push('Selected move-in date is not available');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/availabilityValidation.js:305
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
result.errors.push(`Move-in date must be on a ${DAY_NAMES[checkInDay]} based on your selected schedule`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/dataLookups.js:563
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
policies.push({ id, display: policy.display });
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/dataLookups.js:575
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
options.push({ id, label: parking.label });
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/dataLookups.js:605
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
reasons.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/dataLookups.js:611
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
return reasons.sort((a, b) => a.displayOrder - b.displayOrder);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 lib/dataLookups.js:622
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
reasons.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/dataLookups.js:628
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
return reasons.sort((a, b) => a.displayOrder - b.displayOrder);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 lib/emergencyService.js:162
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const fileExt = file.name.split('.').pop();
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/hotjar.js:18
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/listingDataFetcher.js:200
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
sortedPhotos = sortedPhotos.sort((a, b) => {
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 lib/listingService.js:344
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
currentListings.push(listingId);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/listingService.js:837
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
result.push(dayNameMapping[day]);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/listingService.js:1147
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
result.push(dayMapping[day]);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/listingService.js:1151
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
return result.sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 lib/parseBBCode.js:101
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
matches.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/parseBBCode.js:112
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
matches.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/parseBBCode.js:123
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
matches.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/parseBBCode.js:134
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
matches.sort((a, b) => a.index - b.index);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 lib/parseBBCode.js:141
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
filteredMatches.push(m);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/parseBBCode.js:150
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
elements.push(text.slice(lastIndex, m.index));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/parseBBCode.js:157
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
elements.push(
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/parseBBCode.js:162
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
elements.push(
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/parseBBCode.js:167
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
elements.push(
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/parseBBCode.js:182
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
elements.push(text.slice(lastIndex));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/photoUpload.js:36
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
byteArrays.push(new Uint8Array(byteNumbers));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/photoUpload.js:86
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
extension = photo.file.name.split('.').pop().toLowerCase() || 'jpg';
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/photoUpload.js:170
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
uploadedPhotos.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/photoUpload.js:184
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
uploadedPhotos.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/proposalService.js:25
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedJsDays = [...daysInJsFormat].sort((a, b) => a - b)
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 lib/proposals/userProposalQueries.js:234
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
listingsNeedingPhotoFetch.push(listing._id);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/proposals/userProposalQueries.js:496
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
summaryMap.get(proposalId).push(summary);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/scheduleSelector/dayHelpers.js:44
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
return [...days].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 lib/scheduleSelector/dayHelpers.js:113
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
nights.push(createNight(sortedDays[i].dayOfWeek));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/scheduleSelector/goldenScheduleValidator.js:50
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/scheduleSelector/goldenScheduleValidator.js:59
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/scheduleSelector/goldenScheduleValidator.js:68
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/scheduleSelector/goldenScheduleValidator.js:77
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/scheduleSelector/goldenScheduleValidator.js:86
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/scheduleSelector/goldenScheduleValidator.js:101
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/scheduleSelector/goldenScheduleValidator.js:110
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sorted = [...selectedDayIndices].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 lib/scheduleSelector/multiCheckScheduleValidator.js:23
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedDays = [...selectedDayIndices].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 lib/scheduleSelector/multiCheckScheduleValidator.js:39
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/scheduleSelector/multiCheckScheduleValidator.js:46
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/scheduleSelector/nightCalculations.js:15
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
nights.push(createNight(sorted[i].dayOfWeek));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/scheduleSelector/validators.js:102
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
expectedNotSelected.push(i);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/secureStorage.js:238
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
keysToRemove.push(key);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/supabaseUtils.js:156
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
photoUrls.push(photoUrl);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/supabaseUtils.js:170
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
photoUrls.push(photoUrl);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/supabaseUtils.js:177
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
photoUrls.push(url);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/supabaseUtils.js:227
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
amenities.push(amenity);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/supabaseUtils.js:236
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
amenities.push(amenitiesMap['kitchen']);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 lib/supabaseUtils.js:241
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
amenities.sort((a, b) => a.priority - b.priority);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 logic/bidding/processors/transformBidData.js:87
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
biddingHistory: transformedBids.sort((a, b) => a.timestamp - b.timestamp),
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 logic/bidding/rules/isBidValid.js:89
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push(`Bid must exceed current high bid of $${formatCurrency(currentHigh)}`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/bidding/rules/isBidValid.js:94
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push(
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/bidding/rules/isBidValid.js:101
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('You already have the high bid');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/bidding/rules/isBidValid.js:106
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Bidding session has ended');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/bidding/rules/isBidValid.js:112
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push(`Maximum ${session.maxRounds} bids per user reached`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/bidding/rules/isBidValid.js:118
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push(`Bid cannot exceed $${formatCurrency(maximumAllowed)}`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/bidding/rules/isBidValid.js:124
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
warnings.push(
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/bidding/rules/isBidValid.js:131
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
warnings.push('This will be your final bid');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/bidding/rules/validateBid.js:48
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push(`Bid must exceed current high bid ($${formatCurrency(currentHigh)})`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/bidding/rules/validateBid.js:52
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push(
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/bidding/rules/validateBid.js:60
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('You already have the high bid');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/bidding/rules/validateBid.js:65
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push(`Bidding session has ${session.status} status`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/bidding/rules/validateBid.js:70
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Bidding session has expired');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/bidding/rules/validateBid.js:78
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push(`Maximum ${maxRounds} bids per user reached`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/bidding/rules/validateBid.js:84
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push(`Bid cannot exceed $${formatCurrency(maximumAllowed)}`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/bidding/rules/validateBid.js:89
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push(`Bid must be at least $${MIN_BID_AMOUNT}`);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/calculators/availability/calculateAvailableSlots.js:47
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
slots.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/calculators/availability/calculateAvailableSlots.js:172
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
days.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/calculators/payments/calculateGuestPaymentSchedule.js:145
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
paymentDates.push(formatDate(currentDate));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/calculators/payments/calculateGuestPaymentSchedule.js:229
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
rentList.push(cycleRent);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/calculators/payments/calculateHostPaymentSchedule.js:144
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
paymentDates.push(formatDate(currentDate));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/calculators/payments/calculateHostPaymentSchedule.js:236
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
rentList.push(cycleRent);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/calculators/pricing/calculateFeeBreakdown.js:70
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Base price must be a valid number.');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/calculators/pricing/calculateFeeBreakdown.js:74
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Base price must be greater than 0.');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/calculators/pricing/calculateFeeBreakdown.js:78
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
warnings.push('Unknown transaction type. Defaulting to date change.');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/calculators/pricing/calculateFeeBreakdown.js:136
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
components.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/calculators/pricing/calculateFeeBreakdown.js:145
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
components.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/calculators/pricing/calculateFeeBreakdown.js:153
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
components.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/calculators/pricing/calculateFeeBreakdown.js:160
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
components.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/calculators/pricingList/calculateMarkupAndDiscountMultipliersArray.ts:80
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
multipliersArray.push(roundToFourDecimals(multiplier));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/calculators/pricingList/calculateNightlyPricesArray.ts:68
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
pricesArray.push(null);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/calculators/pricingList/calculateNightlyPricesArray.ts:74
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
pricesArray.push(null);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/calculators/pricingList/calculateNightlyPricesArray.ts:80
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
pricesArray.push(roundToTwoDecimals(nightlyPrice));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/calculators/pricingList/calculateUnusedNightsDiscountArray.ts:62
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
discountArray.push(roundToFourDecimals(discount));
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/calculators/scheduling/calculateCheckInOutDays.js:50
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sorted = [...selectedDays].sort((a, b) => a - b)
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 logic/calculators/scheduling/calculateCheckInOutFromDays.js:19
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedDays = [...selectedDays].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 logic/calculators/scheduling/calculateNextAvailableCheckIn.js:56
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sortedDays = [...selectedDayIndices].sort((a, b) => a - b)
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 logic/calculators/scheduling/isContiguousSelection.js:13
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sorted = [...selectedDays].sort((a, b) => a - b);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 logic/processors/houseManual/adaptHouseManualForViewer.js:49
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
sections.sort((a, b) => a.order - b.order);
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 logic/processors/houseManual/adaptHouseManualForViewer.js:109
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
grouped[assignedGroup].push(section);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/processors/leases/sortLeases.js:15
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
sortedLeases.sort((a, b) => {
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 logic/processors/meetings/filterMeetings.js:112
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
return Array.from(hostMap.values()).sort((a, b) =>
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 logic/processors/meetings/filterMeetings.js:150
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
return Array.from(guestMap.values()).sort((a, b) =>
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 logic/processors/meetings/filterMeetings.js:330
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
return [...meetings].sort((a, b) => {
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 logic/processors/meetings/filterMeetings.js:375
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
groups[status].push(meeting);
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/processors/simulation/selectProposalByScheduleType.js:107
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
return [...proposals].sort((a, b) => {
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 logic/rules/scheduling/isScheduleContiguous.js:55
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const sorted = [...selectedDayIndices].sort((a, b) => a - b)
```
**Suggested Fix:** Use toSorted() or toReversed(), or [...arr].sort()
**Rationale:** sort() and reverse() mutate the original array. Use immutable alternatives.

#### 🔴 logic/rules/scheduling/isScheduleContiguous.js:96
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
expectedNotSelected.push(i)
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/workflows/pricingList/__tests__/initializePricingListWorkflow.integration.test.ts:373
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
promises.push(
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/workflows/proposals/counterofferWorkflow.js:159
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/workflows/proposals/counterofferWorkflow.js:168
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/workflows/proposals/counterofferWorkflow.js:177
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/workflows/proposals/counterofferWorkflow.js:186
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/workflows/proposals/counterofferWorkflow.js:195
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
changes.push({
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/workflows/reviews/submitReviewWorkflow.js:108
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Please rate at least one category');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/workflows/reviews/submitReviewWorkflow.js:115
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('All ratings must be between 1 and 5 stars');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/workflows/reviews/submitReviewWorkflow.js:121
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
errors.push('Please provide at least one rating');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 logic/workflows/users/identityVerificationWorkflow.js:82
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
const extension = file.name.split('.').pop() || 'jpg';
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

#### 🔴 routes.config.js:908
**Type:** ViolationType.MUTATING_METHOD
**Current Code:**
```javascript
excludedFromFunctions.push('/guest-proposals', '/guest-proposals/*');
```
**Suggested Fix:** Use spread operator or immutable methods: [...arr, item] instead of arr.push(item)
**Rationale:** Mutating methods modify the original array, making code harder to test and reason about.

### EFFECTS AT EDGES

#### 🔴 logic/processors/contracts/formatCurrencyForTemplate.ts:123
**Type:** ViolationType.IO_IN_CORE
**Current Code:**
```javascript
const response = await fetch(image);
```
**Suggested Fix:** Move I/O to workflow/handler layer. Pass data as parameters instead.
**Rationale:** Pure business logic (calculators/rules/processors) should not perform I/O. This makes testing harder and violates Functional Core principle.

#### 🔴 logic/processors/listing/__tests__/extractListingCoordinates.test.js:169
**Type:** ViolationType.IO_IN_CORE
**Current Code:**
```javascript
expect(console.error).toHaveBeenCalled();
```
**Suggested Fix:** Move I/O to workflow/handler layer. Pass data as parameters instead.
**Rationale:** Pure business logic (calculators/rules/processors) should not perform I/O. This makes testing harder and violates Functional Core principle.

#### 🔴 logic/processors/listing/__tests__/extractListingCoordinates.test.js:327
**Type:** ViolationType.IO_IN_CORE
**Current Code:**
```javascript
expect(console.warn).toHaveBeenCalled();
```
**Suggested Fix:** Move I/O to workflow/handler layer. Pass data as parameters instead.
**Rationale:** Pure business logic (calculators/rules/processors) should not perform I/O. This makes testing harder and violates Functional Core principle.

#### 🔴 logic/processors/listing/extractListingCoordinates.js:49
**Type:** ViolationType.IO_IN_CORE
**Current Code:**
```javascript
console.error(
```
**Suggested Fix:** Move I/O to workflow/handler layer. Pass data as parameters instead.
**Rationale:** Pure business logic (calculators/rules/processors) should not perform I/O. This makes testing harder and violates Functional Core principle.

#### 🔴 logic/processors/listing/extractListingCoordinates.js:65
**Type:** ViolationType.IO_IN_CORE
**Current Code:**
```javascript
console.error('❌ extractListingCoordinates: Failed to parse Location - Address:', {
```
**Suggested Fix:** Move I/O to workflow/handler layer. Pass data as parameters instead.
**Rationale:** Pure business logic (calculators/rules/processors) should not perform I/O. This makes testing harder and violates Functional Core principle.

#### 🔴 logic/processors/listing/extractListingCoordinates.js:99
**Type:** ViolationType.IO_IN_CORE
**Current Code:**
```javascript
console.warn('⚠️ extractListingCoordinates: No valid coordinates found for listing:', {
```
**Suggested Fix:** Move I/O to workflow/handler layer. Pass data as parameters instead.
**Rationale:** Pure business logic (calculators/rules/processors) should not perform I/O. This makes testing harder and violates Functional Core principle.

#### 🔴 logic/processors/simulation/selectProposalByScheduleType.js:57
**Type:** ViolationType.IO_IN_CORE
**Current Code:**
```javascript
console.warn(`[selectProposalByScheduleType] Unknown schedule type: ${scheduleType}`);
```
**Suggested Fix:** Move I/O to workflow/handler layer. Pass data as parameters instead.
**Rationale:** Pure business logic (calculators/rules/processors) should not perform I/O. This makes testing harder and violates Functional Core principle.

#### 🔴 logic/processors/user/__tests__/processProfilePhotoUrl.test.js:235
**Type:** ViolationType.IO_IN_CORE
**Current Code:**
```javascript
photoUrl: 'https://xyz.supabase.co/storage/v1/object/public/avatars/user123.jpg'
```
**Suggested Fix:** Move I/O to workflow/handler layer. Pass data as parameters instead.
**Rationale:** Pure business logic (calculators/rules/processors) should not perform I/O. This makes testing harder and violates Functional Core principle.

#### 🔴 logic/processors/user/__tests__/processProfilePhotoUrl.test.js:237
**Type:** ViolationType.IO_IN_CORE
**Current Code:**
```javascript
expect(result).toBe('https://xyz.supabase.co/storage/v1/object/public/avatars/user123.jpg');
```
**Suggested Fix:** Move I/O to workflow/handler layer. Pass data as parameters instead.
**Rationale:** Pure business logic (calculators/rules/processors) should not perform I/O. This makes testing harder and violates Functional Core principle.

#### 🔴 logic/rules/proposals/proposalRules.js:306
**Type:** ViolationType.IO_IN_CORE
**Current Code:**
```javascript
console.warn('[getCancellationReasonOptions] Cache empty, using fallback values');
```
**Suggested Fix:** Move I/O to workflow/handler layer. Pass data as parameters instead.
**Rationale:** Pure business logic (calculators/rules/processors) should not perform I/O. This makes testing harder and violates Functional Core principle.

#### 🔴 logic/rules/users/__tests__/hasProfilePhoto.test.js:170
**Type:** ViolationType.IO_IN_CORE
**Current Code:**
```javascript
photoUrl: 'https://xyz.supabase.co/storage/v1/object/public/avatars/user123.jpg'
```
**Suggested Fix:** Move I/O to workflow/handler layer. Pass data as parameters instead.
**Rationale:** Pure business logic (calculators/rules/processors) should not perform I/O. This makes testing harder and violates Functional Core principle.

### DECLARATIVE STYLE

#### 🔴 __tests__/integration/booking-flow.test.js:113
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 __tests__/integration/booking-flow.test.js:129
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 __tests__/regression/REG-001-fk-constraint-violation.test.js:31
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const [key, value] of Object.entries(formData)) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/AccountProfilePage/components/cards/ListingsCard.jsx:30
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const photo of sortedPhotos) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/CoHostRequestsPage/components/Pagination.jsx:24
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i <= totalPages; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/CoHostRequestsPage/components/Pagination.jsx:49
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = start; i <= end; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/FAQPage.jsx:77
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const [tabName, dbCategory] of Object.entries(categoryMapping)) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/FavoriteListingsPage/FavoriteListingsPage.jsx:786
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < sortedJsDays.length - 1; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/FavoriteListingsPage/components/SplitScheduleSelector.jsx:49
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
while (current < checkOut) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/HostExperienceReviewPage/useHostExperienceReviewPageLogic.js:161
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const field of stepConfig.fields) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/HostProposalsPage/types.js:253
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
while (current !== checkOutIndex) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/HostProposalsPage/types.js:351
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/HostProposalsPage/types.js:423
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < sortedNights.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/HostProposalsPage/types.js:549
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const proposal of proposals) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ListWithUsPage.jsx:26
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < 7; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx:46
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
while (current <= end) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx:108
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = startPadding - 1; i >= 0; i--) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx:120
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i <= daysInMonth; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx:134
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i <= remaining; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ListingDashboardPage/components/NightlyPricingLegend.jsx:26
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = nightsPerWeekMin; i <= nightsPerWeekMax; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ListingDashboardPage/hooks/useListingData.js:498
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const [key, value] of Object.entries(updates)) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ListingDashboardPage/hooks/usePhotoManagement.js:44
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < newPhotos.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ListingDashboardPage/hooks/usePhotoManagement.js:79
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < newPhotos.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ListingsOverviewPage/api.js:342
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const id of listingIds) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ManageLeasesPaymentRecordsPage/components/CalendarSection/MonthCalendar.jsx:31
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < 42; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/MessagingPage/useMessagingPageLogic.js:1131
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < sortedJsDays.length - 1; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ModifyListingsPage/useModifyListingsPageLogic.js:424
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const [key, value] of Object.entries(listing)) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/PreviewSplitLeasePage.jsx:882
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const [key, value] of Object.entries(updates)) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ProposalManagePage/useProposalManagePageLogic.js:91
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < ids.length; i += batchSize) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/QuickPricePage/useQuickPricePageLogic.js:343
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const [frontendKey, dbKey] of Object.entries(fieldMap)) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/QuickPricePage/useQuickPricePageLogic.js:376
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const [frontendKey] of Object.entries(fieldMap)) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ScheduleDashboard/components/ScheduleCalendar.jsx:102
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < firstDayOfMonth; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ScheduleDashboard/components/ScheduleCalendar.jsx:107
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let day = 1; day <= daysInMonth; day++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ScheduleDashboard/components/ScheduleCalendar.jsx:129
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const userDate of userDates) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ScheduleDashboard/components/ScheduleCalendar.jsx:358
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < calendarDays.length; i += 7) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ScheduleDashboard/state/validators.js:12
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const night of nights || []) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ScheduleDashboard/state/validators.js:23
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const night of nights || []) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ScheduleDashboard/state/validators.js:32
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const night of nights || []) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ScheduleDashboard/useScheduleDashboardLogic.js:84
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const txn of completedTxns) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ScheduleDashboard/useScheduleDashboardLogic.js:258
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < 14; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ScheduleDashboard/useScheduleDashboardLogic.js:306
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const nightStr of scheduleState.userNights) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ScheduleDashboard/useScheduleDashboardLogic.js:360
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const nightStr of scheduleState.roommateNights) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/SelfListingPage/components/NightlyPriceSlider.tsx:70
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < N; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/SelfListingPage/sections/Section5Rules.tsx:103
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
while (current <= end) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/SelfListingPage/sections/Section5Rules.tsx:141
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < startingDayOfWeek; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/SelfListingPage/sections/Section5Rules.tsx:146
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let d = 1; d <= daysInMonth; d++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/SelfListingPageV2/SelfListingPageV2.tsx:542
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < 7; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/SelfListingPageV2/SelfListingPageV2.tsx:550
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < numNights && i < prices.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/SimulationGuestsideDemoPage/constants/simulationSteps.js:144
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < currentIndex; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/SimulationHostsideDemoPage/constants/simulationSteps.js:92
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < currentStepNumber && i < STEP_ORDER.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ViewSplitLeasePage/ViewSplitLeasePage.tsx:702
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < sortedJsDays.length - 1; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ViewSplitLeasePage_LEGACY/ViewSplitLeasePage.jsx:1087
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < sortedJsDays.length - 1; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ZPricingUnitTestPage/components/Section5PricingListGrid.jsx:30
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < 7; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ZUnitPaymentRecordsJsPage/ZUnitPaymentRecordsJsPage.jsx:258
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let y = currentYear - 5; y <= currentYear + 5; y++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ZUnitPaymentRecordsJsPage/useZUnitPaymentRecordsJsPageLogic.js:576
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < startDayOfWeek; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/ZUnitPaymentRecordsJsPage/useZUnitPaymentRecordsJsPageLogic.js:584
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let day = 1; day <= daysInMonth; day++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/guest-leases/useGuestLeasesPageLogic.js:393
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const photo of photos) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/proposals/CounterofferSummarySection.jsx:33
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
while ((match = bbcodeRegex.exec(text)) !== null) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/proposals/ExpandableProposalCard.jsx:169
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/proposals/ExpandableProposalCard.jsx:247
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/proposals/LeaseCalendarSection.jsx:67
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < 42; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/pages/proposals/ProposalCard.jsx:153
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/AIRoomRedesign/fileUtils.js:123
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < byteCharacters.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/AiSignupMarketReport/AiSignupMarketReport.jsx:46
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const pattern of namePatterns) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/AiSignupMarketReport/AiSignupMarketReport.jsx:110
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const pattern of standardPhonePatterns) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/AiSignupMarketReport/AiSignupMarketReport.jsx:122
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const pattern of explicitPhonePatterns) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/AiSignupMarketReport/AiSignupMarketReport.jsx:1001
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const topic of FREEFORM_TOPICS) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/CreateProposalFlowV2.jsx:265
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < dayNumbers.length - 1; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/CreateProposalFlowV2Components/DaysSelectionSection.jsx:72
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < sorted.length - 1; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/CustomDatePicker/CustomDatePicker.jsx:149
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < firstDay; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/CustomDatePicker/CustomDatePicker.jsx:154
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let day = 1; day <= daysInMonth; day++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/DateChangeRequestManager/dateUtils.js:41
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < startingDayOfWeek; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/DateChangeRequestManager/dateUtils.js:46
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let day = 1; day <= daysInMonth; day++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/EditListingDetails/useEditListingDetailsLogic.js:517
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const [key, value] of Object.entries(formData)) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/EditListingDetails/useEditListingDetailsLogic.js:845
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < files.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/HeaderMessagingPanel/useHeaderMessagingPanelLogic.js:223
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < sortedJsDays.length - 1; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/HostEditingProposal/types.js:149
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < sorted.length - 1; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/HostEditingProposal/types.js:181
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < sorted.length - 1; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/HostScheduleSelector/utils.js:29
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < numbers.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/HostScheduleSelector/utils.js:59
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = startIdx; i <= endIdx; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/HostScheduleSelector/utils.js:64
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = startIdx; i >= endIdx; i--) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/RentalApplicationWizardModal/useRentalApplicationWizardLogic.js:257
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < startStep; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/RentalApplicationWizardModal/useRentalApplicationWizardLogic.js:576
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let step = 1; step <= TOTAL_STEPS; step++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/ScheduleCohost/cohostService.js:40
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < totalDays; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/ScheduleCohost/cohostService.js:61
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let hour = startHour; hour < endHour; hour++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/ScheduleCohost/cohostService.js:62
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let minutes = 0; minutes < 60; minutes += intervalMinutes) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/SearchScheduleSelector.jsx:377
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < sortedDays.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/SearchScheduleSelector.jsx:399
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < sortedUnselected.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/SearchScheduleSelector.jsx:500
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < dayCount; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/SearchScheduleSelector.jsx:611
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < sortedDays.length - 1; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/SignUpTrialHost/validation.js:113
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const field of fields) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/UrgencyCountdown/__tests__/urgencyCalculations.test.ts:148
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < pricing.projections.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:65
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < lookupKeys.length - 1; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:256
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i <= forecastDays; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/VirtualMeetingManager/dateUtils.js:71
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let hour = startHour; hour < endHour; hour++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/VirtualMeetingManager/dateUtils.js:72
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let minute = 0; minute < 60; minute += interval) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/VirtualMeetingManager/dateUtils.js:95
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < startingDayOfWeek; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/VirtualMeetingManager/dateUtils.js:100
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let day = 1; day <= daysInMonth; day++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/VirtualMeetingManager/virtualMeetingService.js:312
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let attempt = 0; attempt < maxRetries; attempt++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 islands/shared/VisitReviewerHouseManual/visitReviewerService.js:222
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const field of ratingFields) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/__tests__/sanitize.test.js:594
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < 10; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/__tests__/sanitize.test.js:602
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < 10; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/__tests__/sanitize.test.js:610
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < 3; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/__tests__/sanitize.test.js:617
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < 10; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/auth.js:571
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
while (verifyAttempts < maxVerifyAttempts) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/auth.js:794
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
while (verifyAttempts < maxVerifyAttempts) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/auth/login.js:130
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
while (verifyAttempts < maxVerifyAttempts) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/auth/signup.js:184
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
while (verifyAttempts < maxVerifyAttempts) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/availabilityValidation.js:38
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/availabilityValidation.js:65
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = minNotSelected; i <= maxNotSelected; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/availabilityValidation.js:106
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/ctaConfig.js:224
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const cta of data) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/ctaConfig.js:269
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const [key, value] of Object.entries(context)) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/listingService.js:835
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const day of dayOrder) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/listingService.js:1051
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const [key, value] of Object.entries(formData)) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/listingService.js:1145
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const [day, isSelected] of Object.entries(availableNights)) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/listingService.js:1309
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const dayNum of daysArray) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/parseBBCode.js:56
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const { pattern } of BBCODE_PATTERNS) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/parseBBCode.js:100
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
while ((match = boldPattern.exec(text)) !== null) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/parseBBCode.js:111
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
while ((match = italicPattern.exec(text)) !== null) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/parseBBCode.js:122
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
while ((match = colorPattern.exec(text)) !== null) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/parseBBCode.js:139
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const m of matches) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/parseBBCode.js:147
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const m of filteredMatches) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/photoUpload.js:28
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let offset = 0; offset < byteCharacters.length; offset += 512) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/photoUpload.js:32
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < slice.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/photoUpload.js:164
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < photos.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/proposalService.js:37
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < sortedJsDays.length - 1; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/scheduleSelector/dayHelpers.js:112
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < sortedDays.length - 1; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/scheduleSelector/goldenScheduleValidator.js:118
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < sorted.length - 1; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/scheduleSelector/multiCheckScheduleValidator.js:25
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < sortedDays.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/scheduleSelector/nightCalculations.js:14
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < sorted.length - 1; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/scheduleSelector/nightCalculations.js:50
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < dayNumbers.length - 1; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/scheduleSelector/validators.js:101
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = minNotSelected; i <= maxNotSelected; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/scheduleSelector/validators.js:114
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < dayNumbers.length - 1; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/secureStorage.js:235
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < localStorage.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/supabaseUtils.js:145
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const photo of photos) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/supabaseUtils.js:225
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const [key, amenity] of Object.entries(amenitiesMap)) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 lib/workflowClient.js:139
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
while (Date.now() - startTime < timeout) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/availability/calculateAvailableSlots.js:46
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let hour = startHour; hour < endHour; hour++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/availability/calculateAvailableSlots.js:167
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < 7; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/buyout/calculateNoticePricing.js:109
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const dateStr of dates) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/matching/__tests__/calculateDurationScore.test.js:145
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const nights of scenarios) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/matching/__tests__/calculateHostScore.test.js:288
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const { data, expected } of testCases) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/payments/calculateGuestPaymentSchedule.js:144
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < numberOfPaymentCycles; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/payments/calculateGuestPaymentSchedule.js:213
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < numberOfPaymentCycles; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/payments/calculateHostPaymentSchedule.js:143
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < numberOfPaymentCycles; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/payments/calculateHostPaymentSchedule.js:218
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < numberOfPaymentCycles; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/pricing/__tests__/getNightlyRateByFrequency.test.js:475
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < rates.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/pricingList/__tests__/calculateMarkupAndDiscountMultipliersArray.integration.test.ts:80
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < 6; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/pricingList/__tests__/calculateMarkupAndDiscountMultipliersArray.integration.test.ts:119
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < 6; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/pricingList/__tests__/calculateMarkupAndDiscountMultipliersArray.integration.test.ts:177
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < 5; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/pricingList/__tests__/calculateNightlyPricesArray.integration.test.ts:218
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < result.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/pricingList/__tests__/calculateUnusedNightsDiscountArray.integration.test.ts:115
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < result.length - 1; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/pricingList/calculateMarkupAndDiscountMultipliersArray.ts:70
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let nightIndex = 0; nightIndex < PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH; nightIndex++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/pricingList/calculateNightlyPricesArray.ts:62
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < PRICING_CONSTANTS.PRICING_LIST_ARRAY_LENGTH; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/pricingList/calculateSlope.ts:49
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < nightlyPrices.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/pricingList/calculateUnusedNightsDiscountArray.ts:53
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let nightIndex = 0; nightIndex < maxNights; nightIndex++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/scheduling/__tests__/calculateCheckInOutDays.test.js:284
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const days of testCases) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/scheduling/calculateCheckInOutDays.js:59
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/calculators/scheduling/calculateCheckInOutFromDays.js:27
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < sortedDays.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/processors/contracts/formatCurrencyForTemplate.ts:115
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < binaryString.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/processors/houseManual/adaptHouseManualForViewer.js:96
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const section of sections) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/processors/houseManual/adaptHouseManualForViewer.js:102
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const [groupName, categories] of Object.entries(SECTION_CATEGORIES)) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/rules/experienceSurvey/isStepComplete.js:23
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const field of stepConfig.fields) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/rules/matching/__tests__/isVerifiedHost.test.js:440
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const tc of testCases) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/rules/pricingList/canCalculatePricing.ts:50
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const field of rateFields) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/rules/pricingList/isPricingListValid.ts:52
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const field of arrayFields) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/rules/pricingList/isPricingListValid.ts:56
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const name of possibleNames) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/rules/pricingList/shouldRecalculatePricing.ts:58
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const { field, index } of rateFieldMapping) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/rules/proposals/__tests__/canAcceptProposal.test.js:170
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const status of statuses) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/rules/proposals/__tests__/canCancelProposal.test.js:154
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const status of statuses) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/rules/proposals/__tests__/canEditProposal.test.js:297
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const status of earlyStatuses) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/rules/proposals/__tests__/canEditProposal.test.js:312
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const status of lateStatuses) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/rules/proposals/__tests__/canEditProposal.test.js:326
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const status of terminalStatuses) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/rules/proposals/__tests__/determineProposalStage.test.js:282
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const status of allStages) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/rules/proposals/__tests__/determineProposalStage.test.js:402
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const status of allStatuses) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/rules/scheduling/isScheduleContiguous.js:64
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 1; i < sorted.length; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/rules/scheduling/isScheduleContiguous.js:95
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = minNotSelected; i <= maxNotSelected; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/rules/simulation/canProgressToStep.js:87
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const stepId of stepOrder) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/workflows/auth/__tests__/checkAuthStatusWorkflow.test.js:344
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const scenario of scenarios) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/workflows/contracts/generateContractWorkflow.ts:196
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < 13; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 logic/workflows/pricingList/__tests__/initializePricingListWorkflow.integration.test.ts:372
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (let i = 0; i < 10; i++) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🔴 routes.config.js:985
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const route of routes) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🟡 islands/pages/HostOverviewPage/useHostOverviewPageLogic.js:47
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const { pattern, name } of boroughPatterns) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🟡 islands/pages/ModifyListingsPage/sections/PhotosSection.jsx:46
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const file of files) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🟡 islands/pages/ModifyListingsPage/useModifyListingsPageLogic.js:561
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const [key, value] of Object.entries(listing)) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🟡 islands/pages/ScheduleDashboard/state/validators.js:5
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const [userId, nights] of entries) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🟡 islands/pages/proposals/ExpandableProposalCard.jsx:545
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const entry of entries) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🟡 islands/shared/AiSignupMarketReport/AiSignupMarketReport.jsx:985
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const [topic, pattern] of Object.entries(topicPatterns)) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🟡 islands/shared/GoogleMap.jsx:877
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
logger.debug('⚠️ GoogleMap: No all listings to create grey markers for (showAllListings:', showAllListings, ', listings.length:', listings?.length, ')');
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🟡 lib/sanitize.js:252
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const [key, record] of rateLimitMap.entries()) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🟡 logic/calculators/scheduling/calculateCheckInOutDays.js:42
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const day of selectedDays) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🟡 logic/calculators/scheduling/calculateNextAvailableCheckIn.js:38
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const day of selectedDayIndices) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🟡 logic/calculators/scheduling/calculateNightsFromDays.js:28
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const day of selectedDays) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🟡 logic/rules/matching/__tests__/isDurationMatch.test.js:176
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const n of nights) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🟡 logic/rules/scheduling/isScheduleContiguous.js:46
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const day of selectedDayIndices) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🟡 routes.config.js:946
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const alias of route.aliases) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

#### 🟡 routes.config.js:969
**Type:** ViolationType.IMPERATIVE_LOOP
**Current Code:**
```javascript
for (const route of routes) {
```
**Suggested Fix:** Replace with map/filter/reduce or other declarative array methods
**Rationale:** Declarative array methods (map/filter/reduce) are more expressive and less error-prone than imperative loops.

### ERRORS AS VALUES

#### 🟡 TestContractsPage.jsx:408
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`Invalid JSON: ${parseError.message}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 TestContractsPage.jsx:408
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`Invalid JSON: ${parseError.message}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 hooks/useBiddingRealtime.js:259
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Session ID and User ID required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 hooks/useBiddingRealtime.js:259
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Session ID and User ID required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 hooks/useBiddingRealtime.js:307
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Session ID and User ID required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 hooks/useBiddingRealtime.js:307
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Session ID and User ID required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 hooks/useBiddingRealtime.js:345
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Session ID and User ID required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 hooks/useBiddingRealtime.js:345
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Session ID and User ID required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/modals/useCompareTermsModalLogic.js:324
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Invalid response from lease service. Please contact support.');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/modals/useCompareTermsModalLogic.js:324
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Invalid response from lease service. Please contact support.');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/pages/CreateSuggestedProposalPage/suggestedProposalService.js:407
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('AI returned invalid JSON response');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/pages/CreateSuggestedProposalPage/suggestedProposalService.js:407
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('AI returned invalid JSON response');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/pages/HostLeasesPage/useHostLeasesPageLogic.js:421
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Authentication required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/pages/HostLeasesPage/useHostLeasesPageLogic.js:421
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Authentication required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/pages/ListingDashboardPage/context/ListingDashboardContext.jsx:18
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('useListingDashboard must be used within ListingDashboardProvider');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/pages/ListingDashboardPage/context/ListingDashboardContext.jsx:18
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('useListingDashboard must be used within ListingDashboardProvider');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/pages/ScheduleDashboard/state/validators.js:16
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`Cannot transfer night ${nightString}: owned by ${owner || 'none'}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/pages/ScheduleDashboard/state/validators.js:16
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`Cannot transfer night ${nightString}: owned by ${owner || 'none'}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/pages/ScheduleDashboard/state/validators.js:36
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`Cannot swap night ${nightString}: owned by ${owner || 'none'}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/pages/ScheduleDashboard/state/validators.js:36
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`Cannot swap night ${nightString}: owned by ${owner || 'none'}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/pages/SearchPage.jsx:704
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Authentication required. Please log in again.');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/pages/SearchPage.jsx:704
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Authentication required. Please log in again.');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/pages/ViewSplitLeasePage/useViewSplitLeaseLogic.ts:462
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Authentication required. Please log in again.');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/pages/ViewSplitLeasePage/useViewSplitLeaseLogic.ts:462
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Authentication required. Please log in again.');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/pages/useRentalApplicationPageLogic.js:885
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('You must be logged in to submit a rental application.');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/pages/useRentalApplicationPageLogic.js:885
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('You must be logged in to submit a rental application.');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/AiSignupMarketReport/AiSignupMarketReport.jsx:576
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Email is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/AiSignupMarketReport/AiSignupMarketReport.jsx:576
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Email is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/AiSignupMarketReport/AiSignupMarketReport.jsx:581
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Market research description is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/AiSignupMarketReport/AiSignupMarketReport.jsx:581
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Market research description is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/QRCodeDashboard/qrCodeDashboardService.js:102
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('House manual ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/QRCodeDashboard/qrCodeDashboardService.js:102
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('House manual ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/QRCodeDashboard/qrCodeDashboardService.js:139
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('House manual ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/QRCodeDashboard/qrCodeDashboardService.js:139
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('House manual ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/QRCodeDashboard/qrCodeDashboardService.js:176
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('QR code data and house manual ID are required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/QRCodeDashboard/qrCodeDashboardService.js:176
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('QR code data and house manual ID are required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/QRCodeDashboard/qrCodeDashboardService.js:216
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('QR code ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/QRCodeDashboard/qrCodeDashboardService.js:216
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('QR code ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/QRCodeDashboard/qrCodeDashboardService.js:264
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('QR code ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/QRCodeDashboard/qrCodeDashboardService.js:264
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('QR code ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/QRCodeDashboard/qrCodeDashboardService.js:297
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('At least one QR code ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/QRCodeDashboard/qrCodeDashboardService.js:297
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('At least one QR code ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/RentalApplicationWizardModal/useRentalApplicationWizardLogic.js:867
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('You must be logged in to submit.');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/RentalApplicationWizardModal/useRentalApplicationWizardLogic.js:867
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('You must be logged in to submit.');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:505
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Invalid targetDate: must be a Date object');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:505
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Invalid targetDate: must be a Date object');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:509
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Invalid basePrice: must be greater than 0');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:509
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Invalid basePrice: must be greater than 0');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:513
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Invalid urgencySteepness: must be greater than 0');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:513
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Invalid urgencySteepness: must be greater than 0');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:517
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Invalid marketDemandMultiplier: must be greater than 0');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:517
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Invalid marketDemandMultiplier: must be greater than 0');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:521
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Invalid dates: targetDate must be after currentDate');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts:521
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Invalid dates: targetDate must be after currentDate');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/UsabilityPopup/useUsabilityPopupLogic.js:146
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Invalid phone number format');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/UsabilityPopup/useUsabilityPopupLogic.js:146
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Invalid phone number format');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/VisitReviewerHouseManual/visitReviewerService.js:100
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(responseData?.error || 'Invalid access token');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 islands/shared/VisitReviewerHouseManual/visitReviewerService.js:100
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(responseData?.error || 'Invalid access token');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/bubbleAPI.js:44
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Listing name is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/bubbleAPI.js:44
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Listing name is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/bubbleAPI.js:88
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Listing ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/bubbleAPI.js:88
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Listing ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/bubbleAPI.js:135
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Listing ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/bubbleAPI.js:135
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Listing ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/bubbleAPI.js:139
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('At least one photo is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/bubbleAPI.js:139
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('At least one photo is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/bubbleAPI.js:190
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Listing ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/bubbleAPI.js:190
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Listing ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/bubbleAPI.js:194
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('User email is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/bubbleAPI.js:194
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('User email is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/bubbleAPI.js:198
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Listing data is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/bubbleAPI.js:198
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Listing data is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/guestRelationshipsApi.js:30
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Authentication required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/guestRelationshipsApi.js:30
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Authentication required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/listingService.js:250
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('User ID is required to create a listing');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/listingService.js:250
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('User ID is required to create a listing');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/listingService.js:859
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Listing ID is required for update');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/listingService.js:859
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Listing ID is required for update');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/listingService.js:1072
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Listing ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/listingService.js:1072
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Listing ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/photoUpload.js:112
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`Invalid photo format for photo ${index + 1}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/photoUpload.js:112
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`Invalid photo format for photo ${index + 1}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/scheduleSelector/goldenScheduleValidator.js:26
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('selectedDayIndices must be an array');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/scheduleSelector/goldenScheduleValidator.js:26
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('selectedDayIndices must be an array');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/slackService.js:30
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('All fields are required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/slackService.js:30
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('All fields are required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/supabase.js:7
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 lib/supabase.js:7
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/bidding/processors/determineWinner.js:33
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Cannot determine winner: No bids in session');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/bidding/processors/determineWinner.js:33
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Cannot determine winner: No bids in session');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/bidding/processors/determineWinner.js:38
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Cannot determine winner: Must have exactly 2 participants');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/bidding/processors/determineWinner.js:38
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Cannot determine winner: Must have exactly 2 participants');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/bidding/processors/determineWinner.js:46
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Cannot find winner/loser in participants');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/bidding/processors/determineWinner.js:46
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Cannot find winner/loser in participants');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateGuestPaymentSchedule.js:50
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('moveInDate is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateGuestPaymentSchedule.js:50
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('moveInDate is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateGuestPaymentSchedule.js:75
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`Invalid date format: ${dateStr}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateGuestPaymentSchedule.js:75
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`Invalid date format: ${dateStr}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateGuestPaymentSchedule.js:100
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('reservationSpanMonths is required for Monthly rental type');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateGuestPaymentSchedule.js:100
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('reservationSpanMonths is required for Monthly rental type');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateGuestPaymentSchedule.js:109
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('reservationSpanWeeks is required for Nightly and Weekly rental types');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateGuestPaymentSchedule.js:109
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('reservationSpanWeeks is required for Nightly and Weekly rental types');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateGuestPaymentSchedule.js:289
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error("rentalType is required and must be one of: 'Nightly', 'Weekly', 'Monthly'");
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateGuestPaymentSchedule.js:289
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error("rentalType is required and must be one of: 'Nightly', 'Weekly', 'Monthly'");
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateGuestPaymentSchedule.js:301
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('fourWeekRent is required for Nightly and Weekly rental types and must be a positive number');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateGuestPaymentSchedule.js:301
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('fourWeekRent is required for Nightly and Weekly rental types and must be a positive number');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateGuestPaymentSchedule.js:305
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('rentPerMonth is required for Monthly rental type and must be a positive number');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateGuestPaymentSchedule.js:305
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('rentPerMonth is required for Monthly rental type and must be a positive number');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateGuestPaymentSchedule.js:310
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('maintenanceFee must be a number');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateGuestPaymentSchedule.js:310
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('maintenanceFee must be a number');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateHostPaymentSchedule.js:49
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('moveInDate is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateHostPaymentSchedule.js:49
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('moveInDate is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateHostPaymentSchedule.js:74
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`Invalid date format: ${dateStr}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateHostPaymentSchedule.js:74
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`Invalid date format: ${dateStr}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateHostPaymentSchedule.js:99
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('reservationSpanMonths is required for Monthly rental type');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateHostPaymentSchedule.js:99
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('reservationSpanMonths is required for Monthly rental type');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateHostPaymentSchedule.js:108
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('reservationSpanWeeks is required for Nightly and Weekly rental types');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateHostPaymentSchedule.js:108
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('reservationSpanWeeks is required for Nightly and Weekly rental types');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateHostPaymentSchedule.js:286
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error("rentalType is required and must be one of: 'Nightly', 'Weekly', 'Monthly'");
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateHostPaymentSchedule.js:286
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error("rentalType is required and must be one of: 'Nightly', 'Weekly', 'Monthly'");
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateHostPaymentSchedule.js:298
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('fourWeekRent is required for Nightly and Weekly rental types and must be a positive number');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateHostPaymentSchedule.js:298
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('fourWeekRent is required for Nightly and Weekly rental types and must be a positive number');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateHostPaymentSchedule.js:302
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('rentPerMonth is required for Monthly rental type and must be a positive number');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateHostPaymentSchedule.js:302
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('rentPerMonth is required for Monthly rental type and must be a positive number');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateHostPaymentSchedule.js:307
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('maintenanceFee must be a number');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/payments/calculateHostPaymentSchedule.js:307
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('maintenanceFee must be a number');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/pricingList/calculateProratedNightlyRate.ts:29
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('calculateProratedNightlyRate: weeklyHostRate required for Weekly rental');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/pricingList/calculateProratedNightlyRate.ts:29
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('calculateProratedNightlyRate: weeklyHostRate required for Weekly rental');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/pricingList/calculateProratedNightlyRate.ts:37
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('calculateProratedNightlyRate: monthlyHostRate required for Monthly rental');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/pricingList/calculateProratedNightlyRate.ts:37
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('calculateProratedNightlyRate: monthlyHostRate required for Monthly rental');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/pricingList/calculateProratedNightlyRate.ts:40
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('calculateProratedNightlyRate: avgDaysPerMonth must be positive');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/pricingList/calculateProratedNightlyRate.ts:40
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('calculateProratedNightlyRate: avgDaysPerMonth must be positive');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/pricingList/calculateProratedNightlyRate.ts:50
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('calculateProratedNightlyRate: nightlyRates must be array with at least 4 elements');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/pricingList/calculateProratedNightlyRate.ts:50
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('calculateProratedNightlyRate: nightlyRates must be array with at least 4 elements');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/reminders/calculateNextSendTime.js:21
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('calculateNextSendTime: scheduledDateTime is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/reminders/calculateNextSendTime.js:21
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('calculateNextSendTime: scheduledDateTime is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/reminders/calculateNextSendTime.js:29
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('calculateNextSendTime: invalid scheduledDateTime format');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/reminders/calculateNextSendTime.js:29
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('calculateNextSendTime: invalid scheduledDateTime format');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/scheduling/calculateCheckInOutFromDays.js:16
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('calculateCheckInOutFromDays: selectedDays must contain at least 2 days');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/calculators/scheduling/calculateCheckInOutFromDays.js:16
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('calculateCheckInOutFromDays: selectedDays must contain at least 2 days');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/contracts/formatCurrencyForTemplate.ts:131
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`Invalid image input: must be base64 or URL`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/contracts/formatCurrencyForTemplate.ts:131
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`Invalid image input: must be base64 or URL`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/display/formatHostName.js:33
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('formatHostName: fullName cannot be empty or whitespace')
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/display/formatHostName.js:33
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('formatHostName: fullName cannot be empty or whitespace')
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/matching/adaptCandidateListing.js:37
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('adaptCandidateListing: rawListing is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/matching/adaptCandidateListing.js:37
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('adaptCandidateListing: rawListing is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/matching/adaptProposalForMatching.js:31
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('adaptProposalForMatching: rawProposal is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/matching/adaptProposalForMatching.js:31
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('adaptProposalForMatching: rawProposal is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/matching/formatMatchResult.js:65
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('formatMatchResult: listing is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/matching/formatMatchResult.js:65
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('formatMatchResult: listing is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/matching/formatMatchResult.js:69
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('formatMatchResult: scores is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/matching/formatMatchResult.js:69
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('formatMatchResult: scores is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/pricingList/adaptPricingListForSupabase.ts:41
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('adaptPricingListForSupabase: pricingList is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/pricingList/adaptPricingListForSupabase.ts:41
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('adaptPricingListForSupabase: pricingList is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/pricingList/adaptPricingListFromSupabase.ts:43
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('adaptPricingListFromSupabase: rawPricingList is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/pricingList/adaptPricingListFromSupabase.ts:43
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('adaptPricingListFromSupabase: rawPricingList is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/pricingList/extractHostRatesFromListing.ts:44
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('extractHostRatesFromListing: listing is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/pricingList/extractHostRatesFromListing.ts:44
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('extractHostRatesFromListing: listing is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/pricingList/formatPricingListForDisplay.ts:48
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('formatPricingListForDisplay: pricingList is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/pricingList/formatPricingListForDisplay.ts:48
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('formatPricingListForDisplay: pricingList is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/proposal/processProposalData.js:39
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processProposalData: rawProposal cannot be null or undefined')
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/proposal/processProposalData.js:39
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processProposalData: rawProposal cannot be null or undefined')
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/proposals/processProposalData.js:26
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processListingData: Listing data is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/proposals/processProposalData.js:26
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processListingData: Listing data is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/proposals/processProposalData.js:62
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processHostData: Host data is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/proposals/processProposalData.js:62
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processHostData: Host data is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/proposals/processProposalData.js:88
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processVirtualMeetingData: Virtual meeting data is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/proposals/processProposalData.js:88
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processVirtualMeetingData: Virtual meeting data is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/proposals/processProposalData.js:115
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processProposalData: Proposal data is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/proposals/processProposalData.js:115
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processProposalData: Proposal data is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/proposals/processProposalData.js:119
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processProposalData: Proposal ID (_id) is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/proposals/processProposalData.js:119
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processProposalData: Proposal ID (_id) is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/proposals/processProposalData.js:258
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('getEffectiveTerms: Proposal is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/proposals/processProposalData.js:258
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('getEffectiveTerms: Proposal is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/reviews/reviewAdapter.js:45
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('adaptReviewForSubmission: missing required IDs');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/reviews/reviewAdapter.js:45
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('adaptReviewForSubmission: missing required IDs');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/user/processUserData.js:25
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processUserData: User data is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/user/processUserData.js:25
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processUserData: User data is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/user/processUserData.js:29
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processUserData: User ID (_id) is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/user/processUserData.js:29
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processUserData: User ID (_id) is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/user/processUserDisplayName.js:27
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processUserDisplayName requires a valid firstName. Cannot display user without name.');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/user/processUserDisplayName.js:27
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processUserDisplayName requires a valid firstName. Cannot display user without name.');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/user/processUserInitials.js:25
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processUserInitials requires a valid firstName. Cannot generate initials without user name.');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/processors/user/processUserInitials.js:25
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('processUserInitials requires a valid firstName. Cannot generate initials without user name.');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/rules/houseManual/isManualExpired.js:67
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Invalid creation date');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/rules/houseManual/isManualExpired.js:67
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Invalid creation date');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/rules/pricingList/canCalculatePricing.ts:37
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('canCalculatePricing: listing is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/rules/pricingList/canCalculatePricing.ts:37
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('canCalculatePricing: listing is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/rules/pricingList/shouldRecalculatePricing.ts:32
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('shouldRecalculatePricing: listing is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/rules/pricingList/shouldRecalculatePricing.ts:32
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('shouldRecalculatePricing: listing is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/rules/proposals/determineProposalStage.js:29
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('determineProposalStage: proposalStatus is required and must be a string')
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/rules/proposals/determineProposalStage.js:29
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('determineProposalStage: proposalStatus is required and must be a string')
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/rules/search/hasListingPhotos.js:23
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('hasListingPhotos: listing cannot be null or undefined')
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/rules/search/hasListingPhotos.js:23
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('hasListingPhotos: listing cannot be null or undefined')
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/rules/users/shouldShowFullName.js:24
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('shouldShowFullName requires a valid firstName');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/rules/users/shouldShowFullName.js:24
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('shouldShowFullName requires a valid firstName');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/rules/users/shouldShowFullName.js:29
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('shouldShowFullName requires isMobile to be a boolean');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/rules/users/shouldShowFullName.js:29
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('shouldShowFullName requires isMobile to be a boolean');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/validators/pricingValidators.js:10
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be a non-negative number, got ${typeof value}: ${value}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/validators/pricingValidators.js:10
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be a non-negative number, got ${typeof value}: ${value}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/validators/pricingValidators.js:23
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be a positive integer, got ${typeof value}: ${value}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/validators/pricingValidators.js:23
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be a positive integer, got ${typeof value}: ${value}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/validators/pricingValidators.js:36
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be a number, got ${typeof value}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/validators/pricingValidators.js:36
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be a number, got ${typeof value}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/validators/pricingValidators.js:49
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be positive, got ${value}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/validators/pricingValidators.js:49
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be positive, got ${value}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/validators/pricingValidators.js:64
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be between ${min}-${max} nights, got ${value}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/validators/pricingValidators.js:64
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`${functionName}: ${paramName} must be between ${min}-${max} nights, got ${value}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/booking/acceptProposalWorkflow.js:34
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('acceptProposalWorkflow: supabase client is required')
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/booking/acceptProposalWorkflow.js:34
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('acceptProposalWorkflow: supabase client is required')
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/booking/acceptProposalWorkflow.js:38
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('acceptProposalWorkflow: proposal with id is required')
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/booking/acceptProposalWorkflow.js:38
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('acceptProposalWorkflow: proposal with id is required')
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/booking/acceptProposalWorkflow.js:42
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('acceptProposalWorkflow: canAcceptProposal rule function is required')
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/booking/acceptProposalWorkflow.js:42
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('acceptProposalWorkflow: canAcceptProposal rule function is required')
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/booking/loadProposalDetailsWorkflow.js:49
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('loadProposalDetailsWorkflow: rawProposal is required')
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/booking/loadProposalDetailsWorkflow.js:49
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('loadProposalDetailsWorkflow: rawProposal is required')
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/booking/loadProposalDetailsWorkflow.js:53
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('loadProposalDetailsWorkflow: supabase client is required')
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/booking/loadProposalDetailsWorkflow.js:53
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('loadProposalDetailsWorkflow: supabase client is required')
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/pricingList/initializePricingListWorkflow.ts:41
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('initializePricingListWorkflow: listingId is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/pricingList/initializePricingListWorkflow.ts:41
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('initializePricingListWorkflow: listingId is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/pricingList/recalculatePricingListWorkflow.ts:47
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('recalculatePricingListWorkflow: listing is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/pricingList/recalculatePricingListWorkflow.ts:47
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('recalculatePricingListWorkflow: listing is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/pricingList/recalculatePricingListWorkflow.ts:51
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('recalculatePricingListWorkflow: listingId is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/pricingList/recalculatePricingListWorkflow.ts:51
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('recalculatePricingListWorkflow: listingId is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/cancelProposalWorkflow.js:97
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Proposal ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/cancelProposalWorkflow.js:97
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Proposal ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/cancelProposalWorkflow.js:154
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Proposal ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/cancelProposalWorkflow.js:154
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Proposal ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/counterofferWorkflow.js:32
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Proposal ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/counterofferWorkflow.js:32
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Proposal ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/counterofferWorkflow.js:82
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Proposal ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/counterofferWorkflow.js:82
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Proposal ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/counterofferWorkflow.js:128
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Proposal is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/counterofferWorkflow.js:128
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Proposal is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/hostAcceptProposalWorkflow.js:115
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Invalid response from lease service. Please contact support.');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/hostAcceptProposalWorkflow.js:115
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Invalid response from lease service. Please contact support.');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/virtualMeetingWorkflow.js:26
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Proposal ID and Guest ID are required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/virtualMeetingWorkflow.js:26
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Proposal ID and Guest ID are required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/virtualMeetingWorkflow.js:81
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Existing VM ID, Proposal ID, and Guest ID are required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/virtualMeetingWorkflow.js:81
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Existing VM ID, Proposal ID, and Guest ID are required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/virtualMeetingWorkflow.js:109
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Virtual meeting ID and booked date are required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/virtualMeetingWorkflow.js:109
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Virtual meeting ID and booked date are required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/virtualMeetingWorkflow.js:142
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Virtual meeting ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/virtualMeetingWorkflow.js:142
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Virtual meeting ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/virtualMeetingWorkflow.js:175
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Virtual meeting ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/proposals/virtualMeetingWorkflow.js:175
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Virtual meeting ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/reviews/submitReviewWorkflow.js:53
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Stay ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/reviews/submitReviewWorkflow.js:53
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Stay ID is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/reviews/submitReviewWorkflow.js:57
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Review type is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 logic/workflows/reviews/submitReviewWorkflow.js:57
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error('Review type is required');
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 services/BiddingService.js:214
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`Cannot place bid: session is ${session.status}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 services/BiddingService.js:214
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`Cannot place bid: session is ${session.status}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 services/BiddingService.js:355
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`Cannot set auto-bid: session is ${session.status}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

#### 🟡 services/BiddingService.js:355
**Type:** ViolationType.EXCEPTION_FOR_FLOW
**Current Code:**
```javascript
throw new Error(`Cannot set auto-bid: session is ${session.status}`);
```
**Suggested Fix:** Return Result<T, E> type: return err('validation message') instead of throw
**Rationale:** Expected errors (validation, not found, etc.) should be return values, not exceptions. This makes error handling explicit and type-safe.

## Refactoring Roadmap

### Phase 1: Critical (High Severity)
1. routes.config.js:908 - Using mutating array method
2. routes.config.js:985 - Imperative loop found (consider map/filter/reduce)
3. data/helpCenterData.js:280 - Using mutating array method
4. hooks/useBiddingRealtime.js:203 - Using mutating array sort/reverse
5. hooks/useDeviceDetection.test.js:35 - Using mutating array method

### Phase 2: Important (Medium Severity)
1. routes.config.js:946 - Imperative loop found (consider map/filter/reduce)
2. routes.config.js:969 - Imperative loop found (consider map/filter/reduce)
3. hooks/useBiddingRealtime.js:259 - Exception used for validation/expected errors
4. hooks/useBiddingRealtime.js:259 - Exception used for validation/expected errors
5. hooks/useBiddingRealtime.js:307 - Exception used for validation/expected errors

### Phase 3: Enhancement (Low Severity)

## FP Score Summary

**Overall Score:** 1/10

| Principle | Score | Notes |
|-----------|-------|-------|
| Immutability | 2/10 | Scores derived from relative violation counts (higher count => lower score). |
| Effects At Edges | 10/10 | Scores derived from relative violation counts (higher count => lower score). |
| Declarative Style | 7/10 | Scores derived from relative violation counts (higher count => lower score). |
| Errors As Values | 6/10 | Scores derived from relative violation counts (higher count => lower score). |
