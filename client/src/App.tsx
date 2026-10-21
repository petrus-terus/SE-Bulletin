import { useState, lazy, Suspense } from 'react';
import type { AppNotification, Employee } from '@/types/bulletin';
import { getEmployeeByAuthor } from '@/services/mockData';
import { bulletinService } from '@/services/bulletinService';
import { saveStoredNotifications } from '@/services/notificationService';
import { supabase } from '@/services/supabaseClient';
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
import { OverlayProvider, useOverlay } from '@/context/OverlayContext';
import { FeedProvider, useFeed } from '@/context/FeedContext';

// Lazy-loaded heavy detail view
const PostDetailView = lazy(() =>
  import('@/features/post/PostDetailView').then((m) => ({ default: m.PostDetailView }))
);

const ViewFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
    <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border-subtle)', borderTopColor: 'var(--color-primary-text)', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

function AppMain({
  currentUser,
  setCurrentUser,
  setIsAuthenticated,
}: {
  currentUser: Employee;
  setCurrentUser: (u: Employee | null) => void;
  setIsAuthenticated: (auth: boolean) => void;
}) {
  const overlay = useOverlay();
  const feed = useFeed();

  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [viewedProfileEmployee, setViewedProfileEmployee] = useState<Employee | null>(null);
  const [previousTab, setPreviousTab] = useState<TabKey>('home');

  useScrollChoreography({ activeTab, selectedPostId: feed.selectedPostId });

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentUser(null);
    feed.setToast({
      message: 'Logged out. Ready for new staff login.',
      icon: 'logout',
    });
  };

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
    feed.setSelectedPostId(null);
    overlay.setActiveCommentPostId(null);
    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateProfile = async (updatedUser: Employee) => {
    try {
      const savedUser = await bulletinService.saveProfile(updatedUser);
      setCurrentUser(savedUser);

      feed.setPosts((prevPosts) =>
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

      feed.setToast({
        message: 'Profile updated successfully',
        icon: 'manage_accounts',
      });
    } catch {
      feed.setToast({
        message: 'Failed to update profile',
        icon: 'error',
      });
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    feed.setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n));
      saveStoredNotifications(updated);
      return updated;
    });

    if (notif.targetPostId) {
      const targetPost = feed.posts.find((p) => p.id === notif.targetPostId);
      if (targetPost) {
        feed.setSelectedPostId(targetPost.id);
        if (notif.targetCommentId || notif.category === 'comment') {
          overlay.setActiveCommentPostId(targetPost.id);
        }
      }
    }
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {activeTab === 'home' && !feed.selectedPostForDetail && (
        <TopAppBar
          currentUser={currentUser}
          unreadCount={feed.unreadCount}
          onNotificationClick={() => setActiveTab('notifications')}
          onBrandClick={overlay.openSidebar}
          onProfileClick={() => {
            setViewedProfileEmployee(null);
            setActiveTab('profile');
          }}
        />
      )}

      <AppShell
        hasTopAppBar={activeTab === 'home' && !feed.selectedPostForDetail}
        isDetailView={Boolean(feed.selectedPostForDetail)}
        sidebar={
          <DesktopSidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              feed.setSelectedPostId(null);
              if (tab === 'profile') setViewedProfileEmployee(null);
              setActiveTab(tab);
            }}
            onCreateClick={overlay.openCreate}
            currentUser={currentUser}
            unreadCount={feed.unreadCount}
          />
        }
        rightRail={<DesktopWidgetsRail />}
      >
        {feed.selectedPostForDetail ? (
          <Suspense fallback={<ViewFallback />}>
            <PostDetailView
              post={feed.selectedPostForDetail}
              comments={feed.commentsByPost[feed.selectedPostForDetail.id] || []}
              onBack={() => feed.setSelectedPostId(null)}
              onAuthorClick={handleViewAuthorProfile}
              onLikeToggle={feed.handleLikeToggle}
              onBookmarkToggle={feed.handleBookmarkToggle}
              currentUserId={currentUser.id}
              currentUserName={currentUser.name}
              currentUserRole={currentUser.role}
              onDeletePost={feed.handleDeletePost}
              onEditPost={(post) => overlay.openEdit(post)}
              onImageClick={(imageUrl, title, location) => {
                overlay.openLightbox({ url: imageUrl, title, location });
              }}
              onAddComment={feed.handleAddComment}
              onVotePoll={feed.handleVotePoll}
              onReshareClick={(post) => overlay.openReshare(post.id)}
            />
          </Suspense>
        ) : (
          <TabRouter
            activeTab={activeTab}
            currentUser={currentUser}
            notifications={feed.notifications}
            viewedProfileEmployee={viewedProfileEmployee}
            onBackFromProfile={
              viewedProfileEmployee && viewedProfileEmployee.id !== currentUser.id
                ? () => {
                    setViewedProfileEmployee(null);
                    setActiveTab(previousTab);
                  }
                : undefined
            }
            onNavigateExplore={() => setActiveTab('explore')}
            onViewAuthorProfile={handleViewAuthorProfile}
            onNotificationClick={handleNotificationClick}
            onMarkAllNotificationsAsRead={feed.markAllNotificationsAsRead}
            onLogout={handleLogout}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </AppShell>

      {!feed.selectedPostForDetail && (
        <>
          <BottomNav
            activeTab={activeTab}
            onTabChange={(tab) => {
              feed.setSelectedPostId(null);
              if (tab === 'profile') setViewedProfileEmployee(null);
              setActiveTab(tab);
            }}
            onCreateClick={overlay.openCreate}
            unreadCount={feed.unreadCount}
          />

          {activeTab === 'home' && <DockedFab onClick={overlay.openCreate} />}
        </>
      )}

      <OverlayHost
        currentUser={currentUser}
        onLogout={handleLogout}
        onAuthorProfileClick={handleViewAuthorProfile}
        onOpenScreen={(target) => {
          feed.setSelectedPostId(null);
          if (target === 'create') {
            overlay.openCreate();
            return;
          }
          if (target === 'profile') setViewedProfileEmployee(null);
          setActiveTab(target);
        }}
      />
    </>
  );
}

export function App() {
  const { currentUser, setCurrentUser, isAuthenticated, setIsAuthenticated } = useAuthSession();
  const [isPilotUnlocked, setIsPilotUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('sesb_pilot_unlocked') === 'true';
  });
  const [toast, setToast] = useState<{ message: string; icon?: string } | null>(null);

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
    <OverlayProvider>
      <FeedProvider currentUser={currentUser}>
        <AppMain
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          setIsAuthenticated={setIsAuthenticated}
        />
      </FeedProvider>
    </OverlayProvider>
  );
}

export default App;
