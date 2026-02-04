# Implementation Plan: QR Code Landing Page

**Created**: 2026-01-27
**Classification**: BUILD
**Complexity**: Medium-High (Multi-file, Edge Function, Database)
**Estimated Files**: 8-10 new files, 2 modified files

---

## 1. Executive Summary

Migrate the Bubble `qr-code-landing` page to Split Lease's Islands Architecture. This page serves as a contextual landing for users who scan QR codes at properties, displaying use-case-specific information and triggering SMS notifications to hosts and guests.

**URL Pattern**: `/qr-code-landing?qrCodeId=xxx`

---

## 2. Prerequisites & Dependencies

### 2.1 Database Requirements

A new `qr_codes` table is required in Supabase:

```sql
-- Migration: 20260127_create_qr_codes_table.sql

CREATE TABLE public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core fields
  use_case TEXT NOT NULL CHECK (use_case IN ('check_in', 'check_out', 'emergency', 'general_info')),
  display_text TEXT, -- Human-readable use case label
  information_content TEXT, -- Custom message to display

  -- Relationships
  visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,

  -- Contact info for notifications
  host_phone TEXT,
  guest_phone TEXT,
  host_name TEXT,
  guest_name TEXT,
  property_name TEXT,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  scan_count INTEGER DEFAULT 0,
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Public read access (QR codes need to be readable without auth)
CREATE POLICY "QR codes are publicly readable"
  ON public.qr_codes FOR SELECT
  USING (is_active = true);

-- Only authenticated users can create/update
CREATE POLICY "Authenticated users can manage QR codes"
  ON public.qr_codes FOR ALL
  USING (auth.role() = 'authenticated');

-- Index for fast lookups
CREATE INDEX idx_qr_codes_visit_id ON public.qr_codes(visit_id);
CREATE INDEX idx_qr_codes_listing_id ON public.qr_codes(listing_id);

-- Update timestamp trigger
CREATE TRIGGER update_qr_codes_updated_at
  BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### 2.2 Use Case Enum Values

| Value | Display Text | Description |
|-------|-------------|-------------|
| `check_in` | "Check In" | Guest arriving at property |
| `check_out` | "Check Out" | Guest departing property |
| `emergency` | "Emergency" | Emergency contact/info |
| `general_info` | "General Info" | General property information |

---

## 3. Implementation Components

### 3.1 File Structure Overview

```
app/
├── public/
│   └── qr-code-landing.html              # [NEW] HTML template
├── src/
│   ├── qr-code-landing.jsx                # [NEW] Entry point
│   ├── routes.config.js                   # [MODIFY] Add route
│   └── islands/
│       └── pages/
│           └── QrCodeLandingPage/
│               ├── QrCodeLandingPage.jsx  # [NEW] Main component
│               ├── useQrCodeLandingPageLogic.js  # [NEW] Page logic hook
│               └── qrCodeLandingStyles.js # [NEW] Inline styles

supabase/
├── functions/
│   └── qr-codes/                          # [NEW] Edge function
│       ├── index.ts
│       └── README.md
├── migrations/
│   └── 20260127_create_qr_codes_table.sql # [NEW] Database migration
```

---

## 4. Detailed Implementation Steps

### Step 1: Create Database Migration

**File**: `supabase/migrations/20260127_create_qr_codes_table.sql`

Create the `qr_codes` table with:
- Use case enum constraint
- Foreign key relationships to visits, listings, properties
- RLS policies for public read access
- Indexes for performance

**Verification**: Run `supabase db reset` locally to test migration

---

### Step 2: Create Edge Function - `qr-codes`

**File**: `supabase/functions/qr-codes/index.ts`

**Actions to implement**:

#### Action: `get`
Retrieve QR code data by ID.

```typescript
// Request
{
  action: "get",
  payload: {
    qrCodeId: "uuid-string"
  }
}

// Response
{
  success: true,
  data: {
    id: "uuid",
    useCase: "check_in",
    displayText: "Check In",
    informationContent: "Welcome to the property!",
    visitId: "uuid",
    propertyName: "123 Main St",
    hostName: "John",
    guestName: "Jane"
  }
}
```

#### Action: `record_scan`
Record a QR code scan and trigger notifications.

```typescript
// Request
{
  action: "record_scan",
  payload: {
    qrCodeId: "uuid-string"
  }
}

// Response
{
  success: true,
  data: {
    qrCode: { /* full QR code data */ },
    notificationsSent: {
      host: true,
      guest: true
    }
  }
}
```

**Internal Logic for `record_scan`**:
1. Fetch QR code data
2. Increment `scan_count` and update `last_scanned_at`
3. Based on `use_case`, compose appropriate SMS messages
4. Call `send-sms` Edge Function for host notification
5. Call `send-sms` Edge Function for guest notification
6. Return combined result

**SMS Message Templates by Use Case**:

| Use Case | Host Message | Guest Message |
|----------|--------------|---------------|
| `check_in` | "🏠 {guestName} has checked in at {propertyName}" | "Welcome to {propertyName}! Your check-in has been recorded." |
| `check_out` | "👋 {guestName} has checked out of {propertyName}" | "Thank you for staying at {propertyName}! Safe travels." |
| `emergency` | "🚨 EMERGENCY: QR scanned at {propertyName} by {guestName}" | "Emergency services have been notified. Stay calm." |
| `general_info` | (no notification) | (no notification) |

---

### Step 3: Create HTML Template

**File**: `app/public/qr-code-landing.html`

```html
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="QR Code Landing - Split Lease property information">
  <meta name="robots" content="noindex, nofollow">
  <title>Welcome | Split Lease</title>
  <link rel="icon" type="image/png" href="/assets/images/split-lease-purple-circle.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- Hotjar Tracking Code -->
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/qr-code-landing.jsx"></script>
</body>
</html>
```

**Notes**:
- `noindex, nofollow` - QR landing pages should not be indexed
- No Header/Footer for a focused landing experience
- Minimal, fast-loading page

---

### Step 4: Create Entry Point

**File**: `app/src/qr-code-landing.jsx`

```javascript
import React from 'react';
import { createRoot } from 'react-dom/client';
import QrCodeLandingPage from './islands/pages/QrCodeLandingPage/QrCodeLandingPage.jsx';
import { ErrorBoundary } from './islands/shared/ErrorBoundary';
import './styles/main.css';
import './lib/config.js';

/**
 * Extract QR code ID from URL parameters
 * Expected URL: /qr-code-landing?qrCodeId=xxx
 */
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    qrCodeId: params.get('qrCodeId'),
  };
}

function QrCodeLandingPageWrapper() {
  const { qrCodeId } = getUrlParams();

  if (!qrCodeId) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Inter, sans-serif',
        color: '#666'
      }}>
        <p>Invalid QR code link. Please scan the QR code again.</p>
      </div>
    );
  }

  return <QrCodeLandingPage qrCodeId={qrCodeId} />;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QrCodeLandingPageWrapper />
    </ErrorBoundary>
  </React.StrictMode>
);
```

---

### Step 5: Create Page Logic Hook

**File**: `app/src/islands/pages/QrCodeLandingPage/useQrCodeLandingPageLogic.js`

Following the **Hollow Components** pattern, all logic lives in this hook:

```javascript
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase.js';

/**
 * Custom hook for QR Code Landing Page logic
 * Handles data fetching, scan recording, and notification triggering
 */
export function useQrCodeLandingPageLogic(qrCodeId) {
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationStatus, setNotificationStatus] = useState(null);

  useEffect(() => {
    async function fetchAndRecordScan() {
      try {
        setLoading(true);
        setError(null);

        // Call Edge Function to get QR code data AND record the scan
        const { data, error: fetchError } = await supabase.functions.invoke('qr-codes', {
          body: {
            action: 'record_scan',
            payload: { qrCodeId }
          }
        });

        if (fetchError) {
          throw new Error(fetchError.message || 'Failed to load QR code data');
        }

        if (!data?.success) {
          throw new Error(data?.error || 'QR code not found');
        }

        setQrCodeData(data.data.qrCode);
        setNotificationStatus(data.data.notificationsSent);

      } catch (err) {
        console.error('QR code fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (qrCodeId) {
      fetchAndRecordScan();
    }
  }, [qrCodeId]);

  // Handler for viewing full house manual
  const handleViewHouseManual = () => {
    if (qrCodeData?.visitId) {
      // Open in new tab - matches Bubble behavior
      window.open(`/guest-house-manual?visitId=${qrCodeData.visitId}`, '_blank');
    }
  };

  return {
    qrCodeData,
    loading,
    error,
    notificationStatus,
    handleViewHouseManual,
    hasVisit: Boolean(qrCodeData?.visitId),
  };
}
```

---

### Step 6: Create Styles Module

**File**: `app/src/islands/pages/QrCodeLandingPage/qrCodeLandingStyles.js`

```javascript
/**
 * Inline styles for QR Code Landing Page
 * Matches Split Lease brand colors and typography
 */

export const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    backgroundColor: '#FAFAFA',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    padding: '32px',
    maxWidth: '420px',
    width: '100%',
    textAlign: 'center',
  },

  welcomeText: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#6B4EFF', // Split Lease purple
    marginBottom: '8px',
    marginTop: 0,
  },

  useCaseText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: '24px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  divider: {
    height: '1px',
    backgroundColor: '#E5E7EB',
    width: '100%',
    margin: '24px 0',
  },

  infoBox: {
    backgroundColor: '#F3F0FF', // Light purple
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
    textAlign: 'left',
  },

  infoText: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#374151',
    margin: 0,
  },

  button: {
    backgroundColor: '#6B4EFF',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '9999px', // Pill shape
    padding: '14px 28px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.1s',
    width: '100%',
  },

  buttonHover: {
    backgroundColor: '#5A3FE0',
  },

  buttonDisabled: {
    backgroundColor: '#D1D5DB',
    cursor: 'not-allowed',
  },

  logo: {
    marginTop: '32px',
    width: '140px',
    height: 'auto',
  },

  // Loading state
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontFamily: 'Inter, sans-serif',
  },

  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #E5E7EB',
    borderTopColor: '#6B4EFF',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  loadingText: {
    marginTop: '16px',
    color: '#6B7280',
    fontSize: '14px',
  },

  // Error state
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
    fontFamily: 'Inter, sans-serif',
    textAlign: 'center',
  },

  errorIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },

  errorTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: '8px',
  },

  errorMessage: {
    fontSize: '14px',
    color: '#6B7280',
    maxWidth: '300px',
  },
};

// Use case specific colors/icons
export const useCaseConfig = {
  check_in: {
    icon: '🏠',
    color: '#10B981', // Green
    displayText: 'Check In',
  },
  check_out: {
    icon: '👋',
    color: '#F59E0B', // Amber
    displayText: 'Check Out',
  },
  emergency: {
    icon: '🚨',
    color: '#DC2626', // Red
    displayText: 'Emergency',
  },
  general_info: {
    icon: 'ℹ️',
    color: '#6B4EFF', // Purple
    displayText: 'Property Info',
  },
};
```

---

### Step 7: Create Main Page Component

**File**: `app/src/islands/pages/QrCodeLandingPage/QrCodeLandingPage.jsx`

```javascript
import React, { useState } from 'react';
import { useQrCodeLandingPageLogic } from './useQrCodeLandingPageLogic.js';
import { styles, useCaseConfig } from './qrCodeLandingStyles.js';

/**
 * QR Code Landing Page
 *
 * Displays contextual information based on QR code use case.
 * Automatically triggers SMS notifications on page load.
 *
 * @param {Object} props
 * @param {string} props.qrCodeId - The QR code ID from URL params
 */
export default function QrCodeLandingPage({ qrCodeId }) {
  const {
    qrCodeData,
    loading,
    error,
    handleViewHouseManual,
    hasVisit,
  } = useQrCodeLandingPageLogic(qrCodeId);

  const [buttonHovered, setButtonHovered] = useState(false);

  // Loading state
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Loading property information...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.errorContainer}>
        <span style={styles.errorIcon}>⚠️</span>
        <h2 style={styles.errorTitle}>Unable to Load</h2>
        <p style={styles.errorMessage}>{error}</p>
        <img
          src="/assets/images/split-lease-purple-logo.png"
          alt="Split Lease"
          style={{ ...styles.logo, marginTop: '48px' }}
        />
      </div>
    );
  }

  const useCase = qrCodeData?.useCase || 'general_info';
  const config = useCaseConfig[useCase] || useCaseConfig.general_info;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <h1 style={styles.welcomeText}>Welcome!</h1>
        <p style={styles.useCaseText}>
          <span style={{ marginRight: '6px' }}>{config.icon}</span>
          {qrCodeData?.displayText || config.displayText}
        </p>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Information Box */}
        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            {qrCodeData?.informationContent || getDefaultMessage(useCase, qrCodeData)}
          </p>
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* View House Manual Button */}
        {hasVisit && (
          <button
            style={{
              ...styles.button,
              ...(buttonHovered ? styles.buttonHover : {}),
            }}
            onMouseEnter={() => setButtonHovered(true)}
            onMouseLeave={() => setButtonHovered(false)}
            onClick={handleViewHouseManual}
          >
            View Full House Manual
          </button>
        )}

        {/* Logo */}
        <img
          src="/assets/images/split-lease-purple-logo.png"
          alt="Split Lease"
          style={styles.logo}
        />
      </div>
    </div>
  );
}

/**
 * Get default message based on use case
 */
function getDefaultMessage(useCase, qrCodeData) {
  const propertyName = qrCodeData?.propertyName || 'the property';

  const messages = {
    check_in: `Welcome to ${propertyName}! Your check-in has been recorded and the host has been notified. We hope you have a wonderful stay.`,
    check_out: `Thank you for staying at ${propertyName}! Your check-out has been recorded. We hope to see you again soon. Safe travels!`,
    emergency: `Emergency assistance has been requested. The property host has been notified immediately. If this is a life-threatening emergency, please also call 911.`,
    general_info: `Welcome to ${propertyName}! Use the button below to access the full house manual with WiFi details, appliance instructions, and local recommendations.`,
  };

  return messages[useCase] || messages.general_info;
}
```

---

### Step 8: Update Route Configuration

**File**: `app/src/routes.config.js`

Add the following route object to the `routes` array:

```javascript
{
  path: '/qr-code-landing',
  file: 'qr-code-landing.html',
  aliases: ['/qr-code-landing.html'],
  protected: false,
  cloudflareInternal: true,
  internalName: 'qr-code-landing-view',
  hasDynamicSegment: false, // Using query params, not path segments
},
```

**After modification**: Run `bun run generate-routes`

---

### Step 9: Create Edge Function

**File**: `supabase/functions/qr-codes/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createErrorResponse, createSuccessResponse } from '../_shared/responses.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    const { action, payload } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'get':
        return await handleGet(supabase, payload);

      case 'record_scan':
        return await handleRecordScan(supabase, payload);

      case 'health':
        return createSuccessResponse({ status: 'healthy', timestamp: new Date().toISOString() });

      default:
        return createErrorResponse(`Unknown action: ${action}`, 400);
    }
  } catch (error) {
    console.error('QR Codes function error:', error);
    return createErrorResponse(error.message || 'Internal server error', 500);
  }
});

/**
 * Get QR code data by ID
 */
async function handleGet(supabase: any, payload: { qrCodeId: string }) {
  const { qrCodeId } = payload;

  if (!qrCodeId) {
    return createErrorResponse('qrCodeId is required', 400);
  }

  const { data, error } = await supabase
    .from('qr_codes')
    .select(`
      id,
      use_case,
      display_text,
      information_content,
      visit_id,
      listing_id,
      property_id,
      property_name,
      host_name,
      guest_name,
      is_active
    `)
    .eq('id', qrCodeId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('QR code fetch error:', error);
    return createErrorResponse('QR code not found', 404);
  }

  return createSuccessResponse({
    id: data.id,
    useCase: data.use_case,
    displayText: data.display_text,
    informationContent: data.information_content,
    visitId: data.visit_id,
    listingId: data.listing_id,
    propertyId: data.property_id,
    propertyName: data.property_name,
    hostName: data.host_name,
    guestName: data.guest_name,
  });
}

/**
 * Record a QR code scan and send notifications
 */
async function handleRecordScan(supabase: any, payload: { qrCodeId: string }) {
  const { qrCodeId } = payload;

  if (!qrCodeId) {
    return createErrorResponse('qrCodeId is required', 400);
  }

  // Fetch QR code data
  const { data: qrCode, error: fetchError } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('id', qrCodeId)
    .eq('is_active', true)
    .single();

  if (fetchError || !qrCode) {
    console.error('QR code fetch error:', fetchError);
    return createErrorResponse('QR code not found', 404);
  }

  // Update scan count and timestamp
  const { error: updateError } = await supabase
    .from('qr_codes')
    .update({
      scan_count: (qrCode.scan_count || 0) + 1,
      last_scanned_at: new Date().toISOString(),
    })
    .eq('id', qrCodeId);

  if (updateError) {
    console.error('Scan count update error:', updateError);
    // Non-blocking - continue with notifications
  }

  // Send notifications based on use case
  const notificationsSent = await sendNotifications(qrCode);

  return createSuccessResponse({
    qrCode: {
      id: qrCode.id,
      useCase: qrCode.use_case,
      displayText: qrCode.display_text,
      informationContent: qrCode.information_content,
      visitId: qrCode.visit_id,
      propertyName: qrCode.property_name,
      hostName: qrCode.host_name,
      guestName: qrCode.guest_name,
    },
    notificationsSent,
  });
}

/**
 * Send SMS notifications based on use case
 */
async function sendNotifications(qrCode: any): Promise<{ host: boolean; guest: boolean }> {
  const result = { host: false, guest: false };

  // Skip notifications for general_info use case
  if (qrCode.use_case === 'general_info') {
    return result;
  }

  const { host_phone, guest_phone, property_name, guest_name, use_case } = qrCode;
  const publicSmsNumber = '+14155692985'; // Whitelisted for unauthenticated SMS

  // Compose messages based on use case
  const messages = getNotificationMessages(use_case, property_name, guest_name);

  // Send to host
  if (host_phone && messages.host) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          action: 'send',
          payload: {
            to: host_phone,
            from: publicSmsNumber,
            body: messages.host,
          },
        }),
      });

      const data = await response.json();
      result.host = data.success === true;
    } catch (error) {
      console.error('Host SMS error:', error);
    }
  }

  // Send to guest
  if (guest_phone && messages.guest) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          action: 'send',
          payload: {
            to: guest_phone,
            from: publicSmsNumber,
            body: messages.guest,
          },
        }),
      });

      const data = await response.json();
      result.guest = data.success === true;
    } catch (error) {
      console.error('Guest SMS error:', error);
    }
  }

  return result;
}

/**
 * Get notification messages for each use case
 */
function getNotificationMessages(
  useCase: string,
  propertyName: string,
  guestName: string
): { host: string | null; guest: string | null } {
  const property = propertyName || 'the property';
  const guest = guestName || 'A guest';

  switch (useCase) {
    case 'check_in':
      return {
        host: `🏠 ${guest} has checked in at ${property}`,
        guest: `Welcome to ${property}! Your check-in has been recorded.`,
      };
    case 'check_out':
      return {
        host: `👋 ${guest} has checked out of ${property}`,
        guest: `Thank you for staying at ${property}! Safe travels.`,
      };
    case 'emergency':
      return {
        host: `🚨 EMERGENCY: QR scanned at ${property} by ${guest}`,
        guest: `Emergency services have been notified. Stay calm and call 911 if needed.`,
      };
    default:
      return { host: null, guest: null };
  }
}
```

---

## 5. Testing Checklist

### 5.1 Unit Tests

- [ ] `useQrCodeLandingPageLogic` hook - data fetching
- [ ] `useQrCodeLandingPageLogic` hook - error handling
- [ ] Default message generation per use case
- [ ] Style configuration for each use case

### 5.2 Integration Tests

- [ ] Edge function `get` action returns correct data
- [ ] Edge function `record_scan` updates scan_count
- [ ] Edge function `record_scan` triggers SMS notifications
- [ ] SMS messages contain correct content per use case

### 5.3 E2E Tests

- [ ] Navigate to `/qr-code-landing?qrCodeId=valid-id` - shows content
- [ ] Navigate to `/qr-code-landing?qrCodeId=invalid-id` - shows error
- [ ] Navigate to `/qr-code-landing` (no param) - shows invalid link message
- [ ] "View Full House Manual" button opens new tab with correct URL
- [ ] Page renders correctly on mobile viewport

### 5.4 Manual Testing

- [ ] Scan actual QR code with phone camera
- [ ] Verify SMS received by host
- [ ] Verify SMS received by guest
- [ ] Test all four use cases (check_in, check_out, emergency, general_info)

---

## 6. Deployment Steps

1. **Database Migration**
   ```bash
   supabase db push  # Apply migration to dev
   ```

2. **Edge Function Deployment**
   ```bash
   supabase functions deploy qr-codes
   ```

3. **Frontend Build**
   ```bash
   cd app
   bun run generate-routes  # Update route files
   bun run build            # Production build
   ```

4. **Cloudflare Deployment**
   ```bash
   /deploy  # or: npx wrangler pages deploy dist --project-name splitlease
   ```

---

## 7. Post-Implementation Tasks

1. **Create QR Code Generation UI** (separate ticket)
   - Admin interface to create QR codes linked to visits
   - Generate downloadable/printable QR code images

2. **Analytics Dashboard** (separate ticket)
   - Track scan counts per QR code
   - View scan timestamps and patterns

3. **Emergency Protocol Integration** (separate ticket)
   - Connect emergency use case to on-call system
   - Add escalation workflows

---

## 8. Rollback Plan

If issues are discovered post-deployment:

1. **Frontend**: Revert commit and redeploy to Cloudflare
2. **Edge Function**: Deploy previous version via Supabase dashboard
3. **Database**: Migration includes standard fields - no destructive changes

---

## 9. Files Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/20260127_create_qr_codes_table.sql` | CREATE | Database table for QR codes |
| `supabase/functions/qr-codes/index.ts` | CREATE | Edge function for data + notifications |
| `app/public/qr-code-landing.html` | CREATE | HTML template |
| `app/src/qr-code-landing.jsx` | CREATE | React entry point |
| `app/src/islands/pages/QrCodeLandingPage/QrCodeLandingPage.jsx` | CREATE | Main page component |
| `app/src/islands/pages/QrCodeLandingPage/useQrCodeLandingPageLogic.js` | CREATE | Page logic hook |
| `app/src/islands/pages/QrCodeLandingPage/qrCodeLandingStyles.js` | CREATE | Inline styles |
| `app/src/routes.config.js` | MODIFY | Add route entry |

---

**Plan Status**: Ready for Review
**Next Step**: User approval, then execute via plan-executor

---

*Generated by implementation-planner • 2026-01-27*
