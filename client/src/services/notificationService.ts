import type { AppNotification } from '@/types/bulletin';

const NOTIFICATIONS_STORAGE_KEY = 'sesb_notifications';

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    category: 'urgent',
    title: 'HSE Directorate Safety Directive',
    message: 'Directive SOP-2026-04: Mandatory arc-flash PPE protocol for grid switchyards across all Sabah stations.',
    timestamp: '2h ago',
    createdAt: Date.now() - 2 * 3600 * 1000,
    isRead: false,
    icon: 'security',
    iconColor: '#EF4444',
    targetPostId: 'post-career-day-warning',
    avatarInitials: 'HSE',
  },
  {
    id: 'notif-2',
    category: 'urgent',
    title: 'Operations & Engineering Directorate',
    message: 'Tenom Substation 132kV commissioning completed 4 days ahead of schedule.',
    timestamp: '4h ago',
    createdAt: Date.now() - 4 * 3600 * 1000,
    isRead: false,
    icon: 'campaign',
    iconColor: '#0055A4',
    targetPostId: 'post-madani-link',
    avatarInitials: 'OPS',
  },
  {
    id: 'notif-3',
    category: 'general',
    title: 'Executive Office (Datuk Ir. Ts. Mohd Yaakob)',
    message: 'Official Poll: Help select the Level 3 IDD Coffee Machine for Wisma SE HQ staff.',
    timestamp: '5h ago',
    createdAt: Date.now() - 5 * 3600 * 1000,
    isRead: false,
    icon: 'how_to_vote',
    iconColor: '#1A7A5A',
    targetPostId: 'post-poll-idd-coffee',
    avatarUrl: '/ceo_portrait.png',
  },
  {
    id: 'notif-4',
    category: 'reaction',
    title: 'Siti Aminah (Corporate Comms)',
    message: 'Liked your SCADA telemetry dispatch update.',
    timestamp: 'Yesterday',
    createdAt: Date.now() - 26 * 3600 * 1000,
    isRead: true,
    icon: 'favorite',
    iconColor: '#E11D48',
    targetPostId: 'post-our-brand',
    avatarInitials: 'SA',
  },
  {
    id: 'notif-5',
    category: 'comment',
    title: 'Mohd Irfan (Engineering & IT)',
    message: 'Commented on Sepanggar Power Station Maintenance: "Generator 2 telemetry looks stable."',
    timestamp: '2 days ago',
    createdAt: Date.now() - 48 * 3600 * 1000,
    isRead: true,
    icon: 'chat',
    iconColor: '#0055A4',
    targetPostId: 'post-our-brand',
    targetCommentId: 'c2',
    avatarInitials: 'MI',
  },
  {
    id: 'notif-6',
    category: 'mention',
    title: 'Sarah Wong (Distribution Engineering)',
    message: 'Mentioned you: "@TEST_USER please cross-check the Papar distribution feeder peak load log."',
    timestamp: '4 days ago',
    createdAt: Date.now() - 4 * 24 * 3600 * 1000,
    isRead: true,
    icon: 'alternate_email',
    iconColor: '#10B981',
    targetPostId: 'post-madani-link',
    avatarInitials: 'SW',
  },
  {
    id: 'notif-7',
    category: 'general',
    title: 'HR Department',
    message: 'SE Annual Sports Carnival 2026: Team registration for inter-department badminton is now open.',
    timestamp: '10 days ago',
    createdAt: Date.now() - 10 * 24 * 3600 * 1000,
    isRead: true,
    icon: 'celebration',
    iconColor: '#F59E0B',
    targetPostId: 'post-esg-challenge',
    avatarInitials: 'HR',
  },
];

export function getStoredNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_NOTIFICATIONS;

    // Self-heal legacy orphaned IDs from past sessions
    return parsed.map((n: AppNotification) => {
      if (n.targetPostId === 'post-safety-1') {
        return { ...n, targetPostId: 'post-career-day-warning' };
      }
      if (n.targetPostId === 'post-1') {
        return { ...n, targetPostId: 'post-madani-link' };
      }
      return n;
    });
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveStoredNotifications(notifications: AppNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.warn('[NotificationService] Failed to save notifications:', e);
  }
}
