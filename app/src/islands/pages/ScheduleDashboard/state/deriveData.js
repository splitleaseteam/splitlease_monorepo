export function derivePerspective({
  currentUserId,
  coTenantId,
  roommateId,
  calendarOwnership = {},
  transactions,
  messages
}) {
  const userNights = (calendarOwnership || {})[currentUserId] || [];
  const resolvedCoTenantId = coTenantId || roommateId;
  const coTenantNights = (calendarOwnership || {})[resolvedCoTenantId] || [];

  const processedTransactions = transactions.map((transaction) => {
    const { payerId, payeeId, type } = transaction;
    const hasParticipants = payerId && payeeId;
    const isInitiator = hasParticipants && payerId === currentUserId;
    const hasDirection = hasParticipants && type !== 'swap';
    const isIncoming = hasDirection && payeeId === currentUserId;
    const direction = hasDirection
      ? (isIncoming ? 'incoming' : 'outgoing')
      : (type === 'swap' && hasParticipants ? (isInitiator ? 'outgoing' : 'incoming') : null);
    const counterpartyId = hasParticipants
      ? (payerId === currentUserId ? payeeId : payerId)
      : (payerId || payeeId);

    return {
      ...transaction,
      direction,
      counterpartyId
    };
  });

  return {
    userNights,
    coTenantNights,
    roommateNights: coTenantNights,
    processedTransactions,
    messages
  };
}
