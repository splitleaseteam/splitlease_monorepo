/**
 * Toast Adapter - Bridge from toastService.js API to Toast.jsx context system
 *
 * @deprecated This adapter exists only for gradual migration. New code should import
 * { useToast } from 'islands/shared/Toast' directly (inside React components) or use
 * the global showToast from 'islands/shared/Toast' (outside React components).
 *
 * PURPOSE:
 * The codebase has two competing toast systems:
 *   1. toastService.js  - pub/sub pattern with `toast.success(msg)` convenience API
 *   2. Toast.jsx        - React context pattern with `useToast()` hook and global showToast
 *
 * Toast.jsx is the canonical system going forward. This adapter exposes the SAME
 * convenience API as toastService.js (`toast.success`, `toast.error`, etc.) but
 * delegates internally to Toast.jsx's global showToast function.
 *
 * HOW TO USE:
 * In any file that currently does:
 *   import { toast } from '../../lib/toastService.js';
 *
 * Replace with:
 *   import { toast } from '../../lib/toastAdapter.js';
 *
 * Behavior is identical, but now the notification is routed through Toast.jsx's
 * context-based renderer (with progress bars, icons, title/content support, etc.)
 *
 * MIGRATION COMPLETE?
 * Once all toastService.js imports are gone, this adapter can also be removed.
 * See TOAST_MIGRATION_GUIDE.md for the full migration plan.
 */

import { showToast as globalShowToast } from '../islands/shared/Toast';

/**
 * Toast type constants (matching toastService.js for drop-in compatibility)
 */
export const ToastType = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

/**
 * Show a toast notification via the canonical Toast.jsx system.
 *
 * Supports the same signature as toastService.js:
 *   showToast(message, type, duration)
 *
 * Also supports the Toast.jsx options-object signature:
 *   showToast({ title, content, type, duration, showProgress })
 *
 * @param {string|Object} messageOrOptions - Message string or options object
 * @param {string} [type='info'] - One of ToastType values (when using string signature)
 * @param {number} [duration=5000] - Duration in ms (when using string signature)
 */
export function showToast(messageOrOptions, type = ToastType.INFO, duration = 5000) {
  if (typeof messageOrOptions === 'string') {
    // toastService.js-style call: showToast('message', 'success', 3000)
    // Convert to Toast.jsx format
    globalShowToast({
      title: messageOrOptions,
      type: type,
      duration: duration,
    });
  } else {
    // Already an options object -- pass through directly
    globalShowToast(messageOrOptions);
  }
}

/**
 * Subscribe stub for backward compatibility.
 *
 * @deprecated The context-based Toast.jsx system does not use pub/sub.
 * This is a no-op that returns an unsubscribe function.
 * No code in the codebase currently calls subscribeToToasts, so this
 * exists purely as a safety net during migration.
 *
 * @param {Function} _listener - Ignored
 * @returns {Function} No-op unsubscribe function
 */
export function subscribeToToasts(_listener) {
  console.warn(
    '[toastAdapter] subscribeToToasts is deprecated. ' +
    'The canonical Toast.jsx system uses React context, not pub/sub. ' +
    'Use useToast() from Toast.jsx instead.'
  );
  return () => {}; // no-op unsubscribe
}

/**
 * Convenience methods -- drop-in replacement for toastService.js `toast` object.
 *
 * @deprecated Prefer useToast() from Toast.jsx inside React components.
 *
 * Usage (identical to toastService.js):
 *   toast.success('Saved!');
 *   toast.error('Something went wrong');
 *   toast.warning('Check your input');
 *   toast.info('Tip: you can drag to reorder');
 */
export const toast = {
  success: (msg, duration) => showToast(msg, ToastType.SUCCESS, duration),
  error: (msg, duration) => showToast(msg, ToastType.ERROR, duration),
  warning: (msg, duration) => showToast(msg, ToastType.WARNING, duration),
  info: (msg, duration) => showToast(msg, ToastType.INFO, duration),
};
