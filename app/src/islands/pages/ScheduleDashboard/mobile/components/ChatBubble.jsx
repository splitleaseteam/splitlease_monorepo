/**
 * ChatBubble Component
 *
 * Individual message bubble with support for request actions.
 */

import RequestActions from './RequestActions.jsx';

/**
 * Format nights array to readable string
 * @param {Array<Date|string>} nights - Array of night dates
 * @returns {string} Formatted date string
 */
function formatNights(nights) {
  if (!nights || nights.length === 0) return '';
  const dates = nights.map((n) => {
    const d = new Date(n);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  return dates.join(', ');
}

/**
 * Format timestamp to readable time
 * @param {string|Date} timestamp - Message timestamp
 * @returns {string} Formatted time string
 */
function formatTime(timestamp) {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  if (isToday) {
    return timeStr;
  }

  // If not today, show date as well
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  return `${dateStr}, ${timeStr}`;
}

function formatAmount(amount) {
  const numericAmount = Number(amount ?? 0);
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
  return safeAmount.toFixed(2);
}

/**
 * Individual message bubble
 * @param {Object} props
 * @param {Object} props.message - Message object
 * @param {boolean} props.isMine - Whether this message is from current user
 * @param {string} props.senderName - Display name of sender
 * @param {function} props.onAccept - Callback when request is accepted
 * @param {function} props.onDecline - Callback when request is declined
 * @param {function} props.onCounter - Callback when counter is initiated
 */
export default function ChatBubble({
  message,
  isMine,
  senderName,
  onAccept,
  onDecline,
  onCounter
}) {
  const isRequest = message.type === 'request';
  const isPending = message.status === 'pending';
  const showActions = isRequest && isPending && !isMine;

  const classNames = [
    'chat-bubble',
    isMine ? 'chat-bubble--mine' : 'chat-bubble--theirs',
    isRequest ? 'chat-bubble--request' : '',
    message.status ? `chat-bubble--${message.status}` : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames}>
      {!isMine && (
        <span className="chat-bubble__sender">{senderName}</span>
      )}
      <div className="chat-bubble__content">
        {message.text}
        {isRequest && (message.requestDetails || message.requestData) && (
          <div className="chat-bubble__request-details">
            {(message.requestDetails?.dates || message.requestData?.nights) && (
              <span className="chat-bubble__request-dates">
                📅 {message.requestDetails?.dates || formatNights(message.requestData?.nights)}
              </span>
            )}
            {(message.requestDetails?.amount || message.requestData?.amount) && (
              <span className="chat-bubble__request-amount">
                💰 ${formatAmount(message.requestDetails?.amount || message.requestData?.amount)}
              </span>
            )}
          </div>
        )}
      </div>
      {showActions && (
        <RequestActions
          requestId={message.id}
          onAccept={onAccept}
          onDecline={onDecline}
          onCounter={onCounter}
        />
      )}
      <span className="chat-bubble__time">
        {formatTime(message.timestamp)}
        {message.status && message.status !== 'pending' && (
          <span className="chat-bubble__status">
            {message.status === 'accepted' && ' ✓ Accepted'}
            {message.status === 'declined' && ' ✗ Declined'}
            {message.status === 'countered' && ' ↩ Countered'}
          </span>
        )}
      </span>
    </div>
  );
}
