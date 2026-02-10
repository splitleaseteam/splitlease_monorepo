/**
 * PageErrorState - Shared error display component
 *
 * Replaces per-page ErrorState components with a single, configurable primitive.
 * Uses CSS custom properties from styles/variables.css for consistent theming.
 * Renders an inline SVG warning icon (no external icon dependencies).
 *
 * @example Basic usage (full page centered)
 * ```jsx
 * import { PageErrorState } from 'islands/shared/primitives/PageErrorState';
 *
 * if (error) {
 *   return <PageErrorState message={error} onRetry={() => fetchData()} />;
 * }
 * ```
 *
 * @example With technical details
 * ```jsx
 * <PageErrorState
 *   message="Unable to load proposals"
 *   details={error.message}
 *   onRetry={handleRetry}
 * />
 * ```
 *
 * @example Inline error (not full page)
 * ```jsx
 * <PageErrorState
 *   message="Could not load reviews"
 *   fullPage={false}
 * />
 * ```
 *
 * @example Without retry button
 * ```jsx
 * <PageErrorState message="This listing is no longer available" />
 * ```
 */

import React from 'react';

/**
 * @param {Object} props
 * @param {string} [props.message='Something went wrong'] - User-facing error message
 * @param {string} [props.details] - Optional technical error details (shown in muted text)
 * @param {Function} [props.onRetry] - If provided, renders a "Try Again" button
 * @param {boolean} [props.fullPage=true] - Whether to center vertically in the viewport
 * @returns {JSX.Element}
 */
export function PageErrorState({
  message = 'Something went wrong',
  details,
  onRetry,
  fullPage = true,
}) {
  /** Container - matches the centered pattern from existing ErrorState components */
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    ...(fullPage
      ? { minHeight: '60vh', justifyContent: 'center', padding: '2rem' }
      : { padding: '2rem 1rem' }),
    maxWidth: '600px',
    margin: '0 auto',
  };

  /** Warning icon wrapper */
  const iconStyle = {
    color: 'var(--text-light-gray, #9ca3af)',
    marginBottom: 'var(--spacing-lg, 16px)',
  };

  /** Title - "Something went wrong" heading */
  const titleStyle = {
    fontSize: 'var(--text-xl, 20px)',
    fontWeight: 'var(--font-weight-semibold, 600)',
    color: 'var(--text-dark, #1a1a1a)',
    fontFamily: 'var(--font-inter, "Inter", sans-serif)',
    margin: '0 0 var(--spacing-sm, 8px) 0',
  };

  /** Error message text */
  const messageStyle = {
    fontSize: 'var(--text-base, 14px)',
    color: 'var(--text-gray, #6b7280)',
    fontFamily: 'var(--font-inter, "Inter", sans-serif)',
    lineHeight: 'var(--line-height-normal, 1.5)',
    margin: '0 0 var(--spacing-sm, 8px) 0',
  };

  /** Technical details - smaller, muted */
  const detailsStyle = {
    fontSize: 'var(--text-sm, 12px)',
    color: 'var(--text-light-gray, #9ca3af)',
    fontFamily: 'var(--font-inter, "Inter", sans-serif)',
    lineHeight: 'var(--line-height-normal, 1.5)',
    margin: '0 0 var(--spacing-xl, 20px) 0',
    wordBreak: 'break-word',
  };

  /** Retry button - matches existing ErrorState button patterns */
  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm, 8px)',
    padding: '10px 24px',
    background: 'var(--secondary-purple, #6D31C2)',
    color: 'var(--bg-white, #ffffff)',
    border: 'none',
    borderRadius: 'var(--rounded-lg, 8px)',
    fontSize: 'var(--text-base, 14px)',
    fontWeight: 'var(--font-weight-semibold, 600)',
    fontFamily: 'var(--font-inter, "Inter", sans-serif)',
    cursor: 'pointer',
    transition: 'background var(--transition-base, 0.2s) var(--easing-ease, ease)',
    marginTop: details ? '0' : 'var(--spacing-lg, 16px)',
  };

  return (
    <div style={containerStyle}>
      {/* Warning triangle icon - inline SVG, no external dependency */}
      <div style={iconStyle}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="48"
          height="48"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h3 style={titleStyle}>Something went wrong</h3>
      <p style={messageStyle}>{message}</p>

      {details && <p style={detailsStyle}>{details}</p>}

      {onRetry && (
        <button
          type="button"
          style={buttonStyle}
          onClick={onRetry}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-purple, #8C68EE)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--secondary-purple, #6D31C2)';
          }}
        >
          {/* Retry icon - small refresh arrow */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="16"
            height="16"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Try Again
        </button>
      )}
    </div>
  );
}

export default PageErrorState;
