import React, { useState } from 'react';
import type { Post } from '../types/bulletin';
import styles from './FeedCard.module.css';

interface Props {
  post: Post;
  onLikeToggle: (postId: string) => void;
  onCommentClick: (post: Post) => void;
  onShareClick: (post: Post) => void;
  onBookmarkToggle: (postId: string) => void;
  onPostClick?: (post: Post) => void;
}

export const FeedCard: React.FC<Props> = ({
  post,
  onLikeToggle,
  onCommentClick,
  onShareClick,
  onBookmarkToggle,
  onPostClick,
}) => {
  const [justLiked, setJustLiked] = useState(false);
  const [imageError, setImageError] = useState(false);

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
        <div className={styles.authorBlock}>
          <div className={styles.avatarContainer}>
            <img
              src={post.author.avatarUrl}
              alt={post.author.name}
              className={styles.authorAvatar}
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

        <button
          type="button"
          className={styles.optionsButton}
          aria-label="Post options"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </header>

      {/* Main Post Content */}
      <div className={styles.postContent}>
        <h2 className={styles.postTitle}>{post.title}</h2>
        <p className={styles.postBody}>{renderFormattedContent(post.content)}</p>
      </div>

      {/* Optional High-Res Imagery */}
      {post.imageUrl && !imageError && (
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
      )}

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

          {/* Share Button */}
          <button
            type="button"
            className={styles.actionButton}
            onClick={(e) => {
              e.stopPropagation();
              onShareClick(post);
            }}
            aria-label="Share bulletin post"
          >
            <span className="material-symbols-outlined">share</span>
            <span className="tabular-nums font-mono">{post.sharesCount}</span>
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
    </article>
  );
};
