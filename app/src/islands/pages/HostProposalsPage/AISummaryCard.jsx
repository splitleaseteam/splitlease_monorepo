/**
 * AISummaryCard Component (V7 Design)
 *
 * Displays an AI-generated summary of the guest for new proposals.
 * Features a gradient purple background and CPU icon.
 * Supports collapse/expand functionality with state persisted to localStorage.
 *
 * Only renders if:
 * - Summary text exists
 * - Proposal is in a "new" or "review" status
 *
 * Part of the Host Proposals V7 redesign.
 */
import { useState, useCallback } from 'react';
import { Cpu, ChevronDown, ChevronUp } from 'lucide-react';

const STORAGE_KEY = 'aiSummaryCollapsed';

/**
 * Get summary text from proposal
 * Checks multiple possible sources in priority order:
 * 1. negotiationSummaries array (most recent summary intended for host)
 * 2. Direct ai_summary/guest_summary/summary fields (legacy)
 * @param {Object} proposal - The proposal object
 * @returns {string|null} Summary text or null if none found
 */
function getSummaryText(proposal) {
  // Check negotiationSummaries array first (new approach)
  const negotiationSummaries = proposal?.negotiationSummaries || [];
  if (negotiationSummaries.length > 0) {
    const latestSummary = negotiationSummaries[0]; // Already sorted by date desc
    return latestSummary?.Summary || latestSummary?.summary || null;
  }

  // Fallback to direct fields (legacy)
  return proposal?.ai_summary || proposal?.guest_summary || proposal?.summary || null;
}

/**
 * Parse text with [b]...[/b] tags into React elements with bold formatting
 * Also handles malformed tags like [/b> or [b> that may appear due to AI typos
 * @param {string} text - Text potentially containing [b]...[/b] tags
 * @returns {React.ReactNode} Parsed content with <strong> elements
 */
function parseFormattedText(text) {
  if (!text) return null;

  // First, clean up any malformed tags (e.g., [/b> → [/b], [b> → [b])
  const cleanedText = text
    .replace(/\[\/b>/g, '[/b]')
    .replace(/\[b>/g, '[b]')
    .replace(/\[\/b\]/g, '[/b]')  // normalize any variations
    .replace(/\[b\]/g, '[b]');    // normalize any variations

  // Split by [b] and [/b] tags, keeping track of whether we're in a bold section
  const parts = cleanedText.split(/\[b\]|\[\/b\]/);

  // The pattern alternates: normal, bold, normal, bold, ...
  // First part is always normal (before any [b])
  return parts.map((part, index) => {
    // Even indices are normal text, odd indices are bold
    if (index % 2 === 1) {
      return <strong key={index}>{part}</strong>;
    }
    return part;
  });
}

/**
 * Check if AI summary should be shown
 * @param {Object} proposal - The proposal object
 * @returns {boolean} True if should show summary
 */
function shouldShowAISummary(proposal) {
  // Must have a summary
  const summary = getSummaryText(proposal);
  if (!summary) return false;

  // Only show for new/review statuses (pending statuses where host needs to take action)
  const status = typeof proposal?.status === 'string'
    ? proposal.status
    : (proposal?.status?.id || '');

  // Match statuses that start with common pending prefixes
  // Database uses Title Case like "Proposal Submitted by guest - Awaiting Rental Application"
  // Convert to lowercase for case-insensitive matching
  const statusLower = status.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  const showStatusPrefixes = [
    'proposal_submitted',
    'host_review',
    'pending',
    'awaiting',
    'new'
  ];

  return showStatusPrefixes.some(prefix => statusLower.startsWith(prefix));
}

/**
 * Read collapsed state from localStorage
 * @returns {boolean} True if collapsed, false if expanded
 */
function getInitialCollapsedState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
}

/**
 * Save collapsed state to localStorage
 * @param {boolean} isCollapsed - The collapsed state to save
 */
function saveCollapsedState(isCollapsed) {
  try {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed));
  } catch (e) {
    console.warn('Failed to save AI summary collapsed state to localStorage:', e);
  }
}

/**
 * AISummaryCard displays AI-generated guest summary
 * Supports collapse/expand with persisted state
 *
 * @param {Object} props
 * @param {Object} props.proposal - The proposal object
 */
export function AISummaryCard({ proposal }) {
  const summary = getSummaryText(proposal);
  const [isCollapsed, setIsCollapsed] = useState(getInitialCollapsedState);

  const handleToggle = useCallback(() => {
    setIsCollapsed(prev => {
      const newState = !prev;
      saveCollapsedState(newState);
      return newState;
    });
  }, []);

  if (!shouldShowAISummary(proposal)) {
    return null;
  }

  const ChevronIcon = isCollapsed ? ChevronDown : ChevronUp;

  return (
    <div className={`hp7-ai-summary-card ${isCollapsed ? 'hp7-ai-summary-collapsed' : ''}`}>
      <div className="hp7-ai-summary-icon">
        <Cpu size={12} />
      </div>
      <div className="hp7-ai-summary-content">
        <button
          type="button"
          className="hp7-ai-summary-header"
          onClick={handleToggle}
          aria-expanded={!isCollapsed}
          aria-controls="ai-summary-content"
        >
          <span className="hp7-ai-summary-title">AI Summary</span>
          <ChevronIcon size={16} className="hp7-ai-summary-chevron" />
        </button>
        {!isCollapsed && (
          <div id="ai-summary-content" className="hp7-ai-summary-text">
            {parseFormattedText(summary)}
          </div>
        )}
      </div>
    </div>
  );
}

export default AISummaryCard;
