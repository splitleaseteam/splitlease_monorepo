# Split Lease Codebase File Inventory

**Generated:** 2026-01-28
**Total Files (excluding node_modules/.git):** 3,538

---

## 1. Directory Structure Summary

### Root Level Directories

| Directory | File Count | Description |
|-----------|------------|-------------|
| `app/` | ~2,400+ | Frontend React application (Vite + Islands Architecture) |
| `supabase/` | ~372 | Backend Edge Functions + Migrations |
| `pythonanywhere/` | ~100 | Python Flask API services |
| `.claude/` | 622 | Claude configuration, agents, plans, documentation |
| `docs/` | 91 | Project documentation and screenshots |
| `e2e/` | 18 | Playwright end-to-end tests |
| `scripts/` | 20 | Utility and automation scripts |
| `.github/` | 16 | GitHub Actions workflows and scripts |
| `slack-api/` | ~5 | Slack integration utilities |

### Frontend (`app/`) Structure

| Directory | File Count | Description |
|-----------|------------|-------------|
| `app/src/islands/pages/` | 678 | Page components (59 page directories) |
| `app/src/islands/shared/` | 253 | Shared/reusable components (38 component directories) |
| `app/src/islands/modals/` | 21 | Modal components |
| `app/src/logic/` | 197 | Business logic (four-layer architecture) |
| `app/src/lib/` | 64 | Utility libraries and API clients |
| `app/src/styles/` | 65 | CSS stylesheets |
| `app/src/hooks/` | 7 | Custom React hooks |
| `app/public/` | ~260 | Static assets and HTML entry points |
| `app/dist/` | ~150 | Build output |

### Business Logic Layer (`app/src/logic/`)

| Directory | File Count | Description |
|-----------|------------|-------------|
| `calculators/` | 57 files | Pure calculation functions |
| `rules/` | 65 files | Boolean predicate functions |
| `processors/` | 39 files | Data transformation functions |
| `workflows/` | 22 files | Multi-step orchestration functions |
| `validators/` | ~5 files | Input validation functions |
| `simulators/` | ~3 files | Simulation utilities |
| `constants/` | ~6 files | Shared constants |

### Backend Edge Functions (`supabase/functions/`)

| Directory | File Count | Description |
|-----------|------------|-------------|
| `_shared/` | 25 | Shared utilities (CORS, errors, types) |
| Function directories | 51 | Individual Edge Function endpoints |

---

## 2. File Type Inventory

### By Extension

| Extension | Count | Description |
|-----------|-------|-------------|
| `.jsx` | 706 | React JSX components |
| `.js` | 426 | JavaScript files |
| `.ts` | 326 | TypeScript files (Edge Functions) |
| `.tsx` | 35 | TypeScript React components |
| `.css` | 266 | Stylesheets |
| `.md` | 655 | Markdown documentation |
| `.json` | 78 | Configuration and data files |
| `.html` | 149 | HTML entry points |
| `.sql` | 9 | Database migration files |
| `.py` | 127 | Python files (PythonAnywhere) |

### Test Files

| Type | Count |
|------|-------|
| Unit/Integration Tests (`.test.js/jsx/ts/tsx`) | 48 |
| Storybook Stories (`.stories.jsx/tsx/js`) | 11 |
| E2E Tests (`.spec.ts`) | 6 |

### Special File Types

| Type | Count | Location |
|------|-------|----------|
| Logic Hooks (`use*Logic.js`) | 67 | `app/src/islands/` |
| MDX Documentation | 3 | `app/src/islands/` |
| GitHub Workflows | 6 | `.github/workflows/` |

---

## 3. Entry Points

### HTML Entry Points (`app/public/`)

**Total: 149 HTML files**

#### Main Application Pages (42)
```
index.html                    - Landing page
search.html                   - Property search
view-split-lease.html         - Listing detail page
account-profile.html          - User profile
messages.html                 - Messaging interface
guest-proposals.html          - Guest proposals dashboard
host-proposals.html           - Host proposals dashboard
guest-leases.html             - Guest leases
host-leases.html              - Host leases
listings-overview.html        - Listings overview
listing-dashboard.html        - Individual listing management
self-listing.html             - List your property (v1)
self-listing-v2.html          - List your property (v2)
list-with-us.html             - Host signup
list-with-us-v2.html          - Host signup (v2)
proposal-manage.html          - Proposal management
about-us.html                 - About page
faq.html                      - FAQ
careers.html                  - Careers page
policies.html                 - Policies page
why-split-lease.html          - Value proposition
host-guarantee.html           - Host guarantee info
auth-verify.html              - Auth verification
reset-password.html           - Password reset
404.html                      - Not found page
```

#### Admin/Internal Pages (20)
```
admin-threads.html            - Admin messaging threads
verify-users.html             - User verification admin
manage-informational-texts.html - CMS for informational texts
manage-leases-payment-records.html - Payment records admin
manage-rental-applications.html - Rental applications admin
manage-virtual-meetings.html  - Virtual meeting admin
message-curation.html         - Message curation
modify-listings.html          - Bulk listing modifications
send-magic-login-links.html   - Magic link admin
simulation-admin.html         - Simulation admin
usability-data-management.html - Usability data admin
ai-tools.html                 - AI tools admin
co-host-requests.html         - Co-host requests
create-document.html          - Document creation
create-suggested-proposal.html - Suggested proposal creation
internal-emergency.html       - Emergency management
reviews-overview.html         - Reviews admin
experience-responses.html     - Experience survey responses
leases-overview.html          - Leases overview admin
qr-code-landing.html          - QR code landing
```

#### Help Center Articles (50+)
```
help-center.html              - Help center index
help-center-category.html     - Category pages
help-center-articles/         - Individual articles
  guests/                     - Guest-focused articles
    before-booking/           - Pre-booking guides
    booking/                  - Booking process
    during-stay/              - Stay management
    getting-started/          - Onboarding
    pricing/                  - Pricing info
    trial-nights/             - Trial night info
  hosts/                      - Host-focused articles
    getting-started/          - Host onboarding
    legal/                    - Legal information
    listing/                  - Listing management
    management/               - Property management
    managing/                 - Ongoing management
  knowledge-base/             - General knowledge articles
```

#### Testing/Demo Pages (20)
```
internal-test.html
listing-card-demo.html
listing-card-f.html
logged-in-avatar-demo.html
referral-demo.html
simulation-guest-mobile.html
simulation-host-mobile.html
simulation-guestside-demo.html
simulation-hostside-demo.html
z-emails-unit.html
z-schedule-test.html
z-search-unit-test.html
z-sharath-test.html
z-unit-chatgpt-models.html
z-unit-payment-records-js.html
_pricing-unit-test.html
```

#### Other Pages (17)
```
favorite-listings.html
guest-experience-review.html
host-experience-review.html
guest-relationships.html
guest-simulation.html
guest-success.html
host-success.html
house-manual.html
visit-manual.html
rental-application.html
report-emergency.html
referral.html
referral-invite.html
preview-split-lease.html
quick-match.html
quick-price.html
signup-trial-host.html
```

### Edge Function Entry Points (`supabase/functions/*/index.ts`)

**Total: 51 Edge Functions**

#### Authentication & User Management
```
auth-user/index.ts            - Login, signup, password reset, OAuth
verify-users/index.ts         - User verification
identity-verification/index.ts - Identity verification
magic-login-links/index.ts    - Magic link generation
```

#### Listing & Property
```
listing/index.ts              - CRUD for listings
pricing/index.ts              - Pricing calculations
pricing-admin/index.ts        - Pricing admin operations
pricing-list/index.ts         - Pricing list management
house-manual/index.ts         - House manual generation
```

#### Proposals & Bookings
```
proposal/index.ts             - Proposal CRUD
quick-match/index.ts          - Guest-listing matching
date-change-request/index.ts  - Date change requests
```

#### Leases & Payments
```
lease/index.ts                - Lease management
leases-admin/index.ts         - Lease admin operations
guest-payment-records/index.ts - Guest payment tracking
host-payment-records/index.ts - Host payment tracking
```

#### Communication
```
messages/index.ts             - Real-time messaging
message-curation/index.ts     - Message curation
send-email/index.ts           - Email sending
send-sms/index.ts             - SMS sending
communications/index.ts       - Communication orchestration
```

#### AI Features
```
ai-gateway/index.ts           - OpenAI proxy with prompts
ai-parse-profile/index.ts     - Profile parsing
ai-room-redesign/index.ts     - Room redesign AI
ai-signup-guest/index.ts      - AI-powered guest signup
ai-tools/index.ts             - AI tools (deepfake, jingle, narration)
query-leo/index.ts            - AI assistant
```

#### Admin & Operations
```
rental-applications/index.ts  - Rental application management
rental-application/index.ts   - Single application handling
reviews-overview/index.ts     - Reviews management
experience-survey/index.ts    - Experience surveys
informational-texts/index.ts  - CMS content management
usability-data-admin/index.ts - Usability data
verify-users/index.ts         - User verification
```

#### Integrations
```
bubble_sync/index.ts          - Bubble.io sync queue
cohost-request/index.ts       - Co-host requests
cohost-request-slack-callback/index.ts - Slack callbacks
slack/index.ts                - Slack integration
virtual-meeting/index.ts      - Virtual meeting scheduling
```

#### Utilities
```
document/index.ts             - Document generation
emergency/index.ts            - Emergency reporting
qr-codes/index.ts             - QR code management
qr-generator/index.ts         - QR code generation
reminder-scheduler/index.ts   - Reminder scheduling
workflow-enqueue/index.ts     - Background job queue
workflow-orchestrator/index.ts - Workflow execution
```

#### Guest/Host Management
```
guest-management/index.ts     - Guest operations
co-host-requests/index.ts     - Co-host request handling
```

#### Simulations
```
simulation-admin/index.ts     - Simulation admin
simulation-guest/index.ts     - Guest simulation
simulation-host/index.ts      - Host simulation
```

### Flask Routes (`pythonanywhere/`)

**Total: 3 Flask applications, 16 route modules**

#### Main App (`pythonanywhere/mysite/app.py`)

| Module | Route File | Endpoints |
|--------|-----------|-----------|
| Calendar Automation | `calendar_automation/routes.py` | Google Calendar OAuth & sync |
| Core Monitoring | `core/monitoring/routes.py` | Health checks |
| Curated Listings PDF | `curated_listings_pdf/routes.py` | PDF generation |
| Doc Parser | `doc_parser/routes.py` | Google Docs parsing |
| Google Drive | `google_drive/routes.py` | Drive file upload |
| House Manual PDF | `house_manual_pdf/routes.py` | House manual generation |
| Knowledge Search | `knowledge_search_module/routes.py` | Knowledge base search |
| Node Monitor | `node_monitor/routes.py` | Node.js app monitoring |
| Signup Automation | `signup_automation_zap/routes.py` | Signup automation |
| Slack Events | `slack_events/routes.py` | Slack event handling |
| User Search | `user_search_module/routes.py` | User search API |

#### Secondary Apps
- `pythonanywhere/mysite2/app.py` - QR Generator & URL Shortener
- `pythonanywhere/mysite3/app.py` - Additional services

---

## 4. Configuration Files

### Root Level
```
.env                          - Environment variables (exists)
.mcp.json                     - MCP server configuration
.gitignore                    - Git ignore rules
.gitattributes                - Git attributes
.node-version                 - Node.js version (v20+)
.pages.toml                   - Cloudflare Pages configuration
knip.json                     - Knip unused code analyzer config
package.json                  - Root package dependencies
bun.lock                      - Bun lockfile
```

### Frontend (`app/`)
```
app/.env                      - App environment (exists)
app/.env.development          - Development environment (exists)
app/.env.production           - Production environment (exists)
app/package.json              - Frontend dependencies
app/vite.config.js            - Vite bundler configuration
app/vitest.config.js          - Vitest test configuration
app/eslint.config.js          - ESLint configuration
app/tailwind.config.js        - Tailwind CSS configuration
app/postcss.config.js         - PostCSS configuration
app/tsconfig.json             - TypeScript configuration
app/tsconfig.node.json        - Node TypeScript config
app/src/routes.config.js      - Route registry (single source of truth)
app/CLAUDE.md                 - App-specific Claude instructions
```

### Backend (`supabase/`)
```
supabase/.env.sample          - Sample environment template
supabase/.gitignore           - Supabase gitignore
supabase/functions/deno.json  - Deno configuration for Edge Functions
supabase/CLAUDE.md            - Backend-specific Claude instructions
```

### E2E Testing
```
e2e/playwright.config.ts      - Playwright E2E configuration
```

### GitHub
```
.github/workflows/*.yml       - CI/CD workflow definitions (6 workflows)
.github/scripts/*             - Helper scripts for CI
.github/SECRETS_SETUP.md      - GitHub secrets documentation
```

### Claude Configuration
```
.claude/CLAUDE.md             - Main Claude instructions
.claude/settings.json         - Claude settings (if exists)
.claude/agents/*.md           - Agent definitions
.claude/skills/*.md           - Skill definitions
.claude/commands/*.md         - Command definitions
```

---

## 5. Size Analysis

### Largest Source Files (by line count)

| File | Lines | Description |
|------|-------|-------------|
| `app/src/styles/components/guest-proposals.css` | 4,106 | Guest proposals styling |
| `app/src/styles/components/listing-dashboard.css` | 3,393 | Listing dashboard styling |
| `app/src/styles/components/search-page.css` | 3,169 | Search page styling |
| `app/src/islands/pages/ViewSplitLeasePage/ViewSplitLeasePage.tsx` | 3,041 | View listing page component |
| `app/src/styles/components/messaging.css` | 2,741 | Messaging styling |
| `app/src/islands/pages/ViewSplitLeasePage_LEGACY/ViewSplitLeasePage.jsx` | 2,659 | Legacy view listing page |
| `app/src/islands/shared/SignUpLoginModal.jsx` | 2,646 | Auth modal component |
| `app/src/islands/pages/SelfListingPageV2/styles/SelfListingPageV2.css` | 2,618 | Self listing v2 styling |
| `app/src/islands/pages/AccountProfilePage/AccountProfilePage.css` | 2,551 | Account profile styling |
| `app/src/islands/pages/SelfListingPageV2/SelfListingPageV2.tsx` | 2,426 | Self listing v2 component |
| `app/src/islands/shared/AiSignupMarketReport/AiSignupMarketReport.jsx` | 2,339 | AI market report component |
| `app/src/styles/components/listings.css` | 2,317 | Listings styling |
| `app/src/lib/auth.js` | 1,985 | Authentication library |

### Largest Edge Function Files

| File | Lines | Description |
|------|-------|-------------|
| `supabase/functions/leases-admin/index.ts` | 1,169 | Lease admin operations |
| `supabase/functions/message-curation/index.ts` | 871 | Message curation |
| `supabase/functions/emergency/index.ts` | 867 | Emergency handling |
| `supabase/functions/proposal/actions/create_suggested.ts` | 862 | Suggested proposal creation |
| `supabase/functions/rental-applications/index.ts` | 835 | Rental applications |
| `supabase/functions/proposal/actions/create.ts` | 796 | Proposal creation |
| `supabase/functions/ai-parse-profile/index.ts` | 726 | AI profile parsing |
| `supabase/functions/pricing-admin/index.ts` | 722 | Pricing admin |
| `supabase/functions/co-host-requests/index.ts` | 716 | Co-host requests |

### Directories with Most Files

| Directory | File Count |
|-----------|------------|
| `app/src/islands/pages/` | 678 |
| `.claude/` | 622 |
| `supabase/functions/` | 362 |
| `app/src/islands/shared/` | 253 |
| `app/src/logic/` | 197 |
| `app/public/` | ~260 |
| `docs/` | 91 |
| `pythonanywhere/mysite/modules/` | 88 |

---

## 6. Notable Files & Patterns

### Page Component Directories (59 total)

Active production pages:
- `AboutUsPage/`
- `AccountProfilePage/`
- `AdminThreadsPage/`
- `AiToolsPage/`
- `AuthVerifyPage/`
- `CoHostRequestsPage/`
- `CreateDocumentPage/`
- `CreateSuggestedProposalPage/`
- `ExperienceResponsesPage/`
- `FavoriteListingsPage/`
- `guest-leases/`
- `GuestExperienceReviewPage/`
- `GuestRelationshipsDashboard/`
- `GuestSimulationPage/`
- `HostExperienceReviewPage/`
- `HostLeasesPage/`
- `HostOverviewPage/`
- `HostProposalsPage/`
- `HouseManualPage/`
- `InternalEmergencyPage/`
- `LeasesOverviewPage/`
- `ListingDashboardPage/`
- `ListingsOverviewPage/`
- `ManageInformationalTextsPage/`
- `ManageLeasesPaymentRecordsPage/`
- `ManageRentalApplicationsPage/`
- `ManageVirtualMeetingsPage/`
- `MessageCurationPage/`
- `MessagingPage/`
- `ModifyListingsPage/`
- `ProposalManagePage/`
- `proposals/` (Guest proposals)
- `QrCodeLandingPage/`
- `QuickPricePage/`
- `RentalApplicationPage/`
- `ReportEmergencyPage/`
- `ReviewsOverviewPage/`
- `SearchPage/`
- `SelfListingPage/`
- `SelfListingPageV2/`
- `SendMagicLoginLinksPage/`
- `SimulationAdminPage/`
- `SimulationGuestMobilePage/`
- `SimulationGuestsideDemoPage/`
- `SimulationHostMobilePage/`
- `SimulationHostsideDemoPage/`
- `UsabilityDataManagementPage/`
- `ViewSplitLeasePage/`
- `ViewSplitLeasePageComponents/`
- `ViewSplitLeasePage_LEGACY/`

Test/development pages (prefixed with Z):
- `ZEmailsUnitPage/`
- `ZPricingUnitTestPage/`
- `ZScheduleTestPage/`
- `ZSearchUnitTestPage/`
- `ZSharathTestPage/`
- `ZUnitChatgptModelsPage/`
- `ZUnitPaymentRecordsJsPage/`

### Shared Component Directories (38 total)

- `AdminHeader/`
- `AIImportAssistantModal/`
- `AIRoomRedesign/`
- `AiSignupMarketReport/`
- `AISuggestions/`
- `AITools/`
- `ConfirmDeleteModal/`
- `CreateDuplicateListingModal/`
- `CreateProposalFlowV2Components/`
- `CustomDatePicker/`
- `DateChangeRequestManager/`
- `EditListingDetails/`
- `FavoriteButton/`
- `FeedbackWidget/`
- `Header/`
- `HeaderMessagingPanel/`
- `HostEditingProposal/`
- `HostReviewGuest/`
- `HostScheduleSelector/`
- `IdentityVerification/`
- `ImportListingModal/`
- `ImportListingReviewsModal/`
- `ListingCard/`
- `LoggedInAvatar/`
- `LoggedInHeaderAvatar2/`
- `NotificationSettingsIsland/`
- `QRCodeDashboard/`
- `QuickMatch/`
- `ReminderHouseManual/`
- `RentalApplicationWizardModal/`
- `ScheduleCohost/`
- `SignUpTrialHost/`
- `SubmitListingPhotos/`
- `SuggestedProposals/`
- `UsabilityPopup/`
- `VirtualMeetingManager/`
- `VisitReviewerHouseManual/`
- `__stories__/`

### Database Migrations (10 files)

```
20260125_identity_verification_bucket.sql
20260125_identity_verification_user_fields.sql
20260127_create_experience_survey_table.sql
20260127_create_qr_codes_table.sql
20260127_create_review_tables.sql
20260128_alter_pricing_list_add_scalars.sql
20260128_create_notification_audit.sql
20260128_database_views.sql
20260128_materialized_views.sql
20260128_performance_indexes.sql
```

### GitHub Workflows (6 files)

```
claude-code-review.yml        - Automated code review
claude.yml                    - Claude integration
deploy-edge-functions-dev.yml - Dev Edge Function deployment
deploy-edge-functions-prod.yml - Prod Edge Function deployment
deploy-frontend-dev.yml       - Dev frontend deployment
deploy-frontend-prod.yml      - Prod frontend deployment
deploy-pythonanywhere.yml     - PythonAnywhere deployment
```

### E2E Test Files

```
e2e/fixtures/
  auth.fixture.ts             - Authentication fixtures
  test-data-factory.ts        - Test data generation

e2e/pages/
  base.page.ts                - Base page object
  home.page.ts                - Home page object
  search.page.ts              - Search page object
  account-profile.page.ts     - Profile page object
  admin-threads.page.ts       - Admin threads page object
  guest-proposals.page.ts     - Guest proposals page object
  host-proposals.page.ts      - Host proposals page object
  listing-detail.page.ts      - Listing detail page object
  index.ts                    - Page exports

e2e/tests/
  accessibility.spec.ts       - Accessibility tests
  admin.spec.ts               - Admin functionality tests
  auth.spec.ts                - Authentication tests
  booking.spec.ts             - Booking flow tests
  profile.spec.ts             - Profile tests
  search.spec.ts              - Search tests
```

---

## 7. Summary Statistics

| Metric | Value |
|--------|-------|
| **Total Files (excluding node_modules/.git)** | 3,538 |
| **Frontend Source Files** | ~1,500 |
| **Backend TypeScript Files** | 326 |
| **Python Files** | 127 |
| **Stylesheets** | 266 |
| **HTML Entry Points** | 149 |
| **Markdown Documentation** | 655 |
| **Test Files** | 48 + 6 E2E |
| **Edge Functions** | 51 |
| **Page Components** | 59 |
| **Shared Components** | 38 |
| **Logic Hooks** | 67 |
| **Database Migrations** | 10 |
| **CI/CD Workflows** | 6 |

---

*Report generated by comprehensive codebase scan*
