const BOOKMARKED_STORAGE_KEY = 'sesb_bookmarked_ids';

export function getBookmarkedPostIds(): Set<string> {
  try {
    const raw = localStorage.getItem(BOOKMARKED_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function saveBookmarkedPostId(postId: string, isSaved: boolean): void {
  try {
    const ids = getBookmarkedPostIds();
    if (isSaved) {
      ids.add(postId);
    } else {
      ids.delete(postId);
    }
    localStorage.setItem(BOOKMARKED_STORAGE_KEY, JSON.stringify([...ids]));
  } catch (e) {
    console.warn('[bookmarkStorage] Failed to save bookmark ID:', e);
  }
}
