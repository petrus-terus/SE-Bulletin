import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Employee } from '@/types/bulletin';
import {
  DEFAULT_AVATAR_URL,
  DEFAULT_COVER_URL,
  SESB_LOCATIONS,
  SESB_ROLES,
  DEFAULT_EMPLOYEE_BIO,
} from '@/constants/bulletin';
import { handleAvatarError, handleCoverError } from '@/utils/imageFallbacks';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import styles from './EditProfileModal.module.css';

export interface EditProfileFormState {
  name: string;
  designation: string;
  department: string;
  officeLocation: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
}

interface Props {
  isOpen: boolean;
  profileData: Employee;
  divisions: string[];
  coverFileInputRef: React.RefObject<HTMLInputElement | null>;
  avatarFileInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSave: (updated: Employee) => void;
  tempAvatarUrl: string;
  setTempAvatarUrl: (url: string) => void;
  tempCoverUrl: string;
  setTempCoverUrl: (url: string) => void;
}

export const EditProfileModal: React.FC<Props> = ({
  isOpen,
  profileData,
  divisions,
  coverFileInputRef,
  avatarFileInputRef,
  onClose,
  onSave,
  tempAvatarUrl,
  setTempAvatarUrl,
  tempCoverUrl,
  setTempCoverUrl,
}) => {
  const [formData, setFormData] = useState<{
    name: string;
    designation: string;
    department: string;
    officeLocation: string;
    bio: string;
  }>(() => ({
    name: profileData.name || '',
    designation: profileData.designation || '',
    department: profileData.department || divisions[0] || 'Information & Digital',
    officeLocation: profileData.officeLocation || SESB_LOCATIONS[0],
    bio: profileData.bio || DEFAULT_EMPLOYEE_BIO,
  }));

  const effectiveAvatarUrl = tempAvatarUrl || profileData.avatarUrl || DEFAULT_AVATAR_URL;
  const effectiveCoverUrl = tempCoverUrl || profileData.coverUrl || DEFAULT_COVER_URL;

  useEscapeKey(onClose, isOpen);
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Employee = {
      ...profileData,
      name: formData.name.trim() || profileData.name,
      fullName: formData.name.trim() || profileData.name,
      designation: formData.designation.trim() || profileData.designation,
      department: formData.department,
      officeLocation: formData.officeLocation,
      bio: formData.bio.trim(),
      avatarUrl: effectiveAvatarUrl,
      coverUrl: effectiveCoverUrl,
    };
    onSave(updated);
  };

  return createPortal(
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Edit Profile"
      onClick={onClose}
    >
      <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderTitleGroup}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '20px', color: 'var(--color-primary-text)' }}
            >
              manage_accounts
            </span>
            <h3 className={styles.modalTitle}>Edit Employee Profile</h3>
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            title="Close modal"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              close
            </span>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {/* Media Quick Previews Deck with Direct Upload Triggers */}
          <div className={styles.mediaPreviewsDeck}>
            {/* Panoramic Banner Preview */}
            <div className={styles.previewCoverWrap}>
              <img
                src={effectiveCoverUrl}
                alt="Banner Preview"
                className={styles.previewCoverImg}
                onError={(e) => handleCoverError(e)}
              />
              <div className={styles.coverButtonsOverlay}>
                {effectiveCoverUrl !== DEFAULT_COVER_URL && (
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
                  src={effectiveAvatarUrl}
                  alt="Avatar Preview"
                  className={styles.previewAvatarImg}
                  onError={(e) => handleAvatarError(e)}
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
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Mohd Irfan bin Razali"
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Role</label>
              <select
                className={styles.selectInput}
                value={formData.designation}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, designation: e.target.value }))
                }
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
                value={formData.department}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, department: e.target.value }))
                }
              >
                {divisions.map((dept) => (
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
                value={formData.officeLocation}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, officeLocation: e.target.value }))
                }
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
                {formData.bio.length} / 160
              </span>
            </div>
            <textarea
              className={styles.bioTextarea}
              rows={3}
              maxLength={160}
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Describe your core operational responsibilities at Sabah Electricity..."
            />
          </div>

          {/* Modal Action Buttons */}
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
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
  );
};
