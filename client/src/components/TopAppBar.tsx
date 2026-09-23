import React from 'react';
import type { Employee } from '../types/bulletin';
import styles from './TopAppBar.module.css';

interface Props {
  currentUser: Employee;
  unreadCount?: number;
  onNotificationClick: () => void;
  onProfileClick: () => void;
}

export const TopAppBar: React.FC<Props> = ({
  currentUser,
  unreadCount = 3,
  onNotificationClick,
  onProfileClick,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Brand Logo & Wordmark */}
        <div className={styles.brandGroup} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/sesb_logo.png" alt="Sabah Electricity Logo" className={styles.logoIcon} />
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Sabah Electricity</span>
            <span className={styles.brandSubtitle}>Internal Bulletin</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className={styles.actionsGroup}>
          <div className={styles.syncBadge} title="Connected to SESB Corporate Grid Network">
            <span className={styles.syncDot} />
            <span className="tabular-nums">Live</span>
          </div>

          <button
            type="button"
            className={styles.iconButton}
            onClick={onNotificationClick}
            aria-label="View notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className={`${styles.notifBadge} tabular-nums font-mono`}>
                {unreadCount}
              </span>
            )}
          </button>

          <div
            className={styles.avatarWrapper}
            onClick={onProfileClick}
            title={`${currentUser.name} (${currentUser.department})`}
          >
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className={styles.avatarImg}
            />
            {currentUser.isOnline && <span className={styles.onlineDot} />}
          </div>
        </div>
      </div>
    </header>
  );
};
