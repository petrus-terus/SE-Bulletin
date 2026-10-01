import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Story } from '../types/bulletin';
import styles from './StoryViewerModal.module.css';

interface Props {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

export const StoryViewerModal: React.FC<Props> = ({ stories, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressTimerRef = useRef<number | null>(null);

  const currentStory = stories[currentIndex];
  const DURATION_MS = 5000;
  const INTERVAL_MS = 50;

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  // Handle auto-advancing progress
  useEffect(() => {
    if (isPaused) return;

    progressTimerRef.current = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + (INTERVAL_MS / DURATION_MS) * 100;
        if (next >= 100) {
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
          handleNext();
          return 0;
        }
        return next;
      });
    }, INTERVAL_MS);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [currentIndex, isPaused, handleNext]);

  // Keyboard navigation & Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleNext, handlePrev]);

  if (!currentStory) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modalFrame}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Progress Bar Segments */}
        <div className={styles.progressTrack}>
          {stories.map((s, idx) => (
            <div key={s.id} className={styles.progressSegment}>
              <div
                className={styles.progressBarFill}
                style={{
                  transform: `scaleX(${
                    idx < currentIndex
                      ? 1
                      : idx === currentIndex
                      ? progress / 100
                      : 0
                  })`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className={styles.storyHeader}>
          <div className={styles.authorMeta}>
            <img
              src={currentStory.imageUrl}
              alt={currentStory.authorName}
              className={styles.authorAvatar}
            />
            <div className={styles.authorInfo}>
              <span className={styles.authorDept}>{currentStory.departmentName}</span>
              <span className={`${styles.timeRemaining} tabular-nums font-mono`}>
                {currentStory.authorName} • {currentStory.hoursRemaining}h remaining
              </span>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close story"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              close
            </span>
          </button>
        </div>

        {/* Media Frame & Tap Navigation Zones */}
        <div className={styles.mediaContainer}>
          <img
            src={currentStory.imageUrl}
            alt={currentStory.caption}
            className={styles.storyImg}
          />
          <div
            className={styles.tapZoneLeft}
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            title="Previous story"
          />
          <div
            className={styles.tapZoneRight}
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            title="Next story"
          />
        </div>

        {/* Caption Overlay */}
        <div className={styles.captionOverlay}>
          <p className={styles.captionText}>{currentStory.caption}</p>
          <div className={styles.pauseHint}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              touch_app
            </span>
            <span>Tap sides to navigate • Hold to pause</span>
          </div>
        </div>
      </div>
    </div>
  );
};
