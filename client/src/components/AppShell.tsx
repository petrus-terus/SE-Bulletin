import React from 'react';
import styles from './AppShell.module.css';

interface Props {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  rightRail?: React.ReactNode;
}

export const AppShell: React.FC<Props> = ({ children, sidebar, rightRail }) => {
  return (
    <div className={styles.shell}>
      <div className={styles.layoutContainer}>
        {sidebar && <aside className={styles.leftSidebar}>{sidebar}</aside>}
        <main className={styles.mainContent}>
          {children}
        </main>
        {rightRail && <aside className={styles.rightRail}>{rightRail}</aside>}
      </div>
    </div>
  );
};
