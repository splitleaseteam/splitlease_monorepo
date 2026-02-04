# New User Issues

## Overview

This runbook covers troubleshooting and resolving issues that new users may encounter during signup, email verification, and identity verification processes.

## Prerequisites

- Access to Supabase Dashboard (Auth section)
- Access to database (read)
- Access to Edge Function logs
- Understanding of the signup flow

## Signup Flow Overview

```
1. User fills signup form
   ↓
2. auth-user/signup creates Supabase Auth user
   ↓
3. Database trigger creates user record + host_account + guest_account
   ↓
4. sync_queue entry created for Bubble sync
   ↓
5. Email verification sent (if enabled)
   ↓
6. User verifies email
   ↓
7. User can log in and use platform
```

## Common Issues

### Issue: Signup Form Not Submitting

**Symptoms:**
- Button doesn't respond
- Form shows validation errors
- Network error message

**Diagnosis:**
1. Check browser console for JavaScript errors
2. Check Network tab for failed requests
3. Test auth-user function directly

**Resolution:**
1. If validation error: Check user is filling all required fields correctly
2. If network error: Check auth-user function is deployed and healthy
3. If function error: Check logs for specific error

---

### Issue: "Email Already Registered"

**Symptoms:**
- User gets error that email is already in use
- User swears they never signed up

**Diagnosis:**
```sql
-- Check if email exists in auth.users
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'user@example.com';

-- Check if user record exists
SELECT _id, email, created_at
FROM "user"
WHERE email = 'user@example.com';
```

**Resolution:**
1. If user exists with unverified email:
   - Send new verification email
   - Or manually verify if confirmed via other means

2. If user has forgotten they signed up:
   - Direct them to password reset flow

3. If duplicate due to system error:
   - Check for partially created records
   - May need to clean up manually

---

### Issue: Email Verification Not Arriving

**Symptoms:**
- User doesn't receive verification email
- Email goes to spam

**Diagnosis:**
1. Check Supabase Auth logs for email send
2. Verify email address is correct
3. Check email provider (SendGrid) delivery status

**Resolution:**
1. Check spam/junk folder first

2. Resend verification:
   - User can request new verification from login page
   - Or admin can trigger via API

3. If email provider issue:
   - Check SendGrid dashboard
   - Verify API key is valid
   - Check for rate limits

4. Manual verification (last resort):
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com';
```

---

### Issue: Verification Link Expired

**Symptoms:**
- User clicks link, gets "expired" error
- Link was sent days ago

**Diagnosis:**
- Verification links expire after configured time (default: 1 hour)

**Resolution:**
1. User can request new verification email from login page

2. Admin can resend via Supabase Dashboard:
   - Go to Authentication > Users
   - Find user
   - Click "Send verification email"

---

### Issue: User Created but Not in Database

**Symptoms:**
- Supabase Auth shows user
- `user` table doesn't have record

**Diagnosis:**
```sql
-- Check if auth user exists
SELECT id, email FROM auth.users WHERE email = 'user@example.com';

-- Check if user record exists
SELECT * FROM "user" WHERE email = 'user@example.com';

-- Check if in sync queue
SELECT * FROM sync_queue WHERE table_name = 'user' AND record_id LIKE '%example%';
```

**Resolution:**
1. Check if database trigger failed:
   - Review database logs for trigger errors

2. Manually create user record if trigger failed:
   - This requires matching the auth user ID

3. Check sync queue for failed items:
   - May need to retry sync manually

---

### Issue: Identity Verification Failing

**Symptoms:**
- User uploads ID, verification fails
- "Unable to verify" error

**Diagnosis:**
1. Check identity-verification function logs
2. Verify file upload succeeded
3. Check third-party verification service status

**Resolution:**
1. Image quality issues:
   - Ask user to re-upload clearer image
   - Check file size limits

2. Service issues:
   - Check external verification service status
   - May need to manually verify

3. Document format issues:
   - Ensure document type is supported
   - Check for expired documents

---

### Issue: User Stuck in Onboarding

**Symptoms:**
- User can log in but can't proceed
- Missing profile information
- Account not fully set up

**Diagnosis:**
```sql
-- Check user record completeness
SELECT
    _id,
    email,
    first_name,
    last_name,
    phone_number,
    onboarding_completed
FROM "user"
WHERE email = 'user@example.com';

-- Check associated accounts
SELECT * FROM host_account WHERE user_id = '<user_id>';
SELECT * FROM guest_account WHERE user_id = '<user_id>';
```

**Resolution:**
1. If missing host/guest account:
   - May need to manually create
   - Check database trigger

2. If onboarding flag stuck:
```sql
UPDATE "user"
SET onboarding_completed = true
WHERE _id = '<user_id>';
```

3. If profile incomplete:
   - Guide user to complete profile
   - Or manually update required fields

---

### Issue: OAuth Signup Failing

**Symptoms:**
- Google/Apple sign-in not working
- Redirect error after OAuth

**Diagnosis:**
1. Check auth-user function logs for OAuth errors
2. Verify OAuth configuration in Supabase Dashboard
3. Check redirect URLs are correct

**Resolution:**
1. If "redirect_uri mismatch":
   - Update allowed redirect URLs in Supabase
   - Update OAuth provider settings

2. If token error:
   - Refresh OAuth app credentials
   - Check for expired client secret

3. If user creation fails after OAuth:
   - Check database trigger
   - May be same as regular signup issues

---

## Manual User Creation (Emergency)

If automated signup is completely broken:

```sql
-- This is a last resort - prefer fixing the automated flow

-- 1. Create auth user via Supabase Dashboard
-- Go to Authentication > Users > Add User

-- 2. Create user record (matching auth user ID)
INSERT INTO "user" (_id, email, first_name, last_name, created_at)
VALUES (
    '<auth-user-uuid>',
    'user@example.com',
    'First',
    'Last',
    NOW()
);

-- 3. Create host account
INSERT INTO host_account (_id, user_id, created_at)
VALUES (
    gen_random_uuid(),
    '<user-uuid>',
    NOW()
);

-- 4. Create guest account
INSERT INTO guest_account (_id, user_id, created_at)
VALUES (
    gen_random_uuid(),
    '<user-uuid>',
    NOW()
);
```

## Verification

After resolving any issue:

1. **User can log in:**
   - Test login with user's credentials
   - Or have user confirm

2. **User record complete:**
```sql
SELECT * FROM "user" WHERE email = 'user@example.com';
```

3. **Associated accounts exist:**
```sql
SELECT * FROM host_account WHERE user_id = '<user_id>';
SELECT * FROM guest_account WHERE user_id = '<user_id>';
```

4. **Sync to Bubble (if applicable):**
```sql
SELECT * FROM sync_queue
WHERE record_id = '<user_id>'
ORDER BY created_at DESC;
```

## Escalation

| Issue | Escalate To |
|-------|-------------|
| Widespread signup failures | Engineering Lead |
| Email delivery issues | DevOps (SendGrid) |
| OAuth provider issues | Engineering Lead |
| Database trigger failures | Database Admin |

## Related Runbooks

- [../incidents/outage-edge-functions.md](../incidents/outage-edge-functions.md) - Function issues
- [../incidents/outage-database.md](../incidents/outage-database.md) - Database issues
- [payment-issues.md](payment-issues.md) - Payment problems
- [proposal-stuck.md](proposal-stuck.md) - Proposal issues

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-01-28 | Claude | Initial creation |
