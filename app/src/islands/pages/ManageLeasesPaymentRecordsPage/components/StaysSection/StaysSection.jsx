/**
 * StaysSection - Manage stays associated with a lease
 *
 * Features:
 * - Display existing stays
 * - Create stays from lease dates
 * - Clear all stays
 */
import { Calendar, Plus, Trash2, Copy } from 'lucide-react';
import StayCard from './StayCard.jsx';

export default function StaysSection({
  stays = [],
  onCreateStays,
  onClearStays,
  isLoading
}) {
  const copyStayId = (id) => {
    navigator.clipboard.writeText(id);
  };

  return (
    <section className="mlpr-section mlpr-stays-section">
      <h2 className="mlpr-section-title">
        <Calendar size={20} />
        Stays Management
      </h2>
      <p className="mlpr-section-subtitle">
        Stays represent individual booking periods within the lease
      </p>

      {/* Actions */}
      <div className="mlpr-stays-actions">
        <button
          type="button"
          className="mlpr-btn mlpr-btn-primary"
          onClick={onCreateStays}
          disabled={isLoading}
        >
          <Plus size={16} />
          Create Stays
        </button>
        <button
          type="button"
          className="mlpr-btn mlpr-btn-danger"
          onClick={() => {
            if (confirm(`Are you sure you want to clear all ${stays.length} stays? This cannot be undone.`)) {
              onClearStays();
            }
          }}
          disabled={isLoading || stays.length === 0}
        >
          <Trash2 size={16} />
          Clear All Stays
        </button>
      </div>

      {/* Stays List */}
      {stays.length === 0 ? (
        <div className="mlpr-stays-empty">
          <Calendar size={32} />
          <p>No stays have been created for this lease</p>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            Click "Create Stays" to generate stays from the lease dates
          </p>
        </div>
      ) : (
        <div className="mlpr-stays-list">
          {stays.map((stay, index) => (
            <StayCard
              key={stay.id || index}
              stay={stay}
              index={index}
              onCopyId={copyStayId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
