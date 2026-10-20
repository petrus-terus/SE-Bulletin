import { useState, useCallback } from 'react';
import type { Post } from '@/types/bulletin';

export type OverlayState =
  | { kind: 'none' }
  | { kind: 'create' }
  | { kind: 'edit'; post: Post }
  | { kind: 'story' }
  | { kind: 'sidebar' }
  | { kind: 'showcase' }
  | { kind: 'saved' }
  | { kind: 'comment'; postId: string }
  | { kind: 'reshare'; postId: string }
  | { kind: 'quote'; postId: string }
  | { kind: 'lightbox'; image: { url: string; title?: string; location?: string | null } };

export function useOverlayManager() {
  const [overlay, setOverlay] = useState<OverlayState>({ kind: 'none' });

  const closeOverlay = useCallback(() => setOverlay({ kind: 'none' }), []);
  const openCreate = useCallback(() => setOverlay({ kind: 'create' }), []);
  const openEdit = useCallback((post: Post) => setOverlay({ kind: 'edit', post }), []);
  const openStory = useCallback(() => setOverlay({ kind: 'story' }), []);
  const openSidebar = useCallback(() => setOverlay({ kind: 'sidebar' }), []);
  const openShowcase = useCallback(() => setOverlay({ kind: 'showcase' }), []);
  const openSaved = useCallback(() => setOverlay({ kind: 'saved' }), []);
  const openComment = useCallback((postId: string) => setOverlay({ kind: 'comment', postId }), []);
  const openReshare = useCallback((postId: string) => setOverlay({ kind: 'reshare', postId }), []);
  const openQuote = useCallback((postId: string) => setOverlay({ kind: 'quote', postId }), []);
  const openLightbox = useCallback(
    (image: { url: string; title?: string; location?: string | null }) =>
      setOverlay({ kind: 'lightbox', image }),
    []
  );

  const setActiveCommentPostId = useCallback(
    (action: React.SetStateAction<string | null>) => {
      setOverlay((curr) => {
        const currentId = curr.kind === 'comment' ? curr.postId : null;
        const nextId = typeof action === 'function' ? action(currentId) : action;
        return nextId ? { kind: 'comment', postId: nextId } : { kind: 'none' };
      });
    },
    []
  );

  const setActiveResharePostId = useCallback(
    (action: React.SetStateAction<string | null>) => {
      setOverlay((curr) => {
        const currentId = curr.kind === 'reshare' ? curr.postId : null;
        const nextId = typeof action === 'function' ? action(currentId) : action;
        return nextId ? { kind: 'reshare', postId: nextId } : { kind: 'none' };
      });
    },
    []
  );

  const setActiveQuotePostId = useCallback(
    (action: React.SetStateAction<string | null>) => {
      setOverlay((curr) => {
        const currentId = curr.kind === 'quote' ? curr.postId : null;
        const nextId = typeof action === 'function' ? action(currentId) : action;
        return nextId ? { kind: 'quote', postId: nextId } : { kind: 'none' };
      });
    },
    []
  );

  const setEditingPost = useCallback(
    (action: React.SetStateAction<Post | null>) => {
      setOverlay((curr) => {
        const currentPost = curr.kind === 'edit' ? curr.post : null;
        const nextPost = typeof action === 'function' ? action(currentPost) : action;
        return nextPost ? { kind: 'edit', post: nextPost } : { kind: 'none' };
      });
    },
    []
  );

  return {
    overlay,
    closeOverlay,
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
    setActiveCommentPostId,
    setActiveResharePostId,
    setActiveQuotePostId,
    setEditingPost,
    isCreateOpen: overlay.kind === 'create',
    editingPost: overlay.kind === 'edit' ? overlay.post : null,
    isCreateStoryOpen: overlay.kind === 'story',
    isBrandSidebarOpen: overlay.kind === 'sidebar',
    isShowcaseOpen: overlay.kind === 'showcase',
    isSavedPostsOpen: overlay.kind === 'saved',
    activeCommentPostId: overlay.kind === 'comment' ? overlay.postId : null,
    activeResharePostId: overlay.kind === 'reshare' ? overlay.postId : null,
    activeQuotePostId: overlay.kind === 'quote' ? overlay.postId : null,
    lightboxImage: overlay.kind === 'lightbox' ? overlay.image : null,
  };
}
