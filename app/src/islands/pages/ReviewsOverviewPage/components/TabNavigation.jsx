/**
 * TabNavigation Component
 *
 * Three-tab navigation for the Reviews Overview page.
 * Shows badge counts for each tab when available.
 */

import { Clock, MessageSquare, CheckCircle } from 'lucide-react';
import './TabNavigation.css';

const TABS = [
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'received', label: 'Received', icon: MessageSquare },
  { id: 'submitted', label: 'Submitted', icon: CheckCircle }
];

export default function TabNavigation({ activeTab, onTabChange, counts = {} }) {
  return (
    <nav className="reviews-tab-nav" role="tablist">
      {TABS.map(tab => {
        const Icon = tab.icon;
        const count = counts[tab.id] || 0;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            className={`reviews-tab-nav__tab ${isActive ? 'reviews-tab-nav__tab--active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-selected={isActive}
            aria-controls={`${tab.id}-panel`}
          >
            <Icon size={18} className="reviews-tab-nav__icon" />
            <span className="reviews-tab-nav__label">{tab.label}</span>
            {count > 0 && (
              <span className="reviews-tab-nav__badge" aria-label={`${count} ${tab.label.toLowerCase()}`}>
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
