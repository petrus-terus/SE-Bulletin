import React, { useState } from 'react';
import type { Post } from '../types/bulletin';
import styles from './FeedCard.module.css';

interface Props {
  post: Post;
  onLikeToggle: (postId: string) => void;
  onCommentClick: (post: Post) => void;
  onShareClick: (post: Post) => void;
  onBookmarkToggle: (postId: string) => void;
}

export const FeedCard: React.FC<Props> = ({
  post,
  onLikeToggle,
  onCommentClick,
  onShareClick,
  onBookmarkToggle,
}) => {
  const [justLiked, setJustLiked] = useState(false);

  const handleLike = () => {
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
    <article className={styles.card}>
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
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    push_pin
                  </span>
                  <span>Pinned</span>
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

        <button type="button" className={styles.optionsButton} aria-label="Post options">
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </header>

      {/* Main Post Content */}
      <div className={styles.postContent}>
        <h2 className={styles.postTitle}>{post.title}</h2>
        <p className={styles.postBody}>{renderFormattedContent(post.content)}</p>
      </div>

      {/* Optional High-Res Imagery */}
      {post.imageUrl && (
        <div className={styles.imageWrapper}>
          <img src={post.imageUrl} alt={post.title} className={styles.postImage} />
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

      {/* Engagement Actions Row (Decision 1A: Spring bounce + instant tabular count) */}
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
            onClick={() => onCommentClick(post)}
            aria-label="View comments"
          >
            <span className="material-symbols-outlined">chat_bubble</span>
            <span className="tabular-nums font-mono">{post.commentsCount}</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            className={styles.actionButton}
            onClick={() => onShareClick(post)}
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
          onClick={() => onBookmarkToggle(post.id)}
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

      {/* Nested Preview Comment (Stitch-inspired) */}
      {post.previewComment && (
        <div
          className={styles.previewCommentBlock}
          onClick={() => onCommentClick(post)}
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
