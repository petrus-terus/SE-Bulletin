import React from 'react';
import styles from './DesktopWidgetsRail.module.css';

export const DesktopWidgetsRail: React.FC = () => {
  return (
    <aside className={styles.rail} aria-label="SESB Operations & Grid Info">
      {/* 1. Live Grid Telemetry Widget */}
      <div className={styles.widgetCard}>
        <div className={styles.widgetHeader}>
          <span className={styles.widgetTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bolt</span>
            Grid Telemetry
          </span>
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            <span className="font-mono tabular-nums">Synced</span>
          </div>
        </div>

        <div className={styles.telemetryList}>
          <div className={styles.telemetryItem}>
            <div>
              <div className={styles.stationName}>Tenom Pangi Hydro</div>
              <div className={styles.stationStatus}>132kV Online</div>
            </div>
            <div className={`${styles.stationValue} font-mono tabular-nums`}>66 MW</div>
          </div>

          <div className={styles.telemetryItem}>
            <div>
              <div className={styles.stationName}>Sepanggar Thermal</div>
              <div className={styles.stationStatus}>Gas Turbine Active</div>
            </div>
            <div className={`${styles.stationValue} font-mono tabular-nums`}>104 MW</div>
          </div>

          <div className={styles.telemetryItem}>
            <div>
              <div className={styles.stationName}>KK Central Substation</div>
              <div className={styles.stationStatus}>Sub-grid Normal</div>
            </div>
            <div className={`${styles.stationValue} font-mono tabular-nums`}>99.8%</div>
          </div>
        </div>
      </div>

      {/* 2. HSE Emergency Hotlines Widget */}
      <div className={styles.widgetCard}>
        <div className={styles.widgetHeader}>
          <span className={styles.widgetTitle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-alert-red)' }}>
              emergency
            </span>
            Emergency Hotlines
          </span>
        </div>

        <div className={styles.contactList}>
          <div className={styles.contactItem}>
            <span className={styles.contactLabel}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>call</span>
              Grid Control Room (Wisma)
            </span>
            <span className={`${styles.contactExt} font-mono tabular-nums`}>ext. 4000</span>
          </div>

          <div className={styles.contactItem}>
            <span className={styles.contactLabel}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>shield</span>
              HSE Incident Desk
            </span>
            <span className={`${styles.contactExt} font-mono tabular-nums`}>ext. 1122</span>
          </div>

          <div className={styles.contactItem}>
            <span className={styles.contactLabel}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>security</span>
              Security HQ Desk
            </span>
            <span className={`${styles.contactExt} font-mono tabular-nums`}>ext. 9900</span>
          </div>
        </div>
      </div>

      {/* 3. SESB Internal Notice Card */}
      <div className={styles.eventCard}>
        <span className={styles.eventTag}>Upcoming Event</span>
        <h3 className={styles.eventTitle}>Kinabalu Eco-Run 2026</h3>
        <p className={styles.eventMeta}>
          Oct 14, 2026 • Wisma SESB Sports Arena
        </p>
      </div>
    </aside>
  );
};
