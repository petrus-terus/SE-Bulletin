import { useCallback } from 'react';
import type { Comment, CreatePostPayload, Employee, EmojiReactionType, Post, ToastMessage } from '@/types/bulletin';
import { bulletinService } from '@/services/bulletinService';
import { saveBookmarkedPostId } from '@/services/bookmarkStorage';
import { setPostLiked } from '@/services/likeStorage';
import { saveStoredPollVote } from '@/services/pollStorage';
import { getAvatarInitials } from '@/services/rowMappers';
import { DEFAULT_DEPARTMENT_ID } from '@/constants/bulletin';

interface UsePostActionsParams {
  currentUser: Employee | null;
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  setCommentsByPost: React.Dispatch<React.SetStateAction<Record<string, Comment[]>>>;
  setSelectedPostId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveCommentPostId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveResharePostId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveQuotePostId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingPost: React.Dispatch<React.SetStateAction<Post | null>>;
  setToast: React.Dispatch<React.SetStateAction<ToastMessage | null>>;
}

export function usePostActions({
  currentUser,
  setPosts,
  setCommentsByPost,
  setSelectedPostId,
  setActiveCommentPostId,
  setActiveResharePostId,
  setActiveQuotePostId,
  setEditingPost,
  setToast,
}: UsePostActionsParams) {
  const userId = currentUser?.id;

  // Optimistic Like Handler with Supabase Atomic Counter Sync
  const handleLikeToggle = useCallback(
    (postId: string) => {
      let nextIsLiked = false;
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            nextIsLiked = !post.isLiked;
            const nextCount = nextIsLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1);
            setPostLiked(postId, nextIsLiked, userId);
            return {
              ...post,
              isLiked: nextIsLiked,
              likesCount: nextCount,
            };
          }
          return post;
        })
      );

      bulletinService.toggleLike(postId, nextIsLiked);
      bulletinService.adjustPostCounter(postId, 'likes_count', nextIsLiked ? 1 : -1);
    },
    [setPosts, userId]
  );

  // Bookmark Toggle with user-scoped local persistence
  const handleBookmarkToggle = useCallback(
    (postId: string) => {
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            const nextSaved = !post.isBookmarked;
            saveBookmarkedPostId(postId, nextSaved, userId);
            setToast({
              message: nextSaved ? 'Saved to bookmarks' : 'Removed from bookmarks',
              icon: 'bookmark',
            });
            return { ...post, isBookmarked: nextSaved };
          }
          return post;
        })
      );
    },
    [setPosts, setToast, userId]
  );

  // Poll Vote Handler (Interactive Vote & Deselect with Supabase Cloud Sync)
  const handleVotePoll = useCallback(
    (postId: string, optionId: string) => {
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId && post.poll) {
            const currentVoted = post.poll.userVotedOptionId;

            if (currentVoted === optionId) {
              const updatedOptions = post.poll.options.map((opt) => {
                if (opt.id === optionId) {
                  return { ...opt, votes: Math.max(0, opt.votes - 1) };
                }
                return opt;
              });
              const totalVotes = Math.max(0, post.poll.totalVotes - 1);

              saveStoredPollVote(postId, undefined, userId);
              setToast({
                message: 'Vote removed from poll',
                icon: 'undo',
              });

              const updatedPoll = {
                ...post.poll,
                options: updatedOptions,
                totalVotes,
                userVotedOptionId: undefined,
              };

              bulletinService.updatePost(postId, { poll: updatedPoll });

              return {
                ...post,
                poll: updatedPoll,
              };
            }

            const updatedOptions = post.poll.options.map((opt) => {
              if (opt.id === optionId) {
                return { ...opt, votes: opt.votes + 1 };
              }
              if (currentVoted && opt.id === currentVoted) {
                return { ...opt, votes: Math.max(0, opt.votes - 1) };
              }
              return opt;
            });

            const totalVotes = currentVoted ? post.poll.totalVotes : post.poll.totalVotes + 1;

            saveStoredPollVote(postId, optionId, userId);
            setToast({
              message: currentVoted ? 'Vote changed' : 'Vote submitted to SE poll',
              icon: 'how_to_vote',
            });

            const updatedPoll = {
              ...post.poll,
              options: updatedOptions,
              totalVotes,
              userVotedOptionId: optionId,
            };

            bulletinService.updatePost(postId, { poll: updatedPoll });

            return {
              ...post,
              poll: updatedPoll,
            };
          }
          return post;
        })
      );
    },
    [setPosts, setToast, userId]
  );

  // Emoji Reaction Handler (😂, 🔥, 👏, 😭) with Supabase Cloud Sync
  const handleReactionSelect = useCallback(
    (postId: string, reaction: EmojiReactionType) => {
      let wasUnliked = false;
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            const oldReaction = post.userReaction;
            const currentReactions = post.reactions || { laugh: 0, fire: 0, clap: 0, cry: 0 };
            const updatedReactions = { ...currentReactions };

            if (oldReaction && updatedReactions[oldReaction] > 0) {
              updatedReactions[oldReaction] = Math.max(0, updatedReactions[oldReaction] - 1);
            }
            updatedReactions[reaction] = (updatedReactions[reaction] || 0) + 1;

            wasUnliked = !post.isLiked;
            const nextLikesCount = wasUnliked ? post.likesCount + 1 : post.likesCount;
            if (wasUnliked) {
              setPostLiked(postId, true, userId);
            }

            bulletinService.updatePost(postId, {
              reactions: updatedReactions,
            });
            if (wasUnliked) {
              bulletinService.adjustPostCounter(postId, 'likes_count', 1);
            }

            const emojiMap: Record<EmojiReactionType, string> = {
              laugh: '😂',
              fire: '🔥',
              clap: '👏',
              cry: '😭',
            };

            setToast({
              message: `Reacted with ${emojiMap[reaction]}`,
              icon: 'mood',
            });

            return {
              ...post,
              isLiked: true,
              likesCount: nextLikesCount,
              userReaction: reaction,
              reactions: updatedReactions,
            };
          }
          return post;
        })
      );
    },
    [setPosts, setToast, userId]
  );

  // Reshare / Repost Toggle Handler with Supabase Atomic Counter Sync
  const handleReshareToggle = useCallback(
    (postId: string) => {
      if (!currentUser) return;
      let nextReshared = false;
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            nextReshared = !post.isReshared;
            const nextCount = nextReshared
              ? (post.resharesCount || 0) + 1
              : Math.max(0, (post.resharesCount || 0) - 1);

            setToast({
              message: nextReshared ? 'Reposted to your profile & feed' : 'Removed repost',
              icon: 'repeat',
            });

            return {
              ...post,
              isReshared: nextReshared,
              resharesCount: nextCount,
              resharedBy: nextReshared
                ? {
                    id: currentUser.id,
                    name: currentUser.name,
                    designation: currentUser.designation,
                    avatarUrl: currentUser.avatarUrl,
                  }
                : undefined,
            };
          }
          return post;
        })
      );

      bulletinService.adjustPostCounter(postId, 'reshares_count', nextReshared ? 1 : -1);
    },
    [currentUser, setPosts, setToast]
  );

  // Quote Post Handler with Supabase Cloud Sync
  const handleQuotePost = useCallback(
    async (quotedPost: Post, commentText: string) => {
      if (!currentUser) return;
      const payload: CreatePostPayload = {
        title: '',
        content: commentText,
        department: currentUser.department,
        departmentId: currentUser.adminDepartments?.[0] || DEFAULT_DEPARTMENT_ID,
        quotedPost: quotedPost,
      };

      const newQuotePost = await bulletinService.createPost(payload, currentUser);
      const updatedReshares = (quotedPost.resharesCount || 0) + 1;

      setPosts((prev) =>
        prev.some((p) => p.id === newQuotePost.id)
          ? prev.map((p) =>
              p.id === quotedPost.id ? { ...p, resharesCount: updatedReshares } : p
            )
          : [
              newQuotePost,
              ...prev.map((p) =>
                p.id === quotedPost.id ? { ...p, resharesCount: updatedReshares } : p
              ),
            ]
      );

      await bulletinService.adjustPostCounter(quotedPost.id, 'reshares_count', 1);

      setToast({
        message: 'Quote bulletin published!',
        icon: 'edit_note',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [currentUser, setPosts, setToast]
  );

  // Share Post Handler
  const handleSharePost = useCallback(
    (post: Post) => {
      const url = `${window.location.origin}/#post-${post.id}`;
      if (navigator.share) {
        navigator
          .share({
            title: post.title || 'SE-Connect',
            text: post.content.slice(0, 100),
            url,
          })
          .catch(() => {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).catch(() => {});
        setToast({
          message: 'Link copied to clipboard!',
          icon: 'link',
        });
      }
    },
    [setToast]
  );

  // Add Comment Handler with Optimistic UI & Supabase Cloud Sync
  const handleAddComment = useCallback(
    async (postId: string, commentText: string) => {
      if (!currentUser) return;
      const tempId = `temp-c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const optimisticComment: Comment = {
        id: tempId,
        authorName: currentUser.name,
        department: currentUser.department,
        avatarUrl: currentUser.avatarUrl,
        avatarInitials: getAvatarInitials(currentUser.name),
        text: commentText,
        timestamp: 'Just now',
        likesCount: 0,
      };

      // 1. Optimistic insertion
      setCommentsByPost((prev) => {
        const existing = prev[postId] || [];
        return {
          ...prev,
          [postId]: [...existing, optimisticComment],
        };
      });

      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              commentsCount: post.commentsCount + 1,
              previewComment: optimisticComment,
            };
          }
          return post;
        })
      );

      try {
        const newComment = await bulletinService.addComment(
          postId,
          commentText,
          currentUser
        );

        // 2. Reconcile temporary comment with persistent cloud comment
        setCommentsByPost((prev) => {
          const existing = prev[postId] || [];
          if (existing.some((c) => c.id === newComment.id)) {
            return {
              ...prev,
              [postId]: existing.filter((c) => c.id !== tempId),
            };
          }
          return {
            ...prev,
            [postId]: existing.map((c) => (c.id === tempId ? newComment : c)),
          };
        });

        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId && post.previewComment?.id === tempId) {
              return {
                ...post,
                previewComment: newComment,
              };
            }
            return post;
          })
        );

        setToast({
          message: 'Comment posted',
          icon: 'chat',
        });
      } catch {
        // Rollback on failure
        setCommentsByPost((prev) => {
          const existing = prev[postId] || [];
          return {
            ...prev,
            [postId]: existing.filter((c) => c.id !== tempId),
          };
        });

        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                commentsCount: Math.max(0, post.commentsCount - 1),
              };
            }
            return post;
          })
        );

        setToast({
          message: 'Failed to post comment',
          icon: 'error',
        });
      }
    },
    [currentUser, setCommentsByPost, setPosts, setToast]
  );

  // Publish New Post Handler
  const handlePublishPost = useCallback(
    (newPost: Post) => {
      setPosts((prev) =>
        prev.some((p) => p.id === newPost.id) ? prev : [newPost, ...prev]
      );
      setToast({
        message: 'Bulletin posted successfully',
        icon: 'campaign',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setPosts, setToast]
  );

  // Delete Post Handler
  const handleDeletePost = useCallback(
    async (postId: string) => {
      let postToDelete: Post | undefined;

      setPosts((prev) => {
        postToDelete = prev.find((p) => p.id === postId);
        return prev.filter((p) => p.id !== postId);
      });
      setSelectedPostId((prev) => (prev === postId ? null : prev));
      setActiveCommentPostId((prev) => (prev === postId ? null : prev));
      setActiveResharePostId((prev) => (prev === postId ? null : prev));
      setActiveQuotePostId((prev) => (prev === postId ? null : prev));

      try {
        await bulletinService.deletePost(postId);
        setToast({
          message: 'Bulletin deleted',
          icon: 'delete',
        });
      } catch {
        if (postToDelete) {
          const restored = postToDelete;
          setPosts((prev) => [restored, ...prev].sort((a, b) => b.id.localeCompare(a.id)));
        }
        setToast({
          message: 'Failed to delete bulletin',
          icon: 'error',
        });
      }
    },
    [
      setPosts,
      setSelectedPostId,
      setActiveCommentPostId,
      setActiveResharePostId,
      setActiveQuotePostId,
      setToast,
    ]
  );

  // Update Post Handler
  const handleUpdatePost = useCallback(
    async (postId: string, updatedData: Partial<Post>) => {
      let oldPost: Post | undefined;

      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId) {
            oldPost = p;
            return {
              ...p,
              ...updatedData,
              isEdited: true,
              editedAt: new Date().toISOString(),
            };
          }
          return p;
        })
      );

      try {
        await bulletinService.updatePost(postId, {
          ...updatedData,
          isEdited: true,
          editedAt: new Date().toISOString(),
        });
        setToast({
          message: 'Bulletin updated successfully',
          icon: 'check_circle',
        });
        setEditingPost(null);
      } catch {
        if (oldPost) {
          const restored = oldPost;
          setPosts((prev) => prev.map((p) => (p.id === postId ? restored : p)));
        }
        setToast({
          message: 'Failed to update bulletin',
          icon: 'error',
        });
      }
    },
    [setEditingPost, setPosts, setToast]
  );

  // Open Post Detail with deduplicated view count tracking
  const handleOpenPostDetail = useCallback(
    (post: Post) => {
      if (!bulletinService.isPostViewedInSession(post.id)) {
        bulletinService.recordPostView(post.id);
        const updatedViews = (post.viewsCount || 0) + 1;
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, viewsCount: updatedViews } : p))
        );
      }
      setSelectedPostId(post.id);
    },
    [setPosts, setSelectedPostId]
  );

  return {
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
  };
}
