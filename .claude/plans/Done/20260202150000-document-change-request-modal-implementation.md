# Document Change Request Modal - Implementation Plan

**Created**: 2026-02-02 15:00:00
**Task Type**: BUILD
**Complexity**: Medium
**Estimated Files**: 10 files (3 new, 7 modified)

---

## Executive Summary

Create a shared modal component that allows hosts and guests to submit change requests for draft documents with Slack notifications. This feature enables collaborative document editing workflows where users can request modifications to lease documents before finalization.

---

## Requirements Analysis

### Functional Requirements

1. **Modal Component** (`DocumentChangeRequestModal.jsx`)
   - Modal overlay with form interface
   - Document selector dropdown (populated with draft documents)
   - Freeform text input for change request description
   - Submit button with loading state
   - Accessible to both host and guest user types

2. **Form Fields**
   - Document selection (required): Dropdown showing available draft documents
   - Change request text (required): Multi-line text input
   - User context (automatic): Capture whether submitter is host or guest

3. **Backend Integration**
   - Create Edge Function action to handle document change requests
   - Store submissions in Supabase database
   - Send Slack notification via webhook (existing `_shared/slack.ts` utilities)

4. **Slack Notification Format**
   - User type (Host/Guest)
   - User name and email
   - Document name
   - Change request text (truncated if long)
   - Link to view full request details (if applicable)

5. **Integration Points**
   - Trigger modal from document viewing contexts
   - Pass current document ID as default selection (if applicable)
   - Handle success/error states with user feedback

### Non-Functional Requirements

- Follow Islands Architecture (independent React root)
- Use hollow component pattern (logic in `useDocumentChangeRequestLogic` hook)
- Use action-based Edge Function pattern (`{ action, payload }`)
- Leverage existing Slack webhook configuration in `_shared/slack.ts`
- Match existing modal patterns (EditPhoneNumberModal, NotificationSettingsModal)
- Mobile-responsive (bottom sheet on < 480px)

---

## Architecture Decisions

### 1. Modal Location

**Decision**: Place in `app/src/islands/shared/DocumentChangeRequestModal/`

**Rationale**:
- Shared component used across multiple contexts (document viewing, listing dashboard)
- Not page-specific, not modal-specific (more than a simple modal)
- Feature module pattern (modal + logic hook + types)

**Alternative Considered**: `app/src/islands/modals/` - Rejected because this is a feature module with multiple files, not just a modal

### 2. Edge Function Strategy

**Decision**: Extend existing `document` Edge Function with new `request_change` action

**Rationale**:
- Existing `document` function already handles document-related operations
- Follows action-based routing pattern
- Avoids creating new Edge Function for single action
- Document change requests are logically related to document management

**Alternative Considered**: New `document-change-request` function - Rejected as over-engineering

### 3. Database Storage

**Decision**: Create new `document_change_request` table

**Rationale**:
- Dedicated table for tracking change requests
- Allows querying/filtering by document, user, status
- Future extensibility (status tracking, threading, resolutions)

**Fields**:
```sql
_id (text, primary key)
document_id (text, foreign key to documentssent)
user_id (text, foreign key to user)
user_email (text)
user_name (text)
user_type (text) -- 'Host' or 'Guest'
request_text (text)
status (text) -- 'pending', 'reviewed', 'resolved'
created_at (timestamptz)
updated_at (timestamptz)
```

### 4. Slack Integration

**Decision**: Use existing `sendToSlack` utility with 'database' channel

**Rationale**:
- Reuse existing Slack infrastructure
- Consistent error reporting pattern
- Fire-and-forget (no latency impact)

### 5. User Context Detection

**Decision**: Pass user type explicitly from parent component

**Rationale**:
- Parent component already has user context (from auth)
- Avoids redundant database queries
- Cleaner separation of concerns

---

## File Structure

```
app/src/islands/shared/DocumentChangeRequestModal/
├── DocumentChangeRequestModal.jsx       # Main modal component (NEW)
├── DocumentChangeRequestModal.css       # Styles following POPUP_REPLICATION_PROTOCOL (NEW)
├── useDocumentChangeRequestLogic.js     # Business logic hook (NEW)
└── types.js                             # TypeScript type definitions (NEW)

supabase/functions/document/
├── index.ts                             # Add 'request_change' action (MODIFIED)
└── handlers/
    └── requestChange.ts                 # New handler (NEW)

supabase/migrations/
└── 20260202_create_document_change_request_table.sql  # Migration (NEW)

app/src/islands/pages/
└── (Example integration point - TBD based on requirements)
```

---

## Implementation Steps

### Phase 1: Database Schema (Migration)

**File**: `supabase/migrations/20260202_create_document_change_request_table.sql`

```sql
-- Create document_change_request table
CREATE TABLE IF NOT EXISTS document_change_request (
  _id text PRIMARY KEY DEFAULT generate_bubble_id(),
  document_id text NOT NULL REFERENCES documentssent(_id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES "user"(_id) ON DELETE CASCADE,
  user_email text NOT NULL,
  user_name text,
  user_type text NOT NULL CHECK (user_type IN ('Host', 'Guest')),
  request_text text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_document_change_request_document_id ON document_change_request(document_id);
CREATE INDEX idx_document_change_request_user_id ON document_change_request(user_id);
CREATE INDEX idx_document_change_request_status ON document_change_request(status);
CREATE INDEX idx_document_change_request_created_at ON document_change_request(created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER set_document_change_request_updated_at
  BEFORE UPDATE ON document_change_request
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Enable RLS
ALTER TABLE document_change_request ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own change requests"
  ON document_change_request FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create change requests"
  ON document_change_request FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- Admin policy (for internal tools)
CREATE POLICY "Service role can do anything"
  ON document_change_request FOR ALL
  USING (true);

COMMENT ON TABLE document_change_request IS 'User-submitted change requests for draft documents';
```

**Verification Steps**:
1. Run migration: `supabase migration up`
2. Verify table exists: `SELECT * FROM document_change_request LIMIT 1;`
3. Test RLS policies with test user

---

### Phase 2: Edge Function Handler

**File**: `supabase/functions/document/handlers/requestChange.ts`

```typescript
/**
 * Handle document change request submission
 * Creates a database record and sends Slack notification
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ValidationError } from '../../_shared/errors.ts';
import { sendToSlack } from '../../_shared/slack.ts';

interface RequestChangePayload {
  document_id: string;
  user_id: string;
  user_email: string;
  user_name?: string;
  user_type: 'Host' | 'Guest';
  request_text: string;
}

interface UserContext {
  id: string;
  email: string;
}

export async function handleRequestChange(
  payload: unknown,
  user: UserContext | null,
  supabase: SupabaseClient
): Promise<{ success: boolean; request_id: string }> {
  console.log('[document/requestChange] Starting request change handler');

  // Validate payload
  const {
    document_id,
    user_id,
    user_email,
    user_name,
    user_type,
    request_text,
  } = payload as RequestChangePayload;

  if (!document_id || typeof document_id !== 'string') {
    throw new ValidationError('document_id is required and must be a string');
  }

  if (!user_id || typeof user_id !== 'string') {
    throw new ValidationError('user_id is required and must be a string');
  }

  if (!user_email || typeof user_email !== 'string') {
    throw new ValidationError('user_email is required and must be a string');
  }

  if (!user_type || !['Host', 'Guest'].includes(user_type)) {
    throw new ValidationError('user_type must be "Host" or "Guest"');
  }

  if (!request_text || typeof request_text !== 'string' || !request_text.trim()) {
    throw new ValidationError('request_text is required and cannot be empty');
  }

  // Verify document exists
  const { data: document, error: docError } = await supabase
    .from('documentssent')
    .select('_id, "Document sent title"')
    .eq('_id', document_id)
    .single();

  if (docError || !document) {
    console.error('[document/requestChange] Document not found:', docError);
    throw new ValidationError('Document not found');
  }

  const documentTitle = document['Document sent title'] || 'Untitled Document';

  // Create change request record
  const now = new Date().toISOString();
  const changeRequest = {
    document_id,
    user_id,
    user_email,
    user_name: user_name || null,
    user_type,
    request_text: request_text.trim(),
    status: 'pending',
    created_at: now,
    updated_at: now,
  };

  const { data: createdRequest, error: createError } = await supabase
    .from('document_change_request')
    .insert(changeRequest)
    .select('_id')
    .single();

  if (createError) {
    console.error('[document/requestChange] Failed to create request:', createError);
    throw new Error(`Failed to create change request: ${createError.message}`);
  }

  const requestId = createdRequest._id;

  console.log('[document/requestChange] Created request:', requestId);

  // Send Slack notification (fire-and-forget)
  const truncatedText = request_text.length > 300
    ? request_text.substring(0, 297) + '...'
    : request_text;

  const slackMessage = {
    text: [
      `📝 Document Change Request`,
      ``,
      `User: ${user_name || user_email} (${user_type})`,
      `Email: ${user_email}`,
      `Document: ${documentTitle}`,
      ``,
      `Request:`,
      truncatedText,
      ``,
      `Request ID: ${requestId}`,
      `Document ID: ${document_id}`,
    ].join('\n'),
  };

  sendToSlack('database', slackMessage);

  console.log('[document/requestChange] Slack notification sent');

  return {
    success: true,
    request_id: requestId,
  };
}
```

**Verification Steps**:
1. Test handler directly via Supabase Studio Functions tab
2. Verify database record created
3. Verify Slack notification sent
4. Test error cases (missing fields, invalid document ID)

---

### Phase 3: Edge Function Integration

**File**: `supabase/functions/document/index.ts`

**Changes**:
1. Add `'request_change'` to `validActions` array (line 42)
2. Import new handler: `import { handleRequestChange } from './handlers/requestChange.ts';`
3. Add case to switch statement (after line 82):

```typescript
case 'request_change':
  result = await handleRequestChange(payload, supabase, user);
  break;
```

4. Make `request_change` a public action (no auth required for internal pages):

```typescript
// If you want auth required:
// Leave as-is (auth check happens before switch)

// If you want public:
const publicActions = ['list_policies', 'list_hosts', 'request_change'];
```

**Decision**: Make `request_change` **require auth** to prevent spam and ensure user accountability.

**Modified Section** (lines 57-63):

```typescript
// Authenticate user (optional for internal pages)
const user = await authenticateFromHeaders(req.headers, supabaseUrl, supabaseAnonKey);
if (user) {
  console.log(`[document] Authenticated user: ${user.email}`);
} else if (!['list_policies', 'list_hosts'].includes(action)) {
  // request_change requires authentication
  throw new Error('Authentication required');
}
```

**Verification Steps**:
1. Deploy Edge Function: `supabase functions deploy document`
2. Test via curl:
```bash
curl -X POST https://[PROJECT_ID].supabase.co/functions/v1/document \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "request_change",
    "payload": {
      "document_id": "doc_test_id",
      "user_id": "user_test_id",
      "user_email": "test@example.com",
      "user_name": "Test User",
      "user_type": "Host",
      "request_text": "Please change X to Y in section 3"
    }
  }'
```

---

### Phase 4: Frontend Modal Component

**File**: `app/src/islands/shared/DocumentChangeRequestModal/DocumentChangeRequestModal.jsx`

```jsx
/**
 * Document Change Request Modal
 * Allows hosts and guests to submit change requests for draft documents
 *
 * Updated to follow POPUP_REPLICATION_PROTOCOL.md design system.
 * Features:
 * - Monochromatic purple color scheme (no green/yellow)
 * - Mobile bottom sheet behavior (< 480px)
 * - Feather icons (stroke-only)
 * - Pill-shaped buttons (100px radius)
 */

import { useEffect } from 'react';
import { useDocumentChangeRequestLogic } from './useDocumentChangeRequestLogic.js';
import './DocumentChangeRequestModal.css';

// FileText icon (Feather style)
function FileTextIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  );
}

// Close icon (Feather style)
function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

export default function DocumentChangeRequestModal({
  isOpen,
  currentDocumentId,
  userId,
  userEmail,
  userName,
  userType,
  onClose,
  onSuccess,
}) {
  const {
    documents,
    selectedDocumentId,
    requestText,
    isLoading,
    isSubmitting,
    error,
    handleDocumentChange,
    handleRequestTextChange,
    handleSubmit,
    resetForm,
  } = useDocumentChangeRequestLogic({
    currentDocumentId,
    userId,
    userEmail,
    userName,
    userType,
    onSuccess,
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const success = await handleSubmit();
    if (success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="doc-change-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-change-modal-title"
    >
      <div className="doc-change-modal" onClick={(e) => e.stopPropagation()}>
        {/* Mobile grab handle - visible only on mobile */}
        <div className="doc-change-modal-grab-handle" aria-hidden="true" />

        {/* Header */}
        <header className="doc-change-modal-header">
          <div className="doc-change-modal-header-content">
            <div className="doc-change-modal-header-top">
              <span className="doc-change-modal-icon" aria-hidden="true">
                <FileTextIcon />
              </span>
              <h2 id="doc-change-modal-title" className="doc-change-modal-title">
                Request Document Change
              </h2>
            </div>
            <p className="doc-change-modal-subtitle">
              Submit a request to modify a draft document. Your request will be reviewed by our team.
            </p>
          </div>
          <button
            className="doc-change-modal-close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <CloseIcon />
          </button>
        </header>

        {/* Body */}
        <form className="doc-change-modal-body" onSubmit={onSubmit}>
          {/* Error Banner */}
          {error && (
            <div className="doc-change-error-banner" role="alert">
              {error}
            </div>
          )}

          {/* Document Selection */}
          <div className="doc-change-form-group">
            <label className="doc-change-label" htmlFor="document-select">
              Select Document *
            </label>
            {isLoading ? (
              <div className="doc-change-loading">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="doc-change-empty">No draft documents available</div>
            ) : (
              <select
                id="document-select"
                className="doc-change-select"
                value={selectedDocumentId}
                onChange={(e) => handleDocumentChange(e.target.value)}
                required
              >
                <option value="">Choose a document...</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Change Request Text */}
          <div className="doc-change-form-group">
            <label className="doc-change-label" htmlFor="request-text">
              Change Request *
            </label>
            <textarea
              id="request-text"
              className="doc-change-textarea"
              value={requestText}
              onChange={(e) => handleRequestTextChange(e.target.value)}
              placeholder="Describe the changes you'd like to see in this document..."
              rows={8}
              required
            />
            <div className="doc-change-char-count">
              {requestText.length} characters
            </div>
          </div>
        </form>

        {/* Footer */}
        <footer className="doc-change-modal-footer">
          <button
            type="button"
            className="doc-change-btn doc-change-btn--secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="doc-change-btn doc-change-btn--primary"
            onClick={onSubmit}
            disabled={isSubmitting || !selectedDocumentId || !requestText.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="doc-change-spinner" aria-hidden="true" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
```

---

### Phase 5: Frontend Logic Hook

**File**: `app/src/islands/shared/DocumentChangeRequestModal/useDocumentChangeRequestLogic.js`

```javascript
/**
 * Business logic hook for DocumentChangeRequestModal
 * Follows Hollow Component Pattern
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { toast } from '../../../lib/toastService.js';

export function useDocumentChangeRequestLogic({
  currentDocumentId,
  userId,
  userEmail,
  userName,
  userType,
  onSuccess,
}) {
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [requestText, setRequestText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch draft documents on mount
  useEffect(() => {
    async function fetchDocuments() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch documents from documentssent table
        // Filter for draft/pending documents (adjust filter as needed)
        const { data, error: fetchError } = await supabase
          .from('documentssent')
          .select('_id, "Document sent title"')
          .order('Created Date', { ascending: false });

        if (fetchError) {
          throw new Error(`Failed to load documents: ${fetchError.message}`);
        }

        const formattedDocs = (data || []).map((doc) => ({
          id: doc._id,
          title: doc['Document sent title'] || 'Untitled Document',
        }));

        setDocuments(formattedDocs);

        // Auto-select current document if provided
        if (currentDocumentId && formattedDocs.find((d) => d.id === currentDocumentId)) {
          setSelectedDocumentId(currentDocumentId);
        }
      } catch (err) {
        console.error('[useDocumentChangeRequestLogic] Fetch error:', err);
        setError(err.message);
        toast.error('Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocuments();
  }, [currentDocumentId]);

  const handleDocumentChange = useCallback((documentId) => {
    setSelectedDocumentId(documentId);
    setError(null);
  }, []);

  const handleRequestTextChange = useCallback((text) => {
    setRequestText(text);
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedDocumentId) {
      setError('Please select a document');
      return false;
    }

    if (!requestText.trim()) {
      setError('Please enter your change request');
      return false;
    }

    if (!userId || !userEmail || !userType) {
      setError('Missing user information');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Call Edge Function
      const { data: response, error: edgeFunctionError } = await supabase.functions.invoke(
        'document',
        {
          body: {
            action: 'request_change',
            payload: {
              document_id: selectedDocumentId,
              user_id: userId,
              user_email: userEmail,
              user_name: userName || null,
              user_type: userType,
              request_text: requestText.trim(),
            },
          },
        }
      );

      if (edgeFunctionError) {
        throw new Error(edgeFunctionError.message || 'Failed to submit request');
      }

      if (!response?.success) {
        throw new Error(response?.error || 'Request failed');
      }

      // Success
      console.log('[useDocumentChangeRequestLogic] Request submitted:', response.data.request_id);
      toast.success('Change request submitted successfully');

      if (onSuccess) {
        onSuccess(response.data.request_id);
      }

      return true;
    } catch (err) {
      console.error('[useDocumentChangeRequestLogic] Submit error:', err);
      setError(err.message);
      toast.error(`Failed to submit request: ${err.message}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDocumentId, requestText, userId, userEmail, userName, userType, onSuccess]);

  const resetForm = useCallback(() => {
    setSelectedDocumentId(currentDocumentId || '');
    setRequestText('');
    setError(null);
  }, [currentDocumentId]);

  return {
    documents,
    selectedDocumentId,
    requestText,
    isLoading,
    isSubmitting,
    error,
    handleDocumentChange,
    handleRequestTextChange,
    handleSubmit,
    resetForm,
  };
}
```

---

### Phase 6: Frontend Styles

**File**: `app/src/islands/shared/DocumentChangeRequestModal/DocumentChangeRequestModal.css`

```css
/**
 * Document Change Request Modal Styles
 * Following POPUP_REPLICATION_PROTOCOL.md design system
 */

/* ===== OVERLAY ===== */
.doc-change-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  backdrop-filter: blur(4px);
}

/* ===== MODAL CONTAINER ===== */
.doc-change-modal {
  background-color: #ffffff;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
  animation: doc-change-fade-in 0.2s ease-out;
}

@keyframes doc-change-fade-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* ===== GRAB HANDLE (Mobile Only) ===== */
.doc-change-modal-grab-handle {
  display: none;
  width: 40px;
  height: 4px;
  background-color: #d1d5db;
  border-radius: 100px;
  margin: 12px auto 8px;
}

/* ===== HEADER ===== */
.doc-change-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 32px 32px 0 32px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 24px;
}

.doc-change-modal-header-content {
  flex: 1;
  padding-right: 16px;
}

.doc-change-modal-header-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.doc-change-modal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: #f3f4f6;
  border-radius: 12px;
  color: #7c3aed;
}

.doc-change-modal-icon svg {
  width: 20px;
  height: 20px;
  stroke-width: 2;
}

.doc-change-modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.2;
}

.doc-change-modal-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.doc-change-modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background-color: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.doc-change-modal-close:hover {
  background-color: #e5e7eb;
  color: #374151;
}

.doc-change-modal-close svg {
  width: 18px;
  height: 18px;
  stroke-width: 2;
}

/* ===== BODY ===== */
.doc-change-modal-body {
  padding: 24px 32px;
  overflow-y: auto;
  flex: 1;
}

/* Error Banner */
.doc-change-error-banner {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 0.875rem;
  line-height: 1.5;
}

/* Form Groups */
.doc-change-form-group {
  margin-bottom: 24px;
}

.doc-change-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.doc-change-select,
.doc-change-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  color: #111827;
  background-color: #ffffff;
  transition: all 0.2s;
}

.doc-change-select:focus,
.doc-change-textarea:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.doc-change-select {
  cursor: pointer;
}

.doc-change-textarea {
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  line-height: 1.5;
}

.doc-change-char-count {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 4px;
  text-align: right;
}

.doc-change-loading,
.doc-change-empty {
  padding: 12px 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  color: #6b7280;
  font-size: 0.875rem;
  text-align: center;
}

/* ===== FOOTER ===== */
.doc-change-modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 32px 32px 32px;
  border-top: 1px solid #e5e7eb;
}

.doc-change-btn {
  flex: 1;
  padding: 12px 24px;
  border-radius: 100px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.doc-change-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.doc-change-btn--secondary {
  background-color: #f3f4f6;
  color: #374151;
}

.doc-change-btn--secondary:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.doc-change-btn--primary {
  background-color: #7c3aed;
  color: #ffffff;
}

.doc-change-btn--primary:hover:not(:disabled) {
  background-color: #6d28d9;
}

.doc-change-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: doc-change-spin 0.6s linear infinite;
}

@keyframes doc-change-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ===== MOBILE STYLES (< 480px) ===== */
@media (max-width: 480px) {
  .doc-change-modal-overlay {
    align-items: flex-end;
    padding: 0;
  }

  .doc-change-modal {
    max-width: 100%;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    max-height: 85vh;
    animation: doc-change-slide-up 0.3s ease-out;
  }

  @keyframes doc-change-slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .doc-change-modal-grab-handle {
    display: block;
  }

  .doc-change-modal-header {
    padding: 16px 20px 0 20px;
    padding-bottom: 16px;
  }

  .doc-change-modal-header-top {
    gap: 8px;
  }

  .doc-change-modal-icon {
    width: 32px;
    height: 32px;
  }

  .doc-change-modal-icon svg {
    width: 16px;
    height: 16px;
  }

  .doc-change-modal-title {
    font-size: 1.25rem;
  }

  .doc-change-modal-subtitle {
    font-size: 0.8125rem;
  }

  .doc-change-modal-body {
    padding: 16px 20px;
  }

  .doc-change-modal-footer {
    padding: 16px 20px 24px 20px;
    flex-direction: column-reverse;
  }

  .doc-change-btn {
    width: 100%;
  }
}
```

---

### Phase 7: Integration Example

**Example Usage** (from a document viewing page):

```jsx
import { useState } from 'react';
import DocumentChangeRequestModal from '../shared/DocumentChangeRequestModal/DocumentChangeRequestModal.jsx';
import { useAuth } from '../lib/auth.js';

function DocumentViewerPage() {
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState(null);
  const { user } = useAuth(); // Assuming auth hook exists

  const handleRequestChange = () => {
    setShowChangeRequestModal(true);
  };

  const handleSuccess = (requestId) => {
    console.log('Change request submitted:', requestId);
    // Optional: Show success message, refresh data, etc.
  };

  return (
    <div>
      {/* Document viewing UI */}
      <button onClick={handleRequestChange}>
        Request Changes
      </button>

      {/* Modal */}
      <DocumentChangeRequestModal
        isOpen={showChangeRequestModal}
        currentDocumentId={currentDocumentId}
        userId={user?.id}
        userEmail={user?.email}
        userName={user?.name}
        userType={user?.userType} // 'Host' or 'Guest'
        onClose={() => setShowChangeRequestModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
```

---

## Testing Strategy

### Unit Tests

**File**: `app/src/islands/shared/DocumentChangeRequestModal/useDocumentChangeRequestLogic.test.js`

Test cases:
- Document fetching on mount
- Auto-selection of current document
- Form validation (empty fields)
- Submit success flow
- Submit error handling
- Reset form state

### Integration Tests

**File**: `supabase/functions/document/handlers/requestChange.test.ts`

Test cases:
- Successful request creation
- Database record verification
- Slack notification sent
- Validation error cases (missing fields, invalid document ID)
- User permission checks

### E2E Tests

Playwright tests (if E2E framework exists):
- Open modal from document viewer
- Select document from dropdown
- Enter change request text
- Submit form
- Verify success toast
- Verify database record created
- Verify modal closes

---

## Deployment Checklist

### Prerequisites
- [ ] Supabase project access
- [ ] Slack webhook configured (`SLACK_WEBHOOK_DATABASE_WEBHOOK`)
- [ ] Database migration access

### Deployment Steps

1. **Database Migration**
   ```bash
   cd supabase
   supabase migration new create_document_change_request_table
   # Copy SQL from Phase 1
   supabase migration up
   ```

2. **Edge Function Deployment**
   ```bash
   cd supabase/functions
   supabase functions deploy document
   ```

3. **Frontend Build**
   ```bash
   cd app
   bun run build
   ```

4. **Verification**
   - [ ] Table exists in database
   - [ ] RLS policies active
   - [ ] Edge Function responds to `request_change` action
   - [ ] Modal renders correctly
   - [ ] Form submission works
   - [ ] Slack notification sent
   - [ ] Mobile responsive (test on < 480px screen)

---

## Rollback Plan

### If Migration Fails
```sql
DROP TABLE IF EXISTS document_change_request CASCADE;
```

### If Edge Function Fails
1. Revert `document/index.ts` changes (remove `request_change` action)
2. Redeploy: `supabase functions deploy document`

### If Frontend Breaks
1. Remove modal import from integration points
2. Rebuild: `bun run build`
3. Redeploy frontend

---

## Future Enhancements

### Phase 2 (Post-MVP)
1. **Admin Review Interface**
   - Admin page to view/manage change requests
   - Mark requests as reviewed/resolved
   - Add admin comments

2. **Email Notifications**
   - Send email to document owner on new request
   - Send email to requester on status change

3. **Request Threading**
   - Allow multiple change requests per document
   - Show request history
   - Thread replies between requester and admin

4. **Status Tracking**
   - Visual status indicators (pending/reviewed/resolved)
   - Timestamp tracking for status changes
   - Request lifecycle visibility

5. **Attachments**
   - Allow users to attach images/files
   - Store in Supabase Storage
   - Display in admin interface

---

## Success Metrics

### Technical Metrics
- Modal renders in < 200ms
- Form submission completes in < 1s
- Slack notification sent within 2s
- Zero database errors in first week
- 100% RLS policy coverage

### Business Metrics
- Number of change requests submitted per week
- Average response time to requests
- Request resolution rate
- User satisfaction with feature (if surveyed)

---

## Risk Assessment

### High Risk
- **Spam submissions**: Mitigated by auth requirement + rate limiting (future)
- **Database performance**: Mitigated by indexes on common query fields
- **Slack notification failures**: Non-blocking (fire-and-forget)

### Medium Risk
- **Document dropdown performance**: Mitigated by pagination (future) or limit to recent 50 documents
- **Mobile UX issues**: Mitigated by responsive CSS + manual testing

### Low Risk
- **Edge Function timeout**: Unlikely for single database insert + Slack webhook
- **RLS policy gaps**: Mitigated by comprehensive policy testing

---

## File Inventory

### New Files (4)
1. `app/src/islands/shared/DocumentChangeRequestModal/DocumentChangeRequestModal.jsx`
2. `app/src/islands/shared/DocumentChangeRequestModal/DocumentChangeRequestModal.css`
3. `app/src/islands/shared/DocumentChangeRequestModal/useDocumentChangeRequestLogic.js`
4. `supabase/functions/document/handlers/requestChange.ts`

### Modified Files (2)
1. `supabase/functions/document/index.ts` (add action handler)
2. `supabase/migrations/20260202_create_document_change_request_table.sql` (new migration)

### Integration Files (TBD based on requirements)
- Parent page components that will trigger the modal
- Example: `app/src/islands/pages/DocumentViewerPage/DocumentViewerPage.jsx`

---

## Estimated Timeline

- **Phase 1 (Database)**: 1 hour
- **Phase 2 (Edge Function Handler)**: 2 hours
- **Phase 3 (Edge Function Integration)**: 30 minutes
- **Phase 4 (Frontend Modal)**: 3 hours
- **Phase 5 (Frontend Logic)**: 2 hours
- **Phase 6 (Frontend Styles)**: 2 hours
- **Phase 7 (Integration)**: 1 hour
- **Testing**: 2 hours
- **Deployment & Verification**: 1 hour

**Total**: ~15 hours

---

## References

### Existing Patterns
- Modal pattern: `app/src/islands/modals/EditPhoneNumberModal.jsx`
- Edge Function pattern: `supabase/functions/document/index.ts`
- Slack integration: `supabase/functions/_shared/slack.ts`
- Hollow component pattern: `app/src/islands/pages/SearchPage.jsx` + `useSearchPageLogic.js`

### Documentation
- Islands Architecture: `.claude/Documentation/largeCLAUDE.md`
- Edge Functions: `supabase/CLAUDE.md`
- Database Schema: `DATABASE_SCHEMA_OVERVIEW.md`
- Design System: `POPUP_REPLICATION_PROTOCOL.md` (assumed from modal pattern)

---

**Plan Status**: Ready for Execution
**Last Updated**: 2026-02-02 15:00:00
**Next Step**: Review with user, then execute Phase 1 (Database Migration)
