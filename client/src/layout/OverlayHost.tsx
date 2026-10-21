import React, { lazy, Suspense } from 'react';
import { DEPARTMENTS } from '@/data/departments';
import { bulletinService } from '@/services/bulletinService';
import { CommentDrawer } from '@/features/post/CommentDrawer';
import { ReshareBottomSheet } from '@/shared/ReshareBottomSheet';
import { QuoteBulletinModal } from '@/shared/QuoteBulletinModal';
import { BrandSidebarDrawer } from '@/layout/BrandSidebarDrawer';
import { ScreenShowcaseModal, type ShowcaseTarget } from '@/features/showcase/ScreenShowcaseModal';
import { PwaInstallPrompt } from '@/ui/PwaInstallPrompt';
import { Toast } from '@/ui/Toast';
import { useOverlay } from '@/context/OverlayContext';
import { useFeed } from '@/context/FeedContext';
import type { Employee } from '@/types/bulletin';

// Lazy-loaded heavy overlay modals & sheets
const CreateBulletinPage = lazy(() =>
  import('@/features/create/CreateBulletinPage').then((m) => ({ default: m.CreateBulletinPage }))
);
const CreateStoryModal = lazy(() =>
  import('@/features/stories/CreateStoryModal').then((m) => ({ default: m.CreateStoryModal }))
);
const ImageViewerModal = lazy(() =>
  import('@/ui/ImageViewerModal').then((m) => ({ default: m.ImageViewerModal }))
);
const SavedPostsDrawer = lazy(() =>
  import('@/features/post/SavedPostsDrawer').then((m) => ({ default: m.SavedPostsDrawer }))
);

const ViewFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100px' }}>
    <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid var(--color-border-subtle)', borderTopColor: 'var(--color-primary-text)', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

export interface OverlayHostProps {
  currentUser: Employee;
  onLogout: () => void;
  onOpenScreen: (target: ShowcaseTarget) => void;
  onAuthorProfileClick: (author: { name: string; department?: string }) => void;
}

export const OverlayHost: React.FC<OverlayHostProps> = ({
  currentUser,
  onLogout,
  onOpenScreen,
  onAuthorProfileClick,
}) => {
  const overlay = useOverlay();
  const feed = useFeed();

  const savedPosts = feed.posts.filter((p) => p.isBookmarked);

  return (
    <>
      {/* Interactive Bottom Drawer for Threaded Comments */}
      {feed.activeCommentPost && (
        <CommentDrawer
          post={feed.activeCommentPost}
          currentUser={currentUser}
          isOpen={feed.activeCommentPost !== null}
          onClose={overlay.closeOverlay}
          onAddComment={feed.handleAddComment}
          comments={feed.commentsByPost[feed.activeCommentPost.id] || []}
          onAuthorClick={(name, dept) => onAuthorProfileClick({ name, department: dept })}
        />
      )}

      {/* Reshare Bottom Sheet Modal */}
      {feed.activeResharePost && (
        <ReshareBottomSheet
          isOpen={Boolean(feed.activeResharePost)}
          isReshared={feed.activeResharePost.isReshared}
          onClose={overlay.closeOverlay}
          onRepost={() => {
            if (feed.activeResharePost) {
              feed.handleReshareToggle(feed.activeResharePost.id);
            }
            overlay.closeOverlay();
          }}
          onQuote={() => {
            if (feed.activeResharePost) {
              const targetId = feed.activeResharePost.id;
              overlay.closeOverlay();
              overlay.openQuote(targetId);
            }
          }}
        />
      )}

      {/* Quote Bulletin Composer Modal */}
      {feed.activeQuotePost && (
        <QuoteBulletinModal
          isOpen={Boolean(feed.activeQuotePost)}
          quotedPost={feed.activeQuotePost}
          currentUserAvatar={currentUser.avatarUrl}
          currentUserName={currentUser.name}
          onClose={overlay.closeOverlay}
          onSubmit={(commentText) => {
            if (feed.activeQuotePost) {
              feed.handleQuotePost(feed.activeQuotePost, commentText);
            }
            overlay.closeOverlay();
          }}
        />
      )}

      {/* 24h Story Creator */}
      {overlay.isCreateStoryOpen && (
        <Suspense fallback={null}>
          <CreateStoryModal
            currentUser={currentUser}
            onClose={overlay.closeOverlay}
            onSubmit={async (newStory) => {
              feed.setStories((prev) => [newStory, ...prev.filter((s) => s.id !== newStory.id)]);
              try {
                await bulletinService.createStory(newStory);
                feed.setToast({ message: '24h Story shared successfully!', icon: 'schedule' });
              } catch (err) {
                console.error('[OverlayHost] Failed to sync story:', err);
                feed.setToast({ message: 'Story posted locally; syncing in background.', icon: 'cloud_off' });
              }
            }}
          />
        </Suspense>
      )}

      {/* Dedicated Full Page for Creating Bulletins */}
      {overlay.isCreateOpen && (
        <Suspense fallback={<ViewFallback />}>
          <CreateBulletinPage
            departments={DEPARTMENTS}
            currentUser={currentUser}
            onClose={overlay.closeOverlay}
            onSubmit={async (newPostData) => {
              try {
                const newPost = await bulletinService.createPost(newPostData, currentUser);
                feed.handlePublishPost(newPost);
                overlay.closeOverlay();
              } catch (err) {
                console.error('[OverlayHost] Failed to publish bulletin:', err);
              }
            }}
          />
        </Suspense>
      )}

      {/* Dedicated Full Page for Editing Bulletins */}
      {overlay.editingPost && (
        <Suspense fallback={<ViewFallback />}>
          <CreateBulletinPage
            departments={DEPARTMENTS}
            currentUser={currentUser}
            initialPost={overlay.editingPost}
            isEditMode={true}
            onClose={overlay.closeOverlay}
            onSubmit={() => {}}
            onUpdate={feed.handleUpdatePost}
          />
        </Suspense>
      )}

      {/* Fullscreen Gesture-Only Lightbox Image Viewer */}
      {overlay.lightboxImage && (
        <Suspense fallback={null}>
          <ImageViewerModal
            imageUrl={overlay.lightboxImage.url}
            title={overlay.lightboxImage.title}
            location={overlay.lightboxImage.location}
            onClose={overlay.closeOverlay}
          />
        </Suspense>
      )}

      {/* In-App Mobile PWA Install Banner */}
      <PwaInstallPrompt />

      {/* Slide-out Navigation Drawer */}
      <BrandSidebarDrawer
        isOpen={overlay.isBrandSidebarOpen}
        onClose={overlay.closeOverlay}
        currentUser={currentUser}
        savedCount={savedPosts.length}
        onOpenSavedPosts={overlay.openSaved}
        onOpenShowcase={overlay.openShowcase}
        onLogout={onLogout}
      />

      {/* Interactive screen tour */}
      <ScreenShowcaseModal
        isOpen={overlay.isShowcaseOpen}
        onClose={overlay.closeOverlay}
        onOpenScreen={onOpenScreen}
      />

      {/* Dedicated Saved Posts Slide-over Drawer */}
      <Suspense fallback={null}>
        <SavedPostsDrawer
          isOpen={overlay.isSavedPostsOpen}
          onClose={overlay.closeOverlay}
          savedPosts={savedPosts}
          onPostClick={(post) => {
            overlay.closeOverlay();
            feed.setSelectedPostId(post.id);
          }}
          onRemoveBookmark={feed.handleBookmarkToggle}
        />
      </Suspense>

      {/* Apple HIG Spring Toast Feedback */}
      {feed.toast && (
        <Toast
          message={feed.toast.message}
          icon={feed.toast.icon}
          onDismiss={() => feed.setToast(null)}
        />
      )}
    </>
  );
};