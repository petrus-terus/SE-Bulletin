import React, { useEffect } from 'react';
import styles from './Toast.module.css';

interface Props {
  message: string;
  icon?: string;
  onDismiss: () => void;
  durationMs?: number;
}

export const Toast: React.FC<Props> = ({
  message,
  icon = 'check_circle',
  onDismiss,
  durationMs = 2800,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  return (
    <div className={styles.toastContainer}>
      <div className={styles.toastPill} role="status" aria-live="polite">
        <span className={`material-symbols-outlined ${styles.toastIcon}`}>
          {icon}
        </span>
        <span>{message}</span>
      </div>
    </div>
  );
};
