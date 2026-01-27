/**
 * IdentitySection - Display identity verification documents
 *
 * Shows for both guest and host:
 * - Selfie with ID
 * - ID front
 * - ID back
 * - Profile photo
 * - Verification status
 */
import { UserCheck } from 'lucide-react';
import UserIdentityCard from './UserIdentityCard.jsx';

export default function IdentitySection({ guest, host }) {
  return (
    <section className="mlpr-section mlpr-identity-section">
      <h2 className="mlpr-section-title">
        <UserCheck size={20} />
        Identity Verification
      </h2>
      <p className="mlpr-section-subtitle">
        Review identity documents for guest and host
      </p>

      <div className="mlpr-identity-grid">
        {/* Guest Identity */}
        <UserIdentityCard
          title="Guest / Parent User"
          user={guest}
        />

        {/* Host Identity */}
        <UserIdentityCard
          title="Host"
          user={host}
        />
      </div>
    </section>
  );
}
