/**
 * Mock data for ScheduleDashboard development and testing
 * @module data/mockData
 *
 * NOTE: Replace with real API calls when backend is ready.
 * See api/scheduleDashboardApi.js for API stubs.
 */

export const MOCK_LEASE = {
  _id: 'lease-123',
  propertyName: 'Modern 2BR in Williamsburg',
  propertyAddress: '150 Bedford Ave, Brooklyn, NY 11211',
  startDate: '2025-01-01',
  endDate: '2025-06-30',
  nightlyRate: 175
};

// Current user mock (needed for perspective swap in dev mode)
export const MOCK_CURRENT_USER = {
  _id: 'current-user',
  firstName: 'Alex',
  lastName: 'Morgan',
  avatarUrl: null,
  email: 'alex.m@example.com',
  pricingStrategy: {
    baseRate: 150,
    noticeMultipliers: {
      flexible: 1.0,
      standard: 1.1,
      inconvenient: 1.5,
      disruptive: 2.0,
      emergency: 3.0
    },
    edgePreference: 'neutral',
    sharingWillingness: 'standard'
  }
};

export const MOCK_ROOMMATE = {
  _id: 'user-456',
  firstName: 'Sarah',
  lastName: 'Chen',
  avatarUrl: null,
  email: 'sarah.c@example.com',
  pricingStrategy: {
    baseRate: 165,
    noticeMultipliers: {
      flexible: 1.0,
      standard: 1.1,
      inconvenient: 1.5,
      disruptive: 2.0,
      emergency: 3.0
    },
    edgePreference: 'end_cheaper',
    sharingWillingness: 'accommodating'
  }
};

export const MOCK_MESSAGES = [
  {
    id: 'msg-1',
    senderId: 'user-456',
    senderName: 'Sarah',
    text: 'Hey! Would you be interested in swapping Feb 14th? I have Valentine\'s plans.',
    timestamp: new Date(2026, 1, 1, 14, 30),
    type: 'message'
  },
  {
    id: 'msg-2',
    senderId: 'current-user',
    senderName: 'You',
    text: 'Sure, that could work! What night would you offer in exchange?',
    timestamp: new Date(2026, 1, 1, 15, 45),
    type: 'message'
  },
  {
    id: 'msg-s1',
    type: 'system',
    requestData: {
      type: 'swap',
      nights: [new Date(2026, 1, 10)],
      counterparty: 'Sarah'
    },
    timestamp: new Date(2026, 1, 1, 16, 0)
  },
  {
    id: 'msg-3',
    senderId: 'user-456',
    senderName: 'Sarah',
    text: 'How about Feb 21st? It\'s a Saturday.',
    timestamp: new Date(2026, 1, 1, 16, 10),
    type: 'message'
  },
  {
    id: 'msg-r1',
    senderId: 'user-456',
    senderName: 'Sarah',
    type: 'request',
    text: 'Sarah proposed swapping Feb 10 for Feb 14',
    requestData: {
      type: 'swap',
      nights: [new Date(2026, 1, 10), new Date(2026, 1, 14)],
      transactionId: 'txn-5'
    },
    timestamp: new Date(2026, 1, 1, 16, 15)
  }
];

export const MOCK_TRANSACTIONS = [
  {
    id: 'txn-1',
    date: new Date(2026, 0, 28),
    type: 'buyout',
    nights: [new Date(2026, 1, 14)],
    amount: 150,
    direction: 'outgoing',
    status: 'pending',
    counterparty: 'Sarah C.'
  },
  {
    id: 'txn-2',
    date: new Date(2026, 0, 25),
    type: 'swap',
    nights: [new Date(2026, 1, 10), new Date(2026, 1, 17)],
    amount: 0,
    direction: null,
    status: 'complete',
    counterparty: 'Sarah C.'
  },
  {
    id: 'txn-3',
    date: new Date(2026, 0, 20),
    type: 'buyout',
    nights: [new Date(2026, 1, 7)],
    amount: 125,
    direction: 'incoming',
    status: 'complete',
    counterparty: 'Sarah C.'
  },
  {
    id: 'txn-4',
    date: new Date(2026, 0, 15),
    type: 'buyout',
    nights: [new Date(2026, 1, 3)],
    amount: 175,
    direction: 'outgoing',
    status: 'declined',
    counterparty: 'Sarah C.'
  },
  {
    id: 'txn-5',
    date: new Date(2026, 0, 30),
    type: 'swap',
    nights: [new Date(2026, 1, 10), new Date(2026, 1, 14)],
    amount: 0,
    direction: null,
    status: 'pending',
    counterparty: 'Sarah C.'
  }
];

// Mock flexibility metrics for breakdown comparison
export const MOCK_FLEXIBILITY_METRICS = {
  user: {
    responseTime: '< 1 hour',
    approvalRate: '98%',
    nightsOffered: 12,
    cancellations: 0
  },
  roommate: {
    responseTime: '2 hours',
    approvalRate: '92%',
    nightsOffered: 5,
    cancellations: 1
  }
};

// Mock user's own flexibility score
export const MOCK_USER_FLEXIBILITY_SCORE = 8;
