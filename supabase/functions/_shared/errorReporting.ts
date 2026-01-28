/**
 * SYSTEM ENFORCEMENT: Edge Function Error Reporting
 * All Edge Function errors must be logged and reported.
 *
 * Prevents: Silent failures, hidden errors, debugging nightmares
 */

const SLACK_WEBHOOK = Deno.env.get('SLACK_ERROR_WEBHOOK');
const SENTRY_DSN = Deno.env.get('SENTRY_DSN');
const ENVIRONMENT = Deno.env.get('DENO_ENV') || 'production';
const IS_PRODUCTION = ENVIRONMENT === 'production';

/**
 * Error context for Edge Functions
 */
export interface ErrorContext {
  functionName: string;
  action?: string;
  userId?: string;
  payload?: unknown;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  requestId?: string;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: true;
  message: string;
  code?: string;
  details?: unknown;
  stack?: string;
  requestId?: string;
}

/**
 * Report an error from Edge Functions
 * ALWAYS logs, optionally sends to Slack/Sentry
 */
export async function reportEdgeFunctionError(
  error: Error,
  context: ErrorContext
): Promise<void> {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT,
    ...context,
  };

  // ALWAYS log - never hidden
  console.error('[EDGE FUNCTION ERROR]', JSON.stringify(errorInfo, null, 2));

  // Send to Slack for high/critical errors or all errors in production
  const shouldSlackAlert =
    context.severity === 'critical' ||
    context.severity === 'high' ||
    IS_PRODUCTION;

  if (SLACK_WEBHOOK && shouldSlackAlert) {
    await sendSlackAlert(error, errorInfo).catch((slackError) => {
      // Log Slack failure but don't fail the request
      console.error('[SLACK ALERT FAILED]', slackError);
    });
  }

  // TODO: Add Sentry integration when DSN is configured
  if (SENTRY_DSN && IS_PRODUCTION) {
    // Future: Send to Sentry
  }
}

/**
 * Create an error response
 * Use this to return errors to clients
 */
export function createErrorResponse(
  error: Error,
  statusCode = 500,
  context?: Partial<ErrorContext>
): Response {
  const errorResponse: ErrorResponse = {
    error: true,
    message: error.message,
    requestId: context?.requestId,
  };

  // Include stack trace in development
  if (!IS_PRODUCTION) {
    errorResponse.stack = error.stack;
    errorResponse.details = context;
  }

  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': context?.requestId || 'unknown',
    },
  });
}

/**
 * Wrapper for Edge Function handlers
 * Catches all errors and reports them
 *
 * Usage:
 *   Deno.serve(withErrorHandling('my-function', async (req) => {
 *     // Your handler code
 *   }));
 */
export function withErrorHandling(
  functionName: string,
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const requestId = crypto.randomUUID();

    try {
      // Log request
      console.log(`[${functionName}] Request ${requestId}`, {
        method: req.method,
        url: req.url,
      });

      // Execute handler
      const response = await handler(req);

      // Log response
      console.log(`[${functionName}] Response ${requestId}`, {
        status: response.status,
      });

      return response;
    } catch (error) {
      // Report error
      await reportEdgeFunctionError(error as Error, {
        functionName,
        severity: 'high',
        requestId,
      });

      // Return error response
      return createErrorResponse(error as Error, 500, {
        functionName,
        requestId,
      });
    }
  };
}

/**
 * Wrapper for action handlers
 * Use inside Edge Functions that have action-based routing
 *
 * Usage:
 *   const result = await withActionErrorHandling(
 *     'my-function',
 *     'create-listing',
 *     async () => {
 *       // Action logic
 *     }
 *   );
 */
export async function withActionErrorHandling<T>(
  functionName: string,
  action: string,
  handler: () => Promise<T>
): Promise<T> {
  try {
    return await handler();
  } catch (error) {
    await reportEdgeFunctionError(error as Error, {
      functionName,
      action,
      severity: 'medium',
    });
    throw error; // Re-throw for caller to handle
  }
}

/**
 * Send alert to Slack
 */
async function sendSlackAlert(
  error: Error,
  errorInfo: Record<string, unknown>
): Promise<void> {
  if (!SLACK_WEBHOOK) {
    return;
  }

  const severityEmoji = {
    critical: '🚨',
    high: '❗',
    medium: '⚠️',
    low: 'ℹ️',
  }[errorInfo.severity as string] || '❓';

  const message = {
    text: `${severityEmoji} *Edge Function Error: ${errorInfo.functionName}*`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `*Function:* \`${errorInfo.functionName}\`\n` +
            `*Action:* ${errorInfo.action || 'unknown'}\n` +
            `*Error:* \`${error.message}\`\n` +
            `*User:* ${errorInfo.userId || 'anonymous'}\n` +
            `*Environment:* ${ENVIRONMENT}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`${error.stack?.slice(0, 500) || 'No stack trace'}\`\`\``,
        },
      },
    ],
  };

  try {
    const response = await fetch(SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('[SLACK ALERT FAILED]', await response.text());
    }
  } catch (fetchError) {
    console.error('[SLACK ALERT FAILED]', fetchError);
  }
}

/**
 * Validate request JSON body
 * Throws error if validation fails (will be caught by withErrorHandling)
 */
export async function validateRequestBody<T>(
  req: Request,
  requiredFields: string[]
): Promise<T> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    throw new Error('Invalid JSON in request body');
  }

  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be a JSON object');
  }

  const missing = requiredFields.filter(
    (field) => !(field in (body as Record<string, unknown>))
  );

  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }

  return body as T;
}
