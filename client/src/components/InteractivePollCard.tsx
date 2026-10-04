import React from 'react';
import type { PollData } from '../types/bulletin';
import styles from './InteractivePollCard.module.css';

interface Props {
  poll: PollData;
  onVote: (optionId: string) => void;
}

export const InteractivePollCard: React.FC<Props> = ({ poll, onVote }) => {
  const hasVoted = Boolean(poll.userVotedOptionId);
  const totalVotes = Math.max(poll.totalVotes, 1);

  // Find highest voted option to highlight winner/leader
  const maxVotes = Math.max(...poll.options.map((o) => o.votes), 0);

  return (
    <div className={styles.pollContainer} aria-label="Interactive Poll">
      <div className={styles.pollQuestion}>
        {poll.question}
        <span className={styles.pollBadge}>Poll</span>
      </div>

      <div className={styles.optionsList} role={hasVoted ? 'group' : 'radiogroup'}>
        {poll.options.map((option) => {
          const isSelected = poll.userVotedOptionId === option.id;
          const percentage = Math.round((option.votes / totalVotes) * 100);
          const isLeader = maxVotes > 0 && option.votes === maxVotes;

          if (!hasVoted) {
            return (
              <button
                key={option.id}
                type="button"
                className={styles.unvotedOptionBtn}
                onClick={() => onVote(option.id)}
                role="radio"
                aria-checked={false}
              >
                <span className={styles.optionText}>{option.text}</span>
                <span className={styles.radioCircle} aria-hidden="true" />
              </button>
            );
          }

          return (
            <button
              key={option.id}
              type="button"
              className={`${styles.votedOptionBar} ${isSelected ? styles.votedOptionBarSelected : ''}`}
              onClick={() => onVote(option.id)}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${option.text}: ${percentage}%. ${isSelected ? 'Tap to remove your vote' : 'Tap to switch vote'}.`}
              title={isSelected ? 'Tap to remove your vote' : 'Tap to switch vote to this option'}
            >
              <div
                className={`${styles.progressFill} ${
                  isSelected
                    ? styles.progressFillUserChoice
                    : isLeader
                    ? styles.progressFillWinner
                    : ''
                }`}
                style={{ transform: `scaleX(${percentage / 100})` }}
              />

              <div className={styles.votedOptionContent}>
                <div className={styles.optionLabelGroup}>
                  <span className={`${styles.percentageNum} font-mono tabular-nums`}>
                    {percentage}%
                  </span>
                  <span className={styles.optionText}>{option.text}</span>
                </div>

                {isSelected && (
                  <span
                    className={`material-symbols-outlined ${styles.checkedIcon}`}
                    title="Your vote (tap to deselect)"
                    aria-label="Your choice"
                  >
                    check_circle
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className={styles.pollMetaRow}>
        <span className="font-mono tabular-nums">
          {poll.totalVotes.toLocaleString()} {poll.totalVotes === 1 ? 'vote' : 'votes'}
        </span>
        {hasVoted && (
          <>
            <span className={styles.metaDot}>•</span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              Tap your vote to deselect
            </span>
          </>
        )}
      </div>
    </div>
  );
};
