import React, { useState } from 'react';
import type { Department, Post } from '../types/bulletin';
import { FeedCard } from './FeedCard';
import styles from './SearchDirectoryPage.module.css';

interface EmployeeRecord {
  id: string;
  name: string;
  designation: string;
  department: string;
  departmentId: string;
  staffId: string;
  extension: string;
  email: string;
  avatarUrl: string;
  isOnline: boolean;
}

const MOCK_EMPLOYEES: EmployeeRecord[] = [
  {
    id: 'emp-1',
    name: 'Mohd Irfan B. Zainal',
    designation: 'Senior Grid Automation Engineer',
    department: 'IT & Grid Automation',
    departmentId: 'dept-it',
    staffId: 'SESB-1001',
    extension: 'Ext. 4102',
    email: 'mohd.irfan@sesb.com.my',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    isOnline: true,
  },
  {
    id: 'emp-2',
    name: 'Ir. Raymond Chin',
    designation: 'Principal Operations Manager',
    department: 'Operations & Engineering',
    departmentId: 'dept-ops',
    staffId: 'SESB-2044',
    extension: 'Ext. 3201',
    email: 'raymond.chin@sesb.com.my',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    isOnline: true,
  },
  {
    id: 'emp-3',
    name: 'Siti Aminah Bt. Mansur',
    designation: 'HSE Compliance Lead',
    department: 'Safety & Health (HSE)',
    departmentId: 'dept-hse',
    staffId: 'SESB-3012',
    extension: 'Ext. 5504',
    email: 'siti.aminah@sesb.com.my',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    isOnline: false,
  },
  {
    id: 'emp-4',
    name: 'Dayang Norhafizah',
    designation: 'Head of Corporate Communications',
    department: 'Corporate Communications',
    departmentId: 'dept-comm',
    staffId: 'SESB-4089',
    extension: 'Ext. 6100',
    email: 'dayang.norhafizah@sesb.com.my',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
    isOnline: true,
  },
  {
    id: 'emp-5',
    name: 'Kevin Liew',
    designation: 'Senior Hydro Maintenance Engineer',
    department: 'Tenom Pangi Hydro',
    departmentId: 'dept-ops',
    staffId: 'SESB-5120',
    extension: 'Ext. 7701',
    email: 'kevin.liew@sesb.com.my',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    isOnline: false,
  },
];

const TRENDING_QUERIES = [
  '#SOP2026',
  'Tenom Pangi Hydro',
  'Sepanggar Power Station',
  'Grid Frequency Control',
  'Medical Claims',
  'HSE Directive 04',
];

interface Props {
  posts: Post[];
  departments: Department[];
  onLikeToggle: (id: string) => void;
  onOpenComments: (post: Post) => void;
  onShare: (post: Post) => void;
  onPostClick?: (post: Post) => void;
}

export const SearchDirectoryPage: React.FC<Props> = ({
  posts,
  departments,
  onLikeToggle,
  onOpenComments,
  onShare,
  onPostClick,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'staff' | 'circulars' | 'departments'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const effectiveQuery = (selectedTag || query).trim().toLowerCase();

  // Filter Employees
  const filteredEmployees = MOCK_EMPLOYEES.filter((emp) => {
    if (activeCategory === 'circulars' || activeCategory === 'departments') return false;
    if (!effectiveQuery) return true;
    return (
      emp.name.toLowerCase().includes(effectiveQuery) ||
      emp.designation.toLowerCase().includes(effectiveQuery) ||
      emp.department.toLowerCase().includes(effectiveQuery) ||
      emp.staffId.toLowerCase().includes(effectiveQuery) ||
      emp.email.toLowerCase().includes(effectiveQuery)
    );
  });

  // Filter Posts
  const filteredPosts = posts.filter((p) => {
    if (activeCategory === 'staff' || activeCategory === 'departments') return false;
    if (activeCategory === 'circulars' && !p.officialNotice) return false;
    if (!effectiveQuery) return true;
    const dept = p.author?.department || p.departmentName || '';
    const author = p.author?.name || '';
    return (
      (p.title && p.title.toLowerCase().includes(effectiveQuery)) ||
      p.content.toLowerCase().includes(effectiveQuery) ||
      dept.toLowerCase().includes(effectiveQuery) ||
      author.toLowerCase().includes(effectiveQuery)
    );
  });

  // Filter Departments
  const filteredDepartments = departments.filter((d) => {
    if (d.id === 'dept-all') return false;
    if (activeCategory === 'staff' || activeCategory === 'circulars') return false;
    if (!effectiveQuery) return true;
    return d.name.toLowerCase().includes(effectiveQuery);
  });

  const clearSearch = () => {
    setQuery('');
    setSelectedTag(null);
  };

  return (
    <div className={styles.searchPageContainer}>
      {/* Sticky Search Header */}
      <div className={styles.searchHeaderDeck}>
        <div className={styles.inputWrapper}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#64748B' }}>
            search
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search bulletins, staff directory, SOPs..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (selectedTag) setSelectedTag(null);
            }}
          />
          {(query || selectedTag) && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={clearSearch}
              title="Clear search"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                close
              </span>
            </button>
          )}
        </div>

        {/* Category Scope Chips */}
        <div className={styles.scopeChipsBar}>
          <button
            type="button"
            className={`${styles.scopeChip} ${activeCategory === 'all' ? styles.scopeChipActive : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Results
          </button>
          <button
            type="button"
            className={`${styles.scopeChip} ${activeCategory === 'staff' ? styles.scopeChipActive : ''}`}
            onClick={() => setActiveCategory('staff')}
          >
            Staff Directory ({filteredEmployees.length})
          </button>
          <button
            type="button"
            className={`${styles.scopeChip} ${activeCategory === 'circulars' ? styles.scopeChipActive : ''}`}
            onClick={() => setActiveCategory('circulars')}
          >
            Official Circulars
          </button>
          <button
            type="button"
            className={`${styles.scopeChip} ${activeCategory === 'departments' ? styles.scopeChipActive : ''}`}
            onClick={() => setActiveCategory('departments')}
          >
            Departments
          </button>
        </div>

        {/* Trending Searches Row */}
        <div className={styles.trendingRow}>
          <span className={styles.trendingLabel}>Trending:</span>
          <div className={styles.trendingTagsList}>
            {TRENDING_QUERIES.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`${styles.trendingTagPill} ${selectedTag === tag ? styles.trendingTagPillActive : ''}`}
                onClick={() => {
                  if (selectedTag === tag) {
                    setSelectedTag(null);
                  } else {
                    setSelectedTag(tag);
                    setQuery('');
                  }
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className={styles.resultsBody}>
        {/* Staff Directory Section */}
        {(activeCategory === 'all' || activeCategory === 'staff') && filteredEmployees.length > 0 && (
          <section className={styles.resultSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0055A4' }}>
                  badge
                </span>
                <span>Staff & Organizational Directory</span>
              </h2>
              <span className="font-mono tabular-nums text-xs text-slate-500">
                {filteredEmployees.length} found
              </span>
            </div>

            <div className={styles.staffGrid}>
              {filteredEmployees.map((emp) => (
                <div key={emp.id} className={styles.employeeCard}>
                  <div className={styles.empHeader}>
                    <div className={styles.avatarHolder}>
                      <img src={emp.avatarUrl} alt={emp.name} className={styles.empAvatar} />
                      {emp.isOnline && <span className={styles.onlineBadge} title="Available online"></span>}
                    </div>

                    <div className={styles.empBio}>
                      <span className={styles.empName}>{emp.name}</span>
                      <span className={styles.empRole}>{emp.designation}</span>
                      <span className={styles.empDeptPill}>{emp.department}</span>
                    </div>
                  </div>

                  <div className={styles.empContactRow}>
                    <div className={styles.empMetaTag}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        pin
                      </span>
                      <span className="font-mono tabular-nums">{emp.staffId}</span>
                    </div>
                    <div className={styles.empMetaTag}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        call
                      </span>
                      <span className="font-mono tabular-nums">{emp.extension}</span>
                    </div>
                  </div>

                  <div className={styles.empActionButtons}>
                    <a
                      href={`mailto:${emp.email}`}
                      className={styles.contactBtn}
                      title={`Send email to ${emp.name}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                        mail
                      </span>
                      <span>Email</span>
                    </a>
                    <button
                      type="button"
                      className={styles.callExtBtn}
                      onClick={() => alert(`Dialing ${emp.name} at ${emp.extension}...`)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                        phone_in_talk
                      </span>
                      <span>Call {emp.extension}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Department Directory Section */}
        {(activeCategory === 'all' || activeCategory === 'departments') && filteredDepartments.length > 0 && (
          <section className={styles.resultSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#1A7A5A' }}>
                  corporate_fare
                </span>
                <span>SESB Directorates & Units</span>
              </h2>
            </div>

            <div className={styles.deptDirectoryGrid}>
              {filteredDepartments.map((dept) => (
                <div key={dept.id} className={styles.deptCard}>
                  <div className={styles.deptCardIcon} style={{ background: dept.colorBg || `${dept.color}15` }}>
                    <span className="material-symbols-outlined" style={{ color: dept.colorText || dept.color, fontSize: '20px' }}>
                      domain
                    </span>
                  </div>
                  <div className={styles.deptCardInfo}>
                    <span className={styles.deptCardName}>{dept.name}</span>
                    <span className={styles.deptCardSub}>Wisma SESB HQ & Regional Substations</span>
                  </div>
                  <span className={styles.deptActionArrow}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      chevron_right
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bulletins Section */}
        {(activeCategory === 'all' || activeCategory === 'circulars') && filteredPosts.length > 0 && (
          <section className={styles.resultSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0055A4' }}>
                  feed
                </span>
                <span>Relevant Bulletins & SOPs</span>
              </h2>
              <span className="font-mono tabular-nums text-xs text-slate-500">
                {filteredPosts.length} bulletins
              </span>
            </div>

            <div className={styles.bulletinsList}>
              {filteredPosts.map((post) => (
                <FeedCard
                  key={post.id}
                  post={post}
                  onLikeToggle={onLikeToggle}
                  onCommentClick={onOpenComments}
                  onShareClick={onShare}
                  onBookmarkToggle={() => {}}
                  onPostClick={onPostClick}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty Search State */}
        {filteredEmployees.length === 0 && filteredPosts.length === 0 && filteredDepartments.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconBox}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#94A3B8' }}>
                search_off
              </span>
            </div>
            <h3 className={styles.emptyTitle}>No matching records found</h3>
            <p className={styles.emptyDesc}>
              Try searching for an employee name, staff ID (e.g. SESB-1001), department, or browse trending topics above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
