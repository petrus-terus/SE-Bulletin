import { useState } from 'react';
import type { Comment, Post } from './types/bulletin';
import { CURRENT_USER, DEPARTMENTS, INITIAL_POSTS, INITIAL_STORIES } from './services/mockData';
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
import { TrendingSection } from './components/TrendingSection';
import { SearchDirectoryPage } from './components/SearchDirectoryPage';
import { ProfilePage } from './components/ProfilePage';
import { DesktopSidebar } from './components/DesktopSidebar';
import { DesktopWidgetsRail } from './components/DesktopWidgetsRail';
import { Toast } from './components/Toast';
import { PostDetailView } from './components/PostDetailView';
import { ImageViewerModal } from './components/ImageViewerModal';

export function App() {
  const [currentUser] = useState(CURRENT_USER);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [stories] = useState(INITIAL_STORIES);
  const [selectedDeptId, setSelectedDeptId] = useState('dept-all');
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [unreadCount, setUnreadCount] = useState(3);

  // Modals & Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);
  const [toast, setToast] = useState<{ message: string; icon?: string } | null>(null);
  const [selectedPostForDetail, setSelectedPostForDetail] = useState<Post | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    title?: string;
    location?: string | null;
  } | null>(null);

  // Threaded comments database mock
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

  // Calculate post counts per department
  const postCounts: Record<string, number> = {
    total: posts.length,
    'dept-ops': posts.filter((p) => p.departmentId === 'dept-ops').length,
    'dept-hse': posts.filter((p) => p.departmentId === 'dept-hse').length,
    'dept-hr': posts.filter((p) => p.departmentId === 'dept-hr').length,
    'dept-it': posts.filter((p) => p.departmentId === 'dept-it').length,
    'dept-fin': posts.filter((p) => p.departmentId === 'dept-fin').length,
    'dept-comm': posts.filter((p) => p.departmentId === 'dept-comm').length,
  };

  // Filtered posts based on active pill
  const filteredPosts =
    selectedDeptId === 'dept-all'
      ? posts
      : posts.filter((p) => p.departmentId === selectedDeptId);

  // Optimistic Like Handler (1A)
  const handleLikeToggle = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const nextIsLiked = !post.isLiked;
          return {
            ...post,
            isLiked: nextIsLiked,
            likesCount: nextIsLiked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1),
          };
        }
        return post;
      })
    );
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

  // Share Link Handler
  const handleShare = (post: Post) => {
    const link = `https://bulletin.sesb.com.my/posts/${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    setToast({
      message: 'Intranet link copied to clipboard',
      icon: 'link',
    });
  };

  // Add Comment Handler (2A)
  const handleAddComment = (postId: string, commentText: string) => {
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      authorName: currentUser.name,
      department: 'IT',
      avatarInitials: 'MI',
      avatarUrl: currentUser.avatarUrl,
      text: commentText,
      timestamp: 'Just now',
      likesCount: 0,
    };

    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment],
    }));

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

  return (
    <>
      {/* Sticky Corporate Top App Bar */}
      <TopAppBar
        currentUser={currentUser}
        unreadCount={unreadCount}
        onNotificationClick={() => setActiveTab('notifications')}
        onProfileClick={() => setActiveTab('profile')}
      />

      {/* Main Container Shell with Multi-Screen Responsive Layout */}
      <AppShell
        sidebar={
          <DesktopSidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              setSelectedPostForDetail(null);
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
            onShareClick={handleShare}
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

            {/* 2. Trending Across SESB Section */}
            <TrendingSection
              posts={posts}
              onSelectPost={(post) => setSelectedPostForDetail(post)}
              onOpenComments={(post) => setActiveCommentPost(post)}
            />

            {/* 3. 24-Hour Department Stories Carousel */}
            <StoriesBar
              currentUser={currentUser}
              stories={stories}
              onAddStoryClick={() => setIsCreateOpen(true)}
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
              {filteredPosts.length === 0 ? (
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
                filteredPosts.map((post) => (
                  <FeedCard
                    key={post.id}
                    post={post}
                    onLikeToggle={handleLikeToggle}
                    onCommentClick={(p) => setActiveCommentPost(p)}
                    onShareClick={handleShare}
                    onBookmarkToggle={handleBookmarkToggle}
                    onPostClick={(p) => setSelectedPostForDetail(p)}
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
            onLikeToggle={handleLikeToggle}
            onOpenComments={(post) => setActiveCommentPost(post)}
            onShare={handleShare}
            onPostClick={(post) => setSelectedPostForDetail(post)}
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
            posts={posts}
            onLikeToggle={handleLikeToggle}
            onOpenComments={(post) => setActiveCommentPost(post)}
            onShare={handleShare}
            onOpenCreate={() => setIsCreateOpen(true)}
            onPostClick={(post) => setSelectedPostForDetail(post)}
            onImageClick={(url, title) => setLightboxImage({ url, title })}
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
        />
      )}

      {/* Dedicated Full Page for Creating Bulletins (Stitch Inspired) */}
      {isCreateOpen && (
        <CreateBulletinPage
          departments={DEPARTMENTS}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={(newPostData) => {
            const newPost: Post = {
              id: `post-${Date.now()}`,
              author: {
                id: currentUser.id,
                name: currentUser.name,
                designation: currentUser.designation,
                department: newPostData.department || currentUser.department,
                avatarUrl: currentUser.avatarUrl,
                isVerified: currentUser.isVerified ?? true,
              },
              timestamp: 'Just now',
              title: newPostData.title || '',
              content: newPostData.content || '',
              location: 'Wisma SESB HQ',
              imageUrl: newPostData.mediaUrls?.[0] || newPostData.imageUrl || null,
              isPinned: newPostData.isPinned || false,
              officialNotice: newPostData.officialNotice || false,
              commentsEnabled: true,
              likesCount: 0,
              commentsCount: 0,
              sharesCount: 0,
              isLiked: false,
              isBookmarked: false,
              departmentId: newPostData.departmentId || 'dept-ops',
              departmentName: newPostData.department || 'Operations & Engineering',
              departmentColor: '#0055A4',
            };
            handlePublishPost(newPost);
            setIsCreateOpen(false);
          }}
        />
      )}

      {/* Sticky Bottom Navigation Bar with Elevated Center FAB */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedPostForDetail(null);
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
