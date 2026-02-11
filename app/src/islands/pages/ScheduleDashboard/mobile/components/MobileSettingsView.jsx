/**
 * MobileSettingsView Component
 *
 * Main settings container with stacked navigation.
 * Shows menu or active section based on navigation state.
 */

import { useState } from 'react';
import SettingsMenu from './SettingsMenu.jsx';
import PricingSection from './PricingSection.jsx';
import SharingSection from './SharingSection.jsx';

/**
 * Mobile settings view with navigation
 * @param {Object} props
 * @param {Object} props.pricingSettings - Current pricing settings
 * @param {function} props.onSavePricing - Callback to save pricing settings
 * @param {number} props.sharingWillingness - Current sharing willingness (0-100)
 * @param {function} props.onSaveSharing - Callback to save sharing preference
 * @param {function} props.onNavigateToAccount - Navigate to account page
 * @param {function} props.onNavigateToNotifications - Navigate to notifications
 */
export default function MobileSettingsView({
  pricingSettings,
  onSavePricing,
  sharingWillingness,
  onSaveSharing,
  onNavigateToAccount,
  onNavigateToNotifications
}) {
  const [activeSection, setActiveSection] = useState(null);

  // Handle section navigation
  const handleSelect = (sectionId) => {
    switch (sectionId) {
      case 'pricing':
      case 'sharing':
        setActiveSection(sectionId);
        break;
      case 'notifications':
        onNavigateToNotifications?.();
        break;
      case 'account':
        onNavigateToAccount?.();
        break;
      default:
        break;
    }
  };

  // Render Pricing Section
  if (activeSection === 'pricing') {
    return (
      <PricingSection
        settings={pricingSettings}
        onSave={onSavePricing}
        onBack={() => setActiveSection(null)}
      />
    );
  }

  // Render Sharing Section
  if (activeSection === 'sharing') {
    return (
      <SharingSection
        value={sharingWillingness}
        onSave={onSaveSharing}
        onBack={() => setActiveSection(null)}
      />
    );
  }

  // Render Main Menu
  return (
    <div className="mobile-settings">
      <SettingsMenu onSelect={handleSelect} />
    </div>
  );
}
