export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  fullName?: string;
  designation: string;
  department: string;
  email: string;
  avatarUrl: string;
  officeLocation?: string;
  phoneExtension?: string;
  role: 'GeneralStaff' | 'DepartmentAdmin' | 'SuperAdmin';
  adminDepartments?: string[];
  isVerified?: boolean;
  isOnline?: boolean;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  color: string;
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
}

export type TimeAmbiance = 'day' | 'dusk' | 'night';

export type PostArchetype = 'status' | 'photo' | 'announcement';
