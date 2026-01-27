/**
 * ErrorLog - Immutable Error Collection
 * Split Lease - FP Utilities
 *
 * Functional replacement for the ErrorCollector class.
 * All operations return new immutable structures instead of mutating.
 *
 * Pattern: Create log -> Add errors via pure functions -> Format at boundary
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/**
 * A single collected error with context
 */
interface CollectedError {
  readonly error: Error;
  readonly context?: string;
  readonly timestamp: string;
}

/**
 * Immutable error log for a request lifecycle
 */
export interface ErrorLog {
  readonly functionName: string;
  readonly action: string;
  readonly correlationId: string;
  readonly startTime: string;
  readonly userId?: string;
  readonly userName?: string;
  readonly userEmail?: string;
  readonly errors: ReadonlyArray<CollectedError>;
}

// ─────────────────────────────────────────────────────────────
// Constructors (Pure)
// ─────────────────────────────────────────────────────────────

/**
 * Create a new error log for a request
 * Pure function - only creates data structure
 */
export const createErrorLog = (
  functionName: string,
  action: string,
  correlationId: string = crypto.randomUUID().slice(0, 8)
): ErrorLog => ({
  functionName,
  action,
  correlationId,
  startTime: new Date().toISOString(),
  errors: [],
});

// ─────────────────────────────────────────────────────────────
// Transformations (Pure)
// ─────────────────────────────────────────────────────────────

/**
 * Add an error to the log (returns new log, original unchanged)
 */
export const addError = (
  log: ErrorLog,
  error: Error,
  context?: string
): ErrorLog => ({
  ...log,
  errors: [
    ...log.errors,
    {
      error,
      context,
      timestamp: new Date().toISOString(),
    },
  ],
});

/**
 * Set the user ID on the log (returns new log)
 */
export const setUserId = (log: ErrorLog, userId: string): ErrorLog => ({
  ...log,
  userId,
});

/**
 * Update the action name (for when action is parsed after log creation)
 */
export const setAction = (log: ErrorLog, action: string): ErrorLog => ({
  ...log,
  action,
});

/**
 * Set user context (ID, name, email) on the log (returns new log)
 */
export const setUserContext = (
  log: ErrorLog,
  context: { userId: string; userName?: string; userEmail?: string }
): ErrorLog => ({
  ...log,
  userId: context.userId,
  userName: context.userName,
  userEmail: context.userEmail,
});

// ─────────────────────────────────────────────────────────────
// Predicates (Pure)
// ─────────────────────────────────────────────────────────────

/**
 * Check if the log contains any errors
 */
export const hasErrors = (log: ErrorLog): boolean =>
  log.errors.length > 0;

/**
 * Get the error count
 */
export const getErrorCount = (log: ErrorLog): number =>
  log.errors.length;

/**
 * Get the primary (first) error, if any
 */
export const getPrimaryError = (log: ErrorLog): Error | null =>
  log.errors.length > 0 ? log.errors[0].error : null;

// ─────────────────────────────────────────────────────────────
// Helper Functions (Pure)
// ─────────────────────────────────────────────────────────────

/**
 * Convert ISO timestamp to human-readable relative time
 * Examples: "Just now", "2 min ago", "Today at 3:15 PM", "Yesterday at 8:00 AM"
 */
const getRelativeTime = (isoTimestamp: string): string => {
  const now = new Date();
  const then = new Date(isoTimestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  // Just now (< 1 minute)
  if (diffMins < 1) return 'Just now';

  // Minutes ago (< 60 minutes)
  if (diffMins < 60) return `${diffMins} min ago`;

  // Hours ago (< 24 hours)
  if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  // Format time as "3:15 PM EST" (assuming EST for now)
  const timeStr = then.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  });

  // Yesterday
  if (diffMins < 2880) return `Yesterday at ${timeStr}`;

  // Today or earlier
  const dateStr = then.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  });
  return `${dateStr} at ${timeStr}`;
};

/**
 * Infer likely cause from error message
 * Returns null if no pattern matches
 */
const inferLikelyCause = (error: Error): string | null => {
  const msg = error.message.toLowerCase();

  if (msg.includes('could not find the function') || msg.includes('function') && msg.includes('not found')) {
    return 'Missing migration or function was dropped';
  }
  if (msg.includes('authentication') || msg.includes('unauthorized') || msg.includes('invalid token')) {
    return 'Invalid or expired auth token';
  }
  if (msg.includes('network') || msg.includes('timeout') || msg.includes('econnrefused')) {
    return 'Network issue or external API down';
  }
  if (msg.includes('validation') || msg.includes('invalid') && msg.includes('input')) {
    return 'Invalid input from user';
  }
  if (msg.includes('permission') || msg.includes('forbidden') || msg.includes('access denied')) {
    return 'Permission issue or RLS policy blocking access';
  }
  if (msg.includes('duplicate') || msg.includes('unique constraint')) {
    return 'Duplicate record or unique constraint violation';
  }
  if (msg.includes('foreign key') || msg.includes('violates foreign key constraint')) {
    return 'Foreign key constraint violation';
  }

  return null;
};

/**
 * Generate actionable suggestions based on error
 * Returns array of suggestions to check
 */
const getActionableSuggestions = (error: Error, functionName: string): string[] => {
  const msg = error.message.toLowerCase();
  const suggestions: string[] = [];

  if (msg.includes('could not find the function') || msg.includes('function') && msg.includes('not found')) {
    suggestions.push('Run pending migrations in Supabase');
    suggestions.push(`Verify the database function exists`);
    suggestions.push('Check recent schema changes in migrations/');
  } else if (msg.includes('authentication') || msg.includes('unauthorized')) {
    suggestions.push('Check if user token is expired');
    suggestions.push('Verify auth flow is working');
    suggestions.push('Check Supabase Auth logs');
  } else if (msg.includes('network') || msg.includes('timeout')) {
    suggestions.push('Check external API status');
    suggestions.push('Verify network connectivity');
    suggestions.push('Review timeout configurations');
  } else if (msg.includes('permission') || msg.includes('forbidden')) {
    suggestions.push('Review RLS policies on affected table');
    suggestions.push('Check user permissions');
    suggestions.push('Verify service role key usage');
  } else if (msg.includes('foreign key')) {
    suggestions.push('Check if referenced record exists');
    suggestions.push('Review FK constraints on table');
    suggestions.push('Verify data integrity');
  } else {
    // Generic suggestions
    suggestions.push(`Check Supabase logs for ${functionName}`);
    suggestions.push('Review recent deployments');
    suggestions.push('Verify environment variables are set');
  }

  return suggestions;
};

/**
 * Convert action to user-friendly description
 * Maps technical action names to plain English
 */
const getActionDescription = (action: string): string => {
  const descriptions: Record<string, string> = {
    // Messages
    'get_threads': 'check their messages',
    'send_message': 'send a message',
    'get_messages': 'view messages',

    // Auth
    'login': 'log in',
    'signup': 'sign up',
    'logout': 'log out',
    'validate': 'validate their session',
    'request_password_reset': 'reset their password',
    'update_password': 'update their password',

    // Proposals
    'create': 'create a proposal',
    'update': 'update a proposal',
    'get': 'view details',
    'suggest': 'get suggestions',

    // Listings
    'submit': 'submit a listing',

    // Generic fallback
  };

  return descriptions[action] || action.replace(/_/g, ' ');
};

/**
 * Get user impact description from function/action combination
 * Describes what the user can't do because of this error
 */
const getUserImpact = (functionName: string, action: string): string => {
  const key = `${functionName}/${action}`;

  const impacts: Record<string, string> = {
    // Messages
    'messages/get_threads': "Can't view message threads",
    'messages/send_message': "Can't send messages",
    'messages/get_messages': "Can't view messages",

    // Auth
    'auth-user/login': "Can't log in",
    'auth-user/signup': "Can't create account",
    'auth-user/validate': "Can't validate session",

    // Proposals
    'proposal/create': "Can't submit proposal",
    'proposal/update': "Can't update proposal",
    'proposal/get': "Can't view proposal details",

    // Listings
    'listing/create': "Can't create listing",
    'listing/submit': "Can't submit listing",
    'listing/get': "Can't view listing details",
  };

  return impacts[key] || `${functionName} action failed`;
};

/**
 * Get emoji based on function/action severity
 * Critical errors (auth, payment) get 🚨, others get 💥
 */
const getSeverityEmoji = (functionName: string, action: string): string => {
  const critical = ['auth-user', 'payment', 'stripe'];

  if (critical.some(name => functionName.includes(name))) {
    return '🚨';
  }

  return '💥';
};

// ─────────────────────────────────────────────────────────────
// Formatters (Pure)
// ─────────────────────────────────────────────────────────────

/**
 * Format the error log for Slack notification (compressed, human-friendly)
 * Pure function - produces string from data
 *
 * Template:
 * {emoji} {plain_english_impact}
 *
 * {technical_error_detail}
 * → Likely cause: {inferred_cause}
 *
 * User: {name} ({email}, ID: {short_id})
 * When: {relative_time}
 *
 * 🔍 What to check:
 * • {actionable_item_1}
 * • {actionable_item_2}
 * • {actionable_item_3}
 *
 * Function: {function_name}/{action} (req: {request_id})
 */
export const formatForSlack = (log: ErrorLog): string => {
  const lines: string[] = [];

  // Handle case with no errors (shouldn't happen, but defensive)
  if (log.errors.length === 0) {
    return `No errors recorded for ${log.functionName}/${log.action} (req: ${log.correlationId})`;
  }

  const primaryError = log.errors[0].error;
  const emoji = getSeverityEmoji(log.functionName, log.action);
  const impact = getUserImpact(log.functionName, log.action);

  // 1. HEADLINE: Emoji + plain English impact
  lines.push(`${emoji} ${impact}`);
  lines.push('');

  // 2. TECHNICAL ERROR: Show actual error message
  lines.push(primaryError.message);

  // 3. LIKELY CAUSE: Inferred from error message
  const likelyCause = inferLikelyCause(primaryError);
  if (likelyCause) {
    lines.push(`→ Likely cause: ${likelyCause}`);
  }
  lines.push('');

  // 4. USER CONTEXT: Name, email, ID (if available)
  if (log.userId) {
    const shortId = log.userId.length > 8 ? log.userId.slice(0, 8) : log.userId;

    if (log.userName && log.userEmail) {
      lines.push(`User: ${log.userName} (${log.userEmail}, ID: ${shortId})`);
    } else if (log.userEmail) {
      lines.push(`User: ${log.userEmail} (ID: ${shortId})`);
    } else if (log.userName) {
      lines.push(`User: ${log.userName} (ID: ${shortId})`);
    } else {
      lines.push(`User: ID ${shortId}`);
    }
  } else {
    lines.push('User: Not logged in');
  }

  // 5. WHEN: Relative time
  lines.push(`When: ${getRelativeTime(log.startTime)}`);
  lines.push('');

  // 6. ACTIONABLE SUGGESTIONS: What to check
  const suggestions = getActionableSuggestions(primaryError, log.functionName);
  if (suggestions.length > 0) {
    lines.push('🔍 What to check:');
    suggestions.forEach(suggestion => {
      lines.push(`• ${suggestion}`);
    });
    lines.push('');
  }

  // 7. TECHNICAL DETAILS: Function, action, request ID (at bottom)
  lines.push(`Function: ${log.functionName}/${log.action} (req: ${log.correlationId})`);

  // 8. MULTIPLE ERRORS: If more than one error, note it
  if (log.errors.length > 1) {
    lines.push(`Note: ${log.errors.length - 1} additional error${log.errors.length > 2 ? 's' : ''} occurred (check Supabase logs)`);
  }

  return lines.join('\n');
};

/**
 * Format the error log as JSON for structured logging
 */
export const formatAsJson = (log: ErrorLog): string =>
  JSON.stringify({
    functionName: log.functionName,
    action: log.action,
    correlationId: log.correlationId,
    startTime: log.startTime,
    userId: log.userId,
    errorCount: log.errors.length,
    errors: log.errors.map(e => ({
      name: e.error.name,
      message: e.error.message,
      context: e.context,
      timestamp: e.timestamp,
    })),
  }, null, 2);

/**
 * Format for console logging (abbreviated)
 */
export const formatForConsole = (log: ErrorLog): string => {
  if (log.errors.length === 0) {
    return `[${log.functionName}/${log.action}] No errors`;
  }

  const primary = log.errors[0];
  const countSuffix = log.errors.length > 1
    ? ` (+${log.errors.length - 1} more)`
    : '';

  return `[${log.functionName}/${log.action}] ${primary.error.name}: ${primary.error.message}${countSuffix}`;
};
