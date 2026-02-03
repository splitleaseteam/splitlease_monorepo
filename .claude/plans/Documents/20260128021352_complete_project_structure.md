# Split Lease - Complete Project Structure Documentation

**Generated:** 2026-01-28 02:13:52
**Purpose:** Comprehensive mapping of the entire project structure with explanations

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Root Directory Structure](#root-directory-structure)
3. [Architecture Overview](#architecture-overview)
4. [Directory Deep Dive](#directory-deep-dive)
   - [.claude/](#claude-directory)
   - [.github/](#github-directory)
   - [app/](#app-directory---main-frontend)
   - [supabase/](#supabase-directory---backend)
   - [pythonAnywhere/](#pythonanywhere-directory)
   - [docs/](#docs-directory)
   - [scripts/](#scripts-directory)
   - [slack-api/](#slack-api-directory)
   - [frontend/](#frontend-directory---legacy)
5. [Flow Diagrams](#flow-diagrams)
6. [Key Files Reference](#key-files-reference)

---

## Project Overview

Split Lease is a flexible rental marketplace for NYC properties that enables:
- Split scheduling (multiple guests sharing rental periods)
- Repeat stays
- Proposal-based booking

**Tech Stack:**
- **Frontend:** React 18 + Vite (Islands Architecture, NOT SPA)
- **Backend:** Supabase Edge Functions (Deno/TypeScript)
- **Database:** Supabase PostgreSQL
- **Deployment:** Cloudflare Pages
- **Legacy:** Bubble.io (migrating away)

---

## Root Directory Structure

```
Split Lease - Team/
├── .claude/                    # Claude AI configuration and skills
├── .github/                    # GitHub Actions workflows and scripts
├── .vscode/                    # VS Code workspace settings
├── .wrangler/                  # Cloudflare Wrangler local state
├── app/                        # ★ MAIN FRONTEND APPLICATION ★
├── docs/                       # Project documentation
├── frontend/                   # Legacy frontend (deprecated build artifacts)
├── node_modules/               # Root-level dependencies (mainly for Knip)
├── pythonAnywhere/             # Python backend services (PythonAnywhere hosted)
├── scripts/                    # Project-wide utility scripts
├── slack-api/                  # Slack integration API
├── supabase/                   # ★ BACKEND EDGE FUNCTIONS ★
│
├── .env                        # Environment variables (gitignored locally)
├── .gitattributes              # Git attributes configuration
├── .gitignore                  # Git ignore patterns
├── .mcp.json                   # MCP server configuration
├── .node-version               # Node version specification
├── .pages.toml                 # Cloudflare Pages configuration
├── bun.lock                    # Bun package lock file
├── knip.json                   # Knip (dead code detection) config
├── package.json                # Root package.json
├── README.md                   # Project README
└── [Various .md files]         # Handoff docs, prompts, reports
```

---

## Architecture Overview

### Islands Architecture Pattern

Unlike a traditional SPA (Single Page Application), Split Lease uses an **Islands Architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│                      ISLANDS ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Each HTML page is an independent React root:                   │
│                                                                  │
│  public/index.html → src/main.jsx → islands/pages/HomePage      │
│  public/search.html → src/search.jsx → islands/pages/SearchPage │
│  public/admin/*.html → src/admin/*.jsx → islands/pages/Admin*   │
│                                                                  │
│  ✓ Full page loads between pages (no client-side routing)       │
│  ✓ Each page bundles only what it needs                         │
│  ✓ Independent hydration per island                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Four-Layer Business Logic Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                    FOUR-LAYER LOGIC PATTERN                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: CALCULATORS (app/src/logic/calculators/)             │
│  ├─ Pure functions, no side effects                             │
│  ├─ Mathematical computations                                   │
│  └─ Example: calculateMonthlyPrice(), computeNightlyRate()     │
│                                                                  │
│  Layer 2: RULES (app/src/logic/rules/)                          │
│  ├─ Boolean predicates                                          │
│  ├─ Business rule validation                                    │
│  └─ Example: isEligibleForTrial(), canBookDates()              │
│                                                                  │
│  Layer 3: PROCESSORS (app/src/logic/processors/)                │
│  ├─ Data transformations                                        │
│  ├─ Format conversions                                          │
│  └─ Example: formatProposalForDisplay(), transformLeaseData()  │
│                                                                  │
│  Layer 4: WORKFLOWS (app/src/logic/workflows/)                  │
│  ├─ Orchestration of calculators, rules, processors            │
│  ├─ Complex multi-step operations                               │
│  └─ Example: processBookingWorkflow(), handleProposalSubmit()  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### System Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SYSTEM ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐         ┌──────────────────┐         ┌───────────────┐   │
│  │   Browser    │ ──────► │  Cloudflare      │ ──────► │  app/dist/    │   │
│  │   Request    │         │  Pages CDN       │         │  Static Files │   │
│  └──────────────┘         └──────────────────┘         └───────────────┘   │
│         │                                                                    │
│         │ API Calls                                                          │
│         ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     SUPABASE EDGE FUNCTIONS                           │   │
│  │  supabase/functions/                                                  │   │
│  │  ├─ proposal/      → Proposal CRUD + Bubble sync                     │   │
│  │  ├─ listing/       → Listing CRUD + Bubble sync                      │   │
│  │  ├─ auth-user/     → User authentication                             │   │
│  │  ├─ messages/      → Real-time messaging                             │   │
│  │  ├─ ai-gateway/    → OpenAI proxy                                    │   │
│  │  └─ [40+ more]     → Various business logic                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│         │                                                                    │
│         ▼                                                                    │
│  ┌──────────────────────┐         ┌──────────────────────────────────┐     │
│  │  Supabase PostgreSQL │ ◄─────► │  Bubble.io (Legacy - migrating)  │     │
│  │  Primary Database    │  sync   │  via sync_queue table            │     │
│  └──────────────────────┘         └──────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Deep Dive

### .claude/ Directory

**Purpose:** Claude AI configuration, agent definitions, skills, and project documentation

```
.claude/
├── agents/                     # Subagent definitions for task orchestration
├── commands/                   # Claude slash commands
├── Documentation/              # Architecture and system documentation
│   ├── Architecture/           # System design docs
│   ├── Auth/                   # Authentication documentation
│   ├── Backend(EDGE - Functions)/  # Edge function documentation
│   │   └── Endpoints/          # Individual endpoint docs
│   ├── Database/               # Database schema docs
│   ├── External/               # Third-party integration docs
│   ├── Pages/                  # Frontend page documentation
│   ├── Reasoning/              # Decision documentation
│   └── Routing/                # Route configuration docs
├── logs/                       # Session logs
├── output-styles/              # Custom output formatting
├── plans/                      # Task planning system
│   ├── Deprecated/             # Old/superseded plans
│   ├── Documents/              # Analysis documents (YYYYMMDDHHMMSS prefix)
│   ├── Done/                   # Completed plans
│   ├── New/                    # Active plans awaiting execution
│   ├── Opportunities/          # Identified improvement opportunities
│   └── tech-debt/              # Technical debt tracking
├── regression-registry/        # Regression tracking
├── scripts/                    # Claude-specific scripts
├── skills/                     # Claude skills (reusable capabilities)
│   ├── ast-dependency-analyzer/
│   ├── context-router/
│   ├── design-reverse-engineer/
│   ├── doc-maintainer/
│   ├── fp-rater/               # Functional programming rating
│   ├── functional-code/        # FP enforcement
│   ├── git-commits/            # Commit message formatting
│   ├── screenshot-to-slack/
│   ├── skill-creator/
│   ├── slack-webhook/          # Slack notifications
│   └── vitest-rtl-setup/       # Test setup
├── temp/                       # Temporary working files
├── temp-guest-leases-page/     # Feature-specific temp
├── temp-identity-verification/ # Feature-specific temp
├── tmp/                        # Scratch space
└── CLAUDE.md                   # Project instructions for Claude
```

---

### .github/ Directory

**Purpose:** GitHub Actions CI/CD workflows and automation scripts

```
.github/
├── scripts/                    # Automation scripts
│   └── [deployment scripts]
└── workflows/                  # GitHub Actions workflows
    └── [CI/CD YAML files]
```

---

### app/ Directory - MAIN FRONTEND

**Purpose:** The primary frontend application - React 18 + Vite with Islands Architecture

```
app/
├── agents/                     # Frontend-specific agent configs
├── coverage/                   # Test coverage reports
├── dist/                       # Production build output (gitignored)
│   ├── _internal/              # Internal build artifacts
│   ├── assets/                 # Static assets (copied from public/)
│   ├── functions/              # Cloudflare Functions (if any)
│   └── help-center-articles/   # Static help content
├── functions/                  # Cloudflare Pages Functions
│   └── api/                    # API routes for CF Pages
├── node_modules/               # Frontend dependencies
├── public/                     # Static assets (copied to dist/)
│   ├── assets/                 # Images, icons, games, lotties
│   ├── help-center-articles/   # Static help documentation
│   └── images/                 # General images
├── scripts/                    # Build and utility scripts
├── src/                        # ★ SOURCE CODE ★
│   ├── __tests__/              # Test files
│   │   └── regression/         # Regression tests
│   ├── config/                 # Application configuration
│   ├── data/                   # Static data files
│   ├── hooks/                  # React custom hooks
│   ├── islands/                # ★ ISLAND COMPONENTS ★
│   │   ├── modals/             # Modal components
│   │   ├── pages/              # Page components (one per HTML entry)
│   │   ├── proposals/          # Proposal-specific components
│   │   └── shared/             # Shared island components
│   ├── lib/                    # Library utilities
│   │   ├── api/                # API client functions
│   │   ├── auth/               # Authentication utilities
│   │   ├── constants/          # Application constants
│   │   ├── proposals/          # Proposal utilities
│   │   └── scheduleSelector/   # Scheduling utilities
│   ├── logic/                  # ★ FOUR-LAYER BUSINESS LOGIC ★
│   │   ├── calculators/        # Pure calculation functions
│   │   ├── constants/          # Logic-layer constants
│   │   ├── processors/         # Data transformation
│   │   ├── rules/              # Boolean predicates
│   │   ├── simulators/         # Simulation logic
│   │   ├── validators/         # Validation functions
│   │   └── workflows/          # Orchestration layer
│   └── styles/                 # CSS/Styling
│       ├── components/         # Component styles
│       └── pages/              # Page-specific styles
├── .wrangler/                  # Wrangler local state
├── eslint.config.js            # ESLint configuration
├── index.html                  # Template for Vite
├── jsconfig.json               # JS config with path aliases
├── package.json                # Frontend dependencies
├── postcss.config.js           # PostCSS configuration
├── routes.config.js            # ★ ROUTE REGISTRY ★
├── tailwind.config.js          # Tailwind CSS configuration
├── vite.config.js              # Vite build configuration
└── vitest.config.js            # Vitest test configuration
```

---

### app/src/islands/ - Detailed Breakdown

**Purpose:** Contains all React components organized by the Islands Architecture pattern

```
app/src/islands/
├── modals/                     # Standalone modal components
├── pages/                      # One directory per page/route
│   ├── AboutUsPage/
│   ├── AccountProfilePage/
│   ├── AdminThreadsPage/
│   ├── AiToolsPage/
│   ├── AuthVerifyPage/
│   ├── CoHostRequestsPage/
│   ├── CreateDocumentPage/
│   ├── CreateSuggestedProposalPage/
│   ├── ExperienceResponsesPage/
│   ├── FavoriteListingsPage/
│   ├── GuestExperienceReviewPage/
│   ├── guest-leases/           # Guest leases feature
│   ├── GuestRelationshipsDashboard/
│   ├── GuestSimulationPage/
│   ├── HostExperienceReviewPage/
│   ├── HostLeasesPage/
│   ├── HostOverviewPage/
│   ├── HostProposalsPage/
│   ├── HouseManualPage/
│   ├── InternalEmergencyPage/
│   ├── LeasesOverviewPage/
│   ├── ListingDashboardPage/
│   ├── ListingsOverviewPage/
│   ├── ManageInformationalTextsPage/
│   ├── ManageLeasesPaymentRecordsPage/
│   ├── ManageRentalApplicationsPage/
│   ├── ManageVirtualMeetingsPage/
│   ├── MessageCurationPage/
│   ├── MessagingPage/
│   ├── ModifyListingsPage/
│   ├── ProposalManagePage/
│   ├── proposals/              # Proposal creation flow
│   ├── QrCodeLandingPage/
│   ├── QuickPricePage/
│   ├── RentalApplicationPage/
│   ├── ReportEmergencyPage/
│   ├── ReviewsOverviewPage/
│   ├── SearchPage/
│   ├── SelfListingPage/
│   ├── SelfListingPageV2/
│   ├── SendMagicLoginLinksPage/
│   ├── SimulationAdminPage/
│   ├── SimulationGuestMobilePage/
│   ├── SimulationGuestsideDemoPage/
│   ├── SimulationHostMobilePage/
│   ├── SimulationHostsideDemoPage/
│   ├── UsabilityDataManagementPage/
│   ├── ViewSplitLeasePage/
│   ├── ViewSplitLeasePage_LEGACY/
│   ├── config/                 # Page configuration
│   ├── types/                  # TypeScript types for pages
│   └── Z*Page/                 # Test/development pages (Z prefix)
├── proposals/                  # Proposal flow components
└── shared/                     # ★ SHARED COMPONENTS ★
    ├── AdminHeader/            # Admin navigation header
    ├── AIImportAssistantModal/
    ├── AIRoomRedesign/
    ├── AiSignupMarketReport/
    ├── AISuggestions/
    ├── AITools/
    ├── ConfirmDeleteModal/
    ├── CreateDuplicateListingModal/
    ├── CreateProposalFlowV2Components/
    ├── CustomDatePicker/
    ├── DateChangeRequestManager/
    ├── EditListingDetails/
    ├── FavoriteButton/
    ├── FeedbackWidget/
    ├── Header/                 # Main navigation header
    ├── HeaderMessagingPanel/
    ├── HostEditingProposal/
    ├── HostReviewGuest/
    ├── HostScheduleSelector/
    ├── IdentityVerification/
    ├── ImportListingModal/
    ├── ImportListingReviewsModal/
    ├── ListingCard/
    ├── LoggedInAvatar/
    ├── NotificationSettingsIsland/
    ├── QRCodeDashboard/
    ├── QuickMatch/
    ├── ReminderHouseManual/
    ├── RentalApplicationWizardModal/
    ├── ScheduleCohost/
    ├── SignUpTrialHost/
    ├── SubmitListingPhotos/
    ├── SuggestedProposals/
    ├── UsabilityPopup/
    ├── VirtualMeetingManager/
    └── VisitReviewerHouseManual/
```

---

### app/src/logic/ - Four-Layer Business Logic

**Purpose:** All business logic separated into four distinct layers

```
app/src/logic/
├── calculators/                # Layer 1: Pure calculation functions
│   ├── availability/           # Availability calculations
│   ├── matching/               # Guest-host matching algorithms
│   ├── payments/               # Payment calculations
│   ├── pricing/                # Price calculations
│   ├── pricingList/            # Pricing list calculations
│   ├── reminders/              # Reminder scheduling calculations
│   ├── reviews/                # Review scoring calculations
│   ├── scheduling/             # Schedule calculations
│   └── simulation/             # Simulation calculations
├── constants/                  # Logic-layer constants
├── processors/                 # Layer 3: Data transformations
│   ├── display/                # Display formatting
│   ├── experienceSurvey/       # Survey data processing
│   ├── houseManual/            # House manual processing
│   ├── leases/                 # Lease data processing
│   ├── listing/                # Listing data processing
│   ├── matching/               # Match result processing
│   ├── meetings/               # Meeting data processing
│   ├── pricingList/            # Pricing list processing
│   ├── proposal/               # Proposal processing
│   ├── proposals/              # Multi-proposal processing
│   ├── reminders/              # Reminder processing
│   ├── reviews/                # Review processing
│   ├── simulation/             # Simulation processing
│   └── user/                   # User data processing
├── rules/                      # Layer 2: Boolean predicates
│   ├── admin/                  # Admin permission rules
│   ├── auth/                   # Authentication rules
│   ├── documents/              # Document rules
│   ├── experienceSurvey/       # Survey eligibility rules
│   ├── houseManual/            # House manual rules
│   ├── leases/                 # Lease business rules
│   ├── matching/               # Matching eligibility rules
│   ├── pricing/                # Pricing rules
│   ├── pricingList/            # Pricing list rules
│   ├── proposals/              # Proposal rules
│   ├── reminders/              # Reminder rules
│   ├── reviews/                # Review rules
│   ├── scheduling/             # Scheduling rules
│   ├── search/                 # Search filter rules
│   ├── simulation/             # Simulation rules
│   └── users/                  # User rules
├── simulators/                 # Simulation engine
├── validators/                 # Input validation
└── workflows/                  # Layer 4: Orchestration
    ├── auth/                   # Authentication workflows
    ├── booking/                # Booking workflows
    ├── pricingList/            # Pricing list workflows
    ├── proposals/              # Proposal workflows
    ├── reminders/              # Reminder workflows
    ├── reviews/                # Review workflows
    ├── scheduling/             # Scheduling workflows
    └── users/                  # User workflows
```

---

### supabase/ Directory - BACKEND

**Purpose:** Supabase configuration, Edge Functions, and database migrations

```
supabase/
├── .temp/                      # Temporary files
├── functions/                  # ★ EDGE FUNCTIONS ★
│   ├── _shared/                # Shared utilities across all functions
│   │   └── functional/         # Functional programming utilities
│   │
│   │ # AI & Machine Learning
│   ├── ai-gateway/             # OpenAI proxy gateway
│   │   ├── handlers/
│   │   └── prompts/
│   ├── ai-parse-profile/       # AI profile parsing
│   ├── ai-room-redesign/       # AI room redesign feature
│   │   ├── handlers/
│   │   └── prompts/
│   ├── ai-signup-guest/        # AI guest signup assistance
│   ├── ai-tools/               # AI utility functions
│   │   └── handlers/
│   │
│   │ # Authentication
│   ├── auth-user/              # User authentication
│   │   └── handlers/
│   ├── verify-users/           # User verification
│   │
│   │ # Bubble.io Sync (Legacy)
│   ├── bubble_sync/            # Bubble.io data sync
│   │   ├── handlers/
│   │   └── lib/
│   ├── bubble-proxy/           # Bubble.io API proxy
│   │   └── handlers/
│   │
│   │ # Co-Host Management
│   ├── cohost-request/         # Co-host requests
│   │   └── handlers/
│   ├── co-host-requests/       # (duplicate? check usage)
│   ├── cohost-request-slack-callback/  # Slack approval
│   │
│   │ # Communication
│   ├── communications/         # Communication templates
│   ├── magic-login-links/      # Magic link authentication
│   │   └── handlers/
│   ├── message-curation/       # Message curation
│   ├── messages/               # Real-time messaging
│   │   └── handlers/
│   ├── send-email/             # Email sending
│   │   ├── handlers/
│   │   └── lib/
│   ├── send-sms/               # SMS sending
│   │   └── lib/
│   ├── slack/                  # Slack integration
│   │
│   │ # Date/Schedule Management
│   ├── date-change-request/    # Date change requests
│   │   ├── handlers/
│   │   └── lib/
│   │
│   │ # Documents
│   ├── document/               # Document management
│   │
│   │ # Emergency
│   ├── emergency/              # Emergency handling
│   │   └── handlers/
│   │
│   │ # Experience & Reviews
│   ├── experience-survey/      # Experience surveys
│   ├── reviews-overview/       # Reviews management
│   │   ├── handlers/
│   │   └── lib/
│   │
│   │ # Guest Management
│   ├── guest-management/       # Guest operations
│   │   └── actions/
│   ├── guest-payment-records/  # Guest payments
│   │   ├── handlers/
│   │   └── lib/
│   │
│   │ # Host Management
│   ├── host-payment-records/   # Host payments
│   │   ├── handlers/
│   │   └── lib/
│   ├── house-manual/           # House manuals
│   │   └── handlers/
│   │
│   │ # Identity
│   ├── identity-verification/  # ID verification
│   │   └── handlers/
│   │
│   │ # Content Management
│   ├── informational-texts/    # Informational text management
│   │
│   │ # Leases
│   ├── lease/                  # Lease CRUD
│   │   ├── handlers/
│   │   └── lib/
│   ├── leases-admin/           # Admin lease operations
│   │
│   │ # Listings
│   ├── listing/                # Listing CRUD
│   │   └── handlers/
│   │
│   │ # Pricing
│   ├── pricing/                # Pricing calculations
│   ├── pricing-admin/          # Admin pricing
│   ├── pricing-list/           # Pricing list management
│   │   ├── handlers/
│   │   └── utils/
│   │
│   │ # Proposals
│   ├── proposal/               # Proposal CRUD + workflow
│   │   ├── actions/
│   │   └── lib/
│   │
│   │ # QR Codes
│   ├── qr-codes/               # QR code operations
│   ├── qr-generator/           # QR code generation
│   │   ├── handlers/
│   │   └── lib/
│   │
│   │ # Matching
│   ├── query-leo/              # Leo query interface
│   ├── quick-match/            # Quick matching
│   │   ├── actions/
│   │   └── lib/
│   │
│   │ # Reminders
│   ├── reminder-scheduler/     # Reminder scheduling
│   │   ├── handlers/
│   │   └── lib/
│   │
│   │ # Rental Applications
│   ├── rental-application/     # Rental applications
│   │   └── handlers/
│   ├── rental-applications/    # (duplicate? check usage)
│   │
│   │ # Simulation
│   ├── simulation-admin/       # Simulation admin
│   ├── simulation-guest/       # Guest simulation
│   │   └── actions/
│   ├── simulation-host/        # Host simulation
│   │   └── actions/
│   │
│   │ # Testing
│   ├── tests/                  # Edge function tests
│   │   ├── helpers/
│   │   └── integration/
│   │
│   │ # Usability
│   ├── usability-data-admin/   # Usability data management
│   │   └── actions/
│   │
│   │ # Virtual Meetings
│   ├── virtual-meeting/        # Virtual meeting management
│   │   ├── handlers/
│   │   │   └── admin/
│   │   └── lib/
│   │
│   │ # Workflow System
│   ├── workflow-enqueue/       # Workflow job queue
│   ├── workflow-orchestrator/  # Workflow orchestration
│   │   └── lib/
│   │
│   │ # Misc
│   └── backfill-negotiation-summaries/  # Data backfill utility
│
├── migrations/                 # Database migrations
│   └── [YYYYMMDDHHMMSS_*.sql] # Timestamped migration files
│
└── config.toml                 # Supabase local config
```

---

### supabase/functions/_shared/ - Shared Utilities

**Purpose:** Common utilities used across all Edge Functions

```
supabase/functions/_shared/
├── functional/                 # Functional programming utilities
│   └── [FP helper functions]
├── cors.ts                     # CORS handling
├── errors.ts                   # Error types and handling
├── validation.ts               # Input validation
├── slack.ts                    # Slack notification utilities
└── [other shared utilities]
```

---

### pythonAnywhere/ Directory

**Purpose:** Python backend services hosted on PythonAnywhere

```
pythonAnywhere/
├── mysite/                     # Primary Python site
│   ├── daily-login-check/      # Login monitoring
│   ├── modules/                # Application modules
│   │   ├── calendar_automation/    # Calendar sync
│   │   ├── core/                   # Core utilities
│   │   │   └── monitoring/
│   │   ├── curated_listings_pdf/   # PDF generation
│   │   ├── database_checker/       # Database validation
│   │   │   └── datatypes/
│   │   ├── doc_parser/             # Document parsing
│   │   ├── google_drive/           # Google Drive integration
│   │   ├── house_manual_pdf/       # House manual PDF gen
│   │   ├── knowledge_search_module/ # Knowledge search
│   │   ├── logging/                # Logging utilities
│   │   ├── node_monitor/           # Node.js monitoring
│   │   ├── signup_automation_zap/  # Zapier automation
│   │   ├── slack_events/           # Slack event handling
│   │   └── user_search_module/     # User search
│   ├── tests/                  # Test files
│   └── vm-dates-usability-test-fixer/  # Usability fixes
│
├── mysite2/                    # Secondary Python site
│   ├── modules/
│   │   ├── core/
│   │   │   └── monitoring/
│   │   ├── logging/
│   │   ├── qr_generator/       # QR code generation
│   │   └── url_shortener/      # URL shortening
│   └── templates/              # HTML templates
│
└── mysite3/                    # Tertiary Python site
    └── tests/
```

---

### docs/ Directory

**Purpose:** Project documentation and planning

```
docs/
├── Done/                       # Completed documentation
│   └── visual-validation-screenshots/
├── Pending/                    # Pending documentation
└── pricing/                    # Pricing-related docs
```

---

### scripts/ Directory

**Purpose:** Project-wide utility scripts

```
scripts/
└── [utility scripts for build, deploy, etc.]
```

---

### slack-api/ Directory

**Purpose:** Standalone Slack integration API

```
slack-api/
├── scripts/                    # Slack API scripts
└── src/                        # Slack API source code
```

---

### frontend/ Directory - LEGACY

**Purpose:** Legacy frontend build artifacts (deprecated)

```
frontend/
├── build/                      # Built assets (similar structure to app/dist/)
│   ├── _internal/
│   ├── assets/
│   ├── functions/
│   └── help-center-articles/
└── node_modules/               # Legacy dependencies
```

**Note:** This appears to be a deprecated frontend build. The active frontend is in `app/`.

---

## Flow Diagrams

### Request Flow: User → Frontend → Edge Function → Database

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              REQUEST FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. User Action                                                              │
│     │                                                                        │
│     ▼                                                                        │
│  2. React Component (app/src/islands/pages/*)                               │
│     │                                                                        │
│     ▼                                                                        │
│  3. Page Logic Hook (useXxxPageLogic)                                       │
│     │                                                                        │
│     ▼                                                                        │
│  4. API Client (app/src/lib/api/*.js)                                       │
│     │ POST { action: 'xxx', payload: {...} }                                │
│     ▼                                                                        │
│  5. Edge Function (supabase/functions/xxx/index.ts)                         │
│     │ Route to handler based on action                                       │
│     ▼                                                                        │
│  6. Handler (supabase/functions/xxx/handlers/*.ts)                          │
│     │ Business logic + validation                                            │
│     ▼                                                                        │
│  7. Supabase PostgreSQL                                                     │
│     │ Query/mutation                                                         │
│     ▼                                                                        │
│  8. Response bubbles back up                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Proposal Creation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PROPOSAL CREATION FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Guest Views Listing                                                         │
│     │                                                                        │
│     ▼                                                                        │
│  CreateProposalFlowV2Components                                              │
│     │                                                                        │
│     ├── Step 1: Select Dates                                                │
│     ├── Step 2: Choose Schedule                                             │
│     ├── Step 3: Review Pricing                                              │
│     └── Step 4: Submit                                                       │
│           │                                                                  │
│           ▼                                                                  │
│  app/src/lib/api/proposalApi.js → createProposal()                          │
│     │                                                                        │
│     ▼                                                                        │
│  supabase/functions/proposal/index.ts                                       │
│     │ action: 'create'                                                       │
│     ▼                                                                        │
│  supabase/functions/proposal/actions/create.ts                              │
│     │                                                                        │
│     ├── 1. Validate proposal data                                           │
│     ├── 2. Calculate pricing (logic/calculators/)                           │
│     ├── 3. Insert into PostgreSQL                                           │
│     └── 4. Queue Bubble sync (sync_queue table)                             │
│           │                                                                  │
│           ▼                                                                  │
│  Host receives notification → Proposal dashboard                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User Enters Email                                                           │
│     │                                                                        │
│     ▼                                                                        │
│  app/src/lib/auth/auth.js → sendMagicLink()                                 │
│     │                                                                        │
│     ▼                                                                        │
│  supabase/functions/magic-login-links/                                      │
│     │                                                                        │
│     ▼                                                                        │
│  Supabase Auth sends email with magic link                                  │
│     │                                                                        │
│     ▼                                                                        │
│  User clicks link → redirected to app                                       │
│     │                                                                        │
│     ▼                                                                        │
│  app/src/islands/pages/AuthVerifyPage/                                      │
│     │                                                                        │
│     ▼                                                                        │
│  supabase/functions/auth-user/ → verifySession()                            │
│     │                                                                        │
│     ▼                                                                        │
│  Session stored → User redirected to dashboard                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Build & Deploy Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BUILD & DEPLOY FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Development                                                                 │
│     │                                                                        │
│     ├── bun run dev (localhost:8000)                                        │
│     │                                                                        │
│     └── supabase functions serve (local Edge Functions)                     │
│                                                                              │
│  Production Build                                                            │
│     │                                                                        │
│     ├── bun run generate-routes                                             │
│     │   │                                                                    │
│     │   └── routes.config.js → _redirects + _routes.json                    │
│     │                                                                        │
│     └── bun run build                                                        │
│         │                                                                    │
│         └── Vite → app/dist/                                                │
│                                                                              │
│  Deployment                                                                  │
│     │                                                                        │
│     ├── Cloudflare Pages (frontend)                                         │
│     │   │                                                                    │
│     │   └── wrangler pages deploy dist                                      │
│     │                                                                        │
│     └── Supabase (Edge Functions)                                           │
│         │                                                                    │
│         └── supabase functions deploy                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Files Reference

### Configuration Files

| File | Purpose |
|------|---------|
| `app/vite.config.js` | Vite build configuration with multi-page setup |
| `app/routes.config.js` | **Route Registry** - Single source of truth for all routes |
| `app/eslint.config.js` | ESLint configuration |
| `app/tailwind.config.js` | Tailwind CSS configuration |
| `app/vitest.config.js` | Vitest test configuration |
| `app/jsconfig.json` | JS config with path aliases (`@/` → `src/`) |
| `supabase/functions/deno.json` | Deno configuration for Edge Functions |
| `.pages.toml` | Cloudflare Pages configuration |
| `knip.json` | Dead code detection configuration |
| `.mcp.json` | MCP server configuration for Claude |

### Entry Points

| File | Purpose |
|------|---------|
| `app/public/*.html` | HTML entry points for each page |
| `app/src/*.jsx` | React entry points (hydrate islands) |
| `app/src/islands/pages/*` | Page components |
| `supabase/functions/*/index.ts` | Edge Function entry points |

### Core Libraries

| File | Purpose |
|------|---------|
| `app/src/lib/supabase.js` | Supabase client initialization |
| `app/src/lib/auth/auth.js` | Authentication utilities |
| `app/src/lib/api/*.js` | API client functions |

### Business Logic

| Directory | Purpose |
|-----------|---------|
| `app/src/logic/calculators/` | Pure calculation functions |
| `app/src/logic/rules/` | Boolean predicate functions |
| `app/src/logic/processors/` | Data transformation functions |
| `app/src/logic/workflows/` | Orchestration functions |

### Shared Utilities

| Directory | Purpose |
|-----------|---------|
| `supabase/functions/_shared/` | Shared Edge Function utilities |
| `app/src/islands/shared/` | Shared React components |

---

## Day Indexing Convention

All day indices throughout the codebase use JavaScript's 0-based standard:

| Day | Sun | Mon | Tue | Wed | Thu | Fri | Sat |
|-----|-----|-----|-----|-----|-----|-----|-----|
| Index | 0 | 1 | 2 | 3 | 4 | 5 | 6 |

This matches `Date.getDay()` and is stored natively in the database.

---

## Summary Statistics

- **Total Directories:** ~200+ (excluding node_modules, .git)
- **Edge Functions:** 45+
- **HTML Entry Points:** 83
- **Page Components:** 60+
- **Shared Components:** 45+
- **Logic Modules:** 50+ across 4 layers
- **Database Migrations:** 6 (recent)
- **GitHub Workflows:** 8

---

## GitHub Actions Workflows

**Location:** `.github/workflows/`

| Workflow | Purpose |
|----------|---------|
| `claude.yml` | Claude AI integration |
| `claude-code-review.yml` | Automated code review |
| `deploy-edge-functions-dev.yml` | Deploy Edge Functions to development |
| `deploy-edge-functions-prod.yml` | Deploy Edge Functions to production |
| `deploy-frontend-dev.yml` | Deploy frontend to development (Cloudflare) |
| `deploy-frontend-prod.yml` | Deploy frontend to production (Cloudflare) |
| `deploy-pythonanywhere.yml` | Deploy Python services to PythonAnywhere |

---

## Database Migrations

**Location:** `supabase/migrations/`

Recent migrations:
- `20260125_identity_verification_bucket.sql` - Storage bucket for ID verification
- `20260125_identity_verification_user_fields.sql` - User fields for verification
- `20260127_create_experience_survey_table.sql` - Experience survey functionality
- `20260127_create_qr_codes_table.sql` - QR code management
- `20260127_create_review_tables.sql` - Review system tables
- `20260128_alter_pricing_list_add_scalars.sql` - Pricing list enhancements

---

## Complete Route Registry

**Location:** `app/src/routes.config.js`

The route registry defines 70+ routes across categories:

### Public Pages
| Route | File | Description |
|-------|------|-------------|
| `/` | `index.html` | Homepage |
| `/search` | `search.html` | Property search |
| `/quick-match` | `quick-match.html` | Quick matching |
| `/view-split-lease/:id` | `view-split-lease.html` | View listing (dynamic) |
| `/faq` | `faq.html` | FAQ page |
| `/policies` | `policies.html` | Terms and policies |
| `/about-us` | `about-us.html` | About page |
| `/careers` | `careers.html` | Careers page |
| `/help-center` | `help-center.html` | Help center hub |
| `/help-center/:category` | `help-center-category.html` | Help category (dynamic) |
| `/list-with-us` | `list-with-us.html` | Host sign-up landing |
| `/why-split-lease` | `why-split-lease.html` | Value proposition |
| `/host-guarantee` | `host-guarantee.html` | Host guarantee info |
| `/referral` | `referral.html` | Referral program |

### Protected Pages (Authentication Required)
| Route | File | Description |
|-------|------|-------------|
| `/guest-proposals/:userId` | `guest-proposals.html` | Guest proposals dashboard |
| `/host-proposals/:userId` | `host-proposals.html` | Host proposals dashboard |
| `/account-profile/:userId` | `account-profile.html` | User profile |
| `/guest-leases/:userId` | `guest-leases.html` | Guest lease management |
| `/host-leases` | `host-leases.html` | Host lease management |
| `/self-listing` | `self-listing.html` | Create listing |
| `/listing-dashboard` | `listing-dashboard.html` | Listing management |
| `/host-overview` | `host-overview.html` | Host dashboard |
| `/favorite-listings` | `favorite-listings.html` | Saved listings |
| `/rental-application` | `rental-application.html` | Rental application |
| `/messages` | `messages.html` | Messaging center |
| `/house-manual` | `house-manual.html` | House manual editor |
| `/guest-experience-review` | `guest-experience-review.html` | Guest feedback |
| `/host-experience-review` | `host-experience-review.html` | Host feedback |
| `/reviews-overview` | `reviews-overview.html` | Reviews dashboard |

### Internal/Admin Pages (Prefix: `/_`)
| Route | File | Description |
|-------|------|-------------|
| `/_guest-relationships` | `guest-relationships.html` | Guest relationship management |
| `/_manage-virtual-meetings` | `manage-virtual-meetings.html` | Virtual meeting admin |
| `/_manage-informational-texts` | `manage-informational-texts.html` | CMS content |
| `/_quick-price` | `quick-price.html` | Quick pricing tool |
| `/_verify-users` | `verify-users.html` | User verification |
| `/_co-host-requests` | `co-host-requests.html` | Co-host request management |
| `/_simulation-admin` | `simulation-admin.html` | Simulation control |
| `/_send-magic-login-links` | `send-magic-login-links.html` | Magic link sender |
| `/_modify-listings` | `modify-listings.html` | Bulk listing modifications |
| `/_message-curation` | `message-curation.html` | Message templates |
| `/_usability-data-management` | `usability-data-management.html` | Usability data |
| `/_ai-tools` | `ai-tools.html` | AI utilities |
| `/_emergency` | `internal-emergency.html` | Emergency management |
| `/_admin-threads` | `admin-threads.html` | Admin messaging |
| `/_manage-rental-applications` | `manage-rental-applications.html` | Application review |
| `/_create-document` | `create-document.html` | Document generator |
| `/_proposal-manage` | `proposal-manage.html` | Proposal administration |
| `/_listings-overview` | `listings-overview.html` | Listings overview |
| `/_experience-responses` | `experience-responses.html` | Survey responses |
| `/_leases-overview` | `leases-overview.html` | Leases overview |
| `/_manage-leases-payment-records` | `manage-leases-payment-records.html` | Payment tracking |

### Simulation/Demo Pages
| Route | File | Description |
|-------|------|-------------|
| `/_guest-simulation` | `guest-simulation.html` | Guest simulation |
| `/simulation-guest-mobile` | `simulation-guest-mobile.html` | Mobile guest sim |
| `/simulation-guestside-demo` | `simulation-guestside-demo.html` | Guest-side demo |
| `/simulation-hostside-demo` | `simulation-hostside-demo.html` | Host-side demo |
| `/simulation-host-mobile` | `simulation-host-mobile.html` | Mobile host sim |

### Test/Development Pages (Prefix: `/_internal/z-`)
| Route | File | Description |
|-------|------|-------------|
| `/_internal/z-search-unit-test` | `z-search-unit-test.html` | Search unit tests |
| `/_internal/z-emails-unit` | `z-emails-unit.html` | Email unit tests |
| `/_internal/z-pricing-unit-test` | `z-pricing-unit-test.html` | Pricing unit tests |
| `/_internal/z-schedule-test` | `z-schedule-test.html` | Schedule tests |
| `/_internal/z-sharath-test` | `z-sharath-test.html` | Developer sandbox |
| `/_internal/z-unit-chatgpt-models` | `z-unit-chatgpt-models.html` | AI model tests |
| `/_internal/z-unit-payment-records-js` | `z-unit-payment-records-js.html` | Payment record tests |

---

## Complete Edge Functions List

**Location:** `supabase/functions/`

### AI Functions
| Function | Purpose |
|----------|---------|
| `ai-gateway` | OpenAI API proxy with prompt templating |
| `ai-parse-profile` | Parse user profiles with AI |
| `ai-room-redesign` | AI room redesign feature |
| `ai-signup-guest` | AI-assisted guest signup |
| `ai-tools` | AI utility functions |

### Authentication
| Function | Purpose |
|----------|---------|
| `auth-user` | User authentication (login, signup, password reset) |
| `verify-users` | User verification |
| `magic-login-links` | Magic link authentication |

### Data Sync (Legacy Bubble.io)
| Function | Purpose |
|----------|---------|
| `bubble_sync` | Bubble.io data synchronization |
| `bubble-proxy` | Bubble.io API proxy |

### Communication
| Function | Purpose |
|----------|---------|
| `communications` | Communication templates |
| `messages` | Real-time messaging |
| `send-email` | Email sending |
| `send-sms` | SMS sending |
| `slack` | Slack integration |

### Host/Guest Management
| Function | Purpose |
|----------|---------|
| `cohost-request` | Co-host requests |
| `co-host-requests` | Co-host request handling |
| `cohost-request-slack-callback` | Slack approval callback |
| `guest-management` | Guest operations |
| `guest-payment-records` | Guest payment tracking |
| `host-payment-records` | Host payment tracking |

### Listings & Proposals
| Function | Purpose |
|----------|---------|
| `listing` | Listing CRUD operations |
| `proposal` | Proposal CRUD + workflow |

### Leases
| Function | Purpose |
|----------|---------|
| `lease` | Lease CRUD operations |
| `leases-admin` | Admin lease management |

### Pricing
| Function | Purpose |
|----------|---------|
| `pricing` | Pricing calculations |
| `pricing-admin` | Admin pricing tools |
| `pricing-list` | Pricing list management |

### QR & Virtual Meetings
| Function | Purpose |
|----------|---------|
| `qr-codes` | QR code operations |
| `qr-generator` | QR code generation |
| `virtual-meeting` | Virtual meeting management |

### Reviews & Experience
| Function | Purpose |
|----------|---------|
| `experience-survey` | Experience surveys |
| `reviews-overview` | Reviews management |

### Other Functions
| Function | Purpose |
|----------|---------|
| `date-change-request` | Date change handling |
| `document` | Document management |
| `emergency` | Emergency handling |
| `house-manual` | House manual management |
| `identity-verification` | ID verification |
| `informational-texts` | CMS content |
| `message-curation` | Message templates |
| `query-leo` | Leo query interface |
| `quick-match` | Quick matching |
| `reminder-scheduler` | Reminder scheduling |
| `rental-application` | Rental applications |
| `rental-applications` | Application handling |
| `simulation-admin` | Simulation control |
| `simulation-guest` | Guest simulation |
| `simulation-host` | Host simulation |
| `usability-data-admin` | Usability data |
| `workflow-enqueue` | Workflow job queue |
| `workflow-orchestrator` | Workflow orchestration |
| `backfill-negotiation-summaries` | Data backfill utility |

---

## Shared Component Library

**Location:** `app/src/islands/shared/`

### Navigation & Layout
- `Header/` - Main navigation header
- `AdminHeader/` - Admin navigation
- `Footer.jsx` - Site footer
- `LoggedInAvatar/` - User avatar component

### Forms & Inputs
- `Button.jsx` - Standard button component
- `CustomDatePicker/` - Date picker
- `SearchScheduleSelector.jsx` - Schedule selection
- `ListingScheduleSelector.jsx` - Listing schedule
- `HostScheduleSelector/` - Host schedule management

### Modals
- `ConfirmDeleteModal/` - Deletion confirmation
- `CreateDuplicateListingModal/` - Duplicate listing
- `ImportListingModal/` - Import listing data
- `ImportListingReviewsModal/` - Import reviews
- `RentalApplicationWizardModal/` - Application wizard
- `SignUpLoginModal.jsx` - Authentication modal

### AI Features
- `AIImportAssistantModal/` - AI import assistant
- `AIRoomRedesign/` - AI room redesign
- `AiSignupMarketReport/` - Market reports
- `AISuggestions/` - AI suggestions
- `AITools/` - AI utilities

### Listing Components
- `ListingCard/` - Listing card display
- `EditListingDetails/` - Listing editor
- `CreateProposalFlowV2.jsx` - Proposal creation
- `CreateProposalFlowV2Components/` - Proposal flow parts
- `FavoriteButton/` - Favorite toggle
- `ExternalReviews.jsx` - External review display
- `PriceDisplay.jsx` - Price formatting

### Host Components
- `HostEditingProposal/` - Proposal editing
- `HostReviewGuest/` - Guest review
- `SuggestedProposals/` - Proposal suggestions
- `VirtualMeetingManager/` - Meeting management
- `DateChangeRequestManager/` - Date change handling

### Guest Components
- `ReminderHouseManual/` - Manual reminders
- `VisitReviewerHouseManual/` - Manual viewer

### Other Components
- `GoogleMap.jsx` - Map integration
- `ContactHostMessaging.jsx` - Host messaging
- `EmailPreviewSidebar.jsx` - Email preview
- `ErrorBoundary.jsx` - Error handling
- `ErrorOverlay.jsx` - Error display
- `FeedbackWidget/` - Feedback collection
- `HeaderMessagingPanel/` - Header messaging
- `IdentityVerification/` - ID verification
- `InformationalText.jsx` - CMS text display
- `NotificationSettingsIsland/` - Notification settings
- `QRCodeDashboard/` - QR code management
- `QuickMatch/` - Quick matching
- `ScheduleCohost/` - Co-host scheduling
- `SignUpTrialHost/` - Trial host signup
- `SubmitListingPhotos/` - Photo upload
- `Toast.jsx` - Toast notifications
- `UsabilityPopup/` - Usability feedback
- `useScheduleSelector.js` - Schedule selector hook
- `useScheduleSelectorLogicCore.js` - Core schedule logic

---

## Dependencies Overview

### Frontend Dependencies (app/package.json)

**Core:**
- `react` (18.2.0) - UI framework
- `react-dom` (18.2.0) - React DOM
- `@supabase/supabase-js` (2.38.0) - Supabase client

**UI:**
- `tailwindcss` (4.1.18) - Utility CSS
- `framer-motion` (12.23.24) - Animations
- `lucide-react` (0.553.0) - Icons
- `lottie-react` (2.4.1) - Lottie animations
- `styled-components` (6.1.19) - CSS-in-JS

**Forms:**
- `react-hook-form` (7.66.1) - Form handling
- `@hookform/resolvers` (5.2.2) - Form validation
- `zod` (4.1.12) - Schema validation
- `react-datepicker` (8.9.0) - Date picker

**Utilities:**
- `date-fns` (4.1.0) - Date utilities
- `date-fns-tz` (3.2.0) - Timezone support
- `clsx` (2.1.1) - Class utilities
- `tailwind-merge` (3.4.0) - Tailwind class merging
- `qrcode.react` (4.2.0) - QR code generation

**Maps:**
- `@react-google-maps/api` (2.20.7) - Google Maps

**Dev Tools:**
- `vite` (5.0.0) - Build tool
- `vitest` (4.0.18) - Testing
- `eslint` (9.39.2) - Linting
- `typescript` (5.9.3) - Type checking

### Backend Dependencies (supabase/functions/deno.json)

Deno runtime with:
- Supabase client
- CORS handling
- Slack webhooks
- OpenAI integration

---

## Environment Variables

### Frontend (VITE_ prefix)
| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key |

### Backend (Supabase Secrets)
| Variable | Description |
|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key |
| `BUBBLE_API_BASE_URL` | Bubble.io API endpoint |
| `BUBBLE_API_KEY` | Bubble.io API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `SLACK_WEBHOOK_DATABASE_WEBHOOK` | Slack database errors |
| `SLACK_WEBHOOK_ACQUISITION` | Slack acquisition channel |
| `SLACK_WEBHOOK_GENERAL` | Slack general channel |

---

## Project Conventions

### File Naming
- **Pages:** `XxxPage.jsx` with `useXxxPageLogic.js` hook
- **Components:** PascalCase (`ListingCard.jsx`)
- **Utilities:** camelCase (`dataLookups.js`)
- **Styles:** `component.css` or `Component.module.css`
- **Tests:** `*.test.js` or `*.test.jsx`

### Directory Naming
- Use full descriptive names (no abbreviations)
- `functional/` not `fp/`
- `configuration/` not `cfg/`
- `utilities/` not `util/`

### Code Patterns
- **Hollow Components:** UI only, delegate logic to hooks
- **Pure Functions:** No side effects in calculators/rules
- **Action-Based APIs:** `{ action, payload }` pattern
- **Day Indexing:** JavaScript 0-based (Sun=0 to Sat=6)

---

*Document generated by Claude Code on 2026-01-28 02:13:52*
*Last updated: 2026-01-28*
