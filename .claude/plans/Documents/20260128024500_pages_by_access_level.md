# Split Lease Pages Categorized by Access Level

**Generated:** 2026-01-28 02:45:00
**Updated:** 2026-01-29 (host/guest pages now only include protected pages)
**Source:** `app/src/routes.config.js`

This document categorizes all 80 pages in the Split Lease application by authentication requirements and user roles.

---

## Table of Contents

1. [All Pages (80 Total)](#all-pages-80-total)
2. [Protected Pages (21 Total)](#protected-pages-21-total)
3. [Public Pages (59 Total)](#public-pages-59-total)
4. [Admin/Internal Pages (32 Total)](#admininternal-pages-32-total)
5. [Host-Only Pages (9 Total)](#host-only-pages-9-total) *(protected only)*
6. [Guest-Only Pages (8 Total)](#guest-only-pages-8-total) *(protected only)*
7. [Dual-Role Pages (5 Total)](#dual-role-pages-5-total)

---

## All Pages (80 Total)

### Public Pages (No Auth Required)
1. `/` - Homepage
2. `/index-dev` - Development homepage (devOnly)
3. `/search` - Search listings
4. `/quick-match` - Quick match tool
5. `/view-split-lease/:id` - View listing details
6. `/help-center` - Help center home
7. `/help-center/:category` - Help center categories
8. `/faq` - Frequently asked questions
9. `/policies` - Terms and policies
10. `/list-with-us` - Host onboarding (v1)
11. `/list-with-us-v2` - Host onboarding (v2)
12. `/why-split-lease` - Value proposition
13. `/careers` - Careers page
14. `/about-us` - About page
15. `/host-guarantee` - Host guarantee info
16. `/referral` - Referral program
17. `/guest-success` - Guest signup success
18. `/host-success` - Host signup success
19. `/reset-password` - Password reset
20. `/auth/verify` - Email verification
21. `/404` - Not found page
22. `/visit-manual` - Guest visit manual
23. `/qr-code-landing` - QR code landing
24. `/signup-trial-host` - Trial host signup (devOnly, broken)
25. `/referral-demo` - Referral demo (devOnly)
26. `/report-emergency` - Guest emergency submission
27. `/self-listing-v2` - Self listing v2 (currently public, should be protected)

### Protected Pages (Auth Required)
28. `/preview-split-lease/:id` - Preview listing (draft)
29. `/guest-proposals/:userId` - Guest proposals dashboard
30. `/account-profile/:userId` - User profile
31. `/guest-leases/:userId` - Guest leases dashboard
32. `/host-proposals/:userId` - Host proposals dashboard
33. `/host-leases` - Host leases dashboard
34. `/self-listing` - Create/edit listings
35. `/listing-dashboard` - Listing management
36. `/host-overview` - Host dashboard overview
37. `/favorite-listings` - Saved listings
38. `/favorite-listings-v2` - Saved listings v2 (devOnly)
39. `/rental-application` - Rental application form
40. `/messages` - Messaging app
41. `/house-manual` - Host house manual editor
42. `/simulation-guest-mobile` - Guest simulation (mobile)
43. `/simulation-guestside-demo` - Guest usability test
44. `/simulation-hostside-demo` - Host usability test
45. `/simulation-host-mobile` - Host simulation (mobile)
46. `/guest-experience-review` - Guest feedback survey
47. `/host-experience-review` - Host feedback survey
48. `/reviews-overview` - User reviews dashboard

### Admin/Internal Pages (No Auth, Path-Based Access Control)
49. `/_internal-test` - Internal testing page
50. `/_create-suggested-proposal` - Proposal creation tool
51. `/_leases-overview` - Leases admin view
52. `/_email-sms-unit` - Email/SMS testing
53. `/_guest-simulation` - Guest simulation (day 1)
54. `/_guest-relationships` - Guest CRM
55. `/_manage-virtual-meetings` - Meeting scheduler
56. `/_manage-informational-texts` - Content management
57. `/_quick-price` - Pricing calculator
58. `/_verify-users` - User verification tool
59. `/_co-host-requests` - Co-host management
60. `/_simulation-admin` - Simulation admin panel
61. `/_send-magic-login-links` - Magic link sender
62. `/_modify-listings` - Listing bulk editor
63. `/_message-curation` - Message moderation
64. `/_usability-data-management` - Usability data admin
65. `/_ai-tools` - AI tooling dashboard
66. `/_emergency` - Emergency management
67. `/_admin-threads` - Thread moderation
68. `/_manage-rental-applications/:id` - Application review
69. `/_create-document` - Document generator
70. `/_proposal-manage` - Proposal admin tool
71. `/_listings-overview` - Listings admin view
72. `/_experience-responses` - Survey responses admin
73. `/_internal/z-search-unit-test` - Search testing
74. `/_internal/z-emails-unit` - Email testing
75. `/_pricing-unit-test` - Pricing testing
76. `/_internal/z-schedule-test` - Schedule testing
77. `/_internal/z-sharath-test` - Dev testing page
78. `/_internal/z-unit-chatgpt-models` - AI model testing
79. `/_internal/z-unit-payment-records-js` - Payment testing
80. `/_manage-leases-payment-records/:leaseId` - Lease payment admin

---

## Protected Pages (21 Total)

Pages requiring user authentication (Supabase Auth session):

| Path | Dynamic | Purpose | Role Affinity |
|------|---------|---------|---------------|
| `/preview-split-lease/:id` | ✓ | Preview draft listing | Host |
| `/guest-proposals/:userId` | ✓ | Guest proposal dashboard | Guest |
| `/account-profile/:userId` | ✓ | User profile settings | Both |
| `/guest-leases/:userId` | ✓ | Guest active/past leases | Guest |
| `/host-proposals/:userId` | ✓ | Host proposal inbox | Host |
| `/host-leases` | ✗ | Host active/past leases | Host |
| `/self-listing` | ✗ | Create/edit listings | Host |
| `/listing-dashboard` | ✗ | Listing management hub | Host |
| `/host-overview` | ✗ | Host dashboard | Host |
| `/favorite-listings` | ✗ | Saved/favorited listings | Guest |
| `/favorite-listings-v2` | ✗ | Saved listings v2 (dev) | Guest |
| `/rental-application` | ✗ | Rental application form | Guest |
| `/messages` | ✗ | Real-time messaging | Both |
| `/house-manual` | ✗ | House manual editor | Host |
| `/simulation-guest-mobile` | ✗ | Guest simulation (day 2) | Demo |
| `/simulation-guestside-demo` | ✗ | Guest usability test | Demo |
| `/simulation-hostside-demo` | ✗ | Host usability test | Demo |
| `/simulation-host-mobile` | ✗ | Host simulation mobile | Demo |
| `/guest-experience-review` | ✗ | Guest feedback survey | Guest |
| `/host-experience-review` | ✗ | Host feedback survey | Host |
| `/reviews-overview` | ✗ | User reviews dashboard | Both |

**Note:** `protected: true` means Supabase Auth checks for valid session. Pages without explicit role checks may require additional role validation logic in page components.

---

## Public Pages (59 Total)

Pages accessible without authentication:

### Marketing & Info (15)
- `/` - Homepage
- `/why-split-lease` - Value proposition
- `/list-with-us` - Host onboarding (v1)
- `/list-with-us-v2` - Host onboarding (v2)
- `/about-us` - About page
- `/careers` - Careers page
- `/host-guarantee` - Host guarantee
- `/policies` - Terms and policies
- `/faq` - FAQ page
- `/referral` - Referral program
- `/guest-success` - Guest signup success
- `/host-success` - Host signup success
- `/help-center` - Help center home
- `/help-center/:category` - Help categories
- `/qr-code-landing` - QR code landing

### Search & Discovery (3)
- `/search` - Search listings
- `/quick-match` - Quick match tool
- `/view-split-lease/:id` - View listing details

### Auth & Onboarding (3)
- `/reset-password` - Password reset
- `/auth/verify` - Email verification
- `/signup-trial-host` - Trial host signup (devOnly, broken)

### Guest-Facing Tools (2)
- `/visit-manual` - Guest visit manual (public access)
- `/report-emergency` - Emergency submission form

### Development (3)
- `/index-dev` - Dev homepage (devOnly)
- `/referral-demo` - Referral demo (devOnly)
- `/self-listing-v2` - Self listing v2 (should be protected)

### Error Pages (1)
- `/404` - Not found

### Admin/Internal (32)
All `/_*` paths are technically public but access-controlled by path obscurity and internal policies. See [Admin/Internal Pages](#admininternal-pages-32-total) section.

---

## Admin/Internal Pages (32 Total)

Pages with `/_` prefix (path-based access control, no auth enforcement):

### Testing & Development (8)
- `/_internal-test` - Internal testing page
- `/_email-sms-unit` - Email/SMS testing
- `/_internal/z-search-unit-test` - Search unit tests
- `/_internal/z-emails-unit` - Email unit tests
- `/_pricing-unit-test` - Pricing unit tests
- `/_internal/z-schedule-test` - Schedule unit tests
- `/_internal/z-sharath-test` - Developer testing page
- `/_internal/z-unit-chatgpt-models` - AI model testing

### Operations & Management (13)
- `/_leases-overview` - Leases admin overview
- `/_manage-virtual-meetings` - Virtual meeting scheduler
- `/_manage-informational-texts` - Content management system
- `/_verify-users` - User verification workflow
- `/_co-host-requests` - Co-host request management
- `/_send-magic-login-links` - Magic link distribution
- `/_modify-listings` - Bulk listing editor
- `/_message-curation` - Message moderation panel
- `/_admin-threads` - Thread moderation
- `/_manage-rental-applications/:id` - Application review
- `/_proposal-manage` - Proposal admin tool
- `/_listings-overview` - Listings admin dashboard
- `/_experience-responses` - Survey response viewer

### Customer Relationship (2)
- `/_guest-relationships` - Guest CRM
- `/_quick-price` - Quick pricing calculator

### Tools & Utilities (5)
- `/_create-suggested-proposal` - Proposal creation tool
- `/_create-document` - Document generation
- `/_ai-tools` - AI tooling dashboard
- `/_emergency` - Emergency incident management
- `/_usability-data-management` - Usability data admin

### Financial (2)
- `/_internal/z-unit-payment-records-js` - Payment records testing
- `/_manage-leases-payment-records/:leaseId` - Lease payment admin

### Simulations & Demos (2)
- `/_guest-simulation` - Guest simulation (day 1, public)
- `/_simulation-admin` - Simulation admin panel

**Security Note:** All `/_*` pages have `protected: false` but are expected to be access-controlled through:
1. Path obscurity (not linked from public pages)
2. Internal network restrictions
3. Application-level role checks (not enforced at route level)

**Recommendation:** Consider adding `protected: true` and role-based checks to critical admin pages.

---

## Host-Only Pages (9 Total)

Protected pages designed for hosts (property owners/managers):

| Path | Protected | Purpose |
|------|-----------|---------|
| `/host-proposals/:userId` | ✓ | View incoming guest proposals |
| `/host-leases` | ✓ | Manage active/past leases |
| `/self-listing` | ✓ | Create and edit property listings |
| `/listing-dashboard` | ✓ | Listing management hub |
| `/host-overview` | ✓ | Host dashboard overview |
| `/house-manual` | ✓ | Create house manuals for guests |
| `/host-experience-review` | ✓ | Host feedback survey |
| `/simulation-hostside-demo` | ✓ | Host usability testing |
| `/simulation-host-mobile` | ✓ | Host mobile simulation |

**Note:** All 9 pages have `protected: true`. Public host-targeted pages (`/host-success`, `/self-listing-v2`) are categorized under Public Pages.

**Role Validation:**
Pages check auth but **may not enforce host role** at route level. Additional role checks likely exist in page components via `useAuth()` or similar hooks.

---

## Guest-Only Pages (8 Total)

Protected pages designed for guests (renters/tenants):

| Path | Protected | Purpose |
|------|-----------|---------|
| `/guest-proposals/:userId` | ✓ | View sent proposals and status |
| `/guest-leases/:userId` | ✓ | Manage active/upcoming stays |
| `/favorite-listings` | ✓ | Saved/favorited listings |
| `/favorite-listings-v2` | ✓ | Saved listings v2 (devOnly) |
| `/rental-application` | ✓ | Submit rental application |
| `/guest-experience-review` | ✓ | Guest feedback survey |
| `/simulation-guest-mobile` | ✓ | Guest mobile simulation (day 2) |
| `/simulation-guestside-demo` | ✓ | Guest usability testing |

**Note:** All 8 pages have `protected: true`. The public guest-targeted page (`/guest-success`) is categorized under Public Pages.

**Role Validation:**
Pages check auth but **may not enforce guest role** at route level. Additional role checks likely exist in page components.

---

## Dual-Role Pages (5 Total)

Pages accessible to both hosts and guests:

| Path | Protected | Purpose |
|------|-----------|---------|
| `/account-profile/:userId` | ✓ | User profile settings (universal) |
| `/messages` | ✓ | Real-time messaging (host ↔ guest) |
| `/reviews-overview` | ✓ | View given/received reviews |
| `/view-split-lease/:id` | ✗ | View listing details (public but used by both) |
| `/search` | ✗ | Search listings (public but used by both) |

**Universal Access:**
These pages serve both user types with conditional UI based on role:
- Hosts see host-specific features (e.g., listing management in profile)
- Guests see guest-specific features (e.g., saved listings, applications)

---

## Access Control Summary

### By Protection Status

| Category | Count | Protected | Public |
|----------|-------|-----------|--------|
| All Pages | 80 | 21 | 59 |
| Host Pages (protected only) | 9 | 9 | 0 |
| Guest Pages (protected only) | 8 | 8 | 0 |
| Admin/Internal | 32 | 0 | 32 |
| Dual-Role | 5 | 3 | 2 |

**Note:** Host/Guest page counts now only include protected pages. Public host-targeted pages (`/host-success`, `/self-listing-v2`) and guest-targeted pages (`/guest-success`) are counted under Public Pages.

### Security Gaps

1. **`/self-listing-v2`** - Currently public, should be `protected: true`
2. **Admin pages** - All 32 admin pages have `protected: false`, relying on path obscurity
3. **Role enforcement** - No route-level role checks; relies on component-level validation
4. **Dynamic routes** - Pages like `/guest-proposals/:userId` trust userId param without validation

### Recommendations

1. **Add `protected: true` to `/self-listing-v2`**
2. **Consider protecting critical admin pages** (e.g., `/_verify-users`, `/_modify-listings`)
3. **Implement route-level role checks** for host/guest-specific pages
4. **Validate userId params** in dynamic routes match authenticated user
5. **Add IP allowlisting** for `/_internal/*` and `/_admin*` paths

---

## Route Configuration Reference

All routes defined in: `app/src/routes.config.js`

### Key Properties
- `protected: true` - Requires Supabase Auth session
- `cloudflareInternal: true` - Uses `_internal/` directory to avoid 308 redirects
- `hasDynamicSegment: true` - Path contains `:param` segment
- `excludeFromFunctions: true` - Excluded from Cloudflare Functions (static only)
- `devOnly: true` - Only available in development mode

### Authentication Flow
1. Route accessed → Check `protected: true`
2. If protected → Check Supabase session via `app/src/lib/auth.js`
3. No session → Redirect to homepage with auth modal
4. Has session → Render page (component may do additional role checks)

---

**Last Updated:** 2026-01-29
**Source File:** `app/src/routes.config.js`
**Total Pages:** 80 (21 protected, 59 public)
**Host Pages:** 9 protected | **Guest Pages:** 8 protected
