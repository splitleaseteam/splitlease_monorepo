import { useRef } from 'react';

export default function SectionTabs({
  tabs = [],
  activeTab,
  onChange,
  renderPanel,
  tabListLabel = 'Listing section tabs',
  className = '',
}) {
  const tabRefs = useRef([]);

  const handleKeyDown = (event, index) => {
    if (!tabs.length) return;
    let nextIndex = index;

    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;

    if (nextIndex !== index) {
      event.preventDefault();
      tabRefs.current[nextIndex]?.focus();
      onChange?.(tabs[nextIndex].id);
    }
  };

  const active = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  return (
    <div className={`listing-dashboard-section-tabs ${className}`.trim()}>
      <div role="tablist" aria-label={tabListLabel} className="listing-dashboard-section-tabs__tablist">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            role="tab"
            type="button"
            className={`listing-dashboard-section-tabs__tab${tab.id === active?.id ? ' listing-dashboard-section-tabs__tab--active' : ''}`}
            aria-selected={tab.id === active?.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => onChange?.(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active && (
        <div
          role="tabpanel"
          id={`tabpanel-${active.id}`}
          aria-labelledby={`tab-${active.id}`}
          className="listing-dashboard-tab-panel"
        >
          {renderPanel ? renderPanel(active) : active.content}
        </div>
      )}
    </div>
  );
}
