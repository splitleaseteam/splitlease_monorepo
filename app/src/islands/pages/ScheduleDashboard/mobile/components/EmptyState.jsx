/**
 * EmptyState Component
 *
 * Reusable empty state placeholder with icon and message.
 */


/**
 * Empty state component
 * @param {Object} props
 * @param {string} [props.icon='📋'] - Emoji icon to display
 * @param {string} [props.title='No items'] - Main message
 * @param {string} [props.hint] - Secondary hint text
 * @param {React.ReactNode} [props.action] - Optional action button/element
 */
export default function EmptyState({
  icon = '📋',
  title = 'No items',
  hint,
  action
}) {
  return (
    <div className="mobile-empty-state">
      <span className="mobile-empty-state__icon" aria-hidden="true">
        {icon}
      </span>
      <p className="mobile-empty-state__title">{title}</p>
      {hint && (
        <p className="mobile-empty-state__hint">{hint}</p>
      )}
      {action && (
        <div className="mobile-empty-state__action">
          {action}
        </div>
      )}
    </div>
  );
}
