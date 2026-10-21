import { describe, it, expect, beforeEach } from 'vitest';
import {
  parsePollData,
  parseStoryCaption,
  mapRowToPost,
  type PostRow,
} from '../rowMappers';

describe('rowMappers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('parsePollData', () => {
    it('returns undefined if raw is falsy or invalid', () => {
      expect(parsePollData(null)).toBeUndefined();
      expect(parsePollData(undefined)).toBeUndefined();
      expect(parsePollData({ question: 123 })).toBeUndefined();
    });

    it('parses valid poll object correctly', () => {
      const raw = {
        id: 'poll-1',
        question: 'Which shift schedule do you prefer?',
        options: [
          { id: 'opt-1', text: 'Option A (7am - 3pm)', votes: 12 },
          { id: 'opt-2', text: 'Option B (8am - 4pm)', votes: 18 },
        ],
        totalVotes: 30,
        expiresText: '2 days left',
      };

      const result = parsePollData(raw);
      expect(result).toBeDefined();
      expect(result?.id).toBe('poll-1');
      expect(result?.question).toBe('Which shift schedule do you prefer?');
      expect(result?.options.length).toBe(2);
      expect(result?.totalVotes).toBe(30);
    });

    it('resolves user voted ID from localStorage when available', () => {
      localStorage.setItem('sesb_poll_votes', JSON.stringify({ 'post-99': 'opt-1' }));

      const raw = {
        id: 'poll-1',
        question: 'Safety drill date?',
        options: [{ id: 'opt-1', text: 'Friday', votes: 4 }],
        totalVotes: 4,
      };

      const result = parsePollData(raw, 'post-99');
      expect(result?.userVotedOptionId).toBe('opt-1');
    });
  });

  describe('parseStoryCaption', () => {
    it('parses location and video thumbnail markers from caption string', () => {
      const raw = '[📍Tenom Pangi Hydro] [🖼️https://example.com/thumb.jpg] Field inspection underway';
      const parsed = parseStoryCaption(raw);

      expect(parsed.locationName).toBe('Tenom Pangi Hydro');
      expect(parsed.videoThumbnail).toBe('https://example.com/thumb.jpg');
      expect(parsed.cleanCaption).toBe('Field inspection underway');
    });

    it('returns raw text unchanged when no special tags exist', () => {
      const raw = 'Simple casual story caption';
      const parsed = parseStoryCaption(raw);

      expect(parsed.cleanCaption).toBe('Simple casual story caption');
      expect(parsed.locationName).toBeUndefined();
      expect(parsed.videoThumbnail).toBeUndefined();
    });
  });

  describe('mapRowToPost', () => {
    it('maps database PostRow into rich Post domain entity', () => {
      const row: PostRow = {
        id: 'row-post-1',
        title: 'Emergency Grid Maintenance Completed',
        content: 'Work was completed on feeder 4 ahead of schedule.',
        author_id: 'user-eng-1',
        author_name: 'Ir. Ahmad Zaki',
        author_role: 'Senior Electrical Engineer',
        author_avatar: 'https://example.com/avatar.jpg',
        department: 'Operations',
        department_id: 'dept-operations',
        created_at: new Date('2026-10-20T10:00:00Z').toISOString(),
        location: 'Wisma SESB HQ',
        is_pinned: true,
        likes_count: 14,
        comments_count: 3,
        views_count: 88,
      };

      const post = mapRowToPost(row);

      expect(post.id).toBe('row-post-1');
      expect(post.title).toBe('Emergency Grid Maintenance Completed');
      expect(post.author.name).toBe('Ir. Ahmad Zaki');
      expect(post.author.designation).toBe('Senior Electrical Engineer');
      expect(post.isPinned).toBe(true);
      expect(post.likesCount).toBe(14);
      expect(post.commentsCount).toBe(3);
      expect(post.viewsCount).toBe(88);
      expect(post.departmentId).toBe('dept-operations');
    });

    it('resolves quoted post from options.existingPostsMap when quote_post_id exists', () => {
      const parentPost = mapRowToPost({
        id: 'parent-1',
        title: 'Original circular',
        content: 'Original notice content',
        author_name: 'SESB Comms',
        created_at: new Date().toISOString(),
      });

      const existingMap = new Map([['parent-1', parentPost]]);

      const quotingRow: PostRow = {
        id: 'quote-child-1',
        title: 'Reaction to notice',
        content: 'Noted and will coordinate.',
        author_name: 'Engineer B',
        created_at: new Date().toISOString(),
        quote_post_id: 'parent-1',
      };

      const mapped = mapRowToPost(quotingRow, { existingPostsMap: existingMap });
      expect(mapped.quotedPost).toBeDefined();
      expect(mapped.quotedPost?.id).toBe('parent-1');
      expect(mapped.quotedPost?.title).toBe('Original circular');
    });
  });
});
