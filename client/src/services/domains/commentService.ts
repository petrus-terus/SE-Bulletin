import type { Comment, Employee } from '@/types/bulletin';
import { isSupabaseConfigured, supabase } from '../supabaseClient';
import { mapRowToComment, getAvatarInitials } from '../rowMappers';

export class CommentService {
  /**
   * Fetch comments for a specific post
   */
  async getComments(postId: string): Promise<Comment[]> {
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
      console.warn('[CommentService] getComments error:', err);
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
  ): Promise<Comment> {
    const newComment: Comment = {
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
        const commentPayload: Record<string, unknown> = {
          id: newComment.id,
          post_id: postId,
          author_name: newComment.authorName,
          author_avatar: newComment.avatarUrl || null,
          avatar_initials: newComment.avatarInitials || 'SE',
          department: newComment.department,
          text: newComment.text,
        };

        const { data, error } = await supabase
          .from('comments')
          .insert([commentPayload])
          .select()
          .single();

        if (error) {
          console.error('[CommentService] Supabase addComment error:', error.message);
          throw error;
        }

        if (data) {
          newComment.id = data.id;
          newComment.timestamp = new Date(data.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
        }

        // Increment comment count on the post
        await supabase
          .from('posts')
          .update({ comments_count: currentCommentsCount + 1 })
          .eq('id', postId);
      } catch (err) {
        console.error('[CommentService] addComment sync error:', err);
        throw err;
      }
    }

    return newComment;
  }
}

export const commentService = new CommentService();
