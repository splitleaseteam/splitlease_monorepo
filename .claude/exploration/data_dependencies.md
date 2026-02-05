# Data Dependencies - Exploration Report

**Generated**: 2025-02-04
**Agent**: Agent-B (Data Layer Domain)
**Scope**: ListingDashboardPage data flow

---

## Data Flow: ListingDashboardPage

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW DIAGRAM                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Supabase `listing` table                                               │
│        │                                                                 │
│        ▼                                                                 │
│  useListingData.js                                                      │
│        │                                                                 │
│        ├── fetchLookupTables() → zat_features_* tables                  │
│        │                                                                 │
│        ▼                                                                 │
│  transformListingData()                                                 │
│        │                                                                 │
│        ▼                                                                 │
│  { listing, counts, isLoading, error }                                  │
│        │                                                                 │
│        ▼                                                                 │
│  useListingDashboardPageLogic.js                                        │
│        │                                                                 │
│        ├── handleEditSection()                                          │
│        ├── handleSaveEdit()                                             │
│        └── handleBlockedDatesChange()                                   │
│             │                                                           │
│             ▼                                                           │
│  Section Components (read from context)                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Sources

### Primary: Supabase `listing` table

**Query**:
```javascript
supabase.from('listing').select('*').eq('_id', listingId)
```

**Primary Key**: `_id` (Bubble ID string, not auto-increment)

### Secondary: Lookup Tables

| Table | Schema | Purpose |
|:---|:---|:---|
| `zat_features_amenity` | public | Amenity names/icons |
| `zat_features_safetyfeature` | reference_table | Safety feature names/icons |
| `zat_features_houserule` | reference_table | House rule names/icons |
| `zat_features_listingtype` | reference_table | Property type labels |
| `zat_features_parkingoptions` | reference_table | Parking option labels |
| `zat_features_storageoptions` | reference_table | Storage option labels |

### Related Tables (Counts Only)

| Table | Join Field | Usage |
|:---|:---|:---|
| `listing_photo` | `Listing` → `_id` | Photo management |
| `proposal` | `Listing` → `_id` | Proposal count badge |
| `bookings_leases` | `Listing` → `_id` | Leases count badge |
| `virtualmeetingschedulesandlinks` | `Listing` → `_id` | Meetings count badge |
| `external_reviews` | `listing_id` → `_id` | Reviews count |

---

## Component Data Usage

| Component | Reads From Listing | Writes Via |
|:---|:---|:---|
| `PropertyInfoSection` | `title`, `location.*`, `status`, `activeSince` | `onEdit('name')` |
| `DescriptionSection` | `description`, `descriptionNeighborhood` | `onEdit('description'/'neighborhood')` |
| `AmenitiesSection` | `inUnitAmenities`, `buildingAmenities` | `onEdit('amenities')` |
| `DetailsSection` | `features.*`, `safetyFeatures` | `onEdit('details')` |
| `PricingSection` | `leaseStyle`, `pricing`, `weeklyCompensation`, `damageDeposit`, `maintenanceFee` | Read-only display |
| `PricingEditSection` | All pricing fields | `onSave(updates)` |
| `RulesSection` | `houseRules`, `preferredGender`, `maxGuests` | `onEdit('rules')` |
| `AvailabilitySection` | `leaseTermMin/Max`, `earliestAvailableDate`, `checkIn/OutTime`, `blockedDates` | `onBlockedDatesChange()` |
| `PhotosSection` | `photos[]` | `onSetCover()`, `onDelete()`, `onReorder()` |
| `CancellationPolicySection` | `cancellationPolicy` | `onPolicyChange()` |

---

## Field Transformation Pipeline

### Pricing Fields

```
Raw DB: nightly_rate_2_nights (number)
    ↓ transformListingData()
Domain: listing.pricing[2] (number)
    ↓ component
UI: formatCurrency(listing.pricing[2]) → "$150"
```

### Day Fields

```
Raw DB: 'Days Available (List of Days)' (JSON string: "[0,1,2,3,4]")
    ↓ safeParseJsonArray()
Domain: listing.availableDays (array: [0,1,2,3,4])
    ↓ NIGHT_IDS mapping
Domain: listing.nightsAvailable (array: ['sunday','monday',...])
```

### Feature Fields (with Lookup Resolution)

```
Raw DB: 'Features - Amenities In-Unit' (JSON string of IDs)
    ↓ safeParseJsonArray()
Parsed: ["id1", "id2", "id3"]
    ↓ lookup resolution
Domain: listing.inUnitAmenities = [
  { id: "id1", name: "WiFi", icon: "wifi.svg" },
  { id: "id2", name: "AC", icon: "ac.svg" },
  ...
]
```

---

## Write Flow (PricingEditSection Example)

```
User clicks "Save" in PricingEditSection
    ↓
handleSave() builds updates object:
{
  'rental type': 'Nightly',
  'damage_deposit': 500,
  'cleaning_fee': 125,
  'nightly_rate_2_nights': 75,
  'Days Available (List of Days)': '[0,1,2,3,4]'
}
    ↓
onSave(updates) → useListingData.updateListing()
    ↓
supabase.from('listing').update(updates).eq('_id', listingId)
    ↓
fetchListing(silent=true) refreshes local state
```

---

## Key Files

| File | Responsibility |
|:---|:---|
| `hooks/useListingData.js` | Data fetching, transformation, updates |
| `hooks/useListingAuth.js` | Ownership verification |
| `hooks/usePhotoManagement.js` | Photo CRUD operations |
| `hooks/useAIImportAssistant.js` | AI content generation |
| `useListingDashboardPageLogic.js` | Orchestrates all hooks |

---

## Dead Hooks (Orphaned)

| File | Intended Purpose | Actual Usage |
|:---|:---|:---|
| `hooks/useAvailabilityLogic.js` | Availability field updates | **Never imported** |
| `hooks/useCancellationLogic.js` | Cancellation policy updates | **Never imported** |

These hooks were created but never integrated. Their functionality is handled:
- Availability: Directly in `AvailabilitySection.jsx` via `onBlockedDatesChange`
- Cancellation: Directly in `CancellationPolicySection.jsx` via `onPolicyChange`

