import React, { lazy, Suspense } from 'react';
import type { AppNotification, Employee, Post } from '@/types/bulletin';
import { DEPARTMENTS } from '@/data/departments';
import type { TabKey } from '@/layout/BottomNav';
import { KinabaluSkylineHero } from '@/features/feed/KinabaluSkylineHero';
import { SesiKnowledgeHubBanner } from '@/features/feed/SesiKnowledgeHubBanner';
import { TrendingSection } from '@/features/feed/TrendingSection';
import { CeoWisdomSection } from '@/features/feed/CeoWisdomSection';
import { StoriesBar } from '@/features/stories/StoriesBar';
import { DepartmentFilters } from '@/features/feed/DepartmentFilters';
import { FeedCard } from '@/shared/FeedCard';
import { ErrorBoundary } from '@/ui/ErrorBoundary';
import { useFeed } from '@/context/FeedContext';
import { useOverlay } from '@/context/OverlayContext';

// Lazy-loaded tab sub-pages
const SearchDirectoryPage = lazy(() =>
  import('@/features/directory/SearchDirectoryPage').then((m) => ({ default: m.SearchDirectoryPage }))
);
const NotificationsView = lazy(() =>
  import('@/features/notifications/NotificationsView').then((m) => ({ default: m.NotificationsView }))
);
const ProfilePage = lazy(() =>
  import('@/features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);

const ViewFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
    <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--color-border-subtle)', borderTopColor: 'var(--color-primary-text)', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

export interface TabRouterProps {
  activeTab: TabKey;
  currentUser: Employee;
  notifications: AppNotification[];
  viewedProfileEmployee: Employee | null;
  onBackFromProfile?: () => void;
  onNavigateExplore: () => void;
  onViewAuthorProfile: (author: { id?: string; name: string; avatarUrl?: string; designation?: string; department?: string }) => void;
  onNotificationClick: (notif: AppNotification) => void;
  onMarkAllNotificationsAsRead: () => void;
  onLogout: () => void;
  onUpdateProfile: (updatedUser: Employee) => void;
}

export const TabRouter: React.FC<TabRouterProps> = ({
  activeTab,
  currentUser,
  notifications,
  viewedProfileEmployee,
  onBackFromProfile,
  onNavigateExplore,
  onViewAuthorProfile,
  onNotificationClick,
  onMarkAllNotificationsAsRead,
  onLogout,
  onUpdateProfile,
}) => {
  const feed = useFeed();
  const overlay = useOverlay();

  return (
    <>
      {/* Tab: Home (Main Bulletin Feed) */}
      {activeTab === 'home' && (
        <>
          <KinabaluSkylineHero
            userName={currentUser.name}
            department={currentUser.department}
            employeeId={currentUser.employeeId}
            onNavigateDirectory={onNavigateExplore}
          />

          <SesiKnowledgeHubBanner />

          <CeoWisdomSection
            ceoPost={feed.latestCeoPost}
            onPostClick={feed.handleOpenPostDetail}
            onViewCeoProfile={() => {
              if (feed.latestCeoPost) {
                onViewAuthorProfile(feed.latestCeoPost.author);
              }
            }}
            onLikeToggle={feed.handleLikeToggle}
            onCommentClick={(post) => overlay.openComment(post.id)}
            onBookmarkToggle={feed.handleBookmarkToggle}
            onVotePoll={feed.handleVotePoll}
          />

          <TrendingSection
            posts={feed.posts}
            onSelectPost={feed.handleOpenPostDetail}
            onOpenComments={(post) => overlay.openComment(post.id)}
          />

          <StoriesBar
            stories={feed.stories}
            currentUser={currentUser}
            onAddStoryClick={overlay.openStory}
            onDeleteStory={feed.handleDeleteStory}
          />

          <DepartmentFilters
            departments={DEPARTMENTS}
            selectedDepartmentId={feed.selectedDeptId}
            onSelectDepartment={feed.setSelectedDeptId}
            postCounts={feed.postCounts}
          />

          <div className="posts-stream">
            {feed.feedPosts.map((post) => (
              <FeedCard
                key={post.id}
                post={post}
                currentUserId={currentUser.id}
                currentUserName={currentUser.name}
                currentUserRole={currentUser.role}
                onLikeToggle={feed.handleLikeToggle}
                onBookmarkToggle={feed.handleBookmarkToggle}
                onVotePoll={feed.handleVotePoll}
                onCommentClick={() => overlay.openComment(post.id)}
                onReshareClick={() => overlay.openReshare(post.id)}
                onPostClick={feed.handleOpenPostDetail}
                onAuthorClick={onViewAuthorProfile}
                onDeletePost={feed.handleDeletePost}
                onEditPost={overlay.openEdit}
                onSharePost={feed.handleSharePost}
              />
            ))}
          </div>
        </>
      )}

      {/* Tab: Explore (Staff Directory & Search) */}
      {activeTab === 'explore' && (
        <ErrorBoundary>
          <Suspense fallback={<ViewFallback />}>
            <SearchDirectoryPage
              posts={feed.posts}
              departments={DEPARTMENTS}
              currentUserId={currentUser.id}
              currentUserName={currentUser.name}
              currentUserRole={currentUser.role}
              currentUserAvatar={currentUser.avatarUrl}
              onLikeToggle={feed.handleLikeToggle}
              onOpenComments={(post) => overlay.openComment(post.id)}
              onDeletePost={feed.handleDeletePost}
              onEditPost={overlay.openEdit}
              onPostClick={feed.handleOpenPostDetail}
              onViewProfile={(employee) => onViewAuthorProfile(employee)}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Tab: Notifications (Alerts & Mentions) */}
      {activeTab === 'notifications' && (
        <ErrorBoundary>
          <Suspense fallback={<ViewFallback />}>
            <NotificationsView
              notifications={notifications}
              onNotificationClick={onNotificationClick}
              onMarkAllAsRead={onMarkAllNotificationsAsRead}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Tab: Profile (Self or Colleague Profile) */}
      {activeTab === 'profile' && (
        <ErrorBoundary>
          <Suspense fallback={<ViewFallback />}>
            <ProfilePage
              key={viewedProfileEmployee?.id || currentUser.id}
              posts={feed.posts}
              currentUser={currentUser}
              viewedEmployee={viewedProfileEmployee}
              onBack={onBackFromProfile}
              onOpenCreate={overlay.openCreate}
              onPostClick={feed.handleOpenPostDetail}
              onLikeToggle={feed.handleLikeToggle}
              onBookmarkToggle={feed.handleBookmarkToggle}
              onVotePoll={feed.handleVotePoll}
              onOpenComments={(post: Post) => overlay.openComment(post.id)}
              onReshareToggle={feed.handleReshareToggle}
              onQuotePost={feed.handleQuotePost}
              onSharePost={feed.handleSharePost}
              onDeletePost={feed.handleDeletePost}
              onEditPost={overlay.openEdit}
              onImageClick={(url, title) => overlay.openLightbox({ url, title })}
              onLogout={onLogout}
              onUpdateProfile={onUpdateProfile}
            />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );
};