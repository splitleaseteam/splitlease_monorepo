# BUG-12: Duplicate `transformListing` Analysis

Comparison between `useSearchPageLogic.js` and `useFavoriteListingsPageLogic.js`.

| Field / Feature | Search Page (`useSearchPageLogic.js`) | Favorites Page (`useFavoriteListingsPageLogic.js`) | Notes |
| :--- | :--- | :--- | :--- |
| **Arguments** | `(dbListing, images, hostData, pricingList)` | `(dbListing, images, hostData)` | Search supports dynamic `pricingList` injection. |
| **Numeric Coercion** | Uses `toNumber()` helper for prices/rates. | Direct access (risk of string/null issues). | Search is more robust. |
| **Coordinates** | Uses `extractListingCoordinates` logic core. | Inline logic for `lat`/`lng`. | Search uses standardized logic. |
| **Price Keys** | `nightly_rate_for_X_night_stay` | `Price X nights selected` | Major inconsistency. |
| **Starting Price** | Uses `pricingList` or `standardized_min_nightly_price...` | `Standarized Minimum Nightly Price (Filter)` | Typo in Favorites key? (`Standarized`) |
| **Rental Type** | `rental type` AND `rentalType` | `rental type` | Search provides both formats. |
| **Weeks Offered** | `Weeks offered` AND `weeksOffered` | `Weeks offered` | Search provides both formats. |
| **Availability** | `days_available` | `Days Available (List of Days)` | Different keys. |
| **Blocked Dates** | Not present | `Dates - Blocked` | Favorites needs this for schedule selector? |
| **Reference Data** | Resolves Amenities, House Rules, Safety, etc. | Only Amenities parsed (`parseAmenities`). | Search is much richer in data resolution. |
| **Drawer Fields** | Includes `listingDescription`, `transitTime`, `checkInTime`... | Includes `NEW Date Check-in Time`... | Different naming conventions. |
| **UI State Fields** | `isActive`, `isUsabilityTest` | `Active`, `Approved`, `Complete` | different boolean flags. |

## Recommendation
The `transformListing` in `useSearchPageLogic.js` is significantly more advanced, robust (numeric coercion), and integrated with Logic Core.

**Proposed Unified Schema (for Agent 4):**
Adopting the `useSearchPageLogic.js` schema as the standard is recommended, but `useFavoriteListingsPageLogic.js` specific fields (like `Dates - Blocked` and specific UI keys) need to be audited to see if they are actually used by the components (`FavoritesCard`, `SplitScheduleSelector`).

If `FavoritesCard` relies on `Price 2 nights selected`, it will break if switched to `nightly_rate_for_2_night_stay`.
