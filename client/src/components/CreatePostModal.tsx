import React, { useState } from 'react';
import type { Department, Employee, Post, PostArchetype } from '../types/bulletin';
import styles from './CreatePostModal.module.css';

interface Props {
  currentUser: Employee;
  departments: Department[];
  isOpen: boolean;
  onClose: () => void;
  onPublish: (newPost: Post) => void;
}

export const CreatePostModal: React.FC<Props> = ({
  currentUser,
  departments,
  isOpen,
  onClose,
  onPublish,
}) => {
  const [archetype, setArchetype] = useState<PostArchetype>('status');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [departmentId, setDepartmentId] = useState('dept-ops');
  const [location, setLocation] = useState('Wisma SESB HQ, Kota Kinabalu');
  const [imageUrl, setImageUrl] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const selectedDept = departments.find((d) => d.id === departmentId);

    const newPost: Post = {
      id: `post-${Date.now()}`,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        designation: currentUser.designation,
        department: currentUser.department,
        avatarUrl: currentUser.avatarUrl,
        isVerified: true,
      },
      timestamp: 'Just now',
      title: title.trim(),
      content: content.trim(),
      location: location.trim() || null,
      imageUrl: imageUrl.trim() || (archetype === 'photo' ? 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80' : null),
      isPinned: archetype === 'announcement' ? isPinned : false,
      commentsEnabled,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      isLiked: false,
      isBookmarked: false,
      departmentId,
      departmentName: selectedDept ? selectedDept.name : currentUser.department,
      departmentColor: selectedDept ? selectedDept.color : '#0055A4',
      previewComment: null,
    };

    onPublish(newPost);
    onClose();
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
        {/* Handle Bar */}
        <div className={styles.handleBar}>
          <div className={styles.handle} />
        </div>

        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create Bulletin Post</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.scrollArea}>
            {/* Archetype Selector */}
            <div className={styles.archetypeGrid}>
              <div
                className={`${styles.archetypeCard} ${
                  archetype === 'status' ? styles.archetypeActive : ''
                }`}
                onClick={() => setArchetype('status')}
              >
                <span className={`material-symbols-outlined ${styles.archetypeIcon}`}>
                  edit_note
                </span>
                <span className={styles.archetypeName}>Status</span>
                <span className={styles.archetypeDesc}>Quick update</span>
              </div>

              <div
                className={`${styles.archetypeCard} ${
                  archetype === 'photo' ? styles.archetypeActive : ''
                }`}
                onClick={() => setArchetype('photo')}
              >
                <span className={`material-symbols-outlined ${styles.archetypeIcon}`}>
                  photo_library
                </span>
                <span className={styles.archetypeName}>Photo</span>
                <span className={styles.archetypeDesc}>Images & media</span>
              </div>

              <div
                className={`${styles.archetypeCard} ${
                  archetype === 'announcement' ? styles.archetypeActive : ''
                }`}
                onClick={() => setArchetype('announcement')}
              >
                <span className={`material-symbols-outlined ${styles.archetypeIcon}`}>
                  campaign
                </span>
                <span className={styles.archetypeName}>Announcement</span>
                <span className={styles.archetypeDesc}>Official circular</span>
              </div>
            </div>

            {/* Department Tag Selector */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Publishing Division / Department</label>
              <select
                className={styles.input}
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                {departments
                  .filter((d) => d.id !== 'dept-all')
                  .map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
              </select>
            </div>

            {/* Title / Headline */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Headline / Title *</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Substation Maintenance Schedule or Project Milestone..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Rich Content Body */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Content / Message *</label>
              <textarea
                className={styles.textarea}
                placeholder="Write message details for Sabah Electricity colleagues (supports #tags)..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            {/* Location */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Operating Location / Station</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Wisma SESB, Tenom Pangi, Sepanggar Power Station"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Image URL (for photo archetype or attachment) */}
            {(archetype === 'photo' || archetype === 'announcement') && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Photo / Image Attachment URL</label>
                <input
                  type="url"
                  className={styles.input}
                  placeholder="https://... (Leave blank for curated default image)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
            )}

            {/* Toggles */}
            <div className={styles.togglesRow}>
              {archetype === 'announcement' && (
                <label className={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                  />
                  <span>Pin to top of feed</span>
                </label>
              )}

              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={commentsEnabled}
                  onChange={(e) => setCommentsEnabled(e.target.checked)}
                />
                <span>Allow comments</span>
              </label>
            </div>
          </div>

          {/* Modal Footer with Strict WCAG AAA Dark Ink on Accent Green */}
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-accent"
              disabled={!title.trim() || !content.trim()}
              style={{
                opacity: !title.trim() || !content.trim() ? 0.4 : 1,
                cursor: !title.trim() || !content.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                send
              </span>
              <span>Publish Bulletin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
