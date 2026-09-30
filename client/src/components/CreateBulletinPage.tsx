import React, { useState, useRef } from 'react';
import type { Department, CreatePostPayload } from '../types/bulletin';
import { CURRENT_USER } from '../services/mockData';
import styles from './CreateBulletinPage.module.css';

interface Props {
  departments: Department[];
  onClose: () => void;
  onSubmit: (newPostData: CreatePostPayload) => void;
  initialPostType?: 'status' | 'media' | 'announcement';
}

type PostType = 'status' | 'media' | 'announcement';

interface AttachedPhoto {
  id: string;
  url: string;
  name: string;
}

const STATUS_COLORS = ['#1A7A5A', '#0055A4', '#D97706', '#0F172A', '#BA1A1A'];

export const CreateBulletinPage: React.FC<Props> = ({
  departments,
  onClose,
  onSubmit,
  initialPostType = 'announcement',
}) => {
  const [postType, setPostType] = useState<PostType>(initialPostType);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState(
    CURRENT_USER.adminDepartments?.[0] || 'dept-ops'
  );
  const [audienceScope, setAudienceScope] = useState('All Sabah Staff');
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [charCount, setCharCount] = useState(0);

  // WhatsApp Status Card Customization
  const [statusColor, setStatusColor] = useState('#1A7A5A');

  // Multi-Photo Attachments State (Starts completely clean with 0 pre-loaded media)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<AttachedPhoto[]>([]);

  const [hasPdf, setHasPdf] = useState(false);
  const [pdfName] = useState('SOP-KV-2026-V2.pdf');
  const [pdfSize] = useState('1.4 MB • Ready');

  const [validationError, setValidationError] = useState('');

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setCharCount(val.length);
    if (validationError) setValidationError('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newPhotos: AttachedPhoto[] = files.map((file, idx) => ({
      id: `photo-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && postType === 'announcement') {
      setValidationError('Please provide a title for the official bulletin.');
      return;
    }
    if (!content.trim()) {
      setValidationError('Please enter your bulletin content or status update.');
      return;
    }

    const dept = departments.find((d) => d.id === selectedDeptId) || departments[0];

    const newPost: CreatePostPayload = {
      title: title.trim() || (postType === 'status' ? 'Operational Status Update' : 'SESB Bulletin'),
      content: content.trim(),
      authorName: CURRENT_USER.name,
      department: dept.name,
      departmentId: dept.id,
      avatarUrl: CURRENT_USER.avatarUrl,
      isPinned: isPinned,
      mediaUrls: photos.length > 0 ? photos.map((p) => p.url) : undefined,
      imageUrl: photos.length > 0 ? photos[0].url : undefined,
      officialNotice: postType === 'announcement',
    };

    onSubmit(newPost);
  };

  return (
    <div className={styles.fullPageContainer} role="dialog" aria-modal="true" aria-label="Create Bulletin">
      {/* Top Header Bar */}
      <header className={styles.headerBar}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={onClose}
          aria-label="Cancel and go back"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            arrow_back
          </span>
          <span>Cancel</span>
        </button>

        <div className={styles.headerTitleWrap}>
          <span className={styles.statusDot}></span>
          <h1 className={styles.headerTitle}>
            {postType === 'status' ? 'Post WhatsApp Status' : 'Create Internal Bulletin'}
          </h1>
        </div>

        <button
          type="button"
          className={styles.publishBtn}
          onClick={handleSubmit}
          aria-label="Publish bulletin"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            send
          </span>
          <span>Publish</span>
        </button>
      </header>

      {/* Main Form Body */}
      <div className={styles.scrollContent}>
        <div className={styles.pageCard}>
          {/* Post Type Segmented Tab Bar */}
          <div className={styles.typeSelectorRow}>
            <button
              type="button"
              className={`${styles.typeTab} ${postType === 'status' ? styles.typeTabActive : ''}`}
              onClick={() => setPostType('status')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>
                history_edu
              </span>
              <span>24h WhatsApp Status</span>
            </button>

            <button
              type="button"
              className={`${styles.typeTab} ${postType === 'media' ? styles.typeTabActive : ''}`}
              onClick={() => setPostType('media')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>
                photo_library
              </span>
              <span>Photo / Gallery</span>
            </button>

            <button
              type="button"
              className={`${styles.typeTab} ${postType === 'announcement' ? styles.typeTabActive : ''}`}
              onClick={() => setPostType('announcement')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>
                campaign
              </span>
              <span>Official Bulletin</span>
            </button>
          </div>

          {/* WhatsApp Status Mode Banner */}
          {postType === 'status' && (
            <div className={styles.statusBannerRow}>
              <div className={styles.statusBannerHeader}>
                <span className={styles.statusBannerTitle}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#166534' }}>
                    timer
                  </span>
                  <span>WhatsApp-Style Status (24h Ephemeral)</span>
                </span>
                <span className={styles.statusDurationPill}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                    schedule
                  </span>
                  <span>Expires in 24h</span>
                </span>
              </div>

              <div className={styles.colorPickerRow}>
                <span className={styles.colorPickerLabel}>Card Color:</span>
                {STATUS_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`${styles.colorDotBtn} ${statusColor === c ? styles.colorDotActive : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setStatusColor(c)}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Author & Audience Meta Card */}
          <div className={styles.authorMetaDeck}>
            <div className={styles.authorProfile}>
              <div className={styles.avatarWrapper}>
                <img
                  src={CURRENT_USER.avatarUrl}
                  alt={CURRENT_USER.name}
                  className={styles.authorAvatar}
                />
                <span className={styles.onlineDot} title="Online"></span>
              </div>
              <div className={styles.authorDetails}>
                <span className={styles.authorName}>{CURRENT_USER.name}</span>
                <span className={styles.authorRole}>
                  {CURRENT_USER.role} • <span className="font-mono tabular-nums">{CURRENT_USER.employeeId}</span>
                </span>
              </div>
            </div>

            {/* Scope Dropdown */}
            <div className={styles.scopeWrapper}>
              <button
                type="button"
                className={styles.scopeBtn}
                onClick={() => setIsAudienceOpen(!isAudienceOpen)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  public
                </span>
                <span>{audienceScope}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  expand_more
                </span>
              </button>

              {isAudienceOpen && (
                <div className={styles.scopeMenu}>
                  {['All Sabah Staff', 'HQ Only (Wisma SESB)', 'Engineers & Tech Only'].map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      className={`${styles.scopeMenuItem} ${
                        audienceScope === scope ? styles.scopeMenuItemActive : ''
                      }`}
                      onClick={() => {
                        setAudienceScope(scope);
                        setIsAudienceOpen(false);
                      }}
                    >
                      {scope}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Department Choice Row */}
          <div className={styles.deptSelectorRow}>
            <span className={styles.deptLabel}>Posting under:</span>
            <div className={styles.deptPillsContainer}>
              {departments
                .filter((d) => d.id !== 'dept-all')
                .map((dept) => (
                  <button
                    key={dept.id}
                    type="button"
                    className={`${styles.deptChoiceBtn} ${
                      selectedDeptId === dept.id ? styles.deptChoiceBtnActive : ''
                    }`}
                    onClick={() => setSelectedDeptId(dept.id)}
                  >
                    {dept.name}
                  </button>
                ))}
            </div>
          </div>

          {/* Validation Notice */}
          {validationError && (
            <div className={styles.validationNotice}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                error
              </span>
              <span>{validationError}</span>
            </div>
          )}

          {/* Form Inputs */}
          <div className={styles.formFields}>
            {postType !== 'status' && (
              <input
                type="text"
                className={styles.titleInput}
                placeholder="Bulletin Heading (e.g. [HSE ADVISORY] High-Voltage Safety Briefing)..."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (validationError) setValidationError('');
                }}
              />
            )}

            <textarea
              className={styles.bodyTextarea}
              placeholder={
                postType === 'status'
                  ? 'Write your daily status or site observation (WhatsApp style)...'
                  : 'Write your bulletin announcement, operational summary, or field notes...'
              }
              value={content}
              onChange={handleContentChange}
              rows={postType === 'status' ? 4 : 6}
            />

            {/* Quick Formatting Bar */}
            <div className={styles.formattingToolbar}>
              <div className={styles.formatToolsGroup}>
                <button
                  type="button"
                  className={styles.formatBtn}
                  title="Insert Bullet Point"
                  onClick={() => setContent((prev) => prev + '\n• ')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    format_list_bulleted
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.formatBtn}
                  title="Insert Link"
                  onClick={() => setContent((prev) => prev + ' [link](https://sesb.com.my) ')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    link
                  </span>
                </button>
                <button
                  type="button"
                  className={`${styles.formatBtn} ${styles.formatBtnMention}`}
                  title="Mention Colleague"
                  onClick={() => setContent((prev) => prev + ' @Ir.Raymond ')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    alternate_email
                  </span>
                </button>
              </div>

              <div className={styles.charCount}>
                <span className="font-mono tabular-nums">{charCount}</span> / 1200
              </div>
            </div>
          </div>

          {/* Multi-Photo & Document Attachment Deck */}
          <div className={styles.attachmentDeck}>
            <div className={styles.attachmentHeader}>
              <span className={styles.attachmentTitle}>
                Attached Photos & Documents ({photos.length} photos)
              </span>
              <div className={styles.attachmentControls}>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />

                <button
                  type="button"
                  className={styles.addMediaBtn}
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload photos from your computer or phone"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    upload
                  </span>
                  <span>Upload Photos</span>
                </button>

                <button
                  type="button"
                  className={styles.addMediaBtn}
                  onClick={() => setHasPdf(!hasPdf)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    upload_file
                  </span>
                  <span>{hasPdf ? 'Remove PDF' : 'Attach PDF'}</span>
                </button>
              </div>
            </div>

            <div className={styles.attachmentsGrid}>
              {/* Photo Preview Tiles */}
              {photos.map((photo, index) => (
                <div key={photo.id} className={styles.photoTile}>
                  <img src={photo.url} alt={`Preview ${index + 1}`} className={styles.photoPreviewImg} />
                  <div className={styles.photoOverlay}>
                    <span className={styles.photoLabel}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        image
                      </span>
                      <span className="truncate">{photo.name}</span>
                    </span>
                    <button
                      type="button"
                      className={styles.removeTileBtn}
                      onClick={() => handleRemovePhoto(photo.id)}
                      title="Remove this photo"
                      aria-label="Remove photo"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        close
                      </span>
                    </button>
                  </div>
                </div>
              ))}

              {/* PDF Document Card Tile */}
              {hasPdf && (
                <div className={styles.pdfTile}>
                  <div className={styles.pdfTileTop}>
                    <div className={styles.pdfIconWrap}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#DC2626' }}>
                        picture_as_pdf
                      </span>
                    </div>
                    <div className={styles.pdfInfo}>
                      <span className={styles.pdfFileName}>{pdfName}</span>
                      <span className="font-mono tabular-nums text-xs text-slate-500">{pdfSize}</span>
                    </div>
                  </div>

                  <div className={styles.pdfTileBottom}>
                    <span className={styles.verifiedBadge}>
                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                        verified
                      </span>
                      <span>Verified SOP</span>
                    </span>
                    <button
                      type="button"
                      className={styles.deleteDocBtn}
                      onClick={() => setHasPdf(false)}
                      title="Remove PDF"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Options & Toggles */}
          <div className={styles.optionsSection}>
            <label className={styles.toggleRow}>
              <div className={styles.toggleText}>
                <span className={styles.toggleTitle}>Pin to Top of Feed</span>
                <span className={styles.toggleDesc}>
                  Keep this bulletin at the top for maximum operational visibility.
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
                <span className={styles.toggleTitle}>Allow Colleague Comments</span>
                <span className={styles.toggleDesc}>
                  Allow verified staff across stations to reply and discuss.
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

          {/* Primary Bottom Submit Action Deck */}
          <div className={styles.bottomSubmitDeck}>
            <button
              type="button"
              className={styles.bottomCancelBtn}
              onClick={onClose}
              aria-label="Cancel bulletin creation"
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.bottomPublishBtn}
              onClick={handleSubmit}
              aria-label="Publish bulletin"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                send
              </span>
              <span>{postType === 'status' ? 'Publish WhatsApp Status' : 'Publish Bulletin'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
