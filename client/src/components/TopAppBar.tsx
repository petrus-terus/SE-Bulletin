import React from 'react';
import type { Employee } from '../types/bulletin';
import styles from './TopAppBar.module.css';

interface Props {
  currentUser: Employee;
  unreadCount?: number;
  onNotificationClick?: () => void;
  onProfileClick: () => void;
}

export const TopAppBar: React.FC<Props> = ({
  currentUser,
  onProfileClick,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Official Sabah Electricity Brand Logo + App Title */}
        <div
          className={styles.brandGroup}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          role="button"
          tabIndex={0}
          aria-label="Sabah Electricity Home"
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
              src={currentUser.avatarUrl}
              alt=""
              className={styles.avatarImg}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {currentUser.isOnline && <span className={styles.onlineDot} />}
          </div>
        </div>
      </div>
    </header>
  );
};

