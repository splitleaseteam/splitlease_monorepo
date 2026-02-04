# Google Drive Reconnection Guide (Edge Functions)

**Created**: 2026-02-03
**Purpose**: Reconnect Supabase Edge Functions to Google Drive with a new Google account
**Estimated Time**: ~10 minutes

---

## How It Works

The Edge Function uses a **Service Account** (not your personal Google login). This means:
- No browser login required
- The service account is a "robot" email that accesses Drive on your behalf
- You share your Drive folder with this robot email

---

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your **new Google account**
3. Click **Select a project** → **New Project**
4. Name it `splitlease` (or similar)
5. Click **Create**

---

## Step 2: Enable Google Drive API

1. In the left sidebar: **APIs & Services** → **Library**
2. Search for **"Google Drive API"**
3. Click on it → Click **Enable**

---

## Step 3: Create Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **Service Account**
3. Fill in:
   - **Name**: `splitlease-contracts`
   - **ID**: auto-fills
4. Click **Create and Continue**
5. Skip the optional steps (just click **Done**)

---

## Step 4: Generate JSON Key

1. Click on your new service account (in the credentials list)
2. Go to the **Keys** tab
3. Click **Add Key** → **Create new key**
4. Select **JSON** → Click **Create**
5. A file downloads - **save this securely**

Open the JSON file. You'll need these values:
```json
{
  "client_email": "splitlease-contracts@your-project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

---

## Step 5: Share Your Drive Folder

1. Open [Google Drive](https://drive.google.com) (logged into your new account)
2. Create or navigate to the folder where contracts should go
3. Right-click the folder → **Share**
4. Paste the `client_email` from the JSON file
5. Set permission to **Editor**
6. Click **Send** (uncheck "Notify people" if prompted)

**Get the Folder ID** from the URL:
```
https://drive.google.com/drive/folders/1ABC123xyz...
                                        └─────────┘
                                        This is your FOLDER_ID
```

---

## Step 6: Update Supabase Secrets

Run these commands in your terminal:

```powershell
# 1. Set the service account email
supabase secrets set GOOGLE_SERVICE_ACCOUNT_EMAIL="splitlease-contracts@your-project.iam.gserviceaccount.com"

# 2. Set the private key (copy the ENTIRE private_key value from JSON, including \n)
supabase secrets set GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...(your key)...\n-----END PRIVATE KEY-----\n"

# 3. Set the folder ID
supabase secrets set GOOGLE_DRIVE_FOLDER_ID="1ABC123xyz..."
```

**Tip**: When copying the private key, keep it as one line with `\n` characters - don't convert to actual newlines.

---

## Step 7: Deploy

```powershell
supabase functions deploy lease-documents
```

---

## Step 8: Test

Generate a test contract through the app, or call the edge function endpoint directly.

---

## Quick Checklist

- [ ] Google Cloud project created
- [ ] Google Drive API enabled
- [ ] Service account created
- [ ] JSON key downloaded
- [ ] Drive folder shared with service account email
- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL` secret set
- [ ] `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` secret set
- [ ] `GOOGLE_DRIVE_FOLDER_ID` secret set
- [ ] Edge function deployed
- [ ] Test contract generated

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "File not found" or 404 | Folder ID is wrong - double-check the URL |
| "Access denied" / 403 | Folder not shared with service account email |
| "Invalid credentials" | Private key malformed - check `\n` characters are intact |
| "API not enabled" | Go back to Cloud Console and enable Drive API |

---

## Reference Files

| File | Purpose |
|------|---------|
| [supabase/functions/lease-documents/lib/googleDrive.ts](supabase/functions/lease-documents/lib/googleDrive.ts) | JWT auth & upload logic |
| [supabase/functions/lease-documents/index.ts](supabase/functions/lease-documents/index.ts) | Edge function entry point |
