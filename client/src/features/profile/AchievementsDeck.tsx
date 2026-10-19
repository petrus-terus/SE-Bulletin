import React from 'react';
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';
import styles from './AchievementsDeck.module.css';

interface Props {
  bulletinCount: number;
}

interface Achievement {
  id: string;
  tier: 'bronze' | 'silver' | 'gold';
  tierName: string;
  title: string;
  threshold: number;
  description: string;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-bronze',
    tier: 'bronze',
    tierName: 'Bronze Tier',
    title: 'Bronze Broadcaster',
    threshold: 1,
    description: 'Publish 1 bulletin to the SE internal network',
  },
  {
    id: 'ach-silver',
    tier: 'silver',
    tierName: 'Silver Tier',
    title: 'Silver Correspondent',
    threshold: 5,
    description: 'Publish 5 bulletins to the SE internal network',
  },
  {
    id: 'ach-gold',
    tier: 'gold',
    tierName: 'Gold Tier',
    title: 'Gold Champion',
    threshold: 10,
    description: 'Publish 10 bulletins to the SE internal network',
  },
];

export const AchievementsDeck: React.FC<Props> = ({ bulletinCount }) => {
  const scrollRef = useHorizontalScroll<HTMLDivElement>();

  const unlockedCount = ACHIEVEMENTS.filter((a) => bulletinCount >= a.threshold).length;

  return (
    <section className={styles.achievementsSection} aria-label="SE Honors & Achievements">
      <div className={styles.sectionHeader}>
        <div className={styles.titleRow}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary-text)' }}>
            workspace_premium
          </span>
          <h2 className={styles.sectionTitle}>Honors & Achievements</h2>
        </div>
        <span className={`font-mono tabular-nums ${styles.sectionCount}`}>
          {unlockedCount} / {ACHIEVEMENTS.length} Unlocked
        </span>
      </div>

      <div ref={scrollRef} className={`${styles.horizontalTrack} no-scrollbar`}>
        {ACHIEVEMENTS.map((ach) => {
          const isUnlocked = bulletinCount >= ach.threshold;
          const progressPercent = Math.min(100, Math.round((bulletinCount / ach.threshold) * 100));

          let medalClass = styles.bronzeMedal;
          let tierClass = styles.tierBronze;
          let progressFillClass = styles.progressFillBronze;

          if (ach.tier === 'silver') {
            medalClass = styles.silverMedal;
            tierClass = styles.tierSilver;
            progressFillClass = styles.progressFillSilver;
          } else if (ach.tier === 'gold') {
            medalClass = styles.goldMedal;
            tierClass = styles.tierGold;
            progressFillClass = styles.progressFillGold;
          }

          if (!isUnlocked) {
            medalClass = `${styles.lockedMedal}`;
            tierClass = styles.tierLocked;
          }

          return (
            <div
              key={ach.id}
              className={`${styles.achievementCard} ${!isUnlocked ? styles.cardLocked : ''}`}
            >
              <div className={styles.cardTopRow}>
                {/* Sabah Electricity Emblem Medal */}
                <div className={`${styles.medalHousing} ${medalClass}`}>
                  <div className={styles.innerEmblemPlate}>
                    <img
                      src="/sabah_electricity_logo.png"
                      alt="Sabah Electricity Emblem"
                      className={styles.sesbBadgeLogo}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/sesb_logo.png';
                      }}
                    />
                  </div>
                </div>

                {/* Status Pill */}
                {isUnlocked ? (
                  <span className={styles.statusPillUnlocked}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                      verified
                    </span>
                    <span>Unlocked</span>
                  </span>
                ) : (
                  <span className={styles.statusPillLocked}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                      lock
                    </span>
                    <span>Locked</span>
                  </span>
                )}
              </div>

              <div className={styles.cardBody}>
                <span className={`${styles.tierLabel} ${tierClass}`}>
                  {ach.tierName} • {ach.threshold} {ach.threshold === 1 ? 'Bulletin' : 'Bulletins'}
                </span>
                <h3 className={styles.achievementTitle}>{ach.title}</h3>
                <p className={styles.achievementDesc}>{ach.description}</p>
              </div>

              <div className={styles.progressFooter}>
                <div className={styles.progressBarTrack}>
                  <div
                    className={`${styles.progressBarFill} ${progressFillClass}`}
                    style={{ transform: `scaleX(${progressPercent / 100})` }}
                  ></div>
                </div>
                <div className={styles.progressMetaRow}>
                  <span>Progress</span>
                  <span className="font-mono tabular-nums">
                    {bulletinCount} / {ach.threshold}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
