# Documentation Context Index

> Quick reference to all documentation files organized by domain. Use this to preload relevant context when working on specific areas of the codebase.

---

## Architecture

Core architectural patterns and project structure documentation.

| File | Context |
|------|---------|
| [ARCHITECTURE_GUIDE_ESM_REACT_ISLAND.md](Architecture/ARCHITECTURE_GUIDE_ESM_REACT_ISLAND.md) | ESM-only React 18 Islands architecture, four-layer logic separation (calculators/rules/processors/workflows), hollow component pattern |
| [DIRECTORY_STRUCTURE.md](Architecture/DIRECTORY_STRUCTURE.md) | Complete project tree with all HTML entry points, React components, and Supabase functions |
| [The Functional Programming Bible...](Architecture/The%20Functional%20Programming%20Bible%20A%20Practical%20Reference%20for%20Writing%20Pure%2C%20Functional%20Code.md) | FP principles: pure functions, immutability, Result types, error handling without exceptions |

---

## Authentication

Session management, login/signup flows, and protected page patterns.

| File | Context |
|------|---------|
| [AUTH_GUIDE.md](Auth/AUTH_GUIDE.md) | Page-level auth pattern: checkAuthStatus → validateTokenAndFetchUser(clearOnFailure:false) → session fallback |
| [AUTH_USER_EDGE_FUNCTION.md](Auth/AUTH_USER_EDGE_FUNCTION.md) | auth-user Edge Function actions: login, signup, validate, password reset |
| [LOGIN_FLOW.md](Auth/LOGIN_FLOW.md) | Login sequence diagram and state management |
| [SIGNUP_FLOW.md](Auth/SIGNUP_FLOW.md) | Signup flow with AI guest onboarding integration |

---

## Backend (Edge Functions)

Supabase Edge Functions (Deno 2) documentation.

| File | Context |
|------|---------|
| [README.md](Backend(EDGE%20-%20Functions)/README.md) | Edge Functions overview: 29 functions, action-based routing, queue-based sync, Result type error handling |
| [QUICK_REFERENCE.md](Backend(EDGE%20-%20Functions)/QUICK_REFERENCE.md) | Endpoint cheatsheet with curl examples for all actions |
| [SHARED_UTILITIES.md](Backend(EDGE%20-%20Functions)/SHARED_UTILITIES.md) | _shared/ utilities: CORS, validation, error logging, Slack integration |
| [SEQUENCE_DIAGRAMS.md](Backend(EDGE%20-%20Functions)/SEQUENCE_DIAGRAMS.md) | Visual flow diagrams for key operations |

### Core Functions

| File | Context |
|------|---------|
| [AUTH_USER.md](Backend(EDGE%20-%20Functions)/AUTH_USER.md) | Authentication actions: login, signup, validate_token, request_password_reset |
| [LISTING.md](Backend(EDGE%20-%20Functions)/LISTING.md) | Listing CRUD with Bubble sync queue |
| [PROPOSAL.md](Backend(EDGE%20-%20Functions)/PROPOSAL.md) | Proposal lifecycle: create, update, AI summaries, status transitions |
| [MESSAGES.md](Backend(EDGE%20-%20Functions)/MESSAGES.md) | Real-time messaging with conversation threads |

### AI & Integration Functions

| File | Context |
|------|---------|
| [AI_GATEWAY.md](Backend(EDGE%20-%20Functions)/AI_GATEWAY.md) | OpenAI proxy for frontend AI features |
| [AI_SIGNUP_GUEST.md](Backend(EDGE%20-%20Functions)/AI_SIGNUP_GUEST.md) | AI-powered guest profile parsing during signup |
| [BUBBLE_SYNC.md](Backend(EDGE%20-%20Functions)/BUBBLE_SYNC.md) | Supabase→Bubble sync queue processing |
| [BUBBLE_PROXY.md](Backend(EDGE%20-%20Functions)/BUBBLE_PROXY.md) | Legacy Bubble.io API wrapper |

### Communication Functions

| File | Context |
|------|---------|
| [SEND_EMAIL.md](Backend(EDGE%20-%20Functions)/SEND_EMAIL.md) | Resend email integration |
| [SEND_SMS.md](Backend(EDGE%20-%20Functions)/SEND_SMS.md) | Twilio SMS integration |
| [SLACK.md](Backend(EDGE%20-%20Functions)/SLACK.md) | Slack webhook notifications |

### Specialized Functions

| File | Context |
|------|---------|
| [COHOST_REQUEST.md](Backend(EDGE%20-%20Functions)/COHOST_REQUEST.md) | Co-host invitation workflow |
| [DATE_CHANGE_REQUEST.md](Backend(EDGE%20-%20Functions)/DATE_CHANGE_REQUEST.md) | Booking date modification requests |
| [RENTAL_APPLICATION.md](Backend(EDGE%20-%20Functions)/RENTAL_APPLICATION.md) | Rental application submission |
| [HOUSE_MANUAL.md](Backend(EDGE%20-%20Functions)/HOUSE_MANUAL.md) | Property house manual management |
| [VIRTUAL_MEETING.md](Backend(EDGE%20-%20Functions)/VIRTUAL_MEETING.md) | Virtual tour scheduling |
| [QR_GENERATOR.md](Backend(EDGE%20-%20Functions)/QR_GENERATOR.md) | QR code generation for listings |
| [REMINDER_SCHEDULER.md](Backend(EDGE%20-%20Functions)/REMINDER_SCHEDULER.md) | Automated reminder system |
| [WORKFLOW_SYSTEM.md](Backend(EDGE%20-%20Functions)/WORKFLOW_SYSTEM.md) | Workflow orchestration patterns |
| [GUEST_PAYMENT_RECORDS.md](Backend(EDGE%20-%20Functions)/GUEST_PAYMENT_RECORDS.md) | Guest payment tracking |
| [HOST_PAYMENT_RECORDS.md](Backend(EDGE%20-%20Functions)/HOST_PAYMENT_RECORDS.md) | Host payout tracking |
| [HUMAN_FRIENDLY_ERROR_LOGGING.md](Backend(EDGE%20-%20Functions)/HUMAN_FRIENDLY_ERROR_LOGGING.md) | Error formatting for Slack alerts |

### Endpoint Usage Guides

| File | Context |
|------|---------|
| [Endpoints/SEND_EMAIL_USAGE.md](Backend(EDGE%20-%20Functions)/Endpoints/SEND_EMAIL_USAGE.md) | Email endpoint integration examples |
| [Endpoints/SEND_SMS_USAGE.md](Backend(EDGE%20-%20Functions)/Endpoints/SEND_SMS_USAGE.md) | SMS endpoint integration examples |

---

## Database

PostgreSQL schema, relations, and option sets.

| File | Context |
|------|---------|
| [DATABASE_TABLES_DETAILED.md](Database/DATABASE_TABLES_DETAILED.md) | Complete table schemas: user, listing, proposal, booking domains with all columns |
| [DATABASE_RELATIONS.md](Database/DATABASE_RELATIONS.md) | Entity hierarchy, FK relationships, JSONB array fields |
| [DATABASE_OPTION_SETS_QUICK_REFERENCE.md](Database/DATABASE_OPTION_SETS_QUICK_REFERENCE.md) | Enum/lookup table values quick reference |
| [OPTION_SETS_DETAILED.md](Database/OPTION_SETS_DETAILED.md) | Full option set documentation with descriptions |
| [JUNCTIONS_SCHEMA_CONVENTION.md](Database/JUNCTIONS_SCHEMA_CONVENTION.md) | Junction table naming and structure conventions |
| [REFERENCE_TABLES_FK_FIELDS.md](Database/REFERENCE_TABLES_FK_FIELDS.md) | Foreign key field mappings for all tables |

---

## External Integrations

Third-party service implementations.

| File | Context |
|------|---------|
| [GOOGLE_MAPS_API_IMPLEMENTATION.md](External/GOOGLE_MAPS_API_IMPLEMENTATION.md) | Google Maps JS API: interactive maps, Places autocomplete, borough configurations, marker styling |
| [HOTJAR_IMPLEMENTATION.md](External/HOTJAR_IMPLEMENTATION.md) | Hotjar analytics and heatmap integration |

---

## Pages

Page-specific documentation with entry points, components, and logic hooks.

| File | Context |
|------|---------|
| [HOME_QUICK_REFERENCE.md](Pages/HOME_QUICK_REFERENCE.md) | Homepage: hero, featured listings, CTA sections |
| [SEARCH_QUICK_REFERENCE.md](Pages/SEARCH_QUICK_REFERENCE.md) | Search page: filters, map view, listing cards, AI market reports |
| [VIEW_SPLIT_LEASE_QUICK_REFERENCE.md](Pages/VIEW_SPLIT_LEASE_QUICK_REFERENCE.md) | Listing detail: gallery, schedule selector, proposal creation |
| [LISTING_DASHBOARD_QUICK_REFERENCE.md](Pages/LISTING_DASHBOARD_QUICK_REFERENCE.md) | Host listing management dashboard |
| [LISTING_DASHBOARD_PAGE_CONTEXT.md](Pages/LISTING_DASHBOARD_PAGE_CONTEXT.md) | Listing dashboard deep-dive with edit flow |
| [GUEST_PROPOSALS_QUICK_REFERENCE.md](Pages/GUEST_PROPOSALS_QUICK_REFERENCE.md) | Guest proposal tracking and management |
| [HOST_OVERVIEW_QUICK_REFERENCE.md](Pages/HOST_OVERVIEW_QUICK_REFERENCE.md) | Host dashboard overview |
| [MESSAGING_PAGE_REFERENCE.md](Pages/MESSAGING_PAGE_REFERENCE.md) | Real-time messaging interface |
| [SELF_LISTING_QUICK_REFERENCE.md](Pages/SELF_LISTING_QUICK_REFERENCE.md) | Host listing creation wizard |
| [RENTAL_APPLICATION_QUICK_REFERENCE.md](Pages/RENTAL_APPLICATION_QUICK_REFERENCE.md) | Rental application form |
| [ACCOUNT_PROFILE_QUICK_REFERENCE.md](Pages/ACCOUNT_PROFILE_QUICK_REFERENCE.md) | User profile management |
| [FAVORITE_LISTINGS_QUICK_REFERENCE.md](Pages/FAVORITE_LISTINGS_QUICK_REFERENCE.md) | User favorites page |

### Marketing & Info Pages

| File | Context |
|------|---------|
| [ABOUT_US_QUICK_REFERENCE.md](Pages/ABOUT_US_QUICK_REFERENCE.md) | About us page |
| [WHY_SPLIT_LEASE_QUICK_REFERENCE.md](Pages/WHY_SPLIT_LEASE_QUICK_REFERENCE.md) | Value proposition page |
| [LIST_WITH_US_QUICK_REFERENCE.md](Pages/LIST_WITH_US_QUICK_REFERENCE.md) | Host signup landing |
| [GUEST_SUCCESS_QUICK_REFERENCE.md](Pages/GUEST_SUCCESS_QUICK_REFERENCE.md) | Guest success stories |
| [HOST_SUCCESS_QUICK_REFERENCE.md](Pages/HOST_SUCCESS_QUICK_REFERENCE.md) | Host success stories |
| [FAQ_QUICK_REFERENCE.md](Pages/FAQ_QUICK_REFERENCE.md) | FAQ page |
| [HELP_CENTER_QUICK_REFERENCE.md](Pages/HELP_CENTER_QUICK_REFERENCE.md) | Help center |
| [POLICIES_QUICK_REFERENCE.md](Pages/POLICIES_QUICK_REFERENCE.md) | Legal policies |
| [CAREERS_QUICK_REFERENCE.md](Pages/CAREERS_QUICK_REFERENCE.md) | Careers page |
| [404_QUICK_REFERENCE.md](Pages/404_QUICK_REFERENCE.md) | Not found page |

### Development Pages

| File | Context |
|------|---------|
| [INDEX_DEV_QUICK_REFERENCE.md](Pages/INDEX_DEV_QUICK_REFERENCE.md) | Development homepage |
| [SEARCH_TEST_QUICK_REFERENCE.md](Pages/SEARCH_TEST_QUICK_REFERENCE.md) | Search test page |

---

## Routing

URL routing and Cloudflare Pages configuration.

| File | Context |
|------|---------|
| [ROUTING_GUIDE.md](Routing/ROUTING_GUIDE.md) | routes.config.js as single source of truth, auto-generated _redirects, dynamic segments, protected routes |
| [CLAUDE.md](Routing/CLAUDE.md) | Routing-specific CLAUDE instructions |

---

## Deployment

Environment and deployment configuration.

| File | Context |
|------|---------|
| [CLOUDFLARE_PAGES_ENV_CONFIG.md](../CLOUDFLARE_PAGES_ENV_CONFIG.md) | Cloudflare Pages env vars: production vs preview, Supabase project routing |

---

## Usage

When running `/context [directory]`, load relevant documentation:

| Working Directory | Recommended Docs |
|-------------------|------------------|
| `app/src/islands/` | Architecture, Pages (relevant page), Auth |
| `app/src/logic/` | Architecture (four-layer logic), FP Bible |
| `supabase/functions/` | Backend (all), Database |
| `app/src/lib/` | Auth, Routing, External |
| Database changes | Database (all), Backend README |
