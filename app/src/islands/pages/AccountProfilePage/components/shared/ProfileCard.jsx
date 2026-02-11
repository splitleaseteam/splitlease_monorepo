/**
 * ProfileCard.jsx
 *
 * Reusable card wrapper with consistent styling for all profile content cards.
 * Supports optional header action (e.g., edit button for public view).
 * Supports optional subtitle for secondary description.
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function ProfileCard({
  id,
  title,
  subtitle,
  children,
  className = '',
  headerAction = null,
  collapsible = false,
  defaultCollapsed = false
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  return (
    <div id={id} className={`profile-card ${className}`}>
      <div
        className={`profile-card-header ${collapsible ? 'collapsible' : ''}`.trim()}
        onClick={collapsible ? toggleCollapse : undefined}
      >
        <div>
          <h2 className="profile-card-title">{title}</h2>
          {subtitle && (
            <p className="profile-card-subtitle">{subtitle}</p>
          )}
        </div>
        {collapsible && (
          <ChevronDown className={`collapse-icon ${isCollapsed ? 'collapsed' : ''}`} />
        )}
        {headerAction && (
          <div className="profile-card-header-action">
            {headerAction}
          </div>
        )}
      </div>
      {collapsible ? (
        !isCollapsed && (
          <div className="profile-card-content">{children}</div>
        )
      ) : (
        <div className="profile-card-content">{children}</div>
      )}
    </div>
  );
}
