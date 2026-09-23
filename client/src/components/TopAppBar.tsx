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
          <svg className={styles.logoIcon} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="9" fill="#F0F4F8" />
            {/* Kinabalu Dual Peaks (SESB Blue & Forest Green) */}
            <path d="M 6,28 L 18,10 L 23,19 L 16,28 Z" fill="#0055A4" />
            <path d="M 16,28 L 24,14 L 30,28 Z" fill="#1A7A5A" />
            <circle cx="18" cy="10" r="2.2" fill="#10B981" />
          </svg>
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
