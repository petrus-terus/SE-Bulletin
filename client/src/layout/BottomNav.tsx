import React from 'react';
import styles from './BottomNav.module.css';

export type TabKey = 'home' | 'explore' | 'notifications' | 'profile';

interface Props {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onCreateClick?: () => void;
  unreadCount?: number;
}

export const BottomNav: React.FC<Props> = ({
  activeTab,
  onTabChange,
  onCreateClick,
  unreadCount = 3,
}) => {
  return (
    <nav className={styles.navContainer} aria-label="Bottom Navigation" data-chrome="bottomnav">
      <div className={styles.inner}>
        {/* 1. Home Tab */}
        <button
          type="button"
          className={`${styles.tabItem} ${activeTab === 'home' ? styles.tabActive : ''}`}
          onClick={() => onTabChange('home')}
          aria-label="Home Feed"
        >
          <span
            className={`material-symbols-outlined ${styles.tabIcon}`}
            style={{ fontVariationSettings: activeTab === 'home' ? "'FILL' 1" : "'FILL' 0" }}
          >
            home
          </span>
          <span className={styles.tabLabel}>Home</span>
        </button>

        {/* 2. Explore Tab */}
        <button
          type="button"
          className={`${styles.tabItem} ${activeTab === 'explore' ? styles.tabActive : ''}`}
          onClick={() => onTabChange('explore')}
          aria-label="Explore Directory"
        >
          <span
            className={`material-symbols-outlined ${styles.tabIcon}`}
            style={{ fontVariationSettings: activeTab === 'explore' ? "'FILL' 1" : "'FILL' 0" }}
          >
            explore
          </span>
          <span className={styles.tabLabel}>Explore</span>
        </button>

        {/* 3. Center Elevated FAB (+) */}
        <div className={styles.centerFabWrapper}>
          <button
            type="button"
            className={styles.centerFab}
            onClick={onCreateClick}
            aria-label="Create new bulletin post"
            title="Create Post"
          >
            <span className={`material-symbols-outlined ${styles.fabIcon}`}>add</span>
          </button>
        </div>

        {/* 4. Notifications Tab */}
        <button
          type="button"
          className={`${styles.tabItem} ${activeTab === 'notifications' ? styles.tabActive : ''}`}
          onClick={() => onTabChange('notifications')}
          aria-label="Notifications"
        >
          <span
            className={`material-symbols-outlined ${styles.tabIcon}`}
            style={{ fontVariationSettings: activeTab === 'notifications' ? "'FILL' 1" : "'FILL' 0" }}
          >
            notifications
          </span>
          {unreadCount > 0 && (
            <span className={`${styles.tabBadge} tabular-nums font-mono`}>
              {unreadCount}
            </span>
          )}
          <span className={styles.tabLabel}>Alerts</span>
        </button>

        {/* 5. Profile Tab */}
        <button
          type="button"
          className={`${styles.tabItem} ${activeTab === 'profile' ? styles.tabActive : ''}`}
          onClick={() => onTabChange('profile')}
          aria-label="Staff Profile"
        >
          <span
            className={`material-symbols-outlined ${styles.tabIcon}`}
            style={{ fontVariationSettings: activeTab === 'profile' ? "'FILL' 1" : "'FILL' 0" }}
          >
            person
          </span>
          <span className={styles.tabLabel}>Profile</span>
        </button>
      </div>
    </nav>
  );
};
