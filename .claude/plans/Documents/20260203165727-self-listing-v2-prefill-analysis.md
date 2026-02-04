# Self-Listing V2 Prefill Analysis

**Date**: 2026-02-03
**Purpose**: Explore existing mechanisms for prefilling previous host selections in the self-listing-v2 wizard

---

## Overview

The self-listing-v2 flow is an 8-step listing creation wizard for hosts. The first two steps are:
1. **Step 1 - Host Type**: Select host type (resident, liveout, coliving, agent)
2. **Step 2 - Market Strategy**: Select market strategy (private/concierge or public)

---

## Key Files

| File | Purpose |
|------|---------|
| `app/src/islands/pages/SelfListingPageV2/SelfListingPageV2.tsx` | Main wizard component (~1400+ lines) |
| `app/src/islands/pages/SelfListingPageV2/index.ts` | Export wrapper |
| `app/src/islands/pages/SelfListingPageV2/styles/SelfListingPageV2.css` | Styles |
| `app/src/lib/listingService.js` | Listing CRUD operations including `host_type` and `market_strategy` fields |

---

## Current Prefill Mechanism (Already Implemented)

### localStorage-Based Prefill

The wizard **already has** a mechanism for prefilling previous selections using localStorage:

**Storage Keys** (lines 133-135):
```typescript
const STORAGE_KEY = 'selfListingV2Draft';
const LAST_HOST_TYPE_KEY = 'selfListingV2LastHostType';
const LAST_MARKET_STRATEGY_KEY = 'selfListingV2LastMarketStrategy';
```

**Saving Preferences** (after successful listing creation, lines 1068-1069):
```typescript
// Save last preferences before clearing draft so they persist for next listing
localStorage.setItem(LAST_HOST_TYPE_KEY, formData.hostType);
localStorage.setItem(LAST_MARKET_STRATEGY_KEY, formData.marketStrategy);
localStorage.removeItem(STORAGE_KEY);
```

**Loading Preferences on Mount** (lines 369-404):
```typescript
useEffect(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    // ... restore from draft
  } else {
    // No draft exists - check if we have preferences from previous listing
    const lastHostType = localStorage.getItem(LAST_HOST_TYPE_KEY);
    const lastMarketStrategy = localStorage.getItem(LAST_MARKET_STRATEGY_KEY);

    const updates: Partial<FormData> = {};

    if (lastHostType && ['resident', 'liveout', 'coliving', 'agent'].includes(lastHostType)) {
      updates.hostType = lastHostType as FormData['hostType'];
    }
    if (lastMarketStrategy && ['private', 'public'].includes(lastMarketStrategy)) {
      updates.marketStrategy = lastMarketStrategy as FormData['marketStrategy'];
    }

    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({ ...prev, ...updates }));
    }
  }
}, []);
```

---

## Form State Management

### FormData Interface (lines 61-96)
```typescript
interface FormData {
  // Step 1: Host Type
  hostType: 'resident' | 'liveout' | 'coliving' | 'agent';

  // Step 2: Market Strategy
  marketStrategy: 'private' | 'public';

  // Step 3: Listing Strategy
  leaseStyle: 'nightly' | 'weekly' | 'monthly';
  selectedNights: NightId[];
  weeklyPattern: string;
  monthlyAgreement: boolean;

  // ... more fields for steps 4-7
}
```

### Default Values (lines 98-131)
```typescript
const DEFAULT_FORM_DATA: FormData = {
  hostType: 'resident',  // Default if no preference saved
  marketStrategy: 'private',  // Default if no preference saved
  // ...
};
```

---

## Draft Persistence

The wizard saves a complete draft to localStorage on every change:

```typescript
// Save draft and step to localStorage
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    formData,
    currentStep,
  }));
}, [formData, currentStep]);
```

This means:
- If a user partially completes the wizard and returns, the entire form state is restored
- Draft is cleared only on successful submission
- The `LAST_HOST_TYPE_KEY` and `LAST_MARKET_STRATEGY_KEY` are saved AFTER successful submission for use on the NEXT listing

---

## Database Storage

The `host_type` and `market_strategy` are stored in the `listing` table:

**Mapping to DB** (listingService.js, lines 797-799):
```javascript
// V2 fields
host_type: formData.hostType || null,
market_strategy: formData.marketStrategy || 'private',
```

**Reading from DB** (listingService.js, lines 1276-1277):
```javascript
// V2 fields
hostType: dbRecord.host_type || null,
marketStrategy: dbRecord.market_strategy || 'private',
```

---

## Edit Mode Support

When editing an existing listing (via `?id=` URL parameter), the wizard loads the existing values:

```typescript
if (listingId) {
  console.log('[SelfListingPageV2] Edit mode detected, loading listing:', listingId);
  setIsEditMode(true);
  setEditingListingId(listingId);

  try {
    const existingListing = await getListingById(listingId);

    if (existingListing) {
      // Clear localStorage draft to prevent conflicts
      localStorage.removeItem(STORAGE_KEY);

      // Pre-select the saved host type from the existing listing
      setFormData(prev => ({
        ...prev,
        hostType: existingListing.host_type || prev.hostType,
      }));
    }
  }
}
```

---

## Step 1 and Step 2 UI

### Step 1: Host Type Selection (lines 1223-1248)
```tsx
const renderStep1 = () => (
  <div className="section-card">
    <h2>Who are you?</h2>
    <div className="form-group">
      <label>Select your host type</label>
      <div className="privacy-options">
        {HOST_TYPES.map(type => (
          <div
            key={type.id}
            className={`privacy-card ${formData.hostType === type.id ? 'selected' : ''}`}
            onClick={() => updateFormData({ hostType: type.id as FormData['hostType'] })}
          >
            <div className="privacy-radio"></div>
            <div className="privacy-content">
              <p>{type.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="btn-group">
      <button className="btn-next" onClick={nextStep}>Continue</button>
    </div>
  </div>
);
```

### Step 2: Market Strategy Selection (lines 1250-1284)
```tsx
const renderStep2 = () => (
  <div className="section-card">
    <h2>Market Strategy</h2>
    <div className="form-group">
      <label>How should we market it?</label>
      <div className="privacy-options">
        <div
          className={`privacy-card ${formData.marketStrategy === 'private' ? 'selected' : ''}`}
          onClick={() => updateFormData({ marketStrategy: 'private' })}
        >
          <div className="privacy-radio"></div>
          <div className="privacy-content">
            <h3>Private Network (Concierge)</h3>
            <p>We search for a guest for you. Address remains hidden until vetting is complete.</p>
          </div>
        </div>
        <div
          className={`privacy-card ${formData.marketStrategy === 'public' ? 'selected' : ''}`}
          onClick={() => updateFormData({ marketStrategy: 'public' })}
        >
          <div className="privacy-radio"></div>
          <div className="privacy-content">
            <h3>Public Marketplace</h3>
            <p>Standard listing. Visible to all users immediately.</p>
          </div>
        </div>
      </div>
    </div>
    <div className="btn-group">
      <button className="btn-next" onClick={nextStep}>Continue</button>
      <button className="btn-back" onClick={prevStep}>Back</button>
    </div>
  </div>
);
```

---

## Summary: Existing Prefill Mechanisms

| Mechanism | Storage | When Used | Scope |
|-----------|---------|-----------|-------|
| Draft Restoration | `localStorage['selfListingV2Draft']` | When user returns mid-wizard | Current wizard session |
| Last Host Type | `localStorage['selfListingV2LastHostType']` | When starting NEW listing (no draft) | Persists across listings |
| Last Market Strategy | `localStorage['selfListingV2LastMarketStrategy']` | When starting NEW listing (no draft) | Persists across listings |
| Edit Mode | Database `listing.host_type` | When editing existing listing via `?id=` | From existing listing |

---

## What's Already Working

1. **Returning hosts** who completed a previous listing will have their `hostType` and `marketStrategy` pre-selected automatically via localStorage
2. **Returning hosts** who abandoned a draft will see the entire form restored including their host type selection
3. **Editing existing listings** loads the host type from the database

---

## Potential Enhancement Opportunities

If the localStorage-based approach is insufficient, consider:

1. **Database-based user preferences**: Store `default_host_type` and `default_market_strategy` on the `user` table for cross-device persistence

2. **Fetch from most recent listing**: Query the user's most recent listing's `host_type` as a fallback if localStorage is empty (useful for users who cleared browser data)

3. **User settings page**: Add a "Hosting Preferences" section to the account profile page

---

## Conclusion

The self-listing-v2 flow **already has a working prefill mechanism** using localStorage keys:
- `selfListingV2LastHostType`
- `selfListingV2LastMarketStrategy`

These are saved upon successful listing creation and restored when the user starts a new listing without an existing draft. The system also handles draft restoration and edit mode with separate logic.
