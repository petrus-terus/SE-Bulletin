import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Post, Comment } from '@/types/bulletin';
import { InteractivePollCard } from '@/shared/InteractivePollCard';
import { FormattedContent } from '@/shared/FormattedContent';
import { PostPdfCard } from '@/shared/PostPdfCard';
import { QuotedPostCard } from '@/shared/QuotedPostCard';
import { DeletePostDialog } from '@/shared/DeletePostDialog';
import { getPostPermissions } from '@/utils/postPermissions';
import { formatCompactNumber } from '@/utils/format';
import styles from './PostDetailView.module.css';

interface Props {
  post: Post;
  comments?: Comment[];
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: string;
  onBack: () => void;
  onLikeToggle: (postId: string) => void;
  onBookmarkToggle: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
  onEditPost?: (post: Post) => void;
  onImageClick: (imageUrl: string, title?: string, location?: string | null) => void;
  onAddComment: (postId: string, text: string) => void;
  onAuthorClick?: (author: Post['author']) => void;
  onVotePoll?: (postId: string, optionId: string) => void;
  onReshareClick?: (post: Post) => void;
}

export const PostDetailView: React.FC<Props> = ({
  post,
  comments,
  currentUserId,
  currentUserName,
  currentUserRole,
  onBack,
  onLikeToggle,
  onBookmarkToggle,
  onDeletePost,
  onEditPost,
  onImageClick,
  onAddComment,
  onAuthorClick,
  onVotePoll,
  onReshareClick,
}) => {
  const [commentInput, setCommentInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const { canEdit, canDelete } = getPostPermissions(post, {
    currentUserId,
    currentUserName,
    currentUserRole,
  });

  const handleCopyLink = () => {
    const link = `${window.location.origin}/#post-${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  };

  // Derive active comment thread from props (cloud synchronized) with fallback to preview
  const activeComments: Comment[] = React.useMemo(() => {
    if (comments && comments.length > 0) {
      return comments;
    }
    if (post.previewComment) {
      return [post.previewComment];
    }
    return [];
  }, [comments, post.previewComment]);

  const handleLike = () => {
    onLikeToggle(post.id);
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    onAddComment(post.id, commentInput.trim());
    setCommentInput('');
  };

  // Edge Swipe-to-Dismiss Touch Gesture Handler
  const touchStartXRef = React.useRef(0);
  const touchStartYRef = React.useRef(0);
  const isSwipingRef = React.useRef(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      // Only allow swipe if initiated within 40px of the left edge
      if (touch.clientX < 40) {
        touchStartXRef.current = touch.clientX;
        touchStartYRef.current = touch.clientY;
        isSwipingRef.current = true;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwipingRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;

    // Cancel if primary motion is vertical scroll
    if (Math.abs(deltaY) > Math.abs(deltaX) && deltaX < 20) {
      isSwipingRef.current = false;
      if (containerRef.current) {
        containerRef.current.style.transform = '';
      }
      return;
    }

    if (deltaX > 0 && containerRef.current) {
      containerRef.current.style.transform = `translate3d(${deltaX}px, 0, 0)`;
      containerRef.current.style.transition = 'none';
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwipingRef.current) return;
    isSwipingRef.current = false;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartXRef.current;

    if (deltaX > 80 && containerRef.current) {
      containerRef.current.style.transition = 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease';
      containerRef.current.style.transform = 'translate3d(100%, 0, 0)';
      containerRef.current.style.opacity = '0';
      setTimeout(() => {
        onBack();
      }, 180);
    } else if (containerRef.current) {
      containerRef.current.style.transition = 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)';
      containerRef.current.style.transform = 'translate3d(0, 0, 0)';
    }
  };

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
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

        {/* Center Spacer */}
        <div className={styles.headerSpacer} />

        <div className={styles.headerActions}>
          {/* Bookmark Toggle Button */}
          <button
            type="button"
            className={`${styles.iconButton} ${post.isBookmarked ? styles.iconButtonActive : ''}`}
            onClick={() => onBookmarkToggle(post.id)}
            title={post.isBookmarked ? 'Remove bookmark' : 'Bookmark bulletin'}
            aria-label={post.isBookmarked ? 'Remove bookmark' : 'Bookmark bulletin'}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '22px',
                fontVariationSettings: post.isBookmarked ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              bookmark
            </span>
          </button>

          {/* Share Bulletin Button */}
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: post.title || 'SE-Connect',
                  url: window.location.href,
                }).catch(() => {});
              } else {
                handleCopyLink();
              }
            }}
            title="Share bulletin"
            aria-label="Share bulletin"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
              {linkCopied ? 'done' : 'share'}
            </span>
          </button>

          {/* More Options */}
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setShowActionSheet(true)}
            title="More options"
            aria-label="More options"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
              more_horiz
            </span>
          </button>
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
                src={post.author.avatarUrl || '/sabah_electricity_logo.png'}
                alt=""
                className={styles.authorAvatar}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/sabah_electricity_logo.png';
                }}
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
                {post.isEdited && (
                  <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted, #64748B)', fontSize: 'var(--font-size-xs, 12px)' }}>
                    {' '}• Edited
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Post Title */}
        <h1 className={styles.postTitle}>{post.title}</h1>

        {/* Post Text Body */}
        <div className={styles.postBody}>
          <FormattedContent content={post.content} />
        </div>

        {/* Quoted Post Embedded Card (Twitter/X Style) */}
        {post.quotedPost && (
          <QuotedPostCard
            post={post.quotedPost}
            className={styles.quotedCard}
          />
        )}

        {/* Interactive Poll (if attached) */}
        {post.poll && (
          <div style={{ marginBottom: '16px' }}>
            <InteractivePollCard
              poll={post.poll}
              onVote={(optionId) => onVotePoll?.(post.id, optionId)}
            />
          </div>
        )}

        {/* Attached Interactive PDF Document Card */}
        {post.pdfUrl && (
          <PostPdfCard
            pdfUrl={post.pdfUrl}
            pdfName={post.pdfName}
            pdfSize={post.pdfSize}
            className={styles.pdfCard}
          />
        )}

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
              alt=""
              className={styles.fullImage}
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
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
                {activeComments.length || post.commentsCount}
              </span>
            </span>

            {/* Reshare / Quote Button */}
            <button
              type="button"
              className={`${styles.engagementBtn} ${post.isReshared ? styles.reshareActive : ''}`}
              onClick={() => onReshareClick?.(post)}
              aria-label={post.isReshared ? 'Undo reshare' : 'Reshare post'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                repeat
              </span>
              <span className="tabular-nums font-mono font-semibold">
                {post.resharesCount || 0}
              </span>
            </button>

          </div>

          <div className={styles.engagementRight}>
            {/* View Count Metric floated cleanly to right */}
            <span
              className={styles.statItem}
              title={`${(post.viewsCount || 1).toLocaleString()} Views`}
              aria-label={`${post.viewsCount || 1} views`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                visibility
              </span>
              <span className="tabular-nums font-mono">
                {formatCompactNumber(post.viewsCount || 1)}
              </span>
            </span>
          </div>
        </div>

        {/* 3. Discussion Thread Stream */}
        <section className={styles.discussionSection} aria-label="Staff Discussion Thread">
          <div className={styles.discussionTitleGroup}>
            <h2 className={styles.discussionTitle}>Internal Discussion</h2>
            <span className="font-mono tabular-nums text-xs text-slate-500">
              {activeComments.length || post.commentsCount} active responses
            </span>
          </div>

          <div className={styles.commentsList}>
            {activeComments.length === 0 ? (
              <p style={{ fontSize: 'var(--font-size-sm)', color: '#64748B', fontStyle: 'italic', padding: '12px 0' }}>
                No comments yet. Be the first to share an update or question!
              </p>
            ) : (
              activeComments.map((comment) => (
                <div key={comment.id} className={styles.commentBubble}>
                  {comment.avatarUrl ? (
                    <img
                      src={comment.avatarUrl}
                      alt=""
                      className={styles.commentAvatar}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/sabah_electricity_logo.png';
                      }}
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
          placeholder={`Write a comment as ${currentUserName || 'colleague'}...`}
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

      {/* Two-Step Post Deletion Confirmation Modal */}
      {showDeleteConfirm && (
        <DeletePostDialog
          postId={post.id}
          onConfirm={() => {
            setShowDeleteConfirm(false);
            onDeletePost?.(post.id);
            onBack();
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* 5. Bottom Action Sheet for Post Options */}
      {showActionSheet &&
        createPortal(
          <div
            className={styles.actionSheetBackdrop}
            onClick={() => setShowActionSheet(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Bulletin options"
          >
            <div
              className={styles.actionSheetContainer}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.actionSheetHandle} />
              <div className={styles.actionSheetList}>
                <button
                  type="button"
                  className={styles.actionSheetItem}
                  onClick={() => {
                    onBookmarkToggle(post.id);
                    setShowActionSheet(false);
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: '22px',
                      color: post.isBookmarked ? '#0055A4' : 'inherit',
                      fontVariationSettings: post.isBookmarked ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >
                    bookmark
                  </span>
                  <span>{post.isBookmarked ? 'Remove Bookmark' : 'Save Bulletin'}</span>
                </button>

                <button
                  type="button"
                  className={styles.actionSheetItem}
                  onClick={() => {
                    handleCopyLink();
                    setShowActionSheet(false);
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                    link
                  </span>
                  <span>{linkCopied ? 'Link Copied!' : 'Copy Intranet Link'}</span>
                </button>

                {canEdit && onEditPost && (
                  <button
                    type="button"
                    className={styles.actionSheetItem}
                    onClick={() => {
                      setShowActionSheet(false);
                      onEditPost(post);
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#0055A4' }}>
                      edit
                    </span>
                    <span>Edit Bulletin</span>
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    className={`${styles.actionSheetItem} ${styles.actionSheetItemDanger}`}
                    onClick={() => {
                      setShowActionSheet(false);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#EF4444' }}>
                      delete_outline
                    </span>
                    <span>Delete Bulletin</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                className={styles.actionSheetCancelBtn}
                onClick={() => setShowActionSheet(false)}
              >
                Cancel
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
