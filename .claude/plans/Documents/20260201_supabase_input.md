# Supabase Directory - Complete Analysis

**Generated**: 2026-02-01
**Total Files**: 435
**Runtime**: Deno 2 (TypeScript)
**Architecture**: Action-based Edge Functions with FP principles

---

## Directory Map

```
supabase/
├── .env.sample                          # Environment variable template
├── .gitignore                           # Git ignore rules
├── CLAUDE.md                            # LLM reference documentation
├── FUNCTIONS.md                         # Functions overview
├── config.toml                          # Supabase local dev configuration
├── linked-project                       # Linked Supabase project reference
│
├── functions/                           # Edge Functions (Deno/TypeScript)
│   ├── deno.json                        # Global Deno configuration
│   ├── deno.lock                        # Dependency lock file
│   ├── EDGE_FUNCTIONS_DOCUMENTATION.md  # Edge functions docs
│   │
│   ├── _shared/                         # Shared utilities (25 files)
│   │   ├── functional/                  # FP utilities
│   │   │   ├── errorLog.ts              # Immutable error log
│   │   │   ├── orchestration.ts         # Request/response orchestration
│   │   │   └── result.ts                # Result type (Ok/Err)
│   │   ├── aiTypes.ts                   # AI-related TypeScript types
│   │   ├── bubbleSync.ts                # Bubble.io sync service
│   │   ├── cors.ts                      # CORS headers configuration
│   │   ├── ctaHelpers.ts                # Call-to-action helpers
│   │   ├── emailUtils.ts                # Email utility functions
│   │   ├── errorReporting.ts            # Error reporting utilities
│   │   ├── errors.ts                    # Custom error classes
│   │   ├── errors_test.ts               # Error class tests
│   │   ├── geoLookup.ts                 # Geographic lookup utilities
│   │   ├── jsonUtils.ts                 # JSON parsing utilities
│   │   ├── junctionHelpers.ts           # Junction table helpers
│   │   ├── messagingHelpers.ts          # Messaging utilities
│   │   ├── negotiationSummaryHelpers.ts # Negotiation summary AI helpers
│   │   ├── notificationHelpers.ts       # Notification utilities
│   │   ├── notificationSender.ts        # Send notifications
│   │   ├── openai.ts                    # OpenAI API wrapper
│   │   ├── queueSync.ts                 # Queue-based sync utilities
│   │   ├── slack.ts                     # Slack webhook integration
│   │   ├── types.ts                     # Shared TypeScript types
│   │   ├── validation.ts                # Input validation utilities
│   │   ├── validation_test.ts           # Validation tests
│   │   └── vmMessagingHelpers.ts        # Virtual meeting messaging
│   │
│   ├── admin-query-auth/                # Admin authentication queries
│   │   └── index.ts
│   │
│   ├── ai-gateway/                      # OpenAI proxy with prompts (15 files)
│   │   ├── deno.json
│   │   ├── index.ts
│   │   ├── handlers/
│   │   │   ├── complete.ts              # Non-streaming completion
│   │   │   └── stream.ts                # SSE streaming completion
│   │   └── prompts/
│   │       ├── _registry.ts             # Prompt registry
│   │       ├── _template.ts             # Template interpolation
│   │       ├── deepfake-script.ts       # Deepfake script generation
│   │       ├── jingle-lyrics.ts         # Jingle lyrics generation
│   │       ├── listing-description.ts   # Listing description AI
│   │       ├── listing-title.ts         # Listing title AI
│   │       ├── narration-script.ts      # Narration script generation
│   │       ├── negotiation-summary-counteroffer.ts
│   │       ├── negotiation-summary-host.ts
│   │       ├── negotiation-summary-suggested.ts
│   │       ├── neighborhood-description.ts
│   │       ├── parse-call-transcription.ts
│   │       └── proposal-summary.ts
│   │
│   ├── ai-parse-profile/                # Profile parsing from freeform text
│   │   └── index.ts
│   │
│   ├── ai-room-redesign/                # AI room redesign feature (4 files)
│   │   ├── deno.json
│   │   ├── index.ts
│   │   ├── handlers/
│   │   │   └── generate.ts
│   │   └── prompts/
│   │       └── room-redesign.ts
│   │
│   ├── ai-signup-guest/                 # AI-powered guest signup
│   │   └── index.ts
│   │
│   ├── ai-tools/                        # AI content generation tools (18 files)
│   │   ├── deno.json
│   │   ├── index.ts
│   │   └── handlers/
│   │       ├── attachDeepfake.ts
│   │       ├── attachJingle.ts
│   │       ├── attachNarration.ts
│   │       ├── checkDeepfakeStatus.ts
│   │       ├── createDeepfake.ts
│   │       ├── createJingle.ts
│   │       ├── generateDeepfakeScript.ts
│   │       ├── generateDeepfakeVideo.ts
│   │       ├── generateJingleLyrics.ts
│   │       ├── generateNarration.ts
│   │       ├── generateNarrationScript.ts
│   │       ├── getDeepfakeUrl.ts
│   │       ├── getDeepfakes.ts
│   │       ├── getHouseManuals.ts
│   │       ├── getJingles.ts
│   │       ├── getNarrations.ts
│   │       └── getNarrators.ts
│   │
│   ├── auth-user/                       # Authentication (13 files)
│   │   ├── index.ts                     # Router for auth actions
│   │   └── handlers/
│   │       ├── generateMagicLink.ts     # Magic link generation
│   │       ├── login.ts                 # Email/password login
│   │       ├── logout.ts                # Logout (stub)
│   │       ├── oauthLogin.ts            # OAuth login verification
│   │       ├── oauthSignup.ts           # OAuth user creation
│   │       ├── resetPassword.ts         # Password reset request
│   │       ├── sendMagicLinkSms.ts      # Magic link via SMS
│   │       ├── signup.ts                # New user registration
│   │       ├── updatePassword.ts        # Password update
│   │       ├── validate.ts              # Token validation
│   │       └── verifyEmail.ts           # Email verification
│   │
│   ├── backfill-negotiation-summaries/  # Data migration utility
│   │   └── index.ts
│   │
│   ├── bubble_sync/                     # Supabase→Bubble sync (14 files)
│   │   ├── deno.json
│   │   ├── DEPLOYMENT.md
│   │   ├── README.md
│   │   ├── index.ts
│   │   ├── handlers/
│   │   │   ├── buildRequest.ts          # Preview API request
│   │   │   ├── cleanup.ts               # Clean old completed items
│   │   │   ├── getStatus.ts             # Queue statistics
│   │   │   ├── processQueue.ts          # Process via Workflow API
│   │   │   ├── processQueueDataApi.ts   # Process via Data API
│   │   │   ├── propagateListingFK.ts    # Propagate listing FKs
│   │   │   ├── retryFailed.ts           # Retry failed items
│   │   │   ├── syncSignupAtomic.ts      # Atomic signup sync
│   │   │   └── syncSingle.ts            # Sync single record
│   │   └── lib/
│   │       ├── bubbleDataApi.ts         # Bubble Data API client
│   │       ├── bubblePush.ts            # Push to Bubble
│   │       ├── fieldMapping.ts          # Field name mapping
│   │       ├── queueManager.ts          # Queue operations
│   │       ├── tableMapping.ts          # Table name mapping
│   │       └── transformer.ts           # Data transformation
│   │
│   ├── calendar-automation/             # Google Calendar integration (8 files)
│   │   ├── deno.json
│   │   ├── index.ts
│   │   ├── handlers/
│   │   │   ├── health.ts
│   │   │   ├── processVirtualMeeting.ts
│   │   │   └── testConfig.ts
│   │   └── lib/
│   │       ├── googleCalendarService.ts
│   │       ├── types.ts
│   │       └── validators.ts
│   │
│   ├── co-host-requests/                # Co-host request management
│   │   ├── deno.json
│   │   └── index.ts
│   │
│   ├── cohost-request/                  # Cohost request CRUD (4 files)
│   │   ├── index.ts
│   │   └── handlers/
│   │       ├── create.ts
│   │       ├── notify-host.ts
│   │       └── rate.ts
│   │
│   ├── cohost-request-slack-callback/   # Slack interactive callback
│   │   └── index.ts
│   │
│   ├── communications/                  # Communications placeholder
│   │   └── index.ts
│   │
│   ├── date-change-reminder-cron/       # Date change reminder cron job
│   │   ├── deno.json
│   │   └── index.ts
│   │
│   ├── date-change-request/             # Date change requests (17 files)
│   │   ├── index.ts
│   │   ├── handlers/
│   │   │   ├── accept.ts
│   │   │   ├── applyHardBlock.ts
│   │   │   ├── cancel.ts
│   │   │   ├── create.ts
│   │   │   ├── decline.ts
│   │   │   ├── get.ts
│   │   │   ├── getThrottleStatus.ts
│   │   │   ├── notifications.ts
│   │   │   └── updateWarningPreference.ts
│   │   └── lib/
│   │       ├── dateFormatters.ts
│   │       ├── emailTemplateGenerator.ts
│   │       ├── notificationContent.ts
│   │       ├── priceCalculations.ts
│   │       ├── propertyDisplay.ts
│   │       ├── types.ts
│   │       └── validators.ts
│   │
│   ├── document/                        # Document management
│   │   ├── deno.json
│   │   └── index.ts
│   │
│   ├── emergency/                       # Emergency management (16 files)
│   │   ├── index.ts
│   │   └── handlers/
│   │       ├── assignEmergency.ts
│   │       ├── create.ts
│   │       ├── getAll.ts
│   │       ├── getById.ts
│   │       ├── getEmails.ts
│   │       ├── getMessages.ts
│   │       ├── getPresetEmails.ts
│   │       ├── getPresetMessages.ts
│   │       ├── getTeamMembers.ts
│   │       ├── sendEmail.ts
│   │       ├── sendSMS.ts
│   │       ├── update.ts
│   │       ├── updateStatus.ts
│   │       └── updateVisibility.ts
│   │
│   ├── experience-survey/               # Experience survey collection
│   │   └── index.ts
│   │
│   ├── guest-management/                # Guest management (8 files)
│   │   ├── index.ts
│   │   └── actions/
│   │       ├── assignArticle.ts
│   │       ├── createGuest.ts
│   │       ├── getGuest.ts
│   │       ├── getGuestHistory.ts
│   │       ├── listArticles.ts
│   │       ├── removeArticle.ts
│   │       └── searchGuests.ts
│   │
│   ├── guest-payment-records/           # Guest payment records (6 files)
│   │   ├── deno.json
│   │   ├── index.ts
│   │   ├── handlers/
│   │   │   └── generate.ts
│   │   └── lib/
│   │       ├── calculations.ts
│   │       ├── types.ts
│   │       └── validators.ts
│   │
│   ├── host-payment-records/            # Host payment records (6 files)
│   │   ├── deno.json
│   │   ├── index.ts
│   │   ├── handlers/
│   │   │   └── generate.ts
│   │   └── lib/
│   │       ├── calculations.ts
│   │       ├── types.ts
│   │       └── validators.ts
│   │
│   ├── house-manual/                    # House manual management (18 files)
│   │   ├── deno.json
│   │   ├── index.ts
│   │   └── handlers/
│   │       ├── acceptAllSuggestions.ts
│   │       ├── acceptSuggestion.ts
│   │       ├── combineSuggestion.ts
│   │       ├── extractWifi.ts
│   │       ├── getSuggestions.ts
│   │       ├── getVisitManual.ts
│   │       ├── ignoreSuggestion.ts
│   │       ├── initiateCall.ts
│   │       ├── parseDocument.ts
│   │       ├── parseGoogleDoc.ts
│   │       ├── parseText.ts
│   │       ├── reusePrevious.ts
│   │       ├── submitReview.ts
│   │       ├── trackEngagement.ts
│   │       ├── transcribeAudio.ts
│   │       └── validateAccessToken.ts
│   │
│   ├── identity-verification/           # Identity verification (4 files)
│   │   ├── deno.json
│   │   ├── index.ts
│   │   └── handlers/
│   │       ├── getStatus.ts
│   │       └── submit.ts
│   │
│   ├── informational-texts/             # Informational text management
│   │   ├── deno.json
│   │   └── index.ts
│   │
│   ├── lease/                           # Lease management (15 files)
│   │   ├── deno.json
│   │   ├── index.ts
│   │   ├── handlers/
│   │   │   ├── create.ts
│   │   │   ├── generateDates.ts
│   │   │   ├── get.ts
│   │   │   ├── getGuestLeases.ts
│   │   │   ├── getHostLeases.ts
│   │   │   ├── magicLinks.ts
│   │   │   ├── notifications.ts
│   │   │   ├── paymentRecords.ts
│   │   │   └── permissions.ts
│   │   └── lib/
│   │       ├── agreementNumber.ts
│   │       ├── calculations.ts
│   │       ├── dateGenerator.ts
│   │       ├── documentPayloadBuilder.ts
│   │       ├── staysGenerator.ts
│   │       ├── types.ts
│   │       └── validators.ts
│   │
│   ├── lease-documents/                 # Lease document generation (12 files)
│   │   ├── index.ts
│   │   ├── handlers/
│   │   │   ├── generateAll.ts
│   │   │   ├── generateCreditCardAuth.ts
│   │   │   ├── generateHostPayout.ts
│   │   │   ├── generatePeriodicTenancy.ts
│   │   │   └── generateSupplemental.ts
│   │   └── lib/
│   │       ├── calculations.ts
│   │       ├── formatters.ts
│   │       ├── googleDrive.ts
│   │       ├── templateRenderer.ts
│   │       ├── types.ts
│   │       └── validators.ts
│   │
│   ├── leases-admin/                    # Lease administration
│   │   ├── deno.json
│   │   └── index.ts
│   │
│   ├── listing/                         # Listing CRUD (6 files)
│   │   ├── deno.json
│   │   ├── index.ts
│   │   └── handlers/
│   │       ├── create.ts
│   │       ├── delete.ts
│   │       ├── get.ts
│   │       └── submit.ts
│   │
│   ├── magic-login-links/               # Magic login link management (6 files)
│   │   ├── deno.json
│   │   ├── index.ts
│   │   └── handlers/
│   │       ├── getDestinationPages.ts
│   │       ├── getUserData.ts
│   │       ├── listUsers.ts
│   │       └── sendMagicLink.ts
│   │
│   ├── message-curation/                # Message curation
│   │   ├── deno.json
│   │   └── index.ts
│   │
│   ├── messages/                        # Messaging system (11 files)
│   │   ├── deno.json
│   │   ├── index.ts
│   │   └── handlers/
│   │       ├── adminDeleteThread.ts
│   │       ├── adminGetAllThreads.ts
│   │       ├── adminSendReminder.ts
│   │       ├── createProposalThread.ts
│   │       ├── getMessages.ts
│   │       ├── getThreads.ts
│   │       ├── sendGuestInquiry.ts
│   │       ├── sendMessage.ts
│   │       └── sendSplitBotMessage.ts
│   │
│   ├── pricing/                         # Pricing placeholder
│   │   └── index.ts
│   │
│   ├── pricing-admin/                   # Pricing administration
│   │   └── index.ts
│   │
│   ├── pricing-list/                    # Pricing list CRUD (6 files)
│   │   ├── index.ts
│   │   ├── handlers/
│   │   │   ├── create.ts
│   │   │   ├── get.ts
│   │   │   ├── recalculate.ts
│   │   │   └── update.ts
│   │   └── utils/
│   │       └── pricingCalculator.ts
│   │
│   ├── pricing-list-bulk/               # Bulk pricing operations
│   │   └── index.ts
│   │
│   ├── proposal/                        # Proposal management (18 files)
│   │   ├── deno.json
│   │   ├── index.ts
│   │   ├── index.ts.full               # Full version backup
│   │   ├── actions/
│   │   │   ├── accept_counteroffer.ts
│   │   │   ├── accept_proposal.ts
│   │   │   ├── create.ts
│   │   │   ├── create_counteroffer.ts
│   │   │   ├── create_mockup.ts
│   │   │   ├── create_suggested.ts
│   │   │   ├── create_test_proposal.ts
│   │   │   ├── create_test_rental_application.ts
│   │   │   ├── get.ts
│   │   │   ├── get_prefill_data.ts
│   │   │   ├── suggest.ts
│   │   │   └── update.ts
│   │   └── lib/
│   │       ├── calculations.ts
│   │       ├── mockupHelpers.ts
│   │       ├── status.ts
│   │       ├── types.ts
│   │       └── validators.ts
│   │
│   ├── qr-codes/                        # QR code management
│   │   └── index.ts
│   │
│   ├── qr-generator/                    # QR code generation (4 files)
│   │   ├── deno.json
│   │   ├── index.ts
│   │   ├── handlers/
│   │   │   └── generate.ts
│   │   └── lib/
│   │       └── qrConfig.ts
│   │
│   ├── query-leo/                       # Leo query interface
│   │   └── index.ts
│   │
│   ├── quick-match/                     # Quick match guest-listing (7 files)
│   │   ├── deno.json
│   │   ├── index.ts
│   │   ├── actions/
│   │   │   ├── get_proposal.ts
│   │   │   ├── save_choice.ts
│   │   │   └── search_candidates.ts
│   │   └── lib/
│   │       ├── scoring.ts
│   │       └── types.ts
│   │
│   ├── reminder-scheduler/              # Reminder scheduling (10 files)
│   │   ├── index.ts
│   │   ├── handlers/
│   │   │   ├── create.ts
│   │   │   ├── delete.ts
│   │   │   ├── get.ts
│   │   │   ├── processPending.ts
│   │   │   ├── update.ts
│   │   │   └── webhook.ts
│   │   └── lib/
│   │       ├── scheduler.ts
│   │       ├── types.ts
│   │       └── validators.ts
│   │
│   ├── rental-application/              # Rental application (4 files)
│   │   ├── index.ts
│   │   └── handlers/
│   │       ├── get.ts
│   │       ├── submit.ts
│   │       └── upload.ts
│   │
│   ├── rental-applications/             # Rental applications management
│   │   ├── deno.json
│   │   └── index.ts
│   │
│   ├── reviews-overview/                # Reviews management (7 files)
│   │   ├── index.ts
│   │   ├── handlers/
│   │   │   ├── createReview.ts
│   │   │   ├── getPendingReviews.ts
│   │   │   ├── getReceivedReviews.ts
│   │   │   ├── getReviewDetails.ts
│   │   │   └── getSubmittedReviews.ts
│   │   └── lib/
│   │       └── utils.ts
│   │
│   ├── send-email/                      # Email sending via SendGrid (6 files)
│   │   ├── deno.json
│   │   ├── index.ts
│   │   ├── handlers/
│   │   │   └── send.ts
│   │   └── lib/
│   │       ├── sendgridClient.ts
│   │       ├── templateProcessor.ts
│   │       └── types.ts
│   │
│   ├── send-sms/                        # SMS sending via Twilio (5 files)
│   │   ├── deno.json
│   │   ├── index.ts
│   │   └── lib/
│   │       ├── twilioClient.ts
│   │       └── types.ts
│   │
│   ├── simulation-admin/                # Simulation administration
│   │   └── index.ts
│   │
│   ├── simulation-guest/                # Guest simulation testing (9 files)
│   │   ├── index.ts
│   │   └── actions/
│   │       ├── cleanup.ts
│   │       ├── initialize.ts
│   │       ├── stepALeaseDocuments.ts
│   │       ├── stepBHouseManual.ts
│   │       ├── stepCDateChange.ts
│   │       ├── stepDLeaseEnding.ts
│   │       ├── stepEHostSms.ts
│   │       └── stepFComplete.ts
│   │
│   ├── simulation-host/                 # Host simulation testing (11 files)
│   │   ├── deno.json
│   │   ├── index.ts
│   │   └── actions/
│   │       ├── acceptProposal.ts
│   │       ├── cleanup.ts
│   │       ├── completeStay.ts
│   │       ├── createTestGuest.ts
│   │       ├── createTestProposals.ts
│   │       ├── handleGuestRequest.ts
│   │       ├── initSimulation.ts
│   │       ├── markTester.ts
│   │       └── sendCounteroffer.ts
│   │
│   ├── slack/                           # Slack webhook integration
│   │   └── index.ts
│   │
│   ├── temp-fix-trigger/                # Temporary fix trigger
│   │   └── index.ts
│   │
│   ├── tests/                           # Test utilities (3 files)
│   │   ├── helpers/
│   │   │   ├── assertions.ts
│   │   │   └── fixtures.ts
│   │   └── integration/
│   │       └── .gitkeep
│   │
│   ├── usability-data-admin/            # Usability testing admin (12 files)
│   │   ├── index.ts
│   │   └── actions/
│   │       ├── createQuickProposal.ts
│   │       ├── deleteGuestData.ts
│   │       ├── deleteGuestTestStatus.ts
│   │       ├── deleteHostData.ts
│   │       ├── deleteHostListings.ts
│   │       ├── deleteHostTestStatus.ts
│   │       ├── deleteProposal.ts
│   │       ├── fetchListing.ts
│   │       ├── listGuests.ts
│   │       └── listHosts.ts
│   │
│   ├── verify-users/                    # User verification
│   │   ├── deno.json
│   │   └── index.ts
│   │
│   ├── virtual-meeting/                 # Virtual meeting management (15 files)
│   │   ├── deno.json
│   │   ├── index.ts
│   │   ├── handlers/
│   │   │   ├── accept.ts
│   │   │   ├── create.ts
│   │   │   ├── decline.ts
│   │   │   ├── delete.ts
│   │   │   ├── notifyParticipants.ts
│   │   │   ├── sendCalendarInvite.ts
│   │   │   └── admin/
│   │   │       ├── blockedSlots.ts
│   │   │       ├── confirmMeeting.ts
│   │   │       ├── deleteMeeting.ts
│   │   │       ├── fetchConfirmedMeetings.ts
│   │   │       ├── fetchNewRequests.ts
│   │   │       └── updateMeetingDates.ts
│   │   └── lib/
│   │       ├── types.ts
│   │       └── validators.ts
│   │
│   ├── workflow-enqueue/                # Workflow queue entry point
│   │   ├── deno.json
│   │   └── index.ts
│   │
│   └── workflow-orchestrator/           # Workflow orchestration (4 files)
│       ├── deno.json
│       ├── index.ts
│       └── lib/
│           └── types.ts
│
├── migrations/                          # Database migrations (22 files)
│   ├── 20260125010000_identity_verification_user_fields.sql
│   ├── 20260125020000_identity_verification_bucket.sql
│   ├── 20260127000500_create_experience_survey_table.sql
│   ├── 20260127010000_create_qr_codes_table.sql
│   ├── 20260127020000_create_review_tables.sql
│   ├── 20260128010000_alter_pricing_list_add_scalars.sql
│   ├── 20260128020000_calendar_automation_fields.sql
│   ├── 20260128030000_contract_templates_storage_setup.sql
│   ├── 20260128040000_create_count_user_threads_function.sql
│   ├── 20260128050000_database_views.sql
│   ├── 20260128060000_fix_rls_policies_for_new_users.sql
│   ├── 20260128070000_materialized_views.sql
│   ├── 20260128080000_performance_indexes.sql
│   ├── 20260128190000_create_notification_audit.sql
│   ├── 20260128190100_backfill_notification_preferences.sql
│   ├── 20260129010000_add_create_proposal_guest_cta.sql
│   ├── 20260129020000_thread_participant_trigger.sql
│   ├── 20260129234811_populate_thread_participant_junction.sql
│   ├── 20260130002000_fix_thread_participant_trigger.sql
│   ├── 20260130003000_fix_message_trigger_column_names.sql
│   ├── 20260130141623_message_trigger_fix_production.sql
│   ├── 20260130150000_force_fix_thread_trigger.sql
│   ├── 20260130200000_create_get_host_listings_function.sql
│   ├── 20260130_add_date_change_reminder_tracking.sql
│   └── 20260131124354_fix_message_trigger_column_names.sql
│
└── scripts/                             # Utility scripts (2 files)
    ├── setup-contract-storage.sh
    └── sync-edge-functions.js
```

---

## File Summaries by Category

### Configuration Files

| File | Purpose |
|------|---------|
| `config.toml` | Supabase local dev configuration - defines API ports (54321), database (54322), Studio (54323), all 47 Edge Functions with their entrypoints, Deno 2 runtime, auth settings |
| `functions/deno.json` | Global Deno configuration - test tasks, lint rules, formatting (2-space indent, single quotes, 100 char width) |
| `.env.sample` | Environment variable template for local development |

### Shared Utilities (`functions/_shared/`)

| File | Purpose | Key Exports |
|------|---------|-------------|
| `cors.ts` | CORS headers for Edge Functions | `corsHeaders` object with permissive CORS |
| `errors.ts` | Custom error classes with HTTP status mapping | `BubbleApiError`, `SupabaseSyncError`, `ValidationError`, `AuthenticationError`, `OpenAIError`, `formatErrorResponse()`, `getStatusCodeFromError()` |
| `validation.ts` | Input validation utilities | `validateEmail()`, `validatePhone()`, `validateRequired()`, `validateRequiredFields()` |
| `slack.ts` | Slack webhook for error reporting | `ErrorCollector` class, `sendToSlack()`, `createErrorCollector()` |
| `openai.ts` | OpenAI API wrapper | `complete()`, `stream()` for GPT completions |
| `bubbleSync.ts` | Bubble.io sync service (Write-Read-Write pattern) | `BubbleSyncService` class |
| `queueSync.ts` | Queue-based async sync | `enqueueBubbleSync()`, `triggerQueueProcessing()` |
| `types.ts` | Shared TypeScript interfaces | `EdgeFunctionRequest`, `User`, etc. |
| `aiTypes.ts` | AI-specific types | `AIGatewayRequest`, `PromptConfig`, `DataLoader` |
| `functional/result.ts` | Result type for FP error handling | `Result<T, E>`, `ok()`, `err()` |
| `functional/orchestration.ts` | Request/response orchestration | `parseRequest()`, `validateAction()`, `routeToHandler()`, `formatSuccessResponse()` |
| `functional/errorLog.ts` | Immutable error logging | `createErrorLog()`, `addError()`, `setAction()` |
| `messagingHelpers.ts` | Messaging utilities | Thread/message creation helpers |
| `notificationHelpers.ts` | Notification utilities | Notification formatting and routing |
| `notificationSender.ts` | Send notifications | Multi-channel notification dispatch |
| `emailUtils.ts` | Email utilities | Email formatting helpers |
| `geoLookup.ts` | Geographic lookup | Location/coordinate utilities |
| `jsonUtils.ts` | JSON parsing utilities | Safe JSON parsing/normalization |
| `junctionHelpers.ts` | Junction table helpers | Many-to-many relationship utilities |
| `ctaHelpers.ts` | Call-to-action helpers | CTA button/link generation |
| `vmMessagingHelpers.ts` | Virtual meeting messaging | Meeting-specific message templates |
| `negotiationSummaryHelpers.ts` | AI negotiation summaries | Summary generation for proposals |
| `errorReporting.ts` | Error reporting | Consolidated error reporting utilities |

### Edge Functions by Domain

#### Authentication (`auth-user/`)
**Purpose**: User authentication via Supabase Auth
**Actions**: `login`, `signup`, `logout`, `validate`, `request_password_reset`, `update_password`, `generate_magic_link`, `oauth_signup`, `oauth_login`, `send_magic_link_sms`, `verify_email`
**Pattern**: Action-based routing with FP architecture, Result type for error handling

| Handler | Purpose |
|---------|---------|
| `login.ts` | Email/password login via Supabase Auth |
| `signup.ts` | New user registration with account creation |
| `logout.ts` | Logout stub (actual logout is client-side) |
| `validate.ts` | Token validation and user data fetch |
| `resetPassword.ts` | Password reset email request |
| `updatePassword.ts` | Password update after reset link |
| `generateMagicLink.ts` | Magic link generation without sending |
| `oauthLogin.ts` | OAuth login verification |
| `oauthSignup.ts` | OAuth user creation |
| `sendMagicLinkSms.ts` | Magic link via SMS |
| `verifyEmail.ts` | Email verification |

#### AI Services

| Function | Purpose | Key Features |
|----------|---------|--------------|
| `ai-gateway/` | OpenAI proxy with prompt templating | Prompt registry, data loaders, streaming support |
| `ai-parse-profile/` | Parse user profiles from freeform text | GPT-4 extraction |
| `ai-room-redesign/` | AI room redesign suggestions | Image analysis prompts |
| `ai-signup-guest/` | AI-powered guest signup flow | Conversational signup |
| `ai-tools/` | AI content generation | Deepfakes, jingles, narrations, scripts |

#### Core Business Logic

| Function | Purpose | Actions |
|----------|---------|---------|
| `proposal/` | Proposal CRUD and workflow | `create`, `update`, `get`, `suggest`, `accept_proposal`, `accept_counteroffer`, `create_counteroffer`, `create_suggested`, `create_mockup` |
| `listing/` | Listing CRUD | `create`, `get`, `delete`, `submit` |
| `messages/` | Real-time messaging | `sendMessage`, `getMessages`, `getThreads`, `createProposalThread`, `sendGuestInquiry` |
| `lease/` | Lease management | `create`, `get`, `getGuestLeases`, `getHostLeases`, `generateDates`, `magicLinks`, `notifications`, `paymentRecords`, `permissions` |

#### Payments & Pricing

| Function | Purpose |
|----------|---------|
| `pricing/` | Pricing placeholder |
| `pricing-list/` | Pricing list CRUD with calculator |
| `pricing-list-bulk/` | Bulk pricing operations |
| `pricing-admin/` | Pricing administration |
| `guest-payment-records/` | Guest payment record generation |
| `host-payment-records/` | Host payment record generation |

#### Communications

| Function | Purpose | Provider |
|----------|---------|----------|
| `send-email/` | Templated email sending | SendGrid |
| `send-sms/` | SMS sending | Twilio |
| `slack/` | Slack webhook integration | Slack API |
| `communications/` | Communications placeholder | - |

#### Meetings & Scheduling

| Function | Purpose |
|----------|---------|
| `virtual-meeting/` | Virtual meeting lifecycle (create, accept, decline, delete, notify) |
| `calendar-automation/` | Google Calendar integration |
| `reminder-scheduler/` | Reminder scheduling and processing |

#### Documents & Contracts

| Function | Purpose |
|----------|---------|
| `lease-documents/` | Lease document generation with Google Drive integration |
| `document/` | General document management |
| `house-manual/` | House manual parsing and management |

#### Data Sync

| Function | Purpose |
|----------|---------|
| `bubble_sync/` | Supabase→Bubble sync via queue (Workflow API + Data API modes) |
| `workflow-enqueue/` | Workflow queue entry point |
| `workflow-orchestrator/` | pgmq-based workflow processor |

#### Admin & Testing

| Function | Purpose |
|----------|---------|
| `simulation-admin/` | Simulation administration |
| `simulation-guest/` | Guest simulation testing (6 steps) |
| `simulation-host/` | Host simulation testing (9 actions) |
| `usability-data-admin/` | Usability testing data management |
| `verify-users/` | User verification |
| `admin-query-auth/` | Admin authentication queries |

#### Other Functions

| Function | Purpose |
|----------|---------|
| `cohost-request/` | Co-host request management |
| `date-change-request/` | Date change request workflow |
| `emergency/` | Emergency management |
| `experience-survey/` | Experience survey collection |
| `guest-management/` | Guest management |
| `identity-verification/` | Identity verification |
| `informational-texts/` | Informational text management |
| `magic-login-links/` | Magic login link management |
| `message-curation/` | Message curation |
| `qr-codes/` | QR code management |
| `qr-generator/` | QR code generation |
| `query-leo/` | Leo query interface |
| `quick-match/` | Quick match guest-listing |
| `rental-application/` | Rental application submission |
| `rental-applications/` | Rental applications management |
| `reviews-overview/` | Reviews management |

### Database Migrations

| Migration | Purpose |
|-----------|---------|
| `identity_verification_user_fields` | Add identity verification fields to user table |
| `identity_verification_bucket` | Create storage bucket for identity docs |
| `create_experience_survey_table` | Experience survey table |
| `create_qr_codes_table` | QR codes table |
| `create_review_tables` | Review system tables |
| `alter_pricing_list_add_scalars` | Add scalar fields to pricing_list |
| `calendar_automation_fields` | Calendar automation fields |
| `contract_templates_storage_setup` | Contract template storage |
| `create_count_user_threads_function` | Function to count user threads |
| `database_views` | Database views |
| `fix_rls_policies_for_new_users` | RLS policy fixes |
| `materialized_views` | Materialized views |
| `performance_indexes` | Performance indexes |
| `create_notification_audit` | Notification audit table |
| `backfill_notification_preferences` | Backfill notification prefs |
| `add_create_proposal_guest_cta` | Guest CTA for proposal creation |
| `thread_participant_trigger` | Thread participant junction trigger |
| `populate_thread_participant_junction` | Backfill thread participants |
| `fix_thread_participant_trigger` | Trigger fix |
| `fix_message_trigger_column_names` | Message trigger column fix |
| `message_trigger_fix_production` | Production trigger fix |
| `force_fix_thread_trigger` | Force trigger fix |
| `create_get_host_listings_function` | Host listings function |
| `add_date_change_reminder_tracking` | Date change reminder tracking |

---

## Architecture Patterns

### Action-Based Routing
All Edge Functions use `{ action, payload }` request pattern:
```typescript
// Request
{ "action": "login", "payload": { "email": "...", "password": "..." } }

// Response
{ "success": true, "data": { ... } }
// or
{ "success": false, "error": "Error message" }
```

### Functional Programming Principles
- **Result Type**: `Result<T, E>` for error handling without exceptions
- **Immutable Error Log**: Error collection without mutation
- **Pure Functions**: Validation, routing, response formatting
- **Side Effects at Boundaries**: Entry/exit points only

### Queue-Based Sync
```
Supabase → sync_queue → bubble_sync → Bubble API
                ↑
        pg_cron (5 min) or immediate trigger
```

### Error Handling
- Custom error classes with HTTP status codes
- Error collection for consolidated Slack reporting
- NO FALLBACK principle - fail fast, return real errors

---

## Statistics

| Category | Count |
|----------|-------|
| **Total Files** | 435 |
| **Edge Functions** | 47 |
| **Shared Utilities** | 25 |
| **Migrations** | 22 |
| **Handlers/Actions** | ~200 |
| **Prompt Templates** | 13 |

---

**Document Version**: 1.0
**Last Updated**: 2026-02-01
