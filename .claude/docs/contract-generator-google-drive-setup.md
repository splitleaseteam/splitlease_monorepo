# Google Drive Service Account Setup Guide

This guide walks you through setting up a Google Cloud service account for the contract generator Edge Function to upload documents to Google Drive.

## Overview

The contract generator uses a service account with OAuth2 authentication to upload generated contract documents to a specific Google Drive folder. This requires:

- A Google Cloud project
- Drive API enabled
- A service account with credentials
- A Google Drive folder to store contracts
- Two environment variables in Supabase Edge Functions

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click the project dropdown at the top (next to "Google Cloud Platform")
4. Click **"New Project"**
5. Enter a project name (e.g., "Split Lease Contracts")
6. Click **"Create"**
7. Wait for the project to be created (notification will appear at top right)

---

## Step 2: Enable the Drive API

1. Make sure your new project is selected in the project dropdown
2. Navigate to [APIs & Services > Library](https://console.cloud.google.com/apis/library)
3. Search for **"Google Drive API"**
4. Click on **"Google Drive API"** in the results
5. Click the **"Enable"** button
6. Wait for the API to be enabled (button will change to "Manage")

---

## Step 3: Create a Service Account

1. Navigate to [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **"+ Create Credentials"** at the top
3. Select **"Service account"** from the dropdown
4. Fill in the service account details:
   - **Service account name**: `Split Lease Contract Generator` (or similar)
   - **Service account description**: `Uploads generated contracts to Google Drive`
   - **Service account ID**: Auto-generated (e.g., `split-lease-contract-generator`)
5. Click **"Create and continue"**
6. Skip the "Grant this service account access to project" step (click **"Done"**)
7. You'll see your new service account listed on the Credentials page

---

## Step 4: Download Service Account Credentials

1. On the [Credentials](https://console.cloud.google.com/apis/credentials) page, click on the service account email address you just created
2. Go to the **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"**
4. Select **"JSON"** as the key type
5. Click **"Create"**
6. **IMPORTANT**: The JSON file will download automatically. **Keep this file secure** - it contains full access to your service account.
7. Rename the file to something identifiable (e.g., `google-service-account-credentials.json`)

**Security Note**: Never commit this file to git. Add it to `.gitignore` if storing it locally.

---

## Step 5: Create a Google Drive Folder

1. Go to [Google Drive](https://drive.google.com/)
2. Navigate to where you want to store contracts (or create at root level)
3. Click **"New"** → **"Folder"**
4. Name the folder (e.g., "Split Lease Contracts")
5. Click **"Create"**
6. Open the newly created folder

### Get the Folder ID

The folder ID is needed for the Edge Function to know where to upload files.

1. With the folder open, look at the URL in your browser
2. The URL format is: `https://drive.google.com/drive/folders/[FOLDER_ID]`
3. Copy the **[FOLDER_ID]** part (the long alphanumeric string after `/folders/`)

**Example**: If the URL is `https://drive.google.com/drive/folders/1ABC2xyz456DEF789ghi012JKL345mno`, the folder ID is `1ABC2xyz456DEF789ghi012JKL345mno`

---

## Step 6: Share the Folder with the Service Account

The service account email needs access to the folder to upload files.

1. In Google Drive, right-click on the folder you created
2. Select **"Share"**
3. In the "Add people and groups" field, paste the **service account email** (from Step 3, format: `xxx@xxx.iam.gserviceaccount.com`)
4. Set the permission to **"Editor"** (allows the service account to upload files)
5. Click **"Send"** (or just close the dialog - no email is sent to service accounts)

---

## Step 7: Configure Supabase Edge Function Secrets

You need to store two secrets in your Supabase project for the contract generator Edge Function.

### Option A: Using Supabase Dashboard (Recommended for first-time setup)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (`splitlease-backend-dev` for development)
3. Navigate to **Edge Functions** → **Logs**
4. Click **"Manage Function Secrets"**
5. Add the following secrets:

#### Secret 1: `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`

- **Name**: `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`
- **Value**: The entire contents of the JSON file downloaded in Step 4 (paste the raw JSON content)

**Example format**:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "split-lease-contract-generator@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

#### Secret 2: `GOOGLE_DRIVE_FOLDER_ID`

- **Name**: `GOOGLE_DRIVE_FOLDER_ID`
- **Value**: The folder ID copied in Step 5 (just the ID string, not the full URL)

**Example**: `1ABC2xyz456DEF789ghi012JKL345mno`

6. Click **"Encrypt and save"** for each secret

### Option B: Using Supabase CLI

```bash
# Set service account credentials (use the JSON file content)
supabase secrets set GOOGLE_SERVICE_ACCOUNT_CREDENTIALS="$(cat path/to/google-service-account-credentials.json)"

# Set folder ID
supabase secrets set GOOGLE_DRIVE_FOLDER_ID="your-folder-id-here"
```

---

## Step 8: Verify the Setup

1. Start the Edge Functions locally:
   ```bash
   supabase functions serve
   ```

2. Test the contract generator function (once implemented) by generating a contract

3. Check the Google Drive folder to verify the uploaded document appears

---

## Required OAuth2 Scopes

The service account uses the following scope:

```
https://www.googleapis.com/auth/drive.file
```

This scope allows the service account to:
- Create and upload files to folders it has been granted access to
- Edit files it has created
- **Limited access**: Can only access files/folders explicitly shared with it or created by it

This is more secure than the broader `https://www.googleapis.com/auth/drive` scope.

---

## Troubleshooting

### Issue: "Invalid Credentials" Error

- Verify the JSON credentials were copied correctly (no extra whitespace or formatting issues)
- Ensure the entire JSON content is pasted, including all quotes and brackets
- Check that the `private_key` field includes the full key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

### Issue: "File Not Found" or 404 Error

- Verify the folder ID is correct (no extra spaces or characters)
- Ensure the folder is shared with the service account email
- Check that the service account has "Editor" permission on the folder

### Issue: "Insufficient Permissions" Error

- Verify the service account email is added to the folder with "Editor" permission
- Wait a few minutes after sharing the folder before testing (permission propagation may take time)
- Check that the Drive API is enabled in your Google Cloud project

---

## Security Best Practices

1. **Never commit credentials to git**: Add the JSON file to `.gitignore`
2. **Restrict service account access**: Use the principle of least privilege
3. **Monitor Drive API usage**: Check Google Cloud Console for unusual activity
4. **Rotate credentials periodically**: Regenerate service account keys if compromised
5. **Use separate environments**: Create different service accounts for dev and production

---

## Environment-Specific Setup

### Development (splitlease-backend-dev)

Use the steps above to configure the development Supabase project.

### Production (splitlease-backend-live)

Repeat all steps for the production environment:

1. Create a separate Google Cloud project (or use the same project with a different service account)
2. Create a dedicated Google Drive folder for production contracts
3. Set secrets in the production Supabase project using the Supabase Dashboard

**Best Practice**: Use different service accounts and folders for dev and production to isolate environments.

---

## Related Files

- Contract generator Edge Function: `supabase/functions/contract-generator/`
- Google Drive integration: `supabase/functions/_shared/google-drive.js`

---

## Support

If you encounter issues:

1. Check the Edge Function logs in Supabase Dashboard
2. Verify all steps above were completed correctly
3. Ensure the Drive API is enabled and credentials are valid
4. Test API access using [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

---

**Last Updated**: 2026-01-28
