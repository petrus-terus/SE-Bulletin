import type { CreatePostPayload, Employee, Post } from '@/types/bulletin';
import { INITIAL_POSTS } from '../mockData';
import { isSupabaseConfigured, supabase } from '../supabaseClient';
import { mapRowToPost } from '../rowMappers';
import { mediaService } from './mediaService';
import { DEFAULT_DEPARTMENT_ID } from '@/constants/bulletin';
import { loadStoredSet, saveStoredSet } from '@/utils/storageHelpers';

const VIEWED_POSTS_STORAGE_KEY = 'sesb_viewed_bulletin_ids';

function getViewedPostIds(): Set<string> {
  return loadStoredSet(VIEWED_POSTS_STORAGE_KEY, sessionStorage);
}

function markPostIdAsViewed(postId: string) {
  const ids = getViewedPostIds();
  ids.add(postId);
  saveStoredSet(VIEWED_POSTS_STORAGE_KEY, ids, sessionStorage);
}

export class PostService {
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

      const postLookup = new Map<string, Post>();
      if (import.meta.env.DEV) {
        INITIAL_POSTS.forEach((p) => postLookup.set(p.id, p));
      }
      cloudPosts.forEach((p) => postLookup.set(p.id, p));

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

      return combinedWithEdits.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
    } catch (err) {
      console.error('[PostService] Failed to load posts from Supabase:', err);
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
      location: payload.location || 'Wisma SE HQ',
      imageUrl: payload.mediaUrls?.[0] || payload.imageUrl || null,
      mediaUrls: payload.mediaUrls,
      isPinned: Boolean(payload.isPinned),
      commentsEnabled: payload.commentsEnabled ?? true,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      isLiked: false,
      isBookmarked: false,
      departmentId: payload.departmentId || DEFAULT_DEPARTMENT_ID,
      departmentName: payload.department || currentUser.department,
      departmentColor: payload.departmentColor || '#0055A4',
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
          console.error('[PostService] Supabase createPost insert error:', error.message);
          throw error;
        }

        if (data) {
          newPost.id = data.id;
          newPost.timestamp = new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } catch (err) {
        console.error('[PostService] Failed to sync post to Supabase:', err);
        throw err;
      }
    }

    return newPost;
  }

  /**
   * Delete a post by ID (and cascade delete its comments & physical media files)
   */
  async deletePost(postId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: postRow } = await supabase
          .from('posts')
          .select('image_url, media_urls, pdf_url')
          .eq('id', postId)
          .maybeSingle();

        const { error } = await supabase.from('posts').delete().eq('id', postId);
        if (error) {
          console.error('[PostService] deletePost error:', error.message);
          throw error;
        }

        if (postRow) {
          const filesToPurge: (string | undefined | null)[] = [postRow.image_url, postRow.pdf_url];
          if (Array.isArray(postRow.media_urls)) {
            filesToPurge.push(...postRow.media_urls);
          }
          await mediaService.deleteStorageFiles(filesToPurge);
        }

        return true;
      } catch (err) {
        console.error('[PostService] deletePost sync error:', err);
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
        const updatePayload: Record<string, unknown> = {};
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
          console.error('[PostService] updatePost error:', error.message);
          throw error;
        }
        return true;
      } catch (err) {
        console.error('[PostService] updatePost sync error:', err);
        throw err;
      }
    }
    return true;
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
        console.warn('[PostService] toggleLike sync error:', err);
      }
    }
  }

  /**
   * Check if a bulletin has already been viewed during current session
   */
  isPostViewedInSession(postId: string): boolean {
    return getViewedPostIds().has(postId);
  }

  /**
   * Record a bulletin view with session deduplication and Supabase sync
   */
  async recordPostView(postId: string): Promise<boolean> {
    if (this.isPostViewedInSession(postId)) {
      return false;
    }
    markPostIdAsViewed(postId);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: rpcErr } = await supabase.rpc('increment_post_views', {
          post_id_input: postId,
        });

        if (rpcErr) {
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
        console.warn('[PostService] recordPostView sync error:', err);
      }
    }

    return true;
  }
}

export const postService = new PostService();
