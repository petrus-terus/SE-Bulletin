import React from 'react';
import type { Employee } from '@/types/bulletin';
import styles from './TopAppBar.module.css';

interface Props {
  currentUser: Employee;
  unreadCount?: number;
  onNotificationClick?: () => void;
  onProfileClick: () => void;
  onBrandClick?: () => void;
}

export const TopAppBar: React.FC<Props> = ({
  currentUser,
  onProfileClick,
  onBrandClick,
}) => {
  return (
    <header className={styles.header} data-chrome="topbar">
      <div className={styles.inner} data-chrome="topbar-inner">
        {/* Official Sabah Electricity Brand Logo + App Title: Tapping opens Brand Sidebar */}
        <div
          className={styles.brandGroup}
          onClick={onBrandClick || (() => window.scrollTo({ top: 0, behavior: 'smooth' }))}
          role="button"
          tabIndex={0}
          aria-label="Sabah Electricity Navigation Menu"
        >
          <img
            src="/sabah_electricity_logo.png"
            alt="Sabah Electricity"
            className={styles.brandLogoImg}
            onError={(e) => {
              e.currentTarget.src = '/sesb_logo.png';
            }}
          />
          <span className={styles.brandTitle}>SE Bulletin</span>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0055A4', marginLeft: '2px' }}>
            menu
          </span>
        </div>

        {/* Action Controls: Profile Avatar Only */}
        <div className={styles.actionsGroup}>
          <div
            className={styles.avatarWrapper}
            onClick={onProfileClick}
            title={`${currentUser.name} (${currentUser.department})`}
            role="button"
            tabIndex={0}
            aria-label="View user profile"
          >
            <img
              src={currentUser.avatarUrl || '/sabah_electricity_logo.png'}
              alt=""
              className={styles.avatarImg}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/sabah_electricity_logo.png';
              }}
            />
            {currentUser.isOnline && <span className={styles.onlineDot} />}
          </div>
        </div>
      </div>
    </header>
  );
};

