import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { APP_NAME } from '@/constants/brand';
import styles from './ScreenShowcaseModal.module.css';

export type ShowcaseTarget = 'home' | 'create' | 'explore' | 'notifications' | 'profile';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenScreen: (target: ShowcaseTarget) => void;
}

interface ScreenDef {
  key: ShowcaseTarget;
  icon: string;
  tab: string;
  title: string;
  blurb: string;
  points: string[];
  cta: string;
}

const SCREENS: ScreenDef[] = [
  {
    key: 'home',
    icon: 'home',
    tab: 'Home',
    title: 'Home Feed & Kinabalu Hero',
    blurb: 'Everything happening across Sabah Electricity, in one live feed.',
    points: [
      'Live Kota Kinabalu weather and TNB market ticker',
      '24-hour stories from Tenom Pangi, Sepanggar, Sandakan and Tawau',
      'Department filters and 5 professional reactions',
    ],
    cta: 'Open Home',
  },
  {
    key: 'create',
    icon: 'edit_square',
    tab: 'Studio',
    title: 'Bulletin Studio',
    blurb: 'Publish formal circulars in a few taps with ready-made templates.',
    points: [
      'Goal Zero safety and grid maintenance quick templates',
      'Photo carousels, PDF attachments and interactive polls',
      'Department tagging and comment controls',
    ],
    cta: 'Open Studio',
  },
  {
    key: 'explore',
    icon: 'groups',
    tab: 'Directory',
    title: 'People Directory',
    blurb: 'Find the right colleague at any station and reach them instantly.',
    points: [
      'Search by name, division, station or extension',
      'One-tap call, email and WhatsApp',
      'Browse every directorate and unit',
    ],
    cta: 'Open Directory',
  },
  {
    key: 'notifications',
    icon: 'notifications',
    tab: 'Alerts',
    title: 'Alerts & Notices',
    blurb: 'Priority safety notices and replies, never buried in an inbox.',
    points: [
      'HSE and grid advisories rise to the top',
      'Replies, reactions and mentions in one place',
      'Mark all as read in a single tap',
    ],
    cta: 'Open Alerts',
  },
  {
    key: 'profile',
    icon: 'person',
    tab: 'Profile',
    title: 'Profile & Honors',
    blurb: 'Your identity, saved bulletins and achievements.',
    points: [
      'Publish milestones that unlock honor badges',
      'Saved posts and offline drafts',
      'Light and dark appearance',
    ],
    cta: 'Open Profile',
  },
];

/** Stylised, content-accurate miniature of each screen. Pure markup, no network. */
const Preview: React.FC<{ screen: ShowcaseTarget }> = ({ screen }) => {
  switch (screen) {
    case 'home':
      return (
        <div className={styles.mini}>
          <div className={styles.miniHero}>
            <span className={styles.miniHeroTop}>
              <span>Selamat Pagi</span>
              <span className="font-mono tabular-nums">28°C</span>
            </span>
            <strong>Wisma SE, Kota Kinabalu</strong>
          </div>
          <div className={styles.miniStories}>
            {['Tenom', 'Sepanggar', 'Sandakan', 'Tawau'].map((s) => (
              <span key={s} className={styles.miniStory}>
                <i className={styles.miniRing} />
                {s}
              </span>
            ))}
          </div>
          <div className={styles.miniCard}>
            <span className={styles.miniPill}>HSE</span>
            <strong>Goal Zero Safety Week</strong>
            <span className={styles.miniLine} />
            <span className={styles.miniReact}>
              <span className="font-mono tabular-nums">142</span> reactions
            </span>
          </div>
        </div>
      );
    case 'create':
      return (
        <div className={styles.mini}>
          <div className={styles.miniTitleRow}>
            <strong>New Bulletin</strong>
            <span className={styles.miniPill}>Publish</span>
          </div>
          <div className={styles.miniChips}>
            <span className={styles.miniChip}>Goal Zero</span>
            <span className={styles.miniChip}>Grid Maintenance</span>
            <span className={styles.miniChip}>Official Notice</span>
          </div>
          <div className={styles.miniCard}>
            <strong>Title</strong>
            <span className={styles.miniLine} />
            <span className={styles.miniLineShort} />
          </div>
          <div className={styles.miniCard}>
            <strong>Poll</strong>
            <span className={styles.miniBar} style={{ width: '72%' }} />
            <span className={styles.miniBar} style={{ width: '38%' }} />
          </div>
        </div>
      );
    case 'explore':
      return (
        <div className={styles.mini}>
          <div className={styles.miniSearch}>
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
            Search colleagues
          </div>
          {[
            ['Ir. Raymond Chin', 'Hydro Engineer · Tenom Pangi'],
            ['Siti Aminah', 'HR · Wisma SE'],
            ['Farhan Aziz', 'Field Technician · Sandakan'],
          ].map(([n, r]) => (
            <div key={n} className={styles.miniPerson}>
              <i className={styles.miniAvatar} />
              <span>
                <strong>{n}</strong>
                <small>{r}</small>
              </span>
              <span className={`${styles.miniAction} material-symbols-outlined`} aria-hidden="true">call</span>
            </div>
          ))}
        </div>
      );
    case 'notifications':
      return (
        <div className={styles.mini}>
          <div className={styles.miniTitleRow}>
            <strong>Alerts</strong>
            <span className={styles.miniPill}>Mark all read</span>
          </div>
          <div className={`${styles.miniCard} ${styles.miniAlert}`}>
            <strong>Planned outage notice</strong>
            <span className={styles.miniLine} />
            <small className="font-mono tabular-nums">09:15</small>
          </div>
          <div className={styles.miniCard}>
            <strong>New reply on your bulletin</strong>
            <span className={styles.miniLine} />
            <small className="font-mono tabular-nums">08:40</small>
          </div>
        </div>
      );
    default:
      return (
        <div className={styles.mini}>
          <div className={styles.miniProfile}>
            <i className={`${styles.miniAvatar} ${styles.miniAvatarLg}`} />
            <strong>Your Name</strong>
            <small>Division · Station</small>
          </div>
          <div className={styles.miniBadges}>
            <span className={styles.miniBadge}>First Bulletin</span>
            <span className={styles.miniBadge}>Safety Voice</span>
            <span className={styles.miniBadge}>Team Player</span>
          </div>
        </div>
      );
  }
};

export const ScreenShowcaseModal: React.FC<Props> = ({ isOpen, onClose, onOpenScreen }) => {
  const [index, setIndex] = useState(0);
  const screen = SCREENS[index];

  useEffect(() => {
    if (!isOpen) return;
    setIndex(0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, SCREENS.length - 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <section
        className={`${styles.sheet} ${isOpen ? styles.sheetOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        aria-label={`${APP_NAME} screen tour`}
      >
        <div className={styles.grabber} aria-hidden="true" />
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Screen tour</span>
            <h2 className={styles.heading}>Explore {APP_NAME}</h2>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close screen tour">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </header>

        <div className={styles.tabs} role="tablist" aria-label="App screens">
          {SCREENS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={`${styles.tab} ${i === index ? styles.tabActive : ''}`}
              onClick={() => setIndex(i)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">{s.icon}</span>
              {s.tab}
            </button>
          ))}
        </div>

        <div className={styles.stage} key={screen.key}>
          <div className={styles.phone}>
            <div className={styles.phoneNotch} aria-hidden="true" />
            <Preview screen={screen.key} />
          </div>

          <div className={styles.copy}>
            <span className={`${styles.step} font-mono tabular-nums`}>
              {index + 1} / {SCREENS.length}
            </span>
            <h3 className={styles.title}>{screen.title}</h3>
            <p className={styles.blurb}>{screen.blurb}</p>
            <ul className={styles.points}>
              {screen.points.map((p) => (
                <li key={p}>
                  <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.cta}
            onClick={() => {
              onClose();
              onOpenScreen(screen.key);
            }}
          >
            {screen.cta}
            <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
          </button>
        </footer>
      </section>
    </>,
    document.body
  );
};
