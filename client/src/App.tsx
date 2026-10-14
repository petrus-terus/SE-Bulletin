import { useState, useEffect, lazy, Suspense } from 'react';
import type { AppNotification, Comment, Employee, Post, Story } from '@/types/bulletin';
import { INITIAL_POSTS, INITIAL_STORIES, getEmployeeByAuthor } from '@/services/mockData';
import { bulletinService } from '@/services/bulletinService';
import { getBookmarkedPostIds } from '@/services/bookmarkStorage';
import { getStoredNotifications, saveStoredNotifications } from '@/services/notificationService';
import { supabase } from '@/services/supabaseClient';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { usePostActions } from '@/hooks/usePostActions';
import { AppShell } from '@/layout/AppShell';
import { TopAppBar } from '@/layout/TopAppBar';
import { BottomNav } from '@/layout/BottomNav';
import type { TabKey } from '@/layout/BottomNav';
import { DesktopSidebar } from '@/layout/DesktopSidebar';
import { DesktopWidgetsRail } from '@/layout/DesktopWidgetsRail';
import { LoginPage } from '@/features/auth/LoginPage';
import { PilotGate } from '@/features/auth/PilotGate';
import { Toast } from '@/ui/Toast';
import { TabRouter } from '@/layout/TabRouter';
import { OverlayHost } from '@/layout/OverlayHost';

// Lazy-loaded heavy detail view
const PostDetailView = lazy(() =>
  import('@/features/post/PostDetailView').then((m) => ({ default: m.PostDetailView }))
);

const ViewFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
    <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border-subtle)', borderTopColor: 'var(--color-primary-text)', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

export function App() {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isPilotUnlocked, setIsPilotUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('sesb_pilot_unlocked') === 'true';
  });
  const [posts, setPosts] = useState<Post[]>(() => {
    if (!import.meta.env.DEV) return [];
    const savedBookmarks = getBookmarkedPostIds();
    return INITIAL_POSTS.map((p) => ({
      ...p,
      isBookmarked: savedBookmarks.has(p.id),
    }));
  });
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
  const [stories, setStories] = useState<Story[]>(import.meta.env.DEV ? INITIAL_STORIES : []);
  const [selectedDeptId, setSelectedDeptId] = useState('dept-all');
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getStoredNotifications());
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const [viewedProfileEmployee, setViewedProfileEmployee] = useState<Employee | null>(null);
  const [previousTab, setPreviousTab] = useState<TabKey>('home');

  // Modals & Drawers State (ID based to prevent state desync with feed)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [isBrandSidebarOpen, setIsBrandSidebarOpen] = useState(false);
  const [isSavedPostsOpen, setIsSavedPostsOpen] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [activeResharePostId, setActiveResharePostId] = useState<string | null>(null);
  const [activeQuotePostId, setActiveQuotePostId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; icon?: string } | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    title?: string;
    location?: string | null;
  } | null>(null);

  // Derived Reactive Entities (Single Source of Truth)
  const selectedPostForDetail = selectedPostId ? posts.find((p) => p.id === selectedPostId) || null : null;
  const activeCommentPost = activeCommentPostId ? posts.find((p) => p.id === activeCommentPostId) || null : null;
  const activeResharePost = activeResharePostId ? posts.find((p) => p.id === activeResharePostId) || null : null;
  const activeQuotePost = activeQuotePostId ? posts.find((p) => p.id === activeQuotePostId) || null : null;

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
  });

  // Corporate Staff Logout Handler
  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setToast({
      message: 'Logged out. Ready for new staff login.',
      icon: 'logout',
    });
  };

  // 0. Supabase Auth State Listener
  useEffect(() => {
    if (!supabase) return;

    const syncSessionUser = (user: import('@supabase/supabase-js').User | undefined) => {
      if (user) {
        setIsAuthenticated(true);
        bulletinService.getProfile(user.id).then((matched) => {
          if (matched) {
            setCurrentUser(matched);
          } else {
            const fallbackUser: Employee = {
              id: user.id,
              employeeId: 'SESB-' + user.id.slice(0, 4).toUpperCase(),
              name: user.email ? user.email.split('@')[0] : 'SESB Staff',
              fullName: user.email || 'SESB Staff',
              designation: 'Sabah Electricity Staff',
              department: 'Operations',
              email: user.email || 'staff@sesb.com.my',
              avatarUrl: '/sabah_electricity_logo.png',
              coverUrl: '/grid_horizon_hero.jpg',
              officeLocation: 'Wisma SESB HQ, Kota Kinabalu',
              phoneExtension: 'Ext. 4102',
              bio: 'Sabah Electricity Staff Member',
              role: 'GeneralStaff',
              adminDepartments: [],
              isVerified: true,
            };
            setCurrentUser(fallbackUser);
          }
        });
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSessionUser(session?.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSessionUser(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 1. Initial Load from BulletinService / Supabase (Posts & 24h Stories)
  useEffect(() => {
    bulletinService.getPosts().then((fetched) => {
      if (fetched && fetched.length > 0) {
        const savedBookmarks = getBookmarkedPostIds();
        setPosts(
          fetched.map((p) => ({
            ...p,
            isBookmarked: savedBookmarks.has(p.id),
          }))
        );
      }
    });

    bulletinService.getStories().then((cloudStories) => {
      if (cloudStories && cloudStories.length > 0) {
        setStories(cloudStories);
      }
    });
  }, []);

  // 2. Real-time Cloud Synchronization (Posts, Stories, Likes, and Comments)
  useRealtimeSync({
    setStories,
    setPosts,
    setCommentsByPost,
    setNotifications,
    setSelectedPostId,
    setActiveCommentPostId,
    setToast,
  });

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
    setSelectedPostId(null);
    setActiveCommentPostId(null);
    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch cloud comments when CommentDrawer or PostDetailView opens
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

  // Derived Department counts
  const postCounts: Record<string, number> = {
    'dept-all': posts.length,
  };
  posts.forEach((p) => {
    if (p.departmentId) {
      postCounts[p.departmentId] = (postCounts[p.departmentId] || 0) + 1;
    }
  });

  const filteredPosts =
    selectedDeptId === 'dept-all'
      ? posts
      : posts.filter((p) => p.departmentId === selectedDeptId);

  const latestCeoPost = posts.find((p) => p.author?.id === 'user-ceo');
  const feedPosts = filteredPosts.filter((p) => p.author?.id !== 'user-ceo');

  // Update Profile Handler
  const handleUpdateProfile = async (updatedUser: Employee) => {
    if (!currentUser) return;
    try {
      const savedUser = await bulletinService.saveProfile(updatedUser);
      setCurrentUser(savedUser);

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
    } catch {
      setToast({
        message: 'Failed to update profile',
        icon: 'error',
      });
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n));
      saveStoredNotifications(updated);
      return updated;
    });

    if (notif.targetPostId) {
      const targetPost = posts.find((p) => p.id === notif.targetPostId);
      if (targetPost) {
        if (notif.targetCommentId || notif.category === 'comment') {
          setActiveCommentPostId(targetPost.id);
        } else {
          setSelectedPostId(targetPost.id);
        }
      }
    }
    setActiveTab('home');
  };

  // 0. Pre-Auth Pilot Passcode Gate
  if (!isPilotUnlocked) {
    return (
      <>
        <PilotGate onUnlock={() => setIsPilotUnlocked(true)} />
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

  if (!isAuthenticated || !currentUser) {
    return (
      <>
        <LoginPage onShowNotice={(msg) => setToast({ message: msg, icon: 'info' })} />
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
              setSelectedPostId(null);
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
          <Suspense fallback={<ViewFallback />}>
            <PostDetailView
              post={selectedPostForDetail}
              comments={commentsByPost[selectedPostForDetail.id] || []}
              onBack={() => setSelectedPostId(null)}
              onAuthorClick={handleViewAuthorProfile}
              onLikeToggle={handleLikeToggle}
              onBookmarkToggle={handleBookmarkToggle}
              currentUserId={currentUser.id}
              currentUserName={currentUser.name}
              currentUserRole={currentUser.role}
              onDeletePost={handleDeletePost}
              onEditPost={(post) => setEditingPost(post)}
              onImageClick={(imageUrl, title, location) => {
                setLightboxImage({ url: imageUrl, title, location });
              }}
              onAddComment={handleAddComment}
              onVotePoll={handleVotePoll}
              onReshareClick={(post: Post) => setActiveResharePostId(post.id)}
            />
          </Suspense>
        ) : (
          <TabRouter
            activeTab={activeTab}
            currentUser={currentUser}
            posts={posts}
            feedPosts={feedPosts}
            latestCeoPost={latestCeoPost}
            stories={stories}
            selectedDeptId={selectedDeptId}
            onSelectDepartment={(id) => setSelectedDeptId(id)}
            postCounts={postCounts}
            notifications={notifications}
            viewedProfileEmployee={viewedProfileEmployee}
            previousTab={previousTab}
            onBackFromProfile={
              viewedProfileEmployee && viewedProfileEmployee.id !== currentUser.id
                ? () => {
                    setViewedProfileEmployee(null);
                    setActiveTab(previousTab);
                  }
                : undefined
            }
            onOpenCreate={() => setIsCreateOpen(true)}
            onNavigateExplore={() => setActiveTab('explore')}
            onSelectPost={handleOpenPostDetail}
            onOpenComments={(id) => setActiveCommentPostId(id)}
            onVotePoll={handleVotePoll}
            onLikeToggle={handleLikeToggle}
            onBookmarkToggle={handleBookmarkToggle}
            onViewAuthorProfile={handleViewAuthorProfile}
            onAddStoryClick={() => setIsCreateStoryOpen(true)}
            onDeletePost={handleDeletePost}
            onEditPost={(post) => setEditingPost(post)}
            onReactionSelect={handleReactionSelect}
            onReshareToggle={handleReshareToggle}
            onQuotePost={handleQuotePost}
            onSharePost={handleSharePost}
            onReshareClick={(id) => setActiveResharePostId(id)}
            onNotificationClick={handleNotificationClick}
            onMarkAllNotificationsAsRead={() => {
              setNotifications((prev) => {
                const updated = prev.map((n) => ({ ...n, isRead: true }));
                saveStoredNotifications(updated);
                return updated;
              });
              setToast({ message: 'All notifications marked as read', icon: 'done_all' });
            }}
            onImageClick={(url, title) => setLightboxImage({ url, title })}
            onCallExt={(emp) =>
              setToast({
                message: `Calling ${emp.name} (${emp.phoneExtension || 'Ext. 4102'})...`,
                icon: 'phone_in_talk',
              })
            }
            onLogout={handleLogout}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </AppShell>

      {/* Sticky Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedPostId(null);
          if (tab === 'profile') setViewedProfileEmployee(null);
          setActiveTab(tab);
        }}
        onCreateClick={() => setIsCreateOpen(true)}
        unreadCount={unreadCount}
      />

      {/* All Overlay Modals, Drawers & Toast Feedback */}
      <OverlayHost
        currentUser={currentUser}
        activeCommentPost={activeCommentPost}
        commentsByPost={commentsByPost}
        onCloseCommentDrawer={() => setActiveCommentPostId(null)}
        onAddComment={handleAddComment}
        onAuthorProfileClick={(author) => handleViewAuthorProfile(author)}
        activeResharePost={activeResharePost}
        onCloseReshareSheet={() => setActiveResharePostId(null)}
        onReshareToggle={handleReshareToggle}
        onOpenQuoteModal={(targetId) => setActiveQuotePostId(targetId)}
        activeQuotePost={activeQuotePost}
        onCloseQuoteModal={() => setActiveQuotePostId(null)}
        onQuoteSubmit={(quotedPost, commentText) => handleQuotePost(quotedPost, commentText)}
        isCreateStoryOpen={isCreateStoryOpen}
        onCloseCreateStory={() => setIsCreateStoryOpen(false)}
        onStoryCreated={(newStory) => {
          setStories((prev) => [newStory, ...prev]);
          bulletinService.createStory(newStory);
          setToast({ message: '24h Story shared successfully!', icon: 'schedule' });
        }}
        isCreateOpen={isCreateOpen}
        onCloseCreateBulletin={() => setIsCreateOpen(false)}
        onPublishPost={handlePublishPost}
        editingPost={editingPost}
        onCloseEditBulletin={() => setEditingPost(null)}
        onUpdatePost={handleUpdatePost}
        lightboxImage={lightboxImage}
        onCloseLightbox={() => setLightboxImage(null)}
        isBrandSidebarOpen={isBrandSidebarOpen}
        onCloseBrandSidebar={() => setIsBrandSidebarOpen(false)}
        onOpenSavedPosts={() => {
          setIsBrandSidebarOpen(false);
          setIsSavedPostsOpen(true);
        }}
        onLogout={handleLogout}
        savedCount={posts.filter((p) => p.isBookmarked).length}
        isSavedPostsOpen={isSavedPostsOpen}
        onCloseSavedPosts={() => setIsSavedPostsOpen(false)}
        savedPosts={posts.filter((p) => p.isBookmarked)}
        onSavedPostClick={(id) => {
          setIsSavedPostsOpen(false);
          setSelectedPostId(id);
        }}
        onRemoveBookmark={handleBookmarkToggle}
        toast={toast}
        onDismissToast={() => setToast(null)}
      />
    </>
  );
}

export default App;
