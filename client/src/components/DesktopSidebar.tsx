import React from 'react';
import type { Employee } from '../types/bulletin';
import type { TabKey } from './BottomNav';
import styles from './DesktopSidebar.module.css';

interface Props {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onCreateClick: () => void;
  currentUser: Employee;
  unreadCount?: number;
}

export const DesktopSidebar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  onCreateClick,
  currentUser,
  unreadCount = 3,
}) => {
  return (
    <nav className={styles.sidebar} aria-label="Desktop Main Navigation">
      <div>
        {/* Brand Header */}
        <div
          className={styles.brandHeader}
          onClick={() => {
            onTabChange('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          role="button"
          tabIndex={0}
          aria-label="SE Bulletin Home"
        >
          <img
            src="/sabah_electricity_logo.png"
            alt="Sabah Electricity"
            className={styles.brandLogo}
            onError={(e) => {
              e.currentTarget.src = '/sesb_logo.png';
            }}
          />
          <span className={styles.brandTitle}>SE Bulletin</span>
        </div>

        {/* Navigation Menu */}
        <div className={styles.navMenu}>
          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'home' ? styles.navItemActive : ''}`}
            onClick={() => onTabChange('home')}
          >
            <span className={`material-symbols-outlined ${styles.navIcon}`}>home</span>
            <span>Feed</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'explore' ? styles.navItemActive : ''}`}
            onClick={() => onTabChange('explore')}
          >
            <span className={`material-symbols-outlined ${styles.navIcon}`}>badge</span>
            <span>Directory</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'notifications' ? styles.navItemActive : ''}`}
            onClick={() => onTabChange('notifications')}
          >
            <span className={`material-symbols-outlined ${styles.navIcon}`}>campaign</span>
            <span>Announcements</span>
            {unreadCount > 0 && <span className={`${styles.badge} font-mono tabular-nums`}>{unreadCount}</span>}
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'profile' ? styles.navItemActive : ''}`}
            onClick={() => onTabChange('profile')}
          >
            <span className={`material-symbols-outlined ${styles.navIcon}`}>person</span>
            <span>My Profile</span>
          </button>

          {/* Prominent Action Button for Desktop */}
          <button
            type="button"
            className={styles.createButton}
            onClick={onCreateClick}
            aria-label="Create new bulletin post"
          >
            <span className={`material-symbols-outlined ${styles.createIcon}`}>add</span>
            <span>New Post</span>
          </button>
        </div>
      </div>

      {/* User profile footer */}
      <div
        className={styles.userFooter}
        onClick={() => onTabChange('profile')}
        role="button"
        tabIndex={0}
        aria-label="View user profile"
      >
        <div className={styles.avatarWrapper}>
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className={styles.avatarImg}
            onError={(e) => {
              e.currentTarget.src = '/default_avatar.png';
            }}
          />
          {currentUser.isOnline && <span className={styles.onlineDot} />}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{currentUser.name}</span>
          <span className={styles.userRole}>{currentUser.designation}</span>
        </div>
      </div>
    </nav>
  );
};
