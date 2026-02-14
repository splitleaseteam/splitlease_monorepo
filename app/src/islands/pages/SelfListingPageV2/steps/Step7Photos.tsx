/**
 * Step 7: Photos - optional photo upload with drag-and-drop reordering
 *
 * Photo drag/drop state is local to this component.
 */
import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';
import type { FormData } from '../types';

interface Step7Props {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  isMobile: boolean;
  handleContinueOnPhone: () => Promise<void>;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const Step7Photos: React.FC<Step7Props> = ({
  formData,
  updateFormData,
  isMobile,
  handleContinueOnPhone,
  onNext,
  onSkip,
  onBack,
}) => {
  // Photo drag and drop state (local to this step)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = Array.from(files).map((file: File, index: number) => ({
      id: `photo_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      url: URL.createObjectURL(file),
      file,
    }));

    updateFormData({ photos: [...formData.photos, ...newPhotos] });
  };

  const handleRemovePhoto = (id: string) => {
    updateFormData({ photos: formData.photos.filter(p => p.id !== id) });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...formData.photos];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, draggedItem);

    updateFormData({ photos: updated });
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="section-card">
      <h2>Photos</h2>
      <p className="subtitle">Add photos of your property (minimum 3 required)</p>

      {/* Photo Gallery with Drag and Drop */}
      {formData.photos.length > 0 && (
        <div className="photo-gallery">
          <p className="drag-drop-hint">Drag and drop photos to reorder. First photo is the cover photo.</p>
          <div className="photo-grid">
            {formData.photos.map((photo, index) => (
              <div
                key={photo.id}
                className={`photo-item ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <img src={photo.url} alt={`Property photo ${index + 1}`} />
                <div className="photo-controls">
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="btn-delete"
                    title="Remove photo"
                  >
                    🗑️
                  </button>
                </div>
                {index === 0 && <div className="photo-badge">Cover Photo</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <label className="photo-zone">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoUpload}
          style={{ display: 'none' }}
        />
        <div className="photo-zone-content">
          <p className="photo-zone-title">Click to upload photos</p>
          <p className="photo-zone-subtitle">
            {formData.photos.length < 3
              ? `${3 - formData.photos.length} more photo${3 - formData.photos.length === 1 ? '' : 's'} required`
              : 'Add more photos (optional)'}
          </p>
        </div>
      </label>

      {/* Photo Count */}
      <p className="progress-text">
        {formData.photos.length} of 3 minimum photos uploaded
        {formData.photos.length >= 3 && ' ✓'}
      </p>

      <div className="btn-group">
        <button className="btn-next" onClick={onNext}>Continue</button>
        <button className="btn-skip" onClick={onSkip}>Skip for Now</button>
        <div className="btn-row-secondary">
          <button className="btn-back" onClick={onBack}>Back</button>
          {!isMobile && (
            <button className="btn-continue-phone" onClick={handleContinueOnPhone}>
              <Smartphone size={18} color="#5b21b6" /> Continue on Phone
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
