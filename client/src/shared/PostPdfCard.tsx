import React from 'react';
import styles from './PostPdfCard.module.css';

interface PostPdfCardProps {
  pdfUrl: string;
  pdfName?: string;
  pdfSize?: string;
  className?: string;
}

export const PostPdfCard: React.FC<PostPdfCardProps> = ({
  pdfUrl,
  pdfName,
  pdfSize,
  className,
}) => {
  const handleOpenPdf = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  const displayName = pdfName || 'Official-Bulletin-Document.pdf';

  return (
    <div
      className={`${styles.pdfCard} ${className || ''}`}
      onClick={handleOpenPdf}
      title={`Click to view/download ${displayName}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleOpenPdf(e);
        }
      }}
    >
      <div className={styles.pdfCardLeft}>
        <div className={styles.pdfBadgeWrap}>
          <span className={`material-symbols-outlined ${styles.pdfBadgeIcon}`}>
            picture_as_pdf
          </span>
        </div>
        <div className={styles.pdfCardInfo}>
          <span className={styles.pdfCardFileName}>
            {displayName}
          </span>
          <span className={`font-mono tabular-nums ${styles.pdfCardMeta}`}>
            {pdfSize ? `${pdfSize} • ` : ''}PDF Document
          </span>
        </div>
      </div>

      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        download={displayName}
        className={styles.pdfCardActionBtn}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Open or download ${displayName}`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
          open_in_new
        </span>
        <span>View PDF</span>
      </a>
    </div>
  );
};
