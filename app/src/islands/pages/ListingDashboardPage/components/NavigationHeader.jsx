import { useListingDashboard } from '../context/ListingDashboardContext';
import { ChevronLeftIcon } from './icons.jsx';

export default function NavigationHeader() {
  const { handleBackClick } = useListingDashboard();

  return (
    <div className="listing-dashboard-back">
      <button className="listing-dashboard-back__btn" onClick={handleBackClick}>
        <ChevronLeftIcon size={16} /> Back to Listings
      </button>
    </div>
  );
}
