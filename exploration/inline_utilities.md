# Inline Utilities (ListingDashboardPage/components)

| File | Function | Purpose | Extract? | Notes |
| :--- | :--- | :--- | :---: | :--- |
| app/src/islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx | `formatDateKey(date)` | YYYY-MM-DD key for blocked dates | ✅ | Candidate for shared date utils (used in multiple calendar features) |
| app/src/islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx | `getDatesBetween(startDate, endDate)` | Build inclusive date range list | ✅ | Reusable for range selection logic |
| app/src/islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx | `formatDateForInput(date)` | Normalize date for input value | ✅ | Useful across date inputs |
| app/src/islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx | `formatDate(date)` | Localized display for blocked dates | ➖ | Display-specific, likely stays local |
| app/src/islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx | `getCalendarDays()` | Build 6x7 calendar grid | ➖ | Component-specific (layout assumptions) |
| app/src/islands/pages/ListingDashboardPage/components/PricingEditSection.jsx | `calculateNightlyRate(weeklyComp, nightCount)` | Per-night rate from weekly comp | ✅ | Should move to shared pricing calc (also appears in usePricingLogic) |
| app/src/islands/pages/ListingDashboardPage/components/PricingEditSection/usePricingLogic.js | `formatCurrency(amount)` | Local currency formatting | ✅ | Replace with shared `app/src/lib/formatters.js` |
| app/src/islands/pages/ListingDashboardPage/components/PhotosSection.jsx | `getImageUrl(photo)` | Normalize photo URL shape | ✅ | Candidate for shared photo utils (listings + edits) |
| app/src/islands/pages/ListingDashboardPage/components/PhotosSection.jsx | `handleImageError(e)` | Mark broken images | ➖ | UI-specific, likely stays local |
