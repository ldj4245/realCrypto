export type CategoryType = 'FREE' | 'PROFIT_LOSS' | 'ARBITRAGE_INFO' | 'ANALYSIS';

export type PositionType = 'LONG' | 'SHORT' | 'NEUTRAL';

export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  email?: string;
  role: string;
  createdAt: string;
}

export interface PostListItem {
  id: number;
  category: CategoryType;
  position: PositionType;
  targetSymbol?: string;
  title: string;
  profitRate?: number;
  authorNickname: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isBest: boolean;
  createdAt: string;
}

export interface CommentItem {
  id: number;
  postId: number;
  authorUsername: string;
  authorNickname: string;
  content: string;
  createdAt: string;
}

export interface PostDetail {
  id: number;
  category: CategoryType;
  position: PositionType;
  targetSymbol?: string;
  title: string;
  content: string;
  profitRate?: number;
  authorUsername: string;
  authorNickname: string;
  viewCount: number;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  isBest: boolean;
  myVote?: boolean | null; // true: 추천, false: 비추천, null: 없음
  createdAt: string;
  comments: CommentItem[];
}
