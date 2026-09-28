import React, { useState } from 'react';
import type { Post } from '../types/bulletin';
import { CURRENT_USER } from '../services/mockData';
import { FeedCard } from './FeedCard';
import styles from './ProfilePage.module.css';

interface Props {
  posts: Post[];
  onLikeToggle: (id: string) => void;
  onOpenComments: (post: Post) => void;
  onShare: (post: Post) => void;
  onOpenCreate: () => void;
  onPostClick?: (post: Post) => void;
  onImageClick?: (url: string, title?: string) => void;
}

const FIELD_PHOTOS = [
  {
    id: 'p1',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=600&q=80',
    title: 'Sepanggar Substation 132kV Bay',
  },
  {
    id: 'p2',
    url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    title: 'SCADA Telemetry Controller Rack',
  },
  {
    id: 'p3',
    url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80',
    title: 'Wisma SESB Grid Operations Control',
  },
  {
    id: 'p4',
    url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80',
    title: 'Tenom Pangi Hydro Penstock Survey',
  },
];

export const ProfilePage: React.FC<Props> = ({
  posts,
  onLikeToggle,
  onOpenComments,
  onShare,
  onOpenCreate,
  onPostClick,
  onImageClick,
}) => {
  const [bio, setBio] = useState(
    'Leading grid telemetry automation and SCADA sensor deployments statewide. Committed to Sabah Electricity Goal Zero and reliable transmission.'
  );
  const [extension, setExtension] = useState('Ext. 4102');
  const [isEditing, setIsEditing] = useState(false);
  const [tempBio, setTempBio] = useState(bio);
  const [tempExt, setTempExt] = useState(extension);
  const [coverUrl, setCoverUrl] = useState(
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80'
  );

  // Filter posts authored by current user
  const userPosts = posts.filter(
    (p) => (p.author?.name || '').toLowerCase() === CURRENT_USER.name.toLowerCase()
  );

  // Total reactions on user's posts
  const totalReactions = userPosts.reduce((acc, p) => acc + p.likesCount, 48);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setBio(tempBio);
    setExtension(tempExt);
    setIsEditing(false);
  };

  const handleChangeCover = () => {
    // Toggle between Mt Kinabalu and Coastal Sabah view
    if (coverUrl.includes('1464822759023')) {
      setCoverUrl('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80');
    } else {
      setCoverUrl('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80');
    }
  };

  return (
    <div className={styles.profileContainer}>
      {/* 1. Facebook-Style Hero & Cover Banner */}
      <div className={styles.profileCard}>
        <div className={styles.coverWrapper}>
          <img src={coverUrl} alt="Cover Banner" className={styles.coverImg} />
          <button
            type="button"
            className={styles.changeCoverBtn}
            onClick={handleChangeCover}
            title="Update cover photo"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              photo_camera
            </span>
            <span>Edit Cover</span>
          </button>
        </div>

        {/* Profile Info Header */}
        <div className={styles.profileMetaDeck}>
          <div className={styles.avatarRow}>
            <div className={styles.avatarHolder}>
              <img
                src={CURRENT_USER.avatarUrl}
                alt={CURRENT_USER.name}
                className={styles.profileAvatar}
              />
              <span className={styles.onlineBadge} title="Available on corporate network"></span>
            </div>

            <div className={styles.actionPillsRow}>
              <button
                type="button"
                className={styles.editProfileBtn}
                onClick={() => setIsEditing(true)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  edit
                </span>
                <span>Edit Profile</span>
              </button>

              <button
                type="button"
                className={styles.createShortcutBtn}
                onClick={onOpenCreate}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  add
                </span>
                <span>New Post</span>
              </button>
            </div>
          </div>

          <div className={styles.identityDetails}>
            <div className={styles.nameVerifiedRow}>
              <h1 className={styles.userName}>{CURRENT_USER.name}</h1>
              <span className={styles.verifiedCheck} title="Verified SESB Staff">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0055A4' }}>
                  verified
                </span>
              </span>
            </div>

            <div className={styles.designationPillRow}>
              <span className={styles.deptBadge}>
                {CURRENT_USER.department}
              </span>
              <span className={styles.roleBadge}>
                {CURRENT_USER.role}
              </span>
            </div>

            <div className={styles.empIdRow}>
              <span className={styles.metaItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>badge</span>
                <span className="font-mono tabular-nums font-semibold">{CURRENT_USER.employeeId}</span>
              </span>
              <span className={styles.metaItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>location_on</span>
                <span>Wisma SESB HQ, Kota Kinabalu</span>
              </span>
              <span className={styles.metaItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>call</span>
                <span className="font-mono tabular-nums font-semibold">{extension}</span>
              </span>
            </div>

            <p className={styles.bioParagraph}>{bio}</p>
          </div>

          {/* 2. Influence & Impact Stats Strip */}
          <div className={styles.statsStrip}>
            <div className={styles.statBox}>
              <span className={`font-mono tabular-nums ${styles.statNumber}`}>{userPosts.length}</span>
              <span className={styles.statLabel}>Bulletins</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statBox}>
              <span className={`font-mono tabular-nums ${styles.statNumber}`}>{totalReactions}</span>
              <span className={styles.statLabel}>Reactions</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statBox}>
              <span className={`font-mono tabular-nums ${styles.statNumber}`}>99.8%</span>
              <span className={styles.statLabel}>HSE Compliance</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statBox}>
              <span className={`font-mono tabular-nums ${styles.statNumber}`}>6y</span>
              <span className={styles.statLabel}>Service</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Inline Field Photos Section (Facebook/Instagram Style Gallery) */}
      <section className={styles.photosSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#0055A4' }}>
              photo_library
            </span>
            <h2 className={styles.sectionTitle}>Field Photos & Site Logs</h2>
          </div>
          <span className="font-mono tabular-nums text-xs text-slate-500">
            {FIELD_PHOTOS.length} items
          </span>
        </div>

        <div className={styles.photoCarousel}>
          {FIELD_PHOTOS.map((photo) => (
            <div
              key={photo.id}
              className={styles.photoCard}
              onClick={() => onImageClick?.(photo.url, photo.title)}
              style={{ cursor: 'pointer' }}
              title="Click to view photo in full"
            >
              <img src={photo.url} alt={photo.title} className={styles.photoImg} />
              <div className={styles.photoCaptionWrap}>
                <span className={styles.photoCaption}>{photo.title}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Continuous Timeline Feed (User's Authored Posts) */}
      <section className={styles.timelineSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#1A7A5A' }}>
              dynamic_feed
            </span>
            <h2 className={styles.sectionTitle}>My Published Bulletins</h2>
          </div>
          <span className="font-mono tabular-nums text-xs text-slate-500">
            {userPosts.length} posts
          </span>
        </div>

        {userPosts.length > 0 ? (
          <div className={styles.postsList}>
            {userPosts.map((post) => (
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
        ) : (
          <div className={styles.noPostsCard}>
            <div className={styles.emptyIconCircle}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#94A3B8' }}>
                post_add
              </span>
            </div>
            <h3 className={styles.noPostsTitle}>No bulletins published yet</h3>
            <p className={styles.noPostsDesc}>
              Share your department announcements, plant inspection logs, or safety notices with statewide SESB colleagues.
            </p>
            <button
              type="button"
              className={styles.startPostBtn}
              onClick={onOpenCreate}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                add
              </span>
              <span>Publish First Bulletin</span>
            </button>
          </div>
        )}
      </section>

      {/* 5. Edit Profile Modal Sheet */}
      {isEditing && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Edit Profile">
          <div className={styles.modalSheet}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Profile Information</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsEditing(false)}
                title="Close modal"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className={styles.modalForm}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Bio & Station Mission</label>
                <textarea
                  className={styles.bioTextarea}
                  rows={4}
                  value={tempBio}
                  onChange={(e) => setTempBio(e.target.value)}
                  placeholder="Describe your core operational responsibilities at SESB..."
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Office / Desk Extension</label>
                <input
                  type="text"
                  className={styles.extInput}
                  value={tempExt}
                  onChange={(e) => setTempExt(e.target.value)}
                  placeholder="e.g. Ext. 4102"
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
