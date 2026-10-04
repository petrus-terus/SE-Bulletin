import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Post } from '../types/bulletin';
import styles from './QuoteBulletinModal.module.css';

interface Props {
  isOpen: boolean;
  quotedPost: Post;
  currentUserAvatar?: string;
  currentUserName?: string;
  onClose: () => void;
  onSubmit: (commentText: string) => void;
}

export const QuoteBulletinModal: React.FC<Props> = ({
  isOpen,
  quotedPost,
  currentUserAvatar,
  currentUserName,
  onClose,
  onSubmit,
}) => {
  const [commentText, setCommentText] = useState('');

  const handleClose = useCallback(() => {
    setCommentText('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handlePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setCommentText('');
    onSubmit(text);
    onClose();
  };

  const quotedMedia =
    (quotedPost.mediaUrls && quotedPost.mediaUrls[0]) || quotedPost.imageUrl;

  return createPortal(
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        e.stopPropagation();
        handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Quote bulletin"
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className={styles.headerBar}>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close quote modal"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              close
            </span>
          </button>

          <span className={styles.headerTitle}>Quote Bulletin</span>

          <button
            type="button"
            className={styles.postBtn}
            disabled={!commentText.trim()}
            onClick={handlePost}
          >
            Post
          </button>
        </div>

        {/* Composer Body */}
        <div className={styles.bodyArea}>
          <div className={styles.authorRow}>
            <img
              src={currentUserAvatar || '/user_face.png'}
              alt=""
              className={styles.userAvatar}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/user_face.png';
              }}
            />
            <div className={styles.authorMetaText}>
              <span className={styles.authorPostingLabel}>
                Posting as <strong>{currentUserName || 'Staff Member'}</strong>
              </span>
              <span className={styles.visibilityBadge}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                  public
                </span>
                <span>Wisma SESB Feed</span>
              </span>
            </div>
          </div>

          <div className={styles.mainComposer}>
            <textarea
              className={styles.textarea}
              placeholder="Add your thoughts or commentary..."
              autoFocus
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
            />

            {/* Quoted Post Card Preview */}
            <div className={styles.quotedCardPreview}>
              <div className={styles.quotedHeader}>
                <img
                  src={quotedPost.author.avatarUrl || '/user_face.png'}
                  alt=""
                  className={styles.quotedAvatar}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/user_face.png';
                  }}
                />
                <span className={styles.quotedAuthorName}>{quotedPost.author.name}</span>
                <span className={styles.quotedAuthorMeta}>
                  • {quotedPost.author.department}
                </span>
                <span className={`tabular-nums font-mono ${styles.quotedAuthorMeta}`}>
                  • {quotedPost.timestamp}
                </span>
              </div>

              <div className={styles.quotedBodyText}>
                {quotedPost.title ? <strong>{quotedPost.title} — </strong> : null}
                {quotedPost.content}
              </div>

              {quotedMedia && (
                <div className={styles.quotedMediaWrapper}>
                  <img
                    src={quotedMedia}
                    alt=""
                    className={styles.quotedMediaImg}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className={styles.footerBar}>
          <div className={styles.audienceNotice}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              info
            </span>
            <span>Quoted bulletins appear in the company bulletin feed with original credit.</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
