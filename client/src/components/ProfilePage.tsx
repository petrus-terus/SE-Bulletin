import React, { useState } from 'react';
import type { Employee, Post } from '../types/bulletin';
import { CURRENT_USER } from '../services/mockData';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';
import { AchievementsDeck } from './AchievementsDeck';
import { FeedCard } from './FeedCard';
import styles from './ProfilePage.module.css';

interface Props {
  posts: Post[];
  currentUser?: Employee;
  viewedEmployee?: Employee | null;
  onBack?: () => void;
  onLikeToggle: (id: string) => void;
  onOpenComments: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
  onOpenCreate: () => void;
  onPostClick?: (post: Post) => void;
  onImageClick?: (url: string, title?: string) => void;
  onCallExt?: (employee: Employee) => void;
  onLogout?: () => void;
}

const DEFAULT_FIELD_PHOTOS = [
  {
    id: 'p1',
    url: '/mock-images/image1.png',
    title: 'Sepanggar Substation 132kV Bay',
  },
  {
    id: 'p2',
    url: '/mock-images/image2.png',
    title: 'SCADA Telemetry Controller Rack',
  },
  {
    id: 'p3',
    url: '/mock-images/image3.png',
    title: 'Wisma SESB Grid Operations Control',
  },
  {
    id: 'p4',
    url: '/mock-images/image4.png',
    title: 'Tenom Pangi Hydro Penstock Survey',
  },
];

export const ProfilePage: React.FC<Props> = ({
  posts,
  currentUser,
  viewedEmployee,
  onBack,
  onLikeToggle,
  onOpenComments,
  onDeletePost,
  onOpenCreate,
  onPostClick,
  onImageClick,
  onCallExt,
  onLogout,
}) => {
  const loggedInUser = currentUser || CURRENT_USER;
  const activeEmployee = viewedEmployee || loggedInUser;
  const isOwnProfile = activeEmployee.id === loggedInUser.id;

  const photosScrollRef = useHorizontalScroll<HTMLDivElement>();
  const [bio, setBio] = useState(
    activeEmployee.bio ||
      'Leading grid telemetry automation and SCADA sensor deployments statewide. Committed to Sabah Electricity Goal Zero and reliable transmission.'
  );
  const [extension, setExtension] = useState(activeEmployee.phoneExtension || 'Ext. 4102');
  const [isEditing, setIsEditing] = useState(false);
  const [tempBio, setTempBio] = useState(bio);
  const [tempExt, setTempExt] = useState(extension);
  const [coverUrl, setCoverUrl] = useState(
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80'
  );

  // Filter posts authored by active employee
  const userPosts = posts.filter(
    (p) =>
      (p.author?.id && activeEmployee.id && p.author.id === activeEmployee.id) ||
      (p.author?.name || '').toLowerCase().trim() === activeEmployee.name.toLowerCase().trim()
  );

  // Total reactions on user's posts
  const totalReactions = userPosts.reduce(
    (acc, p) => acc + (p.likesCount || 0),
    isOwnProfile ? 48 : Math.max(12, userPosts.length * 28)
  );

  // Unlocked achievements count (Bronze: 1, Silver: 5, Gold: 10)
  const unlockedBadgesCount =
    userPosts.length >= 10 ? 3 : userPosts.length >= 5 ? 2 : userPosts.length >= 1 ? 1 : 0;

  // Gather field photos from bulletins
  const authoredPhotos = userPosts
    .filter((p) => p.imageUrl || (p.mediaUrls && p.mediaUrls.length > 0))
    .map((p, idx) => ({
      id: `post-img-${p.id}-${idx}`,
      url: p.imageUrl || (p.mediaUrls && p.mediaUrls[0]) || '/mock-images/image1.png',
      title: p.title || 'Field Site Log',
    }));

  const displayPhotos = authoredPhotos.length > 0 ? authoredPhotos : DEFAULT_FIELD_PHOTOS;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setBio(tempBio);
    setExtension(tempExt);
    setIsEditing(false);
  };

  const handleChangeCover = () => {
    if (coverUrl.includes('1464822759023')) {
      setCoverUrl(
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
      );
    } else {
      setCoverUrl(
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80'
      );
    }
  };

  return (
    <div className={styles.profileContainer}>
      {/* 1. Facebook-Style Hero & Cover Banner */}
      <div className={styles.profileCard}>
        <div className={styles.coverWrapper}>
          <img
            src={coverUrl}
            alt="Cover Banner"
            className={styles.coverImg}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/mock-images/image3.png';
            }}
          />

          {/* Back Navigation Button when viewing another colleague */}
          {onBack && (
            <button
              type="button"
              className={styles.backNavBtn}
              onClick={onBack}
              aria-label="Back to previous screen"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                arrow_back
              </span>
              <span>Back</span>
            </button>
          )}

          {isOwnProfile && (
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
          )}
        </div>

        {/* Profile Info Header */}
        <div className={styles.profileMetaDeck}>
          <div className={styles.avatarRow}>
            <div className={styles.avatarHolder}>
              <img
                src={activeEmployee.avatarUrl}
                alt={activeEmployee.name}
                className={styles.profileAvatar}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/user_face.png';
                }}
              />
              {activeEmployee.isOnline && (
                <span className={styles.onlineBadge} title="Available on corporate network"></span>
              )}
            </div>

            <div className={styles.actionPillsRow}>
              {isOwnProfile ? (
                <>
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

                  {onLogout && (
                    <button
                      type="button"
                      className={styles.logoutBtn}
                      onClick={onLogout}
                      title="Switch staff account or log out"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        logout
                      </span>
                      <span>Switch / Log Out</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <a
                    href={`mailto:${activeEmployee.email}`}
                    className={styles.contactActionBtn}
                    title={`Send email to ${activeEmployee.name}`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      mail
                    </span>
                    <span>Email</span>
                  </a>

                  <button
                    type="button"
                    className={styles.callExtBtn}
                    onClick={() => {
                      if (onCallExt) {
                        onCallExt(activeEmployee);
                      }
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      call
                    </span>
                    <span className="font-mono tabular-nums">{activeEmployee.phoneExtension || 'Call Ext'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className={styles.identityDetails}>
            <div className={styles.nameVerifiedRow}>
              <h1 className={styles.userName}>{activeEmployee.name}</h1>
              {activeEmployee.isVerified && (
                <span className={styles.verifiedCheck} title="Verified SESB Staff">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '18px', color: '#0055A4' }}
                  >
                    verified
                  </span>
                </span>
              )}
            </div>

            <div className={styles.designationPillRow}>
              <span className={styles.deptBadge}>{activeEmployee.department}</span>
              <span className={styles.roleBadge}>{activeEmployee.designation}</span>
            </div>

            <div className={styles.empIdRow}>
              <span className={styles.metaItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  badge
                </span>
                <span className="font-mono tabular-nums font-semibold">
                  {activeEmployee.employeeId}
                </span>
              </span>
              <span className={styles.metaItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  location_on
                </span>
                <span>{activeEmployee.officeLocation || 'Wisma SESB HQ, Kota Kinabalu'}</span>
              </span>
              <span className={styles.metaItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  call
                </span>
                <span className="font-mono tabular-nums font-semibold">
                  {isOwnProfile ? extension : activeEmployee.phoneExtension || 'Ext. 4102'}
                </span>
              </span>
            </div>

            <p className={styles.bioParagraph}>{isOwnProfile ? bio : activeEmployee.bio}</p>
          </div>

          {/* 2. Focused Stats Strip (HSE Compliance & Service removed per request) */}
          <div className={styles.statsStrip}>
            <div className={styles.statBox}>
              <span className={`font-mono tabular-nums ${styles.statNumber}`}>
                {userPosts.length}
              </span>
              <span className={styles.statLabel}>Bulletins</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statBox}>
              <span className={`font-mono tabular-nums ${styles.statNumber}`}>
                {totalReactions}
              </span>
              <span className={styles.statLabel}>Reactions</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statBox}>
              <span className={`font-mono tabular-nums ${styles.statNumber}`}>
                {unlockedBadgesCount} / 3
              </span>
              <span className={styles.statLabel}>Achievements</span>
            </div>
          </div>

          {/* 3. Horizontal Honors & Achievements Deck */}
          <AchievementsDeck bulletinCount={userPosts.length} />
        </div>
      </div>

      {/* 4. Inline Field Photos Section (Facebook/Instagram Style Gallery) */}
      <section className={styles.photosSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '20px', color: '#0055A4' }}
            >
              photo_library
            </span>
            <h2 className={styles.sectionTitle}>Field Photos & Site Logs</h2>
          </div>
          <span className="font-mono tabular-nums text-xs text-slate-500">
            {displayPhotos.length} items
          </span>
        </div>

        <div ref={photosScrollRef} className={styles.photoCarousel}>
          {displayPhotos.map((photo) => (
            <div
              key={photo.id}
              className={styles.photoCard}
              onClick={() => onImageClick?.(photo.url, photo.title)}
              style={{ cursor: 'pointer' }}
              title="Click to view photo in full"
            >
              <img
                src={photo.url}
                alt={photo.title}
                className={styles.photoImg}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/mock-images/image1.png';
                }}
              />
              <div className={styles.photoCaptionWrap}>
                <span className={styles.photoCaption}>{photo.title}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Continuous Timeline Feed (User's Authored Posts) */}
      <section className={styles.timelineSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '20px', color: '#1A7A5A' }}
            >
              dynamic_feed
            </span>
            <h2 className={styles.sectionTitle}>
              {isOwnProfile ? 'My Published Bulletins' : `${activeEmployee.name}'s Bulletins`}
            </h2>
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
                currentUserId={loggedInUser.id}
                currentUserName={loggedInUser.name}
                currentUserRole={loggedInUser.role}
                onLikeToggle={onLikeToggle}
                onCommentClick={onOpenComments}
                onBookmarkToggle={() => {}}
                onDeletePost={onDeletePost}
                onPostClick={onPostClick}
              />
            ))}
          </div>
        ) : (
          <div className={styles.noPostsCard}>
            <div className={styles.emptyIconCircle}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '28px', color: '#94A3B8' }}
              >
                post_add
              </span>
            </div>
            <h3 className={styles.noPostsTitle}>No bulletins published yet</h3>
            <p className={styles.noPostsDesc}>
              {isOwnProfile
                ? 'Share your department announcements, plant inspection logs, or safety notices with statewide SESB colleagues.'
                : 'This staff member has not published any public bulletins yet.'}
            </p>
            {isOwnProfile && (
              <button type="button" className={styles.startPostBtn} onClick={onOpenCreate}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  add
                </span>
                <span>Publish First Bulletin</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* 6. Edit Profile Modal Sheet */}
      {isEditing && (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-label="Edit Profile"
        >
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
