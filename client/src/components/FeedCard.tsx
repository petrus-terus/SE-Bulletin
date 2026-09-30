import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Post } from '../types/bulletin';
import styles from './FeedCard.module.css';

interface Props {
  post: Post;
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: string;
  onLikeToggle: (postId: string) => void;
  onCommentClick: (post: Post) => void;
  onBookmarkToggle: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
  onPostClick?: (post: Post) => void;
  onAuthorClick?: (author: Post['author']) => void;
}

export const FeedCard: React.FC<Props> = ({
  post,
  currentUserId,
  currentUserName,
  currentUserRole,
  onLikeToggle,
  onCommentClick,
  onBookmarkToggle,
  onDeletePost,
  onPostClick,
  onAuthorClick,
}) => {
  const [justLiked, setJustLiked] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const optionsWrapperRef = useRef<HTMLDivElement>(null);

  // Author or Admin can delete (case-insensitive role check)
  const normalizedRole = (currentUserRole || '').toLowerCase();
  const isAdmin =
    normalizedRole.includes('admin') ||
    normalizedRole === 'superadmin' ||
    normalizedRole === 'departmentadmin';

  const isOwnPost = Boolean(
    (currentUserId && post.author.id === currentUserId) ||
    (currentUserName &&
      post.author.name &&
      post.author.name.trim().toLowerCase() === currentUserName.trim().toLowerCase())
  );
  const canDelete = isOwnPost || isAdmin;

  // Dismiss options menu on outside click or escape
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
    setTimeout(() => {
      setLinkCopied(false);
      setIsMenuOpen(false);
    }, 1200);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setJustLiked(true);
    onLikeToggle(post.id);
    setTimeout(() => setJustLiked(false), 400);
  };

  // Format content with highlighted tags
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(#[a-zA-Z0-9_-]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <span key={i} style={{ color: '#0055A4', fontWeight: 600 }}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <article
      className={`${styles.card} ${post.isPinned ? styles.cardPinned : ''}`}
      onClick={() => onPostClick?.(post)}
    >
      {/* Header Row: Author details, Department tag & options */}
      <header className={styles.headerRow}>
        <div
          className={styles.authorBlock}
          onClick={(e) => {
            if (onAuthorClick) {
              e.stopPropagation();
              onAuthorClick(post.author);
            }
          }}
          style={onAuthorClick ? { cursor: 'pointer' } : undefined}
          title={onAuthorClick ? `View profile of ${post.author.name}` : undefined}
        >
          <div className={styles.avatarContainer}>
            <img
              src={post.author.avatarUrl}
              alt={post.author.name}
              className={styles.authorAvatar}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/user_face.png';
              }}
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
                  style={{ backgroundColor: post.departmentColor || '#0055A4' }}
                >
                  {post.departmentName}
                </span>
              )}
              {post.isPinned && (
                <span className={styles.pinnedPill}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#D97706', fontVariationSettings: "'FILL' 1" }}>
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
            </div>
          </div>
        </div>

        <div ref={optionsWrapperRef} className={styles.optionsWrapper}>
          <button
            type="button"
            className={styles.optionsButton}
            aria-label="Post options"
            aria-expanded={isMenuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
          >
            <span className="material-symbols-outlined">more_horiz</span>
          </button>

          {isMenuOpen && (
            <div
              className={styles.optionsMenu}
              role="menu"
              onClick={(e) => e.stopPropagation()}
            >
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

              {canDelete && (
                <button
                  type="button"
                  className={`${styles.optionsMenuItem} ${styles.optionsMenuItemDelete}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    setShowDeleteConfirm(true);
                  }}
                  role="menuitem"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#DC2626' }}>
                    delete_outline
                  </span>
                  <span>Delete Bulletin</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Post Content */}
      <div className={styles.postContent}>
        <h2 className={styles.postTitle}>{post.title}</h2>
        <p className={styles.postBody}>{renderFormattedContent(post.content)}</p>
      </div>

      {/* Multi-Image Gallery or Single High-Res Imagery */}
      {post.mediaUrls && post.mediaUrls.length > 1 ? (
        <div className={styles.multiImageTrack} onClick={(e) => e.stopPropagation()}>
          {post.mediaUrls.map((url, idx) => (
            <div key={idx} className={styles.multiImageSlide}>
              <img
                src={url}
                alt=""
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/mock-images/image1.png';
                }}
              />
              <span className={styles.multiImageBadge}>
                {idx + 1} / {post.mediaUrls!.length}
              </span>
            </div>
          ))}
        </div>
      ) : post.imageUrl && !imageError ? (
        <div className={styles.imageWrapper}>
          <img
            src={post.imageUrl}
            alt=""
            onError={() => setImageError(true)}
            className={styles.postImage}
          />
          {post.location && (
            <div className={styles.locationChip}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                location_on
              </span>
              <span>{post.location}</span>
            </div>
          )}
        </div>
      ) : null}

      {/* Fallback Location Tag when no image or image load error */}
      {post.location && (!post.imageUrl || imageError) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px', padding: '0 16px', fontWeight: 500 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--color-primary)' }}>
            location_on
          </span>
          <span>{post.location}</span>
        </div>
      )}

      {/* Engagement Actions Row */}
      <div className={styles.engagementBar}>
        <div className={styles.leftActions}>
          {/* Like Button */}
          <button
            type="button"
            className={`${styles.actionButton} ${post.isLiked ? styles.likeActive : ''}`}
            onClick={handleLike}
            aria-label={`${post.isLiked ? 'Unlike' : 'Like'} post`}
          >
            <span
              className={`material-symbols-outlined ${
                justLiked || post.isLiked ? styles.likeHeartPop : ''
              }`}
              style={{
                fontVariationSettings: post.isLiked ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              favorite
            </span>
            <span className="tabular-nums font-mono">{post.likesCount}</span>
          </button>

          {/* Comment Button */}
          <button
            type="button"
            className={styles.actionButton}
            onClick={(e) => {
              e.stopPropagation();
              onCommentClick(post);
            }}
            aria-label="View comments"
          >
            <span className="material-symbols-outlined">chat_bubble</span>
            <span className="tabular-nums font-mono">{post.commentsCount}</span>
          </button>
        </div>

        {/* Bookmark Toggle */}
        <button
          type="button"
          className={`${styles.actionButton} ${post.isBookmarked ? styles.bookmarkActive : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onBookmarkToggle(post.id);
          }}
          aria-label="Bookmark post"
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontVariationSettings: post.isBookmarked ? "'FILL' 1" : "'FILL' 0",
            }}
          >
            bookmark
          </span>
        </button>
      </div>

      {/* Nested Preview Comment */}
      {post.previewComment && (
        <div
          className={styles.previewCommentBlock}
          onClick={(e) => {
            e.stopPropagation();
            onPostClick ? onPostClick(post) : onCommentClick(post);
          }}
          style={{ cursor: 'pointer' }}
          title="Click to view all comments"
        >
          <div className={styles.commentAvatar}>
            {post.previewComment.avatarUrl ? (
              <img
                src={post.previewComment.avatarUrl}
                alt={post.previewComment.authorName}
                className={styles.commentAvatarImg}
              />
            ) : (
              post.previewComment.avatarInitials
            )}
          </div>
          <div className={styles.commentBody}>
            <div className={styles.commentHeader}>
              <span className={styles.commentAuthor}>{post.previewComment.authorName}</span>
              <span className={styles.commentDeptBadge}>
                {post.previewComment.department}
              </span>
              <span className="tabular-nums font-mono" style={{ fontSize: '12px', color: '#94A3B8' }}>
                • {post.previewComment.timestamp}
              </span>
            </div>
            <p className={styles.commentText}>{post.previewComment.text}</p>
          </div>
        </div>
      )}

      {/* Two-Step Post Deletion Confirmation Modal (Portaled to document.body) */}
      {showDeleteConfirm &&
        createPortal(
          <div
            className={styles.modalBackdrop}
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(false);
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-dialog-title-${post.id}`}
          >
            <div
              className={styles.confirmDialog}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.dialogIconWrap}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#DC2626' }}>
                  delete_forever
                </span>
              </div>

              <h3 id={`delete-dialog-title-${post.id}`} className={styles.dialogTitle}>
                Delete Bulletin?
              </h3>
              <p className={styles.dialogDesc}>
                Are you sure you want to delete this bulletin? This action cannot be undone and will permanently remove this post and all its comments.
              </p>

              <div className={styles.dialogActions}>
                <button
                  type="button"
                  className={styles.cancelDialogBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.confirmDeleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(false);
                    onDeletePost?.(post.id);
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    delete
                  </span>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </article>
  );
};
