import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import type { AppNotification, Comment, Employee, Post, Story } from '@/types/bulletin';
import { INITIAL_POSTS, INITIAL_STORIES, getEmployeeByAuthor } from '@/services/mockData';
import { bulletinService } from '@/services/bulletinService';
import { getBookmarkedPostIds } from '@/services/bookmarkStorage';
import { getStoredNotifications, saveStoredNotifications } from '@/services/notificationService';
import { supabase } from '@/services/supabaseClient';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { usePostActions } from '@/hooks/usePostActions';
import { useOverlayManager } from '@/hooks/useOverlayManager';
import { useAuthSession } from '@/hooks/useAuthSession';
import { AppShell } from '@/layout/AppShell';
import { TopAppBar } from '@/layout/TopAppBar';
import { BottomNav } from '@/layout/BottomNav';
import type { TabKey } from '@/layout/BottomNav';
import { DockedFab } from '@/layout/DockedFab';
import { DesktopSidebar } from '@/layout/DesktopSidebar';
import { DesktopWidgetsRail } from '@/layout/DesktopWidgetsRail';
import { useScrollChoreography } from '@/hooks/useScrollChoreography';
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
  const { currentUser, setCurrentUser, isAuthenticated, setIsAuthenticated } = useAuthSession();
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
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; icon?: string } | null>(null);

  // Overlay state manager
  const {
    openCreate,
    openEdit,
    openStory,
    openSidebar,
    openShowcase,
    openSaved,
    openComment,
    openReshare,
    openQuote,
    openLightbox,
    closeOverlay,
    setActiveCommentPostId,
    setActiveResharePostId,
    setActiveQuotePostId,
    setEditingPost,
    isCreateOpen,
    editingPost,
    isCreateStoryOpen,
    isBrandSidebarOpen,
    isShowcaseOpen,
    isSavedPostsOpen,
    activeCommentPostId,
    activeResharePostId,
    activeQuotePostId,
    lightboxImage,
  } = useOverlayManager();

  // Gesture-linked 1:1 scroll choreography with snap-to-rest
  useScrollChoreography({ activeTab, selectedPostId });

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

  // Story Deletion Handler
  const handleDeleteStory = async (storyId: string) => {
    try {
      setStories((prev) => prev.filter((s) => s.id !== storyId));
      await bulletinService.deleteStory(storyId);
      setToast({
        message: 'Story deleted successfully.',
        icon: 'delete',
      });
    } catch (err) {
      console.error('[App] Failed to delete story:', err);
      setToast({
        message: 'Failed to delete story from cloud.',
        icon: 'error',
      });
    }
  };

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
    currentUser,
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
        setSelectedPostId(targetPost.id);
        if (notif.targetCommentId || notif.category === 'comment') {
          setActiveCommentPostId(targetPost.id);
        }
      }
    }
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      {/* Sticky Corporate Top App Bar (Exclusive to Home feed; hidden on Explore, Notifications, Profile and PostDetail) */}
      {activeTab === 'home' && !selectedPostForDetail && (
        <TopAppBar
          currentUser={currentUser}
          unreadCount={unreadCount}
          onNotificationClick={() => setActiveTab('notifications')}
          onBrandClick={openSidebar}
          onProfileClick={() => {
            setViewedProfileEmployee(null);
            setActiveTab('profile');
          }}
        />
      )}

      {/* Main Container Shell with Multi-Screen Responsive Layout */}
      <AppShell
        hasTopAppBar={activeTab === 'home' && !selectedPostForDetail}
        isDetailView={Boolean(selectedPostForDetail)}
        sidebar={
          <DesktopSidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              setSelectedPostId(null);
              if (tab === 'profile') setViewedProfileEmployee(null);
              setActiveTab(tab);
            }}
            onCreateClick={openCreate}
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
              onEditPost={(post) => openEdit(post)}
              onImageClick={(imageUrl, title, location) => {
                openLightbox({ url: imageUrl, title, location });
              }}
              onAddComment={handleAddComment}
              onVotePoll={handleVotePoll}
              onReshareClick={(post: Post) => openReshare(post.id)}
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
            onOpenCreate={openCreate}
            onNavigateExplore={() => setActiveTab('explore')}
            onSelectPost={handleOpenPostDetail}
            onOpenComments={(id) => openComment(id)}
            onVotePoll={handleVotePoll}
            onLikeToggle={handleLikeToggle}
            onBookmarkToggle={handleBookmarkToggle}
            onViewAuthorProfile={handleViewAuthorProfile}
            onAddStoryClick={openStory}
            onDeleteStory={handleDeleteStory}
            onDeletePost={handleDeletePost}
            onEditPost={(post) => openEdit(post)}
            onReactionSelect={handleReactionSelect}
            onReshareToggle={handleReshareToggle}
            onQuotePost={handleQuotePost}
            onSharePost={handleSharePost}
            onReshareClick={(id) => openReshare(id)}
            onNotificationClick={handleNotificationClick}
            onMarkAllNotificationsAsRead={() => {
              setNotifications((prev) => {
                const updated = prev.map((n) => ({ ...n, isRead: true }));
                saveStoredNotifications(updated);
                return updated;
              });
              setToast({ message: 'All notifications marked as read', icon: 'done_all' });
            }}
            onImageClick={(url, title) => openLightbox({ url, title })}
            onLogout={handleLogout}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </AppShell>

      {/* Sticky Bottom Navigation Bar & Docked FAB (Hidden in PostDetailView for dedicated reply bar) */}
      {!selectedPostForDetail && (
        <>
          <BottomNav
            activeTab={activeTab}
            onTabChange={(tab) => {
              setSelectedPostId(null);
              if (tab === 'profile') setViewedProfileEmployee(null);
              setActiveTab(tab);
            }}
            onCreateClick={openCreate}
            unreadCount={unreadCount}
          />

          {/* Sequenced Docked FAB is exclusive to Home feed when BottomNav scrubs out */}
          {activeTab === 'home' && (
            <DockedFab onClick={openCreate} />
          )}
        </>
      )}

      {/* All Overlay Modals, Drawers & Toast Feedback */}
      <OverlayHost
        currentUser={currentUser}
        activeCommentPost={activeCommentPost}
        commentsByPost={commentsByPost}
        onCloseCommentDrawer={closeOverlay}
        onAddComment={handleAddComment}
        onAuthorProfileClick={(author) => handleViewAuthorProfile(author)}
        activeResharePost={activeResharePost}
        onCloseReshareSheet={closeOverlay}
        onReshareToggle={handleReshareToggle}
        onOpenQuoteModal={(targetId) => openQuote(targetId)}
        activeQuotePost={activeQuotePost}
        onCloseQuoteModal={closeOverlay}
        onQuoteSubmit={(quotedPost, commentText) => handleQuotePost(quotedPost, commentText)}
        isCreateStoryOpen={isCreateStoryOpen}
        onCloseCreateStory={closeOverlay}
        onStoryCreated={async (newStory) => {
          setStories((prev) => [newStory, ...prev.filter((s) => s.id !== newStory.id)]);
          try {
            await bulletinService.createStory(newStory);
            setToast({ message: '24h Story shared successfully!', icon: 'schedule' });
          } catch (err) {
            console.error('[App] Failed to sync story to Supabase:', err);
            setToast({ message: 'Story posted locally; syncing in background.', icon: 'cloud_off' });
          }
        }}
        isCreateOpen={isCreateOpen}
        onCloseCreateBulletin={closeOverlay}
        onPublishPost={handlePublishPost}
        editingPost={editingPost}
        onCloseEditBulletin={closeOverlay}
        onUpdatePost={handleUpdatePost}
        lightboxImage={lightboxImage}
        onCloseLightbox={closeOverlay}
        isBrandSidebarOpen={isBrandSidebarOpen}
        onCloseBrandSidebar={closeOverlay}
        onOpenSavedPosts={() => {
          openSaved();
        }}
        onLogout={handleLogout}
        isShowcaseOpen={isShowcaseOpen}
        onOpenShowcase={openShowcase}
        onCloseShowcase={closeOverlay}
        onOpenScreen={(target) => {
          setSelectedPostId(null);
          if (target === 'create') {
            openCreate();
            return;
          }
          if (target === 'profile') setViewedProfileEmployee(null);
          setActiveTab(target);
        }}
        savedCount={posts.filter((p) => p.isBookmarked).length}
        isSavedPostsOpen={isSavedPostsOpen}
        onCloseSavedPosts={closeOverlay}
        savedPosts={posts.filter((p) => p.isBookmarked)}
        onSavedPostClick={(id) => {
          closeOverlay();
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
