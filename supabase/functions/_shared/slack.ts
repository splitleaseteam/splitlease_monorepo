/**
 * Shared Slack Utilities
 * Split Lease - Edge Functions
 *
 * Centralized Slack webhook operations for all Edge Functions
 *
 * PERFORMANCE: Fire-and-forget pattern - ZERO latency impact
 * CONSOLIDATION: One message per request, not per error
 * WEBHOOK: Uses SLACK_WEBHOOK_DATABASE_WEBHOOK for all error logs
 * BOT API: Uses SLACK_BOT_TOKEN for interactive messages with buttons/modals
 */

import { getStatusCodeFromError } from './errors.ts';

// Types
// ─────────────────────────────────────────────────────────────

interface SlackMessage {
  text: string;
}

interface SlackBlock {
  type: string;
  [key: string]: unknown;
}

interface SlackInteractiveResult {
  ok: boolean;
  ts?: string;
  error?: string;
}

interface CollectedError {
  error: Error;
  context?: string;
  timestamp: string;
}

function isAuthRelatedErrorMessage(message: string | undefined): boolean {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes('token is expired') ||
    normalized.includes('invalid jwt') ||
    normalized.includes('authentication token') ||
    normalized.includes('invalid or expired authentication token') ||
    normalized.includes('unauthorized') ||
    normalized.includes('forbidden') ||
    (normalized.includes('jwt') && normalized.includes('expired'));
}

function shouldReportError(error: Error): boolean {
  if (isAuthRelatedErrorMessage(error.message)) {
    return false;
  }

  const statusCode = getStatusCodeFromError(error);
  return statusCode >= 500;
}

// Webhook Configuration
export type SlackChannel = 'database' | 'acquisition' | 'general';

const CHANNEL_ENV_MAP: Record<SlackChannel, string> = {
  database: 'SLACK_WEBHOOK_DATABASE_WEBHOOK',
  acquisition: 'SLACK_WEBHOOK_ACQUISITION',
  general: 'SLACK_WEBHOOK_DB_GENERAL',
};

function getWebhookUrl(channel: SlackChannel): string | null {
  const envVar = CHANNEL_ENV_MAP[channel];
  return Deno.env.get(envVar) || null;
}

/**
 * Send message to Slack channel
 * Fire-and-forget - does not await, does not throw
 */
export function sendToSlack(channel: SlackChannel, message: SlackMessage): void {
  const webhookUrl = getWebhookUrl(channel);

  if (!webhookUrl) {
    console.warn(`[slack] ${CHANNEL_ENV_MAP[channel]} not configured, skipping notification`);
    return;
  }

  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  }).catch((e) => {
    console.error('[slack] Failed to send message:', e.message);
  });
}

// ─────────────────────────────────────────────────────────────
// Bot API Functions (for interactive messages)
// ─────────────────────────────────────────────────────────────

/**
 * Send interactive message using Slack Bot API
 * Unlike webhooks, this supports buttons/modals and returns message_ts
 *
 * Requires: SLACK_BOT_TOKEN and SLACK_COHOST_CHANNEL_ID secrets
 */
export async function sendInteractiveMessage(
  channelId: string,
  blocks: SlackBlock[],
  text: string
): Promise<SlackInteractiveResult> {
  const token = Deno.env.get('SLACK_BOT_TOKEN');

  if (!token) {
    console.error('[slack] SLACK_BOT_TOKEN not configured');
    return { ok: false, error: 'Bot token not configured' };
  }

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: channelId,
        blocks,
        text, // Fallback text for notifications
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('[slack] Bot API error:', result.error);
      return { ok: false, error: result.error };
    }

    return { ok: true, ts: result.ts };
  } catch (error) {
    console.error('[slack] Failed to send interactive message:', error);
    return { ok: false, error: (error as Error).message };
  }
}

/**
 * Update an existing Slack message
 * Used to update the original request message after admin claims it
 */
export async function updateSlackMessage(
  channelId: string,
  messageTs: string,
  blocks: SlackBlock[],
  text: string
): Promise<SlackInteractiveResult> {
  const token = Deno.env.get('SLACK_BOT_TOKEN');

  if (!token) {
    return { ok: false, error: 'Bot token not configured' };
  }

  try {
    const response = await fetch('https://slack.com/api/chat.update', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: channelId,
        ts: messageTs,
        blocks,
        text,
      }),
    });

    const result = await response.json();
    return { ok: result.ok, error: result.error };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

/**
 * ErrorCollector - Accumulates errors during a request lifecycle
 * ONE RUN = ONE LOG (only if errors exist)
 */
export class ErrorCollector {
  private functionName: string;
  private action: string;
  private requestId: string;
  private errors: CollectedError[] = [];
  private startTime: string;
  private userId?: string;

  constructor(functionName: string, action: string) {
    this.functionName = functionName;
    this.action = action;
    this.requestId = crypto.randomUUID().slice(0, 8);
    this.startTime = new Date().toISOString();
  }

  setContext(options: { userId?: string }): void {
    if (options.userId) this.userId = options.userId;
  }

  add(error: Error, context?: string): void {
    this.errors.push({
      error,
      context,
      timestamp: new Date().toISOString(),
    });
    console.error(`[${this.functionName}] Error collected:`, error.message, context || '');
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrorCount(): number {
    return this.errors.length;
  }

  getPrimaryError(): Error | null {
    return this.errors.length > 0 ? this.errors[0].error : null;
  }

  reportToSlack(): void {
    if (this.errors.length === 0) {
      return;
    }

    const primaryError = this.errors[0]?.error;
    if (!primaryError || !shouldReportError(primaryError)) {
      return;
    }

    const message = this.formatPlainTextMessage();
    sendToSlack('database', message);
  }

  /**
   * Format all errors into a simple plain text message
   */
  private formatPlainTextMessage(): SlackMessage {
    const errorCount = this.errors.length;
    const lines: string[] = [];

    // Header line
    lines.push(`[Edge Function Error] ${this.functionName}/${this.action}`);
    lines.push('');

    // Basic info
    lines.push(`Request ID: ${this.requestId}`);
    lines.push(`Timestamp: ${this.startTime}`);
    if (this.userId) {
      lines.push(`User ID: ${this.userId}`);
    }
    lines.push('');

    // Errors
    if (errorCount === 1) {
      const err = this.errors[0];
      lines.push(`Error Type: ${err.error.name}`);
      lines.push(`Message: ${err.error.message}`);
      if (err.context) {
        lines.push(`Context: ${err.context}`);
      }
    } else {
      lines.push(`Total Errors: ${errorCount}`);
      lines.push('');

      // Show up to 5 errors
      const errorsToShow = this.errors.slice(0, 5);
      errorsToShow.forEach((err, index) => {
        lines.push(`--- Error ${index + 1} ---`);
        lines.push(`Type: ${err.error.name}`);
        lines.push(`Message: ${err.error.message}`);
        if (err.context) {
          lines.push(`Context: ${err.context}`);
        }
        lines.push('');
      });

      if (errorCount > 5) {
        lines.push(`... and ${errorCount - 5} more errors (check Supabase logs)`);
      }
    }

    return {
      text: lines.join('\n'),
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Convenience Export
// ─────────────────────────────────────────────────────────────

/**
 * Create error collector for a request
 * Convenience function for cleaner imports
 *
 * @deprecated Use createErrorLog() from './functional/errorLog.ts' for new code
 */
export function createErrorCollector(functionName: string, action: string): ErrorCollector {
  return new ErrorCollector(functionName, action);
}

// ─────────────────────────────────────────────────────────────
// Functional API (FP-Friendly)
// ─────────────────────────────────────────────────────────────
//
// Use these functions with the immutable ErrorLog type from './functional/errorLog.ts'
// for pure functional error handling. The ErrorCollector class above is
// maintained for backward compatibility only.

import { ErrorLog, formatForSlack, hasErrors, setUserContext } from './functional/errorLog.ts';

// Re-export setUserContext for convenience
export { setUserContext };

/**
 * Report an immutable ErrorLog to Slack
 * Side effect function - use at effect boundaries only
 *
 * @param log - Immutable ErrorLog to report
 */
export function reportErrorLog(log: ErrorLog): void {
  if (!hasErrors(log)) {
    return;
  }

  const primaryError = log.errors[0]?.error;
  if (!primaryError || !shouldReportError(primaryError)) {
    console.log('[slack] Skipping expected/auth error report');
    return;
  }

  try {
    const message = { text: formatForSlack(log) };
    console.log('[slack] Formatted message:', message.text.substring(0, 200) + '...');
    sendToSlack('database', message);
  } catch (error) {
    console.error('[slack] CRITICAL: formatForSlack failed:', error);
    // Fallback to basic error message
    const fallbackMessage = {
      text: `⚠️ Error logging failed\n\nFunction: ${log.functionName}/${log.action}\nRequest: ${log.correlationId}\n\nOriginal error: ${log.errors[0]?.error?.message || 'Unknown'}`
    };
    sendToSlack('database', fallbackMessage);
  }
}
