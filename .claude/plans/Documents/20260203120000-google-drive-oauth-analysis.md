# Google Drive Implementation Analysis for Contract Generation

**Date**: 2026-02-03
**Purpose**: Document OAuth/authentication requirements for reconnecting with a new Google account

---

## Executive Summary

Split Lease has **two separate implementations** for Google Drive integration in contract generation:

| Implementation | Location | Auth Method | Status |
|----------------|----------|-------------|--------|
| **PythonAnywhere** | `pythonAnywhere/mysite/modules/` | OAuth 2.0 User Flow | Legacy (Active) |
| **Supabase Edge Functions** | `supabase/functions/lease-documents/` | Service Account JWT | Current (Migrated) |

**Key Finding**: The two implementations use fundamentally different authentication approaches. The PythonAnywhere version requires user-interactive OAuth, while the Supabase version uses a Service Account (no user interaction needed).

---

## 1. PythonAnywhere Implementation (Legacy)

### File Locations
- **Google Drive Uploader**: `pythonAnywhere/mysite/modules/google_drive/uploader.py`
- **OAuth Routes**: `pythonAnywhere/mysite/modules/google_drive/routes.py`
- **Lease documents (Supabase)**:
  - `supabase/functions/lease-documents/handlers/generatePeriodicTenancy.ts`
  - `supabase/functions/lease-documents/handlers/generateCreditCardAuth.ts`
  - `supabase/functions/lease-documents/handlers/generateSupplemental.ts`
  - `supabase/functions/lease-documents/handlers/generateHostPayout.ts`

### Authentication Method: OAuth 2.0 User Consent Flow

The PythonAnywhere implementation uses the **OAuth 2.0 Authorization Code Flow** with user consent.

#### Required Files
1. **`client_secret.json`** - Google OAuth client credentials
   - Location: `/home/SplitLease/mysite/modules/google_drive/client_secret.json` (or configured via `GOOGLE_DRIVE_CONFIG_DIR`)
   - Contains: `client_id`, `client_secret`, `redirect_uris`
   - Source: Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client ID

2. **`token.json`** - Stored OAuth tokens (auto-generated after user consent)
   - Location: Same directory as `client_secret.json`
   - Contains: `access_token`, `refresh_token`, `token_expiry`, `scopes`
   - Created automatically after first successful OAuth flow

#### OAuth Scopes Used
```python
SCOPES = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/drive.file',
    'openid'
]
```

#### Environment Variables
| Variable | Purpose |
|----------|---------|
| `GOOGLE_DRIVE_CONFIG_DIR` | Directory containing `client_secret.json` and `token.json` |
| `GOOGLE_DRIVE_REDIRECT_URI` | OAuth callback URL (e.g., `https://splitlease.pythonanywhere.com/google_drive/oauth2callback`) |
| `GOOGLE_DRIVE_FOLDER_ID` | Target folder ID in Google Drive |

#### OAuth Flow Endpoints
1. **`/google_drive/authorize`** - Initiates OAuth flow, redirects to Google consent screen
2. **`/google_drive/oauth2callback`** - Handles OAuth callback, stores tokens
3. **`/google_drive/status`** - Check current authentication status
4. **`/google_drive/upload`** - Upload files (requires valid auth)

#### Token Refresh Logic
```python
def get_credentials(self) -> Optional[Credentials]:
    creds = None
    if os.path.exists(self.TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(self.TOKEN_FILE, self.SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())  # Automatic refresh
            self.save_credentials(creds)
        else:
            return None  # Needs re-authorization
    return creds
```

#### Google APIs Used
- **Google Drive API v3** (`googleapiclient.discovery.build('drive', 'v3')`)
  - `files().create()` - Upload files with metadata
  - Returns: `id`, `name`, `webViewLink`

### Contract Generation Workflow
1. User calls contract generation endpoint (e.g., `/periodic_tenancy`)
2. Generator loads DOCX template from `modules/templates/{type}/`
3. Generator renders template with `docxtpl` library
4. Document saved to `temp/{type}/`
5. `GoogleDriveUploader.upload_file()` called
6. If auth valid: Upload to Drive, return `webViewLink`
7. If auth invalid: Return document without Drive link

### To Reconnect with New Google Account

1. **Delete existing `token.json`** in the config directory
2. **Update `client_secret.json`** if using new OAuth credentials
3. **Visit `/google_drive/authorize`** endpoint
4. **Complete Google consent flow** in browser
5. **Verify with `/google_drive/status`**

---

## 2. Supabase Edge Functions Implementation (Current)

### File Locations
- **Google Drive Module**: `supabase/functions/lease-documents/lib/googleDrive.ts`
- **Main Entry Point**: `supabase/functions/lease-documents/index.ts`
- **Handlers**:
  - `supabase/functions/lease-documents/handlers/generatePeriodicTenancy.ts`
  - `supabase/functions/lease-documents/handlers/generateHostPayout.ts`
  - `supabase/functions/lease-documents/handlers/generateSupplemental.ts`
  - `supabase/functions/lease-documents/handlers/generateCreditCardAuth.ts`
  - `supabase/functions/lease-documents/handlers/generateAll.ts`

### Authentication Method: Service Account (JWT)

The Supabase implementation uses a **Google Service Account** with JWT-based authentication. No user interaction required.

#### How It Works
1. Service Account private key stored in environment
2. Edge function creates a signed JWT
3. JWT exchanged for access token via Google's token endpoint
4. Access token used for API calls

#### JWT Creation Process (from `googleDrive.ts`)
```typescript
async function createServiceAccountJWT(credentials: ServiceAccountCredentials): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,  // 1 hour
  };
  // Sign with RSA-SHA256 using private key
  // ...
}
```

#### Environment Variables Required
| Variable | Purpose | Format |
|----------|---------|--------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email | `xxx@project.iam.gserviceaccount.com` |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Private key (PEM format) | `-----BEGIN PRIVATE KEY-----\n...` |
| `GOOGLE_DRIVE_FOLDER_ID` | Target folder ID | Google Drive folder ID string |
| `SLACK_ERROR_WEBHOOK` | (Optional) Error notifications | Slack webhook URL |
| `SLACK_SUCCESS_WEBHOOK` | (Optional) Success notifications | Slack webhook URL |

#### OAuth Scope
```typescript
scope: 'https://www.googleapis.com/auth/drive.file'
```

Only `drive.file` scope needed (access to files created by the application).

#### Google APIs Used
- **Google Drive API v3** via REST
  - `POST /upload/drive/v3/files?uploadType=multipart` - Multipart file upload
  - Returns: `id`, `name`, `webViewLink`

### To Reconnect with New Google Account

1. **Create Service Account** in new Google Cloud Project
   - Go to: Google Cloud Console > IAM & Admin > Service Accounts
   - Create service account
   - Create key (JSON format)

2. **Enable Google Drive API** in the project

3. **Share Target Folder** with service account email
   - Open Google Drive folder
   - Share with `xxx@project.iam.gserviceaccount.com` (Editor access)

4. **Update Supabase Secrets**
   ```bash
   supabase secrets set GOOGLE_SERVICE_ACCOUNT_EMAIL="new-account@project.iam.gserviceaccount.com"
   supabase secrets set GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   supabase secrets set GOOGLE_DRIVE_FOLDER_ID="new-folder-id"
   ```

5. **Redeploy Edge Functions** (manual deployment required)
   ```bash
   supabase functions deploy lease-documents
   ```

---

## 3. Google Calendar Service (Reference)

### File Location
- `supabase/functions/calendar-automation/lib/googleCalendarService.ts`

### Authentication
Uses **plain OAuth access token** stored in environment:
```typescript
const accessToken = Deno.env.get('GOOGLE_OAUTH_ACCESS_TOKEN');
```

**Note**: This is different from the Service Account approach used in lease-documents. It requires manual token refresh.

---

## 4. Comparison Summary

| Aspect | PythonAnywhere (OAuth 2.0) | Supabase (Service Account) |
|--------|---------------------------|---------------------------|
| **User Interaction** | Required (consent screen) | Not required |
| **Token Refresh** | Automatic (via refresh_token) | JWT regenerated on each request |
| **Credentials File** | `client_secret.json` + `token.json` | Service account key (in env vars) |
| **Scope** | Multiple (profile, email, drive.file) | Single (drive.file) |
| **Folder Access** | User's own Drive | Shared folder only |
| **Token Storage** | File system | None (stateless) |
| **Libraries** | `google-auth-oauthlib`, `googleapiclient` | Native fetch + crypto.subtle |

---

## 5. Recommendations for New Google Account

### If Using PythonAnywhere Implementation
1. Create new OAuth 2.0 Client ID credentials in Google Cloud Console
2. Download `client_secret.json` and place in config directory
3. Delete existing `token.json`
4. Navigate to `/google_drive/authorize` to complete OAuth flow
5. The new account must have access to the target Drive folder

### If Using Supabase Implementation
1. Create new Service Account in Google Cloud Console
2. Download the JSON key file
3. Extract `client_email` and `private_key` fields
4. Update Supabase secrets with new values
5. Share the target Drive folder with the new service account email
6. Redeploy edge functions

### Hybrid Approach (Both Systems)
If both systems need to use the same Google account:
- Use a Service Account for both (simpler, no user interaction)
- PythonAnywhere can also use Service Account auth with `google-auth` library
- Would require code changes to PythonAnywhere implementation

---

## 6. Related Files Reference

### PythonAnywhere
| File | Purpose |
|------|---------|
| `pythonAnywhere/mysite/modules/google_drive/uploader.py` | Core upload logic, credential management |
| `pythonAnywhere/mysite/modules/google_drive/routes.py` | OAuth endpoints, Flask blueprint |
| `pythonAnywhere/mysite/.env.example` | Environment variable template |
| `pythonAnywhere/mysite/modules/templates/` | DOCX templates |

### Supabase
| File | Purpose |
|------|---------|
| `supabase/functions/lease-documents/lib/googleDrive.ts` | Service Account auth, upload logic |
| `supabase/functions/lease-documents/index.ts` | Edge function entry point |
| `supabase/functions/lease-documents/handlers/*.ts` | Document-specific handlers |
| `supabase/functions/lease-documents/lib/templateRenderer.ts` | Template rendering |
| `supabase/functions/calendar-automation/lib/googleCalendarService.ts` | Calendar (different auth) |

---

## 7. Google Cloud Console Setup Checklist

### For OAuth 2.0 (PythonAnywhere)
- [ ] Create/select Google Cloud Project
- [ ] Enable Google Drive API
- [ ] Configure OAuth consent screen
- [ ] Create OAuth 2.0 Client ID (Web application)
- [ ] Add authorized redirect URI
- [ ] Download `client_secret.json`

### For Service Account (Supabase)
- [ ] Create/select Google Cloud Project
- [ ] Enable Google Drive API
- [ ] Create Service Account
- [ ] Create JSON key for Service Account
- [ ] Share Drive folder with Service Account email
- [ ] Store credentials in Supabase secrets

---

*Document generated as part of codebase analysis. See CLAUDE.md for context on Split Lease architecture.*
