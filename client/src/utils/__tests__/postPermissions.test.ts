import { describe, it, expect } from 'vitest';
import { isSuperAdminUser, getPostPermissions } from '../postPermissions';
import type { Post } from '@/types/bulletin';
import { SE_SUPERADMIN_UUID } from '@/constants/bulletin';

describe('postPermissions', () => {
  const dummyPost: Post = {
    id: 'p-101',
    author: {
      id: 'author-uuid-1',
      name: 'Ir. Ahmad Zaki',
      designation: 'Senior Electrical Engineer',
      avatarUrl: '',
      department: 'Distribution',
      isVerified: true,
    },
    title: 'Distribution line update',
    content: 'All systems green.',
    likesCount: 5,
    commentsCount: 2,
    sharesCount: 1,
    resharesCount: 0,
    viewsCount: 10,
    isLiked: false,
    isBookmarked: false,
    isPinned: false,
    commentsEnabled: true,
    timestamp: '10:00 AM',
  };

  describe('isSuperAdminUser', () => {
    it('returns true for known superadmin UUID', () => {
      expect(isSuperAdminUser({ currentUserId: SE_SUPERADMIN_UUID })).toBe(true);
    });

    it('returns true for admin usernames or roles', () => {
      expect(isSuperAdminUser({ currentUserName: 'ADMIN_USER' })).toBe(true);
      expect(isSuperAdminUser({ currentUserRole: 'SuperAdmin' })).toBe(true);
    });

    it('returns false for ordinary users', () => {
      expect(
        isSuperAdminUser({
          currentUserId: 'emp-402',
          currentUserName: 'Jane Doe',
          currentUserRole: 'Engineer',
        })
      ).toBe(false);
    });
  });

  describe('getPostPermissions', () => {
    it('grants edit and delete to the author', () => {
      const perms = getPostPermissions(dummyPost, {
        currentUserId: 'author-uuid-1',
        currentUserName: 'Ir. Ahmad Zaki',
      });
      expect(perms.isOwnPost).toBe(true);
      expect(perms.canEdit).toBe(true);
      expect(perms.canDelete).toBe(true);
    });

    it('grants edit and delete to superadmin even if not author', () => {
      const perms = getPostPermissions(dummyPost, {
        currentUserId: SE_SUPERADMIN_UUID,
        currentUserName: 'Super Admin',
      });
      expect(perms.isOwnPost).toBe(false);
      expect(perms.isSuperAdmin).toBe(true);
      expect(perms.canEdit).toBe(true);
      expect(perms.canDelete).toBe(true);
    });

    it('denies edit and delete to other standard users', () => {
      const perms = getPostPermissions(dummyPost, {
        currentUserId: 'other-user-999',
        currentUserName: 'Other Staff',
      });
      expect(perms.isOwnPost).toBe(false);
      expect(perms.isSuperAdmin).toBe(false);
      expect(perms.canEdit).toBe(false);
      expect(perms.canDelete).toBe(false);
    });
  });
});
