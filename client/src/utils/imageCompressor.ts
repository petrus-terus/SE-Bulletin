/**
 * Client-Side Image Compressor Utility
 * 
 * Protects Supabase 1GB storage quota and eliminates browser localStorage QuotaExceededError.
 * Converts raw high-megapixel mobile captures (4-12 MB) into highly optimized WebP/JPEG files (~150-250 KB)
 * with aspect-ratio downscaling (max 1600px for bulletins, 512px for avatars, 1200px for covers).
 */

import { formatFileSize, formatCompactNumber } from './format';
export { formatFileSize, formatCompactNumber };

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.82)
  outputType?: 'image/webp' | 'image/jpeg';
}

export interface CompressionResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  originalSizeFormatted: string;
  compressedSizeFormatted: string;
  savedPercentage: number;
  width: number;
  height: number;
}

/**
 * Calculates new dimensions fitting within maxWidth and maxHeight while preserving aspect ratio.
 */
function calculateScaledDimensions(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = srcWidth;
  let height = srcHeight;

  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  return { width: Math.max(1, width), height: Math.max(1, height) };
}

/**
 * Checks if the browser natively supports exporting to image/webp in HTMLCanvasElement.
 */
function isWebpSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch {
    return false;
  }
}

/**
 * Compresses an image File or Blob on the client side using HTML5 Canvas.
 */
export async function compressImageFile(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    outputType = isWebpSupported() ? 'image/webp' : 'image/jpeg',
  } = options;

  const originalSize = file.size;

  // If not an image, return unchanged
  if (!file.type.startsWith('image/')) {
    const dataUrl = URL.createObjectURL(file);
    return {
      file,
      dataUrl,
      originalSize,
      compressedSize: originalSize,
      originalSizeFormatted: formatFileSize(originalSize),
      compressedSizeFormatted: formatFileSize(originalSize),
      savedPercentage: 0,
      width: 0,
      height: 0,
    };
  }

  return new Promise<CompressionResult>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file'));

    reader.onload = (event) => {
      const img = new Image();
      const rawDataUrl = event.target?.result as string;

      img.onerror = () => reject(new Error('Failed to load image into element'));

      img.onload = () => {
        try {
          const { width, height } = calculateScaledDimensions(
            img.naturalWidth || img.width,
            img.naturalHeight || img.height,
            maxWidth,
            maxHeight
          );

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Unable to acquire 2D canvas rendering context');
          }

          // Enable high quality bilinear/bicubic image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw scaled image
          ctx.drawImage(img, 0, 0, width, height);

          // Export compressed Blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                // Fallback to dataURL if toBlob returned null
                const fallbackDataUrl = canvas.toDataURL(outputType, quality);
                const compressedSize = Math.round((fallbackDataUrl.length * 3) / 4);
                const savedPercentage = Math.max(
                  0,
                  Math.round(((originalSize - compressedSize) / originalSize) * 100)
                );

                resolve({
                  file,
                  dataUrl: fallbackDataUrl,
                  originalSize,
                  compressedSize,
                  originalSizeFormatted: formatFileSize(originalSize),
                  compressedSizeFormatted: formatFileSize(compressedSize),
                  savedPercentage,
                  width,
                  height,
                });
                return;
              }

              const ext = outputType === 'image/webp' ? '.webp' : '.jpg';
              const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              const compressedFileName = `${baseName}-compressed${ext}`;

              const compressedFile = new File([blob], compressedFileName, {
                type: outputType,
                lastModified: Date.now(),
              });

              const compressedDataUrl = canvas.toDataURL(outputType, quality);
              const compressedSize = blob.size;
              const savedPercentage = Math.max(
                0,
                Math.round(((originalSize - compressedSize) / originalSize) * 100)
              );

              resolve({
                file: compressedFile,
                dataUrl: compressedDataUrl,
                originalSize,
                compressedSize,
                originalSizeFormatted: formatFileSize(originalSize),
                compressedSizeFormatted: formatFileSize(compressedSize),
                savedPercentage,
                width,
                height,
              });
            },
            outputType,
            quality
          );
        } catch (err) {
          reject(err);
        }
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an existing base64 DataURL (for avatars, covers, or existing strings)
 * and returns an optimized base64 DataURL.
 */
export async function compressDataUrl(
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 512,
    maxHeight = 512,
    quality = 0.82,
    outputType = isWebpSupported() ? 'image/webp' : 'image/jpeg',
  } = options;

  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(dataUrl); // fallback safely to input
    img.onload = () => {
      try {
        const { width, height } = calculateScaledDimensions(
          img.naturalWidth || img.width,
          img.naturalHeight || img.height,
          maxWidth,
          maxHeight
        );

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL(outputType, quality);
        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };
    img.src = dataUrl;
  });
}
