import { useState } from 'react';
import { Menu } from 'lucide-react';
import MobileMenu from './MobileMenu.jsx';
import MobileDropdown from './MobileDropdown.jsx';
import UserSection from './UserSection.jsx';
import { navigationConfig } from '../config/navigationConfig.js';

export default function MobileHeader({ user, currentPath }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="admin-header__mobile">
      <button
        className="admin-header__hamburger"
        type="button"
        onClick={handleToggle}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
      >
        <Menu size={24} />
      </button>

      <div className="admin-header__mobile-logo">
        <img
          src="/assets/images/split-lease-purple-circle.png"
          alt="Split Lease"
          className="admin-header__logo-img"
        />
      </div>

      <MobileMenu isOpen={isOpen} onClose={handleClose}>
        {navigationConfig.dropdowns.map((dropdown) => (
          <MobileDropdown
            key={dropdown.id}
            label={dropdown.label}
            items={dropdown.items}
            currentPath={currentPath}
          />
        ))}
        <UserSection user={user} />
      </MobileMenu>
    </div>
  );
}
