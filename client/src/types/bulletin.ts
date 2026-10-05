export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  fullName?: string;
  designation: string;
  department: string;
  email: string;
  avatarUrl: string;
  coverUrl?: string;
  officeLocation?: string;
  phoneExtension?: string;
  role: 'GeneralStaff' | 'DepartmentAdmin' | 'SuperAdmin';
  adminDepartments?: string[];
  isVerified?: boolean;
  isOnline?: boolean;
  bio?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  color: string;
  colorBg?: string;
  colorText?: string;
  icon: string;
  followerCount: number;
}

export interface Story {
  id: string;
  departmentId: string;
  departmentName: string;
  authorName: string;
  authorAvatar?: string;
  hasUnread: boolean;
  imageUrl: string;
  backgroundColor?: string;
  caption: string;
  hoursRemaining: number;
}

export interface Comment {
  id: string;
  authorName: string;
  department: string;
  avatarInitials: string;
  avatarUrl?: string;
  text: string;
  timestamp: string;
  likesCount?: number;
}

export type EmojiReactionType = 'laugh' | 'fire' | 'clap' | 'cry';

export interface ReactionCounts {
  laugh: number;
  fire: number;
  clap: number;
  cry: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  expiresText?: string;
  userVotedOptionId?: string;
}

export interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    designation: string;
    department: string;
    avatarUrl: string;
    isVerified: boolean;
  };
  timestamp: string;
  title: string;
  content: string;
  location?: string | null;
  imageUrl?: string | null;
  mediaUrls?: string[];
  isPinned: boolean;
  commentsEnabled: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount?: number;
  resharesCount?: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isReshared?: boolean;
  resharedBy?: {
    id: string;
    name: string;
    designation?: string;
    avatarUrl?: string;
  };
  quotedPost?: Post;
  poll?: PollData;
  reactions?: ReactionCounts;
  userReaction?: EmojiReactionType;
  pdfUrl?: string;
  pdfName?: string;
  pdfSize?: string;
  departmentId?: string;
  departmentName?: string;
  departmentColor?: string;
  previewComment?: Comment | null;
  officialNotice?: boolean;
  isEdited?: boolean;
  editedAt?: string;
}

export interface CreatePostPayload {
  title: string;
  content: string;
  authorName?: string;
  department?: string;
  departmentId?: string;
  departmentColor?: string;
  avatarUrl?: string;
  location?: string;
  isPinned?: boolean;
  commentsEnabled?: boolean;
  mediaUrls?: string[];
  imageUrl?: string;
  officialNotice?: boolean;
  quotedPost?: Post;
  poll?: PollData;
  pdfUrl?: string;
  pdfName?: string;
  pdfSize?: string;
}

export type TimeAmbiance = 'day' | 'dusk' | 'night';

export type PostArchetype = 'status' | 'photo' | 'announcement';

export type NotificationCategory = 'all' | 'urgent' | 'reaction' | 'comment' | 'mention' | 'general';

export interface AppNotification {
  id: string;
  category: 'urgent' | 'reaction' | 'comment' | 'mention' | 'general';
  title: string;
  message: string;
  timestamp: string;
  createdAt: number;
  isRead: boolean;
  avatarUrl?: string;
  avatarInitials?: string;
  icon?: string;
  iconColor?: string;
  targetPostId?: string;
  targetCommentId?: string;
  actionUrl?: string;
}

