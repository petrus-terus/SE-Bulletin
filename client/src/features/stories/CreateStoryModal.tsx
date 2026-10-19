import React, { useState, useRef } from 'react';
import type { Employee, Story } from '@/types/bulletin';
import { bulletinService } from '@/services/bulletinService';
import styles from './CreateStoryModal.module.css';

interface Props {
  currentUser: Employee;
  onClose: () => void;
  onSubmit: (newStory: Story) => void;
}

const SESB_GRADIENTS = [
  { id: 'green', name: 'Kinabalu Forest', gradient: 'linear-gradient(135deg, #1A7A5A 0%, #0E4432 100%)' },
  { id: 'blue', name: 'Sabah Blue', gradient: 'linear-gradient(135deg, #0055A4 0%, #002D5A 100%)' },
  { id: 'amber', name: 'Sunset Amber', gradient: 'linear-gradient(135deg, #D97706 0%, #92400E 100%)' },
  { id: 'slate', name: 'Night Grid', gradient: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' },
];

/**
 * Creates an image dataURL from a gradient and text content so it can be previewed anywhere
 */
function createTextCardImage(text: string, gradient: string, authorName: string, deptName: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error("No canvas context"));

  // Background
  const linear = ctx.createLinearGradient(0, 0, 1080, 1920);
  if (gradient.includes('#1A7A5A')) {
    linear.addColorStop(0, '#1A7A5A');
    linear.addColorStop(1, '#0E4432');
  } else if (gradient.includes('#0055A4')) {
    linear.addColorStop(0, '#0055A4');
    linear.addColorStop(1, '#002D5A');
  } else if (gradient.includes('#D97706')) {
    linear.addColorStop(0, '#D97706');
    linear.addColorStop(1, '#92400E');
  } else {
    linear.addColorStop(0, '#1E293B');
    linear.addColorStop(1, '#0F172A');
  }
  ctx.fillStyle = linear;
  ctx.fillRect(0, 0, 1080, 1920);

  // Decorative subtle grid circles
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(540, 960, 480, 0, Math.PI * 2);
  ctx.stroke();

  // Header Author / Dept
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(authorName, 540, 280);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '36px sans-serif';
  ctx.fillText(deptName, 540, 340);

  // Main Text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';

  // Word wrap
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > 900 && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const startY = 960 - (lines.length * 80) / 2;
  lines.forEach((line, idx) => {
    ctx.fillText(line, 540, startY + idx * 80);
  });

  // Footer Tagline
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('Sabah Electricity • 24h Story', 540, 1780);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Canvas toBlob failed"));
      }
    }, 'image/jpeg', 0.85);
  });
}

export const CreateStoryModal: React.FC<Props> = ({ currentUser, onClose, onSubmit }) => {
  const [mode, setMode] = useState<'photo' | 'text'>('photo');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [textStory, setTextStory] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(SESB_GRADIENTS[0].gradient);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captionInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const uploadedUrl = await bulletinService.uploadPhoto(file);
      setPhotoUrl(uploadedUrl);
      setUploadStatus('Cloud Ready');
    } catch (err) {
      console.error('[CreateStoryModal] Upload failed:', err);
      setUploadStatus('Upload Failed');
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePublish = async () => {
    let finalImageUrl = photoUrl;
    let finalCaption = caption.trim();

    setIsCompressing(true);
    try {
      if (mode === 'text') {
        if (!textStory.trim()) return;
        finalCaption = textStory.trim();
        const blob = await createTextCardImage(
          finalCaption,
          selectedGradient,
          currentUser.name,
          currentUser.department
        );
        const file = new File([blob], 'text-story.jpg', { type: 'image/jpeg' });
        finalImageUrl = await bulletinService.uploadPhoto(file);
      } else {
        if (!finalImageUrl) return;
      }
    } catch (err) {
      console.error('Failed to create or upload text story:', err);
      alert('Failed to publish story. Please check your connection.');
      setIsCompressing(false);
      return;
    }

    const newStory: Story = {
      id: `story-${Date.now()}`,
      departmentId: currentUser.adminDepartments?.[0] || 'dept-ops',
      departmentName: currentUser.department || 'Operations',
      authorName: currentUser.name,
      authorAvatar: currentUser.avatarUrl,
      hasUnread: true,
      imageUrl: finalImageUrl || '/grid_horizon_hero.jpg',
      backgroundColor: selectedGradient,
      caption: finalCaption,
      hoursRemaining: 24,
    };

    onSubmit(newStory);
    onClose();
  };

  const canPublish = mode === 'photo' ? Boolean(photoUrl) : Boolean(textStory.trim());

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Share Story (24h)"
    >
      <div className={styles.modalFrame} onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <header className={styles.headerBar}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <h2 className={styles.headerTitle}>Share Story (24h)</h2>
          <button
            type="button"
            className={styles.publishBtn}
            onClick={handlePublish}
            disabled={!canPublish || isCompressing}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              send
            </span>
            <span>Share</span>
          </button>
        </header>

        {/* Mode Switcher */}
        <div className={styles.modeSwitcherRow}>
          <div className={styles.segmentedPill}>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${mode === 'photo' ? styles.segmentedBtnActive : ''}`}
              onClick={() => setMode('photo')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>
                photo_camera
              </span>
              <span>Photo</span>
            </button>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${mode === 'text' ? styles.segmentedBtnActive : ''}`}
              onClick={() => setMode('text')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>
                title
              </span>
              <span>Text Card</span>
            </button>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoSelect}
          style={{ display: 'none' }}
        />

        {/* Main Canvas Viewport */}
        <div className={styles.storyCanvas}>
          {mode === 'photo' ? (
            <div className={styles.photoStoryWrapper}>
              {photoUrl ? (
                <>
                  <img src={photoUrl} alt="Story preview" className={styles.photoPreview} />
                  {uploadStatus && (
                    <div className={styles.compressionBadge}>
                      <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                        check_circle
                      </span>
                      <span className="font-mono tabular-nums">{uploadStatus}</span>
                    </div>
                  )}

                  {/* Caption pill on photo matching user reference mockup */}
                  <div className={styles.floatingCaptionRow}>
                    <input
                      ref={captionInputRef}
                      type="text"
                      className={styles.captionInput}
                      placeholder="Add a caption"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      maxLength={120}
                    />
                    <button
                      type="button"
                      className={styles.emojiBtn}
                      onClick={() => captionInputRef.current?.focus()}
                      aria-label="Add emoji"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                        sentiment_satisfied
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                <div
                  className={styles.emptyPhotoPlaceholder}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className={styles.cameraIconWrap}>
                    <span
                      className={`material-symbols-outlined ${isCompressing ? styles.spinning : ''}`}
                      style={{ fontSize: '36px' }}
                    >
                      {isCompressing ? 'sync' : 'add_a_photo'}
                    </span>
                  </div>
                  <h3 className={styles.placeholderPrompt}>
                    {isCompressing ? 'Optimizing Photo...' : 'Take Photo or Choose from Gallery'}
                  </h3>
                  <p className={styles.placeholderSub}>
                    Capture photo at substation, power station, or Wisma SE office
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.textStoryWrapper} style={{ background: selectedGradient }}>
              <textarea
                className={styles.textStoryInput}
                placeholder="Type your story update for today..."
                value={textStory}
                onChange={(e) => setTextStory(e.target.value)}
                maxLength={200}
                rows={4}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Text Story Palette Picker */}
        {mode === 'text' && (
          <div className={styles.paletteBar}>
            {SESB_GRADIENTS.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`${styles.colorCircle} ${
                  selectedGradient === g.gradient ? styles.colorCircleActive : ''
                }`}
                style={{ background: g.gradient }}
                onClick={() => setSelectedGradient(g.gradient)}
                aria-label={g.name}
                title={g.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
