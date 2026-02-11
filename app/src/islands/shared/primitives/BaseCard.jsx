/**
 * BaseCard - Reusable card container component
 *
 * Provides consistent padding, border-radius, and shadow matching existing card patterns.
 *
 * @example <BaseCard><h3>Title</h3><p>Content</p></BaseCard>
 * @example <BaseCard onClick={handleClick} className="custom">Clickable</BaseCard>
 * @example <BaseCard as="section">Section card</BaseCard>
 */


const cardStyle = {
  background: 'var(--bg-white, #ffffff)',
  borderRadius: 'var(--rounded-xl, 12px)',
  border: '1px solid var(--border-color, #e5e7eb)',
  boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))',
  padding: 'var(--spacing-xl, 20px)',
};

const clickableAddons = {
  cursor: 'pointer',
  transition: 'box-shadow var(--transition-base, 0.2s) var(--easing-ease, ease), border-color var(--transition-base, 0.2s) var(--easing-ease, ease)',
};

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} [props.className] - Additional class name
 * @param {Function} [props.onClick] - Click handler (makes the card interactive)
 * @param {string} [props.as='div'] - HTML element to render as
 */
export function BaseCard({ children, className, onClick, as: Component = 'div' }) {
  const style = onClick ? { ...cardStyle, ...clickableAddons } : cardStyle;

  return (
    <Component
      style={style}
      className={className}
      onClick={onClick}
      onMouseEnter={onClick ? (e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md, 0 2px 8px rgba(0, 0, 0, 0.08))';
        e.currentTarget.style.borderColor = 'var(--accent-purple, #8C68EE)';
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.05))';
        e.currentTarget.style.borderColor = 'var(--border-color, #e5e7eb)';
      } : undefined}
    >
      {children}
    </Component>
  );
}

export default BaseCard;
