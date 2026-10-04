import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ReshareBottomSheet.module.css';

interface Props {
  isOpen: boolean;
  isReshared?: boolean;
  onClose: () => void;
  onRepost: () => void;
  onQuote: () => void;
}

export const ReshareBottomSheet: React.FC<Props> = ({
  isOpen,
  isReshared,
  onClose,
  onRepost,
  onQuote,
}) => {
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
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Reshare options"
    >
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dragHandle} aria-hidden="true" />

        <div className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>Reshare Bulletin</span>
        </div>

        <div className={styles.actionList}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={(e) => {
              e.stopPropagation();
              onRepost();
              onClose();
            }}
          >
            <div className={`${styles.iconCircle} ${isReshared ? styles.activeCircle : ''}`}>
              <span
                className={`material-symbols-outlined ${styles.actionIcon} ${
                  isReshared ? styles.activeRepostIcon : ''
                }`}
              >
                repeat
              </span>
            </div>
            <div className={styles.actionTextCol}>
              <span className={styles.actionTitle}>
                {isReshared ? 'Undo Repost' : 'Repost'}
              </span>
              <span className={styles.actionDesc}>
                Instantly reshare this bulletin to your colleagues
              </span>
            </div>
          </button>

          <button
            type="button"
            className={styles.actionBtn}
            onClick={(e) => {
              e.stopPropagation();
              onQuote();
              onClose();
            }}
          >
            <div className={styles.iconCircle}>
              <span className={`material-symbols-outlined ${styles.actionIcon}`}>
                edit_note
              </span>
            </div>
            <div className={styles.actionTextCol}>
              <span className={styles.actionTitle}>Quote</span>
              <span className={styles.actionDesc}>
                Add your own perspective or notes before sharing
              </span>
            </div>
          </button>
        </div>

        <button
          type="button"
          className={styles.cancelBtn}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
};
