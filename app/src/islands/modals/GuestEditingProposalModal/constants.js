/**
 * Constants for GuestEditingProposalModal
 */

/**
 * Days of the week with 0-based indexing (matching JavaScript Date.getDay())
 * 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
 */
export const DAYS_OF_WEEK = [
  { id: 0, name: 'Sunday', shortName: 'Sun', singleLetter: 'S', dayIndex: 0 },
  { id: 1, name: 'Monday', shortName: 'Mon', singleLetter: 'M', dayIndex: 1 },
  { id: 2, name: 'Tuesday', shortName: 'Tue', singleLetter: 'T', dayIndex: 2 },
  { id: 3, name: 'Wednesday', shortName: 'Wed', singleLetter: 'W', dayIndex: 3 },
  { id: 4, name: 'Thursday', shortName: 'Thu', singleLetter: 'T', dayIndex: 4 },
  { id: 5, name: 'Friday', shortName: 'Fri', singleLetter: 'F', dayIndex: 5 },
  { id: 6, name: 'Saturday', shortName: 'Sat', singleLetter: 'S', dayIndex: 6 }
]

export const RESERVATION_SPAN_OPTIONS = [
  { id: '2-weeks', display: '2 weeks', weeks: 2, months: 0, type: 'weeks' },
  { id: '4-weeks', display: '4 weeks', weeks: 4, months: 0, type: 'weeks' },
  { id: '1-month', display: '1 month', weeks: 4, months: 1, type: 'months' },
  { id: '2-months', display: '2 months', weeks: 8, months: 2, type: 'months' },
  { id: '3-months', display: '3 months', weeks: 13, months: 3, type: 'months' },
  { id: '6-months', display: '6 months', weeks: 26, months: 6, type: 'months' },
  { id: '12-months', display: '12 months', weeks: 52, months: 12, type: 'months' },
  { id: 'other', display: 'Other (wks)', weeks: 0, months: 0, type: 'other' }
]

export const AVG_DAYS_PER_MONTH = 30.44
