import React, { useState } from 'react';
import type { Employee, Story } from '../types/bulletin';
import { StoryViewerModal } from './StoryViewerModal';
import styles from './StoriesBar.module.css';

interface Props {
  currentUser: Employee;
  stories: Story[];
  onAddStoryClick: () => void;
}

export const StoriesBar: React.FC<Props> = ({ currentUser, stories, onAddStoryClick }) => {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  return (
    <section className={styles.storiesContainer} aria-label="Department Stories">
      <div className={`${styles.storiesTrack} no-scrollbar`}>
        {/* User Story / Create Story Circle */}
        <button
          type="button"
          className={styles.storyItem}
          onClick={onAddStoryClick}
          aria-label="Add to your story"
        >
          <div className={styles.avatarRingRead}>
            <div className={styles.avatarInner}>
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className={styles.avatarImg}
              />
              <span className={styles.addStoryBtn}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  add
                </span>
              </span>
            </div>
          </div>
          <span className={styles.storyLabel}>Your Story</span>
        </button>

        {/* Active Department Stories */}
        {stories.map((story, index) => (
          <button
            key={story.id}
            type="button"
            className={styles.storyItem}
            onClick={() => setActiveStoryIndex(index)}
            aria-label={`View story from ${story.departmentName}`}
          >
            <div className={story.hasUnread ? styles.avatarRingUnread : styles.avatarRingRead}>
              <div className={styles.avatarInner}>
                <img
                  src={story.imageUrl}
                  alt={story.departmentName}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/sesb_logo.png';
                  }}
                  className={styles.avatarImg}
                />
              </div>
            </div>
            <span className={styles.storyLabel}>{story.departmentName}</span>
          </button>
        ))}
      </div>

      {/* Full-Screen Instagram/WhatsApp Style Story Overlay */}
      {activeStoryIndex !== null && (
        <StoryViewerModal
          stories={stories}
          initialIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
        />
      )}
    </section>
  );
};
