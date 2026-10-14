import React, { lazy, Suspense } from 'react';
import type { AppNotification, Employee, EmojiReactionType, Post, Story } from '@/types/bulletin';
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
  posts: Post[];
  feedPosts: Post[];
  latestCeoPost?: Post;
  stories: Story[];
  selectedDeptId: string;
  onSelectDepartment: (id: string) => void;
  postCounts: Record<string, number>;
  notifications: AppNotification[];
  viewedProfileEmployee: Employee | null;
  previousTab: TabKey;
  onBackFromProfile?: () => void;
  // Handlers
  onOpenCreate: () => void;
  onNavigateExplore: () => void;
  onSelectPost: (post: Post) => void;
  onOpenComments: (postId: string) => void;
  onVotePoll: (postId: string, optionId: string) => void;
  onLikeToggle: (postId: string) => void;
  onBookmarkToggle: (postId: string) => void;
  onViewAuthorProfile: (author: { id?: string; name: string; avatarUrl?: string; designation?: string; department?: string }) => void;
  onAddStoryClick: () => void;
  onDeletePost: (postId: string) => void;
  onEditPost: (post: Post) => void;
  onReactionSelect: (postId: string, reaction: EmojiReactionType) => void;
  onReshareToggle: (postId: string) => void;
  onQuotePost: (quotedPost: Post, commentText: string) => void;
  onSharePost: (post: Post) => void;
  onReshareClick: (postId: string) => void;
  onNotificationClick: (notif: AppNotification) => void;
  onMarkAllNotificationsAsRead: () => void;
  onImageClick: (url: string, title?: string) => void;
  onCallExt: (emp: Employee) => void;
  onLogout: () => void;
  onUpdateProfile: (updatedUser: Employee) => void;
}

export const TabRouter: React.FC<TabRouterProps> = ({
  activeTab,
  currentUser,
  posts,
  feedPosts,
  latestCeoPost,
  stories,
  selectedDeptId,
  onSelectDepartment,
  postCounts,
  notifications,
  viewedProfileEmployee,
  previousTab: _previousTab,
  onBackFromProfile,
  onOpenCreate,
  onNavigateExplore,
  onSelectPost,
  onOpenComments,
  onVotePoll,
  onLikeToggle,
  onBookmarkToggle,
  onViewAuthorProfile,
  onAddStoryClick,
  onDeletePost,
  onEditPost,
  onReactionSelect,
  onReshareToggle,
  onQuotePost,
  onSharePost,
  onReshareClick,
  onNotificationClick,
  onMarkAllNotificationsAsRead,
  onImageClick,
  onCallExt,
  onLogout,
  onUpdateProfile,
}) => {
  return (
    <>
      {/* 1. Home Tab Stream */}
      {activeTab === 'home' && (
        <>
          {/* Corporate Executive Morning Hero Card */}
          <KinabaluSkylineHero
            userName={currentUser.name}
            department={currentUser.department}
            employeeId={currentUser.employeeId}
            onOpenCreate={onOpenCreate}
            onNavigateDirectory={onNavigateExplore}
            onFilterCategory={onSelectDepartment}
          />

          {/* SESI Knowledge Hub Cross-Promo Banner */}
          <SesiKnowledgeHubBanner />

          {/* Trending Across SESB Section */}
          <TrendingSection
            posts={posts}
            onSelectPost={onSelectPost}
            onOpenComments={(post) => onOpenComments(post.id)}
          />

          {/* CEO Wisdom Section */}
          <CeoWisdomSection
            ceoPost={latestCeoPost}
            onVotePoll={onVotePoll}
            onLikeToggle={onLikeToggle}
            onCommentClick={(post) => onOpenComments(post.id)}
            onBookmarkToggle={onBookmarkToggle}
            onPostClick={onSelectPost}
            onViewCeoProfile={() =>
              onViewAuthorProfile({
                id: 'user-ceo',
                name: 'Datuk Ir. Ts. Mohd Yaakob Hj. Jaafar',
                designation: 'Chief Executive Officer (CEO)',
                department: 'Chief Executive Officer (CEO) Office',
                avatarUrl: '/ceo_portrait.png',
              })
            }
          />

          {/* 24-Hour Department Stories Carousel */}
          <StoriesBar
            currentUser={currentUser}
            stories={stories}
            onAddStoryClick={onAddStoryClick}
          />

          {/* Department Filter Chips */}
          <DepartmentFilters
            departments={DEPARTMENTS}
            selectedDepartmentId={selectedDeptId}
            onSelectDepartment={onSelectDepartment}
            postCounts={postCounts}
          />

          {/* Bulletin Feed Stream */}
          <section aria-label="Bulletin Stream">
            {feedPosts.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px 16px',
                  background: 'var(--color-surface-card)',
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
                <ErrorBoundary key={post.id}>
                  <FeedCard
                    post={post}
                    currentUserId={currentUser.id}
                    currentUserName={currentUser.name}
                    currentUserRole={currentUser.role}
                    currentUserAvatar={currentUser.avatarUrl}
                    onLikeToggle={onLikeToggle}
                    onCommentClick={(p) => onOpenComments(p.id)}
                    onBookmarkToggle={onBookmarkToggle}
                    onDeletePost={onDeletePost}
                    onEditPost={onEditPost}
                    onPostClick={onSelectPost}
                    onAuthorClick={onViewAuthorProfile}
                    onVotePoll={onVotePoll}
                    onReactionSelect={onReactionSelect}
                    onReshareToggle={onReshareToggle}
                    onQuotePost={onQuotePost}
                    onSharePost={onSharePost}
                    onReshareClick={(p) => onReshareClick(p.id)}
                  />
                </ErrorBoundary>
              ))
            )}
          </section>
        </>
      )}

      {/* 2. Explore & Directory Tab View */}
      {activeTab === 'explore' && (
        <Suspense fallback={<ViewFallback />}>
          <SearchDirectoryPage
            posts={posts}
            departments={DEPARTMENTS}
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
            currentUserRole={currentUser.role}
            currentUserAvatar={currentUser.avatarUrl}
            onLikeToggle={onLikeToggle}
            onOpenComments={(post) => onOpenComments(post.id)}
            onDeletePost={onDeletePost}
            onEditPost={onEditPost}
            onPostClick={onSelectPost}
            onViewProfile={onViewAuthorProfile}
            onBookmarkToggle={onBookmarkToggle}
            onVotePoll={onVotePoll}
            onReactionSelect={onReactionSelect}
            onReshareToggle={onReshareToggle}
            onQuotePost={onQuotePost}
            onSharePost={onSharePost}
            onReshareClick={(p) => onReshareClick(p.id)}
          />
        </Suspense>
      )}

      {/* 3. Notifications Tab View */}
      {activeTab === 'notifications' && (
        <Suspense fallback={<ViewFallback />}>
          <NotificationsView
            notifications={notifications}
            onNotificationClick={onNotificationClick}
            onMarkAllAsRead={onMarkAllNotificationsAsRead}
          />
        </Suspense>
      )}

      {/* 4. Profile Tab View */}
      {activeTab === 'profile' && (
        <Suspense fallback={<ViewFallback />}>
          <ProfilePage
            key={viewedProfileEmployee?.id || currentUser.id}
            posts={posts}
            currentUser={currentUser}
            viewedEmployee={viewedProfileEmployee}
            onBack={
              onBackFromProfile ||
              (viewedProfileEmployee && viewedProfileEmployee.id !== currentUser.id
                ? onBackFromProfile
                : undefined)
            }
            onLikeToggle={onLikeToggle}
            onOpenComments={(post) => onOpenComments(post.id)}
            onDeletePost={onDeletePost}
            onEditPost={onEditPost}
            onOpenCreate={onOpenCreate}
            onPostClick={onSelectPost}
            onImageClick={onImageClick}
            onCallExt={onCallExt}
            onLogout={onLogout}
            onUpdateProfile={onUpdateProfile}
            onBookmarkToggle={onBookmarkToggle}
            onVotePoll={onVotePoll}
            onReactionSelect={onReactionSelect}
            onReshareToggle={onReshareToggle}
            onQuotePost={onQuotePost}
            onSharePost={onSharePost}
          />
        </Suspense>
      )}
    </>
  );
};
