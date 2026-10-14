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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that photo.'));
    img.src = src;
  });
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

/**
 * Renders the selected crop region of `imageSrc` into a square canvas and
 * returns it as a File.
 *
 * `imageSrc` must be a URL that produced an HTMLImageElement (an object URL or
 * a same-origin URL) — not raw image bytes. The browser applies EXIF
 * orientation when decoding into an <img>, and a canvas drawImage of that
 * element inherits it. Cropping from createImageBitmap() instead would silently
 * rotate iPhone portrait shots by 90°.
 */
export async function cropImageToBlob(
  imageSrc: string,
  cropArea: Area,
  options: { size?: number; quality?: number } = {}
): Promise<File> {
  const { size = AVATAR_OUTPUT_SIZE, quality = 0.9 } = options;

  const image = await loadImage(imageSrc);

  // Clamp to the decoded bitmap so a stale crop rect can never read outside it.
  const sourceX = Math.max(0, Math.min(cropArea.x, image.naturalWidth - 1));
  const sourceY = Math.max(0, Math.min(cropArea.y, image.naturalHeight - 1));
  const sourceWidth = Math.max(1, Math.min(cropArea.width, image.naturalWidth - sourceX));
  const sourceHeight = Math.max(1, Math.min(cropArea.height, image.naturalHeight - sourceY));

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot process images right now.');

  // Photos downscale into a small square badly without high-quality smoothing.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, size, size);

  const mimeType = supportsWebpEncoding() ? 'image/webp' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType, quality)
  );
  if (!blob) throw new Error('Could not encode the cropped photo.');

  const extension = mimeType === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `avatar-${Date.now()}.${extension}`, {
    type: mimeType,
    lastModified: Date.now(),
  });
}
