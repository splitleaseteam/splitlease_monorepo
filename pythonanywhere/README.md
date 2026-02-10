# Split Lease - PythonAnywhere Backend Services

Flask-based microservices platform hosted on PythonAnywhere, providing backend services for the Split Lease rental marketplace.

## 🏗️ Architecture

This repository contains three Flask applications:

```
pythonanywhere/
├── mysite/      # Primary application (Slack integration, document processing)
├── mysite2/     # Utility services (URL shortener, QR generator)
└── mysite3/     # ML services (TensorFlow-based listing matching)
```

## 🚀 Applications

### **mysite** (Primary Application)

Main service hub with comprehensive feature set:

| Module | Purpose |
|--------|---------|
| **Slack Events** | Universal webhook endpoint for Slack Events API with HMAC signature verification |
| **Calendar Automation** | Google Calendar OAuth integration for automated booking management |
| **Document Parser** | Parse and extract data from various document formats |
| **PDF Generators** | Create:<br>• House Manual PDFs<br>• Curated Listings PDFs |
| **Google Drive Integration** | Upload generated documents to Google Drive |
| **User/Knowledge Search** | Slack slash commands integrated with Bubble.io backend |
| **Database Checker** | Validate data integrity across datatypes (listings, properties, proposals, users) |
| **Health Monitoring** | Resilient health check system with Slack notifications |
| **Logging** | Dual Slack webhook integration (success + error channels) |

### **mysite2** (Utility Services)

| Module | Purpose |
|--------|---------|
| **URL Shortener** | Database-backed URL shortening with access tracking and analytics |
| **QR Generator** | Generate QR codes for campaigns and listings |
| **Campaign Dashboard** | Track URL shortener campaign performance |

### **mysite3** (ML Services)

| Module | Purpose |
|--------|---------|
| **TensorFlow Model** | Listing matching and recommendation engine |
| **Embeddings** | Pre-computed listing embeddings for fast similarity search |
| **Temporal Encoder** | Time-aware listing availability encoding |

## 📋 Prerequisites

- **Python 3.9+**
- **Flask 2.x**
- **SQLite** (or PostgreSQL for production)
- **Google Cloud Platform** account (for Calendar/Drive APIs)
- **Slack App** (for Events API and webhooks)
- **PythonAnywhere** account (for hosting)

## ⚙️ Setup

### 1. Clone Repository

```bash
git clone https://github.com/splitleaseteam/splitlease.git
cd pythonanywhere
```

### 2. Install Dependencies

For each application (mysite, mysite2, mysite3):

```bash
cd mysite
pip install --user -r requirements.txt
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Flask
SECRET_KEY=your-secret-key-here
BASE_URL=https://your-site.pythonanywhere.com

# Database
DATABASE_URL=sqlite:///splitlease.db

# Slack Webhooks
SUCCESS_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SUCCESS/WEBHOOK
ERROR_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/ERROR/WEBHOOK
MONITORING_SUCCESS_WEBHOOK=https://hooks.slack.com/services/YOUR/MONITORING/WEBHOOK
MONITORING_ERROR_WEBHOOK=https://hooks.slack.com/services/YOUR/MONITORING_ERROR/WEBHOOK

# Slack Events API
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token

# Google APIs
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_DRIVE_FOLDER_ID=your-folder-id

# Bubble.io Integration
BUBBLE_API_KEY=your-bubble-api-key
BUBBLE_API_URL=https://your-app.bubbleapps.io/api/1.1
```

### 4. Initialize Database

```bash
cd mysite
python -c "from app import db; db.create_all()"
```

### 5. Deploy to PythonAnywhere

#### Option A: Git Deployment (Recommended)

```bash
# On PythonAnywhere console
cd /home/YourUsername
git clone https://github.com/splitleaseteam/splitlease.git mysite
cd mysite
pip3 install --user -r requirements.txt

# Set environment variables via .env file or PythonAnywhere Web tab
cp .env.example .env
nano .env  # Edit with your credentials
```

#### Option B: Manual Upload

1. Upload files via PythonAnywhere Files tab
2. Install dependencies: `pip3 install --user -r requirements.txt`
3. Set environment variables in Web tab

### 6. Configure WSGI

Edit `/var/www/your_username_pythonanywhere_com_wsgi.py`:

```python
import sys
import os
from dotenv import load_dotenv

# Add your project directory to the sys.path
project_home = '/home/YourUsername/mysite'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Load environment variables
load_dotenv(os.path.join(project_home, '.env'))

# Import Flask app
from app import app as application
```

### 7. Reload Web App

Go to PythonAnywhere **Web** tab → Click **"Reload"**

## 🔒 Security

### Sensitive Files (Gitignored)

The following files contain secrets and are **never** committed to version control:

- `.env` - Environment variables with API keys, webhooks, secrets
- `config.py` - Application configuration with sensitive data
- `credentials/` - OAuth tokens and service account keys
- `*.log` - Application logs (may contain sensitive data)
- `temp/` - Generated documents with user data
- `*.db` - SQLite databases with user data

### Environment Variables

Always use environment variables for sensitive configuration:

```python
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')  # ✅ GOOD
SECRET_KEY = 'hardcoded-secret'       # ❌ BAD
```

### Slack Signature Verification

All Slack webhook endpoints verify request signatures:

```python
def verify_slack_signature(request):
    timestamp = request.headers.get('X-Slack-Request-Timestamp')
    signature = request.headers.get('X-Slack-Signature')

    # Reject requests older than 5 minutes (replay attack prevention)
    if abs(time.time() - int(timestamp)) > 60 * 5:
        return False

    # Verify HMAC-SHA256 signature
    sig_basestring = f"v0:{timestamp}:{request.get_data().decode('utf-8')}"
    expected_signature = 'v0=' + hmac.new(
        SLACK_SIGNING_SECRET.encode(),
        sig_basestring.encode(),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected_signature, signature)
```

## API Endpoints

### Health & Monitoring

```bash
GET  /health                    # Application health check
GET  /monitoring/health         # Detailed health check with dependencies
GET  /monitoring/test           # Run health tests
```

### Slack Integration

```bash
POST /slack/events              # Slack Events API webhook (all event types)
GET  /slack/health              # Slack Events health check
GET  /slack/test-config         # Verify Slack configuration
POST /slack/user-search         # User search slash command
POST /slack/knowledge-search    # Knowledge search slash command
```

### Contract Generation

```bash
POST /contract/periodic-tenancy         # Generate periodic tenancy agreement
POST /contract/host-payout              # Generate host payout schedule
POST /contract/credit-card-auth         # Generate credit card authorization (prorated)
POST /contract/credit-card-auth-nonprorated  # Generate credit card auth (non-prorated)
POST /contract/supplemental             # Generate supplemental agreement
```

### Document Services

```bash
POST /doc-parser                # Parse Google Docs
POST /house-manual/generate     # Generate house manual PDF
POST /curated-listings/generate # Generate curated listings PDF
POST /google-drive/upload       # Upload document to Google Drive
```

### URL Shortener (mysite2)

```bash
POST /shorten                   # Create short URL
GET  /{short_code}              # Redirect to long URL
GET  /stats/{short_code}        # Get URL statistics
GET  /dashboard                 # Campaign dashboard
```

### QR Generator (mysite2)

```bash
POST /qr/generate               # Generate QR code
```

## 🧪 Testing

### Run Health Checks

```bash
# Test all endpoints
curl https://your-site.pythonanywhere.com/health

# Test Slack Events configuration
curl https://your-site.pythonanywhere.com/slack/test-config

# Test monitoring
curl https://your-site.pythonanywhere.com/monitoring/test
```

### Run Database Checker

```bash
cd mysite/modules/database_checker
python run.py
```

### View Logs

```bash
# PythonAnywhere error log
tail -f /var/log/your_username.pythonanywhere.com.error.log

# Application logs (if file logging enabled)
tail -f mysite/logs/app.log

# Slack events audit log
tail -f mysite/logs/slack_events/T1234567890.log
```

## 📦 Project Structure

```
pythonanywhere/
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules (sensitive files)
├── README.md                       # This file
│
├── mysite/                         # Primary application
│   ├── app.py                      # Flask application entry point
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example                # Environment variables template
│   │
│   ├── modules/
│   │   ├── slack_events/           # Slack Events API integration
│   │   │   ├── routes.py           # Webhook endpoints
│   │   │   ├── event_handler.py    # Event processing logic
│   │   │   └── README.md           # Slack Events documentation
│   │   │
│   │   ├── calendar_automation/    # Google Calendar integration
│   │   ├── google_drive/           # Google Drive upload
│   │   ├── doc_parser/             # Document parsing
│   │   ├── house_manual_pdf/       # House manual PDF generator
│   │   ├── curated_listings_pdf/   # Curated listings PDF generator
│   │   ├── database_checker/       # Data validation
│   │   ├── user_search_module/     # User search Slack command
│   │   ├── knowledge_search_module/ # Knowledge search Slack command
│   │   │
│   │   ├── logging/                # Slack webhook logging
│   │   │   ├── error_logger.py
│   │   │   └── success_logger.py
│   │   │
│   │   └── core/                   # Core utilities
│   │       ├── monitoring/         # Health checks
│   │       ├── resilient_app.py    # Flask app wrapper
│   │       └── resilient_blueprint.py
│   │
│   └── daily-login-check/          # Automated daily login script
│
├── mysite2/                        # Utility services
│   ├── app.py
│   ├── modules/
│   │   ├── url_shortener/          # URL shortening service
│   │   │   ├── routes.py
│   │   │   ├── models.py           # Database models
│   │   │   ├── url_shortener.py    # Core logic
│   │   │   └── README.md
│   │   └── qr_generator/           # QR code generation
│   │
│   └── templates/
│       ├── dashboard.html          # URL shortener dashboard
│       └── campaign_dashboard.html
│
└── mysite3/                        # ML services
    ├── app.py
    ├── tf_model.py                 # TensorFlow model
    ├── listing_embeddings.npz      # Pre-computed embeddings
    ├── listing_preprocessor.py
    ├── temporal_encoder.py
    └── query_processor.py
```

## 🚀 Automated Deployment

This repository includes **automated deployment** via GitHub Actions!

**Quick Start:**
1. See [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md) - Quick guide to configure GitHub Secrets
2. See [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment setup guide

**What happens automatically:**
- Push to `main` branch → GitHub Actions deploys to PythonAnywhere
- Pulls latest code, installs dependencies, reloads web app
- Zero downtime deployments

**Manual deployment (if needed):**
```bash
cd /home/YourUsername/mysite
git pull origin main
pip3 install --user -r requirements.txt  # If dependencies changed

# Reload web app in PythonAnywhere Web tab
```

---

## 🔄 Common Tasks

### Add New Slack Event Handler

1. Edit `mysite/modules/slack_events/event_handler.py`
2. Add new handler method:
   ```python
   def _handle_custom_event(self, event_data, team_id, api_app_id, channel_id):
       logger.info(f"Custom event: {event_data}")
       return {'status': 'success'}
   ```
3. Route event in `process_event()`:
   ```python
   elif event_type == 'custom_event':
       return self._handle_custom_event(event_data, team_id, api_app_id, channel_id)
   ```
4. Deploy and reload web app

### Rotate Secrets

1. Generate new secrets in service provider (Slack, Google, etc.)
2. Update `.env` file on PythonAnywhere
3. Reload web app
4. Test endpoints to verify new secrets work
5. Revoke old secrets

### View Application Metrics

```bash
# Database size
du -sh mysite/*.db

# Log file sizes
du -sh mysite/logs/*

# Disk usage
df -h

# Memory usage
free -h
```

## 🐛 Troubleshooting

### Slack Events Not Received

**Problem:** Slack Events API shows errors or events aren't being processed

**Solutions:**
1. Verify URL: `https://your-site.pythonanywhere.com/slack/events`
2. Check signing secret: `curl https://your-site.pythonanywhere.com/slack/test-config`
3. Verify bot is invited to channel: `/invite @botname`
4. Check logs: `tail -f /var/log/your_username.pythonanywhere.com.error.log`
5. Ensure web app is reloaded after deployment

### Contract Generation Fails

**Problem:** Contract generation returns errors

**Solutions:**
1. Check template files exist in `modules/templates/`
2. Verify Google Drive credentials are valid
3. Check temp directory is writable: `ls -la mysite/modules/temp/`
4. Review error logs for specific issues

### Database Errors

**Problem:** SQLite database locked or corrupted

**Solutions:**
```bash
# Check database integrity
sqlite3 mysite/splitlease.db "PRAGMA integrity_check;"

# Backup database
cp mysite/splitlease.db mysite/splitlease.db.backup

# Reset database (WARNING: destroys data)
rm mysite/splitlease.db
python -c "from app import db; db.create_all()"
```

### 500 Internal Server Error

**Problem:** Application returning 500 errors

**Solutions:**
1. Check error log: `tail -50 /var/log/your_username.pythonanywhere.com.error.log`
2. Verify all environment variables are set
3. Test imports: `python -c "from app import app"`
4. Check file permissions
5. Verify WSGI configuration

## 📖 Documentation

- [Slack Events README](mysite/modules/slack_events/README.md) - Detailed Slack Events API integration guide
- [URL Shortener README](mysite2/modules/url_shortener/README.md) - URL shortener documentation

## 🤝 Contributing

When contributing to this repository:

1. **Never commit sensitive files:**
   - `.env` files
   - `config.py` with real credentials
   - OAuth tokens in `credentials/`
   - Database files (`.db`)
   - Log files (`.log`)
   - Generated documents with user data

2. **Always use `.env.example` for documentation**

3. **Test locally before deploying to PythonAnywhere**

4. **Update this README if adding new features or endpoints**

## 📜 License

Proprietary - Split Lease

## 📧 Support

For issues or questions:
- Check PythonAnywhere error logs
- Review service provider documentation (Slack, Google, etc.)
- Check module-specific README files

---

**Last Updated:** 2026-01-25
**Version:** 1.0.0
