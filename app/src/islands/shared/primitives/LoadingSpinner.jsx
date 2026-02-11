/**
 * LoadingSpinner - Reusable loading spinner component
 *
 * Consolidates spinner implementations from across the codebase into one primitive.
 *
 * @example <LoadingSpinner />
 * @example <LoadingSpinner size="sm" />
 * @example <LoadingSpinner size="lg" color="var(--accent-blue)" />
 */


const SIZE_MAP = {
  sm: { dimension: 20, border: 2 },
  md: { dimension: 32, border: 3 },
  lg: { dimension: 48, border: 4 },
};

/**
 * @param {Object} props
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Spinner size preset
 * @param {string} [props.color] - Override the spinner accent color
 * @param {string} [props.className] - Additional class name
 */
export function LoadingSpinner({ size = 'md', color, className }) {
  const { dimension, border } = SIZE_MAP[size] || SIZE_MAP.md;
  const accentColor = color || 'var(--secondary-purple, #6D31C2)';

  const spinnerStyle = {
    display: 'inline-block',
    width: `${dimension}px`,
    height: `${dimension}px`,
    border: `${border}px solid var(--bg-light-gray, #f3f4f6)`,
    borderTop: `${border}px solid ${accentColor}`,
    borderRadius: '50%',
    animation: 'loadingSpinnerRotate 1s linear infinite',
    flexShrink: 0,
  };

  return (
    <>
      <span
        style={spinnerStyle}
        className={className}
        role="status"
        aria-label="Loading"
      />
      <style>{`
        @keyframes loadingSpinnerRotate {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export default LoadingSpinner;
