import React, { useState, useEffect, useMemo } from 'react';
import type { Department, Employee, Post } from '@/types/bulletin';
import { ALL_EMPLOYEES, getRegisteredEmployees } from '@/services/mockData';
import { bulletinService } from '@/services/bulletinService';
import { FeedCard } from '@/shared/FeedCard';
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';
import { DEFAULT_AVATAR_URL, DEFAULT_DEPARTMENT_ID } from '@/constants/bulletin';
import { handleAvatarError } from '@/utils/imageFallbacks';
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
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: string;
  currentUserAvatar?: string;
  onLikeToggle: (id: string) => void;
  onOpenComments: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
  onEditPost?: (post: Post) => void;
  onPostClick?: (post: Post) => void;
  onViewProfile?: (employee: { id: string; name: string; avatarUrl: string; designation: string; department: string; email: string; extension?: string; staffId?: string }) => void;
  onBookmarkToggle?: (postId: string) => void;
  onVotePoll?: (postId: string, optionId: string) => void;
  onReactionSelect?: (postId: string, reaction: import('@/types/bulletin').EmojiReactionType) => void;
  onReshareToggle?: (postId: string) => void;
  onQuotePost?: (quotedPost: Post, commentText: string) => void;
  onSharePost?: (post: Post) => void;
  onReshareClick?: (post: Post) => void;
}

export const SearchDirectoryPage: React.FC<Props> = ({
  posts,
  departments,
  currentUserId,
  currentUserName,
  currentUserRole,
  currentUserAvatar,
  onLikeToggle,
  onOpenComments,
  onDeletePost,
  onEditPost,
  onPostClick,
  onViewProfile,
  onBookmarkToggle,
  onVotePoll,
  onReactionSelect,
  onReshareToggle,
  onQuotePost,
  onSharePost,
  onReshareClick,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'staff' | 'circulars' | 'departments'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const scopeChipsRef = useHorizontalScroll<HTMLDivElement>();
  const trendingTagsRef = useHorizontalScroll<HTMLDivElement>();

  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  const effectiveQuery = (selectedTag || debouncedQuery).trim().toLowerCase();

  // Active employee directory (seeded with local cache, updated live from Supabase)
  const [staffEmployees, setStaffEmployees] = useState<Employee[]>(() => [
    ...ALL_EMPLOYEES,
    ...getRegisteredEmployees(),
  ]);

  useEffect(() => {
    let isMounted = true;
    bulletinService.getProfiles().then((profiles) => {
      if (isMounted && profiles.length > 0) {
        setStaffEmployees(profiles);
      }
    });

    const unsubscribe = bulletinService.subscribeToProfiles((profiles) => {
      if (isMounted && profiles.length > 0) {
        setStaffEmployees(profiles);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const allStaff: EmployeeRecord[] = useMemo(
    () =>
      staffEmployees.map((emp) => ({
        id: emp.id,
        name: emp.name,
        designation: emp.designation,
        department: emp.department,
        departmentId: emp.adminDepartments?.[0] || DEFAULT_DEPARTMENT_ID,
        staffId: emp.employeeId,
        extension: emp.phoneExtension || 'Ext. 4100',
        email: emp.email,
        avatarUrl: emp.avatarUrl,
        isOnline: Boolean(emp.isOnline),
      })),
    [staffEmployees]
  );

  // Filter Employees (memoized)
  const filteredEmployees = useMemo(
    () =>
      allStaff.filter((emp) => {
        if (activeCategory === 'circulars' || activeCategory === 'departments') return false;
        if (!effectiveQuery) return true;
        return (
          emp.name.toLowerCase().includes(effectiveQuery) ||
          emp.designation.toLowerCase().includes(effectiveQuery) ||
          emp.department.toLowerCase().includes(effectiveQuery) ||
          emp.staffId.toLowerCase().includes(effectiveQuery) ||
          emp.email.toLowerCase().includes(effectiveQuery)
        );
      }),
    [allStaff, activeCategory, effectiveQuery]
  );

  // Filter Posts (memoized)
  const filteredPosts = useMemo(
    () =>
      posts.filter((p) => {
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
      }),
    [posts, activeCategory, effectiveQuery]
  );

  // Filter Departments (memoized)
  const filteredDepartments = useMemo(
    () =>
      departments.filter((d) => {
        if (d.id === 'dept-all') return false;
        if (activeCategory === 'staff' || activeCategory === 'circulars') return false;
        if (!effectiveQuery) return true;
        return d.name.toLowerCase().includes(effectiveQuery);
      }),
    [departments, activeCategory, effectiveQuery]
  );

  const clearSearch = () => {
    setQuery('');
    setSelectedTag(null);
  };

  return (
    <div className={styles.searchPageContainer}>
      {/* Sticky Search Header */}
      <div className={styles.searchHeaderDeck}>
        <div className={styles.inputWrapper}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-text-muted)' }}>
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
        <div ref={scopeChipsRef} className={styles.scopeChipsBar}>
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
        <div ref={trendingTagsRef} className={styles.trendingRow}>
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
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary-text)' }}>
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
                <div
                  key={emp.id}
                  className={styles.employeeCard}
                  onClick={() => onViewProfile?.(emp)}
                  style={onViewProfile ? { cursor: 'pointer' } : undefined}
                  title={onViewProfile ? `View ${emp.name}'s profile` : undefined}
                >
                  <div className={styles.empHeader}>
                    <div className={styles.empHeaderLeft}>
                      <div className={styles.avatarHolder}>
                        <img
                          src={emp.avatarUrl || DEFAULT_AVATAR_URL}
                          alt={emp.name}
                          className={styles.empAvatar}
                          onError={(e) => handleAvatarError(e)}
                        />
                        {emp.isOnline && <span className={styles.onlineBadge} title="Available online"></span>}
                      </div>

                      <div className={styles.empBio}>
                        <span className={styles.empName}>{emp.name}</span>
                        <span className={styles.empRole}>{emp.designation}</span>
                        <span className={styles.empDeptPill}>{emp.department}</span>
                      </div>
                    </div>

                    <span className={`material-symbols-outlined ${styles.empChevron}`} aria-hidden="true">
                      chevron_right
                    </span>
                  </div>

                  <div className={styles.empContactRow}>
                    <div className={styles.empMetaTag}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        pin
                      </span>
                      <span className="font-mono tabular-nums">{emp.staffId}</span>
                    </div>
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
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-forest-text)' }}>
                  corporate_fare
                </span>
                <span>SE Directorates & Units</span>
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
                    <span className={styles.deptCardSub}>Wisma SE HQ & Regional Substations</span>
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
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary-text)' }}>
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
                  currentUserId={currentUserId}
                  currentUserName={currentUserName}
                  currentUserRole={currentUserRole}
                  currentUserAvatar={currentUserAvatar}
                  onLikeToggle={onLikeToggle}
                  onCommentClick={onOpenComments}
                  onBookmarkToggle={onBookmarkToggle || (() => {})}
                  onDeletePost={onDeletePost}
                  onEditPost={onEditPost}
                  onPostClick={onPostClick}
                  onVotePoll={onVotePoll}
                  onReactionSelect={onReactionSelect}
                  onReshareToggle={onReshareToggle}
                  onQuotePost={onQuotePost}
                  onSharePost={onSharePost}
                  onReshareClick={onReshareClick}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty Search State */}
        {filteredEmployees.length === 0 && filteredPosts.length === 0 && filteredDepartments.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIconBox}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--color-text-muted)' }}>
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
