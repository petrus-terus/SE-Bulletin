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
  hasUnread: boolean;
  imageUrl: string;
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
  isLiked: boolean;
  isBookmarked: boolean;
  departmentId?: string;
  departmentName?: string;
  departmentColor?: string;
  previewComment?: Comment | null;
  officialNotice?: boolean;
}

export interface CreatePostPayload {
  title: string;
  content: string;
  authorName?: string;
  department?: string;
  departmentId?: string;
  avatarUrl?: string;
  isPinned?: boolean;
  mediaUrls?: string[];
  imageUrl?: string;
  officialNotice?: boolean;
}

export type TimeAmbiance = 'day' | 'dusk' | 'night';

export type PostArchetype = 'status' | 'photo' | 'announcement';
