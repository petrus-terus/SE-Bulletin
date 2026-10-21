import React from 'react';
import styles from '../CreateBulletinPage.module.css';

interface PdfAttachmentCardProps {
  pdfFile: { name: string; size: string; url: string } | null;
  onRemovePdf: () => void;
}

export const PdfAttachmentCard: React.FC<PdfAttachmentCardProps> = ({
  pdfFile,
  onRemovePdf,
}) => {
  if (!pdfFile) return null;

  return (
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
          onClick={onRemovePdf}
          title="Remove PDF file"
          aria-label="Remove attached PDF"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            delete
          </span>
        </button>
      </div>
    </div>
  );
};
