import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ImageViewerModal.module.css';

interface Props {
  imageUrl: string;
  title?: string;
  location?: string | null;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<Props> = ({
  imageUrl,
  title,
  location,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Touch tracking refs
  const lastTapRef = useRef<number>(0);
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef<number>(1);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPinchingRef = useRef<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Reset position if scale returns to 1
  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Double tap handler
  const handleDoubleTap = (clientX: number, clientY: number) => {
    if (scale > 1.05) {
      resetZoom();
    } else {
      // Zoom in towards 2.5x
      const targetScale = 2.5;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      // Calculate offset towards click point
      const offsetX = (windowWidth / 2 - clientX) * 0.7;
      const offsetY = (windowHeight / 2 - clientY) * 0.7;
      setScale(targetScale);
      setPosition({ x: offsetX, y: offsetY });
    }
  };

  // Mouse wheel zoom for desktop
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY * -0.002;
    setScale((prev) => {
      const nextScale = Math.min(Math.max(1, prev + zoomFactor), 4);
      if (nextScale <= 1.05) {
        setPosition({ x: 0, y: 0 });
      }
      return nextScale;
    });
  };

  // Mouse drag handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1.05) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1.05) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch started
      isPinchingRef.current = true;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartScaleRef.current = scale;
    } else if (e.touches.length === 1) {
      // Single touch
      const now = Date.now();
      const touch = e.touches[0];
      if (now - lastTapRef.current < 300) {
        // Double tap detected
        handleDoubleTap(touch.clientX, touch.clientY);
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
        touchStartPosRef.current = {
          x: touch.clientX - position.x,
          y: touch.clientY - position.y,
        };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      // Pinching
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDistRef.current;
      const nextScale = Math.min(
        Math.max(1, touchStartScaleRef.current * factor),
        4
      );
      setScale(nextScale);
      if (nextScale <= 1.05) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (scale > 1.05) {
        // Pan image when zoomed
        setPosition({
          x: touch.clientX - touchStartPosRef.current.x,
          y: touch.clientY - touchStartPosRef.current.y,
        });
      } else {
        // Swipe down to dismiss when scale is 1
        const deltaY = touch.clientY - touchStartPosRef.current.y;
        if (deltaY > 120) {
          onClose();
        }
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
    isPinchingRef.current = false;
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        // Clicking backdrop closes modal if scale is 1
        if (scale <= 1.05 && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Top Controls */}
      <div className={styles.topBar}>
        <div className={styles.topBarActions}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close photo view"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
              close
            </span>
          </button>
        </div>

        {scale > 1.05 && (
          <div className={styles.topBarActions}>
            <span className={`tabular-nums font-mono ${styles.zoomIndicator}`}>
              {scale.toFixed(1)}x
            </span>
            <button
              type="button"
              className={styles.closeButton}
              onClick={resetZoom}
              aria-label="Reset zoom"
              title="Reset to 1x"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                restart_alt
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Main Zoomable Canvas */}
      <div
        className={styles.canvasArea}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={styles.imageTransformContainer}
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
            transition: isDragging || isPinchingRef.current ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <img
            src={imageUrl}
            alt={title || 'Full screen photo'}
            className={styles.imageElement}
            onDoubleClick={(e) => handleDoubleTap(e.clientX, e.clientY)}
          />
        </div>
      </div>

      {/* Bottom Information & Gesture Hint Bar */}
      <div className={styles.bottomBar}>
        {title && <span className={styles.imageTitle}>{title}</span>}
        <div className={styles.gestureHint}>
          <span>Double-tap or pinch to zoom</span>
          <span className={styles.gestureDot}></span>
          <span>{location || 'Sabah Electricity'}</span>
        </div>
      </div>
    </div>
  );
};
