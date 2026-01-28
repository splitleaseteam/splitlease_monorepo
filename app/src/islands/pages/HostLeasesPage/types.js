/**
 * Type definitions for Host Leases Page (JSDoc)
 */

/**
 * @typedef {Object} NormalizedListing
 * @property {string} id - Listing ID
 * @property {string} title - Listing title
 * @property {string} name - Listing name (alias for title)
 * @property {string|null} thumbnail - Listing thumbnail URL
 * @property {string|null} neighborhood - Listing neighborhood
 */

/**
 * @typedef {Object} NormalizedGuest
 * @property {string} id - Guest user ID
 * @property {string} name - Guest full name
 * @property {string} firstName - Guest first name
 * @property {string|null} email - Guest email
 * @property {string|null} phone - Guest phone number
 * @property {string|null} profilePhoto - Guest profile photo URL
 * @property {boolean} isVerified - Whether guest is verified
 * @property {boolean} hasIdVerification - Whether guest has ID verification
 * @property {boolean} hasWorkVerification - Whether guest has work verification
 */

/**
 * @typedef {Object} NormalizedStay
 * @property {string} id - Stay ID
 * @property {string} leaseId - Parent lease ID
 * @property {number} weekNumber - Week number in the lease
 * @property {string} checkInNight - Check-in date
 * @property {string} lastNight - Last night date
 * @property {string} stayStatus - Stay status (Upcoming, In Progress, Completed, Cancelled)
 * @property {boolean} reviewSubmittedByHost - Whether host has submitted a review
 * @property {string[]} datesInPeriod - Array of date strings in this period
 */

/**
 * @typedef {Object} NormalizedPaymentRecord
 * @property {string} id - Payment record ID
 * @property {string} leaseId - Parent lease ID
 * @property {number} paymentNumber - Payment sequence number
 * @property {string} scheduledDate - Scheduled payment date
 * @property {string|null} actualDate - Actual payment date
 * @property {number} rentAmount - Rent amount
 * @property {number} maintenanceFee - Maintenance fee amount
 * @property {number} damageDeposit - Damage deposit amount
 * @property {number} totalAmount - Total payment amount
 * @property {string|null} bankTransactionNumber - Bank transaction ID
 * @property {string|null} paymentReceipt - Receipt URL
 * @property {boolean} isPaid - Whether payment is made
 * @property {boolean} isRefunded - Whether payment is refunded
 */

/**
 * @typedef {Object} NormalizedDateChangeRequest
 * @property {string} id - Request ID
 * @property {string} leaseId - Parent lease ID
 * @property {string} requestedById - User ID who requested
 * @property {string} requestReceiverId - User ID who receives the request
 * @property {NormalizedGuest|null} requestedByUser - User who requested (normalized)
 * @property {string|null} stayAssociated1 - First associated stay ID
 * @property {string|null} stayAssociated2 - Second associated stay ID
 * @property {string} status - Request status (Pending, Accepted, Declined, Cancelled)
 * @property {string} requestType - Type of date change request
 * @property {string} originalDate - Original date
 * @property {string} requestedDate - Requested new date
 * @property {number|null} priceAdjustment - Price adjustment amount
 * @property {string} createdDate - Request creation date
 */

/**
 * @typedef {Object} NormalizedLease
 * @property {string} id - Lease ID
 * @property {string} agreementNumber - Agreement number
 * @property {string} leaseStatus - Lease status (Active, Completed, Cancelled, etc.)
 * @property {boolean} leaseSigned - Whether lease is signed
 * @property {NormalizedListing|null} listing - Associated listing
 * @property {string} listingId - Listing ID
 * @property {NormalizedGuest|null} guest - Associated guest
 * @property {string} guestId - Guest user ID
 * @property {string} hostId - Host user ID
 * @property {string} reservationStart - Reservation start date
 * @property {string} reservationEnd - Reservation end date
 * @property {string} firstPaymentDate - First payment date
 * @property {string|null} nextPaymentDueDate - Next payment due date
 * @property {number} totalRent - Total rent amount
 * @property {number} totalCompensation - Total host compensation
 * @property {number|null} paidToDate - Amount paid to date
 * @property {string|null} contract - Contract PDF URL
 * @property {string|null} supplementalAgreement - Supplemental agreement PDF URL
 * @property {string} createdDate - Lease creation date
 * @property {string} modifiedDate - Lease last modification date
 * @property {NormalizedStay[]} stays - Array of stays
 * @property {NormalizedPaymentRecord[]} paymentRecords - Array of payment records
 * @property {NormalizedDateChangeRequest[]} dateChangeRequests - Array of date change requests
 */

/**
 * @typedef {Object} LeaseCardHandlers
 * @property {function(string): void} onToggleDetails - Toggle guest details expansion
 * @property {function(string): void} onToggleAllStays - Toggle show all stays
 * @property {function(string): void} onAcceptDateChange - Accept a date change request
 * @property {function(string): void} onDeclineDateChange - Decline a date change request
 * @property {function(NormalizedDateChangeRequest): void} onViewDateChangeDetails - View date change details
 * @property {function(NormalizedStay): void} onOpenReview - Open review modal for a stay
 * @property {function(string, NormalizedLease): void} onOpenDocument - Open a document
 */

/**
 * @typedef {Object} ExpandedSections
 * @property {boolean} [details] - Whether guest details are expanded
 * @property {boolean} [allStays] - Whether all stays are shown
 * @property {boolean} [payments] - Whether payments are expanded
 * @property {boolean} [dateChanges] - Whether date changes are expanded
 */

/**
 * Lease status values
 * @readonly
 * @enum {string}
 */
export const LEASE_STATUSES = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  PENDING_SIGNATURE: 'Pending Signature',
  PENDING_DOCUMENTS: 'Pending Documents',
};

/**
 * Stay status values
 * @readonly
 * @enum {string}
 */
export const STAY_STATUSES = {
  UPCOMING: 'Upcoming',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

/**
 * Date change request status values
 * @readonly
 * @enum {string}
 */
export const DATE_CHANGE_REQUEST_STATUSES = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
};
