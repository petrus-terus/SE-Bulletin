import { loadStoredSet, saveStoredSet } from '@/utils/storageHelpers';

const LIKED_POSTS_STORAGE_PREFIX = 'sesb_liked_posts';

function getStorageKey(userId?: string): string {
  return userId ? `${LIKED_POSTS_STORAGE_PREFIX}_${userId}` : LIKED_POSTS_STORAGE_PREFIX;
}

/**
 * Loads all liked bulletin IDs for the current user.
 */
export function getLikedPostIds(userId?: string): Set<string> {
  return loadStoredSet(getStorageKey(userId));
}

/**
 * Checks if a specific bulletin is liked by the current user.
 */
export function isPostLiked(postId: string, userId?: string): boolean {
  return getLikedPostIds(userId).has(postId);
}

/**
 * Records or removes a like for a bulletin.
 */
export function setPostLiked(postId: string, isLiked: boolean, userId?: string): void {
  const likedSet = getLikedPostIds(userId);
  if (isLiked) {
    likedSet.add(postId);
  } else {
    likedSet.delete(postId);
  }
  saveStoredSet(getStorageKey(userId), likedSet);
}
