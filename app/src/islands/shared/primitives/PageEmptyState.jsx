/**
 * PageEmptyState - Shared empty/no-data display component
 *
 * Replaces per-page EmptyState components with a single, configurable primitive.
 * Uses CSS custom properties from styles/variables.css for consistent theming.
 * Self-contained with inline SVG icons -- no external icon dependencies.
 *
 * @example Simple usage (title only)
 * ```jsx
 * import { PageEmptyState } from 'islands/shared/primitives/PageEmptyState';
 *
 * {items.length === 0 && (
 *   <PageEmptyState title="No proposals yet" />
 * )}
 * ```
 *
 * @example With description and action button
 * ```jsx
 * <PageEmptyState
 *   title="No leases found"
 *   description="Leases are created when a proposal is accepted and documents are signed."
 *   actionLabel="View Proposals"
 *   onAction={() => navigateTo('/guest-proposals')}
 * />
 * ```
 *
 * @example With custom icon (React node)
 * ```jsx
 * import { MessageSquare } from 'lucide-react';
 *
 * <PageEmptyState
 *   icon={<MessageSquare size={48} />}
 *   title="No messages"
 *   description="Start a conversation with a host by submitting a proposal."
 * />
 * ```
 *
 * @example Illustrated variant (larger visual area with background circle)
 * ```jsx
 * <PageEmptyState
 *   variant="illustrated"
 *   title="No favorites yet"
 *   description="Save listings you love by tapping the heart icon."
 *   actionLabel="Explore Rentals"
 *   onAction={() => window.location.href = '/search'}
 * />
 * ```
 *
 * @example With clear-filters action (common pattern)
 * ```jsx
 * <PageEmptyState
 *   title="No results match your filters"
 *   description="Try adjusting your selection to see more options."
 *   actionLabel="Clear Filters"
 *   onAction={handleClearFilters}
 * />
 * ```
 */


/**
 * Default icon shown when no custom `icon` prop is provided.
 * A simple document/empty-box SVG matching existing EmptyState patterns.
 */
function DefaultEmptyIcon() {
  return (
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
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

/**
 * @param {Object} props
 * @param {React.ReactNode} [props.icon] - Custom icon element (e.g., lucide-react icon or SVG)
 * @param {string} props.title - Primary heading (e.g., "No proposals yet")
 * @param {string} [props.description] - Explanatory text below the title
 * @param {string} [props.actionLabel] - Button text (only rendered if provided with onAction)
 * @param {Function} [props.onAction] - Click handler for the action button
 * @param {'simple'|'illustrated'} [props.variant='simple'] - Visual style variant
 * @returns {JSX.Element}
 */
export function PageEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'simple',
}) {
  const isIllustrated = variant === 'illustrated';

  /** Outer container */
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: isIllustrated ? '3rem 2rem' : '2rem 1rem',
  };

  /**
   * Icon wrapper - "illustrated" variant wraps the icon in a tinted circle
   * background, matching the FavoriteListingsPage and ReviewsOverviewPage patterns.
   */
  const iconWrapperStyle = isIllustrated
    ? {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '96px',
        height: '96px',
        borderRadius: '50%',
        background: 'var(--bg-off-white, #fcfaff)',
        border: '1px solid var(--border-color, #e5e7eb)',
        marginBottom: 'var(--spacing-xl, 20px)',
        color: 'var(--text-light-gray, #9ca3af)',
      }
    : {
        color: 'var(--text-light-gray, #9ca3af)',
        marginBottom: 'var(--spacing-lg, 16px)',
      };

  /** Title */
  const titleStyle = {
    fontSize: isIllustrated ? 'var(--text-xl, 20px)' : 'var(--text-lg, 18px)',
    fontWeight: 'var(--font-weight-semibold, 600)',
    color: 'var(--text-dark, #1a1a1a)',
    fontFamily: 'var(--font-inter, "Inter", sans-serif)',
    margin: '0 0 var(--spacing-sm, 8px) 0',
  };

  /** Description */
  const descriptionStyle = {
    fontSize: 'var(--text-base, 14px)',
    color: 'var(--text-gray, #6b7280)',
    fontFamily: 'var(--font-inter, "Inter", sans-serif)',
    lineHeight: 'var(--line-height-normal, 1.5)',
    margin: '0',
    maxWidth: '420px',
  };

  /** Action button - matches CTA patterns from existing EmptyState components */
  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm, 8px)',
    marginTop: 'var(--spacing-xl, 20px)',
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
  };

  return (
    <div style={containerStyle}>
      {/* Icon area */}
      <div style={iconWrapperStyle}>
        {icon || <DefaultEmptyIcon />}
      </div>

      {/* Title (required) */}
      <h3 style={titleStyle}>{title}</h3>

      {/* Description (optional) */}
      {description && <p style={descriptionStyle}>{description}</p>}

      {/* Action button (optional - requires both label and handler) */}
      {actionLabel && onAction && (
        <button
          type="button"
          style={buttonStyle}
          onClick={onAction}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent-purple, #8C68EE)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--secondary-purple, #6D31C2)';
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default PageEmptyState;
