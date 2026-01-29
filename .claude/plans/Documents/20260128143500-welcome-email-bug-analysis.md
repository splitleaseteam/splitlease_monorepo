# Welcome Email Bug Analysis & Resolution Report

**Date**: 2026-01-28
**Project**: Split Lease
**Edge Function**: `send-email`
**Template**: BASIC_EMAIL (`1560447575939x331870423481483500`)

---

## Executive Summary

During investigation of failed welcome emails after user signup, we discovered and fixed **4 distinct bugs** in the template processing pipeline. The root cause was a mismatch between Bubble-style template syntax (space-delimited placeholders, structural JSON fragments) and the code's assumptions about template structure.

---

## Bugs Found & Fixed

### Bug #1: Regex Doesn't Match Space-Delimited Placeholders

**Symptom**: Placeholders like `$$from email$$` left unreplaced
**Root Cause**: Original regex `/\$\$([a-zA-Z0-9_\-]+)\$\$/g` didn't include `\s` for spaces
**Fix**: Updated to `/\$\$([a-zA-Z0-9_\-\s]+)\$\$/g`
**File**: [templateProcessor.ts:61](supabase/functions/send-email/lib/templateProcessor.ts#L61)

```typescript
// BEFORE (broken)
const dollarRegex = /\$\$([a-zA-Z0-9_\-]+)\$\$/g;

// AFTER (fixed)
const dollarRegex = /\$\$([a-zA-Z0-9_\-\s]+)\$\$/g;
```

---

### Bug #2: Variable Name Mismatch (Underscore vs Space)

**Symptom**: Code passes `from_email`, template expects `$$from email$$`
**Root Cause**: No mapping between code conventions (underscore) and template conventions (space)
**Fix**: Added `VARIABLE_NAME_MAPPING` and `normalizeVariableNames()` function
**File**: [send.ts:26-138](supabase/functions/send-email/handlers/send.ts#L26-L138)

```typescript
const VARIABLE_NAME_MAPPING: Record<string, string> = {
  'from_email': 'from email',
  'from_name': 'from name',
  'to_email': 'to',
  'body_intro': 'body text',
  'button_text': 'buttontext',
  'button_url': 'buttonurl',
  // ... etc
};
```

---

### Bug #3: Trailing Commas in Template JSON

**Symptom**: `JSON.parse()` fails with syntax error
**Root Cause**: Bubble templates have structural placeholders (`$$cc$$`, `$$bcc$$`) that sit outside JSON string values. When replaced with empty string, they leave trailing commas like `,]`
**Fix**: Added `cleanupJsonSyntax()` function
**File**: [templateProcessor.ts:142-168](supabase/functions/send-email/lib/templateProcessor.ts#L142-L168)

```typescript
function cleanupJsonSyntax(json: string): string {
  let cleaned = json;
  // Remove trailing commas before ] or }
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  // Fix missing commas between properties
  cleaned = cleaned.replace(/(")\s*\n\s*(")/g, '$1,\n  $2');
  // ... etc
  return cleaned;
}
```

---

### Bug #4: Double-Escaping of Structural JSON Fragments

**Symptom**: `Expected double-quoted property name in JSON at position 129`
**Root Cause**: Structural fragments like `, "name": "Split Lease"` were passed through `escapeJsonString()`, which double-escaped the quotes producing `\", \"name\": \"Split Lease\"`
**Fix**: Detect structural fragments and insert them raw without escaping
**File**: [templateProcessor.ts:77-88](supabase/functions/send-email/lib/templateProcessor.ts#L77-L88)

```typescript
// For JSON templates: Don't escape structural JSON fragments
if (jsonSafe) {
  const isStructuralFragment =
    stringValue === '' ||
    stringValue.startsWith(',') ||
    stringValue.startsWith('{') ||
    stringValue.startsWith('[') ||
    stringValue.startsWith('<');  // HTML content like buttons

  if (isStructuralFragment) {
    return stringValue;
  }
}
```

---

## Potential Edge Cases & Remaining Risks

### 1. Button HTML Injection Risk (Low)

**Scenario**: If `button_text` or `button_url` contain malicious HTML
**Current State**: Button HTML is generated server-side with raw values
**Mitigation Needed**: Escape `button_text` and validate `button_url` is a valid URL

```typescript
// Current (potential XSS vector)
return `<a href="${buttonUrl}">${buttonText}</a>`;

// Recommended
return `<a href="${escapeHtml(buttonUrl)}">${escapeHtml(buttonText)}</a>`;
```

### 2. Structural Fragment Detection (Medium)

**Scenario**: A legitimate value starts with `,` or `{` but isn't meant to be structural
**Current State**: Any value starting with `,{[<` bypasses escaping
**Risk**: User-provided content starting with these characters could inject JSON
**Mitigation**: Only treat values from specific known structural keys (`from name`, `cc`, `bcc`, `button`) as structural

### 3. Template Schema Changes (Medium)

**Scenario**: Bubble template is edited with new placeholders
**Current State**: Code has hardcoded `VARIABLE_NAME_MAPPING`
**Risk**: New placeholders won't be mapped correctly
**Mitigation**:
- Document all expected placeholders in template
- Add validation that warns when template has unmapped placeholders
- Consider storing mapping in database alongside template

### 4. Empty Required Fields (Low)

**Scenario**: `to_email` or `subject` is empty/undefined
**Current State**: `validateRequiredFields()` throws, but late in the flow
**Risk**: Partial processing before error
**Mitigation**: Validate at function entry before any processing

### 5. SendGrid Quota/Rate Limits (Low)

**Scenario**: High signup volume hits SendGrid limits
**Current State**: Error returned but no retry mechanism
**Mitigation**:
- Add retry with exponential backoff for 429 errors
- Queue emails for async processing
- Monitor SendGrid quota alerts

### 6. Missing First Name (Handled)

**Scenario**: User signs up without providing first name
**Current State**: Fallback to `Hi there!` greeting
**Status**: ✅ Already handled in `emailUtils.ts`

---

## Full Welcome Email Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SIGNUP WELCOME EMAIL FLOW                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. User Signup (auth-user function)                                        │
│     └─→ Creates user in Supabase Auth                                       │
│     └─→ Triggers welcome email via emailUtils.sendWelcomeEmail()            │
│                                                                             │
│  2. emailUtils.sendWelcomeEmail()                                           │
│     └─→ Builds variables: body_intro (with greeting), button_text/url       │
│     └─→ Calls send-email function with BASIC_EMAIL template                 │
│                                                                             │
│  3. send-email function (handlers/send.ts)                                  │
│     └─→ Validates required fields (template_id, to_email, variables)        │
│     └─→ Fetches template from reference_table schema                        │
│     └─→ Normalizes variable names (underscore → space)                      │
│     └─→ Generates button HTML from button_text + button_url                 │
│     └─→ Sets defaults for optional placeholders (header, logo, cc, bcc)     │
│     └─→ Builds structural fragments ($$from name$$ → , "name": "...")       │
│                                                                             │
│  4. templateProcessor.processTemplateJson()                                 │
│     └─→ Replaces $$placeholder$$ with values                                │
│     └─→ Structural fragments inserted raw (no escaping)                     │
│     └─→ Content values escaped for JSON safety                              │
│     └─→ Cleanup pass fixes trailing commas, missing separators              │
│                                                                             │
│  5. sendgridClient.sendEmailRaw()                                           │
│     └─→ Parses processed JSON into SendGrid body                            │
│     └─→ Injects CC/BCC if provided                                          │
│     └─→ POSTs to SendGrid API                                               │
│     └─→ Returns message_id on success                                       │
│                                                                             │
│  6. Internal Notification (parallel)                                        │
│     └─→ emailUtils.sendInternalSignupNotification()                         │
│     └─→ BCCs to Slack channels + team emails                                │
│                                                                             │
│  7. Welcome SMS (Guest only, if phone provided)                             │
│     └─→ emailUtils.sendWelcomeSms()                                         │
│     └─→ Sends via send-sms function + Twilio                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Files Modified During Fix

| File | Changes |
|------|---------|
| [templateProcessor.ts](supabase/functions/send-email/lib/templateProcessor.ts) | Regex for spaces, structural fragment detection, JSON cleanup |
| [send.ts](supabase/functions/send-email/handlers/send.ts) | Variable name mapping, button HTML generation, defaults for optionals |
| [emailUtils.ts](supabase/functions/_shared/emailUtils.ts) | Greeting in body text, template variable alignment |

---

## Testing Recommendations

### Manual Test Cases

1. **Happy Path**: Signup with full details (email, first name, last name, phone)
2. **Minimal Data**: Signup with only email (no name)
3. **Host vs Guest**: Test both user types get appropriate email content
4. **Special Characters**: Name with apostrophe (`O'Brien`), quotes, emoji
5. **Long Values**: Very long first name, long email address
6. **International**: Non-ASCII characters in name

### Automated Test Cases (Recommended)

```typescript
// Test structural fragment detection
test('structural fragments are not escaped', () => {
  const result = processTemplateJson(
    '{"from": {"email": "test@test.com"$$from name$$}}',
    { 'from name': ', "name": "Test"' }
  );
  expect(result).toBe('{"from": {"email": "test@test.com", "name": "Test"}}');
});

// Test JSON cleanup
test('trailing commas are removed', () => {
  const result = cleanupJsonSyntax('{"to": ["a@b.com"],}');
  expect(result).toBe('{"to": ["a@b.com"]}');
});

// Test content escaping
test('content values are JSON-escaped', () => {
  const result = processTemplateJson(
    '{"text": "$$body$$"}',
    { body: 'Line1\nLine2 with "quotes"' }
  );
  expect(result).toBe('{"text": "Line1\\nLine2 with \\"quotes\\""}');
});
```

---

## Deployment Checklist

- [ ] Deploy `send-email` function: `supabase functions deploy send-email --project-ref qzsmhgyojmwvtjmnrdea`
- [ ] Test with curl directly against deployed function
- [ ] Test full signup flow (Guest)
- [ ] Test full signup flow (Host)
- [ ] Verify internal notification email received
- [ ] Check Slack channels for notification
- [ ] Monitor Supabase logs for errors

---

## Lessons Learned

1. **Template-Code Contract**: When templates use a different syntax than code (spaces vs underscores), explicit mapping is essential
2. **Structural vs Content**: JSON templates with structural placeholders need special handling - they're not just string replacement
3. **Error Logging**: Detailed error logging with position information was critical for diagnosing Bug #4
4. **Escape Carefully**: Escaping functions must be aware of context - structural JSON fragments should NOT be escaped
5. **Test the Real Thing**: MCP logs only show HTTP status; direct curl testing revealed actual error messages

---

## Related Documentation

- [Supabase Edge Functions Guide](../supabase/CLAUDE.md)
- [Email Template Database Schema](reference_table.zat_email_html_template_eg_sendbasicemailwf_)
- [SendGrid API Documentation](https://docs.sendgrid.com/api-reference/mail-send/mail-send)
