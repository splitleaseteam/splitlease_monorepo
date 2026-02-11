import { useState } from 'react';
import { useListingDashboard } from '../context/ListingDashboardContext';

const TRUNCATE_THRESHOLD = 600;

function DescriptionBlock({ title, text, emptyText, emptyPrompt, onEdit, onAskAI, sectionKey }) {
  const [expanded, setExpanded] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const isLong = text && text.length > TRUNCATE_THRESHOLD;
  const isEmpty = !text;

  const handleAskAI = async () => {
    setAiLoading(true);
    setTimeout(() => {
      setAiLoading(false);
      window.alert('AI writing assistant coming soon!');
    }, 1000);
  };

  return (
    <div className="listing-dashboard-section">
      <div className="listing-dashboard-section__header">
        <h2 className="listing-dashboard-section__title">{title}</h2>
        <div className="listing-dashboard-section__actions">
          <button
            className="listing-dashboard-btn-ai"
            onClick={handleAskAI}
            disabled={aiLoading}
            title="Draft with AI"
          >
            {aiLoading ? (
              <span className="listing-dashboard-btn-ai__spinner" />
            ) : (
              '\u2728'
            )}
            {aiLoading ? 'Writing...' : 'Ask AI'}
          </button>
          <button className="listing-dashboard-section__edit" onClick={onEdit}>
            edit
          </button>
        </div>
      </div>
      <div className="listing-dashboard-section__content">
        {isEmpty ? (
          <div className="listing-dashboard-description__empty">
            <p className="listing-dashboard-description__empty-text">{emptyPrompt || emptyText}</p>
            <button
              className="listing-dashboard-btn-ai listing-dashboard-btn-ai--lg"
              onClick={handleAskAI}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <span className="listing-dashboard-btn-ai__spinner" />
              ) : (
                '\u2728'
              )}
              {aiLoading ? 'Writing...' : 'Ask AI to draft this'}
            </button>
          </div>
        ) : (
          <>
            <p
              className={`listing-dashboard-description__text${
                isLong && !expanded ? ' listing-dashboard-description__text--collapsed' : ''
              }`}
            >
              {text}
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
          </>
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
        emptyPrompt="Describe your space to attract guests..."
        sectionKey="description"
        onEdit={() => handleEditSection('description')}
      />

      {/* Neighborhood Description */}
      <DescriptionBlock
        title="Neighborhood Description"
        text={listing?.descriptionNeighborhood}
        emptyText="No neighborhood description provided."
        emptyPrompt="Describe your neighborhood..."
        sectionKey="neighborhood"
        onEdit={() => handleEditSection('neighborhood')}
      />
    </div>
  );
}
