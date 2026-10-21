import { loadStoredRecord, saveStoredRecord } from '@/utils/storageHelpers';

const POLL_VOTES_STORAGE_PREFIX = 'sesb_poll_votes';

function getStorageKey(userId?: string): string {
  return userId ? `${POLL_VOTES_STORAGE_PREFIX}_${userId}` : POLL_VOTES_STORAGE_PREFIX;
}

/**
 * Loads all recorded poll votes for the current user.
 * Returns a map of postId -> optionId.
 */
export function getStoredPollVotes(userId?: string): Record<string, string> {
  return loadStoredRecord<string>(getStorageKey(userId));
}

/**
 * Gets the selected option ID for a specific bulletin poll.
 */
export function getStoredPollVote(postId: string, userId?: string): string | undefined {
  const votes = getStoredPollVotes(userId);
  return votes[postId];
}

/**
 * Records or removes a poll vote for a bulletin.
 */
export function saveStoredPollVote(
  postId: string,
  optionId: string | undefined,
  userId?: string
): void {
  const votes = getStoredPollVotes(userId);
  if (optionId) {
    votes[postId] = optionId;
  } else {
    delete votes[postId];
  }
  saveStoredRecord(getStorageKey(userId), votes);
}
