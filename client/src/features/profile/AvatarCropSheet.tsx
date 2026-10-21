import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Cropper, { type Area, type MediaSize } from 'react-easy-crop';
import { cropImageToBlob, validateAvatarDimensions } from '@/utils/cropImage';
import styles from './AvatarCropSheet.module.css';

interface Props {
  /** The already-validated file the user picked from the device picker. */
  imageFile: File;
  /** True while the cropped result is uploading; locks the confirm action. */
  isUploading: boolean;
  onCancel: () => void;
  onConfirm: (croppedFile: File) => void;
  /** Surface crop/encode failures without tearing the sheet down. */
  onError: (message: string) => void;
}

/** How far past the "fills the circle" zoom the user may push in. */
const MAX_ZOOM_FACTOR = 4;

/**
 * Square avatar cropper.
 *
 * Opens over the profile page after a photo is chosen but before anything is
 * uploaded, so the user always sees the final framing first. The crop area is
 * circular because the rendered avatar is circular — that shape is the fastest
 * way to say "this is what your colleagues will see".
 */
export const AvatarCropSheet: React.FC<Props> = ({
  imageFile,
  isUploading,
  onCancel,
  onConfirm,
  onError,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(MAX_ZOOM_FACTOR);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [dimensionError, setDimensionError] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState(0);

  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [prevImageFile, setPrevImageFile] = useState(imageFile);
  if (imageFile !== prevImageFile) {
    setPrevImageFile(imageFile);
    setIsLoadingMedia(true);
    setImageSrc('');
  }

  // Read the photo into memory as a Data URL via FileReader.
  // Using an in-memory Data URL prevents object-URL revocation bugs in
  // React 18/19 StrictMode and ensures reliable rendering across renders.
  useEffect(() => {
    let isCancelled = false;

    const reader = new FileReader();
    reader.onload = () => {
      if (!isCancelled && typeof reader.result === 'string') {
        setImageSrc(reader.result);
        setIsLoadingMedia(false);
      }
    };
    reader.onerror = () => {
      if (!isCancelled) {
        setIsLoadingMedia(false);
        onError('Could not read that photo. Please try a different image.');
      }
    };
    reader.readAsDataURL(imageFile);

    return () => {
      isCancelled = true;
    };
  }, [imageFile, onError]);

  // Measure the square stage so the initial zoom can be solved for "cover".
  useLayoutEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const measure = () => setStageSize(node.getBoundingClientRect().width);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Move focus into the dialog so keyboard and screen-reader users land inside.
  useEffect(() => {
    sheetRef.current?.focus();
  }, []);

  const handleMediaLoaded = useCallback(
    (mediaSize: MediaSize) => {
      setDimensionError(
        validateAvatarDimensions(mediaSize.naturalWidth, mediaSize.naturalHeight)
      );

      // mediaSize.width/height are the rendered dimensions at zoom 1. Solving
      // for the zoom that makes the short edge fill the square keeps the user
      // from ever dragging a gap into the circle.
      if (stageSize > 0 && mediaSize.width > 0 && mediaSize.height > 0) {
        const coverZoom = stageSize / Math.min(mediaSize.width, mediaSize.height);
        setMinZoom(coverZoom);
        setMaxZoom(coverZoom * MAX_ZOOM_FACTOR);
        setZoom(coverZoom);
      }
    },
    [stageSize]
  );

  const handleConfirm = useCallback(async () => {
    if (isUploading || isLoadingMedia || dimensionError || !imageSrc || !croppedAreaPixels) return;
    try {
      onConfirm(await cropImageToBlob(imageSrc, croppedAreaPixels));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not crop that photo.');
    }
  }, [croppedAreaPixels, dimensionError, imageSrc, isLoadingMedia, isUploading, onConfirm, onError]);

  const blocked = isUploading || isLoadingMedia || dimensionError !== null;
  const zoomPercent = Math.round((zoom / Math.max(minZoom, 0.0001)) * 100);

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-crop-title"
      onClick={onCancel}
    >
      <div
        ref={sheetRef}
        className={styles.sheet}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3 id="avatar-crop-title" className={styles.title}>
            Adjust your photo
          </h3>
          <p className={styles.subtitle}>
            Drag to reposition, then pinch or slide to zoom. Your colleagues see this in a
            circle.
          </p>
        </div>

        <div ref={stageRef} className={styles.stage}>
          {isLoadingMedia || !imageSrc ? (
            <div className={styles.stageLoader}>
              <span className={styles.stageSpinner} aria-hidden="true" />
              <span>Loading photo…</span>
            </div>
          ) : (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              objectFit="cover"
              restrictPosition
              minZoom={minZoom}
              maxZoom={maxZoom}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedAreaPixelsNext) =>
                setCroppedAreaPixels(croppedAreaPixelsNext)
              }
              onMediaLoaded={handleMediaLoaded}
              mediaProps={{ alt: 'Selected profile photo' }}
            />
          )}
        </div>

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
            aria-label="Zoom"
            aria-valuetext={`${zoomPercent}%`}
          />
          <span className={`material-symbols-outlined ${styles.zoomIcon}`} aria-hidden="true">
            zoom_in
          </span>
          <span className={styles.zoomValue}>{zoomPercent}%</span>
        </div>

        {/* Fixed-height slot: the layout never jumps when an error appears. */}
        <div className={styles.errorSlot} role={dimensionError ? 'alert' : undefined}>
          {dimensionError}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={blocked}
            aria-busy={isUploading}
          >
            {isUploading ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '16px' }}>
                  check
                </span>
                <span>Use photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarCropSheet;
