/**
 * PublicView.jsx
 *
 * Public/read-only mode wrapper that renders profile cards for viewing.
 * Shown when user is viewing someone else's profile.
 *
 * Design Reference: Guest_Profile_Public_v3.html
 */

import AboutCard from './cards/AboutCard.jsx';
import WhySplitLeaseCard from './cards/WhySplitLeaseCard.jsx';
import MyRequirementsCard from './cards/MyRequirementsCard.jsx';
import ScheduleCard from './cards/ScheduleCard.jsx';
import TransportCard from './cards/TransportCard.jsx';
import ReasonsCard from './cards/ReasonsCard.jsx';
import StorageItemsCard from './cards/StorageItemsCard.jsx';
import ListingsCard from './cards/ListingsCard.jsx';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Convert day names to indices (0-6)
 */
function dayNamesToIndices(dayNames) {
  if (!Array.isArray(dayNames)) return [];
  return dayNames
    .map(name => DAY_NAMES.indexOf(name))
    .filter(idx => idx !== -1);
}

export default function PublicView({
  profileData,
  verifications,
  goodGuestReasonsList,
  storageItemsList,
  // Host-specific props
  isHostUser = false,
  hostListings = [],
  onListingClick
}) {
  // Extract data from profile
  const bio = profileData?.bio_text || '';
  const needForSpace = profileData?.stated_need_for_space_text || '';
  const specialNeeds = profileData?.stated_special_needs_text || '';
  const selectedDays = dayNamesToIndices(profileData?.recent_days_selected_json || []);

  // Parse transportation medium - stored as JSON string in text column
  const rawTransport = profileData?.['transportation medium'];
  let transportationTypes = [];
  const validValues = ['car', 'public_transit', 'bicycle', 'walking', 'rideshare', 'other'];

  if (rawTransport && typeof rawTransport === 'string') {
    try {
      const parsed = JSON.parse(rawTransport);
      if (Array.isArray(parsed)) {
        transportationTypes = parsed.filter(val => validValues.includes(val));
      }
    } catch {
      if (validValues.includes(rawTransport)) {
        transportationTypes = [rawTransport];
      }
    }
  } else if (Array.isArray(rawTransport)) {
    transportationTypes = rawTransport.filter(val => validValues.includes(val));
  }

  const goodGuestReasons = [];
  const storageItems = [];
  const firstName = profileData?.first_name || 'this guest';

  // Transportation options for display
  const transportationOptions = [
    { value: '', label: 'Not specified' },
    { value: 'car', label: 'Car', icon: 'car' },
    { value: 'public_transit', label: 'Public Transit', icon: 'train' },
    { value: 'plane', label: 'Plane', icon: 'plane' }
  ];

  return (
    <>
      {/* About - Always shown */}
      <AboutCard
        bio={bio}
        readOnly={true}
        firstName={firstName}
      />

      {/* Guest-only: Why I Want a Split Lease */}
      {!isHostUser && needForSpace && (
        <WhySplitLeaseCard
          content={needForSpace}
        />
      )}

      {/* Guest-only: My Requirements */}
      {!isHostUser && specialNeeds && (
        <MyRequirementsCard
          content={specialNeeds}
        />
      )}

      {/* Guest-only: Schedule */}
      {!isHostUser && selectedDays.length > 0 && (
        <ScheduleCard
          selectedDays={selectedDays}
          readOnly={true}
        />
      )}

      {/* Guest-only: Transport (multi-select) */}
      {!isHostUser && transportationTypes.length > 0 && (
        <TransportCard
          transportationTypes={transportationTypes}
          transportationOptions={transportationOptions}
          readOnly={true}
        />
      )}

      {/* Guest-only: Reasons to Host */}
      {!isHostUser && goodGuestReasons.length > 0 && (
        <ReasonsCard
          selectedReasons={goodGuestReasons}
          reasonsList={goodGuestReasonsList}
          readOnly={true}
        />
      )}

      {/* Guest-only: Storage Items */}
      {!isHostUser && storageItems.length > 0 && (
        <StorageItemsCard
          selectedItems={storageItems}
          itemsList={storageItemsList}
          readOnly={true}
        />
      )}

      {/* Host-only: Listings */}
      {isHostUser && hostListings.length > 0 && (
        <ListingsCard
          listings={hostListings}
          loading={false}
          onListingClick={onListingClick}
          readOnly={true}
        />
      )}
    </>
  );
}
