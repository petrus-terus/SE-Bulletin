import React, { useState } from 'react';
import type { TimeAmbiance } from '../types/bulletin';
import styles from './KinabaluSkylineHero.module.css';

interface Props {
  userName: string;
  department: string;
  employeeId: string;
}

export const KinabaluSkylineHero: React.FC<Props> = ({ userName, department, employeeId }) => {
  // Determine default ambiance from local client time
  const getInitialAmbiance = (): TimeAmbiance => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 17) return 'day';
    if (hour >= 17 && hour < 20) return 'dusk';
    return 'night';
  };

  const [ambiance, setAmbiance] = useState<TimeAmbiance>(getInitialAmbiance());

  const getGreeting = () => {
    if (ambiance === 'day') return 'Selamat Pagi';
    if (ambiance === 'dusk') return 'Selamat Petang';
    return 'Selamat Malam';
  };

  const isDark = ambiance === 'dusk' || ambiance === 'night';

  return (
    <div
      className={`${styles.heroContainer} ${
        ambiance === 'day'
          ? styles.themeDay
          : ambiance === 'dusk'
          ? styles.themeDusk
          : styles.themeNight
      }`}
    >
      {/* Handcrafted Scalable SVG Illustration with Multi-Plane Depth */}
      <svg
        className={styles.svgStage}
        viewBox="0 0 680 180"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Day Gradients */}
          <linearGradient id="kinabaluDay" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1A7A5A" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0E5C41" stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id="foothillsDay" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2A9D74" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1A7A5A" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="citySkylineDay" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#003E7A" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0055A4" stopOpacity="0.65" />
          </linearGradient>

          {/* Dusk Gradients */}
          <linearGradient id="kinabaluDusk" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#312244" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1D1128" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="citySkylineDusk" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4D194D" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#110B22" stopOpacity="0.9" />
          </linearGradient>

          {/* Night Gradients */}
          <linearGradient id="kinabaluNight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0B2545" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#07192F" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="citySkylineNight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#13315C" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#061224" stopOpacity="0.95" />
          </linearGradient>

          {/* Glow filter for power grid line */}
          <filter id="gridGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Distant Mountain Silhouette (Mount Kinabalu Peaks) */}
        <path
          d="M -20,180 L 140,82 L 180,98 L 240,54 L 270,72 L 315,38 L 335,52 L 380,24 L 415,48 L 470,78 L 540,110 L 700,180 Z"
          fill={
            ambiance === 'day'
              ? 'url(#kinabaluDay)'
              : ambiance === 'dusk'
              ? 'url(#kinabaluDusk)'
              : 'url(#kinabaluNight)'
          }
          opacity="0.95"
        />

        {/* 2. Soft Drifting Clouds (GPU Keyframed) */}
        <g className={styles.cloudLayerOne} opacity={ambiance === 'night' ? '0.12' : '0.45'}>
          <ellipse cx="220" cy="50" rx="60" ry="10" fill="#FFFFFF" />
          <ellipse cx="250" cy="46" rx="40" ry="12" fill="#FFFFFF" />
          <ellipse cx="270" cy="52" rx="35" ry="9" fill="#FFFFFF" />
        </g>
        <g className={styles.cloudLayerTwo} opacity={ambiance === 'night' ? '0.08' : '0.35'}>
          <ellipse cx="440" cy="70" rx="80" ry="12" fill="#FFFFFF" />
          <ellipse cx="480" cy="65" rx="50" ry="14" fill="#FFFFFF" />
        </g>

        {/* 3. Midground Foothills */}
        <path
          d="M -20,180 Q 110,120 220,135 T 460,115 T 700,180 Z"
          fill={
            ambiance === 'day'
              ? 'url(#foothillsDay)'
              : ambiance === 'dusk'
              ? '#2B1E3A'
              : '#0C203B'
          }
          opacity="0.75"
        />

        {/* 4. Kota Kinabalu City Skyline & Wisma SESB Tower Profile */}
        <g
          fill={
            ambiance === 'day'
              ? 'url(#citySkylineDay)'
              : ambiance === 'dusk'
              ? 'url(#citySkylineDusk)'
              : 'url(#citySkylineNight)'
          }
        >
          {/* Wisma SESB HQ Building (Center Left with Communications Mast) */}
          <rect x="290" y="90" width="34" height="90" rx="1.5" />
          <line x1="307" y1="90" x2="307" y2="70" stroke={ambiance === 'day' ? '#003E7A' : '#7088A8'} strokeWidth="1.5" />
          <circle cx="307" cy="70" r="2" fill={ambiance === 'night' ? '#EF4444' : '#10B981'} />

          {/* Coastal City Skyline High-rises */}
          <rect x="230" y="112" width="22" height="68" rx="1" />
          <rect x="256" y="102" width="26" height="78" rx="1" />
          <rect x="330" y="105" width="28" height="75" rx="1" />
          <rect x="364" y="118" width="24" height="62" rx="1" />
          <rect x="394" y="108" width="30" height="72" rx="1" />
          <rect x="430" y="124" width="20" height="56" rx="1" />

          {/* Substation Pylons */}
          <polygon points="175,180 185,115 190,115 200,180 193,180 189,135 186,135 182,180" opacity="0.65" />
          <polygon points="465,180 473,122 477,122 485,180 480,180 476,140 474,140 470,180" opacity="0.65" />
        </g>

        {/* 5. Electricity Transmission Lines with Traveling Energy Pulse */}
        <path
          d="M 187,122 Q 307,138 475,128"
          fill="none"
          stroke={ambiance === 'night' ? 'rgba(16, 185, 129, 0.45)' : 'rgba(0, 85, 164, 0.3)'}
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />

        {/* Animated Energy Glow Dot Traveling East Across Grid */}
        <circle
          cx="187"
          cy="122"
          r="3"
          fill="#10B981"
          filter="url(#gridGlow)"
          className={styles.energyPulse}
        />

        {/* Night Lit Windows in Wisma SESB */}
        {ambiance === 'night' && (
          <g fill="#FDE047" opacity="0.85">
            <rect x="294" y="96" width="3" height="3" />
            <rect x="300" y="96" width="3" height="3" />
            <rect x="312" y="96" width="3" height="3" />
            <rect x="294" y="106" width="3" height="3" />
            <rect x="306" y="106" width="3" height="3" />
            <rect x="318" y="106" width="3" height="3" />
            <rect x="300" y="116" width="3" height="3" />
            <rect x="312" y="116" width="3" height="3" />
            <rect x="260" y="110" width="3" height="3" />
            <rect x="270" y="110" width="3" height="3" />
            <rect x="336" y="114" width="3" height="3" />
            <rect x="400" y="118" width="3" height="3" />
          </g>
        )}
      </svg>

      {/* Content Overlay */}
      <div className={styles.contentOverlay}>
        <div className={styles.topRow}>
          <div className={styles.badgeGroup}>
            <div
              className={`${styles.livePill} ${
                ambiance === 'day' ? styles.livePillDay : styles.livePillDusk
              }`}
            >
              <span className={styles.pulseDot} />
              <span>Grid Synced • Tenom to KK</span>
            </div>
          </div>

          {/* Time-of-day Adaptive Switcher Buttons */}
          <div
            className={`${styles.timeToggleGroup} ${
              isDark ? styles.timeToggleGroupDark : ''
            }`}
            title="Toggle time of day lighting"
          >
            <button
              type="button"
              className={`${styles.timeButton} ${
                ambiance === 'day' ? styles.timeButtonActiveDay : ''
              }`}
              onClick={() => setAmbiance('day')}
              aria-label="Switch to daylight ambiance"
              title="Daylight mode"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                light_mode
              </span>
            </button>
            <button
              type="button"
              className={`${styles.timeButton} ${
                ambiance === 'dusk' ? styles.timeButtonActiveDark : ''
              }`}
              onClick={() => setAmbiance('dusk')}
              aria-label="Switch to dusk ambiance"
              title="Dusk / Sunset mode"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                wb_twilight
              </span>
            </button>
            <button
              type="button"
              className={`${styles.timeButton} ${
                ambiance === 'night' ? styles.timeButtonActiveDark : ''
              }`}
              onClick={() => setAmbiance('night')}
              aria-label="Switch to night ambiance"
              title="Night mode"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                dark_mode
              </span>
            </button>
          </div>
        </div>

        {/* Personalized Employee Greeting */}
        <div className={styles.greetingSection}>
          <h1 className={`${styles.greetingTitle} ${isDark ? styles.textNight : styles.textDay}`}>
            {getGreeting()}, {userName}
          </h1>
          <div className={`${styles.greetingSub} ${isDark ? styles.subTextNight : styles.subTextDay}`}>
            <span>{department}</span>
            <span className={styles.dividerDot}>•</span>
            <span className="tabular-nums font-mono">{employeeId}</span>
            <span className={styles.dividerDot}>•</span>
            <span>Wisma SESB HQ</span>
          </div>
        </div>
      </div>
    </div>
  );
};
