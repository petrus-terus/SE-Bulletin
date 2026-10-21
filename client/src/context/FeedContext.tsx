import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type {
  AppNotification,
  Comment,
  Employee,
  EmojiReactionType,
  Post,
  Story,
  ToastMessage,
} from '@/types/bulletin';
import { INITIAL_POSTS, INITIAL_STORIES } from '@/services/mockData';
import { bulletinService } from '@/services/bulletinService';
import { getBookmarkedPostIds } from '@/services/bookmarkStorage';
import { getLikedPostIds } from '@/services/likeStorage';
import { getStoredPollVotes } from '@/services/pollStorage';
import { getStoredNotifications, saveStoredNotifications } from '@/services/notificationService';
import { usePostActions } from '@/hooks/usePostActions';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { useOverlay } from './OverlayContext';

const PAGE_LIMIT = 20;

export interface FeedContextType {
  posts: Post[];
  feedPosts: Post[];
  latestCeoPost?: Post;
  stories: Story[];
  notifications: AppNotification[];
  unreadCount: number;
  selectedDeptId: string;
  postCounts: Record<string, number>;
  selectedPostId: string | null;
  selectedPostForDetail: Post | null;
  activeCommentPost: Post | null;
  activeResharePost: Post | null;
  activeQuotePost: Post | null;
  commentsByPost: Record<string, Comment[]>;
  toast: ToastMessage | null;
  hasMorePosts: boolean;
  isLoadingMore: boolean;
  loadMorePosts: () => Promise<void>;
  setToast: React.Dispatch<React.SetStateAction<ToastMessage | null>>;
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  markAllNotificationsAsRead: () => void;
  setSelectedDeptId: (deptId: string) => void;
  setSelectedPostId: React.Dispatch<React.SetStateAction<string | null>>;
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
  setCommentsByPost: React.Dispatch<React.SetStateAction<Record<string, Comment[]>>>;
  handleLikeToggle: (postId: string) => void;
  handleBookmarkToggle: (postId: string) => void;
  handleVotePoll: (postId: string, optionId: string) => void;
  handleReactionSelect: (postId: string, reaction: EmojiReactionType) => void;
  handleReshareToggle: (postId: string) => void;
  handleQuotePost: (quotedPost: Post, commentText: string) => Promise<void>;
  handleSharePost: (post: Post) => void;
  handleAddComment: (postId: string, text: string) => Promise<void>;
  handleDeletePost: (postId: string) => Promise<void>;
  handleUpdatePost: (postId: string, updates: Partial<Post>) => Promise<void>;
  handlePublishPost: (newPost: Post) => void;
  handleDeleteStory: (storyId: string) => Promise<void>;
  handleOpenPostDetail: (post: Post) => void;
}

const FeedContext = createContext<FeedContextType | null>(null);

export const FeedProvider: React.FC<{
  currentUser: Employee | null;
  children: React.ReactNode;
}> = ({ currentUser, children }) => {
  const {
    activeCommentPostId,
    activeResharePostId,
    activeQuotePostId,
    setActiveCommentPostId,
    setActiveResharePostId,
    setActiveQuotePostId,
    setEditingPost,
  } = useOverlay();

  const userId = currentUser?.id;

  const [posts, setPosts] = useState<Post[]>(() => {
    if (!import.meta.env.DEV) return [];
    const savedBookmarks = getBookmarkedPostIds(userId);
    const savedLikes = getLikedPostIds(userId);
    const savedVotes = getStoredPollVotes(userId);
    return INITIAL_POSTS.map((p) => ({
      ...p,
      isBookmarked: savedBookmarks.has(p.id),
      isLiked: savedLikes.has(p.id) || p.isLiked,
      poll: p.poll
        ? {
            ...p.poll,
            userVotedOptionId: savedVotes[p.id] || p.poll.userVotedOptionId,
          }
        : p.poll,
    }));
  });
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
  const [stories, setStories] = useState<Story[]>(import.meta.env.DEV ? INITIAL_STORIES : []);
  const [prevUserId, setPrevUserId] = useState(userId);
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    getStoredNotifications(userId)
  );
  if (prevUserId !== userId) {
    setPrevUserId(userId);
    setNotifications(getStoredNotifications(userId));
  }
  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);
  const [selectedDeptId, setSelectedDeptId] = useState('dept-all');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }));
      saveStoredNotifications(updated, userId);
      return updated;
    });
    setToast({ message: 'All notifications marked as read', icon: 'done_all' });
  }, [userId]);

  // Derived Reactive Entities
  const selectedPostForDetail = useMemo(
    () => (selectedPostId ? posts.find((p) => p.id === selectedPostId) || null : null),
    [posts, selectedPostId]
  );
  const activeCommentPost = useMemo(
    () => (activeCommentPostId ? posts.find((p) => p.id === activeCommentPostId) || null : null),
    [posts, activeCommentPostId]
  );
  const activeResharePost = useMemo(
    () => (activeResharePostId ? posts.find((p) => p.id === activeResharePostId) || null : null),
    [posts, activeResharePostId]
  );
  const activeQuotePost = useMemo(
    () => (activeQuotePostId ? posts.find((p) => p.id === activeQuotePostId) || null : null),
    [posts, activeQuotePostId]
  );

  // Post Actions Hook
  const {
    handleLikeToggle,
    handleBookmarkToggle,
    handleVotePoll,
    handleReactionSelect,
    handleReshareToggle,
    handleQuotePost,
    handleSharePost,
    handleAddComment,
    handlePublishPost,
    handleDeletePost,
    handleUpdatePost,
    handleOpenPostDetail,
  } = usePostActions({
    currentUser,
    setPosts,
    setCommentsByPost,
    setSelectedPostId,
    setActiveCommentPostId,
    setActiveResharePostId,
    setActiveQuotePostId,
    setEditingPost,
    setToast,
  });

  // Story Deletion Handler
  const handleDeleteStory = useCallback(async (storyId: string) => {
    try {
      setStories((prev) => prev.filter((s) => s.id !== storyId));
      await bulletinService.deleteStory(storyId);
      setToast({
        message: 'Story deleted successfully.',
        icon: 'delete',
      });
    } catch (err) {
      console.error('[FeedContext] Failed to delete story:', err);
      setToast({
        message: 'Failed to delete story from cloud.',
        icon: 'error',
      });
    }
  }, []);

  // Enrich posts with user-scoped local bookmarks, likes, and poll votes
  const enrichPostsWithUserState = useCallback(
    (rawPosts: Post[]): Post[] => {
      const savedBookmarks = getBookmarkedPostIds(userId);
      const savedLikes = getLikedPostIds(userId);
      const savedVotes = getStoredPollVotes(userId);
      return rawPosts.map((p) => ({
        ...p,
        isBookmarked: savedBookmarks.has(p.id),
        isLiked: savedLikes.has(p.id) || p.isLiked,
        poll: p.poll
          ? {
              ...p.poll,
              userVotedOptionId: savedVotes[p.id] || p.poll.userVotedOptionId,
            }
          : p.poll,
      }));
    },
    [userId]
  );

  // Initial Load from Supabase (Posts & Stories)
  useEffect(() => {
    bulletinService.getPosts(undefined, PAGE_LIMIT, userId).then((fetched) => {
      if (fetched && fetched.length > 0) {
        setPosts(enrichPostsWithUserState(fetched));
        setHasMorePosts(fetched.length >= PAGE_LIMIT);
      }
    });

    bulletinService.getStories().then((cloudStories) => {
      if (cloudStories && cloudStories.length > 0) {
        setStories(cloudStories);
      }
    });
  }, [userId, enrichPostsWithUserState]);

  // Cursor-based Load More Pagination
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMorePosts) return;
    const oldestCursor = [...posts]
      .reverse()
      .find((p) => Boolean(p.createdAt))?.createdAt;

    if (!oldestCursor) {
      setHasMorePosts(false);
      return;
    }

    setIsLoadingMore(true);
    try {
      const nextBatch = await bulletinService.getPosts(oldestCursor, PAGE_LIMIT, userId);
      if (!nextBatch || nextBatch.length === 0) {
        setHasMorePosts(false);
        return;
      }

      const enriched = enrichPostsWithUserState(nextBatch);
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueNext = enriched.filter((p) => !existingIds.has(p.id));
        return [...prev, ...uniqueNext];
      });
      setHasMorePosts(nextBatch.length >= PAGE_LIMIT);
    } catch (err) {
      console.error('[FeedContext] Failed to load more posts:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMorePosts, posts, userId, enrichPostsWithUserState]);

  // Real-time Cloud Synchronization
  useRealtimeSync({
    setStories,
    setPosts,
    setCommentsByPost,
    setNotifications,
    setSelectedPostId,
    setActiveCommentPostId,
    setToast,
    currentUser,
  });

  // Fetch cloud comments when active
  const activeDetailOrCommentPostId = activeCommentPost?.id || selectedPostForDetail?.id;
  useEffect(() => {
    if (!activeDetailOrCommentPostId) return;
    bulletinService.getComments(activeDetailOrCommentPostId).then((cloudComments) => {
      if (cloudComments && cloudComments.length > 0) {
        setCommentsByPost((prev) => {
          const existing = prev[activeDetailOrCommentPostId] || [];
          const existingIds = new Set(existing.map((c) => c.id));
          const merged = [...existing, ...cloudComments.filter((c) => !existingIds.has(c.id))];
          return {
            ...prev,
            [activeDetailOrCommentPostId]: merged,
          };
        });
      }
    });
  }, [activeDetailOrCommentPostId]);

  // Derived Department counts (memoized)
  const postCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'dept-all': posts.length,
    };
    posts.forEach((p) => {
      if (p.departmentId) {
        counts[p.departmentId] = (counts[p.departmentId] || 0) + 1;
      }
    });
    return counts;
  }, [posts]);

  const filteredPosts = useMemo(
    () =>
      selectedDeptId === 'dept-all'
        ? posts
        : posts.filter((p) => p.departmentId === selectedDeptId),
    [posts, selectedDeptId]
  );

  const latestCeoPost = useMemo(
    () => posts.find((p) => p.author?.id === 'user-ceo'),
    [posts]
  );

  const feedPosts = useMemo(
    () => filteredPosts.filter((p) => p.author?.id !== 'user-ceo'),
    [filteredPosts]
  );

  const value = useMemo<FeedContextType>(
    () => ({
      posts,
      feedPosts,
      latestCeoPost,
      stories,
      notifications,
      unreadCount,
      selectedDeptId,
      postCounts,
      selectedPostId,
      selectedPostForDetail,
      activeCommentPost,
      activeResharePost,
      activeQuotePost,
      commentsByPost,
      toast,
      hasMorePosts,
      isLoadingMore,
      loadMorePosts,
      setToast,
      setNotifications,
      markAllNotificationsAsRead,
      setSelectedDeptId,
      setSelectedPostId,
      setPosts,
      setStories,
      setCommentsByPost,
      handleLikeToggle,
      handleBookmarkToggle,
      handleVotePoll,
      handleReactionSelect,
      handleReshareToggle,
      handleQuotePost,
      handleSharePost,
      handleAddComment,
      handleDeletePost,
      handleUpdatePost,
      handlePublishPost,
      handleDeleteStory,
      handleOpenPostDetail,
    }),
    [
      posts,
      feedPosts,
      latestCeoPost,
      stories,
      notifications,
      unreadCount,
      selectedDeptId,
      postCounts,
      selectedPostId,
      selectedPostForDetail,
      activeCommentPost,
      activeResharePost,
      activeQuotePost,
      commentsByPost,
      toast,
      hasMorePosts,
      isLoadingMore,
      loadMorePosts,
      markAllNotificationsAsRead,
      handleLikeToggle,
      handleBookmarkToggle,
      handleVotePoll,
      handleReactionSelect,
      handleReshareToggle,
      handleQuotePost,
      handleSharePost,
      handleAddComment,
      handleDeletePost,
      handleUpdatePost,
      handlePublishPost,
      handleDeleteStory,
      handleOpenPostDetail,
    ]
  );

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
};

// oxlint-disable-next-line react/only-export-components
export function useFeed(): FeedContextType {
  const ctx = useContext(FeedContext);
  if (!ctx) {
    throw new Error('useFeed must be used within a FeedProvider');
  }
  return ctx;
}
