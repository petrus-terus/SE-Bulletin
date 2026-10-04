import { useState, useEffect } from 'react';
import type { Comment, Employee, EmojiReactionType, Post, Story } from './types/bulletin';
import { CURRENT_USER, DEPARTMENTS, INITIAL_POSTS, INITIAL_STORIES, getEmployeeByAuthor } from './services/mockData';
import { bulletinService } from './services/bulletinService';
import { isSupabaseConfigured, supabase } from './services/supabaseClient';
import { AppShell } from './components/AppShell';
import { TopAppBar } from './components/TopAppBar';
import { KinabaluSkylineHero } from './components/KinabaluSkylineHero';
import { StoriesBar } from './components/StoriesBar';
import { DepartmentFilters } from './components/DepartmentFilters';
import { FeedCard } from './components/FeedCard';
import { BottomNav } from './components/BottomNav';
import type { TabKey } from './components/BottomNav';
import { CommentDrawer } from './components/CommentDrawer';
import { CreateBulletinPage } from './components/CreateBulletinPage';
import { CreateStoryModal } from './components/CreateStoryModal';
import { TrendingSection } from './components/TrendingSection';
import { SesiKnowledgeHubBanner } from './components/SesiKnowledgeHubBanner';
import { CeoWisdomSection } from './components/CeoWisdomSection';
import { SearchDirectoryPage } from './components/SearchDirectoryPage';
import { ProfilePage } from './components/ProfilePage';
import { DesktopSidebar } from './components/DesktopSidebar';
import { DesktopWidgetsRail } from './components/DesktopWidgetsRail';
import { Toast } from './components/Toast';
import { PostDetailView } from './components/PostDetailView';
import { ImageViewerModal } from './components/ImageViewerModal';
import { LoginPage } from './components/LoginPage';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { BrandSidebarDrawer } from './components/BrandSidebarDrawer';
import { SavedPostsDrawer } from './components/SavedPostsDrawer';
import { ReshareBottomSheet } from './components/ReshareBottomSheet';
import { QuoteBulletinModal } from './components/QuoteBulletinModal';

export function App() {
  const [currentUser, setCurrentUser] = useState<Employee>(() => {
    const saved = localStorage.getItem('sesb_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return CURRENT_USER;
      }
    }
    return CURRENT_USER;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('sesb_auth') === 'true';
  });
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({
    'post-101': [
      {
        id: 'c1',
        authorName: 'Siti Aminah',
        department: 'HR',
        avatarInitials: 'SA',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
        text: 'Congratulations team! Exemplary safety compliance during the shut-in window.',
        timestamp: '1h ago',
        likesCount: 14,
      },
      {
        id: 'c2',
        authorName: 'Mohd Irfan',
        department: 'IT',
        avatarInitials: 'MI',
        avatarUrl: CURRENT_USER.avatarUrl,
        text: 'Grid telemetry sensors are streaming real-time SCADA telemetry back to Wisma SESB server room without any packet drops.',
        timestamp: '45m ago',
        likesCount: 7,
      },
    ],
    'post-102': [
      {
        id: 'c3',
        authorName: 'Ir. Raymond Chin',
        department: 'OPS',
        avatarInitials: 'RC',
        text: 'Noted. Transmission crews across Tenom and Papar have been briefed on SOP-2026-04.',
        timestamp: '2h ago',
        likesCount: 5,
      },
    ],
    'post-103': [
      {
        id: 'c4',
        authorName: 'Ir. Raymond Chin',
        department: 'OPS',
        avatarInitials: 'RC',
        text: 'Engineering team has formed 4 relay groups. Looking forward to it!',
        timestamp: '3h ago',
        likesCount: 8,
      },
    ],
  });
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
  const [selectedDeptId, setSelectedDeptId] = useState('dept-all');
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [unreadCount, setUnreadCount] = useState(3);
  const [viewedProfileEmployee, setViewedProfileEmployee] = useState<Employee | null>(null);
  const [previousTab, setPreviousTab] = useState<TabKey>('home');

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [isBrandSidebarOpen, setIsBrandSidebarOpen] = useState(false);
  const [isSavedPostsOpen, setIsSavedPostsOpen] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);
  const [activeResharePost, setActiveResharePost] = useState<Post | null>(null);
  const [activeQuotePost, setActiveQuotePost] = useState<Post | null>(null);
  const [toast, setToast] = useState<{ message: string; icon?: string } | null>(null);
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<Post | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    title?: string;
    location?: string | null;
  } | null>(null);

  // Corporate Staff Logout Handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('sesb_auth');
    setToast({
      message: 'Logged out. Ready for new staff login.',
      icon: 'logout',
    });
  };

  // 1. Initial Load from BulletinService / Supabase
  useEffect(() => {
    bulletinService.getPosts().then((fetched) => {
      if (fetched && fetched.length > 0) {
        setPosts(fetched);
      }
    });
  }, []);

  // 2. Real-time Cloud Synchronization (Posts, Likes, and Comments)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('realtime:bulletin-live')
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
              avatarUrl: row.author_avatar || '/user_face.png',
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
            isLiked: false,
            isBookmarked: false,
            departmentId: row.department_id || 'dept-ops',
            departmentName: row.department,
            departmentColor: row.department_color || '#0055A4',
            officialNotice: Boolean(row.official_notice),
          };

          setPosts((prev) => [livePost, ...prev.filter((p) => p.id !== livePost.id)]);
          setToast({
            message: `New bulletin: "${row.title.slice(0, 26)}..."`,
            icon: 'campaign',
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = payload.new as any;
          setPosts((prev) =>
            prev.map((post) =>
              post.id === row.id
                ? {
                    ...post,
                    likesCount: Number(row.likes_count ?? post.likesCount),
                    commentsCount: Number(row.comments_count ?? post.commentsCount),
                  }
                : post
            )
          );
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
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleViewAuthorProfile = (author: {
    id?: string;
    name: string;
    avatarUrl?: string;
    designation?: string;
    department?: string;
  }) => {
    const emp = getEmployeeByAuthor(author);
    setViewedProfileEmployee(emp);
    setPreviousTab(activeTab);
    setSelectedPostForDetail(null);
    setActiveCommentPost(null);
    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch cloud comments when CommentDrawer opens
  const activeCommentPostId = activeCommentPost?.id;
  useEffect(() => {
    if (!activeCommentPostId) return;
    bulletinService.getComments(activeCommentPostId).then((cloudComments) => {
      if (cloudComments && cloudComments.length > 0) {
        setCommentsByPost((prev) => {
          const existing = prev[activeCommentPostId] || [];
          const existingIds = new Set(existing.map((c) => c.id));
          const merged = [...existing, ...cloudComments.filter((c) => !existingIds.has(c.id))];
          return {
            ...prev,
            [activeCommentPostId]: merged,
          };
        });
      }
    });
  }, [activeCommentPostId]);

  // Calculate post counts per official Bahagian
  const postCounts: Record<string, number> = {
    total: posts.length,
    ...DEPARTMENTS.reduce((acc, dept) => {
      acc[dept.id] = posts.filter((p) => p.departmentId === dept.id).length;
      return acc;
    }, {} as Record<string, number>),
  };

  // Filtered posts based on active pill
  const filteredPosts =
    selectedDeptId === 'dept-all'
      ? posts
      : posts.filter((p) => p.departmentId === selectedDeptId);

  // CEO Wisdom post (latest post authored by the CEO)
  const latestCeoPost = posts.find((p) => p.author?.id === 'user-ceo');

  // Filtered posts for the general feed stream (excluding CEO posts to prevent duplication under CEO Wisdom)
  const feedPosts = filteredPosts.filter((p) => p.author?.id !== 'user-ceo');

  // Optimistic Like Handler with Supabase Cloud Sync
  const handleLikeToggle = (postId: string) => {
    let nextCount = 0;
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const nextIsLiked = !post.isLiked;
          nextCount = nextIsLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1);
          return {
            ...post,
            isLiked: nextIsLiked,
            likesCount: nextCount,
          };
        }
        return post;
      })
    );

    bulletinService.toggleLike(postId, nextCount);
  };

  // Bookmark Toggle
  const handleBookmarkToggle = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const nextSaved = !post.isBookmarked;
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

  // Poll Vote Handler (Interactive Vote & Deselect)
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

            return {
              ...post,
              poll: {
                ...post.poll,
                options: updatedOptions,
                totalVotes,
                userVotedOptionId: undefined,
              },
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
            message: currentVoted ? 'Vote changed' : 'Vote submitted to SESB poll',
            icon: 'how_to_vote',
          });

          return {
            ...post,
            poll: {
              ...post.poll,
              options: updatedOptions,
              totalVotes,
              userVotedOptionId: optionId,
            },
          };
        }
        return post;
      })
    );
  };

  // Emoji Reaction Handler (😂, 🔥, 👏, 😭)
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

  // Reshare / Repost Toggle Handler (Twitter Style)
  const handleReshareToggle = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const nextReshared = !post.isReshared;
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
  };

  // Quote Post Handler (Twitter Style)
  const handleQuotePost = (quotedPost: Post, commentText: string) => {
    const newQuotePost: Post = {
      id: `post-quote-${Date.now()}`,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        designation: currentUser.designation,
        department: currentUser.department,
        avatarUrl: currentUser.avatarUrl,
        isVerified: true,
      },
      timestamp: 'Just now',
      title: '',
      content: commentText,
      quotedPost: quotedPost,
      location: currentUser.officeLocation || 'Bangunan KWASA',
      isPinned: false,
      commentsEnabled: true,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      resharesCount: 0,
      viewsCount: 1,
      isLiked: false,
      isBookmarked: false,
      isReshared: false,
      departmentId: currentUser.adminDepartments?.[0] || 'dept-id',
      departmentName: currentUser.department,
      departmentColor: '#003E7A',
    };

    setPosts((prev) => [
      newQuotePost,
      ...prev.map((p) =>
        p.id === quotedPost.id ? { ...p, resharesCount: (p.resharesCount || 0) + 1 } : p
      ),
    ]);

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
          title: post.title || 'Sabah Electricity Bulletin',
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


  // Add Comment Handler with Supabase Cloud Sync
  const handleAddComment = async (postId: string, commentText: string) => {
    const targetPost = posts.find((p) => p.id === postId);
    const currentCount = targetPost ? targetPost.commentsCount : 0;

    const newComment = await bulletinService.addComment(
      postId,
      commentText,
      currentUser,
      currentCount
    );

    setCommentsByPost((prev) => {
      const existing = prev[postId] || [];
      if (existing.some((c) => c.id === newComment.id)) return prev;
      return {
        ...prev,
        [postId]: [...existing, newComment],
      };
    });

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            commentsCount: post.commentsCount + 1,
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
  };

  // Publish New Post Handler (4A)
  const handlePublishPost = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
    setToast({
      message: 'Bulletin posted successfully',
      icon: 'campaign',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete Post Handler (with optimistic removal and Supabase cloud sync)
  const handleDeletePost = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (selectedPostForDetail?.id === postId) {
      setSelectedPostForDetail(null);
    }
    if (activeCommentPost?.id === postId) {
      setActiveCommentPost(null);
    }
    setToast({
      message: 'Bulletin deleted',
      icon: 'delete',
    });

    await bulletinService.deletePost(postId);
  };

  // Update Post Handler (with optimistic update, edited timestamp, and Supabase cloud sync)
  const handleUpdatePost = async (postId: string, updatedData: Partial<Post>) => {
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

    if (selectedPostForDetail?.id === postId) {
      setSelectedPostForDetail((prev) =>
        prev
          ? {
              ...prev,
              ...updatedData,
              isEdited: true,
              editedAt: new Date().toISOString(),
            }
          : null
      );
    }

    setToast({
      message: 'Bulletin updated successfully',
      icon: 'check_circle',
    });

    await bulletinService.updatePost(postId, updatedData);
    setEditingPost(null);
  };

  // Update Profile Handler with local persistence and live cascade across bulletins/comments
  const handleUpdateProfile = (updatedUser: Employee) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('sesb_user', JSON.stringify(updatedUser));

    // Cascade updated name, designation, department, and avatar to user's authored bulletins
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        const isAuthored =
          (p.author?.id && updatedUser.id && p.author.id === updatedUser.id) ||
          (p.author?.name || '').toLowerCase().trim() === (currentUser.name || '').toLowerCase().trim();

        if (isAuthored) {
          return {
            ...p,
            author: {
              ...p.author,
              id: updatedUser.id,
              name: updatedUser.name,
              designation: updatedUser.designation,
              department: updatedUser.department,
              avatarUrl: updatedUser.avatarUrl,
            },
            departmentName: updatedUser.department,
          };
        }
        return p;
      })
    );

    // Cascade to user's authored comments
    setCommentsByPost((prevMap) => {
      const updatedMap = { ...prevMap };
      for (const postId in updatedMap) {
        updatedMap[postId] = updatedMap[postId].map((c) => {
          if (c.authorName.toLowerCase().trim() === (currentUser.name || '').toLowerCase().trim()) {
            return {
              ...c,
              authorName: updatedUser.name,
              department: updatedUser.department,
              avatarUrl: updatedUser.avatarUrl,
            };
          }
          return c;
        });
      }
      return updatedMap;
    });

    setToast({
      message: 'Profile updated successfully',
      icon: 'manage_accounts',
    });
  };

  // Open Post Detail with deduplicated view count tracking
  const handleOpenPostDetail = (post: Post) => {
    if (!bulletinService.isPostViewedInSession(post.id)) {
      bulletinService.recordPostView(post.id);
      const updatedViews = (post.viewsCount || 0) + 1;
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, viewsCount: updatedViews } : p))
      );
      setSelectedPostForDetail({
        ...post,
        viewsCount: updatedViews,
      });
    } else {
      setSelectedPostForDetail(post);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage
          onLogin={(employee) => {
            setCurrentUser(employee);
            setIsAuthenticated(true);
            localStorage.setItem('sesb_auth', 'true');
            localStorage.setItem('sesb_user', JSON.stringify(employee));
            setToast({
              message: `Welcome back, ${employee.name}`,
              icon: 'verified_user',
            });
          }}
          onShowNotice={(msg) => setToast({ message: msg, icon: 'info' })}
        />
        {toast && (
          <Toast
            message={toast.message}
            icon={toast.icon}
            onDismiss={() => setToast(null)}
          />
        )}
        <PwaInstallPrompt />
      </>
    );
  }

  return (
    <>
      {/* Sticky Corporate Top App Bar */}
      <TopAppBar
        currentUser={currentUser}
        unreadCount={unreadCount}
        onNotificationClick={() => setActiveTab('notifications')}
        onBrandClick={() => setIsBrandSidebarOpen(true)}
        onProfileClick={() => {
          setViewedProfileEmployee(null);
          setActiveTab('profile');
        }}
      />

      {/* Main Container Shell with Multi-Screen Responsive Layout */}
      <AppShell
        sidebar={
          <DesktopSidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              setSelectedPostForDetail(null);
              if (tab === 'profile') setViewedProfileEmployee(null);
              setActiveTab(tab);
            }}
            onCreateClick={() => setIsCreateOpen(true)}
            currentUser={currentUser}
            unreadCount={unreadCount}
          />
        }
        rightRail={<DesktopWidgetsRail />}
      >
        {selectedPostForDetail ? (
          <PostDetailView
            post={selectedPostForDetail}
            onBack={() => setSelectedPostForDetail(null)}
            onAuthorClick={handleViewAuthorProfile}
            onLikeToggle={(postId) => {
              handleLikeToggle(postId);
              setSelectedPostForDetail((prev) =>
                prev && prev.id === postId
                  ? {
                      ...prev,
                      isLiked: !prev.isLiked,
                      likesCount: !prev.isLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1),
                    }
                  : prev
              );
            }}
            onBookmarkToggle={(postId) => {
              handleBookmarkToggle(postId);
              setSelectedPostForDetail((prev) =>
                prev && prev.id === postId ? { ...prev, isBookmarked: !prev.isBookmarked } : prev
              );
            }}
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
            currentUserRole={currentUser.role}
            onDeletePost={handleDeletePost}
            onEditPost={(post) => setEditingPost(post)}
            onImageClick={(imageUrl, title, location) => {
              setLightboxImage({ url: imageUrl, title, location });
            }}
            onAddComment={(postId, text) => {
              handleAddComment(postId, text);
              setSelectedPostForDetail((prev) =>
                prev && prev.id === postId
                  ? { ...prev, commentsCount: prev.commentsCount + 1 }
                  : prev
              );
            }}
            onVotePoll={(postId, optionId) => {
              handleVotePoll(postId, optionId);
              setSelectedPostForDetail((prev) => {
                if (prev && prev.id === postId && prev.poll) {
                  const currentVoted = prev.poll.userVotedOptionId;
                  if (currentVoted === optionId) {
                    const updatedOptions = prev.poll.options.map((opt) => {
                      if (opt.id === optionId) return { ...opt, votes: Math.max(0, opt.votes - 1) };
                      return opt;
                    });
                    return {
                      ...prev,
                      poll: {
                        ...prev.poll,
                        options: updatedOptions,
                        totalVotes: Math.max(0, prev.poll.totalVotes - 1),
                        userVotedOptionId: undefined,
                      },
                    };
                  }
                  const updatedOptions = prev.poll.options.map((opt) => {
                    if (opt.id === optionId) return { ...opt, votes: opt.votes + 1 };
                    if (currentVoted && opt.id === currentVoted) return { ...opt, votes: Math.max(0, opt.votes - 1) };
                    return opt;
                  });
                  return {
                    ...prev,
                    poll: {
                      ...prev.poll,
                      options: updatedOptions,
                      totalVotes: currentVoted ? prev.poll.totalVotes : prev.poll.totalVotes + 1,
                      userVotedOptionId: optionId,
                    },
                  };
                }
                return prev;
              });
            }}
            onReshareClick={(p) => setActiveResharePost(p)}
          />
        ) : (
          <>
            {activeTab === 'home' && (
          <>
            {/* 1. Revamped Corporate Executive Morning Hero Card */}
            <KinabaluSkylineHero
              userName={currentUser.name}
              department={currentUser.department}
              employeeId={currentUser.employeeId}
              onOpenCreate={() => setIsCreateOpen(true)}
              onNavigateDirectory={() => setActiveTab('explore')}
              onFilterCategory={(deptId) => setSelectedDeptId(deptId)}
            />

            {/* 1.5 SESI Knowledge Hub Cross-Promo Banner */}
            <SesiKnowledgeHubBanner />

            {/* 2. Trending Across SESB Section */}
            <TrendingSection
              posts={posts}
              onSelectPost={handleOpenPostDetail}
              onOpenComments={(post) => setActiveCommentPost(post)}
            />

            {/* 2.1 CEO Wisdom Section */}
            <CeoWisdomSection
              ceoPost={latestCeoPost}
              onVotePoll={handleVotePoll}
              onLikeToggle={handleLikeToggle}
              onCommentClick={(p) => setActiveCommentPost(p)}
              onBookmarkToggle={handleBookmarkToggle}
              onPostClick={handleOpenPostDetail}
              onViewCeoProfile={() =>
                handleViewAuthorProfile({
                  id: 'user-ceo',
                  name: 'Datuk Ir. Ts. Mohd Yaakob Hj. Jaafar',
                  designation: 'Chief Executive Officer (CEO)',
                  department: 'Chief Executive Officer (CEO) Office',
                  avatarUrl: '/ceo_portrait.png',
                })
              }
            />

            {/* 3. 24-Hour Department Stories Carousel */}
            <StoriesBar
              currentUser={currentUser}
              stories={stories}
              onAddStoryClick={() => setIsCreateStoryOpen(true)}
            />

            {/* 3. Department Filter Chips */}
            <DepartmentFilters
              departments={DEPARTMENTS}
              selectedDepartmentId={selectedDeptId}
              onSelectDepartment={(id) => setSelectedDeptId(id)}
              postCounts={postCounts}
            />

            {/* 4. Bulletin Feed Stream */}
            <section aria-label="Bulletin Stream">
              {feedPosts.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '48px 16px',
                    background: '#FFFFFF',
                    borderRadius: 'var(--radius-card)',
                    border: '1px solid var(--color-border-subtle)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '36px', opacity: 0.4 }}>
                    inbox
                  </span>
                  <p style={{ marginTop: '8px', fontSize: 'var(--font-size-sm)' }}>
                    No bulletin updates found in this department yet.
                  </p>
                </div>
              ) : (
                feedPosts.map((post) => (
                  <FeedCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUser.id}
                    currentUserName={currentUser.name}
                    currentUserRole={currentUser.role}
                    currentUserAvatar={currentUser.avatarUrl}
                    onLikeToggle={handleLikeToggle}
                    onCommentClick={(p) => setActiveCommentPost(p)}
                    onBookmarkToggle={handleBookmarkToggle}
                    onDeletePost={handleDeletePost}
                    onEditPost={(post) => setEditingPost(post)}
                    onPostClick={handleOpenPostDetail}
                    onAuthorClick={handleViewAuthorProfile}
                    onVotePoll={handleVotePoll}
                    onReactionSelect={handleReactionSelect}
                    onReshareToggle={handleReshareToggle}
                    onQuotePost={handleQuotePost}
                    onSharePost={handleSharePost}
                    onReshareClick={(p) => setActiveResharePost(p)}
                  />
                ))
              )}
            </section>
          </>
        )}

        {/* Explore & Directory Tab View (Stitch Inspired) */}
        {activeTab === 'explore' && (
          <SearchDirectoryPage
            posts={posts}
            departments={DEPARTMENTS}
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
            currentUserRole={currentUser.role}
            currentUserAvatar={currentUser.avatarUrl}
            onLikeToggle={handleLikeToggle}
            onOpenComments={(post) => setActiveCommentPost(post)}
            onDeletePost={handleDeletePost}
            onEditPost={(post) => setEditingPost(post)}
            onPostClick={handleOpenPostDetail}
            onViewProfile={handleViewAuthorProfile}
            onBookmarkToggle={handleBookmarkToggle}
            onVotePoll={handleVotePoll}
            onReactionSelect={handleReactionSelect}
            onReshareToggle={handleReshareToggle}
            onQuotePost={handleQuotePost}
            onSharePost={handleSharePost}
            onReshareClick={(p) => setActiveResharePost(p)}
          />
        )}

        {/* Notifications Tab View */}
        {activeTab === 'notifications' && (
          <section
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-card)',
              padding: '20px',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>Notifications</h2>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setUnreadCount(0);
                    setToast({ message: 'Marked all notifications as read', icon: 'done_all' });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary-container)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: '#EFF6FF', border: '1px solid #DBEAFE', display: 'flex', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ color: '#1D4ED8' }}>campaign</span>
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Operations & Engineering posted an urgent bulletin</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: '#475569', marginTop: '2px' }}>Tenom Substation 132kV commissioning completed ahead of schedule.</div>
                  <div className="tabular-nums font-mono" style={{ fontSize: 'var(--font-size-xs)', color: '#64748B', marginTop: '4px' }}>2 hours ago</div>
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: '#F8FAFC', border: '1px solid var(--color-border-subtle)', display: 'flex', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ color: '#10B981' }}>favorite</span>
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Siti Aminah liked your SCADA telemetry comment</div>
                  <div className="tabular-nums font-mono" style={{ fontSize: 'var(--font-size-xs)', color: '#64748B', marginTop: '4px' }}>45 minutes ago</div>
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: '#F8FAFC', border: '1px solid var(--color-border-subtle)', display: 'flex', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ color: '#D97706' }}>security</span>
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>HSE Directorate published Directive SOP-2026-04</div>
                  <div className="tabular-nums font-mono" style={{ fontSize: 'var(--font-size-xs)', color: '#64748B', marginTop: '4px' }}>4 hours ago</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Facebook-Style Profile Tab View */}
        {activeTab === 'profile' && (
          <ProfilePage
            key={viewedProfileEmployee?.id || currentUser.id}
            posts={posts}
            currentUser={currentUser}
            viewedEmployee={viewedProfileEmployee}
            onBack={
              viewedProfileEmployee && viewedProfileEmployee.id !== currentUser.id
                ? () => {
                    setViewedProfileEmployee(null);
                    setActiveTab(previousTab);
                  }
                : undefined
            }
            onLikeToggle={handleLikeToggle}
            onOpenComments={(post) => setActiveCommentPost(post)}
            onDeletePost={handleDeletePost}
            onEditPost={(post) => setEditingPost(post)}
            onOpenCreate={() => setIsCreateOpen(true)}
            onPostClick={handleOpenPostDetail}
            onImageClick={(url, title) => setLightboxImage({ url, title })}
            onCallExt={(emp) =>
              setToast({
                message: `Calling ${emp.name} (${emp.phoneExtension || 'Ext. 4102'})...`,
                icon: 'phone_in_talk',
              })
            }
            onLogout={handleLogout}
            onUpdateProfile={handleUpdateProfile}
            onBookmarkToggle={handleBookmarkToggle}
            onVotePoll={handleVotePoll}
            onReactionSelect={handleReactionSelect}
            onReshareToggle={handleReshareToggle}
            onQuotePost={handleQuotePost}
            onSharePost={handleSharePost}
          />
        )}
          </>
        )}
      </AppShell>

      {/* Interactive Bottom Drawer for Threaded Comments (Decision 2A) */}
      {activeCommentPost && (
        <CommentDrawer
          post={activeCommentPost}
          currentUser={currentUser}
          isOpen={activeCommentPost !== null}
          onClose={() => setActiveCommentPost(null)}
          onAddComment={handleAddComment}
          comments={commentsByPost[activeCommentPost.id] || []}
          onAuthorClick={(name, dept) => handleViewAuthorProfile({ name, department: dept })}
        />
      )}

      {/* Reshare Bottom Sheet Modal (Root Level) */}
      {activeResharePost && (
        <ReshareBottomSheet
          isOpen={Boolean(activeResharePost)}
          isReshared={activeResharePost.isReshared}
          onClose={() => setActiveResharePost(null)}
          onRepost={() => {
            handleReshareToggle(activeResharePost.id);
            setActiveResharePost(null);
          }}
          onQuote={() => {
            const target = activeResharePost;
            setActiveResharePost(null);
            setActiveQuotePost(target);
          }}
        />
      )}

      {/* Quote Bulletin Composer Modal (Root Level) */}
      {activeQuotePost && (
        <QuoteBulletinModal
          isOpen={Boolean(activeQuotePost)}
          quotedPost={activeQuotePost}
          currentUserAvatar={currentUser.avatarUrl}
          currentUserName={currentUser.name}
          onClose={() => setActiveQuotePost(null)}
          onSubmit={(commentText) => {
            handleQuotePost(activeQuotePost, commentText);
            setActiveQuotePost(null);
          }}
        />
      )}

      {/* WhatsApp / Instagram Style 24h Story Creator */}
      {isCreateStoryOpen && (
        <CreateStoryModal
          currentUser={currentUser}
          onClose={() => setIsCreateStoryOpen(false)}
          onSubmit={(newStory) => {
            setStories((prev) => [newStory, ...prev]);
            setToast({
              message: '24h Story shared successfully!',
              icon: 'schedule',
            });
          }}
        />
      )}

      {/* Dedicated Full Page for Creating Bulletins (Stitch Inspired) */}
      {isCreateOpen && (
        <CreateBulletinPage
          departments={DEPARTMENTS}
          currentUser={currentUser}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={async (newPostData) => {
            const newPost = await bulletinService.createPost(newPostData, currentUser);
            handlePublishPost(newPost);
            setIsCreateOpen(false);
          }}
        />
      )}

      {/* Dedicated Full Page for Editing Bulletins */}
      {editingPost && (
        <CreateBulletinPage
          departments={DEPARTMENTS}
          currentUser={currentUser}
          initialPost={editingPost}
          isEditMode={true}
          onClose={() => setEditingPost(null)}
          onSubmit={() => {}}
          onUpdate={handleUpdatePost}
        />
      )}

      {/* Sticky Bottom Navigation Bar with Elevated Center FAB */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedPostForDetail(null);
          if (tab === 'profile') setViewedProfileEmployee(null);
          setActiveTab(tab);
        }}
        onCreateClick={() => setIsCreateOpen(true)}
        unreadCount={unreadCount}
      />

      {/* Fullscreen Gesture-Only Lightbox Image Viewer */}
      {lightboxImage && (
        <ImageViewerModal
          imageUrl={lightboxImage.url}
          title={lightboxImage.title}
          location={lightboxImage.location}
          onClose={() => setLightboxImage(null)}
        />
      )}

      {/* In-App Mobile PWA Install Banner (Android & iOS) */}
      <PwaInstallPrompt />

      {/* Slide-out Navigation Drawer triggered by Sabah Electricity Brand Logo */}
      <BrandSidebarDrawer
        isOpen={isBrandSidebarOpen}
        onClose={() => setIsBrandSidebarOpen(false)}
        currentUser={currentUser}
        savedCount={posts.filter((p) => p.isBookmarked).length}
        onOpenSavedPosts={() => {
          setIsBrandSidebarOpen(false);
          setIsSavedPostsOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Dedicated Saved Posts Slide-over Drawer */}
      <SavedPostsDrawer
        isOpen={isSavedPostsOpen}
        onClose={() => setIsSavedPostsOpen(false)}
        savedPosts={posts.filter((p) => p.isBookmarked)}
        onPostClick={(post) => {
          setIsSavedPostsOpen(false);
          setSelectedPostForDetail(post);
        }}
        onRemoveBookmark={handleBookmarkToggle}
      />

      {/* Apple HIG Spring Toast Feedback */}
      {toast && (
        <Toast
          message={toast.message}
          icon={toast.icon}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}
export default App;
