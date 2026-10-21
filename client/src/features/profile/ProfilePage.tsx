import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Employee, EmojiReactionType, Post } from '@/types/bulletin';
import { CURRENT_USER } from '@/services/mockData';
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll';
import { AchievementsDeck } from '@/features/profile/AchievementsDeck';
import { AvatarCropSheet } from '@/features/profile/AvatarCropSheet';
import { FeedCard } from '@/shared/FeedCard';
import { useFeed } from '@/context/FeedContext';
import { bulletinService } from '@/services/bulletinService';
import { AVATAR_OUTPUT_SIZE, ACCEPTED_AVATAR_TYPES, validateAvatarFile } from '@/utils/cropImage';
import {
  DEFAULT_COVER_URL,
  DEFAULT_AVATAR_URL,
  SESB_LOCATIONS,
  FALLBACK_POST_IMAGE_URL,
} from '@/constants/bulletin';
import { handleAvatarError, handleCoverError, handlePostImageError } from '@/utils/imageFallbacks';
import { isSuperAdminUser } from '@/utils/postPermissions';
import { EditProfileModal } from '@/features/profile/EditProfileModal';
import styles from './ProfilePage.module.css';

interface Props {
  posts: Post[];
  currentUser?: Employee;
  viewedEmployee?: Employee | null;
  onBack?: () => void;
  onLikeToggle: (id: string) => void;
  onOpenComments: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
  onEditPost?: (post: Post) => void;
  onOpenCreate: () => void;
  onPostClick?: (post: Post) => void;
  onImageClick?: (url: string, title?: string) => void;
  onLogout?: () => void;
  onUpdateProfile?: (updated: Employee) => void;
  onBookmarkToggle?: (postId: string) => void;
  onVotePoll?: (postId: string, optionId: string) => void;
  onReactionSelect?: (postId: string, reaction: EmojiReactionType) => void;
  onReshareToggle?: (postId: string) => void;
  onQuotePost?: (quotedPost: Post, commentText: string) => void;
  onSharePost?: (post: Post) => void;
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
  posts,
  currentUser,
  viewedEmployee,
  onBack,
  onLikeToggle,
  onOpenComments,
  onDeletePost,
  onEditPost,
  onOpenCreate,
  onPostClick,
  onImageClick,
  onUpdateProfile,
  onBookmarkToggle,
  onVotePoll,
  onReactionSelect,
  onReshareToggle,
  onQuotePost,
  onSharePost,
}) => {
  const loggedInUser = currentUser || CURRENT_USER;
  const activeEmployee = viewedEmployee || loggedInUser;
  const isOwnProfile = activeEmployee.id === loggedInUser.id;

  const photosScrollRef = useHorizontalScroll<HTMLDivElement>();
  const { setToast } = useFeed();

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

  // Hidden file inputs for direct device photo upload
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Avatar crop flow: the file is held here until the user confirms a framing,
  // so nothing reaches Supabase Storage before they have seen the result.
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const closeAvatarSheet = () => {
    setPendingAvatarFile(null);
    previouslyFocusedRef.current?.focus?.();
  };

  // Handle direct device file upload (with automatic Supabase Storage upload and client-side compression)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset before awaiting so choosing the same photo again still fires change.
    e.target.value = '';

    // Avatars go through the cropper first; covers upload directly as before.
    if (mode === 'avatar') {
      const problem = validateAvatarFile(file);
      if (problem) {
        setToast({ message: problem, icon: 'error' });
        return;
      }
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      setPendingAvatarFile(file);
      return;
    }

    try {
      const uploadedUrl = await bulletinService.uploadPhoto(file);
      if (isEditModalOpen) {
        setTempCoverUrl(uploadedUrl);
        setToast({ message: 'Banner uploaded. Save changes to apply.', icon: 'check_circle' });
      } else {
        const updated = { ...profileData, coverUrl: uploadedUrl };
        setProfileData(updated);
        setTempCoverUrl(uploadedUrl);
        if (onUpdateProfile) onUpdateProfile(updated);
      }
    } catch (err) {
      console.error('[ProfilePage] Upload failed:', err);
      setToast({
        message: 'Failed to upload image. Please check your connection and try again.',
        icon: 'error',
      });
    }
  };

  // Commit the cropped square, then push it through the normal upload path.
  const handleAvatarConfirm = async (croppedFile: File) => {
    setIsAvatarUploading(true);
    try {
      const uploadedUrl = await bulletinService.uploadPhoto(croppedFile, {
        maxWidth: AVATAR_OUTPUT_SIZE,
        maxHeight: AVATAR_OUTPUT_SIZE,
        quality: 0.86,
      });

      if (isEditModalOpen) {
        // Option B: Inside Edit Profile modal — stage the change so clicking Cancel cleanly discards it
        setTempAvatarUrl(uploadedUrl);
        setToast({ message: 'Photo cropped. Save changes to apply.', icon: 'check_circle' });
      } else {
        // Direct Hero Camera trigger — apply and persist immediately
        const updated = { ...profileData, avatarUrl: uploadedUrl };
        setProfileData(updated);
        setTempAvatarUrl(uploadedUrl);
        if (onUpdateProfile) onUpdateProfile(updated);
      }
    } catch (err) {
      console.error('[ProfilePage] Avatar upload failed:', err);
      setToast({
        message: 'Could not save your photo. Please try again.',
        icon: 'error',
      });
    } finally {
      setIsAvatarUploading(false);
      closeAvatarSheet();
    }
  };

  // Filter posts authored or reshared by active employee
  const isSuperAdmin = isSuperAdminUser({
    currentUserId: activeEmployee.id,
    currentUserName: activeEmployee.name,
    currentUserRole: activeEmployee.role,
  });

  const userPosts = posts.filter(
    (p) =>
      (p.author?.id && activeEmployee.id && p.author.id === activeEmployee.id) ||
      (p.author?.name || '').toLowerCase().trim() === activeEmployee.name.toLowerCase().trim() ||
      (isSuperAdmin &&
        (p.author?.name === 'ADMIN_USER' ||
          p.author?.name === 'TEST_USER' ||
          p.author?.id === 'user-test')) ||
      (p.resharedBy?.id && activeEmployee.id && p.resharedBy.id === activeEmployee.id) ||
      (p.isReshared && isOwnProfile)
  );

  // Total reactions on user's posts
  const totalReactions = userPosts.reduce(
    (acc, p) => acc + (p.likesCount || 0),
    0
  );

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
      action: onOpenCreate,
      actionLabel: 'New Post',
    },
  ];

  const completedSteps = completionChecks.filter((c) => c.isCompleted).length;
  const completionPercentage = Math.round((completedSteps / completionChecks.length) * 100);

  // Handle ESC key to dismiss open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (pendingAvatarFile) {
        closeAvatarSheet();
        return;
      }
      if (isEditModalOpen) {
        setIsEditModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditModalOpen, pendingAvatarFile]);

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
            onError={(message) => setToast({ message, icon: 'error' })}
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
              onClick={onOpenCreate}
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
                onClick={() => onImageClick?.(photo.url, photo.title)}
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
                onClick={onOpenCreate}
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
                currentUserAvatar={loggedInUser.avatarUrl}
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

      {/* 8. Comprehensive Edit Profile Modal Sheet (Conditionally mounted so form state resets cleanly) */}
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
            if (onUpdateProfile) onUpdateProfile(updated);
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
