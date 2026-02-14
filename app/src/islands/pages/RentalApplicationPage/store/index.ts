/**
 * Rental Application Store Module
 *
 * Exports the local store and React hook for managing rental application form data.
 */

export {
  rentalApplicationLocalStore,
  type RentalApplicationStoreState,
  type RentalApplicationFormData,
  type Occupant,
  type VerificationStatus,
} from './rentalApplicationLocalStore';

export { useRentalApplicationStore } from './useRentalApplicationStore';
