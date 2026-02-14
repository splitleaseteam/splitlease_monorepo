# SuggestedProposals Component

A shared island component that displays AI-suggested rental proposals to guests in a floating popup interface.

## Overview

This component shows proposals that Split Lease agents have created on behalf of guests. It provides a card-based UI with photo gallery, pricing, amenities, location map, and AI-generated reasoning for why the proposal matches the guest's needs.

## Architecture

```
SuggestedProposals/
├── index.js                        # Barrel exports
├── CLAUDE.md                       # This file
├── useSuggestedProposals.js        # State management hook
├── suggestedProposalService.js     # Supabase API calls
├── SuggestedProposalTrigger.jsx    # Floating lightbulb button
├── SuggestedProposalTrigger.css
├── SuggestedProposalPopup.jsx      # Main popup container
├── SuggestedProposalPopup.css
└── components/                     # Sub-components
    ├── ImageGallery.jsx            # Photo carousel with thumbnails
    ├── AmenityIcons.jsx            # Beds, baths, guests, space type
    ├── PriceDisplay.jsx            # Nightly and total pricing
    ├── ActionButtons.jsx           # Interested / Remove buttons
    ├── MapSection.jsx              # Google Maps static image
    └── WhyThisProposal.jsx         # AI summary display
```

## Data Model

This component uses **snake_case Supabase field names**. Key fields:

### Proposal Fields (from `proposal` table)
- `id` - Unique identifier
- `proposal_workflow_status` - Proposal status string
- `calculated_nightly_price` - Per-night cost (numeric)
- `total_reservation_price_for_guest` - Total reservation cost (numeric)
- `move_in_range_start_date` - Start date (ISO string)
- `reservation_span_in_weeks` - Duration in weeks
- `guest_user_id` - Guest user ID
- `is_deleted` - Soft delete flag
- `_dismissed` - Client-side dismissed tracking

### Enriched Fields (from `loadProposalDetails`)
- `_listing` - Full listing object
- `_guest` - Guest user object
- `_host` - Host user object
- `_negotiationSummaries` - Array of AI-generated summaries (if available)

### Listing Fields (from `_listing`)
- `listing_title` - Property name
- `photos_with_urls_captions_and_sort_order_json` - Photo data (JSONB)
- `address_with_lat_lng_json` - JSONB object `{ address: string, lat: number, lng: number }`
- `borough` - Borough name (e.g., "Manhattan")
- `primary_neighborhood_reference_id` / `neighborhood_name_entered_by_host` - Neighborhood
- `bedroom_count` - Number of bedrooms (integer)
- `bathroom_count` - Number of bathrooms (numeric)
- `max_guest_count` - Max guests (integer)
- `space_type` - Space type (may be FK ID requiring resolution)

### Data Transformation Notes

**address_with_lat_lng_json**: May be stored as stringified JSON. Always parse before accessing:
```javascript
const rawAddressData = listing.address_with_lat_lng_json;
const addressData = typeof rawAddressData === 'string'
  ? JSON.parse(rawAddressData)
  : rawAddressData;
const address = addressData?.address || '';
const geoPoint = { lat: addressData?.lat, lng: addressData?.lng };
```

**space_type**: May contain legacy FK IDs like `1569530331984x152755544104023800`.
Use `SPACE_TYPE_ID_TO_LABEL` mapping in AmenityIcons.jsx to resolve to human-readable labels.
Also uses `BOROUGH_ID_TO_LABEL` for borough FK ID resolution.

## Status Filtering

Suggested proposals are identified using `isSuggestedProposal()` from `proposalStatuses.js`:
- `'Proposal Submitted for guest by Split Lease - Awaiting Rental Application'`
- `'Proposal Submitted for guest by Split Lease - Pending Confirmation'`

## Usage

```jsx
import {
  SuggestedProposalPopup,
  SuggestedProposalTrigger,
  useSuggestedProposals
} from '../shared/SuggestedProposals';

function MyPage({ currentUser }) {
  const {
    proposals,
    currentProposal,
    currentIndex,
    totalCount,
    isVisible,
    show,
    hide,
    goToNext,
    goToPrevious,
    handleInterested,
    handleRemove,
    isProcessing
  } = useSuggestedProposals({
    userId: currentUser.id,
    onInterested: async (proposal) => {
      showToast({ title: 'Interest recorded!', type: 'success' });
    },
    onRemove: async (proposal) => {
      // Called after successful removal
    }
  });

  return (
    <>
      {totalCount > 0 && (
        <SuggestedProposalTrigger
          onClick={show}
          isActive={isVisible}
          proposalCount={totalCount}
        />
      )}

      <SuggestedProposalPopup
        proposal={currentProposal}
        currentIndex={currentIndex}
        totalCount={totalCount}
        onInterested={handleInterested}
        onRemove={handleRemove}
        onNext={goToNext}
        onPrevious={goToPrevious}
        onClose={hide}
        isVisible={isVisible}
        isProcessing={isProcessing}
      />
    </>
  );
}
```

## Keyboard Navigation

- **Arrow Left/Right**: Navigate between proposals
- **Escape**: Close popup

## CSS Variables

All styles use `sp-` prefix to avoid conflicts:
- `--sp-primary-purple`: #250856
- `--sp-primary-contrast`: #FFFFFF
- `--sp-text-dark`: #424242
- `--sp-border-divider`: #DFDFF6
- `--sp-radius-card`: 10px
- `--sp-radius-button`: 20px

## Dependencies

- `app/src/lib/supabase.js` - Supabase client
- `app/src/lib/proposalDataFetcher.js` - `loadProposalDetails()`
- `app/src/logic/constants/proposalStatuses.js` - `isSuggestedProposal()`
- `app/src/islands/shared/Toast.jsx` - Toast notifications (optional)

## Environment Variables

```env
VITE_GOOGLE_MAPS_API_KEY=<key>  # Optional, for map display
```
