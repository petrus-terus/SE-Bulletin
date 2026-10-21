import type { Story } from '@/types/bulletin';
import { INITIAL_STORIES } from '../mockData';
import { isSupabaseConfigured, supabase } from '../supabaseClient';
import { mapRowToStory, parseStoryCaption } from '../rowMappers';
import { mediaService } from './mediaService';
import { broadcastLiveEvent } from '../realtimeBroadcast';
import { DEFAULT_COVER_URL, DEFAULT_AVATAR_URL } from '@/constants/bulletin';

interface DeletedStoryRecord {
  id: string;
  deletedAt: number;
}

const DELETED_STORIES_STORAGE_KEY = 'sesb_deleted_stories';
const STORY_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours

function getDeletedStoryIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_STORIES_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    const now = Date.now();
    const validRecords: DeletedStoryRecord[] = [];
    const validIds = new Set<string>();

    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (typeof item === 'string') {
          validIds.add(item);
          validRecords.push({ id: item, deletedAt: now });
        } else if (item && typeof item.id === 'string') {
          if (now - (item.deletedAt || 0) < STORY_EXPIRY_MS) {
            validIds.add(item.id);
            validRecords.push(item);
          }
        }
      }
      if (validRecords.length !== parsed.length) {
        localStorage.setItem(DELETED_STORIES_STORAGE_KEY, JSON.stringify(validRecords));
      }
    }
    return validIds;
  } catch {
    return new Set();
  }
}

function saveDeletedStoryId(storyId: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(DELETED_STORIES_STORAGE_KEY);
    const now = Date.now();
    let records: DeletedStoryRecord[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          records = parsed
            .map((item) => (typeof item === 'string' ? { id: item, deletedAt: now } : item))
            .filter((item) => item && typeof item.id === 'string' && now - (item.deletedAt || 0) < STORY_EXPIRY_MS);
        }
      } catch (parseErr) {
        console.warn('[storyService] Corrupted deleted stories in localStorage:', parseErr);
      }
    }
    if (!records.some((r) => r.id === storyId)) {
      records.push({ id: storyId, deletedAt: now });
    }
    localStorage.setItem(DELETED_STORIES_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('[storyService] Failed to record deleted story ID:', e);
  }
}

export class StoryService {
  /**
   * Fetch 24h stories
   */
  async getStories(): Promise<Story[]> {
    this.cleanupExpiredStories().catch(() => {});

    if (!isSupabaseConfigured || !supabase) {
      return INITIAL_STORIES;
    }

    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .gt('created_at', new Date(Date.now() - 864e5).toISOString())
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return INITIAL_STORIES;
      }

      const cloudStories: Story[] = data.map((row) =>
        mapRowToStory(row, { viewsCount: Math.floor(Math.random() * 25) + 12 })
      );

      const cloudIds = new Set(cloudStories.map((s) => s.id));
      const deletedIds = getDeletedStoryIds();
      return [...cloudStories, ...INITIAL_STORIES.filter((s) => !cloudIds.has(s.id))].filter(
        (s) => !deletedIds.has(s.id)
      );
    } catch (err) {
      console.warn('[storyService] Failed to load stories from cloud, using initial:', err);
      const deletedIds = getDeletedStoryIds();
      return INITIAL_STORIES.filter((s) => !deletedIds.has(s.id));
    }
  }

  /**
   * Persist a new 24h story to Supabase
   */
  async createStory(story: Story): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        let compositeCaption = '';
        if (story.locationName) {
          compositeCaption += `[📍 ${story.locationName}] `;
        }
        if (story.videoUrl && story.imageUrl && story.imageUrl !== DEFAULT_COVER_URL) {
          compositeCaption += `[🖼️ ${story.imageUrl}] `;
        }
        compositeCaption += (story.caption || '').trim();

        const targetMediaUrl = story.videoUrl || story.imageUrl;

        const { error } = await supabase.from('stories').insert([
          {
            id: story.id,
            department_id: story.departmentId,
            department_name: story.departmentName,
            author_name: story.authorName,
            author_avatar: story.authorAvatar || DEFAULT_AVATAR_URL,
            image_url: targetMediaUrl,
            caption: compositeCaption,
          },
        ]);
        if (error) {
          console.error('[storyService] createStory error:', error.message);
          throw error;
        }

        broadcastLiveEvent('story:created', { story });
      } catch (err) {
        console.error('[storyService] Failed to sync story to Supabase:', err);
        throw err;
      }
    }
  }

  /**
   * Delete an active 24h story from Supabase and reclaim physical storage
   */
  async deleteStory(storyId: string): Promise<void> {
    saveDeletedStoryId(storyId);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: storyRow } = await supabase
          .from('stories')
          .select('image_url, caption')
          .eq('id', storyId)
          .maybeSingle();

        const { error } = await supabase.from('stories').delete().eq('id', storyId);
        if (error) {
          console.error('[storyService] deleteStory error:', error.message);
        }

        if (storyRow) {
          const filesToPurge: (string | undefined | null)[] = [storyRow.image_url];
          const { videoThumbnail } = parseStoryCaption(storyRow.caption);
          if (videoThumbnail) {
            filesToPurge.push(videoThumbnail);
          }
          await mediaService.deleteStorageFiles(filesToPurge);
        }

        broadcastLiveEvent('story:deleted', { id: storyId });
      } catch (err) {
        console.error('[storyService] Failed to delete story from Supabase:', err);
      }
    }
  }

  /**
   * Sweeps stories older than 48 hours, physically deleting storage files
   */
  async cleanupExpiredStories(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      const STORAGE_SWEEP_KEY = 'sesb_last_storage_sweep';
      const lastSweep = Number(localStorage.getItem(STORAGE_SWEEP_KEY) || '0');
      const now = Date.now();
      const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

      if (now - lastSweep < SIX_HOURS_MS) {
        return;
      }

      localStorage.setItem(STORAGE_SWEEP_KEY, String(now));

      const cutoff = new Date(now - 48 * 60 * 60 * 1000).toISOString();
      const { data: expiredStories, error } = await supabase
        .from('stories')
        .select('id, image_url, caption')
        .lt('created_at', cutoff);

      if (error || !expiredStories || expiredStories.length === 0) {
        return;
      }

      const filesToPurge: (string | undefined | null)[] = [];
      const expiredIds: string[] = [];

      for (const row of expiredStories) {
        expiredIds.push(row.id);
        if (row.image_url) filesToPurge.push(row.image_url);
        const { videoThumbnail } = parseStoryCaption(row.caption);
        if (videoThumbnail) {
          filesToPurge.push(videoThumbnail);
        }
      }

      await mediaService.deleteStorageFiles(filesToPurge);
      await supabase.from('stories').delete().in('id', expiredIds);
    } catch (err) {
      console.warn('[storyService] Failed to sweep expired stories:', err);
    }
  }
}

export const storyService = new StoryService();
