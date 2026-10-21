import React, { useState } from 'react';
import type { Post } from '@/types/bulletin';
import { InteractivePollCard } from '@/shared/InteractivePollCard';
import { FormattedContent } from '@/shared/FormattedContent';
import { PostPdfCard } from '@/shared/PostPdfCard';
import { QuotedPostCard } from '@/shared/QuotedPostCard';
import { DeletePostDialog } from '@/shared/DeletePostDialog';
import { PostCardHeader } from '@/shared/PostCardHeader';
import { PostCardActionBar } from '@/shared/PostCardActionBar';
import { handleAvatarError, handlePostImageError } from '@/utils/imageFallbacks';
import styles from './FeedCard.module.css';

interface Props {
  post: Post;
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: string;
  onLikeToggle?: (postId: string) => void;
  onCommentClick?: (post: Post) => void;
  onBookmarkToggle?: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
  onEditPost?: (post: Post) => void;
  onPostClick?: (post: Post) => void;
  onAuthorClick?: (author: Post['author']) => void;
  onVotePoll?: (postId: string, optionId: string) => void;
  onSharePost?: (post: Post) => void;
  onReshareClick?: (post: Post) => void;
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
  onEditPost,
  onPostClick,
  onAuthorClick,
  onVotePoll,
  onSharePost,
  onReshareClick,
}) => {
  const [imageError, setImageError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <article
      className={`${styles.card} ${post.isPinned ? styles.cardPinned : ''}`}
      onClick={() => onPostClick?.(post)}
    >
      {/* Repost / Reshared Banner if applicable */}
      {post.resharedBy && (
        <div className={styles.resharedHeader}>
          <span className={`material-symbols-outlined ${styles.resharedIcon}`}>
            repeat
          </span>
          <span>{post.resharedBy.name} reposted</span>
        </div>
      )}

      {/* 1. Standardized Post Card Header */}
      <PostCardHeader
        post={post}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        currentUserRole={currentUserRole}
        onAuthorClick={onAuthorClick}
        onBookmarkToggle={onBookmarkToggle}
        onSharePost={onSharePost}
        onEditPost={onEditPost}
        onDeleteClick={() => setShowDeleteConfirm(true)}
      />

      {/* 2. Main Post Content */}
      <div className={styles.postContent}>
        {post.title && <h2 className={styles.postTitle}>{post.title}</h2>}
        <p className={styles.postBody}>
          <FormattedContent content={post.content} />
        </p>
      </div>

      {/* 3. Interactive Poll Card */}
      {post.poll && (
        <div onClick={(e) => e.stopPropagation()}>
          <InteractivePollCard
            poll={post.poll}
            onVote={(optionId) => onVotePoll?.(post.id, optionId)}
          />
        </div>
      )}

      {/* 4. Verified Corporate PDF Circular Attachment */}
      {post.pdfUrl && (
        <PostPdfCard
          pdfUrl={post.pdfUrl}
          pdfName={post.pdfName}
          pdfSize={post.pdfSize}
        />
      )}

      {/* 5. Quoted Bulletin Card */}
      {post.quotedPost && (
        <QuotedPostCard
          post={post.quotedPost}
          onClick={() => onPostClick?.(post.quotedPost!)}
        />
      )}

      {/* 6. Multi-Image Gallery or Single High-Res Imagery */}
      {post.mediaUrls && post.mediaUrls.length > 1 ? (
        <div className={styles.multiImageTrack} onClick={(e) => e.stopPropagation()}>
          {post.mediaUrls.map((url, idx) => (
            <div key={idx} className={styles.multiImageSlide}>
              <img
                src={url}
                alt=""
                loading="lazy"
                decoding="async"
                onError={(e) => handlePostImageError(e)}
              />
              <span className={`tabular-nums font-mono ${styles.multiImageBadge}`}>
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
            loading="lazy"
            decoding="async"
            className={styles.postImage}
            onError={(e) => {
              setImageError(true);
              handlePostImageError(e);
            }}
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
      {post.location && (!post.imageUrl || imageError) && (!post.mediaUrls || post.mediaUrls.length <= 1) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            marginTop: '8px',
            padding: '0 16px',
            fontWeight: 500,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '14px', color: 'var(--color-primary-text)' }}
          >
            location_on
          </span>
          <span>{post.location}</span>
        </div>
      )}

      {/* 7. Standardized Engagement Action Bar */}
      <PostCardActionBar
        post={post}
        onLikeToggle={onLikeToggle}
        onCommentClick={onCommentClick}
        onReshareClick={onReshareClick}
      />

      {/* 8. Nested Preview Comment */}
      {post.previewComment && (
        <div
          className={styles.previewCommentBlock}
          onClick={(e) => {
            e.stopPropagation();
            if (onPostClick) {
              onPostClick(post);
            } else {
              onCommentClick?.(post);
            }
          }}
          style={{ cursor: 'pointer' }}
          title="Click to view all comments"
        >
          <div className={styles.commentAvatar}>
            {post.previewComment.avatarUrl ? (
              <img
                src={post.previewComment.avatarUrl}
                alt=""
                className={styles.commentAvatarImg}
                onError={(e) => handleAvatarError(e)}
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
              <span className="tabular-nums font-mono" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                • {post.previewComment.timestamp}
              </span>
            </div>
            <p className={styles.commentText}>{post.previewComment.text}</p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeletePostDialog
          postId={post.id}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={async () => {
            if (onDeletePost) {
              await onDeletePost(post.id);
            }
            setShowDeleteConfirm(false);
          }}
        />
      )}
    </article>
  );
};
