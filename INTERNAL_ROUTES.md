# Split Lease - Internal Page Routes

## Public Pages (No Authentication Required)

| Route | Description |
|-------|-------------|
| `/` | Homepage |
| `/search` | Search/Listings Page |
| `/quick-match` | Quick Match |
| `/view-split-lease/:id` | View Listing Details |
| `/help-center` | Help Center Main |
| `/help-center/:category` | Help Center By Category |
| `/faq` | FAQ Page |
| `/policies` | Policies Page |
| `/list-with-us` | List With Us Page |
| `/list-with-us-v2` | List With Us V2 |
| `/why-split-lease` | Why Split Lease Page |
| `/careers` | Careers Page |
| `/about-us` | About Us Page |
| `/host-guarantee` | Host Guarantee Page |
| `/referral` | Referral Program |
| `/guest-success` | Guest Success Page |
| `/host-success` | Host Success Page |
| `/reset-password` | Password Reset Page |
| `/auth/verify` | Email Verification Page |
| `/404` | Not Found Error Page |
| `/visit-manual` | Guest-Facing Visit Manual |
| `/qr-code-landing` | QR Code Landing Page |
| `/report-emergency` | Guest Emergency Report Form |

## Protected Pages (Authentication Required)

| Route | Description |
|-------|-------------|
| `/preview-split-lease/:id` | Preview Listing |
| `/guest-proposals/:userId` | Guest Proposals List |
| `/guest-leases/:userId` | My Leases (Guest) |
| `/my-leases` | My Leases (Guest) - alias |
| `/schedule/:leaseId` | Schedule Dashboard |
| `/host-proposals/:userId` | Host Proposals List |
| `/host-leases` | Host Leases List |
| `/self-listing` | Create/Edit Listing |
| `/self-listing-v2` | Create/Edit Listing V2 |
| `/listing-dashboard` | Listing Dashboard |
| `/host-overview` | Host Overview Dashboard |
| `/account-profile/:userId` | User Account Profile |
| `/favorite-listings` | Favorite Listings |
| `/rental-application` | Rental Application Form |
| `/messages` | Messaging App / Chat |
| `/house-manual` | House Rules Manual |
| `/guest-experience-review` | Guest Experience Survey |
| `/host-experience-review` | Host Experience Survey |
| `/reviews-overview` | Reviews Overview |

## Contract/Legal Pages

| Route | Description |
|-------|-------------|
| `/contracts/credit-card-auth` | Credit Card Authorization Form |
| `/contracts/host-payout` | Host Payout Agreement |
| `/contracts/periodic-tenancy` | Periodic Tenancy Agreement |
| `/contracts/supplemental` | Supplemental Agreement |

## Internal/Admin Pages

| Route | Description |
|-------|-------------|
| `/_internal-test` | Internal Testing Page |
| `/_create-suggested-proposal` | Create Suggested Proposal |
| `/_leases-overview` | Leases Overview |
| `/_email-sms-unit` | Email/SMS Unit Test |
| `/_guest-simulation` | Guest Simulation |
| `/_guest-relationships` | Guest Relationships Management |
| `/_manage-virtual-meetings` | Virtual Meetings Management |
| `/_manage-informational-texts` | Informational Texts Management |
| `/_quick-price` | Quick Price Tool |
| `/_verify-users` | User Verification Tool |
| `/_co-host-requests` | Co-Host Requests Management |
| `/_simulation-admin` | Simulation Admin |
| `/_send-magic-login-links` | Send Magic Login Links |
| `/_modify-listings` | Modify Listings Tool |
| `/_message-curation` | Message Curation Tool |
| `/_usability-data-management` | Usability Data Management |
| `/_ai-tools` | AI Tools Interface |
| `/_emergency` | Emergency Management |
| `/_admin-threads` | Admin Threads Management |
| `/_manage-rental-applications/:id` | Manage Rental Applications |
| `/_create-document` | Create Document Tool |
| `/_proposal-manage` | Proposal Management |
| `/_listings-overview` | Listings Overview |
| `/_experience-responses` | Experience Responses Data |
| `/_pricing-unit-test` | Pricing Unit Test |
| `/_manage-leases-payment-records/:leaseId` | Manage Leases & Payment Records |
| `/_mlpr` | Manage Leases & Payment Records (alias) |
| `/_test-contracts` | Test Contracts Page |

## Internal Unit Test Pages

| Route | Description |
|-------|-------------|
| `/_internal/z-search-unit-test` | Search Unit Test |
| `/_internal/z-emails-unit` | Emails Unit Test |
| `/_internal/z-schedule-test` | Schedule Test |
| `/_internal/z-sharath-test` | Sharath Test |
| `/_internal/z-unit-chatgpt-models` | ChatGPT Models Unit |
| `/_internal/z-unit-payment-records-js` | Payment Records JS Unit |

## Dev-Only Pages

| Route | Description |
|-------|-------------|
| `/referral-demo` | Referral Demo |
| `/signup-trial-host` | Trial Host Signup |
| `/index-dev` | Index Dev |
| `/favorite-listings-v2` | Favorite Listings V2 |

## Simulation Pages

| Route | Description |
|-------|-------------|
| `/simulation-guest-proposals-mobile-day1` | Guest Mobile Simulation Day 1 |
| `/simulation-guest-mobile` | Guest Mobile Simulation Day 2 |
| `/simulation-guestside-demo` | Guestside Demo |
| `/simulation-hostside-demo` | Hostside Demo |
| `/simulation-host-mobile` | Host Mobile Simulation |

---

**Total: 102 routes**

Source: `app/src/routes.config.js`
