import React from 'react';
import styles from './DockedFab.module.css';

interface Props {
  onClick: () => void;
}

export const DockedFab: React.FC<Props> = ({ onClick }) => {
  return (
    <button
      type="button"
      className={styles.dockedFab}
      onClick={onClick}
      data-chrome="docked-fab"
      aria-label="Create new bulletin post"
      title="Create Post"
    >
      <span className={`material-symbols-outlined ${styles.fabIcon}`}>add</span>
    </button>
  );
};
