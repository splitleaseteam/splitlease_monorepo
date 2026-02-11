/**
 * PageLoadingState - Shared loading spinner/skeleton component
 *
 * Replaces per-page LoadingState components with a single, configurable primitive.
 * Uses CSS custom properties from styles/variables.css for consistent theming.
 *
 * @example Basic usage (full page centered spinner)
 * ```jsx
 * import { PageLoadingState } from 'islands/shared/primitives/PageLoadingState';
 *
 * if (isLoading) {
 *   return <PageLoadingState />;
 * }
 * ```
 *
 * @example Custom message with small spinner
 * ```jsx
 * <PageLoadingState message="Fetching proposals..." size="sm" />
 * ```
 *
 * @example Inline spinner (not full page)
 * ```jsx
 * <PageLoadingState message="Loading reviews..." size="sm" fullPage={false} />
 * ```
 *
 * @example Large spinner for primary content areas
 * ```jsx
 * <PageLoadingState message="Preparing your dashboard..." size="lg" />
 * ```
 */


/**
 * Spinner size presets (width, height, border thickness)
 */
const SIZE_MAP = {
  sm: { dimension: 32, border: 3 },
  md: { dimension: 48, border: 4 },
  lg: { dimension: 64, border: 5 },
};

/**
 * @param {Object} props
 * @param {string} [props.message='Loading...'] - Text displayed below the spinner
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Spinner size preset
 * @param {boolean} [props.fullPage=true] - Whether to center vertically in the viewport
 * @returns {JSX.Element}
 */
export function PageLoadingState({
  message = 'Loading...',
  size = 'md',
  fullPage = true,
}) {
  const { dimension, border } = SIZE_MAP[size] || SIZE_MAP.md;

  /** Container styles - full page centers in viewport, inline flows naturally */
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    ...(fullPage
      ? { minHeight: '60vh', padding: '2rem' }
      : { padding: '2rem 1rem' }),
  };

  /** Spinner ring - matches the ViewSplitLeasePage inline spinner pattern */
  const spinnerStyle = {
    width: `${dimension}px`,
    height: `${dimension}px`,
    border: `${border}px solid var(--bg-light-gray, #f3f4f6)`,
    borderTop: `${border}px solid var(--secondary-purple, #6D31C2)`,
    borderRadius: '50%',
    animation: 'pageLoadingSpin 1s linear infinite',
  };

  /** Message text - uses design system text variables */
  const messageStyle = {
    marginTop: 'var(--spacing-lg, 16px)',
    fontSize: 'var(--text-base, 14px)',
    color: 'var(--text-gray, #6b7280)',
    fontFamily: 'var(--font-inter, "Inter", sans-serif)',
    fontWeight: 'var(--font-weight-normal, 400)',
    textAlign: 'center',
  };

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle} />
      {message && <p style={messageStyle}>{message}</p>}
      <style>{`
        @keyframes pageLoadingSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default PageLoadingState;
