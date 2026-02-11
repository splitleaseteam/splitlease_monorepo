import { useState, useRef, useEffect, useMemo } from 'react';
import { useListingDashboard } from '../context/ListingDashboardContext';

const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const SECTIONS = [
  { id: 'property-info', label: 'Property Info' },
  { id: 'description', label: 'Description' },
  { id: 'amenities', label: 'Amenities' },
  { id: 'details', label: 'Details' },
  { id: 'pricing', label: 'Pricing & Lease Style' },
  { id: 'rules', label: 'Rules' },
  { id: 'availability', label: 'Availability' },
  { id: 'photos', label: 'Photos' },
  { id: 'cancellation-policy', label: 'Cancellation Policy' },
];

function getSectionStatus(sectionId, listing) {
  if (!listing) return 'missing';

  switch (sectionId) {
    case 'property-info': {
      const hasTitle = !!listing.title && listing.title !== 'Untitled Listing';
      const hasAddress = !!listing.location?.address;
      if (hasTitle && hasAddress) return 'complete';
      if (hasTitle || hasAddress) return 'partial';
      return 'missing';
    }
    case 'description': {
      const hasDesc = !!listing.description;
      const hasNeighborhood = !!listing.descriptionNeighborhood;
      if (hasDesc && hasNeighborhood) return 'complete';
      if (hasDesc || hasNeighborhood) return 'partial';
      return 'missing';
    }
    case 'amenities': {
      const hasInUnit = listing.inUnitAmenities?.length > 0;
      const hasBuilding = listing.buildingAmenities?.length > 0;
      if (hasInUnit && hasBuilding) return 'complete';
      if (hasInUnit || hasBuilding) return 'partial';
      return 'missing';
    }
    case 'details': {
      const f = listing.features || {};
      const hasBedrooms = f.bedrooms > 0;
      const hasBathrooms = f.bathrooms > 0;
      const hasSqft = f.squareFootage > 0;
      if (hasBedrooms && hasBathrooms && hasSqft) return 'complete';
      if (hasBedrooms || hasBathrooms || hasSqft) return 'partial';
      return 'missing';
    }
    case 'pricing': {
      const hasMonthly = listing.monthlyHostRate > 0;
      const hasWeekly = listing.weeklyHostRate > 0;
      const hasNightly = Object.values(listing.weeklyCompensation || {}).some(v => v > 0);
      return (hasMonthly || hasWeekly || hasNightly) ? 'complete' : 'missing';
    }
    case 'rules': {
      return listing.houseRules?.length > 0 ? 'complete' : 'partial';
    }
    case 'availability': {
      return listing.earliestAvailableDate ? 'complete' : 'missing';
    }
    case 'photos': {
      return listing.photos?.length > 0 ? 'complete' : 'missing';
    }
    case 'cancellation-policy': {
      return listing.cancellationPolicy ? 'complete' : 'missing';
    }
    default:
      return 'missing';
  }
}

export default function SectionDropdown({
  menuId = 'section-dropdown-menu',
  wrapperClassName = '',
  buttonClassName = '',
  menuClassName = '',
}) {
  const { listing } = useListingDashboard();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const menuItemRefs = useRef([]);
  const wasDropdownOpenRef = useRef(false);
  const pendingFocusIndexRef = useRef(0);

  const sectionStatuses = useMemo(() => {
    const statuses = {};
    SECTIONS.forEach((s) => {
      statuses[s.id] = getSectionStatus(s.id, listing);
    });
    return statuses;
  }, [listing]);

  useEffect(() => {
    const sectionIds = SECTIONS.map((s) => s.id);
    const elements = sectionIds
      .map((id) => document.querySelector(`[data-section-id="${id}"]`) || document.getElementById(id))
      .filter(Boolean);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const focusMenuItem = (index) => {
    const item = menuItemRefs.current[index];
    if (item) {
      item.focus();
    }
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const handleSectionSelect = (sectionId) => {
    closeDropdown();
    const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`) || document.getElementById(sectionId);
    if (sectionElement) {
      const headerOffset = 80;
      const elementPosition = sectionElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDropdownOpen) {
      focusMenuItem(pendingFocusIndexRef.current);
    } else if (wasDropdownOpenRef.current) {
      triggerRef.current?.focus();
    }

    pendingFocusIndexRef.current = 0;
    wasDropdownOpenRef.current = isDropdownOpen;
  }, [isDropdownOpen]);

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'Escape') {
      closeDropdown();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isDropdownOpen) {
        pendingFocusIndexRef.current = 0;
        setIsDropdownOpen(true);
      } else {
        focusMenuItem(0);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isDropdownOpen) {
        pendingFocusIndexRef.current = SECTIONS.length - 1;
        setIsDropdownOpen(true);
      } else {
        focusMenuItem(SECTIONS.length - 1);
      }
    }
  };

  const handleMenuItemKeyDown = (event, index, sectionId) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDropdown();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = (index + 1) % SECTIONS.length;
      focusMenuItem(nextIndex);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const previousIndex = (index - 1 + SECTIONS.length) % SECTIONS.length;
      focusMenuItem(previousIndex);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSectionSelect(sectionId);
    }
  };

  const handleDropdownBlur = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.relatedTarget)) {
      closeDropdown();
    }
  };

  const wrapperClasses = [
    'listing-dashboard-secondary__dropdown',
    wrapperClassName,
  ].filter(Boolean).join(' ');

  const buttonClasses = [
    'listing-dashboard-secondary__dropdown-btn',
    buttonClassName,
  ].filter(Boolean).join(' ');

  const menuClasses = [
    'listing-dashboard-secondary__dropdown-menu',
    menuClassName,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses} ref={dropdownRef} onBlur={handleDropdownBlur}>
      <button
        ref={triggerRef}
        className={buttonClasses}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={isDropdownOpen}
        aria-controls={menuId}
        aria-haspopup="menu"
      >
        <span>Choose a Section</span>
        <ChevronDownIcon />
      </button>
      {isDropdownOpen && (
        <div className={menuClasses} id={menuId} role="menu">
          {SECTIONS.map((section, index) => {
            const status = sectionStatuses[section.id];
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                className={`listing-dashboard-secondary__dropdown-item${
                  isActive ? ' listing-dashboard-secondary__dropdown-item--active' : ''
                }`}
                ref={(element) => {
                  menuItemRefs.current[index] = element;
                }}
                onClick={() => handleSectionSelect(section.id)}
                onKeyDown={(event) => handleMenuItemKeyDown(event, index, section.id)}
                role="menuitem"
                tabIndex={-1}
              >
                <span
                  className={`listing-dashboard-secondary__dropdown-dot listing-dashboard-secondary__dropdown-dot--${status}`}
                  aria-label={status}
                />
                {section.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
