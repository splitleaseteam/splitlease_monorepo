import PricingSection from '../PricingSection.jsx';
import AvailabilitySection from '../AvailabilitySection.jsx';

export default function PricingCalendarTab() {
  return (
    <div className="listing-dashboard-tab-content listing-dashboard-tab-content--split">
      <div className="listing-dashboard-inline-section">
        <PricingSection />
      </div>
      <div className="listing-dashboard-inline-section">
        <AvailabilitySection />
      </div>
    </div>
  );
}
