import React, { useCallback, useEffect, useRef, useState } from 'react';
import Cropper, { type Area, type MediaSize } from 'react-easy-crop';
import { cropImageToBlob } from '@/utils/cropImage';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { FreeformBoxCropper } from './FreeformBoxCropper';
import styles from './MediaCropModal.module.css';

export type AspectRatioOption = 'freeform' | 'original' | '1:1' | '4:3' | '16:9' | '4:5' | '9:16';

interface AspectRatioPreset {
  id: AspectRatioOption;
  label: string;
  icon?: string;
  ratio?: number;
}

const PRESETS: AspectRatioPreset[] = [
  { id: 'freeform', label: 'Free', icon: 'crop_free' },
  { id: 'original', label: 'Original', icon: 'crop_original' },
  { id: '1:1', label: '1:1', icon: 'crop_square', ratio: 1 },
  { id: '4:3', label: '4:3', icon: 'crop_7_5', ratio: 4 / 3 },
  { id: '16:9', label: '16:9', icon: 'crop_16_9', ratio: 16 / 9 },
  { id: '4:5', label: '4:5', icon: 'crop_portrait', ratio: 4 / 5 },
  { id: '9:16', label: '9:16', icon: 'crop_portrait', ratio: 9 / 16 },
];

export interface MediaCropModalProps {
  imageFile?: File | null;
  imageSrc?: string | null;
  title?: string;
  stepIndicator?: string;
  initialAspect?: AspectRatioOption;
  allowedAspects?: AspectRatioOption[];
  isFreeform?: boolean;
  onSkip?: () => void;
  skipLabel?: string;
  confirmLabel?: string;
  onConfirm: (croppedFile: File) => void | Promise<void>;
  onCancel: () => void;
  onError?: (message: string) => void;
  isProcessing?: boolean;
}

const MAX_ZOOM_FACTOR = 4;

export const MediaCropModal: React.FC<MediaCropModalProps> = ({
  imageFile,
  imageSrc: initialImageSrc,
  title = 'Adjust Photo',
  stepIndicator,
  initialAspect = 'original',
  allowedAspects,
  isFreeform = false,
  onSkip,
  skipLabel = 'Skip (Keep Original)',
  confirmLabel = 'Done',
  onConfirm,
  onCancel,
  onError,
  isProcessing = false,
}) => {
  const isDirectSrc = Boolean(
    initialImageSrc &&
      (initialImageSrc.startsWith('data:') || initialImageSrc.startsWith('blob:'))
  );
  const [resolvedSrc, setResolvedSrc] = useState<string>(() => (isDirectSrc ? initialImageSrc! : ''));
  const [isLoadingMedia, setIsLoadingMedia] = useState<boolean>(() => !isDirectSrc);
  const [prevInitialSrc, setPrevInitialSrc] = useState(initialImageSrc);
  if (initialImageSrc !== prevInitialSrc) {
    setPrevInitialSrc(initialImageSrc);
    if (isDirectSrc) {
      setResolvedSrc(initialImageSrc!);
      setIsLoadingMedia(false);
    } else {
      setIsLoadingMedia(true);
    }
  }
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const minZoom = 1;
  const maxZoom = MAX_ZOOM_FACTOR;
  const [rotation, setRotation] = useState(0);
  const [selectedAspect, setSelectedAspect] = useState<AspectRatioOption>(initialAspect);
  const [mediaDimensions, setMediaDimensions] = useState<{ width: number; height: number } | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isCancelled = false;

    if (imageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        if (!isCancelled && typeof reader.result === 'string') {
          setResolvedSrc(reader.result);
          setIsLoadingMedia(false);
        }
      };
      reader.onerror = () => {
        if (!isCancelled) {
          setIsLoadingMedia(false);
          onError?.('Could not read image file. Please choose another.');
        }
      };
      reader.readAsDataURL(imageFile);
      return () => {
        isCancelled = true;
      };
    }

    if (initialImageSrc) {
      if (initialImageSrc.startsWith('data:') || initialImageSrc.startsWith('blob:')) {
        return;
      }

      let objectUrl: string | null = null;
      fetch(initialImageSrc, { mode: 'cors' })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.blob();
        })
        .then((blob) => {
          if (!isCancelled) {
            objectUrl = URL.createObjectURL(blob);
            setResolvedSrc(objectUrl);
            setIsLoadingMedia(false);
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setResolvedSrc(initialImageSrc);
            setIsLoadingMedia(false);
          }
        });

      return () => {
        isCancelled = true;
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      };
    }
  }, [imageFile, initialImageSrc, onError]);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEscapeKey(onCancel, !isProcessing);
  useBodyScrollLock(true);

  const handleMediaLoaded = useCallback((mediaSize: MediaSize) => {
    setMediaDimensions({ width: mediaSize.naturalWidth, height: mediaSize.naturalHeight });
    setIsLoadingMedia(false);
  }, []);

  const activeAspectNumber: number | undefined = (() => {
    if (isFreeform || selectedAspect === 'freeform') {
      return undefined;
    }
    if (selectedAspect === 'original') {
      if (mediaDimensions && mediaDimensions.height > 0) {
        return mediaDimensions.width / mediaDimensions.height;
      }
      return 1;
    }
    const match = PRESETS.find((p) => p.id === selectedAspect);
    return match?.ratio || 1;
  })();

  const handleRotate = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleRotateCW = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setRotation(0);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setSelectedAspect(initialAspect);
  };

  const handleConfirm = async () => {
    if (isProcessing || isLoadingMedia || !resolvedSrc || !croppedAreaPixels) return;

    try {
      const croppedFile = await cropImageToBlob(resolvedSrc, croppedAreaPixels, {
        rotation,
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.88,
        fileName: imageFile?.name,
      });
      await onConfirm(croppedFile);
    } catch (err) {
      console.error('[MediaCropModal] Crop failed:', err);
      onError?.(err instanceof Error ? err.message : 'Could not crop this image.');
    }
  };

  const visiblePresets = allowedAspects
    ? PRESETS.filter((p) => allowedAspects.includes(p.id))
    : PRESETS;

  const zoomPercent = Math.round((zoom / Math.max(minZoom, 0.0001)) * 100);

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-crop-title"
    >
      <div ref={containerRef} className={styles.studioContainer} tabIndex={-1}>
        {/* Header Bar */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={onCancel}
              disabled={isProcessing}
              aria-label="Cancel crop"
              title="Cancel"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }} aria-hidden="true">
                close
              </span>
            </button>

            <div className={styles.titleArea}>
              <h2 id="media-crop-title" className={styles.title}>
                {title}
              </h2>
              {stepIndicator && (
                <span className={styles.subtitle}>
                  Photo <span className={styles.tabularStep}>{stepIndicator}</span>
                </span>
              )}
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.actionIconBtn}
              onClick={handleRotate}
              disabled={isProcessing || isLoadingMedia}
              aria-label="Rotate 90 degrees counter-clockwise"
              title="Rotate 90° CCW"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }} aria-hidden="true">
                rotate_90_degrees_ccw
              </span>
            </button>

            <button
              type="button"
              className={styles.actionIconBtn}
              onClick={handleRotateCW}
              disabled={isProcessing || isLoadingMedia}
              aria-label="Rotate 90 degrees clockwise"
              title="Rotate 90° CW"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }} aria-hidden="true">
                rotate_90_degrees_cw
              </span>
            </button>

            <button
              type="button"
              className={styles.actionIconBtn}
              onClick={handleReset}
              disabled={isProcessing || isLoadingMedia}
              aria-label="Reset adjustments"
              title="Reset"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }} aria-hidden="true">
                restart_alt
              </span>
            </button>

            <button
              type="button"
              className={styles.doneBtn}
              onClick={handleConfirm}
              disabled={isProcessing || isLoadingMedia || !croppedAreaPixels}
              aria-busy={isProcessing}
            >
              {isProcessing ? (
                <span>Applying…</span>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }} aria-hidden="true">
                    check
                  </span>
                  <span>{confirmLabel}</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Center Stage: Interactive Freeform 8-Handle Cropper or Preset Cropper */}
        <main className={styles.stage}>
          {isLoadingMedia || !resolvedSrc ? (
            <div className={styles.stageLoader}>
              <span className={styles.stageSpinner} aria-hidden="true" />
              <span>Loading photo…</span>
            </div>
          ) : isFreeform ? (
            <FreeformBoxCropper
              imageSrc={resolvedSrc}
              rotation={rotation}
              onCropComplete={setCroppedAreaPixels}
              onMediaLoaded={handleMediaLoaded}
            />
          ) : (
            <Cropper
              image={resolvedSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={activeAspectNumber}
              showGrid
              cropShape="rect"
              objectFit="contain"
              minZoom={minZoom}
              maxZoom={maxZoom}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
              onMediaLoaded={handleMediaLoaded}
              mediaProps={{ alt: 'Editable photo stage', crossOrigin: 'anonymous' }}
            />
          )}
        </main>

        {/* Bottom Controls Deck */}
        <footer className={styles.controlsDeck}>
          {/* Zoom Slider Row (Only active in preset Cropper mode) */}
          {!isFreeform && (
            <div className={styles.zoomRow}>
              <span className={`material-symbols-outlined ${styles.zoomIcon}`} aria-hidden="true">
                zoom_out
              </span>
              <input
                type="range"
                className={styles.zoomSlider}
                min={minZoom}
                max={maxZoom}
                step={(maxZoom - minZoom) / 100 || 0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label="Zoom photo"
                aria-valuetext={`${zoomPercent}%`}
              />
              <span className={`material-symbols-outlined ${styles.zoomIcon}`} aria-hidden="true">
                zoom_in
              </span>
              <span className={styles.zoomValue}>{zoomPercent}%</span>
            </div>
          )}

          {/* Quick Rotate & Reset Toolbar in freeform mode */}
          {isFreeform && (
            <div className={styles.freeformToolsRow}>
              <button
                type="button"
                className={styles.freeformToolBtn}
                onClick={handleRotate}
                disabled={isProcessing || isLoadingMedia}
                title="Rotate 90° counter-clockwise"
                aria-label="Rotate counter-clockwise"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                  rotate_90_degrees_ccw
                </span>
              </button>

              <button
                type="button"
                className={styles.freeformToolBtn}
                onClick={handleRotateCW}
                disabled={isProcessing || isLoadingMedia}
                title="Rotate 90° clockwise"
                aria-label="Rotate clockwise"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                  rotate_90_degrees_cw
                </span>
              </button>

              <button
                type="button"
                className={styles.freeformResetBtn}
                onClick={handleReset}
                disabled={isProcessing || isLoadingMedia}
                title="Reset crop and adjustments"
              >
                Reset
              </button>
            </div>
          )}

          {/* Aspect Ratio Pill Bar */}
          {!isFreeform && visiblePresets.length > 1 && (
            <div className={styles.aspectBar} role="radiogroup" aria-label="Aspect Ratio Presets">
              {visiblePresets.map((preset) => {
                const isActive = selectedAspect === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`${styles.aspectPill} ${isActive ? styles.aspectPillActive : ''}`}
                    onClick={() => setSelectedAspect(preset.id)}
                    role="radio"
                    aria-checked={isActive}
                  >
                    {preset.icon && (
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }} aria-hidden="true">
                        {preset.icon}
                      </span>
                    )}
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Optional Sequential Queue Skip Button */}
          {onSkip && (
            <div className={styles.queueRow}>
              <button
                type="button"
                className={styles.skipBtn}
                onClick={onSkip}
                disabled={isProcessing}
              >
                <span>{skipLabel}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }} aria-hidden="true">
                  arrow_forward
                </span>
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};

export default MediaCropModal;
