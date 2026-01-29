# Error Handling Audit and Improvement Plan

**Generated**: 2026-01-28
**Scope**: Comprehensive analysis of error handling patterns across Split Lease codebase
**Author**: Claude Code Audit

---

## Executive Summary

The Split Lease codebase has a solid foundation for error handling with functional programming patterns in the backend, but there are significant opportunities for improvement, particularly in:

1. **Inconsistent ErrorState components** - 7 different implementations with varying interfaces
2. **Silent error swallowing** - Several catch blocks that return null or log without propagating
3. **Missing user-friendly error messages** - Technical errors exposed directly to users
4. **No centralized frontend error tracking** - Backend has Slack integration, frontend lacks monitoring
5. **Inconsistent error classification** - No standard taxonomy for error types

---

## Part 1: Current Infrastructure Audit

### Backend Error Handling (Supabase Edge Functions)

#### Strengths

| File | Feature | Quality |
|------|---------|---------|
| `_shared/functional/errorLog.ts` | Immutable error log with classification, user context, environment detection | Excellent |
| `_shared/functional/result.ts` | Result type for functional error handling (Ok/Err pattern) | Excellent |
| `_shared/functional/orchestration.ts` | Request parsing, validation, response formatting with Result types | Excellent |
| `_shared/errors.ts` | Custom error classes (BubbleApiError, ValidationError, AuthenticationError, OpenAIError) | Good |
| `_shared/errorReporting.ts` | Slack integration, severity levels, structured logging | Good |
| `_shared/slack.ts` | ErrorCollector class, fire-and-forget Slack notifications | Good |

#### Weaknesses Found

1. **Duplicate error handling patterns** - Both `ErrorCollector` class and `ErrorLog` functional approach exist
2. **Inconsistent error response format** - Some handlers return `{ success: false, error }`, others return `{ error: true, message }`
3. **Silent failures in queueSync.ts** (lines 155-158, 223-226, 279-282) - Errors logged but swallowed:
   ```typescript
   } catch (err) {
     // Log but continue - don't fail the main operation
     console.error(`[QueueSync] Error enqueuing item:`, err);
   }
   ```
4. **Notification helper silent failures** (notificationHelpers.ts lines 156-158, 213-215) - Email/SMS errors swallowed
5. **Generic error messages** - `'An error occurred'` and `'Unknown error'` fallbacks in multiple places

### Frontend Error Handling (React App)

#### ErrorState Components Inventory

| Location | Interface | Styling | Features |
|----------|-----------|---------|----------|
| `SearchPage/components/ErrorState.jsx` | `{message, onRetry}` | Image-based | Retry button, filter suggestion |
| `ViewSplitLeasePage/components/ErrorState.jsx` | `{error, onRetry}` | Emoji (warning), inline styles | Retry + Browse link |
| `AdminThreadsPage/components/ErrorState.jsx` | `{message, onRetry}` | CSS class-based, Lucide icon | "Something went wrong" |
| `LeasesOverviewPage/components/ErrorState.jsx` | Unknown | Unknown | Unknown |
| `ManageVirtualMeetingsPage/components/ErrorState.jsx` | Unknown | Unknown | Unknown |
| `QuickPricePage/components/ErrorState.jsx` | Unknown | Unknown | Unknown |
| `ManageLeasesPaymentRecordsPage/components/ErrorState.jsx` | Unknown | Unknown | Unknown |

**Issues:**
- 7 different ErrorState implementations
- Inconsistent prop interfaces (`message` vs `error`)
- Inconsistent styling approaches (CSS classes, inline styles, images, icons)
- No standardized error messaging

#### ErrorBoundary Component

**Location**: `app/src/islands/shared/ErrorBoundary.jsx`

**Current Issues:**
1. Only logs to console (`console.error`) - no external reporting
2. Generic fallback UI - not contextual to the page
3. No error recovery mechanism
4. No user-friendly instructions

#### Error Overlay Component

**Location**: `app/src/islands/shared/ErrorOverlay.jsx`

**Purpose**: Schedule selector validation errors (minimum_nights, maximum_nights, contiguity, availability)

**Issues:**
- Tightly coupled to schedule selector domain
- Cannot be reused for general errors

### Error Handling Anti-Patterns Found

#### Pattern 1: Silent Error Swallowing
**Files affected**:
- `neighborhoodService.js` (line 142-143)
- `neighborhoodService.ts` (line 116-117)
- `listingLocalStore.ts` (line 327-328)
- `useHostOverviewPageLogic.js` (line 132-133)

```javascript
// Anti-pattern: Returning null on error
try {
  // ... operation
  return null;
} catch (error) {
  console.error('...', error);
  return null;  // Error is swallowed!
}
```

#### Pattern 2: Generic Fallback Messages
**Files affected**: 6+ files

```javascript
// Anti-pattern: Generic messages that don't help users
error.message || 'Unknown error'
error.message || 'An error occurred'
```

#### Pattern 3: Inconsistent Error Response Structures
**Backend variations found**:
```typescript
// Variation 1 (errors.ts, most Edge Functions)
{ success: false, error: string }

// Variation 2 (errorReporting.ts)
{ error: true, message: string, code?: string, details?: unknown }
```

#### Pattern 4: Missing Error Context
Many catch blocks log the error but don't include:
- User ID
- Request correlation ID
- Action being performed
- Payload data (sanitized)

---

## Part 2: Improvement Recommendations

### 2.1 Standardized Error Classes (Backend)

Create a unified error class hierarchy:

```typescript
// supabase/functions/_shared/errors/index.ts

/**
 * Base application error with metadata
 */
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;
  abstract readonly isOperational: boolean; // true = expected, false = system error

  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly httpStatus = 400;
  readonly isOperational = true;

  constructor(
    message: string,
    public readonly field?: string,
    context?: Record<string, unknown>
  ) {
    super(message, undefined, context);
  }
}

/**
 * Authentication errors (401)
 */
export class AuthenticationError extends AppError {
  readonly code = 'AUTH_ERROR';
  readonly httpStatus = 401;
  readonly isOperational = true;
}

/**
 * Authorization errors (403)
 */
export class AuthorizationError extends AppError {
  readonly code = 'FORBIDDEN';
  readonly httpStatus = 403;
  readonly isOperational = true;
}

/**
 * Not found errors (404)
 */
export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly httpStatus = 404;
  readonly isOperational = true;

  constructor(
    resource: string,
    identifier?: string,
    context?: Record<string, unknown>
  ) {
    super(`${resource} not found${identifier ? `: ${identifier}` : ''}`, undefined, context);
  }
}

/**
 * Conflict errors (409) - FK violations, unique constraints
 */
export class ConflictError extends AppError {
  readonly code = 'CONFLICT';
  readonly httpStatus = 409;
  readonly isOperational = true;
}

/**
 * Rate limit errors (429)
 */
export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMIT';
  readonly httpStatus = 429;
  readonly isOperational = true;
}

/**
 * External service errors (502)
 */
export class ExternalServiceError extends AppError {
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly httpStatus = 502;
  readonly isOperational = false;

  constructor(
    service: string,
    message: string,
    cause?: Error,
    context?: Record<string, unknown>
  ) {
    super(`${service}: ${message}`, cause, context);
  }
}

/**
 * Internal server errors (500)
 */
export class InternalError extends AppError {
  readonly code = 'INTERNAL_ERROR';
  readonly httpStatus = 500;
  readonly isOperational = false;
}
```

### 2.2 Standardized Error Response Format

```typescript
// supabase/functions/_shared/errors/response.ts

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;           // For validation errors
    details?: unknown;        // Additional context (dev only)
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

export function formatAppErrorResponse(
  error: AppError,
  requestId: string,
  includeDetails = false
): ErrorResponse {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error instanceof ValidationError && error.field ? { field: error.field } : {}),
      ...(includeDetails && error.context ? { details: error.context } : {}),
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}
```

### 2.3 Unified Frontend ErrorState Component

```jsx
// app/src/islands/shared/ErrorState/ErrorState.jsx

import { AlertTriangle, RefreshCw, ArrowLeft, HelpCircle } from 'lucide-react';
import './ErrorState.css';

/**
 * Error severity levels for UI treatment
 */
const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

/**
 * Standardized error state component for all pages
 *
 * @param {Object} props
 * @param {string} props.title - Error heading (e.g., "Unable to Load Listings")
 * @param {string} props.message - User-friendly error description
 * @param {string} [props.code] - Error code for support reference
 * @param {string} [props.severity='error'] - info | warning | error | critical
 * @param {Function} [props.onRetry] - Retry callback
 * @param {string} [props.retryLabel='Try Again'] - Custom retry button text
 * @param {Object} [props.primaryAction] - { label, href | onClick }
 * @param {Object} [props.secondaryAction] - { label, href | onClick }
 * @param {boolean} [props.showHelpLink=true] - Show "Contact Support" link
 * @param {string} [props.illustration] - Path to illustration image
 */
export function ErrorState({
  title,
  message,
  code,
  severity = SEVERITY.ERROR,
  onRetry,
  retryLabel = 'Try Again',
  primaryAction,
  secondaryAction,
  showHelpLink = true,
  illustration,
}) {
  const Icon = severity === SEVERITY.CRITICAL ? AlertTriangle : AlertTriangle;

  return (
    <div className={`error-state error-state--${severity}`} role="alert">
      <div className="error-state__content">
        {illustration ? (
          <img
            src={illustration}
            alt=""
            className="error-state__illustration"
            aria-hidden="true"
          />
        ) : (
          <Icon
            size={48}
            className="error-state__icon"
            aria-hidden="true"
          />
        )}

        <h2 className="error-state__title">{title}</h2>

        <p className="error-state__message">{message}</p>

        {code && (
          <p className="error-state__code">
            Error code: <code>{code}</code>
          </p>
        )}

        <div className="error-state__actions">
          {onRetry && (
            <button
              className="error-state__btn error-state__btn--primary"
              onClick={onRetry}
            >
              <RefreshCw size={16} />
              {retryLabel}
            </button>
          )}

          {primaryAction && (
            primaryAction.href ? (
              <a
                href={primaryAction.href}
                className="error-state__btn error-state__btn--primary"
              >
                {primaryAction.label}
              </a>
            ) : (
              <button
                className="error-state__btn error-state__btn--primary"
                onClick={primaryAction.onClick}
              >
                {primaryAction.label}
              </button>
            )
          )}

          {secondaryAction && (
            secondaryAction.href ? (
              <a
                href={secondaryAction.href}
                className="error-state__btn error-state__btn--secondary"
              >
                {secondaryAction.label}
              </a>
            ) : (
              <button
                className="error-state__btn error-state__btn--secondary"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </button>
            )
          )}
        </div>

        {showHelpLink && (
          <a
            href="/help-center.html"
            className="error-state__help-link"
          >
            <HelpCircle size={14} />
            Need help? Contact Support
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Pre-configured error states for common scenarios
 */
export const ErrorPresets = {
  NetworkError: (onRetry) => ({
    title: 'Connection Problem',
    message: 'We couldn\'t reach our servers. Please check your internet connection and try again.',
    severity: SEVERITY.WARNING,
    onRetry,
    retryLabel: 'Retry',
  }),

  NotFound: (resource = 'Page') => ({
    title: `${resource} Not Found`,
    message: `The ${resource.toLowerCase()} you're looking for doesn't exist or has been removed.`,
    severity: SEVERITY.INFO,
    primaryAction: { label: 'Go Back', onClick: () => window.history.back() },
    secondaryAction: { label: 'Go Home', href: '/' },
  }),

  Unauthorized: () => ({
    title: 'Sign In Required',
    message: 'You need to be signed in to access this page.',
    severity: SEVERITY.INFO,
    primaryAction: { label: 'Sign In', href: '/login.html' },
  }),

  Forbidden: () => ({
    title: 'Access Denied',
    message: 'You don\'t have permission to view this page.',
    severity: SEVERITY.WARNING,
    secondaryAction: { label: 'Go Back', onClick: () => window.history.back() },
  }),

  ServerError: (onRetry, code) => ({
    title: 'Something Went Wrong',
    message: 'We encountered an unexpected error. Our team has been notified.',
    code,
    severity: SEVERITY.ERROR,
    onRetry,
  }),

  LoadingError: (resource, onRetry) => ({
    title: `Unable to Load ${resource}`,
    message: `We had trouble loading the ${resource.toLowerCase()}. Please try again.`,
    severity: SEVERITY.WARNING,
    onRetry,
  }),
};
```

### 2.4 Enhanced ErrorBoundary Component

```jsx
// app/src/islands/shared/ErrorBoundary/ErrorBoundary.jsx

import React from 'react';
import { ErrorState, ErrorPresets } from '../ErrorState/ErrorState.jsx';
import { reportError } from '../../lib/errorReporting.js';

/**
 * Enhanced Error Boundary with:
 * - External error reporting
 * - Contextual fallback UI
 * - Error recovery options
 * - User-friendly messaging
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;

    this.setState({ errorInfo, errorId });

    // Log to console for development
    console.error('[ErrorBoundary] Caught error:', {
      error,
      errorInfo,
      errorId,
      component: this.props.name || 'Unknown',
    });

    // Report to external service
    reportError({
      error,
      errorInfo,
      errorId,
      component: this.props.name,
      userId: this.props.userId,
      pageUrl: window.location.href,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorId: this.state.errorId,
          reset: this.handleRetry,
        });
      }

      // Default fallback UI
      return (
        <div className="error-boundary">
          <ErrorState
            {...ErrorPresets.ServerError(this.handleReload, this.state.errorId)}
          />

          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="error-boundary__details">
              <summary>Developer Details</summary>
              <pre>{this.state.error?.toString()}</pre>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for functional component error boundaries
 * Uses react-error-boundary pattern
 */
export function withErrorBoundary(Component, options = {}) {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `WithErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
```

### 2.5 Frontend Error Reporting Service

```javascript
// app/src/lib/errorReporting.js

/**
 * Frontend Error Reporting Service
 *
 * Sends errors to Slack via Edge Function
 * Integrates with Sentry/similar when configured
 */

const ERROR_ENDPOINT = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/error-report';

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Error categories for classification
 */
export const ErrorCategory = {
  RENDER: 'render',           // React rendering errors
  NETWORK: 'network',         // API/fetch errors
  VALIDATION: 'validation',   // User input errors
  AUTH: 'auth',               // Authentication errors
  NAVIGATION: 'navigation',   // Routing errors
  UNKNOWN: 'unknown',         // Unclassified errors
};

/**
 * Classify error by type
 */
function classifyError(error) {
  const message = error.message?.toLowerCase() || '';

  if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
    return { category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM };
  }
  if (message.includes('unauthorized') || message.includes('401') || message.includes('auth')) {
    return { category: ErrorCategory.AUTH, severity: ErrorSeverity.LOW };
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return { category: ErrorCategory.VALIDATION, severity: ErrorSeverity.LOW };
  }
  if (error.name === 'ChunkLoadError' || message.includes('loading chunk')) {
    return { category: ErrorCategory.NAVIGATION, severity: ErrorSeverity.HIGH };
  }

  return { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.HIGH };
}

/**
 * Report error to monitoring service
 *
 * @param {Object} params
 * @param {Error} params.error - The error object
 * @param {string} [params.errorId] - Unique error ID for tracking
 * @param {Object} [params.errorInfo] - React error info (componentStack)
 * @param {string} [params.component] - Component name where error occurred
 * @param {string} [params.userId] - Current user ID if authenticated
 * @param {string} [params.pageUrl] - Current page URL
 * @param {Object} [params.context] - Additional context data
 */
export async function reportError({
  error,
  errorId,
  errorInfo,
  component,
  userId,
  pageUrl,
  context = {},
}) {
  // Always log to console
  console.error('[Error Reporter]', {
    errorId,
    message: error.message,
    stack: error.stack,
    component,
    pageUrl,
  });

  // Classify the error
  const { category, severity } = classifyError(error);

  // Don't report low-severity known issues
  if (severity === ErrorSeverity.LOW) {
    return;
  }

  // Build error report payload
  const payload = {
    errorId: errorId || `ERR-${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    severity,
    category,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack?.slice(0, 2000), // Truncate long stacks
    },
    component,
    componentStack: errorInfo?.componentStack?.slice(0, 1000),
    userId,
    pageUrl: pageUrl || window.location.href,
    userAgent: navigator.userAgent,
    context,
    environment: import.meta.env.MODE,
  };

  // Send to error reporting endpoint
  try {
    await fetch(ERROR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'report', payload }),
    });
  } catch (reportingError) {
    // Don't fail silently, but don't crash either
    console.warn('[Error Reporter] Failed to send error report:', reportingError);
  }
}

/**
 * Create an error reporter for a specific component/context
 */
export function createErrorReporter(component, defaultContext = {}) {
  return (error, additionalContext = {}) => {
    reportError({
      error,
      component,
      context: { ...defaultContext, ...additionalContext },
    });
  };
}

/**
 * Wrap async function with error reporting
 */
export function withErrorReporting(fn, component) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      reportError({ error, component });
      throw error; // Re-throw so caller can handle
    }
  };
}

/**
 * Global error handler for uncaught errors
 */
export function initGlobalErrorHandler() {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    reportError({
      error: event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason)),
      component: 'GlobalHandler',
      context: { type: 'unhandledrejection' },
    });
  });

  // Catch global errors
  window.onerror = (message, source, lineno, colno, error) => {
    reportError({
      error: error || new Error(String(message)),
      component: 'GlobalHandler',
      context: {
        type: 'onerror',
        source,
        line: lineno,
        column: colno,
      },
    });
  };
}
```

### 2.6 Error Reporting Edge Function

```typescript
// supabase/functions/error-report/index.ts

/**
 * Error Report Edge Function
 *
 * Receives frontend error reports and forwards to Slack/Sentry
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { sendToSlack } from '../_shared/slack.ts';

interface ErrorReport {
  errorId: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  component?: string;
  componentStack?: string;
  userId?: string;
  pageUrl: string;
  userAgent: string;
  context?: Record<string, unknown>;
  environment: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();

    if (action !== 'report') {
      return new Response(
        JSON.stringify({ success: false, error: 'Unknown action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const report = payload as ErrorReport;

    // Format for Slack
    const severityEmoji = {
      low: 'info',
      medium: 'warning',
      high: 'exclamation',
      critical: 'rotating_light',
    }[report.severity] || 'question';

    const message = {
      text: [
        `:${severityEmoji}: *Frontend Error* [${report.errorId}]`,
        '',
        `*Error:* \`${report.error.name}: ${report.error.message}\``,
        `*Component:* ${report.component || 'Unknown'}`,
        `*Page:* ${report.pageUrl}`,
        `*Category:* ${report.category}`,
        `*Severity:* ${report.severity}`,
        `*Environment:* ${report.environment}`,
        report.userId ? `*User:* ${report.userId}` : '*User:* Anonymous',
        '',
        '```',
        report.error.stack?.slice(0, 500) || 'No stack trace',
        '```',
      ].join('\n'),
    };

    // Send to Slack
    sendToSlack('database', message);

    // Store in database for analysis
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase.from('frontend_error_log').insert({
      error_id: report.errorId,
      severity: report.severity,
      category: report.category,
      error_name: report.error.name,
      error_message: report.error.message,
      error_stack: report.error.stack,
      component: report.component,
      page_url: report.pageUrl,
      user_id: report.userId,
      user_agent: report.userAgent,
      context: report.context,
      environment: report.environment,
      created_at: report.timestamp,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[error-report] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## Part 3: User-Friendly Error Messages Catalog

### Error Message Guidelines

1. **Be specific** - Tell users what happened, not just "something went wrong"
2. **Be actionable** - Tell users what they can do about it
3. **Be human** - Use conversational language, not technical jargon
4. **Be honest** - If it's our fault, acknowledge it

### Error Message Catalog

```javascript
// app/src/lib/errorMessages.js

/**
 * Centralized error message catalog
 * Maps error codes to user-friendly messages
 */

export const ErrorMessages = {
  // Network Errors
  NETWORK_ERROR: {
    title: 'Connection Problem',
    message: 'We couldn\'t reach our servers. Please check your internet connection and try again.',
    action: 'Retry',
  },
  TIMEOUT: {
    title: 'Request Timed Out',
    message: 'This is taking longer than expected. Please try again in a moment.',
    action: 'Try Again',
  },

  // Authentication Errors
  AUTH_REQUIRED: {
    title: 'Sign In Required',
    message: 'You need to be signed in to access this page.',
    action: 'Sign In',
  },
  SESSION_EXPIRED: {
    title: 'Session Expired',
    message: 'Your session has ended for security. Please sign in again.',
    action: 'Sign In',
  },
  INVALID_CREDENTIALS: {
    title: 'Sign In Failed',
    message: 'The email or password you entered is incorrect. Please try again.',
    action: 'Try Again',
  },

  // Authorization Errors
  FORBIDDEN: {
    title: 'Access Denied',
    message: 'You don\'t have permission to view this page.',
    action: 'Go Back',
  },
  NOT_OWNER: {
    title: 'Not Your Listing',
    message: 'You can only edit listings that belong to your account.',
    action: 'View Your Listings',
  },

  // Not Found Errors
  LISTING_NOT_FOUND: {
    title: 'Listing Not Found',
    message: 'This listing doesn\'t exist or has been removed by the host.',
    action: 'Browse Listings',
  },
  PROPOSAL_NOT_FOUND: {
    title: 'Proposal Not Found',
    message: 'This proposal no longer exists. It may have been withdrawn.',
    action: 'View Your Proposals',
  },
  USER_NOT_FOUND: {
    title: 'Profile Not Found',
    message: 'We couldn\'t find this user profile.',
    action: 'Go Home',
  },

  // Validation Errors
  INVALID_INPUT: {
    title: 'Invalid Information',
    message: 'Please check your input and try again.',
    action: 'Fix & Retry',
  },
  REQUIRED_FIELD: {
    title: 'Missing Information',
    message: (field) => `Please fill in the ${field} field.`,
    action: 'Complete Form',
  },
  INVALID_EMAIL: {
    title: 'Invalid Email',
    message: 'Please enter a valid email address.',
    action: 'Fix Email',
  },
  INVALID_PHONE: {
    title: 'Invalid Phone Number',
    message: 'Please enter a valid phone number.',
    action: 'Fix Phone',
  },

  // Booking/Proposal Errors
  DATES_UNAVAILABLE: {
    title: 'Dates Not Available',
    message: 'The dates you selected are no longer available. Please choose different dates.',
    action: 'Select New Dates',
  },
  PROPOSAL_EXPIRED: {
    title: 'Proposal Expired',
    message: 'This proposal has expired. Please submit a new request.',
    action: 'Create New Proposal',
  },
  ALREADY_BOOKED: {
    title: 'Already Booked',
    message: 'You already have a booking for these dates with this listing.',
    action: 'View Your Bookings',
  },

  // Payment Errors
  PAYMENT_FAILED: {
    title: 'Payment Failed',
    message: 'We couldn\'t process your payment. Please try again or use a different payment method.',
    action: 'Try Again',
  },
  CARD_DECLINED: {
    title: 'Card Declined',
    message: 'Your card was declined. Please try a different card.',
    action: 'Update Card',
  },

  // Server Errors
  SERVER_ERROR: {
    title: 'Something Went Wrong',
    message: 'We encountered an unexpected error. Our team has been notified and is working on it.',
    action: 'Try Again Later',
  },
  SERVICE_UNAVAILABLE: {
    title: 'Service Temporarily Unavailable',
    message: 'We\'re performing maintenance. Please try again in a few minutes.',
    action: 'Retry Later',
  },

  // Upload Errors
  FILE_TOO_LARGE: {
    title: 'File Too Large',
    message: 'The file you selected is too large. Please choose a smaller file (max 10MB).',
    action: 'Choose Another',
  },
  INVALID_FILE_TYPE: {
    title: 'Invalid File Type',
    message: 'Please upload an image file (JPG, PNG, or WebP).',
    action: 'Choose Another',
  },
  UPLOAD_FAILED: {
    title: 'Upload Failed',
    message: 'We couldn\'t upload your file. Please try again.',
    action: 'Retry Upload',
  },

  // Generic Fallback
  UNKNOWN: {
    title: 'Oops!',
    message: 'Something unexpected happened. Please try again.',
    action: 'Retry',
  },
};

/**
 * Get user-friendly error message by code
 */
export function getErrorMessage(code, params = {}) {
  const error = ErrorMessages[code] || ErrorMessages.UNKNOWN;

  return {
    title: error.title,
    message: typeof error.message === 'function'
      ? error.message(params.field || 'required')
      : error.message,
    action: error.action,
  };
}

/**
 * Convert API error to user-friendly message
 */
export function translateApiError(apiError) {
  // Map common API error patterns to error codes
  const message = apiError.message?.toLowerCase() || '';
  const code = apiError.code;

  if (code === '23503' || message.includes('foreign key')) {
    return getErrorMessage('INVALID_INPUT');
  }
  if (code === '23505' || message.includes('unique')) {
    return getErrorMessage('ALREADY_EXISTS');
  }
  if (message.includes('network') || message.includes('fetch')) {
    return getErrorMessage('NETWORK_ERROR');
  }
  if (message.includes('unauthorized') || message.includes('401')) {
    return getErrorMessage('SESSION_EXPIRED');
  }
  if (message.includes('forbidden') || message.includes('403')) {
    return getErrorMessage('FORBIDDEN');
  }
  if (message.includes('not found') || message.includes('404')) {
    return getErrorMessage('LISTING_NOT_FOUND');
  }

  return getErrorMessage('UNKNOWN');
}
```

---

## Part 4: Implementation Roadmap

### Phase 1: Foundation (Week 1)

1. Create unified `AppError` class hierarchy
2. Standardize error response format across all Edge Functions
3. Create unified `ErrorState` component with presets
4. Create `errorMessages.js` catalog

### Phase 2: Backend Improvements (Week 2)

1. Migrate all Edge Functions to new error classes
2. Add request correlation IDs to all handlers
3. Fix silent error swallowing in queueSync.ts and notificationHelpers.ts
4. Enhance ErrorLog with structured error codes

### Phase 3: Frontend Improvements (Week 3)

1. Replace all 7 ErrorState components with unified component
2. Implement enhanced ErrorBoundary with reporting
3. Create error reporting Edge Function
4. Add global error handler

### Phase 4: Monitoring (Week 4)

1. Create `frontend_error_log` table
2. Add dashboard for error analytics
3. Set up alerts for critical errors
4. Document error handling patterns

---

## Part 5: Files to Modify

### Backend Files

| File | Changes |
|------|---------|
| `_shared/errors/index.ts` | Create new file with AppError hierarchy |
| `_shared/errors/response.ts` | Create new file with standardized response format |
| `_shared/queueSync.ts` | Fix silent error swallowing (lines 155-158, 223-226, 279-282) |
| `_shared/notificationHelpers.ts` | Add error propagation (lines 156-158, 213-215) |
| All Edge Function index.ts files | Migrate to new error classes |

### Frontend Files

| File | Changes |
|------|---------|
| `islands/shared/ErrorState/` | Create new unified component directory |
| `islands/shared/ErrorBoundary/` | Create enhanced ErrorBoundary |
| `lib/errorReporting.js` | Create new error reporting service |
| `lib/errorMessages.js` | Create new error message catalog |
| 7 existing ErrorState.jsx files | Replace with unified component |

### New Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/error-report/index.ts` | Frontend error reporting endpoint |
| `supabase/migrations/XXXX_create_frontend_error_log.sql` | Error logging table |
| `app/src/islands/shared/ErrorState/ErrorState.jsx` | Unified component |
| `app/src/islands/shared/ErrorState/ErrorState.css` | Unified styles |
| `app/src/lib/errorReporting.js` | Frontend reporting service |
| `app/src/lib/errorMessages.js` | Message catalog |

---

## Appendix A: Error Handling Checklist

### For Every New Feature

- [ ] Identify all possible error scenarios
- [ ] Choose appropriate error class for each scenario
- [ ] Add user-friendly message to catalog if new
- [ ] Include error code in response
- [ ] Add correlation ID tracking
- [ ] Test error scenarios
- [ ] Verify Slack notifications work

### Code Review Checklist

- [ ] No empty catch blocks
- [ ] No generic "Unknown error" messages without context
- [ ] Error responses include code and requestId
- [ ] Errors are propagated, not swallowed
- [ ] User-facing errors are from the message catalog
- [ ] ErrorBoundary wraps component trees

---

## Appendix B: Quick Reference

### Error Class Selection

| Scenario | Error Class | HTTP Status |
|----------|-------------|-------------|
| Missing/invalid input | ValidationError | 400 |
| Not logged in | AuthenticationError | 401 |
| Not permitted | AuthorizationError | 403 |
| Resource not found | NotFoundError | 404 |
| FK/unique violation | ConflictError | 409 |
| Too many requests | RateLimitError | 429 |
| External API failed | ExternalServiceError | 502 |
| Unexpected error | InternalError | 500 |

### ErrorState Preset Selection

| Scenario | Preset | Usage |
|----------|--------|-------|
| Network/API failure | `ErrorPresets.NetworkError(onRetry)` | Fetch errors |
| 404 responses | `ErrorPresets.NotFound(resource)` | Missing pages/items |
| 401 responses | `ErrorPresets.Unauthorized()` | Auth required |
| 403 responses | `ErrorPresets.Forbidden()` | Access denied |
| 500 responses | `ErrorPresets.ServerError(onRetry, code)` | Server errors |
| Loading failures | `ErrorPresets.LoadingError(resource, onRetry)` | Data load errors |
