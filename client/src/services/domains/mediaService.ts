import { isSupabaseConfigured, supabase } from '../supabaseClient';
import { compressImageFile } from '@/utils/imageCompressor';

export class MediaService {
  /**
   * Safely extracts storage object path from a public Supabase Storage URL
   * e.g. ".../bulletin-media/17234-video.mp4" -> "17234-video.mp4"
   */
  extractStoragePath(url?: string | null): string | null {
    if (!url || typeof url !== 'string' || !url.includes('/bulletin-media/')) return null;
    const path = url.split('/bulletin-media/').pop()?.split('?')[0];
    return path ? decodeURIComponent(path) : null;
  }

  /**
   * Physically removes an array of files from the `bulletin-media` storage bucket
   */
  async deleteStorageFiles(fileUrls: (string | undefined | null)[]): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    const paths = fileUrls
      .map((url) => this.extractStoragePath(url))
      .filter((p): p is string => Boolean(p));

    if (paths.length === 0) return;

    try {
      const { error } = await supabase.storage.from('bulletin-media').remove(paths);
      if (error) {
        console.warn('[MediaService] Storage cleanup warning:', error.message);
      }
    } catch (err) {
      console.warn('[MediaService] Failed to purge storage files:', err);
    }
  }

  /**
   * Upload media photo to Supabase storage with automatic client-side compression
   */
  async uploadPhoto(
    file: File,
    options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
  ): Promise<string> {
    const { maxWidth = 1600, maxHeight = 1600, quality = 0.82 } = options;
    let uploadTarget = file;

    // Automatically optimize smartphone captures to ~150-250KB WebP
    try {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImageFile(file, {
          maxWidth,
          maxHeight,
          quality,
        });
        uploadTarget = compressed.file;
      }
    } catch (compressionErr) {
      console.warn('[MediaService] Image auto-compression fallback to raw file:', compressionErr);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const originalExt = uploadTarget.name.includes('.')
          ? `.${uploadTarget.name.split('.').pop()?.toLowerCase()}`
          : '.jpg';
        const ext = uploadTarget.name.endsWith('.webp') ? '.webp' : originalExt;
        const cleanName = uploadTarget.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}-${cleanName.endsWith(ext) ? cleanName : `${cleanName}${ext}`}`;
        const { error } = await supabase.storage.from('bulletin-media').upload(fileName, uploadTarget, {
          cacheControl: '3600',
          upsert: false,
        });

        if (error) {
          console.error('[MediaService] Storage upload failed:', error.message);
          throw new Error(`Upload failed: ${error.message}`);
        }

        const { data } = supabase.storage.from('bulletin-media').getPublicUrl(fileName);
        if (data?.publicUrl) return data.publicUrl;
      } catch (err) {
        console.error('[MediaService] Storage upload failed:', err);
        throw err;
      }
    } else {
      throw new Error('Supabase is not configured. Cannot upload media.');
    }

    throw new Error('Failed to retrieve public URL after upload.');
  }
}

export const mediaService = new MediaService();
