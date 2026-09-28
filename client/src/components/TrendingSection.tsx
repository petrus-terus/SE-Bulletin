import React from 'react';
import type { Post } from '../types/bulletin';
import styles from './TrendingSection.module.css';

interface Props {
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onOpenComments: (post: Post) => void;
}

export const TrendingSection: React.FC<Props> = ({ posts, onSelectPost, onOpenComments }) => {
  // Take top posts sorted by likesCount + commentsCount
  const trendingPosts = [...posts]
    .sort((a, b) => b.likesCount + b.commentsCount - (a.likesCount + a.commentsCount))
    .slice(0, 4);

  return (
    <section className={styles.trendingContainer} aria-label="Trending Bulletins">
      <div className={styles.sectionHeader}>
        <div className={styles.titleGroup}>
          <span className={styles.trendBadge}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#EF4444' }}>
              local_fire_department
            </span>
            <span>Trending Across SESB</span>
          </span>
          <span className={styles.livePulseDot} title="Live Real-time updates"></span>
        </div>
        <span className={styles.subtext}>Most discussed updates statewide</span>
      </div>

      <div className={styles.scrollTrack}>
        {trendingPosts.map((post, idx) => (
          <div
            key={post.id}
            className={styles.trendCard}
            onClick={() => onSelectPost(post)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectPost(post);
              }
            }}
          >
            {/* Top row: Rank badge + Department pill */}
            <div className={styles.cardTop}>
              <span className={styles.rankBadge}>
                #{idx + 1}
              </span>
              <span
                className={styles.deptPill}
                style={{
                  backgroundColor: `${post.departmentColor || '#0055A4'}18`,
                  color: post.departmentColor || '#0055A4',
                }}
              >
                {post.departmentName || post.author?.department || 'Operations'}
              </span>
            </div>

            {/* Title / Snippet */}
            <h3 className={styles.postTitle}>
              {post.title || post.content.slice(0, 75) + '...'}
            </h3>

            {/* Author info & Discussion metrics */}
            <div className={styles.cardBottom}>
              <div className={styles.authorRow}>
                <span className={styles.authorName}>{post.author?.name || 'SESB Staff'}</span>
                <span className={styles.dotSeparator}>•</span>
                <span className="font-mono tabular-nums text-xs">{post.timestamp}</span>
              </div>

              <div className={styles.statsRow}>
                <span className={styles.statItem}>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#EF4444' }}>
                    favorite
                  </span>
                  <span className="font-mono tabular-nums">{post.likesCount}</span>
                </span>

                <button
                  type="button"
                  className={styles.commentBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenComments(post);
                  }}
                  title="View comments"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#0055A4' }}>
                    chat_bubble
                  </span>
                  <span className="font-mono tabular-nums">{post.commentsCount}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
