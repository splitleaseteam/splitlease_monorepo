/**
 * CheckInCheckOutFlow Component
 *
 * Modal for handling check-in and check-out workflows.
 *
 * Check-in Flow:
 * - "I'm on my way" button with message
 * - "I'm here" button with message
 * - Custom message input
 *
 * Check-out Flow:
 * - Submit cleaning photos
 * - Submit storage photos
 * - Submit review
 * - "Leaving property" confirmation
 */

import { useState } from 'react';
import { X, Send, Camera, Star, LogOut, Navigation, MapPin } from 'lucide-react';
import './CheckInCheckOutFlow.css';

/**
 * Format a date for display
 */
function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

export default function CheckInCheckOutFlow({
  isOpen,
  mode,
  stay,
  onClose,
  onSendMessage,
  onImOnMyWay,
  onImHere,
  onSubmitPhotos,
  onSubmitReview,
  onLeavingProperty
}) {
  const [message, setMessage] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [photoType, setPhotoType] = useState('cleaning');

  if (!isOpen || !stay) return null;

  const isCheckIn = mode === 'checkin';
  const title = isCheckIn ? 'Check In' : 'Check Out';

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message, stay);
      setMessage('');
    }
  };

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedPhotos(prev => [...prev, ...files]);
  };

  const handleSubmitPhotos = () => {
    if (selectedPhotos.length > 0) {
      onSubmitPhotos(selectedPhotos, photoType, stay);
      setSelectedPhotos([]);
    }
  };

  const handleRemovePhoto = (index) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="check-flow-overlay" onClick={onClose}>
      <div className="check-flow-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <header className="check-flow__header">
          <h2 className="check-flow__title">{title}</h2>
          <button className="check-flow__close" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </header>

        {/* Stay Info */}
        <div className="check-flow__stay-info">
          <span className="check-flow__stay-week">Week {stay.weekNumber || '?'}</span>
          <span className="check-flow__stay-dates">
            {formatDate(stay.checkIn)} - {formatDate(stay.checkOut)}
          </span>
        </div>

        {/* Content */}
        <div className="check-flow__content">
          {isCheckIn ? (
            /* CHECK-IN FLOW */
            <div className="check-flow__checkin">
              {/* Quick Actions */}
              <div className="check-flow__quick-actions">
                <button
                  className="check-flow__action-btn check-flow__action-btn--on-way"
                  onClick={() => onImOnMyWay(stay)}
                >
                  <Navigation size={20} />
                  I&apos;m on my way
                </button>
                <button
                  className="check-flow__action-btn check-flow__action-btn--here"
                  onClick={() => onImHere(stay)}
                >
                  <MapPin size={20} />
                  I&apos;m here
                </button>
              </div>

              {/* Custom Message */}
              <div className="check-flow__message-section">
                <label className="check-flow__label">
                  Send a message to your host:
                </label>
                <textarea
                  className="check-flow__textarea"
                  placeholder="Hi! I just wanted to let you know..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                >
                  <Send size={16} />
                  Send Message
                </button>
              </div>
            </div>
          ) : (
            /* CHECK-OUT FLOW */
            <div className="check-flow__checkout">
              {/* Photo Upload Section */}
              <div className="check-flow__photo-section">
                <h3 className="check-flow__section-title">
                  <Camera size={18} />
                  Submit Photos
                </h3>

                {/* Photo Type Toggle */}
                <div className="check-flow__photo-type-toggle">
                  <button
                    className={`check-flow__toggle-btn ${photoType === 'cleaning' ? 'active' : ''}`}
                    onClick={() => setPhotoType('cleaning')}
                  >
                    Cleaning Photos
                  </button>
                  <button
                    className={`check-flow__toggle-btn ${photoType === 'storage' ? 'active' : ''}`}
                    onClick={() => setPhotoType('storage')}
                  >
                    Storage Photos
                  </button>
                </div>

                {/* Photo Upload */}
                <div className="check-flow__photo-upload">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    id="photo-upload"
                    className="check-flow__file-input"
                  />
                  <label htmlFor="photo-upload" className="check-flow__file-label">
                    <Camera size={24} />
                    <span>Select Photos</span>
                  </label>
                </div>

                {/* Selected Photos Preview */}
                {selectedPhotos.length > 0 && (
                  <div className="check-flow__photo-preview">
                    {selectedPhotos.map((photo, index) => (
                      <div key={index} className="check-flow__photo-item">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Photo ${index + 1}`}
                        />
                        <button
                          className="check-flow__photo-remove"
                          onClick={() => handleRemovePhoto(index)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  onClick={handleSubmitPhotos}
                  disabled={selectedPhotos.length === 0}
                >
                  Submit {photoType === 'cleaning' ? 'Cleaning' : 'Storage'} Photos
                </button>
              </div>

              {/* Review Section */}
              <div className="check-flow__review-section">
                <button
                  className="btn btn-outline"
                  onClick={() => onSubmitReview(stay)}
                >
                  <Star size={16} />
                  Submit Review
                </button>
              </div>

              {/* Leave Property */}
              <div className="check-flow__leave-section">
                <button
                  className="btn btn-primary check-flow__leave-btn"
                  onClick={() => onLeavingProperty(stay)}
                >
                  <LogOut size={16} />
                  I&apos;m Leaving the Property
                </button>
                <p className="check-flow__leave-hint">
                  Click this when you&apos;ve completed checkout and are leaving.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
