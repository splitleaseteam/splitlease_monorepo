/**
 * Mock data for ScheduleDashboard development and testing
 * @module data/mockData
 *
 * NOTE: Replace with real API calls when backend is ready.
 * See api/scheduleDashboardApi.js for API stubs.
 */

const formatDateYmd = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startDate = new Date();
startDate.setDate(1);
const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 6, 0);

export const MOCK_LEASE = {
  _id: 'lease-123',
  propertyName: 'Modern 2BR in Williamsburg',
  propertyAddress: '150 Bedford Ave, Brooklyn, NY 11211',
  startDate: formatDateYmd(startDate),
  endDate: formatDateYmd(endDate),
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
