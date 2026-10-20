import React, { useState, useMemo, useCallback } from 'react';
import type { Employee, Story, StoryGroup } from '@/types/bulletin';
import { StoryViewerModal } from '@/features/stories/StoryViewerModal';
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';
import styles from './StoriesBar.module.css';

interface Props {
  currentUser: Employee;
  stories: Story[];
  onAddStoryClick: () => void;
  onDeleteStory?: (storyId: string) => Promise<void> | void;
}

const VIEWED_STORIES_STORAGE_KEY = 'sesb_viewed_stories';

export function getViewedStoryIds(): Set<string> {
  try {
    const raw = localStorage.getItem(VIEWED_STORIES_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function saveViewedStoryId(storyId: string): void {
  try {
    const set = getViewedStoryIds();
    set.add(storyId);
    localStorage.setItem(VIEWED_STORIES_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // Ignore storage quota errors
  }
}

export const StoriesBar: React.FC<Props> = ({
  currentUser,
  stories,
  onAddStoryClick,
  onDeleteStory,
}) => {
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [viewedStoryIds, setViewedStoryIds] = useState<Set<string>>(() => getViewedStoryIds());
  const storiesScrollRef = useHorizontalScroll<HTMLDivElement>();

  // Check if a story belongs to the current logged in user
  const isSelf = useCallback(
    (story: Story) => {
      if (!currentUser) return false;
      const sName = (story.authorName || '').toLowerCase().trim();
      const cName = (currentUser.name || '').toLowerCase().trim();
      return Boolean(cName && (sName === cName || sName.includes(cName) || cName.includes(sName)));
    },
    [currentUser]
  );

  // Group flat stories into clean department/author clusters
  const { myGroup, otherGroups, allGroups } = useMemo(() => {
    const myStoriesList: Story[] = [];
    const groupMap = new Map<string, Story[]>();

    for (const story of stories) {
      if (isSelf(story)) {
        myStoriesList.push(story);
      } else {
        const groupKey = story.departmentId || story.departmentName || story.authorName || 'dept-ops';
        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, []);
        }
        groupMap.get(groupKey)!.push(story);
      }
    }

    const myStoryGroup: StoryGroup | null =
      myStoriesList.length > 0
        ? {
            id: 'group-me',
            title: 'Your Story',
            authorName: currentUser.name,
            authorAvatar: currentUser.avatarUrl,
            departmentName: currentUser.department || 'Operations',
            isDepartment: false,
            hasUnread: myStoriesList.some((s) => !viewedStoryIds.has(s.id)),
            stories: myStoriesList,
            isCurrentUser: true,
          }
        : null;

    const others: StoryGroup[] = Array.from(groupMap.entries()).map(([key, groupStories], gIdx) => {
      const first = groupStories[0];
      const hasUnread = groupStories.some((s) => !viewedStoryIds.has(s.id));
      const isDept = Boolean(first.departmentName && first.departmentName.length > 0);

      // Determine clean label: Dept Name or Staff First Name
      let displayTitle = first.departmentName || key;
      if (!isDept) {
        displayTitle = (first.authorName || 'Staff').split(' ')[0];
      }

      return {
        id: `group-${key}-${gIdx}`,
        title: displayTitle,
        authorName: first.authorName,
        authorAvatar: first.authorAvatar || '/sabah_electricity_logo.png',
        departmentName: first.departmentName,
        isDepartment: isDept,
        hasUnread,
        stories: groupStories,
        isCurrentUser: false,
      };
    });

    const combined: StoryGroup[] = [];
    if (myStoryGroup) combined.push(myStoryGroup);
    combined.push(...others);

    return {
      myGroup: myStoryGroup,
      otherGroups: others,
      allGroups: combined,
    };
  }, [stories, currentUser, isSelf, viewedStoryIds]);

  const handleStoryViewed = useCallback((storyId: string) => {
    saveViewedStoryId(storyId);
    setViewedStoryIds((prev) => {
      const next = new Set(prev);
      next.add(storyId);
      return next;
    });
  }, []);

  return (
    <section className={styles.storiesContainer} aria-label="Department Stories">
      <div ref={storiesScrollRef} className={`${styles.storiesTrack} no-scrollbar`}>
        {/* User Story Circle: Dual State (Tap avatar to view active stories; tap '+' to create) */}
        <div className={styles.storyItemWrapper}>
          <button
            type="button"
            className={styles.storyItem}
            onClick={() => {
              if (myGroup && myGroup.stories.length > 0) {
                // Open user's own stories
                setActiveGroupIndex(0);
              } else {
                onAddStoryClick();
              }
            }}
            aria-label={
              myGroup && myGroup.stories.length > 0
                ? 'View your active 24h story'
                : 'Share a 24h story'
            }
          >
            <div
              className={
                myGroup && myGroup.hasUnread
                  ? styles.avatarRingUnread
                  : styles.avatarRingRead
              }
            >
              <div className={styles.avatarInner}>
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className={styles.avatarImg}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/sabah_electricity_logo.png';
                  }}
                />
              </div>
            </div>
            <span className={styles.storyLabel}>Your Story</span>
          </button>

          {/* Dedicated Floating '+' CTA */}
          <button
            type="button"
            className={styles.addStoryBtn}
            onClick={(e) => {
              e.stopPropagation();
              onAddStoryClick();
            }}
            aria-label="Add new story"
            title="Add new story"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              add
            </span>
          </button>
        </div>

        {/* Grouped Department & Colleague Stories */}
        {otherGroups.map((group, groupIdx) => {
          const overallIndex = myGroup ? groupIdx + 1 : groupIdx;
          return (
            <button
              key={group.id}
              type="button"
              className={styles.storyItem}
              onClick={() => setActiveGroupIndex(overallIndex)}
              aria-label={`View ${group.stories.length} stories from ${group.title}`}
            >
              <div className={group.hasUnread ? styles.avatarRingUnread : styles.avatarRingRead}>
                <div className={styles.avatarInner}>
                  <img
                    src={group.authorAvatar}
                    alt={group.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/sabah_electricity_logo.png';
                    }}
                    className={styles.avatarImg}
                  />
                </div>
              </div>
              <span className={styles.storyLabel}>{group.title}</span>
            </button>
          );
        })}
      </div>

      {/* Full-Screen Story Viewer Modal */}
      {activeGroupIndex !== null && allGroups[activeGroupIndex] && (
        <StoryViewerModal
          storyGroups={allGroups}
          initialGroupIndex={activeGroupIndex}
          onClose={() => setActiveGroupIndex(null)}
          onStoryViewed={handleStoryViewed}
          currentUserId={currentUser.id}
          currentUserName={currentUser.name}
          currentUserRole={currentUser.role}
          onDeleteStory={onDeleteStory}
        />
      )}
    </section>
  );
};
