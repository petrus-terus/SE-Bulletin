import type { CreatePostPayload, Employee, Post, Story } from '@/types/bulletin';
import { ALL_EMPLOYEES, INITIAL_POSTS, INITIAL_STORIES, getRegisteredEmployees } from './mockData';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { compressImageFile } from '@/utils/imageCompressor';
import { z } from 'zod';

const PollOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  votes: z.number().default(0),
});

const PollDataSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(PollOptionSchema),
  totalVotes: z.number().default(0),
  expiresText: z.string().optional(),
  userVotedId: z.string().optional(),
});

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
              : row.author_avatar || '/sabah_electricity_logo.png',
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
        poll: row.poll_data || row.poll ? (() => {
          const raw = row.poll_data || row.poll;
          const parsed = PollDataSchema.safeParse(raw);
          if (parsed.success) return parsed.data;
          console.warn('[BulletinService] Dropping malformed poll_data on post', row.id, parsed.error);
          return undefined;
        })() : undefined,
        pdfUrl: row.pdf_url || undefined,
        pdfName: row.pdf_name || undefined,
        pdfSize: row.pdf_size || undefined,
        quotedPost: row.quoted_post || undefined,
        isEdited: Boolean(row.is_edited),
        editedAt: row.edited_at || undefined,
      }));

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

      const cloudStories: Story[] = data.map((row) => {
        let hoursRemaining = 24;
        if (row.created_at) {
          const elapsed = (Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60);
          hoursRemaining = Math.round(24 - elapsed);
        }
        return {
          id: row.id,
          departmentId: row.department_id,
          departmentName: row.department_name,
          authorName: row.author_name,
          authorAvatar: row.author_avatar || '/sabah_electricity_logo.png',
          hasUnread: true,
          imageUrl: row.image_url,
          caption: row.caption || '',
          hoursRemaining,
        };
      });

      const cloudIds = new Set(cloudStories.map((s) => s.id));
      return [...cloudStories, ...INITIAL_STORIES.filter((s) => !cloudIds.has(s.id))];
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
            author_id: (await supabase.auth.getUser()).data.user?.id || null,
            author_name: story.authorName,
            author_avatar: story.authorAvatar || '/sabah_electricity_logo.png',
            image_url: story.imageUrl,
            caption: story.caption || '',
          },
        ]);
        if (error) {
          console.error('[BulletinService] createStory error:', error.message);
          throw error;
        }
      } catch (err) {
        console.error('[BulletinService] Failed to sync story to Supabase:', err);
        throw err;
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
        const ext = uploadTarget.name.endsWith('.webp') ? '.webp' : '.jpg';
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
   * Delete a post by ID (and cascade delete its comments)
   */
  async deletePost(postId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('posts').delete().eq('id', postId);
        if (error) {
          console.error('[BulletinService] deletePost error:', error.message);
          throw error;
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
        officeLocation: data.office_location || 'Wisma SESB HQ, Kota Kinabalu',
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
        officeLocation: row.office_location || 'Wisma SESB HQ, Kota Kinabalu',
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
            office_location: employee.officeLocation || 'Wisma SESB HQ, Kota Kinabalu',
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

