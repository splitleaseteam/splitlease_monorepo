/**
 * DocumentChangeSection - Display date/document change requests
 *
 * Features:
 * - Tabbed view for guest vs host requests
 * - Change request cards with details
 * - PDF viewing capability
 */
import { useState } from 'react';
import { FileText, User, Users } from 'lucide-react';
import ChangeRequestCard from './ChangeRequestCard.jsx';

export default function DocumentChangeSection({
  guestRequests = [],
  hostRequests = [],
  onOpenPdf
}) {
  const [activeTab, setActiveTab] = useState('guest');

  const activeRequests = activeTab === 'guest' ? guestRequests : hostRequests;

  return (
    <section className="mlpr-section mlpr-change-section">
      <h2 className="mlpr-section-title">
        <FileText size={20} />
        Document Change Requests
      </h2>
      <p className="mlpr-section-subtitle">
        Date change requests submitted by guest or host
      </p>

      {/* Tabs */}
      <div className="mlpr-change-tabs">
        <button
          type="button"
          className={`mlpr-change-tab ${activeTab === 'guest' ? 'active' : ''}`}
          onClick={() => setActiveTab('guest')}
        >
          <User size={14} />
          Guest Requests
          <span className="mlpr-change-tab-count">{guestRequests.length}</span>
        </button>
        <button
          type="button"
          className={`mlpr-change-tab ${activeTab === 'host' ? 'active' : ''}`}
          onClick={() => setActiveTab('host')}
        >
          <Users size={14} />
          Host Requests
          <span className="mlpr-change-tab-count">{hostRequests.length}</span>
        </button>
      </div>

      {/* Request List */}
      {activeRequests.length === 0 ? (
        <div className="mlpr-change-empty">
          <FileText size={32} />
          <p>No {activeTab} change requests</p>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            Change requests will appear here when submitted
          </p>
        </div>
      ) : (
        <div className="mlpr-change-list">
          {activeRequests.map((request, index) => (
            <ChangeRequestCard
              key={request.id || index}
              request={request}
              onOpenPdf={onOpenPdf}
            />
          ))}
        </div>
      )}
    </section>
  );
}
