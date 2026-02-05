# formatCurrency Implementations

## Definitions Found (Host Dashboard + related shared)
| File | Line | Signature | Shows Cents? | Notes |
| :--- | ---: | :--- | :---: | :--- |
| app/src/islands/pages/ListingDashboardPage/components/PricingSection.jsx | 23 | `(amount)` | ❌ | Inline NumberFormat, no cents |
| app/src/islands/pages/ListingDashboardPage/components/PricingEditSection.jsx | 370 | `(amount)` | ❌ | Inline NumberFormat, no cents |
| app/src/islands/pages/ListingDashboardPage/components/NightlyPricingLegend.jsx | 31 | `(amount)` | ❌ | Inline NumberFormat, no cents |
| app/src/islands/shared/PriceAnchoring/SavingsBadge.jsx | 63 | `(val)` | ❌ | Inline NumberFormat, no cents |
| app/src/islands/pages/ListingDashboardPage/components/PricingEditSection/usePricingLogic.js | 263 | `(amount)` | ❌ | Inline NumberFormat, no cents |
| app/src/islands/shared/PriceAnchoring/PriceTierCard.jsx | 30 | `(val)` | ✅ | Inline NumberFormat, minimumFractionDigits: 2 |

## Other Definitions (Outside Host Dashboard, not reviewed)
- app/src/logic/processors/documents/formatters.js
- app/src/logic/calculators/pricing/calculateFeeBreakdown.js
- app/src/logic/calculators/feeCalculations.js
- app/src/logic/bidding/rules/validateBid.js
- app/src/logic/bidding/rules/isBidValid.js
- app/src/logic/bidding/processors/processAutoBid.js
- app/src/logic/bidding/index.js
- app/src/lib/api/currency.ts
- app/src/islands/shared/UrgencyCountdown/utils/urgencyCalculations.ts
- app/src/islands/shared/DateChangeRequestManager/utils/formatting.ts
- app/src/islands/shared/BiddingInterface/BiddingInterface.jsx
- app/src/islands/shared/BiddingInterface/BiddingHistory.jsx
- app/src/islands/pages/proposals/displayUtils.js
- app/src/islands/pages/guest-leases/PaymentRecordsTable.jsx
- app/src/islands/pages/ZUnitPaymentRecordsJsPage/useZUnitPaymentRecordsJsPageLogic.js
- app/src/islands/pages/ZPricingUnitTestPage/ZPricingUnitTestPage.jsx
- app/src/islands/pages/ZPricingUnitTestPage/components/Section5PricingListGrid.jsx
- app/src/islands/pages/ZPricingUnitTestPage/components/Section6WorkflowCheck.jsx
- app/src/islands/pages/ProposalManagePage/ProposalItem.jsx
- app/src/islands/pages/HostProposalsPage/formatters.js
- app/src/islands/modals/GuestEditingProposalModal.jsx
- app/src/islands/pages/ZScheduleTestPage/ZScheduleTestPage.jsx
- app/src/islands/pages/ManageLeasesPaymentRecordsPage/components/StaysSection/StayCard.jsx
- app/src/islands/pages/ManageLeasesPaymentRecordsPage/components/PaymentRecordsSection/PaymentTable.jsx
- app/src/islands/pages/ManageLeasesPaymentRecordsPage/components/LeaseDetailsSection/LeaseDetailsSection.jsx
- app/src/islands/pages/HostOverviewPage/components/HostOverviewCards.jsx
- app/src/islands/modals/EditProposalModal.jsx
- app/src/islands/pages/ListingsOverviewPage/index.jsx
- app/src/islands/shared/HostEditingProposal/types.js
- app/src/islands/pages/HostLeasesPage/formatters.js
- app/src/islands/modals/ProposalDetailsModal.jsx
- app/src/islands/pages/ManageRentalApplicationsPage/components/ApplicationsTable.jsx
- app/src/islands/pages/ManageRentalApplicationsPage/components/ApplicationDetailView.jsx
- app/src/islands/pages/ListingsOverviewPage/components/ListingRow.jsx
- app/src/islands/pages/GuestRelationshipsDashboard/components/ProposalsSection.jsx
- app/src/logic/processors/leases/formatLeaseDisplay.js
- app/src/islands/shared/CreateProposalFlowV2Components/ReviewSection.jsx
- app/src/islands/pages/CreateSuggestedProposalPage/components/ProposalSummary.jsx
- app/src/islands/pages/CreateSuggestedProposalPage/components/PriceBreakdown.jsx

## Usage Analysis (Host Dashboard scope)
| Caller File | Which Definition? | Expects Cents? |
| :--- | :--- | :---: |
| app/src/islands/pages/ListingDashboardPage/components/PricingSection.jsx | Inline (now lib/formatters.js) | ❌ |
| app/src/islands/pages/ListingDashboardPage/components/PricingEditSection.jsx | Inline (now lib/formatters.js) | ❌ |
| app/src/islands/pages/ListingDashboardPage/components/NightlyPricingLegend.jsx | Inline (now lib/formatters.js) | ❌ |
| app/src/islands/shared/PriceAnchoring/SavingsBadge.jsx | Inline (now lib/formatters.js) | ❌ |
| app/src/islands/shared/PriceAnchoring/PriceTierCard.jsx | Inline (local) | ✅ |
| app/src/islands/pages/ListingDashboardPage/components/PricingEditSection/usePricingLogic.js | Inline (local) | ❌ |

## Recommendation
Use `app/src/lib/formatters.js` as the canonical `formatCurrency` for Host Dashboard surfaces. It matches the no-cents display used in PricingSection, PricingEditSection, NightlyPricingLegend, and SavingsBadge, while allowing cents when needed via `showCents`. Follow-up candidates: migrate `app/src/islands/pages/ListingDashboardPage/components/PricingEditSection/usePricingLogic.js` and `app/src/islands/shared/PriceAnchoring/PriceTierCard.jsx` to the shared formatter when their formatting requirements align.
