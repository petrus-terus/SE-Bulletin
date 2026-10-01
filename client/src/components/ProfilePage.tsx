import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  onUpdateProfile?: (updated: Employee) => void;
}

// Curated authentic Sabah Electricity scenic presets for cover banners
export const SESB_COVER_PRESETS = [
  {
    id: 'kinabalu-hq',
    name: 'Wisma SESB HQ & Kinabalu',
    location: 'Kota Kinabalu HQ',
    url: '/mock-images/image3.png',
  },
  {
    id: 'tenom-hydro',
    name: 'Tenom Pangi Hydro Penstock',
    location: 'Tenom Pangi',
    url: '/mock-images/image4.png',
  },
  {
    id: 'sepanggar-station',
    name: 'Sepanggar Substation 132kV',
    location: 'Sepanggar Bay',
    url: '/mock-images/image1.png',
  },
  {
    id: 'grid-sunset',
    name: 'Sabah Grid Horizon Sunset',
    location: 'Statewide Grid',
    url: '/grid_horizon_hero.jpg',
  },
  {
    id: 'scada-control',
    name: 'SCADA Telemetry Operations',
    location: 'Grid System Control',
    url: '/mock-images/image2.png',
  },
];

// Curated authentic corporate presets for avatars / profile pictures
export const SESB_AVATAR_PRESETS = [
  {
    id: 'sesb-crest',
    name: 'Official Sabah Electricity Crest',
    url: '/sabah_electricity_logo.png',
  },
  {
    id: 'tnb-emblem',
    name: 'TNB Corporate Emblem',
    url: '/tnb_emblem.png',
  },
  {
    id: 'default-staff',
    name: 'Standard Staff Avatar',
    url: '/user_face.png',
  },
];

export const SESB_DEPARTMENTS = [
  'Grid Operations',
  'Engineering & Technical Services',
  'Safety, Health & Environment (HSE)',
  'Corporate Communications',
  'Human Resources',
  'Finance & Accounts',
  'Information Technology',
  'Distribution & Retail',
];

export const SESB_STATIONS = [
  'Wisma SESB HQ, Kota Kinabalu',
  'Tenom Pangi Hydro Power Station',
  'Sepanggar Power Station',
  'Sandakan Regional Operations Office',
  'Tawau Regional Operations Office',
  'Labuan Operations Center',
  'Lahad Datu 132kV Substation',
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
  onUpdateProfile,
}) => {
  const loggedInUser = currentUser || CURRENT_USER;
  const activeEmployee = viewedEmployee || loggedInUser;
  const isOwnProfile = activeEmployee.id === loggedInUser.id;

  const photosScrollRef = useHorizontalScroll<HTMLDivElement>();

  // Profile fields state
  const [profileData, setProfileData] = useState<Employee>(activeEmployee);

  // Sync state if activeEmployee prop changes
  useEffect(() => {
    setProfileData(activeEmployee);
  }, [activeEmployee]);

  // Modal visibility states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerMode, setMediaPickerMode] = useState<'avatar' | 'cover'>('cover');

  // Temporary edit form state
  const [tempName, setTempName] = useState(profileData.name);
  const [tempDesignation, setTempDesignation] = useState(profileData.designation);
  const [tempDepartment, setTempDepartment] = useState(profileData.department);
  const [tempEmpId, setTempEmpId] = useState(profileData.employeeId);
  const [tempEmail, setTempEmail] = useState(profileData.email);
  const [tempLocation, setTempLocation] = useState(
    profileData.officeLocation || SESB_STATIONS[0]
  );
  const [tempExt, setTempExt] = useState(profileData.phoneExtension || 'Ext. 4102');
  const [tempBio, setTempBio] = useState(
    profileData.bio ||
      'Leading grid telemetry automation and SCADA sensor deployments statewide. Committed to Sabah Electricity Goal Zero and reliable transmission.'
  );
  const [tempAvatarUrl, setTempAvatarUrl] = useState(profileData.avatarUrl);
  const [tempCoverUrl, setTempCoverUrl] = useState(
    profileData.coverUrl || SESB_COVER_PRESETS[0].url
  );

  // Hidden file inputs for direct device photo upload
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Filter posts authored by active employee
  const userPosts = posts.filter(
    (p) =>
      (p.author?.id && activeEmployee.id && p.author.id === activeEmployee.id) ||
      (p.author?.name || '').toLowerCase().trim() === activeEmployee.name.toLowerCase().trim()
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
  const hasCustomAvatar = profileData.avatarUrl && profileData.avatarUrl !== '/user_face.png';
  const hasCustomCover = profileData.coverUrl && profileData.coverUrl !== '';
  const hasBioFilled = Boolean(profileData.bio && profileData.bio.trim().length > 15);
  const hasPublishedBulletin = userPosts.length > 0;

  const completionChecks = [
    { label: `Staff ID Registered (${profileData.employeeId})`, isCompleted: true },
    {
      label: 'Personalize Avatar & Cover Photo',
      isCompleted: Boolean(hasCustomAvatar || hasCustomCover),
      action: () => {
        setMediaPickerMode('avatar');
        setIsMediaPickerOpen(true);
      },
      actionLabel: 'Change Photo',
    },
    {
      label: 'Complete Operational Bio & Station',
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
    setTempDepartment(profileData.department);
    setTempEmpId(profileData.employeeId);
    setTempEmail(profileData.email);
    setTempLocation(profileData.officeLocation || SESB_STATIONS[0]);
    setTempExt(profileData.phoneExtension || 'Ext. 4102');
    setTempBio(
      profileData.bio ||
        'Leading grid telemetry automation and SCADA sensor deployments statewide. Committed to Sabah Electricity Goal Zero and reliable transmission.'
    );
    setTempAvatarUrl(profileData.avatarUrl);
    setTempCoverUrl(profileData.coverUrl || SESB_COVER_PRESETS[0].url);
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
      employeeId: tempEmpId.trim() || profileData.employeeId,
      email: tempEmail.trim() || profileData.email,
      officeLocation: tempLocation,
      phoneExtension: tempExt.trim() || profileData.phoneExtension,
      bio: tempBio.trim(),
      avatarUrl: tempAvatarUrl,
      coverUrl: tempCoverUrl,
    };

    setProfileData(updatedEmployee);
    if (onUpdateProfile) {
      onUpdateProfile(updatedEmployee);
    }
    setIsEditModalOpen(false);
  };

  // Quick preset selection from Media Picker
  const handleSelectPreset = (url: string) => {
    if (mediaPickerMode === 'avatar') {
      const updated = { ...profileData, avatarUrl: url };
      setProfileData(updated);
      setTempAvatarUrl(url);
      if (onUpdateProfile) onUpdateProfile(updated);
    } else {
      const updated = { ...profileData, coverUrl: url };
      setProfileData(updated);
      setTempCoverUrl(url);
      if (onUpdateProfile) onUpdateProfile(updated);
    }
    setIsMediaPickerOpen(false);
  };

  // Handle device file upload (FileReader to base64 Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, mode: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      setIsMediaPickerOpen(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle ESC key to dismiss open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMediaPickerOpen) setIsMediaPickerOpen(false);
        else if (isEditModalOpen) setIsEditModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMediaPickerOpen, isEditModalOpen]);

  const currentCover = profileData.coverUrl || SESB_COVER_PRESETS[0].url;

  return (
    <div className={styles.profileContainer}>
      {/* 1. Facebook-Style Hero & Panoramic Cover Banner */}
      <div className={styles.profileCard}>
        <div className={styles.coverWrapper}>
          <img
            src={currentCover}
            alt="Corporate Cover Banner"
            className={styles.coverImg}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/mock-images/image3.png';
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

          {/* Dual Trigger: Direct Edit Cover Button on Banner */}
          {isOwnProfile && (
            <button
              type="button"
              className={styles.changeCoverBtn}
              onClick={() => {
                setMediaPickerMode('cover');
                setIsMediaPickerOpen(true);
              }}
              title="Personalize cover photo"
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
            {/* 88px Avatar with Dual Trigger Camera Overlay */}
            <div className={styles.avatarHolder}>
              <img
                src={profileData.avatarUrl}
                alt={profileData.name}
                className={styles.profileAvatar}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/sabah_electricity_logo.png';
                }}
              />
              {profileData.isOnline && (
                <span className={styles.onlineBadge} title="Available on Sabah corporate intranet" />
              )}

              {/* Dual Trigger: Tap Camera Overlay on Avatar */}
              {isOwnProfile && (
                <button
                  type="button"
                  className={styles.avatarCameraBtn}
                  onClick={() => {
                    setMediaPickerMode('avatar');
                    setIsMediaPickerOpen(true);
                  }}
                  title="Change profile picture"
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
                <>
                  <button
                    type="button"
                    className={styles.editProfileBtn}
                    onClick={openEditProfileModal}
                    title="Customize all profile information"
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
                    title="Publish a new bulletin"
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
              <span className={styles.deptBadge}>{profileData.department}</span>
              <span className={styles.roleBadge}>{profileData.designation}</span>
            </div>

            <div className={styles.empIdRow}>
              <span className={styles.metaItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  badge
                </span>
                <span className="font-mono tabular-nums font-semibold">
                  {profileData.employeeId}
                </span>
              </span>
              <span className={styles.metaItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  location_on
                </span>
                <span>{profileData.officeLocation || SESB_STATIONS[0]}</span>
              </span>
              <span className={styles.metaItem}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  call
                </span>
                <span className="font-mono tabular-nums font-semibold">
                  {profileData.phoneExtension || 'Ext. 4102'}
                </span>
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

      {/* 7. Dedicated Media Picker Modal Sheet (Portaled via createPortal) */}
      {isMediaPickerOpen &&
        createPortal(
          <div
            className={styles.modalBackdrop}
            role="dialog"
            aria-modal="true"
            aria-label="Change Photo"
            onClick={() => setIsMediaPickerOpen(false)}
          >
            <div
              className={styles.mediaPickerSheet}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet Header */}
              <div className={styles.modalHeader}>
                <div className={styles.mediaTabsRow}>
                  <button
                    type="button"
                    className={`${styles.mediaTabBtn} ${mediaPickerMode === 'cover' ? styles.mediaTabActive : ''}`}
                    onClick={() => setMediaPickerMode('cover')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      panorama
                    </span>
                    <span>Cover Banner</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.mediaTabBtn} ${mediaPickerMode === 'avatar' ? styles.mediaTabActive : ''}`}
                    onClick={() => setMediaPickerMode('avatar')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      account_circle
                    </span>
                    <span>Profile Picture</span>
                  </button>
                </div>

                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setIsMediaPickerOpen(false)}
                  title="Close media picker"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    close
                  </span>
                </button>
              </div>

              <div className={styles.mediaPickerBody}>
                {/* Upload from Device Option */}
                <div className={styles.uploadPromptCard}>
                  <div className={styles.uploadPromptIcon}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#0055A4' }}>
                      add_photo_alternate
                    </span>
                  </div>
                  <div className={styles.uploadPromptText}>
                    <h4 className={styles.uploadPromptTitle}>
                      Upload from Camera or Gallery
                    </h4>
                    <p className={styles.uploadPromptDesc}>
                      {mediaPickerMode === 'cover'
                        ? 'Select a high-resolution landscape photo for your cover banner.'
                        : 'Upload a square portrait of yourself or team badge.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.deviceUploadBtn}
                    onClick={() => {
                      if (mediaPickerMode === 'avatar') {
                        avatarFileInputRef.current?.click();
                      } else {
                        coverFileInputRef.current?.click();
                      }
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      file_upload
                    </span>
                    <span>Choose File</span>
                  </button>
                </div>

                {/* Curated Presets Section */}
                <div className={styles.presetsSection}>
                  <h4 className={styles.presetsHeading}>
                    {mediaPickerMode === 'cover'
                      ? 'Authentic Sabah Electricity Scenic Presets'
                      : 'Corporate Emblem & Identity Presets'}
                  </h4>

                  {mediaPickerMode === 'cover' ? (
                    <div className={styles.coverPresetsGrid}>
                      {SESB_COVER_PRESETS.map((preset) => {
                        const isSelected = profileData.coverUrl === preset.url;
                        return (
                          <div
                            key={preset.id}
                            className={`${styles.presetCoverTile} ${isSelected ? styles.presetSelected : ''}`}
                            onClick={() => handleSelectPreset(preset.url)}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              className={styles.presetCoverImg}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/mock-images/image3.png';
                              }}
                            />
                            <div className={styles.presetCoverMeta}>
                              <span className={styles.presetCoverName}>{preset.name}</span>
                              <span className={styles.presetCoverLoc}>{preset.location}</span>
                            </div>
                            {isSelected && (
                              <span className={styles.selectedBadge}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#FFFFFF' }}>
                                  check
                                </span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.avatarPresetsGrid}>
                      {SESB_AVATAR_PRESETS.map((preset) => {
                        const isSelected = profileData.avatarUrl === preset.url;
                        return (
                          <div
                            key={preset.id}
                            className={`${styles.presetAvatarTile} ${isSelected ? styles.presetSelected : ''}`}
                            onClick={() => handleSelectPreset(preset.url)}
                          >
                            <div className={styles.presetAvatarCircle}>
                              <img
                                src={preset.url}
                                alt={preset.name}
                                className={styles.presetAvatarImg}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = '/sabah_electricity_logo.png';
                                }}
                              />
                            </div>
                            <span className={styles.presetAvatarName}>{preset.name}</span>
                            {isSelected && (
                              <span className={styles.selectedBadge}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#FFFFFF' }}>
                                  check
                                </span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Sheet Footer */}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsMediaPickerOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

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
                {/* Media Quick Previews Deck */}
                <div className={styles.mediaPreviewsDeck}>
                  <div className={styles.previewCoverWrap}>
                    <img
                      src={tempCoverUrl}
                      alt="Banner Preview"
                      className={styles.previewCoverImg}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/mock-images/image3.png';
                      }}
                    />
                    <button
                      type="button"
                      className={styles.quickCoverChangeBtn}
                      onClick={() => {
                        setMediaPickerMode('cover');
                        setIsMediaPickerOpen(true);
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        photo_camera
                      </span>
                      <span>Change Banner</span>
                    </button>
                  </div>

                  <div className={styles.previewAvatarRow}>
                    <div className={styles.previewAvatarHolder}>
                      <img
                        src={tempAvatarUrl}
                        alt="Avatar Preview"
                        className={styles.previewAvatarImg}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/sabah_electricity_logo.png';
                        }}
                      />
                      <button
                        type="button"
                        className={styles.quickAvatarChangeBtn}
                        onClick={() => {
                          setMediaPickerMode('avatar');
                          setIsMediaPickerOpen(true);
                        }}
                        title="Change profile picture"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                          photo_camera
                        </span>
                      </button>
                    </div>
                    <div className={styles.previewMetaNotice}>
                      <span className={styles.previewMetaTitle}>Profile Media</span>
                      <span className={styles.previewMetaSub}>
                        Tap icons above to change cover or avatar
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 1: Full Name & Designation */}
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
                    <label className={styles.fieldLabel}>Designation / Role</label>
                    <input
                      type="text"
                      className={styles.textInput}
                      value={tempDesignation}
                      onChange={(e) => setTempDesignation(e.target.value)}
                      placeholder="e.g. Senior Grid Operations Engineer"
                      required
                    />
                  </div>
                </div>

                {/* Row 2: Department & Station Location */}
                <div className={styles.formRow}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Department</label>
                    <select
                      className={styles.selectInput}
                      value={tempDepartment}
                      onChange={(e) => setTempDepartment(e.target.value)}
                    >
                      {SESB_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Station / Office Location</label>
                    <select
                      className={styles.selectInput}
                      value={tempLocation}
                      onChange={(e) => setTempLocation(e.target.value)}
                    >
                      {SESB_STATIONS.map((station) => (
                        <option key={station} value={station}>
                          {station}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 3: Staff ID, Email & Extension */}
                <div className={styles.formRowThree}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Staff ID</label>
                    <input
                      type="text"
                      className={`${styles.textInput} font-mono tabular-nums`}
                      value={tempEmpId}
                      onChange={(e) => setTempEmpId(e.target.value)}
                      placeholder="SESB-1001"
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Corporate Email</label>
                    <input
                      type="email"
                      className={styles.textInput}
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                      placeholder="irfan@sesb.com.my"
                      required
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Desk Ext.</label>
                    <input
                      type="text"
                      className={`${styles.textInput} font-mono tabular-nums`}
                      value={tempExt}
                      onChange={(e) => setTempExt(e.target.value)}
                      placeholder="Ext. 4102"
                    />
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
