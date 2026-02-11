import { useListingDashboard } from '../context/ListingDashboardContext';
import { FileTextIcon, CalendarIcon, FileCheckIcon, ChevronLeftIcon } from './icons.jsx';
import SectionDropdown from './SectionDropdown.jsx';

// Component-specific icons
const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" x2="21" y1="6" y2="6" />
    <line x1="8" x2="21" y1="12" y2="12" />
    <line x1="8" x2="21" y1="18" y2="18" />
    <line x1="3" x2="3.01" y1="6" y2="6" />
    <line x1="3" x2="3.01" y1="12" y2="12" />
    <line x1="3" x2="3.01" y1="18" y2="18" />
  </svg>
);

const GiftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 12 20 22 4 22 4 12"></polyline>
    <rect x="2" y="7" width="20" height="5"></rect>
    <line x1="12" y1="22" x2="12" y2="7"></line>
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
  </svg>
);

export default function NavigationHeader({ onInviteClick }) {
  const { activeTab, counts, listing, handleTabChange, handleBackClick } = useListingDashboard();

  // Handle tab click - some tabs navigate to different pages
  const handleTabClick = (tabId) => {
    if (tabId === 'all-listings') {
      window.location.href = '/host-overview';
    } else if (tabId === 'proposals') {
      // Navigate to host proposals page filtered to this listing
      window.location.href = `/host-proposals?listingId=${listing.id}`;
    } else {
      handleTabChange(tabId);
    }
  };

  // Define all tabs with visibility condition
  // Tabs for proposals, virtual meetings, and leases only show when count > 0
  const allTabs = [
    {
      id: 'all-listings',
      label: 'All My Listings',
      icon: <ListIcon />,
      visible: true, // Always visible
    },
    {
      id: 'proposals',
      label: 'Proposals',
      icon: <FileTextIcon />,
      badge: counts.proposals,
      visible: counts.proposals > 0, // Only show if there are proposals
    },
    {
      id: 'virtual-meetings',
      label: 'Virtual Meetings',
      icon: <CalendarIcon />,
      badge: counts.virtualMeetings,
      visible: counts.virtualMeetings > 0, // Only show if there are virtual meetings
    },
    {
      id: 'leases',
      label: 'Leases',
      icon: <FileCheckIcon />,
      badge: counts.leases,
      visible: counts.leases > 0, // Only show if there are leases
    },
  ];

  // Filter to only visible tabs
  const visibleTabs = allTabs.filter((tab) => tab.visible);

  return (
    <div className="listing-dashboard-nav">
      <div className="listing-dashboard-nav__tabs-row">
        <button className="listing-dashboard-nav__back-btn" onClick={handleBackClick}>
          <ChevronLeftIcon size={18} />
          <span>Back</span>
        </button>

        <div className="listing-dashboard-nav__tabs" role="tablist" aria-label="Listing dashboard navigation">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`listing-dashboard-nav__tab ${
                activeTab === tab.id ? 'listing-dashboard-nav__tab--active' : ''
              }`}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              {tab.icon}
              <span>{tab.label}</span>

              {/* Notification Badge */}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="listing-dashboard-nav__badge">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        <div className="listing-dashboard-nav__actions">
          {onInviteClick && (
            <button
              className="listing-dashboard-nav__invite-btn"
              onClick={onInviteClick}
            >
              <GiftIcon />
              <span>Give $50, Get $50</span>
            </button>
          )}

          <SectionDropdown
            menuId="section-dropdown-menu-nav"
            wrapperClassName="listing-dashboard-nav__section-dropdown"
            buttonClassName="listing-dashboard-nav__section-dropdown-btn"
            menuClassName="listing-dashboard-nav__section-dropdown-menu"
          />
        </div>
      </div>
    </div>
  );
}
