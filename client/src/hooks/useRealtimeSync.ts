import { useEffect } from 'react';
import type { AppNotification, Comment, Post, Story } from '@/types/bulletin';
import { isSupabaseConfigured, supabase } from '@/services/supabaseClient';
import { saveStoredNotifications } from '@/services/notificationService';

interface UseRealtimeSyncParams {
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  setCommentsByPost: React.Dispatch<React.SetStateAction<Record<string, Comment[]>>>;
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  setSelectedPostId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveCommentPostId: React.Dispatch<React.SetStateAction<string | null>>;
  setToast: (toast: { message: string; icon?: string } | null) => void;
}

export function useRealtimeSync({
  setStories,
  setPosts,
  setCommentsByPost,
  setNotifications,
  setSelectedPostId,
  setActiveCommentPostId,
  setToast,
}: UseRealtimeSyncParams) {
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('realtime:bulletin-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'stories' },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = payload.new as any;
          let hoursRemaining = 24;
          if (row.created_at) {
            const elapsed = (Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60);
            hoursRemaining = Math.max(1, Math.round(24 - elapsed));
          }
          const liveStory: Story = {
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
          setStories((prev) => [liveStory, ...prev.filter((s) => s.id !== liveStory.id)]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = payload.new as any;
          const livePost: Post = {
            id: row.id,
            title: row.title,
            content: row.content,
            author: {
              id: row.author_id || `author-${(row.author_name || 'user').toLowerCase()}`,
              name: row.author_name,
              designation: row.author_role || 'Sabah Electricity Staff',
              department: row.department,
              avatarUrl: row.author_avatar || '/sabah_electricity_logo.png',
              isVerified: true,
            },
            timestamp: 'Just now',
            location: row.location,
            imageUrl: row.image_url,
            mediaUrls: Array.isArray(row.media_urls) ? row.media_urls : row.image_url ? [row.image_url] : [],
            isPinned: Boolean(row.is_pinned),
            commentsEnabled: Boolean(row.comments_enabled ?? true),
            likesCount: Number(row.likes_count || 0),
            commentsCount: Number(row.comments_count || 0),
            sharesCount: 0,
            viewsCount: Number(row.views_count || 1),
            resharesCount: Number(row.reshares_count || 0),
            isLiked: false,
            isBookmarked: false,
            departmentId: row.department_id || 'dept-ops',
            departmentName: row.department,
            departmentColor: row.department_color || '#0055A4',
            officialNotice: Boolean(row.official_notice),
            poll: row.poll_data || row.poll || undefined,
            pdfUrl: row.pdf_url || undefined,
            pdfName: row.pdf_name || undefined,
            pdfSize: row.pdf_size || undefined,
            reactions: row.reactions_breakdown || undefined,
          };

          setPosts((prev) => [livePost, ...prev.filter((p) => p.id !== livePost.id)]);
          setToast({
            message: `New bulletin: "${(row.title || 'Bulletin').slice(0, 26)}..."`,
            icon: 'campaign',
          });

          // Append to dynamic notifications
          const newNotif: AppNotification = {
            id: `notif-${Date.now()}`,
            category: row.official_notice ? 'urgent' : 'general',
            title: row.official_notice
              ? `${row.department || 'SESB'} Official Notice`
              : `${row.author_name || 'Staff'} published a bulletin`,
            message: row.title,
            timestamp: 'Just now',
            createdAt: Date.now(),
            isRead: false,
            icon: row.official_notice ? 'security' : 'campaign',
            iconColor: row.official_notice ? '#EF4444' : '#0055A4',
            targetPostId: row.id,
            avatarUrl: row.author_avatar || undefined,
            avatarInitials: (row.author_name || 'SE')
              .split(' ')
              .map((n: string) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase(),
          };
          setNotifications((prev) => {
            const updated = [newNotif, ...prev];
            saveStoredNotifications(updated);
            return updated;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = payload.new as any;
          if (!row || !row.id) return;

          setPosts((prev) =>
            prev.map((post) => {
              if (post.id !== row.id) return post;
              return {
                ...post,
                title: row.title !== undefined ? row.title : post.title,
                content: row.content !== undefined ? row.content : post.content,
                location: row.location !== undefined ? row.location : post.location,
                imageUrl: row.image_url !== undefined ? row.image_url : post.imageUrl,
                mediaUrls: Array.isArray(row.media_urls)
                  ? row.media_urls
                  : row.image_url
                  ? [row.image_url]
                  : post.mediaUrls,
                isPinned: row.is_pinned !== undefined ? Boolean(row.is_pinned) : post.isPinned,
                commentsEnabled:
                  row.comments_enabled !== undefined
                    ? Boolean(row.comments_enabled)
                    : post.commentsEnabled,
                likesCount: Number(row.likes_count ?? post.likesCount),
                commentsCount: Number(row.comments_count ?? post.commentsCount),
                viewsCount: Number(row.views_count ?? post.viewsCount),
                resharesCount: Number(row.reshares_count ?? post.resharesCount),
                departmentName: row.department || post.departmentName,
                departmentId: row.department_id || post.departmentId,
                departmentColor: row.department_color || post.departmentColor,
                officialNotice:
                  row.official_notice !== undefined
                    ? Boolean(row.official_notice)
                    : post.officialNotice,
                poll: row.poll_data || row.poll || post.poll,
                reactions: row.reactions_breakdown !== undefined ? row.reactions_breakdown : post.reactions,
                pdfUrl: row.pdf_url !== undefined ? row.pdf_url : post.pdfUrl,
                pdfName: row.pdf_name !== undefined ? row.pdf_name : post.pdfName,
                pdfSize: row.pdf_size !== undefined ? row.pdf_size : post.pdfSize,
                isEdited: row.is_edited !== undefined ? Boolean(row.is_edited) : post.isEdited,
                editedAt: row.edited_at || post.editedAt,
              };
            })
          );

          if (row.is_edited) {
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = payload.new as any;
          const liveComment: Comment = {
            id: row.id,
            authorName: row.author_name,
            department: row.department,
            avatarInitials: (row.author_name || 'SE')
              .split(' ')
              .map((n: string) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase(),
            avatarUrl: row.author_avatar || undefined,
            text: row.text,
            timestamp: 'Just now',
            likesCount: 0,
          };

          setCommentsByPost((prev) => {
            const list = prev[row.post_id] || [];
            if (list.some((c) => c.id === liveComment.id)) return prev;
            return {
              ...prev,
              [row.post_id]: [...list, liveComment],
            };
          });

          setPosts((prev) =>
            prev.map((p) =>
              p.id === row.post_id
                ? {
                    ...p,
                    commentsCount: p.commentsCount + 1,
                    previewComment: liveComment,
                  }
                : p
            )
          );

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
            avatarUrl: row.author_avatar || undefined,
            avatarInitials: (row.author_name || 'SE')
              .split(' ')
              .map((n: string) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase(),
          };
          setNotifications((prev) => {
            const updated = [commentNotif, ...prev];
            saveStoredNotifications(updated);
            return updated;
          });
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
