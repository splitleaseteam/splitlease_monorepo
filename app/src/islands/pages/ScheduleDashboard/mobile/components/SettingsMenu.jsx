/**
 * SettingsMenu Component
 *
 * Main settings menu with navigation items.
 */


/**
 * Settings menu items configuration
 */
const MENU_ITEMS = [
  {
    id: 'pricing',
    icon: '💰',
    label: 'Buyout Pricing',
    description: 'Set your rates for buyouts'
  },
  {
    id: 'sharing',
    icon: '🏠',
    label: 'Sharing Preferences',
    description: 'Room sharing settings'
  },
  {
    id: 'notifications',
    icon: '🔔',
    label: 'Notifications',
    description: 'Coming soon',
    disabled: true
  },
  {
    id: 'account',
    icon: '👤',
    label: 'Account',
    description: 'Coming soon',
    disabled: true
  }
];

/**
 * Settings menu component
 * @param {Object} props
 * @param {function} props.onSelect - Callback when item is selected
 */
export default function SettingsMenu({ onSelect }) {
  return (
    <div className="settings-menu">
      <div className="settings-menu__header">
        <h2 className="settings-menu__title">Settings</h2>
        <p className="settings-menu__subtitle">
          Manage your schedule preferences
        </p>
      </div>

      <div className="settings-menu__list">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`settings-menu__item ${item.disabled ? 'settings-menu__item--disabled' : ''}`}
            onClick={() => !item.disabled && onSelect(item.id)}
            disabled={item.disabled}
            aria-label={`${item.label}${item.disabled ? ' (Coming soon)' : ''}`}
          >
            <span className="settings-menu__icon" aria-hidden="true">
              {item.icon}
            </span>
            <div className="settings-menu__text">
              <span className="settings-menu__label">{item.label}</span>
              <span className="settings-menu__desc">{item.description}</span>
            </div>
            <span className="settings-menu__arrow" aria-hidden="true">
              ›
            </span>
          </button>
        ))}
      </div>

      <div className="settings-menu__footer">
        <p className="settings-menu__version">Split Lease v2.0</p>
      </div>
    </div>
  );
}
