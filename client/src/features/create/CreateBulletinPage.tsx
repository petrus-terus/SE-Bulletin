import React, { useState, useRef } from 'react';
import type { Department, CreatePostPayload, Employee, Post } from '@/types/bulletin';
import { CURRENT_USER } from '@/services/mockData';
import { bulletinService } from '@/services/bulletinService';
import styles from './CreateBulletinPage.module.css';

interface Props {
  departments: Department[];
  currentUser?: Employee;
  onClose: () => void;
  onSubmit: (newPostData: CreatePostPayload) => void;
  initialPost?: Post | null;
  isEditMode?: boolean;
  onUpdate?: (postId: string, updatedData: Partial<Post>) => void;
  initialPostType?: 'status' | 'announcement';
}

interface AttachedPhoto {
  id: string;
  url: string;
  name: string;
  file?: File;
  compressedSizeFormatted?: string;
  savedPercentage?: number;
}

const COMMON_LOCATIONS = [
  'Wisma SESB HQ',
  'Tenom Pangi Hydro',
  'Sepanggar Power Station',
  'Sandakan Regional Station',
  'Tawau Distribution Office',
];

export const CreateBulletinPage: React.FC<Props> = ({
  departments,
  currentUser,
  onClose,
  onSubmit,
  initialPost,
  isEditMode = false,
  onUpdate,
}) => {
  const activeUser = currentUser || CURRENT_USER;

  // Form State initialized with edit values if in edit mode
  const [isOfficial] = useState(true);
  const [title, setTitle] = useState(initialPost?.title || '');
  const [content, setContent] = useState(initialPost?.content || '');
  const [charCount, setCharCount] = useState(initialPost?.content ? initialPost.content.length : 0);
  const [selectedDeptId, setSelectedDeptId] = useState(
    initialPost?.departmentId || activeUser.adminDepartments?.[0] || 'dept-ops'
  );
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [audienceScope, setAudienceScope] = useState('All Sabah Staff');
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(
    initialPost?.location || activeUser.officeLocation || 'Wisma SESB HQ'
  );
  const [isPinned, setIsPinned] = useState(Boolean(initialPost?.isPinned));
  const [allowComments, setAllowComments] = useState(initialPost ? initialPost.commentsEnabled : true);
  const [validationError, setValidationError] = useState('');

  // Attachments State initialized with any existing photos
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<AttachedPhoto[]>(() => {
    if (!initialPost) return [];
    const media = initialPost.mediaUrls || (initialPost.imageUrl ? [initialPost.imageUrl] : []);
    return media.map((url, idx) => ({
      id: `existing-photo-${idx}`,
      url,
      name: `Photo ${idx + 1}`,
    }));
  });
  const [isCompressing, setIsCompressing] = useState(false);

  // PDF Document State
  const pdfFileInputRef = useRef<HTMLInputElement>(null);
  const [pdfFile, setPdfFile] = useState<{ name: string; size: string; url: string } | null>(() => {
    if (initialPost?.pdfUrl) {
      return {
        name: initialPost.pdfName || 'Document.pdf',
        size: initialPost.pdfSize || 'Verified PDF',
        url: initialPost.pdfUrl,
      };
    }
    return null;
  });

  // Poll Builder State
  const [hasPoll, setHasPoll] = useState(Boolean(initialPost?.poll));
  const [pollQuestion, setPollQuestion] = useState(initialPost?.poll?.question || '');
  const [pollOptions, setPollOptions] = useState<string[]>(
    initialPost?.poll?.options ? initialPost.poll.options.map((o) => o.text) : ['', '']
  );

  const currentDept = departments.find((d) => d.id === selectedDeptId) || departments[0];

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setCharCount(val.length);
    if (validationError) setValidationError('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setIsCompressing(true);

    try {
      const compressedList: AttachedPhoto[] = await Promise.all(
        files.map(async (file, idx) => {
          const uploadedUrl = await bulletinService.uploadPhoto(file);

          return {
            id: `photo-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
            url: uploadedUrl,
            name: file.name,
            file,
          };
        })
      );

      setPhotos((prev) => [...prev, ...compressedList]);
    } catch (err) {
      console.error('[CreateBulletinPage] Image upload failed:', err);
      alert('Failed to upload some images. Please check your connection.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    let pdfUrl = '';
    try {
      pdfUrl = await bulletinService.uploadPhoto(file);
    } catch (err) {
      console.error('[CreateBulletinPage] PDF upload failed:', err);
      alert('Failed to upload PDF. Please check your connection.');
      return;
    }

    setPdfFile({
      name: file.name,
      size: `${sizeStr} • Verified`,
      url: pdfUrl,
    });
    if (pdfFileInputRef.current) pdfFileInputRef.current.value = '';
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions((prev) => [...prev, '']);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, val: string) => {
    setPollOptions((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Please enter a title for the bulletin.');
      return;
    }
    if (!content.trim()) {
      setValidationError('Please enter your bulletin content.');
      return;
    }

    if (hasPoll) {
      const filledOptions = pollOptions.filter((o) => o.trim().length > 0);
      if (filledOptions.length < 2) {
        setValidationError('Please provide at least 2 options for the poll.');
        return;
      }
    }

    const validPollOptions = pollOptions.filter((o) => o.trim().length > 0);
    const pollData =
      hasPoll && validPollOptions.length >= 2
        ? {
            id: initialPost?.poll?.id || `poll-${Date.now()}`,
            question: pollQuestion.trim() || title.trim() || 'Staff Feedback Poll',
            options: validPollOptions.map((opt, i) => ({
              id: initialPost?.poll?.options?.[i]?.id || `opt-${i + 1}`,
              text: opt.trim(),
              votes: initialPost?.poll?.options?.[i]?.votes || 0,
            })),
            totalVotes: initialPost?.poll?.totalVotes || 0,
          }
        : undefined;

    if (isEditMode && initialPost && onUpdate) {
      onUpdate(initialPost.id, {
        title: title.trim(),
        content: content.trim(),
        departmentName: currentDept.name,
        departmentId: currentDept.id,
        departmentColor: currentDept.color || '#0055A4',
        location: selectedLocation,
        isPinned: isPinned,
        commentsEnabled: allowComments,
        mediaUrls: photos.length > 0 ? photos.map((p) => p.url) : [],
        imageUrl: photos.length > 0 ? photos[0].url : null,
        pdfUrl: pdfFile?.url,
        pdfName: pdfFile?.name,
        pdfSize: pdfFile?.size,
        poll: pollData,
        isEdited: true,
        editedAt: new Date().toISOString(),
      });
      onClose();
      return;
    }

    const newPost: CreatePostPayload = {
      title: title.trim() || 'Sabah Electricity Bulletin',
      content: content.trim(),
      authorName: activeUser.name,
      department: currentDept.name,
      departmentId: currentDept.id,
      departmentColor: currentDept.color || '#0055A4',
      avatarUrl: activeUser.avatarUrl,
      location: selectedLocation,
      isPinned: isPinned,
      mediaUrls: photos.length > 0 ? photos.map((p) => p.url) : undefined,
      imageUrl: photos.length > 0 ? photos[0].url : undefined,
      officialNotice: isOfficial,
      commentsEnabled: allowComments,
      pdfUrl: pdfFile?.url,
      pdfName: pdfFile?.name,
      pdfSize: pdfFile?.size,
      poll: pollData,
    };

    onSubmit(newPost);
  };

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
          <span className={styles.statusDot}></span>
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
                  src={activeUser.avatarUrl || '/user_face.png'}
                  alt=""
                  className={styles.authorAvatar}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/user_face.png';
                  }}
                />
                <span className={styles.onlineDot} />
              </div>

              <div className={styles.authorDetails}>
                <span className={styles.authorName}>{activeUser.name}</span>
                <span className={styles.authorRole}>{activeUser.designation}</span>
              </div>
            </div>

            {/* Audience Dropdown */}
            <div className={styles.scopeWrapper}>
              <button
                type="button"
                className={styles.scopeBtn}
                onClick={() => setIsAudienceOpen(!isAudienceOpen)}
                aria-expanded={isAudienceOpen}
                aria-haspopup="true"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  public
                </span>
                <span>{audienceScope}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  arrow_drop_down
                </span>
              </button>

              {isAudienceOpen && (
                <div className={styles.scopeMenu} role="menu">
                  {['All Sabah Staff', 'HQ Only', 'Operations Only'].map((scope) => (
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
                      role="menuitem"
                    >
                      {scope}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Department Choice Row with Popover Pill */}
          <div className={styles.deptSelectorRow}>
            <span className={styles.deptLabel}>Department:</span>
            <div className={styles.scopeWrapper} style={{ flex: 1 }}>
              <button
                type="button"
                className={styles.scopeBtn}
                style={{
                  background: '#FFFFFF',
                  borderColor: currentDept.color || '#0055A4',
                  color: currentDept.color || '#0055A4',
                }}
                onClick={() => setIsDeptOpen(!isDeptOpen)}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: currentDept.color || '#0055A4',
                  }}
                />
                <span className="truncate">{currentDept.name}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  arrow_drop_down
                </span>
              </button>

              {isDeptOpen && (
                <div className={styles.scopeMenu} style={{ left: 0, right: 'auto' }} role="menu">
                  {departments.map((dept) => (
                    <button
                      key={dept.id}
                      type="button"
                      className={`${styles.scopeMenuItem} ${
                        selectedDeptId === dept.id ? styles.scopeMenuItemActive : ''
                      }`}
                      onClick={() => {
                        setSelectedDeptId(dept.id);
                        setIsDeptOpen(false);
                      }}
                      role="menuitem"
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: dept.color || '#0055A4',
                          marginRight: '8px',
                        }}
                      />
                      <span>{dept.name}</span>
                    </button>
                  ))}
                </div>
              )}
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

          {/* Headline Input */}
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

            {/* Main Body Composer */}
            <textarea
              className={styles.bodyTextarea}
              placeholder="Write your bulletin content or announcement here..."
              value={content}
              onChange={handleContentChange}
              maxLength={5000}
              rows={6}
            />

            {/* Formatting Toolbar (Cleaned up, right-aligned counter) */}
            <div className={styles.formattingToolbar}>
              <div className={styles.charCount}>
                <span className="font-mono tabular-nums">{charCount}</span> / 5000
              </div>
            </div>
          </div>

          {/* Location Chip Selector */}
          <div style={{ padding: '0 16px 12px 16px', display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
            <span style={{ fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>location_on</span>
              Location:
            </span>
            {COMMON_LOCATIONS.map((loc) => (
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

          {/* Multi-Photo & Document Attachment Deck */}
          <div className={styles.attachmentDeck}>
            <div className={styles.attachmentHeader}>
              <span className={styles.attachmentTitle}>
                Attachments ({photos.length} photo{photos.length === 1 ? '' : 's'}{pdfFile ? ', 1 PDF' : ''})
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

                <input
                  type="file"
                  ref={pdfFileInputRef}
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  style={{ display: 'none' }}
                />

                <button
                  type="button"
                  className={styles.addMediaBtn}
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload photos from phone or computer"
                  disabled={isCompressing}
                >
                  <span
                    className={`material-symbols-outlined ${isCompressing ? styles.spinning : ''}`}
                    style={{ fontSize: '16px' }}
                  >
                    {isCompressing ? 'sync' : 'add_photo_alternate'}
                  </span>
                  <span>{isCompressing ? 'Optimizing...' : 'Photos'}</span>
                </button>

                <button
                  type="button"
                  className={styles.addMediaBtn}
                  onClick={() => {
                    if (pdfFile) {
                      setPdfFile(null);
                    } else {
                      pdfFileInputRef.current?.click();
                    }
                  }}
                  title="Upload PDF document"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    picture_as_pdf
                  </span>
                  <span>{pdfFile ? 'Remove PDF' : 'Attach PDF'}</span>
                </button>

                <button
                  type="button"
                  className={`${styles.addMediaBtn} ${hasPoll ? styles.activePollBtn : ''}`}
                  onClick={() => setHasPoll(!hasPoll)}
                  title="Add staff poll"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    how_to_vote
                  </span>
                  <span>{hasPoll ? 'Close Poll' : 'Poll'}</span>
                </button>
              </div>
            </div>

            <div className={styles.attachmentsGrid}>
              {/* Photo Preview Tiles with Compression Badge */}
              {photos.map((photo, index) => (
                <div key={photo.id} className={styles.photoTile}>
                  <img
                    src={photo.url}
                    alt={`Preview ${index + 1}`}
                    className={styles.photoPreviewImg}
                  />
                  {photo.compressedSizeFormatted && (
                    <div className={styles.photoCompressBadge}>
                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                        check_circle
                      </span>
                      <span className="font-mono tabular-nums">{photo.compressedSizeFormatted}</span>
                      {photo.savedPercentage && photo.savedPercentage > 0 ? (
                        <span className="font-mono tabular-nums">(-{photo.savedPercentage}%)</span>
                      ) : null}
                    </div>
                  )}
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

              {/* Real PDF Document Card Tile */}
              {pdfFile && (
                <div className={styles.pdfTile}>
                  <div className={styles.pdfTileTop}>
                    <div className={styles.pdfIconWrap}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '20px', color: '#DC2626' }}
                      >
                        picture_as_pdf
                      </span>
                    </div>
                    <div className={styles.pdfInfo}>
                      <span className={styles.pdfFileName}>{pdfFile.name}</span>
                      <span className="font-mono tabular-nums text-xs text-slate-500">
                        {pdfFile.size}
                      </span>
                    </div>
                  </div>

                  <div className={styles.pdfTileBottom}>
                    <span className={styles.verifiedBadge}>
                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                        attach_file
                      </span>
                      <span>Official PDF Document</span>
                    </span>
                    <button
                      type="button"
                      className={styles.deleteDocBtn}
                      onClick={() => setPdfFile(null)}
                      title="Remove PDF file"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Poll Creator Section (2 to 4 options) */}
            {hasPoll && (
              <div className={styles.pollBuilderSection}>
                <div className={styles.pollBuilderHeader}>
                  <div className={styles.pollBuilderTitle}>
                    <span className="material-symbols-outlined" style={{ color: '#0055A4' }}>
                      how_to_vote
                    </span>
                    <span>SESB Staff Poll Creator</span>
                  </div>
                  <button
                    type="button"
                    className={styles.removePollBtn}
                    onClick={() => setHasPoll(false)}
                  >
                    Cancel Poll
                  </button>
                </div>

                <input
                  type="text"
                  className={styles.pollInput}
                  placeholder="Poll question (e.g. Feedback on new operational schedule?)"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                />

                <div className={styles.pollOptionsList}>
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} className={styles.pollOptionRow}>
                      <input
                        type="text"
                        className={styles.pollOptionInput}
                        placeholder={`Option ${idx + 1}`}
                        value={opt}
                        onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          className={styles.removeOptionBtn}
                          onClick={() => handleRemovePollOption(idx)}
                          title="Remove option"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            close
                          </span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {pollOptions.length < 4 && (
                  <button
                    type="button"
                    className={styles.addOptionBtn}
                    onClick={handleAddPollOption}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      add
                    </span>
                    <span>Add Option ({pollOptions.length}/4)</span>
                  </button>
                )}
              </div>
            )}
          </div>

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
    </div>
  );
};
