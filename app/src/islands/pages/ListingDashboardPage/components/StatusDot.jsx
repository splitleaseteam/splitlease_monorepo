const STATUS_MAP = {
  online: { color: '#22c55e', label: 'Listing is online' },
  review: { color: '#f59e0b', label: 'Under review' },
  paused: { color: '#ef4444', label: 'Paused' },
  draft: { color: '#9ca3af', label: 'Incomplete' },
};

export default function StatusDot({ status }) {
  const info = STATUS_MAP[status] || STATUS_MAP.draft;

  return (
    <span
      className="listing-dashboard-property__status-dot"
      style={{ backgroundColor: info.color }}
      aria-hidden="true"
    />
  );
}

export { STATUS_MAP };
