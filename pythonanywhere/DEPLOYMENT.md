# Automated Deployment to PythonAnywhere

This guide explains how to set up automated deployment from GitHub to PythonAnywhere using GitHub Actions.

## 🎯 Overview

When you push code to GitHub, GitHub Actions will automatically:
1. Connect to your PythonAnywhere server via SSH
2. Pull the latest code
3. Install updated dependencies
4. Reload your web applications

## 🔑 Phase 1: SSH Key Setup

### Step 1: SSH Key Pair Generated

✅ **Already done!** SSH key pair has been generated:
- **Private Key:** `pa_deploy_key` (⚠️ Keep secret!)
- **Public Key:** `pa_deploy_key.pub` (Safe to share)

**Location:** `C:\Users\Split Lease\Documents\Split Lease - Dev\pythonanywhere\`

---

### Step 2: Add Public Key to PythonAnywhere

1. **Log in to PythonAnywhere Dashboard**
   - Go to: https://www.pythonanywhere.com

2. **Navigate to SSH Configuration**
   - Click: **Files** tab
   - Navigate to: `.ssh/authorized_keys`
   - If `.ssh` folder doesn't exist, create it:
     - Click **New directory** → Enter `.ssh` → Create
   - If `authorized_keys` file doesn't exist:
     - Click **New file** → Enter `.ssh/authorized_keys` → Create

3. **Add Your Public Key**
   - Open the `authorized_keys` file
   - Copy the entire content of `pa_deploy_key.pub` (provided below)
   - Paste it on a **new line** at the end of the file
   - Save the file

**Your Public Key (copy this):**
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDvcblPVASqIPTfqc0xzWg8+f9m501O7NTSj7whCkbtkddjo4NIuoGL95vr1YxyukCihwbLJzEwLGkJyRUdRW4t78A5yixqCeeS4dE0lE/Fs55uR30JW11z7npSPCPkBFJJ7aJ35jBBsT8hhLwAZK9Mzt1tmUieuP6XawTwk+zBVB2bJS4dMmU7uGHpmGrBaif2bNV+21qKLfYmT2ZaE/p3J4OH7iKO7x/+a3V0/qmshX7vrFWGVeGnpvanUuFJK2vyHnLppj3DZHIPWZHf7nkhBPZCSvrIAqDu87pjCdmIve/eJoKlzpmMuP2yQ1eCLoI6ECUweU8p9fizsQ2PO79hY8G0AtHMSo/A0WiOxHqHIN+ZAtjc/Zfaty2UIJFfH0yfmPf9CI8O+jKf8Md4Q50dRFzvrbc4VuARd+cXpv6uxZZge5TXKjOv8q8K0ZgbwEz0uf2Xpc2SuoakG+WoMjjZarhxuQsYGRjpreJjJEAVflrWiaXG4IoaYXKQC/5+rursp5Gsp3TziCFS1RszF05FnXjxZWC544IxISdeX5QtZxfdEbVd+Q/Zwa0R8FnhvQ884M0WwPIGwji48sQTSc3dIvc3PidR9zF5OYV63/QZ1MZ3P+ehRKQWlBqhwx978+LfpweSWUsgBXLFTojdDrACTkHKj7VUOF8234OT8YXkgw== github-actions-deploy
```

4. **Set Correct Permissions (Important!)**
   - Open a **Bash console** on PythonAnywhere
   - Run these commands:
     ```bash
     chmod 700 ~/.ssh
     chmod 600 ~/.ssh/authorized_keys
     ```

---

## 🔐 Phase 2: GitHub Secrets Configuration

### Step 1: Get Your Private Key

1. Open the file `pa_deploy_key` (no extension) in a text editor
2. Copy the **entire content** (including the `-----BEGIN` and `-----END` lines)

**⚠️ SECURITY WARNING:**
- This is your **private key** - treat it like a password
- Never commit it to Git (it's already gitignored)
- Only paste it into GitHub Secrets (encrypted)
- Delete it from your local machine after adding to GitHub

---

### Step 2: Add Secrets to GitHub

1. **Go to Your GitHub Repository**
   - Navigate to your repository on GitHub

2. **Open Secrets Settings**
   - Click: **Settings** (top menu)
   - Click: **Secrets and variables** → **Actions** (left sidebar)

3. **Add Three Secrets**

   Click **"New repository secret"** for each:

   | Secret Name | Secret Value | Example |
   |-------------|--------------|---------|
   | `PA_SSH_PRIVATE_KEY` | Entire content of `pa_deploy_key` file | `-----BEGIN OPENSSH PRIVATE KEY-----`<br>`...`<br>`-----END OPENSSH PRIVATE KEY-----` |
   | `PA_USERNAME` | Your PythonAnywhere username | `SplitLease` |
   | `PA_HOST` | PythonAnywhere SSH host | `ssh.pythonanywhere.com` |

4. **Verify Secrets**
   - You should see 3 secrets listed
   - You won't be able to view the values (security feature)

---

## 🚀 Phase 3: Deploy Your Repository to PythonAnywhere

### Step 1: Clone Repository on PythonAnywhere

1. **Open a Bash Console on PythonAnywhere**

2. **Clone Your Repository**
   ```bash
   cd /home/YOUR_USERNAME
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git pythonanywhere
   cd pythonanywhere
   ```

3. **Install Dependencies**
   ```bash
   # For mysite
   cd mysite
   pip3 install --user -r requirements.txt

   # For mysite2
   cd ../mysite2
   pip3 install --user -r requirements.txt

   # For mysite3
   cd ../mysite3
   pip3 install --user -r requirements.txt
   ```

4. **Set Up Environment Variables**
   ```bash
   # Copy example env files
   cd /home/YOUR_USERNAME/pythonanywhere
   cp .env.example .env
   cd mysite
   cp .env.example .env
   # Edit .env files with your actual credentials
   nano .env
   ```

---

### Step 2: Configure WSGI File

1. **Go to PythonAnywhere Web Tab**
   - Click: **Web** tab

2. **Find Your WSGI Configuration**
   - Scroll to: **Code** section
   - Click: **WSGI configuration file** link
   - This opens your WSGI file (e.g., `/var/www/username_pythonanywhere_com_wsgi.py`)

3. **Update WSGI File**
   ```python
   import sys
   import os
   from dotenv import load_dotenv

   # Add your project directory to the sys.path
   project_home = '/home/YOUR_USERNAME/pythonanywhere/mysite'
   if project_home not in sys.path:
       sys.path.insert(0, project_home)

   # Load environment variables
   load_dotenv(os.path.join(project_home, '.env'))

   # Import Flask app
   from app import app as application
   ```

4. **Reload Web App**
   - Go back to **Web** tab
   - Click: **Reload YOUR_USERNAME.pythonanywhere.com**

---

## ✅ Phase 4: Test Automated Deployment

### Test 1: Manual Trigger (Recommended First Test)

1. **Go to GitHub Repository**
2. **Navigate to Actions Tab**
3. **Select "Deploy to PythonAnywhere" workflow**
4. **Click "Run workflow"** → **Run workflow**
5. **Watch the deployment logs**
   - Should show: "Deployment completed successfully!"

### Test 2: Push to Main Branch

1. **Make a Small Change**
   ```bash
   cd "C:\Users\Split Lease\Documents\Split Lease - Dev\pythonanywhere"

   # Make a small change (e.g., update README)
   echo "Test deployment" >> README.md

   # Commit and push
   git add .
   git commit -m "test: Trigger automated deployment"
   git push origin main
   ```

2. **Watch GitHub Actions**
   - Go to: **Actions** tab on GitHub
   - You should see a new workflow run
   - Click on it to watch real-time logs

3. **Verify on PythonAnywhere**
   - Open a Bash console
   - Check your code was updated:
     ```bash
     cd /home/YOUR_USERNAME/pythonanywhere
     git log -1
     # Should show your latest commit
     ```

---

## 🛠️ Customization

### Modify Deployment Script

Edit `.github/workflows/deploy.yml` to customize:

**Change Repository Path:**
```yaml
cd /home/${{ secrets.PA_USERNAME }}/pythonanywhere
```
Change `pythonanywhere` to your actual folder name.

**Change WSGI Path:**
```yaml
touch /var/www/${{ secrets.PA_USERNAME }}_pythonanywhere_com_wsgi.py
```
Update to match your WSGI file path (check Web tab).

**Add Virtual Environment:**
If using a virtualenv, add before pip install:
```yaml
source /home/${{ secrets.PA_USERNAME }}/.virtualenvs/YOUR_VENV_NAME/bin/activate
```

**Add Database Migrations:**
```yaml
cd /home/${{ secrets.PA_USERNAME }}/pythonanywhere/mysite
python3 manage.py migrate  # Django
# OR
flask db upgrade  # Flask-Migrate
```

---

## 🐛 Troubleshooting

### Problem: "Permission denied (publickey)"

**Solution:**
1. Verify public key is in PythonAnywhere's `~/.ssh/authorized_keys`
2. Check permissions:
   ```bash
   ls -la ~/.ssh
   # Should show: drwx------ for .ssh
   # Should show: -rw------- for authorized_keys
   ```
3. Fix permissions:
   ```bash
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

### Problem: "Repository not found"

**Solution:**
1. Check repository path on PythonAnywhere:
   ```bash
   ls /home/YOUR_USERNAME/
   ```
2. Update `.github/workflows/deploy.yml` with correct path

### Problem: "WSGI file not found"

**Solution:**
1. Go to PythonAnywhere **Web** tab
2. Find your WSGI file path under **Code** section
3. Update the `touch` command in deploy.yml with exact path

### Problem: "pip install fails"

**Solution:**
1. Check if requirements.txt exists:
   ```bash
   cd /home/YOUR_USERNAME/pythonanywhere/mysite
   ls -la requirements.txt
   ```
2. Test manual install:
   ```bash
   pip3 install --user -r requirements.txt
   ```
3. Check for specific package errors in logs

### Problem: "Web app doesn't reload"

**Solution:**
1. Manually reload from Web tab
2. Check error logs:
   ```bash
   tail -100 /var/log/YOUR_USERNAME.pythonanywhere.com.error.log
   ```
3. Verify WSGI file path is correct

### Problem: "Deployment succeeds but changes don't appear"

**Solution:**
1. Check git pull worked:
   ```bash
   cd /home/YOUR_USERNAME/pythonanywhere
   git status
   git log -1
   ```
2. Clear browser cache (Ctrl+Shift+R)
3. Check if static files need updating
4. Manually reload web app from Web tab

---


## 📊 Deployment Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTOMATED DEPLOYMENT FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Local Machine                                                  │
│  └─ git push origin main                                        │
│           │                                                     │
│           ▼                                                     │
│  GitHub Repository                                              │
│  └─ Detects push to main                                        │
│           │                                                     │
│           ▼                                                     │
│  GitHub Actions Runner                                          │
│  ├─ Checkout code                                               │
│  └─ SSH to PythonAnywhere using PA_SSH_PRIVATE_KEY            │
│           │                                                     │
│           ▼                                                     │
│  PythonAnywhere Server (via SSH)                                │
│  ├─ cd /home/username/pythonanywhere                           │
│  ├─ git pull origin main                                        │
│  ├─ pip3 install --user -r requirements.txt (x3 apps)          │
│  └─ touch /var/www/username_pythonanywhere_com_wsgi.py        │
│           │                                                     │
│           ▼                                                     │
│  PythonAnywhere Web Server                                      │
│  └─ Detects WSGI file change → Reloads application            │
│           │                                                     │
│           ▼                                                     │
│  ✅ Updated Application Live                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security Best Practices

### 1. SSH Key Management

- ✅ **DO:** Store private key only in GitHub Secrets
- ✅ **DO:** Use separate key for deployment (not personal SSH key)
- ❌ **DON'T:** Commit private key to repository
- ❌ **DON'T:** Share private key via email/chat

### 2. Secrets Management

- ✅ **DO:** Use GitHub Secrets for all sensitive values
- ✅ **DO:** Rotate keys periodically (every 6-12 months)
- ❌ **DON'T:** Hardcode credentials in workflow files
- ❌ **DON'T:** Log secret values in deployment scripts

### 3. Repository Access

- ✅ **DO:** Use deploy keys with read-only access when possible
- ✅ **DO:** Limit deployment to specific branches (main/master)
- ❌ **DON'T:** Grant write access to GitHub Actions unnecessarily

### 4. Monitoring

- ✅ **DO:** Review GitHub Actions logs regularly
- ✅ **DO:** Set up notifications for failed deployments
- ✅ **DO:** Monitor PythonAnywhere error logs after deployments

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PythonAnywhere Help Pages](https://help.pythonanywhere.com/)
- [SSH Key Authentication Guide](https://www.ssh.com/academy/ssh/public-key-authentication)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

## 🆘 Support

If you encounter issues:

1. **Check GitHub Actions logs** - Shows exact error messages
2. **Check PythonAnywhere error logs** - `/var/log/username.pythonanywhere.com.error.log`
3. **Verify all secrets are set** - Settings → Secrets and variables → Actions
4. **Test SSH connection manually** - Helps isolate connection issues
5. **Review this guide's Troubleshooting section**

---

**Last Updated:** 2026-01-25
**Version:** 1.0.0
