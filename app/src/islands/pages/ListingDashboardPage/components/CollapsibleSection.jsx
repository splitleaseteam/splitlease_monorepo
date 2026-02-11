import { useState, useEffect } from 'react';
import { useListingDashboard } from '../context/ListingDashboardContext';
import { logger } from '../../../../lib/logger';

const STORAGE_PREFIX = 'ld-sections-';

export default function CollapsibleSection({
  id,
  title,
  children,
  summary,
  className,
  defaultExpanded = true,
}) {
  const { listing } = useListingDashboard();
  const listingStorageKey = `${STORAGE_PREFIX}${listing?.id || 'unknown'}`;

  const [expanded, setExpanded] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(listingStorageKey));
      if (saved && typeof saved[id] === 'boolean') return saved[id];
    } catch (error) {
      logger.warn('Failed to read collapsible section state from localStorage', error);
    }
    return defaultExpanded;
  });

  // Persist to localStorage on toggle
  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        const saved = JSON.parse(localStorage.getItem(listingStorageKey)) || {};
        saved[id] = next;
        localStorage.setItem(listingStorageKey, JSON.stringify(saved));
      } catch (error) {
        logger.warn('Failed to persist collapsible section state to localStorage', error);
      }
      return next;
    });
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(listingStorageKey));
      if (saved && typeof saved[id] === 'boolean') {
        setExpanded(saved[id]);
      } else {
        setExpanded(defaultExpanded);
      }
    } catch (error) {
      logger.warn('Failed to rehydrate collapsible section state from localStorage', error);
      setExpanded(defaultExpanded);
    }
  }, [listingStorageKey, id, defaultExpanded]);

  // Animate max-height
  const [bodyHeight, setBodyHeight] = useState(expanded ? 'none' : '0px');

  useEffect(() => {
    if (expanded) {
      setBodyHeight('none');
    } else {
      setBodyHeight('0px');
    }
  }, [expanded]);

  return (
    <div className={`listing-dashboard-collapsible${className ? ` ${className}` : ''}`} data-section-id={id}>
      <button
        className="listing-dashboard-collapsible__header"
        onClick={toggle}
        aria-expanded={expanded}
        aria-controls={`collapsible-body-${id}`}
        type="button"
      >
        <span className="listing-dashboard-collapsible__title">{title}</span>
        <span
          className={`listing-dashboard-collapsible__chevron${
            expanded ? ' listing-dashboard-collapsible__chevron--expanded' : ''
          }`}
          aria-hidden="true"
        >
          &#9658;
        </span>
      </button>

      <div
        id={`collapsible-body-${id}`}
        className="listing-dashboard-collapsible__body"
        style={{ maxHeight: bodyHeight, overflow: bodyHeight === 'none' ? 'visible' : 'hidden' }}
      >
        {children}
      </div>

      {!expanded && summary && (
        <p className="listing-dashboard-collapsible__summary">{summary}</p>
      )}
    </div>
  );
}
