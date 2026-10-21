import React, { lazy, Suspense } from 'react';
import type { AppNotification, Employee } from '@/types/bulletin';
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
import { ViewFallback } from '@/ui/ViewFallback';
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

export interface TabRouterProps {
  activeTab: TabKey;
  currentUser: Employee;
  notifications: AppNotification[];
  viewedProfileEmployee: Employee | null;
  onBackFromProfile?: () => void;
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

            {feed.hasMorePosts && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 24px' }}>
                <button
                  type="button"
                  onClick={feed.loadMorePosts}
                  disabled={feed.isLoadingMore}
                  style={{
                    minHeight: '44px',
                    padding: '0 24px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--color-surface-card)',
                    border: '1px solid var(--color-border-subtle)',
                    color: 'var(--color-primary-text)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: feed.isLoadingMore ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'var(--transition-press)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    {feed.isLoadingMore ? 'hourglass_top' : 'expand_more'}
                  </span>
                  <span>
                    {feed.isLoadingMore ? 'Loading Bulletins...' : 'Load More Bulletins'}
                  </span>
                </button>
              </div>
            )}
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
              currentUser={currentUser}
              viewedEmployee={viewedProfileEmployee}
              onBack={onBackFromProfile}
              onLogout={onLogout}
              onUpdateProfile={onUpdateProfile}
            />
          </Suspense>
        </ErrorBoundary>
      )}
    </>
  );
};
