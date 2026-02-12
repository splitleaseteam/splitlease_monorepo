# ListingDashboardPage - LLM Reference

**SCOPE**: Host listing management dashboard with edit capabilities
**PATTERN**: Hollow Component Pattern (UI + Logic Hook)

---

## FILES

### ListingDashboardPage.jsx
[INTENT]: Main container orchestrating all dashboard sections and modals
[EXPORTS]: default ListingDashboardPage
[DEPENDS_ON]: useListingDashboardPageLogic, Header, Footer, EditListingDetails, ScheduleCohost, ImportListingReviewsModal, AIImportAssistantModal
[USED_BY]: listing-dashboard.jsx entry point
[PATTERN]: Hollow component - all logic delegated to hook
[SECTIONS]: NavigationHeader, AlertBanner, ActionCardGrid, SecondaryActions, PropertyInfoSection, DescriptionSection, AmenitiesSection, DetailsSection, PricingSection, RulesSection, AvailabilitySection, PhotosSection, CancellationPolicySection
[MODALS]: EditListingDetails (all sections), PricingEditSection (pricing only), ScheduleCohost, ImportListingReviewsModal, AIImportAssistantModal

### useListingDashboardPageLogic.js
[INTENT]: Business logic hook managing listing data, editing, AI generation, and photo operations
[EXPORTS]: default useListingDashboardPageLogic
[DEPENDS_ON]: supabase, auth, aiService, amenitiesService, safetyFeaturesService, houseRulesService, neighborhoodService
[USED_BY]: ListingDashboardPage.jsx
[KEY_FEATURES]: Listing table support, lookup table resolution, AI content generation, photo reordering, blocked dates management
[DATA_FLOW]: Fetches listing from listing table (by id), transforms to component format, resolves IDs to names via lookup tables
[AI_WORKFLOW]: Load amenities/neighborhood/rules/safety first, then generate AI title/description with enriched context
[PHOTO_OPS]: Set cover, delete, reorder with DB persistence

---

## COMPONENTS

| Component | Purpose |
|-----------|---------|
| NavigationHeader | Tab navigation with conditional visibility based on counts |
| ActionCard | Reusable card button for quick actions |
| ActionCardGrid | Responsive grid of action cards with conditional visibility |
| AlertBanner | Clickable banner promoting co-host scheduling |
| PropertyInfoSection | Listing name, address, status, and review actions |
| DescriptionSection | Display and edit lodging and neighborhood descriptions |
| AmenitiesSection | Display in-unit and building amenities with icons |
| DetailsSection | Display property details and safety features |
| PricingSection | Display pricing, lease style, and weekly compensation |
| NightlyPricingLegend | Visual gradient legend for nightly pricing (read-only) |
| PricingEditSection | Full-screen modal for editing pricing and lease style |
| RulesSection | Display house rules and guest restrictions |
| AvailabilitySection | Availability settings and interactive blocked dates calendar |
| PhotosSection | Photo gallery with drag-and-drop reordering |
| CancellationPolicySection | Cancellation policy selector with link to policy page |
| SecondaryActions | AI Import Assistant button and section navigation dropdown |

---

## DATA_TRANSFORMATIONS

### transformListingData()
[INTENT]: Convert Supabase listing to component-friendly format
[INPUT]: dbListing (raw from listing table), photos array, lookups object
[OUTPUT]: Transformed listing object with resolved IDs and computed fields
[KEY_TRANSFORMS]: JSON array parsing (amenities, rules, safety, days), photo object mapping, location address parsing, pricing object construction
[ID_HANDLING]: listing table uses 'id' as primary key
[COMPATIBILITY]: Returns both transformed properties and raw DB fields for EditListingDetails modal

### fetchLookupTables()
[INTENT]: Fetch all reference tables to resolve IDs to names/icons
[OUTPUT]: Object with amenities, safetyFeatures, houseRules, listingTypes, parkingOptions, storageOptions
[TABLES]: zat_features_amenity, zfut_safetyfeatures, zat_features_houserule, zat_features_listingtype, zat_features_parkingoptions, zat_features_storageoptions
[USAGE]: Passed to transformListingData to resolve ID arrays to name/icon objects

### safeParseJsonArray()
[INTENT]: Safely parse JSON string or return array as-is
[INPUT]: value (string, array, or null)
[OUTPUT]: Array (empty if parse fails)
[USE_CASE]: Handle mixed JSON string and array formats in DB columns

---

## KEY_FEATURES

### Listing Table Support
[DESCRIPTION]: Uses listing table with 'id' as primary key
[FLOW]: Query listing table directly by 'id'
[PHOTOS]: Listings use listing_photo table for photo storage

### AI Import Assistant Workflow
[PHASE_1]: Load common data (in-unit amenities, building amenities, neighborhood description, house rules, safety features)
[PHASE_2]: Generate AI content (title, description) with enriched listing context
[SERVICES]: getCommonInUnitAmenities, getCommonBuildingAmenities, getNeighborhoodByZipCode, getCommonHouseRules, getCommonSafetyFeatures, generateListingTitle, generateListingDescription

### Photo Management
[SET_COVER]: Moves selected photo to index 0, updates isCover flag, persists to DB
[DELETE]: Soft-delete (Active=false) in listing_photo table
[REORDER]: Updates SortOrder in listing_photo table
[PERSISTENCE]: Uses listing_photo table for all photo operations

### Edit Modal System
[EDIT_SECTION]: State tracks which section is being edited (null = closed)
[PRICING]: Uses PricingEditSection full-screen overlay
[OTHER_SECTIONS]: Uses EditListingDetails modal (name, description, neighborhood, amenities, details, rules, availability, photos)
[SAVE_FLOW]: Modal saves to DB, calls handleSaveEdit to update local state, silently refreshes on close

---

## URL_PARAMETERS

[LISTING_ID]: ?id={id}
[USAGE]: Fetches listing by id (listing_trial) or id (listing)

---

## DATABASE_TABLES

| Table | Key | Purpose |
|-------|-----|---------|
| listing | id | All listings |
| listing_photo | Listing (id) | Photos with URL, sort order, cover flag, active flag, type |
| proposal | Listing (id) | Proposals badge count in navigation |
| booking_lease | id | Leases badge count in navigation |
| virtualmeetingschedulesandlinks | Listing (id) | Virtual meetings badge count in navigation |

---

## KNOWN_LIMITATIONS

[NAVIGATION]: Tab-specific navigation for proposals/meetings/leases not yet implemented
[FORM_SAVE]: Inline edits use edit-in-modal pattern (no debounced inline save)
[PHOTO_TYPE]: Photo type change handler logs to console only

---

**VERSION**: 2.1
