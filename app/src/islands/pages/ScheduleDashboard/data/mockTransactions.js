export const MOCK_TRANSACTIONS = [
  {
    id: 'txn-1',
    date: new Date(2026, 0, 28),
    type: 'buyout',
    nights: [new Date(2026, 1, 14)],
    amount: 150,
    suggestedPrice: 150,
    offeredPrice: 150,
    payerId: 'current-user',
    payeeId: 'user-456',
    status: 'pending'
  },
  {
    id: 'txn-2',
    date: new Date(2026, 0, 25),
    type: 'swap',
    nights: [new Date(2026, 1, 10), new Date(2026, 1, 17)],
    amount: 0,
    suggestedPrice: 0,
    offeredPrice: 0,
    payerId: 'current-user',
    payeeId: 'user-456',
    status: 'complete'
  },
  {
    id: 'txn-3',
    date: new Date(2026, 0, 20),
    type: 'buyout',
    nights: [new Date(2026, 1, 7)],
    amount: 125,
    suggestedPrice: 125,
    offeredPrice: 125,
    payerId: 'user-456',
    payeeId: 'current-user',
    status: 'complete'
  },
  {
    id: 'txn-4',
    date: new Date(2026, 0, 15),
    type: 'buyout',
    nights: [new Date(2026, 1, 3)],
    amount: 175,
    suggestedPrice: 220,
    offeredPrice: 175,
    payerId: 'current-user',
    payeeId: 'user-456',
    status: 'declined'
  },
  {
    id: 'txn-5',
    date: new Date(2026, 0, 30),
    type: 'swap',
    nights: [new Date(2026, 1, 11), new Date(2026, 1, 14)],
    amount: 0,
    suggestedPrice: 0,
    offeredPrice: 0,
    payerId: 'current-user',
    payeeId: 'user-456',
    status: 'pending'
  }
];
