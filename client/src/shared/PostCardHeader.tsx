import React, { useState, useEffect, useRef } from 'react';
import type { Post } from '@/types/bulletin';
import { DEFAULT_AVATAR_URL } from '@/constants/bulletin';
import { handleAvatarError } from '@/utils/imageFallbacks';
import { getPostPermissions } from '@/utils/postPermissions';
import styles from './FeedCard.module.css';

interface PostCardHeaderProps {
  post: Post;
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: string;
  onAuthorClick?: (author: Post['author']) => void;
  onBookmarkToggle?: (postId: string) => void;
  onSharePost?: (post: Post) => void;
  onEditPost?: (post: Post) => void;
  onDeleteClick?: (post: Post) => void;
  onCopyLinkSuccess?: () => void;
}

export const PostCardHeader: React.FC<PostCardHeaderProps> = ({
  post,
  currentUserId,
  currentUserName,
  currentUserRole,
  onAuthorClick,
  onBookmarkToggle,
  onSharePost,
  onEditPost,
  onDeleteClick,
  onCopyLinkSuccess,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const optionsWrapperRef = useRef<HTMLDivElement>(null);

  const { canEdit, canDelete } = getPostPermissions(post, {
    currentUserId,
    currentUserName,
    currentUserRole,
  });

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (optionsWrapperRef.current && !optionsWrapperRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/#post-${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    setLinkCopied(true);
    onCopyLinkSuccess?.();
    setTimeout(() => {
      setLinkCopied(false);
      setIsMenuOpen(false);
    }, 1500);
  };

  return (
    <header className={styles.headerRow}>
      <div
        className={styles.authorBlock}
        onClick={(e) => {
          if (onAuthorClick) {
            e.stopPropagation();
            onAuthorClick(post.author);
          }
        }}
        role={onAuthorClick ? 'button' : undefined}
        tabIndex={onAuthorClick ? 0 : undefined}
        style={onAuthorClick ? { cursor: 'pointer' } : undefined}
        title={onAuthorClick ? `View profile of ${post.author.name}` : undefined}
      >
        <div className={styles.avatarContainer}>
          <img
            src={post.author.avatarUrl || DEFAULT_AVATAR_URL}
            alt=""
            className={styles.authorAvatar}
            onError={(e) => handleAvatarError(e)}
          />
          {post.author.isVerified && (
            <span className={styles.verifiedBadge} title="Verified Sabah Electricity Officer">
              <span className={`material-symbols-outlined ${styles.verifiedIcon}`}>
                verified
              </span>
            </span>
          )}
        </div>

        <div className={styles.authorDetails}>
          <div className={styles.authorNameRow}>
            <span className={styles.authorName}>{post.author.name}</span>
            {post.departmentName && (
              <span
                className={styles.deptPill}
                style={{ '--dept-color': post.departmentColor || '#0055A4' } as React.CSSProperties}
              >
                {post.departmentName}
              </span>
            )}
            {post.isPinned && (
              <span className={styles.pinnedPill}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '13px', color: 'var(--color-safety-orange)', fontVariationSettings: "'FILL' 1" }}
                >
                  push_pin
                </span>
                <span>Official Alert • Pinned</span>
              </span>
            )}
          </div>
          <div className={styles.authorMetaSub}>
            <span>{post.author.designation}</span>
            <span>•</span>
            <span className="tabular-nums font-mono">{post.timestamp}</span>
            {post.isEdited && <span className={styles.editedTag}>• Edited</span>}
          </div>
        </div>
      </div>

      <div ref={optionsWrapperRef} className={styles.optionsWrapper}>
        <button
          type="button"
          className={`${styles.optionsButton} ${post.isBookmarked ? styles.optionsButtonBookmarked : ''}`}
          aria-label="Post options"
          aria-expanded={isMenuOpen}
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          title={post.isBookmarked ? 'Bookmarked • Click for options' : 'Post options'}
        >
          <span className="material-symbols-outlined">more_horiz</span>
          {post.isBookmarked && <span className={styles.bookmarkedDot} aria-hidden="true" />}
        </button>

        {isMenuOpen && (
          <div
            className={styles.optionsMenu}
            role="menu"
            onClick={(e) => e.stopPropagation()}
          >
            {onBookmarkToggle && (
              <button
                type="button"
                className={`${styles.optionsMenuItem} ${post.isBookmarked ? styles.optionsMenuItemActive : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmarkToggle(post.id);
                  setIsMenuOpen(false);
                }}
                role="menuitem"
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '18px',
                    fontVariationSettings: post.isBookmarked ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  bookmark
                </span>
                <span>{post.isBookmarked ? 'Remove from Saved' : 'Save to Bookmarks'}</span>
              </button>
            )}

            <button
              type="button"
              className={styles.optionsMenuItem}
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
                if (onSharePost) {
                  onSharePost(post);
                } else {
                  handleCopyLink(e);
                }
              }}
              role="menuitem"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                share
              </span>
              <span>Share Bulletin</span>
            </button>

            <button
              type="button"
              className={styles.optionsMenuItem}
              onClick={handleCopyLink}
              role="menuitem"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {linkCopied ? 'done' : 'link'}
              </span>
              <span>{linkCopied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            {(canEdit || canDelete) && <div className={styles.optionsMenuDivider} />}

            {canEdit && onEditPost && (
              <button
                type="button"
                className={styles.optionsMenuItem}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onEditPost(post);
                }}
                role="menuitem"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '18px', color: 'var(--color-primary-text)' }}
                >
                  edit
                </span>
                <span>Edit Bulletin</span>
              </button>
            )}

            {canDelete && onDeleteClick && (
              <button
                type="button"
                className={`${styles.optionsMenuItem} ${styles.optionsMenuItemDelete}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  onDeleteClick(post);
                }}
                role="menuitem"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '18px', color: 'var(--color-alert-red)' }}
                >
                  delete_outline
                </span>
                <span>Delete Bulletin</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
