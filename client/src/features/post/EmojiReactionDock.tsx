import React, { useEffect, useRef } from 'react';
import type { EmojiReactionType } from '@/types/bulletin';
import styles from './EmojiReactionDock.module.css';

interface Props {
  currentReaction?: EmojiReactionType;
  onSelect: (reaction: EmojiReactionType) => void;
  onClose: () => void;
}

const EMOJIS: { type: EmojiReactionType; glyph: string; label: string; className: string }[] = [
  { type: 'laugh', glyph: '😂', label: 'Haha', className: styles.emojiLaugh },
  { type: 'fire', glyph: '🔥', label: 'Fire', className: styles.emojiFire },
  { type: 'clap', glyph: '👏', label: 'Clap', className: styles.emojiClap },
  { type: 'cry', glyph: '😭', label: 'Sad', className: styles.emojiCry },
];

export const EmojiReactionDock: React.FC<Props> = ({
  currentReaction,
  onSelect,
  onClose,
}) => {
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dockRef.current && !dockRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={dockRef}
      className={styles.reactionDock}
      role="toolbar"
      aria-label="Reactions"
      onClick={(e) => e.stopPropagation()}
    >
      {EMOJIS.map((item) => {
        const isSelected = currentReaction === item.type;
        return (
          <button
            key={item.type}
            type="button"
            className={`${styles.emojiBtn} ${item.className}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item.type);
            }}
            title={item.label}
            aria-label={item.label}
          >
            <span className={styles.emojiGlyph}>{item.glyph}</span>
            {isSelected && <span className={styles.selectedDot} aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
};
