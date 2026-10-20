import { useEffect, useRef } from 'react';
import type { AppNotification, Comment, Employee, Post, Story } from '@/types/bulletin';
import { isSupabaseConfigured, supabase } from '@/services/supabaseClient';
import { saveStoredNotifications } from '@/services/notificationService';
import {
  mapRowToPost,
  mergeUpdatedPostRow,
  mapRowToStory,
  mapRowToComment,
  isAuthorSelf,
  getAvatarInitials,
  type PostRow,
  type StoryRow,
  type CommentRow,
} from '@/services/rowMappers';

interface UseRealtimeSyncParams {
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  setCommentsByPost: React.Dispatch<React.SetStateAction<Record<string, Comment[]>>>;
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  setSelectedPostId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveCommentPostId: React.Dispatch<React.SetStateAction<string | null>>;
  setToast: (toast: { message: string; icon?: string } | null) => void;
  currentUser?: Employee | null;
}

export function useRealtimeSync({
  setStories,
  setPosts,
  setCommentsByPost,
  setNotifications,
  setSelectedPostId,
  setActiveCommentPostId,
  setToast,
  currentUser,
}: UseRealtimeSyncParams) {
  const currentUserRef = useRef<Employee | null | undefined>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('realtime:bulletin-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'stories' },
        (payload) => {
          const row = payload.new as StoryRow;
          if (!row || !row.id) return;
          const liveStory = mapRowToStory(row, { viewsCount: 1, hasUnread: true });
          setStories((prev) => [liveStory, ...prev.filter((s) => s.id !== liveStory.id)]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'stories' },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const deletedId = (payload.old as any)?.id;
          if (deletedId) {
            setStories((prev) => prev.filter((s) => s.id !== deletedId));
          }
        }
      )
      .on(
        'broadcast',
        { event: 'story:deleted' },
        ({ payload }) => {
          const deletedId = payload?.id;
          if (deletedId) {
            setStories((prev) => prev.filter((s) => s.id !== deletedId));
          }
        }
      )
      .on(
        'broadcast',
        { event: 'story:created' },
        ({ payload }) => {
          if (payload?.story) {
            setStories((prev) => [payload.story, ...prev.filter((s) => s.id !== payload.story.id)]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          const row = payload.new as PostRow;
          if (!row || !row.id) return;

          setPosts((prev) => {
            const existingMap = new Map(prev.map((p) => [p.id, p]));
            const livePost = mapRowToPost(row, {
              timestamp: 'Just now',
              viewsCountFloor: 1,
              existingPostsMap: existingMap,
            });
            return [livePost, ...prev.filter((p) => p.id !== livePost.id)];
          });

          const isSelf = isAuthorSelf(row.author_id, row.author_name, currentUserRef.current);

          if (!isSelf) {
            setToast({
              message: `New bulletin: "${(row.title || 'Bulletin').slice(0, 26)}..."`,
              icon: 'campaign',
            });

            // Append to dynamic notifications
            const newNotif: AppNotification = {
              id: `notif-${Date.now()}`,
              category: row.official_notice ? 'urgent' : 'general',
              title: row.official_notice
                ? `${row.department || 'SE'} Official Notice`
                : `${row.author_name || 'Staff'} published a bulletin`,
              message: row.title,
              timestamp: 'Just now',
              createdAt: Date.now(),
              isRead: false,
              icon: row.official_notice ? 'security' : 'campaign',
              iconColor: row.official_notice ? '#EF4444' : '#0055A4',
              targetPostId: row.id,
              avatarUrl: row.author_avatar || undefined,
              avatarInitials: getAvatarInitials(row.author_name),
            };
            setNotifications((prev) => {
              const updated = [newNotif, ...prev];
              try {
                saveStoredNotifications(updated);
              } catch (e) {
                console.warn('[useRealtimeSync] Failed to save notifications:', e);
              }
              return updated;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          const row = payload.new as Partial<PostRow>;
          if (!row || !row.id) return;

          setPosts((prev) =>
            prev.map((post) => (post.id === row.id ? mergeUpdatedPostRow(post, row) : post))
          );

          const isSelf = isAuthorSelf(row.author_id, row.author_name, currentUserRef.current);

          if (row.is_edited && !isSelf) {
            setToast({
              message: `Updated: "${(row.title || 'Bulletin').slice(0, 26)}..."`,
              icon: 'edit',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        (payload) => {
          const row = payload.new as CommentRow;
          if (!row || !row.id) return;
          const liveComment = mapRowToComment(row, { timestamp: 'Just now' });

          setCommentsByPost((prev) => {
            const list = prev[row.post_id] || [];
            if (list.some((c) => c.id === liveComment.id)) return prev;
            return {
              ...prev,
              [row.post_id]: [...list, liveComment],
            };
          });

          const isCommentSelf = isAuthorSelf(row.author_id, row.author_name, currentUserRef.current);

          setPosts((prev) =>
            prev.map((p) =>
              p.id === row.post_id
                ? {
                    ...p,
                    commentsCount: isCommentSelf ? p.commentsCount : p.commentsCount + 1,
                    previewComment: liveComment,
                  }
                : p
            )
          );

          if (!isCommentSelf) {
            setToast({
              message: `${row.author_name}: "${row.text.slice(0, 24)}..."`,
              icon: 'chat',
            });

            // Append to dynamic notifications
            const commentNotif: AppNotification = {
              id: `notif-c-${Date.now()}`,
              category: 'comment',
              title: `${row.author_name} commented`,
              message: row.text,
              timestamp: 'Just now',
              createdAt: Date.now(),
              isRead: false,
              icon: 'chat',
              iconColor: '#0055A4',
              targetPostId: row.post_id,
              targetCommentId: row.id,
              avatarInitials: getAvatarInitials(row.author_name),
            };
            setNotifications((prev) => {
              const updated = [commentNotif, ...prev];
              try {
                saveStoredNotifications(updated);
              } catch (e) {
                console.warn('[useRealtimeSync] Failed to save notifications:', e);
              }
              return updated;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const oldRow = payload.old as any;
          if (oldRow?.id) {
            setPosts((prev) => prev.filter((p) => p.id !== oldRow.id));
            setSelectedPostId((curr) => (curr === oldRow.id ? null : curr));
            setActiveCommentPostId((curr) => (curr === oldRow.id ? null : curr));
          }
        }
      )
      .on(
        'broadcast',
        { event: 'post_deleted' },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const deletedId = (payload?.payload as any)?.id;
          if (deletedId) {
            setPosts((prev) => prev.filter((p) => p.id !== deletedId));
            setSelectedPostId((curr) => (curr === deletedId ? null : curr));
            setActiveCommentPostId((curr) => (curr === deletedId ? null : curr));
          }
        }
      )
      .on(
        'broadcast',
        { event: 'post_updated' },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updated = payload?.payload as any;
          if (updated?.id) {
            setPosts((prev) =>
              prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
            );
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [setStories, setPosts, setCommentsByPost, setNotifications, setSelectedPostId, setActiveCommentPostId, setToast]);
}
