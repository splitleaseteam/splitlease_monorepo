# safeParseJsonArray Usages

## Definition
- app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js:9-22

## Callers
| File | Line | Notes |
| :--- | ---: | :--- |
| app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js | 135 | Parse in-unit amenities IDs |
| app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js | 141 | Parse building amenities IDs |
| app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js | 147 | Parse safety features IDs |
| app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js | 153 | Parse house rules IDs |
| app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js | 168 | Parse available days (JS day conversion) |
| app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js | 175 | Parse nights available |
| app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js | 318 | Parse blocked dates |
| app/src/islands/pages/ListingDashboardPage/hooks/useListingData.js | 395 | Parse inline photos list |

## Recommendation
Extract `safeParseJsonArray` to a shared utility for Host Dashboard use. The canonical version in `app/src/lib/formatters.js` matches the behavior needed here (array passthrough, empty on invalid input). The caller file is owned by Agent-B, so the import swap should be handled in that ownership lane.
