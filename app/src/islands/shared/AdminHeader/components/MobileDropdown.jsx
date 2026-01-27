import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import NavLink from './NavLink.jsx';

export default function MobileDropdown({ label, items, currentPath = window.location.pathname }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="admin-header__mobile-dropdown">
      <button
        className="admin-header__mobile-dropdown-trigger"
        type="button"
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Toggle ${label} menu`}
      >
        <span>{label}</span>
        <ChevronDown className={`admin-header__mobile-dropdown-icon ${isOpen ? 'is-open' : ''}`.trim()} />
      </button>

      <div
        className={`admin-header__mobile-dropdown-content ${isOpen ? 'admin-header__mobile-dropdown-content--open' : ''}`.trim()}
        role="menu"
        aria-label={`${label} pages`}
      >
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
