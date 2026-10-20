import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { StoryGroup } from '@/types/bulletin';
import styles from './StoryViewerModal.module.css';

interface Props {
  storyGroups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
  onStoryViewed?: (storyId: string) => void;
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: string;
  onDeleteStory?: (storyId: string) => Promise<void> | void;
}

export const StoryViewerModal: React.FC<Props> = ({
  storyGroups,
  initialGroupIndex,
  onClose,
  onStoryViewed,
  currentUserName,
  currentUserRole,
  onDeleteStory,
}) => {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Default unmuted as agreed
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  useEffect(() => {
    setIsBuffering(false);
  }, [groupIndex, storyIndex]);

  // Touch gesture state for swipe-down to dismiss
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const pointerDownTimeRef = useRef<number>(0);
  const holdTimerRef = useRef<number | null>(null);

  const progressTimerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentGroup = storyGroups[groupIndex] || storyGroups[0];
  const currentStory = currentGroup?.stories[storyIndex];

  const DURATION_MS = 5000;
  const INTERVAL_MS = 50;

  // Mark story as viewed on render
  useEffect(() => {
    if (currentStory && onStoryViewed) {
      onStoryViewed(currentStory.id);
    }
  }, [currentStory, onStoryViewed]);

  const handleNext = useCallback(() => {
    if (!currentGroup) return;

    if (storyIndex < currentGroup.stories.length - 1) {
      // Next story within same group
      setStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else if (groupIndex < storyGroups.length - 1) {
      // Next department/author group
      setGroupIndex((prev) => prev + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      // Completed all stories in tray
      onClose();
    }
  }, [storyIndex, groupIndex, currentGroup, storyGroups.length, onClose]);

  const handlePrev = useCallback(() => {
    if (storyIndex > 0) {
      // Previous story in same group
      setStoryIndex((prev) => prev - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      // Previous department/author group
      const prevGroup = storyGroups[groupIndex - 1];
      setGroupIndex((prev) => prev - 1);
      setStoryIndex(prevGroup.stories.length - 1);
      setProgress(0);
    }
  }, [storyIndex, groupIndex, storyGroups]);

  // Auto-advancing progress for photo/text stories
  useEffect(() => {
    if (!currentStory) return;
    if (isPaused || showMenu || showDeleteConfirm) {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      return;
    }

    // Video handles its own progress via timeupdate
    if (currentStory.mediaType === 'video' || currentStory.videoUrl) {
      if (videoRef.current && videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
      return;
    }

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
  }, [currentStory, isPaused, showMenu, showDeleteConfirm, handleNext]);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const wasPlayingBeforeScrubRef = useRef(false);

  // Helper to format seconds into m:ss
  const formatTime = (secs: number) => {
    const s = Math.max(0, Math.floor(secs));
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  // Video timeupdate sync & metadata duration load
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || isScrubbing) return;
    const { currentTime, duration } = videoRef.current;
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
      setVideoDuration(duration);
    }
  };

  // Interactive scrubbing directly on the active story segment
  const handleScrubStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!videoRef.current || !videoDuration) return;
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    setIsScrubbing(true);
    wasPlayingBeforeScrubRef.current = !videoRef.current.paused;
    videoRef.current.pause();

    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetTime = ratio * videoDuration;

    videoRef.current.currentTime = targetTime;
    setProgress(ratio * 100);
    setScrubTime(targetTime);
  };

  const handleScrubMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing || !videoRef.current || !videoDuration) return;
    e.stopPropagation();
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = ratio * videoDuration;

    videoRef.current.currentTime = targetTime;
    setProgress(ratio * 100);
    setScrubTime(targetTime);
  };

  const handleScrubEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return;
    e.stopPropagation();
    e.preventDefault();

    setIsScrubbing(false);
    setScrubTime(null);

    if (videoRef.current && wasPlayingBeforeScrubRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

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

  const [isHolding, setIsHolding] = useState(false);

  // Pointer Down: Start hold timer
  const handlePointerDown = () => {
    pointerDownTimeRef.current = Date.now();
    // 200ms threshold differentiates quick tap from long-press to pause
    holdTimerRef.current = window.setTimeout(() => {
      setIsPaused(true);
      setIsHolding(true);
    }, 200);
  };

  // Pointer Up: If held < 200ms, execute tap navigation
  const handlePointerUp = (_e: React.PointerEvent, tapSide: 'left' | 'right') => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    const elapsed = Date.now() - pointerDownTimeRef.current;
    if (elapsed < 200 && dragY < 15) {
      // It was a quick tap: navigate immediately
      if (tapSide === 'left') {
        handlePrev();
      } else {
        handleNext();
      }
    }

    setIsPaused(false);
    setIsHolding(false);
  };

  // Touch Swipe-Down to Dismiss Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartYRef.current = touch.clientY;
    touchStartXRef.current = touch.clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null || touchStartXRef.current === null) return;
    const touch = e.touches[0];
    const dy = touch.clientY - touchStartYRef.current;
    const dx = touch.clientX - touchStartXRef.current;

    // Only engage drag if vertical motion dominates downwards
    if (dy > 0 && dy > Math.abs(dx) * 1.2) {
      setDragY(dy);
      setIsPaused(true);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartYRef.current = null;
    touchStartXRef.current = null;

    if (dragY > 120) {
      // Past threshold: spring close modal
      onClose();
    } else {
      // Snap back to top
      setDragY(0);
      setIsPaused(false);
    }
  };

  // Permissions for story authoring / moderation
  const isAuthor = Boolean(
    currentUserName &&
      currentStory &&
      currentStory.authorName &&
      currentStory.authorName.toLowerCase().trim() === currentUserName.toLowerCase().trim()
  );
  const isSuperAdmin = currentUserRole === 'SuperAdmin';
  const canManage = isAuthor || isSuperAdmin;

  const handleDelete = async () => {
    if (!currentStory || !onDeleteStory) return;
    setIsDeleting(true);
    try {
      await onDeleteStory(currentStory.id);
      setShowDeleteConfirm(false);
      setShowMenu(false);
      // Advance or close
      if (currentGroup.stories.length > 1) {
        handleNext();
      } else {
        onClose();
      }
    } catch (err) {
      console.error('Failed to delete story:', err);
      alert('Could not delete story. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLink = () => {
    if (!currentStory) return;
    const storyUrl = `${window.location.origin}/#story-${currentStory.id}`;
    navigator.clipboard.writeText(storyUrl).then(() => {
      setCopyFeedback(true);
      setTimeout(() => {
        setCopyFeedback(false);
        setShowMenu(false);
      }, 1400);
    });
  };

  if (!currentGroup || !currentStory) return null;

  // Scale and opacity during downward drag
  const dragScale = Math.max(0.85, 1 - dragY * 0.0006);
  const dragOpacity = Math.max(0.3, 1 - dragY * 0.002);

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={styles.modalFrame}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${dragY}px) scale(${dragScale})`,
          opacity: dragOpacity,
          transition: isDragging ? 'none' : 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease-out',
        }}
      >
        {/* Progress Bar Segments (Fades out smoothly when screen is held) */}
        <div
          className={`${styles.progressTrack} ${isHolding ? styles.overlayHidden : ''}`}
        >
          {currentGroup.stories.map((s, idx) => {
            const isCurrent = idx === storyIndex;
            const isVideoStory = s.mediaType === 'video' || Boolean(s.videoUrl);

            return (
              <div
                key={s.id}
                className={`${styles.progressSegment} ${
                  isCurrent && isVideoStory ? styles.progressSegmentInteractive : ''
                }`}
                onPointerDown={isCurrent && isVideoStory ? handleScrubStart : undefined}
                onPointerMove={isCurrent && isVideoStory ? handleScrubMove : undefined}
                onPointerUp={isCurrent && isVideoStory ? handleScrubEnd : undefined}
                onPointerCancel={isCurrent && isVideoStory ? handleScrubEnd : undefined}
                title={isCurrent && isVideoStory ? 'Drag or tap to scrub video' : undefined}
              >
                <div
                  className={styles.progressBarFill}
                  style={{
                    transform: `scaleX(${
                      idx < storyIndex
                        ? 1
                        : isCurrent
                        ? progress / 100
                        : 0
                    })`,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Live Scrubbing Time Badge (Shows floating timestamp when dragging top progress bar) */}
        {isScrubbing && scrubTime !== null && videoDuration > 0 && (
          <div className={styles.scrubTooltip}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              play_circle
            </span>
            <span className="font-mono tabular-nums">
              {formatTime(scrubTime)} / {formatTime(videoDuration)}
            </span>
          </div>
        )}

        {/* Story Header (Fades out when screen is held for clean unobstructed view) */}
        <div
          className={`${styles.storyHeader} ${isHolding ? styles.overlayHidden : ''}`}
        >
          <div className={styles.authorMeta}>
            <img
              src={currentStory.authorAvatar || currentGroup.authorAvatar || '/sabah_electricity_logo.png'}
              alt=""
              className={styles.authorAvatar}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/sabah_electricity_logo.png';
              }}
            />
            <div className={styles.authorInfo}>
              <span className={styles.authorDept}>
                {currentGroup.title}
              </span>
              <span className={`${styles.timeRemaining} tabular-nums font-mono`}>
                {currentStory.authorName} • {currentStory.hoursRemaining}h left
              </span>
            </div>
          </div>

          <div className={styles.headerActions}>
            {/* Audio Mute/Unmute Toggle for Videos */}
            {(currentStory.mediaType === 'video' || currentStory.videoUrl) && (
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setIsMuted((prev) => !prev)}
                aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>
                  {isMuted ? 'volume_off' : 'volume_up'}
                </span>
              </button>
            )}

            {/* 3-Dots Options Menu */}
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => setShowMenu((prev) => !prev)}
              aria-label="Story options"
              title="Story options"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>
                more_vert
              </span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close story"
              title="Close"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                close
              </span>
            </button>
          </div>
        </div>

        {/* 3-Dots Menu Dropdown Sheet */}
        {showMenu && (
          <div className={styles.menuDropdown} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.menuItem}
              onClick={handleCopyLink}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {copyFeedback ? 'check' : 'link'}
              </span>
              <span>{copyFeedback ? 'Link Copied!' : 'Copy Story Link'}</span>
            </button>

            {canManage && (
              <button
                type="button"
                className={`${styles.menuItem} ${styles.menuItemDanger}`}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  delete
                </span>
                <span>Delete Story</span>
              </button>
            )}
          </div>
        )}

        {/* Delete Confirmation Sheet */}
        {showDeleteConfirm && (
          <div className={styles.confirmBackdrop} onClick={() => setShowDeleteConfirm(false)}>
            <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
              <h4 className={styles.confirmTitle}>Delete this 24h Story?</h4>
              <p className={styles.confirmDesc}>
                This action cannot be undone. This dispatch will be immediately removed from Sabah Electricity feeds.
              </p>
              <div className={styles.confirmRow}>
                <button
                  type="button"
                  className={styles.confirmCancelBtn}
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.confirmDeleteBtn}
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Media Frame & Tap Navigation Zones */}
        <div className={styles.mediaContainer}>
          {currentStory.mediaType === 'video' || currentStory.videoUrl ? (
            <>
              <video
                ref={videoRef}
                src={currentStory.videoUrl || currentStory.imageUrl}
                className={styles.storyVideo}
                playsInline
                webkit-playsinline="true"
                autoPlay
                muted={isMuted}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                onCanPlay={() => setIsBuffering(false)}
                onLoadedMetadata={handleVideoLoadedMetadata}
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleNext}
              />
              {isBuffering && (
                <div className={styles.bufferingIndicator} aria-label="Buffering video">
                  <div className={styles.spinner} />
                </div>
              )}
            </>
          ) : (
            <img
              src={currentStory.imageUrl}
              alt=""
              className={styles.storyImg}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/grid_horizon_hero.jpg';
              }}
            />
          )}

          {/* Left Tap Zone (30% width) */}
          <div
            className={styles.tapZoneLeft}
            onPointerDown={handlePointerDown}
            onPointerUp={(e) => handlePointerUp(e, 'left')}
            title="Previous story"
          />

          {/* Right Tap Zone (70% width) */}
          <div
            className={styles.tapZoneRight}
            onPointerDown={handlePointerDown}
            onPointerUp={(e) => handlePointerUp(e, 'right')}
            title="Next story"
          />
        </div>

        {/* Bottom Caption & Location Overlay (Fades out when screen is held) */}
        <div className={`${styles.captionOverlay} ${isHolding ? styles.overlayHidden : ''}`}>
          {/* Authentic SESB Location Badge */}
          {currentStory.locationName && (
            <div className={styles.locationPill}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#10B981' }}>
                location_on
              </span>
              <span>{currentStory.locationName}</span>
            </div>
          )}

          {/* Author Active Views Count */}
          {isAuthor && currentStory.viewsCount !== undefined && (
            <div className={styles.viewsBadge}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                visibility
              </span>
              <span className="font-mono tabular-nums">{currentStory.viewsCount} views</span>
            </div>
          )}

          {currentStory.caption && (
            <p className={styles.captionText}>{currentStory.caption}</p>
          )}

          <div className={styles.dragDownHint}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              expand_more
            </span>
            <span>Swipe down to dismiss</span>
          </div>
        </div>
      </div>
    </div>
  );
};
