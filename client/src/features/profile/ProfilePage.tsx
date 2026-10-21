import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Employee } from '@/types/bulletin';
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';
import { AchievementsDeck } from '@/features/profile/AchievementsDeck';
import { AvatarCropSheet } from '@/features/profile/AvatarCropSheet';
import { FeedCard } from '@/shared/FeedCard';
import { useFeed } from '@/context/FeedContext';
import { useOverlay } from '@/context/OverlayContext';
import { ACCEPTED_AVATAR_TYPES } from '@/utils/cropImage';
import {
  DEFAULT_COVER_URL,
  DEFAULT_AVATAR_URL,
  SESB_LOCATIONS,
  FALLBACK_POST_IMAGE_URL,
} from '@/constants/bulletin';
import { handleAvatarError, handleCoverError, handlePostImageError } from '@/utils/imageFallbacks';
import { getPostPermissions } from '@/utils/postPermissions';
import { EditProfileModal } from '@/features/profile/EditProfileModal';
import { useProfileMediaUpload } from './useProfileMediaUpload';
import styles from './ProfilePage.module.css';

interface Props {
  currentUser: Employee;
  viewedEmployee?: Employee | null;
  onBack?: () => void;
  onLogout?: () => void;
  onUpdateProfile?: (updated: Employee) => void;
}

const SESB_DIVISIONS = [
  'Information & Digital',
  'Operations & Grid',
  'Engineering & Distribution',
  'Safety & Health (HSE)',
  'Corporate Communications',
  'Human Resources',
  'Finance & Procurement',
  'Chief Executive Officer (CEO) Office',
];

export const ProfilePage: React.FC<Props> = ({
  currentUser,
  viewedEmployee,
  onBack,
  onUpdateProfile,
}) => {
  const loggedInUser = currentUser;
  const activeEmployee = viewedEmployee || loggedInUser;
  const isOwnProfile = activeEmployee.id === loggedInUser.id;

  const photosScrollRef = useHorizontalScroll<HTMLDivElement>();
  const feed = useFeed();
  const overlay = useOverlay();

  // Profile fields state (keyed by employee id in TabRouter.tsx for automatic resets)
  const [profileData, setProfileData] = useState<Employee>(activeEmployee);

  // Active division & location with fallback to profileData
  const activeDivision = profileData.department || SESB_DIVISIONS[0];
  const activeLocation = profileData.officeLocation || SESB_LOCATIONS[0];

  // Modal visibility states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempAvatarUrl, setTempAvatarUrl] = useState(
    profileData.avatarUrl || DEFAULT_AVATAR_URL
  );
  const [tempCoverUrl, setTempCoverUrl] = useState(
    profileData.coverUrl || DEFAULT_COVER_URL
  );

  const {
    avatarFileInputRef,
    coverFileInputRef,
    pendingAvatarFile,
    isAvatarUploading,
    closeAvatarSheet,
    handleFileUpload,
    handleAvatarConfirm,
  } = useProfileMediaUpload({
    profileData,
    setProfileData,
    isEditModalOpen,
    setTempAvatarUrl,
    setTempCoverUrl,
    setToast: feed.setToast,
    onUpdateProfile,
  });

  // Filter posts authored or reshared by active employee using centralized permission helper
  const userPosts = feed.posts.filter((p) => {
    const { isOwnPost } = getPostPermissions(p, {
      currentUserId: activeEmployee.id,
      currentUserName: activeEmployee.name,
      currentUserRole: activeEmployee.role,
    });
    const isResharedByUser =
      (p.resharedBy?.id && activeEmployee.id && p.resharedBy.id === activeEmployee.id) ||
      (p.isReshared && isOwnProfile);
    return isOwnPost || isResharedByUser;
  });

  // Total reactions on user's posts
  const totalReactions = userPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0);

  // Unlocked achievements count (Bronze: 1, Silver: 5, Gold: 10)
  const unlockedBadgesCount =
    userPosts.length >= 10 ? 3 : userPosts.length >= 5 ? 2 : userPosts.length >= 1 ? 1 : 0;

  // Gather field photos from bulletins
  const authoredPhotos = userPosts
    .filter((p) => p.imageUrl || (p.mediaUrls && p.mediaUrls.length > 0))
    .map((p, idx) => ({
      id: `post-img-${p.id}-${idx}`,
      url: p.imageUrl || (p.mediaUrls && p.mediaUrls[0]) || FALLBACK_POST_IMAGE_URL,
      title: p.title || 'Field Site Log',
    }));

  // Brand-new user onboarding completion rate calculation
  const hasBioFilled = Boolean(profileData.bio && profileData.bio.trim().length > 15);
  const hasPublishedBulletin = userPosts.length > 0;

  const openEditProfileModal = () => {
    setTempAvatarUrl(profileData.avatarUrl || DEFAULT_AVATAR_URL);
    setTempCoverUrl(profileData.coverUrl || DEFAULT_COVER_URL);
    setIsEditModalOpen(true);
  };

  const completionChecks = [
    { label: `Division Registered (${profileData.department || 'INFORMATION & DIGITAL'})`, isCompleted: true },
    { label: `Office Location (${profileData.officeLocation || 'Bangunan KWASA'})`, isCompleted: true },
    {
      label: 'Complete Operational Bio',
      isCompleted: hasBioFilled,
      action: openEditProfileModal,
      actionLabel: 'Edit Bio',
    },
    {
      label: 'Publish Your First Public Bulletin',
      isCompleted: hasPublishedBulletin,
      action: overlay.openCreate,
      actionLabel: 'New Post',
    },
  ];

  const completedSteps = completionChecks.filter((c) => c.isCompleted).length;
  const completionPercentage = Math.round((completedSteps / completionChecks.length) * 100);

  return (
    <div className={styles.profileContainer}>
      {/* Hidden file inputs for direct device photo uploads */}
      <input
        type="file"
        ref={avatarFileInputRef}
        onChange={(e) => handleFileUpload(e, 'avatar')}
        accept={ACCEPTED_AVATAR_TYPES.join(',')}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      <input
        type="file"
        ref={coverFileInputRef}
        onChange={(e) => handleFileUpload(e, 'cover')}
        accept="image/*"
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      {/* Avatar crop sheet — the photo is only uploaded once framing is confirmed */}
      {pendingAvatarFile &&
        createPortal(
          <AvatarCropSheet
            imageFile={pendingAvatarFile}
            isUploading={isAvatarUploading}
            onCancel={closeAvatarSheet}
            onConfirm={handleAvatarConfirm}
            onError={(message) => feed.setToast({ message, icon: 'error' })}
          />,
          document.body
        )}

      {/* 1. Facebook-Style Hero & Panoramic Cover Banner */}
      <div className={styles.profileCard}>
        <div className={styles.coverWrapper}>
          <img
            src={profileData.coverUrl || DEFAULT_COVER_URL}
            alt="Corporate Cover Banner"
            className={styles.coverImg}
            onError={(e) => handleCoverError(e)}
          />

          {/* Subtle gradient vignette for text legibility */}
          <div className={styles.coverVignette} />

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

          {/* Direct Trigger: Upload Cover Photo Button on Banner */}
          {isOwnProfile && (
            <button
              type="button"
              className={styles.changeCoverBtn}
              onClick={() => coverFileInputRef.current?.click()}
              title="Upload cover banner photo"
              aria-label="Change Cover Photo"
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
            {/* 88px Avatar with Sabah Electricity Crest or custom photo */}
            <div className={styles.avatarHolder}>
              <img
                src={profileData.avatarUrl || DEFAULT_AVATAR_URL}
                alt={profileData.name}
                className={styles.profileAvatar}
                onError={(e) => handleAvatarError(e)}
              />

              {profileData.isOnline && (
                <span className={styles.onlineBadge} title="Available on Sabah corporate intranet" />
              )}

              {/* Direct Trigger: Camera Upload Button on Avatar */}
              {isOwnProfile && (
                <button
                  type="button"
                  className={styles.avatarCameraBtn}
                  onClick={() => avatarFileInputRef.current?.click()}
                  title="Upload profile picture"
                  aria-label="Change Profile Picture"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    photo_camera
                  </span>
                </button>
              )}
            </div>

            <div className={styles.actionPillsRow}>
              {isOwnProfile ? (
                <button
                  type="button"
                  className={styles.editProfileBtn}
                  onClick={openEditProfileModal}
                  title="Customize profile information"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    edit
                  </span>
                  <span>Edit Profile</span>
                </button>
              ) : null}
            </div>
          </div>

          <div className={styles.identityDetails}>
            <div className={styles.nameVerifiedRow}>
              <h1 className={styles.userName}>{profileData.name}</h1>
              {profileData.isVerified && (
                <span className={styles.verifiedCheck} title="Verified Sabah Electricity Staff">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '18px', color: 'var(--color-primary-text)' }}
                  >
                    verified
                  </span>
                </span>
              )}
            </div>

            <div className={styles.designationPillRow}>
              <span className={styles.deptBadge}>{activeDivision}</span>
              <span className={styles.roleBadge}>{profileData.designation || 'Staff'}</span>
            </div>

            <div className={styles.empIdRow}>
              <span className={styles.metaItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  location_on
                </span>
                <span>{activeLocation}</span>
              </span>
            </div>

            <p className={styles.bioParagraph}>{profileData.bio}</p>
          </div>

          {/* 2. Stats Strip */}
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

          {/* 3. Honors & Achievements Deck */}
          <AchievementsDeck bulletinCount={userPosts.length} />
        </div>
      </div>

      {/* 4. Brand-New User Onboarding & Milestone Meter */}
      {isOwnProfile && userPosts.length === 0 && (
        <section className={styles.onboardingCard}>
          <div className={styles.onboardingHeader}>
            <div className={styles.onboardingTitleWrap}>
              <span className={styles.onboardingSparkleIcon}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--color-forest-text)' }}>
                  stars
                </span>
              </span>
              <div>
                <h2 className={styles.onboardingTitle}>
                  Welcome to SE-Connect, {profileData.name.split(' ')[0]}! 👋
                </h2>
                <p className={styles.onboardingSubtitle}>
                  Set up your employee profile and publish your first bulletin to connect with Sabah Electricity colleagues.
                </p>
              </div>
            </div>
            <div className={styles.completionPill}>
              <span className="font-mono tabular-nums font-bold text-xs">
                {completionPercentage}% Ready
              </span>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className={styles.progressTrack} role="progressbar" aria-valuenow={completionPercentage} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={styles.progressBarFill}
              style={{ transform: `scaleX(${Math.max(0.12, completionPercentage / 100)})` }}
            />
          </div>

          {/* Checklist Items */}
          <div className={styles.checklistGrid}>
            {completionChecks.map((item, index) => (
              <div
                key={index}
                className={`${styles.checklistItem} ${item.isCompleted ? styles.checklistItemDone : ''}`}
              >
                <div className={styles.checkIconWrap}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: '18px',
                      color: item.isCompleted ? 'var(--color-forest-text)' : 'var(--color-text-muted)',
                    }}
                  >
                    {item.isCompleted ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                </div>
                <div className={styles.checklistContent}>
                  <span className={styles.checklistText}>{item.label}</span>
                </div>
                {!item.isCompleted && item.action && (
                  <button
                    type="button"
                    className={styles.checklistActionBtn}
                    onClick={item.action}
                  >
                    {item.actionLabel}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* First Bulletin Primary CTA */}
          <div className={styles.onboardingActionFooter}>
            <button
              type="button"
              className={styles.primaryCreateBtn}
              onClick={overlay.openCreate}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                campaign
              </span>
              <span>Publish Your First Bulletin</span>
            </button>
          </div>
        </section>
      )}

      {/* 5. Field Photos Section */}
      <section className={styles.photosSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '20px', color: 'var(--color-primary-text)' }}
            >
              photo_library
            </span>
            <h2 className={styles.sectionTitle}>Field Photos & Site Logs</h2>
          </div>
          <span className="font-mono tabular-nums text-xs text-slate-500">
            {authoredPhotos.length} items
          </span>
        </div>

        {authoredPhotos.length > 0 ? (
          <div ref={photosScrollRef} className={styles.photoCarousel}>
            {authoredPhotos.map((photo) => (
              <div
                key={photo.id}
                className={styles.photoCard}
                onClick={() => overlay.openLightbox({ url: photo.url, title: photo.title })}
                style={{ cursor: 'pointer' }}
                title="Click to view photo in full"
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  className={styles.photoImg}
                  onError={(e) => handlePostImageError(e)}
                />

                <div className={styles.photoCaptionWrap}>
                  <span className={styles.photoCaption}>{photo.title}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyPhotosContainer}>
            <div className={styles.emptyPhotosIconCircle}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--color-text-muted)' }}>
                add_photo_alternate
              </span>
            </div>
            <div className={styles.emptyPhotosText}>
              <p className={styles.emptyPhotosTitle}>
                {isOwnProfile
                  ? 'No field photos uploaded yet'
                  : `${activeEmployee.name} hasn't shared any field photos yet`}
              </p>
              <p className={styles.emptyPhotosSubtitle}>
                Inspection logs, plant maintenance pictures, and event photos attached to your bulletins will appear here.
              </p>
            </div>
            {isOwnProfile && (
              <button
                type="button"
                className={styles.uploadPhotoCtaBtn}
                onClick={overlay.openCreate}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  add_a_photo
                </span>
                <span>Share Field Photo</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* 6. Continuous Timeline Feed (User's Authored Posts) */}
      <section className={styles.timelineSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '20px', color: 'var(--color-forest-text)' }}
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
                onLikeToggle={feed.handleLikeToggle}
                onCommentClick={(targetPost) => overlay.openComment(targetPost.id)}
                onBookmarkToggle={feed.handleBookmarkToggle}
                onDeletePost={feed.handleDeletePost}
                onEditPost={overlay.openEdit}
                onPostClick={feed.handleOpenPostDetail}
                onVotePoll={feed.handleVotePoll}
                onReshareClick={(targetPost) => overlay.openReshare(targetPost.id)}
                onSharePost={feed.handleSharePost}
              />
            ))}
          </div>
        ) : (
          <div className={styles.noPostsCard}>
            <div className={styles.emptyIconCircle}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '28px', color: 'var(--color-text-muted)' }}
              >
                post_add
              </span>
            </div>
            <h3 className={styles.noPostsTitle}>No bulletins published yet</h3>
            <p className={styles.noPostsDesc}>
              {isOwnProfile
                ? 'Share your department announcements, plant inspection logs, or safety notices with statewide SE colleagues.'
                : 'This staff member has not published any public bulletins yet.'}
            </p>
            {isOwnProfile && (
              <button type="button" className={styles.startPostBtn} onClick={overlay.openCreate}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  add
                </span>
                <span>Publish First Bulletin</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* 8. Comprehensive Edit Profile Modal Sheet */}
      {isEditModalOpen && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          profileData={profileData}
          divisions={SESB_DIVISIONS}
          coverFileInputRef={coverFileInputRef}
          avatarFileInputRef={avatarFileInputRef}
          onClose={() => setIsEditModalOpen(false)}
          onSave={(updated) => {
            setProfileData(updated);
            onUpdateProfile?.(updated);
            setIsEditModalOpen(false);
          }}
          tempAvatarUrl={tempAvatarUrl}
          setTempAvatarUrl={setTempAvatarUrl}
          tempCoverUrl={tempCoverUrl}
          setTempCoverUrl={setTempCoverUrl}
        />
      )}
    </div>
  );
};
