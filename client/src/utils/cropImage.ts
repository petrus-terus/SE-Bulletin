import type { Area } from 'react-easy-crop';

/**
 * Avatar crop utilities.
 *
 * The avatar path is deliberately separate from the bulletin media path: a
 * profile picture is always square, always small, and always re-rendered at
 * many sizes in the feed — so it is cropped to an exact square once, here,
 * instead of shipping a full-resolution photo and letting every consumer
 * resize it.
 */

/** Final square edge length stored for every profile picture (CSS px). */
export const AVATAR_OUTPUT_SIZE = 512;

/** Rejects multi-megabyte camera rolls before we spend a second decoding them. */
export const AVATAR_MAX_BYTES = 10 * 1024 * 1024;

/** Below this, the picture is unusable at the 40px feed avatar size. */
export const AVATAR_MIN_EDGE = 128;

export const ACCEPTED_AVATAR_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

let webpEncodingSupported: boolean | null = null;

/** Mirrors the probe in imageCompressor.ts so both agree on the output format. */
function supportsWebpEncoding(): boolean {
  if (webpEncodingSupported !== null) return webpEncodingSupported;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    webpEncodingSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    webpEncodingSupported = false;
  }
  return webpEncodingSupported;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  // 1. Data URLs and Blob URLs are already in-memory local data; cannot taint the canvas
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not read that photo.'));
      img.src = src;
    });
  }

  // 2. For remote URLs (Supabase Storage, CDN, external links), fetch as Blob first.
  // Converting to a local object URL guarantees the canvas is same-origin and never tainted.
  try {
    const res = await fetch(src, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not read that photo.'));
      };
      img.src = objectUrl;
    });
  } catch {
    // 3. Fallback: try direct Image element with crossOrigin = 'anonymous' and cache-buster
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error('Could not read that photo due to cross-origin security restrictions.'));
      const sep = src.includes('?') ? '&' : '?';
      img.src = `${src}${sep}_cors=${Date.now()}`;
    });
  }
}

/**
 * Cheap structural validation that does not need the image decoded.
 * Returns a user-facing message, or null when the file is acceptable.
 */
export function validateAvatarFile(file: File): string | null {
  const type = (file.type || '').toLowerCase();
  if (!(ACCEPTED_AVATAR_TYPES as readonly string[]).includes(type)) {
    return 'We only support JPG, PNG, WebP, or GIF photos.';
  }
  if (file.size === 0) return 'This file is empty.';
  if (file.size > AVATAR_MAX_BYTES) return 'Please choose a photo smaller than 10 MB.';
  return null;
}

/**
 * Dimension validation, which can only run once the image is decoded.
 * Returns a user-facing message, or null when the photo is large enough.
 */
export function validateAvatarDimensions(width: number, height: number): string | null {
  if (width < AVATAR_MIN_EDGE || height < AVATAR_MIN_EDGE) {
    return `Please choose a photo at least ${AVATAR_MIN_EDGE} × ${AVATAR_MIN_EDGE} px.`;
  }
  return null;
}

export interface CropImageOptions {
  size?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  rotation?: number;
  fileName?: string;
}

export const MEDIA_MAX_BYTES = 25 * 1024 * 1024;

/** Validates arbitrary bulletin and story media files before processing. */
export function validateMediaFile(file: File): string | null {
  const type = (file.type || '').toLowerCase();
  if (!(ACCEPTED_AVATAR_TYPES as readonly string[]).includes(type)) {
    return 'We only support JPG, PNG, WebP, or GIF photos.';
  }
  if (file.size === 0) return 'This file is empty.';
  if (file.size > MEDIA_MAX_BYTES) return 'Please choose a photo smaller than 25 MB.';
  return null;
}

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Renders the selected crop region of `imageSrc` into a canvas and returns it as a File.
 *
 * Supports arbitrary aspect ratios, 90-degree rotations, and high-definition output
 * downscaled to fit within maxWidth/maxHeight. Preserves EXIF orientation safely.
 */
export async function cropImageToBlob(
  imageSrc: string,
  cropArea: Area,
  options: CropImageOptions = {}
): Promise<File> {
  const {
    size,
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.88,
    rotation = 0,
    fileName,
  } = options;

  const image = await loadImage(imageSrc);

  let sourceCanvas: HTMLCanvasElement | HTMLImageElement = image;
  let sourceNaturalWidth = image.naturalWidth;
  let sourceNaturalHeight = image.naturalHeight;

  // Handle rotation via off-screen rotated canvas
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  if (normalizedRotation !== 0) {
    const rotRad = getRadianAngle(normalizedRotation);
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.naturalWidth,
      image.naturalHeight,
      normalizedRotation
    );

    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = Math.round(bBoxWidth);
    rotCanvas.height = Math.round(bBoxHeight);
    const rotCtx = rotCanvas.getContext('2d');
    if (!rotCtx) throw new Error('This browser cannot process rotated images right now.');

    rotCtx.translate(bBoxWidth / 2, bBoxHeight / 2);
    rotCtx.rotate(rotRad);
    rotCtx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

    sourceCanvas = rotCanvas;
    sourceNaturalWidth = rotCanvas.width;
    sourceNaturalHeight = rotCanvas.height;
  }

  // Clamp to the decoded bitmap so a stale crop rect can never read outside it.
  const sourceX = Math.max(0, Math.min(cropArea.x, sourceNaturalWidth - 1));
  const sourceY = Math.max(0, Math.min(cropArea.y, sourceNaturalHeight - 1));
  const sourceWidth = Math.max(1, Math.min(cropArea.width, sourceNaturalWidth - sourceX));
  const sourceHeight = Math.max(1, Math.min(cropArea.height, sourceNaturalHeight - sourceY));

  // Determine destination canvas dimensions
  let destWidth: number;
  let destHeight: number;

  if (typeof size === 'number' && size > 0) {
    destWidth = size;
    destHeight = size;
  } else {
    // Preserve cropped area's aspect ratio while capping within maxWidth / maxHeight
    const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight, 1);
    destWidth = Math.max(1, Math.round(sourceWidth * scale));
    destHeight = Math.max(1, Math.round(sourceHeight * scale));
  }

  const canvas = document.createElement('canvas');
  canvas.width = destWidth;
  canvas.height = destHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot process images right now.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, destWidth, destHeight);

  // Free memory if a rotated canvas was allocated
  if (sourceCanvas instanceof HTMLCanvasElement) {
    sourceCanvas.width = 0;
    sourceCanvas.height = 0;
  }

  const mimeType = supportsWebpEncoding() ? 'image/webp' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType, quality)
  );
  if (!blob) throw new Error('Could not encode the cropped photo.');

  const extension = mimeType === 'image/webp' ? 'webp' : 'jpg';
  const defaultName = `media-${Date.now()}.${extension}`;
  return new File([blob], fileName || defaultName, {
    type: mimeType,
    lastModified: Date.now(),
  });
}

