import { useListingDashboard } from '../context/ListingDashboardContext';
import SectionDropdown from './SectionDropdown.jsx';

// Icon components (inline SVGs)
const SparklesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

export default function SecondaryActions() {
  const { handleAIAssistant } = useListingDashboard();

  return (
    <div className="listing-dashboard-secondary">
      {/* AI Import Assistant Button */}
      <button
        onClick={handleAIAssistant}
        className="listing-dashboard-secondary__ai-btn"
      >
        <SparklesIcon />
        <span>AI Import Assistant</span>
      </button>

      <SectionDropdown menuId="section-dropdown-menu-secondary" />
    </div>
  );
}
