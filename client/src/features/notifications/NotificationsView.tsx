import React, { useState, useMemo } from 'react';
import type { AppNotification, NotificationCategory } from '@/types/bulletin';
import styles from './NotificationsView.module.css';

interface Props {
  notifications: AppNotification[];
  onNotificationClick: (notif: AppNotification) => void;
  onMarkAllAsRead: () => void;
}

interface FilterOption {
  key: NotificationCategory;
  label: string;
  icon: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'all', label: 'All', icon: 'filter_list' },
  { key: 'urgent', label: 'Urgent / HSE', icon: 'warning' },
  { key: 'reaction', label: 'Reactions', icon: 'favorite' },
  { key: 'comment', label: 'Comments', icon: 'chat' },
  { key: 'mention', label: 'Mentions', icon: 'alternate_email' },
];

export const NotificationsView: React.FC<Props> = ({
  notifications,
  onNotificationClick,
  onMarkAllAsRead,
}) => {
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const categoryCounts = useMemo(() => {
    return {
      all: notifications.length,
      urgent: notifications.filter((n) => n.category === 'urgent').length,
      reaction: notifications.filter((n) => n.category === 'reaction').length,
      comment: notifications.filter((n) => n.category === 'comment').length,
      mention: notifications.filter((n) => n.category === 'mention').length,
      general: notifications.filter((n) => n.category === 'general').length,
    };
  }, [notifications]);

  // Filter list by selected pill
  const filteredNotifications = useMemo(() => {
    if (activeCategory === 'all') return notifications;
    return notifications.filter((n) => n.category === activeCategory);
  }, [notifications, activeCategory]);

  const [now] = useState(() => Date.now());

  // Chronological buckets: Today, This Week, Earlier
  const { todayList, thisWeekList, earlierList } = useMemo(() => {
    const ONE_DAY_MS = 24 * 3600 * 1000;
    const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

    const today: AppNotification[] = [];
    const thisWeek: AppNotification[] = [];
    const earlier: AppNotification[] = [];

    for (const item of filteredNotifications) {
      const age = now - item.createdAt;
      if (age <= ONE_DAY_MS) {
        today.push(item);
      } else if (age <= SEVEN_DAYS_MS) {
        thisWeek.push(item);
      } else {
        earlier.push(item);
      }
    }

    return { todayList: today, thisWeekList: thisWeek, earlierList: earlier };
  }, [filteredNotifications, now]);

  const renderCard = (notif: AppNotification) => {
    const isUrgent = notif.category === 'urgent';
    const isUnread = !notif.isRead;

    return (
      <div
        key={notif.id}
        className={`${styles.card} ${isUnread ? styles.cardUnread : ''} ${
          isUrgent ? styles.cardUrgent : ''
        }`}
        onClick={() => onNotificationClick(notif)}
        role="button"
        tabIndex={0}
        aria-label={`${notif.title}: ${notif.message}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNotificationClick(notif);
          }
        }}
      >
        {/* Avatar or Department Badge */}
        <div className={styles.avatarCol}>
          {notif.avatarUrl ? (
            <img
              src={notif.avatarUrl}
              alt=""
              className={styles.avatarImg}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className={styles.initialsBadge}>{notif.avatarInitials || 'SE'}</div>
          )}

          {/* Sub-badge Icon representing category */}
          <div className={styles.categorySubIcon}>
            <span
              className="material-symbols-outlined"
              style={{ color: notif.iconColor || '#0055A4' }}
            >
              {notif.icon || 'notifications'}
            </span>
          </div>
        </div>

        {/* Content Details */}
        <div className={styles.contentCol}>
          <h3 className={styles.cardTitle}>{notif.title}</h3>
          <p className={styles.cardMessage}>{notif.message}</p>
          <div className={styles.metaRow}>
            <span className={`${styles.timestamp} font-mono tabular-nums`}>
              {notif.timestamp}
            </span>
            {isUnread && <span className={styles.unreadDot} />}
          </div>
        </div>

        {/* Action arrow */}
        <div className={styles.arrowCol}>
          <span className="material-symbols-outlined">chevron_right</span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Activity & Alerts</h1>
          {unreadCount > 0 && (
            <span className={`${styles.unreadBadge} font-mono tabular-nums`}>
              {unreadCount}
            </span>
          )}
        </div>

        <button
          type="button"
          className={styles.markAllBtn}
          onClick={onMarkAllAsRead}
          disabled={unreadCount === 0}
          aria-label="Mark all notifications as read"
        >
          <span className={`material-symbols-outlined ${styles.markAllIcon}`}>
            done_all
          </span>
          <span>Mark all as read</span>
        </button>
      </header>

      {/* Category Filter Pills */}
      <div className={styles.filtersRow} role="tablist" aria-label="Notification Categories">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = activeCategory === opt.key;
          const count = categoryCounts[opt.key as keyof typeof categoryCounts] ?? 0;

          return (
            <button
              key={opt.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.filterPill} ${isActive ? styles.filterPillActive : ''}`}
              onClick={() => setActiveCategory(opt.key)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {opt.icon}
              </span>
              <span>{opt.label}</span>
              {count > 0 && (
                <span className={`${styles.pillCount} font-mono tabular-nums`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Chronological Notification Lists */}
      {filteredNotifications.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIconWrapper}>
            <span className="material-symbols-outlined">notifications_off</span>
          </div>
          <h2 className={styles.emptyTitle}>All caught up!</h2>
          <p className={styles.emptySubtitle}>
            No alerts or activity found in this category. You will be notified when real-time updates arrive.
          </p>
        </div>
      ) : (
        <>
          {todayList.length > 0 && (
            <section className={styles.sectionGroup} aria-label="Today's Notifications">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>Today</span>
                <span className={`${styles.sectionCount} font-mono tabular-nums`}>
                  ({todayList.length})
                </span>
              </div>
              <div className={styles.cardsList}>{todayList.map(renderCard)}</div>
            </section>
          )}

          {thisWeekList.length > 0 && (
            <section className={styles.sectionGroup} aria-label="This Week's Notifications">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>This Week</span>
                <span className={`${styles.sectionCount} font-mono tabular-nums`}>
                  ({thisWeekList.length})
                </span>
              </div>
              <div className={styles.cardsList}>{thisWeekList.map(renderCard)}</div>
            </section>
          )}

          {earlierList.length > 0 && (
            <section className={styles.sectionGroup} aria-label="Earlier Notifications">
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>Earlier</span>
                <span className={`${styles.sectionCount} font-mono tabular-nums`}>
                  ({earlierList.length})
                </span>
              </div>
              <div className={styles.cardsList}>{earlierList.map(renderCard)}</div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
