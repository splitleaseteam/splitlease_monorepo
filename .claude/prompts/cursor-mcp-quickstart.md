# Quick Start: Cursor + Claude + Playwright MCP for Email Testing

## Overview

This guide helps you set up Cursor IDE with Claude AI and Playwright MCP to orchestrate automated email/messaging testing with Gmail verification.

---

## Prerequisites Checklist

- [ ] Cursor IDE installed (https://cursor.sh/)
- [ ] Claude AI access (Anthropic API key or Claude account)
- [ ] Node.js 18+ installed
<<<<<<< HEAD
- [ ] Gmail account for testing (splitleasefrederick@gmail.com)
=======
- [ ] Gmail account for testing (splitleasefrederick@gmail.com) - you'll log into it via Playwright
>>>>>>> 8ed2f505dc01a4f6f0cc3f7c64309ebda97c283e
- [ ] Split Lease codebase accessible

---

## Step 1: Install MCP Servers

```bash
# Install Playwright MCP Server
npm install -g @executeautomation/playwright-mcp-server

<<<<<<< HEAD
# Install Gmail MCP Server
npm install -g @modelcontextprotocol/server-gmail

=======
>>>>>>> 8ed2f505dc01a4f6f0cc3f7c64309ebda97c283e
# Install Supabase MCP Server (if not already)
npm install -g @supabase/mcp-server
```

<<<<<<< HEAD
---

## Step 2: Configure Gmail API Access

### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: `splitlease-testing`
3. Enable Gmail API:
   - Navigate to "APIs & Services" → "Library"
   - Search "Gmail API" and enable it

### 2.2 Create OAuth Credentials

1. Navigate to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Desktop app"
4. Name: `Split Lease Testing`
5. Download JSON credentials

### 2.3 Authorize Gmail MCP

```bash
# Set credentials path (Windows)
set GMAIL_CREDENTIALS_PATH=C:\path\to\credentials.json
set GMAIL_TOKEN_PATH=C:\path\\token.json

# Run Gmail MCP once to authorize
npx @modelcontextprotocol/server-gmail

# Follow the browser prompt to authorize access
```

---

## Step 3: Configure Cursor MCP
=======
**No Gmail API needed!** We'll open Gmail directly in the Playwright browser session.

---

## Step 2: Configure Cursor MCP
>>>>>>> 8ed2f505dc01a4f6f0cc3f7c64309ebda97c283e

Create/edit `.claude/mcp_config.json` in your project:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@executeautomation/playwright-mcp-server"],
      "disabled": false
    },
<<<<<<< HEAD
    "gmail": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-gmail"],
      "disabled": false,
      "env": {
        "GMAIL_CREDENTIALS_PATH": "C:\\Users\\Split Lease\\credentials\\gmail.json",
        "GMAIL_TOKEN_PATH": "C:\\Users\\Split Lease\\credentials\\gmail-token.json"
      }
    },
=======
>>>>>>> 8ed2f505dc01a4f6f0cc3f7c64309ebda97c283e
    "supabase": {
      "command": "npx",
      "args": ["@supabase/mcp-server", "--project-id", "splitlease-backend-dev"],
      "disabled": false
    }
  }
}
```

---

## Step 4: Cursor Configuration

### 4.1 Create `.cursorrules` in Project Root

```
# Email/Messaging Testing Rules

1. Always use Gmail aliases for test accounts (splitleasefrederick+xxx@gmail.com)
2. Wait at least 5 seconds between email-sending actions
3. Verify emails in Gmail before proceeding with next step
4. Clean up test data after each test
5. Document all findings in markdown test reports
6. Use Playwright MCP for browser automation
7. Use Gmail MCP for email verification
8. Use Supabase MCP for database verification
9. Always invoke MCP tools through mcp-tool-specialist subagent
```

### 4.2 Create `.claude/settings.json` (if not exists)

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@executeautomation/playwright-mcp-server"]
    },
<<<<<<< HEAD
    "gmail": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-gmail"],
      "env": {
        "GMAIL_CREDENTIALS_PATH": "C:\\Users\\Split Lease\\credentials\\gmail.json",
        "GMAIL_TOKEN_PATH": "C:\\Users\\Split Lease\\credentials\\gmail-token.json"
      }
    },
=======
>>>>>>> 8ed2f505dc01a4f6f0cc3f7c64309ebda97c283e
    "supabase": {
      "command": "npx",
      "args": ["@supabase/mcp-server", "--project-id", "splitlease-backend-dev"]
    }
  }
}
```

---

## Step 5: Start Development Server

```bash
cd "c:\Users\Split Lease\Google Drive\_Agent Context and Tools\SL16\Split Lease"
bun run dev
```

Server should start at `http://localhost:8000`

---

## Step 6: Open Cursor and Load Prompt

1. Open Cursor IDE
2. Open Split Lease project folder
3. Open a new chat (Cmd/Ctrl + L)
4. Paste the orchestration prompt from `.claude/prompts/email-messaging-test-orchestration.md`

---

## Step 7: Run First Test

In Cursor chat, type:

```
Run the magic link login test with these steps:

1. Use test email: splitleasefrederick+magic_test_${Date.now()}@gmail.com
2. Navigate to localhost:8000/login
3. Enter email and submit
4. Use Gmail MCP to verify email arrives
5. Extract magic link and navigate to it
6. Verify successful login
7. Check database for session creation

Use the mcp-tool-specialist subagent for all MCP operations.
```

---

## MCP Tools Reference

### Playwright MCP Tools

| Tool | Purpose | Usage |
|------|---------|-------|
| `mcp__playwright__browser_navigate` | Navigate to URL | `{ url: "http://localhost:8000" }` |
| `mcp__playwright__browser_click` | Click element | `{ ref: "element-ref", element: "button text" }` |
| `mcp__playwright__browser_type` | Type text | `{ ref: "input-ref", text: "hello" }` |
| `mcp__playwright__browser_snapshot` | Get page state | Returns accessibility tree |
| `mcp__playwright__browser_wait_for` | Wait for condition | `{ text: "Welcome" }` |
| `mcp__playwright__browser_take_screenshot` | Capture screenshot | `{ filename: "test.png" }` |
| `mcp__playwright__browser_run_code` | Run Playwright code | `{ code: "async (page) => { ... }" }` |
| `mcp__playwright__browser_close` | Close browser | `{}` |

<<<<<<< HEAD
### Gmail MCP Tools

| Tool | Purpose | Usage |
|------|---------|-------|
| `search` | Search emails | `{ query: "to:test@gmail.com subject:Login" }` |
| `get_message` | Get email details | `{ id: "message-id" }` |
| `list_messages` | List recent emails | `{ userId: "me", maxResults: 10 }` |
=======
### Checking Gmail via Playwright

Instead of Gmail API, use Playwright to check emails:

```javascript
// Navigate to Gmail
await browser.navigateTo('https://mail.google.com');

// Search for test alias emails
await browser.fillField('Search mail', `to:splitleasefrederick+test123@gmail.com`);
await browser.pressKey('Enter');

// Click the email and extract content
await browser.waitForElement('[role="main"] div[role="link"]');
await browser.clickSelector('[role="main"] div[role="link"]', 'first email');

// Extract magic link or verification code
const emailBody = await browser.getText('[role="main"]');
const magicLink = extractLink(emailBody);
```
>>>>>>> 8ed2f505dc01a4f6f0cc3f7c64309ebda97c283e

### Supabase MCP Tools

| Tool | Purpose | Usage |
|------|---------|-------|
| `execute` | Execute SQL | `{ sql: "SELECT * FROM users WHERE email = '...'" }` |
| `list_tables` | List all tables | `{}` |
| `describe_table` | Get table schema | `{ table: "users" }` |

---

## Test Account Pattern

All test emails use Gmail aliases:

```
Parent Account: splitleasefrederick@gmail.com
Test Aliases:
  - splitleasefrederick+magic1@gmail.com
  - splitleasefrederick+proposal2@gmail.com
  - splitleasefrederick+message3@gmail.com
```

All emails sent to aliases arrive in the parent inbox, searchable by the full alias.

---

## Example Test Flow

```
User: "Test magic link login"

Claude: "I'll orchestrate a magic link login test using MCP tools."

[Invokes mcp-tool-specialist subagent]
<<<<<<< HEAD
→ Playwright: Navigate to /login
→ Playwright: Fill email field with splitleasefrederick+test123@gmail.com
→ Playwright: Click submit button
→ Wait 10 seconds
→ Gmail: Search for emails to test123 address
→ Gmail: Get email body, extract magic link
=======
→ Playwright: Navigate to localhost:8000/login
→ Playwright: Fill email field with splitleasefrederick+test123@gmail.com
→ Playwright: Click submit button
→ Wait 10 seconds
→ Playwright: Open new tab → https://mail.google.com
→ Playwright: Search for "to:test123@gmail.com"
→ Playwright: Click email, extract magic link from body
>>>>>>> 8ed2f505dc01a4f6f0cc3f7c64309ebda97c283e
→ Playwright: Navigate to magic link
→ Verify: Check for user avatar element
→ Supabase: Query session table for user record
→ Report: Test passed with evidence
```

---

## Troubleshooting

### Gmail MCP Not Authorized

```bash
# Clear tokens and re-authorize
rm C:\Users\Split Lease\credentials\gmail-token.json
npx @modelcontextprotocol/server-gmail
```

### Playwright Browser Not Installed

```bash
npx playwright install chromium
```

### Cursor Doesn't Show MCP Tools

1. Check `.claude/mcp_config.json` syntax
2. Restart Cursor
3. Check Cursor settings for MCP enabled

### Emails Not Arriving

1. Check SendGrid API key in Supabase secrets
2. Check spam/junk folder
3. Wait up to 30 seconds (SendGrid delays)
4. Check notification_audit table in database

---

## Files Created

- `.claude/prompts/email-messaging-test-orchestration.md` - Main orchestration prompt
- `app/tests/email-messaging/helpers/email-verifier.js` - Email verification helper
- `app/tests/email-messaging/helpers/browser-helper.js` - Browser automation helper
- `.claude/prompts/cursor-mcp-quickstart.md` - This guide

---

## Next Steps

1. ✅ Complete setup steps above
2. ✅ Test MCP connections in Cursor
3. ✅ Run first magic link test
4. ✅ Implement remaining test scenarios from orchestration prompt

---

**Created**: 2026-01-29
**For**: Cursor + Claude + Playwright MCP + Gmail MCP
