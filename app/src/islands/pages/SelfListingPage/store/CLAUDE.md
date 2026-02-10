# SelfListingPage Store - LLM Reference

**GENERATED**: 2025-12-11
**SCOPE**: State management for listing creation form

---

## FILES

### index.ts
[INTENT]: Barrel export for store module
[EXPORTS]: listingLocalStore, StoreState (type), useListingStore, prepareListingSubmission, prepareDraftPayload, preparePhotoPayload, validateBubblePayload, BubbleListingPayload (type)

### listingLocalStore.ts
[INTENT]: Singleton store class with localStorage persistence
[EXPORTS]: listingLocalStore (singleton instance), StoreState (type)
[PATTERN]: Observable store with subscriber notification
[PERSISTENCE]: localStorage with 1-second debounced auto-save

### useListingStore.ts
[INTENT]: React hook adapter for listingLocalStore
[EXPORTS]: useListingStore (custom hook)
[PATTERN]: Hook wraps singleton, subscribes to changes, triggers React re-renders

### prepareListingSubmission.ts
[INTENT]: Transform local form data to Bubble API payload format
[EXPORTS]: prepareListingSubmission, prepareDraftPayload, preparePhotoPayload, validateBubblePayload, BubbleListingPayload (type)

---

## ARCHITECTURE

### Singleton Pattern
[IMPLEMENTATION]: Single instance of ListingLocalStore class exported as listingLocalStore
[WHY]: Form state shared across section components, avoid prop drilling
[LIFECYCLE]: Created once on module load, persists for entire session

### Pub/Sub Pattern
[SUBSCRIBERS]: React components subscribe via useListingStore()
[NOTIFICATION]: notifyListeners() called after every state change
[UNSUBSCRIBE]: Cleanup returned from subscribe() function

### React Hook Adapter
[PURPOSE]: Bridge between singleton store and React component lifecycle
[MECHANISM]: useState + useEffect + subscribe/unsubscribe
[BENEFIT]: Automatic re-renders when store changes, React-friendly API

---

## STORE_STATE

### StoreState Interface
```typescript
interface StoreState {
  data: ListingFormData;           // Complete form data
  lastSaved: Date | null;           // Last save timestamp
  isDirty: boolean;                 // Unsaved changes flag
  stagingStatus: StagingStatus;     // Submission workflow status
  errors: string[];                 // Validation errors
}
```

### StagingStatus Values
[not_staged]: Initial state, no submission attempt
[staged]: Data validated and ready for submission
[submitting]: Submission in progress
[submitted]: Submission successful, local data cleared
[failed]: Submission failed, retry available

---

## STORAGE_KEYS

### selfListingDraft
[PURPOSE]: Persistent draft storage
[FORMAT]: JSON stringified ListingFormData
[LIFECYCLE]: Created on first change, updated on auto-save, deleted on submission

### selfListingStagedForSubmission
[PURPOSE]: Validated data ready for submission
[FORMAT]: JSON stringified ListingFormData with stagedAt timestamp
[LIFECYCLE]: Created by stageForSubmission(), deleted on successful submission

### selfListingLastSaved
[PURPOSE]: Track last save time
[FORMAT]: ISO date string

### selfListingUserId
[PURPOSE]: Optional user ID tracking (reserved for future multi-user draft support)

---

## PUBLIC_METHODS

| Method | Intent | Key Notes |
|--------|--------|-----------|
| initialize() | Load draft from localStorage | Converts Date strings back to Date objects (blockedDates) |
| getData() | Get current form data | Returns shallow copy of ListingFormData |
| getState() | Get complete store state | Includes lastSaved, isDirty, errors, stagingStatus |
| updateData(partial) | Merge partial updates into form data | Sets isDirty=true, schedules 1s debounced auto-save |
| updateSection(section, data) | Replace entire section data | Same side effects as updateData() |
| updateSpaceSnapshot(data) | Update Section 1 | Delegates to updateSection('spaceSnapshot', data) |
| updateFeatures(data) | Update Section 2 | Delegates to updateSection('features', data) |
| updateLeaseStyles(data) | Update Section 3 | Delegates to updateSection('leaseStyles', data) |
| updatePricing(data) | Update Section 4 | Delegates to updateSection('pricing', data) |
| updateRules(data) | Update Section 5 | Delegates to updateSection('rules', data) |
| updatePhotos(data) | Update Section 6 | Delegates to updateSection('photos', data) |
| updateReview(data) | Update Section 7 | Delegates to updateSection('review', data) |
| setCurrentSection(section) | Update current wizard section number | Schedules auto-save, notifies listeners |
| markSectionComplete(section) | Add section to completedSections | Uses Set to avoid duplicates, sorts result |
| saveDraft() | Manually save to localStorage | Strips transient photo fields (file, isUploading, uploadError) |
| stageForSubmission() | Validate and prepare for submission | Returns { success, errors }. Saves to selfListingStagedForSubmission key |
| getStagedData() | Retrieve staged data from localStorage | Returns ListingFormData or null |
| markSubmitting() | Set submission in progress | stagingStatus='submitting' |
| markSubmitted() | Mark submission successful | Deletes all localStorage keys, stagingStatus='submitted' |
| markSubmissionFailed(error) | Mark submission failed | stagingStatus='failed', appends error |
| clearStagingError() | Reset from failed to allow retry | stagingStatus='staged', clears errors |
| validateForSubmission() | Validate all form fields | Returns string[] of error messages |
| reset() | Clear all data to initial state | Deletes all localStorage keys |
| subscribe(listener) | Register callback for state changes | Returns unsubscribe function |
| getDebugSummary() | Get debugging info | Returns key metrics object |

---

## VALIDATION_RULES

### Section 1: Space Snapshot
[REQUIRED]: listingName, typeOfSpace, typeOfKitchen, typeOfParking, address.fullAddress, address.validated

### Section 2: Features
[REQUIRED]: amenitiesInsideUnit.length > 0, descriptionOfLodging

### Section 3: Lease Styles
[REQUIRED]: rentalType
[CONDITIONAL]: If rentalType='Nightly', at least one availableNights value must be true
[CONDITIONAL]: If rentalType='Weekly', weeklyPattern is required

### Section 4: Pricing
[REQUIRED]: damageDeposit >= 500
[CONDITIONAL]: If rentalType='Monthly', monthlyCompensation is required
[CONDITIONAL]: If rentalType='Weekly', weeklyCompensation is required
[CONDITIONAL]: If rentalType='Nightly', nightlyPricing.oneNightPrice is required

### Section 5: Rules
[REQUIRED]: cancellationPolicy, checkInTime, checkOutTime

### Section 6: Photos
[REQUIRED]: photos.length >= minRequired (default: 3)

### Section 7: Review
[REQUIRED]: agreedToTerms = true

---

## AUTO_SAVE_MECHANISM

### Debounce Pattern
[DELAY]: 1000ms (1 second)
[TRIGGER]: Any field update via updateData() or updateSection()
[IMPLEMENTATION]: scheduleAutoSave() clears previous timer, sets new timer

### Photo Serialization
[ISSUE]: File objects are not serializable to JSON
[SOLUTION]: Only save photo metadata (id, url, caption, displayOrder, storagePath)
[EXCLUDED]: file, isUploading, uploadError (transient UI state)

### Date Serialization
[ISSUE]: Date objects lose type when stringified
[SOLUTION]: Convert to ISO strings on save, restore to Date on load
[AFFECTED_FIELDS]: rules.blockedDates

---

## CRITICAL_NOTES

### Singleton vs React State
[DECISION]: Use singleton instead of React Context
[WHY_1]: Avoids prop drilling through 7 section components
[WHY_2]: Automatic localStorage persistence without Context boilerplate
[WHY_3]: Can access store outside React (future CLI tools, tests)
[TRADEOFF]: Must use hook adapter for React reactivity

### localStorage Quota
[ISSUE]: Photos as data URLs would exceed localStorage quota
[SOLUTION]: Upload photos to Supabase Storage immediately, store only URLs

### Date Objects
[ISSUE]: JSON.stringify loses Date type
[SOLUTION]: Serialize to ISO string on save, parse back to Date on load
[AFFECTED]: rules.blockedDates

---

**FILE_COUNT**: 4
**PATTERN**: Singleton + Pub/Sub + React Hook Adapter
