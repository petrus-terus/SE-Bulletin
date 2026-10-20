import type { Comment, CreatePostPayload, Employee, EmojiReactionType, Post } from '@/types/bulletin';
import { bulletinService } from '@/services/bulletinService';
import { saveBookmarkedPostId } from '@/services/bookmarkStorage';
import { getAvatarInitials } from '@/services/rowMappers';

interface UsePostActionsParams {
  currentUser: Employee | null;
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  setCommentsByPost: React.Dispatch<React.SetStateAction<Record<string, import('@/types/bulletin').Comment[]>>>;
  setSelectedPostId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveCommentPostId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveResharePostId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveQuotePostId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingPost: React.Dispatch<React.SetStateAction<Post | null>>;
  setToast: (toast: { message: string; icon?: string } | null) => void;
  selectedPostId: string | null;
  activeCommentPostId: string | null;
  activeResharePostId: string | null;
  activeQuotePostId: string | null;
}

export function usePostActions({
  currentUser,
  posts,
  setPosts,
  setCommentsByPost,
  setSelectedPostId,
  setActiveCommentPostId,
  setActiveResharePostId,
  setActiveQuotePostId,
  setEditingPost,
  setToast,
  selectedPostId,
  activeCommentPostId,
  activeResharePostId,
  activeQuotePostId,
}: UsePostActionsParams) {
  // Optimistic Like Handler with Supabase Cloud Sync
  const handleLikeToggle = (postId: string) => {
    let nextIsLiked = false;
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          nextIsLiked = !post.isLiked;
          const nextCount = nextIsLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1);
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
  };

  // Bookmark Toggle with local persistence
  const handleBookmarkToggle = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const nextSaved = !post.isBookmarked;
          saveBookmarkedPostId(postId, nextSaved);
          setToast({
            message: nextSaved ? 'Saved to bookmarks' : 'Removed from bookmarks',
            icon: 'bookmark',
          });
          return { ...post, isBookmarked: nextSaved };
        }
        return post;
      })
    );
  };

  // Poll Vote Handler (Interactive Vote & Deselect with Supabase Cloud Sync)
  const handleVotePoll = (postId: string, optionId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId && post.poll) {
          const currentVoted = post.poll.userVotedOptionId;

          // If tapping on the already-voted option, deselect it!
          if (currentVoted === optionId) {
            const updatedOptions = post.poll.options.map((opt) => {
              if (opt.id === optionId) {
                return { ...opt, votes: Math.max(0, opt.votes - 1) };
              }
              return opt;
            });
            const totalVotes = Math.max(0, post.poll.totalVotes - 1);

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

          const totalVotes = currentVoted
            ? post.poll.totalVotes
            : post.poll.totalVotes + 1;

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
  };

  // Emoji Reaction Handler (😂, 🔥, 👏, 😭) with Supabase Cloud Sync
  const handleReactionSelect = (postId: string, reaction: EmojiReactionType) => {
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

          const nextLikesCount = !post.isLiked ? post.likesCount + 1 : post.likesCount;

          bulletinService.updatePost(postId, {
            reactions: updatedReactions,
            likesCount: nextLikesCount,
          });

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
  };

  // Reshare / Repost Toggle Handler with Supabase Cloud Sync
  const handleReshareToggle = (postId: string) => {
    if (!currentUser) return;
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const nextReshared = !post.isReshared;
          const nextCount = nextReshared
            ? (post.resharesCount || 0) + 1
            : Math.max(0, (post.resharesCount || 0) - 1);

          bulletinService.updatePost(postId, {
            resharesCount: nextCount,
          });

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
  };

  // Quote Post Handler with Supabase Cloud Sync
  const handleQuotePost = async (quotedPost: Post, commentText: string) => {
    if (!currentUser) return;
    const payload: CreatePostPayload = {
      title: '',
      content: commentText,
      department: currentUser.department,
      departmentId: currentUser.adminDepartments?.[0] || 'dept-ops',
      quotedPost: quotedPost,
    };

    const newQuotePost = await bulletinService.createPost(payload, currentUser);
    const updatedReshares = (quotedPost.resharesCount || 0) + 1;

    // Dedupe: realtime INSERT may have already added this quote post.
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

    bulletinService.updatePost(quotedPost.id, {
      resharesCount: updatedReshares,
    });

    setToast({
      message: 'Quote bulletin published!',
      icon: 'edit_note',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Share Post Handler
  const handleSharePost = (post: Post) => {
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
  };

  // Add Comment Handler with Optimistic UI & Supabase Cloud Sync
  const handleAddComment = async (postId: string, commentText: string) => {
    if (!currentUser) return;
    const targetPost = posts.find((p) => p.id === postId);
    const currentCount = targetPost ? targetPost.commentsCount : 0;
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
        currentUser,
        currentCount
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
  };

  // Publish New Post Handler
  const handlePublishPost = (newPost: Post) => {
    // Realtime INSERT may have already delivered this post — dedupe to avoid
    // duplicate React keys (the same id appearing twice in the feed).
    setPosts((prev) =>
      prev.some((p) => p.id === newPost.id) ? prev : [newPost, ...prev]
    );
    setToast({
      message: 'Bulletin posted successfully',
      icon: 'campaign',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete Post Handler
  const handleDeletePost = async (postId: string) => {
    const postToDelete = posts.find((p) => p.id === postId);

    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (selectedPostId === postId) {
      setSelectedPostId(null);
    }
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
    }
    if (activeResharePostId === postId) {
      setActiveResharePostId(null);
    }
    if (activeQuotePostId === postId) {
      setActiveQuotePostId(null);
    }

    try {
      await bulletinService.deletePost(postId);
      setToast({
        message: 'Bulletin deleted',
        icon: 'delete',
      });
    } catch {
      if (postToDelete) {
        setPosts((prev) => [postToDelete, ...prev].sort((a, b) => b.id.localeCompare(a.id)));
      }
      setToast({
        message: 'Failed to delete bulletin',
        icon: 'error',
      });
    }
  };

  // Update Post Handler
  const handleUpdatePost = async (postId: string, updatedData: Partial<Post>) => {
    const oldPost = posts.find((p) => p.id === postId);

    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
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
        setPosts((prev) => prev.map((p) => (p.id === postId ? oldPost : p)));
      }
      setToast({
        message: 'Failed to update bulletin',
        icon: 'error',
      });
    }
  };

  // Open Post Detail with deduplicated view count tracking
  const handleOpenPostDetail = (post: Post) => {
    if (!bulletinService.isPostViewedInSession(post.id)) {
      bulletinService.recordPostView(post.id);
      const updatedViews = (post.viewsCount || 0) + 1;
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, viewsCount: updatedViews } : p))
      );
    }
    setSelectedPostId(post.id);
  };

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
