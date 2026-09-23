import React from 'react';
import styles from './AppShell.module.css';

interface Props {
  children: React.ReactNode;
}

export const AppShell: React.FC<Props> = ({ children }) => {
  return (
    <div className={styles.shell}>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
};
