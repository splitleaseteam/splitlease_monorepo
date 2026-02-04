# PythonAnywhere to Supabase Migration Analysis

**Date:** 2026-01-31
**Status:** Analysis Complete - Awaiting Action

---

## Executive Summary

The pythonAnywhere directory contains 3 Flask applications (mysite, mysite2, mysite3) providing backend services for Split Lease. This analysis identifies which functionality can be migrated to Supabase native features (Edge Functions, pg_cron, Postgres functions, Storage) versus what requires external services.

---

## Current PythonAnywhere Inventory

### mysite (Primary Application)

| Module | Current Function | Files |
|--------|------------------|-------|
| **Lease document generation (Supabase)** | Generate DOCX legal documents from templates | `supabase/functions/lease-documents/` |
| **Calendar Automation** | Google Calendar OAuth + Meet link creation | `calendar_automation/routes.py`, `google_calendar_service.py`, `bubble_service.py` |
| **Document Parser** | Parse Google Docs | `doc_parser/google_doc_parser.py` |
| **House Manual PDF** | Generate house manual PDFs | `house_manual_pdf/house_manual_generator.py` |
| **Curated Listings PDF** | Generate curated listings PDFs | `curated_listings_pdf/curated_listings_generator.py` |
| **Google Drive Upload** | Upload files to Google Drive | `google_drive/uploader.py` |
| **Database Checker** | Validate Bubble data integrity | `database_checker/main.py`, `datatypes/` |
| **Slack Events** | Slack Events API webhook handler | `slack_events/routes.py`, `event_handler.py` |
| **User Search** | Slack slash command for user lookup | `user_search_module/` |
| **Knowledge Search** | Slack slash command for knowledge lookup | `knowledge_search_module/` |
| **Signup Automation** | Slack-triggered signup flows | `signup_automation_zap/` |
| **Health Monitoring** | Health checks + Slack alerts | `core/monitoring/` |
| **Logging** | Dual Slack webhook logging (success/error) | `logging/error_logger.py`, `success_logger.py` |

### mysite2 (Utility Services)

| Module | Current Function |
|--------|------------------|
| **URL Shortener** | Database-backed short URLs with analytics |
| **QR Generator** | Generate QR codes for campaigns |
| **Campaign Dashboard** | Track URL shortener performance |

### mysite3 (ML Services)

| Module | Current Function |
|--------|------------------|
| **TensorFlow Model** | Listing matching/recommendation |
| **Embeddings** | Pre-computed listing embeddings |
| **Temporal Encoder** | Time-aware listing availability |

---

## Migration Assessment

### GREEN: Can Be Built Natively in Supabase

| Functionality | Supabase Native Solution | Effort |
|---------------|--------------------------|--------|
| **Database Checker** | pg_cron + Postgres functions + pg_net for Slack | LOW |
| **Health Monitoring** | pg_cron + Postgres functions + Slack webhook | LOW |
| **Logging to Slack** | Already exists in Edge Functions (`_shared/slack.ts`) | DONE |
| **URL Shortener** | Postgres table + Edge Function for redirect | LOW |
| **QR Generator** | Edge Function using Deno QR library | LOW |
| **Signup Automation** | Edge Function triggered by Supabase Auth hooks | MEDIUM |
| **User Search (Slack)** | Edge Function receiving Slack slash commands | MEDIUM |
| **Knowledge Search** | Edge Function + Supabase full-text search | MEDIUM |

### YELLOW: Possible with External Integrations

| Functionality | Supabase Solution | External Dependency |
|---------------|-------------------|---------------------|
| **Calendar Automation** | Edge Function | Google Calendar API (OAuth) |
| **Google Drive Upload** | Edge Function | Google Drive API (Service Account) |
| **House Manual PDF** | Edge Function with PDF library | Supabase Storage for output |
| **Curated Listings PDF** | Edge Function with PDF library | Supabase Storage for output |

### RED: Requires Specialized Infrastructure

| Functionality | Why Not Supabase | Recommendation |
|---------------|------------------|----------------|
| **Lease documents (DOCX)** | DOCX template rendering requires `docxtpl` | Handled by Supabase Edge Functions (`lease-documents`) |
| **TensorFlow Model** | ML inference needs GPU/specialized runtime | Move to Hugging Face Inference API, Replicate, or Cloudflare Workers AI |
| **Embeddings Store** | Vector embeddings for similarity search | Use Supabase pgvector extension |

---

## Detailed Migration Plans

### 1. Database Checker (Priority: HIGH)

**Current:** Flask + Bubble API client + Slack webhook
**Target:** pg_cron + Postgres function + pg_net

```sql
-- Create validation function
CREATE OR REPLACE FUNCTION run_listing_checks()
RETURNS void AS $$
DECLARE
  issues jsonb;
BEGIN
  -- Run checks on listings table
  SELECT jsonb_agg(check_result) INTO issues
  FROM (
    SELECT
      id,
      CASE
        WHEN title IS NULL THEN 'Missing title'
        WHEN price_per_night < 0 THEN 'Invalid price'
        -- Add more checks
      END as check_result
    FROM listing
    WHERE status = 'active'
  ) checks
  WHERE check_result IS NOT NULL;

  -- Send to Slack via pg_net
  IF issues IS NOT NULL THEN
    PERFORM net.http_post(
      'https://hooks.slack.com/...',
      jsonb_build_object('text', issues::text)
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron
SELECT cron.schedule('daily-listing-check', '0 9 * * *', 'SELECT run_listing_checks()');
```

### 2. URL Shortener (Priority: MEDIUM)

**Current:** Flask + SQLite + redirect logic
**Target:** Supabase table + Edge Function

```sql
-- Table
CREATE TABLE short_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code text UNIQUE NOT NULL,
  long_url text NOT NULL,
  clicks integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

Edge Function for redirect already supported pattern.

### 3. QR Generator (Priority: LOW)

**Current:** Flask + qrcode library
**Target:** Edge Function using `https://deno.land/x/qrcode`

```typescript
import { qrcode } from "https://deno.land/x/qrcode/mod.ts";

Deno.serve(async (req) => {
  const { url } = await req.json();
  const base64 = await qrcode(url);
  return new Response(JSON.stringify({ qr_code: base64 }));
});
```

### 4. Calendar Automation (Priority: HIGH)

**Current:** Flask + Google Calendar OAuth + Bubble API
**Target:** Edge Function with Google Calendar API

The existing `virtual-meeting/` Edge Function already handles meeting lifecycle. Extend it to:
1. Create Google Meet links via Google Calendar API
2. Send calendar invites

**Blockers:**
- Requires OAuth token storage (use Supabase Vault)
- Google Workspace domain verification for Meet links

### 5. PDF Generation (Priority: MEDIUM)

**Current:** Flask + python libraries (reportlab, weasyprint)
**Target:** Edge Function using Deno PDF libraries

Options:
- `pdf-lib` for programmatic PDF creation
- Puppeteer/Playwright in Edge Function (heavy)
- External API: PDFShift, html-pdf-api

Store output in Supabase Storage.

---

## Functionality Already Migrated

These PythonAnywhere functions now have Supabase Edge Function equivalents:

| PythonAnywhere | Supabase Edge Function |
|----------------|------------------------|
| Slack logging | `slack/` |
| User auth | `auth-user/` |
| Proposal CRUD | `proposal/` |
| Listing CRUD | `listing/` |
| Messaging | `messages/` |
| SMS sending | `send-sms/` |
| Email sending | `send-email/` |
| Virtual meetings | `virtual-meeting/` |

---

## Recommended Migration Order

| Phase | Modules | Rationale |
|-------|---------|-----------|
| **Phase 1** | Database Checker, Health Monitoring | Low effort, reduces Bubble dependency |
| **Phase 2** | URL Shortener, QR Generator | Simple CRUD, self-contained |
| **Phase 3** | Calendar Automation | Already have virtual-meeting Edge Function |
| **Phase 4** | PDF Generation | Medium complexity, needs library evaluation |
| **Phase 5** | Lease document generators | Keep in PythonAnywhere or move to external API |
| **Defer** | TensorFlow/ML | Move to specialized ML platform when needed |

---

## Files Referenced

### PythonAnywhere Structure
- [pythonAnywhere/README.md](pythonAnywhere/README.md)
- [pythonAnywhere/mysite/app.py](pythonAnywhere/mysite/app.py)
- [pythonAnywhere/mysite/modules/database_checker/main.py](pythonAnywhere/mysite/modules/database_checker/main.py)
- [pythonAnywhere/mysite/modules/calendar_automation/routes.py](pythonAnywhere/mysite/modules/calendar_automation/routes.py)

### Existing Supabase Edge Functions
- [supabase/functions/virtual-meeting/](supabase/functions/virtual-meeting/)
- [supabase/functions/slack/](supabase/functions/slack/)
- [supabase/functions/_shared/](supabase/functions/_shared/)

---

## Decision Required

1. **Lease document generation**: Keep in PythonAnywhere OR migrate to DocuSign/PandaDoc API?
2. **ML Recommendations**: Defer OR migrate to Cloudflare Workers AI / Hugging Face?
3. **Calendar OAuth**: Store tokens in Supabase Vault OR keep in PythonAnywhere?

---

**Next Steps:** Await user decision on priorities before creating implementation plans.
