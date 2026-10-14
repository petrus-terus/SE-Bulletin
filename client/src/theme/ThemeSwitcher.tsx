import React from 'react';
import { useTheme, type ThemePreference } from './useTheme';
import styles from './ThemeSwitcher.module.css';

interface Props {
  className?: string;
}

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  icon: string;
}> = [
  { value: 'light', label: 'Light', icon: 'light_mode' },
  { value: 'system', label: 'System', icon: 'brightness_auto' },
  { value: 'dark', label: 'Dark', icon: 'dark_mode' },
];

export const ThemeSwitcher: React.FC<Props> = ({ className }) => {
  const { preference, setPreference } = useTheme();

  const activeIndex = THEME_OPTIONS.findIndex((opt) => opt.value === preference);
  const positionClass =
    activeIndex === 1 ? styles.pos1 : activeIndex === 2 ? styles.pos2 : styles.pos0;

  const currentIcon =
    preference === 'dark'
      ? 'dark_mode'
      : preference === 'light'
        ? 'light_mode'
        : 'brightness_auto';

  return (
    <div className={`${styles.container} ${className || ''}`} aria-label="Theme Customization">
      {/* 1. Header Information Row */}
      <div className={styles.headerRow}>
        <div className={styles.iconWrap} aria-hidden="true">
          <span className={`material-symbols-outlined ${styles.segmentIcon}`} style={{ fontSize: '20px' }}>
            {currentIcon}
          </span>
        </div>
        <div className={styles.textGroup}>
          <span className={styles.title}>Appearance</span>
          <span className={styles.subtitle}>Light, dark or match device</span>
        </div>
      </div>

      {/* 2. 3-Segment Control Pill */}
      <div
        className={styles.pillGroup}
        role="radiogroup"
        aria-label="Theme Selection"
      >
        <div className={`${styles.slidingIndicator} ${positionClass}`} aria-hidden="true" />
        {THEME_OPTIONS.map((opt) => {
          const isActive = preference === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              className={`${styles.segmentBtn} ${isActive ? styles.segmentBtnActive : ''}`}
              onClick={() => setPreference(opt.value)}
            >
              <span className={`material-symbols-outlined ${styles.segmentIcon}`} aria-hidden="true">
                {opt.icon}
              </span>
              <span className={styles.segmentLabel}>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
