# Edge Functions Reference

> ⚠️ **This file is auto-generated.** Do not edit manually.
> Run `node scripts/generate-docs.js` to update.

**Total Functions:** 51
**Last Updated:** 2026-01-28T07:24:26.478Z
**Generator:** `scripts/generate-docs.js`

---

## Functions List

| Function | Description |
|----------|-------------|
| `ai-gateway` | AI Gateway Edge Function Split Lease - Supabase Edge Functions Routes AI requests to appropriate handlers Supports dynamic prompts with variable interpolation NO FALLBACK PRINCIPLE: All errors fail fa |
| `ai-parse-profile` | AI Parse Profile - Edge Function Split Lease This edge function processes the AI parsing queue asynchronously. It parses freeform signup text using GPT-4 and populates user profiles. Actions: - queue: |
| `ai-room-redesign` | AI Room Redesign Edge Function Split Lease - Supabase Edge Functions Proxies Gemini Vision API calls for AI-powered room redesign. This Edge Function keeps the API key secure on the server side. NO FA |
| `ai-signup-guest` | AI Signup Guest - Edge Function Split Lease This edge function handles the AI signup flow for guests: 1. Receives email, phone, and freeform text input 2. Looks up the user by email (user was already  |
| `ai-tools` | AI Tools Edge Function Split Lease - HeyGen, ElevenLabs, and Jingle Generation Routes AI tool requests to appropriate handlers NO FALLBACK PRINCIPLE: All errors fail fast without fallback logic Suppor |
| `auth-user` | Auth User - Authentication Router Split Lease - Edge Function Routes authentication requests to appropriate handlers NO USER AUTHENTICATION REQUIRED - These ARE the auth endpoints Supported Actions: - |
| `backfill-negotiation-summaries` | Backfill Negotiation Summaries One-time migration script to backfill the negotiationsummary table for suggested proposals that were created before the persistence fix. The AI summaries exist in SplitB |
| `bubble_sync` | bubble_sync Edge Function Processes the sync_queue and pushes data FROM Supabase TO Bubble. This is the reverse direction of the bubble_to_supabase_sync.py script. Supports TWO modes: 1. Workflow API  |
| `co-host-requests` | co-host-requests Edge Function Admin tool for managing co-host assistance requests Actions: - list: Get paginated, filtered co-host requests with related data - getById: Get single request with full d |
| `cohost-request` | Co-Host Request Edge Function Split Lease - Supabase Edge Functions Main router for co-host request operations: - create: Create a new co-host request with virtual meeting - rate: Submit rating for a  |
| `cohost-request-slack-callback` | Slack Callback Handler for Co-Host Requests Split Lease - Supabase Edge Functions Handles interactive elements from Slack: 1. Button clicks (claim_cohost_request) - Opens modal form 2. Modal submissio |
| `communications` | Communications - Edge Function Split Lease Placeholder for communications-related functionality Future actions may include: - Email notifications - SMS notifications - In-app messaging - Push notifica |
| `date-change-request` | Date Change Request Edge Function Split Lease - Supabase Edge Functions Main router for date change request operations: - create: Create a new date change request - get: Get date change requests for a |
| `document` | document Edge Function Operations for creating and managing documents sent to hosts Actions: - list_policies: Get all policy documents from Bubble - list_hosts: Get all host users from Supabase - crea |
| `emergency` | Emergency Edge Function (CONSOLIDATED) Split Lease - Supabase Edge Functions All handlers are inlined to avoid dynamic import issues with MCP deployment. Actions: - getAll: Fetch all emergencies with  |
| `experience-survey` | Experience Survey Edge Function Split Lease - Edge Functions Handles host experience survey submissions from the 11-step wizard. - Validates required fields - Saves survey to database - Sends confirma |
| `guest-management` | Guest Management Edge Function Split Lease - Supabase Edge Functions Corporate tool for managing guest relationships, searching guests, assigning knowledge articles, and tracking activity history. Act |
| `guest-payment-records` | Guest Payment Records Edge Function Split Lease - Supabase Edge Functions Creates guest payment records for leases based on calculated payment schedules. Replaces Bubble's CORE-create-guest-payment-re |
| `host-payment-records` | Host Payment Records Edge Function Split Lease - Supabase Edge Functions Creates host payment records for leases based on calculated payment schedules. Replaces Bubble's CORE-create-host-payment-recor |
| `house-manual` | House Manual Edge Function Split Lease - AI-Powered House Manual Creation Routes AI requests to appropriate handlers for house manual content extraction and AI suggestions management. NO FALLBACK PRIN |
| `identity-verification` | Identity Verification - Edge Function Split Lease Routes identity verification requests to appropriate handlers. Allows users to submit identity documents (selfie, front ID, back ID) for verification. |
| `informational-texts` | informational-texts Edge Function CRUD operations for informational text content management Actions: - list: Get all entries (paginated) - get: Get single entry by ID - create: Insert new entry - upda |
| `lease` | Lease Edge Function Split Lease - Supabase Edge Functions Actions: - create: Create a new lease from accepted proposal/counteroffer - get: Fetch lease details Request Format: POST /functions/v1/lease  |
| `leases-admin` | leases-admin Edge Function Admin dashboard operations for lease management Actions: - CRUD: list, get, updateStatus - Delete: softDelete, hardDelete - Bulk: bulkUpdateStatus, bulkSoftDelete, bulkExpor |
| `listing` | Listing Edge Function Split Lease - Supabase Edge Functions Main router for listing operations: - create: Create a new listing - get: Get listing details - submit: Full listing submission with all for |
| `magic-login-links` | Magic Login Links - Admin Tool Router Split Lease - Edge Function Routes magic login link generation requests to appropriate handlers ADMIN AUTHENTICATION REQUIRED - Validates caller has admin privile |
| `message-curation` | message-curation Edge Function Admin tool for viewing, moderating, and managing message threads Actions: - getThreads: Search and list threads with pagination - getThreadMessages: Get all messages for |
| `messages` | Messages Edge Function - Main Router Split Lease - Edge Function Routes client requests to appropriate messaging handlers Supported Actions: - send_message: Send a message in a thread (requires auth)  |
| `pricing` | Pricing - Edge Function Split Lease Placeholder for pricing-related functionality Future actions may include: - Price calculations - Fee breakdowns - Discount calculations - Dynamic pricing - Payment  |
| `pricing-admin` | pricing-admin Edge Function Admin dashboard operations for listing price management Actions: - list: Paginated listing fetch with filters (rental type, borough, neighborhood, host, date range) - get:  |
| `pricing-list` | Pricing List Edge Function Split Lease - Supabase Edge Functions Main router for pricing list operations: - create: Create/calculate pricing_list for a listing - get: Get pricing_list by listing_id -  |
| `proposal` | Proposal Edge Function Split Lease - Supabase Edge Functions DIAGNOSTIC VERSION 2: Minimal core + lazy imports |
| `qr-codes` | QR Codes Edge Function Split Lease - Supabase Edge Functions Handles QR code data retrieval and scan recording with SMS notifications. Actions: - get: Retrieve QR code data by ID - record_scan: Record |
| `qr-generator` | QR Code Generator - Edge Function Split Lease Generates branded QR codes with the Split Lease logo Actions: - generate: Create QR code image (returns PNG binary) - health: Check function status NO AUT |
| `query-leo` | No description |
| `quick-match` | Quick Match Edge Function Split Lease - Supabase Edge Functions Provides proposal-to-listing matching functionality for the Quick Match tool. Actions: - get_proposal: Fetch proposal with guest and lis |
| `reminder-scheduler` | Reminder Scheduler Edge Function Split Lease - Reminder House Manual Feature Main router for reminder operations: - create: Create a new reminder - update: Update an existing reminder - get: Get remin |
| `rental-application` | Rental Application Edge Function Split Lease - Supabase Edge Functions Main router for rental application operations: - submit: Submit rental application form data - get: Get existing application data |
| `rental-applications` | rental-applications Edge Function Admin dashboard operations for rental application management Actions: - list: Paginated list with filters and sorting - get: Get single application with related data  |
| `reviews-overview` | Reviews Overview Edge Function Split Lease - Edge Functions Handles all review-related operations for the Reviews Overview page: - get_pending_reviews: Stays awaiting user's review - get_received_revi |
| `send-email` | Send Email Edge Function Split Lease - Supabase Edge Functions Main router for email operations: - send: Send templated email via SendGrid - health: Check function health and secrets configuration Aut |
| `send-sms` | Send SMS Edge Function Split Lease - Supabase Edge Functions Direct Twilio proxy - forwards SMS requests to Twilio API Request: { action: "send", payload: { to, from, body } } Twilio: POST form-urlenc |
| `simulation-admin` | simulation-admin Edge Function Admin tool for managing usability testing simulation testers Actions: - listTesters: Get all usability testers with pagination and search - getTester: Get single tester  |
| `simulation-guest` | Simulation Guest Edge Function Handles all guest-side simulation actions for the usability test workflow. Uses action-based routing pattern with lazy-loaded handlers. Actions: - initialize: Set up sim |
| `simulation-host` | Simulation Host Edge Function Split Lease - Host-side Usability Testing Simulation This Edge Function supports the host-side simulation workflow where hosts walk through receiving and responding to gu |
| `slack` | Slack Integration - Edge Function Split Lease Routes Slack-related requests to appropriate handlers Currently supports: - faq_inquiry: Send FAQ inquiries to Slack channels NO AUTHENTICATION REQUIRED - |
| `usability-data-admin` | usability-data-admin Edge Function Admin tool for managing usability testing data Actions: - listHosts: Get usability tester hosts with pagination and search - listGuests: Get usability tester guests  |
| `verify-users` | verify-users Edge Function Admin tool for identity verification of users Actions: - list_users: Get recent users (paginated) - search_users: Search users by email or name - get_user: Get single user w |
| `virtual-meeting` | Virtual Meeting Edge Function Split Lease - Supabase Edge Functions Main router for virtual meeting operations: - create: Create a new virtual meeting request - delete: Delete/cancel a virtual meeting |
| `workflow-enqueue` | Workflow Enqueue Edge Function Split Lease - Workflow Orchestration System Receives workflow requests from frontend, validates payload against workflow definition, and enqueues to pgmq for orchestrati |
| `workflow-orchestrator` | Workflow Orchestrator Edge Function Split Lease - Workflow Orchestration System HOLLOW ORCHESTRATOR - Contains NO workflow logic. Reads workflow steps from pgmq messages and executes them sequentially |

---

## Adding a New Function

1. Create directory: `supabase/functions/your-function/`
2. Create `index.ts` with JSDoc comment
3. Run: `node scripts/generate-docs.js`
4. Add to `supabase/config.toml`: `node supabase/scripts/sync-edge-functions.js --fix`
5. Commit both files

## Deployment

```bash
# Deploy single function
supabase functions deploy your-function

# Deploy all functions
supabase functions deploy
```

---

*Generated by CI/CD automation*
