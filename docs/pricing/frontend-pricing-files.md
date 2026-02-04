# Frontend Pricing Calculation Files

This report identifies all files in the `app/src` directory that are involved in frontend price calculations, data handling, and display.

## 1. Files Importing or Using `calculatePrice` or `priceCalculations`

These files are part of the legacy or direct price calculation system.

| File Path | Description | Role |
| --- | --- | --- |
| `app/src/lib/scheduleSelector/priceCalculations.js` | **Core legacy calculation logic.** Contains the original `calculatePrice` and `calculatePricingBreakdown` functions. | **CALCULATES** |
| `app/src/listing-schedule-selector.jsx` | Main entry point for the schedule selector component. It re-exports all functions from `priceCalculations.js`. | **EXPORTS** |
| `app/src/islands/shared/useScheduleSelector.js` | A React hook for managing the schedule selector state. It calls `calculatePrice` to get the price breakdown based on selected nights. | **CALCULATES** |
| `app/src/islands/shared/useScheduleSelectorLogicCore.js`| A newer version of the schedule selector hook that also uses the legacy `calculatePrice`. | **CALCULATES** |
| `app/src/islands/shared/CreateProposalFlowV2.jsx` | The proposal creation modal. It uses `calculatePrice` to update the price as the user changes the schedule. | **CALCULATES** |
| `app/src/islands/pages/ViewSplitLeasePage/ViewSplitLeasePage.tsx` | The main page for viewing a listing. It imports `calculatePricingBreakdown` and `formatPrice` to display prices to the user. | **DISPLAYS** |
| `app/src/islands/pages/ViewSplitLeasePage/useViewSplitLeaseLogic.ts` | The logic hook for the `ViewSplitLeasePage`, which imports `calculatePricingBreakdown`. | **CALCULATES** |
| `app/src/islands/shared/ListingCard/PropertyCard.jsx` | A reusable component for displaying a listing summary. It uses `calculatePrice` to show a dynamic price based on a default number of nights. | **CALCULATES/DISPLAYS** |
| `app/src/islands/pages/SearchPage/components/PropertyCard.jsx` | An older version of the property card used on the search page, which also calculates a dynamic price. | **CALCULATES/DISPLAYS** |
| `app/src/islands/shared/GoogleMap.jsx` | The Google Map component on the search page. It uses `calculatePrice` to determine the price to show on map markers. | **CALCULATES/DISPLAYS** |
| `app/src/islands/pages/PreviewSplitLeasePage.jsx` | A page for hosts to preview their own listing. It imports pricing functions to simulate the guest view. | **DISPLAYS** |
| `app/src/logic/processors/proposals/processProposalData.js`| A data processor for proposal data. It imports `formatPrice` for display formatting purposes. | **READS** |

## 2. Files Referencing `pricing_list` or `pricingList`

These files are part of the new, centralized pricing system that uses pre-calculated pricing arrays stored in the `pricing_list` table.

| File Path | Description | Role |
| --- | --- | --- |
| `app/src/logic/workflows/pricingList/savePricingWorkflow.js` | Orchestrates the entire calculation process for a `pricing_list` record, using various calculators to generate all required arrays. | **CALCULATES** |
| `app/src/logic/workflows/pricingList/initializePricingListWorkflow.js` | Creates a new, empty `pricing_list` record when a new listing is created. | **CALCULATES** |
| `app/src/logic/workflows/pricingList/recalculatePricingListWorkflow.js`| A workflow to determine if a `pricing_list` is stale and needs to be recalculated by calling `savePricingWorkflow`. | **CALCULATES** |
| `app/src/logic/rules/pricingList/isPricingListValid.js` | A rule function that validates the structure and integrity of a `pricingList` object. | **READS** |
| `app/src/logic/rules/pricingList/shouldRecalculatePricing.js` | A rule function that compares a listing's host rates to a `pricingList` to see if a recalculation is necessary. | **READS** |
| `app/src/logic/processors/pricingList/adaptPricingListFromSupabase.js` | Processor that transforms a raw `pricing_list` row from Supabase (with spaces in column names) into a frontend-friendly camelCase `pricingList` object. | **READS** |
| `app/src/logic/processors/pricingList/adaptPricingListForSupabase.js` | Processor that transforms a frontend `pricingList` object into the format required for a Supabase `pricing_list` table row. | **READS** |
| `app/src/logic/processors/pricingList/formatPricingListForDisplay.js` | Processor that takes a `pricingList` object and formats its values into human-readable strings for display in the UI (e.g., `$100/night`). | **DISPLAYS** |
| `app/src/islands/pages/ZPricingUnitTestPage/useZPricingUnitTestPageLogic.js`| **Core testing tool.** This logic hook fetches a listing's `pricing_list` record and uses the `pricingList` state extensively to run validation checks and compare against other calculation methods. | **READS/CALCULATES** |
| `app/src/islands/pages/ZPricingUnitTestPage/components/Section10PricingListGrid.jsx` | A UI component on the pricing test page that renders the raw arrays from a `pricingList` object into a table for debugging. | **DISPLAYS** |

## 3. Components Displaying Price Values

These components are responsible for rendering prices, totals, fees, and other cost-related information to the user.

| File Path | Description | Role |
| --- | --- | --- |
| `app/src/islands/pages/ViewSplitLeasePage/ViewSplitLeasePage.tsx` | The main listing detail page. It contains the primary booking widget where users see the price breakdown for their selected schedule. | **DISPLAYS** |
| `app/src/islands/shared/PriceDisplay.jsx` | A dedicated component for showing a detailed price breakdown, including base price, discounts, markups, and totals. | **DISPLAYS** |
| `app/src/islands/shared/ListingCard/PropertyCard.jsx` | The standard listing card. It shows a "Starting at" price or a dynamic price calculated for a default number of nights. | **DISPLAYS** |
| `app/src/islands/shared/GoogleMap.jsx` | Renders price markers on the map for each listing in the search results. | **DISPLAYS** |
| `app/src/islands/pages/ProposalManagePage/QuickProposalCreation.jsx` | An admin tool for creating proposals. It displays a pricing estimate as the admin fills out the form. | **DISPLAYS** |
| `app/src/islands/pages/proposals/ProposalCard.jsx` & `ExpandableProposalCard.jsx` | These components display the pricing details of a specific proposal, including nightly rate and total reservation cost. | **DISPLAYS** |
| `app/src/islands/pages/ZPricingUnitTestPage/` | The entire set of components under this directory is dedicated to displaying every aspect of the pricing calculations for debugging and validation. | **DISPLAYS** |
| `app/src/islands/pages/QuickPricePage/components/PriceEditModal.jsx` | An admin tool that displays and allows editing of various pricing rates for a listing. | **DISPLAYS** |
| `app/src/islands/shared/SuggestedProposals/components/PriceDisplay.jsx`| A specific price display component used within the "Suggested Proposal" feature. | **DISPLAYS** |

## 4. Files Containing "markup", "discount", "multiplier", "nightlyPrice"

This section lists key files that define or calculate core pricing components.

| File Path | Description | Role |
| --- | --- | --- |
| `app/src/logic/constants/pricingConstants.js` | **Key definitions.** This file contains the constant values for `SITE_MARKUP_RATE`, `FULL_TIME_DISCOUNT_RATE`, and `DEFAULT_UNUSED_NIGHTS_DISCOUNT`. | **READS** |
| `app/src/logic/calculators/pricingList/calculateCombinedMarkup.js` | Calculator function that combines the site-wide `markup` and a listing's individual `unitMarkup`. | **CALCULATES** |
| `app/src/logic/calculators/pricingList/calculateUnusedNightsDiscountArray.js` | Calculator function that generates the array of `discount` percentages based on the number of unused nights. | **CALCULATES** |
| `app/src/logic/calculators/pricingList/calculateMarkupAndDiscountMultipliersArray.js` | Calculator that combines the `markup` and `discount` values into a final `multiplier` array, which is then applied to the host's compensation. | **CALCULATES** |
| `app/src/logic/calculators/pricingList/calculateNightlyPricesArray.js` | Calculator that applies the `multiplier` array to the host's compensation array to produce the final guest-facing `nightlyPrice` array. | **CALCULATES** |
| `app/src/logic/calculators/pricing/calculateGuestFacingPrice.js` | Legacy calculator that directly computes a guest price by applying `markup` and `discount`. | **CALCULATES** |
| `app/src/islands/pages/ListingsOverviewPage/api.js` | Contains logic for bulk-updating listing prices using a `multiplier`. | **CALCULATES** |
| `app/src/islands/pages/ZPricingUnitTestPage/useZPricingUnitTestPageLogic.js`| References all these terms (`markup`, `discount`, `nightlyPrice`) to perform its validation checks. | **READS/CALCULATES** |
| `app/src/islands/pages/ProposalManagePage/QuickProposalCreation.jsx` | References `nightlyPrice` when creating a new proposal. | **READS/DISPLAYS** |
| `app/src/islands/modals/GuestEditingProposalModal.jsx` | References and displays `nightlyPrice` and other price components when a guest edits a proposal. | **READS/DISPLAYS** |

