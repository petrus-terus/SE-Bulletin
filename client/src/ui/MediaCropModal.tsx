import React, { useCallback, useEffect, useRef, useState } from 'react';
import Cropper, { type Area, type MediaSize } from 'react-easy-crop';
import { cropImageToBlob } from '@/utils/cropImage';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
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

type HandleType = 'tl' | 'tc' | 'tr' | 'cl' | 'cr' | 'bl' | 'bc' | 'br' | 'inside';

interface FreeformBoxCropperProps {
  imageSrc: string;
  rotation: number;
  onCropComplete: (cropAreaPixels: Area) => void;
  onMediaLoaded: (size: MediaSize) => void;
}

const FreeformBoxCropper: React.FC<FreeformBoxCropperProps> = ({
  imageSrc,
  rotation,
  onCropComplete,
  onMediaLoaded,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [displayedRect, setDisplayedRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  // Crop rectangle within the stage element (pixel coordinates)
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initialBox: { left: number; top: number; width: number; height: number } } | null>(null);

  // When image loads or stage resizes, compute stationary displayed bounds and initialize crop box to 100% of the image
  const measureImage = useCallback(() => {
    const stage = stageRef.current;
    const img = imgRef.current;
    if (!stage || !img || !img.naturalWidth || !img.naturalHeight) return;

    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    setNaturalSize({ width: natW, height: natH });
    onMediaLoaded({ width: natW, height: natH, naturalWidth: natW, naturalHeight: natH });

    const stageRect = stage.getBoundingClientRect();
    const stageW = stageRect.width;
    const stageH = stageRect.height;

    // Check rotated bounding dimensions
    const isSideways = rotation % 180 !== 0;
    const effNatW = isSideways ? natH : natW;
    const effNatH = isSideways ? natW : natH;

    // Fit image inside stage with padding
    const padding = 20;
    const availW = Math.max(stageW - padding * 2, 50);
    const availH = Math.max(stageH - padding * 2, 50);

    const scale = Math.min(availW / effNatW, availH / effNatH);
    const dispW = Math.round(effNatW * scale);
    const dispH = Math.round(effNatH * scale);
    const dispL = Math.round((stageW - dispW) / 2);
    const dispT = Math.round((stageH - dispH) / 2);

    const rect = { left: dispL, top: dispT, width: dispW, height: dispH };
    setDisplayedRect(rect);
    setBox(rect); // Starts by fitting the entire photo
  }, [rotation, onMediaLoaded]);

  useEffect(() => {
    measureImage();
    window.addEventListener('resize', measureImage);
    return () => window.removeEventListener('resize', measureImage);
  }, [measureImage]);

  // Translate stage pixel crop box into natural image coordinates (Area pixels)
  useEffect(() => {
    if (!box || !displayedRect || !naturalSize) return;

    const isSideways = rotation % 180 !== 0;
    const effNatW = isSideways ? naturalSize.height : naturalSize.width;
    const effNatH = isSideways ? naturalSize.width : naturalSize.height;

    const scale = effNatW / displayedRect.width;

    const rawX = (box.left - displayedRect.left) * scale;
    const rawY = (box.top - displayedRect.top) * scale;
    const rawW = box.width * scale;
    const rawH = box.height * scale;

    const clampedX = Math.max(0, Math.min(rawX, effNatW - 1));
    const clampedY = Math.max(0, Math.min(rawY, effNatH - 1));
    const clampedW = Math.max(1, Math.min(rawW, effNatW - clampedX));
    const clampedH = Math.max(1, Math.min(rawH, effNatH - clampedY));

    onCropComplete({
      x: Math.round(clampedX),
      y: Math.round(clampedY),
      width: Math.round(clampedW),
      height: Math.round(clampedH),
    });
  }, [box, displayedRect, naturalSize, rotation, onCropComplete]);

  // Pointer drag gestures for 8 handles + inside box panning
  const handlePointerDown = (handle: HandleType, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setActiveHandle(handle);
    if (box) {
      dragStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        initialBox: { ...box },
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeHandle || !dragStartRef.current || !displayedRect) return;

    const { clientX: startX, clientY: startY, initialBox: init } = dragStartRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const minSize = 40; // minimum crop box size in px
    let newL = init.left;
    let newT = init.top;
    let newW = init.width;
    let newH = init.height;

    const bounds = {
      minX: displayedRect.left,
      maxX: displayedRect.left + displayedRect.width,
      minY: displayedRect.top,
      maxY: displayedRect.top + displayedRect.height,
    };

    if (activeHandle === 'inside') {
      // Reposition box within image bounds
      newL = Math.max(bounds.minX, Math.min(init.left + dx, bounds.maxX - init.width));
      newT = Math.max(bounds.minY, Math.min(init.top + dy, bounds.maxY - init.height));
    } else {
      // Horizontal handle adjustments
      if (activeHandle === 'tl' || activeHandle === 'cl' || activeHandle === 'bl') {
        const proposedLeft = Math.max(bounds.minX, Math.min(init.left + dx, init.left + init.width - minSize));
        newW = init.left + init.width - proposedLeft;
        newL = proposedLeft;
      } else if (activeHandle === 'tr' || activeHandle === 'cr' || activeHandle === 'br') {
        const proposedRight = Math.min(bounds.maxX, Math.max(init.left + minSize, init.left + init.width + dx));
        newW = proposedRight - init.left;
      }

      // Vertical handle adjustments
      if (activeHandle === 'tl' || activeHandle === 'tc' || activeHandle === 'tr') {
        const proposedTop = Math.max(bounds.minY, Math.min(init.top + dy, init.top + init.height - minSize));
        newH = init.top + init.height - proposedTop;
        newT = proposedTop;
      } else if (activeHandle === 'bl' || activeHandle === 'bc' || activeHandle === 'br') {
        const proposedBottom = Math.min(bounds.maxY, Math.max(init.top + minSize, init.top + init.height + dy));
        newH = proposedBottom - init.top;
      }
    }

    setBox({ left: Math.round(newL), top: Math.round(newT), width: Math.round(newW), height: Math.round(newH) });
  };

  const handlePointerUp = () => {
    setActiveHandle(null);
    dragStartRef.current = null;
  };

  return (
    <div
      ref={stageRef}
      className={styles.freeformStage}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Stationary Image */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt=""
        className={styles.freeformStationaryImg}
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
        onLoad={measureImage}
      />

      {/* Shaded Surrounding Mask & Resizable Box with 8 Drag Knobs */}
      {displayedRect && box && (
        <>
          {/* Dimmed Surrounding Mask */}
          <div
            className={styles.freeformMask}
            style={{
              clipPath: `polygon(
                0% 0%, 100% 0%, 100% 100%, 0% 100%,
                0% ${box.top}px,
                ${box.left}px ${box.top}px,
                ${box.left}px ${box.top + box.height}px,
                ${box.left + box.width}px ${box.top + box.height}px,
                ${box.left + box.width}px ${box.top}px,
                0% ${box.top}px
              )`,
            }}
          />

          {/* Interactive Crop Rectangle */}
          <div
            className={`${styles.freeformBox} ${activeHandle ? styles.freeformBoxActive : ''}`}
            style={{
              transform: `translate3d(${box.left}px, ${box.top}px, 0)`,
              width: `${box.width}px`,
              height: `${box.height}px`,
            }}
            onPointerDown={(e) => handlePointerDown('inside', e)}
          >
            {/* 3x3 Rule of Thirds Grid Lines */}
            <div className={styles.gridLineV1} />
            <div className={styles.gridLineV2} />
            <div className={styles.gridLineH1} />
            <div className={styles.gridLineH2} />

            {/* 4 Corner Knobs */}
            <div
              className={`${styles.dragKnob} ${styles.knobTL}`}
              onPointerDown={(e) => handlePointerDown('tl', e)}
              title="Resize top-left"
            />
            <div
              className={`${styles.dragKnob} ${styles.knobTR}`}
              onPointerDown={(e) => handlePointerDown('tr', e)}
              title="Resize top-right"
            />
            <div
              className={`${styles.dragKnob} ${styles.knobBL}`}
              onPointerDown={(e) => handlePointerDown('bl', e)}
              title="Resize bottom-left"
            />
            <div
              className={`${styles.dragKnob} ${styles.knobBR}`}
              onPointerDown={(e) => handlePointerDown('br', e)}
              title="Resize bottom-right"
            />

            {/* 4 Edge Center Knobs */}
            <div
              className={`${styles.dragKnob} ${styles.knobTC}`}
              onPointerDown={(e) => handlePointerDown('tc', e)}
              title="Resize top"
            />
            <div
              className={`${styles.dragKnob} ${styles.knobBC}`}
              onPointerDown={(e) => handlePointerDown('bc', e)}
              title="Resize bottom"
            />
            <div
              className={`${styles.dragKnob} ${styles.knobCL}`}
              onPointerDown={(e) => handlePointerDown('cl', e)}
              title="Resize left"
            />
            <div
              className={`${styles.dragKnob} ${styles.knobCR}`}
              onPointerDown={(e) => handlePointerDown('cr', e)}
              title="Resize right"
            />
          </div>
        </>
      )}
    </div>
  );
};

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

  // Load imageFile as Data URL via FileReader, or convert remote imageSrc into a local Blob URL
  // so that the canvas never becomes tainted by cross-origin restrictions.
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

      // Remote image URL: fetch as local Blob to guarantee 100% same-origin canvas export
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

  // Focus trap on mount
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  useEscapeKey(onCancel, !isProcessing);
  useBodyScrollLock(true);

  const handleMediaLoaded = useCallback((mediaSize: MediaSize) => {
    setMediaDimensions({ width: mediaSize.naturalWidth, height: mediaSize.naturalHeight });
    setIsLoadingMedia(false);
  }, []);

  // Calculate numeric aspect ratio (undefined = unconstrained freeform crop box with handles)
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

  // Render either the Interactive 8-Handle Freeform Cropper (for stories / freeform)
  // or the standard react-easy-crop cropper (for fixed aspect ratios / bulletins)
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
          {/* Zoom Slider Row */}
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

          {/* Quick Rotate & Reset Toolbar matching reference in freeform mode */}
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

          {/* Aspect Ratio Pill Bar (Hidden in strictly freeform mode to keep UI clean and uncluttered) */}
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
