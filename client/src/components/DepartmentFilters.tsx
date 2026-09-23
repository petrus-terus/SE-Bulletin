import React from 'react';
import type { Department } from '../types/bulletin';
import styles from './DepartmentFilters.module.css';

interface Props {
  departments: Department[];
  selectedDepartmentId: string;
  onSelectDepartment: (id: string) => void;
  postCounts: Record<string, number>;
}

export const DepartmentFilters: React.FC<Props> = ({
  departments,
  selectedDepartmentId,
  onSelectDepartment,
  postCounts,
}) => {
  return (
    <nav className={`${styles.filtersContainer} no-scrollbar`} aria-label="Filter bulletin by department">
      {departments.map((dept) => {
        const isActive = dept.id === selectedDepartmentId;
        const count = postCounts[dept.id] ?? (dept.id === 'dept-all' ? postCounts['total'] ?? 0 : 0);

        return (
          <button
            key={dept.id}
            type="button"
            className={`${styles.filterPill} ${isActive ? styles.filterPillActive : ''}`}
            onClick={() => onSelectDepartment(dept.id)}
            aria-pressed={isActive}
          >
            <span className={`material-symbols-outlined ${styles.filterIcon}`}>
              {dept.icon}
            </span>
            <span>{dept.name}</span>
            {count > 0 && (
              <span
                className={`${styles.countBadge} ${
                  isActive ? styles.countBadgeActive : ''
                } tabular-nums font-mono`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
