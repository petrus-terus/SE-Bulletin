import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Employee } from '../types/bulletin';
import styles from './BrandSidebarDrawer.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Employee;
  savedCount: number;
  onOpenSavedPosts: () => void;
  onLogout: () => void;
}

export const BrandSidebarDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  savedCount,
  onOpenSavedPosts,
  onLogout,
}) => {
  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll when open
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

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Slide-out Drawer from Left */}
      <nav
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
        aria-hidden={!isOpen}
      >
        {/* Brand Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.brandGroup}>
            <img
              src="/sabah_electricity_logo.png"
              alt="Sabah Electricity"
              className={styles.brandLogo}
              onError={(e) => {
                e.currentTarget.src = '/sesb_logo.png';
              }}
            />
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>SE Bulletin</span>
              <span className={styles.brandSubtitle}>Sabah Electricity Sdn. Bhd.</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              close
            </span>
          </button>
        </div>

        {/* User Identity Card with Sabah Electricity Crest Avatar */}
        <div className={styles.userCard}>
          <div className={styles.avatarWrapper}>
            <img
              src="/sabah_electricity_logo.png"
              alt={currentUser.name}
              className={styles.avatarImg}
              onError={(e) => {
                e.currentTarget.src = '/sesb_logo.png';
              }}
            />
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{currentUser.name}</span>
            <span className={styles.userRole}>{currentUser.designation || 'Staff'}</span>
            <span className={styles.userDivision}>INFORMATION & DIGITAL</span>
          </div>
        </div>

        {/* Menu Actions List */}
        <div className={styles.menuList}>
          {/* 1. Saved Posts */}
          <button
            type="button"
            className={styles.menuItem}
            onClick={() => {
              onClose();
              onOpenSavedPosts();
            }}
          >
            <div className={styles.menuItemLeft}>
              <div className={styles.menuIconWrap}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  bookmark
                </span>
              </div>
              <div className={styles.menuItemText}>
                <span className={styles.menuItemLabel}>Saved Posts</span>
                <span className={styles.menuItemSub}>Your bookmarked bulletins</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {savedCount > 0 && (
                <span className={`${styles.badge} font-mono tabular-nums`}>{savedCount}</span>
              )}
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#94A3B8' }}>
                chevron_right
              </span>
            </div>
          </button>

          <div className={styles.divider} />

          {/* 2. Switch / Log Out */}
          <button
            type="button"
            className={`${styles.menuItem} ${styles.logoutItem}`}
            onClick={() => {
              onClose();
              onLogout();
            }}
          >
            <div className={styles.menuItemLeft}>
              <div className={`${styles.menuIconWrap} ${styles.logoutIconWrap}`}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  logout
                </span>
              </div>
              <div className={styles.menuItemText}>
                <span className={`${styles.menuItemLabel} ${styles.logoutItemLabel}`}>
                  Log Out
                </span>
                <span className={styles.menuItemSub}>Switch staff account or end session</span>
              </div>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#FDA4AF' }}>
              chevron_right
            </span>
          </button>
        </div>

        {/* Drawer Footer */}
        <div className={styles.drawerFooter}>
          <span className={styles.footerNote}>Wisma SESB HQ • Phase 1 Pilot</span>
          <span className={styles.footerSub}>Sabah Electricity Corporate Intranet</span>
        </div>
      </nav>
    </>,
    document.body
  );
};
