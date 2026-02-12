/**
 * ListPanel - Entry list view for Manage Informational Texts
 */
import { EntryCard } from './EntryCard.jsx';
import { RefreshIcon } from './Icons.jsx';
import '../ManageInformationalTextsPage.css';

export function ListPanel({
  entries,
  loading,
  error,
  searchQuery,
  setSearchQuery,
  onRefresh,
  onCreate,
  onEdit,
  onDelete,
}) {
  return (
    <div className="mit-panel">
      {/* Panel Header */}
      <div className="mit-panel-header">
        <h2 className="mit-panel-title">Entries ({entries.length})</h2>
        <div className="mit-panel-actions">
          <button onClick={onRefresh} className="mit-btn-icon" title="Refresh">
            <RefreshIcon />
          </button>
          <button onClick={onCreate} className="mit-btn-primary">
            + New Entry
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mit-search-container">
        <input
          type="text"
          placeholder="Search by tag or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mit-search-input"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mit-loading-state">
          <div className="mit-spinner" />
          <span>Loading entries...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mit-error-state">
          <span>{error}</span>
          <button onClick={onRefresh} className="mit-btn-retry">
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && entries.length === 0 && (
        <div className="mit-empty-state">
          <span>No entries found</span>
          <button onClick={onCreate} className="mit-btn-primary">
            Create First Entry
          </button>
        </div>
      )}

      {/* Entry List */}
      {!loading && !error && entries.length > 0 && (
        <div className="mit-entry-list">
          {entries.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
