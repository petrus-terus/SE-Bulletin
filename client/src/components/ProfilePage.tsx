import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Employee, EmojiReactionType, Post } from '../types/bulletin';
import { CURRENT_USER } from '../services/mockData';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';
import { AchievementsDeck } from './AchievementsDeck';
import { FeedCard } from './FeedCard';
import { bulletinService } from '../services/bulletinService';
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
  onCallExt?: (employee: Employee) => void;
  onLogout?: () => void;
  onUpdateProfile?: (updated: Employee) => void;
  onBookmarkToggle?: (postId: string) => void;
  onVotePoll?: (postId: string, optionId: string) => void;
  onReactionSelect?: (postId: string, reaction: EmojiReactionType) => void;
  onReshareToggle?: (postId: string) => void;
  onQuotePost?: (quotedPost: Post, commentText: string) => void;
  onSharePost?: (post: Post) => void;
}

// Curated authentic corporate defaults
const DEFAULT_COVER_URL = '/grid_horizon_hero.jpg';
const DEFAULT_AVATAR_URL = '/sabah_electricity_logo.png';

const SESB_DIVISIONS = ['INFORMATION & DIGITAL'];

const SESB_ROLES = [
  'Chief Information & Digital Officer (CIDO)',
  'Senior Manager',
  'Head',
  'Staff',
];

const SESB_LOCATIONS = ['Bangunan KWASA'];

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
  onCallExt,
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

  // Profile fields state (keyed by employee id in App.tsx for automatic resets)
  const [profileData, setProfileData] = useState<Employee>(activeEmployee);

  // Normalize division & location for Phase 1 pilot
  const activeDivision = SESB_DIVISIONS.includes(profileData.department)
    ? profileData.department
    : SESB_DIVISIONS[0];
  const activeLocation = SESB_LOCATIONS.includes(profileData.officeLocation || '')
    ? (profileData.officeLocation || SESB_LOCATIONS[0])
    : SESB_LOCATIONS[0];

  // Modal visibility states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Temporary edit form state
  const [tempName, setTempName] = useState(profileData.name);
  const [tempDesignation, setTempDesignation] = useState(profileData.designation);
  const [tempDepartment, setTempDepartment] = useState(activeDivision);
  const [tempLocation, setTempLocation] = useState(activeLocation);
  const [tempBio, setTempBio] = useState(
    profileData.bio ||
      'Committed to Sabah Electricity Goal Zero, digital transformation, and reliable power statewide.'
  );
  const [tempAvatarUrl, setTempAvatarUrl] = useState(
    profileData.avatarUrl || DEFAULT_AVATAR_URL
  );
  const [tempCoverUrl, setTempCoverUrl] = useState(
    profileData.coverUrl || DEFAULT_COVER_URL
  );

  // Hidden file inputs for direct device photo upload
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Handle direct device file upload (with automatic Supabase Storage upload and client-side compression)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadedUrl = await bulletinService.uploadPhoto(file);

      if (mode === 'avatar') {
        const updated = { ...profileData, avatarUrl: uploadedUrl };
        setProfileData(updated);
        setTempAvatarUrl(uploadedUrl);
        if (onUpdateProfile) onUpdateProfile(updated);
      } else {
        const updated = { ...profileData, coverUrl: uploadedUrl };
        setProfileData(updated);
        setTempCoverUrl(uploadedUrl);
        if (onUpdateProfile) onUpdateProfile(updated);
      }
    } catch (err) {
      console.warn('[ProfilePage] Upload failed, using fallback reader:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (!result) return;

        if (mode === 'avatar') {
          const updated = { ...profileData, avatarUrl: result };
          setProfileData(updated);
          setTempAvatarUrl(result);
          if (onUpdateProfile) onUpdateProfile(updated);
        } else {
          const updated = { ...profileData, coverUrl: result };
          setProfileData(updated);
          setTempCoverUrl(result);
          if (onUpdateProfile) onUpdateProfile(updated);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      // Reset target value so selecting the same photo triggers change
      e.target.value = '';
    }
  };

  // Filter posts authored or reshared by active employee (like Twitter / X profile timeline)
  const userPosts = posts.filter(
    (p) =>
      (p.author?.id && activeEmployee.id && p.author.id === activeEmployee.id) ||
      (p.author?.name || '').toLowerCase().trim() === activeEmployee.name.toLowerCase().trim() ||
      (p.resharedBy?.id && activeEmployee.id && p.resharedBy.id === activeEmployee.id) ||
      (p.isReshared && isOwnProfile)
  );

  // Total reactions on user's posts
  const totalReactions = userPosts.reduce(
    (acc, p) => acc + (p.likesCount || 0),
    isOwnProfile ? (userPosts.length > 0 ? userPosts.length * 24 : 0) : Math.max(12, userPosts.length * 28)
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

  // Brand-new user onboarding completion rate calculation (Gate 15.4)
  const hasBioFilled = Boolean(profileData.bio && profileData.bio.trim().length > 15);
  const hasPublishedBulletin = userPosts.length > 0;

  const completionChecks = [
    { label: `Division Registered (${profileData.department || 'INFORMATION & DIGITAL'})`, isCompleted: true },
    { label: `Office Location (${profileData.officeLocation || 'Bangunan KWASA'})`, isCompleted: true },
    {
      label: 'Complete Operational Bio',
      isCompleted: hasBioFilled,
      action: () => {
        openEditProfileModal();
      },
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

  // Open Edit Profile Modal and prepopulate temp values
  const openEditProfileModal = () => {
    setTempName(profileData.name);
    setTempDesignation(profileData.designation);
    setTempDepartment(activeDivision);
    setTempLocation(activeLocation);
    setTempBio(
      profileData.bio ||
        'Committed to Sabah Electricity Goal Zero, digital transformation, and reliable power statewide.'
    );
    setTempAvatarUrl(profileData.avatarUrl || DEFAULT_AVATAR_URL);
    setTempCoverUrl(profileData.coverUrl || DEFAULT_COVER_URL);
    setIsEditModalOpen(true);
  };

  // Handle saving full profile edits
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedEmployee: Employee = {
      ...profileData,
      name: tempName.trim() || profileData.name,
      fullName: tempName.trim() || profileData.name,
      designation: tempDesignation.trim() || profileData.designation,
      department: tempDepartment,
      officeLocation: tempLocation,
      bio: tempBio.trim(),
      avatarUrl: tempAvatarUrl || DEFAULT_AVATAR_URL,
      coverUrl: tempCoverUrl || DEFAULT_COVER_URL,
    };

    setProfileData(updatedEmployee);
    if (onUpdateProfile) {
      onUpdateProfile(updatedEmployee);
    }
    setIsEditModalOpen(false);
  };

  // Handle ESC key to dismiss open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditModalOpen) {
        setIsEditModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditModalOpen]);

  return (
    <div className={styles.profileContainer}>
      {/* Hidden file inputs for direct device photo uploads */}
      <input
        type="file"
        ref={avatarFileInputRef}
        onChange={(e) => handleFileUpload(e, 'avatar')}
        accept="image/*"
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

      {/* 1. Facebook-Style Hero & Panoramic Cover Banner */}
      <div className={styles.profileCard}>
        <div className={styles.coverWrapper}>
          <img
            src={profileData.coverUrl || DEFAULT_COVER_URL}
            alt="Corporate Cover Banner"
            className={styles.coverImg}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_COVER_URL;
            }}
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
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR_URL;
                }}
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
              <h1 className={styles.userName}>{profileData.name}</h1>
              {profileData.isVerified && (
                <span className={styles.verifiedCheck} title="Verified Sabah Electricity Staff">
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

      {/* 4. Brand-New User Onboarding & Milestone Meter (Gate 15.4) */}
      {isOwnProfile && userPosts.length === 0 && (
        <section className={styles.onboardingCard}>
          <div className={styles.onboardingHeader}>
            <div className={styles.onboardingTitleWrap}>
              <span className={styles.onboardingSparkleIcon}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#1A7A5A' }}>
                  stars
                </span>
              </span>
              <div>
                <h2 className={styles.onboardingTitle}>
                  Welcome to SE Bulletin, {profileData.name.split(' ')[0]}! 👋
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
                      color: item.isCompleted ? '#1A7A5A' : '#94A3B8',
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
              style={{ fontSize: '20px', color: '#0055A4' }}
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
        ) : (
          <div className={styles.emptyPhotosContainer}>
            <div className={styles.emptyPhotosIconCircle}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#64748B' }}>
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



      {/* Hidden File Inputs for Device Camera / File Uploads */}
      <input
        ref={avatarFileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFileUpload(e, 'avatar')}
      />
      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFileUpload(e, 'cover')}
      />

      {/* 8. Comprehensive Edit Profile Modal Sheet (Portaled via createPortal) */}
      {isEditModalOpen &&
        createPortal(
          <div
            className={styles.modalBackdrop}
            role="dialog"
            aria-modal="true"
            aria-label="Edit Profile"
            onClick={() => setIsEditModalOpen(false)}
          >
            <div
              className={styles.modalSheet}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={styles.modalHeader}>
                <div className={styles.modalHeaderTitleGroup}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#0055A4' }}>
                    manage_accounts
                  </span>
                  <h3 className={styles.modalTitle}>Edit Employee Profile</h3>
                </div>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setIsEditModalOpen(false)}
                  title="Close modal"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    close
                  </span>
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveProfile} className={styles.modalForm}>
                {/* Media Quick Previews Deck with Direct Upload Triggers */}
                <div className={styles.mediaPreviewsDeck}>
                  {/* Panoramic Banner Preview */}
                  <div className={styles.previewCoverWrap}>
                    <img
                      src={tempCoverUrl || DEFAULT_COVER_URL}
                      alt="Banner Preview"
                      className={styles.previewCoverImg}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_COVER_URL;
                      }}
                    />
                    <div className={styles.coverButtonsOverlay}>
                      {tempCoverUrl !== DEFAULT_COVER_URL && (
                        <button
                          type="button"
                          className={styles.quickCoverChangeBtn}
                          onClick={() => setTempCoverUrl(DEFAULT_COVER_URL)}
                          title="Reset to Sabah Grid Horizon Sunset"
                          style={{ background: 'rgba(15, 23, 42, 0.65)' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                            restart_alt
                          </span>
                          <span>Reset</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.quickCoverChangeBtn}
                        onClick={() => coverFileInputRef.current?.click()}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                          photo_camera
                        </span>
                        <span>Upload Banner</span>
                      </button>
                    </div>
                  </div>

                  {/* Avatar & Controls Row below the banner */}
                  <div className={styles.previewMediaControls}>
                    <div className={styles.previewAvatarHolder}>
                      <img
                        src={tempAvatarUrl || DEFAULT_AVATAR_URL}
                        alt="Avatar Preview"
                        className={styles.previewAvatarImg}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR_URL;
                        }}
                      />
                      <button
                        type="button"
                        className={styles.quickAvatarChangeBtn}
                        onClick={() => avatarFileInputRef.current?.click()}
                        title="Upload profile picture"
                        aria-label="Upload profile picture"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                          photo_camera
                        </span>
                      </button>
                    </div>

                    <div className={styles.previewMetaNotice}>
                      <div className={styles.previewNoticeHeader}>
                        <span className={styles.previewMetaTitle}>Profile Photo</span>
                        {tempAvatarUrl !== DEFAULT_AVATAR_URL && (
                          <button
                            type="button"
                            onClick={() => setTempAvatarUrl(DEFAULT_AVATAR_URL)}
                            className={styles.resetCrestBtn}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                              restart_alt
                            </span>
                            Reset to Crest
                          </button>
                        )}
                      </div>
                      <span className={styles.previewMetaSub}>
                        Tap camera to select custom photo from device
                      </span>
                    </div>
                  </div>
                </div>
                {/* Row 1: Full Name & Role Dropdown */}
                <div className={styles.formRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Full Name</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      placeholder="e.g. Mohd Irfan bin Razali"
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Role</label>
                    <select
                      className={styles.selectInput}
                      value={tempDesignation}
                      onChange={(e) => setTempDesignation(e.target.value)}
                    >
                      <option value="">Role</option>
                      {SESB_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 2: Division & Station Location */}
                <div className={styles.formRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Division</label>
                    <select
                      className={styles.selectInput}
                      value={tempDepartment}
                      onChange={(e) => setTempDepartment(e.target.value)}
                    >
                      {SESB_DIVISIONS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Location</label>
                    <select
                      className={styles.selectInput}
                      value={tempLocation}
                      onChange={(e) => setTempLocation(e.target.value)}
                    >
                      {SESB_LOCATIONS.map((station) => (
                        <option key={station} value={station}>
                          {station}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 4: Operational Bio */}
                <div className={styles.fieldGroup}>
                  <div className={styles.labelWithCounter}>
                    <label className={styles.fieldLabel}>Bio & Operational Mission</label>
                    <span className="font-mono tabular-nums text-xs text-slate-500">
                      {tempBio.length} / 160
                    </span>
                  </div>
                  <textarea
                    className={styles.bioTextarea}
                    rows={3}
                    maxLength={160}
                    value={tempBio}
                    onChange={(e) => setTempBio(e.target.value)}
                    placeholder="Describe your core operational responsibilities at Sabah Electricity..."
                  />
                </div>

                {/* Modal Action Buttons */}
                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.saveBtn}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      save
                    </span>
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
