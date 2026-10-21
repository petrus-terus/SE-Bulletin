import { forwardRef } from 'react';
import styles from './CreateStoryModal.module.css';

interface StoryCaptionDeckProps {
  caption: string;
  onCaptionChange: (newCaption: string) => void;
  selectedLocation: string | null;
  onRemoveLocation: () => void;
  onToggleLocationPicker: () => void;
  placeholder?: string;
  maxLength?: number;
}

export const StoryCaptionDeck = forwardRef<HTMLInputElement, StoryCaptionDeckProps>(
  (
    {
      caption,
      onCaptionChange,
      selectedLocation,
      onRemoveLocation,
      onToggleLocationPicker,
      placeholder = 'Add a caption...',
      maxLength = 120,
    },
    ref
  ) => {
    return (
      <div className={styles.floatingControls}>
        {selectedLocation && (
          <div className={styles.activeLocationPill}>
            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
              location_on
            </span>
            <span>{selectedLocation}</span>
            <button
              type="button"
              className={styles.removeLocBtn}
              onClick={onRemoveLocation}
              aria-label="Remove location"
            >
              ×
            </button>
          </div>
        )}

        <div className={styles.captionRow}>
          <input
            ref={ref}
            type="text"
            className={styles.captionInput}
            placeholder={placeholder}
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            maxLength={maxLength}
          />
          <button
            type="button"
            className={`${styles.locationBtn} ${selectedLocation ? styles.locationBtnActive : ''}`}
            onClick={onToggleLocationPicker}
            aria-label="Add location"
            title="Add location tag"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              location_on
            </span>
          </button>
        </div>
      </div>
    );
  }
);

StoryCaptionDeck.displayName = 'StoryCaptionDeck';
