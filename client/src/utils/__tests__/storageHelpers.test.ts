import { describe, it, expect, beforeEach } from 'vitest';
import {
  scopedKey,
  loadStoredSet,
  saveStoredSet,
  loadStoredRecord,
  saveStoredRecord,
  loadStoredJson,
  saveStoredJson,
} from '../storageHelpers';

describe('storageHelpers', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Set storage', () => {
    it('returns empty Set when key does not exist', () => {
      const result = loadStoredSet('test_key');
      expect(result).toBeInstanceOf(Set);
      expect(result.size).toBe(0);
    });

    it('persists and retrieves Set items correctly in localStorage', () => {
      const initial = new Set(['item-1', 'item-2', 'item-3']);
      saveStoredSet('test_key', initial);

      const retrieved = loadStoredSet('test_key');
      expect(retrieved.size).toBe(3);
      expect(retrieved.has('item-1')).toBe(true);
      expect(retrieved.has('item-2')).toBe(true);
      expect(retrieved.has('item-3')).toBe(true);
      expect(retrieved.has('item-4')).toBe(false);
    });

    it('handles sessionStorage correctly when specified', () => {
      const initial = new Set(['sess-1']);
      saveStoredSet('session_key', initial, sessionStorage);

      expect(localStorage.getItem('session_key')).toBeNull();
      const retrieved = loadStoredSet('session_key', sessionStorage);
      expect(retrieved.has('sess-1')).toBe(true);
    });

    it('safely handles corrupted JSON without throwing', () => {
      localStorage.setItem('bad_key', 'invalid-json{{{');
      const retrieved = loadStoredSet('bad_key');
      expect(retrieved).toBeInstanceOf(Set);
      expect(retrieved.size).toBe(0);
    });
  });

  describe('Record storage', () => {
    it('persists and retrieves key-value records', () => {
      const records = { 'post-1': 'opt-a', 'post-2': 'opt-b' };
      saveStoredRecord('poll_records', records);

      const retrieved = loadStoredRecord<string>('poll_records');
      expect(retrieved['post-1']).toBe('opt-a');
      expect(retrieved['post-2']).toBe('opt-b');
      expect(retrieved['post-3']).toBeUndefined();
    });

    it('returns empty object when key not found', () => {
      const retrieved = loadStoredRecord<string>('missing_record_key');
      expect(retrieved).toEqual({});
    });
  });

  describe('scopedKey and JSON storage', () => {
    it('scopes keys by userId when provided and falls back to baseKey when omitted', () => {
      expect(scopedKey('sesb_likes')).toBe('sesb_likes');
      expect(scopedKey('sesb_likes', 'user-101')).toBe('sesb_likes_user-101');
    });

    it('persists and retrieves typed JSON values with fallback on error', () => {
      saveStoredJson('json_key', { count: 5, active: true });
      expect(loadStoredJson('json_key', { count: 0, active: false })).toEqual({
        count: 5,
        active: true,
      });
      expect(loadStoredJson('non_existent', 'default')).toBe('default');
    });
  });
});
