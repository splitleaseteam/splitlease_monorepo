/**
 * SYSTEM ENFORCEMENT: All errors must be reported
 *
 * This module wraps error handling to ensure:
 * 1. Errors are logged to console (development)
 * 2. Errors are sent to Sentry (production)
 * 3. Critical errors trigger Slack alerts
 * 4. Errors are NEVER silently swallowed
 *
 * Prevents: Regression Clusters #5, #8 (hidden failures)
 */

import React from 'react';

// Environment detection
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const SLACK_WEBHOOK = import.meta.env.VITE_SLACK_ERROR_WEBHOOK;
const IS_PRODUCTION = import.meta.env.PROD;
const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'unknown';

// Lazy-load Sentry only in production
let Sentry = null;
let sentryInitialized = false;

async function initSentry() {
  if (!IS_PRODUCTION || !SENTRY_DSN || sentryInitialized) {
    return;
  }

  try {
    const SentryModule = await import('@sentry/react');
    Sentry = SentryModule;

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: 'production',
      release: APP_VERSION,

      // Performance monitoring
      tracesSampleRate: 0.1,

      // Error filtering
      beforeSend(event, _hint) {
        // Don't send errors from browser extensions
        if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
          frame => frame.filename?.includes('chrome-extension://')
        )) {
          return null;
        }

        return event;
      },
    });

    sentryInitialized = true;
    console.log('✅ Sentry initialized');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
}

// Initialize Sentry on module load (production only)
initSentry();

/**
 * Error Severity Levels
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Report an error. NEVER silently fails.
 *
 * @param {Error} error - The error object
 * @param {Object} context - Additional context
 * @param {string} context.severity - Error severity (use ErrorSeverity)
 * @param {string} context.component - Component name where error occurred
 * @param {string} context.action - User action that triggered the error
 * @param {Object} context.metadata - Any additional metadata
 */
export function reportError(error, context = {}) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    ...context,
  };

  // ALWAYS log to console - never hidden
  const logLevel = context.severity === ErrorSeverity.CRITICAL ? 'error' : 'warn';
  console[logLevel]('[ERROR REPORT]', errorInfo);

  // Send to Sentry in production
  if (Sentry && sentryInitialized) {
    Sentry.captureException(error, {
      level: getSentryLevel(context.severity),
      tags: {
        component: context.component,
        action: context.action,
      },
      extra: context.metadata || {},
    });
  }

  // Critical errors go to Slack immediately
  if (context.severity === ErrorSeverity.CRITICAL && SLACK_WEBHOOK) {
    sendSlackAlert(error, errorInfo).catch(err => {
      console.error('[SLACK ALERT FAILED]', err);
    });
  }
}

/**
 * Wrapper for async functions that ensures errors are reported
 *
 * Usage:
 *   const safeFunction = withErrorReporting(myAsyncFunction, {
 *     component: 'LoginForm',
 *     action: 'submit',
 *   });
 */
export function withErrorReporting(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      reportError(error, {
        ...context,
        args: JSON.stringify(args).slice(0, 1000), // Limit size
      });
      throw error;  // Re-throw - NEVER swallow
    }
  };
}

/**
 * Wrapper for try-catch that enforces error reporting
 * Use instead of bare try-catch blocks
 *
 * Returns: { data, error }
 *
 * Usage:
 *   const { data, error } = await trySafe(async () => {
 *     return await fetchUser();
 *   }, { component: 'UserProfile', action: 'loadUser' });
 *
 *   if (error) {
 *     // Handle error
 *     return;
 *   }
 *   // Use data
 */
export async function trySafe(fn, context = {}) {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    reportError(error, context);
    return { data: null, error };
  }
}

/**
 * React Error Boundary component
 * Wrap your components with this to catch rendering errors
 *
 * Usage:
 *   <ErrorBoundary component="HomePage">
 *     <HomePage />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    reportError(error, {
      severity: ErrorSeverity.HIGH,
      component: this.props.component || 'Unknown',
      action: 'render',
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>We&apos;ve been notified and will fix this soon.</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Convert severity to Sentry level
 */
function getSentryLevel(severity) {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
      return 'fatal';
    case ErrorSeverity.HIGH:
      return 'error';
    case ErrorSeverity.MEDIUM:
      return 'warning';
    case ErrorSeverity.LOW:
      return 'info';
    default:
      return 'error';
  }
}

/**
 * Send alert to Slack
 */
async function sendSlackAlert(error, errorInfo) {
  if (!SLACK_WEBHOOK) {
    return;
  }

  try {
    await fetch(SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 *CRITICAL ERROR in Frontend*`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Error:* \`${error.message}\`\n*Component:* ${errorInfo.component || 'Unknown'}\n*Action:* ${errorInfo.action || 'Unknown'}\n*URL:* ${errorInfo.url}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `\`\`\`${error.stack?.slice(0, 500)}\`\`\``,
            },
          },
        ],
      }),
    });
  } catch (slackError) {
    // Log but don't throw - Slack failure shouldn't break the app
    console.error('[SLACK ALERT FAILED]', slackError);
  }
}

/**
 * Initialize global error handlers
 */
if (typeof window !== 'undefined') {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    reportError(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      {
        severity: ErrorSeverity.HIGH,
        component: 'Global',
        action: 'unhandledRejection',
        metadata: { reason: event.reason },
      }
    );
  });

  // Catch global errors
  window.addEventListener('error', (event) => {
    reportError(event.error || new Error(event.message), {
      severity: ErrorSeverity.HIGH,
      component: 'Global',
      action: 'globalError',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });
}
