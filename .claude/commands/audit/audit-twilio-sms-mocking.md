---
name: audit-twilio-sms-mocking
description: Audit the codebase to find SMS notification features (Twilio) that lack proper test mocking. Identifies OPPORTUNITIES for improvement in .claude/plans/Opportunities/ and notifies via Slack webhook.
---

# Twilio SMS Mocking Audit

You are conducting a comprehensive audit to identify SMS notification features that do not have proper mock coverage for testing.

## Step 1: Prime the Codebase Context

First, run the `/prime` slash command to get a comprehensive understanding of the codebase structure.

## Step 2: Systematic File Review

After receiving the /prime output, systematically review ALL files to identify:

### Target Files to Find

1. **Twilio client usage** - Look for:
   - `import twilio from 'twilio'`
   - `client.messages.create()`
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` env vars

2. **SMS sending functions** - Look for:
   - `sendSMS`, `sendMessage` functions
   - Booking confirmation SMS
   - Reminder notifications
   - Two-factor authentication SMS

3. **Notification services** - Look for:
   - `notificationService.ts`
   - `smsService.ts`
   - Message templates

4. **Mock infrastructure** - Check for:
   - `twilioHandlers.ts` MSW handlers
   - `__mocks__/twilio.ts` module mock
   - `sentMessages` capture array

### What to Check for Each Target

For each SMS-related file, check if:
- MSW handlers mock Twilio API
- Module mock exists for unit tests
- `sentMessages` array captures sent messages
- Tests verify message content
- Error cases are tested (invalid numbers)

## Step 3: Create the Audit Document

Create an md file at `.claude/plans/Opportunities/YYMMDD/YYYYMMDDHHMMSS-audit-twilio-sms-mocking.md` (where YYMMDD is today's date folder) with the following structure:

```markdown
# Twilio SMS Mocking Opportunity Report
**Generated:** <timestamp>
**Codebase:** <project name>

## Executive Summary
- SMS sending functions found: X
- Functions needing mock coverage: X
- MSW handlers exist: Yes/No
- Module mocks exist: Yes/No

## Infrastructure Check

### SMS Mock Setup Status
- [ ] `twilioHandlers.ts` MSW handlers exist
- [ ] `__mocks__/twilio.ts` module mock exists
- [ ] `sentMessages` capture array exists
- [ ] `clearSentMessages()` helper exists
- [ ] Error response mocks configured

## Critical Gaps (No Mocking)

### 1. Booking Confirmation SMS
- **File:** `path/to/notificationService.ts`
- **Function:** `sendBookingConfirmation()`
- **Twilio Usage:** `client.messages.create()` at line X
- **Missing Mock Coverage:**
  - [ ] MSW handler for send SMS
  - [ ] Message content assertion
  - [ ] Buyer notification test
  - [ ] Seller notification test
  - [ ] Invalid phone handling

### 2. Reminder Notifications
- **File:** `path/to/reminderService.ts`
- **Function:** `sendReminder()`
- **Missing Mock Coverage:**
  - [ ] Check-in reminder test
  - [ ] Check-out reminder test
  - [ ] Message content test

### 3. Two-Factor Authentication
- **File:** `path/to/authService.ts`
- **Function:** `sendOTP()`
- **Missing Mock Coverage:**
  - [ ] OTP code generation test
  - [ ] Message delivery test
  - [ ] Rate limiting test

## Message Template Gaps

### Templates Without Tests
| Template | File | Content Tested |
|----------|------|----------------|
| bookingConfirmation | templates/sms.ts | No |
| reminder | templates/sms.ts | No |
| otp | templates/sms.ts | No |

### Missing Template Tests
- [ ] Character limit validation (160 chars)
- [ ] Long title truncation
- [ ] Date formatting
- [ ] Price formatting

## Service Tests with Good Coverage (Reference)

List any SMS services that already have proper mock coverage.

## Recommended MSW Handler

```typescript
// src/mocks/twilioHandlers.ts
export const sentMessages: Array<{ to: string; body: string }> = []

export function clearSentMessages() {
  sentMessages.length = 0
}

export const twilioHandlers = [
  http.post(
    'https://api.twilio.com/2010-04-01/Accounts/:accountSid/Messages.json',
    async ({ request }) => {
      const formData = await request.formData()
      const to = formData.get('To') as string
      const body = formData.get('Body') as string

      if (to === '+15551234567') {
        return HttpResponse.json({ code: 21211, message: 'Invalid number' }, { status: 400 })
      }

      sentMessages.push({ to, body })

      return HttpResponse.json({
        sid: `SM${Date.now()}`,
        to,
        body,
        status: 'queued',
      })
    }
  ),
]
```

## Recommended Module Mock

```typescript
// src/lib/__mocks__/twilio.ts
export const sentMessages: Array<{ to: string; body: string }> = []

export const mockTwilioClient = {
  messages: {
    create: vi.fn(async ({ to, body }) => {
      sentMessages.push({ to, body })
      return { sid: `SM${Date.now()}`, to, body, status: 'queued' }
    }),
  },
}

export function clearSentMessages() {
  sentMessages.length = 0
}

export default function twilio() {
  return mockTwilioClient
}
```

```

---

## Reference: Twilio SMS Mocking Patterns

### Mocking Approaches

| Approach | Speed | Use Case |
|----------|-------|----------|
| MSW Handlers | Fast | Full API simulation |
| Module Mock | Fast | Simpler tests |
| Twilio Test Creds | Slow | Real API integration |

### Pattern 1: Test SMS Sent

```typescript
it('sends booking confirmation SMS', async () => {
  clearSentMessages()

  await notificationService.sendBookingConfirmation({
    buyerPhone: '+14155551234',
    listingTitle: 'Downtown Studio',
    checkIn: '2025-03-01',
  })

  expect(sentMessages).toHaveLength(1)
  expect(sentMessages[0].to).toBe('+14155551234')
  expect(sentMessages[0].body).toContain('Downtown Studio')
})
```

### Pattern 2: Test Invalid Phone

```typescript
it('handles invalid phone number', async () => {
  await expect(
    notificationService.sendBookingConfirmation({
      buyerPhone: '+15551234567', // Invalid in mock
      listingTitle: 'Test',
    })
  ).rejects.toThrow(/invalid phone number/i)
})
```

### Pattern 3: Test No SMS on Failure

```typescript
it('does not send SMS on payment failure', async () => {
  clearSentMessages()

  server.use(
    http.post('*/payment_intents/:id/confirm', () => {
      return HttpResponse.json({ status: 'requires_payment_method' }, { status: 400 })
    })
  )

  await expect(bookingService.createBooking({ ... })).rejects.toThrow()

  expect(sentMessages).toHaveLength(0)
})
```

### Anti-Patterns to Flag

| Flag This | Recommend Instead |
|-----------|-------------------|
| Real SMS in tests | Mock Twilio API |
| Not testing content | Assert message body |
| Ignoring error cases | Test invalid numbers |
| No message capture | Store for assertions |

## Output Requirements

1. Be thorough - review EVERY SMS-related file
2. Be specific - include exact file paths and function names
3. Be actionable - provide mock templates
4. Only report gaps - do not list mocked functions unless as reference
5. Create the output file in `.claude/plans/Opportunities/YYMMDD/` with timestamp format: `YYYYMMDDHHMMSS-audit-twilio-sms-mocking.md`

## Post-Audit Actions

After creating the audit document:

1. Commit and push the audit report to the repository
2. Send a webhook POST request to the URL in `TINYTASKAGENT` environment variable (found in root .env) with message: hostname and that the audit process completed
