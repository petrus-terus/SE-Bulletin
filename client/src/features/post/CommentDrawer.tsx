import React, { useState, useEffect, useRef } from 'react';
import type { Comment, Employee, Post } from '@/types/bulletin';
import styles from './CommentDrawer.module.css';

interface Props {
  post: Post;
  currentUser: Employee;
  isOpen: boolean;
  onClose: () => void;
  onAddComment: (postId: string, commentText: string) => void;
  comments: Comment[];
  onAuthorClick?: (authorName: string, authorDepartment?: string) => void;
}

export const CommentDrawer: React.FC<Props> = ({
  post,
  currentUser,
  isOpen,
  onClose,
  onAddComment,
  comments,
  onAuthorClick,
}) => {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Auto scroll to bottom when new comment arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments.length]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onAddComment(post.id, inputText.trim());
    setInputText('');
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Drag Handle Bar */}
        <div className={styles.dragHandleBar}>
          <div className={styles.dragHandle} />
        </div>

        {/* Drawer Header */}
        <header className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>
            <span>Discussion</span>
            <span className="tabular-nums font-mono" style={{ fontSize: '13px', color: '#64748B' }}>
              ({comments.length})
            </span>
          </h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close comments">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {/* Post Reference */}
        <div className={styles.postReference}>
          <span>Replying to {post.author.name}'s bulletin:</span>
          <p className={styles.postRefTitle}>{post.title}</p>
        </div>

        {/* Threaded Comments List */}
        <div className={styles.commentsList} ref={scrollRef}>
          {comments.length === 0 ? (
            <div className={styles.emptyState}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', opacity: 0.4, marginBottom: '6px' }}>
                forum
              </span>
              <p>No comments yet. Be the first colleague to reply!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className={styles.commentItem}>
                <div
                  onClick={() => onAuthorClick?.(comment.authorName, comment.department)}
                  style={onAuthorClick ? { cursor: 'pointer' } : undefined}
                  title={onAuthorClick ? `View ${comment.authorName}'s profile` : undefined}
                >
                  {comment.avatarUrl ? (
                    <img
                      src={comment.avatarUrl}
                      alt=""
                      className={styles.avatar}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/sabah_electricity_logo.png';
                      }}
                    />
                  ) : (
                    <div className={styles.avatarInitials}>{comment.avatarInitials}</div>
                  )}
                </div>
                <div className={styles.commentContent}>
                  <div className={styles.commentAuthorRow}>
                    <div
                      className={styles.authorNameBadge}
                      onClick={() => onAuthorClick?.(comment.authorName, comment.department)}
                      style={onAuthorClick ? { cursor: 'pointer' } : undefined}
                      title={onAuthorClick ? `View ${comment.authorName}'s profile` : undefined}
                    >
                      <span className={styles.authorName}>{comment.authorName}</span>
                      <span className={styles.deptTag}>{comment.department}</span>
                    </div>
                    <span className={`${styles.timeTag} tabular-nums font-mono`}>{comment.timestamp}</span>
                  </div>
                  <p className={styles.commentMessage}>{comment.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sticky Input Bar at Bottom */}
        <form className={styles.inputBarContainer} onSubmit={handleSubmit}>
          <img
            src={currentUser.avatarUrl || '/sabah_electricity_logo.png'}
            alt=""
            className={styles.userMiniAvatar}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/sabah_electricity_logo.png';
            }}
          />
          <div className={styles.inputFieldWrapper}>
            <input
              ref={inputRef}
              type="text"
              maxLength={5000}
              className={styles.inputField}
              placeholder={`Write a comment as ${currentUser.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!inputText.trim()}
              aria-label="Send comment"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                send
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
