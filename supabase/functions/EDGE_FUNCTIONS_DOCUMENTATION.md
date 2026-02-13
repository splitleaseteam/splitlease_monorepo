# Edge Functions Documentation

```
Generated: 2026-02-13
Total Functions: 46
Runtime: Deno 2 with JSR imports
Architecture: FP (Functional Programming) with Result types
```

---

### Decommissioned in Round 15

Removed from `supabase/functions/` (dead or zero-invocation nice-to-have):

- `ai-signup-guest`
- `ai-tools`
- `ai-parse-profile`
- `calendar-automation`
- `experience-survey`
- `guest-management`
- `rental-application-submit`
- `co-host-requests`
- `pricing`
- `pricing-list-bulk`
- `pricing-tiers`
- `qr-generator`
- `create-payment-intent`
- `process-date-change-fee`

---

### AI Functions (2)

#### 1. ai-gateway
**Purpose**: OpenAI proxy with prompt templating

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `complete` | Conditional* | Non-streaming completion |
| `stream` | Conditional* | SSE streaming completion |

*Public prompts don't require auth

**Public Prompts**: `listing-description`, `listing-title`, `neighborhood-description`, `parse-call-transcription`, `echo-test`, `negotiation-summary-suggested`, `negotiation-summary-counteroffer`, `negotiation-summary-host`

---

#### 2. ai-room-redesign
**Purpose**: AI-powered room redesign suggestions

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `redesign` | Yes | Generate room redesign suggestions |

---

### Authentication Functions (1)

#### 3. auth-user
**Purpose**: Authentication operations via Supabase Auth

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `login` | No | User login (email/password) |
| `signup` | No | New user registration |
| `logout` | No | User logout (stub) |
| `validate` | No | Validate token and fetch user data |
| `request_password_reset` | No | Send password reset email |
| `update_password` | No | Update password after reset |
| `generate_magic_link` | No | Generate magic link without sending |
| `oauth_signup` | No | Create user from OAuth provider |
| `oauth_login` | No | Verify OAuth user exists |
| `send_magic_link_sms` | No | Send magic link via SMS |
| `verify_email` | No | Verify email via magic link token |

**Database Tables**: `user`, `host_account`, `guest_account`

---

### Background Jobs (4)

#### 4. date-change-reminder-cron
**Purpose**: Cron job for date change request reminders

| Action | Auth Required | Description |
|--------|---------------|-------------|
| (POST) | Service | Run reminder check |

**Configuration**:
- Reminder window: 1.5-2.5 hours before expiry
- Cooldown: 12 hours between reminders

---

#### 5. workflow-enqueue
**Purpose**: Enqueue workflow operations

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `enqueue` | Service | Add job to queue |

---

#### 6. workflow-orchestrator
**Purpose**: Orchestrate complex workflows

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `orchestrate` | Service | Execute workflow |

---

#### 7. reminder-scheduler
**Purpose**: Schedule and manage reminders

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `schedule` | Service | Schedule reminder |
| `cancel` | Service | Cancel reminder |

---

### Bidding Functions (3)

#### 8. submit-bid
**Purpose**: Submit bids on bidding sessions (Pattern 4: BS+BS Competitive Bidding)

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `submit` | Yes | Submit a new bid |
| `get_session` | No | Get current session state |
| `get_bid_history` | No | Get all bids in session |
| `create_session` | Yes | Create new bidding session |

---

#### 9. withdraw-bid
**Purpose**: Withdraw from bidding sessions

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `withdraw` | Yes | Withdraw from session |
| `get_withdrawal_status` | Yes | Check withdrawal eligibility |

---

#### 10. set-auto-bid
**Purpose**: Configure auto-bidding

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `set` | Yes | Set max auto-bid amount |
| `get` | Yes | Get current auto-bid settings |
| `clear` | Yes | Remove auto-bid configuration |

---

### Communication Functions (4)

#### 11. send-email
**Purpose**: Send templated emails via SendGrid

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `send` | Conditional* | Send templated email |
| `health` | No | Check function health |

*Public templates (magic login, welcome) don't require auth

---

#### 12. send-sms
**Purpose**: Send SMS via Twilio

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `send` | Conditional* | Send SMS message |
| `health` | No | Check function health |

*Magic link SMS from specific number doesn't require auth

---

#### 13. communications
**Purpose**: Placeholder for future communications

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `health` | No | Health check (placeholder) |

---

#### 14. slack
**Purpose**: Slack integration for FAQ inquiries

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `faq_inquiry` | No | Send FAQ inquiry to Slack |
| `diagnose` | No | Diagnose environment config |

---

### Core Business Functions (13)

#### 15. listing
**Purpose**: Listing CRUD operations

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `create` | No | Create a new listing |
| `get` | No | Get listing details |
| `submit` | Yes | Full listing submission |
| `delete` | No | Delete a listing |

---

#### 16. proposal
**Purpose**: Proposal CRUD and simulation operations

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `create` | Yes | Create new proposal |
| `update` | Optional | Update existing proposal |
| `get` | No | Get proposal details |
| `suggest` | Yes | Find and create suggestion proposals |
| `create_suggested` | No | Create suggested proposal (internal) |
| `create_mockup` | No | Create mockup proposal (internal) |
| `get_prefill_data` | No | Get prefill data for proposal |
| `createTestProposal` | Yes | Create test proposal (simulation) |
| `createTestRentalApplication` | Yes | Create test rental application |
| `acceptProposal` | Yes | Accept a proposal |
| `createCounteroffer` | Yes | Create counteroffer |
| `acceptCounteroffer` | Yes | Accept counteroffer |

---

#### 17. messages
**Purpose**: Real-time messaging operations

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `send_message` | Yes | Send message in thread |
| `get_messages` | Yes | Get messages for thread |
| `get_threads` | Yes | Get all threads for user |
| `send_guest_inquiry` | No | Contact host without auth |
| `create_proposal_thread` | No | Create thread for proposal (internal) |
| `admin_get_all_threads` | No* | Fetch all threads (admin) |
| `admin_delete_thread` | No* | Soft-delete thread (admin) |
| `admin_send_reminder` | No* | Send reminder (admin) |

*Admin actions use soft headers pattern

---

#### 18. date-change-request
**Purpose**: Handle date change requests

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `create` | Yes | Create date change request |
| `get` | Yes | Get request details |
| `update` | Yes | Update request |
| `accept` | Yes | Accept request |
| `reject` | Yes | Reject request |

---

#### 19. cohost-request
**Purpose**: Co-host request operations

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `create` | Yes | Create cohost request |
| `get` | Yes | Get request details |
| `update` | Yes | Update request |
| `delete` | Yes | Delete request |

---

#### 20. cohost-request-slack-callback
**Purpose**: Handle Slack callbacks for co-host requests

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `callback` | No | Handle Slack callback |

---

#### 21. document
**Purpose**: Document management

| Action | Auth Required | Description |
|--------|---------------|-------------|
| CRUD | Yes | Standard CRUD operations |

---

#### 22. emergency
**Purpose**: Emergency contact/procedures

| Action | Auth Required | Description |
|--------|---------------|-------------|
| CRUD | Yes | Standard CRUD operations |

---

#### 23. house-manual
**Purpose**: House manual management

| Action | Auth Required | Description |
|--------|---------------|-------------|
| CRUD | Yes | Standard CRUD operations |

---

#### 24. guest-payment-records
**Purpose**: Guest payment record management

| Action | Auth Required | Description |
|--------|---------------|-------------|
| CRUD | Yes | Standard CRUD operations |

---

#### 25. host-payment-records
**Purpose**: Host payment record management

| Action | Auth Required | Description |
|--------|---------------|-------------|
| CRUD | Yes | Standard CRUD operations |

---

#### 26. lease
**Purpose**: Lease operations

| Action | Auth Required | Description |
|--------|---------------|-------------|
| CRUD | Yes | Standard CRUD operations |

---

#### 27. virtual-meeting
**Purpose**: Virtual meeting integration (HeyGen, ElevenLabs)

| Action | Auth Required | Description |
|--------|---------------|-------------|
| CRUD | Yes | Standard CRUD operations |

---

### Admin Functions (12)

#### 28. leases-admin
**Purpose**: Admin dashboard for lease management

| Action | Description |
|--------|-------------|
| `list` | List all leases with pagination |
| `get` | Get single lease details |
| `update` | Update lease data |
| `update_status` | Update lease status |

---

#### 29. rental-application-admin
**Purpose**: Admin rental application management

| Action | Description |
|--------|-------------|
| `list` | List all applications |
| `get` | Get single application |
| `update` | Update application |
| `update_status` | Update application status |
| `add_occupant` | Add occupant to application |
| `delete_occupant` | Remove occupant |
| `add_reference` | Add reference |
| `delete_reference` | Remove reference |
| `add_employment` | Add employment history |
| `delete_employment` | Remove employment history |

---

#### 30. identity-verification-admin
**Purpose**: Admin tool for identity verification

| Action | Description |
|--------|-------------|
| `list_users` | List users (paginated) |
| `search_users` | Search by email or name |
| `get_user` | Get user with documents |
| `toggle_verification` | Update verification status |

---

#### 31. magic-login-links
**Purpose**: Admin tool for generating magic login links

| Action | Description |
|--------|-------------|
| `list_users` | List users for link generation |
| `get_user_data` | Get user data by ID |
| `send_magic_link` | Generate and send magic link |
| `get_destination_pages` | Get available destinations |

---

#### 32. message-curation
**Purpose**: Admin tool for message moderation

| Action | Description |
|--------|-------------|
| `getThreads` | Get all threads with filters |
| `getThreadMessages` | Get messages for thread |
| `getMessage` | Get single message |
| `deleteMessage` | Soft-delete message |
| `deleteThread` | Soft-delete thread |
| `forwardMessage` | Forward message |
| `sendSplitBotMessage` | Send SplitBot message |

---

#### 33. pricing-admin
**Purpose**: Admin dashboard for listing price management

| Action | Description |
|--------|-------------|
| `list` | List listings with pricing |
| `get` | Get single listing pricing |
| `updatePrice` | Update listing price |
| `bulkUpdate` | Bulk update prices |
| `setOverride` | Set price override |
| `toggleActive` | Toggle listing active status |
| `getConfig` | Get pricing configuration |
| `export` | Export to CSV/JSON |

---

#### 34. pricing-list
**Purpose**: Pricing list management

| Action | Description |
|--------|-------------|
| CRUD | Standard CRUD operations |

---

#### 35. simulation-admin
**Purpose**: Admin tool for usability testing simulation testers

| Action | Description |
|--------|-------------|
| `listTesters` | List all usability testers |
| `getTester` | Get single tester |
| `resetToDay1` | Reset tester to step 0 |
| `advanceToDay2` | Advance tester to step 4 |
| `getStatistics` | Get tester distribution stats |

---

#### 36. usability-data-admin
**Purpose**: Admin tool for managing usability testing data

| Action | Description |
|--------|-------------|
| `listHosts` | Get usability tester hosts |
| `listGuests` | Get usability tester guests |
| `deleteHostData` | Clear host threads/proposals |
| `deleteHostListings` | Delete all host listings |
| `deleteHostTestStatus` | Reset host test step |
| `deleteGuestData` | Clear guest threads/proposals |
| `deleteGuestTestStatus` | Reset guest test step |
| `fetchListing` | Get listing by ID |
| `createQuickProposal` | Create test proposal |
| `deleteProposal` | Delete proposal |

---

#### 37. informational-texts
**Purpose**: Manage informational text content

| Action | Description |
|--------|-------------|
| CRUD | Standard CRUD operations |

---

#### 38. reviews-overview
**Purpose**: Reviews overview and management

| Action | Description |
|--------|-------------|
| `list` | List reviews with filters |

---

#### 39. verify-users
**Purpose**: User verification management

| Action | Description |
|--------|-------------|
| CRUD | Standard CRUD operations |

---

### Document Functions (1)

#### 40. lease-documents
**Purpose**: Generate DOCX lease documents to Google Drive

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `generate_host_payout` | No | Generate Host Payout Schedule Form |
| `generate_supplemental` | No | Generate Supplemental Agreement |
| `generate_periodic_tenancy` | No | Generate Periodic Tenancy Agreement |
| `generate_credit_card_auth` | No | Generate Credit Card Authorization Form |
| `generate_all` | No | Generate all 4 documents |

**Templates**: Stored in Supabase Storage bucket `document-templates`

---

### Integration Functions (0)

### Payment Functions (1)

#### 41. stripe-webhook
**Purpose**: Stripe webhook handler

| Event | Description |
|-------|-------------|
| `payment_intent.succeeded` | Update request to paid |
| `payment_intent.payment_failed` | Record failure |
| `payment_intent.canceled` | Reset payment status |
| `charge.refunded` | Record refund |
| `charge.dispute.created` | Record dispute |

---

### Pricing Functions (1)

#### 42. identity-verification-submit
**Purpose**: User identity document submission

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `submit_verification` | Yes | Submit documents for verification |
| `get_status` | Yes | Get current verification status |

---

### Simulation Functions (2)

#### 43. simulation-guest
**Purpose**: Guest-side usability simulation flow

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `simulate` | No | Run guest simulation |

---

#### 44. simulation-host
**Purpose**: Host-side usability simulation flow

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `simulate` | No | Run host simulation |

---

### Utility Functions (2)

#### 45. qr-codes
**Purpose**: QR code management

| Action | Auth Required | Description |
|--------|---------------|-------------|
| CRUD | No | Standard CRUD operations |

---

#### 46. quick-match
**Purpose**: Quick matching algorithm for listings

| Action | Auth Required | Description |
|--------|---------------|-------------|
| `match` | No | Find matches |

---

**Document Version**: 2.0
**Last Updated**: 2026-02-11
