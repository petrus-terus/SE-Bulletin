import React from 'react';
import { handleHideImageOnError } from '@/utils/imageFallbacks';
import styles from './SesiKnowledgeHubBanner.module.css';

const SESI_URL = 'https://www.sesb.com.my/';

export const SesiKnowledgeHubBanner: React.FC = () => {
  return (
    <a
      href={SESI_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.bannerLink}
      aria-label="Open SESI Knowledge Hub in a new tab"
    >
      <div className={styles.bannerCard}>
        {/* Logo inside white circle badge */}
        <div className={styles.logoBadge}>
          <img
            src="/sesi_logo.png"
            alt=""
            className={styles.logoImg}
            onError={handleHideImageOnError}
          />
        </div>

        {/* Text group */}
        <div className={styles.textGroup}>
          <h3 className={styles.title}>SESI Knowledge Hub</h3>
          <p className={styles.subtitle}>
            Making Sabah's electricity industry easier to understand
          </p>
        </div>

        {/* Arrow CTA */}
        <div className={styles.arrowBadge}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '20px' }}
          >
            arrow_forward
          </span>
        </div>
      </div>
    </a>
  );
};
