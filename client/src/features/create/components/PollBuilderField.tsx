import React from 'react';
import styles from '../CreateBulletinPage.module.css';

interface PollBuilderFieldProps {
  hasPoll: boolean;
  onCancelPoll: () => void;
  pollQuestion: string;
  onQuestionChange: (q: string) => void;
  pollOptions: string[];
  onOptionChange: (index: number, val: string) => void;
  onAddOption: () => void;
  onRemoveOption: (index: number) => void;
}

export const PollBuilderField: React.FC<PollBuilderFieldProps> = ({
  hasPoll,
  onCancelPoll,
  pollQuestion,
  onQuestionChange,
  pollOptions,
  onOptionChange,
  onAddOption,
  onRemoveOption,
}) => {
  if (!hasPoll) return null;

  return (
    <div className={styles.pollBuilderSection}>
      <div className={styles.pollBuilderHeader}>
        <div className={styles.pollBuilderTitle}>
          <span className="material-symbols-outlined" style={{ color: '#0055A4' }}>
            how_to_vote
          </span>
          <span>SE Staff Poll Creator</span>
        </div>
        <button
          type="button"
          className={styles.removePollBtn}
          onClick={onCancelPoll}
        >
          Cancel Poll
        </button>
      </div>

      <input
        type="text"
        className={styles.pollInput}
        placeholder="Poll question (e.g. Feedback on new operational schedule?)"
        value={pollQuestion}
        onChange={(e) => onQuestionChange(e.target.value)}
        maxLength={120}
      />

      <div className={styles.pollOptionsList}>
        {pollOptions.map((opt, idx) => (
          <div key={idx} className={styles.pollOptionRow}>
            <input
              type="text"
              className={styles.pollOptionInput}
              placeholder={`Option ${idx + 1}`}
              value={opt}
              onChange={(e) => onOptionChange(idx, e.target.value)}
              maxLength={60}
            />
            {pollOptions.length > 2 && (
              <button
                type="button"
                className={styles.removeOptionBtn}
                onClick={() => onRemoveOption(idx)}
                title="Remove option"
                aria-label={`Remove option ${idx + 1}`}
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
          onClick={onAddOption}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            add
          </span>
          <span>Add Option ({pollOptions.length}/4)</span>
        </button>
      )}
    </div>
  );
};
