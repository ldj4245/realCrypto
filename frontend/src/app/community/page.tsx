'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { PostListItem, CategoryType, PositionType } from '@/types/community';
import {
  MessageSquare,
  PenSquare,
  Search,
  Flame,
  ThumbsUp,
  Eye,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function CommunityPage() {
  const router = useRouter();
  const { isLoggedIn, openAuthModal } = useAuth();

  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryType | 'ALL' | 'BEST'>('ALL');
  const [activePosition, setActivePosition] = useState<PositionType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('size', '15');

      if (activeCategory === 'BEST') {
        params.set('onlyBest', 'true');
      } else if (activeCategory !== 'ALL') {
        params.set('category', activeCategory);
      }

      if (activePosition !== 'ALL') {
        params.set('position', activePosition);
      }

      if (searchQuery.trim()) {
        params.set('query', searchQuery.trim());
      }

      const res = await fetch(`${API_BASE_URL}/api/posts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.content || []);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements || 0);
      }
    } catch (err) {
      console.error('게시글 목록 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, activePosition, searchQuery, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleWriteClick = () => {
    if (!isLoggedIn) {
      openAuthModal('login');
    } else {
      router.push('/community/write');
    }
  };

  const getCategoryLabel = (cat: CategoryType) => {
    switch (cat) {
      case 'FREE': return '자유';
      case 'PROFIT_LOSS': return '익절/손절';
      case 'ARBITRAGE_INFO': return '김프꿀팁';
      case 'ANALYSIS': return '코인분석';
    }
  };

  const getCategoryColor = (cat: CategoryType) => {
    switch (cat) {
      case 'FREE': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'PROFIT_LOSS': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ARBITRAGE_INFO': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ANALYSIS': return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  const formatTime = (iso: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return '방금 전';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans antialiased">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header Hero Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
                  REALCRYPTO LOUNGE
                </span>
                <span className="text-xs text-slate-400 font-medium">실시간 코인 투자자 라운지</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                코인 커뮤니티 & 실시간 시황 토론
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                익절/손절 인증, 실시간 롱/숏 포지션 뷰, 거래소 차익거래 꿀팁을 공유하세요.
              </p>
            </div>

            <button
              onClick={handleWriteClick}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition shadow-md shadow-blue-500/20 shrink-0"
            >
              <PenSquare className="h-4 w-4" />
              <span>글쓰기</span>
            </button>
          </div>

          {/* Daily Sentiment Battle Poll Bar */}
          <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-xs font-black text-slate-800">
                오늘의 개미 심리 배틀: <span className="text-rose-600">롱 68%</span> vs <span className="text-blue-600">숏 32%</span>
              </span>
            </div>

            <div className="w-full sm:w-80 flex items-center gap-2">
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/60">
                <div className="h-full bg-rose-500" style={{ width: '68%' }} title="롱 68%" />
                <div className="h-full bg-blue-500" style={{ width: '32%' }} title="숏 32%" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 shrink-0">불장 우세 🔥</span>
            </div>
          </div>
        </div>

        {/* Category Tabs & Filter Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
          
          {/* Main Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto">
            <button
              onClick={() => { setActiveCategory('ALL'); setPage(0); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                activeCategory === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              전체글
            </button>
            <button
              onClick={() => { setActiveCategory('BEST'); setPage(0); }}
              className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                activeCategory === 'BEST'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>🔥 베스트</span>
            </button>
            <button
              onClick={() => { setActiveCategory('FREE'); setPage(0); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                activeCategory === 'FREE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              자유게시판
            </button>
            <button
              onClick={() => { setActiveCategory('PROFIT_LOSS'); setPage(0); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                activeCategory === 'PROFIT_LOSS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              익절/손절 인증
            </button>
            <button
              onClick={() => { setActiveCategory('ARBITRAGE_INFO'); setPage(0); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                activeCategory === 'ARBITRAGE_INFO'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              김프/차익 꿀팁
            </button>
            <button
              onClick={() => { setActiveCategory('ANALYSIS'); setPage(0); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                activeCategory === 'ANALYSIS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              코인 분석
            </button>
          </div>

          {/* Position Filter & Search */}
          <div className="flex items-center gap-2.5">
            {/* Position Pill Switch */}
            <div className="flex items-center p-1 bg-white rounded-2xl border border-slate-200/80 shadow-2xs text-[11px] font-bold">
              <button
                onClick={() => { setActivePosition('ALL'); setPage(0); }}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  activePosition === 'ALL' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => { setActivePosition('LONG'); setPage(0); }}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  activePosition === 'LONG' ? 'bg-rose-50 text-rose-600 font-extrabold' : 'text-slate-400'
                }`}
              >
                🟢 롱
              </button>
              <button
                onClick={() => { setActivePosition('SHORT'); setPage(0); }}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  activePosition === 'SHORT' ? 'bg-blue-50 text-blue-600 font-extrabold' : 'text-slate-400'
                }`}
              >
                🔴 숏
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="제목/내용/작성자 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setPage(0); fetchPosts(); } }}
                className="w-full bg-white border border-slate-200/80 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              />
            </div>
          </div>

        </div>

        {/* Post List Card Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-16 text-center text-xs text-slate-400 font-medium">
              게시글을 불러오는 중입니다...
            </div>
          ) : posts.length === 0 ? (
            <div className="p-16 text-center">
              <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">작성된 게시글이 없습니다.</p>
              <p className="text-xs text-slate-400 mt-1">첫 번째 글을 작성하고 사람들과 소통해보세요!</p>
              <button
                onClick={handleWriteClick}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
              >
                글쓰기
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {posts.map((post) => {
                return (
                  <Link
                    key={post.id}
                    href={`/community/${post.id}`}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition duration-150 group"
                  >
                    <div className="flex-1 min-w-0">
                      
                      {/* Meta Tags: Category, Position, Symbol, Profit */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5 text-[11px]">
                        
                        {post.isBest && (
                          <span className="px-2 py-0.5 rounded-md font-black bg-rose-500 text-white flex items-center gap-0.5">
                            <Flame className="h-3 w-3" /> BEST
                          </span>
                        )}

                        <span className={`px-2 py-0.5 rounded-md font-bold border ${getCategoryColor(post.category)}`}>
                          {getCategoryLabel(post.category)}
                        </span>

                        {post.position === 'LONG' && (
                          <span className="px-2 py-0.5 rounded-md font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            롱 🟢
                          </span>
                        )}
                        {post.position === 'SHORT' && (
                          <span className="px-2 py-0.5 rounded-md font-bold bg-blue-50 text-blue-600 border border-blue-200">
                            숏 🔴
                          </span>
                        )}

                        {post.targetSymbol && (
                          <span className="px-2 py-0.5 rounded-md font-black bg-slate-100 text-slate-800 border border-slate-200">
                            #{post.targetSymbol}
                          </span>
                        )}

                        {post.profitRate !== null && post.profitRate !== undefined && (
                          <span
                            className={`px-2 py-0.5 rounded-md font-black border tabular-nums ${
                              post.profitRate >= 0
                                ? 'bg-rose-50 text-rose-600 border-rose-200'
                                : 'bg-blue-50 text-blue-600 border-blue-200'
                            }`}
                          >
                            {post.profitRate >= 0 ? `+${post.profitRate}% 익절 💰` : `${post.profitRate}% 손절 💧`}
                          </span>
                        )}

                      </div>

                      {/* Title & Comment Count */}
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition truncate">
                          {post.title}
                        </h3>
                        {post.commentCount > 0 && (
                          <span className="text-xs font-black text-blue-600 tabular-nums shrink-0">
                            [{post.commentCount}]
                          </span>
                        )}
                      </div>

                      {/* Author & Time */}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-medium">
                        <span className="text-slate-700 font-bold">{post.authorNickname}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(post.createdAt)}</span>
                        </div>
                      </div>

                    </div>

                    {/* Stats: Views & Likes */}
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 shrink-0 self-end sm:self-center">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        <span className="tabular-nums">{post.viewCount}</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          post.likeCount >= 5 ? 'text-rose-600 font-black' : ''
                        }`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span className="tabular-nums">{post.likeCount}</span>
                      </div>
                    </div>

                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-slate-700 px-3 tabular-nums">
                {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
