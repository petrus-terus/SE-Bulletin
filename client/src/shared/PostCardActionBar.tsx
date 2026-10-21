import React, { useState } from 'react';
import type { Post } from '@/types/bulletin';
import { formatCompactNumber } from '@/utils/format';
import styles from './FeedCard.module.css';

interface PostCardActionBarProps {
  post: Post;
  onLikeToggle?: (postId: string) => void;
  onCommentClick?: (post: Post) => void;
  onReshareClick?: (post: Post) => void;
}

export const PostCardActionBar: React.FC<PostCardActionBarProps> = ({
  post,
  onLikeToggle,
  onCommentClick,
  onReshareClick,
}) => {
  const [justLiked, setJustLiked] = useState(false);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.isLiked) {
      setJustLiked(true);
      setTimeout(() => setJustLiked(false), 600);
    }
    onLikeToggle?.(post.id);
  };

  return (
    <div className={styles.engagementBar} onClick={(e) => e.stopPropagation()}>
      <div className={styles.leftActions}>
        {/* Like Button */}
        <button
          type="button"
          className={`${styles.actionButton} ${post.isLiked ? styles.likeActive : ''}`}
          onClick={handleLikeClick}
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
            onCommentClick?.(post);
          }}
          aria-label="View comments"
        >
          <span className="material-symbols-outlined">chat_bubble</span>
          <span className="tabular-nums font-mono">{post.commentsCount}</span>
        </button>

        {/* Reshare / Repost Button */}
        <button
          type="button"
          className={`${styles.actionButton} ${post.isReshared ? styles.reshareActive : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onReshareClick?.(post);
          }}
          aria-label={post.isReshared ? 'Undo reshare' : 'Reshare post'}
        >
          <span className="material-symbols-outlined">repeat</span>
          <span className="tabular-nums font-mono">{post.resharesCount || 0}</span>
        </button>
      </div>

      <div className={styles.rightActions}>
        <span
          className={styles.viewMetric}
          title={`${(post.viewsCount || 0).toLocaleString()} Views`}
          aria-label={`${post.viewsCount || 0} views`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>
            visibility
          </span>
          <span className="tabular-nums font-mono">
            {formatCompactNumber(post.viewsCount || 0)}
          </span>
        </span>
      </div>
    </div>
  );
};