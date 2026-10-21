import { loadStoredSet, saveStoredSet } from '@/utils/storageHelpers';

const BOOKMARKED_STORAGE_PREFIX = 'sesb_bookmarked_ids';

function getStorageKey(userId?: string): string {
  return userId ? `${BOOKMARKED_STORAGE_PREFIX}_${userId}` : BOOKMARKED_STORAGE_PREFIX;
}

export function getBookmarkedPostIds(userId?: string): Set<string> {
  return loadStoredSet(getStorageKey(userId));
}

export function saveBookmarkedPostId(postId: string, isSaved: boolean, userId?: string): void {
  const ids = getBookmarkedPostIds(userId);
  if (isSaved) {
    ids.add(postId);
  } else {
    ids.delete(postId);
  }
  saveStoredSet(getStorageKey(userId), ids);
}


