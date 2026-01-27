import { ChevronDown } from 'lucide-react';
import NavLink from './NavLink.jsx';

export default function NavDropdown({
  label,
  items,
  currentPath = window.location.pathname,
  className = '',
}) {
  return (
    <div className={`admin-header__nav-item ${className}`.trim()}>
      <button
        className="admin-header__nav-trigger"
        type="button"
        aria-haspopup="true"
        aria-expanded="false"
        aria-label={`Open ${label} menu`}
      >
        <span className="admin-header__nav-text">{label}</span>
        <ChevronDown className="admin-header__dropdown-icon" />
      </button>

      <div className="admin-header__dropdown" role="menu" aria-label={`${label} pages`}>
        {items.map((item) => (
          <NavLink
            key={item.id}
            {...item}
            isActive={currentPath === item.path}
          />
        ))}
      </div>
    </div>
  );
}
