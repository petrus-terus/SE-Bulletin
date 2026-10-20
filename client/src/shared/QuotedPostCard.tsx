import React from 'react';
import type { Post } from '@/types/bulletin';
import styles from './QuotedPostCard.module.css';

interface QuotedPostCardProps {
  post: Post;
  onClick?: () => void;
  className?: string;
}

export const QuotedPostCard: React.FC<QuotedPostCardProps> = ({
  post,
  onClick,
  className,
}) => {
  const mediaUrl =
    (post.mediaUrls && post.mediaUrls[0]) || post.imageUrl || undefined;

  return (
    <div
      className={`${styles.quotedCard} ${className || ''}`}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className={styles.quotedCardHeader}>
        <img
          src={post.author.avatarUrl || '/sabah_electricity_logo.png'}
          alt=""
          className={styles.quotedCardAvatar}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/sabah_electricity_logo.png';
          }}
        />
        <span className={styles.quotedCardAuthor}>{post.author.name}</span>
        <span className={styles.quotedCardMeta}>• {post.author.department}</span>
        <span className={`tabular-nums font-mono ${styles.quotedCardMeta}`}>
          • {post.timestamp}
        </span>
      </div>

      <div className={styles.quotedCardText}>
        {post.title ? <strong>{post.title} — </strong> : null}
        {post.content}
      </div>

      {mediaUrl && (
        <div className={styles.quotedCardMedia}>
          <img
            src={mediaUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      )}
    </div>
  );
};
