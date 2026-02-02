# Email/Messaging Test Orchestration Prompt for Cursor

> **Purpose**: This prompt is designed for Cursor IDE with Claude AI and Playwright MCP to orchestrate automated email/messaging testing with Gmail verification.

---

## Setup Requirements

### 1. MCP Servers Configuration

Create/update `.claude/mcp_config.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@executeautomation/playwright-mcp-server"],
      "disabled": false
    },
    "gmail": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-gmail"],
      "disabled": false,
      "env": {
        "GMAIL_CREDENTIALS_PATH": "/path/to/credentials.json",
        "GMAIL_TOKEN_PATH": "/path/to/token.json"
      }
    },
    "supabase": {
      "command": "npx",
      "args": ["@supabase/mcp-server", "--project-id", "splitlease-backend-dev"],
      "disabled": false
    }
  }
}
```

### 2. Gmail API Setup

**Required Steps:**
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Enable Gmail API
4. Download credentials.json
5. Install MCP server: `npm install -g @modelcontextprotocol/server-gmail`
6. Run once to authorize: `npx @modelcontextprotocol/server-gmail`

### 3. Test Email Infrastructure

**Domain**: `splitleasefrederick@gmail.com` (parent account)

**Test Account Pattern**: `splitleasefrederick+{testcase}@gmail.com`

**Gmail Aliasing**: Gmail automatically delivers all `+` aliases to the parent inbox, with the ability to filter by the alias.

---

## Primary Orchestration Prompt

Copy this into Cursor when starting the testing session:

---

```
You are an autonomous testing orchestrator for the Split Lease email/messaging system. Your goal is to create, execute, and verify end-to-end tests for email and messaging functionality.

## Your Capabilities

You have access to:
<<<<<<< HEAD
1. **Playwright MCP** - Browser automation for navigating the app
2. **Gmail MCP** - Access to splitleasefrederick@gmail.com for email verification
3. **Supabase MCP** - Direct database access for data verification
4. **File System** - Read/write test files and configuration
=======
1. **Playwright MCP** - Browser automation for navigating the app AND checking Gmail directly
2. **Supabase MCP** - Direct database access for data verification
3. **File System** - Read/write test files and configuration
>>>>>>> 8ed2f505dc01a4f6f0cc3f7c64309ebda97c283e

## Test Account Pattern

Use Gmail aliases for test accounts:
- Parent: `splitleasefrederick@gmail.com` (you have read access)
- Test accounts: `splitleasefrederick+test1@gmail.com`, `splitleasefrederick+proposal@gmail.com`, etc.

All emails sent to aliases will arrive in the parent inbox.

## System Under Test

Based on the codebase analysis:

### Email System
- **Edge Function**: `supabase/functions/send-email/index.ts`
- **Templates**: Stored in `reference_table.zat_email_html_template_eg_sendbasicemailwf_`
- **Provider**: SendGrid
- **Key Templates**:
  - Magic Login Link: `1757433099447x202755280527849400`
  - Guest Proposal Submitted: `1757429600000x000000000000000001`
  - Host Proposal (Nightly): `1757429600000x000000000000000002`
  - Welcome Email: `1560447575939x331870423481483500`

### Messaging System
- **Edge Function**: `supabase/functions/messages/index.ts`
- **Tables**: `thread`, `_message`, `thread_participant`
- **Realtime**: Supabase Realtime channels
- **Frontend**: `app/src/islands/pages/MessagingPage/`

### Notification System
- **Preferences Table**: `notification_preferences`
- **Audit Table**: `notification_audit`
- **Helper**: `supabase/functions/_shared/notificationSender.ts`

## Test Execution Strategy

For each test scenario:

### Phase 1: Test Account Preparation
1. Generate unique Gmail alias: `splitleasefrederick+{timestamp}_{scenario}@gmail.com`
2. Note the email for later verification
3. Use Supabase MCP to check if user exists, create if needed

### Phase 2: Browser Automation (Playwright)
1. Navigate to localhost:8000 or preview URL
2. Perform the action that triggers email/messaging
3. Capture any confirmation messages, IDs, or references

<<<<<<< HEAD
### Phase 3: Email Verification (Gmail MCP)
1. Query Gmail for emails sent to the test alias
2. Filter by subject, sender, or time range
3. Extract email content, links, and verification codes
4. Verify email contents match expected template
=======
### Phase 3: Email Verification (Playwright → Gmail)
1. Open new browser tab to https://mail.google.com
2. Search for emails to the test alias (e.g., `to:test123@gmail.com`)
3. Click the email and extract content from body
4. Extract magic links, verification codes, proposal IDs
5. Verify email contents match expected template
>>>>>>> 8ed2f505dc01a4f6f0cc3f7c64309ebda97c283e

### Phase 4: Database Verification (Supabase MCP)
1. Query relevant tables for expected records
2. Verify notification_audit entries
3. Check message/thread tables for messaging tests

### Phase 5: Test Result Documentation
1. Create test file in appropriate directory
2. Document findings with evidence
3. Mark as pass/fail with reasoning

## Test Scenarios to Implement

Priority 1 - Critical Email Flows:
1. **Magic Link Login** - Send magic link, verify email arrives, click link, verify login
2. **Guest Proposal Email** - Submit proposal as guest, verify host receives email
3. **Welcome Email** - New signup, verify welcome email with verification link
4. **Message Notification** - Send message, verify email notification (if enabled)

Priority 2 - Messaging:
5. **Real-time Message Delivery** - Two browser sessions, send message, verify realtime
6. **Thread Creation** - Verify thread created between users
7. **Message Persistence** - Send message, refresh page, verify message persists
8. **Unread Tracking** - Send message, verify unread count for recipient

Priority 3 - Notification Preferences:
9. **Email Preference Check** - Disable email preference, verify no email sent
10. **SMS Preference Check** - Disable SMS preference, verify no SMS sent
11. **Audit Logging** - Verify all notification decisions logged to audit table

Priority 4 - Edge Cases:
12. **Template Variable Substitution** - Verify all $$placeholders$$ replaced
13. **BCC Recipients** - Verify internal BCC recipients receive copies
14. **Failed Send Handling** - Verify graceful handling of SendGrid failures

## Test File Structure

Create tests in `app/tests/email-messaging/`:

```
app/tests/email-messaging/
├── fixtures/
│   ├── test-accounts.json
│   └── test-data.json
├── helpers/
│   ├── email-verifier.js
│   ├── browser-helper.js
│   └── db-verifier.js
├── email/
│   ├── magic-link.test.js
│   ├── guest-proposal.test.js
│   └── welcome-email.test.js
├── messaging/
│   ├── real-time-delivery.test.js
│   ├── thread-creation.test.js
│   └── unread-tracking.test.js
└── notifications/
    ├── preferences.test.js
    └── audit-logging.test.js
```

## Example Test Execution

For each test, follow this pattern:

```javascript
// Example: Magic Link Login Test

// 1. Prepare test account
const testEmail = `splitleasefrederick+magic_${Date.now()}@gmail.com`;

// 2. Browser: Navigate to login, enter email, submit
await browser.navigate('http://localhost:8000/login');
await browser.fill('[name="email"]', testEmail);
await browser.click('[type="submit"]');

<<<<<<< HEAD
// 3. Gmail: Wait for and verify email
const email = await gmail.waitForEmail({
  to: testEmail,
  subject: 'Login to Split Lease',
  timeout: 30000
});

assert(email.subject.includes('Login'));
assert(email.body.includes('magic link'));

// 4. Browser: Extract link, click, verify login
const magicLink = extractLink(email.body);
await browser.navigate(magicLink);
assert(await browser.isVisible('[data-testid="user-avatar"]'));

// 5. Database: Verify session created
=======
// 3. Browser: Open Gmail, find email
await browser.openNewTab();
await browser.navigate('https://mail.google.com');
await browser.fill('[aria-label="Search mail"]', `to:${testEmail}`);
await browser.pressKey('Enter');

// 4. Browser: Click email, extract link
await browser.clickSelector('[role="link"]', 'first email');
const emailBody = await browser.getText('[role="main"]');
assert(emailBody.includes('magic link'));

// 5. Browser: Extract link, click, verify login
const magicLink = extractLink(emailBody);
await browser.closeTab(); // Close Gmail tab
await browser.navigate(magicLink);
assert(await browser.isVisible('[data-testid="user-avatar"]'));

// 6. Database: Verify session created
>>>>>>> 8ed2f505dc01a4f6f0cc3f7c64309ebda97c283e
const session = await supabase.query('session', {
  filter: `user_id.eq.${userId}`
});
assert(session.length > 0);
```

## MCP Tool Usage

### Playwright MCP
- `mcp__playwright__browser_navigate` - Navigate to URL
- `mcp__playwright__browser_click` - Click element
- `mcp__playwright__browser_type` - Type text
- `mcp__playwright__browser_snapshot` - Get page state
- `mcp__playwright__browser_wait_for` - Wait for conditions
<<<<<<< HEAD

### Gmail MCP
- `mcp__gmail__search` - Search for emails
- `mcp__gmail__get_message` - Get email content
- `mcp__gmail__wait_for_message` - Wait for new email (custom implementation)
=======
- `mcp__playwright__browser_tabs` - Manage tabs (open new, close, switch)
- `mcp__playwright__browser_run_code` - Run custom Playwright code

### Checking Gmail via Playwright
```javascript
// Open Gmail in new tab
await browser.navigate('https://mail.google.com');

// Search for test alias
await browser.fill('[aria-label="Search mail"]', 'to:test@gmail.com');
await browser.pressKey('Enter');

// Click email
await browser.clickSelector('[role="link"]', 'email subject');

// Extract email body
const body = await browser.getText('[role="main"]');
```
>>>>>>> 8ed2f505dc01a4f6f0cc3f7c64309ebda97c283e

### Supabase MCP
- `mcp__supabase__execute` - Execute SQL query
- `mcp__supabase__list_tables` - List tables
- `mcp__supabase__describe_table` - Get table schema

## Important Constraints

1. **Always use Gmail aliases** - Never create real Gmail accounts
2. **Wait for email delivery** - SendGrid may take 5-30 seconds
3. **Clean up test data** - Delete test users/threads after tests
4. **Run in sequence** - Some tests depend on others (signup → login → message)
5. **Rate limiting** - SendGrid has rate limits, add delays between tests
6. **Database state** - Each test should restore database to clean state

## Report Format

For each test, output:

```markdown
## Test: [Test Name]

**Status**: ✅ PASS / ❌ FAIL

**Test Account**: `splitleasefrederick+xxx@gmail.com`

**Steps**:
1. [Action taken]
2. [Verification made]
3. [Result]

**Evidence**:
- Email Subject: [subject]
- Email Body: [key content]
- Database Records: [query results]

**Issues**: [Any problems found]
```

## Begin Execution

Start with Priority 1 tests. After each test, document results and proceed to the next test scenario.
```

---

## Helper Scripts

### Email Verification Helper

Create `app/tests/email-messaging/helpers/email-verifier.js`:

```javascript
class EmailVerifier {
  constructor(gmailMcp) {
    this.gmail = gmailMcp;
  }

  async waitForEmail({ to, subject, timeout = 30000 }) {
    const startTime = Date.now();
    const query = `to:${to} subject:${subject}`;

    while (Date.now() - startTime < timeout) {
      const emails = await this.gmail.search({ query });
      if (emails.length > 0) {
        return this.gmail.get_message({ id: emails[0].id });
      }
      await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error(`Email not received within ${timeout}ms`);
  }

  extractMagicLink(emailBody) {
    const match = emailBody.match(/https?:\/\/[^\s<>"]+magic[^\s<>"]+/);
    return match ? match[0] : null;
  }

  extractVerificationCode(emailBody) {
    const match = emailBody.match(/\b\d{6}\b/);
    return match ? match[0] : null;
  }
}

module.exports = EmailVerifier;
```

---

## Cursor Configuration

### .cursorrules

```
# Email/Messaging Testing Rules

1. Always use Gmail aliases for test accounts
2. Wait at least 5 seconds between email-sending actions
3. Verify emails in Gmail before proceeding
4. Clean up test data after each test
5. Document all findings in markdown test reports
6. Use Playwright for browser automation
7. Use Gmail MCP for email verification
8. Use Supabase MCP for database verification
```

---

## Quick Start Commands

```bash
# Start dev server
bun run dev

# In Cursor, run this prompt:
# "Execute the email/messaging test orchestration using Playwright and Gmail MCP"

# For specific test:
# "Run magic link login test with Gmail verification"
```

---

**Generated**: 2026-01-29
**Purpose**: Cursor + Claude + Playwright MCP orchestration for email/messaging testing
**Test Accounts**: Gmail aliases via splitleasefrederick@gmail.com
