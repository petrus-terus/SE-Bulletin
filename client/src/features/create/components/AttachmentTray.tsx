import React from 'react';
import { PdfAttachmentCard } from './PdfAttachmentCard';
import { PollBuilderField } from './PollBuilderField';
import styles from '../CreateBulletinPage.module.css';

export interface AttachedPhoto {
  id: string;
  url: string;
  name: string;
  file?: File;
}

interface AttachmentTrayProps {
  photos: AttachedPhoto[];
  maxPhotos: number;
  isCompressing: boolean;
  onRemovePhoto: (id: string) => void;
  onEditCrop: (photo: AttachedPhoto) => void;
  onTriggerPhotoUpload: () => void;
  pdfFile: { name: string; size: string; url: string } | null;
  onRemovePdf: () => void;
  onTriggerPdfUpload: () => void;
  hasPoll: boolean;
  onTogglePoll: () => void;
  pollQuestion: string;
  onPollQuestionChange: (q: string) => void;
  pollOptions: string[];
  onPollOptionChange: (index: number, val: string) => void;
  onAddPollOption: () => void;
  onRemovePollOption: (index: number) => void;
}

export const AttachmentTray: React.FC<AttachmentTrayProps> = ({
  photos,
  maxPhotos,
  isCompressing,
  onRemovePhoto,
  onEditCrop,
  onTriggerPhotoUpload,
  pdfFile,
  onRemovePdf,
  onTriggerPdfUpload,
  hasPoll,
  onTogglePoll,
  pollQuestion,
  onPollQuestionChange,
  pollOptions,
  onPollOptionChange,
  onAddPollOption,
  onRemovePollOption,
}) => {
  return (
    <div className={styles.attachmentDeck}>
      <div className={styles.attachmentHeader}>
        <span className={styles.attachmentTitle}>
          Attachments (<span className="font-mono tabular-nums">{photos.length}/{maxPhotos}</span> photos{pdfFile ? ', 1 PDF' : ''})
        </span>
        <div className={styles.attachmentControls}>
          <button
            type="button"
            className={styles.addMediaBtn}
            onClick={onTriggerPhotoUpload}
            title="Upload photos from phone or computer (max 10)"
            disabled={isCompressing || photos.length >= maxPhotos}
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
                onRemovePdf();
              } else {
                onTriggerPdfUpload();
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
            className={styles.addMediaBtn}
            onClick={onTogglePoll}
            title="Add staff poll"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              how_to_vote
            </span>
            <span>{hasPoll ? 'Close Poll' : 'Poll'}</span>
          </button>
        </div>
      </div>

      {(photos.length > 0 || pdfFile) && (
        <div className={styles.attachmentsGrid}>
          {photos.map((photo, index) => (
            <div key={photo.id} className={styles.photoTile}>
              <img
                src={photo.url}
                alt={`Preview ${index + 1}`}
                className={styles.photoPreviewImg}
              />
              <div className={styles.photoOverlay}>
                <span className={styles.photoLabel}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    image
                  </span>
                  <span className="truncate">{photo.name}</span>
                </span>
                <div className={styles.photoTileActions}>
                  <button
                    type="button"
                    className={styles.editCropTileBtn}
                    onClick={() => onEditCrop(photo)}
                    title="Crop & adjust this photo"
                    aria-label="Crop and adjust photo"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                      crop
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.removeTileBtn}
                    onClick={() => onRemovePhoto(photo.id)}
                    title="Remove this photo"
                    aria-label="Remove photo"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                      close
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          <PdfAttachmentCard pdfFile={pdfFile} onRemovePdf={onRemovePdf} />
        </div>
      )}

      <PollBuilderField
        hasPoll={hasPoll}
        onCancelPoll={() => onTogglePoll()}
        pollQuestion={pollQuestion}
        onQuestionChange={onPollQuestionChange}
        pollOptions={pollOptions}
        onOptionChange={onPollOptionChange}
        onAddOption={onAddPollOption}
        onRemoveOption={onRemovePollOption}
      />
    </div>
  );
};
