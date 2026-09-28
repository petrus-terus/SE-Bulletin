import React, { useState } from 'react';
import type { Department, CreatePostPayload } from '../types/bulletin';
import { CURRENT_USER } from '../services/mockData';
import styles from './CreateBulletinPage.module.css';

interface Props {
  departments: Department[];
  onClose: () => void;
  onSubmit: (newPostData: CreatePostPayload) => void;
}

type PostType = 'status' | 'media' | 'announcement';

export const CreateBulletinPage: React.FC<Props> = ({
  departments,
  onClose,
  onSubmit,
}) => {
  const [postType, setPostType] = useState<PostType>('announcement');
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

  // Attachments State
  const [hasPhoto, setHasPhoto] = useState(true);
  const [photoUrl] = useState(
    'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=1200&q=80'
  );
  const [photoName] = useState('turbine_telemetry_inspection.jpg');

  const [hasPdf, setHasPdf] = useState(true);
  const [pdfName] = useState('SOP-KV-2026-V2.pdf');
  const [pdfSize] = useState('1.4 MB • Ready');

  const [validationError, setValidationError] = useState('');

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setCharCount(val.length);
    if (validationError) setValidationError('');
  };

  const handleApplyTemplate = (templateType: 'safety' | 'milestone' | 'movement') => {
    if (templateType === 'safety') {
      setTitle('[HSE DIRECTIVE] Mandatory Safety Briefing & High-Voltage Protocol');
      setContent(
        'Attention all station crews and field contractors:\n\n1. Scope of Works: High-voltage relay verification across all feeder units.\n2. PPE Compliance: ARC Flash Category 4 suits must be inspected and certified.\n3. Lockout-Tagout (LOTO): Strictly enforce double-isolation on primary busbars before entry.'
      );
      setPostType('announcement');
      setIsPinned(true);
    } else if (templateType === 'milestone') {
      setTitle('[MILESTONE] 100 Days Zero LTI Achieved at Tenom Pangi Hydro');
      setContent(
        'Proud to announce that the Tenom Pangi Hydroelectric Station team has achieved 100 consecutive days of Zero Lost Time Injury (LTI).\n\nSpecial thanks to the operational safety committee and engineering crews for upholding our Goal Zero culture.'
      );
      setPostType('status');
    } else {
      setTitle('[STAFF MOVEMENT] Welcoming New Regional Distribution Engineers');
      setContent(
        'Please join us in welcoming our new senior engineers deployed to the Sandakan and Tawau regional distribution centers this month.'
      );
      setPostType('status');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && postType === 'announcement') {
      setValidationError('Please provide a title for the official bulletin.');
      return;
    }
    if (!content.trim()) {
      setValidationError('Please enter your bulletin content.');
      return;
    }

    const dept = departments.find((d) => d.id === selectedDeptId) || departments[0];

    const newPost: CreatePostPayload = {
      title: title.trim(),
      content: content.trim(),
      authorName: CURRENT_USER.name,
      department: dept.name,
      departmentId: dept.id,
      avatarUrl: CURRENT_USER.avatarUrl,
      isPinned: isPinned,
      mediaUrls: hasPhoto ? [photoUrl] : undefined,
      imageUrl: hasPhoto ? photoUrl : undefined,
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
          <h1 className={styles.headerTitle}>Create Bulletin</h1>
        </div>

        <button
          type="button"
          className={styles.publishBtn}
          onClick={handleSubmit}
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
                feed
              </span>
              <span>Status Update</span>
            </button>

            <button
              type="button"
              className={`${styles.typeTab} ${postType === 'media' ? styles.typeTabActive : ''}`}
              onClick={() => setPostType('media')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>
                photo_library
              </span>
              <span>Photo / Video</span>
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
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary-container)' }}>
                  public
                </span>
                <span>{audienceScope}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  expand_more
                </span>
              </button>

              {isAudienceOpen && (
                <div className={styles.scopeMenu}>
                  {['All Sabah Staff', 'Engineering & Operations', 'HSE Alert Scope', 'HQ Management'].map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      className={`${styles.scopeMenuItem} ${audienceScope === scope ? styles.scopeMenuItemActive : ''}`}
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

          {/* Department Selection Pill Row */}
          <div className={styles.deptSelectorRow}>
            <span className={styles.deptLabel}>Posting under:</span>
            <div className={styles.deptPillsContainer}>
              {departments
                .filter((d) => d.id !== 'dept-all')
                .map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`${styles.deptChoiceBtn} ${selectedDeptId === d.id ? styles.deptChoiceBtnActive : ''}`}
                    onClick={() => setSelectedDeptId(d.id)}
                  >
                    <span>{d.name}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Structured Template Prompt Banner */}
          <div className={styles.templatePromptBanner}>
            <div className={styles.templateIconBox}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                assignment_add
              </span>
            </div>
            <div className={styles.templateInfo}>
              <div className={styles.templateTitleRow}>
                <span className={styles.templateHeading}>Official SESB Templates</span>
                <div className={styles.templateActions}>
                  <button
                    type="button"
                    className={styles.applyTemplateChip}
                    onClick={() => handleApplyTemplate('safety')}
                  >
                    Safety Alert
                  </button>
                  <button
                    type="button"
                    className={styles.applyTemplateChip}
                    onClick={() => handleApplyTemplate('milestone')}
                  >
                    Milestone
                  </button>
                </div>
              </div>
              <p className={styles.templateDesc}>
                Auto-fill structured layouts for HSE directives, station milestones, or staff movement.
              </p>
            </div>
          </div>

          {validationError && (
            <div className={styles.validationNotice}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                error
              </span>
              <span>{validationError}</span>
            </div>
          )}

          {/* Inputs Section */}
          <div className={styles.formFields}>
            {/* Title Input */}
            <input
              type="text"
              className={styles.titleInput}
              placeholder="Title of Bulletin or Subject..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationError) setValidationError('');
              }}
            />

            {/* Rich Text Area */}
            <textarea
              className={styles.bodyTextarea}
              placeholder="Share updates, operational telemetries, directives or announcements with Sabah Electricity staff..."
              rows={6}
              value={content}
              onChange={handleContentChange}
            />

            {/* Mini Formatting Toolbar */}
            <div className={styles.formattingToolbar}>
              <div className={styles.formatToolsGroup}>
                <button
                  type="button"
                  className={styles.formatBtn}
                  title="Bold"
                  onClick={() => setContent((prev) => prev + ' **bold** ')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    format_bold
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.formatBtn}
                  title="Italic"
                  onClick={() => setContent((prev) => prev + ' *italic* ')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    format_italic
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.formatBtn}
                  title="Bulleted List"
                  onClick={() => setContent((prev) => prev + '\n- ')}
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

          {/* Media & Document Attachment Deck */}
          <div className={styles.attachmentDeck}>
            <div className={styles.attachmentHeader}>
              <span className={styles.attachmentTitle}>Attachments & Documents</span>
              <div className={styles.attachmentControls}>
                <button
                  type="button"
                  className={styles.addMediaBtn}
                  onClick={() => setHasPhoto(!hasPhoto)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    add_photo_alternate
                  </span>
                  <span>{hasPhoto ? 'Remove Photo' : 'Attach Photo'}</span>
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
              {/* Photo Preview Tile */}
              {hasPhoto && (
                <div className={styles.photoTile}>
                  <img src={photoUrl} alt="Attachment Preview" className={styles.photoPreviewImg} />
                  <div className={styles.photoOverlay}>
                    <span className={styles.photoLabel}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        image
                      </span>
                      <span className="truncate">{photoName}</span>
                    </span>
                    <button
                      type="button"
                      className={styles.removeTileBtn}
                      onClick={() => setHasPhoto(false)}
                      title="Remove attachment"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        close
                      </span>
                    </button>
                  </div>
                </div>
              )}

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
                      title="Delete document"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Broadcast Options & Toggles */}
          <div className={styles.optionsSection}>
            <label className={styles.toggleRow}>
              <div className={styles.toggleText}>
                <span className={styles.toggleTitle}>Broadcast Priority (Pin to Top)</span>
                <span className={styles.toggleDesc}>Keep this announcement pinned at the top of the statewide feed</span>
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
                <span className={styles.toggleTitle}>Allow Staff Comments</span>
                <span className={styles.toggleDesc}>Enable threaded discussions and feedback from SESB employees</span>
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
