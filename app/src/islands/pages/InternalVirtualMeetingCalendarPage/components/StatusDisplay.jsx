/**
 * Status Display Component
 * Split Lease - Virtual Meeting Calendar Automation
 *
 * Displays summary statistics and filter controls
 */

export default function StatusDisplay({
  meetings,
  statusFilter,
  onFilterChange,
}) {
  // Calculate statistics
  const stats = {
    total: meetings.length,
    pending: meetings.filter((m) => m.calendar_status === 'pending').length,
    meet_link_created: meetings.filter((m) => m.calendar_status === 'meet_link_created').length,
    invites_sent: meetings.filter((m) => m.calendar_status === 'invites_sent').length,
    failed: meetings.filter((m) => m.calendar_status === 'failed').length,
  };

  return (
    <div className="status-display">
      <div className="status-stats">
        <div className="stat-item">
          <span className="stat-label">Total:</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-item stat-item--pending">
          <span className="stat-label">Pending:</span>
          <span className="stat-value">{stats.pending}</span>
        </div>
        <div className="stat-item stat-item--in-progress">
          <span className="stat-label">In Progress:</span>
          <span className="stat-value">{stats.meet_link_created}</span>
        </div>
        <div className="stat-item stat-item--complete">
          <span className="stat-label">Complete:</span>
          <span className="stat-value">{stats.invites_sent}</span>
        </div>
        <div className="stat-item stat-item--error">
          <span className="stat-label">Failed:</span>
          <span className="stat-value">{stats.failed}</span>
        </div>
      </div>

      <div className="status-filters">
        <label htmlFor="status-filter">Filter by status:</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="status-filter-select"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="meet_link_created">Meet Link Created</option>
          <option value="invites_sent">Invites Sent</option>
          <option value="failed">Failed</option>
        </select>
      </div>
    </div>
  );
}
