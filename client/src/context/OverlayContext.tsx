import React, { createContext, useContext } from 'react';
import type { Post } from '@/types/bulletin';
import { useOverlayManager } from '@/hooks/useOverlayManager';

export interface OverlayContextType {
  isCreateOpen: boolean;
  editingPost: Post | null;
  isCreateStoryOpen: boolean;
  isBrandSidebarOpen: boolean;
  isShowcaseOpen: boolean;
  isSavedPostsOpen: boolean;
  activeCommentPostId: string | null;
  activeResharePostId: string | null;
  activeQuotePostId: string | null;
  lightboxImage: { url: string; title?: string; location?: string | null } | null;
  openCreate: () => void;
  openEdit: (post: Post) => void;
  openStory: () => void;
  openSidebar: () => void;
  openShowcase: () => void;
  openSaved: () => void;
  openComment: (postId: string) => void;
  openReshare: (postId: string) => void;
  openQuote: (postId: string) => void;
  openLightbox: (image: { url: string; title?: string; location?: string | null }) => void;
  closeOverlay: () => void;
  setActiveCommentPostId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveResharePostId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveQuotePostId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingPost: React.Dispatch<React.SetStateAction<Post | null>>;
}

const OverlayContext = createContext<OverlayContextType | null>(null);

export const OverlayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const manager = useOverlayManager();

  return (
    <OverlayContext.Provider value={manager}>
      {children}
    </OverlayContext.Provider>
  );
};

// oxlint-disable-next-line react/only-export-components
export function useOverlay(): OverlayContextType {
  const ctx = useContext(OverlayContext);
  if (!ctx) {
    throw new Error('useOverlay must be used within an OverlayProvider');
  }
  return ctx;
}