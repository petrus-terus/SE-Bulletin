import { z } from 'zod';
import type { Comment, Post, Story } from '@/types/bulletin';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const PollOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  votes: z.number().default(0),
});

export const PollDataSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(PollOptionSchema),
  totalVotes: z.number().default(0),
  expiresText: z.string().optional(),
  userVotedId: z.string().optional(),
});

export type PollData = z.infer<typeof PollDataSchema>;

export function parsePollData(raw: unknown, postId?: string): PollData | undefined {
  if (!raw) return undefined;
  const parsed = PollDataSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  if (postId) {
    console.warn('[RowMappers] Dropping malformed poll_data on post', postId, parsed.error);
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// String & Author Helpers
// ---------------------------------------------------------------------------

export function getAvatarInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'SE';
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function isAuthorSelf(
  authorId?: string | null,
  authorName?: string | null,
  currentUser?: { id?: string; name?: string } | null
): boolean {
  if (!currentUser) return false;
  if (authorId && currentUser.id && authorId === currentUser.id) return true;
  if (
    authorName &&
    currentUser.name &&
    authorName.trim().toLowerCase() === currentUser.name.trim().toLowerCase()
  ) {
    return true;
  }
  return false;
}

export function isVideoMediaUrl(url?: string | null): boolean {
  if (!url) return false;
  return Boolean(url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) || url.includes('video'));
}

export interface ParsedStoryCaption {
  cleanCaption: string;
  locationName?: string;
  videoThumbnail?: string;
}

export function parseStoryCaption(caption?: string | null): ParsedStoryCaption {
  let rawCaption = caption || '';
  let locationName: string | undefined;
  const locMatch = rawCaption.match(/^\[📍\s*([^\]]+)\]\s*(.*)$/s);
  if (locMatch) {
    locationName = locMatch[1].trim();
    rawCaption = locMatch[2].trim();
  }

  let videoThumbnail: string | undefined;
  const thumbMatch = rawCaption.match(/^\[🖼️\s*([^\]]+)\]\s*(.*)$/s);
  if (thumbMatch) {
    videoThumbnail = thumbMatch[1].trim();
    rawCaption = thumbMatch[2].trim();
  }

  return {
    cleanCaption: rawCaption,
    locationName,
    videoThumbnail,
  };
}

// ---------------------------------------------------------------------------
// Database Row Interfaces
// ---------------------------------------------------------------------------

export interface PostRow {
  id: string;
  title: string;
  content: string;
  author_id?: string | null;
  author_name: string;
  author_role?: string | null;
  author_avatar?: string | null;
  department?: string;
  department_id?: string | null;
  department_color?: string | null;
  created_at: string;
  location?: string;
  image_url?: string;
  media_urls?: string[];
  is_pinned?: boolean;
  comments_enabled?: boolean | null;
  likes_count?: number | null;
  comments_count?: number | null;
  views_count?: number | null;
  reshares_count?: number | null;
  official_notice?: boolean | null;
  poll?: unknown;
  poll_data?: unknown;
  pdf_url?: string | null;
  pdf_name?: string | null;
  pdf_size?: string | null;
  quote_post_id?: string | null;
  quoted_post?: Post | null;
  is_edited?: boolean | null;
  edited_at?: string | null;
  reactions_breakdown?: Record<string, number> | null;
}

export interface StoryRow {
  id: string;
  department_id: string;
  department_name: string;
  author_name: string;
  author_avatar?: string | null;
  image_url?: string;
  caption?: string | null;
  created_at: string;
}

export interface CommentRow {
  id: string;
  post_id: string;
  author_id?: string | null;
  author_name: string;
  author_role?: string | null;
  author_avatar?: string | null;
  department?: string;
  text: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Entity Mappers
// ---------------------------------------------------------------------------

export interface MapPostOptions {
  timestamp?: string;
  viewsCountFloor?: number;
  existingPostsMap?: Map<string, Post>;
}

export function mapRowToPost(row: PostRow, options: MapPostOptions = {}): Post {
  const isCeo =
    row.author_id === 'user-ceo' ||
    (row.author_name || '').toLowerCase().includes('yaakob');

  const avatarUrl = isCeo
    ? '/ceo_portrait.png'
    : row.author_avatar || '/sabah_electricity_logo.png';

  const defaultTimestamp = row.created_at
    ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  const authorIdFallback = row.author_name
    ? `author-${row.author_name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`
    : 'author-user';

  let resolvedQuotedPost = row.quoted_post || undefined;
  if (!resolvedQuotedPost && row.quote_post_id && options.existingPostsMap) {
    resolvedQuotedPost = options.existingPostsMap.get(row.quote_post_id);
  }

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    author: {
      id: row.author_id || authorIdFallback,
      name: row.author_name,
      designation: row.author_role || 'Sabah Electricity Staff',
      department: row.department || 'Operations',
      avatarUrl,
      isVerified: true,
    },
    timestamp: options.timestamp ?? defaultTimestamp,
    location: row.location,
    imageUrl: row.image_url,
    mediaUrls: Array.isArray(row.media_urls)
      ? row.media_urls
      : row.image_url
      ? [row.image_url]
      : [],
    isPinned: Boolean(row.is_pinned),
    commentsEnabled: Boolean(row.comments_enabled ?? true),
    likesCount: Number(row.likes_count || 0),
    commentsCount: Number(row.comments_count || 0),
    sharesCount: 0,
    viewsCount: Number(row.views_count ?? options.viewsCountFloor ?? 0),
    resharesCount: Number(row.reshares_count || 0),
    isLiked: false,
    isBookmarked: false,
    departmentId: row.department_id || 'dept-ops',
    departmentName: row.department || 'Operations',
    departmentColor: row.department_color || '#0055A4',
    officialNotice: Boolean(row.official_notice),
    poll: parsePollData(row.poll_data || row.poll, row.id),
    pdfUrl: row.pdf_url || undefined,
    pdfName: row.pdf_name || undefined,
    pdfSize: row.pdf_size || undefined,
    quotedPost: resolvedQuotedPost,
    isEdited: Boolean(row.is_edited),
    editedAt: row.edited_at || undefined,
    reactions: row.reactions_breakdown as import('@/types/bulletin').ReactionCounts | undefined,
  };
}

export function mergeUpdatedPostRow(post: Post, row: Partial<PostRow>): Post {
  return {
    ...post,
    title: row.title !== undefined ? row.title : post.title,
    content: row.content !== undefined ? row.content : post.content,
    location: row.location !== undefined ? row.location : post.location,
    imageUrl: row.image_url !== undefined ? row.image_url : post.imageUrl,
    mediaUrls: Array.isArray(row.media_urls)
      ? row.media_urls
      : row.image_url
      ? [row.image_url]
      : post.mediaUrls,
    isPinned: row.is_pinned !== undefined ? Boolean(row.is_pinned) : post.isPinned,
    commentsEnabled:
      row.comments_enabled !== undefined
        ? Boolean(row.comments_enabled)
        : post.commentsEnabled,
    likesCount: Number(row.likes_count ?? post.likesCount),
    commentsCount: Number(row.comments_count ?? post.commentsCount),
    viewsCount: Number(row.views_count ?? post.viewsCount),
    resharesCount: Number(row.reshares_count ?? post.resharesCount),
    departmentName: row.department || post.departmentName,
    departmentId: row.department_id || post.departmentId,
    departmentColor: row.department_color || post.departmentColor,
    officialNotice:
      row.official_notice !== undefined ? Boolean(row.official_notice) : post.officialNotice,
    poll:
      row.poll_data !== undefined || row.poll !== undefined
        ? parsePollData(row.poll_data || row.poll, post.id) || post.poll
        : post.poll,
    reactions:
      row.reactions_breakdown !== undefined
        ? ((row.reactions_breakdown as unknown) as import('@/types/bulletin').ReactionCounts | undefined)
        : post.reactions,
    pdfUrl: row.pdf_url !== undefined ? row.pdf_url || undefined : post.pdfUrl,
    pdfName: row.pdf_name !== undefined ? row.pdf_name || undefined : post.pdfName,
    pdfSize: row.pdf_size !== undefined ? row.pdf_size || undefined : post.pdfSize,
    isEdited: row.is_edited !== undefined ? Boolean(row.is_edited) : post.isEdited,
    editedAt: row.edited_at || post.editedAt,
  };
}

export interface MapStoryOptions {
  viewsCount?: number;
  hasUnread?: boolean;
}

export function mapRowToStory(row: StoryRow, options: MapStoryOptions = {}): Story {
  let hoursRemaining = 24;
  if (row.created_at) {
    const elapsed = (Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60);
    hoursRemaining = Math.max(1, Math.round(24 - elapsed));
  }

  const { cleanCaption, locationName, videoThumbnail } = parseStoryCaption(row.caption);
  const isVideo = isVideoMediaUrl(row.image_url);

  return {
    id: row.id,
    departmentId: row.department_id,
    departmentName: row.department_name,
    authorName: row.author_name,
    authorAvatar: row.author_avatar || '/sabah_electricity_logo.png',
    hasUnread: options.hasUnread ?? true,
    imageUrl: (isVideo ? videoThumbnail || '/grid_horizon_hero.jpg' : row.image_url) || '/grid_horizon_hero.jpg',
    videoUrl: isVideo ? row.image_url : undefined,
    mediaType: isVideo ? 'video' : 'image',
    caption: cleanCaption,
    locationName,
    hoursRemaining,
    createdAt: row.created_at,
    viewsCount: options.viewsCount ?? 1,
  };
}

export interface MapCommentOptions {
  timestamp?: string;
}

export function mapRowToComment(row: CommentRow, options: MapCommentOptions = {}): Comment {
  const timestamp =
    options.timestamp ??
    (row.created_at
      ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Just now');

  return {
    id: row.id,
    authorName: row.author_name,
    department: row.department || 'Operations',
    avatarInitials: getAvatarInitials(row.author_name),
    avatarUrl: row.author_avatar || undefined,
    text: row.text,
    timestamp,
  };
}
