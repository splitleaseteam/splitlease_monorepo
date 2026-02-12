/**
 * Development-aware logging utility with configurable log levels
 *
 * Defaults to WARN/ERROR in all environments.
 * Enable verbose logging with localStorage.debug='*' or set localStorage.logLevel.
 *
 * @example
 * import { logger } from '../../lib/logger.js';
 *
 * logger.debug('📅 ViewSplitLeasePage: Loading schedule'); // Only in dev
 * logger.info('[Component] Rendering...'); // Only in dev
 * logger.warn('[Component] Deprecated API used'); // Dev + prod
 * logger.error('[Component] Failed:', err); // Always logs
 */

const LOG_LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

const LEVEL_NAMES = {
  debug: LOG_LEVEL.DEBUG,
  info: LOG_LEVEL.INFO,
  warn: LOG_LEVEL.WARN,
  error: LOG_LEVEL.ERROR,
  none: LOG_LEVEL.NONE
};

function readStorage(key) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function getCurrentLevel() {
  const debugFlag = readStorage('debug');
  if (debugFlag && debugFlag.trim() === '*') {
    return LOG_LEVEL.DEBUG;
  }

  const configuredLevel = readStorage('logLevel') || readStorage('sl:log-level');
  if (configuredLevel) {
    const normalized = configuredLevel.trim().toLowerCase();
    if (LEVEL_NAMES[normalized] !== undefined) {
      return LEVEL_NAMES[normalized];
    }
  }

  // Default for both DEV and PROD: only WARN/ERROR.
  return LOG_LEVEL.WARN;
}

export const logger = {
  debug: (...args) => getCurrentLevel() <= LOG_LEVEL.DEBUG && console.log('[DEBUG]', ...args),
  info: (...args) => getCurrentLevel() <= LOG_LEVEL.INFO && console.log('[INFO]', ...args),
  warn: (...args) => getCurrentLevel() <= LOG_LEVEL.WARN && console.warn('[WARN]', ...args),
  error: (...args) => getCurrentLevel() <= LOG_LEVEL.ERROR && console.error('[ERROR]', ...args)
};
