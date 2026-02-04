# E2E Test Flows for Split Lease

This document describes the E2E test scripts available for validating critical flows after database migrations or code changes.

## Quick Start

```bash
# Install dependencies (if not already done)
cd e2e && npm install

# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test auth.spec.ts
npx playwright test listing-creation.spec.ts
npx playwright test proposal-creation.spec.ts
npx playwright test virtual-meeting.spec.ts
npx playwright test messages.spec.ts

# Run with headed browser (see what's happening)
npx playwright test --headed

# Run with specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Generate HTML report
npx playwright test --reporter=html
npx playwright show-report
```

## Test Suites

### 1. Authentication Tests (`auth.spec.ts`)
**Purpose:** Validates signin, signup, logout, and session persistence.

| Test Category | What It Tests |
|---------------|---------------|
| Login Happy Paths | Guest/host login, session persistence across navigation/refresh |
| Login Error Handling | Invalid credentials, empty fields, network errors |
| Login Edge Cases | Special characters, long inputs, whitespace trimming |
| Logout | Successful logout, auth state clearing |
| Signup | Form navigation, password validation, existing email handling |
| Protected Routes | Redirect for unauthenticated users |
| Accessibility | Labels, keyboard navigation, screen reader support |
| Mobile | Full-screen modal, touch-friendly inputs |

**Run:** `npx playwright test auth.spec.ts`

---

### 2. Listing Creation Tests (`listing-creation.spec.ts`)
**Purpose:** Validates host listing creation and management.

| Test Category | What It Tests |
|---------------|---------------|
| Navigation & Access | Auth requirements, page accessibility |
| Basic Info Form | Title, description, bedroom/bathroom inputs |
| Location Form | Address, borough, neighborhood inputs |
| Schedule & Availability | Day selection buttons, toggling days |
| Pricing Form | Nightly rate, validation, cleaning fee |
| Photo Upload | Upload section, file type acceptance |
| Amenities Selection | Checkbox functionality, multi-select |
| Form Submission | Submit button, loading states |
| Listing Dashboard | Access, listing cards, create button |
| Edit Listing | Navigation from dashboard to edit |
| Accessibility | Form labels, keyboard navigation |
| Mobile | Responsive layout, touch-friendly inputs |

**Run:** `npx playwright test listing-creation.spec.ts`

---

### 3. Proposal Creation Tests (`proposal-creation.spec.ts`)
**Purpose:** Validates guest proposal submission and host proposal management.

| Test Category | What It Tests |
|---------------|---------------|
| Guest Proposal Creation | Booking widget, schedule selector, day selection |
| Price Updates | Price changes when schedule changes |
| Proposal Modal | Modal opening, price breakdown, about me field |
| Guest Proposals Page | Access, proposal cards, status badges |
| Proposal Validation | Contiguous days, minimum stay requirements |
| Host Proposal Management | Access, listing selector, proposal sections |
| Accessibility | Day button labels, keyboard navigation |
| Mobile | Booking CTA, touch-friendly day buttons |

**Run:** `npx playwright test proposal-creation.spec.ts`

---

### 4. Virtual Meeting Tests (`virtual-meeting.spec.ts`)
**Purpose:** Validates virtual meeting scheduling and management.

| Test Category | What It Tests |
|---------------|---------------|
| Host Meeting Creation | Schedule button, meeting modal, date/time picker |
| Admin Meeting Management | Pending requests, confirmed meetings, time blocking |
| Meeting Calendar View | Calendar display, time slot availability |
| Guest Meeting View | Meeting invitations, accept/decline buttons |
| Meeting Notifications | Toast notifications |
| Accessibility | Date picker labels, keyboard navigation, focus trap |
| Mobile | Modal display, touch-friendly time slots |

**Run:** `npx playwright test virtual-meeting.spec.ts`

---

### 5. Messages Tests (`messages.spec.ts`)
**Purpose:** Validates messaging and thread functionality.

| Test Category | What It Tests |
|---------------|---------------|
| Thread Creation | Contact from listing, message input, send button |
| Messages Page | Access, thread list, thread preview |
| Message Thread View | Message history, timestamps, reply input |
| Host Messaging | Message guest from proposals |
| Admin Thread Management | Thread list, delete/reminder options |
| Guest Inquiry | Unauthenticated user flow |
| Message Notifications | Unread indicators |
| Accessibility | Input labels, keyboard navigation |
| Mobile | Thread list, back button, touch-friendly input |

**Run:** `npx playwright test messages.spec.ts`

---

## Test Users

The tests use pre-configured test users with storage states:

| User Type | Fixture | Email |
|-----------|---------|-------|
| Guest (Big Spender) | `guestBigSpenderPage` | e2e-guest-bigspender@test.splitlease.com |
| Guest (High Flex) | `guestHighFlexPage` | e2e-guest-highflex@test.splitlease.com |
| Guest (Average) | `guestAveragePage` | e2e-guest-average@test.splitlease.com |
| Host | `hostPage` | e2e-host@test.splitlease.com |
| Admin | `adminPage` | e2e-admin@test.splitlease.com |
| Anonymous | `anonymousPage` | (no auth) |

**Password:** `TestPassword123!`

---

## Running Tests in Agent Sessions

### Option 1: Run All Critical Flow Tests
```bash
npx playwright test auth.spec.ts listing-creation.spec.ts proposal-creation.spec.ts virtual-meeting.spec.ts messages.spec.ts
```

### Option 2: Run by Category
```bash
# Authentication only
npx playwright test auth.spec.ts

# All booking-related
npx playwright test booking.spec.ts proposal-creation.spec.ts

# All host functionality
npx playwright test listing-creation.spec.ts virtual-meeting.spec.ts

# All messaging
npx playwright test messages.spec.ts
```

### Option 3: Run Specific Test
```bash
# Run single test by name
npx playwright test -g "should login as guest user successfully"

# Run tests matching pattern
npx playwright test -g "Proposal"
```

---

## Post-Migration Validation Checklist

After database migrations, run these tests in order:

1. **Authentication** - Verify users can sign in/sign up
   ```bash
   npx playwright test auth.spec.ts
   ```

2. **Listing Creation** - Verify hosts can create/edit listings
   ```bash
   npx playwright test listing-creation.spec.ts
   ```

3. **Proposal Creation** - Verify guests can submit proposals
   ```bash
   npx playwright test proposal-creation.spec.ts booking.spec.ts
   ```

4. **Virtual Meetings** - Verify meeting scheduling works
   ```bash
   npx playwright test virtual-meeting.spec.ts
   ```

5. **Messages** - Verify messaging functionality
   ```bash
   npx playwright test messages.spec.ts
   ```

---

## Troubleshooting

### Tests Failing to Start
```bash
# Ensure browsers are installed
npx playwright install

# Check Playwright version
npx playwright --version
```

### Auth Tests Failing
- Ensure storage states exist in `e2e/.auth/`
- Run global setup: `npx playwright test --global-setup=global-setup.ts`

### Timeout Issues
```bash
# Increase timeout for slow connections
npx playwright test --timeout=60000
```

### Debug Mode
```bash
# Run with debug mode
npx playwright test --debug

# Run with trace
npx playwright test --trace on
```

---

## CI Integration

Add to `.github/workflows/e2e.yml`:

```yaml
- name: Run E2E Tests
  run: npx playwright test

- name: Upload Test Results
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

---

## Test File Locations

```
e2e/
├── tests/
│   ├── auth.spec.ts              # Authentication flows
│   ├── booking.spec.ts           # Booking widget & basic proposals
│   ├── listing-creation.spec.ts  # Host listing creation
│   ├── proposal-creation.spec.ts # Guest proposal submission
│   ├── virtual-meeting.spec.ts   # Meeting scheduling
│   ├── messages.spec.ts          # Messaging & threads
│   ├── search.spec.ts            # Search functionality
│   ├── profile.spec.ts           # User profile
│   ├── admin.spec.ts             # Admin features
│   └── accessibility.spec.ts     # A11y compliance
├── fixtures/
│   ├── auth.ts                   # Auth fixtures (storage states)
│   ├── test-data-factory.ts      # Test data generators
│   └── test-users.ts             # User creation utilities
├── pages/
│   ├── base.page.ts              # Base page object
│   ├── home.page.ts
│   ├── search.page.ts
│   ├── listing-detail.page.ts
│   ├── guest-proposals.page.ts
│   ├── host-proposals.page.ts
│   └── admin-threads.page.ts
└── playwright.config.ts          # Playwright configuration
```
