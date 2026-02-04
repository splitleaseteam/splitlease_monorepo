export function buildMessage({ senderId, text, type = 'message', requestData = null, status = null }) {
  return {
    id: `msg-${Date.now()}`,
    senderId,
    text,
    timestamp: new Date(),
    type,
    status,
    requestData
  };
}

export function buildSystemMessage({ text, requestData }) {
  return {
    id: `msg-${Date.now()}`,
    type: 'system',
    text,
    timestamp: new Date(),
    requestData
  };
}
