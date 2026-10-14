import React, { useEffect, useState } from 'react';
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
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), durationMs);
    const unmountTimer = setTimeout(onDismiss, durationMs + 200);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(unmountTimer);
    };
  }, [durationMs, onDismiss]);

  if (!message) return null;

  return (
    <div className={styles.toastContainer}>
      <div
        className={`${styles.toastPill} ${exiting ? styles.toastExiting : ''}`}
        role="status"
        aria-live="polite"
      >
        <span className={`material-symbols-outlined ${styles.toastIcon}`}>
          {icon}
        </span>
        <span>{message}</span>
      </div>
    </div>
  );
};
