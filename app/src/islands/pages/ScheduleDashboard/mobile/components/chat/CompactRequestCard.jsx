function formatDate(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

export default function CompactRequestCard({ request, isMine }) {
  const { type, nights, amount } = request || {};
  const dateLabel = formatDate(nights?.[0]);

  const typeLabel = type === 'buyout'
    ? '$ Buyout'
    : type === 'swap'
      ? '<-> Swap'
      : 'Share';

  return (
    <div className={`compact-request ${isMine ? 'compact-request--mine' : ''}`}>
      <div className="compact-request__header">
        {typeLabel}
      </div>
      <div className="compact-request__date">{dateLabel}</div>
      {typeof amount === 'number' && amount > 0 && (
        <div className="compact-request__amount">${amount.toFixed(2)}</div>
      )}
    </div>
  );
}
