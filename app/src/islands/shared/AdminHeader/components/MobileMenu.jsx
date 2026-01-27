import { X } from 'lucide-react';

export default function MobileMenu({ isOpen, onClose, children }) {
  return (
    <div className={`admin-header__mobile-menu ${isOpen ? 'admin-header__mobile-menu--open' : ''}`.trim()}>
      <div className="admin-header__mobile-menu-header">
        <button
          className="admin-header__mobile-close"
          type="button"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={24} />
        </button>
      </div>

      <div className="admin-header__mobile-menu-content">
        {children}
      </div>
    </div>
  );
}
