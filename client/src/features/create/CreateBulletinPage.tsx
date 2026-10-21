import React from 'react';
import { createPortal } from 'react-dom';
import type { Department, CreatePostPayload, Employee, Post } from '@/types/bulletin';
import { MediaCropModal } from '@/ui/MediaCropModal';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { SESB_LOCATIONS, DEFAULT_AVATAR_URL } from '@/constants/bulletin';
import { handleAvatarError } from '@/utils/imageFallbacks';
import { useBulletinForm, MAX_BULLETIN_PHOTOS } from './hooks/useBulletinForm';
import { AttachmentTray } from './components/AttachmentTray';
import styles from './CreateBulletinPage.module.css';

interface Props {
  departments: Department[];
  currentUser: Employee;
  onClose: () => void;
  onSubmit: (newPostData: CreatePostPayload) => void;
  initialPost?: Post | null;
  isEditMode?: boolean;
  onUpdate?: (postId: string, updatedData: Partial<Post>) => void;
  initialPostType?: 'status' | 'announcement';
}

export const CreateBulletinPage: React.FC<Props> = ({
  departments,
  currentUser,
  onClose,
  onSubmit,
  initialPost,
  isEditMode = false,
  onUpdate,
}) => {
  const {
    activeUser,
    title,
    setTitle,
    content,
    handleContentChange,
    setSelectedDeptId,
    isDeptOpen,
    setIsDeptOpen,
    audienceScope,
    setAudienceScope,
    isAudienceOpen,
    setIsAudienceOpen,
    selectedLocation,
    setSelectedLocation,
    isPinned,
    setIsPinned,
    isOfficialNotice,
    setIsOfficialNotice,
    allowComments,
    setAllowComments,
    validationError,
    setValidationError,
    photos,
    fileInputRef,
    triggerPhotoUpload,
    handleFileUpload,
    handleRemovePhoto,
    isCompressing,
    isCropProcessing,
    editingPhoto,
    setEditingPhoto,
    handleCropComplete,
    pdfFileInputRef,
    triggerPdfUpload,
    pdfFile,
    setPdfFile,
    handlePdfUpload,
    hasPoll,
    setHasPoll,
    pollQuestion,
    setPollQuestion,
    pollOptions,
    handleAddOption,
    handleRemoveOption,
    handleOptionChange,
    currentDept,
    handleSubmit,
  } = useBulletinForm({
    departments,
    currentUser,
    initialPost,
    isEditMode,
    onSubmit,
    onUpdate,
    onClose,
  });

  useEscapeKey(() => {
    setIsDeptOpen(false);
    setIsAudienceOpen(false);
  }, isDeptOpen || isAudienceOpen);

  return (
    <div
      className={styles.fullPageContainer}
      role="dialog"
      aria-modal="true"
      aria-label={isEditMode ? 'Edit Bulletin' : 'Create Bulletin'}
    >
      {/* Top Header Bar */}
      <header className={styles.headerBar}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={onClose}
          aria-label="Cancel and return"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            arrow_back
          </span>
          <span>Cancel</span>
        </button>

        <div className={styles.headerTitleWrap}>
          <span className={styles.statusDot} />
          <h1 className={styles.headerTitle}>
            {isEditMode ? 'Edit Bulletin' : 'Create Bulletin'}
          </h1>
        </div>

        <button
          type="button"
          className={styles.publishBtn}
          onClick={handleSubmit}
          disabled={isCompressing}
          aria-label={isEditMode ? 'Save bulletin changes' : 'Publish bulletin'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {isEditMode ? 'check' : 'send'}
          </span>
          <span>{isEditMode ? 'Save Changes' : 'Publish'}</span>
        </button>
      </header>

      {/* Main Form Body */}
      <div className={styles.scrollContent}>
        <div className={styles.pageCard}>
          {/* Author & Audience Meta Deck (Fixed 44px Avatar Wrapper) */}
          <div className={styles.authorMetaDeck}>
            <div className={styles.authorProfile}>
              <div className={styles.avatarWrapper}>
                <img
                  src={activeUser.avatarUrl || DEFAULT_AVATAR_URL}
                  alt=""
                  className={styles.authorAvatar}
                  onError={(e) => handleAvatarError(e)}
                />
                <span className={styles.onlineDot} />
              </div>

              <div className={styles.authorDetails}>
                <span className={styles.authorName}>{activeUser.name}</span>
                <span className={styles.authorRole}>{activeUser.designation}</span>
              </div>
            </div>

            {/* Scope and Department Meta Buttons Group */}
            <div className={styles.metaPillsGroup}>
              {/* Audience Dropdown Button */}
              <button
                type="button"
                className={styles.scopeBtn}
                onClick={() => {
                  setIsDeptOpen(false);
                  setIsAudienceOpen(!isAudienceOpen);
                }}
                aria-expanded={isAudienceOpen}
                aria-haspopup="dialog"
                title="Select Bulletin Audience Scope"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  public
                </span>
                <span>{audienceScope}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  arrow_drop_down
                </span>
              </button>

              {/* Department Choice Button */}
              <button
                type="button"
                className={styles.scopeBtn}
                style={{
                  background: 'var(--color-surface-card)',
                  borderColor: currentDept?.color || '#0055A4',
                  color: currentDept?.color || '#0055A4',
                }}
                onClick={() => {
                  setIsAudienceOpen(false);
                  setIsDeptOpen(!isDeptOpen);
                }}
                aria-expanded={isDeptOpen}
                aria-haspopup="dialog"
                title="Select Bulletin Department"
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: currentDept?.color || '#0055A4',
                    flexShrink: 0,
                  }}
                />
                <span className="truncate">{currentDept?.name || 'Operations'}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  arrow_drop_down
                </span>
              </button>
            </div>
          </div>

          {/* Validation Notice */}
          {validationError && (
            <div className={styles.validationNotice}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#DC2626' }}>
                error
              </span>
              <span>{validationError}</span>
            </div>
          )}

          {/* Headline Input & Main Body Composer */}
          <div className={styles.formFields}>
            <input
              type="text"
              className={styles.titleInput}
              placeholder="Bulletin Title (e.g. Tenom Pangi Station Maintenance Notice)"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationError) setValidationError('');
              }}
              maxLength={120}
            />

            <textarea
              className={styles.bodyTextarea}
              placeholder="Write your bulletin content or announcement here..."
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              maxLength={5000}
              rows={6}
            />

            {/* Formatting Toolbar */}
            <div className={styles.formattingToolbar}>
              <div className={styles.charCount}>
                <span className="font-mono tabular-nums">{content.length}</span> / 5000
              </div>
            </div>
          </div>

          {/* Location Chip Selector */}
          <div style={{ padding: '0 16px 12px 16px', display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
            <span style={{ fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>location_on</span>
              Location:
            </span>
            {SESB_LOCATIONS.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setSelectedLocation(loc)}
                style={{
                  minHeight: '30px',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  border: selectedLocation === loc ? '1px solid #0055A4' : '1px solid #E2E8F0',
                  background: selectedLocation === loc ? '#EFF6FF' : '#FFFFFF',
                  color: selectedLocation === loc ? '#0055A4' : '#475569',
                  fontWeight: selectedLocation === loc ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {loc}
              </button>
            ))}
          </div>

          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <input
            type="file"
            ref={pdfFileInputRef}
            accept="application/pdf,.pdf"
            onChange={handlePdfUpload}
            style={{ display: 'none' }}
          />

          {/* Multi-Photo, PDF & Poll Attachment Deck */}
          <AttachmentTray
            photos={photos}
            maxPhotos={MAX_BULLETIN_PHOTOS}
            isCompressing={isCompressing}
            onRemovePhoto={handleRemovePhoto}
            onEditCrop={(photo) => setEditingPhoto(photo)}
            onTriggerPhotoUpload={triggerPhotoUpload}
            pdfFile={pdfFile}
            onRemovePdf={() => setPdfFile(null)}
            onTriggerPdfUpload={triggerPdfUpload}
            hasPoll={hasPoll}
            onTogglePoll={() => setHasPoll(!hasPoll)}
            pollQuestion={pollQuestion}
            onPollQuestionChange={setPollQuestion}
            pollOptions={pollOptions}
            onPollOptionChange={handleOptionChange}
            onAddPollOption={handleAddOption}
            onRemovePollOption={handleRemoveOption}
          />

          {/* Options & Pinning */}
          <div className={styles.optionsSection}>
            <label className={styles.toggleRow}>
              <div className={styles.toggleText}>
                <span className={styles.toggleTitle}>Pin to Top of Feed</span>
                <span className={styles.toggleDesc}>
                  Keep this bulletin highlighted at the top of the feed for maximum visibility.
                </span>
              </div>
              <input
                type="checkbox"
                className={styles.toggleCheckbox}
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
            </label>

            <label className={styles.toggleRow}>
              <div className={styles.toggleText}>
                <span className={styles.toggleTitle}>Mark as Official Notice / Directive</span>
                <span className={styles.toggleDesc}>
                  Display an urgent directive badge and alert border for priority visibility.
                </span>
              </div>
              <input
                type="checkbox"
                className={styles.toggleCheckbox}
                checked={isOfficialNotice}
                onChange={(e) => setIsOfficialNotice(e.target.checked)}
              />
            </label>

            <label className={styles.toggleRow}>
              <div className={styles.toggleText}>
                <span className={styles.toggleTitle}>Allow Comments / Feedback</span>
                <span className={styles.toggleDesc}>
                  Allow colleagues across all departments to share feedback.
                </span>
              </div>
              <input
                type="checkbox"
                className={styles.toggleCheckbox}
                checked={allowComments}
                onChange={(e) => setAllowComments(e.target.checked)}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Department Selector Modal Sheet (Mounted to Body) */}
      {isDeptOpen &&
        createPortal(
          <div
            className={styles.portalOverlay}
            onClick={() => setIsDeptOpen(false)}
            role="presentation"
          >
            <div
              className={styles.deptModalSheet}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Select Department"
            >
              <div className={styles.modalSheetHeader}>
                <div className={styles.modalSheetTitleWrap}>
                  <span className={styles.modalSheetTitle}>Select Department</span>
                  <span className={styles.modalSheetSub}>
                    Choose which SE department this bulletin originates from
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.modalSheetCloseBtn}
                  onClick={() => setIsDeptOpen(false)}
                  aria-label="Close Department Sheet"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className={styles.modalSheetBody}>
                {departments.map((dept) => {
                  const isSelected = currentDept?.id === dept.id;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      className={`${styles.deptSheetOption} ${isSelected ? styles.deptSheetOptionActive : ''}`}
                      onClick={() => {
                        setSelectedDeptId(dept.id);
                        setIsDeptOpen(false);
                      }}
                    >
                      <span
                        className={styles.deptSheetColorDot}
                        style={{ backgroundColor: dept.color }}
                      />
                      <span className={styles.deptSheetName}>{dept.name}</span>
                      {isSelected && (
                        <span className={`material-symbols-outlined ${styles.deptSheetCheck}`}>
                          check_circle
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Audience Scope Modal Sheet (Mounted to Body) */}
      {isAudienceOpen &&
        createPortal(
          <div
            className={styles.portalOverlay}
            onClick={() => setIsAudienceOpen(false)}
            role="presentation"
          >
            <div
              className={styles.deptModalSheet}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Select Audience Scope"
            >
              <div className={styles.modalSheetHeader}>
                <div className={styles.modalSheetTitleWrap}>
                  <span className={styles.modalSheetTitle}>Audience Scope</span>
                  <span className={styles.modalSheetSub}>
                    Define who will receive and see this bulletin notification
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.modalSheetCloseBtn}
                  onClick={() => setIsAudienceOpen(false)}
                  aria-label="Close Audience Scope Sheet"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className={styles.modalSheetBody}>
                {(['All Sabah Staff', 'HQ Only', 'Operations Only'] as const).map((scope) => {
                  const isSelected = audienceScope === scope;
                  return (
                    <button
                      key={scope}
                      type="button"
                      className={`${styles.deptSheetOption} ${isSelected ? styles.deptSheetOptionActive : ''}`}
                      onClick={() => {
                        setAudienceScope(scope);
                        setIsAudienceOpen(false);
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: '20px',
                          color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        }}
                      >
                        {scope === 'All Sabah Staff'
                          ? 'public'
                          : scope === 'HQ Only'
                          ? 'corporate_fare'
                          : 'engineering'}
                      </span>
                      <span className={styles.deptSheetName}>{scope}</span>
                      {isSelected && (
                        <span className={`material-symbols-outlined ${styles.deptSheetCheck}`}>
                          check_circle
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* On-Demand Photo Crop & Adjust Studio */}
      {editingPhoto && (
        <MediaCropModal
          imageSrc={editingPhoto.url}
          imageFile={editingPhoto.file}
          title="Crop & Adjust Photo"
          isFreeform={true}
          initialAspect="freeform"
          confirmLabel="Apply Crop"
          onConfirm={handleCropComplete}
          onCancel={() => setEditingPhoto(null)}
          isProcessing={isCropProcessing}
        />
      )}
    </div>
  );
};
