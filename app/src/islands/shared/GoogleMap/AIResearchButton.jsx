import { memo } from 'react';

/**
 * AIResearchButton - Button to trigger AI Research Report signup
 * Memoized to prevent unnecessary re-renders
 */
const AIResearchButton = memo(({ onAIResearchClick }) => {
  if (!onAIResearchClick) return null;

  return (
    <button
      className="ai-research-button"
      onClick={(e) => {
        e.stopPropagation();
        onAIResearchClick();
      }}
      aria-label="Generate Market Report"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 3v18M3 12h18" />
        <path d="M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </svg>
      <span>Generate Market Report</span>
    </button>
  );
});

AIResearchButton.displayName = 'AIResearchButton';

export default AIResearchButton;
