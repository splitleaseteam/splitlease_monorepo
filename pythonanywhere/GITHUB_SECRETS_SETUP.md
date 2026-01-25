# GitHub Secrets Setup - Quick Reference

Use this guide to quickly configure GitHub Secrets for automated deployment.

## 📋 Required Secrets

You need to add **3 secrets** to your GitHub repository.

---

## 🔐 Secret 1: PA_SSH_PRIVATE_KEY

**What it is:** Private SSH key that allows GitHub Actions to log into PythonAnywhere

**How to get it:**
1. Open the file `pa_deploy_key` (located in your pythonanywhere directory)
2. Copy the **entire content** from beginning to end

**Expected format:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAACFwAAAAdzc2gtcn
... (many lines of random characters) ...
AAAABG5vbmUAAAABAAACFwAAAAdzc2gtcnNhAAAAAwEAAQAAAgEA73G5T1QEqiD036nNMc
-----END OPENSSH PRIVATE KEY-----
```

**⚠️ CRITICAL:**
- Copy the ENTIRE file content (including BEGIN/END lines)
- Don't add extra spaces or line breaks
- Keep this secret - never share it or commit it to Git

---

## 🔐 Secret 2: PA_USERNAME

**What it is:** Your PythonAnywhere username

**Value:** `SplitLease` (or your actual PythonAnywhere username)

**How to find it:**
- Log into PythonAnywhere
- Your username is shown in the top-right corner
- It's also in your PythonAnywhere URL: `https://www.pythonanywhere.com/user/USERNAME/`

---

## 🔐 Secret 3: PA_HOST

**What it is:** PythonAnywhere SSH server address

**Value:** `ssh.pythonanywhere.com`

**Note:** This is the same for all PythonAnywhere users

---

## 🚀 How to Add Secrets to GitHub

### Step-by-Step:

1. **Go to Your GitHub Repository**
   - Navigate to: `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME`

2. **Open Settings**
   - Click: **Settings** (top menu bar)

3. **Navigate to Secrets**
   - Click: **Secrets and variables** (left sidebar)
   - Click: **Actions**

4. **Add First Secret**
   - Click: **"New repository secret"** (green button)
   - **Name:** `PA_SSH_PRIVATE_KEY`
   - **Secret:** Paste entire content of `pa_deploy_key` file
   - Click: **"Add secret"**

5. **Add Second Secret**
   - Click: **"New repository secret"**
   - **Name:** `PA_USERNAME`
   - **Secret:** `SplitLease` (your PythonAnywhere username)
   - Click: **"Add secret"**

6. **Add Third Secret**
   - Click: **"New repository secret"**
   - **Name:** `PA_HOST`
   - **Secret:** `ssh.pythonanywhere.com`
   - Click: **"Add secret"**

7. **Verify**
   - You should now see 3 secrets listed
   - You won't be able to view the values (this is normal - it's a security feature)

---

## ✅ Verification Checklist

After adding all secrets, verify:

- [ ] All 3 secrets are listed in GitHub Secrets
- [ ] Secret names are EXACTLY as specified (case-sensitive):
  - `PA_SSH_PRIVATE_KEY` (not `pa_ssh_private_key` or `PA_SSH_KEY`)
  - `PA_USERNAME` (not `pa_username` or `PYTHONANYWHERE_USERNAME`)
  - `PA_HOST` (not `pa_host` or `PYTHONANYWHERE_HOST`)
- [ ] No typos in secret values
- [ ] Private key includes BEGIN/END lines

---

## 🐛 Common Issues

### Issue: "Permission denied (publickey)"

**Cause:** Private key is incorrect or malformed

**Fix:**
1. Delete `PA_SSH_PRIVATE_KEY` secret
2. Re-copy the `pa_deploy_key` file content (make sure to get ALL of it)
3. Create the secret again

### Issue: "Host key verification failed"

**Cause:** SSH host is incorrect

**Fix:**
1. Verify `PA_HOST` is exactly: `ssh.pythonanywhere.com`
2. No extra spaces, no https://, no www.

### Issue: "Could not resolve hostname"

**Cause:** Typo in `PA_HOST`

**Fix:**
1. Delete and recreate `PA_HOST` secret
2. Ensure it's: `ssh.pythonanywhere.com`

---

## 🔒 Security Notes

### After Setup:

1. **Delete Local Private Key (Recommended)**
   ```bash
   # Once you've added the key to GitHub Secrets, you can delete the local copy
   cd "C:\Users\Split Lease\Documents\Split Lease - Dev\pythonanywhere"
   rm pa_deploy_key
   ```

   ⚠️ **Keep the public key** (`pa_deploy_key.pub`) - you'll need it if you ever need to regenerate the setup.

2. **Never Commit Private Key**
   - Already gitignored in `.gitignore`
   - Double-check before pushing: `git status`

3. **Rotate Keys Periodically**
   - Generate new keys every 6-12 months
   - Update GitHub Secrets with new keys
   - Update PythonAnywhere's `authorized_keys`

---

## 📞 Quick Support

**Still stuck?**
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting
2. Verify public key is in PythonAnywhere's `~/.ssh/authorized_keys`
3. Test SSH connection manually from your computer
4. Check GitHub Actions logs for specific error messages

---

**Next Steps:** After adding secrets, see [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment instructions.
