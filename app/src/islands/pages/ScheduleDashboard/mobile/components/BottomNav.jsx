/**
 * BottomNav Component
 *
 * Mobile tab bar navigation for ScheduleDashboard.
 * Displays 4 tabs: Calendar, Chat, History, Settings.
 */


const NAV_ITEMS = [
  { id: 'calendar', icon: '📅', label: 'Calendar' },
  { id: 'chat', icon: '💬', label: 'Chat' },
  { id: 'transactions', icon: '📋', label: 'History' },
  { id: 'settings', icon: '⚙️', label: 'Settings' }
];

/**
 * Bottom navigation tab bar
 * @param {Object} props
 * @param {string} props.activeTab - Currently active tab id
 * @param {function} props.onTabChange - Callback when tab changes (receives tab id)
 */
export function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="mobile-bottom-nav" role="tablist" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          role="tab"
          aria-selected={activeTab === item.id}
          className={`mobile-nav-tab ${activeTab === item.id ? 'mobile-nav-tab--active' : ''}`}
          onClick={() => onTabChange(item.id)}
        >
          <span className="mobile-nav-tab__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="mobile-nav-tab__label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export { NAV_ITEMS };
