import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Employee, Story } from '@/types/bulletin';
import { bulletinService } from '@/services/bulletinService';
import { MediaCropModal } from '@/ui/MediaCropModal';
import { formatVideoTime } from '@/utils/format';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { StoryCaptionDeck } from './StoryCaptionDeck';
import styles from './CreateStoryModal.module.css';

interface Props {
  currentUser: Employee;
  onClose: () => void;
  onSubmit: (newStory: Story) => void;
}

import {
  DEFAULT_DEPARTMENT_ID,
  SESB_LOCATIONS,
  DEFAULT_COVER_URL,
} from '@/constants/bulletin';

import {
  SESB_GRADIENTS,
  createTextCardImage,
  checkVideoDuration,
  captureVideoThumbnail,
} from '@/utils/storyMedia';

export const CreateStoryModal: React.FC<Props> = ({ currentUser, onClose, onSubmit }) => {
  const [isLanding, setIsLanding] = useState(true);
  const [mode, setMode] = useState<'photo' | 'video' | 'text'>('photo');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoThumbnailUrl, setVideoThumbnailUrl] = useState<string | null>(null);
  const [videoThumbnailFile, setVideoThumbnailFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [textStory, setTextStory] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(SESB_GRADIENTS[0].gradient);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [currentPhotoFile, setCurrentPhotoFile] = useState<File | null>(null);
  const [currentVideoFile, setCurrentVideoFile] = useState<File | null>(null);
  const [isCropUploading, setIsCropUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaPickerInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const captionInputRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Video preview player & scrub state
  const [isPlayingPreview, setIsPlayingPreview] = useState(true);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [isPreviewScrubbing, setIsPreviewScrubbing] = useState(false);

  useEscapeKey(onClose, !isUploading && !isCropOpen);
  useBodyScrollLock(true);

  const handlePreviewTimeUpdate = () => {
    if (!previewVideoRef.current || isPreviewScrubbing) return;
    const { currentTime, duration } = previewVideoRef.current;
    setPreviewCurrentTime(currentTime);
    if (duration > 0) {
      setPreviewProgress((currentTime / duration) * 100);
    }
  };

  const togglePreviewPlay = () => {
    if (!previewVideoRef.current) return;
    if (previewVideoRef.current.paused) {
      previewVideoRef.current.play().catch(() => {});
      setIsPlayingPreview(true);
    } else {
      previewVideoRef.current.pause();
      setIsPlayingPreview(false);
    }
  };

  const handlePreviewScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    setPreviewProgress(newProgress);
    if (previewVideoRef.current && previewVideoRef.current.duration) {
      const targetTime = (newProgress / 100) * previewVideoRef.current.duration;
      previewVideoRef.current.currentTime = targetTime;
      setPreviewCurrentTime(targetTime);
    }
  };

  // Revoke any created object URLs when resetting or unmounting to prevent memory leaks
  const revokeObjectUrls = useCallback(() => {
    if (photoUrl && photoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(photoUrl);
    }
    if (videoUrl && videoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoUrl);
    }
    if (videoThumbnailUrl && videoThumbnailUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoThumbnailUrl);
    }
  }, [photoUrl, videoUrl, videoThumbnailUrl]);

  useEffect(() => {
    return () => {
      revokeObjectUrls();
    };
  }, [revokeObjectUrls]);

  const handleBackToLanding = () => {
    revokeObjectUrls();
    setIsLanding(true);
    setPhotoUrl(null);
    setVideoUrl(null);
    setVideoThumbnailUrl(null);
    setVideoThumbnailFile(null);
    setCaption('');
    setSelectedLocation(null);
    setTextStory('');
    setErrorMessage(null);
    setPendingFile(null);
    setCurrentPhotoFile(null);
    setCurrentVideoFile(null);
    setVideoDuration(null);
    setUploadStatus(null);
    if (mediaPickerInputRef.current) mediaPickerInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleOpenMediaPicker = () => {
    mediaPickerInputRef.current?.click();
  };

  const handleMediaPickerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      setMode('video');
      setIsLanding(false);
      await handleVideoSelect({ target: { files: [file] } });
    } else {
      setMode('photo');
      setIsLanding(false);
      await handlePhotoSelect({ target: { files: [file] } });
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement> | { target: { files: (File | undefined)[] } }) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke previous photo preview if any
    if (photoUrl && photoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(photoUrl);
    }

    setCurrentPhotoFile(file);
    setPendingFile(file);
    setErrorMessage(null);
    setIsLanding(false);

    // Instant local preview — zero remote upload until user hits 'Share'
    const localUrl = URL.createObjectURL(file);
    setPhotoUrl(localUrl);
    setUploadStatus(null);

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (mediaPickerInputRef.current) mediaPickerInputRef.current.value = '';
  };

  const handleStoryCropConfirm = async (croppedFile: File) => {
    setIsCropUploading(true);
    try {
      if (photoUrl && photoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(photoUrl);
      }
      const localCroppedUrl = URL.createObjectURL(croppedFile);
      setPhotoUrl(localCroppedUrl);
      setCurrentPhotoFile(croppedFile);
      setIsCropOpen(false);
    } catch (err: unknown) {
      console.error('[CreateStoryModal] Cropped photo preview failed:', err);
      const msg = err instanceof Error ? err.message : 'Failed to crop photo.';
      setErrorMessage(msg);
    } finally {
      setIsCropUploading(false);
    }
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement> | { target: { files: (File | undefined)[] } }) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFile(file);
    setErrorMessage(null);

    // 1. File size ceiling check (30MB)
    if (file.size > 30 * 1024 * 1024) {
      setErrorMessage('Video exceeds 30MB limit. Please select a clip under 30MB (max 30 seconds).');
      return;
    }

    setUploadStatus('Checking Duration...');

    try {
      // 2. Client-side duration inspection (max 30s)
      try {
        const duration = await checkVideoDuration(file);
        setVideoDuration(duration);
        if (duration > 30.5) {
          setErrorMessage(`Video is ${Math.round(duration)}s long. 24h Stories must be 30 seconds or under.`);
          setUploadStatus(null);
          return;
        }
      } catch (durErr) {
        console.warn('[CreateStoryModal] Duration check fallback:', durErr);
      }

      // 3. Extract lightweight first-frame thumbnail locally
      setUploadStatus('Extracting Preview...');
      try {
        const thumbFile = await captureVideoThumbnail(file);
        setVideoThumbnailFile(thumbFile);
        if (videoThumbnailUrl && videoThumbnailUrl.startsWith('blob:')) {
          URL.revokeObjectURL(videoThumbnailUrl);
        }
        setVideoThumbnailUrl(URL.createObjectURL(thumbFile));
      } catch (thumbErr) {
        console.warn('[CreateStoryModal] Thumbnail capture fallback:', thumbErr);
      }

      // 4. Instant local preview for video — zero bytes uploaded until 'Share' is tapped!
      if (videoUrl && videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
      const localVideoUrl = URL.createObjectURL(file);
      setVideoUrl(localVideoUrl);
      setCurrentVideoFile(file);
      setUploadStatus(null);
      setPendingFile(null);
      setIsLanding(false);
    } catch (err: unknown) {
      console.error('[CreateStoryModal] Video preparation failed:', err);
      setUploadStatus(null);
      const msg = err instanceof Error ? err.message : 'Failed to load video clip. Please try another video.';
      setErrorMessage(msg);
    } finally {
      if (videoInputRef.current) videoInputRef.current.value = '';
      if (mediaPickerInputRef.current) mediaPickerInputRef.current.value = '';
    }
  };

  const handlePublish = async () => {
    let finalImageUrl: string | null = null;
    let finalVideoUrl: string | null = null;
    let finalCaption = caption.trim();

    setIsUploading(true);
    setErrorMessage(null);
    setUploadStatus('Uploading Story...');

    try {
      if (mode === 'text') {
        if (!textStory.trim()) return;
        finalCaption = textStory.trim();
        const blob = await createTextCardImage(
          finalCaption,
          selectedGradient,
          currentUser.name,
          currentUser.department
        );
        const file = new File([blob], 'text-story.jpg', { type: 'image/jpeg' });
        finalImageUrl = await bulletinService.uploadPhoto(file);
      } else if (mode === 'photo') {
        if (!currentPhotoFile) return;
        setUploadStatus('Uploading Photo...');
        finalImageUrl = await bulletinService.uploadPhoto(currentPhotoFile);
      } else if (mode === 'video') {
        if (!currentVideoFile) return;

        // Upload extracted thumbnail first if available
        if (videoThumbnailFile) {
          setUploadStatus('Uploading Preview...');
          try {
            finalImageUrl = await bulletinService.uploadPhoto(videoThumbnailFile, {
              maxWidth: 800,
              maxHeight: 1400,
              quality: 0.82,
            });
          } catch (tErr) {
            console.warn('[CreateStoryModal] Thumbnail upload failed, continuing video upload:', tErr);
          }
        }

        // Upload video file to Supabase Storage
        setUploadStatus('Uploading Video...');
        finalVideoUrl = await bulletinService.uploadPhoto(currentVideoFile);
      }
    } catch (err: unknown) {
      console.error('Failed to upload story media to storage:', err);
      const msg = err instanceof Error ? err.message : 'Failed to publish story. Please check your connection and retry.';
      setErrorMessage(msg);
      return;
    } finally {
      setIsUploading(false);
      setUploadStatus(null);
    }

    const fallbackCover = DEFAULT_COVER_URL;
    const newStory: Story = {
      id: `story-${Date.now()}`,
      departmentId: currentUser.adminDepartments?.[0] || DEFAULT_DEPARTMENT_ID,
      departmentName: currentUser.department || 'Operations',
      authorName: currentUser.name,
      authorAvatar: currentUser.avatarUrl,
      hasUnread: true,
      imageUrl: mode === 'video' ? (videoThumbnailUrl || fallbackCover) : (finalImageUrl || fallbackCover),
      videoUrl: finalVideoUrl || undefined,
      mediaType: mode === 'video' ? 'video' : 'image',
      backgroundColor: selectedGradient,
      caption: finalCaption,
      locationName: selectedLocation || undefined,
      hoursRemaining: 24,
      viewsCount: 1,
    };

    onSubmit(newStory);
    onClose();
  };


  const canPublish =
    mode === 'photo'
      ? Boolean(photoUrl)
      : mode === 'video'
      ? Boolean(videoUrl)
      : Boolean(textStory.trim());

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Share Story (24h)"
    >
      <div className={styles.modalFrame} onClick={(e) => e.stopPropagation()}>
        {/* Hidden File Inputs */}
        <input
          ref={mediaPickerInputRef}
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime,video/*"
          onChange={handleMediaPickerChange}
          style={{ display: 'none' }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          style={{ display: 'none' }}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/*"
          onChange={handleVideoSelect}
          style={{ display: 'none' }}
        />

        {isLanding ? (
          /* WhatsApp-Style Minimalist "Share stories" Landing Hub */
          <div className={styles.landingContainer}>
            <header className={styles.landingHeader}>
              <button
                type="button"
                className={styles.landingCloseBtn}
                onClick={onClose}
                aria-label="Close"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                  close
                </span>
              </button>
            </header>

            <main className={styles.landingBody}>
              {/* WhatsApp Concentric Status Ring Icon */}
              <div className={styles.statusRingBadge} aria-hidden="true">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={styles.statusRingSvg}
                >
                  {/* Outer Segmented Ring */}
                  <circle
                    cx="32"
                    cy="32"
                    r="27"
                    stroke="#475569"
                    strokeWidth="3.5"
                    strokeDasharray="16 6"
                    strokeLinecap="round"
                  />
                  {/* Inner Solid Ring & Center Core */}
                  <circle cx="32" cy="32" r="16" fill="#334155" />
                  <circle cx="32" cy="32" r="12" fill="#1E293B" />
                </svg>
              </div>

              <h2 className={styles.landingTitle}>Share stories</h2>
              <p className={styles.landingSubtitle}>
                Share photos, videos and text that disappear after 24 hours.
              </p>

              {/* Action Circle Hub */}
              <div className={styles.landingActionsRow}>
                {/* Text Status Option */}
                <button
                  type="button"
                  className={styles.landingActionBtn}
                  onClick={() => {
                    setMode('text');
                    setIsLanding(false);
                    setErrorMessage(null);
                  }}
                >
                  <div className={styles.landingIconCircle}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                      edit
                    </span>
                  </div>
                  <span className={styles.landingActionLabel}>Text status</span>
                </button>

                {/* Photo and Video Option */}
                <button
                  type="button"
                  className={styles.landingActionBtn}
                  onClick={handleOpenMediaPicker}
                >
                  <div className={styles.landingIconCircle}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                      photo_camera
                    </span>
                  </div>
                  <span className={styles.landingActionLabel}>Photo and video</span>
                </button>
              </div>
            </main>
          </div>
        ) : (
          <>
            {/* Contextual Composer Top Header */}
            <header className={styles.headerBar}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={handleBackToLanding}
                aria-label="Back to selection"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  arrow_back
                </span>
                <span>Back</span>
              </button>
              <h2 className={styles.headerTitle}>
                {mode === 'text' ? 'Text Story' : mode === 'video' ? 'Video Story' : 'Photo Story'}
              </h2>
              <button
                type="button"
                className={styles.publishBtn}
                onClick={handlePublish}
                disabled={!canPublish || isUploading}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  send
                </span>
                <span>Share</span>
              </button>
            </header>
          </>
        )}

        {/* Inline Error & Retry Banner */}
        {errorMessage && (
          <div className={styles.errorBanner} role="alert">
            <div className={styles.errorContent}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#EF4444' }}>
                error
              </span>
              <span className={styles.errorText}>{errorMessage}</span>
            </div>
            <div className={styles.errorActions}>
              {pendingFile && (
                <button
                  type="button"
                  className={styles.retryBtn}
                  onClick={() => {
                    const f = pendingFile;
                    if (mode === 'photo') {
                      handlePhotoSelect({ target: { files: [f] } });
                    } else if (mode === 'video') {
                      handleVideoSelect({ target: { files: [f] } });
                    }
                  }}
                >
                  Retry
                </button>
              )}
              <button
                type="button"
                className={styles.dismissErrorBtn}
                onClick={() => setErrorMessage(null)}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Main Canvas Viewport (Rendered when in composer mode) */}
        {!isLanding && (
          <div className={styles.storyCanvas}>
          {mode === 'photo' ? (
            <div className={styles.photoStoryWrapper}>
              {photoUrl ? (
                <>
                  <img src={photoUrl} alt="Story preview" className={styles.photoPreview} />

                  {/* Floating Top Bar with Crop & Frame Tool + Status Badge */}
                  <div className={styles.canvasTopBar}>
                    <button
                      type="button"
                      className={styles.canvasToolBtn}
                      onClick={() => setIsCropOpen(true)}
                      title="Crop & Re-frame"
                      aria-label="Crop and re-frame photo"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }} aria-hidden="true">
                        crop
                      </span>
                      <span>Crop & Frame</span>
                    </button>

                    {uploadStatus && (
                      <div className={styles.statusBadge}>
                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }} aria-hidden="true">
                          check_circle
                        </span>
                        <span>{uploadStatus}</span>
                      </div>
                    )}
                  </div>

                  {/* Caption & Location Controls */}
                  <StoryCaptionDeck
                    ref={captionInputRef}
                    caption={caption}
                    onCaptionChange={setCaption}
                    selectedLocation={selectedLocation}
                    onRemoveLocation={() => setSelectedLocation(null)}
                    onToggleLocationPicker={() => setShowLocationPicker((prev) => !prev)}
                  />
                </>
              ) : (
                <div
                  className={styles.emptyPlaceholder}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className={styles.cameraIconWrap}>
                    <span
                      className={`material-symbols-outlined ${isUploading ? styles.spinning : ''}`}
                      style={{ fontSize: '36px' }}
                    >
                      {isUploading ? 'sync' : 'add_a_photo'}
                    </span>
                  </div>
                  <h3 className={styles.placeholderPrompt}>
                    {isUploading ? 'Optimizing Photo...' : 'Take Photo or Choose from Gallery'}
                  </h3>
                  <p className={styles.placeholderSub}>
                    Capture photo at substation, power station, or Wisma SESB office
                  </p>
                </div>
              )}
            </div>
          ) : mode === 'video' ? (
            <div className={styles.photoStoryWrapper}>
              {videoUrl ? (
                <>
                  <video
                    ref={previewVideoRef}
                    src={videoUrl}
                    className={styles.photoPreview}
                    playsInline
                    autoPlay
                    muted
                    onTimeUpdate={handlePreviewTimeUpdate}
                    onPlay={() => setIsPlayingPreview(true)}
                    onPause={() => setIsPlayingPreview(false)}
                    onClick={togglePreviewPlay}
                  />

                  {/* Custom Glassmorphism Video Scrubber Bar */}
                  <div className={styles.videoScrubDeck}>
                    <button
                      type="button"
                      className={styles.scrubPlayBtn}
                      onClick={togglePreviewPlay}
                      aria-label={isPlayingPreview ? 'Pause video preview' : 'Play video preview'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        {isPlayingPreview ? 'pause' : 'play_arrow'}
                      </span>
                    </button>

                    <div className={styles.scrubSliderWrap}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={previewProgress}
                        onChange={handlePreviewScrub}
                        onMouseDown={() => setIsPreviewScrubbing(true)}
                        onMouseUp={() => setIsPreviewScrubbing(false)}
                        onTouchStart={() => setIsPreviewScrubbing(true)}
                        onTouchEnd={() => setIsPreviewScrubbing(false)}
                        className={styles.scrubSlider}
                        aria-label="Seek video position"
                      />
                      <div
                        className={styles.scrubSliderFill}
                        style={{ width: `${previewProgress}%` }}
                      />
                    </div>

                    <span className={`font-mono tabular-nums ${styles.scrubTimeReadout}`}>
                      {formatVideoTime(previewCurrentTime)} / {formatVideoTime(videoDuration || 0)}
                    </span>
                  </div>

                  {uploadStatus && (
                    <div className={styles.statusBadge}>
                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                        check_circle
                      </span>
                      <span>{uploadStatus}</span>
                      {videoDuration !== null && (
                        <span className={styles.durationPill}>
                          {Math.round(videoDuration)}s / 30s
                        </span>
                      )}
                    </div>
                  )}

                  {/* Caption & Location Controls */}
                  <StoryCaptionDeck
                    caption={caption}
                    onCaptionChange={setCaption}
                    selectedLocation={selectedLocation}
                    onRemoveLocation={() => setSelectedLocation(null)}
                    onToggleLocationPicker={() => setShowLocationPicker((prev) => !prev)}
                  />
                </>
              ) : (
                <div
                  className={styles.emptyPlaceholder}
                  onClick={() => videoInputRef.current?.click()}
                >
                  <div className={styles.cameraIconWrap}>
                    <span
                      className={`material-symbols-outlined ${isUploading ? styles.spinning : ''}`}
                      style={{ fontSize: '36px' }}
                    >
                      {isUploading ? 'sync' : 'videocam'}
                    </span>
                  </div>
                  <h3 className={styles.placeholderPrompt}>
                    {isUploading ? 'Uploading Video...' : 'Record or Select Short Video Clip'}
                  </h3>
                  <p className={styles.placeholderSub}>
                    Share up to 30s field footage from turbine tests or station inspections
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.textStoryWrapper} style={{ background: selectedGradient }}>
              {selectedLocation && (
                <div className={styles.textLocationBadge}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                    location_on
                  </span>
                  <span>{selectedLocation}</span>
                  <button
                    type="button"
                    className={styles.removeLocBtn}
                    onClick={() => setSelectedLocation(null)}
                  >
                    ×
                  </button>
                </div>
              )}

              <textarea
                className={styles.textStoryInput}
                placeholder="Type your Sabah Electricity update for today..."
                value={textStory}
                onChange={(e) => setTextStory(e.target.value)}
                maxLength={200}
                rows={4}
                autoFocus
              />
            </div>
          )}
        </div>
        )}

        {/* Location Quick-Picker Sheet */}
        {!isLanding && showLocationPicker && (
          <div className={styles.locationSheet}>
            <div className={styles.locationHeader}>
              <span className={styles.locationTitle}>Tag SESB Facility</span>
              <button
                type="button"
                className={styles.locationClose}
                onClick={() => setShowLocationPicker(false)}
              >
                Done
              </button>
            </div>
            <div className={styles.locationPillsGrid}>
              {SESB_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  className={`${styles.locationChip} ${selectedLocation === loc ? styles.locationChipActive : ''}`}
                  onClick={() => {
                    setSelectedLocation(loc);
                    setShowLocationPicker(false);
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                    location_on
                  </span>
                  <span>{loc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Text Story Palette Picker & Location Tag Toggle for Text Mode */}
        {!isLanding && mode === 'text' && (
          <div className={styles.paletteBar}>
            <div className={styles.gradientCircles}>
              {SESB_GRADIENTS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`${styles.colorCircle} ${
                    selectedGradient === g.gradient ? styles.colorCircleActive : ''
                  }`}
                  style={{ background: g.gradient }}
                  onClick={() => setSelectedGradient(g.gradient)}
                  aria-label={g.name}
                  title={g.name}
                />
              ))}
            </div>

            <button
              type="button"
              className={`${styles.textLocBtn} ${selectedLocation ? styles.locationBtnActive : ''}`}
              onClick={() => setShowLocationPicker((prev) => !prev)}
              aria-label="Add location"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                location_on
              </span>
              <span>Location</span>
            </button>
          </div>
        )}

        {/* WhatsApp-Style Dark Studio Media Cropper Modal for Stories */}
        {isCropOpen && photoUrl && (
          <MediaCropModal
            imageSrc={photoUrl}
            imageFile={currentPhotoFile}
            title="Crop & Adjust"
            isFreeform={true}
            initialAspect="freeform"
            onConfirm={handleStoryCropConfirm}
            onCancel={() => setIsCropOpen(false)}
            onError={(msg) => setErrorMessage(msg)}
            isProcessing={isCropUploading}
          />
        )}
      </div>
    </div>
  );
};
