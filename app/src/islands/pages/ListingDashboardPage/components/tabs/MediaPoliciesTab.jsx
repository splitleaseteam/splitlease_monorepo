import { Suspense, lazy } from 'react';
import CancellationPolicySection from '../CancellationPolicySection.jsx';

const PhotosSection = lazy(() => import('../PhotosSection.jsx'));

export default function MediaPoliciesTab() {
  return (
    <div className="listing-dashboard-tab-content">
      <div className="listing-dashboard-inline-section">
        <Suspense fallback={<div className="listing-dashboard-section-loading">Loading photos...</div>}>
          <PhotosSection />
        </Suspense>
      </div>

      <hr className="listing-dashboard-inline-divider" />

      <div className="listing-dashboard-inline-section">
        <CancellationPolicySection />
      </div>
    </div>
  );
}
