import { loadStoredSet, saveStoredSet } from '@/utils/storageHelpers';

const BOOKMARKED_STORAGE_KEY = 'sesb_bookmarked_ids';

export function getBookmarkedPostIds(): Set<string> {
  return loadStoredSet(BOOKMARKED_STORAGE_KEY);
}

export function saveBookmarkedPostId(postId: string, isSaved: boolean): void {
  const ids = getBookmarkedPostIds();
  if (isSaved) {
    ids.add(postId);
  } else {
    ids.delete(postId);
  }
  saveStoredSet(BOOKMARKED_STORAGE_KEY, ids);
}

