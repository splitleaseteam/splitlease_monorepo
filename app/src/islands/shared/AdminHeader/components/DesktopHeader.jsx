import NavDropdown from './NavDropdown.jsx';
import UserSection from './UserSection.jsx';
import { navigationConfig } from '../config/navigationConfig.js';

export default function DesktopHeader({
  currentPath,
  user,
  showCTA,
  ctaText,
  onCTAClick,
}) {
  return (
    <div className="admin-header__desktop">
      <div className="admin-header__left">
        <a className="admin-header__logo" href="/">
          <img
            className="admin-header__logo-img"
            src="/assets/images/split-lease-purple-circle.png"
            alt="Split Lease"
          />
          <span className="admin-header__logo-text">Split Lease</span>
        </a>

        <nav className="admin-header__nav" role="navigation" aria-label="Admin pages navigation">
          {navigationConfig.dropdowns.map((dropdown) => (
            <NavDropdown
              key={dropdown.id}
              label={dropdown.label}
              items={dropdown.items}
              currentPath={currentPath}
            />
          ))}
        </nav>
      </div>

      <div className="admin-header__right">
        {showCTA && (
          <button
            className="admin-header__cta-button"
            type="button"
            onClick={onCTAClick}
          >
            {ctaText}
          </button>
        )}
        <UserSection user={user} />
      </div>
    </div>
  );
}
