/**
 * Universal Bulletin Service Layer (Repository Pattern & Domain Facade)
 *
 * Facade aggregating domain-specific services:
 * - postService (posts & bulletins, views, likes)
 * - storyService (24h stories, 48h GC sweeps)
 * - commentService (comments & reactions)
 * - profileService (user profiles, realtime profiles)
 * - mediaService (media upload, compression, storage bucket management)
 */

import { postService } from './domains/postService';
import { storyService } from './domains/storyService';
import { commentService } from './domains/commentService';
import { profileService } from './domains/profileService';
import { mediaService } from './domains/mediaService';

export const bulletinService = {
  // Post Operations
  getPosts: (...args: Parameters<typeof postService.getPosts>) => postService.getPosts(...args),
  createPost: (...args: Parameters<typeof postService.createPost>) => postService.createPost(...args),
  updatePost: (...args: Parameters<typeof postService.updatePost>) => postService.updatePost(...args),
  deletePost: (...args: Parameters<typeof postService.deletePost>) => postService.deletePost(...args),
  toggleLike: (...args: Parameters<typeof postService.toggleLike>) => postService.toggleLike(...args),
  recordPostView: (...args: Parameters<typeof postService.recordPostView>) => postService.recordPostView(...args),
  isPostViewedInSession: (...args: Parameters<typeof postService.isPostViewedInSession>) =>
    postService.isPostViewedInSession(...args),

  // Story Operations
  getStories: () => storyService.getStories(),
  createStory: (...args: Parameters<typeof storyService.createStory>) => storyService.createStory(...args),
  deleteStory: (...args: Parameters<typeof storyService.deleteStory>) => storyService.deleteStory(...args),
  cleanupExpiredStories: () => storyService.cleanupExpiredStories(),

  // Comment Operations
  getComments: (...args: Parameters<typeof commentService.getComments>) => commentService.getComments(...args),
  addComment: (...args: Parameters<typeof commentService.addComment>) => commentService.addComment(...args),

  // Profile Operations
  getProfile: (...args: Parameters<typeof profileService.getProfile>) => profileService.getProfile(...args),
  getProfiles: () => profileService.getProfiles(),
  saveProfile: (...args: Parameters<typeof profileService.saveProfile>) => profileService.saveProfile(...args),
  subscribeToProfiles: (...args: Parameters<typeof profileService.subscribeToProfiles>) =>
    profileService.subscribeToProfiles(...args),

  // Media Operations
  uploadPhoto: (...args: Parameters<typeof mediaService.uploadPhoto>) => mediaService.uploadPhoto(...args),
  deleteStorageFiles: (...args: Parameters<typeof mediaService.deleteStorageFiles>) =>
    mediaService.deleteStorageFiles(...args),
  extractStoragePath: (...args: Parameters<typeof mediaService.extractStoragePath>) =>
    mediaService.extractStoragePath(...args),
};

export {
  postService,
  storyService,
  commentService,
  profileService,
  mediaService,
};
