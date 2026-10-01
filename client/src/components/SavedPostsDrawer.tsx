import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Post } from '../types/bulletin';
import styles from './SavedPostsDrawer.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  savedPosts: Post[];
  onPostClick: (post: Post) => void;
  onRemoveBookmark: (postId: string) => void;
}

export const SavedPostsDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  savedPosts,
  onPostClick,
  onRemoveBookmark,
}) => {
  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Slide-out Sheet from Right */}
      <aside
        className={`${styles.sheet} ${isOpen ? styles.sheetOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Saved Posts"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className={styles.sheetHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIconWrap}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                bookmark
              </span>
            </div>
            <div>
              <h3 className={styles.title}>Saved Posts</h3>
              <p className={`${styles.subtitle} font-mono tabular-nums`}>
                {savedPosts.length} {savedPosts.length === 1 ? 'bulletin' : 'bulletins'} saved
              </p>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close saved posts"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              close
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className={styles.sheetBody}>
          {savedPosts.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconCircle}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                  bookmark_border
                </span>
              </div>
              <h4 className={styles.emptyTitle}>No saved posts yet</h4>
              <p className={styles.emptyDesc}>
                Tap the bookmark icon on any bulletin in your feed to save it here for quick reference.
              </p>
            </div>
          ) : (
            savedPosts.map((post) => (
              <div
                key={post.id}
                className={styles.savedCard}
                onClick={() => onPostClick(post)}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.authorRow}>
                    <img
                      src={post.author.avatarUrl || '/sabah_electricity_logo.png'}
                      alt=""
                      className={styles.authorAvatar}
                      onError={(e) => {
                        e.currentTarget.src = '/sabah_electricity_logo.png';
                      }}
                    />
                    <span className={styles.authorName}>{post.author.name}</span>
                  </div>
                  <span className={`${styles.timestamp} font-mono tabular-nums`}>
                    {post.timestamp}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardTextContent}>
                    {post.title && <h5 className={styles.postTitle}>{post.title}</h5>}
                    <p className={styles.postSnippet}>{post.content}</p>
                  </div>
                  {(post.imageUrl || (post.mediaUrls && post.mediaUrls[0])) && (
                    <img
                      src={post.imageUrl || post.mediaUrls?.[0]}
                      alt=""
                      className={styles.cardThumbnail}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.divisionBadge}>
                    {post.author.department || 'INFORMATION & DIGITAL'}
                  </span>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveBookmark(post.id);
                    }}
                    title="Remove from saved posts"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                      bookmark_remove
                    </span>
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>,
    document.body
  );
};
