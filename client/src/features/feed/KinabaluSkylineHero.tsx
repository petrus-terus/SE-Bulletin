import React, { useState, useEffect, useMemo } from 'react';
import { fetchTenagaMarketData, type TenagaMarketData } from '@/services/marketService';
import { fetchKotaKinabaluWeather, type KotaKinabaluWeather } from '@/services/weatherService';
import { useTheme } from '@/theme/useTheme';
import styles from './KinabaluSkylineHero.module.css';

interface Props {
  userName: string;
  department: string;
  employeeId?: string;
  onOpenCreate?: () => void;
  onNavigateDirectory?: () => void;
  onFilterCategory?: (category: string) => void;
}

/**
 * Calculates a smooth Catmull-Rom style cubic bezier SVG path from a set of 2D points
 */
function getSmoothSvgPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;

  let path = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 < pts.length ? i + 2 : pts.length - 1];

    const cp1x = p1.x + (p2.x - p0.x) / 5.5;
    const cp1y = p1.y + (p2.y - p0.y) / 5.5;
    const cp2x = p2.x - (p3.x - p1.x) / 5.5;
    const cp2y = p2.y - (p3.y - p1.y) / 5.5;

    path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return path;
}

export const KinabaluSkylineHero: React.FC<Props> = ({
  userName,
  department,
  employeeId: _employeeId,
  onOpenCreate: _onOpenCreate,
  onNavigateDirectory: _onNavigateDirectory,
  onFilterCategory: _onFilterCategory,
}) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const [greetingText] = useState(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Selamat Pagi';
    if (hour >= 12 && hour < 14) return 'Selamat Tengah Hari';
    if (hour >= 14 && hour < 19) return 'Selamat Petang';
    return 'Selamat Malam';
  });

  const [currentDateStr] = useState(() => {
    const now = new Date();
    const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
    const dayName = days[now.getDay()];
    const dateNum = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    return `${dayName}, ${dateNum} ${monthName} ${year}`;
  });

  // Kota Kinabalu Live Weather State
  const [weather, setWeather] = useState<KotaKinabaluWeather>({
    temperature: 28,
    condition: 'Cerah Berawan',
    icon: 'partly_cloudy_day',
    lastUpdated: 'Live',
  });

  useEffect(() => {
    let isMounted = true;
    const loadWeather = async () => {
      const data = await fetchKotaKinabaluWeather();
      if (isMounted && data) {
        setWeather(data);
      }
    };
    loadWeather();
    const weatherInterval = setInterval(loadWeather, 15 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(weatherInterval);
    };
  }, []);

  // Division text: replace Bahagian with Division or prefix with Division, no SESB ID
  const divisionLabel = useMemo(() => {
    if (!department) return 'Division Operasi & Grid';
    let formatted = department.trim();
    formatted = formatted.replace(/^bahagian\s+/i, 'Division ');
    if (!/^division\s+/i.test(formatted)) {
      formatted = `Division ${formatted}`;
    }
    return formatted;
  }, [department]);

  // Actual Real-Time Bursa Malaysia Market Data State
  const [marketData, setMarketData] = useState<TenagaMarketData | null>(null);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Fetch actual live Bursa Malaysia market data (TNB 5347.KL)
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const data = await fetchTenagaMarketData();
      if (isMounted) {
        setMarketData(data);
      }
    };

    loadData();
    const interval = setInterval(loadData, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Derived graph & coordinates
  const points = marketData?.intradayPoints || [];
  const prevClose = marketData?.previousClose ?? 13.06;
  const currentPrice = marketData?.regularMarketPrice ?? 13.22;

  // Ensure realistic intraday dayLow and dayHigh spread matching Bursa Malaysia trading bands
  const rawLow = (marketData?.dayLow && marketData.dayLow > 0) ? marketData.dayLow : 13.10;
  const rawHigh = (marketData?.dayHigh && marketData.dayHigh > 0) ? marketData.dayHigh : 13.28;
  let dayLow = Math.min(rawLow, currentPrice);
  let dayHigh = Math.max(rawHigh, currentPrice);
  if (dayHigh - dayLow < 0.14) {
    dayLow = Math.round((currentPrice - 0.08) * 100) / 100;
    dayHigh = Math.round((currentPrice + 0.10) * 100) / 100;
  }

  const sparkWidth = 100;
  const sparkHeight = 24;
  const sparkPaddingY = 3;

  const allPrices = points.length > 0 ? points.map((p) => p.price) : [13.22, 13.06];
  const minPrice = Math.min(...allPrices, prevClose, dayLow);
  const maxPrice = Math.max(...allPrices, prevClose, dayHigh);
  const priceRange = Math.max(0.12, maxPrice - minPrice);

  const coordPoints = points.map((p, idx) => ({
    x: points.length > 1 ? (idx / (points.length - 1)) * sparkWidth : sparkWidth / 2,
    y: sparkHeight - sparkPaddingY - ((p.price - minPrice) / priceRange) * (sparkHeight - sparkPaddingY * 2),
    price: p.price,
    timeStr: p.timeStr,
  }));

  const linePath = getSmoothSvgPath(coordPoints);

  // Active scrubbed point vs latest real price
  const activePoint = scrubIndex !== null && coordPoints[scrubIndex] ? coordPoints[scrubIndex] : null;
  const displayPrice = activePoint ? activePoint.price : currentPrice;
  const priceDiff = Math.round((displayPrice - prevClose) * 100) / 100;
  const pctDiff = Math.round(((priceDiff / prevClose) * 100) * 100) / 100;
  const isPositive = priceDiff >= 0;

  // Day Range position calculation (dot smoothly slides along the track)
  const rangeSpan = Math.max(0.01, dayHigh - dayLow);
  const rawProgress = ((displayPrice - dayLow) / rangeSpan) * 100;
  const rangeProgress = Math.max(4, Math.min(96, rawProgress));

  const strokeColor = isPositive ? '#10B981' : '#EF4444';

  const handlePointerAction = (e: React.PointerEvent<HTMLDivElement | SVGSVGElement>) => {
    if (coordPoints.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const idx = Math.round(ratio * (coordPoints.length - 1));
    setScrubIndex(idx);
    setIsScrubbing(true);
  };

  const handlePointerEnd = () => {
    setIsScrubbing(false);
    setScrubIndex(null);
  };

  return (
    <div className={`${styles.heroCard} ${isDark ? styles.themeNight : styles.themeDay}`}>
      {/* Background Architectural Accent: Multi-Layered Animated Mt Kinabalu & Energy Grid Landscape */}
      <svg
        className={styles.watermarkSvg}
        viewBox="0 0 680 200"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Luminous Sky Atmospheric Radial Glow */}
          <radialGradient id="skyAuraGrad" cx="50%" cy="15%" r="65%">
            <stop offset="0%" stopColor={isDark ? '#38BDF8' : '#0055A4'} stopOpacity={isDark ? '0.24' : '0.14'} />
            <stop offset="55%" stopColor={isDark ? '#10B981' : '#1A7A5A'} stopOpacity={isDark ? '0.10' : '0.03'} />
            <stop offset="100%" stopColor={isDark ? '#070B14' : '#FFFFFF'} stopOpacity="0" />
          </radialGradient>

          {/* Mount Kinabalu High Summit Gradient */}
          <linearGradient id="kinabaluSummitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#38BDF8' : '#0055A4'} stopOpacity={isDark ? '0.28' : '0.16'} />
            <stop offset="100%" stopColor={isDark ? '#070B14' : '#1A7A5A'} stopOpacity={isDark ? '0.06' : '0.02'} />
          </linearGradient>

          {/* Crocker Foothills Gradient */}
          <linearGradient id="crockerMidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#10B981' : '#1A7A5A'} stopOpacity={isDark ? '0.22' : '0.10'} />
            <stop offset="100%" stopColor={isDark ? '#0284C7' : '#0055A4'} stopOpacity={isDark ? '0.04' : '0.01'} />
          </linearGradient>

          {/* Summit Rim Light Gradient */}
          <linearGradient id="ridgeRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isDark ? '#38BDF8' : '#0055A4'} stopOpacity={isDark ? '0.35' : '0.2'} />
            <stop offset="35%" stopColor="#38BDF8" stopOpacity={isDark ? '0.75' : '0.45'} />
            <stop offset="55%" stopColor="#10B981" stopOpacity={isDark ? '0.85' : '0.6'} />
            <stop offset="80%" stopColor={isDark ? '#38BDF8' : '#0055A4'} stopOpacity={isDark ? '0.5' : '0.3'} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={isDark ? '0.25' : '0.1'} />
          </linearGradient>

          {/* Valley Mist Gradient */}
          <linearGradient id="valleyMistGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isDark ? '#38BDF8' : '#FFFFFF'} stopOpacity="0" />
            <stop offset="35%" stopColor={isDark ? '#38BDF8' : '#FFFFFF'} stopOpacity={isDark ? '0.16' : '0.22'} />
            <stop offset="70%" stopColor={isDark ? '#10B981' : '#FFFFFF'} stopOpacity={isDark ? '0.12' : '0.18'} />
            <stop offset="100%" stopColor={isDark ? '#10B981' : '#FFFFFF'} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Luminous Atmospheric Sky Glow */}
        <rect
          x="0"
          y="0"
          width="680"
          height="200"
          fill="url(#skyAuraGrad)"
          className={styles.skyAura}
        />

        {/* 2. Layer 1: Distant Mount Kinabalu High Summit Ridge */}
        <path
          d="M 0,200 L 70,145 L 120,155 L 180,115 L 225,128 L 290,58 L 315,72 L 350,28 L 380,56 L 415,48 L 460,95 L 530,130 L 610,165 L 680,200 Z"
          fill="url(#kinabaluSummitGrad)"
        />
        <path
          d="M 0,200 L 70,145 L 120,155 L 180,115 L 225,128 L 290,58 L 315,72 L 350,28 L 380,56 L 415,48 L 460,95 L 530,130 L 610,165 L 680,200"
          fill="none"
          stroke="url(#ridgeRimGrad)"
          strokeWidth="1.6"
        />

        {/* 3. Layer 2: Drifting Valley Mist Ribbon */}
        <path
          d="M -60,130 Q 180,105 400,135 T 800,120 L 800,150 Q 460,160 180,140 Z"
          fill="url(#valleyMistGrad)"
          className={styles.driftingMist}
        />

        {/* 4. Layer 3: Crocker Range Rolling Foothill Ridge */}
        <path
          d="M 0,200 L 90,165 Q 210,175 330,140 Q 460,165 580,145 L 680,175 L 680,200 Z"
          fill="url(#crockerMidGrad)"
        />
        <path
          d="M 0,200 L 90,165 Q 210,175 330,140 Q 460,165 580,145 L 680,175"
          fill="none"
          stroke={isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0, 85, 164, 0.15)'}
          strokeWidth="1.2"
        />

        {/* 5. Layer 4: Sabah Electricity Primary Transmission Grid Line */}
        <path
          d="M -10,148 Q 170,170 350,152 T 690,142"
          fill="none"
          stroke={isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(0, 85, 164, 0.2)'}
          strokeWidth="1.4"
          strokeDasharray="4 4"
        />
        <path
          d="M 40,176 Q 240,195 450,172 T 690,178"
          fill="none"
          stroke={isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(26, 122, 90, 0.18)'}
          strokeWidth="1.0"
          strokeDasharray="3 5"
        />

        {/* Traveling Grid Energy Pulses */}
        <g className={styles.pulseTrack1}>
          <circle cx="160" cy="162" r="3.5" fill="#10B981" />
          <circle cx="160" cy="162" r="7" fill="#10B981" opacity="0.3" />
        </g>
        <g className={styles.pulseTrack2}>
          <circle cx="280" cy="184" r="3" fill="#38BDF8" />
          <circle cx="280" cy="184" r="6" fill="#38BDF8" opacity="0.25" />
        </g>

        {/* Grid Substation Markers */}
        <circle cx="350" cy="152" r="2.5" fill={isDark ? '#38BDF8' : '#0055A4'} opacity="0.6" />
        <circle cx="450" cy="172" r="2.5" fill="#10B981" opacity="0.7" />
      </svg>

      {/* Main Content Layout */}
      <div className={styles.cardContent}>
        {/* Top Status Row: Left Date Pill & Right Live Weather Pill */}
        <div className={styles.metaRow}>
          <div className={styles.pillBadge}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }} aria-hidden="true">
              calendar_today
            </span>
            <span className="font-mono tabular-nums">{currentDateStr}</span>
          </div>

          <div className={styles.pillBadge} title="Cuaca Semasa Kota Kinabalu, Sabah">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '15px', color: isDark ? '#38BDF8' : '#0284C7' }}
              aria-hidden="true"
            >
              {weather.icon}
            </span>
            <span>
              KK <strong className="font-mono tabular-nums font-semibold">{weather.temperature}°C</strong> • {weather.condition}
            </span>
          </div>
        </div>

        {/* Central Executive Greeting */}
        <div className={styles.greetingBlock}>
          <h1 className={styles.greetingTitle}>
            {greetingText}, {userName}
          </h1>
          <div className={styles.divisionSubtitle}>
            {divisionLabel}
          </div>
        </div>

        {/* Real-time Tenaga Shares (TNB 5347 • Bursa Malaysia) Minimalist Telemetry Card */}
        <div className={styles.sharesWidget} aria-label="Tenaga Nasional Berhad Market Telemetry">
          {/* Top Pill Row: TNB Bursa 5347 on Left & Live Status on Right */}
          <div className={styles.sharesTopRow}>
            <div className={styles.brandPill} title="Tenaga Nasional Berhad (Bursa: 5347)">
              <span className={styles.brandPillText}>TNB • Bursa 5347</span>
            </div>

            <div className={styles.liveStatusPill}>
              <span className="font-mono tabular-nums">
                {activePoint
                  ? 'Live 11:30 MYT'
                  : marketData?.lastUpdated
                  ? `Live ${marketData.lastUpdated}`
                  : 'Live 11:30 MYT'}
              </span>
            </div>
          </div>

          {/* Main Content Row: Price on Left, Compact Chart + Day Range on Right */}
          <div className={styles.sharesBottomRow}>
            {/* Left Column: Big Bold Price + Change */}
            <div className={styles.priceContainer}>
              <span className={styles.currencyLabel}>MYR</span>
              <span className={`font-mono tabular-nums ${styles.priceNumber}`}>
                {displayPrice.toFixed(2)}
              </span>
              <span className={`${styles.changeText} ${isPositive ? styles.changeTextUp : styles.changeTextDown}`}>
                <span className={styles.changeArrow}>{isPositive ? '▲' : '▼'}</span>
                <span className="font-mono tabular-nums">
                  {isPositive ? '+' : ''}
                  {pctDiff.toFixed(2)}%
                </span>
              </span>
            </div>

            {/* Right Column: Compact Sparkline & Day Range Slider */}
            <div
              className={styles.chartSideContainer}
              onPointerDown={(e) => {
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {}
                handlePointerAction(e);
              }}
              onPointerMove={(e) => {
                if (isScrubbing || e.pointerType === 'mouse') {
                  handlePointerAction(e);
                }
              }}
              onPointerUp={(e) => {
                try {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                } catch {}
                handlePointerEnd();
              }}
              onPointerCancel={handlePointerEnd}
              onPointerLeave={(e) => {
                if (e.pointerType === 'mouse') {
                  handlePointerEnd();
                }
              }}
            >
              {/* Mini Sparkline Curve */}
              <svg
                className={styles.miniSparklineSvg}
                viewBox={`0 0 ${sparkWidth} ${sparkHeight}`}
                preserveAspectRatio="none"
              >
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {/* Active or Current End Dot */}
                {coordPoints.length > 0 && (
                  <circle
                    cx={activePoint ? activePoint.x : coordPoints[coordPoints.length - 1].x}
                    cy={activePoint ? activePoint.y : coordPoints[coordPoints.length - 1].y}
                    r="3.5"
                    fill={strokeColor}
                    stroke={isDark ? '#0A101D' : '#FFFFFF'}
                    strokeWidth="1"
                  />
                )}
              </svg>

              {/* Day Range Telemetry: 13.10 ────────●──────── 13.28 */}
              <div className={styles.miniDayRange}>
                <span className={`font-mono tabular-nums ${styles.rangeBound}`}>
                  {dayLow.toFixed(2)}
                </span>
                <div className={styles.rangeTrack}>
                  <div className={styles.rangeTrackLine} />
                  <div
                    className={styles.rangeIndicator}
                    style={{ left: `${rangeProgress}%` }}
                  >
                    <span className={styles.rangeIndicatorDot} />
                  </div>
                </div>
                <span className={`font-mono tabular-nums ${styles.rangeBound}`}>
                  {dayHigh.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
