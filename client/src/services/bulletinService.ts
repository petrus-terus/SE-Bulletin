import type { CreatePostPayload, Employee, Post, Story } from '@/types/bulletin';
import { ALL_EMPLOYEES, INITIAL_POSTS, INITIAL_STORIES, getRegisteredEmployees } from './mockData';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { compressImageFile } from '@/utils/imageCompressor';
import {
  mapRowToPost,
  mapRowToStory,
  mapRowToComment,
  getAvatarInitials,
} from './rowMappers';

const VIEWED_POSTS_STORAGE_KEY = 'sesb_viewed_bulletin_ids';

function getViewedPostIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(VIEWED_POSTS_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function markPostIdAsViewed(postId: string) {
  try {
    const ids = getViewedPostIds();
    ids.add(postId);
    sessionStorage.setItem(VIEWED_POSTS_STORAGE_KEY, JSON.stringify([...ids]));
  } catch (e) {
    console.warn('[BulletinService] Failed to record viewed post ID:', e);
  }
}

interface DeletedStoryRecord {
  id: string;
  deletedAt: number;
}

const DELETED_STORIES_STORAGE_KEY = 'sesb_deleted_stories';
const STORY_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours

function getDeletedStoryIds(): Set<string> {
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
        console.warn('[BulletinService] Corrupted deleted stories in localStorage:', parseErr);
      }
    }
    if (!records.some((r) => r.id === storyId)) {
      records.push({ id: storyId, deletedAt: now });
    }
    localStorage.setItem(DELETED_STORIES_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('[BulletinService] Failed to record deleted story ID:', e);
  }
}



/**
 * Universal Bulletin Service Layer (Repository Pattern)
 * 
 * Protects frontend components from tight coupling with Supabase or any specific backend.
 * When SE approves the project for internal deployment, this service can easily be
 * redirected to ASP.NET Core 8 Web API + SQL Server without changing React UI code.
 */
class BulletinService {
  /**
   * Fetch all bulletins/posts
   */
  async getPosts(cursor?: string, limit: number = 20): Promise<Post[]> {
    if (!isSupabaseConfigured || !supabase) {
      return import.meta.env.DEV ? INITIAL_POSTS : [];
    }

    try {
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (cursor) {
        query = query.lt('created_at', cursor);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const cloudPosts: Post[] = data.map((row) => mapRowToPost(row));

      // Build a lookup map of all available posts to resolve quote_post_id
      const postLookup = new Map<string, Post>();
      if (import.meta.env.DEV) {
        INITIAL_POSTS.forEach((p) => postLookup.set(p.id, p));
      }
      cloudPosts.forEach((p) => postLookup.set(p.id, p));

      // Resolve quoted posts if quote_post_id was persisted
      const resolvedCloudPosts = cloudPosts.map((p, idx) => {
        const rawRow = data[idx];
        const quoteId = rawRow?.quote_post_id;
        if (quoteId && !p.quotedPost && postLookup.has(quoteId)) {
          return { ...p, quotedPost: postLookup.get(quoteId) };
        }
        return p;
      });

      const combinedWithEdits = import.meta.env.DEV
        ? [...resolvedCloudPosts, ...INITIAL_POSTS.filter((p) => !postLookup.has(p.id))]
        : resolvedCloudPosts;

      // Ensure pinned bulletins stay at the very top of the feed
      const sorted = combinedWithEdits.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
      return sorted;
    } catch (err) {
      console.error('[BulletinService] Failed to load posts from Supabase:', err);
      throw err;
    }
  }

  /**
   * Publish a new bulletin or status
   */
  async createPost(payload: CreatePostPayload, currentUser: Employee): Promise<Post> {
    const newPost: Post = {
      id: `post-${Date.now()}`,
      title: payload.title,
      content: payload.content,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        designation: currentUser.designation,
        department: payload.department || currentUser.department,
        avatarUrl: currentUser.avatarUrl,
        isVerified: currentUser.isVerified ?? true,
      },
      timestamp: 'Just now',
      location: 'Wisma SE HQ',
      imageUrl: payload.mediaUrls?.[0] || payload.imageUrl || null,
      mediaUrls: payload.mediaUrls,
      isPinned: Boolean(payload.isPinned),
      commentsEnabled: true,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      isLiked: false,
      isBookmarked: false,
      departmentId: payload.departmentId || 'dept-ops',
      departmentName: payload.department || currentUser.department,
      departmentColor: '#0055A4',
      officialNotice: Boolean(payload.officialNotice),
      poll: payload.poll,
      pdfUrl: payload.pdfUrl,
      pdfName: payload.pdfName,
      pdfSize: payload.pdfSize,
      quotedPost: payload.quotedPost,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('posts').insert([
          {
            id: newPost.id,
            title: newPost.title,
            content: newPost.content,
            author_id: (await supabase.auth.getUser()).data.user?.id || null,
            author_name: currentUser.name,
            author_role: currentUser.designation,
            author_avatar: currentUser.avatarUrl,
            department: newPost.departmentName,
            department_id: newPost.departmentId,
            department_color: newPost.departmentColor,
            location: newPost.location,
            image_url: newPost.imageUrl,
            media_urls: newPost.mediaUrls || [],
            is_pinned: newPost.isPinned,
            official_notice: newPost.officialNotice,
            comments_enabled: newPost.commentsEnabled,
            likes_count: 0,
            comments_count: 0,
            poll_data: newPost.poll || null,
            pdf_url: newPost.pdfUrl || null,
            pdf_name: newPost.pdfName || null,
            pdf_size: newPost.pdfSize || null,
            quote_post_id: newPost.quotedPost ? newPost.quotedPost.id : null,
          },
        ]).select().single();

        if (error) {
          console.error('[BulletinService] Supabase createPost insert error:', error.message);
          throw error;
        }

        if (data) {
          newPost.id = data.id;
          newPost.timestamp = new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } catch (err) {
        console.error('[BulletinService] Failed to sync post to Supabase:', err);
        throw err;
      }
    }

    return newPost;
  }

  /**
   * Fetch 24h stories
   */
  async getStories(): Promise<Story[]> {
    // Background garbage collection for 48h expired stories & media
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
      console.warn('[BulletinService] Failed to load stories from cloud, using initial:', err);
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
        // Embed location & video thumbnail metadata into caption prefix if provided
        let compositeCaption = '';
        if (story.locationName) {
          compositeCaption += `[📍 ${story.locationName}] `;
        }
        if (story.videoUrl && story.imageUrl && story.imageUrl !== '/grid_horizon_hero.jpg') {
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
            author_avatar: story.authorAvatar || '/sabah_electricity_logo.png',
            image_url: targetMediaUrl,
            caption: compositeCaption,
          },
        ]);
        if (error) {
          console.error('[BulletinService] createStory error:', error.message);
          throw error;
        }

        // Broadcast instant creation event across all connected clients
        const existingChannel = supabase.getChannels().find((c) => c.topic === 'realtime:bulletin-live');
        const channel = existingChannel || supabase.channel('realtime:bulletin-live');
        if (!existingChannel) {
          channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              channel.send({
                type: 'broadcast',
                event: 'story:created',
                payload: { story },
              }).catch(() => {});
            }
          });
        } else {
          channel.send({
            type: 'broadcast',
            event: 'story:created',
            payload: { story },
          }).catch(() => {});
        }
      } catch (err) {
        console.error('[BulletinService] Failed to sync story to Supabase:', err);
        throw err;
      }
    }
  }

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
        console.warn('[BulletinService] Storage cleanup warning:', error.message);
      }
    } catch (err) {
      console.warn('[BulletinService] Failed to purge storage files:', err);
    }
  }

  /**
   * Sweeps stories older than 48 hours, physically deleting their storage files
   * from the `bulletin-media` bucket and removing expired database rows.
   * Throttled to run at most once every 6 hours per client.
   */
  async cleanupExpiredStories(): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      const STORAGE_SWEEP_KEY = 'sesb_last_storage_sweep';
      const lastSweep = Number(localStorage.getItem(STORAGE_SWEEP_KEY) || '0');
      const now = Date.now();
      const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

      // Throttle sweeps
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

      // Collect all storage files from expired stories
      const filesToPurge: (string | undefined | null)[] = [];
      const expiredIds: string[] = [];

      for (const row of expiredStories) {
        expiredIds.push(row.id);
        if (row.image_url) filesToPurge.push(row.image_url);
        const thumbMatch = (row.caption || '').match(/\[🖼️\s*([^\]]+)\]/);
        if (thumbMatch) {
          filesToPurge.push(thumbMatch[1].trim());
        }
      }

      // 1. Physically delete storage files from bucket
      await this.deleteStorageFiles(filesToPurge);

      // 2. Drop expired rows from PostgreSQL
      await supabase.from('stories').delete().in('id', expiredIds);
      console.info(`[BulletinService] Garbage-collected ${expiredStories.length} expired stories and their media.`);
    } catch (err) {
      console.warn('[BulletinService] Failed to sweep expired stories:', err);
    }
  }

  /**
   * Delete an active 24h story from Supabase and reclaim physical storage
   */
  async deleteStory(storyId: string): Promise<void> {
    // Record deletion in local storage so it never resurfaces on this device
    saveDeletedStoryId(storyId);

    if (isSupabaseConfigured && supabase) {
      try {
        // Fetch story media URLs before row deletion so we can purge physical files
        const { data: storyRow } = await supabase
          .from('stories')
          .select('image_url, caption')
          .eq('id', storyId)
          .maybeSingle();

        const { error } = await supabase.from('stories').delete().eq('id', storyId);
        if (error) {
          console.error('[BulletinService] deleteStory error:', error.message);
        }

        // Purge physical media file and video thumbnail from storage bucket
        if (storyRow) {
          const filesToPurge: (string | undefined | null)[] = [storyRow.image_url];
          const thumbMatch = (storyRow.caption || '').match(/\[🖼️\s*([^\]]+)\]/);
          if (thumbMatch) {
            filesToPurge.push(thumbMatch[1].trim());
          }
          await this.deleteStorageFiles(filesToPurge);
        }

        // Broadcast instantaneous deletion event to all connected clients
        const existingChannel = supabase.getChannels().find((c) => c.topic === 'realtime:bulletin-live');
        const channel = existingChannel || supabase.channel('realtime:bulletin-live');
        if (!existingChannel) {
          channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              channel.send({
                type: 'broadcast',
                event: 'story:deleted',
                payload: { id: storyId },
              }).catch(() => {});
            }
          });
        } else {
          channel.send({
            type: 'broadcast',
            event: 'story:deleted',
            payload: { id: storyId },
          }).catch(() => {});
        }
      } catch (err) {
        console.error('[BulletinService] Failed to delete story from Supabase:', err);
      }
    }
  }

  /**
   * Upload media photo to Supabase storage with automatic client-side compression
   * and fallback to DataURL.
   *
   * `options` lets a caller ship a pre-sized image (the avatar cropper passes
   * 512×512). Defaults are unchanged, so bulletin and story uploads keep their
   * existing 1600px / 0.82 behaviour.
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
      console.warn('[BulletinService] Image auto-compression fallback to raw file:', compressionErr);
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
          console.error('[BulletinService] Storage upload failed:', error.message);
          throw new Error(`Upload failed: ${error.message}`);
        }

        const { data } = supabase.storage.from('bulletin-media').getPublicUrl(fileName);
        if (data?.publicUrl) return data.publicUrl;
      } catch (err) {
        console.error('[BulletinService] Storage upload failed:', err);
        throw err;
      }
    } else {
      throw new Error('Supabase is not configured. Cannot upload media.');
    }
    
    throw new Error('Failed to retrieve public URL after upload.');
  }

  /**
   * Fetch comments for a specific post
   */
  async getComments(postId: string): Promise<import('../types/bulletin').Comment[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error || !data) {
        return [];
      }

      return data.map((row) => mapRowToComment(row));
    } catch (err) {
      console.warn('[BulletinService] getComments error:', err);
      return [];
    }
  }

  /**
   * Add a new comment to Supabase and update post comment count
   */
  async addComment(
    postId: string,
    commentText: string,
    currentUser: Employee,
    currentCommentsCount: number
  ): Promise<import('../types/bulletin').Comment> {
    const newComment: import('../types/bulletin').Comment = {
      id: `c-${Date.now()}`,
      authorName: currentUser.name,
      department: currentUser.department || 'Operations',
      avatarInitials: getAvatarInitials(currentUser.name),
      avatarUrl: currentUser.avatarUrl,
      text: commentText,
      timestamp: 'Just now',
      likesCount: 0,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const commentPayload: Record<string, any> = {
          id: newComment.id,
          post_id: postId,
          author_name: newComment.authorName,
          author_avatar: newComment.avatarUrl || null,
          avatar_initials: newComment.avatarInitials || 'SE',
          department: newComment.department,
          text: newComment.text,
        };

        const { data, error } = await supabase.from('comments').insert([commentPayload]).select().single();

        if (error) {
          console.error('[BulletinService] Supabase addComment error:', error.message);
          throw error;
        }
        
        if (data) {
          newComment.id = data.id;
          newComment.timestamp = new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // Increment comment count on the post
        await supabase
          .from('posts')
          .update({ comments_count: currentCommentsCount + 1 })
          .eq('id', postId);
      } catch (err) {
        console.error('[BulletinService] addComment sync error:', err);
        throw err;
      }
    }

    return newComment;
  }

  /**
   * Update post like count in Supabase
   */
  async toggleLike(postId: string, isLiked: boolean): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        if (isLiked) {
          await supabase.from('post_likes').upsert({ post_id: postId, user_id: user.id });
        } else {
          await supabase.from('post_likes').delete().match({ post_id: postId, user_id: user.id });
        }
      } catch (err) {
        console.warn('[BulletinService] toggleLike sync error:', err);
      }
    }
  }

  /**
   * Delete a post by ID (and cascade delete its comments & physical media files)
   */
  async deletePost(postId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Fetch post media files before deletion so we can purge physical files
        const { data: postRow } = await supabase
          .from('posts')
          .select('image_url, media_urls, pdf_url')
          .eq('id', postId)
          .maybeSingle();

        const { error } = await supabase.from('posts').delete().eq('id', postId);
        if (error) {
          console.error('[BulletinService] deletePost error:', error.message);
          throw error;
        }

        // Purge physical media files from bulletin-media storage bucket
        if (postRow) {
          const filesToPurge: (string | undefined | null)[] = [postRow.image_url, postRow.pdf_url];
          if (Array.isArray(postRow.media_urls)) {
            filesToPurge.push(...postRow.media_urls);
          }
          await this.deleteStorageFiles(filesToPurge);
        }

        return true;
      } catch (err) {
        console.error('[BulletinService] deletePost sync error:', err);
        throw err;
      }
    }
    return true;
  }

  /**
   * Update an existing post by ID
   */
  async updatePost(postId: string, updates: Partial<Post>): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const updatePayload: Record<string, any> = {};
        if (updates.title !== undefined) updatePayload.title = updates.title;
        if (updates.content !== undefined) updatePayload.content = updates.content;
        if (updates.location !== undefined) updatePayload.location = updates.location;
        if (updates.isPinned !== undefined) updatePayload.is_pinned = updates.isPinned;
        if (updates.commentsEnabled !== undefined) updatePayload.comments_enabled = updates.commentsEnabled;
        if (updates.mediaUrls !== undefined) {
          updatePayload.media_urls = updates.mediaUrls;
          updatePayload.image_url = updates.mediaUrls[0] || null;
        } else if (updates.imageUrl !== undefined) {
          updatePayload.image_url = updates.imageUrl;
        }
        if (updates.departmentId !== undefined) updatePayload.department_id = updates.departmentId;
        if (updates.departmentName !== undefined) updatePayload.department = updates.departmentName;
        if (updates.departmentColor !== undefined) updatePayload.department_color = updates.departmentColor;
        if (updates.officialNotice !== undefined) updatePayload.official_notice = updates.officialNotice;
        if (updates.isEdited !== undefined) updatePayload.is_edited = updates.isEdited;
        if (updates.editedAt !== undefined) updatePayload.edited_at = updates.editedAt;
        if (updates.poll !== undefined) updatePayload.poll_data = updates.poll;
        if (updates.reactions !== undefined) updatePayload.reactions_breakdown = updates.reactions;
        if (updates.likesCount !== undefined) updatePayload.likes_count = updates.likesCount;
        if (updates.resharesCount !== undefined) updatePayload.reshares_count = updates.resharesCount;
        if (updates.pdfUrl !== undefined) updatePayload.pdf_url = updates.pdfUrl;
        if (updates.pdfName !== undefined) updatePayload.pdf_name = updates.pdfName;
        if (updates.pdfSize !== undefined) updatePayload.pdf_size = updates.pdfSize;

        const { error } = await supabase
          .from('posts')
          .update(updatePayload)
          .eq('id', postId);

        if (error) {
          console.error('[BulletinService] updatePost error:', error.message);
          throw error;
        }
        return true;
      } catch (err) {
        console.error('[BulletinService] updatePost sync error:', err);
        throw err;
      }
    }
    return true;
  }

  /**
   * Check if a bulletin has already been viewed during the current user session
   */
  isPostViewedInSession(postId: string): boolean {
    return getViewedPostIds().has(postId);
  }

  /**
   * Record a bulletin view with session deduplication and Supabase sync
   */
  async recordPostView(postId: string): Promise<boolean> {
    if (this.isPostViewedInSession(postId)) {
      return false; // Already recorded in this session
    }
    markPostIdAsViewed(postId);

    if (isSupabaseConfigured && supabase) {
      try {
        // Try RPC first for atomic increment if configured
        const { error: rpcErr } = await supabase.rpc('increment_post_views', {
          post_id_input: postId,
        });

        if (rpcErr) {
          // Fallback to fetch & update
          const { data: currentPost } = await supabase
            .from('posts')
            .select('views_count')
            .eq('id', postId)
            .maybeSingle();

          if (currentPost) {
            await supabase
              .from('posts')
              .update({ views_count: Number(currentPost.views_count || 0) + 1 })
              .eq('id', postId);
          }
        }
      } catch (err) {
        console.warn('[BulletinService] recordPostView sync error:', err);
      }
    }

    return true;
  }

  /**
   * Fetch a single profile by ID
   */
  async getProfile(userId: string): Promise<Employee | null> {
    if (!isSupabaseConfigured || !supabase) {
      const localProfiles = [...ALL_EMPLOYEES, ...getRegisteredEmployees()];
      return localProfiles.find(p => p.id === userId) || null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        // maybeSingle: a signed-in user with no profile row is a valid
        // "not provisioned yet" state, not an error. .single() surfaces
        // PGRST116 as HTTP 406 for that expected case.
        .maybeSingle();

      if (error || !data) return null;

      return {
        id: data.id,
        employeeId: data.employee_id || `SESB-${Math.floor(1000 + Math.random() * 9000)}`,
        name: data.name,
        fullName: data.full_name || data.name,
        designation: data.designation || 'Sabah Electricity Staff',
        department: data.department || 'Operating',
        email: data.email,
        avatarUrl: data.avatar_url || '/sabah_electricity_logo.png',
        coverUrl: data.cover_url || '/grid_horizon_hero.jpg',
        officeLocation: data.office_location || 'Wisma SE HQ, Kota Kinabalu',
        phoneExtension: data.phone_extension || 'Ext. 4102',
        bio: data.bio || '',
        role: (data.role as any) || 'GeneralStaff',
        adminDepartments: data.admin_departments || [],
        isVerified: true,
      };
    } catch (err) {
      console.warn('[BulletinService] getProfile error:', err);
      return null;
    }
  }

  /**
   * Fetch all staff profiles from Supabase profiles table (with fallback to local directory)
   */
  async getProfiles(limit: number = 50): Promise<Employee[]> {
    const localProfiles = [...ALL_EMPLOYEES, ...getRegisteredEmployees()];

    if (!isSupabaseConfigured || !supabase) {
      return localProfiles;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data || data.length === 0) {
        if (error) console.warn('[BulletinService] Supabase getProfiles fallback:', error.message);
        return localProfiles;
      }

      const cloudProfiles: Employee[] = data.map((row) => ({
        id: row.id,
        employeeId: row.employee_id || `SESB-${Math.floor(1000 + Math.random() * 9000)}`,
        name: row.name,
        fullName: row.full_name || row.name,
        designation: row.designation || 'Sabah Electricity Staff',
        department: row.department || 'Operating',
        email: row.email,
        avatarUrl: row.avatar_url || '/sabah_electricity_logo.png',
        coverUrl: row.cover_url || '/grid_horizon_hero.jpg',
        officeLocation: row.office_location || 'Wisma SE HQ, Kota Kinabalu',
        phoneExtension: row.phone_extension || 'Ext. 4102',
        bio: row.bio || '',
        role: row.role || 'GeneralStaff',
        isVerified: row.is_verified ?? true,
        isOnline: Boolean(row.is_online),
      }));

      // Cache cloud profiles locally for offline resilience
      try {
        localStorage.setItem('sesb_registered_users', JSON.stringify(cloudProfiles));
      } catch {
        // quota fallback
      }

      // Merge ensuring cloud profiles take precedence and de-duplicate by email
      const mergedMap = new Map<string, Employee>();
      for (const p of cloudProfiles) {
        mergedMap.set(p.email ? p.email.toLowerCase() : p.id, p);
      }
      for (const p of localProfiles) {
        const key = p.email ? p.email.toLowerCase() : p.id;
        if (!mergedMap.has(key)) {
          mergedMap.set(key, p);
        }
      }

      return Array.from(mergedMap.values());
    } catch (err) {
      console.warn('[BulletinService] getProfiles network error:', err);
      return localProfiles;
    }
  }

  /**
   * Save or update a staff profile (upserts to Supabase profiles table & updates local cache)
   */
  async saveProfile(employee: Employee): Promise<Employee> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('profiles').upsert(
          {
            id: employee.id,
            employee_id: employee.employeeId,
            name: employee.name,
            full_name: employee.fullName || employee.name,
            designation: employee.designation,
            department: employee.department,
            email: employee.email,
            avatar_url: employee.avatarUrl || '/sabah_electricity_logo.png',
            cover_url: employee.coverUrl || '/grid_horizon_hero.jpg',
            office_location: employee.officeLocation || 'Wisma SE HQ, Kota Kinabalu',
            phone_extension: employee.phoneExtension || 'Ext. 4102',
            bio: employee.bio || '',
            role: employee.role || 'GeneralStaff',
            is_verified: employee.isVerified ?? true,
            is_online: employee.isOnline ?? false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        ).select().single();

        if (error) {
          console.error('[BulletinService] Supabase profile upsert error:', error.message);
          throw error;
        }

        if (data) {
          return {
            ...employee,
            id: data.id,
          };
        }
      } catch (err) {
        console.error('[BulletinService] Network error saving profile to Supabase:', err);
        throw err;
      }
    }

    return employee;
  }

  /**
   * Subscribe to live profile changes across devices via Supabase Realtime
   */
  subscribeToProfiles(callback: (profiles: Employee[]) => void): () => void {
    if (!isSupabaseConfigured || !supabase) return () => {};

    const channel = supabase
      .channel('public:profiles_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        async () => {
          const fresh = await this.getProfiles();
          callback(fresh);
        }
      )
      .subscribe();

    const client = supabase;
    return () => {
      client.removeChannel(channel);
    };
  }
}

export const bulletinService = new BulletinService();

