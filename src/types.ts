export interface Category {
  id: string | number;
  name: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface MediaItem {
  mediaType: 'image' | 'video';
  mediaUrl: string;
  sortOrder: number;
}

export interface Post {
  id: string;
  content: string;
  media: MediaItem[];
  createdAt: string;
  likeCount: number;
  comments: Comment[];
  category?: Category | null;
}

export interface SocialLink {
  platform: string;
  iconName: string;
  url: string | null;
  qrCodeUrl: string | null;
}

export interface ProfileData {
  name: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  socials?: SocialLink[];
  stats: {
    posts: number;
    followers: number;
    following: number;
  };
}

// 后端统一响应包装：code 为 0 表示成功，业务数据在 data
export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export interface PostPageData {
  items: RawPost[];
  page: number;
  size: number;
  total: number;
  hasMore: boolean;
}

// 后端动态原始结构（映射为展示用 Post 前的中间类型）
export interface RawPost {
  id: number;
  content: string | null;
  likeCount: number;
  createdAt: string;
  media: Array<{ mediaType: 'image' | 'video'; mediaUrl: string; sortOrder: number }>;
  comments: Array<{ id: number; author: string; content: string; createdAt: string }>;
  category?: { id: number | string; name: string } | null;
}
