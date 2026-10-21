/**
 * Robust JSON serialization helpers for Set and Record collections stored in localStorage & sessionStorage.
 */

export function scopedKey(baseKey: string, userId?: string): string {
  return userId ? `${baseKey}_${userId}` : baseKey;
}

export function loadStoredSet(key: string, storage: Storage = localStorage): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = storage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function saveStoredSet(key: string, set: Set<string>, storage: Storage = localStorage): void {
  if (typeof window === 'undefined') return;
  try {
    storage.setItem(key, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn(`[storageHelpers] Failed to save set for key "${key}":`, e);
  }
}

export function loadStoredRecord<T>(key: string, storage: Storage = localStorage): Record<string, T> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = storage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveStoredRecord<T>(key: string, record: Record<string, T>, storage: Storage = localStorage): void {
  if (typeof window === 'undefined') return;
  try {
    storage.setItem(key, JSON.stringify(record));
  } catch (e) {
    console.warn(`[storageHelpers] Failed to save record for key "${key}":`, e);
  }
}

export function loadStoredJson<T>(key: string, fallback: T, storage: Storage = localStorage): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveStoredJson<T>(key: string, value: T, storage: Storage = localStorage): void {
  if (typeof window === 'undefined') return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[storageHelpers] Failed to save JSON for key "${key}":`, e);
  }
}
