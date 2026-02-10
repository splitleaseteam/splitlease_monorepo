export const MOCK_MESSAGES = [
  {
    id: 'msg-1',
    senderId: 'user-456',
    text: 'Hey! Would you be interested in swapping Feb 14th? I have Valentine\'s plans.',
    timestamp: new Date(2026, 1, 1, 14, 30),
    type: 'message'
  },
  {
    id: 'msg-2',
    senderId: 'current-user',
    text: 'Sure, that could work! What night would you offer in exchange?',
    timestamp: new Date(2026, 1, 1, 15, 45),
    type: 'message'
  },
  {
    id: 'msg-s1',
    type: 'system',
    text: 'Swap completed.',
    requestData: {
      type: 'alternating',
      nights: [new Date(2026, 1, 10)],
      transactionId: 'txn-2'
    },
    timestamp: new Date(2026, 1, 1, 16, 0)
  },
  {
    id: 'msg-3',
    senderId: 'user-456',
    text: 'How about Feb 21st? It\'s a Saturday.',
    timestamp: new Date(2026, 1, 1, 16, 10),
    type: 'message'
  },
  {
    id: 'msg-r1',
    senderId: 'user-456',
    type: 'request',
    status: 'pending',
    text: 'Sarah proposed swapping Feb 11 for Feb 14',
    requestData: {
      type: 'alternating',
      nights: [new Date(2026, 1, 11), new Date(2026, 1, 14)],
      transactionId: 'txn-5'
    },
    timestamp: new Date(2026, 1, 1, 16, 15)
  }
];
