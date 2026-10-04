import type { CreatePostPayload, Employee, Post, Story } from '../types/bulletin';
import { INITIAL_POSTS, INITIAL_STORIES } from './mockData';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { compressImageFile } from '../utils/imageCompressor';

const DELETED_POSTS_STORAGE_KEY = 'sesb_deleted_posts';
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

function getDeletedPostIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_POSTS_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function recordDeletedPostId(postId: string) {
  try {
    const ids = getDeletedPostIds();
    ids.add(postId);
    localStorage.setItem(DELETED_POSTS_STORAGE_KEY, JSON.stringify([...ids]));
  } catch (e) {
    console.warn('[BulletinService] Failed to record deleted post ID:', e);
  }
}

/**
 * Universal Bulletin Service Layer (Repository Pattern)
 * 
 * Protects frontend components from tight coupling with Supabase or any specific backend.
 * When SESB approves the project for internal deployment, this service can easily be
 * redirected to ASP.NET Core 8 Web API + SQL Server without changing React UI code.
 */
class BulletinService {
  /**
   * Fetch all bulletins/posts
   */
  async getPosts(): Promise<Post[]> {
    const deletedIds = getDeletedPostIds();

    if (!isSupabaseConfigured || !supabase) {
      return INITIAL_POSTS.filter((p) => !deletedIds.has(p.id));
    }

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        if (error) console.warn('[BulletinService] Supabase getPosts fallback:', error.message);
        return INITIAL_POSTS.filter((p) => !deletedIds.has(p.id));
      }

      const cloudPosts: Post[] = data.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        author: {
          id: row.author_id || `author-${row.author_name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`,
          name: row.author_name,
          designation: row.author_role || 'Sabah Electricity Staff',
          department: row.department,
          avatarUrl:
            row.author_id === 'user-ceo' || (row.author_name || '').toLowerCase().includes('yaakob')
              ? '/ceo_portrait.png'
              : row.author_avatar || '/user_face.png',
          isVerified: true,
        },
        timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        location: row.location,
        imageUrl: row.image_url,
        mediaUrls: Array.isArray(row.media_urls) ? row.media_urls : row.image_url ? [row.image_url] : [],
        isPinned: Boolean(row.is_pinned),
        commentsEnabled: Boolean(row.comments_enabled ?? true),
        likesCount: Number(row.likes_count || 0),
        commentsCount: Number(row.comments_count || 0),
        sharesCount: 0,
        viewsCount: Number(row.views_count || 0),
        resharesCount: Number(row.reshares_count || 0),
        isLiked: false,
        isBookmarked: false,
        departmentId: row.department_id || 'dept-ops',
        departmentName: row.department,
        departmentColor: row.department_color || '#0055A4',
        officialNotice: Boolean(row.official_notice),
        poll: row.poll || undefined,
        pdfUrl: row.pdf_url || undefined,
        pdfName: row.pdf_name || undefined,
        pdfSize: row.pdf_size || undefined,
        quotedPost: row.quoted_post || undefined,
      }));

      const cloudIds = new Set(cloudPosts.map((p) => p.id));
      const combined = [...cloudPosts, ...INITIAL_POSTS.filter((p) => !cloudIds.has(p.id))];
      // Ensure pinned bulletins stay at the very top of the feed
      const sorted = combined.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
      return sorted.filter((p) => !deletedIds.has(p.id));
    } catch (err) {
      console.warn('[BulletinService] Offline / connection error, using local data:', err);
      return INITIAL_POSTS.filter((p) => !deletedIds.has(p.id));
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
      location: 'Wisma SESB HQ',
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
        const { error } = await supabase.from('posts').insert([
          {
            id: newPost.id,
            title: newPost.title,
            content: newPost.content,
            author_id: null,
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
        ]);

        if (error) {
          console.warn('[BulletinService] Supabase createPost insert warning:', error.message);
        }
      } catch (err) {
        console.warn('[BulletinService] Failed to sync post to Supabase, continuing locally:', err);
      }
    }

    return newPost;
  }

  /**
   * Fetch 24h stories
   */
  async getStories(): Promise<Story[]> {
    if (!isSupabaseConfigured || !supabase) {
      return INITIAL_STORIES;
    }

    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return INITIAL_STORIES;
      }

      return data.map((row) => ({
        id: row.id,
        departmentId: row.department_id,
        departmentName: row.department_name,
        authorName: row.author_name,
        hasUnread: true,
        imageUrl: row.image_url,
        caption: row.caption || '',
        hoursRemaining: 24,
      }));
    } catch {
      return INITIAL_STORIES;
    }
  }

  /**
   * Persist a new 24h story to Supabase
   */
  async createStory(story: Story): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('stories').insert([
          {
            id: story.id,
            department_id: story.departmentId,
            department_name: story.departmentName,
            author_name: story.authorName,
            author_avatar: story.authorAvatar || '/user_face.png',
            image_url: story.imageUrl,
            caption: story.caption || '',
          },
        ]);
        if (error) {
          console.warn('[BulletinService] createStory warning:', error.message);
        }
      } catch (err) {
        console.warn('[BulletinService] Failed to sync story to Supabase:', err);
      }
    }
  }

  /**
   * Upload media photo to Supabase storage with automatic client-side compression
   * and fallback to DataURL.
   */
  async uploadPhoto(file: File): Promise<string> {
    let uploadTarget = file;

    // Automatically optimize smartphone captures to ~150-250KB WebP
    try {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImageFile(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.82,
        });
        uploadTarget = compressed.file;
      }
    } catch (compressionErr) {
      console.warn('[BulletinService] Image auto-compression fallback to raw file:', compressionErr);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const ext = uploadTarget.name.endsWith('.webp') ? '.webp' : '.jpg';
        const cleanName = uploadTarget.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${Date.now()}-${cleanName.endsWith(ext) ? cleanName : `${cleanName}${ext}`}`;
        const { error } = await supabase.storage.from('bulletin-media').upload(fileName, uploadTarget, {
          cacheControl: '3600',
          upsert: false,
        });

        if (!error) {
          const { data } = supabase.storage.from('bulletin-media').getPublicUrl(fileName);
          if (data?.publicUrl) return data.publicUrl;
        }
      } catch (err) {
        console.warn('[BulletinService] Storage upload failed, using object URL:', err);
      }
    }

    return URL.createObjectURL(uploadTarget);
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

      return data.map((row) => ({
        id: row.id,
        authorName: row.author_name,
        department: row.department,
        avatarInitials: row.author_name
          .split(' ')
          .map((n: string) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase(),
        avatarUrl: row.author_avatar || undefined,
        text: row.text,
        timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        likesCount: 0,
      }));
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
      avatarInitials: currentUser.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase(),
      avatarUrl: currentUser.avatarUrl,
      text: commentText,
      timestamp: 'Just now',
      likesCount: 0,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('comments').insert([
          {
            id: newComment.id,
            post_id: postId,
            author_name: newComment.authorName,
            author_avatar: newComment.avatarUrl || null,
            department: newComment.department,
            text: newComment.text,
          },
        ]);

        if (error) {
          console.warn('[BulletinService] Supabase addComment warning:', error.message);
        } else {
          // Increment comment count on the post
          await supabase
            .from('posts')
            .update({ comments_count: currentCommentsCount + 1 })
            .eq('id', postId);
        }
      } catch (err) {
        console.warn('[BulletinService] addComment sync error:', err);
      }
    }

    return newComment;
  }

  /**
   * Update post like count in Supabase
   */
  async toggleLike(postId: string, nextLikesCount: number): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('posts')
          .update({ likes_count: nextLikesCount })
          .eq('id', postId);
      } catch (err) {
        console.warn('[BulletinService] toggleLike sync error:', err);
      }
    }
  }

  /**
   * Delete a post by ID (and cascade delete its comments)
   */
  async deletePost(postId: string): Promise<boolean> {
    // 1. Immediately record deletion tombstone in local persistence
    recordDeletedPostId(postId);

    // 2. Sync to Supabase cloud if configured
    if (isSupabaseConfigured && supabase) {
      try {
        // Delete associated comments first to maintain referential integrity
        await supabase.from('comments').delete().eq('post_id', postId);
        
        // Delete the post itself
        const { error } = await supabase.from('posts').delete().eq('id', postId);
        if (error) {
          console.warn('[BulletinService] deletePost error:', error.message);
          return false;
        }
        return true;
      } catch (err) {
        console.warn('[BulletinService] deletePost sync error:', err);
        return false;
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
        if (updates.pdfUrl !== undefined) updatePayload.pdf_url = updates.pdfUrl;
        if (updates.pdfName !== undefined) updatePayload.pdf_name = updates.pdfName;
        if (updates.pdfSize !== undefined) updatePayload.pdf_size = updates.pdfSize;

        const { error } = await supabase.from('posts').update(updatePayload).eq('id', postId);
        if (error) {
          console.warn('[BulletinService] updatePost error:', error.message);
          return false;
        }
        return true;
      } catch (err) {
        console.warn('[BulletinService] updatePost sync error:', err);
        return false;
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
            .single();

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
}

export const bulletinService = new BulletinService();

