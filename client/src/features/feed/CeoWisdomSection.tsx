import React from 'react';
import type { Post } from '@/types/bulletin';
import { InteractivePollCard } from '@/shared/InteractivePollCard';
import styles from './CeoWisdomSection.module.css';

interface Props {
  ceoPost?: Post;
  onVotePoll?: (postId: string, optionId: string) => void;
  onLikeToggle?: (postId: string) => void;
  onCommentClick?: (post: Post) => void;
  onBookmarkToggle?: (postId: string) => void;
  onViewCeoProfile?: () => void;
  onPostClick?: (post: Post) => void;
}

export const CeoWisdomSection: React.FC<Props> = ({
  ceoPost,
  onVotePoll,
  onLikeToggle,
  onCommentClick,
  onBookmarkToggle,
  onViewCeoProfile,
  onPostClick,
}) => {
  const authorAvatar = '/ceo_portrait.png';
  const authorName = ceoPost?.author?.name || 'Datuk Ir. Ts. Mohd Yaakob Hj. Jaafar';

  return (
    <section className={styles.sectionContainer} aria-label="CEO Wisdom & Leadership Bulletins">
      <div className={styles.sectionHeader}>
        <div className={styles.titleRow}>
          <span className={`material-symbols-outlined ${styles.trendingIcon}`}>
            trending_up
          </span>
          <h2 className={styles.sectionTitle}>CEO Wisdom</h2>
        </div>
      </div>

      <div
        className={styles.card}
        onClick={() => {
          if (ceoPost && onPostClick) {
            onPostClick(ceoPost);
          } else if (onViewCeoProfile) {
            onViewCeoProfile();
          }
        }}
      >
        <div className={styles.cardTop}>
          <div
            className={styles.avatarWrap}
            onClick={(e) => {
              if (onViewCeoProfile) {
                e.stopPropagation();
                onViewCeoProfile();
              }
            }}
            title="View CEO Profile"
            style={{ cursor: 'pointer' }}
          >
            <img
              src={authorAvatar}
              alt=""
              className={styles.avatarImg}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/ceo_portrait.png';
              }}
            />
            <div className={styles.verifiedPill}>
              <span className={`material-symbols-outlined ${styles.verifiedPillIcon}`}>
                verified
              </span>
            </div>
          </div>

          <div className={styles.authorInfo}>
            <div className={styles.authorNameRow}>
              <span
                className={styles.authorName}
                onClick={(e) => {
                  if (onViewCeoProfile) {
                    e.stopPropagation();
                    onViewCeoProfile();
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                {authorName}
              </span>
              <span className={styles.roleTag}>CEO</span>
            </div>
            <span className={styles.authorMeta}>
              Chief Executive Officer • Executive Suite, Wisma SE
              {ceoPost?.timestamp ? ` • ${ceoPost.timestamp}` : ''}
            </span>
          </div>
        </div>

        {/* CEO Bulletin Title & Content */}
        {ceoPost && (
          <div className={styles.bulletinContent}>
            {ceoPost.title && <h3 className={styles.bulletinTitle}>{ceoPost.title}</h3>}
            <p className={styles.bulletinBody}>{ceoPost.content}</p>
          </div>
        )}

        {/* Embedded Interactive Poll inside CEO Wisdom */}
        {ceoPost?.poll && (
          <div className={styles.pollWrapper} onClick={(e) => e.stopPropagation()}>
            <InteractivePollCard
              poll={ceoPost.poll}
              onVote={(optionId) => onVotePoll?.(ceoPost.id, optionId)}
            />
          </div>
        )}

        {/* Clean Engagement & View All Bar */}
        <div className={styles.cardFooter} onClick={(e) => e.stopPropagation()}>
          <div className={styles.footerLeftActions}>
            {ceoPost && onLikeToggle && (
              <button
                type="button"
                className={`${styles.actionBtn} ${ceoPost.isLiked ? styles.likeActive : ''}`}
                onClick={() => onLikeToggle(ceoPost.id)}
                aria-label="Like post"
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontVariationSettings: ceoPost.isLiked ? "'FILL' 1" : "'FILL' 0",
                    fontSize: '20px',
                    color: ceoPost.isLiked ? '#EF4444' : undefined,
                  }}
                >
                  favorite
                </span>
                <span className="font-mono tabular-nums">{ceoPost.likesCount}</span>
              </button>
            )}

            {ceoPost && onCommentClick && (
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => onCommentClick(ceoPost)}
                aria-label="View comments"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  chat_bubble
                </span>
                <span className="font-mono tabular-nums">{ceoPost.commentsCount}</span>
              </button>
            )}

            {ceoPost && onBookmarkToggle && (
              <button
                type="button"
                className={`${styles.actionBtn} ${ceoPost.isBookmarked ? styles.bookmarkActive : ''}`}
                onClick={() => onBookmarkToggle(ceoPost.id)}
                aria-label="Save post"
                title="Save post"
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontVariationSettings: ceoPost.isBookmarked ? "'FILL' 1" : "'FILL' 0",
                    fontSize: '20px',
                    color: ceoPost.isBookmarked ? '#0055A4' : undefined,
                  }}
                >
                  bookmark
                </span>
              </button>
            )}
          </div>

          <button
            type="button"
            className={styles.viewBulletinsBtn}
            onClick={() => onViewCeoProfile?.()}
            aria-label="View all bulletins made by the CEO"
          >
            <span>All CEO Bulletins</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};
