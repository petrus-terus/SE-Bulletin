import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Post, Comment } from '../types/bulletin';
import styles from './PostDetailView.module.css';

interface Props {
  post: Post;
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: string;
  onBack: () => void;
  onLikeToggle: (postId: string) => void;
  onBookmarkToggle: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
  onImageClick: (imageUrl: string, title?: string, location?: string | null) => void;
  onAddComment: (postId: string, text: string) => void;
  onAuthorClick?: (author: Post['author']) => void;
}

export const PostDetailView: React.FC<Props> = ({
  post,
  currentUserId,
  currentUserName,
  currentUserRole,
  onBack,
  onLikeToggle,
  onBookmarkToggle,
  onDeletePost,
  onImageClick,
  onAddComment,
  onAuthorClick,
}) => {
  const [commentInput, setCommentInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

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

  const handleCopyLink = () => {
    const link = `${window.location.origin}/#post-${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  };
  const [localComments, setLocalComments] = useState<Comment[]>(() => {
    const list: Comment[] = [];
    if (post.previewComment) {
      list.push(post.previewComment);
    }
    return list;
  });

  const handleLike = () => {
    onLikeToggle(post.id);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const newComment: Comment = {
      id: `c-local-${Date.now()}`,
      authorName: 'Mohd Irfan',
      department: 'IT',
      avatarUrl: '/user_face.png',
      avatarInitials: 'MI',
      text: commentInput.trim(),
      timestamp: 'Just now',
      likesCount: 0,
    };

    setLocalComments((prev) => [...prev, newComment]);
    onAddComment(post.id, commentInput.trim());
    setCommentInput('');
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
    <div className={styles.container}>
      {/* 1. Sticky Frosted Navigation Header */}
      <header className={styles.stickyHeader}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
          aria-label="Back to bulletin feed"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
            arrow_back
          </span>
          <span>Feed</span>
        </button>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={`${styles.iconButton} ${post.isBookmarked ? styles.iconButtonActive : ''}`}
            onClick={() => onBookmarkToggle(post.id)}
            title={post.isBookmarked ? 'Saved to bookmarks' : 'Save post'}
            aria-label="Bookmark post"
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '20px',
                fontVariationSettings: post.isBookmarked ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              bookmark
            </span>
          </button>

          <button
            type="button"
            className={styles.iconButton}
            onClick={handleCopyLink}
            title={linkCopied ? 'Link copied!' : 'Copy intranet link'}
            aria-label="Copy post link"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {linkCopied ? 'done' : 'link'}
            </span>
          </button>

          {canDelete && (
            <button
              type="button"
              className={`${styles.iconButton} ${styles.deleteIconButton}`}
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete this bulletin"
              aria-label="Delete post"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#DC2626' }}>
                delete_outline
              </span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Article Content */}
      <article className={styles.articleWrapper}>
        {/* Author Details Row */}
        <div className={styles.authorRow}>
          <div
            className={styles.authorLeft}
            onClick={() => onAuthorClick?.(post.author)}
            style={onAuthorClick ? { cursor: 'pointer' } : undefined}
            title={onAuthorClick ? `View profile of ${post.author.name}` : undefined}
          >
            <div className={styles.avatarWrap}>
              <img
                src={post.author.avatarUrl}
                alt={post.author.name}
                className={styles.authorAvatar}
              />
              {post.author.isVerified && (
                <span className={styles.verifiedCheck} title="Verified Sabah Electricity Officer">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '15px', color: '#0055A4', fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                </span>
              )}
            </div>

            <div className={styles.authorMeta}>
              <div className={styles.authorNameLine}>
                <span className={styles.authorName}>{post.author.name}</span>
                {post.departmentName && (
                  <span
                    className={styles.deptPill}
                    style={{ backgroundColor: post.departmentColor || '#0055A4' }}
                  >
                    {post.departmentName}
                  </span>
                )}
              </div>
              <div className={styles.authorSubLine}>
                <span>{post.author.designation}</span>
                <span>•</span>
                <span className="tabular-nums font-mono">{post.timestamp}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Post Title */}
        <h1 className={styles.postTitle}>{post.title}</h1>

        {/* Post Text Body */}
        <div className={styles.postBody}>{renderFormattedContent(post.content)}</div>

        {/* Uncropped Full Photo (Tap to zoom) */}
        {post.imageUrl && (
          <div
            className={styles.mediaFrame}
            onClick={() => onImageClick(post.imageUrl!, post.title, post.location)}
            role="button"
            tabIndex={0}
            aria-label="Tap to view image in full screen"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onImageClick(post.imageUrl!, post.title, post.location);
              }
            }}
          >
            <img
              src={post.imageUrl}
              alt={post.title}
              className={styles.fullImage}
            />

            <div className={styles.zoomBadge}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                zoom_in
              </span>
              <span>Tap to zoom</span>
            </div>

            {post.location && (
              <div className={styles.locationChip}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  location_on
                </span>
                <span>{post.location}</span>
              </div>
            )}
          </div>
        )}

        {/* Engagement Summary Bar */}
        <div className={styles.engagementBar}>
          <div className={styles.engagementLeft}>
            <button
              type="button"
              className={`${styles.likeBtn} ${post.isLiked ? styles.likeBtnLiked : ''}`}
              onClick={handleLike}
              aria-label="Like post"
            >
              <span
                className={`material-symbols-outlined ${post.isLiked ? styles.likeIconActive : ''}`}
                style={{ fontSize: '22px' }}
              >
                favorite
              </span>
              <span className="tabular-nums font-mono font-semibold">
                {post.likesCount} {post.likesCount === 1 ? 'Reaction' : 'Reactions'}
              </span>
            </button>

            <span className={styles.statItem}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                chat_bubble_outline
              </span>
              <span className="tabular-nums font-mono">
                {localComments.length + post.commentsCount}
              </span>
            </span>
          </div>
        </div>

        {/* 3. Discussion Thread Stream */}
        <section className={styles.discussionSection} aria-label="Staff Discussion Thread">
          <div className={styles.discussionTitleGroup}>
            <h2 className={styles.discussionTitle}>Internal Discussion</h2>
            <span className="font-mono tabular-nums text-xs text-slate-500">
              {localComments.length} active responses
            </span>
          </div>

          <div className={styles.commentsList}>
            {localComments.length === 0 ? (
              <p style={{ fontSize: 'var(--font-size-sm)', color: '#64748B', fontStyle: 'italic', padding: '12px 0' }}>
                No comments yet. Be the first to share an update or question!
              </p>
            ) : (
              localComments.map((comment) => (
                <div key={comment.id} className={styles.commentBubble}>
                  {comment.avatarUrl ? (
                    <img
                      src={comment.avatarUrl}
                      alt={comment.authorName}
                      className={styles.commentAvatar}
                    />
                  ) : (
                    <div className={styles.avatarFallback}>
                      {comment.avatarInitials || comment.authorName.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className={styles.commentBody}>
                    <div className={styles.commentHeader}>
                      <div>
                        <span className={styles.commentAuthor}>{comment.authorName}</span>
                        {comment.department && (
                          <span className={styles.commentDept}>• {comment.department}</span>
                        )}
                      </div>
                      <span className={`tabular-nums font-mono ${styles.commentTime}`}>
                        {comment.timestamp}
                      </span>
                    </div>

                    <div className={styles.commentText}>{comment.text}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </article>

      {/* 4. Sticky Bottom Mobile Reply Bar */}
      <form className={styles.bottomReplyBar} onSubmit={handleSendComment}>
        <input
          type="text"
          placeholder="Write a comment as Mohd Irfan..."
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          className={styles.replyInput}
          aria-label="Comment text"
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={!commentInput.trim()}
          aria-label="Submit comment"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            send
          </span>
        </button>
      </form>

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

              <h3 className={styles.dialogTitle}>Delete Bulletin?</h3>
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
                    onBack();
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
    </div>
  );
};
