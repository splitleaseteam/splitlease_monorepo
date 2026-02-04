# Debug Logging (ListingDashboardPage)

| File | Line | Content | Action |
| :--- | ---: | :--- | :--- |
| app/src/islands/pages/ListingDashboardPage/components/PricingEditSection/index.jsx | 61 | `console.log('🔙 Back button clicked, hasChanges:', hasChanges);` | Defer (not owned by Agent-A) |
| app/src/islands/pages/ListingDashboardPage/components/PricingEditSection/index.jsx | 63 | `console.log('📋 Showing confirmation modal');` | Defer (not owned by Agent-A) |
| app/src/islands/pages/ListingDashboardPage/components/PricingEditSection/index.jsx | 66 | `console.log('✅ No changes, closing directly');` | Defer (not owned by Agent-A) |
| app/src/islands/pages/ListingDashboardPage/components/PricingEditSection/index.jsx | 163 | `console.error('Error saving pricing:', error);` | Defer (not owned by Agent-A) |
| app/src/islands/pages/ListingDashboardPage/components/PricingEditSection.jsx | 210 | `console.log('🔙 Go Back clicked:', { hasChanges, onCloseExists: ... });` | Removed |
| app/src/islands/pages/ListingDashboardPage/components/PricingEditSection.jsx | 212 | `console.log('📋 Showing confirmation modal');` | Removed |
| app/src/islands/pages/ListingDashboardPage/components/PricingEditSection.jsx | 215 | `console.log('✅ No changes, calling onClose()');` | Removed |
| app/src/islands/pages/ListingDashboardPage/components/PricingEditSection.jsx | 219 | `console.error('❌ onClose is not a function:', onClose);` | Converted to logger.error |
| app/src/islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx | 196 | `console.log('📅 Date clicked:', dayInfo, 'isOverflow:', ...);` | Removed |
| app/src/islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx | 200 | `console.log('📅 Click ignored: past date or missing date object');` | Removed |
| app/src/islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx | 205 | `console.log('📅 Date key:', dateKey, 'Mode:', dateSelectionMode);` | Removed |
| app/src/islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx | 209 | `console.log('📅 Individual mode: toggling date', dateKey);` | Removed |
| app/src/islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx | 215 | `console.log('📅 Range mode: setting start date', dayInfo.date);` | Removed |
| app/src/islands/pages/ListingDashboardPage/components/AvailabilitySection.jsx | 220 | `console.log('📅 Range mode: blocking dates', rangeDates);` | Removed |
| app/src/islands/pages/ListingDashboardPage/components/PhotosSection.jsx | 261 | `console.log('Photo type changed:', photo.id, e.target.value);` | Removed |
