import React from 'react';
import styles from './AppShell.module.css';

interface Props {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  rightRail?: React.ReactNode;
  isDetailView?: boolean;
  hasTopAppBar?: boolean;
}

export const AppShell: React.FC<Props> = ({
  children,
  sidebar,
  rightRail,
  isDetailView,
  hasTopAppBar = true,
}) => {
  return (
    <div className={styles.shell}>
      <div className={`${styles.layoutContainer} ${isDetailView ? styles.layoutContainerDetail : ''}`}>
        {sidebar && <aside className={styles.leftSidebar}>{sidebar}</aside>}
        <main
          className={`${styles.mainContent} ${isDetailView ? styles.mainContentDetail : ''} ${
            !hasTopAppBar && !isDetailView ? styles.mainContentNoTopBar : ''
          }`}
        >
          {children}
        </main>
        {rightRail && <aside className={styles.rightRail}>{rightRail}</aside>}
      </div>
    </div>
  );
};
