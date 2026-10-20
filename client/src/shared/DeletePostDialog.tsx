import React from 'react';
import { createPortal } from 'react-dom';
import styles from './DeletePostDialog.module.css';

interface DeletePostDialogProps {
  postId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeletePostDialog: React.FC<DeletePostDialogProps> = ({
  postId,
  onConfirm,
  onCancel,
}) => {
  return createPortal(
    <div
      className={styles.modalBackdrop}
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`delete-dialog-title-${postId}`}
    >
      <div
        className={styles.confirmDialog}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.dialogIconWrap}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '28px', color: 'var(--color-alert-red, #DC2626)' }}
          >
            delete_forever
          </span>
        </div>

        <h3 id={`delete-dialog-title-${postId}`} className={styles.dialogTitle}>
          Delete Bulletin?
        </h3>
        <p className={styles.dialogDesc}>
          Are you sure you want to delete this bulletin? This action cannot be undone and will
          permanently remove this post and all its comments.
        </p>

        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.cancelDialogBtn}
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmDeleteBtn}
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              delete
            </span>
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
