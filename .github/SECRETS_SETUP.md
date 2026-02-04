# GitHub Secrets Setup Guide

This guide walks you through setting up the required secrets for the CI/CD pipelines.

---

## Required Secrets

### Supabase Secrets (6 total)

| Secret Name | Used By | How to Obtain |
|-------------|---------|---------------|
| `SUPABASE_ACCESS_TOKEN_DEV` | Dev Edge Functions workflow | Supabase Dashboard → Account Settings → Access Tokens |
| `SUPABASE_ACCESS_TOKEN_PROD` | Prod Edge Functions workflow | Same as above (same token can be used for both) |
| `SUPABASE_PROJECT_ID_DEV` | Dev Edge Functions workflow | Supabase → Project Settings → General → Reference ID |
| `SUPABASE_PROJECT_ID_PROD` | Prod Edge Functions workflow | Same as above (for live project) |
| `SUPABASE_PROJECT_URL_PROD` | Health checks | Supabase → Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY_PROD` | Health checks | Supabase → Project Settings → API → `anon` `public` key |

### Cloudflare Secrets (2 total)

| Secret Name | Used By | How to Obtain |
|-------------|---------|---------------|
| `CLOUDFLARE_API_TOKEN` | Frontend workflows | Cloudflare Dashboard → My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Frontend workflows | Cloudflare Dashboard → Workers & Pages → Account ID |

### PythonAnywhere Secrets (3 total)

| Secret Name | Used By | How to Obtain |
|-------------|---------|---------------|
| `PA_SSH_PRIVATE_KEY` | PythonAnywhere workflow | Generate SSH key pair (see Step 6 below) |
| `PA_USERNAME` | PythonAnywhere workflow | Your PythonAnywhere username |
| `PA_HOST` | PythonAnywhere workflow | `ssh.pythonanywhere.com` (fixed value) |

---

## Step-by-Step Setup

### Step 1: Get Supabase Access Token

1. Go to [https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
2. Click **"Generate New Token"**
3. Name it: `GitHub Actions CI/CD`
4. Click **"Generate Token"**
5. **Copy the token immediately** (shown only once)

**Save this token** - you'll use it for both `SUPABASE_ACCESS_TOKEN_DEV` and `SUPABASE_ACCESS_TOKEN_PROD`.

---

### Step 2: Get Supabase Project IDs

#### For Development Project (`splitlease-backend-dev`)

1. Go to [https://supabase.com/dashboard/project/YOUR_PROJECT/settings/general](https://supabase.com/dashboard)
2. Select **splitlease-backend-dev** project
3. Navigate to **Settings** → **General**
4. Find **Reference ID** (looks like: `qzsmhgyojmwvtjmnrdea`)
5. **Copy this ID** - this is `SUPABASE_PROJECT_ID_DEV`

#### For Production Project (`splitlease-backend-live`)

1. Repeat the same steps for **splitlease-backend-live** project
2. **Copy this ID** - this is `SUPABASE_PROJECT_ID_PROD`

---

### Step 3: Get Supabase API Keys (for health checks)

#### Project URL

1. Go to **splitlease-backend-live** project
2. Navigate to **Settings** → **API**
3. Find **Project URL** (looks like: `https://abcdefgh.supabase.co`)
4. **Copy this URL** - this is `SUPABASE_PROJECT_URL_PROD`

#### Anon Key

1. On the same **Settings** → **API** page
2. Find **Project API keys** → `anon` `public`
3. Click **"Reveal"** and **copy the key**
4. **Save this key** - this is `SUPABASE_ANON_KEY_PROD`

---

### Step 4: Get Cloudflare API Token

1. Go to [https://dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **"Create Token"**
3. Use the **"Edit Cloudflare Workers"** template
4. **Permissions:**
   - Account → Cloudflare Pages → Edit
5. **Account Resources:**
   - Include → Your Account (Split Lease)
6. Click **"Continue to summary"**
7. Click **"Create Token"**
8. **Copy the token immediately** (shown only once)

**Save this token** - this is `CLOUDFLARE_API_TOKEN`.

---

### Step 5: Get Cloudflare Account ID

1. Go to [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. Click on **"Workers & Pages"**
3. Your **Account ID** is shown on the right sidebar
4. **Copy this ID** - this is `CLOUDFLARE_ACCOUNT_ID`

---

### Step 6: Setup PythonAnywhere SSH Keys

**Note:** If you already have SSH keys set up for PythonAnywhere (check `pythonAnywhere/pa_deploy_key`), skip to Step 7.

#### Generate SSH Key Pair (if not already done)

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions-deploy" -f pa_deploy_key

# This creates two files:
# - pa_deploy_key (private key - DO NOT commit)
# - pa_deploy_key.pub (public key - safe to commit)
```

#### Add Public Key to PythonAnywhere

1. Copy the contents of `pa_deploy_key.pub`
2. Log in to [PythonAnywhere](https://www.pythonanywhere.com/)
3. Open a **Bash console**
4. Run:
   ```bash
   echo "YOUR_PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

#### Copy Private Key for GitHub Secret

```bash
# Display private key (you'll copy this to GitHub)
cat pa_deploy_key
```

**Important:**
- The private key should start with `-----BEGIN OPENSSH PRIVATE KEY-----`
- Copy the entire key including the BEGIN and END lines
- This will be saved as `PA_SSH_PRIVATE_KEY` in GitHub Secrets

---

### Step 7: Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add each secret one by one:

| Name | Value (from steps above) |
|------|--------------------------|
| `SUPABASE_ACCESS_TOKEN_DEV` | Token from Step 1 |
| `SUPABASE_ACCESS_TOKEN_PROD` | Same token from Step 1 |
| `SUPABASE_PROJECT_ID_DEV` | Reference ID from Step 2 (dev) |
| `SUPABASE_PROJECT_ID_PROD` | Reference ID from Step 2 (prod) |
| `SUPABASE_PROJECT_URL_PROD` | Project URL from Step 3 |
| `SUPABASE_ANON_KEY_PROD` | Anon key from Step 3 |
| `CLOUDFLARE_API_TOKEN` | Token from Step 4 |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID from Step 5 |
| `PA_SSH_PRIVATE_KEY` | Private key from Step 6 |
| `PA_USERNAME` | Your PythonAnywhere username (e.g., `SplitLease`) |
| `PA_HOST` | `ssh.pythonanywhere.com` |

---

## Step 8: Configure GitHub Environments (Optional but Recommended)

1. Go to your GitHub repository
2. Navigate to **Settings** → **Environments**
3. Create two environments:

### Development Environment

- **Name:** `development`
- **Protection rules:** None (allow deployments from any branch)

### Production Environment

- **Name:** `production`
- **Protection rules:**
  - ✅ Required reviewers: Add yourself or team members
  - ✅ Wait timer: 0 minutes (or add delay for safety)
  - ✅ Deployment branches: `main` only

---

## Verification

After adding all secrets, verify they're configured correctly:

```bash
# List all secrets (doesn't show values, just names)
gh secret list

# Expected output (11 total):
# CLOUDFLARE_ACCOUNT_ID
# CLOUDFLARE_API_TOKEN
# PA_HOST
# PA_SSH_PRIVATE_KEY
# PA_USERNAME
# SUPABASE_ACCESS_TOKEN_DEV
# SUPABASE_ACCESS_TOKEN_PROD
# SUPABASE_ANON_KEY_PROD
# SUPABASE_PROJECT_ID_DEV
# SUPABASE_PROJECT_ID_PROD
# SUPABASE_PROJECT_URL_PROD
```

---

## Security Best Practices

1. **Never commit secrets to the repository**
2. **Rotate access tokens** every 90 days
3. **Use environment protection rules** for production
4. **Limit API token permissions** to minimum required scope
5. **Audit secret usage** regularly in GitHub Actions logs

---

## Troubleshooting

### "Secret not found" errors

**Cause:** Secret name mismatch between workflow YAML and GitHub settings

**Fix:** Check that secret names match exactly (case-sensitive)

---

### "Unauthorized" errors during deployment

**Cause:** Invalid or expired access token

**Fix:**
1. Generate a new Supabase access token (Step 1)
2. Update `SUPABASE_ACCESS_TOKEN_PROD` or `SUPABASE_ACCESS_TOKEN_DEV` in GitHub secrets
3. Re-run the failed workflow

---

### "Project not found" errors

**Cause:** Incorrect project ID

**Fix:**
1. Verify project ID in Supabase dashboard (Step 2)
2. Update `SUPABASE_PROJECT_ID_PROD` or `SUPABASE_PROJECT_ID_DEV` in GitHub secrets
3. Re-run the failed workflow

---

## Next Steps

After configuring all secrets:

1. ✅ Push a change to `main` branch
2. ✅ Watch the GitHub Actions tab for workflow execution
3. ✅ Verify deployment succeeded
4. ✅ Check Slack for deployment notifications

---

**Last Updated:** 2026-01-27
