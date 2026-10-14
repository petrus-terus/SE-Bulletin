import React, { lazy, Suspense } from 'react';
import type { Comment, Employee, Post, Story } from '@/types/bulletin';
import { DEPARTMENTS } from '@/data/departments';
import { bulletinService } from '@/services/bulletinService';
import { CommentDrawer } from '@/features/post/CommentDrawer';
import { ReshareBottomSheet } from '@/shared/ReshareBottomSheet';
import { QuoteBulletinModal } from '@/shared/QuoteBulletinModal';
import { BrandSidebarDrawer } from '@/layout/BrandSidebarDrawer';
import { PwaInstallPrompt } from '@/ui/PwaInstallPrompt';
import { Toast } from '@/ui/Toast';

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
  // Comment drawer
  activeCommentPost: Post | null;
  commentsByPost: Record<string, Comment[]>;
  onCloseCommentDrawer: () => void;
  onAddComment: (postId: string, text: string) => void;
  onAuthorProfileClick: (author: { name: string; department?: string }) => void;
  // Reshare sheet
  activeResharePost: Post | null;
  onCloseReshareSheet: () => void;
  onReshareToggle: (postId: string) => void;
  onOpenQuoteModal: (postId: string) => void;
  // Quote modal
  activeQuotePost: Post | null;
  onCloseQuoteModal: () => void;
  onQuoteSubmit: (quotedPost: Post, commentText: string) => void;
  // Create story
  isCreateStoryOpen: boolean;
  onCloseCreateStory: () => void;
  onStoryCreated: (newStory: Story) => void;
  // Create bulletin
  isCreateOpen: boolean;
  onCloseCreateBulletin: () => void;
  onPublishPost: (newPost: Post) => void;
  // Edit bulletin
  editingPost: Post | null;
  onCloseEditBulletin: () => void;
  onUpdatePost: (postId: string, updatedData: Partial<Post>) => void;
  // Lightbox
  lightboxImage: { url: string; title?: string; location?: string | null } | null;
  onCloseLightbox: () => void;
  // Brand sidebar
  isBrandSidebarOpen: boolean;
  onCloseBrandSidebar: () => void;
  onOpenSavedPosts: () => void;
  onLogout: () => void;
  savedCount: number;
  // Saved posts
  isSavedPostsOpen: boolean;
  onCloseSavedPosts: () => void;
  savedPosts: Post[];
  onSavedPostClick: (postId: string) => void;
  onRemoveBookmark: (postId: string) => void;
  // Toast
  toast: { message: string; icon?: string } | null;
  onDismissToast: () => void;
}

export const OverlayHost: React.FC<OverlayHostProps> = ({
  currentUser,
  activeCommentPost,
  commentsByPost,
  onCloseCommentDrawer,
  onAddComment,
  onAuthorProfileClick,
  activeResharePost,
  onCloseReshareSheet,
  onReshareToggle,
  onOpenQuoteModal,
  activeQuotePost,
  onCloseQuoteModal,
  onQuoteSubmit,
  isCreateStoryOpen,
  onCloseCreateStory,
  onStoryCreated,
  isCreateOpen,
  onCloseCreateBulletin,
  onPublishPost,
  editingPost,
  onCloseEditBulletin,
  onUpdatePost,
  lightboxImage,
  onCloseLightbox,
  isBrandSidebarOpen,
  onCloseBrandSidebar,
  onOpenSavedPosts,
  onLogout,
  savedCount,
  isSavedPostsOpen,
  onCloseSavedPosts,
  savedPosts,
  onSavedPostClick,
  onRemoveBookmark,
  toast,
  onDismissToast,
}) => {
  return (
    <>
      {/* Interactive Bottom Drawer for Threaded Comments */}
      {activeCommentPost && (
        <CommentDrawer
          post={activeCommentPost}
          currentUser={currentUser}
          isOpen={activeCommentPost !== null}
          onClose={onCloseCommentDrawer}
          onAddComment={onAddComment}
          comments={commentsByPost[activeCommentPost.id] || []}
          onAuthorClick={(name, dept) => onAuthorProfileClick({ name, department: dept })}
        />
      )}

      {/* Reshare Bottom Sheet Modal */}
      {activeResharePost && (
        <ReshareBottomSheet
          isOpen={Boolean(activeResharePost)}
          isReshared={activeResharePost.isReshared}
          onClose={onCloseReshareSheet}
          onRepost={() => {
            onReshareToggle(activeResharePost.id);
            onCloseReshareSheet();
          }}
          onQuote={() => {
            const targetId = activeResharePost.id;
            onCloseReshareSheet();
            onOpenQuoteModal(targetId);
          }}
        />
      )}

      {/* Quote Bulletin Composer Modal */}
      {activeQuotePost && (
        <QuoteBulletinModal
          isOpen={Boolean(activeQuotePost)}
          quotedPost={activeQuotePost}
          currentUserAvatar={currentUser.avatarUrl}
          currentUserName={currentUser.name}
          onClose={onCloseQuoteModal}
          onSubmit={(commentText) => {
            onQuoteSubmit(activeQuotePost, commentText);
            onCloseQuoteModal();
          }}
        />
      )}

      {/* 24h Story Creator */}
      {isCreateStoryOpen && (
        <Suspense fallback={null}>
          <CreateStoryModal
            currentUser={currentUser}
            onClose={onCloseCreateStory}
            onSubmit={onStoryCreated}
          />
        </Suspense>
      )}

      {/* Dedicated Full Page for Creating Bulletins */}
      {isCreateOpen && (
        <Suspense fallback={<ViewFallback />}>
          <CreateBulletinPage
            departments={DEPARTMENTS}
            currentUser={currentUser}
            onClose={onCloseCreateBulletin}
            onSubmit={async (newPostData) => {
              const newPost = await bulletinService.createPost(newPostData, currentUser);
              onPublishPost(newPost);
              onCloseCreateBulletin();
            }}
          />
        </Suspense>
      )}

      {/* Dedicated Full Page for Editing Bulletins */}
      {editingPost && (
        <Suspense fallback={<ViewFallback />}>
          <CreateBulletinPage
            departments={DEPARTMENTS}
            currentUser={currentUser}
            initialPost={editingPost}
            isEditMode={true}
            onClose={onCloseEditBulletin}
            onSubmit={() => {}}
            onUpdate={onUpdatePost}
          />
        </Suspense>
      )}

      {/* Fullscreen Gesture-Only Lightbox Image Viewer */}
      {lightboxImage && (
        <Suspense fallback={null}>
          <ImageViewerModal
            imageUrl={lightboxImage.url}
            title={lightboxImage.title}
            location={lightboxImage.location}
            onClose={onCloseLightbox}
          />
        </Suspense>
      )}

      {/* In-App Mobile PWA Install Banner */}
      <PwaInstallPrompt />

      {/* Slide-out Navigation Drawer */}
      <BrandSidebarDrawer
        isOpen={isBrandSidebarOpen}
        onClose={onCloseBrandSidebar}
        currentUser={currentUser}
        savedCount={savedCount}
        onOpenSavedPosts={onOpenSavedPosts}
        onLogout={onLogout}
      />

      {/* Dedicated Saved Posts Slide-over Drawer */}
      <Suspense fallback={null}>
        <SavedPostsDrawer
          isOpen={isSavedPostsOpen}
          onClose={onCloseSavedPosts}
          savedPosts={savedPosts}
          onPostClick={(post) => onSavedPostClick(post.id)}
          onRemoveBookmark={onRemoveBookmark}
        />
      </Suspense>

      {/* Apple HIG Spring Toast Feedback */}
      {toast && (
        <Toast
          message={toast.message}
          icon={toast.icon}
          onDismiss={onDismissToast}
        />
      )}
    </>
  );
};
