/**
 * Guest Review Category Constants
 * Defines the categories for guests reviewing hosts/properties.
 * These are shown when a guest reviews a host after their stay.
 */

export const GUEST_REVIEW_CATEGORY_COUNT = 6;

export const GUEST_REVIEW_CATEGORIES = [
  {
    id: 'accuracy',
    title: 'Listing Accuracy',
    question: 'How accurately did the listing describe the property?'
  },
  {
    id: 'cleanliness',
    title: 'Cleanliness',
    question: 'How clean was the property when you arrived?'
  },
  {
    id: 'communication',
    title: 'Host Communication',
    question: 'How responsive and helpful was the host?'
  },
  {
    id: 'check_in',
    title: 'Check-in Process',
    question: 'How smooth was the check-in process?'
  },
  {
    id: 'location',
    title: 'Location',
    question: 'How would you rate the location and neighborhood?'
  },
  {
    id: 'value',
    title: 'Value for Money',
    question: 'How would you rate the value for the price paid?'
  }
];

export const GUEST_RATING_SCALE_LABELS = [
  '', // Index 0 unused
  'Very poor',
  'Poor',
  'Average',
  'Good',
  'Excellent'
];
