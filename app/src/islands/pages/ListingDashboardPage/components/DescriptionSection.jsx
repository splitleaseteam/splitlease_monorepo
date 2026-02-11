import { useState } from 'react';
import { useListingDashboard } from '../context/ListingDashboardContext';

const TRUNCATE_THRESHOLD = 150;

function DescriptionBlock({ title, text, emptyText, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text && text.length > TRUNCATE_THRESHOLD;

  return (
    <div className="listing-dashboard-section">
      <div className="listing-dashboard-section__header">
        <h2 className="listing-dashboard-section__title">{title}</h2>
        <button className="listing-dashboard-section__edit" onClick={onEdit}>
          edit
        </button>
      </div>
      <div className="listing-dashboard-section__content">
        <p
          className={`listing-dashboard-description__text${
            isLong && !expanded ? ' listing-dashboard-description__text--collapsed' : ''
          }`}
        >
          {text || emptyText}
        </p>
        {isLong && (
          <button
            type="button"
            className="listing-dashboard-description__toggle"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function DescriptionSection() {
  const { listing, handleEditSection } = useListingDashboard();

  return (
    <div id="description" className="listing-dashboard-description">
      {/* Description of Lodging */}
      <DescriptionBlock
        title="Description of Lodging"
        text={listing?.description}
        emptyText="No description provided."
        onEdit={() => handleEditSection('description')}
      />

      {/* Neighborhood Description */}
      <DescriptionBlock
        title="Neighborhood Description"
        text={listing?.descriptionNeighborhood}
        emptyText="No neighborhood description provided."
        onEdit={() => handleEditSection('neighborhood')}
      />
    </div>
  );
}
